import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import useWebSocket from '../hooks/useWebSocket';
import { api } from '../services/api';
import { BellRing } from 'lucide-react';

const CallAttentionButton = ({ receiverId, isOnline = true }) => {
  const { user } = useAuth();
  const { sendMessage } = useWebSocket();
  const [loading, setLoading] = React.useState(false);

  const playLocalFeedback = () => {
    try {
      if (navigator.vibrate) {
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
    playLocalFeedback();

    try {
      const sent = sendMessage({ type: 'call_attention', data: { senderId: user.id, receiverId } });
      if (!sent) {
        try {
          await api.post('/messages/call-attention', { receiverId });
        } catch (err) {
          console.warn('Call attention REST fallback failed', err);
        }
      }
    } catch (err) {
      try {
        await api.post('/messages/call-attention', { receiverId });
      } catch (e) {
        console.warn('Call attention failed', e);
      }
    } finally {
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
      <BellRing size={20} className={disabled ? 'text-gray-400' : 'text-vibe-blue'} />
    </button>
  );
};

export default CallAttentionButton;
