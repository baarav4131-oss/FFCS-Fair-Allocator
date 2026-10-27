<#
.SYNOPSIS
    DA3 Q1(c) Failover Automation Script
    Demonstrates zero-downtime failover by killing api2 during load test.
#>

param(
    [ValidateSet("before", "after")]
    [string]$Mode = "after"
)

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "               DA3 Q1(c) HIGH-AVAILABILITY FAILOVER BENCHMARK                   " -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "Mode selected: $Mode" -ForegroundColor Yellow

if ($Mode -eq "before") {
    Write-Host "[1/4] Starting Compose with NGINX_CONF=failover-before (proxy_next_upstream off)..." -ForegroundColor Yellow
    $env:NGINX_CONF = "failover-before"
    docker compose up -d --build
} else {
    Write-Host "[1/4] Starting Compose with NGINX_CONF=lb-ha (High-Availability Retries Active)..." -ForegroundColor Green
    $env:NGINX_CONF = "lb-ha"
    docker compose up -d --build
}

Start-Sleep -Seconds 4

Write-Host "[2/4] Starting background load test (1000 requests, concurrency 50)..." -ForegroundColor Cyan
$loadJob = Start-Job -ScriptBlock {
    param($workDir)
    Set-Location $workDir
    node scripts/run-load-test.js
} -ArgumentList (Get-Location).Path

Write-Host "[3/4] Waiting 3 seconds into the test before killing api2..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "[!] Simulating sudden container failure: Killing api2..." -ForegroundColor Red
docker compose kill api2

Write-Host "[4/4] Awaiting load test completion..." -ForegroundColor Cyan
$result = Wait-Job $loadJob | Receive-Job
Write-Host $result

Write-Host "`nRestoring api2 container..." -ForegroundColor Green
docker compose start api2

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "Failover test complete. Review status code distribution above." -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
