import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { notificationRelatedEventTypes } from '../utils/notifications';

const normalizeEventType = (type) => {
  if (!type) {
    return 'unknown';
  }
  if (notificationRelatedEventTypes.has(type)) {
    return 'notification';
  }
  if (type === 'new_message') {
    return 'message';
  }
  if (type === 'message_delivered' || type === 'messages_read') {
    return 'message_status';
  }
  if (type === 'user_typing' || type === 'typing') {
    return 'typing';
  }
  if (type === 'ping') {
    return 'ping';
  }
  return type;
};

export const useWebSocket = () => {
  const { token } = useAuth();
  const wsRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const pingIntervalRef = useRef(null);

  const connect = useCallback(() => {
    if (!token) return;

    // Reuse global connection if available
    try {
      const g = typeof window !== 'undefined' ? window.__vibeWS : null
      if (g && (g.readyState === WebSocket.OPEN || g.readyState === WebSocket.CONNECTING)) {
        wsRef.current = g
        setIsConnected(g.readyState === WebSocket.OPEN)
        return
      }
    } catch(_) {}

    try {
      const getWsUrl = () => {
        const hostname = window.location.hostname
        const isDev = import.meta.env.DEV
        const isHttps = window.location.protocol === 'https:'
        const scheme = isHttps ? 'wss' : 'ws'
        if (import.meta.env.VITE_WS_URL) {
          return `${import.meta.env.VITE_WS_URL}?token=${token}`
        }
        if (isDev && (hostname === 'localhost' || hostname === '127.0.0.1')) {
          return `${scheme}://localhost:3010/ws?token=${token}`
        }
        if (hostname.startsWith('192.168.') || hostname.startsWith('10.0.')) {
          return `${scheme}://${hostname}:3010/ws?token=${token}`
        }
        return `${scheme}://${hostname}/ws?token=${token}`
      }
      const wsUrl = getWsUrl();
      console.log('🔌 Conectando WebSocket...', wsUrl);

      // Mark as connecting globally to avoid duplicates
      try { if (typeof window !== 'undefined') window.__vibeWSConnecting = true } catch(_){}
      wsRef.current = new WebSocket(wsUrl);
      try { if (typeof window !== 'undefined') window.__vibeWS = wsRef.current } catch(_){}

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket conectado!');
        try { if (typeof window !== 'undefined') window.__vibeWSConnecting = false } catch(_){}
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        
        // Iniciar ping para manter conexão viva
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping', data: {} }));
          }
        }, 25000); // Ping a cada 25 segundos
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const normalizedType = normalizeEventType(message.type);
          const enhancedMessage = { ...message, normalizedType };
          console.log('📨 Mensagem WebSocket recebida:', enhancedMessage);
          setLastMessage(enhancedMessage);
          try { window.dispatchEvent(new CustomEvent('vibe:ws:message', { detail: enhancedMessage })) } catch(_){}

          // If friendship update, notify other parts of the app to refresh friends lists
          try {
            if (message.type === 'friendship_update' || message.normalizedType === 'friendship_update') {
              window.dispatchEvent(new CustomEvent('vibe:friends:changed', { detail: message }))
            }

            // Also handle notification-wrapped friend events (friend_request, friend_accepted)
            if (message.type === 'notification' && message.data && (message.data.type === 'friend_request' || message.data.type === 'friend_accepted')) {
              try { window.dispatchEvent(new CustomEvent('vibe:friends:changed', { detail: message })) } catch(e){}
            }
          } catch(e) {}

          // Responder pings automaticamente
          if (normalizedType === 'ping') {
            wsRef.current.send(JSON.stringify({ type: 'pong', data: {} }));
          }
        } catch (error) {
          console.error('❌ Erro ao processar mensagem WebSocket:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket desconectado:', event.code, event.reason);
        setIsConnected(false);
        try { if (typeof window !== 'undefined') window.__vibeWSConnecting = false } catch(_){}

        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Tentar reconectar se não foi uma desconexão intencional
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`🔄 Tentativa de reconexão ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts} em ${delay}ms`);

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ Erro WebSocket:', error);
      };

    } catch (error) {
      console.error('❌ Erro ao criar WebSocket:', error);
    }
  }, [token]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    try {
      if (typeof window !== 'undefined') {
        window.__vibeWSUsers = Math.max(0, (window.__vibeWSUsers || 1) - 1)
        if (window.__vibeWSUsers > 0) {
          // other listeners still active; don't close shared WS
          return
        }
      }
    } catch(_) {}

    if (wsRef.current) {
      try { wsRef.current.close(1000, 'Desconexão intencional'); } catch(_){}
      wsRef.current = null;
      try { if (typeof window !== 'undefined') window.__vibeWS = null } catch(_){ }
    }

    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    console.warn('⚠️ WebSocket não conectado, não foi possível enviar mensagem');
    return false;
  }, []);

  // Conectar quando o hook for montado e tivermos token
  useEffect(() => {
    if (token) {
      try { if (typeof window !== 'undefined') window.__vibeWSUsers = (window.__vibeWSUsers || 0) + 1 } catch(_){}
      connect();
    }

    const onGlobal = (e) => {
      setLastMessage(e.detail)
    }
    try { window.addEventListener('vibe:ws:message', onGlobal) } catch(_){}

    return () => {
      try { window.removeEventListener('vibe:ws:message', onGlobal) } catch(_){}
      disconnect();
    };
  }, [token, connect, disconnect]);

  // Limpar timers quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, []);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    connect,
    disconnect
  };
};

export default useWebSocket;
