const ProxyDatabase = require('./database');

const db = new ProxyDatabase();
db.init();

const proxies = db.getAllProxies();

console.log('Текущие прокси:');
proxies.forEach(p => {
  console.log(`${p.id}. ${p.name} (${p.host}:${p.port}) - ${p.enabled ? 'Включен' : 'Выключен'}`);
});

// Отключаем PROXY2-SOCKS5
const proxy2 = proxies.find(p => p.name === 'PROXY2-SOCKS5');
if (proxy2) {
  db.updateProxy(proxy2.id, {
    ...proxy2,
    enabled: 0
  });
  console.log(`\n✓ PROXY2-SOCKS5 отключен`);
}

db.close();
