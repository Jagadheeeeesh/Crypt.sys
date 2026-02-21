import sqlite3

def fix_channels():
    conn = sqlite3.connect('backend/sentinelnet.db')
    cursor = conn.cursor()
    
    print("Fixing NULL channel_ids...")
    try:
        cursor.execute("UPDATE messages SET channel_id='general' WHERE channel_id IS NULL")
        print(f"Updated {cursor.rowcount} messages.")
        conn.commit()
    except Exception as e:
        print(f"Error: {e}")
        
    conn.close()

if __name__ == "__main__":
    fix_channels()
