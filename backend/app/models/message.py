from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum
from ..database.database import Base
from sqlalchemy import LargeBinary

class MessageType(str, Enum):
    TEXT = "text"
    AUDIO = "audio"
    IMAGE = "image"
    VIDEO = "video"

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Conteúdo da mensagem
    content = Column(Text, nullable=True)
    message_type = Column(SQLEnum(MessageType), default=MessageType.TEXT)
    media_url = Column(String(500), nullable=True)  # Para áudio, imagem, vídeo
    media_blob = Column(LargeBinary, nullable=True)
    media_mime = Column(String(100), nullable=True)
    
    # Status da mensagem
    is_read = Column(Boolean, default=False)
    is_deleted_by_sender = Column(Boolean, default=False)
    is_deleted_by_receiver = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")

    def to_dict(self):
        return {
            "id": self.id,
            "senderId": self.sender_id,
            "receiverId": self.receiver_id,
            "content": self.content,
            "messageType": self.message_type.value,
            "mediaUrl": self.media_url,
            "isRead": self.is_read,
            "isDeletedBySender": self.is_deleted_by_sender,
            "isDeletedByReceiver": self.is_deleted_by_receiver,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "readAt": self.read_at.isoformat() if self.read_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "sender": self.sender.to_public_dict() if self.sender else None,
            "receiver": self.receiver.to_public_dict() if self.receiver else None
        }

class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    user1_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user2_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Status da conversa
    is_archived_by_user1 = Column(Boolean, default=False)
    is_archived_by_user2 = Column(Boolean, default=False)
    last_message_id = Column(Integer, ForeignKey("messages.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    user1 = relationship("User", foreign_keys=[user1_id])
    user2 = relationship("User", foreign_keys=[user2_id])
    last_message = relationship("Message", foreign_keys=[last_message_id])

    def to_dict(self, current_user_id):
        other_user = self.user2 if self.user1_id == current_user_id else self.user1
        is_archived = self.is_archived_by_user1 if self.user1_id == current_user_id else self.is_archived_by_user2
        
        return {
            "id": self.id,
            "otherUser": other_user.to_public_dict(),
            "lastMessage": self.last_message.to_dict() if self.last_message else None,
            "isArchived": is_archived,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None
        }

class PostShare(Base):
    __tablename__ = "post_shares"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    original_post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    
    # Texto adicional do compartilhamento
    share_text = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relacionamentos
    user = relationship("User", back_populates="shared_posts")
    original_post = relationship("Post", back_populates="post_shares")

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "originalPostId": self.original_post_id,
            "shareText": self.share_text,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "user": self.user.to_public_dict() if self.user else None,
            "originalPost": self.original_post.to_dict() if self.original_post else None
        }
