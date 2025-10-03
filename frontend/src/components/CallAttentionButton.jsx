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
        className={disabled ? 'w-10 h-10 opacity-40 text-gray-300' : 'w-11 h-11 text-vibe-blue'}
        aria-hidden="false"
        role="img"
      >
        {/* Outer circle uses currentColor so text-vibe-blue controls the fill when active */}
        <circle cx="32" cy="32" r="30" fill="currentColor" />

        {/* Phone: white rounded rectangle rotated */}
        <g transform="translate(32,32) rotate(-18)">
          <rect x="-6.5" y="-11" width="13" height="22" rx="2" fill="#ffffff" />
          {/* small home button */}
          <rect x="0.9" y="9" width="1.8" height="1.8" rx="0.4" fill="#e6e6e6" />
          {/* screen inner (subtle) */}
          <rect x="-4" y="-8" width="8" height="14" rx="1" fill="#ffffff" opacity="0.95" />
        </g>

        {/* Vibration waves - white strokes on left and right */}
        <path d="M10 18c-2 1.5-2 5 0 6.5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 14c-3 2-3 8 0 11" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />

        <path d="M54 18c2 1.5 2 5 0 6.5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M57 14c3 2 3 8 0 11" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
};

export default CallAttentionButton;
