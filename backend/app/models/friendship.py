from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.database import Base

class Friendship(Base):
    __tablename__ = "friendships"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    friend_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Status da amizade
    status = Column(String(20), default="pending")  # pending, accepted, blocked
    
    # Quem iniciou a amizade
    initiated_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    user = relationship("User", foreign_keys=[user_id], back_populates="friendships_initiated")
    friend = relationship("User", foreign_keys=[friend_id], back_populates="friendships_received")

    def __repr__(self):
        return f"<Friendship(user_id={self.user_id}, friend_id={self.friend_id}, status={self.status})>"
