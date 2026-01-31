# run-e2e-tests.ps1 - Fixed version
Write-Host "?? E2E TEST RUNNER" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan

# Load environment variables from .env.local if it exists
if (Test-Path ".env.local") {
    Write-Host "`n?? Loading environment variables..." -ForegroundColor White
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match "^\s*([^#][^=]+)=(.*)$") {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
            Write-Host "   Loaded: $key" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "??  No .env.local file found" -ForegroundColor Yellow
}

# Check if dev server is running
Write-Host "`n?? Checking if dev server is running..." -ForegroundColor White
$isServerRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -ErrorAction Stop
    $isServerRunning = $true
    Write-Host "? Dev server is already running" -ForegroundColor Green
} catch {
    $isServerRunning = $false
    Write-Host "??  Dev server is not running" -ForegroundColor Yellow
}

# Start dev server if not running
if (-not $isServerRunning) {
    Write-Host "`n?? Starting dev server..." -ForegroundColor Yellow
    
    # Start dev server in background
    $devServer = Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev" `
        -NoNewWindow -PassThru -RedirectStandardOutput "dev-server.log" `
        -RedirectStandardError "dev-server-error.log"
    
    Write-Host "   Process ID: $($devServer.Id)" -ForegroundColor Gray
    Write-Host "   Waiting 15 seconds for server to start..." -ForegroundColor Gray
    
    # Wait for server to start
    $serverStarted = $false
    for ($i = 1; $i -le 15; $i++) {
        Write-Host "   ." -NoNewline -ForegroundColor Gray
        try {
            $null = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 1 -ErrorAction Stop
            $serverStarted = $true
            Write-Host "`n? Server started successfully!" -ForegroundColor Green
            break
        } catch {
            Start-Sleep -Seconds 1
        }
    }
    
    if (-not $serverStarted) {
        Write-Host "`n? Server failed to start within 15 seconds" -ForegroundColor Red
        Write-Host "   Check dev-server-error.log for details" -ForegroundColor Yellow
        
        # Show error log
        if (Test-Path "dev-server-error.log") {
            Write-Host "`n?? Error log:" -ForegroundColor Red
            Get-Content "dev-server-error.log" -Tail 10
        }
        
        if ($devServer) {
            Stop-Process -Id $devServer.Id -Force -ErrorAction SilentlyContinue
        }
        exit 1
    }
}

try {
    # Run verification test
    Write-Host "`n?? Running Playwright verification..." -ForegroundColor White
    npx playwright test tests/playwright-check.spec.js --reporter=line
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "? Playwright verification passed" -ForegroundColor Green
    } else {
        Write-Host "? Playwright verification failed" -ForegroundColor Red
        exit 1
    }
    
    # Run app smoke tests
    Write-Host "`n?? Running app smoke tests..." -ForegroundColor White
    npx playwright test tests/app-smoke.spec.js --reporter=line
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "? App smoke tests passed" -ForegroundColor Green
    } else {
        Write-Host "? App smoke tests failed" -ForegroundColor Red
    }
    
} finally {
    # Cleanup
    Write-Host "`n?? Cleaning up..." -ForegroundColor White
    
    # Run test cleanup
    try {
        Write-Host "   Running test user cleanup..." -ForegroundColor Gray
        node tests/cleanup.js
        Write-Host "   ? Cleanup completed" -ForegroundColor Green
    } catch {
        Write-Host "   ??  Cleanup failed: $_" -ForegroundColor Yellow
    }
    
    # Only stop dev server if we started it
    if ($devServer -and -not $isServerRunning) {
        Write-Host "`n?? Stopping dev server..." -ForegroundColor White
        Stop-Process -Id $devServer.Id -Force -ErrorAction SilentlyContinue
        Write-Host "   ? Dev server stopped" -ForegroundColor Green
    }
}

Write-Host "`n?? Test run completed!" -ForegroundColor Cyan
Write-Host "View detailed report: npx playwright show-report" -ForegroundColor White
Write-Host "Dev server logs: dev-server.log" -ForegroundColor White
Write-Host "Dev server errors: dev-server-error.log" -ForegroundColor White
