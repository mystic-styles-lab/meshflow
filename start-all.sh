#!/bin/bash
# Скрипт для запуска Marzban и Proxy Balancer (Linux/Mac)

echo "🚀 Запуск Marzban и Proxy Balancer..."

# Запуск Proxy Balancer в фоновом режиме
echo "▶️ Запуск Proxy Balancer на порту 9000..."
cd ../proxy-balancer
node server.js &
BALANCER_PID=$!

# Возврат в директорию Marzban
cd ../Marzban-master

# Ждем немного, чтобы балансер успел запуститься
sleep 2

echo "▶️ Запуск Marzban на порту 8000..."
echo ""
echo "📍 Сервисы:"
echo "   • Marzban API:        http://127.0.0.1:8000"
echo "   • Proxy Balancer:    http://localhost:9000"
echo "   • Marzban Dashboard: http://localhost:3001/dashboard/"
echo ""
echo "⚠️  Для остановки нажмите Ctrl+C"
echo ""

# Функция для остановки балансера при завершении
cleanup() {
    echo ""
    echo "🛑 Остановка Proxy Balancer..."
    kill $BALANCER_PID 2>/dev/null
    echo "✅ Все сервисы остановлены"
    exit 0
}

# Регистрируем обработчик сигналов
trap cleanup SIGINT SIGTERM

# Запуск Marzban
python main.py

# Если Marzban завершился, останавливаем балансер
cleanup
