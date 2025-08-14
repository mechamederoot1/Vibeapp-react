import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

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
    if (!token || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const wsUrl = `ws://localhost:8000/ws?token=${token}`;
      console.log('🔌 Conectando WebSocket...', wsUrl);
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket conectado!');
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
          console.log('📨 Mensagem WebSocket recebida:', message);
          setLastMessage(message);

          // Responder pings automaticamente
          if (message.type === 'ping') {
            wsRef.current.send(JSON.stringify({ type: 'pong', data: {} }));
          }
        } catch (error) {
          console.error('❌ Erro ao processar mensagem WebSocket:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket desconectado:', event.code, event.reason);
        setIsConnected(false);
        
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

    if (wsRef.current) {
      wsRef.current.close(1000, 'Desconexão intencional');
      wsRef.current = null;
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
      connect();
    }

    return () => {
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
