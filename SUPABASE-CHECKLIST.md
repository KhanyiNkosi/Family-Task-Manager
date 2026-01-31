# SUPABASE CONFIGURATION CHECKLIST
Write-Host "🔧 SUPABASE CONFIGURATION CHECKLIST" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan

Write-Host "`nOpen https://app.supabase.com and verify:" -ForegroundColor White

Write-Host "`n1. Project Settings → API:" -ForegroundColor Yellow
Write-Host "   • Project URL: https://eailwpyubcopzikpblep.supabase.co" -ForegroundColor Gray
Write-Host "   • anon public: Should be a LONG JWT token (400+ chars)" -ForegroundColor Gray
Write-Host "   • service_role: Keep this private" -ForegroundColor Gray

Write-Host "`n2. Authentication → Providers:" -ForegroundColor Yellow
Write-Host "   • Email provider: ENABLED" -ForegroundColor Green
Write-Host "   • Confirm email: ENABLED (for signup)" -ForegroundColor Green

Write-Host "`n3. Authentication → URL Configuration:" -ForegroundColor Yellow
Write-Host "   • Site URL: http://localhost:3000" -ForegroundColor Green
Write-Host "   • Redirect URLs: Add http://localhost:3000/api/auth/verify" -ForegroundColor Green
Write-Host "   • Additional Redirect URLs: https://family-task-manager-4pcm.vercel.app/api/auth/verify" -ForegroundColor Green

Write-Host "`n4. Test in your app:" -ForegroundColor Yellow
Write-Host "   • Run: npm run dev" -ForegroundColor White
Write-Host "   • Visit: http://localhost:3000/diagnostic" -ForegroundColor White
Write-Host "   • Click 'Run Diagnostics'" -ForegroundColor White

Write-Host "`n🔍 COMMON ISSUES:" -ForegroundColor Red
Write-Host "• Anon key truncated in .env.local" -ForegroundColor Yellow
Write-Host "• Site URL not set in Supabase" -ForegroundColor Yellow
Write-Host "• Email auth disabled" -ForegroundColor Yellow
Write-Host "• Redirect URLs not configured" -ForegroundColor Yellow

Write-Host "`n🔄 If you need to regenerate keys:" -ForegroundColor Cyan
Write-Host "• Go to Project Settings → API" -ForegroundColor White
Write-Host "• Click 'Regenerate' next to anon key" -ForegroundColor White
Write-Host "• Copy the NEW key to your .env.local" -ForegroundColor White
Write-Host "• Restart dev server" -ForegroundColor White
