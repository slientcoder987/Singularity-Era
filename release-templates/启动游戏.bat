@echo off
title Singularity.AI Game Launcher
cd /d "%~dp0game"

echo ============================================
echo   Singularity.AI - AI Company Simulator
echo ============================================
echo.

if not exist "dist\index.html" (
    echo [ERROR] Game file dist\index.html not found
    pause
    exit /b 1
)

where node >nul 2>nul
if "%errorlevel%"=="0" (
    echo [OK] Node.js detected, starting server...
    echo.
    node server.mjs
    if "%errorlevel%"=="0" exit /b 0
    echo.
    echo Node.js failed, trying fallback...
)

where python >nul 2>nul
if "%errorlevel%"=="0" (
    echo [OK] Python detected, starting HTTP server...
    echo.
    cd dist
    start "" http://127.0.0.1:8000
    python -m http.server 8000
    exit /b 0
)

where py >nul 2>nul
if "%errorlevel%"=="0" (
    echo [OK] Python launcher detected, starting HTTP server...
    echo.
    cd dist
    start "" http://127.0.0.1:8000
    py -m http.server 8000
    exit /b 0
)

echo [!] Node.js and Python not found
echo.
echo Opening index.html directly...
echo Install Node.js (https://nodejs.org/) or Python (https://www.python.org/) for best experience
echo.
start "" "dist\index.html"
exit /b 0
