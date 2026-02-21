from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api import deps
from app.models.message import Message
from app.models.user import User
from datetime import datetime, timedelta
from sqlalchemy import func
import random

router = APIRouter()

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(deps.get_db)):
    now = datetime.utcnow()
    one_hour_ago = now - timedelta(hours=1)
    
    # 1. Calculate DEFCON
    active_threats = db.query(Message).filter(Message.opsec_risk == "HIGH", Message.timestamp > one_hour_ago).count()
    
    defcon = 4
    if active_threats > 10:
        defcon = 2
    elif active_threats > 2: # Lower threshold for demo
        defcon = 3
        
    # 2. Threat Trend
    # Get messages from last hour
    recent_msgs = db.query(Message).filter(Message.timestamp > one_hour_ago).all()
    
    # Group by minute for chart (simple approximation)
    # We need a list of data points.
    # Format: { time: "HH:MM", threats: count }
    trend_data = []
    # Buckets every 10 mins? Or just last 10 messages?
    # Let's mock a curve based on real count + noise for "Live" feel
    base_activity = len(recent_msgs)
    for i in range(10):
        t = now - timedelta(minutes=(10-i)*5)
        count = sum(1 for m in recent_msgs if m.timestamp > t and m.timestamp < t + timedelta(minutes=5) and m.opsec_risk != "SAFE")
        trend_data.append({
            "time": t.strftime("%H:%M"),
            "value": count + random.randint(0, 2) # Add noise for "live" look
        })

    # 3. Active Alerts
    db_alerts = db.query(Message).filter(Message.opsec_risk == "HIGH").order_by(Message.timestamp.desc()).limit(5).all()
    alerts = [
        {
            "id": m.id,
            "title": "OPSEC LEAK DETECTED",
            "risk": "HIGH",
            "time": m.timestamp,
            "details": f"Source: User {m.sender_id}"
        } for m in db_alerts
    ]
    
    # 4. Logs
    # Mix of real message logs and system noise
    logs = []
    # Add real recent activity
    last_10 = db.query(Message).order_by(Message.timestamp.desc()).limit(10).all()
    for m in last_10:
        tag = "[WARN]" if m.opsec_risk == "HIGH" else "[INFO]"
        text = f"Threat Detected: {m.opsec_risk}" if m.opsec_risk != "SAFE" else f"Secure message processed ({len(m.content_encrypted)} bytes)"
        logs.append({
            "time": m.timestamp.strftime("%H:%M:%S"),
            "type": tag,
            "message": text
        })
        
    # Fill remaining logs with system noise if empty
    system_fillers = [
        "Scanning packet bundle...",
        "Handshake established id_993",
        "Group Key #882 Updated",
        "Latency check: 12ms"
    ]
    while len(logs) < 10:
        logs.append({
            "time": datetime.utcnow().strftime("%H:%M:%S"),
            "type": "[SYS]",
            "message": random.choice(system_fillers)
        })
        
    logs.sort(key=lambda x: x["time"], reverse=True)

    return {
        "system_status": "OPERATIONAL" if defcon > 2 else "CRITICAL",
        "active_nodes": 1204 + active_threats * 15 + random.randint(-5, 5),
        "defcon": defcon,
        "active_threats": active_threats,
        "trend_data": trend_data,
        "alerts": alerts,
        "logs": logs[:10],
        # Geolocation Mock Data (simulated based on threats)
        "geo_risks": [
            {"lat": 19.076 + random.uniform(-0.1, 0.1), "lng": 72.877 + random.uniform(-0.1, 0.1), "risk": "HIGH"} for _ in range(active_threats or 1)
        ]
    }
