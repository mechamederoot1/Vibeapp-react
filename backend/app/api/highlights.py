from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel

from ..database.database import get_db
from ..models import User, Story, Highlight, HighlightStory
from ..api.auth import get_current_user

router = APIRouter()

# Schemas
class HighlightCreateSchema(BaseModel):
    title: str
    coverStoryId: Optional[int] = None
    description: Optional[str] = None

class HighlightUpdateSchema(BaseModel):
    title: Optional[str] = None
    coverStoryId: Optional[int] = None
    description: Optional[str] = None
    orderIndex: Optional[int] = None

class AddStoryToHighlightSchema(BaseModel):
    storyId: int
    orderIndex: Optional[int] = None

@router.get("/highlights")
async def get_user_highlights(
    user_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obter destaques do usuário"""
    target_user_id = user_id or current_user.id
    
    highlights = db.query(Highlight).filter(
        Highlight.user_id == target_user_id,
        Highlight.is_active == True
    ).order_by(Highlight.order_index, Highlight.created_at).all()
    
    return {
        "highlights": [highlight.to_dict() for highlight in highlights]
    }

@router.get("/highlights/{highlight_id}")
async def get_highlight_details(
    highlight_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obter detalhes de um destaque específico com suas stories"""
    highlight = db.query(Highlight).filter(
        Highlight.id == highlight_id,
        Highlight.is_active == True
    ).first()
    
    if not highlight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Destaque não encontrado"
        )
    
    return {
        "highlight": highlight.to_dict(include_stories=True)
    }

@router.post("/highlights")
async def create_highlight(
    data: HighlightCreateSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Criar um novo destaque"""
    
    # Verificar se o story da capa existe e pertence ao usuário
    if data.coverStoryId:
        cover_story = db.query(Story).filter(
            Story.id == data.coverStoryId,
            Story.author_id == current_user.id
        ).first()
        
        if not cover_story:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Story de capa não encontrado"
            )
    
    # Determinar próximo order_index
    max_order = db.query(Highlight).filter(
        Highlight.user_id == current_user.id
    ).count()
    
    highlight = Highlight(
        user_id=current_user.id,
        title=data.title,
        cover_story_id=data.coverStoryId,
        description=data.description,
        order_index=max_order
    )
    
    db.add(highlight)
    db.commit()
    db.refresh(highlight)
    
    # Se foi fornecido um coverStoryId, adicionar automaticamente esse story ao destaque
    if data.coverStoryId:
        highlight_story = HighlightStory(
            highlight_id=highlight.id,
            story_id=data.coverStoryId,
            order_index=0
        )
        db.add(highlight_story)
        db.commit()
    
    return {
        "message": "Destaque criado com sucesso",
        "highlight": highlight.to_dict()
    }

@router.put("/highlights/{highlight_id}")
async def update_highlight(
    highlight_id: int,
    data: HighlightUpdateSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Atualizar um destaque"""
    
    highlight = db.query(Highlight).filter(
        Highlight.id == highlight_id,
        Highlight.user_id == current_user.id
    ).first()
    
    if not highlight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Destaque não encontrado"
        )
    
    # Atualizar campos fornecidos
    if data.title is not None:
        highlight.title = data.title
    if data.description is not None:
        highlight.description = data.description
    if data.orderIndex is not None:
        highlight.order_index = data.orderIndex
    if data.coverStoryId is not None:
        # Verificar se o story existe e pertence ao usuário
        if data.coverStoryId > 0:
            cover_story = db.query(Story).filter(
                Story.id == data.coverStoryId,
                Story.author_id == current_user.id
            ).first()
            
            if not cover_story:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Story de capa não encontrado"
                )
        
        highlight.cover_story_id = data.coverStoryId if data.coverStoryId > 0 else None
    
    db.commit()
    db.refresh(highlight)
    
    return {
        "message": "Destaque atualizado com sucesso",
        "highlight": highlight.to_dict()
    }

@router.delete("/highlights/{highlight_id}")
async def delete_highlight(
    highlight_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletar um destaque"""
    
    highlight = db.query(Highlight).filter(
        Highlight.id == highlight_id,
        Highlight.user_id == current_user.id
    ).first()
    
    if not highlight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Destaque não encontrado"
        )
    
    # Marcar como inativo ao invés de deletar
    highlight.is_active = False
    db.commit()
    
    return {"message": "Destaque deletado com sucesso"}

@router.post("/highlights/{highlight_id}/stories")
async def add_story_to_highlight(
    highlight_id: int,
    data: AddStoryToHighlightSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Adicionar story a um destaque"""
    
    # Verificar se o destaque existe e pertence ao usuário
    highlight = db.query(Highlight).filter(
        Highlight.id == highlight_id,
        Highlight.user_id == current_user.id,
        Highlight.is_active == True
    ).first()
    
    if not highlight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Destaque não encontrado"
        )
    
    # Verificar se o story existe e pertence ao usuário
    story = db.query(Story).filter(
        Story.id == data.storyId,
        Story.author_id == current_user.id
    ).first()
    
    if not story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story não encontrado"
        )
    
    # Verificar se o story já está no destaque
    existing = db.query(HighlightStory).filter(
        HighlightStory.highlight_id == highlight_id,
        HighlightStory.story_id == data.storyId
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Story já está neste destaque"
        )
    
    # Determinar order_index se não fornecido
    if data.orderIndex is None:
        max_order = db.query(HighlightStory).filter(
            HighlightStory.highlight_id == highlight_id
        ).count()
        data.orderIndex = max_order
    
    highlight_story = HighlightStory(
        highlight_id=highlight_id,
        story_id=data.storyId,
        order_index=data.orderIndex
    )
    
    db.add(highlight_story)
    db.commit()
    
    return {
        "message": "Story adicionado ao destaque com sucesso",
        "highlightStory": highlight_story.to_dict()
    }

@router.delete("/highlights/{highlight_id}/stories/{story_id}")
async def remove_story_from_highlight(
    highlight_id: int,
    story_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remover story de um destaque"""
    
    # Verificar se o destaque pertence ao usuário
    highlight = db.query(Highlight).filter(
        Highlight.id == highlight_id,
        Highlight.user_id == current_user.id
    ).first()
    
    if not highlight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Destaque não encontrado"
        )
    
    # Encontrar e remover a relação
    highlight_story = db.query(HighlightStory).filter(
        HighlightStory.highlight_id == highlight_id,
        HighlightStory.story_id == story_id
    ).first()
    
    if not highlight_story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story não encontrado neste destaque"
        )
    
    db.delete(highlight_story)
    db.commit()
    
    return {"message": "Story removido do destaque com sucesso"}

@router.get("/highlights/{highlight_id}/stories")
async def get_highlight_stories(
    highlight_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obter todas as stories de um destaque"""
    
    highlight = db.query(Highlight).filter(
        Highlight.id == highlight_id,
        Highlight.is_active == True
    ).first()
    
    if not highlight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Destaque não encontrado"
        )
    
    highlight_stories = db.query(HighlightStory).filter(
        HighlightStory.highlight_id == highlight_id
    ).order_by(HighlightStory.order_index).all()
    
    stories = []
    for hs in highlight_stories:
        if hs.story and hs.story.is_active:
            story_dict = hs.story.to_dict(current_user.id)
            story_dict["highlightOrderIndex"] = hs.order_index
            stories.append(story_dict)
    
    return {
        "highlight": highlight.to_dict(),
        "stories": stories
    }
