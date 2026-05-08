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

    // Convert base64 to ArrayBuffer
    const binaryString = window.atob(base64Data);
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
    const float32Array = new Float32Array(alignedLen / 2);
    const dataView = new DataView(bytes.buffer, bytes.byteOffset, alignedLen);
    
    for (let i = 0; i < float32Array.length; i++) {
      // Linear 16-bit PCM is usually little-endian
      float32Array[i] = dataView.getInt16(i * 2, true) / 32768.0;
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
