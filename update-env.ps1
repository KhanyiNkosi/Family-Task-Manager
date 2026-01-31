# update-env.ps1 - Update your .env.local with real keys
Write-Host "🔧 UPDATING .env.local WITH REAL KEYS" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow

$envFile = ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ $envFile not found" -ForegroundColor Red
    exit 1
}

Write-Host "`nCurrent $envFile contents:" -ForegroundColor Cyan
Get-Content $envFile

Write-Host "`n📝 Paste your anon key below (press Enter twice when done):" -ForegroundColor Green
$anonKey = ""
while ($true) {
    $line = Read-Host
    if ([string]::IsNullOrWhiteSpace($line)) {
        if (-not [string]::IsNullOrWhiteSpace($anonKey)) {
            break
        }
    } else {
        $anonKey = $line.Trim()
    }
}

if ($anonKey -notmatch "^eyJ") {
    Write-Host "⚠️  Warning: This doesn't look like a JWT token (should start with 'eyJ')" -ForegroundColor Yellow
    $confirm = Read-Host "Continue anyway? (y/n)"
    if ($confirm -ne 'y') {
        Write-Host "Cancelled" -ForegroundColor Red
        exit 0
    }
}

# Update the file
$content = Get-Content $envFile -Raw
$updatedContent = $content -replace "NEXT_PUBLIC_SUPABASE_ANON_KEY=.*", "NEXT_PUBLIC_SUPABASE_ANON_KEY=$anonKey"

if ($content -eq $updatedContent) {
    # Line not found, add it
    $updatedContent = $content + "`nNEXT_PUBLIC_SUPABASE_ANON_KEY=$anonKey"
}

$updatedContent | Out-File -FilePath $envFile -Encoding UTF8

Write-Host "`n✅ Updated $envFile with your anon key" -ForegroundColor Green
Write-Host "`n🔧 Next steps:" -ForegroundColor Cyan
Write-Host "1. Restart your dev server: npm run dev:env" -ForegroundColor White
Write-Host "2. Test your register page: http://localhost:3000/register" -ForegroundColor White
