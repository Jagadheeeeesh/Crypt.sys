import sqlite3
import time

def fix_db():
    print("Attempting to patch database schema...")
    try:
        conn = sqlite3.connect('backend/sentinelnet.db', timeout=10) # Wait up to 10s for lock
        cursor = conn.cursor()
        
        columns = [
            ("file_url", "VARCHAR"),
            ("file_type", "VARCHAR"),
            ("file_size", "VARCHAR"),
            ("integrity_hash", "VARCHAR"),
            ("channel_id", "VARCHAR"),
            ("expiration", "DATETIME"), # For Self-Destruct
            ("receiver_id", "INTEGER")  # For Future Messages
        ]
        
        for col_name, col_type in columns:
            try:
                print(f"Adding column {col_name}...")
                cursor.execute(f"ALTER TABLE messages ADD COLUMN {col_name} {col_type}")
                print(f"Successfully added {col_name}")
            except sqlite3.OperationalError as e:
                # Column likely exists
                print(f"Skipping {col_name}: {e}")
                
        conn.commit()
        print("Database schema patched successfully.")
        conn.close()
    except Exception as e:
        print(f"Failed to patch database: {e}")

if __name__ == "__main__":
    fix_db()
