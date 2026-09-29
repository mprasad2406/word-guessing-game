@echo off
setlocal

echo ===================================================
echo  Starting Word Guessing Game Application
echo ===================================================

set "PROJECT_ROOT=%~dp0"
set "BACKEND_DIR=%PROJECT_ROOT%backend"
set "FRONTEND_DIR=%PROJECT_ROOT%frontend\word-guess-frontend"

echo [1/3] Starting Backend Server (FastAPI / Uvicorn)...
start "Word Guess - Backend (Port 8000)" cmd /k "cd /d "%BACKEND_DIR%" && call run.bat"

echo [2/3] Starting Frontend Server (Vite / React)...
start "Word Guess - Frontend (Port 5173)" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"

echo [3/3] Waiting for servers to initialize...
timeout /t 4 /nobreak >nul

echo Opening frontend in Google Chrome (http://localhost:5173)...
start chrome "http://localhost:5173" 2>nul || start "" "http://localhost:5173"

echo.
echo ===================================================
echo  Both servers launched!
echo  - Backend API & Docs: http://localhost:8000/api/docs
echo  - Frontend App:       http://localhost:5173
echo ===================================================
