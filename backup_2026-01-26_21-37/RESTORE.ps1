# RESTORE SCRIPT
# Run this to restore from backup

param(
    [string]$BackupFolder = ".\backup_2026-01-26_21-37"
)

Write-Host "=== RESTORING FROM BACKUP ===" -ForegroundColor Cyan

if (-not (Test-Path $BackupFolder)) {
    Write-Host "❌ Backup folder not found: $BackupFolder" -ForegroundColor Red
    exit 1
}

# Restore critical files
$files = Get-ChildItem $BackupFolder -File | Where-Object { $_.Extension -in @('.tsx', '.js', '.json', '.jsx') }
foreach ($file in $files) {
    Copy-Item $file.FullName ".\$($file.Name)" -Force
    Write-Host "✅ Restored: $($file.Name)" -ForegroundColor Gray
}

# Restore app directory if it exists
$appBackup = Join-Path $BackupFolder "app"
if (Test-Path $appBackup) {
    Remove-Item ".\app" -Recurse -Force -ErrorAction SilentlyContinue
    Copy-Item $appBackup ".\app" -Recurse -Force
    Write-Host "✅ Restored /app directory" -ForegroundColor Green
}

Write-Host "`n✅ RESTORE COMPLETE!" -ForegroundColor Green
Write-Host "Run 'npm run dev' to start the development server" -ForegroundColor Yellow
