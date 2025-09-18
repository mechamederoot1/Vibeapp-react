from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from ..database.database import Base
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON, LargeBinary

class Story(Base):
    __tablename__ = "stories"

    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Content
    story_type = Column(String, nullable=False, default="text")  # text, image, video
    content = Column(Text, nullable=True)  # Text content for text stories
    media_url = Column(String, nullable=True)  # Media URL for image/video stories
    media_blob = Column(LargeBinary, nullable=True)
    media_mime = Column(String, nullable=True)
    background_gradient = Column(String, nullable=True)  # Background gradient ID
    text_elements = Column(JSON, nullable=True)  # Text elements positioned on the story
    
    # Settings
    privacy = Column(String, nullable=False, default="public")  # public, friends, close_friends
    duration_hours = Column(Integer, default=24)  # Duration in hours
    
    # Engagement
    views_count = Column(Integer, default=0)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_archived = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    
    # Relationships
    author = relationship("User", back_populates="stories")
    views = relationship("StoryView", back_populates="story")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if self.duration_hours and not self.expires_at:
            if not self.created_at:
                self.created_at = datetime.utcnow()
            self.expires_at = self.created_at + timedelta(hours=self.duration_hours)

    @property
    def is_expired(self):
        """Check if story has expired"""
        return self.expires_at and datetime.utcnow() > self.expires_at

    def to_dict(self, current_user_id=None):
        """Convert story to dictionary for API responses"""
        # Check if current user viewed this story
        is_viewed = False
        if current_user_id:
            is_viewed = any(view.viewer_id == current_user_id for view in self.views)
        
        return {
            "id": self.id,
            "authorId": self.author_id,
            "author": self.author.to_public_dict() if self.author else None,
            "type": self.story_type,
            "content": self.content,
            "mediaUrl": self.media_url,
            "backgroundGradient": self.background_gradient,
            "textElements": self.text_elements or [],
            "privacy": self.privacy,
            "durationHours": self.duration_hours,
            "viewsCount": self.views_count,
            "isViewed": is_viewed,
            "isActive": self.is_active,
            "isArchived": self.is_archived,
            "isExpired": self.is_expired,
            "createdAt": self.created_at.isoformat(),
            "expiresAt": self.expires_at.isoformat() if self.expires_at else None
        }


class StoryView(Base):
    __tablename__ = "story_views"

    id = Column(Integer, primary_key=True, index=True)
    story_id = Column(Integer, ForeignKey("stories.id"), nullable=False)
    viewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    viewed_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    story = relationship("Story", back_populates="views")
    viewer = relationship("User")

    def to_dict(self):
        """Convert story view to dictionary for API responses"""
        return {
            "id": self.id,
            "storyId": self.story_id,
            "viewerId": self.viewer_id,
            "viewer": self.viewer.to_public_dict() if self.viewer else None,
            "viewedAt": self.viewed_at.isoformat()
        }
