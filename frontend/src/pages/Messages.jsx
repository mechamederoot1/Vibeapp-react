import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Search, Send, Mic, MicOff, MoreVertical, Trash2, Archive, Image as ImageIcon, Video as VideoIcon, Check, CheckCheck, Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import useWebSocket from '../hooks/useWebSocket';

const statusIcon = (status, isOwn) => {
  if (!isOwn) return null
  switch (status) {
    case 'sending':
      return <Loader2 className="inline-block ml-1 animate-spin" size={14} />
    case 'sent':
      return <Check className="inline-block ml-1 opacity-60" size={14} />
    case 'delivered':
      return <CheckCheck className="inline-block ml-1 opacity-60" size={14} />
    case 'read':
      return <CheckCheck className="inline-block ml-1 text-white" size={14} />
    default:
      return null
  }
}

const Messages = () => {
  const { user } = useAuth();
  const { lastMessage, sendMessage: sendWebSocketMessage } = useWebSocket();

  const TypingDots = ({ className = '' }) => (
    <span className={`inline-flex items-center space-x-1 ${className}`}>
      <span className="text-sm text-vibe-blue">digitando</span>
      <span className="text-sm text-vibe-blue animate-pulse">...</span>
    </span>
  );

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [imageInputKey, setImageInputKey] = useState(0)
  const [videoInputKey, setVideoInputKey] = useState(0)

  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);

  const autoResizeTextarea = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const maxHeight = 180; // limit to reasonable height
    ta.style.height = Math.min(ta.scrollHeight, maxHeight) + 'px';
  }

  // Helpers de demo/localStorage
  const demoKey = (suffix) => `demo:messages:${suffix}`
  const saveDemo = (userId, msgs) => localStorage.setItem(demoKey(`thread:${userId}`), JSON.stringify(msgs))
  const loadDemo = (userId) => JSON.parse(localStorage.getItem(demoKey(`thread:${userId}`)) || '[]')
  const saveDemoConvs = (convs) => localStorage.setItem(demoKey('conversations'), JSON.stringify(convs))
  const loadDemoConvs = () => JSON.parse(localStorage.getItem(demoKey('conversations')) || '[]')

  const updateConversationsFromMessages = (otherId, msgs) => {
    const last = msgs[msgs.length - 1]
    setConversations(prev => {
      const others = prev.filter(c => c.otherUser.id !== otherId)
      const conv = prev.find(c => c.otherUser.id === otherId) || {
        id: otherId,
        otherUser: { id: otherId, firstName: 'Contato', lastName: String(otherId) }
      }
      const unread = msgs.filter(m => m.senderId === otherId && !m.isRead).length
      const updated = { ...conv, lastMessage: last, unreadCount: unread }
      const next = [updated, ...others].sort((a,b)=> (b.lastMessage?.createdAt||'') > (a.lastMessage?.createdAt||'') ? 1 : -1)
      saveDemoConvs(next)
      return next
    })
  }

  // Scroll para o final das mensagens
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Carregar conversas
  const loadConversations = async () => {
    try {
      const response = await api.get('/messages/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Erro ao carregar conversas (usando modo demo):', error);
      // Fallback demo
      const convs = loadDemoConvs()
      setConversations(convs)
      if (convs.length === 0) {
        const sample = [{ id: 2, otherUser: { id: 2, firstName: 'Marina', lastName: 'Santos' }, lastMessage: null, unreadCount: 0 }]
        setConversations(sample)
        saveDemoConvs(sample)
      }
    }
  };

  // Carregar mensagens de uma conversa
  const loadMessages = async (userId) => {
    try {
      const response = await api.get(`/messages/${userId}`);
      setMessages(response.data);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Erro ao carregar mensagens (usando modo demo):', error);
      const msgs = loadDemo(userId)
      setMessages(msgs)
      setTimeout(scrollToBottom, 100);
    }
  };

  const scheduleStatusProgress = (msg, otherId) => {
    // Progressão de status local: sending -> sent -> delivered -> read
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'sent' } : m))
    }, 300)
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'delivered' } : m))
    }, 1000)
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'read', isRead: true } : m))
    }, 2500)

    // Persistir demo
    setTimeout(() => {
      const next = messages.concat([{ ...msg, status: 'sending' }])
      saveDemo(otherId, next)
      updateConversationsFromMessages(otherId, next)
    }, 0)
  }

  // Enviar mensagem de texto
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    const tempMsg = {
      id: Date.now(),
      senderId: user.id,
      receiverId: selectedConversation.otherUser.id,
      content: messageText,
      messageType: 'text',
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: user,
      receiver: selectedConversation.otherUser,
      status: 'sending'
    }

    try {
      await api.post('/messages/send', {
        receiverId: selectedConversation.otherUser.id,
        content: messageText,
        messageType: 'text'
      });
    } catch (error) {
      // Sem backend: segue local
      console.warn('Sem backend para enviar texto, usando modo demo')
    }

    setMessages(prev => [...prev, tempMsg]);
    setTimeout(scrollToBottom, 100);
    updateConversationsFromMessages(selectedConversation.otherUser.id, [...messages, tempMsg])
    scheduleStatusProgress(tempMsg, selectedConversation.otherUser.id)

    // Parar de indicar que está digitando
    stopTyping();
  };

  // Enviar mídia
  const sendImage = async (file) => {
    if (!selectedConversation) return
    const url = URL.createObjectURL(file)
    const tempMsg = {
      id: Date.now(),
      senderId: user.id,
      receiverId: selectedConversation.otherUser.id,
      content: '',
      messageType: 'image',
      mediaUrl: url,
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: user,
      receiver: selectedConversation.otherUser,
      status: 'sending'
    }
    setMessages(prev => [...prev, tempMsg])
    setTimeout(scrollToBottom, 100)
    updateConversationsFromMessages(selectedConversation.otherUser.id, [...messages, tempMsg])
    scheduleStatusProgress(tempMsg, selectedConversation.otherUser.id)
    setImageInputKey(k => k + 1)
  }

  const sendVideo = async (file) => {
    if (!selectedConversation) return
    if (file.type !== 'video/mp4') {
      alert('Apenas vídeos MP4 são suportados.');
      return
    }
    const url = URL.createObjectURL(file)
    const tempMsg = {
      id: Date.now(),
      senderId: user.id,
      receiverId: selectedConversation.otherUser.id,
      content: '',
      messageType: 'video',
      mediaUrl: url,
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: user,
      receiver: selectedConversation.otherUser,
      status: 'sending'
    }
    setMessages(prev => [...prev, tempMsg])
    setTimeout(scrollToBottom, 100)
    updateConversationsFromMessages(selectedConversation.otherUser.id, [...messages, tempMsg])
    scheduleStatusProgress(tempMsg, selectedConversation.otherUser.id)
    setVideoInputKey(k => k + 1)
  }

  // Iniciar gravação de áudio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/ogg' });
        await sendAudioMessage(audioBlob);

        // Parar stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
    }
  };

  // Parar gravação
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Enviar mensagem de áudio
  const sendAudioMessage = async (audioBlob) => {
    if (!selectedConversation) return;

    const formData = new FormData();
    formData.append('receiver_id', selectedConversation.otherUser.id);
    formData.append('audio_file', audioBlob, 'audio.ogg');

    try {
      await api.post('/messages/upload-audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } catch (error) {
      console.warn('Sem backend para enviar áudio, usando modo demo')
    }

    const url = URL.createObjectURL(audioBlob)
    const tempMsg = {
      id: Date.now(),
      senderId: user.id,
      receiverId: selectedConversation.otherUser.id,
      content: '',
      messageType: 'audio',
      mediaUrl: url,
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: user,
      receiver: selectedConversation.otherUser,
      status: 'sending'
    }
    setMessages(prev => [...prev, tempMsg])
    setTimeout(scrollToBottom, 100)
    updateConversationsFromMessages(selectedConversation.otherUser.id, [...messages, tempMsg])
    scheduleStatusProgress(tempMsg, selectedConversation.otherUser.id)
  };

  // Indicar que está digitando
  const handleTyping = (text) => {
    setNewMessage(text);

    if (!isTyping && selectedConversation) {
      setIsTyping(true);
      sendWebSocketMessage({
        type: 'user_typing',
        data: {
          senderId: user.id,
          receiverId: selectedConversation.otherUser.id,
          isTyping: true
        }
      });
    }

    // Limpar timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Parar de indicar digitação após 3 segundos de inatividade
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  };

  // Parar de indicar digitação
  const stopTyping = () => {
    if (isTyping && selectedConversation) {
      setIsTyping(false);
      sendWebSocketMessage({
        type: 'user_typing',
        data: {
          senderId: user.id,
          receiverId: selectedConversation.otherUser.id,
          isTyping: false
        }
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  // Processar mensagens WebSocket
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === 'new_message') {
      const message = lastMessage.data;

      // Se é uma mensagem da conversa atual, adicionar à lista
      if (selectedConversation &&
          (message.senderId === selectedConversation.otherUser.id ||
           message.receiverId === selectedConversation.otherUser.id)) {
        setMessages(prev => {
          const exists = prev.find(m => m.id === message.id);
          if (!exists) {
            return [...prev, message];
          }
          return prev;
        });
        setTimeout(scrollToBottom, 100);
      }

      // Atualizar lista de conversas
      loadConversations();
    }

    if (lastMessage.type === 'user_typing') {
      const { senderId, isTyping } = lastMessage.data;
      setTypingUsers(prev => ({
        ...prev,
        [senderId]: isTyping
      }));

      // Limpar indicação após 5 segundos
      setTimeout(() => {
        setTypingUsers(prev => ({
          ...prev,
          [senderId]: false
        }));
      }, 5000);
    }
  }, [lastMessage, selectedConversation]);

  // Carregar conversas ao montar
  const location = useLocation();

  useEffect(() => {
    const init = async () => {
      await loadConversations().finally(() => setLoading(false));

      try {
        const params = new URLSearchParams(location?.search || window.location.search);
        const username = params.get('user');
        const userIdParam = params.get('userId') || params.get('id');

        if (username) {
          try {
            const res = await api.get(`/users/by-username/${username}`);
            const other = res.data;
            if (other && other.id) {
              const existing = (conversations || []).find(c => c.otherUser && (c.otherUser.id === other.id || c.otherUser.username === other.username));
              const conv = existing || { id: other.id, otherUser: other, lastMessage: null, unreadCount: 0 };
              setSelectedConversation(conv);
              if (!existing) setConversations(prev => [conv, ...(prev || [])]);
              await loadMessages(other.id);
              try { window.history.pushState({ openedConversation: other.id }, ''); } catch(e){}
            }
          } catch (e) {
            console.warn('Usuário não encontrado por username:', username, e);
          }
        } else if (userIdParam) {
          const uid = Number(userIdParam);
          if (!Number.isNaN(uid)) {
            try {
              const res = await api.get(`/users/${uid}`);
              const other = res.data;
              const existing = (conversations || []).find(c => c.otherUser && c.otherUser.id === other.id);
              const conv = existing || { id: other.id, otherUser: other, lastMessage: null, unreadCount: 0 };
              setSelectedConversation(conv);
              if (!existing) setConversations(prev => [conv, ...(prev || [])]);
              await loadMessages(other.id);
              try { window.history.pushState({ openedConversation: other.id }, ''); } catch(e){}
            } catch (e) {
              console.warn('Usuário não encontrado por id:', uid, e);
            }
          }
        }
      } catch (err) {
        console.warn('Erro ao processar params de mensagens:', err);
      }
    };

    init();

    const onPop = (e) => {
      if (selectedConversation) {
        setSelectedConversation(null);
        try { window.history.pushState({}, ''); } catch(err){}
      }
    }

    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [location, selectedConversation]);


  // Scroll quando mensagens mudarem
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Limpar timeout ao desmontar
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const filteredConversations = conversations.filter(conv =>
    conv.otherUser.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherUser.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vibe-blue"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white pb-20 md:pb-0">
      {/* Lista de Conversas */}
      <div className={`w-full md:w-1/3 border-r border-gray-200 ${selectedConversation ? 'hidden md:block' : ''}`}>
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Mensagens</h1>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-y-auto h-full">
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={async () => {
                setSelectedConversation(conversation);
                await loadMessages(conversation.otherUser.id);
                try { window.history.pushState({ openedConversation: conversation.otherUser.id }, ''); } catch(e) { }
              }}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-vibe-blue rounded-full flex items-center justify-center text-white font-semibold">
                  {conversation.otherUser.firstName.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {conversation.otherUser.firstName} {conversation.otherUser.lastName}
                    </h3>
                    {conversation.lastMessage && (
                      <span className="text-xs text-gray-500">
                        {new Date(conversation.lastMessage.createdAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>

                  {typingUsers[conversation.otherUser.id] ? (
                    <p className="text-sm mt-1"><TypingDots /></p>
                  ) : conversation.lastMessage ? (
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {conversation.lastMessage.messageType === 'audio'
                        ? '🎵 Mensagem de áudio'
                        : conversation.lastMessage.messageType === 'image' ? '🖼️ Foto' : conversation.lastMessage.messageType === 'video' ? '🎬 Vídeo' : conversation.lastMessage.content
                      }
                    </p>
                  ) : null}

                  {conversation.unreadCount > 0 && (
                    <div className="mt-1">
                      <span className="bg-vibe-blue text-white text-xs rounded-full px-2 py-1">
                        {conversation.unreadCount}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredConversations.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <p>Nenhuma conversa encontrada</p>
            </div>
          )}
        </div>
      </div>

      {/* Área de Mensagens */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Header da Conversa */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSelectedConversation(null)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft size={20} />
              </button>

              <div className="w-10 h-10 bg-vibe-blue rounded-full flex items-center justify-center text-white font-semibold">
                {selectedConversation.otherUser.firstName.charAt(0)}
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {selectedConversation.otherUser.firstName} {selectedConversation.otherUser.lastName}
                </h3>
                {typingUsers[selectedConversation.otherUser.id] && (
                  <p className="text-sm"><TypingDots /></p>
                )}
              </div>

              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>

          {/* Lista de Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-3 py-2 rounded-2xl overflow-hidden ${
                    message.senderId === user.id
                      ? 'bg-vibe-blue text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  {message.messageType === 'audio' ? (
                    <div className="flex items-center space-x-2">
                      <audio controls className="w-full">
                        <source src={message.mediaUrl} type="audio/ogg" />
                        Seu navegador não suporta áudio.
                      </audio>
                    </div>
                  ) : message.messageType === 'image' ? (
                    <img src={message.mediaUrl} alt="imagem" className="max-w-[240px] rounded-lg" />
                  ) : message.messageType === 'video' ? (
                    <video src={message.mediaUrl} controls className="max-w-[240px] rounded-lg" />
                  ) : (
                    <p>{message.content}</p>
                  )}

                  <div className={`text-xs mt-1 flex items-center ${
                    message.senderId === user.id ? 'text-white/80' : 'text-gray-500'
                  }`}>
                    {new Date(message.createdAt).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    {statusIcon(message.status, message.senderId === user.id)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Campo de Entrada */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center space-x-2">
              <label className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg cursor-pointer flex-shrink-0">
                <ImageIcon size={20} />
                <input key={imageInputKey} type="file" accept="image/*" className="hidden" onChange={(e)=>{const f=e.target.files?.[0]; if(f) sendImage(f)}} />
              </label>
              <label className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg cursor-pointer flex-shrink-0">
                <VideoIcon size={20} />
                <input key={videoInputKey} type="file" accept="video/mp4" className="hidden" onChange={(e)=>{const f=e.target.files?.[0]; if(f) sendVideo(f)}} />
              </label>

              {/* Typing indicator next to composer (shows name + animation) */}
              {selectedConversation && typingUsers[selectedConversation.otherUser.id] && (
                <div className="flex items-center mr-2">
                  <div className="text-sm text-vibe-blue mr-1">{selectedConversation.otherUser.firstName}</div>
                  <TypingDots />
                </div>
              )}

              <textarea
                ref={textareaRef}
                rows={1}
                value={newMessage}
                onChange={(e) => { handleTyping(e.target.value); autoResizeTextarea(); }}
                onInput={autoResizeTextarea}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Digite uma mensagem..."
                className="flex-1 min-w-0 resize-none border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-vibe-blue focus:border-transparent h-10"
              />

              <button
              onClick={isRecording ? stopRecording : startRecording}
                className={`p-2 rounded-lg flex-shrink-0 ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="bg-vibe-blue text-white p-2 rounded-lg hover:bg-vibe-blue-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Send className="text-gray-400" size={32} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Suas mensagens</h2>
            <p className="text-gray-600">Selecione uma conversa para começar a conversar</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
