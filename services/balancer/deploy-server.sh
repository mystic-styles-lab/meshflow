#!/bin/bash
set -e

# Создаем директорию
mkdir -p /opt/proxy-balancer
cd /opt/proxy-balancer

# Останавливаем старую версию
if [ -f docker-compose.yml ]; then
    echo "Остановка старой версии..."
    docker-compose down 2>/dev/null || true
    
    # Убиваем процессы на портах 7777 и 9000
    echo "Освобождение портов 7777 и 9000..."
    fuser -k 7777/tcp 2>/dev/null || true
    fuser -k 9000/tcp 2>/dev/null || true
    fuser -k 7778/tcp 2>/dev/null || true
    sleep 2
fi

# Делаем backup старой базы
if [ -f data/proxy-balancer.db ]; then
    echo "Создание backup базы данных..."
    cp data/proxy-balancer.db "data/proxy-balancer.db.backup-$(date +%Y%m%d-%H%M%S)"
fi

# Очищаем старые файлы (кроме data и logs)
echo "Очистка старых файлов..."
find . -maxdepth 1 -type f -not -name '*.db*' -not -name '*.log' -delete 2>/dev/null || true
rm -rf client node_modules 2>/dev/null || true

# Распаковываем новую версию
echo "Распаковка новой версии..."
tar -xzf /tmp/deploy.tar.gz -C /opt/proxy-balancer
rm /tmp/deploy.tar.gz

# Создаем директории
mkdir -p data logs

# Устанавливаем зависимости
echo "Установка зависимостей..."
npm install --production

# Запускаем через Docker
echo "Запуск приложения..."
fuser -k 7777/tcp 2>/dev/null || true
fuser -k 9000/tcp 2>/dev/null || true
fuser -k 7778/tcp 2>/dev/null || true
sleep 1
docker-compose up -d --build

# Показываем логи
echo ""
echo "Логи запуска:"
docker-compose logs | head -20
echo ""

# Ждем запуска
sleep 3

# Проверяем статус
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "Деплой успешно завершен!"
    echo "Панель управления: http://89.23.113.155:9000"
    echo "SOCKS5 балансировщик: socks5://127.0.0.1:7777"
    echo ""
    echo "Логи: docker-compose logs -f"
else
    echo ""
    echo "Ошибка запуска! Проверьте логи:"
    echo "  docker-compose logs"
fi
