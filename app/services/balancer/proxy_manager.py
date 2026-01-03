"""
Proxy Manager
Управление прокси серверами
"""
import asyncio
import time
import httpx
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from .database import BalancerDatabase


class ProxyManager:
    def __init__(self, db: BalancerDatabase):
        self.db = db
        self.auto_check_task = None
        self._stop_event = None
    
    async def start_auto_check(self):
        """Запуск фоновой проверки прокси"""
        self._stop_event = asyncio.Event()
        self.auto_check_task = asyncio.create_task(self._auto_check_loop())
    
    async def stop_auto_check(self):
        """Остановка фоновой проверки"""
        self._stop_event.set()
        if self.auto_check_task:
            self.auto_check_task.cancel()
            try:
                await self.auto_check_task
            except asyncio.CancelledError:
                pass
    
    async def _auto_check_loop(self):
        """Цикл автоматической проверки прокси"""
        while not self._stop_event.is_set():
            try:
                proxies = self.db.get_all_proxies()
                now = datetime.now()
                
                for proxy in proxies:
                    if not proxy['enabled']:
                        continue
                    
                    # Получаем статистику
                    conn = self.db.get_conn()
                    cursor = conn.cursor()
                    cursor.execute('''
                        SELECT last_check, in_slow_check_mode
                        FROM proxy_stats
                        WHERE proxy_id = ?
                    ''', (proxy['id'],))
                    stats = cursor.fetchone()
                    
                    if not stats:
                        continue
                    
                    last_check_str = stats['last_check']
                    in_slow_mode = stats['in_slow_check_mode']
                    
                    # Определяем интервал проверки
                    check_interval = timedelta(minutes=10) if in_slow_mode else timedelta(seconds=10)
                    
                    # Если last_check == None или прошло достаточно времени
                    should_check = False
                    if not last_check_str:
                        should_check = True
                    else:
                        last_check = datetime.fromisoformat(last_check_str)
                        if now - last_check >= check_interval:
                            should_check = True
                    
                    if should_check:
                        await self.test_proxy(proxy['id'])
                
                # Ждем 5 секунд перед следующей итерацией
                await asyncio.sleep(5)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Auto-check error: {e}")
                await asyncio.sleep(5)
    
    async def test_proxy(self, proxy_id: int) -> Dict:
        """Test proxy with protocol-specific checks for accurate measurement"""
        proxy = self.db.get_proxy(proxy_id)
        if not proxy:
            return {"success": False, "error": "Proxy not found"}
        
        protocol = proxy.get('protocol', 'socks5')
        success = False
        error = None
        response_time = 0
        
        try:
            if protocol == 'socks5':
                # Test SOCKS5 with full handshake and authentication
                start_time = time.time()
                
                reader, writer = await asyncio.wait_for(
                    asyncio.open_connection(proxy['host'], proxy['port']),
                    timeout=5.0
                )
                
                # Check if authentication is required
                username = proxy.get('username')
                password = proxy.get('password')
                
                if username and password:
                    # SOCKS5 greeting with USERNAME/PASSWORD auth: VER(5) NMETHODS(2) METHODS(0=no auth, 2=user/pass)
                    writer.write(b'\x05\x02\x00\x02')
                else:
                    # SOCKS5 greeting with NO AUTH: VER(5) NMETHODS(1) METHODS(0=no auth)
                    writer.write(b'\x05\x01\x00')
                
                await writer.drain()
                
                # Read greeting response: VER(5) + chosen METHOD
                greeting_response = await asyncio.wait_for(reader.read(2), timeout=3.0)
                
                if len(greeting_response) != 2 or greeting_response[0] != 5:
                    error = "Invalid SOCKS5 greeting response"
                    response_time = int((time.time() - start_time) * 1000)
                else:
                    chosen_method = greeting_response[1]
                    
                    # Handle authentication
                    if chosen_method == 0x02:  # USERNAME/PASSWORD
                        if not username or not password:
                            error = "Proxy requires authentication but credentials not provided"
                            response_time = int((time.time() - start_time) * 1000)
                        else:
                            # Send authentication: VER(1) ULEN USERNAME PLEN PASSWORD
                            auth_request = bytes([0x01, len(username)]) + username.encode()
                            auth_request += bytes([len(password)]) + password.encode()
                            
                            writer.write(auth_request)
                            await writer.drain()
                            
                            # Read auth response: VER(1) STATUS(0=success)
                            auth_response = await asyncio.wait_for(reader.read(2), timeout=3.0)
                            
                            if len(auth_response) != 2 or auth_response[1] != 0:
                                error = f"SOCKS5 authentication failed: status {auth_response[1] if len(auth_response) > 1 else 'unknown'}"
                                response_time = int((time.time() - start_time) * 1000)
                            else:
                                # Auth successful, proceed to CONNECT
                                chosen_method = 0x00  # Mark as authenticated
                    
                    elif chosen_method == 0xFF:  # No acceptable methods
                        error = "SOCKS5 server rejected all authentication methods"
                        response_time = int((time.time() - start_time) * 1000)
                    
                    # If authenticated or no auth required, try CONNECT
                    if chosen_method == 0x00 or chosen_method == 0x02:
                        # CONNECT request: VER(5) CMD(1=CONNECT) RSV(0) ATYP(1=IPv4) DST.ADDR DST.PORT
                        # Try to connect to Google DNS: 8.8.8.8:53
                        connect_request = b'\x05\x01\x00\x01' + bytes([8, 8, 8, 8]) + b'\x00\x35'
                        
                        writer.write(connect_request)
                        await writer.drain()
                        
                        # Read connect response (at least 10 bytes: VER REP RSV ATYP DST.ADDR DST.PORT)
                        connect_response = await asyncio.wait_for(reader.read(10), timeout=3.0)
                        
                        if len(connect_response) >= 2:
                            reply_code = connect_response[1]
                            if reply_code == 0:
                                success = True
                                response_time = int((time.time() - start_time) * 1000)
                            else:
                                error_codes = {
                                    0x01: "General SOCKS server failure",
                                    0x02: "Connection not allowed by ruleset",
                                    0x03: "Network unreachable",
                                    0x04: "Host unreachable",
                                    0x05: "Connection refused",
                                    0x06: "TTL expired",
                                    0x07: "Command not supported",
                                    0x08: "Address type not supported"
                                }
                                error = error_codes.get(reply_code, f"SOCKS5 connect failed: code {reply_code}")
                                response_time = int((time.time() - start_time) * 1000)
                        else:
                            error = "Invalid SOCKS5 connect response"
                            response_time = int((time.time() - start_time) * 1000)
                
                writer.close()
                await writer.wait_closed()
                
            else:
                # For VLESS/Shadowsocks - just check TCP port availability
                # Real protocol testing would require encryption/handshake implementation
                start_time = time.time()
                
                reader, writer = await asyncio.wait_for(
                    asyncio.open_connection(proxy['host'], proxy['port']),
                    timeout=5.0
                )
                
                response_time = int((time.time() - start_time) * 1000)
                success = True
                
                writer.close()
                await writer.wait_closed()
            
        except asyncio.TimeoutError:
            error = "Connection timeout"
            response_time = 5000
        except Exception as e:
            error = str(e)
            response_time = 5000
        
        # Обновляем статистику с учетом последовательных неудач
        conn = self.db.get_conn()
        cursor = conn.cursor()
        
        # Получаем текущий счетчик неудач
        cursor.execute('''
            SELECT consecutive_failures, in_slow_check_mode
            FROM proxy_stats
            WHERE proxy_id = ?
        ''', (proxy_id,))
        stats = cursor.fetchone()
        
        consecutive_failures = stats['consecutive_failures'] if stats else 0
        in_slow_mode = stats['in_slow_check_mode'] if stats else 0
        
        if success:
            # Успешная проверка - сбрасываем счетчик и возвращаем в быстрый режим
            consecutive_failures = 0
            in_slow_mode = 0
        else:
            # Неудачная проверка - увеличиваем счетчик
            consecutive_failures += 1
            
            # После 5 неудач подряд - переводим в медленный режим
            if consecutive_failures >= 5:
                in_slow_mode = 1
        
        # Обновляем статистику
        cursor.execute('''
            UPDATE proxy_stats
            SET is_healthy = ?,
                avg_response_time = ?,
                last_check = ?,
                consecutive_failures = ?,
                in_slow_check_mode = ?
            WHERE proxy_id = ?
        ''', (1 if success else 0, response_time, datetime.now().isoformat(), 
              consecutive_failures, in_slow_mode, proxy_id))
        
        conn.commit()
        
        return {
            "success": success,
            "responseTime": response_time,
            "error": error
        }
    
    async def test_all_proxies(self) -> List[Dict]:
        """Test all proxies concurrently"""
        proxies = self.db.get_all_proxies()
        tasks = [self.test_proxy(proxy['id']) for proxy in proxies]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Return results with proxy IDs
        return [
            {"proxyId": proxy['id'], **result} if isinstance(result, dict) else {"proxyId": proxy['id'], "success": False, "error": str(result)}
            for proxy, result in zip(proxies, results)
        ]
    
    def _build_proxy_url(self, proxy: Dict) -> str:
        """Build proxy URL"""
        protocol = proxy['protocol']
        host = proxy['host']
        port = proxy['port']
        username = proxy.get('username')
        password = proxy.get('password')
        
        if username and password:
            return f"{protocol}://{username}:{password}@{host}:{port}"
        return f"{protocol}://{host}:{port}"
    
    def add_proxy(self, name: str, host: str, port: int, protocol: str = 'socks5',
                  username: Optional[str] = None, password: Optional[str] = None,
                  priority: int = 0, max_connections: int = 100) -> int:
        """Add new proxy"""
        return self.db.add_proxy(name, host, port, protocol, username, password, priority, max_connections)
    
    def get_proxy(self, proxy_id: int) -> Optional[Dict]:
        """Get proxy by ID"""
        return self.db.get_proxy(proxy_id)
    
    def select_proxy(self) -> Optional[Dict]:
        """Select best available proxy for connection (round-robin among healthy)"""
        proxies = self.db.get_all_proxies()
        healthy_proxies = [p for p in proxies if p.get('enabled') and p.get('isHealthy')]
        
        if not healthy_proxies:
            # Fallback to any enabled proxy
            healthy_proxies = [p for p in proxies if p.get('enabled')]
        
        if not healthy_proxies:
            return None
        
        # Sort by priority (higher first) then by avg response time (lower first)
        healthy_proxies.sort(key=lambda p: (-p.get('priority', 0), p.get('avgResponseTime', 9999)))
        
        return healthy_proxies[0]
    
    def get_all_proxies(self) -> List[Dict]:
        """Get all proxies"""
        return self.db.get_all_proxies()
    
    def update_proxy(self, proxy_id: int, **kwargs) -> bool:
        """Update proxy"""
        return self.db.update_proxy(proxy_id, **kwargs)
    
    def delete_proxy(self, proxy_id: int) -> bool:
        """Delete proxy"""
        return self.db.delete_proxy(proxy_id)
    
    def toggle_proxy(self, proxy_id: int, enabled: bool) -> bool:
        """Toggle proxy enabled state"""
        return self.db.update_proxy(proxy_id, enabled=1 if enabled else 0)
    
    def get_statistics(self) -> Dict:
        """Get overall statistics"""
        return self.db.get_statistics()
