const Database = require('./database');

const db = new Database();

console.log('Добавление текущих прокси в базу данных...');

const proxies = [
  {
    name: 'PROXY1',
    host: '45.139.31.229',
    port: 64753,
    username: 'As4f2nja',
    password: 'rDbz8tjw',
    enabled: true,
    priority: 10,
    max_connections: 100
  },
  {
    name: 'PROXY2',
    host: '185.111.27.238',
    port: 63031,
    username: 'As4f2nja',
    password: 'rDbz8tjw',
    enabled: true,
    priority: 10,
    max_connections: 100
  }
];

try {
  proxies.forEach(proxy => {
    const result = db.addProxy(proxy);
    console.log(`✓ Добавлен прокси: ${proxy.name} (${proxy.host}:${proxy.port})`);
  });
  console.log('\nГотово! Прокси добавлены в базу данных.');
  console.log('Перезапустите сервер: node server.js');
} catch (error) {
  if (error.message.includes('UNIQUE')) {
    console.log('Прокси уже существуют в базе данных.');
  } else {
    console.error('Ошибка:', error.message);
  }
} finally {
  db.close();
}
