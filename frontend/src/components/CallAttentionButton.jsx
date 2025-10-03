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
        className={disabled ? 'w-10 h-10 filter grayscale opacity-40' : 'w-11 h-11'}
        aria-hidden="false"
        role="img"
      >
        {/* Outer circle (like photo: warm yellow) */}
        <circle cx="32" cy="32" r="30" fill="#f3cf6e" />

        {/* Phone: purple rotated rounded rectangle */}
        <g transform="translate(32,32) rotate(-20)">
          <rect x="-8" y="-12" width="16" height="24" rx="3" ry="3" fill="#7b5cff" />
          {/* screen highlight */}
          <rect x="-6.2" y="-9" width="12.4" height="16" rx="1.5" fill="#a992ff" opacity="0.12" />
          {/* small home button */}
          <rect x="-1" y="10" width="2" height="2" rx="0.4" fill="#ffffff" opacity="0.9" />
        </g>

        {/* Vibration marks - left */}
        <path d="M12 18c-1.6 1.2-1.6 4.6 0 6" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
        <path d="M9 14c-2.6 2-2.6 7.8 0 10" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />

        {/* Vibration marks - right */}
        <path d="M52 18c1.6 1.2 1.6 4.6 0 6" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
        <path d="M55 14c2.6 2 2.6 7.8 0 10" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />

        {/* subtle inner shadow for depth */}
        <ellipse cx="32" cy="38" rx="20" ry="6" fill="#000" opacity="0.03" />
      </svg>
    </button>
  );
};

export default CallAttentionButton;
