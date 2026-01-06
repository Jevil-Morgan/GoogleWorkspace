import { useCallback, useRef } from 'react';

// Pre-generated sound effect URLs using Web Audio API
// These are synthetic sounds that don't require external API calls

export function useSoundEffects() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(true);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Toggle sound effects
  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
    localStorage.setItem('workspace_soundEnabled', enabled ? '1' : '0');
  }, []);

  // Check if sounds are enabled
  const isEnabled = useCallback(() => {
    const stored = localStorage.getItem('workspace_soundEnabled');
    return stored !== '0'; // Default to enabled
  }, []);

  // Play a click sound - short, satisfying tap
  const playClick = useCallback(() => {
    if (!isEnabled()) return;
    
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
      
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.05);
    } catch (e) {
      console.log('Audio not available');
    }
  }, [getAudioContext, isEnabled]);

  // Play a success sound - ascending chime
  const playSuccess = useCallback(() => {
    if (!isEnabled()) return;
    
    try {
      const ctx = getAudioContext();
      
      const playNote = (freq: number, startTime: number, duration: number) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, startTime);
        
        gainNode.gain.setValueAtTime(0.12, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      const now = ctx.currentTime;
      playNote(523.25, now, 0.15);        // C5
      playNote(659.25, now + 0.1, 0.15);  // E5
      playNote(783.99, now + 0.2, 0.2);   // G5
    } catch (e) {
      console.log('Audio not available');
    }
  }, [getAudioContext, isEnabled]);

  // Play an error sound - descending tone
  const playError = useCallback(() => {
    if (!isEnabled()) return;
    
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(400, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);
    } catch (e) {
      console.log('Audio not available');
    }
  }, [getAudioContext, isEnabled]);

  // Play a notification sound - soft ping
  const playNotification = useCallback(() => {
    if (!isEnabled()) return;
    
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.log('Audio not available');
    }
  }, [getAudioContext, isEnabled]);

  // Play a hover sound - very subtle
  const playHover = useCallback(() => {
    if (!isEnabled()) return;
    
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(0.03, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.02);
    } catch (e) {
      console.log('Audio not available');
    }
  }, [getAudioContext, isEnabled]);

  // Play a tab switch sound - whoosh
  const playTabSwitch = useCallback(() => {
    if (!isEnabled()) return;
    
    try {
      const ctx = getAudioContext();
      
      // White noise with filter for whoosh effect
      const bufferSize = ctx.sampleRate * 0.1;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(2000, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(8000, ctx.currentTime + 0.05);
      
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      
      whiteNoise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      whiteNoise.start(ctx.currentTime);
      whiteNoise.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.log('Audio not available');
    }
  }, [getAudioContext, isEnabled]);

  // Play a loading start sound - building anticipation
  const playLoadingStart = useCallback(() => {
    if (!isEnabled()) return;
    
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(300, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);
      
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.log('Audio not available');
    }
  }, [getAudioContext, isEnabled]);

  // Play a complete/done sound - satisfying completion
  const playComplete = useCallback(() => {
    if (!isEnabled()) return;
    
    try {
      const ctx = getAudioContext();
      
      const playNote = (freq: number, startTime: number, duration: number, volume = 0.1) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, startTime);
        
        gainNode.gain.setValueAtTime(volume, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      const now = ctx.currentTime;
      playNote(392.00, now, 0.1, 0.08);        // G4
      playNote(523.25, now + 0.08, 0.12, 0.1); // C5
      playNote(659.25, now + 0.16, 0.15, 0.12); // E5
      playNote(783.99, now + 0.24, 0.3, 0.1);  // G5
    } catch (e) {
      console.log('Audio not available');
    }
  }, [getAudioContext, isEnabled]);

  // Play a delete sound - subtle negative feedback
  const playDelete = useCallback(() => {
    if (!isEnabled()) return;
    
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(500, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.log('Audio not available');
    }
  }, [getAudioContext, isEnabled]);

  return {
    playClick,
    playSuccess,
    playError,
    playNotification,
    playHover,
    playTabSwitch,
    playLoadingStart,
    playComplete,
    playDelete,
    setEnabled,
    isEnabled,
  };
}
