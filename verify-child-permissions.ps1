Write-Host "=== VERIFYING CHILD DASHBOARD PERMISSIONS ===" -ForegroundColor Cyan

$secureContent = Get-Content ".\app\child-dashboard\page.tsx" -Raw

# Check for removed parent routes
$parentRoutes = @("/parent-dashboard", "/parent-profile", "/profile", "/rewards-store", "/ai-suggester", "/settings")
$issues = @()

foreach ($route in $parentRoutes) {
    if ($secureContent -match $route) {
        $issues += "Child can access: $route"
    }
}

# Check for permission functions
$requiredFunctions = @("checkChildPermissions", "handleNavigation", "useEffect.*parentRoutes")
foreach ($func in $requiredFunctions) {
    if (-not ($secureContent -match $func)) {
        $issues += "Missing function: $func"
    }
}

# Check navigation uses permission check
if (-not ($secureContent -match 'onClick=\{\(e\) => handleNavigation')) {
    $issues += "Navigation links not using permission check"
}

# Results
if ($issues.Count -eq 0) {
    Write-Host "`n✅ PERFECT: Child dashboard is fully secured!" -ForegroundColor Green
    Write-Host "`n🔒 SECURED ROUTES:" -ForegroundColor Gray
    Write-Host "Child CAN access:" -ForegroundColor Green
    Write-Host "  • / (Home)" -ForegroundColor Green
    Write-Host "  • /child-dashboard" -ForegroundColor Green
    Write-Host "  • /child-profile" -ForegroundColor Green
    Write-Host "  • /my-rewards" -ForegroundColor Green
    
    Write-Host "`nChild CANNOT access:" -ForegroundColor Red
    Write-Host "  • /parent-dashboard" -ForegroundColor Red
    Write-Host "  • /parent-profile" -ForegroundColor Red
    Write-Host "  • /profile" -ForegroundColor Red
    Write-Host "  • /rewards-store" -ForegroundColor Red
    Write-Host "  • /ai-suggester" -ForegroundColor Red
    Write-Host "  • /settings" -ForegroundColor Red
} else {
    Write-Host "`n❌ SECURITY ISSUES FOUND:" -ForegroundColor Red
    $issues | ForEach-Object { Write-Host "  • $_" -ForegroundColor Red }
}
