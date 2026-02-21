from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    content_encrypted = Column(String)  # Storing encrypted content
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Threat Analysis Results
    ai_score = Column(Float)
    opsec_risk = Column(String) # "SAFE", "SENSITIVE", "HIGH"
    phishing_risk = Column(String) # "LOW", "MODERATE", "HIGH"
    is_blocked = Column(Boolean, default=False) # Automatically blocked if HIGH risk
    
    # New Features: File Sharing & Integrity
    file_url = Column(String, nullable=True)     # For encrypted file storage
    file_type = Column(String, nullable=True)    # e.g., "image/png", "application/pdf"
    file_size = Column(String, nullable=True)    # Human readable size
    integrity_hash = Column(String, nullable=True) # SHA-256 hash of decrypted content
    channel_id = Column(String, index=True, default="general")
    expiration = Column(DateTime, nullable=True)   # Self-destruct time
    receiver_id = Column(Integer, nullable=True)  # Future: add ForeignKey("users.id") with migration
    reply_to_id = Column(Integer, ForeignKey("messages.id"), nullable=True)

    sender = relationship("User")
    reply_to = relationship("Message", remote_side=[id])
