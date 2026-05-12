import { useState, useRef, useEffect, useCallback } from 'react';
import { chatWithAdam, generateSpeech, speakWithBrowser } from '../services/geminiService';
import { useVoiceInput } from './useVoiceInput';
import { playRawPcm } from '../lib/audioUtils';
import { useChat } from '../services/ChatContext';

export interface SafeMessage {
  id: string;
  role: 'user' | 'model';
  parts: [{ text: string } | { inlineData: { mimeType: string; data: string } }];
  speaker?: 'ONYX' | 'LOGIC' | 'ADAM';
}

interface UseLiveChatProps {
  initialMessage?: string;
  initialSpeaker?: 'ADAM' | 'LOGIC' | 'ONYX';
  courseContext?: {
    selectedCourse?: any;
    currentHole?: number;
    scorecard?: Record<number, any>;
    arsenal?: any[];
    handicap?: number;
    playerForm?: string;
    selectedTee?: string;
    activeTacticalMode?: 'PARCOURS' | 'STRATÉGIE' | 'ENTRAÎNEMENT';
    selectedTactic?: 'AGRESSIF' | 'SÉCURITÉ' | 'CRÉATIF';
  };
  onToolCall?: (toolCalls: any[]) => void;
  silenceDelay?: number;
  wakeWords?: string[];
  onWakeWord?: () => void;
  autoRestartMic?: boolean;
}

export function useLiveChat({ 
  initialMessage, 
  initialSpeaker = 'ADAM',
  courseContext = {},
  onToolCall,
  silenceDelay = 3000,
  wakeWords = [],
  onWakeWord,
  autoRestartMic = false
}: UseLiveChatProps = {}) {
  const { messages, setMessages, lastAdvice: globalLastAdvice, setLastAdvice: setGlobalLastAdvice } = useChat();
  const [input, setInput] = useState('');
  const [attachedImage, setAttachedImage] = useState<{ mimeType: string, data: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('onyx_voice') === 'false');
  const [lastTranscript, setLastTranscript] = useState('');
  const [currentSpeaker, setCurrentSpeaker] = useState<'ADAM' | 'LOGIC' | 'ONYX' | null>(initialSpeaker || 'ADAM');
  
  const currentAudioSource = useRef<AudioBufferSourceNode | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initializedRef = useRef<string | boolean>(false);
  const wakeWordDetectedRef = useRef(false);
  const lastTranscriptRef = useRef('');
  const handleSendRef = useRef<any>(null);

  useEffect(() => {
    localStorage.setItem('onyx_voice', isMuted ? 'false' : 'true');
  }, [isMuted]);

  const generateUniqueId = (prefix: string) => {
    try {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `${prefix}-${crypto.randomUUID()}`;
      }
    } catch (e) {}
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  };

  const [lastAdvice, setLastAdvice] = useState<{ text: string, speaker?: 'ADAM' | 'LOGIC' | 'ONYX' } | null>(
    globalLastAdvice ? { text: globalLastAdvice, speaker: (localStorage.getItem('onyx_last_speaker') as any) || 'ADAM' } : null
  );

  // 1. Voice Input Hook (Must be first to provide startListening/stopListening)
  const { isListening, startListening, stopListening, error: voiceError } = useVoiceInput((text, isFinal) => {
    setLastTranscript(text);
    lastTranscriptRef.current = text;
    const transcript = text.toLowerCase();
    
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    
    // Wake word detection
    const wakeWordsList = ['hey tee', 'tactique', 'club', 'aide moi', 'adam'];
    const detectedWakeWord = wakeWordsList.some(word => transcript.includes(word.toLowerCase()));

    if (detectedWakeWord) {
      window.dispatchEvent(new CustomEvent('onyx_voice_wake', { detail: { wake: true } }));
    }

    if (!wakeWordDetectedRef.current && detectedWakeWord) {
      wakeWordDetectedRef.current = true;
      if (onWakeWord) onWakeWord();
      
      // Extract query after wake word
      let query = '';
      for (const word of wakeWords) {
        const lowerWord = word.toLowerCase();
        if (transcript.includes(lowerWord)) {
          const parts = transcript.split(lowerWord);
          query = parts[parts.length - 1].trim();
          break;
        }
      }
      
      if (isFinal && query) {
        if (handleSendRef.current) handleSendRef.current(query);
        wakeWordDetectedRef.current = false;
      }
    } else if (text.trim().length > 2) {
      silenceTimerRef.current = setTimeout(() => {
        if (lastTranscriptRef.current.trim().length > 2) {
          const finalMessage = lastTranscriptRef.current;
          console.log(`[ONYX] Silence détecté (${silenceDelay}ms), envoi: "${finalMessage}"`);
          if (handleSendRef.current) handleSendRef.current(finalMessage);
          stopListening();
        }
      }, silenceDelay);
    }
  });

  // 2. Voice output logic
  const speakText = useCallback(async (text: string, speaker?: 'ADAM' | 'LOGIC' | 'ONYX', shouldRestartMic?: boolean) => {
    if (isMuted) {
      if (shouldRestartMic || autoRestartMic) {
        setTimeout(() => startListening(true, 20000), 500);
      }
      return;
    }
    
    if (speaker) {
      setCurrentSpeaker(speaker);
      localStorage.setItem('onyx_last_speaker', speaker);
    }
    setLastAdvice({ text, speaker });
    setGlobalLastAdvice(text);
    setIsSpeaking(true);
    try {
      const speakerId = speaker === 'ONYX' ? 'pred' : speaker === 'LOGIC' ? 'strat' : 'mage';
      const result = await generateSpeech(text, { id: speakerId });
      
      const onFinished = () => {
        setIsSpeaking(false);
        currentAudioSource.current = null;
        if (shouldRestartMic || autoRestartMic) {
          startListening(true, 20000);
        }
      };

      if (typeof result === 'object' && result.fallback) {
        speakWithBrowser(result.text, onFinished);
        return;
      }
      
      if (typeof result === 'string') {
        const source = await playRawPcm(result);
        if (source) {
          currentAudioSource.current = source;
          source.onended = onFinished;
        } else {
          onFinished();
        }
      } else {
        onFinished();
      }
    } catch (error) {
      console.error(error);
      setIsSpeaking(false);
      if (shouldRestartMic || autoRestartMic) {
        startListening(true, 45000);
      }
    }
  }, [isMuted, autoRestartMic, startListening]);

  // 3. Main send logic
  const handleSend = useCallback(async (textOverride?: string, imageOverride?: { mimeType: string, data: string }) => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    
    const textToSend = textOverride || input;
    const imageToSend = imageOverride || attachedImage;
    if (!textToSend.trim() && !imageToSend || isLoading) return;

    const parts: any[] = [{ text: textToSend }];
    if (imageToSend) {
      parts.push({ inlineData: imageToSend });
    }

    const userMessage: SafeMessage = { 
      id: generateUniqueId('user'),
      role: 'user', 
      parts: parts as any
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachedImage(null);
    setIsLoading(true);

    try {
      const historyForApi = [...messages, userMessage].map(m => ({ role: m.role, parts: m.parts }));
      
      const { text, toolCalls } = await chatWithAdam(
        historyForApi, 
        courseContext.selectedCourse, 
        courseContext.currentHole, 
        courseContext.scorecard, 
        courseContext.arsenal, 
        courseContext.handicap || 18, 
        (courseContext.playerForm || 'forme').toLowerCase(), 
        (courseContext.selectedTee || 'white') as any, 
        courseContext.activeTacticalMode || 'PARCOURS', 
        courseContext.selectedTactic || 'SÉCURITÉ',
        {
          scorecard: courseContext.scorecard || {},
          history: messages.slice(-5).map(m => {
            const firstPart = m.parts[0];
            return { advice: 'text' in firstPart ? firstPart.text : 'Image' };
          }),
          activeMode: courseContext.activeTacticalMode || 'PARCOURS'
        }
      );
      
      if (toolCalls && toolCalls.length > 0 && onToolCall) {
        onToolCall(toolCalls);
      }

      let responseText = text || "C'est noté";
      let speaker: 'ONYX' | 'LOGIC' | 'ADAM' | null = null;

      const speakerMatch = responseText.match(/^\[(ONYX|LOGIC|ADAM)\]/i);
      if (speakerMatch) {
        speaker = speakerMatch[1].toUpperCase() as any;
        responseText = responseText.replace(/^\[(ONYX|LOGIC|ADAM)\]\s*/i, '');
      } else {
        speaker = courseContext.activeTacticalMode === 'ENTRAÎNEMENT' ? 'ONYX' : courseContext.activeTacticalMode === 'STRATÉGIE' ? 'LOGIC' : 'ADAM';
      }

      const adamMessage: SafeMessage = { 
        id: generateUniqueId('adam'),
        role: 'model', 
        parts: [{ text: responseText }],
        speaker: speaker || undefined
      };
      
      if (speaker) setCurrentSpeaker(speaker);
      setMessages(prev => [...prev, adamMessage]);
      if (responseText) speakText(responseText, speaker || undefined, autoRestartMic);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [input, attachedImage, isLoading, messages, courseContext, onToolCall, speakText, autoRestartMic]);

  handleSendRef.current = handleSend;

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      setLastTranscript('');
      startListening(false, 30000);
    }
  };

  // Initialization
  useEffect(() => {
    if (initialMessage && !initializedRef.current) {
      setMessages([{
        id: generateUniqueId('init'),
        role: 'model',
        parts: [{ text: initialMessage }],
        speaker: initialSpeaker
      }]);
      initializedRef.current = true;
      speakText(initialMessage, initialSpeaker);
    }
  }, [initialMessage, initialSpeaker, speakText]);

  return {
    messages,
    setMessages,
    input,
    setInput,
    attachedImage,
    setAttachedImage,
    isLoading,
    isListening,
    isSpeaking,
    isMuted,
    setIsMuted,
    lastTranscript,
    voiceError,
    currentSpeaker,
    setCurrentSpeaker,
    lastAdvice,
    repeatLastAdvice: () => {
      if (lastAdvice) speakText(lastAdvice.text, lastAdvice.speaker, autoRestartMic);
    },
    handleSend,
    toggleListening,
    startListening,
    speakText,
    stopListening
  };
}
