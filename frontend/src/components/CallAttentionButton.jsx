import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import useWebSocket from '../hooks/useWebSocket';
import { api } from '../services/api';

const CallAttentionButton = ({ receiverId, isOnline = true }) => {
  const { user } = useAuth();
  const { sendMessage } = useWebSocket();
  const [loading, setLoading] = React.useState(false);

  const playLocalFeedback = () => {
    try {
      if (navigator.vibrate) {
        // Stronger pattern: repeated strong pulses
        const pattern = [300,120,300,120,300,120,300,120,300];
        navigator.vibrate(pattern);
      }
    } catch (e) {}

    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        const ac = new AC();
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.type = 'sine';
        o.frequency.value = 1200;
        g.gain.value = 0.04;
        o.connect(g); g.connect(ac.destination);
        o.start();
        setTimeout(() => { try { o.stop(); ac.close(); } catch (e) {} }, 280);
      }
    } catch (e) {}
  };

  const handleClick = async () => {
    if (!receiverId || !user || loading) return;
    setLoading(true);

    // Provide immediate local feedback so user feels it was instant
    playLocalFeedback();

    // Try WebSocket first for lowest latency
    try {
      const sent = sendMessage({ type: 'call_attention', data: { senderId: user.id, receiverId } });
      if (!sent) {
        // If WS not available, fall back to REST endpoint
        try {
          await api.post('/messages/call-attention', { receiverId });
        } catch (err) {
          console.warn('Call attention REST fallback failed', err);
        }
      }
    } catch (err) {
      // On unexpected error, fallback to REST
      try {
        await api.post('/messages/call-attention', { receiverId });
      } catch (e) {
        console.warn('Call attention failed', e);
      }
    } finally {
      // small debounce to avoid spam
      setTimeout(() => setLoading(false), 500);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-60"
      title="Chamar atenção"
      aria-label="Chamar atenção"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C9.243 2 7 4.243 7 7v3.586l-1.707 1.707A1 1 0 006 13h12a1 1 0 00.707-1.707L17 10.586V7c0-2.757-2.243-5-5-5z" stroke="#2563eb" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 18a3 3 0 006 0" stroke="#2563eb" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 9c1.5 2 1.5 6 0 8" stroke="#60a5fa" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 9c-1.5 2-1.5 6 0 8" stroke="#60a5fa" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
};

export default CallAttentionButton;
