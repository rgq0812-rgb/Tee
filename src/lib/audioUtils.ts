/**
 * Plays raw PCM audio data returned by Gemini TTS (24000Hz)
 */
export async function playRawPcm(base64Data: string, sampleRate = 24000) {
  try {
    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    const audioContext = new AudioContextClass({
      sampleRate
    });

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
    const int16Array = new Int16Array(bytes.buffer);
    const float32Array = new Float32Array(int16Array.length);
    
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
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
