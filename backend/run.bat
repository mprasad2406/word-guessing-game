@echo off
cd /d "%~dp0"
echo Starting FastAPI backend server on port 8000...

if exist .venv\Scripts\activate.bat (
    echo Activating .venv virtual environment...
    call .venv\Scripts\activate.bat
) else if exist venv\Scripts\activate.bat (
    echo Activating venv virtual environment...
    call venv\Scripts\activate.bat
)

python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
pause
