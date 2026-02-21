import sys
import os

# Fix Vercel Import Path: Add 'backend' directory to sys.path
# This ensures 'from app...' imports work correctly in serverless environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import traceback

from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as api_router
from app.db.session import SessionLocal, engine, DB_CONNECTION_ERROR
# Explicit imports of Base and Models triggers registration in Base.metadata
from app.db.base import Base
from app.models.user import User
from app.models.message import Message
from app.core import security



# ... (Previous imports remain same)

from contextlib import asynccontextmanager

# Define lifespan manager for startup and shutdown logic
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    try:
        # Debug connection
        print(f"DATABASE CONNECTING TO: {str(engine.url).replace(str(engine.url).split('@')[0], '****') if '@' in str(engine.url) else str(engine.url)[:20]}...")

        # Create tables on startup
        # WRAPPED IN TRY/EXCEPT TO PREVENT CRASH ON VERCEL IF DB CONNECTION FAILS
        try:
            Base.metadata.create_all(bind=engine)
            
            # Create Default User for Vercel Demo
            db = SessionLocal()
            try:
                if not db.query(User).filter(User.email == "admin@sentinel.net").first():
                    user = User(
                        email="admin@sentinel.net",
                        hashed_password=security.get_password_hash("admin"),
                        full_name="Commander Shepard",
                        role="admin",
                        is_active=True
                    )
                    db.add(user)
                    db.commit()
            except Exception as e:
                print(f"Error creating default user: {e}")
            finally:
                db.close()
                
        except Exception as db_exc:
            print(f"CRITICAL DATABASE ERROR: {db_exc}")
            # Do NOT raise, so the app still starts and we can see /health
            
    except Exception as e:
        print(f"Startup Error - General: {e}")

    yield
    # Shutdown logic (if any)


app = FastAPI(title="SentinelNet API", version="1.0.0", lifespan=lifespan)

@app.exception_handler(Exception)
async def debug_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Server Error: {str(exc)} Trace: {traceback.format_exc()}"},
    )

# Configure CORS for Vercel
# Allowing "*" with allow_credentials=False prevents protocol errors
# We use Bearer auth (headers), so cookies/credentials aren't strictly needed for this demo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {
        "message": "SentinelNet Secure Gateway Active",
        "env": "Vercel",
        "tables": list(Base.metadata.tables.keys()),
        "db_url_masked": str(engine.url)[:15] + "..."
    }

@app.get("/api/health")
def health_check():
    db = SessionLocal()
    user_count = 0
    first_user = "None"
    try:
        user_count = db.query(User).count()
        u = db.query(User).first()
        if u:
            first_user = u.email
    except Exception as e:
        first_user = f"Error: {e}"
    finally:
        db.close()

    return {
        "status": "operational",
        "env_vercel": os.getenv("VERCEL"),
        "db_type": str(engine.url),
        "user_count": user_count,
        "first_user_email": first_user,
        "tables": list(Base.metadata.tables.keys()),
        "db_url_masked": str(engine.url)[:15] + "...", # Security: Don't explicitly show full creds
        "db_connection_error": str(DB_CONNECTION_ERROR) if DB_CONNECTION_ERROR else None
    }

@app.get("/api/debug/users")
def debug_users():
    """
    TEMPORARY DEBUG ENDPOINT
    List all users to verify registration persistence.
    """
    db = SessionLocal()
    try:
        users = db.query(User).all()
        return [
            {
                "id": u.id,
                "email": u.email,
                "created_at": "Unknown", # Add timestamp to model later if needed
                "role": u.role,
                "is_active": u.is_active,
                # "hashed_password": u.hashed_password[:10] + "..." # truncated
            }
            for u in users
        ]
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()
