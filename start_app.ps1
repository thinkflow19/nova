# Navigate to project root
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "Starting application..." -ForegroundColor Cyan

# Kill processes on ports if needed
Write-Host "Stopping existing processes..." -ForegroundColor Yellow
try {
    Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    Write-Host "Ports 3000 & 8000 cleared." -ForegroundColor Green
} catch {
    Write-Host "Warning: Could not check/stop existing processes: $_" -ForegroundColor Yellow
}

# Make sure frontend env file exists
if (-not (Test-Path "frontend/.env.local") -and (Test-Path ".env")) {
    Write-Host "Creating frontend/.env.local from .env" -ForegroundColor Cyan
    Copy-Item ".env" "frontend/.env.local" -ErrorAction SilentlyContinue
}

# Start backend server in a new cmd window
Write-Host "Starting backend server..." -ForegroundColor Cyan
$backendCommand = "cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
Start-Process -FilePath "cmd.exe" -ArgumentList "/k $backendCommand"
Write-Host "Backend starting in new window (http://localhost:8000)" -ForegroundColor Green

# Start frontend server (if possible) in a new cmd window
Write-Host "Attempting to start frontend server..." -ForegroundColor Cyan
# Check if node/npm likely exists by checking common install paths (optional but can provide better feedback)
$nodeExists = (Get-Command npm -ErrorAction SilentlyContinue) -or (Test-Path "$env:ProgramFiles\nodejs\npm.cmd") -or (Test-Path "$env:LOCALAPPDATA\Programs\nodejs\npm.cmd")

if ($nodeExists) {
    Write-Host "Node/NPM found or likely installed. Attempting frontend start." -ForegroundColor Green
    $frontendCommand = "cd frontend && npm install && npm run dev"
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k $frontendCommand"
    Write-Host "Frontend starting in new window (http://localhost:3000)" -ForegroundColor Green
} else {
    Write-Host "Could not reliably find npm. Please ensure Node.js is installed and in the PATH for cmd.exe." -ForegroundColor Yellow
    Write-Host "Frontend not started automatically." -ForegroundColor Yellow
}

Write-Host "Startup script finished." -ForegroundColor Green
Write-Host "Backend: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000 (if started successfully)" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan 