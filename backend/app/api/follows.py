from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database.database import get_db
from ..models import User, Follow, Notification
from .auth import get_current_user

router = APIRouter()

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
