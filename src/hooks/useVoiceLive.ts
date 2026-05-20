import { useState, useEffect, useRef, useCallback } from 'react';

// Basic Voice Activity Detection (VAD) threshold
const VAD_THRESHOLD = 0.02;

export function useVoiceLive() {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  // Playback queue
  const playbackQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const nextPlayTimeRef = useRef(0);

  const connect = useCallback(async () => {
    try {
      // 1. Initialize WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/voice-live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log('[useVoiceLive] Connected to Proxy');
        // Start latency ping
        pingLatency();
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log('[useVoiceLive] Disconnected from Proxy');
        stop();
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'PONG') {
          const now = Date.now();
          setLatency(now - data.timestamp);
        } else if (data.serverContent?.modelTurn) {
          // Process incoming audio chunks from Gemini
          const parts = data.serverContent.modelTurn.parts;
          for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('audio/pcm')) {
              const base64 = part.inlineData.data;
              queueAudioPlayback(base64);
            }
          }
        }
      };

      // 2. Initialize Audio Capture
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;
      
      // Use ScriptProcessor as a fallback if AudioWorklet isn't set up
      const processor = audioCtx.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // VAD Logic: Check volume
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += Math.abs(inputData[i]);
        }
        const average = sum / inputData.length;
        
        if (average > VAD_THRESHOLD) {
          setIsSpeaking(true);
          // If we are playing AI audio, interrupt it!
          if (isPlayingRef.current) {
            interruptPlayback();
          }
        } else {
          setIsSpeaking(false);
        }

        // Convert Float32 to Int16 PCM
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          let s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Base64 encode chunk and send via WebSocket
        const buffer = new Uint8Array(pcm16.buffer);
        let binary = '';
        for (let i = 0; i < buffer.byteLength; i++) {
          binary += String.fromCharCode(buffer[i]);
        }
        const base64Data = btoa(binary);

        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'AUDIO_CHUNK', data: base64Data }));
        }
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);
      
    } catch (err) {
      console.error('[useVoiceLive] Setup Error:', err);
    }
  }, []);

  const stop = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (processorRef.current && sourceRef.current) {
      sourceRef.current.disconnect(processorRef.current);
      processorRef.current.disconnect();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop()); // Saves Power!
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsConnected(false);
    setIsSpeaking(false);
  }, []);

  // Ping interval for latency
  const pingLatency = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }));
      setTimeout(pingLatency, 2000);
    }
  };

  const queueAudioPlayback = (base64Pcm: string) => {
    if (!audioContextRef.current) return;
    
    // Decode base64 PCM16 to Float32
    const binaryStr = atob(base64Pcm);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7FFF);
    }

    playbackQueueRef.current.push(float32);
    
    if (!isPlayingRef.current) {
      playNextChunk();
    }
  };

  const playNextChunk = () => {
    if (playbackQueueRef.current.length === 0 || !audioContextRef.current) {
      isPlayingRef.current = false;
      return;
    }
    
    isPlayingRef.current = true;
    const chunk = playbackQueueRef.current.shift()!;
    const audioCtx = audioContextRef.current;
    
    const buffer = audioCtx.createBuffer(1, chunk.length, 16000);
    buffer.copyToChannel(chunk as any, 0);
    
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    
    const startTime = Math.max(audioCtx.currentTime, nextPlayTimeRef.current);
    source.start(startTime);
    
    nextPlayTimeRef.current = startTime + buffer.duration;
    
    source.onended = () => {
      playNextChunk();
    };
  };

  const interruptPlayback = () => {
    console.log('[useVoiceLive] Interrupting AI Audio!');
    // 1. Clear local queue
    playbackQueueRef.current = [];
    isPlayingRef.current = false;
    nextPlayTimeRef.current = 0;
    
    // 2. Suspend/Resume to stop current playing nodes immediately
    if (audioContextRef.current) {
      audioContextRef.current.suspend().then(() => {
        audioContextRef.current?.resume();
      });
    }

    // 3. Send interrupt to Server
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'INTERRUPT' }));
    }
  };

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { connect, stop, isConnected, isSpeaking, latency };
}
