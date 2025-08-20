from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, Date
from sqlalchemy.orm import relationship
from datetime import datetime
import bcrypt
from ..database.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    # Profile information
    bio = Column(Text, nullable=True)
    avatar = Column(String, nullable=True)
    cover_photo = Column(String, nullable=True)
    location = Column(String, nullable=True)
    website = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    
    # Personal information
    birth_date = Column(Date, nullable=True)
    gender = Column(String, nullable=True)  # male, female, other, prefer_not_to_say
    
    # Privacy settings
    is_private = Column(Boolean, default=False)
    show_visitors = Column(Boolean, default=True)
    
    # Verification
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # Relationships
    posts = relationship("Post", back_populates="author")
    stories = relationship("Story", back_populates="author")
    friendships_initiated = relationship("Friendship", foreign_keys="Friendship.user_id", back_populates="user")
    friendships_received = relationship("Friendship", foreign_keys="Friendship.friend_id", back_populates="friend")
    profile_views = relationship("ProfileView", foreign_keys="ProfileView.profile_owner_id", back_populates="profile_owner")
    notifications = relationship("Notification", foreign_keys="Notification.user_id", back_populates="user")
    account_settings = relationship("AccountSettings", back_populates="user", uselist=False)

    # Mensagens
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    received_messages = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver")
    shared_posts = relationship("PostShare", back_populates="user")

    # Informações pessoais detalhadas
    personal_info = relationship("PersonalInfo", back_populates="user", uselist=False)

    # Destaques de stories
    highlights = relationship("Highlight", back_populates="user", order_by="Highlight.order_index")

    def set_password(self, password: str):
        """Hash and set the password"""
        salt = bcrypt.gensalt()
        self.hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    def verify_password(self, password: str) -> bool:
        """Verify the password"""
        return bcrypt.checkpw(password.encode('utf-8'), self.hashed_password.encode('utf-8'))

    @property
    def full_name(self):
        """Return full name"""
        return f"{self.first_name} {self.last_name}"

    @property
    def display_name(self):
        """Return display name (username or full name)"""
        return self.username or self.full_name

    def to_dict(self):
        """Convert user to dictionary for API responses"""
        return {
            "id": self.id,
            "email": self.email,
            "username": self.username,
            "firstName": self.first_name,
            "lastName": self.last_name,
            "fullName": self.full_name,
            "bio": self.bio,
            "avatar": self.avatar,
            "coverPhoto": self.cover_photo,
            "location": self.location,
            "website": self.website,
            "phone": self.phone,
            "birthDate": self.birth_date.isoformat() if self.birth_date else None,
            "gender": self.gender,
            "isPrivate": self.is_private,
            "showVisitors": self.show_visitors,
            "isVerified": self.is_verified,
            "isActive": self.is_active,
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat(),
            "lastLogin": self.last_login.isoformat() if self.last_login else None
        }

    def to_public_dict(self):
        """Convert user to public dictionary (limited info)"""
        return {
            "id": self.id,
            "username": self.username,
            "firstName": self.first_name,
            "lastName": self.last_name,
            "fullName": self.full_name,
            "bio": self.bio,
            "avatar": self.avatar,
            "coverPhoto": self.cover_photo,
            "location": self.location,
            "website": self.website,
            "isVerified": self.is_verified,
            "createdAt": self.created_at.isoformat()
        }
