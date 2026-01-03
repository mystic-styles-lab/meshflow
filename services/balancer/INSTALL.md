# Установка и запуск Marzban Proxy Balancer

## 📋 Быстрый старт

### 1. Установка на локальном компьютере (разработка)

```bash
# Установка backend зависимостей
npm install

# Установка frontend зависимостей
cd client
npm install
cd ..

# Создать .env файл
cp .env.example .env

# Запустить в режиме разработки
# Терминал 1 - Backend
npm run dev

# Терминал 2 - Frontend
npm run client
```

Панель будет доступна по адресу: `http://localhost:3000`

### 2. Установка на Linux сервере (production)

```bash
# Загрузить файлы на сервер
scp -r * root@your-server:/opt/marzban-balancer

# Подключиться к серверу
ssh root@your-server

# Перейти в директорию
cd /opt/marzban-balancer

# Установить зависимости
npm install
cd client && npm install && npm run build && cd ..

# Создать .env файл
cp .env.example .env
nano .env

# Отредактировать .env:
# PORT=7777
# ADMIN_USERNAME=admin
# ADMIN_PASSWORD=your_secure_password
# SESSION_SECRET=your_random_secret_key

# Запустить напрямую (для теста)
npm start

# ИЛИ создать systemd service для автозапуска
```

### 3. Создание systemd service (автозапуск)

```bash
# Создать service файл
sudo nano /etc/systemd/system/proxy-balancer.service
```

Добавьте содержимое:

```ini
[Unit]
Description=Marzban Proxy Balancer
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/marzban-balancer
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Затем:

```bash
# Перезагрузить systemd
sudo systemctl daemon-reload

# Запустить сервис
sudo systemctl start proxy-balancer

# Включить автозапуск
sudo systemctl enable proxy-balancer

# Проверить статус
sudo systemctl status proxy-balancer

# Просмотр логов
sudo journalctl -u proxy-balancer -f
```

### 4. Миграция с текущего балансировщика

```bash
# Остановить старый балансировщик (найти PID)
ps aux | grep node
kill <PID>

# Запустить новый
cd /opt/marzban-balancer
npm start

# Или через systemd
sudo systemctl start proxy-balancer
```

## 🔧 Конфигурация

### Порты

- **7777** - SOCKS5 балансировщик (127.0.0.1)
- **9000** - HTTP API и веб-панель (0.0.0.0)

### Доступ к панели

После запуска откройте в браузере:
- `http://your-server-ip:9000`
- Логин: `admin`
- Пароль: `admin` (измените в настройках!)

### Добавление прокси через панель

1. Войдите в панель управления
2. Нажмите "➕ Добавить прокси"
3. Заполните данные:
   - Название: PROXY1
   - Хост: IP адрес прокси
   - Порт: порт SOCKS5
   - Логин/пароль (если требуется)
   - Приоритет (0-100)
   - Макс. соединений

## 📊 Мониторинг

### Просмотр метрик

```bash
# Через API
curl http://localhost:9000/api/metrics

# Через веб-панель
http://your-server-ip:9000
```

### Логи

```bash
# Если запущен через systemd
sudo journalctl -u proxy-balancer -f

# Если запущен вручную - смотрите вывод в терминале
```

## 🔐 Безопасность

1. **Измените пароль администратора** сразу после первого входа
2. **Используйте сильный SESSION_SECRET** в .env
3. **Настройте firewall** чтобы порт 9000 был доступен только вам:

```bash
# Разрешить доступ только с вашего IP
sudo ufw allow from YOUR_IP to any port 9000

# Порт 7777 должен быть доступен только локально (уже настроен)
```

## 🚀 Обновление

```bash
# Остановить сервис
sudo systemctl stop proxy-balancer

# Загрузить новые файлы
cd /opt/marzban-balancer
# ... скопировать новые файлы ...

# Обновить зависимости
npm install
cd client && npm install && npm run build && cd ..

# Запустить снова
sudo systemctl start proxy-balancer
```

## ❓ Проблемы

### Порт уже занят

```bash
# Найти процесс на порту 7777
sudo lsof -i :7777
# Убить процесс
sudo kill <PID>
```

### База данных заблокирована

```bash
# Остановить все инстансы
sudo systemctl stop proxy-balancer
pkill -f "node.*server.js"

# Удалить lock файл
rm -f data/proxy-balancer.db-*

# Запустить снова
sudo systemctl start proxy-balancer
```
