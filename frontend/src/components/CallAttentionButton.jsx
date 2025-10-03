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
        viewBox="0 0 24 24"
        className={disabled ? 'w-7 h-7 opacity-40 text-gray-300' : 'w-8 h-8 text-vibe-blue'}
        aria-hidden="false"
        role="img"
      >
        {/* Background circle uses currentColor so we can control it via text color classes */}
        <circle cx="12" cy="12" r="11" fill="currentColor" />
        {/* Phone body (white) */}
        <rect x="10.2" y="6.2" width="3.6" height="8.6" rx="0.6" ry="0.6" fill="#ffffff" transform="rotate(-18 12 10)" />
        {/* Small square/home button */}
        <rect x="11.35" y="14.95" width="1.3" height="1.3" rx="0.2" fill="#ffffff" transform="rotate(-18 12 10)" />
        {/* Vibration marks (white strokes) */}
        <path d="M4.5 8c0-.8.6-1.5 1.4-1.5" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9" />
        <path d="M19 8c0-.8-.6-1.5-1.4-1.5" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9" />
        <path d="M4.5 16c0 .8.6 1.5 1.4 1.5" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9" />
        <path d="M19 16c0 .8-.6 1.5-1.4 1.5" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9" />
      </svg>
    </button>
  );
};

export default CallAttentionButton;
