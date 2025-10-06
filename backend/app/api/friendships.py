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

# Schemas de request/response
class FriendshipRequest(BaseModel):
    friend_id: int

class FriendshipResponse(BaseModel):
    id: int
    user_id: int
    friend_id: int
    status: str
    initiated_by: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        orm_mode = True

class UserBasicInfo(BaseModel):
    id: int
    username: str
    display_name: Optional[str]
    avatar_url: Optional[str]
    
    class Config:
        orm_mode = True

class FriendWithUser(BaseModel):
    friendship: FriendshipResponse
    user_info: UserBasicInfo
    mutual_friends_count: int = 0

# Função helper para verificar se existe amizade
def get_friendship_between_users(db: Session, user1_id: int, user2_id: int) -> Optional[Friendship]:
    return db.query(Friendship).filter(
        or_(
            and_(Friendship.user_id == user1_id, Friendship.friend_id == user2_id),
            and_(Friendship.user_id == user2_id, Friendship.friend_id == user1_id)
        )
    ).first()

# Função helper para verificar se são amigos
def are_friends(db: Session, user1_id: int, user2_id: int) -> bool:
    friendship = get_friendship_between_users(db, user1_id, user2_id)
    return friendship is not None and friendship.status == "accepted"

# Função helper para contar amigos em comum
def count_mutual_friends(db: Session, user1_id: int, user2_id: int) -> int:
    user1_friends = db.query(Friendship.friend_id).filter(
        Friendship.user_id == user1_id, 
        Friendship.status == "accepted"
    ).union(
        db.query(Friendship.user_id).filter(
            Friendship.friend_id == user1_id, 
            Friendship.status == "accepted"
        )
    ).subquery()
    
    user2_friends = db.query(Friendship.friend_id).filter(
        Friendship.user_id == user2_id, 
        Friendship.status == "accepted"
    ).union(
        db.query(Friendship.user_id).filter(
            Friendship.friend_id == user2_id, 
            Friendship.status == "accepted"
        )
    ).subquery()
    
    # Contar interseção
    mutual_count = db.query(user1_friends.c.friend_id).join(
        user2_friends, user1_friends.c.friend_id == user2_friends.c.friend_id
    ).count()
    
    return mutual_count

@router.post("/requests", response_model=FriendshipResponse)
async def send_friend_request(
    request: FriendshipRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Enviar pedido de amizade"""
    
    # Verificar se o usuário existe
    target_user = db.query(User).filter(User.id == request.friend_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Não pode adicionar a si mesmo
    if current_user.id == request.friend_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você não pode adicionar a si mesmo como amigo"
        )
    
    # Verificar se já existe alguma amizade entre eles
    existing_friendship = get_friendship_between_users(db, current_user.id, request.friend_id)
    if existing_friendship:
        if existing_friendship.status == "pending":
            # Se já existe um pedido enviado por mim, tornar idempotente
            if existing_friendship.user_id == current_user.id and existing_friendship.friend_id == request.friend_id:
                return existing_friendship
            # Se existe um pedido inverso (o outro usuário me enviou), aceitar automaticamente
            if existing_friendship.user_id == request.friend_id and existing_friendship.friend_id == current_user.id:
                existing_friendship.status = "accepted"
                existing_friendship.updated_at = datetime.utcnow()
                db.commit()
                db.refresh(existing_friendship)

                # Notificar o remetente original que foi aceito
                try:
                    notification = Notification(
                        user_id=existing_friendship.user_id,
                        type="friend_accepted",
                        title="Pedido de amizade aceito",
                        message=f"{current_user.display_name or current_user.username} aceitou seu pedido de amizade",
                        related_user_id=current_user.id,
                        related_id=existing_friendship.id
                    )
                    db.add(notification)
                    db.commit()
                except Exception:
                    pass

                # WebSocket push
                try:
                    from ..websocket import manager
                    await manager.send_notification({
                        "id": notification.id,
                        "type": "friend_accepted",
                        "title": notification.title,
                        "message": notification.message,
                        "related_user_id": current_user.id,
                        "created_at": notification.created_at.isoformat()
                    }, existing_friendship.user_id)
                    payload = {"type": "friendship_update", "data": {"userA": existing_friendship.user_id, "userB": existing_friendship.friend_id, "status": "friends"}}
                    await manager.send_personal_message(payload, existing_friendship.user_id)
                    await manager.send_personal_message(payload, existing_friendship.friend_id)
                except Exception:
                    pass

                return existing_friendship

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Já existe um pedido de amizade pendente"
            )
        elif existing_friendship.status == "accepted":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vocês já são amigos"
            )
        elif existing_friendship.status == "blocked":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Não é possível enviar pedido de amizade"
            )
    
    # Criar novo pedido de amizade
    new_friendship = Friendship(
        user_id=current_user.id,
        friend_id=request.friend_id,
        status="pending",
        initiated_by=current_user.id
    )
    
    db.add(new_friendship)
    db.commit()
    db.refresh(new_friendship)
    
    # Criar notificação para o usuário alvo
    notification = Notification(
        user_id=request.friend_id,
        type="friend_request",
        title="Novo pedido de amizade",
        message=f"{current_user.display_name or current_user.username} enviou um pedido de amizade",
        related_user_id=current_user.id,
        related_id=new_friendship.id
    )
    
    db.add(notification)
    db.commit()

    # WebSocket push
    try:
        from ..websocket import manager
        await manager.send_notification({
            "id": notification.id,
            "type": "friend_request",
            "title": notification.title,
            "message": notification.message,
            "related_user_id": current_user.id,
            "created_at": notification.created_at.isoformat()
        }, request.friend_id)
        payload = {"type": "friendship_update", "data": {"userA": current_user.id, "userB": request.friend_id, "status": "request_sent"}}
        await manager.send_personal_message(payload, current_user.id)
        await manager.send_personal_message(payload, request.friend_id)
    except Exception as e:
        print(f"WebSocket send error in send_friend_request: {e}")

    return new_friendship

@router.get("/requests/received", response_model=List[FriendWithUser])
def get_received_friend_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Listar pedidos de amizade recebidos"""
    
    requests = db.query(Friendship).filter(
        Friendship.friend_id == current_user.id,
        Friendship.status == "pending"
    ).all()
    
    result = []
    for friendship in requests:
        requester = db.query(User).filter(User.id == friendship.user_id).first()
        mutual_count = count_mutual_friends(db, current_user.id, friendship.user_id)
        
        result.append(FriendWithUser(
            friendship=friendship,
            user_info=UserBasicInfo(
                id=requester.id,
                username=requester.username,
                display_name=requester.display_name,
                avatar_url=requester.avatar_url
            ),
            mutual_friends_count=mutual_count
        ))
    
    return result

@router.get("/requests/sent", response_model=List[FriendWithUser])
def get_sent_friend_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Listar pedidos de amizade enviados"""
    
    requests = db.query(Friendship).filter(
        Friendship.user_id == current_user.id,
        Friendship.status == "pending"
    ).all()
    
    result = []
    for friendship in requests:
        target_user = db.query(User).filter(User.id == friendship.friend_id).first()
        mutual_count = count_mutual_friends(db, current_user.id, friendship.friend_id)
        
        result.append(FriendWithUser(
            friendship=friendship,
            user_info=UserBasicInfo(
                id=target_user.id,
                username=target_user.username,
                display_name=target_user.display_name,
                avatar_url=target_user.avatar_url
            ),
            mutual_friends_count=mutual_count
        ))
    
    return result

@router.put("/requests/{friendship_id}/accept", response_model=FriendshipResponse)
async def accept_friend_request(
    friendship_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Aceitar pedido de amizade"""
    
    friendship = db.query(Friendship).filter(
        Friendship.id == friendship_id,
        Friendship.friend_id == current_user.id,
        Friendship.status == "pending"
    ).first()
    
    if not friendship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pedido de amizade n��o encontrado"
        )
    
    # Aceitar o pedido
    friendship.status = "accepted"
    friendship.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(friendship)
    
    # Criar notificação para quem enviou o pedido
    notification = Notification(
        user_id=friendship.user_id,
        type="friend_accepted",
        title="Pedido de amizade aceito",
        message=f"{current_user.display_name or current_user.username} aceitou seu pedido de amizade",
        related_user_id=current_user.id,
        related_id=friendship.id
    )
    
    db.add(notification)
    db.commit()

    # WebSocket push
    try:
        from ..websocket import manager
        await manager.send_notification({
            "id": notification.id,
            "type": "friend_accepted",
            "title": notification.title,
            "message": notification.message,
            "related_user_id": current_user.id,
            "created_at": notification.created_at.isoformat()
        }, friendship.user_id)
        payload = {"type": "friendship_update", "data": {"userA": friendship.user_id, "userB": current_user.id, "status": "friends"}}
        await manager.send_personal_message(payload, friendship.user_id)
        await manager.send_personal_message(payload, current_user.id)
    except Exception as e:
        print(f"WebSocket send error in accept_friend_request: {e}")

    return friendship

@router.put("/requests/{friendship_id}/reject")
async def reject_friend_request(
    friendship_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Rejeitar pedido de amizade"""
    
    friendship = db.query(Friendship).filter(
        Friendship.id == friendship_id,
        Friendship.friend_id == current_user.id,
        Friendship.status == "pending"
    ).first()
    
    if not friendship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pedido de amizade não encontrado"
        )
    
    # Remover o pedido
    db.delete(friendship)
    db.commit()

    try:
        from ..websocket import manager
        payload = {"type": "friendship_update", "data": {"userA": friendship.user_id, "userB": current_user.id, "status": "none"}}
        await manager.send_personal_message(payload, friendship.user_id)
        await manager.send_personal_message(payload, current_user.id)
    except Exception as e:
        print(f"WebSocket send error in reject_friend_request: {e}")

    return {"message": "Pedido de amizade rejeitado"}

@router.delete("/users/{user_id}")
async def remove_friend(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remover amigo"""
    
    friendship = get_friendship_between_users(db, current_user.id, user_id)
    
    if not friendship or friendship.status != "accepted":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Amizade não encontrada"
        )
    
    # Remover a amizade
    db.delete(friendship)
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
def get_user_friends(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50
):
    """Listar amigos de um usuário"""
    
    # Verificar privacidade (implementar depois)
    # Por agora, qualquer um pode ver a lista de amigos
    
    # Buscar amizades aceitas onde o usuário está em qualquer lado
    friendships = db.query(Friendship).filter(
        or_(
            and_(Friendship.user_id == user_id, Friendship.status == "accepted"),
            and_(Friendship.friend_id == user_id, Friendship.status == "accepted")
        )
    ).limit(limit).all()
    
    result = []
    for friendship in friendships:
        # Determinar qual é o amigo (não o user_id solicitado)
        friend_id = friendship.friend_id if friendship.user_id == user_id else friendship.user_id
        friend_user = db.query(User).filter(User.id == friend_id).first()
        
        if friend_user:
            mutual_count = count_mutual_friends(db, current_user.id, friend_id)
            
            result.append(FriendWithUser(
                friendship=friendship,
                user_info=UserBasicInfo(
                    id=friend_user.id,
                    username=friend_user.username,
                    display_name=friend_user.display_name,
                    avatar_url=friend_user.avatar_url
                ),
                mutual_friends_count=mutual_count
            ))
    
    return result

@router.delete("/requests/users/{user_id}")
async def cancel_sent_friend_request(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancelar um pedido de amizade enviado pelo usuário atual para o user_id informado"""
    friendship = db.query(Friendship).filter(
        Friendship.user_id == current_user.id,
        Friendship.friend_id == user_id,
        Friendship.status == "pending"
    ).first()

    if not friendship:
        # Torna idempotente: se não houver pedido pendente enviado, considera OK
        return {"message": "Nenhum pedido pendente para cancelar"}

    db.delete(friendship)
    db.commit()

    try:
        from ..websocket import manager
        payload = {"type": "friendship_update", "data": {"userA": current_user.id, "userB": user_id, "status": "none"}}
        await manager.send_personal_message(payload, current_user.id)
        await manager.send_personal_message(payload, user_id)
    except Exception:
        pass

    return {"message": "Pedido de amizade cancelado"}

@router.get("/users/{user_id}/friendship-status")
def get_friendship_status(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verificar status de amizade com um usuário"""

    if current_user.id == user_id:
        return {"status": "self"}

    friendship = get_friendship_between_users(db, current_user.id, user_id)

    if not friendship:
        return {"status": "none"}

    # Determinar o status específico
    if friendship.status == "accepted":
        return {"status": "friends"}
    elif friendship.status == "pending":
        if friendship.user_id == current_user.id:
            return {"status": "request_sent"}
        else:
            return {"status": "request_received"}
    elif friendship.status == "blocked":
        return {"status": "blocked"}

    return {"status": "unknown"}

# Função helper exportada para outros módulos
def is_friends(db: Session, user1_id: int, user2_id: int) -> bool:
    """Função helper para verificar se dois usuários são amigos"""
    return are_friends(db, user1_id, user2_id)
