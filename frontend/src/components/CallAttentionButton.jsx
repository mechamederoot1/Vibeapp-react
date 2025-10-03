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

  const disabled = loading || !isOnline || !receiverId || !user;

  const btnClass = disabled ? 'p-2 rounded-lg opacity-40 cursor-not-allowed text-gray-400' : 'p-2 hover:bg-gray-100 rounded-lg text-vibe-blue';

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={btnClass}
      title="Chamar atenção"
      aria-label="Chamar atenção"
    >
      {/* Inline SVG icon: blue circle with white phone and vibration marks; larger when active, desaturated when disabled */}
      <svg
        viewBox="0 0 64 64"
        className={disabled ? 'w-12 h-12 opacity-40 filter grayscale' : 'w-12 h-12'}
        aria-hidden="false"
        role="img"
      >
        {/* Flat blue circle matching app primary color */}
        <circle cx="32" cy="32" r="30" fill="#2563eb" />

        {/* Center phone (white) - rounded rectangle */}
        <rect x="26" y="16" width="12" height="32" rx="3" ry="3" fill="#ffffff" />
        {/* speaker slot */}
        <rect x="30" y="18.5" width="4" height="1.6" rx="0.8" fill="#e6e6e6" />
        {/* home dot */}
        <circle cx="32" cy="43" r="1.2" fill="#e6e6e6" />

        {/* Left vibration waves (two) */}
        <path d="M18 22c-2.6 1.9-2.6 6.3 0 8.2" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M14.5 19.5c-3.8 2.8-3.8 9.2 0 12" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />

        {/* Right vibration waves (two) */}
        <path d="M46 22c2.6 1.9 2.6 6.3 0 8.2" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M49.5 19.5c3.8 2.8 3.8 9.2 0 12" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </button>
  );
};

export default CallAttentionButton;
