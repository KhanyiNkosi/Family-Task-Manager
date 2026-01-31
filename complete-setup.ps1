# complete-setup.ps1
Write-Host "🚀 COMPLETING YOUR SETUP" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green

Write-Host "`n📋 CURRENT STATUS:" -ForegroundColor Cyan
Write-Host "1. ✅ Environment files created" -ForegroundColor White
Write-Host "2. ✅ Gitignore updated" -ForegroundColor White
Write-Host "3. ✅ Package.json scripts added" -ForegroundColor White
Write-Host "4. ✅ Verification scripts created" -ForegroundColor White

Write-Host "`n🔧 WHAT YOU NEED TO DO:" -ForegroundColor Yellow
Write-Host "1. GET YOUR ANON KEY FROM SUPABASE:" -ForegroundColor White
Write-Host "   Go to: https://supabase.com/dashboard/project/eailwpyubcopzikpblep/settings/api" -ForegroundColor Gray
Write-Host "   Copy the 'anon public' key (starts with 'eyJ')" -ForegroundColor Gray

Write-Host "`n2. EDIT .env.local:" -ForegroundColor White
Write-Host "   Replace: NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." -ForegroundColor Gray
Write-Host "   With your actual key" -ForegroundColor Gray

Write-Host "`n3. TEST THE FIX:" -ForegroundColor White
Write-Host "   # Load environment and verify" -ForegroundColor Gray
Write-Host "   powershell -File load-env.ps1" -ForegroundColor Gray
Write-Host "   node test-register-fix.js" -ForegroundColor Gray

Write-Host "`n4. START YOUR APP:" -ForegroundColor White
Write-Host "   npm run dev:env" -ForegroundColor Gray

Write-Host "`n5. TEST REGISTER PAGE:" -ForegroundColor White
Write-Host "   Go to: http://localhost:3000/register" -ForegroundColor Gray
Write-Host "   It should work now!" -ForegroundColor Gray

Write-Host "`n🎯 Quick command to test everything:" -ForegroundColor Green
Write-Host "powershell -File load-env.ps1 && node test-register-fix.js && npm run dev:env" -ForegroundColor White
