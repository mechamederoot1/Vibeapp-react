from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Optional, List
from pydantic import BaseModel

from ..database.database import get_db
from ..models import User, Post, PostShare, Notification
from .auth import get_current_user

router = APIRouter()

# Schemas
class ShareCreate(BaseModel):
    shareText: Optional[str] = None

class ShareResponse(BaseModel):
    id: int
    userId: int
    originalPostId: int
    shareText: Optional[str]
    createdAt: str
    user: dict
    originalPost: dict

@router.post("/posts/{post_id}/share", response_model=dict)
async def share_post(
    post_id: int,
    share_data: ShareCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Compartilhar um post"""
    # Verificar se o post existe
    original_post = db.query(Post).filter(Post.id == post_id).first()
    if not original_post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Verificar se não está tentando compartilhar o próprio post
    if original_post.author_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot share your own post"
        )
    
    # Verificar se já compartilhou este post
    existing_share = db.query(PostShare).filter(
        and_(
            PostShare.user_id == current_user.id,
            PostShare.original_post_id == post_id
        )
    ).first()
    
    if existing_share:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already shared this post"
        )
    
    # Criar compartilhamento
    new_share = PostShare(
        user_id=current_user.id,
        original_post_id=post_id,
        share_text=share_data.shareText
    )
    
    db.add(new_share)
    
    # Incrementar contador de shares do post original
    original_post.shares_count += 1
    
    db.commit()
    db.refresh(new_share)
    
    # Criar notificação para o autor do post original
    notification = Notification(
        user_id=original_post.author_id,
        type="share",
        title=f"{current_user.full_name} compartilhou seu post",
        message=share_data.shareText[:100] if share_data.shareText else "Compartilhou seu post",
        related_user_id=current_user.id,
        related_post_id=post_id,
        action_url=f"/posts/{post_id}"
    )
    
    db.add(notification)
    db.commit()
    
    # Enviar notificação em tempo real
    try:
        from ..websocket import manager
        await manager.send_share_notification({
            "type": "post_share",
            "postId": post_id,
            "shareText": share_data.shareText,
            "user": current_user.to_public_dict()
        }, original_post.author_id)
    except ImportError:
        pass  # WebSocket não disponível
    
    return {
        "message": "Post shared successfully",
        "share": new_share.to_dict()
    }

@router.delete("/posts/{post_id}/share")
async def unshare_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remover compartilhamento de um post"""
    # Buscar compartilhamento
    share = db.query(PostShare).filter(
        and_(
            PostShare.user_id == current_user.id,
            PostShare.original_post_id == post_id
        )
    ).first()
    
    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share not found"
        )
    
    # Buscar post original
    original_post = db.query(Post).filter(Post.id == post_id).first()
    if original_post and original_post.shares_count > 0:
        original_post.shares_count -= 1
    
    # Remover compartilhamento
    db.delete(share)
    db.commit()
    
    return {"message": "Post unshared successfully"}

@router.get("/posts/{post_id}/shares", response_model=List[dict])
async def get_post_shares(
    post_id: int,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter compartilhamentos de um post"""
    # Verificar se o post existe
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Buscar compartilhamentos
    shares = db.query(PostShare).filter(
        PostShare.original_post_id == post_id
    ).offset(offset).limit(limit).all()
    
    return [share.to_dict() for share in shares]

@router.get("/users/{user_id}/shares", response_model=List[dict])
async def get_user_shares(
    user_id: int,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter posts compartilhados por um usuário"""
    # Verificar se o usuário existe
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Buscar compartilhamentos do usuário
    shares = db.query(PostShare).filter(
        PostShare.user_id == user_id
    ).offset(offset).limit(limit).all()
    
    return [share.to_dict() for share in shares]

@router.get("/my-shares", response_model=List[dict])
async def get_my_shares(
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter meus compartilhamentos"""
    shares = db.query(PostShare).filter(
        PostShare.user_id == current_user.id
    ).offset(offset).limit(limit).all()
    
    return [share.to_dict() for share in shares]

@router.get("/feed-with-shares", response_model=List[dict])
async def get_feed_with_shares(
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter feed incluindo posts compartilhados"""
    # Buscar posts originais
    original_posts = db.query(Post).filter(
        Post.is_active == True
    ).offset(offset).limit(limit // 2).all()
    
    # Buscar compartilhamentos
    shares = db.query(PostShare).offset(offset).limit(limit // 2).all()
    
    # Combinar posts originais e compartilhamentos
    feed_items = []
    
    # Adicionar posts originais
    for post in original_posts:
        feed_items.append({
            "type": "original_post",
            "data": post.to_dict(current_user.id),
            "createdAt": post.created_at.isoformat()
        })
    
    # Adicionar compartilhamentos
    for share in shares:
        feed_items.append({
            "type": "shared_post",
            "data": share.to_dict(),
            "createdAt": share.created_at.isoformat()
        })
    
    # Ordenar por data de criação
    feed_items.sort(key=lambda x: x["createdAt"], reverse=True)
    
    return feed_items[:limit]
