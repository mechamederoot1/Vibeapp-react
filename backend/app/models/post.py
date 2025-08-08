from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.database import Base

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Conteúdo
    caption = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    video_url = Column(String(500), nullable=True)
    
    # Localização
    location_name = Column(String(100), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # Configurações
    is_active = Column(Boolean, default=True)
    allow_comments = Column(Boolean, default=True)
    
    # Privacidade
    visibility = Column(String(20), default="public")  # public, friends, private
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    author = relationship("User", back_populates="posts")
    likes = relationship("PostLike", back_populates="post", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Post(id={self.id}, author_id={self.author_id})>"

class PostLike(Base):
    __tablename__ = "post_likes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relacionamentos
    user = relationship("User", back_populates="likes")
    post = relationship("Post", back_populates="likes")

    def __repr__(self):
        return f"<PostLike(user_id={self.user_id}, post_id={self.post_id})>"

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    
    # Comentário aninhado (resposta a outro comentário)
    parent_comment_id = Column(Integer, ForeignKey("comments.id"), nullable=True)
    
    content = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    user = relationship("User", back_populates="comments")
    post = relationship("Post", back_populates="comments")
    
    # Auto-relacionamento para comentários aninhados
    parent_comment = relationship("Comment", remote_side=[id], backref="replies")

    def __repr__(self):
        return f"<Comment(id={self.id}, user_id={self.user_id}, post_id={self.post_id})>"
