from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from ..database.database import get_db
from ..models import User, Follow, Notification
from .auth import get_current_user

router = APIRouter()

class UserSimple(BaseModel):
    id: int
    username: str
    display_name: str = None
    avatar_url: str = None
    isFollowing: bool = False

    class Config:
        orm_mode = True

@router.get("/users/{user_id}/status")
async def get_follow_status(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user_id == current_user.id:
        return {"isFollowing": False}
    exists = db.query(Follow).filter(Follow.follower_id == current_user.id, Follow.following_id == user_id).first()
    return {"isFollowing": exists is not None}

@router.post("/users/{user_id}")
async def follow_user(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Você não pode seguir a si mesmo")

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")

    existing = db.query(Follow).filter(Follow.follower_id == current_user.id, Follow.following_id == user_id).first()
    if existing:
        return {"isFollowing": True}

    follow = Follow(follower_id=current_user.id, following_id=user_id)
    db.add(follow)
    db.commit()

    # Notificação para seguido
    notification = Notification(
        user_id=user_id,
        type="follow",
        title="Novo seguidor",
        content=f"{current_user.display_name or current_user.username} começou a seguir você",
        related_user_id=current_user.id,
        related_id=follow.id
    )
    db.add(notification)
    db.commit()

    # Envio em tempo real
    try:
        from ..websocket import manager
        await manager.send_notification({
            "id": notification.id,
            "type": "follow",
            "title": notification.title,
            "message": notification.content,
            "related_user_id": current_user.id,
            "created_at": notification.created_at.isoformat()
        }, user_id)
        payload = {"type": "follow_update", "data": {"followerId": current_user.id, "followingId": user_id, "isFollowing": True}}
        await manager.send_personal_message(payload, current_user.id)
        await manager.send_personal_message(payload, user_id)
    except Exception:
        pass

    return {"isFollowing": True}

@router.delete("/users/{user_id}")
async def unfollow_user(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Você não pode deixar de seguir a si mesmo")

    follow = db.query(Follow).filter(Follow.follower_id == current_user.id, Follow.following_id == user_id).first()
    if not follow:
        return {"isFollowing": False}

    db.delete(follow)
    db.commit()

    try:
        from ..websocket import manager
        payload = {"type": "follow_update", "data": {"followerId": current_user.id, "followingId": user_id, "isFollowing": False}}
        await manager.send_personal_message(payload, current_user.id)
        await manager.send_personal_message(payload, user_id)
    except Exception:
        pass

    return {"isFollowing": False}

@router.get("/users/{user_id}/followers", response_model=List[UserSimple])
async def get_followers(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List followers of a user"""
    # Get follow rows where following_id == user_id
    rows = db.query(Follow).filter(Follow.following_id == user_id).all()
    followers = []
    # Precompute set of users current_user follows to indicate isFollowing
    my_followings = set(r.following_id for r in db.query(Follow).filter(Follow.follower_id == current_user.id).all())
    for r in rows:
        u = db.query(User).filter(User.id == r.follower_id).first()
        if not u:
            continue
        followers.append({
            "id": u.id,
            "username": u.username,
            "display_name": getattr(u, 'display_name', None) or getattr(u, 'full_name', None) or None,
            "avatar_url": getattr(u, 'avatar_url', None) or getattr(u, 'avatar', None),
            "isFollowing": (u.id in my_followings)
        })
    return followers

@router.get("/users/{user_id}/following", response_model=List[UserSimple])
async def get_following(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List users that the given user is following"""
    rows = db.query(Follow).filter(Follow.follower_id == user_id).all()
    following = []
    # Precompute set of users current_user follows to indicate isFollowing
    my_followings = set(r.following_id for r in db.query(Follow).filter(Follow.follower_id == current_user.id).all())
    for r in rows:
        u = db.query(User).filter(User.id == r.following_id).first()
        if not u:
            continue
        following.append({
            "id": u.id,
            "username": u.username,
            "display_name": getattr(u, 'display_name', None) or getattr(u, 'full_name', None) or None,
            "avatar_url": getattr(u, 'avatar_url', None) or getattr(u, 'avatar', None),
            "isFollowing": (u.id in my_followings)
        })
    return following
