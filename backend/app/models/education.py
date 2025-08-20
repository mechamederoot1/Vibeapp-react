from sqlalchemy import Column, Integer, String, Text, Date, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

from app.database.database import Base

class Education(Base):
    __tablename__ = "education"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    institution = Column(String(200), nullable=False)
    degree = Column(String(200), nullable=False)
    field = Column(String(200))
    description = Column(Text)
    start_date = Column(Date)
    end_date = Column(Date)
    is_current = Column(Boolean, default=False)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="education_entries")

    def to_dict(self):
        """Convert education to dictionary"""
        return {
            "id": self.id,
            "institution": self.institution,
            "degree": self.degree,
            "field": self.field,
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
        """Format education for display"""
        parts = []
        if self.degree:
            parts.append(self.degree)
        if self.field:
            parts.append(f"em {self.field}")
        if self.institution:
            parts.append(f"- {self.institution}")
        
        if parts:
            return " ".join(parts)
        return "Formação acadêmica"

    def __repr__(self):
        return f"<Education(id={self.id}, degree='{self.degree}', institution='{self.institution}')>"
