import sys
import os

# Ensure backend directory is in path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.base import Base
import time
from app.db.session import engine, SessionLocal
from app.models.user import User
from app.models.message import Message # Import all models to ensure they are registered

def view_database():
    print("--- VIEWING DATABASE ---")
    db = SessionLocal()
    
    try:
        # Users
        users = db.query(User).all()
        print(f"\nUsers: {len(users)}")
        if users:
            print("ID | Email | Name | Role")
            print("-" * 50)
            for user in users:
                print(f"{user.id} | {user.email} | {user.full_name} | {user.role}")
        else:
            print("No users found.")
        
        # Messages
        messages = db.query(Message).all()
        print(f"\nMessages: {len(messages)}")
        if messages:
            print("ID | Sender | Timestamp | Text")
            print("-" * 50)
            for msg in messages:
                ts = msg.timestamp
                print(f"{msg.id} | {msg.sender_id} | {ts} | {msg.content_encrypted[:30]}...")
        else:
            print("No messages found.")
    except Exception as e:
        print(f"Error viewing database: {e}")
    finally:
        db.close()
    
    print("\n--- VIEW COMPLETE ---")

if __name__ == "__main__":
    view_database()
