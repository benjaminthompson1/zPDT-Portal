# zADE Portal Build Script
# Creates WAR file for deployment to IBM Liberty on z/OS

$ErrorActionPreference = "Stop"

Write-Host "`n=== zADE Portal Build Script ===" -ForegroundColor Cyan
Write-Host "Building WAR file for Liberty deployment`n" -ForegroundColor Cyan

# Configuration
$WarFileName = "zADE-Portal.war"
$Version = Get-Date -Format "yyyyMMdd-HHmmss"
$VersionedWarFileName = "zADE-Portal-$Version.war"

# Clean old WAR files
Write-Host "Cleaning old WAR files..." -ForegroundColor Yellow
if (Test-Path $WarFileName) {
    Remove-Item $WarFileName
    Write-Host "  Removed: $WarFileName" -ForegroundColor Gray
}

# Verify required files exist
Write-Host "`nVerifying required files..." -ForegroundColor Yellow
$RequiredFiles = @(
    "index.html",
    "assets/css/main.css",
    "assets/js/main.js",
    "WEB-INF/web.xml"
)

$AllFilesExist = $true
foreach ($file in $RequiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file (MISSING)" -ForegroundColor Red
        $AllFilesExist = $false
    }
}

if (-not $AllFilesExist) {
    Write-Host "`n✗ Build failed: Required files are missing" -ForegroundColor Red
    exit 1
}

# Create WAR file
Write-Host "`nCreating WAR file..." -ForegroundColor Yellow
try {
    Compress-Archive -Path index.html, assets\*, WEB-INF\* -DestinationPath $WarFileName -Force
    Write-Host "  ✓ WAR created: $WarFileName" -ForegroundColor Green
} catch {
    Write-Host "  ✗ WAR creation failed: $_" -ForegroundColor Red
    exit 1
}

# Verify WAR was created
if (Test-Path $WarFileName) {
    $WarSize = (Get-Item $WarFileName).Length
    $WarSizeKB = [math]::Round($WarSize / 1KB, 2)
    Write-Host "  Size: $WarSizeKB KB" -ForegroundColor Gray
    
    # Create versioned copy for backup
    Copy-Item $WarFileName $VersionedWarFileName
    Write-Host "  ✓ Versioned backup: $VersionedWarFileName" -ForegroundColor Green
} else {
    Write-Host "`n✗ WAR file was not created" -ForegroundColor Red
    exit 1
}

# Display deployment instructions
Write-Host "`n=== Deployment Instructions ===" -ForegroundColor Cyan
Write-Host "1. Transfer $WarFileName to z/OS in BINARY mode:" -ForegroundColor White
Write-Host "   ftp s0w1.dal-ebis.ihost.com" -ForegroundColor Gray
Write-Host "   ftp> binary" -ForegroundColor Gray
Write-Host "   ftp> cd /global/wlpCfg/servers/wlps01a/dropins" -ForegroundColor Gray
Write-Host "   ftp> put $WarFileName" -ForegroundColor Gray
Write-Host "   ftp> quit" -ForegroundColor Gray
Write-Host "`n2. Liberty will auto-deploy the WAR" -ForegroundColor White
Write-Host "`n3. Verify at: https://zade.mainframehome.net/zADE-Portal/" -ForegroundColor White

Write-Host "`n✓ Build completed successfully!`n" -ForegroundColor Green

# Made with Bob
