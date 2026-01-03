$ErrorActionPreference = "Stop"

$SERVER = "89.23.113.155"
$USER = "root"
$PASSWORD = "Traplord999!"

Write-Host "Deploy to $SERVER..." -ForegroundColor Green

# Check build
if (-not (Test-Path "client\build")) {
    Write-Host "Building React app..." -ForegroundColor Yellow
    cd client
    npm run build
    cd ..
}

# Create temp directory
$tempDir = ".\deploy_temp"
if (Test-Path $tempDir) {
    Remove-Item -Recurse -Force $tempDir
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy files
Write-Host "Preparing files..." -ForegroundColor Cyan
Copy-Item "server.js" $tempDir
Copy-Item "balancer.js" $tempDir
Copy-Item "database.js" $tempDir
Copy-Item "package.json" $tempDir
Copy-Item ".env.production" "$tempDir\.env"
Copy-Item "Dockerfile" $tempDir
Copy-Item "docker-compose.yml" $tempDir
Copy-Item "deploy-server.sh" $tempDir
Copy-Item -Recurse "client\build" "$tempDir\client\build"

# Create archive
Write-Host "Creating archive..." -ForegroundColor Cyan
$archivePath = ".\deploy.tar.gz"
if (Test-Path $archivePath) {
    Remove-Item -Force $archivePath
}
tar -czf $archivePath -C $tempDir .

# Upload to server
Write-Host "Uploading to server..." -ForegroundColor Cyan
$env:SSHPASS = $PASSWORD
sshpass -e scp $archivePath "${USER}@${SERVER}:/tmp/deploy.tar.gz"
sshpass -e scp "deploy-server.sh" "${USER}@${SERVER}:/tmp/deploy-server.sh"

# Deploy on server
Write-Host "Installing on server..." -ForegroundColor Cyan
sshpass -e ssh "${USER}@${SERVER}" "bash /tmp/deploy-server.sh"

# Cleanup
Write-Host "Cleanup..." -ForegroundColor Cyan
Remove-Item -Recurse -Force $tempDir
Remove-Item -Force $archivePath

Write-Host ""
Write-Host "Deploy completed!" -ForegroundColor Green
Write-Host "Dashboard: http://89.23.113.155:9000" -ForegroundColor Cyan
Write-Host "SOCKS5: socks5://127.0.0.1:7777" -ForegroundColor Cyan
Write-Host ""
Write-Host "Remember to:" -ForegroundColor Yellow
Write-Host "  1. Edit /opt/proxy-balancer/.env on server" -ForegroundColor Yellow
Write-Host "  2. Set SESSION_SECRET and ADMIN_PASSWORD" -ForegroundColor Yellow
Write-Host "  3. Restart: docker-compose restart" -ForegroundColor Yellow
