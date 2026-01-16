@echo off
echo Installing dependencies...
npm install

if %ERRORLEVEL% NEQ 0 (
    echo Failed to install dependencies
    pause
    exit /b %ERRORLEVEL%
)

echo Starting manga scraper...
node index.js

pause