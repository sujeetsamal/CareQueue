# ==============================================================================
# CareQueue - Push to GitHub Script
# Target: https://github.com/sujeetsamal/CareQueue
# ==============================================================================

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Pushing CareQueue to GitHub              " -ForegroundColor Cyan
Write-Host " Target: git@github.com:sujeetsamal/CareQueue.git " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "CareQueue successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "Repository URL: https://github.com/sujeetsamal/CareQueue" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "Push failed because the repository has not been created on GitHub yet." -ForegroundColor Yellow
    Write-Host "Please create a new empty repository named 'CareQueue' at:" -ForegroundColor Yellow
    Write-Host "👉 https://github.com/new?name=CareQueue" -ForegroundColor Cyan
    Write-Host "(Do not check 'Add a README file')" -ForegroundColor Gray
    Write-Host "Once created, re-run this script: .\push-github.ps1" -ForegroundColor Yellow
}
