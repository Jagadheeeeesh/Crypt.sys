import sys
import os
# Add backend directory to path
sys.path.insert(0, r"C:\Users\Sanjay Kumaar\dev\SentinelNet\backend")

from app.db.session import SessionLocal
from app.models.message import Message
from app.models.user import User
from sqlalchemy import text

def fix_dm_receivers():
    db = SessionLocal()
    try:
        print("Scanning for DM messages with missing receiver_id...")
        # Find messages in DM channels with null receiver_id
        messages = db.query(Message).filter(Message.channel_id.like("dm_%")).filter(Message.receiver_id == None).all()
        
        print(f"Found {len(messages)} messages to patch.")
        
        count = 0
        for msg in messages:
            try:
                parts = msg.channel_id.split("_")
                if len(parts) == 3:
                    u1, u2 = int(parts[1]), int(parts[2])
                    
                    # Logic: if sender is u1, receiver is u2.
                    if msg.sender_id == u1:
                        msg.receiver_id = u2
                    elif msg.sender_id == u2:
                        msg.receiver_id = u1
                    else:
                        print(f"Skipping msg {msg.id}: sender {msg.sender_id} not in {u1},{u2}")
                        continue
                        
                    count += 1
            except Exception as e:
                print(f"Error parsing {msg.channel_id}: {e}")
                
        db.commit()
        print(f"Successfully patched {count} DM messages.")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_dm_receivers()
