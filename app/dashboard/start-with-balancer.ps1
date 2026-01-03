# Скрипт для одновременного запуска Dashboard и Proxy Balancer

Write-Host "🚀 Запуск Marzban Dashboard и Proxy Balancer..." -ForegroundColor Cyan
Write-Host ""

# Функция для запуска процесса в новом окне
function Start-ServiceInNewWindow {
    param(
        [string]$Title,
        [string]$Command,
        [string]$WorkingDirectory
    )
    
    $encodedCommand = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($Command))
    
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-EncodedCommand", $encodedCommand,
        "-WorkingDirectory", $WorkingDirectory
    ) -WindowStyle Normal
}

# Запуск Proxy Balancer
Write-Host "▶️  Запуск Proxy Balancer..." -ForegroundColor Yellow
$balancerCommand = @"
Set-Location 'D:\Desktop\proxy-balancer'
Write-Host '🔧 Proxy Balancer' -ForegroundColor Green
Write-Host '   API: http://localhost:9000' -ForegroundColor White
Write-Host '   SOCKS5: 127.0.0.1:7777' -ForegroundColor White
Write-Host ''
node server.js
"@

Start-ServiceInNewWindow -Title "Proxy Balancer" -Command $balancerCommand -WorkingDirectory "D:\Desktop\proxy-balancer"

# Небольшая пауза
Start-Sleep -Seconds 2

# Запуск Dashboard
Write-Host "▶️  Запуск Marzban Dashboard..." -ForegroundColor Yellow
$dashboardCommand = @"
Set-Location 'D:\Desktop\Marzban-master\app\dashboard'
Write-Host '🎨 Marzban Dashboard' -ForegroundColor Blue
Write-Host '   URL: http://localhost:3001/dashboard/' -ForegroundColor White
Write-Host ''
npm run dev
"@

Start-ServiceInNewWindow -Title "Marzban Dashboard" -Command $dashboardCommand -WorkingDirectory "D:\Desktop\Marzban-master\app\dashboard"

Write-Host ""
Write-Host "✅ Сервисы запущены в отдельных окнах" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Адреса сервисов:" -ForegroundColor Cyan
Write-Host "   • Dashboard:      http://localhost:3001/dashboard/" -ForegroundColor White
Write-Host "   • Proxy Balancer: http://localhost:9000" -ForegroundColor White
Write-Host "   • SOCKS5 Proxy:   127.0.0.1:7777" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Закройте окна терминалов для остановки сервисов" -ForegroundColor Yellow
Write-Host ""

# Ждем нажатия клавиши
Write-Host "Нажмите любую клавишу для выхода..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
