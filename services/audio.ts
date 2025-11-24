// services/audio.ts

let audioContext: AudioContext | null = null;
let isMuted = false;

export const setMute = (muted: boolean) => {
    isMuted = muted;
};

const initializeAudioContext = () => {
  if (audioContext) return;
  try {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch (e) {
    console.error("Web Audio API is not supported in this browser.", e);
  }
};

const playTone = (freq: number, duration: number, volume: number = 0.5, type: OscillatorType = 'sine') => {
  if (!audioContext || isMuted) return;
  
  if (audioContext.state === 'suspended') {
      audioContext.resume();
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
  gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
};

// Call this on a user interaction, like starting the game.
export const initAudio = () => {
    initializeAudioContext();
};

export const playStartSound = () => playTone(523.25, 0.2, 0.2); // C5
export const playScoreSound = () => playTone(880, 0.1, 0.1, 'triangle'); // A5
export const playMoveSound = () => playTone(440, 0.1, 0.1, 'square'); // A4
export const playGameOverSound = () => {
  playTone(392, 0.2, 0.2); // G4
  setTimeout(() => playTone(261.63, 0.3, 0.2), 200); // C4
};