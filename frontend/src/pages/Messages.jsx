import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Search, Send, Mic, MicOff, MoreVertical, Trash2, Archive, Image as ImageIcon, Video as VideoIcon, Check, CheckCheck, Loader2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api, uploadsAPI } from '../services/api';
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

const formatDateLabel = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  if (isToday) return 'Hoje';
  if (isYesterday) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

const Messages = () => {
  const { user } = useAuth();
  const { lastMessage, sendMessage: sendWebSocketMessage } = useWebSocket();
  const navigate = useNavigate();

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

  // Pagination state for messages
  const [messagesPage, setMessagesPage] = useState(1);
  const [messagesLimit] = useState(20);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const messagesEndRef = useRef(null);
  const msgListRef = useRef(null);
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

  // Pagination state for conversations
  const [conversationsPage, setConversationsPage] = useState(1);
  const [conversationsLimit] = useState(20);
  const [hasMoreConversations, setHasMoreConversations] = useState(true);
  const [loadingMoreConversations, setLoadingMoreConversations] = useState(false);
  const convListRef = useRef(null);

  // Carregar conversas (paginated)
  const loadConversations = async (page = 1, limit = conversationsLimit) => {
    try {
      const response = await api.get(`/messages/conversations?page=${page}&limit=${limit}`);
      const fetched = Array.isArray(response.data) ? response.data : [];

      if (page === 1) {
        setConversations(fetched);
        setConversationsPage(1);
      } else {
        setConversations(prev => {
          const ids = new Set(prev.map(c => c.id));
          const uniqueFetched = fetched.filter(c => !ids.has(c.id));
          return [...prev, ...uniqueFetched];
        });
      }

      setHasMoreConversations(fetched.length === limit);
      setConversationsPage(page);
    } catch (error) {
      console.error('Erro ao carregar conversas (usando modo demo):', error);
      const convs = loadDemoConvs();
      if (page === 1) setConversations(convs);
      setHasMoreConversations(false);
    }
  };

  const handleConversationsScroll = () => {
    const container = convListRef.current;
    if (!container || loadingMoreConversations || !hasMoreConversations) return;
    // If near bottom, load next page
    if (container.scrollHeight - container.scrollTop - container.clientHeight < 150) {
      const nextPage = conversationsPage + 1;
      setLoadingMoreConversations(true);
      loadConversations(nextPage).finally(() => setLoadingMoreConversations(false));
    }
  };

  // Carregar mensagens de uma conversa com paginação (page=1 returns latest page)
  const loadMessages = async (userId, page = 1, limit = messagesLimit) => {
    if (!userId) return;
    if (page === 1) {
      setHasMoreMessages(true);
      setMessagesPage(1);
    }

    try {
      const response = await api.get(`/messages/${userId}?page=${page}&limit=${limit}`);
      const fetched = Array.isArray(response.data) ? response.data : (response.data.messages || []);

      // Ensure messages sorted oldest -> newest
      fetched.sort((a,b)=> new Date(a.createdAt) - new Date(b.createdAt));

      if (page === 1) {
        setMessages(fetched);
        // mark conversation unread count as read in UI
        setConversations(prev => prev.map(c => c.otherUser.id === userId ? { ...c, unreadCount: 0 } : c));
        setTimeout(() => scrollToBottom(), 120);
      } else {
        // Prepend older messages and keep scroll position
        setLoadingOlder(true);
        const container = msgListRef.current;
        const prevScrollHeight = container?.scrollHeight || 0;

        setMessages(prev => {
          // Avoid duplicates by id
          const ids = new Set(prev.map(m => m.id));
          const uniqueFetched = fetched.filter(m => !ids.has(m.id));
          return [...uniqueFetched, ...prev];
        });

        setTimeout(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight || 0;
            container.scrollTop = newScrollHeight - prevScrollHeight + (container.scrollTop || 0);
          }
          setLoadingOlder(false);
        }, 60);
      }

      // Update pagination state
      setHasMoreMessages(fetched.length === limit);
      setMessagesPage(page);
    } catch (error) {
      console.error('Erro ao carregar mensagens (usando modo demo):', error);
      const msgs = loadDemo(userId)
      msgs.sort((a,b)=> new Date(a.createdAt) - new Date(b.createdAt));
      setMessages(msgs)
      setTimeout(() => scrollToBottom(), 120);
    }
  };

  const handleScroll = () => {
    const c = msgListRef.current;
    if (!c || loadingOlder || !hasMoreMessages || !selectedConversation) return;
    // If near top, load older messages
    if (c.scrollTop < 120) {
      const nextPage = messagesPage + 1;
      setLoadingOlder(true);
      loadMessages(selectedConversation.otherUser.id, nextPage).finally(() => setLoadingOlder(false));
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
    try {
      const formData = new FormData()
      formData.append('receiver_id', selectedConversation.otherUser.id)
      formData.append('file', file)

      const res = await api.post('/messages/upload-media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const msg = res.data?.data
      if (msg) {
        setMessages(prev => [...prev, msg])
        updateConversationsFromMessages(selectedConversation.otherUser.id, [...messages, msg])
        scheduleStatusProgress(msg, selectedConversation.otherUser.id)
        setTimeout(scrollToBottom, 100)
      } else {
        // fallback to previous behavior
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
        updateConversationsFromMessages(selectedConversation.otherUser.id, [...messages, tempMsg])
        scheduleStatusProgress(tempMsg, selectedConversation.otherUser.id)
        setTimeout(scrollToBottom, 100)
      }
    } catch (err) {
      console.error('Erro ao enviar imagem:', err)
    }

    setImageInputKey(k => k + 1)
  }

  const sendVideo = async (file) => {
    if (!selectedConversation) return
    if (!file.type.startsWith('video/')) {
      alert('Apenas arquivos de vídeo são suportados.');
      return
    }

    try {
      const formData = new FormData()
      formData.append('receiver_id', selectedConversation.otherUser.id)
      formData.append('file', file)

      const res = await api.post('/messages/upload-media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const msg = res.data?.data
      if (msg) {
        setMessages(prev => [...prev, msg])
        updateConversationsFromMessages(selectedConversation.otherUser.id, [...messages, msg])
        scheduleStatusProgress(msg, selectedConversation.otherUser.id)
        setTimeout(scrollToBottom, 100)
      } else {
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
        updateConversationsFromMessages(selectedConversation.otherUser.id, [...messages, tempMsg])
        scheduleStatusProgress(tempMsg, selectedConversation.otherUser.id)
        setTimeout(scrollToBottom, 100)
      }
    } catch (err) {
      console.error('Erro ao enviar vídeo:', err)
    }

    setVideoInputKey(k => k + 1)
  }

  // Iniciar gravação de ��udio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Select supported mimeType for MediaRecorder
      const candidates = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm', 'audio/ogg'];
      let mimeType = '';
      if (window.MediaRecorder && typeof MediaRecorder.isTypeSupported === 'function') {
        for (const c of candidates) {
          if (MediaRecorder.isTypeSupported(c)) {
            mimeType = c;
            break;
          }
        }
      }

      try {
        mediaRecorderRef.current = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      } catch (err) {
        // Fallback without options
        mediaRecorderRef.current = new MediaRecorder(stream);
      }

      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current?.mimeType || 'audio/ogg' });
        await sendAudioMessage(audioBlob);

        // Parar stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      alert('Não foi possível acessar o microfone. Verifique as permissões do navegador.');
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

    // Ensure proper filename and type
    const mime = audioBlob.type || 'audio/ogg';
    const ext = mime.split('/')[1].split(';')[0] || 'ogg';
    const file = new File([audioBlob], `audio.${ext}`, { type: mime });
    formData.append('audio_file', file);

    try {
      const res = await api.post('/messages/upload-audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const created = res.data?.data || res.data?.message || null;

      if (created && res.data?.data) {
        const msg = res.data.data;
        setMessages(prev => [...prev, msg]);
        updateConversationsFromMessages(selectedConversation.otherUser.id, [...messages, msg])
        scheduleStatusProgress(msg, selectedConversation.otherUser.id)
        setTimeout(scrollToBottom, 100)
        return
      }
    } catch (error) {
      console.warn('Sem backend para enviar áudio, usando modo demo', error)
    }

    // Fallback demo
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
  const { user: authUser, loading: authLoading } = useAuth();

  // If not authenticated, redirect to login immediately and prevent loading conversa directly from URL
  useEffect(() => {
    if (!authLoading && !authUser) {
      try { navigate('/login'); } catch(e) {}
    }
  }, [authLoading, authUser]);

  useEffect(() => {
    const init = async () => {
      if (!authUser) {
        setLoading(false);
        return;
      }

      await loadConversations(1).finally(() => setLoading(false));

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
              await loadMessages(other.id, 1);
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
              await loadMessages(other.id, 1);
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

  const [conversationsFilter, setConversationsFilter] = useState('all'); // 'all' | 'unread'

  let filteredConversations = conversations.filter(conv =>
    conv.otherUser.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherUser.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (conversationsFilter === 'unread') {
    filteredConversations = filteredConversations.filter(c => (c.unreadCount || 0) > 0);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vibe-blue"></div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen bg-white ${selectedConversation ? 'pb-0' : 'pb-20 md:pb-0'}`}>
      {/* Lista de Conversas */}
      <div className={`w-full md:w-1/3 border-r border-gray-200 ${selectedConversation ? 'hidden md:block' : ''}`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 mb-2">Mensagens</h1>
            <div className="flex items-center space-x-2">
              <button onClick={() => setConversationsFilter('all')} className={`px-3 py-1 rounded ${conversationsFilter === 'all' ? 'bg-vibe-blue text-white' : 'bg-gray-100 text-gray-700'}`}>Todas</button>
              <button onClick={() => setConversationsFilter('unread')} className={`px-3 py-1 rounded ${conversationsFilter === 'unread' ? 'bg-vibe-blue text-white' : 'bg-gray-100 text-gray-700'}`}>Não lidas</button>
            </div>
          </div>

          <div className="relative mt-3">
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

        <div ref={convListRef} onScroll={handleConversationsScroll} className="overflow-y-auto h-full">
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={async () => {
                setSelectedConversation(conversation);
                await loadMessages(conversation.otherUser.id, 1);
                try {
                  const qp = `?user=${encodeURIComponent(conversation.otherUser.username||'')}&userId=${conversation.otherUser.id}`;
                  navigate(`/messages${qp}`);
                } catch(e) { }
              }}
              className={`p-3 mb-3 cursor-pointer transition-shadow rounded-lg ${conversation.unreadCount > 0 ? 'bg-blue-50 shadow-sm' : 'bg-white border'} ${selectedConversation?.id === conversation.id ? 'ring-1 ring-vibe-blue' : ''}`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-vibe-blue rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {conversation.otherUser.firstName.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 pr-4">
                      <h3 className={`${conversation.unreadCount > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'} truncate`}>
                        {conversation.otherUser.firstName} {conversation.otherUser.lastName}
                      </h3>
                      {typingUsers[conversation.otherUser.id] ? (
                        <p className="text-sm mt-1 text-vibe-blue"><TypingDots /></p>
                      ) : conversation.lastMessage ? (
                        <p className={`${conversation.unreadCount > 0 ? 'text-gray-800' : 'text-gray-500'} text-sm truncate mt-1`}>
                          {conversation.lastMessage.messageType === 'audio'
                            ? '🎵 Mensagem de áudio'
                            : conversation.lastMessage.messageType === 'image' ? '🖼️ Foto' : conversation.lastMessage.messageType === 'video' ? '🎬 Vídeo' : conversation.lastMessage.content
                          }
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-col items-end ml-3 flex-shrink-0">
                      {conversation.lastMessage && (
                        <span className="text-xs text-gray-500">
                          {new Date(conversation.lastMessage.createdAt).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )}

                      <div className="mt-2">
                        {conversation.unreadCount > 0 ? (
                          <span className="bg-vibe-blue text-white text-xs rounded-full px-2 py-1 inline-flex items-center justify-center">
                            {conversation.unreadCount}
                          </span>
                        ) : (
                          <span className="w-6 h-6" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredConversations.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <p>Nenhuma conversa encontrada</p>
            </div>
          )}

          {loadingMoreConversations && (
            <div className="py-4 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-vibe-blue"></div>
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
                onClick={() => {
                  setSelectedConversation(null);
                  try { navigate('/messages'); } catch(e) {}
                }}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft size={20} />
              </button>

              <div className="w-10 h-10 bg-vibe-blue rounded-full flex items-center justify-center text-white font-semibold">
                {selectedConversation.otherUser.firstName.charAt(0)}
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  <button onClick={() => {
                    const u = selectedConversation.otherUser || {};
                    const pub = u.publicProfileId || u.public_profile_id;
                    if (pub) navigate(`/profile/id/${pub}`);
                    else if (u.id) navigate(`/profile/${u.id}`);
                    else if (u.username) navigate(`/profile/${u.username}`);
                  }} className="text-left w-full text-inherit hover:underline">
                    {selectedConversation.otherUser.firstName} {selectedConversation.otherUser.lastName}
                  </button>
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
          <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={msgListRef} onScroll={handleScroll}>
            {loadingOlder && (
              <div className="flex justify-center py-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-vibe-blue"></div>
              </div>
            )}

            {messages.map((message, idx) => {
              const prev = messages[idx - 1];
              const dateKey = message?.createdAt ? new Date(message.createdAt).toDateString() : '';
              const prevDateKey = prev?.createdAt ? new Date(prev.createdAt).toDateString() : null;

              return (
                <div key={message.id}>
                  {(idx === 0 || dateKey !== prevDateKey) && (
                    <div className="text-center text-xs text-gray-500 my-2">
                      <span className="bg-gray-100 px-3 py-1 rounded-full">{formatDateLabel(message.createdAt)}</span>
                    </div>
                  )}

                  <div className={`flex px-3 ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-2xl overflow-hidden whitespace-pre-wrap break-words ${
                      message.senderId === user.id
                        ? 'bg-vibe-blue text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}>
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
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
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
                </div>
              )
            })}

            <div ref={messagesEndRef} />
          </div>

          {/* Campo de Entrada */}
          <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0 z-30 pb-safe">
            <div className="flex items-end space-x-2">
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
