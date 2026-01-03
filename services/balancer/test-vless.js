const { SocksClient } = require('socks');
const net = require('net');

async function testVlessConnection() {
    console.log('=== Проверка соединения через VLESS (Facebook) ===');
    
    const options = {
        proxy: {
            host: '127.0.0.1',
            port: 7777,
            type: 5
        },
        command: 'connect',
        destination: {
            host: 'www.facebook.com',
            port: 80
        }
    };

    try {
        const info = await SocksClient.createConnection(options);
        console.log('✓ SOCKS5 подключение установлено');
        
        const socket = info.socket;
        
        socket.write('HEAD / HTTP/1.1\r\nHost: www.facebook.com\r\n\r\n');
        
        socket.on('data', (data) => {
            console.log('✓ Ответ от сервера получен:');
            console.log(data.toString().split('\r\n')[0]); // Печатаем только первую строку ответа (HTTP/1.1 301...)
            socket.destroy();
            console.log('\nИТОГ: VLESS работает корректно!');
        });

        socket.on('error', (err) => {
            console.error('✗ Ошибка сокета:', err.message);
        });

    } catch (err) {
        console.error('✗ Не удалось подключиться через прокси:', err.message);
        console.log('Убедитесь, что балансировщик запущен (docker-compose restart)');
    }
}

testVlessConnection();
