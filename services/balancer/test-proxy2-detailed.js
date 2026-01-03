const net = require('net');

const proxy = {
  host: '185.111.27.238',
  port: 63031,
  username: 'As4f2nja',
  password: 'rDbz8tjw'
};

function testSocks5() {
  console.log(`\n🔍 Подробное тестирование ${proxy.host}:${proxy.port}`);
  console.log(`   Логин: ${proxy.username}`);
  console.log(`   Пароль: ${proxy.password}\n`);

  const socket = net.connect(proxy.port, proxy.host, () => {
    console.log('✅ TCP соединение установлено');
    
    // Шаг 1: SOCKS5 greeting с поддержкой username/password
    const greeting = Buffer.from([
      0x05, // SOCKS version 5
      0x02, // 2 метода аутентификации
      0x00, // No authentication
      0x02  // Username/password authentication
    ]);
    
    console.log('📤 Отправляю SOCKS5 greeting:', greeting.toString('hex'));
    socket.write(greeting);
  });

  let step = 'greeting';
  let buffer = Buffer.alloc(0);

  socket.on('data', (data) => {
    buffer = Buffer.concat([buffer, data]);
    console.log(`📥 Получено ${data.length} байт:`, data.toString('hex'));

    if (step === 'greeting') {
      if (buffer.length >= 2) {
        const version = buffer[0];
        const method = buffer[1];
        
        console.log(`   SOCKS версия: ${version}`);
        console.log(`   Выбранный метод: ${method} (${method === 0 ? 'No auth' : method === 2 ? 'Username/Password' : 'Unknown'})`);
        
        if (version !== 0x05) {
          console.log('❌ Неверная версия SOCKS');
          socket.destroy();
          return;
        }

        buffer = buffer.slice(2);

        if (method === 0x00) {
          // No authentication required
          console.log('ℹ️  Аутентификация не требуется');
          step = 'connect';
          sendConnectRequest();
        } else if (method === 0x02) {
          // Username/password authentication required
          console.log('ℹ️  Требуется аутентификация Username/Password');
          step = 'auth';
          sendAuth();
        } else if (method === 0xFF) {
          console.log('❌ Сервер не принял ни один метод аутентификации');
          socket.destroy();
        }
      }
    } else if (step === 'auth') {
      if (buffer.length >= 2) {
        const authVersion = buffer[0];
        const status = buffer[1];
        
        console.log(`   Auth версия: ${authVersion}`);
        console.log(`   Auth статус: ${status} (${status === 0 ? 'Success' : 'Failed'})`);
        
        if (status !== 0x00) {
          console.log('❌ Аутентификация не прошла');
          socket.destroy();
          return;
        }
        
        buffer = buffer.slice(2);
        step = 'connect';
        console.log('✅ Аутентификация успешна');
        sendConnectRequest();
      }
    } else if (step === 'connect') {
      if (buffer.length >= 5) {
        const version = buffer[0];
        const reply = buffer[1];
        
        console.log(`   SOCKS версия: ${version}`);
        console.log(`   Ответ сервера: ${reply}`);
        
        const replyMessages = {
          0x00: 'Success',
          0x01: 'General SOCKS server failure',
          0x02: 'Connection not allowed by ruleset',
          0x03: 'Network unreachable',
          0x04: 'Host unreachable',
          0x05: 'Connection refused',
          0x06: 'TTL expired',
          0x07: 'Command not supported',
          0x08: 'Address type not supported'
        };
        
        console.log(`   Значение: ${replyMessages[reply] || 'Unknown'}`);
        
        if (reply === 0x00) {
          console.log('✅ SOCKS5 подключение успешно!');
          console.log('📤 Отправляю HTTP запрос...');
          socket.write('GET / HTTP/1.1\r\nHost: 1.1.1.1\r\nConnection: close\r\n\r\n');
          step = 'data';
        } else {
          console.log('❌ SOCKS5 подключение отклонено');
          socket.destroy();
        }
      }
    } else if (step === 'data') {
      const response = buffer.toString();
      if (response.includes('HTTP')) {
        console.log('✅ Получен HTTP ответ!');
        console.log(response.substring(0, 200));
        socket.destroy();
      }
    }
  });

  function sendAuth() {
    const username = Buffer.from(proxy.username);
    const password = Buffer.from(proxy.password);
    
    const authRequest = Buffer.concat([
      Buffer.from([0x01]), // Auth version
      Buffer.from([username.length]),
      username,
      Buffer.from([password.length]),
      password
    ]);
    
    console.log('📤 Отправляю аутентификацию:');
    console.log(`   Username length: ${username.length}`);
    console.log(`   Username: ${proxy.username}`);
    console.log(`   Password length: ${password.length}`);
    console.log(`   Password: ${proxy.password}`);
    console.log(`   Hex: ${authRequest.toString('hex')}`);
    
    socket.write(authRequest);
  }

  function sendConnectRequest() {
    // Подключаемся к 1.1.1.1:80
    const connectRequest = Buffer.from([
      0x05, // SOCKS version
      0x01, // CONNECT command
      0x00, // Reserved
      0x01, // IPv4 address type
      0x01, 0x01, 0x01, 0x01, // 1.1.1.1
      0x00, 0x50 // Port 80
    ]);
    
    console.log('📤 Отправляю CONNECT запрос к 1.1.1.1:80');
    console.log(`   Hex: ${connectRequest.toString('hex')}`);
    socket.write(connectRequest);
  }

  socket.on('error', (err) => {
    console.log('❌ Ошибка сокета:', err.message);
  });

  socket.on('timeout', () => {
    console.log('❌ Таймаут соединения');
    socket.destroy();
  });

  socket.on('close', () => {
    console.log('\n🔌 Соединение закрыто');
  });

  socket.setTimeout(15000);
}

testSocks5();
