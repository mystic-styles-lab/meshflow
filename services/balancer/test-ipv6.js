const { SocksClient } = require('socks');

const proxies = [
  { name: 'PROXY-1-FL', host: '194.87.215.83', port: 30005, user: 'rsYMEGFN', pass: 'tgGpnYyi' },
  { name: 'PROXY-2-FL', host: '45.145.57.81', port: 30018, user: 'rsYMEGFN', pass: 'tgGpnYyi' },
  { name: 'PROXY-3-EST', host: '46.8.222.14', port: 30001, user: 'rsYMEGFN', pass: 'tgGpnYyi' }
];

const targetIPv6 = '2a00:b703:fff1:8d::1';
const targetPort = 443;

async function testProxy(proxy) {
  console.log(`\nТестируем ${proxy.name} (${proxy.host}:${proxy.port})...`);
  try {
    const info = await SocksClient.createConnection({
      proxy: {
        host: proxy.host,
        port: proxy.port,
        type: 5,
        userId: proxy.user,
        password: proxy.pass
      },
      command: 'connect',
      destination: {
        host: targetIPv6,
        port: targetPort
      },
      timeout: 10000
    });
    console.log('✅ УСПЕХ! Прокси поддерживает IPv6');
    info.socket.destroy();
    return true;
  } catch (err) {
    console.log('❌ ОШИБКА:', err.message);
    return false;
  }
}

(async () => {
  console.log('Тестирование IPv6:', targetIPv6 + ':' + targetPort);
  console.log('='.repeat(50));
  
  let supported = 0;
  for (const proxy of proxies) {
    const result = await testProxy(proxy);
    if (result) supported++;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`Результат: ${supported}/${proxies.length} прокси поддерживают IPv6`);
})();
