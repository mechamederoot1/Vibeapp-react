from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from PIL import Image
import aiofiles
import os
import uuid
from typing import Literal
from ..database.database import get_db
from ..models.user import User
from .auth import get_current_user

router = APIRouter()

# Configurações de upload
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime"}
ALLOWED_STORY_TYPES = ALLOWED_IMAGE_TYPES | ALLOWED_VIDEO_TYPES

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
    """Read image upload, optionally resize, and return bytes and mime"""
    content = await file.read()
    try:
        with Image.open(BytesIO(content)) as img:
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'P'):
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                rgb_img.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = rgb_img
            if max_size:
                img.thumbnail(max_size, Image.Resampling.LANCZOS)
            out = BytesIO()
            img.save(out, format='JPEG', quality=85, optimize=True)
            out.seek(0)
            return out.read(), 'image/jpeg'
    except Exception:
        # Fallback: return original bytes
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
    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File too large")

    try:
        # Convert and resize image to bytes
        content_bytes, mime = await save_and_resize_image_to_bytes(file, (400, 400))

        # Store in DB
        current_user.avatar_blob = content_bytes
        current_user.avatar_mime = mime
        current_user.avatar = f"/api/media/users/{current_user.id}/avatar"
        current_user.avatar_url = current_user.avatar
        db.commit()
        db.refresh(current_user)

        # Return data URL for immediate use in frontend
        data_url = f"data:{mime};base64,{base64.b64encode(content_bytes).decode('utf-8')}"

        return {
            "message": "Avatar atualizado com sucesso!",
            "avatar_url": current_user.avatar,
            "data_url": data_url,
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
    """Upload da foto de capa"""
    
    # Validar arquivo
    if not validate_image_file(file):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Arquivo inválido. Use JPEG, PNG ou WebP com máximo 5MB."
        )
    
    try:
        # Gerar nome único para o arquivo
        filename = generate_filename(file.filename, "cover_")
        filepath = os.path.join(UPLOAD_DIRECTORY, "covers", filename)
        
        # Salvar e redimensionar imagem (800x300 para capa)
        await save_and_resize_image(file, filepath, (800, 300))
        
        # Remover capa anterior se existir
        if current_user.cover_photo:
            if current_user.cover_photo.startswith("http"):
                # URL completa, extrair apenas o path
                from urllib.parse import urlparse
                parsed = urlparse(current_user.cover_photo)
                old_filepath = parsed.path[1:]  # Remove a barra inicial
            elif current_user.cover_photo.startswith("/uploads/"):
                old_filepath = current_user.cover_photo[1:]  # Remove a barra inicial
            else:
                old_filepath = current_user.cover_photo

            if os.path.exists(old_filepath):
                os.remove(old_filepath)
        
        # Atualizar URL da capa no banco (usando caminho relativo)
        cover_url = f"/uploads/covers/{filename}"
        current_user.cover_photo = cover_url
        db.commit()
        db.refresh(current_user)
        
        return {
            "message": "Foto de capa atualizada com sucesso!",
            "cover_url": cover_url,
            "user": current_user.to_dict()
        }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao fazer upload da foto de capa: {str(e)}"
        )

@router.delete("/avatar")
async def remove_avatar(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remover foto de perfil"""
    
    try:
        # Remover arquivo se existir
        if current_user.avatar:
            if current_user.avatar.startswith("http"):
                # URL completa, extrair apenas o path
                from urllib.parse import urlparse
                parsed = urlparse(current_user.avatar)
                filepath = parsed.path[1:]  # Remove a barra inicial
            elif current_user.avatar.startswith("/uploads/"):
                filepath = current_user.avatar[1:]  # Remove a barra inicial
            else:
                filepath = current_user.avatar

            if os.path.exists(filepath):
                os.remove(filepath)
        
        # Remover URL do banco
        current_user.avatar = None
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
        # Remover arquivo se existir
        if current_user.cover_photo:
            if current_user.cover_photo.startswith("http"):
                # URL completa, extrair apenas o path
                from urllib.parse import urlparse
                parsed = urlparse(current_user.cover_photo)
                filepath = parsed.path[1:]  # Remove a barra inicial
            elif current_user.cover_photo.startswith("/uploads/"):
                filepath = current_user.cover_photo[1:]  # Remove a barra inicial
            else:
                filepath = current_user.cover_photo

            if os.path.exists(filepath):
                os.remove(filepath)
        
        # Remover URL do banco
        current_user.cover_photo = None
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
    """Upload de mídia para stories (imagem ou vídeo)"""

    # Validar arquivo
    if file.content_type not in ALLOWED_STORY_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Arquivo inválido. Use JPEG, PNG, WebP, MP4, WebM ou QuickTime."
        )

    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Arquivo muito grande. Máximo 5MB."
        )

    try:
        # Gerar nome único para o arquivo
        filename = generate_filename(file.filename, "story_")
        filepath = os.path.join(UPLOAD_DIRECTORY, "stories", filename)

        # Para imagens, redimensionar
        if file.content_type in ALLOWED_IMAGE_TYPES:
            await save_and_resize_image(file, filepath, (1080, 1920))  # Formato story 9:16
        else:
            # Para vídeos, salvar diretamente
            async with aiofiles.open(filepath, 'wb') as f:
                content = await file.read()
                await f.write(content)

        # Retornar URL da mídia
        media_url = f"/uploads/stories/{filename}"

        return {
            "message": "Mídia do story carregada com sucesso!",
            "url": media_url,
            "type": "image" if file.content_type in ALLOWED_IMAGE_TYPES else "video"
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao fazer upload da mídia: {str(e)}"
        )
