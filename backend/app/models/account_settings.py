from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database.database import Base

class AccountSettings(Base):
    __tablename__ = "account_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, index=True)
    
    # Privacy settings
    profile_visibility = Column(String, default="public")  # public, friends, private
    message_privacy = Column(String, default="everyone")  # everyone, friends, nobody
    story_visibility = Column(String, default="everyone")  # everyone, friends, close_friends
    last_seen_privacy = Column(String, default="everyone")  # everyone, friends, nobody
    
    # Notification preferences  
    email_notifications = Column(Boolean, default=True)
    push_notifications = Column(Boolean, default=True)
    notification_sound = Column(Boolean, default=True)
    
    # Theme and display
    theme = Column(String, default="light")  # light, dark, auto
    language = Column(String, default="pt")  # pt, en, es, etc
    
    # Account safety
    two_factor_enabled = Column(Boolean, default=False)
    login_alerts = Column(Boolean, default=True)
    
    # Account status
    account_status = Column(String, default="active")  # active, deactivated, suspended, deleted
    deactivation_end_date = Column(DateTime, nullable=True)
    auto_reactivation = Column(Boolean, default=True)
    deactivation_reason = Column(String, nullable=True)
    
    # Deletion
    deletion_requested = Column(Boolean, default=False)
    deletion_request_date = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="account_settings")

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "profileVisibility": self.profile_visibility,
            "messagePrivacy": self.message_privacy,
            "storyVisibility": self.story_visibility,
            "lastSeenPrivacy": self.last_seen_privacy,
            "emailNotifications": self.email_notifications,
            "pushNotifications": self.push_notifications,
            "notificationSound": self.notification_sound,
            "theme": self.theme,
            "language": self.language,
            "twoFactorEnabled": self.two_factor_enabled,
            "loginAlerts": self.login_alerts,
            "accountStatus": self.account_status,
            "deactivationEndDate": self.deactivation_end_date.isoformat() if self.deactivation_end_date else None,
            "autoReactivation": self.auto_reactivation,
            "deactivationReason": self.deactivation_reason,
            "deletionRequested": self.deletion_requested,
            "deletionRequestDate": self.deletion_request_date.isoformat() if self.deletion_request_date else None,
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat()
        }
