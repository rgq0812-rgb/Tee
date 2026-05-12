let sharedAudioContext: AudioContext | null = null;

/**
 * Plays raw PCM audio data returned by Gemini TTS (24000Hz)
 */
export async function playRawPcm(base64Data: string, sampleRate = 24000) {
  try {
    if (!sharedAudioContext) {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      sharedAudioContext = new AudioContextClass({
        sampleRate
      });
    } else if (sharedAudioContext.sampleRate !== sampleRate) {
      // In case sample rate changes (rare for TTS)
      await sharedAudioContext.close();
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      sharedAudioContext = new AudioContextClass({
        sampleRate
      });
    }

    const audioContext = sharedAudioContext;

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    // Convert base64 to ArrayBuffer (sanitize whitespace)
    const binaryString = window.atob(base64Data.replace(/\s/g, ''));
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Convert to Float32Array (assuming 16-bit PCM)
    // The bytes are in Int16 format (2 bytes per sample)
    const byteLen = bytes.byteLength;
    // Ensure we have an even number of bytes for Int16 conversion
    const alignedLen = byteLen - (byteLen % 2);
    
    // Add 0.8s of silence at the start to prevent clipping/missing start of speech
    const silenceSamples = Math.floor(sampleRate * 0.8);
    const float32Array = new Float32Array(alignedLen / 2 + silenceSamples);
    
    const dataView = new DataView(bytes.buffer, bytes.byteOffset, alignedLen);
    
    // Fill with zero (silence) to avoid start clipping on some browsers
    for (let i = 0; i < silenceSamples; i++) {
      float32Array[i] = 0;
    }
    
    for (let i = 0; i < (alignedLen / 2); i++) {
      // Linear 16-bit PCM is usually little-endian
      float32Array[i + silenceSamples] = dataView.getInt16(i * 2, true) / 32768.0;
    }

    const audioBuffer = audioContext.createBuffer(1, float32Array.length, sampleRate);
    audioBuffer.getChannelData(0).set(float32Array);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
    
    return source;
  } catch (error) {
    console.error("Error playing PCM audio:", error);
    throw error;
  }
}

export function playPing(freq = 800, type: OscillatorType = 'sine', duration = 0.1, volume = 0.1) {
  try {
    const audioContext = sharedAudioContext || new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioContext.currentTime);
    
    gain.gain.setValueAtTime(volume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    osc.start();
    osc.stop(audioContext.currentTime + duration);
  } catch (e) {
    console.error("Audio trigger error:", e);
  }
}

export function playWhistle() {
  try {
    const audioContext = sharedAudioContext || new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();

    const freq = 1200;
    const duration = 0.6;
    
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.type = 'sine';
    // Whistle effect: slight frequency modulation
    osc.frequency.setValueAtTime(freq, audioContext.currentTime);
    osc.frequency.linearRampToValueAtTime(freq + 100, audioContext.currentTime + 0.1);
    osc.frequency.linearRampToValueAtTime(freq - 50, audioContext.currentTime + 0.3);
    osc.frequency.linearRampToValueAtTime(freq, audioContext.currentTime + duration);

    gain.gain.setValueAtTime(0, audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.1);
    gain.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.4);
    gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.start();
    osc.stop(audioContext.currentTime + duration);
  } catch (e) {
    console.error("Whistle error:", e);
  }
}

export function playSoftBell() {
  try {
    const audioContext = sharedAudioContext || new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();

    const duration = 2.5;
    const now = audioContext.currentTime;

    // Harmonic bell sound
    [1, 2, 3.5].forEach((mult, i) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880 * mult, now);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.1 / (i + 1), now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.start(now);
      osc.stop(now + duration);
    });
  } catch (e) {
    console.error("Soft bell error:", e);
  }
}
