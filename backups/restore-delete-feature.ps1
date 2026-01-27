# Quick restore script
Write-Host "Restoring from snapshot: parent-dashboard-with-delete-20260126-132748.tsx" -ForegroundColor Yellow
Copy-Item "backups\parent-dashboard-with-delete-20260126-132748.tsx" "app\parent-dashboard\page.tsx" -Force
Write-Host "✅ Restored successfully!" -ForegroundColor Green
