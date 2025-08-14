from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from ..database.database import get_db
from ..models import User, Post, Comment, PostReaction, CommentReaction, Notification
from .auth import get_current_user
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

# Schemas
class ReactionCreate(BaseModel):
    reaction_type: str  # heart, love, laugh, wow, sad, angry

class ReactionResponse(BaseModel):
    id: int
    user_id: int
    reaction_type: str
    created_at: str

# Post Reactions
@router.post("/posts/{post_id}/reactions", response_model=dict)
async def add_post_reaction(
    post_id: int,
    reaction_data: ReactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add or update a reaction to a post"""
    # Validate reaction type
    valid_reactions = ["heart", "love", "laugh", "wow", "sad", "angry"]
    if reaction_data.reaction_type not in valid_reactions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid reaction type. Must be one of: {', '.join(valid_reactions)}"
        )
    
    # Check if post exists
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    
    # Check if user already reacted to this post
    existing_reaction = db.query(PostReaction).filter(
        and_(PostReaction.user_id == current_user.id, PostReaction.post_id == post_id)
    ).first()
    
    if existing_reaction:
        # Update existing reaction
        existing_reaction.reaction_type = reaction_data.reaction_type
        db.commit()
        db.refresh(existing_reaction)
        return {
            "message": "Reaction updated successfully",
            "reaction": existing_reaction.to_dict()
        }
    else:
        # Create new reaction
        new_reaction = PostReaction(
            user_id=current_user.id,
            post_id=post_id,
            reaction_type=reaction_data.reaction_type
        )
        db.add(new_reaction)
        db.commit()
        db.refresh(new_reaction)
        
        # Criar notificação se não for o próprio autor
        if post.author_id != current_user.id:
            notification = Notification(
                user_id=post.author_id,
                type="reaction",
                title=f"{current_user.full_name} reagiu ao seu post",
                message=f"Reagiu com {reaction_data.reaction_type}",
                related_user_id=current_user.id,
                related_post_id=post_id,
                action_url=f"/posts/{post_id}"
            )
            db.add(notification)
            db.commit()
            
            # Enviar notificação em tempo real
            try:
                from ..websocket import manager
                await manager.send_reaction_notification({
                    "type": "post_reaction",
                    "postId": post_id,
                    "reactionType": reaction_data.reaction_type,
                    "user": current_user.to_public_dict()
                }, post.author_id)
            except ImportError:
                pass  # WebSocket não disponível
        
        return {
            "message": "Reaction added successfully",
            "reaction": new_reaction.to_dict()
        }

@router.delete("/posts/{post_id}/reactions")
async def remove_post_reaction(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove user's reaction from a post"""
    reaction = db.query(PostReaction).filter(
        and_(PostReaction.user_id == current_user.id, PostReaction.post_id == post_id)
    ).first()
    
    if not reaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reaction not found")
    
    db.delete(reaction)
    db.commit()
    
    return {"message": "Reaction removed successfully"}

@router.get("/posts/{post_id}/reactions")
async def get_post_reactions(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all reactions for a post"""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    
    reactions = db.query(PostReaction).filter(PostReaction.post_id == post_id).all()
    
    # Group reactions by type
    reaction_summary = {}
    reaction_users = {}
    
    for reaction in reactions:
        reaction_type = reaction.reaction_type
        if reaction_type not in reaction_summary:
            reaction_summary[reaction_type] = 0
            reaction_users[reaction_type] = []
        
        reaction_summary[reaction_type] += 1
        reaction_users[reaction_type].append({
            "id": reaction.user.id,
            "name": f"{reaction.user.first_name} {reaction.user.last_name}",
            "avatar": reaction.user.avatar
        })
    
    return {
        "post_id": post_id,
        "reaction_counts": reaction_summary,
        "reaction_users": reaction_users,
        "total_reactions": sum(reaction_summary.values())
    }

# Comment Reactions
@router.post("/comments/{comment_id}/reactions", response_model=dict)
async def add_comment_reaction(
    comment_id: int,
    reaction_data: ReactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add or update a reaction to a comment"""
    # Validate reaction type
    valid_reactions = ["heart", "love", "laugh", "wow", "sad", "angry"]
    if reaction_data.reaction_type not in valid_reactions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid reaction type. Must be one of: {', '.join(valid_reactions)}"
        )
    
    # Check if comment exists
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    
    # Check if user already reacted to this comment
    existing_reaction = db.query(CommentReaction).filter(
        and_(CommentReaction.user_id == current_user.id, CommentReaction.comment_id == comment_id)
    ).first()
    
    if existing_reaction:
        # Update existing reaction
        existing_reaction.reaction_type = reaction_data.reaction_type
        db.commit()
        db.refresh(existing_reaction)
        return {
            "message": "Reaction updated successfully",
            "reaction": existing_reaction.to_dict()
        }
    else:
        # Create new reaction
        new_reaction = CommentReaction(
            user_id=current_user.id,
            comment_id=comment_id,
            reaction_type=reaction_data.reaction_type
        )
        db.add(new_reaction)
        
        # Update comment likes count if reaction is 'heart'
        if reaction_data.reaction_type == "heart":
            comment.likes_count += 1
        
        db.commit()
        db.refresh(new_reaction)
        
        # Criar notificação se não for o próprio autor
        if comment.user_id != current_user.id:
            notification = Notification(
                user_id=comment.user_id,
                type="reaction",
                title=f"{current_user.full_name} reagiu ao seu comentário",
                message=f"Reagiu com {reaction_data.reaction_type}",
                related_user_id=current_user.id,
                related_post_id=comment.post_id,
                action_url=f"/posts/{comment.post_id}"
            )
            db.add(notification)
            db.commit()
            
            # Enviar notificação em tempo real
            await manager.send_reaction_notification({
                "type": "comment_reaction",
                "commentId": comment_id,
                "reactionType": reaction_data.reaction_type,
                "user": current_user.to_public_dict()
            }, comment.user_id)
        
        return {
            "message": "Reaction added successfully",
            "reaction": new_reaction.to_dict()
        }

@router.delete("/comments/{comment_id}/reactions")
async def remove_comment_reaction(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove user's reaction from a comment"""
    reaction = db.query(CommentReaction).filter(
        and_(CommentReaction.user_id == current_user.id, CommentReaction.comment_id == comment_id)
    ).first()
    
    if not reaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reaction not found")
    
    # Update comment likes count if removing a 'heart'
    if reaction.reaction_type == "heart":
        comment = db.query(Comment).filter(Comment.id == comment_id).first()
        if comment and comment.likes_count > 0:
            comment.likes_count -= 1
    
    db.delete(reaction)
    db.commit()
    
    return {"message": "Reaction removed successfully"}

@router.get("/comments/{comment_id}/reactions")
async def get_comment_reactions(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all reactions for a comment"""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    
    reactions = db.query(CommentReaction).filter(CommentReaction.comment_id == comment_id).all()
    
    # Group reactions by type
    reaction_summary = {}
    reaction_users = {}
    
    for reaction in reactions:
        reaction_type = reaction.reaction_type
        if reaction_type not in reaction_summary:
            reaction_summary[reaction_type] = 0
            reaction_users[reaction_type] = []
        
        reaction_summary[reaction_type] += 1
        reaction_users[reaction_type].append({
            "id": reaction.user.id,
            "name": f"{reaction.user.first_name} {reaction.user.last_name}",
            "avatar": reaction.user.avatar
        })
    
    return {
        "comment_id": comment_id,
        "reaction_counts": reaction_summary,
        "reaction_users": reaction_users,
        "total_reactions": sum(reaction_summary.values())
    }
