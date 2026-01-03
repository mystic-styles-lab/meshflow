const ProxyDatabase = require('./database');

const db = new ProxyDatabase();
db.init();

const proxies = db.getAllProxies();

// Включаем PROXY2-SOCKS5
const proxy2 = proxies.find(p => p.name === 'PROXY2-SOCKS5');
if (proxy2) {
  db.updateProxy(proxy2.id, {
    ...proxy2,
    enabled: 1
  });
  console.log(`✓ PROXY2-SOCKS5 включен обратно`);
}

db.close();
