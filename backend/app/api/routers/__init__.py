from fastapi import APIRouter
from app.api.routers import threat_intel

router = APIRouter()

router.include_router(threat_intel.router, prefix="/threat-intel", tags=["threat-intel"])
