from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime, timedelta
from ..database.database import get_db
from ..models.user import User
from ..models.story import Story, StoryView
from .auth import get_current_user

router = APIRouter()

class StoryCreate(BaseModel):
    type: str = "text"  # text, image, video
    content: Optional[str] = None
    mediaUrl: Optional[str] = None
    backgroundGradient: Optional[str] = None
    textElements: Optional[List[dict]] = []
    privacy: str = "public"  # public, friends, close_friends
    duration: int = 24  # hours

@router.get("/")
async def get_stories(
    db: Session = Depends(get_db),
    limit: int = 20,
    current_user: Optional[User] = None
):
    """Get active stories from followed users and current user"""

    # Try to get current user, but don't fail if not authenticated
    try:
        from .auth import get_current_user
        # This will only work if we have auth headers
        pass
    except:
        current_user = None
    
    # For now, get all active stories (in a real app, filter by following relationships)
    stories = db.query(Story).filter(
        Story.is_active == True,
        Story.expires_at > datetime.utcnow()
    ).order_by(Story.created_at.desc()).limit(limit).all()
    
    # Group stories by author
    stories_by_author = {}
    for story in stories:
        author_id = story.author_id
        if author_id not in stories_by_author:
            stories_by_author[author_id] = {
                "author": story.author.to_public_dict(),
                "stories": [],
                "hasUnviewed": False
            }
        
        story_dict = story.to_dict(current_user.id)
        stories_by_author[author_id]["stories"].append(story_dict)
        
        # Check if there are unviewed stories
        if not story_dict["isViewed"]:
            stories_by_author[author_id]["hasUnviewed"] = True
    
    return {
        "storiesByAuthor": list(stories_by_author.values()),
        "total": len(stories)
    }

@router.post("/")
async def create_story(
    story_data: StoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new story"""
    
    # Validate story type
    if story_data.type not in ["text", "image", "video"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid story type"
        )
    
    # Validate privacy
    if story_data.privacy not in ["public", "friends", "close_friends"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid privacy setting"
        )
    
    # Validate duration
    if story_data.duration not in [1, 6, 12, 24, 48, 72]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid duration"
        )
    
    # Check if content exists
    if not story_data.content and not story_data.mediaUrl and not story_data.textElements:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Story must have content, media, or text elements"
        )
    
    new_story = Story(
        author_id=current_user.id,
        story_type=story_data.type,
        content=story_data.content,
        media_url=story_data.mediaUrl,
        background_gradient=story_data.backgroundGradient,
        text_elements=story_data.textElements,
        privacy=story_data.privacy,
        duration_hours=story_data.duration,
        expires_at=datetime.utcnow() + timedelta(hours=story_data.duration)
    )
    
    db.add(new_story)
    db.commit()
    db.refresh(new_story)
    
    return new_story.to_dict(current_user.id)

@router.get("/{story_id}")
async def get_story(
    story_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific story"""
    
    story = db.query(Story).filter(
        Story.id == story_id,
        Story.is_active == True
    ).first()
    
    if not story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story not found"
        )
    
    # Check if story has expired
    if story.is_expired:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Story has expired"
        )
    
    # Record story view if it's not the author
    if story.author_id != current_user.id:
        # Check if view already exists
        existing_view = db.query(StoryView).filter(
            StoryView.story_id == story_id,
            StoryView.viewer_id == current_user.id
        ).first()
        
        if not existing_view:
            # Create new view
            story_view = StoryView(
                story_id=story_id,
                viewer_id=current_user.id
            )
            db.add(story_view)
            
            # Update views count
            story.views_count += 1
            db.commit()
    
    return story.to_dict(current_user.id)

@router.get("/{story_id}/views")
async def get_story_views(
    story_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50
):
    """Get viewers of a story (only for story author)"""
    
    story = db.query(Story).filter(
        Story.id == story_id,
        Story.is_active == True
    ).first()
    
    if not story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story not found"
        )
    
    # Only allow story author to see views
    if story.author_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    views = db.query(StoryView).filter(
        StoryView.story_id == story_id
    ).order_by(StoryView.viewed_at.desc()).limit(limit).all()
    
    return {
        "views": [view.to_dict() for view in views],
        "total": len(views)
    }

@router.delete("/{story_id}")
async def delete_story(
    story_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a story (only for story author)"""
    
    story = db.query(Story).filter(
        Story.id == story_id,
        Story.author_id == current_user.id,
        Story.is_active == True
    ).first()
    
    if not story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story not found"
        )
    
    # Soft delete
    story.is_active = False
    db.commit()
    
    return {"message": "Story deleted successfully"}

@router.get("/user/{user_id}")
async def get_user_stories(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 10
):
    """Get stories from a specific user"""
    
    # Get user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get active stories from user
    stories = db.query(Story).filter(
        Story.author_id == user_id,
        Story.is_active == True,
        Story.expires_at > datetime.utcnow()
    ).order_by(Story.created_at.desc()).limit(limit).all()
    
    return {
        "author": user.to_public_dict(),
        "stories": [story.to_dict(current_user.id) for story in stories],
        "total": len(stories)
    }
