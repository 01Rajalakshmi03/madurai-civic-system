@echo off
title Madurai Civic System - Deployment
color 0A

echo ============================================================
echo   Madurai Civic System - Starting All Services
echo ============================================================
echo.

:: Check MongoDB
echo [1/5] Checking MongoDB...
sc query MongoDB | find "RUNNING" >nul 2>&1
if %errorlevel% equ 0 (
    echo   MongoDB is already running.
) else (
    echo   Starting MongoDB...
    net start MongoDB 2>nul
    if %errorlevel% neq 0 (
        echo   WARNING: Could not start MongoDB. Please start it manually:
        echo   net start MongoDB
        echo.
    )
)

:: Start Ganache
echo [2/5] Starting Ganache Blockchain...
start "Ganache Blockchain" cmd /k "title Ganache - Port 7545 && ganache --port 7545 --deterministic"
timeout /t 3 /nobreak >nul
echo   Ganache started on http://127.0.0.1:7545

:: Start Backend
echo [3/5] Starting Flask Backend (Waitress)...
start "Backend Server" /D "%~dp0server" cmd /k "title Backend - Port 5000 && venv\Scripts\python.exe run_production.py"
timeout /t 3 /nobreak >nul
echo   Backend started on http://localhost:5000

:: Start Frontend
echo [4/5] Starting Frontend Server...
start "Frontend Server" /D "%~dp0client" cmd /k "title Frontend - Port 3000 && npx serve dist -l 3000 --single"
timeout /t 3 /nobreak >nul
echo   Frontend started on http://localhost:3000

:: Open Browser
echo [5/5] Opening browser...
timeout /t 2 /nobreak >nul
start http://localhost:3000

echo.
echo ============================================================
echo   All services started!
echo   Frontend:    http://localhost:3000
echo   Backend API: http://localhost:5000/api/health
echo   Ganache:     http://127.0.0.1:7545
echo ============================================================
echo.
echo   Demo Login Credentials:
echo   Admin:    admin@madurai.gov.in / admin123
echo   Citizen:  citizen@test.com / password123
echo   Ward:     ward@test.com / password123
echo   Official: official1@madurai.gov.in / password123
echo.
echo   Press any key to stop all services...
pause >nul

:: Cleanup
echo.
echo Stopping all services...
taskkill /FI "WINDOWTITLE eq Ganache Blockchain" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Backend Server" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend Server" /F >nul 2>&1
echo All services stopped.
