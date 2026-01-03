#!/bin/bash

# Скрипт деплоя на сервер 89.23.113.155
# Использование: ./deploy.sh

set -e

SERVER="89.23.113.155"
USER="root"
APP_DIR="/opt/proxy-balancer"

echo "🚀 Начинаем деплой на $SERVER..."

# 1. Собираем React приложение
echo "📦 Сборка React приложения..."
cd client
npm run build
cd ..

# 2. Создаем архив
echo "📦 Создание архива..."
tar -czf deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='client/node_modules' \
  --exclude='client/src' \
  --exclude='client/public' \
  --exclude='.git' \
  --exclude='data/*.db' \
  --exclude='*.log' \
  server.js \
  balancer.js \
  database.js \
  package.json \
  .env.production \
  client/build \
  Dockerfile \
  docker-compose.yml

# 3. Копируем на сервер
echo "📤 Копирование на сервер..."
scp deploy.tar.gz $USER@$SERVER:/tmp/

# 4. Подключаемся и разворачиваем
echo "🔧 Установка на сервере..."
ssh $USER@$SERVER << 'ENDSSH'
  set -e
  
  # Создаем директорию
  mkdir -p /opt/proxy-balancer
  cd /opt/proxy-balancer
  
  # Останавливаем старую версию
  if [ -f docker-compose.yml ]; then
    docker-compose down || true
  fi
  
  # Распаковываем
  tar -xzf /tmp/deploy.tar.gz -C /opt/proxy-balancer
  rm /tmp/deploy.tar.gz
  
  # Устанавливаем зависимости
  npm install --production
  
  # Создаем директории
  mkdir -p data logs
  
  # Копируем .env если не существует
  if [ ! -f .env ]; then
    cp .env.production .env
    echo "⚠️  ВНИМАНИЕ: Отредактируйте .env и задайте SESSION_SECRET и пароль администратора!"
  fi
  
  # Запускаем через Docker
  docker-compose up -d --build
  
  echo "✅ Деплой завершен!"
  echo "📊 Панель управления: http://89.23.113.155:9000"
  echo "🔌 SOCKS5 балансировщик: socks5://127.0.0.1:7777"
ENDSSH

# 5. Очистка
rm deploy.tar.gz

echo ""
echo "✅ Деплой успешно завершен!"
echo "📊 Панель: http://89.23.113.155:9000"
echo ""
echo "⚠️  Не забудьте:"
echo "   1. SSH на сервер и отредактировать /opt/proxy-balancer/.env"
echo "   2. Установить SESSION_SECRET и пароль администратора"
echo "   3. Перезапустить: docker-compose restart"
