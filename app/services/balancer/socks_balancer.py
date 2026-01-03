"""
SOCKS5 Balancer
TCP/UDP балансировщик для SOCKS5 прокси
"""
import asyncio
import struct
import logging
from typing import Optional
from .proxy_manager import ProxyManager

logger = logging.getLogger(__name__)


class SocksBalancer:
    """SOCKS5 балансировщик трафика"""
    
    def __init__(self, manager: ProxyManager, tcp_port: int = 7777, udp_port: int = 7778):
        self.manager = manager
        self.tcp_port = tcp_port
        self.udp_port = udp_port
        self.tcp_server = None
        self.udp_transport = None
        self.running = False
        self.servers = []
    
    async def start(self):
        """Start TCP and UDP SOCKS5 servers"""
        self.running = True
        
        try:
            # Start TCP server
            self.tcp_server = await asyncio.start_server(
                self._handle_tcp_client,
                '0.0.0.0',
                self.tcp_port
            )
            logger.info(f"✔ SOCKS5 балансировщик (TCP) запущен на 0.0.0.0:{self.tcp_port}")
            
            # Start UDP server
            loop = asyncio.get_event_loop()
            self.udp_transport, _ = await loop.create_datagram_endpoint(
                lambda: SOCKSUDPProtocol(self),
                local_addr=('0.0.0.0', self.udp_port)
            )
            logger.info(f"✔ SOCKS5 балансировщик (UDP) запущен на 0.0.0.0:{self.udp_port}")
            
            # Запускаем автоматическую проверку прокси как фоновую задачу
            asyncio.create_task(self.manager.start_auto_check())
            logger.info("✔ Автоматическая проверка прокси запущена (10 сек / 10 мин)")
            
            # Start serving
            async with self.tcp_server:
                await self.tcp_server.serve_forever()
        except Exception as e:
            logger.error(f"Balancer error: {e}")
            raise
    
    async def stop(self):
        """Stop servers"""
        self.running = False
        
        # Останавливаем автопроверку
        await self.manager.stop_auto_check()
        
        if self.tcp_server:
            self.tcp_server.close()
            await self.tcp_server.wait_closed()
        
        if self.udp_transport:
            self.udp_transport.close()
        
        logger.info("SOCKS5 балансировщик остановлен")
    
    def stop_sync(self):
        """Synchronous stop method"""
        self.running = False
        
        # Останавливаем автопроверку (синхронная версия)
        if self.manager._stop_event:
            self.manager._stop_event.set()
        
        if self.tcp_server:
            self.tcp_server.close()
        
        if self.udp_transport:
            self.udp_transport.close()
        
        logger.info("SOCKS5 балансировщик остановлен")
    
    async def _handle_tcp_client(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
        """Handle TCP SOCKS5 client"""
        client_addr = writer.get_extra_info('peername')
        logger.debug(f"New TCP connection from {client_addr}")
        
        try:
            # SOCKS5 greeting
            version = await reader.read(1)
            if version != b'\x05':
                writer.close()
                return
            
            # Number of auth methods
            nmethods = ord(await reader.read(1))
            methods = await reader.read(nmethods)
            
            # No authentication required
            writer.write(b'\x05\x00')
            await writer.drain()
            
            # Connection request
            version = await reader.read(1)
            if version != b'\x05':
                writer.close()
                return
            
            cmd = ord(await reader.read(1))
            _ = await reader.read(1)  # RSV
            atyp = ord(await reader.read(1))
            
            # Parse destination address
            if atyp == 1:  # IPv4
                addr = '.'.join(str(b) for b in await reader.read(4))
            elif atyp == 3:  # Domain
                length = ord(await reader.read(1))
                addr = (await reader.read(length)).decode()
            elif atyp == 4:  # IPv6
                addr = ':'.join(f'{b:02x}' for b in await reader.read(16))
            else:
                writer.write(b'\x05\x08\x00\x01\x00\x00\x00\x00\x00\x00')
                await writer.drain()
                writer.close()
                return
            
            port_bytes = await reader.read(2)
            port = struct.unpack('!H', port_bytes)[0]
            
            logger.debug(f"SOCKS5 request: {cmd} {addr}:{port}")
            
            # CMD: 1=CONNECT, 2=BIND, 3=UDP
            if cmd == 1:  # CONNECT
                await self._handle_connect(reader, writer, addr, port)
            else:
                # Not supported
                writer.write(b'\x05\x07\x00\x01\x00\x00\x00\x00\x00\x00')
                await writer.drain()
                writer.close()
        
        except Exception as e:
            logger.error(f"TCP error: {e}")
        finally:
            writer.close()
    
    async def _handle_connect(self, client_reader, client_writer, dest_addr, dest_port):
        """Handle SOCKS5 CONNECT request through proxy"""
        proxy = None
        try:
            # Select proxy
            proxy = self.manager.select_proxy()
            
            if not proxy:
                # No proxy available
                client_writer.write(b'\x05\x05\x00\x01\x00\x00\x00\x00\x00\x00')
                await client_writer.drain()
                return
            
            logger.debug(f"Using proxy: {proxy['name']} for {dest_addr}:{dest_port}")
            
            # Connect to upstream proxy
            upstream_reader, upstream_writer = await asyncio.open_connection(
                proxy['host'], proxy['port']
            )
            
            # SOCKS5 greeting to upstream
            upstream_writer.write(b'\x05\x01\x00')
            await upstream_writer.drain()
            response = await upstream_reader.read(2)
            
            if response != b'\x05\x00':
                raise Exception("Upstream proxy auth failed")
            
            # CONNECT request to upstream
            request = b'\x05\x01\x00'
            
            # Add destination address
            if ':' in dest_addr and '.' not in dest_addr:  # IPv6
                request += b'\x04' + bytes.fromhex(dest_addr.replace(':', ''))
            elif dest_addr.replace('.', '').replace(':', '').isdigit():  # IPv4
                request += b'\x01' + bytes(map(int, dest_addr.split('.')))
            else:  # Domain
                request += b'\x03' + bytes([len(dest_addr)]) + dest_addr.encode()
            
            request += struct.pack('!H', dest_port)
            
            upstream_writer.write(request)
            await upstream_writer.drain()
            
            # Read response
            response = await upstream_reader.read(10)
            
            if response[1] != 0:
                raise Exception(f"Upstream connect failed: {response[1]}")
            
            # Success response to client
            client_writer.write(b'\x05\x00\x00\x01\x00\x00\x00\x00\x00\x00')
            await client_writer.drain()
            
            # Update stats
            self.manager.record_connection(proxy['id'], success=True)
            
            # Start forwarding
            await asyncio.gather(
                self._forward(client_reader, upstream_writer),
                self._forward(upstream_reader, client_writer)
            )
        
        except Exception as e:
            logger.error(f"Connect error: {e}")
            if proxy:
                self.manager.record_connection(proxy['id'], success=False)
            client_writer.write(b'\x05\x05\x00\x01\x00\x00\x00\x00\x00\x00')
            await client_writer.drain()
    
    async def _forward(self, reader, writer):
        """Forward data between streams"""
        try:
            while True:
                data = await reader.read(8192)
                if not data:
                    break
                writer.write(data)
                await writer.drain()
        except Exception as e:
            logger.debug(f"Forward error: {e}")
        finally:
            try:
                writer.close()
                await writer.wait_closed()
            except:
                pass


class SOCKSUDPProtocol(asyncio.DatagramProtocol):
    """UDP protocol for SOCKS5"""
    
    def __init__(self, balancer: SocksBalancer):
        self.balancer = balancer
        self.transport = None
    
    def connection_made(self, transport):
        self.transport = transport
    
    def datagram_received(self, data, addr):
        """Handle UDP datagram"""
        logger.debug(f"UDP datagram from {addr}: {len(data)} bytes")
        # TODO: Parse SOCKS5 UDP header and forward through proxy
    
    def error_received(self, exc):
        logger.error(f"UDP error: {exc}")

