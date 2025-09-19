from sqlalchemy import Column, Integer, String, DateTime, LargeBinary, ForeignKey
from datetime import datetime
from ..database.database import Base

class ProfilePhoto(Base):
    __tablename__ = 'profile_photos'

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    blob = Column(LargeBinary, nullable=False)
    mime = Column(String, nullable=True)
    blob_hash = Column(String, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'url': f"/api/media/profile/photo/id/{self.id}",
            'createdAt': self.created_at.isoformat(),
        }
