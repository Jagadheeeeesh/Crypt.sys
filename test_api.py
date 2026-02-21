import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_system():
    # 1. Login (or Register if needed)
    print("1. Authenticating...")
    email = "admin@sentinel.net"
    password = "password"
    
    # Try login
    resp = requests.post(f"{BASE_URL}/auth/login/access-token", data={"username": email, "password": password})
    
    if resp.status_code != 200:
        print(f"Login failed: {resp.status_code} {resp.text}")
        # Try register
        print("Attempting registration...")
        reg_resp = requests.post(f"{BASE_URL}/auth/register", json={
            "email": email, 
            "password": password, 
            "full_name": "Admin Officer"
        })
        if reg_resp.status_code != 200:
            print(f"Registration failed: {reg_resp.status_code} {reg_resp.text}")
            return
        # Login again
        resp = requests.post(f"{BASE_URL}/auth/login", data={"username": email, "password": password})
        
    token = resp.json()["access_token"]
    print(f"Authenticated. Token: {token[:10]}...")
    
    # 2. Fetch Messages
    print("\n2. Fetching Messages (Channel: general)...")
    headers = {"Authorization": f"Bearer {token}"}
    try:
        msg_resp = requests.get(f"{BASE_URL}/chat/messages?channel_id=general", headers=headers)
        print(f"Status: {msg_resp.status_code}")
        if msg_resp.status_code == 200:
            msgs = msg_resp.json()
            print(f"Found {len(msgs)} messages.")
            print(json.dumps(msgs[:2], indent=2))
        else:
            print(f"Error Body: {msg_resp.text}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_system()
