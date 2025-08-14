import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Search, Send, Mic, MicOff, MoreVertical, Trash2, Archive } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import useWebSocket from '../hooks/useWebSocket';

const Messages = () => {
  const { user } = useAuth();
  const { lastMessage, sendMessage: sendWebSocketMessage } = useWebSocket();
  
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});

  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const typingTimeoutRef = useRef(null);

  // Scroll para o final das mensagens
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Carregar conversas
  const loadConversations = async () => {
    try {
      const response = await api.get('/api/messages/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    }
  };

  // Carregar mensagens de uma conversa
  const loadMessages = async (userId) => {
    try {
      const response = await api.get(`/api/messages/${userId}`);
      setMessages(response.data);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  // Enviar mensagem
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      await api.post('/api/messages/send', {
        receiverId: selectedConversation.otherUser.id,
        content: messageText,
        messageType: 'text'
      });

      // Adicionar mensagem localmente
      const newMsg = {
        id: Date.now(),
        senderId: user.id,
        receiverId: selectedConversation.otherUser.id,
        content: messageText,
        messageType: 'text',
        isRead: false,
        createdAt: new Date().toISOString(),
        sender: user,
        receiver: selectedConversation.otherUser
      };

      setMessages(prev => [...prev, newMsg]);
      setTimeout(scrollToBottom, 100);

      // Atualizar conversas
      loadConversations();

      // Parar de indicar que está digitando
      stopTyping();

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setNewMessage(messageText); // Restaurar texto se falhou
    }
  };

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
      await api.post('/api/messages/upload-audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      loadMessages(selectedConversation.otherUser.id);
      loadConversations();
    } catch (error) {
      console.error('Erro ao enviar áudio:', error);
    }
  };

  // Indicar que está digitando
  const handleTyping = (text) => {
    setNewMessage(text);

    if (!isTyping && selectedConversation) {
      setIsTyping(true);
      sendWebSocketMessage({
        type: 'typing',
        data: {
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
        type: 'typing',
        data: {
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
  useEffect(() => {
    loadConversations().finally(() => setLoading(false));
  }, []);

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-y-auto h-full">
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => {
                setSelectedConversation(conversation);
                loadMessages(conversation.otherUser.id);
              }}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedConversation?.id === conversation.id ? 'bg-primary-50 border-primary-200' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
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
                  
                  {conversation.lastMessage && (
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {conversation.lastMessage.messageType === 'audio' 
                        ? '🎵 Mensagem de áudio' 
                        : conversation.lastMessage.content
                      }
                    </p>
                  )}
                  
                  {conversation.unreadCount > 0 && (
                    <div className="mt-1">
                      <span className="bg-primary-500 text-white text-xs rounded-full px-2 py-1">
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
              
              <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
                {selectedConversation.otherUser.firstName.charAt(0)}
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {selectedConversation.otherUser.firstName} {selectedConversation.otherUser.lastName}
                </h3>
                {typingUsers[selectedConversation.otherUser.id] && (
                  <p className="text-sm text-primary-500">digitando...</p>
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
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.senderId === user.id
                      ? 'bg-primary-500 text-white'
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
                  ) : (
                    <p>{message.content}</p>
                  )}
                  
                  <div className={`text-xs mt-1 ${
                    message.senderId === user.id ? 'text-primary-100' : 'text-gray-500'
                  }`}>
                    {new Date(message.createdAt).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    {message.senderId === user.id && (
                      <span className="ml-1">
                        {message.isRead ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Campo de Entrada */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Digite uma mensagem..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-2 rounded-lg ${
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
                className="bg-primary-500 text-white p-2 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
