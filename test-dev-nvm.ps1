# test-dev-nvm.ps1 - Fixed for nvm4w
Write-Host "🧪 Testing dev server with nvm4w..." -ForegroundColor Cyan

# Clear port 3000
Write-Host "🛑 Clearing port 3000..." -ForegroundColor Yellow
$portProcess = netstat -ano | findstr ":3000.*LISTENING"
if ($portProcess) {
    $pidMatch = $portProcess -replace '.*\s+(\d+)$', '$1'
    Write-Host "   Found PID $pidMatch on port 3000" -ForegroundColor Yellow
    taskkill /F /PID $pidMatch 2>$null | Out-Null
    Start-Sleep -Seconds 2
}

# Start dev server using npm.cmd
Write-Host "`n🚀 Starting dev server with npm.cmd..." -ForegroundColor Green
Write-Host "   Press Ctrl+C to stop when server is running" -ForegroundColor Gray
Write-Host "`n" + ("-"*60) -ForegroundColor DarkGray

# This will run in foreground
npm.cmd run dev
