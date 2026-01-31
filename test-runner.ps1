# test-runner.ps1 - Run E2E tests
Write-Host "🚀 E2E TEST RUNNER" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan

# Check environment variables
Write-Host "`n🔍 Checking environment..." -ForegroundColor White
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ .env.local not found" -ForegroundColor Red
    Write-Host "   Create .env.local with:" -ForegroundColor Yellow
    Write-Host "   NEXT_PUBLIC_SUPABASE_URL=your-url" -ForegroundColor White
    Write-Host "   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key" -ForegroundColor White
    Write-Host "   SUPABASE_SERVICE_ROLE_KEY=your-service-key" -ForegroundColor White
    Write-Host "   NEXT_PUBLIC_APP_URL=http://localhost:3000" -ForegroundColor White
    exit 1
}

# Start dev server in background
Write-Host "`n🌐 Starting dev server..." -ForegroundColor White
$devServer = Start-Process npm -ArgumentList "run", "dev" -PassThru -WindowStyle Hidden

# Wait for server to start
Write-Host "   Waiting 5 seconds for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

try {
    # Run tests
    Write-Host "`n🧪 Running E2E tests..." -ForegroundColor White
    npx playwright test
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ All tests passed!" -ForegroundColor Green
    } else {
        Write-Host "`n❌ Some tests failed" -ForegroundColor Red
    }
} finally {
    # Stop dev server
    Write-Host "`n🛑 Stopping dev server..." -ForegroundColor White
    Stop-Process -Id $devServer.Id -Force -ErrorAction SilentlyContinue
    
    # Run cleanup
    Write-Host "`n🧹 Running cleanup..." -ForegroundColor White
    try {
        node tests/cleanup.js
        Write-Host "   Cleanup completed" -ForegroundColor Green
    } catch {
        Write-Host "   Cleanup failed or not needed" -ForegroundColor Yellow
    }
}

Write-Host "`n📊 View test report:" -ForegroundColor Cyan
Write-Host "   npx playwright show-report" -ForegroundColor White
