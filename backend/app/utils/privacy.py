from sqlalchemy.orm import Session
from typing import Optional
from ..models.user import User
from ..models.account_settings import AccountSettings
from ..api.friendships import is_friends

def can_view_profile(db: Session, viewer_id: Optional[int], profile_owner_id: int) -> bool:
    """
    Verifica se o viewer pode ver o perfil do profile_owner
    """
    # Se não há viewer (usuário não logado), só pode ver perfis públicos
    if not viewer_id:
        settings = db.query(AccountSettings).filter(
            AccountSettings.user_id == profile_owner_id
        ).first()
        return settings is None or settings.profile_visibility == "public"
    
    # Se é o próprio usuário, sempre pode ver
    if viewer_id == profile_owner_id:
        return True
    
    # Buscar configurações de privacidade
    settings = db.query(AccountSettings).filter(
        AccountSettings.user_id == profile_owner_id
    ).first()
    
    # Se não há configurações, assume público
    if not settings:
        return True
    
    # Verificar visibilidade do perfil
    if settings.profile_visibility == "public":
        return True
    elif settings.profile_visibility == "friends":
        return is_friends(db, viewer_id, profile_owner_id)
    elif settings.profile_visibility == "private":
        return False
    
    return True

def can_view_posts(db: Session, viewer_id: Optional[int], post_owner_id: int) -> bool:
    """
    Verifica se o viewer pode ver os posts do post_owner
    """
    # Por agora, usa a mesma lógica do perfil
    # Pode ser expandido para ter configurações específicas de posts
    return can_view_profile(db, viewer_id, post_owner_id)

def can_view_post(db: Session, viewer_id: Optional[int], post_owner_id: int, post_privacy: str) -> bool:
    """
    Verifica se o viewer pode ver um post específico baseado na privacidade do post
    """
    # Se é o próprio autor, sempre pode ver
    if viewer_id == post_owner_id:
        return True

    # Verificar privacidade do post
    if post_privacy == "public":
        return True
    elif post_privacy == "friends":
        # Se não está logado, não pode ver posts de amigos
        if not viewer_id:
            return False
        return is_friends(db, viewer_id, post_owner_id)
    elif post_privacy == "private":
        # Posts privados só o autor pode ver
        return False

    # Fallback para público
    return True

def can_view_stories(db: Session, viewer_id: Optional[int], story_owner_id: int) -> bool:
    """
    Verifica se o viewer pode ver as stories do story_owner
    """
    if not viewer_id:
        settings = db.query(AccountSettings).filter(
            AccountSettings.user_id == story_owner_id
        ).first()
        return settings is None or settings.story_visibility == "public"
    
    if viewer_id == story_owner_id:
        return True
    
    settings = db.query(AccountSettings).filter(
        AccountSettings.user_id == story_owner_id
    ).first()
    
    if not settings:
        return True
    
    if settings.story_visibility == "public":
        return True
    elif settings.story_visibility == "friends":
        return is_friends(db, viewer_id, story_owner_id)
    elif settings.story_visibility == "private":
        return False
    
    return True

def can_send_message(db: Session, sender_id: int, recipient_id: int) -> bool:
    """
    Verifica se o sender pode enviar mensagem para o recipient
    """
    if sender_id == recipient_id:
        return False
    
    settings = db.query(AccountSettings).filter(
        AccountSettings.user_id == recipient_id
    ).first()
    
    if not settings:
        return True
    
    if settings.message_privacy == "everyone":
        return True
    elif settings.message_privacy == "friends":
        return is_friends(db, sender_id, recipient_id)
    elif settings.message_privacy == "nobody":
        return False
    
    return True

def filter_user_data(db: Session, viewer_id: Optional[int], user_data: dict) -> dict:
    """
    Filtra dados do usuário baseado nas permissões de privacidade
    """
    user_id = user_data.get("id")
    if not user_id:
        return user_data
    
    if not can_view_profile(db, viewer_id, user_id):
        # Retorna apenas dados básicos para perfis privados
        return {
            "id": user_data.get("id"),
            "username": user_data.get("username"),
            "display_name": user_data.get("display_name"),
            "avatar_url": user_data.get("avatar_url"),
            "profile_private": True
        }
    
    return user_data

def get_visibility_info(db: Session, user_id: int) -> dict:
    """
    Retorna informações sobre as configurações de visibilidade do usuário
    """
    settings = db.query(AccountSettings).filter(
        AccountSettings.user_id == user_id
    ).first()
    
    if not settings:
        return {
            "profile_visibility": "public",
            "story_visibility": "public", 
            "message_privacy": "everyone",
            "last_seen_privacy": "everyone"
        }
    
    return {
        "profile_visibility": settings.profile_visibility,
        "story_visibility": settings.story_visibility,
        "message_privacy": settings.message_privacy,
        "last_seen_privacy": settings.last_seen_privacy
    }
