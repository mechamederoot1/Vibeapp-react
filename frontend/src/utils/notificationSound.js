// Notification sound manager using AudioContext. We attempt to resume/create the AudioContext
// on first user gesture so future notifications can produce sound even if triggered by WS.

let audioContext = null;
let unlocked = false;

const ensureAudioContext = () => {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!audioContext) {
    audioContext = new AC();
  }
  return audioContext;
}

export const unlockAudioOnGesture = () => {
  if (unlocked) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;

  const handler = async () => {
    try {
      if (!audioContext) audioContext = new AC();
      if (audioContext.state === 'suspended' && typeof audioContext.resume === 'function') {
        await audioContext.resume();
      }
      unlocked = true;
    } catch (e) {
      // ignore
    }
    window.removeEventListener('click', handler);
    window.removeEventListener('touchstart', handler);
  }

  window.addEventListener('click', handler, { once: true });
  window.addEventListener('touchstart', handler, { once: true });
}

export const playNotification = async () => {
  try {
    const ac = ensureAudioContext();
    if (!ac) return false;
    if (ac.state === 'suspended' && typeof ac.resume === 'function') {
      try { await ac.resume(); } catch(e) {}
    }
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.value = 880;
    g.gain.value = 0.04;
    o.connect(g); g.connect(ac.destination);
    o.start();
    setTimeout(() => { try { o.stop(); } catch(e){} }, 800);
    return true;
  } catch (err) {
    return false;
  }
}
