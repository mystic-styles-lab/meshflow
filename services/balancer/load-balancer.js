/*
 * ⚠️  УСТАРЕВШИЙ ФАЙЛ
 * 
 * Этот файл заменен на новую версию с веб-панелью управления.
 * Используйте: node server.js
 * 
 * Новые возможности:
 * - Веб-панель управления на React
 * - Умная балансировка нагрузки
 * - Аутентификация
 * - База данных для управления прокси
 * - Мониторинг в реальном времени
 * 
 * См. README.md и INSTALL.md для инструкций
 */

const net = require('net');
const http = require('http');
const { SocksClient } = require('socks');

// Конфигурация прокси
const proxies = [
  {
    id: 'PROXY1',
    host: '45.139.31.229',
    port: 64753,
    username: 'As4f2nja',
    password: 'rDbz8tjw',
    activeConnections: 0,
    totalConnections: 0,
    failedConnections: 0
  },
  {
    id: 'PROXY2',
    host: '185.111.27.238',
    port: 63031,
    username: 'As4f2nja',
    password: 'rDbz8tjw',
    activeConnections: 0,
    totalConnections: 0,
    failedConnections: 0
  }
];

const BALANCER_PORT = 7777;
const METRICS_PORT = 9000;
const LOG_ENABLED = true;

// Логирование
function log(message) {
  if (LOG_ENABLED) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }
}

// Выбор прокси с наименьшей нагрузкой (least connections)
function selectProxy() {
  return proxies.reduce((min, proxy) =>
    proxy.activeConnections < min.activeConnections ? proxy : min
  );
}

// Основной SOCKS5 балансировщик
const server = net.createServer((clientSocket) => {
  let clientPhase = 'greeting';
  let selectedProxy = null;
  let proxySocket = null;
  let targetHost = '';
  let targetPort = 0;

  log(`Новое подключение от ${clientSocket.remoteAddress}:${clientSocket.remotePort}`);

  clientSocket.on('data', async (data) => {
    try {
      if (clientPhase === 'greeting') {
        // SOCKS5 greeting
        if (data[0] !== 0x05) {
          log('Ошибка: не SOCKS5 протокол');
          clientSocket.destroy();
          return;
        }

        // Ответ: выбираем NO AUTH (для упрощения)
        const response = Buffer.from([0x05, 0x00]);
        clientSocket.write(response);
        clientPhase = 'connect';
      }
      else if (clientPhase === 'connect') {
        // SOCKS5 connect
        if (data[0] !== 0x05 || data[1] !== 0x01) {
          log('Ошибка: неподдерживаемая команда');
          clientSocket.destroy();
          return;
        }

        // Парсим адрес
        const addressType = data[3];
        let offset = 4;

        if (addressType === 0x01) { // IPv4
          targetHost = `${data[4]}.${data[5]}.${data[6]}.${data[7]}`;
          targetPort = data.readUInt16BE(8);
        }
        else if (addressType === 0x03) { // Domain name
          const domainLength = data[4];
          targetHost = data.toString('utf-8', 5, 5 + domainLength);
          targetPort = data.readUInt16BE(5 + domainLength);
        }
        else if (addressType === 0x04) { // IPv6
          targetHost = data.slice(4, 20).toString('hex');
          targetPort = data.readUInt16BE(20);
        }

        log(`Подключение к ${targetHost}:${targetPort}`);

        // Выбираем прокси
        selectedProxy = selectProxy();
        log(`Выбран ${selectedProxy.id} (нагрузка: ${selectedProxy.activeConnections})`);

        // Подключаемся к целевому хосту через прокси
        try {
          const info = await SocksClient.createConnection({
            proxy: {
              ipaddress: selectedProxy.host,
              port: selectedProxy.port,
              type: 5,
              userId: selectedProxy.username,
              password: selectedProxy.password
            },
            command: 'connect',
            destination: {
              host: targetHost,
              port: targetPort
            }
          });

          proxySocket = info.socket;
          selectedProxy.activeConnections++;
          selectedProxy.totalConnections++;

          // Отправляем успех клиенту
          const reply = Buffer.from([0x05, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
          clientSocket.write(reply);

          // Транспортируем данные
          proxySocket.pipe(clientSocket);
          clientSocket.pipe(proxySocket);

          clientPhase = 'tunnel';
        } catch (err) {
          log(`Ошибка подключения через прокси: ${err.message}`);
          selectedProxy.failedConnections++;

          // Отправляем ошибку клиенту
          const errorReply = Buffer.from([0x05, 0x01]); // connection refused
          clientSocket.write(errorReply);
          clientSocket.destroy();
        }
      }
    } catch (err) {
      log(`Ошибка обработки данных: ${err.message}`);
      clientSocket.destroy();
    }
  });

  clientSocket.on('end', () => {
    if (proxySocket) {
      proxySocket.end();
      if (selectedProxy) {
        selectedProxy.activeConnections--;
      }
    }
    log(`Клиент отключен ${clientSocket.remoteAddress}:${clientSocket.remotePort}`);
  });

  clientSocket.on('error', (err) => {
    log(`Ошибка клиента: ${err.message}`);
    if (proxySocket) {
      proxySocket.destroy();
      if (selectedProxy) {
        selectedProxy.activeConnections--;
      }
    }
  });
});

// HTTP метрики сервер
const metricsServer = http.createServer((req, res) => {
  if (req.url === '/metrics') {
    const metrics = {
      timestamp: new Date().toISOString(),
      balancer: {
        port: BALANCER_PORT,
        uptime: process.uptime()
      },
      proxies: proxies.map(p => ({
        id: p.id,
        host: p.host,
        port: p.port,
        activeConnections: p.activeConnections,
        totalConnections: p.totalConnections,
        failedConnections: p.failedConnections,
        successRate: p.totalConnections > 0
          ? (((p.totalConnections - p.failedConnections) / p.totalConnections) * 100).toFixed(2) + '%'
          : 'N/A'
      }))
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(metrics, null, 2));
  }
  else if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  }
  else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// Запуск серверов
server.listen(BALANCER_PORT, '127.0.0.1', () => {
  log(`SOCKS5 балансировщик запущен на 127.0.0.1:${BALANCER_PORT}`);
  log(`Проксис: ${proxies.map(p => `${p.id} (${p.host}:${p.port})`).join(', ')}`);
});

metricsServer.listen(METRICS_PORT, '127.0.0.1', () => {
  log(`Метрики доступны на http://127.0.0.1:${METRICS_PORT}/metrics`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  log('Завершение работы...');
  server.close(() => {
    metricsServer.close(() => {
      process.exit(0);
    });
  });
});

// Периодическое логирование статуса
setInterval(() => {
  const status = proxies.map(p =>
    `${p.id}: ${p.activeConnections} активных, ${p.totalConnections} всего, ${p.failedConnections} ошибок`
  ).join(' | ');
  log(`Статус: ${status}`);
}, 30000);
