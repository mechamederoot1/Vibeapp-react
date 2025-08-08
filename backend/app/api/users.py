from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List

from app.database.database import get_db
from app.models.user import User
from app.models.friendship import Friendship
from app.models.profile_view import ProfileView
from app.schemas.user import UserResponse, UserProfile, UserUpdate
from app.api.auth import get_current_user

router = APIRouter()

@router.get("/me/profile", response_model=UserProfile)
async def get_my_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Contar posts
    posts_count = db.query(func.count()).select_from(current_user.posts).scalar()
    
    # Contar seguidores (pessoas que seguem o usuário atual)
    followers_count = db.query(func.count(Friendship.id)).filter(
        and_(
            Friendship.friend_id == current_user.id,
            Friendship.status == "accepted"
        )
    ).scalar()
    
    # Contar seguindo (pessoas que o usuário atual segue)
    following_count = db.query(func.count(Friendship.id)).filter(
        and_(
            Friendship.user_id == current_user.id,
            Friendship.status == "accepted"
        )
    ).scalar()
    
    # Contar amigos (seguindo mutuamente)
    friends_count = db.query(func.count(Friendship.id)).filter(
        and_(
            Friendship.user_id == current_user.id,
            Friendship.status == "accepted",
            # Verificar se existe amizade mútua
            db.query(Friendship).filter(
                and_(
                    Friendship.user_id == current_user.id,
                    Friendship.friend_id == Friendship.friend_id,
                    Friendship.status == "accepted"
                )
            ).exists()
        )
    ).scalar()
    
    profile_data = {
        **current_user.__dict__,
        "posts_count": posts_count,
        "followers_count": followers_count, 
        "following_count": following_count,
        "friends_count": friends_count
    }
    
    return UserProfile(**profile_data)

@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Atualizar campos fornecidos
    for field, value in user_update.dict(exclude_unset=True).items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/{user_id}", response_model=UserProfile)
async def get_user_profile(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Registrar visualização do perfil
    if user_id != current_user.id:
        existing_view = db.query(ProfileView).filter(
            and_(
                ProfileView.viewer_id == current_user.id,
                ProfileView.profile_owner_id == user_id,
                func.date(ProfileView.created_at) == func.date(func.now())
            )
        ).first()
        
        if not existing_view:
            profile_view = ProfileView(
                viewer_id=current_user.id,
                profile_owner_id=user_id,
                source="profile"
            )
            db.add(profile_view)
            db.commit()
    
    # Contar estatísticas do usuário
    posts_count = len(user.posts)
    followers_count = db.query(func.count(Friendship.id)).filter(
        and_(Friendship.friend_id == user_id, Friendship.status == "accepted")
    ).scalar()
    following_count = db.query(func.count(Friendship.id)).filter(
        and_(Friendship.user_id == user_id, Friendship.status == "accepted")
    ).scalar()
    
    # Calcular amigos (seguindo mutuamente)
    friends_count = 0  # Implementar lógica de amigos mútuos
    
    profile_data = {
        **user.__dict__,
        "posts_count": posts_count,
        "followers_count": followers_count,
        "following_count": following_count,
        "friends_count": friends_count
    }
    
    return UserProfile(**profile_data)

@router.get("/{user_id}/visitors", response_model=List[dict])
async def get_profile_visitors(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verificar se é o próprio usuário ou se tem permissão
    if user_id != current_user.id:
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.show_profile_visitors:
            raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Buscar visitantes recentes
    visitors = db.query(ProfileView, User).join(
        User, ProfileView.viewer_id == User.id
    ).filter(
        ProfileView.profile_owner_id == user_id
    ).order_by(ProfileView.created_at.desc()).limit(20).all()
    
    result = []
    for view, visitor in visitors:
        result.append({
            "id": visitor.id,
            "username": visitor.username,
            "full_name": visitor.full_name,
            "avatar_url": visitor.avatar_url,
            "visit_time": view.created_at,
            "location": visitor.location
        })
    
    return result

@router.get("/{user_id}/friends", response_model=List[UserResponse])
async def get_user_friends(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Buscar amigos (seguindo mutuamente)
    friends_query = db.query(User).join(
        Friendship, 
        or_(
            and_(Friendship.user_id == user_id, Friendship.friend_id == User.id),
            and_(Friendship.friend_id == user_id, Friendship.user_id == User.id)
        )
    ).filter(
        Friendship.status == "accepted",
        User.id != user_id
    )
    
    friends = friends_query.all()
    return friends

@router.post("/{user_id}/follow")
async def follow_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Você não pode seguir a si mesmo")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Verificar se já segue
    existing_friendship = db.query(Friendship).filter(
        and_(
            Friendship.user_id == current_user.id,
            Friendship.friend_id == user_id
        )
    ).first()
    
    if existing_friendship:
        if existing_friendship.status == "accepted":
            raise HTTPException(status_code=400, detail="Você já segue este usuário")
        else:
            existing_friendship.status = "accepted"
    else:
        friendship = Friendship(
            user_id=current_user.id,
            friend_id=user_id,
            initiated_by=current_user.id,
            status="accepted"
        )
        db.add(friendship)
    
    db.commit()
    return {"message": "Usuário seguido com sucesso"}

@router.delete("/{user_id}/follow")
async def unfollow_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    friendship = db.query(Friendship).filter(
        and_(
            Friendship.user_id == current_user.id,
            Friendship.friend_id == user_id
        )
    ).first()
    
    if not friendship:
        raise HTTPException(status_code=404, detail="Você não segue este usuário")
    
    db.delete(friendship)
    db.commit()
    return {"message": "Usuário deixou de ser seguido"}
