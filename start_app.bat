@echo off
echo Starting application...

:: Kill existing processes (if any)
for /f "tokens=5" %%a in ('netstat -ano ^| find ":8000" ^| find "LISTENING"') do (
    echo Killing process on port 8000: %%a
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| find ":3000" ^| find "LISTENING"') do (
    echo Killing process on port 3000: %%a
    taskkill /F /PID %%a >nul 2>&1
)

:: Ensure frontend env exists
if not exist frontend\.env.local (
    echo Creating frontend environment file...
    copy .env frontend\.env.local >nul 2>&1
)

:: Start backend
echo Starting backend server...
start cmd /k "cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

echo Backend started at http://localhost:8000
echo API Documentation: http://localhost:8000/docs

:: Ask about starting frontend
echo.
echo To start the frontend, you need Node.js installed.
set /p startFrontend=Do you want to attempt starting the frontend? (yes/no): 

if /i "%startFrontend%"=="yes" (
    echo.
    echo Attempting to start frontend...
    start cmd /k "cd frontend && npm install && npm run dev"
    echo If Node.js is installed, frontend will be available at http://localhost:3000
) else (
    echo.
    echo When ready to start the frontend, open a new command prompt and run:
    echo cd frontend ^&^& npm install ^&^& npm run dev
)

echo.
echo Application startup complete! 