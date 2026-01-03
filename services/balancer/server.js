require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const net = require('net');
const path = require('path');
const fs = require('fs');

// Глобальный обработчик ошибок - предотвращает краш процесса
// МАКСИМАЛЬНО АГРЕССИВНЫЙ - ловим ВСЕ ошибки сокетов
process.on('uncaughtException', (err) => {
  // Игнорируем все ошибки связанные с сокетами/стримами
  const socketErrors = ['EPIPE', 'ECONNRESET', 'ENOTCONN', 'ECONNABORTED', 'ERR_STREAM_DESTROYED', 'ERR_STREAM_WRITE_AFTER_END', 'ECONNREFUSED', 'ETIMEDOUT', 'EHOSTUNREACH', 'ENETUNREACH'];
  const errString = String(err?.message || err || '').toLowerCase();
  const errCode = err?.code || '';
  
  if (socketErrors.includes(errCode) || 
      errString.includes('ended') || 
      errString.includes('socket') ||
      errString.includes('epipe') ||
      errString.includes('write after') ||
      errString.includes('destroyed') ||
      errString.includes('stream') ||
      errString.includes('other party') ||
      errString.includes('econnreset') ||
      errString.includes('closed') ||
      errString.includes('aborted')) {
    // Тихо игнорируем ошибки сокетов
    return;
  }
  console.error(`[${new Date().toISOString()}] Uncaught Exception:`, err.message);
});

process.on('unhandledRejection', (reason, promise) => {
  const reasonStr = String(reason?.message || reason || '').toLowerCase();
  const reasonCode = reason?.code || '';
  
  // Игнорируем ошибки сокетов/стримов в промисах
  if (reasonCode === 'EPIPE' || reasonCode === 'ECONNRESET' || 
      reasonStr.includes('ended') || reasonStr.includes('socket') ||
      reasonStr.includes('stream') || reasonStr.includes('other party') ||
      reasonStr.includes('destroyed') || reasonStr.includes('closed')) {
    return;
  }
  console.error(`[${new Date().toISOString()}] Unhandled Rejection:`, reason?.message || reason);
});
const ProxyDatabase = require('./database');
const SmartBalancer = require('./balancer');

const app = express();
const PORT = process.env.PORT || 7777;
const METRICS_PORT = process.env.METRICS_PORT || 9000;

// Создаем директорию для данных
if (!fs.existsSync('./data')) {
  fs.mkdirSync('./data');
}

// Инициализация БД и балансировщика
const db = new ProxyDatabase();
const balancer = new SmartBalancer(db);

// ============= REAL-TIME ЛОГИ =============
const MAX_LOGS = 500;
const connectionLogs = [];
const errorLogs = [];
const sseClients = new Set();

function addConnectionLog(entry) {
  const log = {
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    ...entry
  };
  connectionLogs.push(log);
  if (connectionLogs.length > MAX_LOGS) connectionLogs.shift();
  
  // Отправляем всем подключенным клиентам
  broadcastLog('connection', log);
}

function addErrorLog(entry) {
  const log = {
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    ...entry
  };
  errorLogs.push(log);
  if (errorLogs.length > MAX_LOGS) errorLogs.shift();
  
  // Отправляем всем подключенным клиентам
  broadcastLog('error', log);
}

function broadcastLog(type, log) {
  const data = JSON.stringify({ type, log });
  sseClients.forEach(client => {
    try {
      client.write(`data: ${data}\n\n`);
    } catch (e) {
      sseClients.delete(client);
    }
  });
}

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'change_this_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 часа
  }
}));

// Middleware для проверки аутентификации
function requireAuth(req, res, next) {
  // Интеграция с Marzban: отключаем проверку авторизации
  return next();
  
  /*
  if (!req.session.user) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }
  next();
  */
}

// ============= API ROUTES =============

// Авторизация
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Требуется username и password' });
  }

  if (db.verifyUser(username, password)) {
    req.session.user = { username };
    res.json({ success: true, username });
  } else {
    res.status(401).json({ error: 'Неверный логин или пароль' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/auth/check', (req, res) => {
  // Интеграция с Marzban: всегда авторизован
  res.json({ authenticated: true, username: 'admin' });
  
  /*
  if (req.session.user) {
    res.json({ authenticated: true, username: req.session.user.username });
  } else {
    res.json({ authenticated: false });
  }
  */
});

// Изменение пароля
app.post('/api/auth/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const username = req.session.user.username;

  if (!db.verifyUser(username, currentPassword)) {
    return res.status(401).json({ error: 'Неверный текущий пароль' });
  }

  db.updatePassword(username, newPassword);
  res.json({ success: true });
});

// Получить все прокси
app.get('/api/proxies', requireAuth, (req, res) => {
  const proxies = db.getAllProxies();
  const stats = balancer.getStatistics();
  
  // Объединяем данные из БД и статистику из балансировщика
  const result = proxies.map(proxy => {
    const stat = stats.find(s => s.id === proxy.id);
    return {
      ...proxy,
      ...(stat || {
        activeConnections: 0,
        totalConnections: 0,
        successfulConnections: 0,
        failedConnections: 0,
        successRate: 'N/A',
        avgResponseTime: 0,
        isHealthy: false,
        load: '0%'
      })
    };
  });

  res.json(result);
});

// Добавить прокси
app.post('/api/proxies', requireAuth, (req, res) => {
  try {
    const result = db.addProxy(req.body);
    balancer.reloadProxies();
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Обновить прокси
app.put('/api/proxies/:id', requireAuth, (req, res) => {
  try {
    db.updateProxy(req.params.id, req.body);
    balancer.reloadProxies();
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Удалить прокси
app.delete('/api/proxies/:id', requireAuth, (req, res) => {
  try {
    db.deleteProxy(req.params.id);
    balancer.reloadProxies();
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Переключить статус прокси
app.post('/api/proxies/:id/toggle', requireAuth, (req, res) => {
  try {
    const { enabled } = req.body;
    db.toggleProxy(req.params.id, enabled);
    balancer.reloadProxies();
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Тестировать прокси
app.post('/api/proxies/:id/test', requireAuth, async (req, res) => {
  try {
    const results = await balancer.testProxy(parseInt(req.params.id));
    res.json(results);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Получить статистику
app.get('/api/stats', requireAuth, (req, res) => {
  const stats = balancer.getStatistics();
  const totalActive = stats.reduce((sum, p) => sum + p.activeConnections, 0);
  const totalConnections = stats.reduce((sum, p) => sum + p.totalConnections, 0);
  const totalSuccessful = stats.reduce((sum, p) => sum + p.successfulConnections, 0);
  const totalFailed = stats.reduce((sum, p) => sum + p.failedConnections, 0);
  const healthyProxies = stats.filter(p => p.isHealthy).length;

  res.json({
    totalProxies: stats.length,
    activeProxies: healthyProxies,
    totalConnections: totalConnections,
    activeConnections: totalActive,
    successRate: totalConnections > 0 
      ? ((totalSuccessful / totalConnections) * 100)
      : 0
  });
});

// ============= REAL-TIME LOGS API =============

// SSE endpoint для real-time логов
app.get('/api/logs/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Отправляем начальные данные
  res.write(`data: ${JSON.stringify({ type: 'init', connectionLogs: connectionLogs.slice(-100), errorLogs: errorLogs.slice(-100) })}\n\n`);
  
  sseClients.add(res);
  
  req.on('close', () => {
    sseClients.delete(res);
  });
});

// Получить последние логи подключений
app.get('/api/logs/connections', requireAuth, (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  res.json(connectionLogs.slice(-limit));
});

// Получить последние ошибки
app.get('/api/logs/errors', requireAuth, (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  res.json(errorLogs.slice(-limit));
});

// Очистить логи
app.delete('/api/logs', requireAuth, (req, res) => {
  connectionLogs.length = 0;
  errorLogs.length = 0;
  res.json({ success: true });
});

// Сбросить счётчики активных соединений (на случай рассинхронизации)
app.post('/api/proxies/reset-counters', requireAuth, (req, res) => {
  balancer.resetActiveConnections();
  res.json({ success: true, message: 'Счётчики активных соединений сброшены' });
});

// Метрики для мониторинга (Prometheus-style)
app.get('/api/metrics', (req, res) => {
  const stats = balancer.getStatistics();
  
  let metrics = '# HELP proxy_balancer_info Proxy Balancer Information\n';
  metrics += '# TYPE proxy_balancer_info gauge\n';
  metrics += `proxy_balancer_info{version="2.0"} 1\n\n`;
  
  metrics += '# HELP proxy_active_connections Current active connections per proxy\n';
  metrics += '# TYPE proxy_active_connections gauge\n';
  stats.forEach(p => {
    metrics += `proxy_active_connections{proxy="${p.name}",id="${p.id}"} ${p.activeConnections}\n`;
  });
  
  metrics += '\n# HELP proxy_total_connections Total connections per proxy\n';
  metrics += '# TYPE proxy_total_connections counter\n';
  stats.forEach(p => {
    metrics += `proxy_total_connections{proxy="${p.name}",id="${p.id}"} ${p.totalConnections}\n`;
  });
  
  metrics += '\n# HELP proxy_failed_connections Failed connections per proxy\n';
  metrics += '# TYPE proxy_failed_connections counter\n';
  stats.forEach(p => {
    metrics += `proxy_failed_connections{proxy="${p.name}",id="${p.id}"} ${p.failedConnections}\n`;
  });
  
  metrics += '\n# HELP proxy_healthy Proxy health status (1 = healthy, 0 = unhealthy)\n';
  metrics += '# TYPE proxy_healthy gauge\n';
  stats.forEach(p => {
    metrics += `proxy_healthy{proxy="${p.name}",id="${p.id}"} ${p.isHealthy ? 1 : 0}\n`;
  });

  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

// Раздача статических файлов React (в production)
if (process.env.NODE_ENV === 'production') {
  // Обслуживаем статику на /balancer (JS/CSS могут кэшироваться, у них хэш в имени)
  app.use('/balancer', express.static(path.join(__dirname, 'client/build'), {
    maxAge: '1d',
    setHeaders: (res, filePath) => {
      // index.html не кэшируем
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    }
  }));
  
  // Все остальные запросы на /balancer/* отдаем index.html (без кэша)
  app.get('/balancer/*', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
  
  // Редирект с корня на /balancer
  app.get('/', (req, res) => {
    res.redirect('/balancer');
  });
}

// Запуск HTTP API сервера
app.listen(METRICS_PORT, '0.0.0.0', () => {
  console.log(`✓ API сервер запущен на http://0.0.0.0:${METRICS_PORT}`);
  console.log(`✓ Панель управления: http://localhost:${METRICS_PORT}`);
});

// ============= SOCKS5 БАЛАНСИРОВЩИК =============

// Безопасная функция записи в сокет
function safeWrite(socket, data) {
  try {
    if (socket && !socket.destroyed && socket.writable && !socket.writableEnded) {
      return socket.write(data);
    }
  } catch (err) {
    // Игнорируем ошибки записи в закрытый сокет
  }
  return false;
}

// Безопасное закрытие сокета
function safeDestroy(socket) {
  try {
    if (socket && !socket.destroyed) {
      socket.destroy();
    }
  } catch (err) {
    // Игнорируем
  }
}

const socksServer = net.createServer((clientSocket) => {
  let clientPhase = 'greeting';
  let selectedProxy = null;
  let proxySocket = null;
  let targetHost = '';
  let targetPort = 0;
  let connectionCounted = false; // Флаг для отслеживания, был ли учтён счётчик

  // Функция для безопасного декремента (только один раз)
  const safeDecrementConnection = () => {
    if (connectionCounted && selectedProxy) {
      balancer.decrementActiveConnections(selectedProxy.id);
      connectionCounted = false;
      selectedProxy = null;
    }
  };

  console.log(`[${new Date().toISOString()}] Новое подключение от ${clientSocket.remoteAddress}:${clientSocket.remotePort}`);

  clientSocket.on('data', async (data) => {
    try {
      // Если туннель установлен - pipe() уже обрабатывает данные
      if (clientPhase === 'tunnel') {
        return;
      }
      
      if (clientPhase === 'greeting') {
        if (data[0] !== 0x05) {
          console.log('Ошибка: не SOCKS5 протокол');
          safeDestroy(clientSocket);
          return;
        }

        const response = Buffer.from([0x05, 0x00]);
        safeWrite(clientSocket, response);
        clientPhase = 'connect';
      }
      else if (clientPhase === 'connect') {
        if (data[0] !== 0x05) {
          console.log('Ошибка: не SOCKS5 протокол');
          safeDestroy(clientSocket);
          return;
        }

        const cmd = data[1];
        
        // Проверяем тип команды
        // 0x01 = CONNECT, 0x02 = BIND, 0x03 = UDP ASSOCIATE
        if (cmd === 0x02) {
          // BIND не поддерживается
          console.log('Ошибка: команда BIND не поддерживается');
          const errorReply = Buffer.from([0x05, 0x07, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
          safeWrite(clientSocket, errorReply);
          safeDestroy(clientSocket);
          return;
        }

        const addressType = data[3];

        if (cmd === 0x03) {
          // UDP ASSOCIATE
          console.log(`[${new Date().toISOString()}] UDP ASSOCIATE запрос от ${clientSocket.remoteAddress}:${clientSocket.remotePort}`);

          try {
            selectedProxy = balancer.selectProxy();
            console.log(`[${new Date().toISOString()}] Выбран ${selectedProxy.name} для UDP ассоциации`);

            const udpRelay = await balancer.createUdpAssociation(
              selectedProxy,
              clientSocket.remoteAddress.replace('::ffff:', ''),
              clientSocket.remotePort
            );

            // Формируем успешный ответ с адресом UDP relay
            const reply = Buffer.alloc(10);
            reply[0] = 0x05; // VER
            reply[1] = 0x00; // SUCCESS
            reply[2] = 0x00; // RSV
            reply[3] = 0x01; // ATYP IPv4

            // Записываем IP адрес (0.0.0.0 означает использовать тот же адрес, что и TCP соединение)
            reply[4] = 0;
            reply[5] = 0;
            reply[6] = 0;
            reply[7] = 0;
            reply.writeUInt16BE(udpRelay.port, 8);

            safeWrite(clientSocket, reply);
            
            // Держим TCP соединение открытым для UDP ассоциации
            clientPhase = 'udp-relay';
            
            console.log(`[${new Date().toISOString()}] UDP ассоциация создана на порту ${udpRelay.port}`);

          } catch (err) {
            console.log(`[${new Date().toISOString()}] Ошибка UDP ASSOCIATE: ${err.message}`);
            const errorReply = Buffer.from([0x05, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
            safeWrite(clientSocket, errorReply);
            safeDestroy(clientSocket);
          }
          return;
        }

        // CONNECT команда (TCP)
        let isIPv6 = false;

        if (addressType === 0x01) { // IPv4
          targetHost = `${data[4]}.${data[5]}.${data[6]}.${data[7]}`;
          targetPort = data.readUInt16BE(8);
        }
        else if (addressType === 0x03) { // Domain
          const domainLength = data[4];
          targetHost = data.toString('utf-8', 5, 5 + domainLength);
          targetPort = data.readUInt16BE(5 + domainLength);
        }
        else if (addressType === 0x04) { // IPv6
          isIPv6 = true;
          // Форматируем IPv6 правильно: xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx
          const ipv6Parts = [];
          for (let i = 0; i < 8; i++) {
            ipv6Parts.push(data.readUInt16BE(4 + i * 2).toString(16));
          }
          targetHost = ipv6Parts.join(':');
          targetPort = data.readUInt16BE(20);
        }

        console.log(`[${new Date().toISOString()}] Подключение к ${targetHost}:${targetPort}${isIPv6 ? ' (IPv6)' : ''}`);
        
        // Логируем попытку подключения
        addConnectionLog({
          type: 'connect',
          target: `${targetHost}:${targetPort}`,
          status: 'pending',
          isIPv6: isIPv6,
          clientIp: clientSocket.remoteAddress?.replace('::ffff:', '')
        });

        // Retry логика - пробуем до 3 раз с разными прокси
        const maxRetries = 3;
        let lastError = null;
        const triedProxies = new Set();
        
        // Функция задержки
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            // Задержка перед retry (кроме первой попытки)
            if (attempt > 1) {
              await delay(500 * attempt); // 1s, 1.5s для retry
            }
            
            selectedProxy = balancer.selectProxy('socks5', Array.from(triedProxies));
            
            if (!selectedProxy) {
              lastError = new Error('Нет доступных прокси');
              break;
            }
            
            triedProxies.add(selectedProxy.id);
            
            if (attempt > 1) {
              console.log(`[${new Date().toISOString()}] Retry #${attempt}: ${selectedProxy.name} для ${targetHost}:${targetPort}`);
            } else {
              console.log(`[${new Date().toISOString()}] Выбран ${selectedProxy.name} (нагрузка: ${selectedProxy.activeConnections}/${selectedProxy.max_connections})`);
            }

            // Сначала подключаемся, потом увеличиваем счётчик
            proxySocket = await balancer.connectThroughProxy(selectedProxy, targetHost, targetPort);
            
            // Только после успешного подключения увеличиваем счётчик
            balancer.incrementActiveConnections(selectedProxy.id);
            connectionCounted = true;

            const reply = Buffer.from([0x05, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
            safeWrite(clientSocket, reply);
            
            // Логируем успешное подключение
            addConnectionLog({
              type: 'success',
              target: `${targetHost}:${targetPort}`,
              proxy: selectedProxy.name,
              proxyId: selectedProxy.id,
              attempt
            });

            // Добавляем обработчики ошибок для предотвращения краша
            proxySocket.on('error', (err) => {
              if (err.code !== 'EPIPE' && err.code !== 'ECONNRESET' && !err.message?.includes('ended')) {
                console.log(`[${new Date().toISOString()}] Ошибка proxy сокета: ${err.message}`);
              }
            });
            
            // Декремент при закрытии proxy сокета
            proxySocket.on('close', () => {
              safeDecrementConnection();
            });
            
            clientSocket.on('error', (err) => {
              if (err.code !== 'EPIPE' && err.code !== 'ECONNRESET' && !err.message?.includes('ended')) {
                console.log(`[${new Date().toISOString()}] Ошибка client сокета: ${err.message}`);
              }
            });

            // Используем pipe() - он автоматически обрабатывает все edge cases
            proxySocket.pipe(clientSocket);
            clientSocket.pipe(proxySocket);

            clientPhase = 'tunnel';
            lastError = null;
            break; // Успех, выходим из цикла
            
          } catch (err) {
            lastError = err;
            const proxyName = selectedProxy?.name || 'unknown';
            console.log(`[${new Date().toISOString()}] Ошибка подключения через ${proxyName} к ${targetHost}:${targetPort} (попытка ${attempt}/${maxRetries}): ${err.message}`);
            
            // Логируем ошибку
            addErrorLog({
              target: `${targetHost}:${targetPort}`,
              proxy: proxyName,
              proxyId: selectedProxy?.id,
              error: err.message,
              attempt,
              maxRetries
            });
            
            // При ошибке подключения счётчик не был увеличен, просто сбрасываем selectedProxy
            selectedProxy = null;
            connectionCounted = false;
            
            // Если это последняя попытка, не продолжаем
            if (attempt === maxRetries) break;
          }
        }

        // Если все попытки неудачны
        if (lastError) {
          // Логируем финальную ошибку
          addConnectionLog({
            type: 'failed',
            target: `${targetHost}:${targetPort}`,
            error: lastError.message,
            triedProxies: Array.from(triedProxies).length
          });
          
          // Определяем код ошибки SOCKS5
          let errorCode = 0x01; // General SOCKS server failure
          if (lastError.message.includes('ECONNREFUSED') || lastError.message.includes('ConnectionRefused')) {
            errorCode = 0x05; // Connection refused
          } else if (lastError.message.includes('ENETUNREACH') || lastError.message.includes('EHOSTUNREACH')) {
            errorCode = 0x04; // Host unreachable
          } else if (lastError.message.includes('ETIMEDOUT')) {
            errorCode = 0x04; // Host unreachable (timeout)
          }
          
          const errorReply = Buffer.from([0x05, errorCode, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
          safeWrite(clientSocket, errorReply);
          safeDestroy(clientSocket);
        }
      }
    } catch (err) {
      console.log(`[${new Date().toISOString()}] Ошибка обработки: ${err.message}`);
      safeDestroy(clientSocket);
    }
  });

  clientSocket.on('end', () => {
    if (proxySocket && !proxySocket.destroyed) {
      proxySocket.end();
    }
    // Декремент теперь происходит в proxySocket.on('close')
    console.log(`[${new Date().toISOString()}] Клиент отключен`);
  });

  clientSocket.on('error', (err) => {
    // Игнорируем ошибки закрытого сокета
    if (err.code !== 'EPIPE' && err.code !== 'ECONNRESET' && !err.message.includes('ended')) {
      console.log(`[${new Date().toISOString()}] Ошибка клиента: ${err.message}`);
    }
    if (proxySocket && !proxySocket.destroyed) {
      safeDestroy(proxySocket);
    }
    // Декремент произойдет в proxySocket.on('close')
  });

  clientSocket.on('close', () => {
    if (proxySocket && !proxySocket.destroyed) {
      safeDestroy(proxySocket);
    }
    // Декремент произойдет в proxySocket.on('close')
  });
});

socksServer.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ SOCKS5 балансировщик (TCP) запущен на 0.0.0.0:${PORT}`);
});

// ============= UDP БАЛАНСИРОВЩИК =============
const UDP_PORT = parseInt(process.env.UDP_PORT) || 7778;
const dgram = require('dgram');

// Простой UDP relay балансировщик
// Работает через SOCKS5 UDP ASSOCIATE
const udpSocksServer = net.createServer((clientSocket) => {
  let selectedProxy = null;
  let udpRelaySocket = null;
  let clientPhase = 'greeting';

  console.log(`[UDP] Новое подключение от ${clientSocket.remoteAddress}:${clientSocket.remotePort}`);

  clientSocket.on('data', async (data) => {
    try {
      if (clientPhase === 'greeting') {
        if (data[0] !== 0x05) {
          safeDestroy(clientSocket);
          return;
        }
        safeWrite(clientSocket, Buffer.from([0x05, 0x00]));
        clientPhase = 'request';
      }
      else if (clientPhase === 'request') {
        if (data[0] !== 0x05) {
          safeDestroy(clientSocket);
          return;
        }

        const cmd = data[1];
        
        if (cmd === 0x03) { // UDP ASSOCIATE
          try {
            selectedProxy = balancer.selectProxy();
            console.log(`[UDP] Выбран ${selectedProxy.name} для UDP`);

            // Создаём локальный UDP сокет для relay
            udpRelaySocket = dgram.createSocket('udp4');
            
            await new Promise((resolve, reject) => {
              udpRelaySocket.once('error', reject);
              udpRelaySocket.bind(0, '0.0.0.0', () => {
                udpRelaySocket.removeListener('error', reject);
                resolve();
              });
            });

            const relayAddr = udpRelaySocket.address();
            
            // Устанавливаем соединение с upstream SOCKS5 прокси для UDP
            const { SocksClient } = require('socks');
            
            const udpAssociation = await SocksClient.createConnection({
              proxy: {
                host: selectedProxy.host,
                port: selectedProxy.port,
                type: 5,
                userId: selectedProxy.username || undefined,
                password: selectedProxy.password || undefined
              },
              command: 'associate',
              destination: {
                host: '0.0.0.0',
                port: 0
              },
              timeout: 10000
            });

            const remoteUdpHost = udpAssociation.socket.remoteAddress;
            const remoteUdpPort = udpAssociation.remoteHost.port;
            
            console.log(`[UDP] Upstream UDP relay: ${remoteUdpHost}:${remoteUdpPort}`);

            // Обработка входящих UDP пакетов от клиента
            udpRelaySocket.on('message', (msg, rinfo) => {
              // Пересылаем на upstream прокси
              udpRelaySocket.send(msg, remoteUdpPort, selectedProxy.host);
            });

            // Создаём сокет для получения ответов от upstream
            const upstreamUdpSocket = dgram.createSocket('udp4');
            upstreamUdpSocket.bind(0, '0.0.0.0');
            
            upstreamUdpSocket.on('message', (msg, rinfo) => {
              // Отправляем обратно клиенту
              // Нужно знать адрес клиента из последнего запроса
            });

            // Формируем ответ клиенту
            const reply = Buffer.alloc(10);
            reply[0] = 0x05; // VER
            reply[1] = 0x00; // SUCCESS
            reply[2] = 0x00; // RSV
            reply[3] = 0x01; // ATYP IPv4
            reply[4] = 0; reply[5] = 0; reply[6] = 0; reply[7] = 0; // BND.ADDR
            reply.writeUInt16BE(relayAddr.port, 8); // BND.PORT

            safeWrite(clientSocket, reply);
            clientPhase = 'relay';
            
            console.log(`[UDP] Relay готов на порту ${relayAddr.port}`);
            
            // Логируем успешное UDP подключение
            addConnectionLog({
              type: 'udp-success',
              target: 'UDP ASSOCIATE',
              proxy: selectedProxy.name,
              proxyId: selectedProxy.id,
              relayPort: relayAddr.port
            });

            // Закрываем при разрыве TCP соединения
            clientSocket.on('close', () => {
              udpRelaySocket.close();
              udpAssociation.socket.destroy();
            });

          } catch (err) {
            console.log(`[UDP] Ошибка: ${err.message}`);
            // Логируем UDP ошибку в real-time
            addErrorLog({
              target: 'UDP ASSOCIATE',
              proxy: selectedProxy?.name || 'unknown',
              proxyId: selectedProxy?.id,
              error: err.message,
              attempt: 1,
              maxRetries: 1
            });
            const errorReply = Buffer.from([0x05, 0x01, 0x00, 0x01, 0, 0, 0, 0, 0, 0]);
            safeWrite(clientSocket, errorReply);
            safeDestroy(clientSocket);
          }
        } else {
          // Для CONNECT перенаправляем на основной балансер
          const errorReply = Buffer.from([0x05, 0x07, 0x00, 0x01, 0, 0, 0, 0, 0, 0]);
          safeWrite(clientSocket, errorReply);
          safeDestroy(clientSocket);
        }
      }
    } catch (err) {
      console.log(`[UDP] Ошибка: ${err.message}`);
      safeDestroy(clientSocket);
    }
  });

  clientSocket.on('error', (err) => {
    if (err.code !== 'EPIPE' && err.code !== 'ECONNRESET') {
      console.log(`[UDP] Ошибка клиента: ${err.message}`);
    }
    try {
      if (udpRelaySocket) udpRelaySocket.close();
    } catch (e) {}
  });

  clientSocket.on('close', () => {
    console.log(`[UDP] Клиент отключен`);
  });
});

udpSocksServer.listen(UDP_PORT, '0.0.0.0', () => {
  console.log(`✓ SOCKS5 балансировщик (UDP) запущен на 0.0.0.0:${UDP_PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹ Завершение работы...');
  socksServer.close();
  udpSocksServer.close();
  balancer.close();
  db.close();
  process.exit(0);
});

// Периодическая очистка старой статистики
setInterval(() => {
  db.cleanOldStats(7);
}, 24 * 60 * 60 * 1000); // Раз в день
