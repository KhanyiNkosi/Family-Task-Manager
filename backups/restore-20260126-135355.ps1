# ============================================
# FAMILYTASK RESTORE SCRIPT
# Backup: 20260126-135355
# ============================================
Write-Host "🎮 RESTORING FROM BACKUP: 20260126-135355" -ForegroundColor Magenta
Write-Host "="*50 -ForegroundColor Cyan

$backupFiles = @(
    @{Source="parent-dashboard.page.tsx.20260126-135355.backup"; Destination="app/parent-dashboard/page.tsx"},
    @{Source="settings.page.tsx.20260126-135355.backup"; Destination="app/settings/page.tsx"},
    @{Source="parent-profile.page.tsx.20260126-135355.backup"; Destination="app/parent-profile/page.tsx"}
)

foreach ($file in $backupFiles) {
    $source = "backups/$($file.Source)"
    $dest = $file.Destination
    
    if (Test-Path $source) {
        Copy-Item $source $dest -Force
        Write-Host "✅ Restored: $($file.Destination)" -ForegroundColor Green
    } else {
        Write-Host "❌ Backup not found: $source" -ForegroundColor Red
    }
}

Write-Host "
🎉 RESTORE COMPLETE!" -ForegroundColor Green
Write-Host "Restart dev server: npm run dev" -ForegroundColor Cyan
