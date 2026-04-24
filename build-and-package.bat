@echo off
echo =======================================================
echo          RGA Dashboard Full Deployment Packager
echo =======================================================
echo.

echo [1/4] Building Frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed!
    pause
    exit /b %errorlevel%
)
cd ..
echo Frontend built successfully!
echo.

echo [2/4] Copying frontend build to backend/client/public...
if not exist "backend\client\public" mkdir "backend\client\public"
xcopy /s /e /y "frontend\dist\public\*" "backend\client\public\"
if %errorlevel% neq 0 (
    echo [ERROR] Failed to copy frontend files!
    pause
    exit /b %errorlevel%
)
echo Copy complete!
echo.

echo [3/4] Building Backend...
cd backend
echo [IMPORTANT] Please ensure your backend server (npm run start) is NOT running to avoid EPERM errors.
pause
echo Generating Prisma Client...
call npx prisma@6.4.0 generate
if %errorlevel% neq 0 (
    echo [ERROR] Prisma generate failed!
    pause
    exit /b %errorlevel%
)
echo Compiling TypeScript...
set NODE_OPTIONS=--max-old-space-size=6144
call npx nest build
if %errorlevel% neq 0 (
    echo [ERROR] Backend build failed!
    pause
    exit /b %errorlevel%
)
echo Backend built successfully!
echo.

echo [4/4] Creating deployment zip file...
::: Create a temporary deployment directory
rmdir /s /q deploy_temp 2>nul
mkdir deploy_temp

::: Copy necessary files
xcopy /s /e /y "dist\*" "deploy_temp\dist\"
xcopy /s /e /y "client\public\*" "deploy_temp\client\public\"
mkdir deploy_temp\src
xcopy /s /e /y "src\*" "deploy_temp\src\"
mkdir deploy_temp\prisma
xcopy /s /e /y "prisma\schema.prisma" "deploy_temp\prisma\"
copy package.json deploy_temp\
copy package-lock.json deploy_temp\
copy tsconfig.json deploy_temp\
copy tsconfig.build.json deploy_temp\
copy nest-cli.json deploy_temp\

::: Clean any existing zip
::: Clean unnecessary types and map files
del /s /q "deploy_temp\dist\*.d.ts" 2>nul
del /s /q "deploy_temp\dist\*.js.map" 2>nul

::: Zip using tar (Creates standard ZIP format that Hostinger Linux servers understand)
cd deploy_temp
tar.exe -a -c -f ..\rga-deployment.zip *
cd ..

::: Cleanup temp
rmdir /s /q deploy_temp
cd ..

echo.
echo =======================================================
echo [SUCCESS] Package created! 
echo Upload the file 'backend/rga-deployment.zip' to Hostinger.
echo =======================================================
pause
