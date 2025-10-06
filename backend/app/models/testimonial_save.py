from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, ForeignKey
from ..database.database import Base

class TestimonialSave(Base):
    __tablename__ = "testimonial_saves"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    testimonial_id = Column(Integer, ForeignKey('testimonials.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "testimonialId": self.testimonial_id,
            "createdAt": self.created_at.isoformat() if self.created_at else None
        }
