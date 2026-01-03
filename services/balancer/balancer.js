const net = require('net');
const dgram = require('dgram');
const { SocksClient } = require('socks');
const HttpProxyAgent = require('http-proxy-agent');
const HttpsProxyAgent = require('https-proxy-agent');
const EventEmitter = require('events');

class SmartBalancer extends EventEmitter {
  constructor(database) {
    super();
    this.db = database;
    this.proxies = new Map();
    this.udpAssociations = new Map(); // Хранение активных UDP ассоциаций
    this.healthCheckInterval = null;
    this.loadProxies();
    this.startHealthChecks();
  }

  loadProxies() {
    const dbProxies = this.db.getEnabledProxies();
    
    this.proxies.clear();
    dbProxies.forEach(proxy => {
      this.proxies.set(proxy.id, {
        ...proxy,
        activeConnections: 0,
        totalConnections: 0,
        failedConnections: 0,
        successfulConnections: 0,
        avgResponseTime: 0,
        lastHealthCheck: null,
        isHealthy: true,
        responseTimes: []
      });
    });

    console.log(`✓ Загружено ${this.proxies.size} активных прокси`);
  }

  reloadProxies() {
    this.loadProxies();
    this.emit('proxies-reloaded');
  }

  // Умный выбор прокси с учетом:
  // 1. Здоровье прокси
  // 2. Количество активных соединений
  // 3. Приоритет
  // 4. Среднее время отклика
  // 5. Процент успешных соединений
  // 6. Протокол (опционально)
  // 7. Исключение определенных прокси (для retry)
  selectProxy(protocolFilter = null, excludeProxyIds = []) {
    let availableProxies = Array.from(this.proxies.values())
      .filter(p => p.enabled && p.isHealthy && p.activeConnections < p.max_connections)
      .filter(p => !excludeProxyIds.includes(p.id));

    // Фильтр по протоколу если указан
    if (protocolFilter) {
      if (protocolFilter === 'socks5') {
        availableProxies = availableProxies.filter(p => p.protocol === 'socks5' || !p.protocol);
      } else if (protocolFilter === 'http') {
        availableProxies = availableProxies.filter(p => p.protocol === 'http' || p.protocol === 'https');
      }
    }

    if (availableProxies.length === 0) {
      // Если это retry (excludeProxyIds не пустой), возвращаем null вместо ошибки
      if (excludeProxyIds.length > 0) {
        return null;
      }
      throw new Error('Нет доступных прокси');
    }

    // Вычисляем вес для каждого прокси
    const weighted = availableProxies.map(proxy => {
      const successRate = proxy.totalConnections > 0
        ? proxy.successfulConnections / proxy.totalConnections
        : 1;
      
      const loadFactor = 1 - (proxy.activeConnections / proxy.max_connections);
      const healthScore = proxy.isHealthy ? 1 : 0;
      const priorityScore = (proxy.priority + 10) / 10; // Нормализуем приоритет
      const responseScore = proxy.avgResponseTime > 0 
        ? Math.max(0, 1 - (proxy.avgResponseTime / 5000)) // Нормализуем время отклика
        : 1;

      // Итоговый вес
      const weight = (
        healthScore * 0.3 +
        loadFactor * 0.25 +
        successRate * 0.25 +
        priorityScore * 0.1 +
        responseScore * 0.1
      );

      return { proxy, weight };
    });

    // Сортируем по весу и выбираем лучший
    weighted.sort((a, b) => b.weight - a.weight);
    return weighted[0].proxy;
  }

  async connectThroughProxy(proxy, targetHost, targetPort) {
    const startTime = Date.now();
    
    try {
      let socket;

      if (proxy.protocol === 'http' || proxy.protocol === 'https') {
        // HTTP/HTTPS прокси подключение
        socket = await this.connectThroughHttpProxy(proxy, targetHost, targetPort);
      } else {
        // SOCKS5 прокси подключение
        const info = await SocksClient.createConnection({
          proxy: {
            ipaddress: proxy.host,
            port: proxy.port,
            type: 5,
            userId: proxy.username || undefined,
            password: proxy.password || undefined
          },
          command: 'connect',
          destination: {
            host: targetHost,
            port: targetPort
          },
          timeout: 30000
        });
        socket = info.socket;
      }

      const responseTime = Date.now() - startTime;
      this.updateProxyMetrics(proxy.id, true, responseTime);

      return socket;
    } catch (error) {
      this.updateProxyMetrics(proxy.id, false, Date.now() - startTime);
      throw error;
    }
  }

  async connectThroughHttpProxy(proxy, targetHost, targetPort) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.destroy();
        reject(new Error('Connection timeout'));
      }, 5000);

      const socket = net.connect({
        host: proxy.host,
        port: proxy.port
      });

      socket.on('connect', () => {
        // Отправляем HTTP CONNECT запрос
        const connectRequest = [
          `CONNECT ${targetHost}:${targetPort} HTTP/1.1`,
          `Host: ${targetHost}:${targetPort}`,
          proxy.username && proxy.password ? `Proxy-Authorization: Basic ${Buffer.from(`${proxy.username}:${proxy.password}`).toString('base64')}` : '',
          '',
          ''
        ].filter(Boolean).join('\r\n');

        socket.write(connectRequest);

        let responseData = '';
        const onData = (data) => {
          responseData += data.toString();
          
          // Ждем полный HTTP ответ
          if (responseData.includes('\r\n\r\n')) {
            socket.removeListener('data', onData);
            clearTimeout(timeout);
            
            // Проверяем статус ответа
            const statusLine = responseData.split('\r\n')[0];
            const statusCode = parseInt(statusLine.split(' ')[1]);
            
            if (statusCode === 200) {
              resolve(socket);
            } else {
              socket.destroy();
              reject(new Error(`HTTP CONNECT failed with status ${statusCode}`));
            }
          }
        };

        socket.on('data', onData);
      });

      socket.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  updateProxyMetrics(proxyId, success, responseTime) {
    const proxy = this.proxies.get(proxyId);
    if (!proxy) return;

    proxy.totalConnections++;
    
    if (success) {
      proxy.successfulConnections++;
      proxy.responseTimes.push(responseTime);
      
      // Храним только последние 100 измерений
      if (proxy.responseTimes.length > 100) {
        proxy.responseTimes.shift();
      }
      
      // Вычисляем среднее время отклика
      proxy.avgResponseTime = Math.round(
        proxy.responseTimes.reduce((a, b) => a + b, 0) / proxy.responseTimes.length
      );
    } else {
      proxy.failedConnections++;
    }

    // Обновляем здоровье на основе последних соединений
    const recentSuccess = proxy.totalConnections > 10
      ? proxy.successfulConnections / proxy.totalConnections
      : 1;
    
    // Помечаем как нездоровый если успешность < 40%
    // Но восстанавливаем только если > 60% (гистерезис)
    if (recentSuccess < 0.4) {
      proxy.isHealthy = false;
    } else if (recentSuccess > 0.6) {
      proxy.isHealthy = true;
    }
    // Между 40-60% сохраняем предыдущее состояние

    this.emit('metrics-updated', proxyId, proxy);
  }

  incrementActiveConnections(proxyId) {
    const proxy = this.proxies.get(proxyId);
    if (proxy) {
      proxy.activeConnections++;
    }
  }

  decrementActiveConnections(proxyId) {
    const proxy = this.proxies.get(proxyId);
    if (proxy) {
      proxy.activeConnections = Math.max(0, proxy.activeConnections - 1);
    }
  }

  // Сброс всех счётчиков активных соединений (для ручной синхронизации)
  resetActiveConnections() {
    for (const proxy of this.proxies.values()) {
      proxy.activeConnections = 0;
    }
    console.log('✓ Счётчики активных соединений сброшены');
  }

  // Health check для всех прокси
  async performHealthCheck(proxy) {
    try {
      const testSocket = await this.connectThroughProxy(proxy, 'www.google.com', 80);
      testSocket.destroy();
      proxy.isHealthy = true;
      proxy.lastHealthCheck = new Date();
      return true;
    } catch (error) {
      proxy.isHealthy = false;
      proxy.lastHealthCheck = new Date();
      console.log(`⚠ Прокси ${proxy.name} недоступен: ${error.message}`);
      return false;
    }
  }

  // Тест прокси с детальной информацией
  async testProxy(proxyId) {
    const proxy = this.proxies.get(proxyId);
    if (!proxy) {
      throw new Error('Прокси не найден');
    }

    const startTime = Date.now();
    const results = {
      proxyId: proxy.id,
      proxyName: proxy.name,
      host: proxy.host,
      port: proxy.port,
      tests: []
    };

    // Список тестовых целей
    const testTargets = [
      { name: 'Google', host: 'www.google.com', port: 80 },
      { name: 'Cloudflare DNS', host: '1.1.1.1', port: 80 },
      { name: 'GitHub', host: 'github.com', port: 443 },
      { name: 'Telegram', host: 'web.telegram.org', port: 443 },
      { name: 'Instagram', host: 'www.instagram.com', port: 443 },
      { name: 'YouTube', host: 'www.youtube.com', port: 443 },
      { name: 'ChatGPT', host: 'chat.openai.com', port: 443 },
      { name: 'Gemini', host: 'gemini.google.com', port: 443 },
      { name: 'Twitter/X', host: 'twitter.com', port: 443 },
      { name: 'Discord', host: 'discord.com', port: 443 },
      { name: 'Reddit', host: 'www.reddit.com', port: 443 },
      { name: 'WhatsApp Web', host: 'web.whatsapp.com', port: 443 }
    ];

    // Выполняем тесты для всех целей
    for (const target of testTargets) {
      try {
        const testStart = Date.now();
        const socket = await this.connectThroughProxy(proxy, target.host, target.port);
        const responseTime = Date.now() - testStart;
        socket.destroy();
        
        results.tests.push({
          target: `${target.name} (${target.host}:${target.port})`,
          success: true,
          responseTime: responseTime,
          error: null
        });
      } catch (error) {
        results.tests.push({
          target: `${target.name} (${target.host}:${target.port})`,
          success: false,
          responseTime: 0,
          error: error.message
        });
      }
    }

    const totalTime = Date.now() - startTime;
    const successCount = results.tests.filter(t => t.success).length;
    const avgResponseTime = successCount > 0
      ? Math.round(results.tests.filter(t => t.success).reduce((sum, t) => sum + t.responseTime, 0) / successCount)
      : 0;

    results.summary = {
      totalTests: results.tests.length,
      successCount: successCount,
      failCount: results.tests.length - successCount,
      successRate: ((successCount / results.tests.length) * 100).toFixed(1) + '%',
      avgResponseTime: avgResponseTime,
      totalTime: totalTime,
      isHealthy: successCount >= Math.ceil(results.tests.length * 0.6) // Здоров если >= 60% тестов прошли
    };

    // Обновляем статус прокси
    proxy.isHealthy = results.summary.isHealthy;
    proxy.lastHealthCheck = new Date();
    if (results.summary.isHealthy) {
      proxy.avgResponseTime = avgResponseTime;
    }

    // Сохраняем здоровье в БД
    this.db.run('UPDATE proxies SET healthy = ? WHERE id = ?', [
      results.summary.isHealthy ? 1 : 0,
      proxy.id
    ]);

    return results;
  }

  startHealthChecks() {
    // Проверяем здоровье каждую минуту
    this.healthCheckInterval = setInterval(async () => {
      console.log('🔍 Запуск проверки здоровья прокси...'););
      
      for (const proxy of this.proxies.values()) {
        await this.performHealthCheck(proxy);
        
        // Сохраняем статистику в БД
        this.db.saveProxyStats(proxy.id, {
          totalConnections: proxy.totalConnections,
          failedConnections: proxy.failedConnections,
          avgResponseTime: proxy.avgResponseTime,
          isHealthy: proxy.isHealthy
        });
      }
      
      this.emit('health-check-completed');
    }, 60000); // Каждую минуту
  }

  stopHealthChecks() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }

  getStatistics() {
    const stats = [];
    
    for (const proxy of this.proxies.values()) {
      const successRate = proxy.totalConnections > 0
        ? ((proxy.successfulConnections / proxy.totalConnections) * 100).toFixed(2)
        : 'N/A';

      stats.push({
        id: proxy.id,
        name: proxy.name,
        host: proxy.host,
        port: proxy.port,
        enabled: proxy.enabled,
        priority: proxy.priority,
        activeConnections: proxy.activeConnections,
        totalConnections: proxy.totalConnections,
        successfulConnections: proxy.successfulConnections,
        failedConnections: proxy.failedConnections,
        successRate: successRate,
        avgResponseTime: proxy.avgResponseTime,
        maxConnections: proxy.max_connections,
        isHealthy: proxy.isHealthy,
        lastHealthCheck: proxy.lastHealthCheck,
        load: ((proxy.activeConnections / proxy.max_connections) * 100).toFixed(1) + '%'
      });
    }
    
    return stats;
  }

  close() {
    this.stopHealthChecks();
    // Закрываем все UDP ассоциации
    for (const [key, association] of this.udpAssociations.entries()) {
      if (association.socket) {
        association.socket.close();
      }
      if (association.timeout) {
        clearTimeout(association.timeout);
      }
    }
    this.udpAssociations.clear();
  }

  // UDP ASSOCIATE функционал
  async createUdpAssociation(proxy, clientAddress, clientPort) {
    const associationId = `${clientAddress}:${clientPort}:${Date.now()}`;
    
    try {
      // Создаем UDP сокет для relay
      const udpSocket = dgram.createSocket('udp4');
      
      await new Promise((resolve, reject) => {
        udpSocket.once('error', reject);
        udpSocket.bind(0, '0.0.0.0', () => {
          udpSocket.removeListener('error', reject);
          resolve();
        });
      });

      const relayAddress = udpSocket.address();
      
      // Создаем UDP ассоциацию
      const association = {
        id: associationId,
        proxy: proxy,
        socket: udpSocket,
        clientAddress: clientAddress,
        clientPort: clientPort,
        relayAddress: relayAddress.address,
        relayPort: relayAddress.port,
        lastActivity: Date.now(),
        timeout: null
      };

      // Обработчик входящих UDP пакетов
      udpSocket.on('message', async (msg, rinfo) => {
        association.lastActivity = Date.now();
        
        try {
          // Парсим SOCKS5 UDP пакет
          if (msg.length < 10) return; // Минимальный размер заголовка
          
          // RSV (2 байта) | FRAG | ATYP | DST.ADDR | DST.PORT | DATA
          const frag = msg[2];
          if (frag !== 0x00) {
            console.log('⚠ Фрагментация UDP не поддерживается');
            return;
          }

          const atyp = msg[3];
          let dstAddr, dstPort, dataOffset;

          if (atyp === 0x01) { // IPv4
            dstAddr = `${msg[4]}.${msg[5]}.${msg[6]}.${msg[7]}`;
            dstPort = msg.readUInt16BE(8);
            dataOffset = 10;
          } else if (atyp === 0x03) { // Domain
            const domainLen = msg[4];
            dstAddr = msg.toString('utf8', 5, 5 + domainLen);
            dstPort = msg.readUInt16BE(5 + domainLen);
            dataOffset = 7 + domainLen;
          } else if (atyp === 0x04) { // IPv6
            dstAddr = Array.from(msg.slice(4, 20))
              .map(b => b.toString(16).padStart(2, '0'))
              .join(':');
            dstPort = msg.readUInt16BE(20);
            dataOffset = 22;
          } else {
            console.log('⚠ Неподдерживаемый тип адреса:', atyp);
            return;
          }

          const userData = msg.slice(dataOffset);
          
          // Отправляем через прокси
          await this.sendUdpThroughProxy(proxy, dstAddr, dstPort, userData, (replyData, replyAddr, replyPort) => {
            // Формируем SOCKS5 UDP reply пакет
            const header = Buffer.alloc(10);
            header.writeUInt16BE(0, 0); // RSV
            header[2] = 0x00; // FRAG
            header[3] = 0x01; // ATYP IPv4
            
            // Парсим reply адрес
            const addrParts = replyAddr.split('.');
            if (addrParts.length === 4) {
              header[4] = parseInt(addrParts[0]);
              header[5] = parseInt(addrParts[1]);
              header[6] = parseInt(addrParts[2]);
              header[7] = parseInt(addrParts[3]);
              header.writeUInt16BE(replyPort, 8);
              
              const replyPacket = Buffer.concat([header, replyData]);
              udpSocket.send(replyPacket, clientPort, clientAddress);
            }
          });

        } catch (error) {
          console.log('⚠ Ошибка обработки UDP пакета:', error.message);
        }
      });

      // Timeout для неактивных ассоциаций (5 минут)
      const resetTimeout = () => {
        if (association.timeout) {
          clearTimeout(association.timeout);
        }
        association.timeout = setTimeout(() => {
          console.log(`⏱ UDP ассоциация ${associationId} закрыта по таймауту`);
          udpSocket.close();
          this.udpAssociations.delete(associationId);
        }, 5 * 60 * 1000);
      };

      resetTimeout();
      
      // Обновляем timeout при активности
      udpSocket.on('message', () => {
        resetTimeout();
      });

      this.udpAssociations.set(associationId, association);
      
      console.log(`✓ UDP ассоциация создана: ${associationId} -> ${relayAddress.address}:${relayAddress.port}`);
      
      return {
        address: relayAddress.address,
        port: relayAddress.port,
        associationId: associationId
      };

    } catch (error) {
      console.log('⚠ Ошибка создания UDP ассоциации:', error.message);
      throw error;
    }
  }

  async sendUdpThroughProxy(proxy, targetHost, targetPort, data, onReply) {
    // Для UDP через SOCKS5 нужно создать специальный клиент
    // Эта реализация упрощенная - в продакшене нужно использовать полноценный SOCKS5 UDP клиент
    
    try {
      // Создаем временный UDP сокет для отправки
      const tempSocket = dgram.createSocket('udp4');
      
      tempSocket.on('message', (msg, rinfo) => {
        onReply(msg, rinfo.address, rinfo.port);
      });

      // В идеале здесь должна быть отправка через SOCKS5 прокси
      // Но socks библиотека не поддерживает UDP напрямую
      // Для production нужна более сложная реализация
      
      // Временно отправляем напрямую (TODO: реализовать через SOCKS5 UDP)
      const targetIp = await this.resolveHost(targetHost);
      tempSocket.send(data, targetPort, targetIp, (error) => {
        if (error) {
          console.log('⚠ Ошибка отправки UDP:', error.message);
        }
      });

      // Закрываем сокет через 30 секунд
      setTimeout(() => {
        tempSocket.close();
      }, 30000);

    } catch (error) {
      console.log('⚠ Ошибка UDP relay:', error.message);
      throw error;
    }
  }

  async resolveHost(hostname) {
    // Если уже IP адрес, возвращаем как есть
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return hostname;
    }
    
    // Резолвим DNS
    const dns = require('dns').promises;
    try {
      const addresses = await dns.resolve4(hostname);
      return addresses[0];
    } catch (error) {
      throw new Error(`Не удалось разрешить DNS для ${hostname}: ${error.message}`);
    }
  }
}

module.exports = SmartBalancer;
