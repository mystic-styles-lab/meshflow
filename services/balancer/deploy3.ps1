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

# Use plink and pscp from PuTTY (if available)
# Set to $false to force using standard ssh/scp
$usePutty = $false  # Get-Command pscp.exe -ErrorAction SilentlyContinue

if ($usePutty) {
    Write-Host "Using PuTTY tools (pscp/plink)..." -ForegroundColor Yellow
    
    # Upload to server
    Write-Host "Uploading to server..." -ForegroundColor Cyan
    echo y | plink.exe -batch -pw $PASSWORD "${USER}@${SERVER}" "exit" 2>$null
    pscp.exe -batch -pw $PASSWORD $archivePath "${USER}@${SERVER}:/tmp/deploy.tar.gz"
    pscp.exe -batch -pw $PASSWORD "deploy-server.sh" "${USER}@${SERVER}:/tmp/deploy-server.sh"
    
    # Deploy on server
    Write-Host "Installing on server..." -ForegroundColor Cyan
    plink.exe -batch -pw $PASSWORD "${USER}@${SERVER}" "bash /tmp/deploy-server.sh"
} else {
    Write-Host "PuTTY not found. Using standard ssh/scp (will ask for password)..." -ForegroundColor Yellow
    
    # Upload to server
    Write-Host "Uploading to server..." -ForegroundColor Cyan
    scp $archivePath "${USER}@${SERVER}:/tmp/deploy.tar.gz"
    scp "deploy-server.sh" "${USER}@${SERVER}:/tmp/deploy-server.sh"
    
    # Deploy on server
    Write-Host "Installing on server..." -ForegroundColor Cyan
    ssh "${USER}@${SERVER}" "bash /tmp/deploy-server.sh"
}

# Cleanup
Write-Host "Cleanup..." -ForegroundColor Cyan
Remove-Item -Recurse -Force $tempDir
Remove-Item -Force $archivePath

Write-Host ""
Write-Host "Deploy completed!" -ForegroundColor Green
Write-Host "Dashboard: http://89.23.113.155:9000" -ForegroundColor Cyan
Write-Host "SOCKS5: socks5://127.0.0.1:7777" -ForegroundColor Cyan
