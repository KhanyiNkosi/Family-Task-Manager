# VERCEL DEPLOYMENT INSTRUCTIONS
Write-Host "🚀 VERCEL DEPLOYMENT SETUP" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

Write-Host "`n1. Push your code to GitHub/GitLab:" -ForegroundColor White
Write-Host "   git add ." -ForegroundColor Yellow
Write-Host "   git commit -m 'Setup Supabase SSR migration'" -ForegroundColor Yellow
Write-Host "   git push origin main" -ForegroundColor Yellow

Write-Host "`n2. Import your project in Vercel:" -ForegroundColor White
Write-Host "   - Go to: https://vercel.com/new" -ForegroundColor White
Write-Host "   - Import your Git repository" -ForegroundColor White

Write-Host "`n3. Set these Environment Variables in Vercel:" -ForegroundColor White
Write-Host "   Project Settings → Environment Variables" -ForegroundColor Yellow
Write-Host "   " -ForegroundColor Yellow
Write-Host "   ✅ Add these variables:" -ForegroundColor Green
Write-Host "   - NEXT_PUBLIC_SUPABASE_URL = https://your-project-ref.supabase.co" -ForegroundColor White
Write-Host "   - NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key-here" -ForegroundColor White
Write-Host "   - SUPABASE_SERVICE_ROLE_KEY = your-service-role-key-here" -ForegroundColor White
Write-Host "   - NEXT_PUBLIC_APP_URL = https://family-task-manager-4pcm.vercel.app" -ForegroundColor White

Write-Host "`n4. For Preview/Development branches:" -ForegroundColor White
Write-Host "   - Vercel will automatically set VERCEL_URL" -ForegroundColor White
Write-Host "   - Our code will use: https://${VERCEL_URL}" -ForegroundColor White

Write-Host "`n5. Deploy!" -ForegroundColor White
Write-Host "   - Vercel will auto-deploy when you push to main" -ForegroundColor White
Write-Host "   - For manual deploy: Click 'Deploy' in Vercel dashboard" -ForegroundColor White

Write-Host "`n🌐 Your production URL will be:" -ForegroundColor Cyan
Write-Host "   https://family-task-manager-4pcm.vercel.app" -ForegroundColor Green

Write-Host "`n🔧 Local development:" -ForegroundColor Cyan
Write-Host "   - Use .env.local for local variables" -ForegroundColor White
Write-Host "   - NEXT_PUBLIC_APP_URL = http://localhost:3000" -ForegroundColor White
Write-Host "   - Run: npm run dev" -ForegroundColor White
