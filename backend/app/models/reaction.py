from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database.database import Base


class PostReaction(Base):
    __tablename__ = "post_reactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    reaction_type = Column(String, nullable=False)  # like, love, laugh, wow, sad, angry
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Ensure one reaction per user per post
    __table_args__ = (UniqueConstraint('user_id', 'post_id', name='unique_user_post_reaction'),)
    
    # Relationships
    user = relationship("User")
    post = relationship("Post", back_populates="reactions")

    def to_dict(self):
        """Convert reaction to dictionary for API responses"""
        return {
            "id": self.id,
            "userId": self.user_id,
            "user": self.user.to_public_dict() if self.user else None,
            "postId": self.post_id,
            "reactionType": self.reaction_type,
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat()
        }


class CommentReaction(Base):
    __tablename__ = "comment_reactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    comment_id = Column(Integer, ForeignKey("comments.id"), nullable=False)
    reaction_type = Column(String, nullable=False)  # like, love, laugh, wow, sad, angry
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Ensure one reaction per user per comment
    __table_args__ = (UniqueConstraint('user_id', 'comment_id', name='unique_user_comment_reaction'),)
    
    # Relationships
    user = relationship("User")
    comment = relationship("Comment", back_populates="reactions")

    def to_dict(self):
        """Convert comment reaction to dictionary for API responses"""
        return {
            "id": self.id,
            "userId": self.user_id,
            "user": self.user.to_public_dict() if self.user else None,
            "commentId": self.comment_id,
            "reactionType": self.reaction_type,
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat()
        }
