import sys
import os

# Ensure backend directory is in path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.models.user import User
from app.models.message import Message # Import all models to ensure they are registered
from app.core import security

def reset_database():
    print("--- RESETTING DATABASE ---")
    
    # 1. Drop all tables
    print("Dropping all tables...")
    try:
        Base.metadata.drop_all(bind=engine)
        print("Tables dropped.")
    except Exception as e:
        print(f"Error dropping tables: {e}")
        return

    # 2. Create all tables
    print("Creating all tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("Tables created.")
    except Exception as e:
        print(f"Error creating tables: {e}")
        return

    # 3. Create Default Admin User
    print("Creating default admin user...")
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
            print("Default user 'admin@sentinel.net' created.")
        else:
            print("Default user already exists.")
    except Exception as e:
        print(f"Error creating default user: {e}")
    finally:
        db.close()
        
    print("--- DATABASE RESET COMPLETE ---")

if __name__ == "__main__":
    reset_database()
