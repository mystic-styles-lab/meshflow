# Скрипт для запуска Marzban и Proxy Balancer

Write-Host "🚀 Запуск Marzban и Proxy Balancer..." -ForegroundColor Cyan

# Запуск Proxy Balancer в фоновом режиме
Write-Host "▶️ Запуск Proxy Balancer на порту 9000..." -ForegroundColor Yellow
$balancerJob = Start-Job -ScriptBlock {
    Set-Location "D:\Desktop\proxy-balancer"
    node server.js
}

# Ждем немного, чтобы балансер успел запуститься
Start-Sleep -Seconds 2

# Запуск Marzban
Write-Host "▶️ Запуск Marzban на порту 8000..." -ForegroundColor Yellow
Write-Host ""
Write-Host "📍 Сервисы:" -ForegroundColor Green
Write-Host "   • Marzban API:        http://127.0.0.1:8000" -ForegroundColor White
Write-Host "   • Proxy Balancer:    http://localhost:9000" -ForegroundColor White
Write-Host "   • Marzban Dashboard: http://localhost:3001/dashboard/" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Для остановки нажмите Ctrl+C" -ForegroundColor Red
Write-Host ""

try {
    python main.py
} finally {
    # При завершении Marzban останавливаем балансер
    Write-Host ""
    Write-Host "🛑 Остановка Proxy Balancer..." -ForegroundColor Yellow
    Stop-Job -Job $balancerJob
    Remove-Job -Job $balancerJob
    Write-Host "✅ Все сервисы остановлены" -ForegroundColor Green
}
