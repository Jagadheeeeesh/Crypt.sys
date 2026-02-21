@echo off
echo Starting CyberLock AI Ecosystem...

echo Starting Backend (FastAPI)...
start "CyberLock Backend" cmd /k "cd backend && py -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

echo Starting Frontend (Next.js)...
start "CyberLock Frontend" cmd /k "cd frontend && npm run dev"

echo CyberLock AI is booting up.
echo Access Frontend at http://localhost:3000
echo Access API Docs at http://localhost:8000/docs
pause
