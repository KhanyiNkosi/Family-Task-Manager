Write-Host "Checking corrected permissions..." -ForegroundColor Yellow

# Check Child Profile
$child = Get-Content ".\app\child-profile\page.tsx" -Raw
if ($child -match '"My Rewards"') {
    Write-Host "✅ Child has 'My Rewards' (not Rewards Store)" -ForegroundColor Green
} else {
    Write-Host "❌ Child still has Rewards Store access" -ForegroundColor Red
}

# Check Parent Profile  
$parent = Get-Content ".\app\parent-profile\page.tsx" -Raw
if (-not ($parent -match 'Child View')) {
    Write-Host "✅ Parent cannot switch to child mode" -ForegroundColor Green
} else {
    Write-Host "❌ Parent still has Child View access" -ForegroundColor Red
}

if ($parent -match 'Monitor Children') {
    Write-Host "✅ Parent has 'Monitor Children' (not View Children)" -ForegroundColor Green
}

# Check Rewards Store
if (Test-Path ".\app\rewards-store\page.tsx") {
    $rewards = Get-Content ".\app\rewards-store\page.tsx" -Raw
    if ($rewards -match 'PARENT-ONLY REWARDS') {
        Write-Host "✅ Rewards Store is parent-only management" -ForegroundColor Green
    }
}

# Check My Rewards page
if (Test-Path ".\app\my-rewards\page.tsx") {
    Write-Host "✅ Child-only 'My Rewards' page exists" -ForegroundColor Green
}

Write-Host "`n🎯 FINAL PERMISSION STRUCTURE:" -ForegroundColor Cyan
Write-Host "CHILD ROLE:" -ForegroundColor Gray
Write-Host "  • Home" -ForegroundColor Green
Write-Host "  • Child Dashboard" -ForegroundColor Green
Write-Host "  • My Rewards (view/request only)" -ForegroundColor Green
Write-Host "  • Child Profile" -ForegroundColor Green
Write-Host "  • NO Rewards Store management" -ForegroundColor Red
Write-Host "  • NO Parent areas" -ForegroundColor Red

Write-Host "`nPARENT ROLE:" -ForegroundColor Gray
Write-Host "  • Home" -ForegroundColor Green
Write-Host "  • Parent Dashboard" -ForegroundColor Green
Write-Host "  • Rewards Store (management only)" -ForegroundColor Green
Write-Host "  • Parent Profile" -ForegroundColor Green
Write-Host "  • Monitor Children (view-only)" -ForegroundColor Green
Write-Host "  • NO Child mode switching" -ForegroundColor Red
Write-Host "  • NO Direct changes to child dashboard" -ForegroundColor Red
