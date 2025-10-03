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
      {/* Icon image (uses provided uploaded asset) */}
      <img
        src="https://cdn.builder.io/api/v1/image/assets%2F47ac529da69a42f49d7025c85e541079%2Fc220f9c60ae545b79807e93921b5c74c?format=webp&width=800"
        alt="Chamar atenção"
        className={disabled ? 'w-5 h-5 filter grayscale opacity-60' : 'w-5 h-5 object-contain'}
      />
    </button>
  );
};

export default CallAttentionButton;
