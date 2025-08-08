from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database.database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Tipo de notificação
    type = Column(String(50), nullable=False)  # like, comment, follow, mention, friend_request
    
    # Conteúdo da notificação
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=True)
    
    # Referências
    related_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    related_post_id = Column(Integer, ForeignKey("posts.id"), nullable=True)
    
    # URL de ação
    action_url = Column(String(500), nullable=True)
    
    # Status
    is_read = Column(Boolean, default=False)
    is_sent = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relacionamentos
    user = relationship("User", foreign_keys=[user_id], back_populates="notifications")
    related_user = relationship("User", foreign_keys=[related_user_id])

    def __repr__(self):
        return f"<Notification(id={self.id}, user_id={self.user_id}, type={self.type})>"
