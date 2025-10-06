from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from PIL import Image
import aiofiles
import os
import uuid
from typing import Literal
from ..database.database import get_db
from ..models.user import User
from ..models.profile_photo import ProfilePhoto
from ..models.profile_cover import ProfileCover
from .auth import get_current_user

router = APIRouter()

# Configurações de upload
# Limit uploads to 6MB for stories/highlights/uploads
MAX_FILE_SIZE = 6 * 1024 * 1024  # 6MB
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime"}
ALLOWED_STORY_TYPES = ALLOWED_IMAGE_TYPES | ALLOWED_VIDEO_TYPES

# Image resolution constraints
MIN_IMAGE_WIDTH = 800
MIN_IMAGE_HEIGHT = 400
# Maximum allowed dimension (will be downscaled to fit) - accept up to 8192
MAX_IMAGE_DIMENSION = 8192

from io import BytesIO
import base64

def validate_image_file(file: UploadFile) -> bool:
    """Validar se o arquivo é uma imagem válida"""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        return False
    
    if file.size and file.size > MAX_FILE_SIZE:
        return False
    
    return True

def generate_filename(original_filename: str, prefix: str = "") -> str:
    """Gerar nome único para o arquivo"""
    ext = original_filename.split('.')[-1].lower()
    unique_id = str(uuid.uuid4())
    return f"{prefix}{unique_id}.{ext}"

async def save_and_resize_image_to_bytes(file: UploadFile, max_size: tuple = None):
    """Read image upload, validate dimensions, optionally resize, and return bytes and mime"""
    content = await file.read()
    try:
        with Image.open(BytesIO(content)) as img:
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'P'):
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                rgb_img.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = rgb_img

            w, h = img.size
            # Validate minimum dimensions
            if w < MIN_IMAGE_WIDTH or h < MIN_IMAGE_HEIGHT:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Imagem muito pequena: {w}x{h}. Mínimo é {MIN_IMAGE_WIDTH}x{MIN_IMAGE_HEIGHT}.")

            # If image is extremely large, downscale to MAX_IMAGE_DIMENSION
            max_dim = max(w, h)
            if max_dim > MAX_IMAGE_DIMENSION:
                scale = MAX_IMAGE_DIMENSION / float(max_dim)
                new_w = int(w * scale)
                new_h = int(h * scale)
                img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

            # Respect max_size parameter if provided (e.g., thumbnails)
            if max_size:
                img.thumbnail(max_size, Image.Resampling.LANCZOS)

            out = BytesIO()
            img.save(out, format='JPEG', quality=85, optimize=True)
            out.seek(0)
            return out.read(), 'image/jpeg'
    except HTTPException:
        # Re-raise HTTPExceptions to be handled by caller
        raise
    except Exception as e:
        # Fallback: return original bytes (but do not mask validation errors)
        return content, file.content_type or 'application/octet-stream'

@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload da foto de perfil (avatar) - stored in DB as blob and returned as data URL"""
    # Validate file
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid image type")
    # Soft size cap: only enforce if UploadFile exposes size; otherwise accept and resize
    if getattr(file, 'size', None) and file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File too large")

    try:
        # Convert and resize image to bytes
        content_bytes, mime = await save_and_resize_image_to_bytes(file, (400, 400))

        # Store in DB (current avatar pointer)
        current_user.avatar_blob = content_bytes
        current_user.avatar_mime = mime
        current_user.avatar = f"/api/media/users/{current_user.id}/avatar"
        current_user.avatar_url = current_user.avatar

        # Also persist as immutable historical profile photo
        import hashlib, secrets
        digits = '0123456789'
        def gen_vibe_id(n=18):
            return 'vibe_' + ''.join(secrets.choice(digits) for _ in range(n))
        # ensure unique id
        photo_id = gen_vibe_id()
        for _ in range(10):
            existing = db.query(ProfilePhoto).filter(ProfilePhoto.id == photo_id).first()
            if not existing:
                break
            photo_id = gen_vibe_id()
        blob_hash = hashlib.sha256(content_bytes).hexdigest()
        profile_photo = ProfilePhoto(
            id=photo_id,
            user_id=current_user.id,
            blob=content_bytes,
            mime=mime,
            blob_hash=blob_hash
        )
        db.add(profile_photo)
        db.commit()
        db.refresh(current_user)

        # Return data URL for immediate use in frontend
        data_url = f"data:{mime};base64,{base64.b64encode(content_bytes).decode('utf-8')}"

        return {
            "message": "Avatar atualizado com sucesso!",
            "avatar_url": current_user.avatar,
            "data_url": data_url,
            "profile_photo_id": photo_id,
            "profile_photo_url": f"/api/media/profile/photo/id/{photo_id}",
            "user": current_user.to_dict()
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Erro ao fazer upload do avatar: {str(e)}")

@router.post("/cover")
async def upload_cover_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload da foto de capa - store in DB and return data URL and immutable id URL"""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid image type")
    # Soft size cap: only enforce if UploadFile exposes size; otherwise accept and resize
    if getattr(file, 'size', None) and file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File too large")

    try:
        content_bytes, mime = await save_and_resize_image_to_bytes(file, (800, 300))

        # Set current cover for the user
        current_user.cover_blob = content_bytes
        current_user.cover_mime = mime
        current_user.cover_photo = f"/api/media/users/{current_user.id}/cover"

        # Also persist immutable historical cover record
        import hashlib, secrets
        digits = '0123456789'
        def gen_vibe_id(n=18):
            return 'vibe_' + ''.join(secrets.choice(digits) for _ in range(n))
        cover_id = gen_vibe_id()
        for _ in range(10):
            existing = db.query(ProfileCover).filter(ProfileCover.id == cover_id).first()
            if not existing:
                break
            cover_id = gen_vibe_id()
        blob_hash = hashlib.sha256(content_bytes).hexdigest()
        profile_cover = ProfileCover(
            id=cover_id,
            user_id=current_user.id,
            blob=content_bytes,
            mime=mime,
            blob_hash=blob_hash
        )
        db.add(profile_cover)

        db.commit()
        db.refresh(current_user)

        data_url = f"data:{mime};base64,{base64.b64encode(content_bytes).decode('utf-8')}"

        return {
            "message": "Foto de capa atualizada com sucesso!",
            "cover_url": current_user.cover_photo,
            "data_url": data_url,
            "profile_cover_id": cover_id,
            "profile_cover_url": f"/api/media/profile/cover/id/{cover_id}",
            "user": current_user.to_dict()
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Erro ao fazer upload da foto de capa: {str(e)}")

@router.delete("/avatar")
async def remove_avatar(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remover foto de perfil"""
    
    try:
        # Clear avatar blob and url from DB
        current_user.avatar = None
        current_user.avatar_blob = None
        current_user.avatar_mime = None
        db.commit()
        db.refresh(current_user)

        return {
            "message": "Avatar removido com sucesso!",
            "user": current_user.to_dict()
        }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao remover avatar: {str(e)}"
        )

@router.delete("/cover")
async def remove_cover_photo(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remover foto de capa"""
    
    try:
        # Clear cover blob and url from DB
        current_user.cover_photo = None
        current_user.cover_blob = None
        current_user.cover_mime = None
        db.commit()
        db.refresh(current_user)

        return {
            "message": "Foto de capa removida com sucesso!",
            "user": current_user.to_dict()
        }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao remover foto de capa: {str(e)}"
        )

@router.post("/story-media")
async def upload_story_media(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload de mídia para stories (imagem ou vídeo). Returns data URL to be used by story creation endpoint."""

    # Validate file
    if file.content_type not in ALLOWED_STORY_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file type")
    # Soft size cap: only enforce if UploadFile exposes size; otherwise accept and resize/process
    if getattr(file, 'size', None) and file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File too large")

    try:
        if file.content_type in ALLOWED_IMAGE_TYPES:
            # Validate dimensions and resize for story constraints
            content_bytes, mime = await save_and_resize_image_to_bytes(file, (1080, 1920))
            media_type = 'image'
        else:
            content_bytes = await file.read()
            mime = file.content_type or 'application/octet-stream'
            media_type = 'video'

        data_url = f"data:{mime};base64,{base64.b64encode(content_bytes).decode('utf-8')}"

        return {
            "message": "Mídia do story carregada com sucesso!",
            "url": data_url,
            "type": media_type
        }
    except HTTPException:
        # Propagate validation HTTP errors (image too small, etc.)
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Erro ao fazer upload da mídia: {str(e)}")
