from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from ..database.database import get_db
from ..models.post import Post
from ..models.user import User
from ..models.story import Story
from ..models.profile_photo import ProfilePhoto
from ..models.profile_cover import ProfileCover

router = APIRouter()

@router.get("/posts/{post_id}/image")
async def get_post_image(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post or not getattr(post, 'image_blob', None):
        raise HTTPException(status_code=404, detail='Image not found')
    return Response(content=post.image_blob, media_type=post.image_mime or 'image/jpeg')

@router.get("/posts/{post_id}/video")
async def get_post_video(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post or not getattr(post, 'video_blob', None):
        raise HTTPException(status_code=404, detail='Video not found')
    return Response(content=post.video_blob, media_type=post.video_mime or 'video/mp4')

@router.get("/users/{user_id}/avatar")
async def get_user_avatar(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not getattr(user, 'avatar_blob', None):
        raise HTTPException(status_code=404, detail='Avatar not found')
    return Response(content=user.avatar_blob, media_type=user.avatar_mime or 'image/jpeg')

@router.get("/users/{user_id}/cover")
async def get_user_cover(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not getattr(user, 'cover_blob', None):
        raise HTTPException(status_code=404, detail='Cover not found')
    return Response(content=user.cover_blob, media_type=user.cover_mime or 'image/jpeg')

@router.get("/stories/{story_id}")
async def get_story_media(story_id: int, db: Session = Depends(get_db)):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story or not getattr(story, 'media_blob', None):
        raise HTTPException(status_code=404, detail='Story media not found')
    return Response(content=story.media_blob, media_type=story.media_mime or 'image/jpeg')

@router.get("/messages/{message_id}")
async def get_message_media(message_id: int, db: Session = Depends(get_db)):
    from ..models.message import Message
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message or not getattr(message, 'media_blob', None):
        raise HTTPException(status_code=404, detail='Message media not found')
    return Response(content=message.media_blob, media_type=message.media_mime or 'audio/ogg')

@router.get("/profile/photo/id/{photo_id}")
async def get_profile_photo_by_id(photo_id: str, db: Session = Depends(get_db)):
    photo = db.query(ProfilePhoto).filter(ProfilePhoto.id == photo_id).first()
    if not photo or not getattr(photo, 'blob', None):
        raise HTTPException(status_code=404, detail='Profile photo not found')
    return Response(content=photo.blob, media_type=photo.mime or 'image/jpeg')

@router.get("/profile/cover/id/{cover_id}")
async def get_profile_cover_by_id(cover_id: str, db: Session = Depends(get_db)):
    cover = db.query(ProfileCover).filter(ProfileCover.id == cover_id).first()
    if not cover or not getattr(cover, 'blob', None):
        raise HTTPException(status_code=404, detail='Profile cover not found')
    return Response(content=cover.blob, media_type=cover.mime or 'image/jpeg')
