from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database.database import Base

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Content
    content = Column(Text, nullable=True)  # Text content
    image_url = Column(String, nullable=True)  # Image URL
    video_url = Column(String, nullable=True)  # Video URL
    post_type = Column(String, nullable=False, default="text")  # text, image, video, profile_update
    background_color = Column(String, nullable=True)  # Background color for text posts
    profile_update_type = Column(String, nullable=True)  # avatar, cover (para posts de atualização de perfil)
    
    # Engagement
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    shares_count = Column(Integer, default=0)
    reposts_count = Column(Integer, default=0)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_pinned = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    author = relationship("User", back_populates="posts")
    likes = relationship("PostLike", back_populates="post")
    comments = relationship("Comment", back_populates="post")
    reactions = relationship("PostReaction", back_populates="post")
    shares = relationship("Share", back_populates="post")

    def to_dict(self, current_user_id=None):
        """Convert post to dictionary for API responses"""
        # Check if current user liked this post
        is_liked = False
        if current_user_id:
            is_liked = any(like.user_id == current_user_id for like in self.likes)
        
        return {
            "id": self.id,
            "authorId": self.author_id,
            "author": self.author.to_public_dict() if self.author else None,
            "content": self.content,
            "imageUrl": self.image_url,
            "videoUrl": self.video_url,
            "type": self.post_type,
            "backgroundColor": self.background_color,
            "profileUpdateType": self.profile_update_type,
            "likesCount": self.likes_count,
            "commentsCount": self.comments_count,
            "sharesCount": self.shares_count,
            "repostsCount": self.reposts_count,
            "isLiked": is_liked,
            "isPinned": self.is_pinned,
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat()
        }


class PostLike(Base):
    __tablename__ = "post_likes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
    post = relationship("Post", back_populates="likes")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    content = Column(Text, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
    post = relationship("Post", back_populates="comments")

    def to_dict(self):
        """Convert comment to dictionary for API responses"""
        return {
            "id": self.id,
            "userId": self.user_id,
            "user": self.user.to_public_dict() if self.user else None,
            "postId": self.post_id,
            "content": self.content,
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat()
        }


class Share(Base):
    __tablename__ = "shares"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    share_type = Column(String, nullable=False)  # share, repost
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
    post = relationship("Post")

    def to_dict(self):
        """Convert share to dictionary for API responses"""
        return {
            "id": self.id,
            "userId": self.user_id,
            "user": self.user.to_public_dict() if self.user else None,
            "postId": self.post_id,
            "shareType": self.share_type,
            "createdAt": self.created_at.isoformat()
        }
