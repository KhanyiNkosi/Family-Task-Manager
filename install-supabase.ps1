# install-supabase.ps1 - Install required packages
Write-Host "📦 Installing Supabase packages..." -ForegroundColor Yellow

# Install main packages
npm install @supabase/supabase-js

# Optional: Install SSR package if needed
# npm install @supabase/ssr

Write-Host "✅ Packages installed" -ForegroundColor Green
Write-Host "`n🎯 Next steps:" -ForegroundColor Cyan
Write-Host "1. Make sure .env.local has:" -ForegroundColor White
Write-Host "   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co" -ForegroundColor Gray
Write-Host "   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb... (JWT token)" -ForegroundColor Gray
Write-Host "2. Update your register page to use the new client" -ForegroundColor White
Write-Host "3. Run: npm run dev:env" -ForegroundColor White
