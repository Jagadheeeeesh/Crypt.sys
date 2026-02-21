# 🛡️ SentinelNet
### AI-Defended Secure Communication & Threat Intelligence Platform

## Overview
SentinelNet is a defense-grade communication platform that integrates:
- **End-to-End Encryption** (AES-256 simulation)
- **AI Threat Intelligence** (Phishing, OPSEC, AI-Gen Content)
- **HQ Command Dashboard** (Real-time analytics)

## Tech Stack
- **Frontend**: Next.js 14, Tailwind CSS, Framer Motion, Recharts
- **Backend**: FastAPI, Python, AI Heuristics (Transformers ready)
- **Security**: Mocked Encryption Pipeline, Role-Based Access

## Getting Started

### Prerequisites
- Node.js
- Python 3.9+

### Quick Start
Run the included batch file:
```bash
./run_dev.bat
```

### Manual Start
**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Architecture
```
[User App] <--> [Secure Gateway (API)] <--> [AI Threat Engine]
                        |
                 [HQ Dashboard]
```

## Features
1. **Secure Chat**: Messages are scanned for OPSEC leaks and Phishing before sending.
2. **AI Detection**: Flags AI-generated content (simulated heuristics for demo).
3. **Live Dashboard**: Visualize threat vectors in real-time.

## Design
- **Defense Aesthetics**: Slate-950 background, Teal/Emerald accents, Glassmorphism.
- **UX**: Micro-interactions, scan animations, rigorous status checks.
