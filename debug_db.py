import sqlite3

def check_db():
    try:
        conn = sqlite3.connect('backend/sentinelnet.db')
        cursor = conn.cursor()
        print("--- SCHEMA ---")
        cursor.execute("PRAGMA table_info(messages)")
        for col in cursor.fetchall():
            print(col)
            
        print("\n--- MESSAGES ---")
        cursor.execute("SELECT id, sender_id, content_encrypted, channel_id, expiration FROM messages")
        rows = cursor.fetchall()
        for row in rows:
            print(row)
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_db()
