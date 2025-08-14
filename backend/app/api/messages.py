from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
import aiofiles
import os
import uuid

from ..database.database import get_db
from ..models import User, Message, Conversation, Notification
from .auth import get_current_user

router = APIRouter()

# Schemas
class MessageCreate(BaseModel):
    receiverId: int
    content: Optional[str] = None
    messageType: str = "text"  # text, audio, image, video

class MessageResponse(BaseModel):
    id: int
    senderId: int
    receiverId: int
    content: Optional[str]
    messageType: str
    mediaUrl: Optional[str]
    isRead: bool
    createdAt: str
    sender: dict
    receiver: dict

class ConversationResponse(BaseModel):
    id: int
    otherUser: dict
    lastMessage: Optional[dict]
    unreadCount: int
    updatedAt: str

@router.post("/send", response_model=dict)
async def send_message(
    message_data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Enviar mensagem"""
    # Verificar se o destinatário existe
    receiver = db.query(User).filter(User.id == message_data.receiverId).first()
    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receiver not found"
        )
    
    # Não pode enviar mensagem para si mesmo
    if current_user.id == message_data.receiverId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send message to yourself"
        )
    
    # Criar mensagem
    new_message = Message(
        sender_id=current_user.id,
        receiver_id=message_data.receiverId,
        content=message_data.content,
        message_type=message_data.messageType
    )
    
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    # Buscar ou criar conversa
    conversation = db.query(Conversation).filter(
        or_(
            and_(Conversation.user1_id == current_user.id, Conversation.user2_id == message_data.receiverId),
            and_(Conversation.user1_id == message_data.receiverId, Conversation.user2_id == current_user.id)
        )
    ).first()
    
    if not conversation:
        conversation = Conversation(
            user1_id=min(current_user.id, message_data.receiverId),
            user2_id=max(current_user.id, message_data.receiverId)
        )
        db.add(conversation)
    
    # Atualizar última mensagem da conversa
    conversation.last_message_id = new_message.id
    conversation.updated_at = datetime.utcnow()
    
    db.commit()
    
    # Criar notificação
    notification = Notification(
        user_id=message_data.receiverId,
        type="message",
        title=f"Nova mensagem de {current_user.full_name}",
        message=message_data.content[:100] if message_data.content else "Enviou uma mídia",
        related_user_id=current_user.id,
        action_url=f"/messages/{current_user.id}"
    )
    
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    # Enviar notificação em tempo real
    try:
        from ..websocket import manager
        message_dict = new_message.to_dict()
        await manager.send_message_notification(message_dict, message_data.receiverId)
    except ImportError:
        pass  # WebSocket não disponível
    
    return {
        "message": "Message sent successfully",
        "data": message_dict
    }

@router.get("/conversations", response_model=List[dict])
async def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter todas as conversas do usuário"""
    conversations = db.query(Conversation).filter(
        or_(
            Conversation.user1_id == current_user.id,
            Conversation.user2_id == current_user.id
        )
    ).order_by(desc(Conversation.updated_at)).all()
    
    result = []
    for conv in conversations:
        # Contar mensagens não lidas
        unread_count = db.query(Message).filter(
            and_(
                Message.receiver_id == current_user.id,
                or_(
                    and_(Message.sender_id == conv.user1_id, conv.user1_id != current_user.id),
                    and_(Message.sender_id == conv.user2_id, conv.user2_id != current_user.id)
                ),
                Message.is_read == False
            )
        ).count()
        
        conv_dict = conv.to_dict(current_user.id)
        conv_dict["unreadCount"] = unread_count
        result.append(conv_dict)
    
    return result

@router.get("/{user_id}", response_model=List[dict])
async def get_messages(
    user_id: int,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter mensagens de uma conversa"""
    # Verificar se o usuário existe
    other_user = db.query(User).filter(User.id == user_id).first()
    if not other_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Buscar mensagens
    messages = db.query(Message).filter(
        or_(
            and_(Message.sender_id == current_user.id, Message.receiver_id == user_id),
            and_(Message.sender_id == user_id, Message.receiver_id == current_user.id)
        )
    ).filter(
        and_(
            Message.is_deleted_by_sender == False,
            Message.is_deleted_by_receiver == False
        )
    ).order_by(desc(Message.created_at)).offset(offset).limit(limit).all()
    
    # Marcar mensagens como lidas
    unread_messages = db.query(Message).filter(
        and_(
            Message.sender_id == user_id,
            Message.receiver_id == current_user.id,
            Message.is_read == False
        )
    ).all()
    
    for msg in unread_messages:
        msg.is_read = True
        msg.read_at = datetime.utcnow()
    
    db.commit()
    
    return [msg.to_dict() for msg in reversed(messages)]

@router.put("/{message_id}/read")
async def mark_message_read(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Marcar mensagem como lida"""
    message = db.query(Message).filter(
        and_(
            Message.id == message_id,
            Message.receiver_id == current_user.id
        )
    ).first()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    message.is_read = True
    message.read_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Message marked as read"}

@router.delete("/{message_id}")
async def delete_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Excluir mensagem"""
    message = db.query(Message).filter(Message.id == message_id).first()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Verificar se o usuário pode excluir a mensagem
    if message.sender_id != current_user.id and message.receiver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own messages"
        )
    
    # Marcar como excluída para o usuário atual
    if message.sender_id == current_user.id:
        message.is_deleted_by_sender = True
    else:
        message.is_deleted_by_receiver = True
    
    # Se foi excluída por ambos, excluir permanentemente
    if message.is_deleted_by_sender and message.is_deleted_by_receiver:
        db.delete(message)
    
    db.commit()
    
    return {"message": "Message deleted successfully"}

@router.delete("/conversations/{user_id}/clear")
async def clear_conversation(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Limpar conversa"""
    # Marcar todas as mensagens como excluídas para o usuário atual
    messages = db.query(Message).filter(
        or_(
            and_(Message.sender_id == current_user.id, Message.receiver_id == user_id),
            and_(Message.sender_id == user_id, Message.receiver_id == current_user.id)
        )
    ).all()
    
    for message in messages:
        if message.sender_id == current_user.id:
            message.is_deleted_by_sender = True
        else:
            message.is_deleted_by_receiver = True
    
    db.commit()
    
    return {"message": "Conversation cleared successfully"}

@router.post("/upload-audio")
async def upload_audio_message(
    receiver_id: int = Form(...),
    audio_file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload de mensagem de áudio"""
    # Verificar se o destinatário existe
    receiver = db.query(User).filter(User.id == receiver_id).first()
    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receiver not found"
        )
    
    # Verificar tipo de arquivo
    if not audio_file.content_type.startswith("audio/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an audio file"
        )
    
    # Gerar nome único para o arquivo
    file_extension = audio_file.filename.split(".")[-1] if "." in audio_file.filename else "ogg"
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    upload_dir = "uploads/audio"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, unique_filename)
    
    # Salvar arquivo
    async with aiofiles.open(file_path, 'wb') as f:
        content = await audio_file.read()
        await f.write(content)
    
    # Criar mensagem
    new_message = Message(
        sender_id=current_user.id,
        receiver_id=receiver_id,
        message_type="audio",
        media_url=f"/uploads/audio/{unique_filename}"
    )
    
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    # Atualizar conversa
    conversation = db.query(Conversation).filter(
        or_(
            and_(Conversation.user1_id == current_user.id, Conversation.user2_id == receiver_id),
            and_(Conversation.user1_id == receiver_id, Conversation.user2_id == current_user.id)
        )
    ).first()
    
    if not conversation:
        conversation = Conversation(
            user1_id=min(current_user.id, receiver_id),
            user2_id=max(current_user.id, receiver_id)
        )
        db.add(conversation)
    
    conversation.last_message_id = new_message.id
    conversation.updated_at = datetime.utcnow()
    
    db.commit()
    
    # Criar notificação
    notification = Notification(
        user_id=receiver_id,
        type="message",
        title=f"Nova mensagem de áudio de {current_user.full_name}",
        message="Enviou uma mensagem de áudio",
        related_user_id=current_user.id,
        action_url=f"/messages/{current_user.id}"
    )
    
    db.add(notification)
    db.commit()
    
    # Enviar notificação em tempo real
    try:
        from ..websocket import manager
        message_dict = new_message.to_dict()
        await manager.send_message_notification(message_dict, receiver_id)
    except ImportError:
        pass  # WebSocket não disponível
    
    return {
        "message": "Audio message sent successfully",
        "data": message_dict
    }

@router.get("/unread-count")
async def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter contagem de mensagens não lidas"""
    unread_count = db.query(Message).filter(
        and_(
            Message.receiver_id == current_user.id,
            Message.is_read == False
        )
    ).count()
    
    return {"unreadCount": unread_count}
