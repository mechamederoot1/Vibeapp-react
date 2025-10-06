from datetime import datetime
from sqlalchemy import Column, Integer, Text, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..database.database import Base

class Testimonial(Base):
    __tablename__ = "testimonials"

    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    recipient_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    title = Column(String, nullable=True)
    content = Column(Text, nullable=False)  # HTML or simple annotated text
    background_color = Column(String, nullable=True)
    font = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    author = relationship('User', foreign_keys=[author_id])
    recipient = relationship('User', foreign_keys=[recipient_id])

    def to_dict(self, current_user_id=None):
        return {
            "id": self.id,
            "authorId": self.author_id,
            "recipientId": self.recipient_id,
            "title": self.title,
            "content": self.content,
            "backgroundColor": self.background_color,
            "font": self.font,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "isActive": bool(self.is_active)
        }
