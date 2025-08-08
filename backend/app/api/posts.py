from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from ..database.database import get_db
from ..models.user import User
from ..models.post import Post, PostLike, Comment, Share
from .auth import get_current_user

router = APIRouter()

class PostCreate(BaseModel):
    content: Optional[str] = None
    imageUrl: Optional[str] = None
    videoUrl: Optional[str] = None
    type: str = "text"  # text, image, video

class CommentCreate(BaseModel):
    content: str

@router.get("/feed")
async def get_feed(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = 1,
    limit: int = 20
):
    """Get user's feed posts"""
    
    offset = (page - 1) * limit
    
    # For now, get all posts (in a real app, you'd filter by following relationships)
    posts = db.query(Post).filter(
        Post.is_active == True
    ).order_by(Post.created_at.desc()).offset(offset).limit(limit).all()
    
    posts_data = []
    for post in posts:
        posts_data.append(post.to_dict(current_user.id))
    
    return {
        "posts": posts_data,
        "page": page,
        "limit": limit,
        "total": len(posts_data)
    }

@router.post("/")
async def create_post(
    post_data: PostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new post"""
    
    if not post_data.content and not post_data.imageUrl and not post_data.videoUrl:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Post must have content, image, or video"
        )
    
    # Validate post type
    if post_data.type not in ["text", "image", "video"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid post type"
        )
    
    new_post = Post(
        author_id=current_user.id,
        content=post_data.content,
        image_url=post_data.imageUrl,
        video_url=post_data.videoUrl,
        post_type=post_data.type
    )
    
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    
    return new_post.to_dict(current_user.id)

@router.get("/{post_id}")
async def get_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific post"""
    
    post = db.query(Post).filter(
        Post.id == post_id,
        Post.is_active == True
    ).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    return post.to_dict(current_user.id)

@router.post("/{post_id}/like")
async def toggle_like_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle like on a post"""
    
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check if user already liked this post
    existing_like = db.query(PostLike).filter(
        PostLike.user_id == current_user.id,
        PostLike.post_id == post_id
    ).first()
    
    if existing_like:
        # Unlike the post
        db.delete(existing_like)
        post.likes_count = max(0, post.likes_count - 1)
        is_liked = False
    else:
        # Like the post
        new_like = PostLike(
            user_id=current_user.id,
            post_id=post_id
        )
        db.add(new_like)
        post.likes_count += 1
        is_liked = True
    
    db.commit()
    
    return {
        "postId": post_id,
        "isLiked": is_liked,
        "likesCount": post.likes_count
    }

@router.post("/{post_id}/share")
async def share_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Share a post"""
    
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Create share record
    new_share = Share(
        user_id=current_user.id,
        post_id=post_id,
        share_type="share"
    )
    
    db.add(new_share)
    post.shares_count += 1
    db.commit()
    
    return {
        "postId": post_id,
        "sharesCount": post.shares_count,
        "message": "Post shared successfully"
    }

@router.post("/{post_id}/repost")
async def repost_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Repost a post"""
    
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Create repost record
    new_repost = Share(
        user_id=current_user.id,
        post_id=post_id,
        share_type="repost"
    )
    
    db.add(new_repost)
    post.reposts_count += 1
    db.commit()
    
    return {
        "postId": post_id,
        "repostsCount": post.reposts_count,
        "message": "Post reposted successfully"
    }

@router.get("/{post_id}/comments")
async def get_post_comments(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = 1,
    limit: int = 20
):
    """Get comments for a post"""
    
    offset = (page - 1) * limit
    
    comments = db.query(Comment).filter(
        Comment.post_id == post_id
    ).order_by(Comment.created_at.desc()).offset(offset).limit(limit).all()
    
    comments_data = [comment.to_dict() for comment in comments]
    
    return {
        "comments": comments_data,
        "page": page,
        "limit": limit,
        "total": len(comments_data)
    }

@router.post("/{post_id}/comments")
async def create_comment(
    post_id: int,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a comment on a post"""
    
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    new_comment = Comment(
        user_id=current_user.id,
        post_id=post_id,
        content=comment_data.content
    )
    
    db.add(new_comment)
    post.comments_count += 1
    db.commit()
    db.refresh(new_comment)
    
    return new_comment.to_dict()

@router.delete("/{post_id}")
async def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a post (only by author)"""
    
    post = db.query(Post).filter(
        Post.id == post_id,
        Post.author_id == current_user.id
    ).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found or access denied"
        )
    
    # Soft delete
    post.is_active = False
    db.commit()
    
    return {"message": "Post deleted successfully"}

@router.get("/user/{user_id}")
async def get_user_posts(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = 1,
    limit: int = 20
):
    """Get posts by a specific user"""
    
    offset = (page - 1) * limit
    
    posts = db.query(Post).filter(
        Post.author_id == user_id,
        Post.is_active == True
    ).order_by(Post.created_at.desc()).offset(offset).limit(limit).all()
    
    posts_data = [post.to_dict(current_user.id) for post in posts]
    
    return {
        "posts": posts_data,
        "page": page,
        "limit": limit,
        "total": len(posts_data)
    }
