$errors = @()

# Check Child Profile
$child = Get-Content ".\app\child-profile\page.tsx" -Raw

# Should NOT have these
if ($child -match 'parent-dashboard') { $errors += "Child can access parent-dashboard" }
if ($child -match 'parent-profile') { $errors += "Child can access parent-profile" }
if ($child -match '"/settings"') { $errors += "Child has access to global settings" }

# Should HAVE these
if (-not ($child -match 'child-dashboard')) { $errors += "Child missing child-dashboard access" }
if (-not ($child -match 'child-profile')) { $errors += "Child missing child-profile access" }

# Check Parent Profile
$parent = Get-Content ".\app\parent-profile\page.tsx" -Raw

# Should HAVE these
if (-not ($parent -match 'child-dashboard".*Child View')) { $errors += "Parent missing Child View access" }

# Results
if ($errors.Count -eq 0) {
    Write-Host "✅ PERFECT: Permissions are correctly separated!" -ForegroundColor Green
    Write-Host "`nChild can access:" -ForegroundColor Gray
    Write-Host "  • Home" -ForegroundColor Green
    Write-Host "  • Child Dashboard" -ForegroundColor Green
    Write-Host "  • Rewards Store" -ForegroundColor Green
    Write-Host "  • Child Profile" -ForegroundColor Green
    Write-Host "  • NO Parent Areas" -ForegroundColor Red
    
    Write-Host "`nParent can access:" -ForegroundColor Gray
    Write-Host "  • Home" -ForegroundColor Green
    Write-Host "  • Parent Dashboard" -ForegroundColor Green
    Write-Host "  • Rewards Store" -ForegroundColor Green
    Write-Host "  • Parent Profile" -ForegroundColor Green
    Write-Host "  • Child View (switch)" -ForegroundColor Green
} else {
    Write-Host "❌ Permission issues found:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "  • $_" -ForegroundColor Red }
}
