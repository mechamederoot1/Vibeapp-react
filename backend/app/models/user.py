from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(30), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    bio = Column(Text, nullable=True)
    
    # Autenticação
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Imagens de perfil
    avatar_url = Column(String(500), nullable=True)
    cover_url = Column(String(500), nullable=True)
    
    # Configurações de privacidade
    is_private = Column(Boolean, default=False)
    show_profile_visitors = Column(Boolean, default=False)
    
    # Localização
    location = Column(String(100), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_active = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relacionamentos
    posts = relationship("Post", back_populates="author", cascade="all, delete-orphan")
    likes = relationship("PostLike", back_populates="user", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    
    # Amizades onde este usuário iniciou
    friendships_initiated = relationship(
        "Friendship", 
        foreign_keys="Friendship.user_id",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    
    # Amizades onde este usuário foi convidado
    friendships_received = relationship(
        "Friendship", 
        foreign_keys="Friendship.friend_id",
        back_populates="friend",
        cascade="all, delete-orphan"
    )
    
    # Visualizações de perfil feitas por este usuário
    profile_views_made = relationship(
        "ProfileView",
        foreign_keys="ProfileView.viewer_id",
        back_populates="viewer",
        cascade="all, delete-orphan"
    )
    
    # Visualizações recebidas no perfil deste usuário
    profile_views_received = relationship(
        "ProfileView",
        foreign_keys="ProfileView.profile_owner_id", 
        back_populates="profile_owner",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<User(id={self.id}, username={self.username})>"
