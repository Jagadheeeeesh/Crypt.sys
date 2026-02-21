from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Use SQLite for local development, easily switchable to PostgreSQL via env var
# DATABASE_URL = "postgresql://user:password@localhost/dbname"
import os
import shutil

# Vercel Read-Only Patch
# If running in Vercel, move DB to /tmp which is writable
# Vercel Read-Only Patch
# Use In-Memory DB for Vercel Demo to avoid filesystem issues entirely
from sqlalchemy.pool import StaticPool

# Prioritize connection string from environment variable (e.g. Vercel Postgres, Neon, Render)
DB_CONNECTION_ERROR = None
DATABASE_URL = os.getenv("DATABASE_URL")

import ssl

if DATABASE_URL:
    # Sanitize URL: Remove common copy-paste errors
    # 1. Remove 'psql ' prefix if copied from Neon/terminal
    if DATABASE_URL.startswith("psql"):
        DATABASE_URL = DATABASE_URL.split(" ")[-1]
    
    # 2. Remove surrounding quotes (single or double)
    DATABASE_URL = DATABASE_URL.strip().strip("'").strip('"')

    # 3. Handle specific Neon params (pg8000 doesn't like channel_binding/sslmode in URL)
    # pg8000 uses ssl_context passed in connect_args, so these query params cause "unexpected keyword argument" errors
    if "?" in DATABASE_URL:
        # Strip common problematic params
        DATABASE_URL = DATABASE_URL.replace("sslmode=require", "").replace("channel_binding=require", "")
        # Clean up double && or trailing/leading ?/&
        DATABASE_URL = DATABASE_URL.replace("?&", "?").replace("&&", "&").strip("&")
        if DATABASE_URL.endswith("?"):
            DATABASE_URL = DATABASE_URL[:-1]

    try:
        # Production / Persistent DB (e.g. Neon, Render, Supabase)
        # Handle deprecated postgres:// scheme
        if DATABASE_URL.startswith("postgres://"):
            DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+pg8000://", 1)
        elif DATABASE_URL.startswith("postgresql://"):
            DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+pg8000://", 1)
        elif DATABASE_URL.startswith("neondb://"):
             DATABASE_URL = DATABASE_URL.replace("neondb://", "postgresql+pg8000://", 1)
            
        # Create SSL context for pg8000
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE

        engine = create_engine(
            DATABASE_URL,
            connect_args={"ssl_context": ssl_context},
            pool_pre_ping=True,
            pool_recycle=300
        )
    except Exception as e:
        DB_CONNECTION_ERROR = f"{str(e)} || TRIED_URL_START: {DATABASE_URL[:25] if DATABASE_URL else 'None'}..."
        print(f"DATABASE CONNECTION FAILED AT IMPORT: {e}")
        # Fallback to in-memory SQLite to prevent crash
        DATABASE_URL = "sqlite:///:memory:"
        engine = create_engine(
            DATABASE_URL,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool, 
        )

elif os.getenv("VERCEL"):
    # Vercel Fallback (if no DATABASE_URL provided): In-Memory SQLite
    # WARNING: Data is ephemeral and will be lost on function restart
    DATABASE_URL = "sqlite:///:memory:"
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool, 
    )
    
else:
    # Local Development: File-based SQLite
    try:
        base_filename = "sentinelnet.db"
        DATABASE_URL = f"sqlite:///./{base_filename}"
        engine = create_engine(
            DATABASE_URL, connect_args={"check_same_thread": False}
        )
    except Exception as e:
         # Extreme Fallback
        DATABASE_URL = "sqlite:///:memory:"
        engine = create_engine(
            DATABASE_URL,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool, 
        )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
