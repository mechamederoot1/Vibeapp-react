from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request
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
UPLOAD_DIRECTORY = "uploads"
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}

# Criar diretório de uploads se não existir
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)
os.makedirs(f"{UPLOAD_DIRECTORY}/avatars", exist_ok=True)
os.makedirs(f"{UPLOAD_DIRECTORY}/covers", exist_ok=True)

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

async def save_and_resize_image(file: UploadFile, filepath: str, max_size: tuple = None):
    """Salvar e redimensionar imagem"""
    # Salvar arquivo temporário
    temp_path = f"{filepath}.temp"
    async with aiofiles.open(temp_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    # Abrir e processar imagem
    try:
        with Image.open(temp_path) as img:
            # Converter para RGB se necessário
            if img.mode in ('RGBA', 'P'):
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                rgb_img.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = rgb_img
            
            # Redimensionar se especificado
            if max_size:
                img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # Salvar imagem processada
            img.save(filepath, 'JPEG', quality=85, optimize=True)
    
    finally:
        # Remover arquivo temporário
        if os.path.exists(temp_path):
            os.remove(temp_path)

@router.post("/avatar")
async def upload_avatar(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload da foto de perfil (avatar)"""
    
    # Validar arquivo
    if not validate_image_file(file):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Arquivo inválido. Use JPEG, PNG ou WebP com máximo 5MB."
        )
    
    try:
        # Gerar nome único para o arquivo
        filename = generate_filename(file.filename, "avatar_")
        filepath = os.path.join(UPLOAD_DIRECTORY, "avatars", filename)
        
        # Salvar e redimensionar imagem (400x400 para avatar)
        await save_and_resize_image(file, filepath, (400, 400))
        
        # Remover avatar anterior se existir
        if current_user.avatar and current_user.avatar.startswith("/uploads/"):
            old_filepath = current_user.avatar[1:]  # Remove a barra inicial
            if os.path.exists(old_filepath):
                os.remove(old_filepath)
        
        # Atualizar URL do avatar no banco
        base_url = f"{request.url.scheme}://{request.url.netloc}"
        avatar_url = f"{base_url}/uploads/avatars/{filename}"
        current_user.avatar = avatar_url
        db.commit()
        db.refresh(current_user)
        
        return {
            "message": "Avatar atualizado com sucesso!",
            "avatar_url": avatar_url,
            "user": current_user.to_dict()
        }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao fazer upload do avatar: {str(e)}"
        )

@router.post("/cover")
async def upload_cover_photo(
    request: Request,
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
        if current_user.cover_photo and current_user.cover_photo.startswith("/uploads/"):
            old_filepath = current_user.cover_photo[1:]  # Remove a barra inicial
            if os.path.exists(old_filepath):
                os.remove(old_filepath)
        
        # Atualizar URL da capa no banco
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
        if current_user.avatar and current_user.avatar.startswith("/uploads/"):
            filepath = current_user.avatar[1:]  # Remove a barra inicial
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
        if current_user.cover_photo and current_user.cover_photo.startswith("/uploads/"):
            filepath = current_user.cover_photo[1:]  # Remove a barra inicial
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
