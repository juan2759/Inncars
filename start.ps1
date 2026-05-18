# Automotora - Script de inicio
# Ejecutar con: powershell -ExecutionPolicy Bypass -File start.ps1

Write-Host "=== Automotora - Sistema de Gestion ===" -ForegroundColor Cyan
Write-Host ""

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# ── Detectar Python ──────────────────────────────────────────────────────────
$pythonExe = $null
$candidates = @(
    (Get-Command "python" -ErrorAction SilentlyContinue)?.Source,
    (Get-Command "python3" -ErrorAction SilentlyContinue)?.Source,
    "$env:LOCALAPPDATA\Programs\Python\Python313\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python310\python.exe",
    "C:\Python313\python.exe",
    "C:\Python312\python.exe",
    "C:\Python311\python.exe"
)
foreach ($c in $candidates) {
    if ($c -and (Test-Path $c -ErrorAction SilentlyContinue)) {
        # Verify it's a real Python (not Windows Store stub)
        $ver = & $c --version 2>&1
        if ($ver -match "Python 3\.[89]|Python 3\.1[0-9]") {
            $pythonExe = $c
            Write-Host "Python encontrado: $ver ($c)" -ForegroundColor Green
            break
        }
    }
}

if (-not $pythonExe) {
    Write-Host "ERROR: Python 3.10+ no encontrado." -ForegroundColor Red
    Write-Host ""
    Write-Host "Instala Python desde: https://www.python.org/downloads/" -ForegroundColor Yellow
    Write-Host "Importante: marca 'Add Python to PATH' durante la instalacion." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternativa rapida (winget):" -ForegroundColor Cyan
    Write-Host "  winget install Python.Python.3.12" -ForegroundColor White
    Write-Host ""
    pause
    exit 1
}

# ── Verificar Node ───────────────────────────────────────────────────────────
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host "ERROR: Node.js no encontrado." -ForegroundColor Red
    Write-Host "Instala desde: https://nodejs.org  o  winget install OpenJS.NodeJS.LTS" -ForegroundColor Yellow
    pause
    exit 1
}
Write-Host "Node.js: $(node --version)" -ForegroundColor Green

# ── Setup backend virtualenv ─────────────────────────────────────────────────
$venv = Join-Path $root "backend\venv"
if (-not (Test-Path $venv)) {
    Write-Host "Creando entorno virtual Python..." -ForegroundColor Yellow
    & $pythonExe -m venv $venv
}

$pip      = Join-Path $venv "Scripts\pip.exe"
$uvicorn  = Join-Path $venv "Scripts\uvicorn.exe"

Write-Host "Instalando dependencias del backend..." -ForegroundColor Yellow
& $pip install -r "$root\backend\requirements.txt" -q --no-warn-script-location

# ── Setup frontend ───────────────────────────────────────────────────────────
$nodeModules = Join-Path $root "frontend\node_modules"
if (-not (Test-Path $nodeModules)) {
    Write-Host "Instalando dependencias del frontend..." -ForegroundColor Yellow
    Push-Location "$root\frontend"
    npm install --silent
    Pop-Location
}

# ── Iniciar ──────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Iniciando servidores..." -ForegroundColor Green
Write-Host "  Backend API: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "  Frontend:    http://localhost:5173" -ForegroundColor Cyan
Write-Host "  Usuario:     admin  /  Contrasena: admin123" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona Ctrl+C para detener" -ForegroundColor Gray

# Start backend in a new window
$backendCmd = "cd '$root\backend'; & '$uvicorn' app.main:app --host 0.0.0.0 --port 8000 --reload"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd -WindowStyle Normal

# Start frontend in a new window
$frontendCmd = "cd '$root\frontend'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd -WindowStyle Normal

# Open browser after short delay
Start-Sleep -Seconds 5
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "Ambos servidores iniciados en ventanas separadas." -ForegroundColor Green
Write-Host "Cierra las ventanas de PowerShell para detener los servidores." -ForegroundColor Gray
