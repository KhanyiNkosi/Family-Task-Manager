# fix-supabase-env.ps1
Write-Host "🔧 FIXING SUPABASE ENVIRONMENT VARIABLES" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Check current .env.local
if (Test-Path .env.local) {
    Write-Host "`nCurrent .env.local contents:" -ForegroundColor Cyan
    Get-Content .env.local
} else {
    Write-Host "❌ No .env.local found" -ForegroundColor Red
}

# Create corrected .env.local
Write-Host "`n🎯 Creating corrected .env.local template..." -ForegroundColor Cyan
@"
# SUPABASE AUTH (Frontend - for register/login)
NEXT_PUBLIC_SUPABASE_URL=https://eailwpyubcopzikpblep.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=PASTE_YOUR_ANON_KEY_HERE

# SUPABASE SERVICE ROLE (Backend/Server-side)
SUPABASE_SERVICE_ROLE_KEY=PASTE_YOUR_SERVICE_ROLE_KEY_HERE

# DATABASE CONNECTIONS (For migrations, direct DB access)
# These are DIFFERENT from auth keys!
DATABASE_URL=postgresql://postgres.eailwpyubcopzikpblep:y6iboCsyH3aOYW1S@aws-1-eu-north-1.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres:y6iboCsyH3aOYW1S@db.eailwpyubcopzikpblep.supabase.co:5432/postgres
"@ | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host "✅ Created corrected .env.local" -ForegroundColor Green
Write-Host "`n⚠️  IMPORTANT: Replace PASTE_YOUR_ANON_KEY_HERE with actual key from:" -ForegroundColor Yellow
Write-Host "   https://supabase.com/dashboard/project/eailwpyubcopzikpblep/settings/api" -ForegroundColor White
