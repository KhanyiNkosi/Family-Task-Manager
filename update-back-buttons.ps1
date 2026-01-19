# PowerShell script to add back buttons to all pages
Write-Host "=== ADDING BACK BUTTONS TO ALL PAGES ===" -ForegroundColor Cyan

$pages = Get-ChildItem -Path app -Recurse -Filter "page.tsx" -Depth 3

foreach ($page in $pages) {
    $pagePath = $page.FullName
    $relativePath = $pagePath.Substring($PWD.Path.Length + 1)
    
    Write-Host "`nChecking: $relativePath" -ForegroundColor Gray
    
    $content = Get-Content $pagePath -Raw
    
    # Skip if already has BackButton or is the landing page
    if ($content -match "BackButton" -or $relativePath -eq "app\page.tsx") {
        Write-Host "✓ Already has back button or is landing page" -ForegroundColor DarkGray
        continue
    }
    
    # Determine which back button to use based on content
    $backButtonType = "BackButton"
    if ($content -match "sidebar" -or $content -match "bg-\[#007A8C\]" -or $content -match "text-white") {
        $backButtonType = "SidebarBackButton"
        Write-Host "Using sidebar-style back button" -ForegroundColor Yellow
    }
    
    # Add import
    $updatedContent = $content -replace '("use client";\r?\n)', "`$1import $backButtonType from `"@/app/components/$backButtonType`";`n"
    
    # Try to find the best place to insert the back button
    if ($updatedContent -match '(return\s*\([\s\S]*?<div[^>]*class="[^"]*(min-h-screen|flex|bg-)[^"]*"[^>]*>)') {
        $positionClass = "absolute top-8 left-8"
        if ($backButtonType -eq "SidebarBackButton") {
            $positionClass = "mt-4 mb-6 px-4"
            # For sidebar, try to insert right after sidebar opening
            if ($updatedContent -match '(<aside[^>]*sidebar[^>]*>[\s\S]*?)(<nav|</div>)') {
                $updatedContent = $updatedContent -replace '(<aside[^>]*sidebar[^>]*>[\s\S]*?)(<nav|</div>)', "`$1`n        <div className=`"$positionClass`">`n          <$backButtonType />`n        </div>`n      `$2"
                Write-Host "✅ Added $backButtonType to sidebar" -ForegroundColor Green
            } else {
                # Fallback for sidebar pages without clear aside tag
                $updatedContent = $updatedContent -replace '(return\s*\([\s\S]*?<div[^>]*class="[^"]*(min-h-screen|flex|bg-)[^"]*"[^>]*>)', "`$1`n      <div className=`"$positionClass`"><$backButtonType /></div>"
                Write-Host "✅ Added $backButtonType" -ForegroundColor Green
            }
        } else {
            # Regular pages
            $updatedContent = $updatedContent -replace '(return\s*\([\s\S]*?<div[^>]*class="[^"]*(min-h-screen|flex|bg-)[^"]*"[^>]*>)', "`$1`n      <div className=`"$positionClass`"><$backButtonType /></div>"
            Write-Host "✅ Added $backButtonType" -ForegroundColor Green
        }
        
        $updatedContent | Out-File -FilePath $pagePath -Encoding UTF8 -Force
    } else {
        Write-Host "⚠ Could not find suitable position for back button" -ForegroundColor Red
    }
}

Write-Host "`n=== BACK BUTTON UPDATE COMPLETE ===" -ForegroundColor Green
Write-Host "All pages should now have themed back buttons!" -ForegroundColor Green
