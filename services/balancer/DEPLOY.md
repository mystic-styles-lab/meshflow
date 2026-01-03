# 🚀 Инструкция по деплою Proxy Balancer на продакшн

## 📋 Предварительные требования

- Сервер с Ubuntu/Debian (где уже установлен Marzban)
- Docker и Docker Compose установлены
- Доступ по SSH (root@49299 или ваш сервер)
- Опционально: домен для HTTPS

## 📦 Шаг 1: Подготовка проекта

### На локальной машине:

```powershell
# Переходим в директорию проекта
cd d:\Desktop\proxy-balancer

# Собираем production сборку фронтенда
cd client
npm run build
cd ..

# Создаем архив для загрузки на сервер (исключая ненужное)
tar -czf proxy-balancer.tar.gz `
  --exclude=node_modules `
  --exclude=client/node_modules `
  --exclude=client/build `
  --exclude=data `
  --exclude=.env `
  server.js balancer.js database.js package.json `
  docker-compose.yml Dockerfile .dockerignore `
  .env.production nginx.conf client/

# Загружаем на сервер
scp proxy-balancer.tar.gz root@49299:/root/
```

## 🔧 Шаг 2: Настройка на сервере

```bash
# Подключаемся к серверу
ssh root@49299

# Создаем директорию и распаковываем
mkdir -p /opt/proxy-balancer
cd /opt/proxy-balancer
tar -xzf ~/proxy-balancer.tar.gz
rm ~/proxy-balancer.tar.gz

# Настраиваем переменные окружения
cp .env.production .env
nano .env
```

### Обязательно измените в `.env`:

```bash
# Генерируем SESSION_SECRET
openssl rand -base64 32

# В файле .env установите:
SESSION_SECRET=<вывод команды выше>
ADMIN_USERNAME=admin  # или свой логин
ADMIN_PASSWORD=<ваш_надежный_пароль>
```

## 🐳 Шаг 3: Docker Setup

```bash
# Создаем сеть для связи с Marzban (если нужно)
docker network create marzban-network 2>/dev/null || true

# Если Marzban уже запущен, подключаем его к сети
docker network connect marzban-network marzban 2>/dev/null || true

# Создаем директории для данных
mkdir -p data logs

# Собираем и запускаем
docker-compose build
docker-compose up -d

# Проверяем логи
docker-compose logs -f
```

## 🌐 Шаг 4: Настройка Nginx (опционально)

### Если у вас уже настроен Nginx от Marzban:

```bash
# Копируем конфигурацию
cp nginx.conf /etc/nginx/sites-available/proxy-balancer

# Редактируем домен
nano /etc/nginx/sites-available/proxy-balancer
# Измените: proxy-balancer.yourdomain.com на ваш домен

# Активируем конфиг
ln -s /etc/nginx/sites-available/proxy-balancer /etc/nginx/sites-enabled/

# SSL через Certbot
certbot --nginx -d proxy-balancer.yourdomain.com

# Проверяем и перезагружаем
nginx -t && systemctl reload nginx
```

### Без домена (только IP):

Панель будет доступна по адресу: `http://YOUR_SERVER_IP:9000`

## ✅ Шаг 5: Проверка работы

```bash
# Проверяем статус контейнера
docker-compose ps

# Проверяем API
curl http://localhost:9000/api/auth/check

# Тестируем SOCKS5
curl --socks5 127.0.0.1:7777 https://google.com -v
```

## 🔗 Шаг 6: Интеграция с Marzban

### Способ 1: Через панель Marzban

1. Откройте панель Marzban
2. Перейдите в настройки прокси
3. Добавьте: `socks5://127.0.0.1:7777`

### Способ 2: Через конфигурацию

Отредактируйте конфиг Xray в Marzban:

```json
{
  "outbounds": [
    {
      "tag": "proxy-balancer",
      "protocol": "socks",
      "settings": {
        "servers": [
          {
            "address": "127.0.0.1",
            "port": 7777
          }
        ]
      }
    }
  ]
}
```

## 📊 Использование

1. **Доступ к панели:**
   - С доменом: `https://proxy-balancer.yourdomain.com`
   - Без домена: `http://YOUR_IP:9000`

2. **Вход:** используйте логин/пароль из `.env`

3. **Добавление прокси:** через интерфейс нажмите "Добавить прокси"

4. **Мониторинг:** статистика обновляется каждые 5 секунд

5. **Prometheus метрики:** `http://YOUR_IP:9000/api/metrics`

## 🔄 Управление

```bash
# Просмотр логов
docker-compose logs -f

# Перезапуск
docker-compose restart

# Остановка
docker-compose stop

# Запуск
docker-compose start

# Обновление
docker-compose down
git pull  # если используете git
docker-compose build
docker-compose up -d
```

## 💾 Резервное копирование

```bash
# Ручной бэкап
cp data/proxy-balancer.db /backup/proxy-balancer-$(date +%Y%m%d).db

# Автоматический бэкап (cron)
crontab -e
# Добавьте строку:
0 3 * * * cp /opt/proxy-balancer/data/proxy-balancer.db /backup/proxy-balancer-$(date +\%Y\%m\%d).db
```

## 🔐 Безопасность

1. **Обязательно измените** `ADMIN_PASSWORD` в `.env`
2. **Используйте HTTPS** (через Nginx + Certbot)
3. **Порт 7777** доступен только localhost (уже настроено)
4. **Порт 9000** можно закрыть если используется Nginx:
   ```bash
   ufw deny 9000/tcp
   ufw allow 'Nginx Full'
   ```

## 🐛 Troubleshooting

### Порт занят:
```bash
netstat -tulpn | grep :7777
netstat -tulpn | grep :9000
# Остановите конфликтующий процесс или измените порт в .env
```

### Не работают прокси:
```bash
# Проверьте логи
docker-compose logs

# Тестируйте каждый прокси отдельно
docker-compose exec proxy-balancer node -e "
const socks = require('socks');
socks.SocksClient.createConnection({
  proxy: { host: 'PROXY_IP', port: PROXY_PORT, type: 5 },
  command: 'connect',
  destination: { host: 'google.com', port: 80 }
}).then(console.log).catch(console.error);
"
```

### База данных повреждена:
```bash
# Проверка
sqlite3 data/proxy-balancer.db "PRAGMA integrity_check;"

# Восстановление из бэкапа
cp /backup/proxy-balancer-YYYYMMDD.db data/proxy-balancer.db
docker-compose restart
```

## 📈 Мониторинг

### Grafana + Prometheus (опционально):

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'proxy-balancer'
    static_configs:
      - targets: ['localhost:9000']
    metrics_path: '/api/metrics'
```

### Простой мониторинг через cron:

```bash
# Создайте скрипт /opt/monitor-proxy-balancer.sh
#!/bin/bash
STATUS=$(curl -s http://localhost:9000/api/stats | jq -r '.overview.healthyProxies')
if [ "$STATUS" -eq 0 ]; then
  echo "⚠️ Нет здоровых прокси!" | mail -s "Proxy Balancer Alert" admin@example.com
fi

# Добавьте в cron (проверка каждые 5 минут)
*/5 * * * * /opt/monitor-proxy-balancer.sh
```

## 🎯 Быстрый старт (TL;DR)

```bash
# На локальной машине
cd d:\Desktop\proxy-balancer\client && npm run build && cd ..
tar -czf proxy-balancer.tar.gz server.js balancer.js database.js package.json docker-compose.yml Dockerfile .env.production nginx.conf client/
scp proxy-balancer.tar.gz root@49299:/root/

# На сервере
ssh root@49299
mkdir -p /opt/proxy-balancer && cd /opt/proxy-balancer
tar -xzf ~/proxy-balancer.tar.gz && rm ~/proxy-balancer.tar.gz
cp .env.production .env
nano .env  # Измените SESSION_SECRET, ADMIN_PASSWORD
docker network create marzban-network 2>/dev/null || true
docker-compose build && docker-compose up -d
docker-compose logs -f

# Готово! Доступ: http://YOUR_IP:9000
```

## 📞 Поддержка

- Логи: `docker-compose logs -f`
- Статус: `docker-compose ps`
- Статистика: `curl http://localhost:9000/api/stats`
- Health check: `curl http://localhost:9000/api/auth/check`
