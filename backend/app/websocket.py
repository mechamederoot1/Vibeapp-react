from fastapi import WebSocket, WebSocketDisconnect, Depends
from typing import Dict, List
import json
import asyncio
from datetime import datetime
from .api.auth import get_user_from_websocket
from .models import User, Message
from .database.database import SessionLocal

class ConnectionManager:
    def __init__(self):
        # Dicionário para armazenar conexões: {user_id: [websockets]}
        self.active_connections: Dict[int, List[WebSocket]] = {}
        self.last_seen: Dict[int, float] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        """Conectar um usuário"""
        await websocket.accept()

        if user_id not in self.active_connections:
            self.active_connections[user_id] = []

        self.active_connections[user_id].append(websocket)
        self.last_seen[user_id] = asyncio.get_event_loop().time()
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
        if user_id in self.active_connections:
            connections = self.active_connections[user_id].copy()
            async def _send(ws: WebSocket):
                try:
                    await ws.send_text(json.dumps(message))
                except Exception as e:
                    print(f"Error sending message to user {user_id}: {e}")
                    self.disconnect(ws, user_id)
            await asyncio.gather(*[_send(ws) for ws in connections], return_exceptions=True)
                    
    async def send_notification(self, notification_data: dict, user_id: int):
        """Enviar notificação para um usuário"""
        message = {
            "type": "notification",
            "data": notification_data
        }
        await self.send_personal_message(message, user_id)
        
    async def send_message_notification(self, message_data: dict, user_id: int):
        """Enviar notificação de nova mensagem"""
        message = {
            "type": "new_message",
            "data": message_data
        }
        await self.send_personal_message(message, user_id)

    async def send_delivery_ack(self, message_id: int, receiver_id: int, delivered_at: str, sender_id: int):
        """Enviar confirmação de entrega para o remetente"""
        payload = {
            "type": "message_delivered",
            "data": {
                "messageId": message_id,
                "receiverId": receiver_id,
                "deliveredAt": delivered_at,
                "senderId": sender_id
            }
        }
        await self.send_personal_message(payload, sender_id)        
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

        # Flush de mensagens pendentes (não entregues)
        db = SessionLocal()
        try:
            pending = db.query(Message).filter(Message.receiver_id == user_id, Message.is_delivered == False).order_by(Message.created_at.asc()).all()
            for msg in pending:
                data = msg.to_dict()
                await manager.send_message_notification(data, user_id)
                # Marcar como entregue
                msg.is_delivered = True
                msg.delivered_at = datetime.utcnow()
                db.commit()
                # Enviar ACK para remetente
                try:
                    await manager.send_delivery_ack(msg.id, msg.receiver_id, msg.delivered_at.isoformat(), msg.sender_id)
                except Exception:
                    pass
        finally:
            db.close()

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
    elif message_type in ("typing", "user_typing"):
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
    elif message_type == "pong":
        manager.last_seen[user_id] = asyncio.get_event_loop().time()
    elif message_type == "mark_messages_read":
        # Marcar mensagens como lidas diretamente via WS
        try:
            from .database.database import SessionLocal
            db = SessionLocal()
            ids = message.get("data", {}).get("messageIds", [])
            if ids:
                msgs = db.query(Message).filter(Message.id.in_(ids), Message.receiver_id == user_id, Message.is_read == False).all()
                if msgs:
                    now = datetime.utcnow()
                    for m in msgs:
                        m.is_read = True
                        m.read_at = now
                    db.commit()
                    senders = {m.sender_id for m in msgs}
                    for sid in senders:
                        await manager.send_personal_message({
                            "type": "messages_read",
                            "data": {"messageIds": [m.id for m in msgs if m.sender_id == sid], "readerId": user_id, "readAt": now.isoformat()}
                        }, sid)
        except Exception as e:
            print(f"Error marking messages read via WS: {e}")
        finally:
            try:
                db.close()
            except Exception:
                pass
    elif message_type == 'call_attention':
        # Um usuário está chamando a atenção de outro via WS
        try:
            data = message.get('data', {}) or {}
            receiver_id = data.get('receiverId')
            # Use o user_id autenticado como senderId para segurança
            sender_id = user_id
            if receiver_id:
                payload = {
                    'type': 'call_attention',
                    'data': {
                        'senderId': sender_id,
                        'receiverId': receiver_id,
                        'timestamp': datetime.utcnow().isoformat()
                    }
                }
                await manager.send_personal_message(payload, receiver_id)
        except Exception as e:
            print(f"Error handling call_attention: {e}")
    else:
        # Mensagem não reconhecida
        await websocket.send_text(json.dumps({
            "type": "error",
            "data": {"message": f"Unknown message type: {message_type}"}
        }))
