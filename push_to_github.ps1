# ====================================================
# GSCS Bank - GitHub Push Script
# Run this in PowerShell from the project folder
# ====================================================

$repoUrl = "https://github.com/gscsbank/gscsbank.git"
$branch  = "main"

Write-Host ""
Write-Host "===== GSCS Bank - GitHub Push Script =====" -ForegroundColor Cyan
Write-Host ""
Write-Host "GitHub Personal Access Token eka type karanna (screen eke pennenne ne):" -ForegroundColor Yellow
$tokenSecure = Read-Host -AsSecureString "GitHub Token"
$token = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($tokenSecure)
)

if (-not $token) {
    Write-Host "Token eka dunne ne! Script exit." -ForegroundColor Red
    exit 1
}

$authUrl = "https://$token@github.com/gscsbank/gscsbank.git"

Write-Host ""
Write-Host "Git repository initialize karanwa..." -ForegroundColor Cyan

# Init if not already
if (-not (Test-Path ".git")) {
    git init
    git remote add origin $authUrl
} else {
    # Update remote URL with token
    git remote set-url origin $authUrl
}

# Config
git config user.email "gscsbank@gmail.com"
git config user.name "GSCS Bank"

Write-Host "Files add karanwa..." -ForegroundColor Cyan
git branch -M main
git add js/admin.js js/store.js js/app.js js/api-config.js admin.html index.html google-apps-script/Code.gs

Write-Host "Commit karanwa..." -ForegroundColor Cyan
git commit -m "Fix: move checkAuth to end, fix TDZ variables, fix filter functions and cloud sync"

Write-Host "GitHub push karanwa ($branch)..." -ForegroundColor Cyan
git push -u origin main --force

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS! Push una! Live site ekata yanna tika welawak inna." -ForegroundColor Green
    Write-Host "Live: https://gscsbank.github.io/gscsbank/" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Push una ne. Token eka nethari da, nehe repo name eka check karanna." -ForegroundColor Red
}
