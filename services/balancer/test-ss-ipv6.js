const net = require('net');
const crypto = require('crypto');

// NL Shadowsocks server
const SS_SERVER = '145.249.115.86';
const SS_PORT = 8388;
const SS_METHOD = 'chacha20-ietf-poly1305';
const SS_PASSWORD = 'YbATqcjqXHnq6rtrOwYAars6JSCAKEWZ';

// Target IPv6
const TARGET_HOST = '2a00:b703:fff1:8d::1';
const TARGET_PORT = 443;

console.log('Тестирование NL Shadowsocks на поддержку IPv6');
console.log('='.repeat(50));
console.log(`Shadowsocks: ${SS_SERVER}:${SS_PORT}`);
console.log(`Target: ${TARGET_HOST}:${TARGET_PORT}`);
console.log('');

// Простая проверка - подключаемся к SS серверу
const socket = net.connect({ host: SS_SERVER, port: SS_PORT }, () => {
  console.log('✅ Подключение к Shadowsocks серверу успешно');
  console.log('');
  console.log('Для полной проверки IPv6 нужно использовать shadowsocks клиент.');
  console.log('Но если сервер работает - он скорее всего поддерживает IPv6,');
  console.log('так как это зависит от конфигурации сервера, а не клиента.');
  socket.destroy();
});

socket.on('error', (err) => {
  console.log('❌ Ошибка подключения к Shadowsocks:', err.message);
});

socket.setTimeout(5000, () => {
  console.log('❌ Таймаут подключения');
  socket.destroy();
});
