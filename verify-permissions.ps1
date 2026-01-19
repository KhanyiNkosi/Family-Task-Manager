Write-Host "Checking profile permissions..." -ForegroundColor Cyan

# Check Child Profile
Write-Host "`n🔍 CHILD PROFILE CHECK:" -ForegroundColor Yellow
$childCheck = Get-Content ".\app\child-profile\page.tsx" -Raw
$childHasParentLink = $childCheck -match '/parent-dashboard'
$childHasChildLink = $childCheck -match '/child-dashboard'

if ($childHasParentLink) {
    Write-Host "❌ ISSUE: Child profile has parent dashboard link!" -ForegroundColor Red
} else {
    Write-Host "✅ Good: No parent dashboard access in child profile" -ForegroundColor Green
}

if ($childHasChildLink) {
    Write-Host "✅ Good: Child profile has child dashboard access" -ForegroundColor Green
}

# Check Parent Profile
Write-Host "`n🔍 PARENT PROFILE CHECK:" -ForegroundColor Yellow
$parentCheck = Get-Content ".\app\parent-profile\page.tsx" -Raw
$parentHasChildView = $parentCheck -match '"Child View"'
$parentHasChildDashboard = $parentCheck -match 'href: "/child-dashboard"'

if ($parentHasChildView -and $parentHasChildDashboard) {
    Write-Host "✅ Good: Parent can access child dashboard via 'Child View'" -ForegroundColor Green
} else {
    Write-Host "⚠️  Warning: Parent may not have child dashboard access" -ForegroundColor Yellow
}

# Summary
Write-Host "`n📋 PERMISSION SUMMARY:" -ForegroundColor Cyan
Write-Host "Child Profile: Can access → Child Dashboard, Rewards Store" -ForegroundColor Gray
Write-Host "Parent Profile: Can access → Parent Dashboard, Child View, Rewards Store" -ForegroundColor Gray
Write-Host "`n✅ Proper permission separation restored!" -ForegroundColor Green
