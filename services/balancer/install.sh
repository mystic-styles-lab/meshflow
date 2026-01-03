#!/bin/bash

# Скрипт для быстрой установки на сервере

echo "🚀 Установка Marzban Proxy Balancer..."

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Устанавливаем..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "✓ Node.js версия: $(node --version)"

# Установка зависимостей
echo "📦 Установка зависимостей..."
npm install

cd client
npm install
echo "🔨 Сборка фронтенда..."
npm run build
cd ..

# Создание .env если не существует
if [ ! -f .env ]; then
    echo "📝 Создание .env файла..."
    cp .env.example .env
    
    # Генерация случайного SECRET
    SECRET=$(openssl rand -hex 32)
    sed -i "s/change_this_secret_key_in_production/$SECRET/" .env
    
    echo "⚠️  ВАЖНО: Измените ADMIN_PASSWORD в файле .env!"
fi

# Создание директории для данных
mkdir -p data

echo ""
echo "✅ Установка завершена!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Отредактируйте .env файл: nano .env"
echo "2. Запустите: npm start"
echo "   ИЛИ создайте systemd service (см. INSTALL.md)"
echo ""
echo "🌐 После запуска панель будет доступна на порту 9000"
echo "🔐 Логин по умолчанию: admin / admin"
