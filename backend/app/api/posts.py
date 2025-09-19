from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from ..database.database import get_db
from ..models.user import User
from ..models.post import Post, PostLike, Comment, Share
from .auth import get_current_user
from ..utils.privacy import can_view_post

router = APIRouter()

class PostCreate(BaseModel):
    content: Optional[str] = None
    imageUrl: Optional[str] = None
    videoUrl: Optional[str] = None
    type: str = "text"  # text, image, video, profile_update
    backgroundColor: Optional[str] = None  # Background color for text posts
    profileUpdateType: Optional[str] = None  # avatar, cover (for profile update posts)
    privacy: str = "public"  # public, friends, private

class PostUpdate(BaseModel):
    content: Optional[str] = None
    privacy: Optional[str] = None

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
        # Verificar se o usuário pode ver este post baseado na privacidade
        if can_view_post(db, current_user.id, post.author_id, post.privacy):
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
    if post_data.type not in ["text", "image", "video", "profile_update"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid post type"
        )

    # Validate privacy setting
    if post_data.privacy not in ["public", "friends", "private"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid privacy setting. Must be 'public', 'friends', or 'private'"
        )

    import base64, re

    new_post = Post(
        author_id=current_user.id,
        content=post_data.content,
        image_url=None,
        video_url=None,
        post_type=post_data.type,
        background_color=post_data.backgroundColor,
        profile_update_type=post_data.profileUpdateType,
        privacy=post_data.privacy
    )

    # If plain URLs provided, keep them as external media
    if post_data.imageUrl and not str(post_data.imageUrl).startswith('data:'):
        new_post.image_url = post_data.imageUrl
    if post_data.videoUrl and not str(post_data.videoUrl).startswith('data:'):
        new_post.video_url = post_data.videoUrl

    # Assign unique 10-digit public id with commit-retry
    import secrets, string
    from sqlalchemy.exc import IntegrityError

    def gen_id(n=10):
      return ''.join(secrets.choice(string.digits) for _ in range(n))

    for attempt in range(10):
      new_post.public_id = gen_id(10)
      try:
        db.add(new_post)
        db.commit()
        db.refresh(new_post)
        break
      except IntegrityError as e:
        db.rollback()
        if 'public_id' in str(e).lower():
          if attempt == 9:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='Could not generate unique post id')
          continue
        raise

    # If image/video provided as data URL, store as blob
    dataurl_pattern = re.compile(r'data:(?P<mime>[-\w+/]+(?:;[-\w=]+)?)?(;base64)?,(?P<data>.*)')
    try:
      if post_data.imageUrl and post_data.imageUrl.startswith('data:'):
        m = dataurl_pattern.match(post_data.imageUrl)
        if m:
          mime = m.group('mime') or 'application/octet-stream'
          data = base64.b64decode(m.group('data'))
          new_post.image_blob = data
          new_post.image_mime = mime
          new_post.image_url = f"/api/media/posts/{new_post.id}/image"

      if post_data.videoUrl and post_data.videoUrl.startswith('data:'):
        m = dataurl_pattern.match(post_data.videoUrl)
        if m:
          mime = m.group('mime') or 'application/octet-stream'
          data = base64.b64decode(m.group('data'))
          new_post.video_blob = data
          new_post.video_mime = mime
          new_post.video_url = f"/api/media/posts/{new_post.id}/video"

      db.commit()
      db.refresh(new_post)
    except Exception as e:
      db.rollback()
      print('Error storing media blob:', e)

    return new_post.to_dict(current_user.id)

@router.get("/by-public-id/{public_id}")
async def get_post_by_public_id(
    public_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = db.query(Post).filter(
        Post.public_id == public_id,
        Post.is_active == True
    ).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    if not can_view_post(db, current_user.id, post.author_id, post.privacy):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have permission to view this post")
    return post.to_dict(current_user.id)

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

    # Verificar se o usuário pode ver este post baseado na privacidade
    if not can_view_post(db, current_user.id, post.author_id, post.privacy):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this post"
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
    
    comments_data = [comment.to_dict(current_user.id) for comment in comments]
    
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
    
    return new_comment.to_dict(current_user.id)

@router.put("/{post_id}")
async def update_post(
    post_id: int,
    post_data: PostUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a post (only by author). Allows editing content and privacy."""
    post = db.query(Post).filter(
        Post.id == post_id,
        Post.author_id == current_user.id
    ).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found or access denied")

    if post_data.content is not None:
        post.content = post_data.content
    if post_data.privacy is not None:
        if post_data.privacy not in ["public", "friends", "private"]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid privacy setting")
        post.privacy = post_data.privacy

    db.commit()
    db.refresh(post)
    return post.to_dict(current_user.id)

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

@router.put("/comments/{comment_id}")
async def update_comment(
    comment_id: int,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a comment (only by author)"""

    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.user_id == current_user.id
    ).first()

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found or access denied"
        )

    comment.content = comment_data.content
    db.commit()
    db.refresh(comment)

    return comment.to_dict(current_user.id)

@router.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a comment (only by author or post owner)"""

    comment = db.query(Comment).filter(Comment.id == comment_id).first()

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )

    # Check if user is comment author or post owner
    post = db.query(Post).filter(Post.id == comment.post_id).first()
    if comment.user_id != current_user.id and post.author_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    # Decrease comment count
    if post:
        post.comments_count = max(0, post.comments_count - 1)

    db.delete(comment)
    db.commit()

    return {"message": "Comment deleted successfully"}

@router.get("/{post_id}/shares")
async def get_post_shares(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = 1,
    limit: int = 20
):
    """Get users who shared a post"""

    offset = (page - 1) * limit

    shares = db.query(Share).filter(
        Share.post_id == post_id
    ).order_by(Share.created_at.desc()).offset(offset).limit(limit).all()

    shares_data = [share.to_dict() for share in shares]

    return {
        "shares": shares_data,
        "page": page,
        "limit": limit,
        "total": len(shares_data)
    }

@router.delete("/{post_id}/shares/{share_id}")
async def unshare_post(
    post_id: int,
    share_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a share/repost"""

    share = db.query(Share).filter(
        Share.id == share_id,
        Share.user_id == current_user.id,
        Share.post_id == post_id
    ).first()

    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share not found or access denied"
        )

    # Update post counters
    post = db.query(Post).filter(Post.id == post_id).first()
    if post:
        if share.share_type == "share":
            post.shares_count = max(0, post.shares_count - 1)
        elif share.share_type == "repost":
            post.reposts_count = max(0, post.reposts_count - 1)

    db.delete(share)
    db.commit()

    return {"message": "Share removed successfully"}

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

    posts_data = []
    for post in posts:
        # Verificar se o usuário pode ver este post baseado na privacidade
        if can_view_post(db, current_user.id, post.author_id, post.privacy):
            posts_data.append(post.to_dict(current_user.id))
    
    return {
        "posts": posts_data,
        "page": page,
        "limit": limit,
        "total": len(posts_data)
    }
