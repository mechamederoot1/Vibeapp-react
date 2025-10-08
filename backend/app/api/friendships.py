from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional
from datetime import datetime

from ..database.database import get_db
from ..models.user import User
from ..models.friendship import Friendship
from ..models.notification import Notification
from .auth import get_current_user
from pydantic import BaseModel

router = APIRouter()

# --- Schemas ---
class FriendshipRequest(BaseModel):
    friend_id: int

class FriendshipResponse(BaseModel):
    id: int
    user_id: int
    friend_id: int
    status: str
    initiated_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class UserBasicInfo(BaseModel):
    id: int
    username: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        orm_mode = True

class FriendWithUser(BaseModel):
    friendship: FriendshipResponse
    user_info: UserBasicInfo
    mutual_friends_count: int = 0

    class Config:
        orm_mode = True

# --- Helpers ---

def get_friendship_between_users(db: Session, user1_id: int, user2_id: int) -> Optional[Friendship]:
    return db.query(Friendship).filter(
        or_(
            and_(Friendship.user_id == user1_id, Friendship.friend_id == user2_id),
            and_(Friendship.user_id == user2_id, Friendship.friend_id == user1_id)
        )
    ).first()


def are_friends(db: Session, user1_id: int, user2_id: int) -> bool:
    friendship = get_friendship_between_users(db, user1_id, user2_id)
    return friendship is not None and friendship.status == "accepted"


def count_mutual_friends(db: Session, user1_id: int, user2_id: int) -> int:
    """Count mutual accepted friends between two users using simple sets to avoid SQL subtleties."""
    try:
        # Friends where user1 is the initiator
        f1 = db.query(Friendship.friend_id).filter(Friendship.user_id == user1_id, Friendship.status == 'accepted').all()
        # Friends where user1 is the recipient
        f1b = db.query(Friendship.user_id).filter(Friendship.friend_id == user1_id, Friendship.status == 'accepted').all()
        ids1 = {r[0] for r in (f1 + f1b) if r and r[0] is not None}

        f2 = db.query(Friendship.friend_id).filter(Friendship.user_id == user2_id, Friendship.status == 'accepted').all()
        f2b = db.query(Friendship.user_id).filter(Friendship.friend_id == user2_id, Friendship.status == 'accepted').all()
        ids2 = {r[0] for r in (f2 + f2b) if r and r[0] is not None}

        return len(ids1.intersection(ids2))
    except Exception:
        return 0

# --- Routes ---
@router.post("/requests", response_model=FriendshipResponse)
async def send_friend_request(request: FriendshipRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    target_id = request.friend_id
    if current_user.id == target_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Você não pode adicionar a si mesmo como amigo")

    target_user = db.query(User).filter(User.id == target_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")

    existing = get_friendship_between_users(db, current_user.id, target_id)
    if existing:
        # If pending and initiated by current user -> idempotent
        if existing.status == 'pending':
            if existing.user_id == current_user.id and existing.friend_id == target_id:
                return existing
            # If pending but inverse (other user sent) -> accept automatically
            if existing.user_id == target_id and existing.friend_id == current_user.id:
                existing.status = 'accepted'
                existing.updated_at = datetime.utcnow()
                db.commit()
                db.refresh(existing)
                try:
                    notification = Notification(
                        user_id=existing.user_id,
                        type='friend_accepted',
                        title='Pedido de amizade aceito',
                        message=f"{current_user.display_name or current_user.username} aceitou seu pedido de amizade",
                        related_user_id=current_user.id,
                        related_id=existing.id
                    )
                    db.add(notification)
                    db.commit()
                except Exception:
                    db.rollback()

                try:
                    from ..websocket import manager
                    payload = {"type": "friendship_update", "data": {"userA": existing.user_id, "userB": existing.friend_id, "status": "friends"}}
                    await manager.send_personal_message(payload, existing.user_id)
                    await manager.send_personal_message(payload, existing.friend_id)
                except Exception as e:
                    print(f"WebSocket error auto-accept: {e}")

                return existing
        if existing.status == 'accepted':
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Vocês já são amigos')
        if existing.status == 'blocked':
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Não é poss��vel enviar pedido de amizade')

    # Create new pending friendship
    new_f = Friendship(user_id=current_user.id, friend_id=target_id, status='pending', initiated_by=current_user.id)
    db.add(new_f)
    db.commit()
    db.refresh(new_f)

    # Create notification for recipient
    try:
        notification = Notification(
            user_id=target_id,
            type='friend_request',
            title='Novo pedido de amizade',
            message=f"{current_user.display_name or current_user.username} enviou um pedido de amizade",
            related_user_id=current_user.id,
            related_id=new_f.id
        )
        db.add(notification)
        db.commit()
    except Exception:
        db.rollback()

    # Send via websocket
    try:
        from ..websocket import manager
        payload = {"type": "friendship_update", "data": {"userA": current_user.id, "userB": target_id, "status": "request_sent"}}
        await manager.send_personal_message(payload, current_user.id)
        await manager.send_personal_message(payload, target_id)
        await manager.send_notification({
            "id": notification.id if 'notification' in locals() else None,
            "type": "friend_request",
            "title": notification.title if 'notification' in locals() else 'Novo pedido',
            "message": notification.message if 'notification' in locals() else '',
            "related_user_id": current_user.id,
            "created_at": notification.created_at.isoformat() if 'notification' in locals() else datetime.utcnow().isoformat()
        }, target_id)
    except Exception as e:
        print(f"WebSocket send error in send_friend_request: {e}")

    return new_f

@router.get("/requests/received", response_model=List[FriendWithUser])
def get_received_friend_requests(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    requests = db.query(Friendship).filter(Friendship.friend_id == current_user.id, Friendship.status == 'pending').all()
    print(f"[friendships] received requests for {current_user.id}: {len(requests)}")

    result = []
    for f in requests:
        requester = db.query(User).filter(User.id == f.user_id).first()
        mutual = count_mutual_friends(db, current_user.id, f.user_id)
        result.append(FriendWithUser(
            friendship=FriendshipResponse.from_orm(f),
            user_info=UserBasicInfo.from_orm(requester) if requester else UserBasicInfo(id=0, username='', display_name=None, avatar_url=None),
            mutual_friends_count=mutual
        ))
    return result

@router.get("/requests/sent", response_model=List[FriendWithUser])
def get_sent_friend_requests(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    requests = db.query(Friendship).filter(Friendship.user_id == current_user.id, Friendship.status == 'pending').all()
    print(f"[friendships] sent requests for {current_user.id}: {len(requests)}")

    result = []
    for f in requests:
        target = db.query(User).filter(User.id == f.friend_id).first()
        mutual = count_mutual_friends(db, current_user.id, f.friend_id)
        result.append(FriendWithUser(
            friendship=FriendshipResponse.from_orm(f),
            user_info=UserBasicInfo.from_orm(target) if target else UserBasicInfo(id=0, username='', display_name=None, avatar_url=None),
            mutual_friends_count=mutual
        ))
    return result

@router.put("/requests/{friendship_id}/accept", response_model=FriendshipResponse)
async def accept_friend_request(friendship_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    f = db.query(Friendship).filter(Friendship.id == friendship_id, Friendship.friend_id == current_user.id, Friendship.status == 'pending').first()
    if not f:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Pedido de amizade não encontrado')

    f.status = 'accepted'
    f.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(f)

    try:
        notification = Notification(
            user_id=f.user_id,
            type='friend_accepted',
            title='Pedido de amizade aceito',
            message=f"{current_user.display_name or current_user.username} aceitou seu pedido de amizade",
            related_user_id=current_user.id,
            related_id=f.id
        )
        db.add(notification)
        db.commit()
    except Exception:
        db.rollback()

    try:
        from ..websocket import manager
        payload = {"type": "friendship_update", "data": {"userA": f.user_id, "userB": current_user.id, "status": "friends"}}
        await manager.send_personal_message(payload, f.user_id)
        await manager.send_personal_message(payload, current_user.id)
        await manager.send_notification({
            "id": notification.id if 'notification' in locals() else None,
            "type": "friend_accepted",
            "title": notification.title if 'notification' in locals() else 'Aceito',
            "message": notification.message if 'notification' in locals() else '',
            "related_user_id": current_user.id,
            "created_at": notification.created_at.isoformat() if 'notification' in locals() else datetime.utcnow().isoformat()
        }, f.user_id)
    except Exception as e:
        print(f"WebSocket send error in accept_friend_request: {e}")

    return f

@router.put("/requests/{friendship_id}/reject")
async def reject_friend_request(friendship_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    f = db.query(Friendship).filter(Friendship.id == friendship_id, Friendship.friend_id == current_user.id, Friendship.status == 'pending').first()
    if not f:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Pedido de amizade não encontrado')

    db.delete(f)
    db.commit()

    try:
        from ..websocket import manager
        payload = {"type": "friendship_update", "data": {"userA": f.user_id, "userB": current_user.id, "status": "none"}}
        await manager.send_personal_message(payload, f.user_id)
        await manager.send_personal_message(payload, current_user.id)
    except Exception as e:
        print(f"WebSocket send error in reject_friend_request: {e}")

    return {"message": "Pedido de amizade rejeitado"}

@router.delete("/users/{user_id}")
async def remove_friend(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    f = get_friendship_between_users(db, current_user.id, user_id)
    if not f or f.status != 'accepted':
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Amizade não encontrada')

    db.delete(f)
    db.commit()

    try:
        from ..websocket import manager
        payload = {"type": "friendship_update", "data": {"userA": current_user.id, "userB": user_id, "status": "none"}}
        await manager.send_personal_message(payload, current_user.id)
        await manager.send_personal_message(payload, user_id)
    except Exception as e:
        print(f"WebSocket send error in remove_friend: {e}")

    return {"message": "Amigo removido com sucesso"}

@router.get("/users/{user_id}/friends", response_model=List[FriendWithUser])
def get_user_friends(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db), limit: int = 50):
    friendships = db.query(Friendship).filter(
        or_(
            and_(Friendship.user_id == user_id, Friendship.status == 'accepted'),
            and_(Friendship.friend_id == user_id, Friendship.status == 'accepted')
        )
    ).limit(limit).all()

    result = []
    for f in friendships:
        friend_id = f.friend_id if f.user_id == user_id else f.user_id
        friend_user = db.query(User).filter(User.id == friend_id).first()
        if not friend_user:
            continue
        mutual = count_mutual_friends(db, current_user.id, friend_id)
        result.append(FriendWithUser(
            friendship=FriendshipResponse.from_orm(f),
            user_info=UserBasicInfo.from_orm(friend_user),
            mutual_friends_count=mutual
        ))
    return result

@router.delete("/requests/users/{user_id}")
async def cancel_sent_friend_request(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    f = db.query(Friendship).filter(Friendship.user_id == current_user.id, Friendship.friend_id == user_id, Friendship.status == 'pending').first()
    if not f:
        return {"message": "Nenhum pedido pendente para cancelar"}
    db.delete(f)
    db.commit()

    try:
        from ..websocket import manager
        payload = {"type": "friendship_update", "data": {"userA": current_user.id, "userB": user_id, "status": "none"}}
        await manager.send_personal_message(payload, current_user.id)
        await manager.send_personal_message(payload, user_id)
    except Exception as e:
        print(f"WebSocket send error in cancel_sent_friend_request: {e}")

    return {"message": "Pedido de amizade cancelado"}

@router.get("/users/{user_id}/friendship-status")
def get_friendship_status(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.id == user_id:
        return {"status": "self"}
    f = get_friendship_between_users(db, current_user.id, user_id)
    if not f:
        return {"status": "none"}
    if f.status == 'accepted':
        return {"status": "friends"}
    if f.status == 'pending':
        if f.user_id == current_user.id:
            return {"status": "request_sent"}
        return {"status": "request_received"}
    if f.status == 'blocked':
        return {"status": "blocked"}
    return {"status": "unknown"}

# Helper exported for other modules (like privacy utilities)
def is_friends(db: Session, user1_id: int, user2_id: int) -> bool:
    """Verifica se dois usuários são amigos (aceito)"""
    try:
        f = get_friendship_between_users(db, user1_id, user2_id)
        return f is not None and f.status == 'accepted'
    except Exception:
        return False
