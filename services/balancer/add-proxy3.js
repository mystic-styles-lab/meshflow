const ProxyDatabase = require('./database');

const db = new ProxyDatabase();
db.init();

// Добавляем новый прокси SOCKS5
const proxy3Socks5 = {
  name: 'PROXY3-SOCKS5',
  host: '130.49.37.44',
  port: 64707,
  protocol: 'socks5',
  username: 'As4f2nja',
  password: 'rDbz8tjw',
  enabled: 1,
  priority: 0,
  max_connections: 100
};

try {
  const result = db.addProxy(proxy3Socks5);
  console.log(`✓ Добавлен ${proxy3Socks5.name} (ID: ${result.lastInsertRowid})`);
} catch (err) {
  console.log(`⚠ ${proxy3Socks5.name}: ${err.message}`);
}

console.log('\nВсе прокси в базе:');
const proxies = db.getAllProxies();
proxies.forEach(p => {
  console.log(`  ${p.id}. ${p.name} (${p.host}:${p.port}) - ${p.protocol.toUpperCase()} - ${p.enabled ? 'Включен' : 'Выключен'}`);
});

console.log(`\n✓ Всего прокси: ${proxies.length}`);
db.close();
