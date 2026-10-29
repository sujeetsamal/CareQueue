# ==============================================================================
# CareQueue - Safe Stop Script for Windows PowerShell
# Gracefully stops backend (port 8080) and frontend (port 3000)
# Ignores PID 0 (System Idle) to prevent "Access is denied" errors
# ==============================================================================

Write-Host "Stopping CareQueue services..." -ForegroundColor Cyan

# 1. Stop process listening on port 8080 (Spring Boot Backend)
$backendConns = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.OwningProcess -gt 0 }
if ($backendConns) {
    foreach ($conn in $backendConns) {
        Write-Host "Stopping Backend process (PID: $($conn.OwningProcess))..." -ForegroundColor Yellow
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    }
} else {
    Write-Host "No process listening on port 8080." -ForegroundColor Gray
}

# 2. Stop process listening on port 3000 (Next.js Frontend)
$frontendConns = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.OwningProcess -gt 0 }
if ($frontendConns) {
    foreach ($conn in $frontendConns) {
        Write-Host "Stopping Frontend process (PID: $($conn.OwningProcess))..." -ForegroundColor Yellow
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    }
} else {
    Write-Host "No process listening on port 3000." -ForegroundColor Gray
}

Write-Host "CareQueue services stopped. Ports 8080 and 3000 are clean." -ForegroundColor Green
