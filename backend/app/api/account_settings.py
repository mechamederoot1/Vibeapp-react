from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel
from ..database.database import get_db
from ..models.user import User
from ..models.account_settings import AccountSettings
from .auth import get_current_user

router = APIRouter()

class PrivacySettingsUpdate(BaseModel):
    profileVisibility: Optional[str] = None
    messagePrivacy: Optional[str] = None
    storyVisibility: Optional[str] = None
    lastSeenPrivacy: Optional[str] = None

class NotificationSettingsUpdate(BaseModel):
    emailNotifications: Optional[bool] = None
    pushNotifications: Optional[bool] = None
    notificationSound: Optional[bool] = None

class AppearanceSettingsUpdate(BaseModel):
    theme: Optional[str] = None
    language: Optional[str] = None

class SecuritySettingsUpdate(BaseModel):
    twoFactorEnabled: Optional[bool] = None
    loginAlerts: Optional[bool] = None

class DeactivationRequest(BaseModel):
    duration: str  # "1_week", "2_weeks", "1_month"
    reason: Optional[str] = None
    autoReactivation: bool = True

class PasswordChangeRequest(BaseModel):
    currentPassword: str
    newPassword: str

def get_or_create_settings(user: User, db: Session) -> AccountSettings:
    """Get existing settings or create default ones"""
    settings = db.query(AccountSettings).filter(AccountSettings.user_id == user.id).first()
    if not settings:
        settings = AccountSettings(user_id=user.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.get("/")
async def get_account_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user account settings"""
    settings = get_or_create_settings(current_user, db)
    return settings.to_dict()

@router.put("/privacy")
async def update_privacy_settings(
    privacy_data: PrivacySettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update privacy settings"""
    settings = get_or_create_settings(current_user, db)
    
    # Validate visibility options
    valid_visibility = ["public", "friends", "private"]
    valid_message_privacy = ["everyone", "friends", "nobody"]
    valid_story_visibility = ["everyone", "friends", "close_friends"]
    valid_last_seen = ["everyone", "friends", "nobody"]
    
    if privacy_data.profileVisibility and privacy_data.profileVisibility not in valid_visibility:
        raise HTTPException(status_code=400, detail="Invalid profile visibility option")
    
    if privacy_data.messagePrivacy and privacy_data.messagePrivacy not in valid_message_privacy:
        raise HTTPException(status_code=400, detail="Invalid message privacy option")
    
    if privacy_data.storyVisibility and privacy_data.storyVisibility not in valid_story_visibility:
        raise HTTPException(status_code=400, detail="Invalid story visibility option")
    
    if privacy_data.lastSeenPrivacy and privacy_data.lastSeenPrivacy not in valid_last_seen:
        raise HTTPException(status_code=400, detail="Invalid last seen privacy option")
    
    # Update settings
    update_data = privacy_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field == "profileVisibility":
            settings.profile_visibility = value
        elif field == "messagePrivacy":
            settings.message_privacy = value
        elif field == "storyVisibility":
            settings.story_visibility = value
        elif field == "lastSeenPrivacy":
            settings.last_seen_privacy = value
    
    settings.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(settings)
    
    return settings.to_dict()

@router.put("/notifications")
async def update_notification_settings(
    notification_data: NotificationSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update notification settings"""
    settings = get_or_create_settings(current_user, db)
    
    update_data = notification_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field == "emailNotifications":
            settings.email_notifications = value
        elif field == "pushNotifications":
            settings.push_notifications = value
        elif field == "notificationSound":
            settings.notification_sound = value
    
    settings.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(settings)
    
    return settings.to_dict()

@router.put("/appearance")
async def update_appearance_settings(
    appearance_data: AppearanceSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update appearance settings"""
    settings = get_or_create_settings(current_user, db)
    
    valid_themes = ["light", "dark", "auto"]
    valid_languages = ["pt", "en", "es", "fr", "de"]
    
    if appearance_data.theme and appearance_data.theme not in valid_themes:
        raise HTTPException(status_code=400, detail="Invalid theme option")
    
    if appearance_data.language and appearance_data.language not in valid_languages:
        raise HTTPException(status_code=400, detail="Invalid language option")
    
    update_data = appearance_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field == "theme":
            settings.theme = value
        elif field == "language":
            settings.language = value
    
    settings.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(settings)
    
    return settings.to_dict()

@router.put("/security")
async def update_security_settings(
    security_data: SecuritySettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update security settings"""
    settings = get_or_create_settings(current_user, db)
    
    update_data = security_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field == "twoFactorEnabled":
            settings.two_factor_enabled = value
        elif field == "loginAlerts":
            settings.login_alerts = value
    
    settings.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(settings)
    
    return settings.to_dict()

@router.post("/change-password")
async def change_password(
    password_data: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    # Verify current password
    if not current_user.verify_password(password_data.currentPassword):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Validate new password
    if len(password_data.newPassword) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long"
        )
    
    # Set new password
    current_user.set_password(password_data.newPassword)
    current_user.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Password changed successfully"}

@router.post("/deactivate")
async def deactivate_account(
    deactivation_data: DeactivationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Temporarily deactivate account"""
    settings = get_or_create_settings(current_user, db)
    
    # Calculate end date based on duration
    duration_map = {
        "1_week": 7,
        "2_weeks": 14,
        "1_month": 30
    }
    
    if deactivation_data.duration not in duration_map:
        raise HTTPException(
            status_code=400,
            detail="Invalid duration. Must be '1_week', '2_weeks', or '1_month'"
        )
    
    days = duration_map[deactivation_data.duration]
    end_date = datetime.utcnow() + timedelta(days=days)
    
    # Update user and settings
    current_user.is_active = False
    current_user.updated_at = datetime.utcnow()
    
    settings.account_status = "deactivated"
    settings.deactivation_end_date = end_date
    settings.auto_reactivation = deactivation_data.autoReactivation
    settings.deactivation_reason = deactivation_data.reason
    settings.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "message": "Account deactivated successfully",
        "reactivationDate": end_date.isoformat(),
        "autoReactivation": deactivation_data.autoReactivation
    }

@router.post("/reactivate")
async def reactivate_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reactivate deactivated account"""
    settings = get_or_create_settings(current_user, db)
    
    if settings.account_status != "deactivated":
        raise HTTPException(
            status_code=400,
            detail="Account is not deactivated"
        )
    
    # Reactivate account
    current_user.is_active = True
    current_user.updated_at = datetime.utcnow()
    
    settings.account_status = "active"
    settings.deactivation_end_date = None
    settings.deactivation_reason = None
    settings.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Account reactivated successfully"}

@router.post("/request-deletion")
async def request_account_deletion(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Request permanent account deletion"""
    settings = get_or_create_settings(current_user, db)
    
    # Set deletion request
    settings.deletion_requested = True
    settings.deletion_request_date = datetime.utcnow()
    settings.account_status = "deletion_requested"
    settings.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "message": "Account deletion requested successfully. You have 30 days to cancel this request.",
        "deletionRequestDate": settings.deletion_request_date.isoformat()
    }

@router.post("/cancel-deletion")
async def cancel_account_deletion(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel account deletion request"""
    settings = get_or_create_settings(current_user, db)
    
    if not settings.deletion_requested:
        raise HTTPException(
            status_code=400,
            detail="No deletion request found"
        )
    
    # Cancel deletion request
    settings.deletion_requested = False
    settings.deletion_request_date = None
    settings.account_status = "active"
    settings.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Account deletion request cancelled successfully"}

@router.delete("/delete-permanently")
async def delete_account_permanently(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Permanently delete account (admin only or after 30 days)"""
    settings = get_or_create_settings(current_user, db)
    
    # Check if deletion was requested and enough time has passed
    if not settings.deletion_requested:
        raise HTTPException(
            status_code=400,
            detail="Account deletion must be requested first"
        )
    
    # Check if 30 days have passed since deletion request
    if settings.deletion_request_date:
        days_since_request = (datetime.utcnow() - settings.deletion_request_date).days
        if days_since_request < 30:
            raise HTTPException(
                status_code=400,
                detail=f"Account can only be deleted after 30 days. {30 - days_since_request} days remaining."
            )
    
    # Mark account as deleted (we don't actually delete the data for legal/audit purposes)
    current_user.is_active = False
    current_user.email = f"deleted_{current_user.id}@deleted.user"
    current_user.username = f"deleted_user_{current_user.id}"
    current_user.first_name = "Deleted"
    current_user.last_name = "User"
    current_user.bio = None
    current_user.avatar = None
    current_user.cover_photo = None
    current_user.location = None
    current_user.website = None
    current_user.phone = None
    current_user.updated_at = datetime.utcnow()
    
    settings.account_status = "deleted"
    settings.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Account deleted permanently"}
