$venvPath = "venv_marzban"
if (-not (Test-Path $venvPath)) {
    Write-Host "Creating venv..."
    python -m venv $venvPath
}

Write-Host "Installing requirements..."
& ".\$venvPath\Scripts\pip" install -r requirements.txt

Write-Host "Running migrations..."
& ".\$venvPath\Scripts\alembic" upgrade head
