from sqlalchemy import Column, Integer, DateTime, ForeignKey, String
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database.database import Base

class ProfileView(Base):
    __tablename__ = "profile_views"

    id = Column(Integer, primary_key=True, index=True)
    viewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    profile_owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Informações da visualização
    view_duration = Column(Integer, nullable=True)  # segundos
    source = Column(String(50), nullable=True)  # feed, search, profile, etc.
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relacionamentos
    viewer = relationship("User", foreign_keys=[viewer_id], back_populates="profile_views_made")
    profile_owner = relationship("User", foreign_keys=[profile_owner_id], back_populates="profile_views_received")

    def __repr__(self):
        return f"<ProfileView(viewer_id={self.viewer_id}, profile_owner_id={self.profile_owner_id})>"
