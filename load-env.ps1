# load-env.ps1 - Robust environment loader
param([switch]$Silent)

if (-not $Silent) {
    Write-Host "🚀 LOADING ENVIRONMENT VARIABLES" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Green
}

# Function to load .env file
function Load-EnvFile($path) {
    if (Test-Path $path) {
        if (-not $Silent) { Write-Host "📄 Loading $path" -ForegroundColor Cyan }
        
        Get-Content $path | ForEach-Object {
            $line = $_.Trim()
            # Skip comments and empty lines
            if ($line -and -not $line.StartsWith('#')) {
                if ($line -match "^([A-Za-z0-9_]+)=(.*)$") {
                    $key = $matches[1]
                    $value = $matches[2].Trim('"').Trim("'")
                    
                    # Set environment variable
                    [System.Environment]::SetEnvironmentVariable($key, $value, 'Process')
                    
                    if (-not $Silent) {
                        # Hide sensitive values
                        if ($key -match "KEY|SECRET|TOKEN|PASSWORD") {
                            Write-Host "  ✓ $key=[HIDDEN]" -ForegroundColor DarkGray
                        } else {
                            $displayValue = if ($value.Length -gt 40) { $value.Substring(0, 40) + "..." } else { $value }
                            Write-Host "  ✓ $key=$displayValue" -ForegroundColor DarkGray
                        }
                    }
                }
            }
        }
        return $true
    }
    return $false
}

# Load files in order
$loadedClient = Load-EnvFile ".env.local"
$loadedServer = Load-EnvFile ".env.server.local"

if (-not $Silent) {
    if ($loadedClient -or $loadedServer) {
        Write-Host "`n✅ Environment variables loaded" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️  No environment files found" -ForegroundColor Yellow
        Write-Host "   Create .env.local and .env.server.local" -ForegroundColor Gray
    }
    
    Write-Host "`n🔧 To use: npm run dev:env" -ForegroundColor Cyan
}
