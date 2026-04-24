# Cleanup Script for RGA Dashboard
# Run this to organize the project structure as discussed.

Write-Host "Organizing Frontend Assets..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "frontend/src/assets"
Move-Item -Path "frontend/src/components/layout/LOGO-RGA-B2.png" -Destination "frontend/src/assets/logo.png" -Force -ErrorAction SilentlyContinue

Write-Host "Consolidating Public Images..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "frontend/public/images"
Move-Item -Path "frontend/public/assets/*" -Destination "frontend/public/images/" -Force -ErrorAction SilentlyContinue
Move-Item -Path "frontend/public/image/*" -Destination "frontend/public/images/" -Force -ErrorAction SilentlyContinue

Write-Host "Cleaning up redundant frontend folders..." -ForegroundColor Cyan
Remove-Item -Path "frontend/assets" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "frontend/image" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "frontend/public/assets" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "frontend/public/image" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Organizing Backend Scripts..." -ForegroundColor Cyan
$scripts = @(
    "backend/check-ga4.js", "backend/check-gsc.js", "backend/check-users.ts", 
    "backend/get-tenant.js", "backend/seed-demo-data.js", "backend/seed-full-demo.js", 
    "backend/test-db-direct.js", "backend/test-full-dashboard.js", 
    "backend/test-seo-endpoints.js", "backend/trigger-gsc-sync.js", 
    "backend/update_user_tenant.js", "backend/verify-api.ts"
)
foreach ($script in $scripts) {
    if (Test-Path $script) {
        Move-Item -Path $script -Destination "backend/scripts/" -Force
    }
}

Write-Host "Removing Junk Files..." -ForegroundColor Cyan
Remove-Item -Path "backend.zip", "backend (2).zip" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "backend/compile_error.txt", "backend/compile_error_utf8.txt", "backend/errors.txt" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "frontend/src/const.ts" -Force -ErrorAction SilentlyContinue

Write-Host "Project organization complete!" -ForegroundColor Green
