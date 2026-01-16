$ErrorActionPreference = "Stop"

Write-Host "Fixing UTF-8 encoding for all .tsx files..." -ForegroundColor Cyan

# Files to check and fix
$filesToCheck = Get-ChildItem -Path app, components -Recurse -Filter *.tsx

foreach ($file in $filesToCheck) {
    Write-Host "Processing: $($file.Name)"
    
    try {
        # Read the file content
        $content = Get-Content $file.FullName -Raw
        
        # Write back with UTF-8 encoding
        Set-Content $file.FullName $content -Encoding UTF8 -Force
        
        Write-Host "  ✓ Fixed encoding" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Error: $_" -ForegroundColor Red
    }
}

Write-Host "`n✅ All files have been converted to UTF-8" -ForegroundColor Green
Write-Host "Now run: npm run dev" -ForegroundColor Yellow
