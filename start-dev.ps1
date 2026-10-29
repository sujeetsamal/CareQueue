# ==============================================================================
# CareQueue - Startup Script for Windows PowerShell
# Starts Spring Boot Backend (Port 8080) and Next.js Frontend (Port 3000)
# ==============================================================================

$ProjectRoot = $PSScriptRoot

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " CareQueue — Hospital Queue Management    " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Start Backend in separate window
Write-Host "[1/2] Starting Spring Boot Java Backend on http://localhost:8080..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectRoot\backend'; .\mvnw.cmd spring-boot:run"

# 2. Wait 5 seconds for backend initialization
Start-Sleep -Seconds 5

# 3. Start Frontend in separate window
Write-Host "[2/2] Starting Next.js Frontend on http://localhost:3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectRoot\frontend'; npm run dev"

Write-Host ""
Write-Host "Both services are starting in dedicated terminal windows!" -ForegroundColor Green
Write-Host "- Dashboard URL: http://localhost:3000" -ForegroundColor Cyan
Write-Host "- Health API:    http://localhost:8080/api/health" -ForegroundColor Cyan
Write-Host "Run .\stop-dev.ps1 anytime to stop all services." -ForegroundColor Gray
