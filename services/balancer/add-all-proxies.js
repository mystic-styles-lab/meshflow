const ProxyDatabase = require('./database');

const db = new ProxyDatabase();

// Добавляем все 4 канала прокси
const proxies = [
  {
    name: 'PROXY1-SOCKS5',
    host: '45.139.31.229',
    port: 64753,
    protocol: 'socks5',
    username: 'As4f2nja',
    password: 'rDbz8tjw',
    enabled: 1,
    priority: 10,
    max_connections: 50
  },
  {
    name: 'PROXY1-HTTP',
    host: '45.139.31.229',
    port: 64752,
    protocol: 'http',
    username: 'As4f2nja',
    password: 'rDbz8tjw',
    enabled: 1,
    priority: 10,
    max_connections: 50
  },
  {
    name: 'PROXY2-SOCKS5',
    host: '185.111.27.238',
    port: 63031,
    protocol: 'socks5',
    username: 'As4f2nja',
    password: 'rDbz8tjw',
    enabled: 1,
    priority: 10,
    max_connections: 50
  },
  {
    name: 'PROXY2-HTTP',
    host: '185.111.27.238',
    port: 63030,
    protocol: 'http',
    username: 'As4f2nja',
    password: 'rDbz8tjw',
    enabled: 1,
    priority: 10,
    max_connections: 50
  }
];

console.log('Добавление прокси серверов...\n');

proxies.forEach(proxy => {
  try {
    db.addProxy(proxy);
    console.log(`✓ Добавлен: ${proxy.name} (${proxy.protocol.toUpperCase()}) - ${proxy.host}:${proxy.port}`);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      console.log(`⚠ Пропущен: ${proxy.name} (уже существует)`);
    } else {
      console.error(`✗ Ошибка при добавлении ${proxy.name}:`, error.message);
    }
  }
});

console.log('\n✓ Готово! Всего прокси в базе:', db.getAllProxies().length);

db.close();
