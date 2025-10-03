import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Search, Send, Mic, MicOff, MoreVertical, Trash2, Archive, Image as ImageIcon, Video as VideoIcon, Check, CheckCheck, Loader2, Pause, Play, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LiveWaveform, PlaybackWaveform } from '../components/AudioWaveform';
import { useAuth } from '../contexts/AuthContext';
import { api, uploadsAPI, usersAPI } from '../services/api';
import { seedDemoConversations, getDemoConversations, demoUsers } from '../mocks/demoData';
import useWebSocket from '../hooks/useWebSocket';
import useViewportHeight from '../hooks/useViewportHeight';
import CallAttentionButton from '../components/CallAttentionButton';

const deriveStatus = (m) => {
  if (m.status) return m.status
  if (m.isRead || m.readAt) return 'read'
  if (m.isDelivered || m.deliveredAt) return 'delivered'
  return 'sent'
}

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
      return <CheckCheck className="inline-block ml-1 text-vibe-blue" size={14} />
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

const MOCK_AUDIO_SEND = import.meta.env.VITE_MOCK_AUDIO_SEND === 'true'

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
  const [isPaused, setIsPaused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [imageInputKey, setImageInputKey] = useState(0)
  const [videoInputKey, setVideoInputKey] = useState(0)
  const [showRecorder, setShowRecorder] = useState(false)
  const [pendingAudioBlob, setPendingAudioBlob] = useState(null)
  const [pendingPeaks, setPendingPeaks] = useState(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [isShaking, setIsShaking] = useState(false)

  // Pagination state for messages
  const [messagesPage, setMessagesPage] = useState(1);
  const [messagesLimit] = useState(25); // load more messages per page for better density
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const messagesEndRef = useRef(null);
  const msgListRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const typingTimeoutRef = useRef(null);
  const typingTimersRef = useRef({});
  const recIntervalRef = useRef(null);
  const ignoreOnStopRef = useRef(false);
  const sendOnStopRef = useRef(false);
  const mediaStreamRef = useRef(null);
  const elapsedOffsetRef = useRef(0);
  const elapsedStartRef = useRef(0);
  const textareaRef = useRef(null);
  // waveform capture during recording
  const recAudioCtxRef = useRef(null);
  const recAnalyserRef = useRef(null);
  const recSourceRef = useRef(null);
  const recDataRef = useRef(null);
  const recWaveTimerRef = useRef(null);
  const recPeaksRef = useRef([]);

  const autoResizeTextarea = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const maxHeight = 180; // limit to reasonable height
    ta.style.height = Math.min(ta.scrollHeight, maxHeight) + 'px';
  }

  const formatElapsed = (ms) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const m = String(Math.floor(total / 60)).padStart(2, '0');
    const s = String(total % 60).padStart(2, '0');
    return `${m}:${s}`;
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
      // Seed once if empty
      try {
        const existing = loadDemoConvs();
        if (!existing || existing.length === 0) seedDemoConversations();
      } catch(e) {}
      const convs = getDemoConversations();
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
    // Demo-only progression: sending -> sent (do not auto mark delivered/read)
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'sent' } : m))
    }, 300)

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

    let appended = null
    try {
      const res = await api.post('/messages/send', {
        receiverId: selectedConversation.otherUser.id,
        content: messageText,
        messageType: 'text'
      });
      const msg = res?.data?.data
      if (msg) {
        appended = { ...msg }
        setMessages(prev => [...prev, appended]);
        updateConversationsFromMessages(selectedConversation.otherUser.id, [...messages, appended])
        setTimeout(scrollToBottom, 80)
      }
    } catch (error) {
      console.warn('Falha no envio via backend, usando fallback demo')
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
      appended = tempMsg
      setMessages(prev => [...prev, tempMsg]);
      updateConversationsFromMessages(selectedConversation.otherUser.id, [...messages, tempMsg])
      scheduleStatusProgress(tempMsg, selectedConversation.otherUser.id)
      setTimeout(scrollToBottom, 80)
    }

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

  // Iniciar gravação de áudio com UI estilo mobile
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setIsPaused(false);

      const candidates = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm', 'audio/ogg'];
      let mimeType = '';
      if (window.MediaRecorder && typeof MediaRecorder.isTypeSupported === 'function') {
        for (const c of candidates) {
          if (MediaRecorder.isTypeSupported(c)) { mimeType = c; break; }
        }
      }

      try {
        mediaRecorderRef.current = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      } catch (err) {
        mediaRecorderRef.current = new MediaRecorder(stream);
      }

      // setup waveform capture
      try {
        recAudioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        recAnalyserRef.current = recAudioCtxRef.current.createAnalyser();
        recAnalyserRef.current.fftSize = 1024;
        recSourceRef.current = recAudioCtxRef.current.createMediaStreamSource(stream);
        recSourceRef.current.connect(recAnalyserRef.current);
        recDataRef.current = new Uint8Array(recAnalyserRef.current.frequencyBinCount);
        recPeaksRef.current = [];
        if (recWaveTimerRef.current) clearInterval(recWaveTimerRef.current);
        recWaveTimerRef.current = setInterval(() => {
          if (!recAnalyserRef.current || !recDataRef.current) return;
          recAnalyserRef.current.getByteTimeDomainData(recDataRef.current);
          let min = 255, max = 0;
          for (let i = 0; i < recDataRef.current.length; i++) {
            const v = recDataRef.current[i];
            if (v < min) min = v;
            if (v > max) max = v;
          }
          const peak = Math.min(1, Math.max(0, (max - min) / 255));
          recPeaksRef.current.push(peak);
        }, 50);
      } catch(e) { }

      audioChunksRef.current = [];
      ignoreOnStopRef.current = false;
      setPendingAudioBlob(null);
      setPendingPeaks(null);
      setElapsedMs(0);
      if (recIntervalRef.current) clearInterval(recIntervalRef.current);
      elapsedOffsetRef.current = 0;
      elapsedStartRef.current = Date.now();
      recIntervalRef.current = setInterval(() => setElapsedMs(elapsedOffsetRef.current + (Date.now() - elapsedStartRef.current)), 200);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const tracks = mediaStreamRef.current?.getTracks?.() || [];
        tracks.forEach(track => track.stop());
        if (recIntervalRef.current) { clearInterval(recIntervalRef.current); recIntervalRef.current = null; }
        if (recWaveTimerRef.current) { clearInterval(recWaveTimerRef.current); recWaveTimerRef.current = null; }
        try { recSourceRef.current && recSourceRef.current.disconnect(); } catch(e) {}
        try { recAnalyserRef.current && recAnalyserRef.current.disconnect(); } catch(e) {}
        try { recAudioCtxRef.current && recAudioCtxRef.current.close(); } catch(e) {}
        const peaksSnapshot = (recPeaksRef.current || []).slice();
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current?.mimeType || 'audio/ogg' });
        if (ignoreOnStopRef.current) {
          ignoreOnStopRef.current = false;
          audioChunksRef.current = [];
          setElapsedMs(0);
          setIsRecording(false);
          setShowRecorder(false);
          setPendingAudioBlob(null);
          setPendingPeaks(null);
          return;
        }
        if (sendOnStopRef.current) {
          sendOnStopRef.current = false;
          setIsRecording(false);
          setIsPaused(false);
          setShowRecorder(false);
          setPendingAudioBlob(null);
          setPendingPeaks(null);
          await sendAudioMessage(audioBlob, peaksSnapshot);
          return;
        }
        setPendingAudioBlob(audioBlob);
        setPendingPeaks(peaksSnapshot);
        setIsRecording(false);
        setIsPaused(false);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      // Do not force permission; simply stop recorder UI and allow user to retry later.
      setShowRecorder(false);
    }
  };

  const stopRecordingAndSend = () => {
    if (mediaRecorderRef.current && isRecording) {
      sendOnStopRef.current = true;
      try { if (mediaRecorderRef.current.state === 'paused' && mediaRecorderRef.current.resume) mediaRecorderRef.current.resume(); } catch(e){}
      mediaRecorderRef.current.stop();
    }
  };


  const pauseRecording = () => {
    if (!mediaRecorderRef.current) return;
    try {
      if (mediaRecorderRef.current.state === 'recording' && mediaRecorderRef.current.pause) {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        if (recIntervalRef.current) { clearInterval(recIntervalRef.current); recIntervalRef.current = null; }
        if (recWaveTimerRef.current) { clearInterval(recWaveTimerRef.current); recWaveTimerRef.current = null; }
        if (elapsedStartRef.current) {
          elapsedOffsetRef.current += (Date.now() - elapsedStartRef.current);
        }
      }
    } catch(e) {}
  };

  const resumeRecording = () => {
    if (!mediaRecorderRef.current) return;
    try {
      if (mediaRecorderRef.current.state === 'paused' && mediaRecorderRef.current.resume) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        elapsedStartRef.current = Date.now();
        if (recIntervalRef.current) clearInterval(recIntervalRef.current);
        recIntervalRef.current = setInterval(() => setElapsedMs(elapsedOffsetRef.current + (Date.now() - elapsedStartRef.current)), 200);
        if (recWaveTimerRef.current) clearInterval(recWaveTimerRef.current);
        recWaveTimerRef.current = setInterval(() => {
          if (!recAnalyserRef.current || !recDataRef.current) return;
          recAnalyserRef.current.getByteTimeDomainData(recDataRef.current);
          let min = 255, max = 0;
          for (let i = 0; i < recDataRef.current.length; i++) {
            const v = recDataRef.current[i];
            if (v < min) min = v;
            if (v > max) max = v;
          }
          const peak = Math.min(1, Math.max(0, (max - min) / 255));
          recPeaksRef.current.push(peak);
        }, 50);
      }
    } catch(e) {}
  };

  const cancelRecording = () => {
    if (isRecording && mediaRecorderRef.current) {
      ignoreOnStopRef.current = true;
      try { if (mediaRecorderRef.current.state === 'paused' && mediaRecorderRef.current.resume) mediaRecorderRef.current.resume(); } catch(e){}
      mediaRecorderRef.current.stop();
    } else {
      setPendingAudioBlob(null);
      setPendingPeaks(null);
      setShowRecorder(false);
      setElapsedMs(0);
      setIsPaused(false);
      if (recWaveTimerRef.current) { clearInterval(recWaveTimerRef.current); recWaveTimerRef.current = null; }
      try { recSourceRef.current && recSourceRef.current.disconnect(); } catch(e) {}
      try { recAnalyserRef.current && recAnalyserRef.current.disconnect(); } catch(e) {}
      try { recAudioCtxRef.current && recAudioCtxRef.current.close(); } catch(e) {}
    }
  };

  const sendPendingAudio = async () => {
    const blob = pendingAudioBlob;
    if (!blob) return;
    setPendingAudioBlob(null);
    const peaks = (pendingPeaks || []).slice();
    setPendingPeaks(null);
    setShowRecorder(false);
    await sendAudioMessage(blob, peaks);
  };

  // Enviar mensagem de áudio
  const sendAudioMessage = async (audioBlob, peaks) => {
    if (!selectedConversation) return;

    // Mock path only for audio send when enabled
    if (MOCK_AUDIO_SEND) {
      const url = URL.createObjectURL(audioBlob)
      const tempMsg = {
        id: Date.now(),
        senderId: user.id,
        receiverId: selectedConversation.otherUser.id,
        content: '',
        messageType: 'audio',
        mediaUrl: url,
        waveformPeaks: Array.isArray(peaks) ? peaks : undefined,
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
      return
    }

    const formData = new FormData();
    formData.append('receiver_id', selectedConversation.otherUser.id);

    // Ensure proper filename and type
    const mime = audioBlob.type || 'audio/ogg';
    const ext = mime.split('/')[1].split(';')[0] || 'ogg';
    const file = new File([audioBlob], `audio.${ext}`, { type: mime });
    formData.append('audio_file', file);
    try { if (Array.isArray(peaks)) formData.append('waveform', JSON.stringify(peaks)); } catch(e){}

    try {
      const res = await api.post('/messages/upload-audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const created = res.data?.data || res.data?.message || null;

      if (created && res.data?.data) {
        const msg = res.data.data;
        setMessages(prev => [...prev, msg]);
        updateConversationsFromMessages(selectedConversation.otherUser.id, [...messages, msg])
        setTimeout(scrollToBottom, 100)
        return
      }
    } catch (error) {
      console.warn('Sem backend para enviar áudio, usando modo demo', error)
      // If backend fails unexpectedly and mock is off, still show local preview
      const url = URL.createObjectURL(audioBlob)
      const tempMsg = {
        id: Date.now(),
        senderId: user.id,
        receiverId: selectedConversation.otherUser.id,
        content: '',
        messageType: 'audio',
        mediaUrl: url,
        waveformPeaks: Array.isArray(peaks) ? peaks : undefined,
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
    }
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

      // Se �� uma mensagem da conversa atual, adicionar à lista
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

    if (lastMessage.type === 'message_delivered') {
      const { messageId, receiverId, deliveredAt } = lastMessage.data || {}
      if (messageId) {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isDelivered: true, deliveredAt, status: 'delivered' } : m))
        setConversations(prev => prev.map(c => {
          if (c.otherUser?.id === receiverId && c.lastMessage?.id === messageId) {
            return { ...c, lastMessage: { ...c.lastMessage, isDelivered: true, deliveredAt, status: 'delivered' } }
          }
          return c
        }))
      }
    }

    if (lastMessage.type === 'messages_read') {
      const ids = lastMessage.data?.messageIds || []
      const readAt = lastMessage.data?.readAt
      if (ids.length) {
        setMessages(prev => prev.map(m => ids.includes(m.id) ? { ...m, isRead: true, readAt, status: 'read' } : m))
        setConversations(prev => prev.map(c => {
          if (c.lastMessage && ids.includes(c.lastMessage.id)) {
            return { ...c, lastMessage: { ...c.lastMessage, isRead: true, readAt, status: 'read' } }
          }
          return c
        }))
      }
      // Conversas podem mudar ordenação
      loadConversations();
    }

    if (lastMessage.type === 'user_typing') {
      const { senderId, isTyping } = lastMessage.data;

      // Mostrar imediatamente quando receber "true"
      if (isTyping) {
        setTypingUsers(prev => ({ ...prev, [senderId]: true }));
        // Adia ocultar até não receber mais "true" por um período
        if (typingTimersRef.current[senderId]) clearTimeout(typingTimersRef.current[senderId]);
        typingTimersRef.current[senderId] = setTimeout(() => {
          setTypingUsers(prev => ({ ...prev, [senderId]: false }));
          typingTimersRef.current[senderId] = null;
        }, 4000);
      } else {
        // Suaviza transição para evitar "piscar"
        if (typingTimersRef.current[senderId]) clearTimeout(typingTimersRef.current[senderId]);
        typingTimersRef.current[senderId] = setTimeout(() => {
          setTypingUsers(prev => ({ ...prev, [senderId]: false }));
          typingTimersRef.current[senderId] = null;
        }, 700);
      }
    }

    // Chamar atenção: abrir conversa e animar/vibrar no dispositivo do destinatário
    if (lastMessage.type === 'call_attention') {
      const { senderId, receiverId } = lastMessage.data || {};
      if (!senderId) return;

      // Accept event when receiverId absent (server may send only senderId) or explicitly targeted
      if (!receiverId || receiverId === user?.id) {
        (async () => {
          try {
            const res = await usersAPI.getUserById(senderId);
            const other = res.data;
            if (other && other.id) {
              const conv = { id: other.id, otherUser: other, lastMessage: null, unreadCount: 0 };
              setSelectedConversation(conv);
              setConversations(prev => {
                const exists = (prev || []).some(c => c.otherUser && c.otherUser.id === other.id)
                return exists ? prev : [conv, ...(prev || [])]
              });

              await loadMessages(other.id, 1);
              try { window.history.pushState({ openedConversation: other.id }, ''); } catch(e){}
              try { navigate(`/messages?user=${encodeURIComponent(other.username||'')}&userId=${other.id}`); } catch(e){}
            }
          } catch (e) {
            console.warn('Erro ao abrir conversa por call_attention', e);
          }

          // Vibrar por no máximo 2000ms com padrão forte e tocar som
          try { if (navigator.vibrate) navigator.vibrate([400,120,400,120,400,120,400]); } catch(e){}
          try { const mod = await import('../utils/notificationSound'); mod.playNotification(); } catch(e){}

          setIsShaking(true);
          setTimeout(() => setIsShaking(false), 2000);
        })();
      }
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

        if (userIdParam) {
          const uid = Number(userIdParam);
          if (!Number.isNaN(uid)) {
            try {
              const res = await api.get(`/users/${uid}`);
              const other = res.data;
              const conv = { id: other.id, otherUser: other, lastMessage: null, unreadCount: 0 };
              setSelectedConversation(conv);
              setConversations(prev => {
                const exists = (prev || []).some(c => c.otherUser && c.otherUser.id === other.id)
                return exists ? prev : [conv, ...(prev || [])]
              })
              await loadMessages(other.id, 1);
              try { window.history.pushState({ openedConversation: other.id }, ''); } catch(e){}
            } catch (e) {
              console.warn('Usuário não encontrado por id:', uid, e);
              const other = demoUsers.find(u => u.id === uid)
              if (other) {
                const conv = { id: other.id, otherUser: other, lastMessage: null, unreadCount: 0 };
                setSelectedConversation(conv);
                setConversations(prev => {
                  const exists = (prev || []).some(c => c.otherUser && c.otherUser.id === other.id)
                  return exists ? prev : [conv, ...(prev || [])]
                })
                await loadMessages(other.id, 1);
                try { window.history.pushState({ openedConversation: other.id }, ''); } catch(e){}
              }
            }
          }
        } else if (username) {
          try {
            const res = await api.get(`/users/by-username/${username}`);
            const other = res.data;
            if (other && other.id) {
              const conv = { id: other.id, otherUser: other, lastMessage: null, unreadCount: 0 };
              setSelectedConversation(conv);
              setConversations(prev => {
                const exists = (prev || []).some(c => c.otherUser && (c.otherUser.id === other.id || c.otherUser.username === other.username))
                return exists ? prev : [conv, ...(prev || [])]
              })
              await loadMessages(other.id, 1);
              try { window.history.pushState({ openedConversation: other.id }, ''); } catch(e){}
            }
          } catch (e) {
            console.warn('Usuário não encontrado por username:', username, e);
            const other = demoUsers.find(u => (u.username || '').toLowerCase() === (username||'').toLowerCase())
            if (other) {
              const conv = { id: other.id, otherUser: other, lastMessage: null, unreadCount: 0 };
              setSelectedConversation(conv);
              setConversations(prev => {
                const exists = (prev || []).some(c => c.otherUser && (c.otherUser.id === other.id || c.otherUser.username === other.username))
                return exists ? prev : [conv, ...(prev || [])]
              })
              await loadMessages(other.id, 1);
              try { window.history.pushState({ openedConversation: other.id }, ''); } catch(e){}
            }
          }
        }
      } catch (err) {
        console.warn('Erro ao processar params de mensagens:', err);
      }
    };

    init();

    const onPop = (e) => {
      // Always close any opened conversation on popstate to avoid re-triggering init
      setSelectedConversation(null);
      try { window.history.pushState({}, ''); } catch(err){}
    }

    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [location, authUser, authLoading]);


  // Scroll quando mensagens mudarem
  useEffect(() => {
    if (isShaking) return;
    const c = msgListRef.current;
    if (!c) return;
    const distanceFromBottom = c.scrollHeight - c.scrollTop - c.clientHeight;
    if (distanceFromBottom < 140) {
      scrollToBottom();
    }
  }, [messages, isShaking]);

  useEffect(() => {
    if (!selectedConversation) return;
    const handleViewportResize = () => {
      setTimeout(() => {
        if (isShaking) return;
        scrollToBottom();
      }, 30);
    };

    handleViewportResize();

    const viewport = typeof window !== 'undefined' ? window.visualViewport : null;
    viewport?.addEventListener('resize', handleViewportResize);

    return () => {
      viewport?.removeEventListener('resize', handleViewportResize);
    };
  }, [selectedConversation, isShaking]);

  // Limpar timeout ao desmontar
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      const timers = typingTimersRef.current || {};
      Object.values(timers).forEach(t => t && clearTimeout(t));
      typingTimersRef.current = {};
      if (recIntervalRef.current) clearInterval(recIntervalRef.current);
      if (recWaveTimerRef.current) clearInterval(recWaveTimerRef.current);
      try { recSourceRef.current && recSourceRef.current.disconnect(); } catch(e) {}
      try { recAnalyserRef.current && recAnalyserRef.current.disconnect(); } catch(e) {}
      try { recAudioCtxRef.current && recAudioCtxRef.current.close(); } catch(e) {}
      const tracks = mediaStreamRef.current?.getTracks?.() || [];
      tracks.forEach(t => t.stop());
    };
  }, []);

  const [conversationsFilter, setConversationsFilter] = useState('all'); // 'all' | 'unread'
  const viewportHeight = useViewportHeight();
  const [keyboardInset, setKeyboardInset] = useState(0);
  const inputRef = useRef(null);
  const [inputHeight, setInputHeight] = useState(0);
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateInset = () => {
      const { visualViewport } = window;
      if (visualViewport && typeof visualViewport.height === 'number') {
        const offsetTop = visualViewport.offsetTop || 0;
        const inset = Math.max(0, window.innerHeight - (visualViewport.height + offsetTop));
        setKeyboardInset(inset);

        // Keep header fixed inside the visual viewport when keyboard opens
        try {
          if (headerRef && headerRef.current) {
            headerRef.current.style.top = `${offsetTop}px`;
          }
        } catch(e) {}

      } else {
        setKeyboardInset(0);
        try { if (headerRef && headerRef.current) headerRef.current.style.top = '0px' } catch(e) {}
      }
    };

    updateInset();
    window.addEventListener('resize', updateInset);
    window.addEventListener('orientationchange', updateInset);
    const { visualViewport } = window;
    visualViewport?.addEventListener('resize', updateInset);
    visualViewport?.addEventListener('scroll', updateInset);

    return () => {
      window.removeEventListener('resize', updateInset);
      window.removeEventListener('orientationchange', updateInset);
      visualViewport?.removeEventListener('resize', updateInset);
      visualViewport?.removeEventListener('scroll', updateInset);
    };
  }, []);

  // measure input bar height and react to changes
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const update = () => setInputHeight(el.offsetHeight || el.clientHeight || 0);
    update();
    let ro;
    try {
      ro = new ResizeObserver(update);
      ro.observe(el);
    } catch (e) {}
    return () => { try { ro && ro.disconnect(); } catch(e) {} };
  }, [showRecorder, isRecording]);

  // measure header height so message list can be padded and header stays fixed
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => setHeaderHeight(el.offsetHeight || el.clientHeight || 0);
    update();
    let ro;
    try {
      ro = new ResizeObserver(update);
      ro.observe(el);
    } catch(e) {}
    return () => { try { ro && ro.disconnect(); } catch(e) {} };
  }, [selectedConversation]);

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
    <div className={`flex flex-1 min-h-0 bg-white ${selectedConversation ? 'pb-0 fixed inset-0 z-40 bg-white' : 'pb-20 md:pb-0'}`}>
      <style>{`@keyframes callAttentionShake { 0% { transform: translate(0,0) rotate(0deg); } 10% { transform: translate(-24px,-6px) rotate(-18deg); } 20% { transform: translate(24px,6px) rotate(18deg); } 30% { transform: translate(-20px,-4px) rotate(-12deg); } 40% { transform: translate(20px,4px) rotate(12deg); } 50% { transform: translate(-16px,-3px) rotate(-8deg); } 60% { transform: translate(16px,3px) rotate(8deg); } 70% { transform: translate(-8px,-2px) rotate(-4deg); } 80% { transform: translate(8px,2px) rotate(4deg); } 90% { transform: translate(-4px,0px) rotate(-2deg); } 100% { transform: translate(0,0) rotate(0deg); } } .call-attention-shake { animation: callAttentionShake 200ms linear infinite; transform-origin: center; will-change: transform; }`}</style>
      {/* Lista de Conversas */}
      <div className={`w-full md:w-1/3 border-r border-gray-200 ${selectedConversation ? 'hidden' : ''} flex flex-col min-h-0`}>
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                <img src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.firstName||'U')}&background=2563eb&color=fff`} alt="Você" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mensagens</h1>
                <p className="text-sm text-gray-500">Converse com seus amigos e mantenha o fluxo</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button onClick={() => setConversationsFilter('all')} className={`px-3 py-2 rounded-lg ${conversationsFilter === 'all' ? 'bg-vibe-blue text-white' : 'bg-white text-gray-700 border border-gray-200'}`}>Todas</button>
              <button onClick={() => setConversationsFilter('unread')} className={`px-3 py-2 rounded-lg ${conversationsFilter === 'unread' ? 'bg-vibe-blue text-white' : 'bg-white text-gray-700 border border-gray-200'}`}>Não lidas</button>
              <button onClick={() => { /* TODO: open new message composer */ }} className="ml-2 bg-vibe-blue text-white rounded-lg p-2 hover:bg-vibe-blue-dark">
                <Send size={18} />
              </button>
            </div>
          </div>

          <div className="relative mt-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vibe-blue focus:border-transparent bg-white"
            />
          </div>
        </div>

        <div ref={convListRef} onScroll={handleConversationsScroll} className="flex-1 overflow-y-auto min-h-0">
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
                <img src={conversation.otherUser.avatar_url || conversation.otherUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent((conversation.otherUser.firstName||conversation.otherUser.displayName||conversation.otherUser.username||'U'))}&background=2563eb&color=fff`} alt={`${conversation.otherUser.firstName||''} ${conversation.otherUser.lastName||''}`} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 pr-4">
                      <h3 className={`${conversation.unreadCount > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'} truncate`}>
                        {conversation.otherUser.firstName} {conversation.otherUser.lastName}
                      </h3>
                      <div className="mt-1 min-h-[20px]">
                        {typingUsers[conversation.otherUser.id] ? (
                          <p className="text-sm text-vibe-blue"><TypingDots /></p>
                        ) : conversation.lastMessage ? (
                          <p className={`${conversation.unreadCount > 0 ? 'text-gray-800' : 'text-gray-500'} text-sm truncate`}>
                            {conversation.lastMessage.messageType === 'audio'
                              ? '🎵 Mensagem de áudio'
                              : conversation.lastMessage.messageType === 'image' ? '🖼️ Foto' : conversation.lastMessage.messageType === 'video' ? '🎬 Vídeo' : conversation.lastMessage.content
                            }
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-col items-end ml-3 flex-shrink-0">
                      {conversation.lastMessage && (
                        <span className="text-xs text-gray-500 flex items-center">
                          {new Date(conversation.lastMessage.createdAt).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {conversation.lastMessage.senderId === (user?.id) && (
                            <span className="ml-1 inline-block">
                              {statusIcon(deriveStatus(conversation.lastMessage), conversation.lastMessage?.senderId === user.id)}
                            </span>
                          )}
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
        <div className={`flex-1 flex flex-col ${isShaking ? 'call-attention-shake' : ''}`} role="region">
          {/* Header da Conversa (modal) */}
          <div ref={headerRef} className="p-4 border-b border-gray-200 bg-white fixed left-0 right-0 z-60 shadow-sm" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
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

              <img src={selectedConversation.otherUser.avatar_url || selectedConversation.otherUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent((selectedConversation.otherUser.firstName||selectedConversation.otherUser.displayName||selectedConversation.otherUser.username||'U'))}&background=2563eb&color=fff`} alt={`${selectedConversation.otherUser.firstName||''} ${selectedConversation.otherUser.lastName||''}`} className="w-10 h-10 rounded-full object-cover" />

              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  <button onClick={() => {
                    const u = selectedConversation.otherUser || {};
                    const pub = u.publicProfileId || u.public_profile_id;
                    if (pub) navigate(`/profile/id/${pub}`);
                    else if (u.id) navigate(`/profile/id/${u.id}`);
                  }} className="text-left w-full text-inherit hover:underline">
                    {selectedConversation.otherUser.firstName} {selectedConversation.otherUser.lastName}
                  </button>
                </h3>
                <div className="h-5 mt-1">
                  {typingUsers[selectedConversation.otherUser.id] && <TypingDots />}
                </div>
              </div>

              <CallAttentionButton receiverId={selectedConversation?.otherUser?.id} />
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>

          {/* Lista de Mensagens */}
          <div
            className="flex-1 overflow-y-auto p-4 min-h-0 overscroll-contain"
            ref={msgListRef}
            onScroll={handleScroll}
            style={{ paddingBottom: `${(keyboardInset || 0) + (inputHeight || 0) + 12}px`, paddingTop: headerHeight ? `${headerHeight + 12}px` : undefined }}
          >
            {loadingOlder && (
              <div className="flex justify-center py-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-vibe-blue"></div>
              </div>
            )}

            <div className="flex flex-col gap-4 min-h-full justify-end">
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
                      <div
                        className={`${
                          message.messageType === 'audio'
                            ? 'w-[78%] sm:w-[70%] max-w-full px-3 py-1 rounded-full'
                            : 'max-w-xs lg:max-w-md px-3 py-2 rounded-2xl'
                        } overflow-hidden whitespace-pre-wrap break-words ${
                          message.senderId === user.id
                            ? 'bg-vibe-blue text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        {message.messageType === 'audio' ? (
                          <PlaybackWaveform
                            variant="bubble"
                            src={message.mediaUrl}
                            peaks={message.waveformPeaks}
                            height={24}
                            color={message.senderId === user.id ? '#ffffff' : '#2563eb'}
                            playBg={message.senderId === user.id ? '#1d4ed8' : '#2563eb'}
                            bg="transparent"
                          />
                        ) : message.messageType === 'image' ? (
                          <img src={message.mediaUrl} alt="imagem" className="max-w-[240px] rounded-lg" />
                        ) : message.messageType === 'video' ? (
                          <video src={message.mediaUrl} controls className="max-w-[240px] rounded-lg" />
                        ) : (
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        )}

                        <div
                          className={`text-xs mt-1 flex items-center ${
                            message.senderId === user.id ? 'text-white/80' : 'text-gray-500'
                          }`}
                        >
                          {new Date(message.createdAt).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {statusIcon(deriveStatus(message), message.senderId === user.id)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Campo de Entrada */}
          <div ref={inputRef} className="p-4 border-t border-gray-200 bg-white sticky bottom-0 z-50 w-full pb-safe shadow-sm" style={keyboardInset ? { bottom: `${keyboardInset}px` } : undefined}>
            { (showRecorder || isRecording || pendingAudioBlob) ? (
              <div className="flex flex-col gap-3">
                {pendingAudioBlob ? (
                  <>
                    <PlaybackWaveform src={URL.createObjectURL(pendingAudioBlob)} peaks={pendingPeaks} height={36} color="#2563eb" bg="#e5e7eb" />
                    <div className="flex w-full gap-2">
                      <button onClick={sendPendingAudio} className="flex-1 bg-vibe-blue text-white px-4 py-2 rounded-lg">Enviar</button>
                      <button onClick={cancelRecording} className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg">Descartar</button>
                    </div>
                  </>
                ) : isRecording ? (
                  <div className="flex items-center gap-3 w-full">
                    <button
                      onClick={cancelRecording}
                      className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                      aria-label="Descartar gravação"
                    >
                      <Trash2 size={18} />
                    </button>

                    <div className="relative flex-1 min-w-0 bg-white border border-gray-200 rounded-full px-3 py-2 shadow-sm">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                      <div className="pl-5 pr-16">
                        {mediaStreamRef.current && (
                          <LiveWaveform stream={mediaStreamRef.current} height={28} color="#9ca3af" bg="#ffffff" />
                        )}
                      </div>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-700 tabular-nums">
                        {formatElapsed(elapsedMs)}
                      </div>
                    </div>

                    <button
                      onClick={isPaused ? resumeRecording : pauseRecording}
                      className={`p-3 rounded-full ${isPaused ? 'bg-green-500 text-white' : 'bg-red-500 text-white'} hover:opacity-90`}
                      aria-label={isPaused ? 'Retomar gravação' : 'Pausar gravação'}
                    >
                      {isPaused ? <Play size={18} /> : <Pause size={18} />}
                    </button>

                    <button
                      onClick={stopRecordingAndSend}
                      className="p-3 rounded-full bg-vibe-blue text-white hover:bg-vibe-blue-dark"
                      aria-label="Enviar áudio"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex items-end space-x-2">
                <label className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg cursor-pointer flex-shrink-0">
                  <ImageIcon size={20} />
                  <input key={imageInputKey} type="file" accept="image/*" className="hidden" onChange={(e)=>{const f=e.target.files?.[0]; if(f) sendImage(f)}} />
                </label>
                <label className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg cursor-pointer flex-shrink-0">
                  <VideoIcon size={20} />
                  <input key={videoInputKey} type="file" accept="video/mp4" className="hidden" onChange={(e)=>{const f=e.target.files?.[0]; if(f) sendVideo(f)}} />
                </label>

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
                  onFocus={() => setTimeout(scrollToBottom, 30)}
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
                  onClick={startRecording}
                  className="hidden md:inline-flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-lg flex-shrink-0"
                >
                  <Mic size={20} />
                  <span>Gravar áudio</span>
                </button>
                <button
                  onClick={startRecording}
                  className="md:hidden p-2 rounded-lg flex-shrink-0 bg-gray-100 text-gray-700 hover:bg-gray-200"
                  aria-label="Gravar áudio"
                >
                  <Mic size={20} />
                </button>

                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-vibe-blue text-white p-2 rounded-lg hover:bg-vibe-blue-dark disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={20} />
                </button>
              </div>
            )}
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
