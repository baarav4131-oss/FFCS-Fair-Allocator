<#
.SYNOPSIS
    DA3 Q2(c) Automated Trivy Container Image & Dockerfile Security Scanner
    Implements the recommended docker save --input pipeline to bypass Windows named-pipe socket issues.
#>

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "             DA3 Q2(c) TRIVY CONTAINER SECURITY SCANNING PIPELINE               " -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan

# Step 1: Scan Before (Legacy node:20-alpine image)
Write-Host "`n[1/4] Building Legacy Docker Image (node:20-alpine, root user)..." -ForegroundColor Yellow
docker build -f backend/Dockerfile.legacy -t ffcs-backend:legacy ./backend

Write-Host "[2/4] Exporting image to tar archive for clean offline socket-free scanning..." -ForegroundColor Yellow
docker save ffcs-backend:legacy -o ffcs-backend-legacy.tar

Write-Host "Running Trivy Scan on Legacy Image (HIGH, CRITICAL)..." -ForegroundColor Red
trivy image --input ffcs-backend-legacy.tar --severity HIGH,CRITICAL

# Step 2: Scan Hardened (Node 24 Alpine, non-root node user, stripped package managers)
Write-Host "`n[3/4] Building Hardened Docker Image (node:24-alpine, USER node, stripped npm/yarn)..." -ForegroundColor Green
docker build -f backend/Dockerfile -t ffcs-backend:hardened ./backend

Write-Host "[4/4] Exporting hardened image to tar archive..." -ForegroundColor Green
docker save ffcs-backend:hardened -o ffcs-backend-hardened.tar

Write-Host "Running Trivy Scan on Hardened Image (HIGH, CRITICAL)..." -ForegroundColor Green
trivy image --input ffcs-backend-hardened.tar --severity HIGH,CRITICAL

Write-Host "`nScanning Dockerfile configuration with Trivy..." -ForegroundColor Cyan
trivy config backend/Dockerfile

Write-Host "`nCleaning up intermediate tar archives..." -ForegroundColor Cyan
Remove-Item -Force -ErrorAction SilentlyContinue ffcs-backend-legacy.tar, ffcs-backend-hardened.tar

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "Trivy scan comparison completed successfully!" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
