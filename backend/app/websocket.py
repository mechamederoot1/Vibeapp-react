from fastapi import WebSocket, WebSocketDisconnect, Depends
from typing import Dict, List
import json
import asyncio
from .api.auth import get_user_from_websocket
from .models import User, Notification
from .database.database import SessionLocal

class ConnectionManager:
    def __init__(self):
        # Dicionário para armazenar conexões: {user_id: [websockets]}
        self.active_connections: Dict[int, List[WebSocket]] = {}
        
    async def connect(self, websocket: WebSocket, user_id: int):
        """Conectar um usuário"""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        
        self.active_connections[user_id].append(websocket)
        print(f"User {user_id} connected. Total connections: {len(self.active_connections[user_id])}")
        
    def disconnect(self, websocket: WebSocket, user_id: int):
        """Desconectar um usuário"""
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
                
            # Remove o usuário se não tem mais conexões
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                
        print(f"User {user_id} disconnected")
        
    async def send_personal_message(self, message: dict, user_id: int):
        """Enviar mensagem para um usuário específico"""
        print(f"WS SEND -> user:{user_id} type:{message.get('type')} data_keys:{list(message.get('data', {}).keys())}")
        if user_id in self.active_connections:
            # Criar uma cópia da lista para evitar problemas de modificação durante iteração
            connections = self.active_connections[user_id].copy()

            for websocket in connections:
                try:
                    await websocket.send_text(json.dumps(message))
                except Exception as e:
                    print(f"Error sending message to user {user_id}: {e}")
                    # Remove conexão inválida
                    self.disconnect(websocket, user_id)
                    
    async def send_notification(self, notification_data: dict, user_id: int):
        """Enviar notificação para um usuário"""
        message = {
            "type": "notification",
            "data": notification_data
        }
        await self.send_personal_message(message, user_id)
        
    async def send_message_notification(self, message_data: dict, user_id: int):
        """Enviar notificação de nova mensagem"""
        print(f"WS NEW_MESSAGE -> to:{user_id} messageId:{message_data.get('id')} senderId:{message_data.get('senderId')}")
        message = {
            "type": "new_message",
            "data": message_data
        }
        await self.send_personal_message(message, user_id)
        
    async def send_reaction_notification(self, reaction_data: dict, user_id: int):
        """Enviar notificação de nova reação"""
        message = {
            "type": "new_reaction",
            "data": reaction_data
        }
        await self.send_personal_message(message, user_id)
        
    async def send_comment_notification(self, comment_data: dict, user_id: int):
        """Enviar notificação de novo comentário"""
        message = {
            "type": "new_comment",
            "data": comment_data
        }
        await self.send_personal_message(message, user_id)
        
    async def send_share_notification(self, share_data: dict, user_id: int):
        """Enviar notificação de compartilhamento"""
        message = {
            "type": "new_share",
            "data": share_data
        }
        await self.send_personal_message(message, user_id)
        
    def get_connected_users(self) -> List[int]:
        """Retornar lista de usuários conectados"""
        return list(self.active_connections.keys())
        
    def is_user_online(self, user_id: int) -> bool:
        """Verificar se usuário está online"""
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0

# Instância global do gerenciador de conexões
manager = ConnectionManager()

async def websocket_endpoint(websocket: WebSocket, token: str = None):
    """Endpoint principal do WebSocket"""
    if not token:
        await websocket.close(code=4001, reason="Token not provided")
        return
        
    # Verificar autenticação
    try:
        user = await get_user_from_websocket(token)
        if not user:
            await websocket.close(code=4001, reason="Invalid token")
            return
    except Exception as e:
        await websocket.close(code=4001, reason="Authentication failed")
        return
        
    user_id = user.id
    await manager.connect(websocket, user_id)
    
    try:
        # Enviar confirmação de conexão
        await websocket.send_text(json.dumps({
            "type": "connection_established",
            "data": {
                "userId": user_id,
                "message": "Connected successfully"
            }
        }))

        # Ao conectar, enviar quaisquer notificações pendentes (notificações persistentes não enviadas)
        try:
            session = SessionLocal()
            pending = session.query(Notification).filter_by(user_id=user_id, is_sent=False).all()
            for n in pending:
                await manager.send_personal_message({
                    "type": "notification",
                    "data": {
                        "id": n.id,
                        "type": n.type,
                        "title": n.title,
                        "message": n.message,
                        "relatedUserId": n.related_user_id,
                        "actionUrl": n.action_url,
                        "createdAt": n.created_at.isoformat() if n.created_at else None
                    }
                }, user_id)
                # marcar enviado
                try:
                    n.is_sent = True
                    session.commit()
                except Exception:
                    session.rollback()
            session.close()
        except Exception as e:
            print('Erro ao enviar notificações pendentes:', e)

        # Loop principal para manter conexão viva
        while True:
            try:
                # Aguardar mensagens do cliente
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                
                # Processar mensagem recebida
                try:
                    message = json.loads(data)
                    await handle_websocket_message(websocket, user_id, message)
                except json.JSONDecodeError:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "data": {"message": "Invalid JSON format"}
                    }))
                    
            except asyncio.TimeoutError:
                # Enviar ping para manter conexão viva
                await websocket.send_text(json.dumps({
                    "type": "ping",
                    "data": {"timestamp": asyncio.get_event_loop().time()}
                }))
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception as e:
        print(f"WebSocket error for user {user_id}: {e}")
        manager.disconnect(websocket, user_id)
        
async def handle_websocket_message(websocket: WebSocket, user_id: int, message: dict):
    """Processar mensagem recebida via WebSocket"""
    message_type = message.get("type")
    
    if message_type == "pong":
        # Resposta ao ping - não fazer nada
        pass
    elif message_type == "typing":
        # Notificar usuário que está recebendo que alguém está digitando
        data = message.get("data", {})
        receiver_id = data.get("receiverId")
        if receiver_id:
            await manager.send_personal_message({
                "type": "user_typing",
                "data": {
                    "senderId": user_id,
                    "receiverId": receiver_id,
                    "isTyping": data.get("isTyping", False)
                }
            }, receiver_id)
    elif message_type == "mark_messages_read":
        # Marcar mensagens como lidas - será implementado na API
        pass
    else:
        # Mensagem não reconhecida
        await websocket.send_text(json.dumps({
            "type": "error",
            "data": {"message": f"Unknown message type: {message_type}"}
        }))
