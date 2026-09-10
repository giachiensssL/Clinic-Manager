@echo off
echo Starting Clinic AI System...

cd /d "%~dp0"

echo Starting Backend...
start "Clinic Backend" cmd /c "cd backend && set PYTHONPATH=. && python -m uvicorn app.main:app --reload --port 8000"

echo Starting Frontend...
start "Clinic Frontend" cmd /c "cd frontend && npm run dev"

echo Done! Both services are starting in separate windows.
