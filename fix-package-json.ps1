# fix-package-json.ps1 - Permanently fix package.json BOM
param([switch]$Force)

$filePath = "package.json"

if (-not (Test-Path $filePath)) {
    Write-Host "❌ $filePath not found" -ForegroundColor Red
    exit 1
}

Write-Host "🔧 Fixing $filePath..." -ForegroundColor Yellow

# Read current content
$content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)

# Check if it starts with BOM
$hasBom = $content[0] -eq [char]0xFEFF
$hasInvisible = $content.Length -gt 0 -and [char]::IsControl($content[0])

if ($hasBom -or $hasInvisible -or $Force) {
    # Remove all invisible characters from start
    $cleanContent = $content
    while ($cleanContent.Length -gt 0 -and ([char]::IsControl($cleanContent[0]) -or $cleanContent[0] -eq [char]0xFEFF)) {
        $cleanContent = $cleanContent.Substring(1)
    }
    
    # Try to parse as JSON
    try {
        $null = $cleanContent | ConvertFrom-Json
        Write-Host "✅ Content is valid JSON after cleaning" -ForegroundColor Green
        
        # Save without BOM
        [System.IO.File]::WriteAllText($filePath, $cleanContent, [System.Text.Encoding]::UTF8)
        Write-Host "✅ Saved cleaned $filePath" -ForegroundColor Green
        
    } catch {
        Write-Host "❌ Failed to parse JSON: $_" -ForegroundColor Red
        
        if ($Force) {
            Write-Host "🔄 Creating fresh package.json..." -ForegroundColor Yellow
            node emergency-fix.js
        }
    }
} else {
    Write-Host "✅ $filePath looks clean" -ForegroundColor Green
}

Write-Host "`n🚀 Testing Next.js..." -ForegroundColor Cyan
try {
    npx next --version
} catch {
    Write-Host "❌ Next.js still broken. Try:" -ForegroundColor Red
    Write-Host "   rm -rf node_modules package-lock.json && npm install" -ForegroundColor Yellow
}
