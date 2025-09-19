from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from ..database.database import Base

class Highlight(Base):
    __tablename__ = "highlights"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Basic info
    title = Column(String, nullable=False)  # Nome do destaque
    cover_story_id = Column(Integer, ForeignKey("stories.id"), nullable=True)  # Story usado como capa
    cover_image_url = Column(String, nullable=True)  # URL da imagem de capa personalizada
    description = Column(Text, nullable=True)  # Descrição opcional
    
    # Display settings
    order_index = Column(Integer, default=0)  # Ordem de exibição
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="highlights")
    cover_story = relationship("Story", foreign_keys=[cover_story_id])
    stories = relationship("HighlightStory", back_populates="highlight", order_by="HighlightStory.order_index")

    def to_dict(self, include_stories=False):
        """Convert highlight to dictionary for API responses"""
        # Compute additions in the last 24 hours for "+X hoje" indicator
        cutoff = datetime.utcnow() - timedelta(hours=24)
        added_last_24h = 0
        try:
            added_last_24h = sum(1 for hs in (self.stories or []) if getattr(hs, 'added_at', None) and hs.added_at >= cutoff)
        except Exception:
            added_last_24h = 0

        result = {
            "id": self.id,
            "userId": self.user_id,
            "title": self.title,
            "coverStoryId": self.cover_story_id,
            "coverImageUrl": self.cover_image_url or (self.cover_story.media_url if self.cover_story else None),
            "description": self.description,
            "orderIndex": self.order_index,
            "isActive": self.is_active,
            "storiesCount": len(self.stories) if self.stories else 0,
            "addedLast24h": added_last_24h,
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat()
        }

        if include_stories:
            result["stories"] = [hs.story.to_dict() for hs in (self.stories or []) if hs.story and hs.story.is_active]

        return result


class HighlightStory(Base):
    __tablename__ = "highlight_stories"

    id = Column(Integer, primary_key=True, index=True)
    highlight_id = Column(Integer, ForeignKey("highlights.id"), nullable=False)
    story_id = Column(Integer, ForeignKey("stories.id"), nullable=False)
    
    # Display settings
    order_index = Column(Integer, default=0)  # Ordem dentro do destaque
    
    # Timestamps
    added_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    highlight = relationship("Highlight", back_populates="stories")
    story = relationship("Story")

    def to_dict(self):
        """Convert highlight story to dictionary for API responses"""
        return {
            "id": self.id,
            "highlightId": self.highlight_id,
            "storyId": self.story_id,
            "orderIndex": self.order_index,
            "addedAt": self.added_at.isoformat(),
            "story": self.story.to_dict() if self.story else None
        }
