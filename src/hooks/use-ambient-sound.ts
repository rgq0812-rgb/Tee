import { useState, useEffect, useRef } from 'react';

/**
 * Hook for "L'Or du Silence" - Pink noise generator for AI processing states.
 * Follows the 1.9s duration, noise algorithm and filtering from the Bible.
 */
export function useAmbientSound() {
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('isMuted') === 'true');
  const audioContextRef = useRef<AudioContext | null>(null);

  const toggleMute = () => {
    const newVal = !isMuted;
    setIsMuted(newVal);
    localStorage.setItem('isMuted', String(newVal));
  };

  const playWind = () => {
    if (isMuted) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      const bufferSize = 2 * ctx.sampleRate;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);

      // Paul Kellet's Pink Noise Algorithm
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11; // compensation
        b6 = white * 0.115926;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      // Filtering: LP 420Hz (Q=0.2), HP 60Hz
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 420;
      lowpass.Q.value = 0.2;

      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 60;

      // Envelope: fade-in 0.5s -> sustain -> fade-out 0.6s
      const gainNode = ctx.createGain();
      const now = ctx.currentTime;
      const duration = 1.9;
      const peak = 0.062;

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(peak, now + 0.5);
      gainNode.gain.setValueAtTime(peak, now + duration - 0.6);
      gainNode.gain.linearRampToValueAtTime(0, now + duration);

      source.connect(lowpass);
      lowpass.connect(highpass);
      highpass.connect(gainNode);
      gainNode.connect(ctx.destination);

      source.start(now);
      source.stop(now + duration);
    } catch (e) {
      console.warn('AudioContext failed:', e);
    }
  };

  const playPing = (freq = 440, type: OscillatorType = 'sine', volume = 0.1) => {
    if (isMuted) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.warn('Audio ping failed:', e);
    }
  };

  return { isMuted, toggleMute, playWind, playPing };
}
