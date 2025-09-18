from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from ..database.database import get_db
from ..models.user import User
from ..models.friendship import Friendship
from ..models.profile_view import ProfileView
from .auth import get_current_user
from ..utils.privacy import can_view_profile, filter_user_data

router = APIRouter()

class UserUpdate(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    bio: Optional[str] = None
    avatar: Optional[str] = None
    coverPhoto: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    birthDate: Optional[str] = None
    gender: Optional[str] = None

@router.get("/profile")
async def get_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user's profile"""
    return current_user.to_dict()

@router.put("/profile")
async def update_user_profile(
    user_data: UserUpdate, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile"""
    
    # Check if username is taken (if being updated)
    if user_data.username and user_data.username != current_user.username:
        existing_user = db.query(User).filter(
            User.username == user_data.username,
            User.id != current_user.id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
    
    # Check if email is taken (if being updated)
    if user_data.email and user_data.email != current_user.email:
        existing_user = db.query(User).filter(
            User.email == user_data.email,
            User.id != current_user.id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    # Update fields
    update_data = user_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field == "firstName":
            current_user.first_name = value
        elif field == "lastName":
            current_user.last_name = value
        elif field == "username":
            current_user.username = value
        elif field == "email":
            current_user.email = value
        elif field == "bio":
            current_user.bio = value
        elif field == "avatar":
            current_user.avatar = value
        elif field == "coverPhoto":
            current_user.cover_photo = value
        elif field == "location":
            current_user.location = value
        elif field == "website":
            current_user.website = value
        elif field == "phone":
            current_user.phone = value
        elif field == "birthDate" and value:
            current_user.birth_date = datetime.strptime(value, "%Y-%m-%d").date()
        elif field == "gender":
            current_user.gender = value
    
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    
    return current_user.to_dict()

@router.get("/by-public-id/{public_id}")
async def get_user_by_public_id(
    public_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user profile by public profile id"""
    user = db.query(User).filter(User.public_profile_id == public_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if not can_view_profile(db, current_user.id, user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Este perfil é privado")

    if user.id != current_user.id:
        today = datetime.utcnow().date()
        existing_view = db.query(ProfileView).filter(
            ProfileView.viewer_id == current_user.id,
            ProfileView.profile_owner_id == user.id,
            ProfileView.created_at >= today
        ).first()
        if not existing_view:
            profile_view = ProfileView(
                viewer_id=current_user.id,
                profile_owner_id=user.id
            )
            db.add(profile_view)
            db.commit()

    user_data = user.to_public_dict()
    return filter_user_data(db, current_user.id, user_data)

@router.get("/by-username/{username}")
async def get_user_by_username(
    username: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user profile by username"""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if not can_view_profile(db, current_user.id, user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Este perfil é privado")

    if user.id != current_user.id:
        today = datetime.utcnow().date()
        existing_view = db.query(ProfileView).filter(
            ProfileView.viewer_id == current_user.id,
            ProfileView.profile_owner_id == user.id,
            ProfileView.created_at >= today
        ).first()
        if not existing_view:
            profile_view = ProfileView(
                viewer_id=current_user.id,
                profile_owner_id=user.id
            )
            db.add(profile_view)
            db.commit()

    user_data = user.to_public_dict()
    return filter_user_data(db, current_user.id, user_data)

@router.get("/{user_id}")
async def get_user_by_id(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user profile by ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Verificar se o usuário atual pode ver este perfil
    if not can_view_profile(db, current_user.id, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Este perfil é privado"
        )

    # Record profile view if it's not the current user
    if user_id != current_user.id:
        # Check if view already exists today
        today = datetime.utcnow().date()
        existing_view = db.query(ProfileView).filter(
            ProfileView.viewer_id == current_user.id,
            ProfileView.profile_owner_id == user_id,
            ProfileView.created_at >= today
        ).first()

        if not existing_view:
            # Create new profile view
            profile_view = ProfileView(
                viewer_id=current_user.id,
                profile_owner_id=user_id
            )
            db.add(profile_view)
            db.commit()

    # Filtrar dados baseado na privacidade
    user_data = user.to_public_dict()
    return filter_user_data(db, current_user.id, user_data)

@router.get("/{user_id}/stats")
async def get_user_stats(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user statistics"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Count friends (accepted friendships)
    friends_count = db.query(Friendship).filter(
        ((Friendship.user_id == user_id) | (Friendship.friend_id == user_id)) &
        (Friendship.status == "accepted")
    ).count()
    
    # Count followers (people who added this user as friend)
    followers_count = db.query(Friendship).filter(
        Friendship.friend_id == user_id,
        Friendship.status == "accepted"
    ).count()
    
    # Count following (people this user added as friend)
    following_count = db.query(Friendship).filter(
        Friendship.user_id == user_id,
        Friendship.status == "accepted"
    ).count()
    
    # Count posts
    from ..models.post import Post
    posts_count = db.query(Post).filter(
        Post.author_id == user_id,
        Post.is_active == True
    ).count()
    
    # Count profile views (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    profile_views_count = db.query(ProfileView).filter(
        ProfileView.profile_owner_id == user_id,
        ProfileView.created_at >= thirty_days_ago
    ).count()
    
    return {
        "userId": user_id,
        "friendsCount": friends_count,
        "followersCount": followers_count,
        "followingCount": following_count,
        "postsCount": posts_count,
        "profileViewsCount": profile_views_count
    }

@router.get("/{user_id}/visitors")
async def get_profile_visitors(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 10
):
    """Get recent profile visitors"""
    
    # Only allow users to see their own visitors
    if user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Get recent visitors
    visitors = db.query(ProfileView).filter(
        ProfileView.profile_owner_id == user_id
    ).order_by(ProfileView.created_at.desc()).limit(limit).all()

    visitor_data = []
    for view in visitors:
        visitor = db.query(User).filter(User.id == view.viewer_id).first()
        if visitor:
            visitor_data.append({
                "user": visitor.to_public_dict(),
                "viewedAt": view.created_at.isoformat()
            })
    
    return visitor_data

@router.get("/search")
async def search_users(
    q: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 20
):
    """Search users by name or username"""
    
    if len(q) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Search query must be at least 2 characters"
        )
    
    # Search by first name, last name, or username
    users = db.query(User).filter(
        (User.first_name.ilike(f"%{q}%")) |
        (User.last_name.ilike(f"%{q}%")) |
        (User.username.ilike(f"%{q}%"))
    ).filter(User.is_active == True).limit(limit).all()
    
    return [user.to_public_dict() for user in users]
