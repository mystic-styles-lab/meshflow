const SocksClient = require('socks').SocksClient;
const net = require('net');

const proxies = [
  {
    name: 'PROXY1-SOCKS5',
    host: '45.139.31.229',
    port: 64753,
    username: 'As4f2nja',
    password: 'rDbz8tjw'
  },
  {
    name: 'PROXY2-SOCKS5',
    host: '185.111.27.238',
    port: 63031,
    username: 'As4f2nja',
    password: 'rDbz8tjw'
  }
];

async function testProxy(proxy) {
  console.log(`\n🔍 Тестирую ${proxy.name} (${proxy.host}:${proxy.port})...`);
  
  const options = {
    proxy: {
      host: proxy.host,
      port: proxy.port,
      type: 5,
      userId: proxy.username,
      password: proxy.password
    },
    command: 'connect',
    destination: {
      host: '1.1.1.1',
      port: 80
    },
    timeout: 10000
  };

  try {
    console.log(`   Подключение к ${options.destination.host}:${options.destination.port}...`);
    const info = await SocksClient.createConnection(options);
    console.log(`✅ ${proxy.name}: Подключение успешно`);
    
    // Отправляем HTTP запрос
    info.socket.write('GET / HTTP/1.1\r\nHost: 1.1.1.1\r\nConnection: close\r\n\r\n');
    
    return new Promise((resolve, reject) => {
      let responseData = '';
      let resolved = false;
      
      info.socket.on('data', (data) => {
        responseData += data.toString();
        if (!resolved && responseData.includes('HTTP')) {
          resolved = true;
          console.log(`✅ ${proxy.name}: Получен HTTP ответ (${data.length} байт)`);
          info.socket.destroy();
          resolve(true);
        }
      });

      info.socket.on('error', (err) => {
        if (!resolved) {
          resolved = true;
          console.log(`❌ ${proxy.name}: Ошибка сокета - ${err.message}`);
          reject(err);
        }
      });

      info.socket.on('end', () => {
        if (!resolved) {
          resolved = true;
          if (responseData) {
            console.log(`✅ ${proxy.name}: Соединение закрыто, получено ${responseData.length} байт`);
            resolve(true);
          } else {
            console.log(`❌ ${proxy.name}: Нет ответа`);
            reject(new Error('No response'));
          }
        }
      });

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          info.socket.destroy();
          console.log(`❌ ${proxy.name}: Таймаут ожидания ответа`);
          reject(new Error('Timeout'));
        }
      }, 10000);
    });
  } catch (err) {
    console.log(`❌ ${proxy.name}: Ошибка подключения - ${err.message}`);
    return false;
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════');
  console.log('Ручная проверка SOCKS5 прокси');
  console.log('═══════════════════════════════════════════');

  for (const proxy of proxies) {
    await testProxy(proxy);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('Проверка завершена!');
  console.log('═══════════════════════════════════════════\n');
}

runTests();
