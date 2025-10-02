import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import useWebSocket from '../hooks/useWebSocket';

const CallAttentionButton = ({ receiverId }) => {
  const { user } = useAuth();
  const { sendMessage } = useWebSocket();

  const playLocalFeedback = () => {
    try {
      if (navigator.vibrate) navigator.vibrate([50,30,50]);
    } catch(e){}
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sine';
      o.frequency.value = 1000;
      g.gain.value = 0.03;
      o.connect(g); g.connect(ac.destination);
      o.start();
      setTimeout(() => { try { o.stop(); ac.close(); } catch(e){} }, 220);
    } catch(e){}
  }

  const handleClick = () => {
    if (!receiverId || !user) return;
    // send WS event to notify recipient
    sendMessage({ type: 'call_attention', data: { senderId: user.id, receiverId } });
    playLocalFeedback();
  };

  return (
    <button
      onClick={handleClick}
      className="p-2 hover:bg-gray-100 rounded-lg"
      title="Chamar atenção"
      aria-label="Chamar atenção"
    >
      {/* Custom icon: bell with vibration lines */}
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
