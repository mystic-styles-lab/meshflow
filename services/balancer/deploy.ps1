# Скрипт деплоя на сервер 89.23.113.155
# Использование: .\deploy.ps1

$ErrorActionPreference = "Stop"

$SERVER = "89.23.113.155"
$USER = "root"
$APP_DIR = "/opt/proxy-balancer"

Write-Host "Начинаем деплой на $SERVER..." -ForegroundColor Green

# 1. Проверяем, что build существует
if (-not (Test-Path "client\build")) {
    Write-Host "Сборка React не найдена. Запускаем сборку..." -ForegroundColor Yellow
    cd client
    npm run build
    cd ..
}

# 2. Создаем временную директорию для деплоя
$tempDir = ".\deploy_temp"
if (Test-Path $tempDir) {
    Remove-Item -Recurse -Force $tempDir
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# 3. Копируем необходимые файлы
Write-Host "Подготовка файлов..." -ForegroundColor Cyan
Copy-Item "server.js" $tempDir
Copy-Item "balancer.js" $tempDir
Copy-Item "database.js" $tempDir
Copy-Item "package.json" $tempDir
Copy-Item ".env.production" "$tempDir\.env"
Copy-Item "Dockerfile" $tempDir
Copy-Item "docker-compose.yml" $tempDir
Copy-Item -Recurse "client\build" "$tempDir\client\build"
Copy-Item "deploy-server.sh" $tempDir

# 4. Создаем архив
Write-Host "Создание архива..." -ForegroundColor Cyan
$archivePath = ".\deploy.zip"
if (Test-Path $archivePath) {
    Remove-Item -Force $archivePath
}
Compress-Archive -Path "$tempDir\*" -DestinationPath $archivePath

# 5. Копируем на сервер
Write-Host "Копирование на сервер..." -ForegroundColor Cyan
scp $archivePath "${USER}@${SERVER}:/tmp/deploy.zip"
scp "deploy-server.sh" "${USER}@${SERVER}:/tmp/deploy-server.sh"

# 6. Подключаемся и разворачиваем
Write-Host "Установка на сервере..." -ForegroundColor Cyan

ssh "${USER}@${SERVER}" "bash /tmp/deploy-server.sh"

# 7. Очистка
Write-Host "Очистка временных файлов..." -ForegroundColor Cyan
Remove-Item -Recurse -Force $tempDir
Remove-Item -Force $archivePath

Write-Host ""
Write-Host "Деплой завершен!" -ForegroundColor Green
Write-Host "Панель: http://89.23.113.155:9000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Не забудьте на сервере:" -ForegroundColor Yellow
Write-Host "   1. Отредактировать /opt/proxy-balancer/.env" -ForegroundColor Yellow
Write-Host "   2. Установить SESSION_SECRET (openssl rand -base64 32)" -ForegroundColor Yellow
Write-Host "   3. Изменить ADMIN_PASSWORD" -ForegroundColor Yellow
Write-Host "   4. Перезапустить: docker-compose restart" -ForegroundColor Yellow
