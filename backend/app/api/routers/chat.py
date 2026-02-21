from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.api import deps
from app.models.user import User
from app.models.message import Message
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class MessageResponse(BaseModel):
    id: int
    text: str
    sender: str
    timestamp: datetime
    status: str
    risk: Optional[dict] = None
    file_url: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[str] = None
    integrity_hash: Optional[str] = None
    reply_to: Optional[dict] = None
    
    class Config:
        from_attributes = True

class DMRequest(BaseModel):
    identifier: str # Email or User ID

@router.post("/dm")
def start_dm(
    request: DMRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    # Determine if identifier is ID or Email
    target_user = None
    if request.identifier.isdigit():
        target_user = db.query(User).filter(User.id == int(request.identifier)).first()
    
    if not target_user:
         # Fallback to email
        target_user = db.query(User).filter(User.email == request.identifier).first()
        
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot DM yourself")
        
    # Generate deterministic Channel ID
    # dm_{min_id}_{max_id}
    u1 = min(current_user.id, target_user.id)
    u2 = max(current_user.id, target_user.id)
    channel_id = f"dm_{u1}_{u2}"
    
    return {
        "channel_id": channel_id,
        "target_user": {
            "id": target_user.id,
            "full_name": target_user.full_name,
            "email": target_user.email
        }
    }

@router.get("/dms")
def get_dms(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Fetch all active DM channels for the current user.
    Finds unique channel_ids starting with "dm_" where user is involved.
    """
    # Find all messages where user is sender or (channel starts with dm_ and involves user ID logic)
    # But messages don't store "participants" explicitly except in channel_id or sender_id.
    # We can query distinct channel_ids from messages table.
    
    # 1. Get distinct channels from messages table for this user
    # A DM channel ID is "dm_{min}_{max}".
    # We can find all channels where user send a message OR (future: received one).
    # Since we don't store receivers yet for old messages, and only sender_id is reliable...
    # We can check channel_ids which contain user ID? dm_3_5. If my ID is 3. "dm_3_5" matches.
    # Reliable way: Check distinct channel_ids where channel_id LIKE 'dm_%'
    # AND (sender_id == current_user.id OR receiver_id == current_user.id)
    
    # Actually, simpler:
    sent_channels = db.query(Message.channel_id).filter(Message.sender_id == current_user.id).filter(Message.channel_id.like("dm_%")).distinct().all()
    received_channels = db.query(Message.channel_id).filter(Message.receiver_id == current_user.id).filter(Message.channel_id.like("dm_%")).distinct().all()
    
    all_channel_ids = set([c[0] for c in sent_channels])
    all_channel_ids.update([c[0] for c in received_channels])
    
    # Now interpret IDs to find the "Other User"
    dms = []
    for cid in all_channel_ids:
        try:
            parts = cid.split("_") # dm, id1, id2
            if len(parts) != 3: continue
            
            uid1, uid2 = int(parts[1]), int(parts[2])
            other_id = uid2 if uid1 == current_user.id else uid1
            
            # If I am neither? (Shouldn't happen if filtered by sender_id)
            if uid1 != current_user.id and uid2 != current_user.id: continue
            
            other_user = db.query(User).filter(User.id == other_id).first()
            if other_user:
                dms.append({
                    "id": cid,
                    "name": other_user.full_name or other_user.email,
                    "status": "ENCRYPTED"
                })
        except:
            continue
            
    return dms

@router.get("/messages")
def get_messages(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    limit: int = 50,
    channel_id: str = "general"
):
    """
    Fetch messages for a specific channel.
    """
    try:
        query = db.query(Message).filter(Message.channel_id == channel_id)
        # Filter expiration manually or skip for debug
        query = query.filter((Message.expiration == None) | (Message.expiration > datetime.utcnow()))
        
        messages = query.order_by(Message.timestamp.asc()).limit(limit).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    response_messages = []
    for msg in messages:
        # Determine sender type
        sender_type = "me" if msg.sender_id == current_user.id else "them"
        
        # Determine status
        status = "blocked" if msg.is_blocked else "sent"
        
        # Build risk object - always include threat analysis data
        risk = {
            "ai_score": msg.ai_score if msg.ai_score is not None else 0.0,
            "opsec_risk": msg.opsec_risk if msg.opsec_risk else "SAFE",
            "phishing_risk": msg.phishing_risk if msg.phishing_risk else "LOW",
            "explanation": "Analysis complete"
        }

        reply_to_data = None
        if msg.reply_to:
            reply_sender_type = "me" if msg.reply_to.sender_id == current_user.id else "them"
            reply_to_data = {
                "id": msg.reply_to.id,
                "text": msg.reply_to.content_encrypted,
                "sender": reply_sender_type
            }

        response_messages.append({
            "id": msg.id,
            "text": msg.content_encrypted, # In real app, decrypt here or on client
            "sender": sender_type,
            "timestamp": msg.timestamp,
            "status": status,
            "risk": risk,
            "file_url": msg.file_url,
            "file_type": msg.file_type,
            "file_size": msg.file_size,
            "integrity_hash": msg.integrity_hash,
            "reply_to": reply_to_data
        })
        
    return response_messages
