from sqlalchemy import Column, Integer, String, Text, Date, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

from app.database.database import Base

class WorkExperience(Base):
    __tablename__ = "work_experiences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    company = Column(String(200), nullable=False)
    position = Column(String(200), nullable=False)
    description = Column(Text)
    start_date = Column(Date)
    end_date = Column(Date)
    is_current = Column(Boolean, default=False)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="work_experiences")

    def to_dict(self):
        """Convert work experience to dictionary"""
        return {
            "id": self.id,
            "company": self.company,
            "position": self.position,
            "description": self.description,
            "startDate": self.start_date.isoformat() if self.start_date else None,
            "endDate": self.end_date.isoformat() if self.end_date else None,
            "isCurrent": self.is_current,
            "orderIndex": self.order_index,
            "displayText": self._format_display_text(),
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None
        }

    def _format_display_text(self):
        """Format work experience for display"""
        if self.position and self.company:
            return f"{self.position} na {self.company}"
        elif self.position:
            return self.position
        elif self.company:
            return f"Trabalha na {self.company}"
        return "Experiência de trabalho"

    def __repr__(self):
        return f"<WorkExperience(id={self.id}, position='{self.position}', company='{self.company}')>"
