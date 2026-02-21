from fastapi import APIRouter
from app.api.routers import threat_intel, auth, chat, dashboard

router = APIRouter()

router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(threat_intel.router, prefix="/threat-intel", tags=["threat-intel"])
router.include_router(chat.router, prefix="/chat", tags=["chat"])
router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
