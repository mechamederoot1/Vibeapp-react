// Small notification audio manager with unlock on user gesture
const audioSrc = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA='; // tiny silent WAV as placeholder

let audio = null;
let unlocked = false;

export const initNotificationAudio = () => {
  if (audio) return;
  try {
    audio = new Audio(audioSrc);
    audio.preload = 'auto';
    audio.volume = 0.6;
  } catch (e) {
    audio = null;
  }
}

export const unlockAudioOnGesture = () => {
  initNotificationAudio();
  if (!audio) return;
  if (unlocked) return;
  const tryUnlock = async () => {
    try {
      await audio.play();
      audio.pause();
      audio.currentTime = 0;
      unlocked = true;
    } catch (e) {
      // ignore
    }
  }

  // Attach one-time listeners
  const handler = async () => {
    await tryUnlock();
    window.removeEventListener('click', handler);
    window.removeEventListener('touchstart', handler);
  }
  window.addEventListener('click', handler, { once: true });
  window.addEventListener('touchstart', handler, { once: true });
}

export const playNotification = async () => {
  initNotificationAudio();
  try {
    if (audio) {
      // Try to play (may be blocked until unlocked)
      audio.currentTime = 0;
      await audio.play();
      return true;
    }
  } catch (e) {
    // Fallback to WebAudio oscillator (may be blocked too)
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      const ac = new AC();
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sine';
      o.frequency.value = 880;
      g.gain.value = 0.04;
      o.connect(g); g.connect(ac.destination);
      o.start();
      setTimeout(() => { try { o.stop(); ac.close(); } catch(e){} }, 300);
      return true;
    } catch (err) {
      return false;
    }
  }
  return false;
}
