import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { X, Send, BookOpen, Sparkles, User, Loader2, Volume2, VolumeX, Mic, Brain, Camera, Paperclip, Target, Map as MapIcon, Check } from 'lucide-react';
import { chatWithAdam, generateSpeech, isSpeechRecognitionSupported, speakWithBrowser } from '../services/geminiService';
import { ADAM_AVATAR_URL } from '../constants';
import AudioVisualizer from './AudioVisualizer';
import { useAmbientSound } from '../hooks/use-ambient-sound';
import { playRawPcm } from '../lib/audioUtils';
import { useVoiceInput } from '../hooks/useVoiceInput';

interface SafeMessage {
  id: string;
  role: 'user' | 'model';
  parts: [{ text: string } | { inlineData: { mimeType: string; data: string } }];
  speaker?: 'ONYX' | 'LOGIC' | 'ADAM';
}

interface AdamMentorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCourse?: any;
  currentHole?: number;
  scorecard?: Record<number, any>;
  arsenal?: any[];
  initialMessage?: string;
  handicap?: number;
  playerForm?: string;
  displayMode: 'tactical' | 'solar';
  onUpdateScore?: (hole: number, strokes: number, putts: number) => void;
  selectedTee: 'black' | 'white' | 'yellow' | 'blue' | 'red';
}

export default function AdamMentorModal({ isOpen, onClose, selectedCourse, currentHole, scorecard, arsenal, initialMessage, handicap = 18, playerForm = 'forme', displayMode, onUpdateScore, selectedTee }: AdamMentorModalProps) {
  const { playPing } = useAmbientSound();
  const [messages, setMessages] = useState<SafeMessage[]>([]);
  const [input, setInput] = useState('');
  const [attachedImage, setAttachedImage] = useState<{ mimeType: string, data: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('onyx_voice') === 'false');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userLocation, setUserLocation] = useState<GeolocationPosition | null>(null);

  useEffect(() => {
    localStorage.setItem('onyx_voice', isMuted ? 'false' : 'true');
  }, [isMuted]);
  const [lastScoreUpdate, setLastScoreUpdate] = useState<{ hole: number, strokes: number, putts: number } | null>(null);
  const [activeTacticalMode, setActiveTacticalMode] = useState<'PARCOURS' | 'STRATÉGIE' | 'ENTRAÎNEMENT'>('PARCOURS');
  const [selectedTactic, setSelectedTactic] = useState<'AGRESSIF' | 'SÉCURITÉ' | 'CRÉATIF'>('SÉCURITÉ');
  const [currentForm, setCurrentForm] = useState<'FROID' | 'FORME' | 'PUR'>('FORME');
  const [currentSpeaker, setCurrentSpeaker] = useState<'ADAM' | 'LOGIC' | 'ONYX' | null>(null);

  const isSolar = displayMode === 'solar';

  useEffect(() => {
    if (isOpen && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation(position);
      }, (err) => console.log("Geolocation error:", err));
    }
  }, [isOpen]);

  // Initialize messages carefully
  const initializedRef = useRef<string | boolean>(false);

  // Function to create a unique ID - robust and collision-resistant
  const generateUniqueId = (prefix: string) => {
    try {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `${prefix}-${crypto.randomUUID()}`;
      }
    } catch (e) {
      // Fallback if crypto fails
    }
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `${prefix}-${timestamp}-${random}`;
  };

  useEffect(() => {
    if (isOpen) {
      // If we have an initial message from props AND we haven't initialized it yet for THIS initialMessage
      const msgHash = initialMessage ? initialMessage.substring(0, 20) : 'none';
      const initKey = `init-${msgHash}`;
      
      if (initialMessage && initializedRef.current !== initKey) {
        setMessages([
          {
            id: generateUniqueId('msg-init-prop'),
            role: 'model',
            parts: [{ text: initialMessage }]
          }
        ]);
        initializedRef.current = initKey;
        if (localStorage.getItem('onyx_voice') !== 'false') {
          speakText(initialMessage, 'ADAM');
        }
      } else if (messages.length === 0 && !initializedRef.current) {
        const welcomeMessages = {
          'PARCOURS': "Bonjour. Je suis ADAM. Je gère votre parcours et votre tactique en temps réel. Quel est votre prochain coup ?",
          'STRATÉGIE': "Bonjour. Je suis LOGIC. Mon rôle est d'analyser vos statistiques et de définir la stratégie de victoire. Que voulez-vous planifier ?",
          'ENTRAÎNEMENT': "Bonjour. Je suis ONYX. Je traduis vos faiblesses en exercices de précision. Prêt pour l'entraînement technique ?"
        };
        const speakerMap: Record<string, 'ADAM' | 'LOGIC' | 'ONYX'> = {
          'PARCOURS': 'ADAM',
          'STRATÉGIE': 'LOGIC',
          'ENTRAÎNEMENT': 'ONYX'
        };
        const welcomeSpeaker = speakerMap[activeTacticalMode];
        const welcomeText = welcomeMessages[activeTacticalMode];
        
        setCurrentSpeaker(welcomeSpeaker);
        setMessages([
          {
            id: generateUniqueId('msg-welcome'),
            role: 'model',
            parts: [{ text: welcomeText }],
            speaker: welcomeSpeaker as any
          }
        ]);
        initializedRef.current = 'true';
        if (localStorage.getItem('onyx_voice') !== 'false') {
          speakText(welcomeText, welcomeSpeaker);
        }
      }
    }
  }, [isOpen, initialMessage, activeTacticalMode]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const currentAudioSource = useRef<AudioBufferSourceNode | null>(null);
  const micTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isHandsFree, setIsHandsFree] = useState(false);
  const wakeWordDetectedRef = useRef(false);

  const handsFreeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use the updated voice input hook
  const { isListening, startListening, stopListening, error } = useVoiceInput((text, isFinal) => {
    const transcript = text.toLowerCase();
    
    // Wake word detection: ONYX (multiple variations)
    const wakeWords = ['onyx', 'onix', 'onice', 'aux nix', 'onyks'];
    const hasWakeWord = wakeWords.some(word => transcript.includes(word));

    if (!wakeWordDetectedRef.current && hasWakeWord) {
      wakeWordDetectedRef.current = true;
      if (playPing) playPing(1200, 'sine', 0.1); // Detection sound
      
      // Extract query after wake word
      let query = '';
      for (const word of wakeWords) {
        if (transcript.includes(word)) {
          const parts = transcript.split(word);
          query = parts[parts.length - 1].trim();
          break;
        }
      }
      
      if (isFinal && query) {
        handleSend(query);
        wakeWordDetectedRef.current = false;
        resetHandsFreeTimer(); // Activity detected
      }
    } else if (wakeWordDetectedRef.current && isFinal) {
      handleSend(text);
      wakeWordDetectedRef.current = false;
      resetHandsFreeTimer();
    }
  });

  const resetHandsFreeTimer = useCallback(() => {
    if (isHandsFree) {
      if (handsFreeTimeoutRef.current) clearTimeout(handsFreeTimeoutRef.current);
      handsFreeTimeoutRef.current = setTimeout(() => {
        setIsHandsFree(false);
        stopListening();
        if (playPing) playPing(400, 'sine', 0.05); // Deactivation sound
      }, 45000);
    }
  }, [isHandsFree, stopListening, playPing]);

  const startAutoMic = useCallback(() => {
    if (isHandsFree || wasListeningRef.current) {
      startListening(true, isHandsFree ? 45000 : 20000);
      if (isHandsFree) resetHandsFreeTimer();
      wasListeningRef.current = false;
    }
  }, [isHandsFree, startListening, resetHandsFreeTimer]);

  const toggleHandsFree = () => {
    if (isHandsFree) {
      setIsHandsFree(false);
      if (handsFreeTimeoutRef.current) {
        clearTimeout(handsFreeTimeoutRef.current);
        handsFreeTimeoutRef.current = null;
      }
      stopListening();
    } else {
      setIsHandsFree(true);
      wakeWordDetectedRef.current = false;
      // Start a 45s session
      startListening(true, 45000);
      if (playPing) playPing(1500, 'sine', 0.1);
      
      // Reset timer on start
      if (handsFreeTimeoutRef.current) clearTimeout(handsFreeTimeoutRef.current);
      handsFreeTimeoutRef.current = setTimeout(() => {
        setIsHandsFree(false);
        stopListening();
        if (playPing) playPing(400, 'sine', 0.05);
      }, 45000);
    }
  };

  useEffect(() => {
    if ('mediaSession' in navigator && isOpen) {
      const setupMediaSession = () => {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'ONYX Mentoring',
          artist: 'The Chose Elite',
          album: 'Course Session',
          artwork: [{ src: 'https://images.unsplash.com/photo-1540324155974-7523202daa3f?w=512', sizes: '512x512', type: 'image/jpeg' }]
        });
        navigator.mediaSession.setActionHandler('play', () => triggerMic());
      };
      setupMediaSession();
    }
  }, [isOpen]);

  const triggerMic = () => {
    if (micTimeoutRef.current) {
      clearTimeout(micTimeoutRef.current);
      micTimeoutRef.current = null;
    }

    if (isListening) {
      stopListening();
      return;
    }

    if (isLoading) return;

    // Interrupt Adam if he is speaking
    if (isSpeaking && currentAudioSource.current) {
      try {
        currentAudioSource.current.stop();
      } catch (e) {
        // Source might have already stopped
      }
      setIsSpeaking(false);
    }
    
    if (!isSpeechRecognitionSupported()) {
      alert("La reconnaissance vocale n'est pas supportée sur ce navigateur. Essaie sur Chrome ou Safari.");
      return;
    }

    if (isHandsFree) {
        toggleHandsFree();
        return;
    }

    // Clearer tactical "listening" beep
    if (playPing) playPing(1200, 'sine', 0.05);

    // Démarrage en mode Continu pour le chat fluide
    startListening(true, 20000);
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading, isSpeaking, isListening]);

  const wasListeningRef = useRef(false);

  const speakText = async (text: string, speaker?: 'ADAM' | 'LOGIC' | 'ONYX') => {
    if (isMuted) return;
    
    // Pause listening while Adam speaks
    if (isListening) {
      wasListeningRef.current = true;
      stopListening();
    }

    setIsSpeaking(true);
    console.log(`[ONYX] Speaking response: "${text.substring(0, 30)}..."`);
    
    try {
      // Find the caddie config based on speaker if possible
      const speakerId = speaker === 'ONYX' ? 'pred' : speaker === 'LOGIC' ? 'strat' : 'mage';
      const result = await generateSpeech(text, { id: speakerId });
      
      if (typeof result === 'object' && result.fallback) {
        speakWithBrowser(result.text, () => {
          setIsSpeaking(false);
          startAutoMic();
        });
        return;
      }
      
      if (typeof result === 'string') {
        const source = await playRawPcm(result);
        if (source) {
          currentAudioSource.current = source;
          source.onended = () => {
            setIsSpeaking(false);
            currentAudioSource.current = null;
            startAutoMic();
          };
        } else {
          setIsSpeaking(false);
          startAutoMic();
        }
      } else {
        setIsSpeaking(false);
        startAutoMic();
      }
    } catch (error) {
      console.error(error);
      setIsSpeaking(false);
      startAutoMic();
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert("Image trop lourde (max 4MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const base64 = (readerEvent.target?.result as string).split(',')[1];
      setAttachedImage({
        mimeType: file.type,
        data: base64
      });
      if (playPing) playPing(1500, 'sine', 0.1);
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (textOverride?: string) => {
    if (micTimeoutRef.current) {
      clearTimeout(micTimeoutRef.current);
      micTimeoutRef.current = null;
    }
    const textToSend = textOverride || input;
    if (!textToSend.trim() && !attachedImage || isLoading) return;

    if (playPing) playPing(600, 'sine', 0.03); // "Sent" feedback
    
    // Construct parts
    const parts: any[] = [{ text: textToSend }];
    if (attachedImage) {
      parts.push({ inlineData: attachedImage });
    }

    const userMessage: SafeMessage = { 
      id: generateUniqueId('user'),
      role: 'user', 
      parts: parts as any
    };
    
    setMessages(prev => {
      if (prev.some(m => m.id === userMessage.id)) return prev;
      return [...prev, userMessage];
    });
    setInput('');
    setAttachedImage(null);
    setIsLoading(true);

    try {
      // Add tactical context to history for this specific turn
      let contextualLastMessage = textToSend;
      if (userLocation) {
        contextualLastMessage = `[DATA TACTIQUE Lidar/GPS: Lat ${userLocation.coords.latitude.toFixed(6)}, Lng ${userLocation.coords.longitude.toFixed(6)}] ${textToSend}`;
      }

      // Cast the history for the API which expects Message[]
      const historyForApi = [...messages, { ...userMessage, parts: attachedImage ? [
        { text: isHandsFree ? `[AUDIO HUD MODE: RÉPONSE CHIRURGICALE MAX 10 MOTS] ${contextualLastMessage}` : contextualLastMessage },
        { inlineData: attachedImage }
      ] : [{ text: isHandsFree ? `[AUDIO HUD MODE: RÉPONSE CHIRURGICALE MAX 10 MOTS] ${contextualLastMessage}` : contextualLastMessage }] }].map(m => ({ role: m.role, parts: m.parts }));
      
      const { text, toolCalls } = await chatWithAdam(
        historyForApi, 
        selectedCourse, 
        currentHole, 
        scorecard, 
        arsenal, 
        handicap, 
        currentForm.toLowerCase(), 
        selectedTee, 
        activeTacticalMode, 
        selectedTactic,
        {
          scorecard: scorecard || {},
          history: messages.slice(-5).map(m => {
            const firstPart = m.parts[0];
            return { advice: 'text' in firstPart ? firstPart.text : 'Image analysis' };
          }), // Simplified history mapping
          activeMode: activeTacticalMode
        }
      );
      
      // Handle Tool Calls
      if (toolCalls && toolCalls.length > 0) {
        toolCalls.forEach((call: any) => {
          if (call.name === 'update_score' && onUpdateScore) {
            const { hole_number, strokes, putts } = call.args;
            onUpdateScore(hole_number, strokes, putts);
            setLastScoreUpdate({ hole: hole_number, strokes, putts });
            setTimeout(() => setLastScoreUpdate(null), 4000);
            if (playPing) playPing(1000, 'sine', 0.1); // Score recorded ping
          }
        });
      }

      const responseTextWithTag = text || "...";
      let responseText = responseTextWithTag;
      let speaker: 'ONYX' | 'LOGIC' | 'ADAM' | null = null;

      // Extract speaker tag [ONYX], [LOGIC], [ADAM]
      const speakerMatch = responseTextWithTag.match(/^\[(ONYX|LOGIC|ADAM)\]/i);
      if (speakerMatch) {
        speaker = speakerMatch[1].toUpperCase() as any;
        responseText = responseTextWithTag.replace(/^\[(ONYX|LOGIC|ADAM)\]\s*/i, '');
      } else {
        // Fallback to active mode label if no tag
        speaker = activeTacticalMode === 'ENTRAÎNEMENT' ? 'ONYX' : activeTacticalMode === 'STRATÉGIE' ? 'LOGIC' : 'ADAM';
      }
      setCurrentSpeaker(speaker);

      // Remove redundant speaker labels at the start of the line that might still be there
      responseText = responseText
        .replace(/^(ONYX|LOGIC|ADAM)\s*:\s*/i, '')
        .trim();

      const adamMessage: SafeMessage = { 
        id: generateUniqueId('adam'),
        role: 'model', 
        parts: [{ text: responseText }],
        speaker: speaker || undefined
      };
      setMessages(prev => {
        if (prev.some(m => m.id === adamMessage.id)) return prev;
        return [...prev, adamMessage];
      });
      if (responseText) speakText(responseText, speaker || undefined);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    stopListening();
    if (micTimeoutRef.current) {
      clearTimeout(micTimeoutRef.current);
      micTimeoutRef.current = null;
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className={`fixed inset-0 z-[400] ${isSolar ? 'bg-zinc-900/60' : 'bg-black/90'} backdrop-blur-2xl flex items-center justify-center p-0 sm:p-4`}
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 30 }}
            className={`w-full h-full sm:max-w-xl sm:h-[90vh] ${isSolar ? 'bg-white' : 'bg-black'} border-t sm:border ${isSolar ? 'border-zinc-200 shadow-2xl' : 'border-white/10'} sm:rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] flex flex-col relative`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* LIVE NEURAL BACKGROUND - The Primary Immersive Layer */}
            <div className={`absolute inset-0 z-0 pointer-events-none transition-opacity duration-1000 ${isSolar ? 'opacity-100' : 'opacity-100'}`}>
               <AudioVisualizer 
                 isActive={isLoading || isSpeaking || isListening || isHandsFree} 
                 isSolar={isSolar}
               />
            </div>

            {/* HANDS-FREE HUD OVERLAY */}
            <AnimatePresence>
              {isHandsFree && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-0 left-0 right-0 z-[50] p-4 flex justify-center"
                >
                  <div className={`px-6 py-2 rounded-full border-2 flex items-center gap-3 backdrop-blur-xl shadow-2xl ${isSolar ? 'bg-black border-black text-white' : 'bg-emerald-500 border-emerald-400 text-black shadow-emerald-500/40'}`}>
                    <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase">HUD ACTIF • DITES "ONYX"</span>
                    <div className="w-12 h-1 bg-current/20 rounded-full overflow-hidden ml-2">
                       <motion.div 
                         initial={{ width: "100%" }}
                         animate={{ width: "0%" }}
                         transition={{ duration: 45, ease: "linear" }}
                         className="h-full bg-current"
                       />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* FIXED HUD HEADER - LUXURY BANNER STYLE */}
            <div className={`relative z-30 flex flex-col ${isSolar ? 'bg-white border-b-2 border-black shadow-lg' : 'bg-black/95 border-b-2 border-red-600 shadow-2xl'} group`}>
              {/* Luxury Banner Image */}
              <div className="absolute inset-0 z-0">
                <img 
                  src="https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=2670&auto=format&fit=crop" 
                  className={`w-full h-full object-cover ${isSolar ? 'opacity-5 grayscale contrast-150' : 'opacity-80 grayscale-[0.1]'}`} 
                  alt="Luxurious Golf Course"
                />
                <div className={`absolute inset-0 ${isSolar ? 'bg-white/98' : 'bg-gradient-to-b from-black/60 via-transparent to-black'}`} />
              </div>

              <div className="relative z-10 p-4 pt-10 sm:pt-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center overflow-hidden shadow-2xl ${isSolar ? 'border-black bg-white' : 'border-[#c9964a] bg-black shadow-[#c9964a]/20'}`}>
                    <img src="/logo.svg" alt="ONYX Logo" className="w-8 h-8 object-contain" />
                  </div>
                  <div>
                    <h2 className={`text-lg font-black italic uppercase tracking-tighter ${isSolar ? 'text-black' : 'text-white'}`}>ADAM <span className={isSolar ? 'text-[#856424]' : 'text-[#c9964a]'}>ONYX</span></h2>
                    <div className="flex items-center gap-2 mt-0.5">
                       <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                       <span className={`text-[8px] font-mono uppercase tracking-widest font-bold ${isSolar ? 'text-zinc-500' : 'text-[#c9964a]'}`}>Tactique Actif</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={toggleHandsFree}
                    className={`p-2.5 rounded-xl border-2 transition-all flex items-center gap-2 ${isHandsFree ? 'bg-emerald-500 border-emerald-400 text-black shadow-lg shadow-emerald-500/20' : (isSolar ? 'bg-zinc-100 border-zinc-200 text-zinc-400' : 'bg-zinc-900 border-white/10 text-white/40')}`}
                  >
                    <Mic size={16} className={isHandsFree ? 'animate-pulse' : ''} />
                    <span className="text-[8px] font-black tracking-widest hidden sm:inline">HUD</span>
                  </button>
                  <button 
                    onClick={() => setIsMuted(!isMuted)} 
                    className={`p-2.5 rounded-xl border-2 transition-all ${isMuted ? 'bg-red-500/20 border-red-500 text-red-500' : (isSolar ? 'bg-black text-white border-black shadow-lg shadow-black/20' : 'bg-[#c9964a]/20 border-[#c9964a] text-[#c9964a]')} backdrop-blur-md shadow-lg`}
                  >
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                  <button onClick={handleClose} className={`p-2.5 rounded-xl border-2 transition-colors shadow-lg ${isSolar ? 'bg-white border-zinc-950 text-black' : 'bg-zinc-800 border-white/20 text-white hover:bg-zinc-700'}`}>
                    <X size={20} strokeWidth={3} />
                  </button>
                </div>
              </div>

              {/* Tactical Pillars - More Compact */}
              <div className="relative z-10 grid grid-cols-3 gap-2 px-4 pb-4">
                 {lastScoreUpdate ? (
                   <motion.div 
                     initial={{ y: -20, opacity: 0 }} 
                     animate={{ y: 0, opacity: 1 }} 
                     className={`col-span-3 ${isSolar ? 'bg-black text-white' : 'bg-emerald-500 text-black'} p-4 rounded-2xl flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.4)]`}
                   >
                     <div className="flex items-center gap-3">
                       <Check size={20} className="stroke-[3]" />
                       <div>
                         <p className={`text-[10px] font-black uppercase tracking-widest ${isSolar ? 'text-white/40' : 'text-black/60'}`}>SCORE ENREGISTRÉ</p>
                         <p className="text-sm font-black italic tracking-tight">TROU {lastScoreUpdate.hole} : {lastScoreUpdate.strokes} COUPS / {lastScoreUpdate.putts} PUTTS</p>
                       </div>
                     </div>
                     <div className={`w-10 h-10 ${isSolar ? 'bg-white/10' : 'bg-black/20'} rounded-xl flex items-center justify-center`}>
                       <Target size={20} />
                     </div>
                   </motion.div>
                 ) : (
                    <>
                      {[
                        { id: 'COURSE', label: 'ADAM', sub: 'PARCOURS', icon: <MapIcon size={16} />, color: isSolar ? 'from-emerald-100' : 'from-emerald-500/40', mode: 'PARCOURS' as const },
                        { id: 'LOGIC', label: 'LOGIC', sub: 'STRATÉGIE', icon: <Brain size={16} />, color: isSolar ? 'from-blue-100' : 'from-blue-500/40', mode: 'STRATÉGIE' as const },
                        { id: 'TRAINING', label: 'ONYX', sub: 'ENTRAÎNEMENT', icon: <Target size={16} />, color: isSolar ? 'from-black/10' : 'from-[#c9964a]/40', mode: 'ENTRAÎNEMENT' as const },
                      ].map(mode => (
                        <button 
                          key={mode.id}
                          onClick={() => {
                            setActiveTacticalMode(mode.mode);
                            const label = mode.label;
                            setCurrentSpeaker(label as any);
                            handleSend(`[PROTOCOLE] Activation de l'unité ${label}.`);
                          }}
                          className={`flex flex-col items-center justify-center py-2.5 rounded-xl border-2 transition-all duration-500 group relative overflow-hidden ${
                            activeTacticalMode === mode.mode 
                                ? (isSolar ? 'border-black bg-white shadow-xl translate-y-[-1px]' : `border-[#c9964a] bg-gradient-to-b ${mode.color} to-zinc-900 shadow-[0_0_20px_rgba(201,150,74,0.3)]`) 
                                : (isSolar ? 'border-zinc-200 bg-zinc-50 grayscale-0 opacity-100 hover:border-zinc-400' : 'border-white/20 bg-zinc-900 opacity-60 grayscale')
                          } ${currentSpeaker === mode.label && isSpeaking ? (isSolar ? 'ring-2 ring-black scale-105' : 'ring-2 ring-[#c9964a] scale-105 shadow-[0_0_30px_#c9964a]') : ''}`}
                        >
                          {currentSpeaker === mode.label && isSpeaking && (
                            <motion.div 
                              layoutId="active-glow"
                              className={`absolute inset-0 ${isSolar ? 'bg-black/10' : 'bg-[#c9964a]/20'} animate-pulse pointer-events-none`}
                            />
                          )}
                          <div className={`absolute inset-0 ${isSolar ? 'bg-zinc-200' : 'bg-[#c9964a]/10'} translate-y-full group-hover:translate-y-0 transition-transform duration-500`} />
                          <div className={`mb-0.5 transition-colors relative z-10 ${activeTacticalMode === mode.mode ? (isSolar ? 'text-black' : 'text-[#c9964a]') : (isSolar ? 'text-black/60' : 'text-white')}`}>{mode.icon}</div>
                          <span className={`text-[10px] font-black tracking-widest relative z-10 ${activeTacticalMode === mode.mode ? (isSolar ? 'text-black' : 'text-white') : (isSolar ? 'text-black/80' : 'text-white')}`}>{mode.label}</span>
                          <span className={`text-[6px] font-bold uppercase tracking-widest relative z-10 opacity-60 ${activeTacticalMode === mode.mode ? (isSolar ? 'text-black' : 'text-white') : (isSolar ? 'text-black/60' : 'text-white')}`}>{mode.sub}</span>
                          {activeTacticalMode === mode.mode && (
                            <div className={`absolute top-0.5 right-0.5 w-1 h-1 rounded-full animate-pulse ${isSolar ? 'bg-black' : 'bg-[#c9964a]'}`} />
                          )}
                        </button>
                      ))}
                    </>
                  )}
              </div>

              {/* TACTICAL QUICK SELECTORS - FIXED BELOW PILLARS */}
              <div className="px-4 pb-3 grid grid-cols-2 gap-2 relative z-10">
                <div className="space-y-1">
                  <div className={`flex rounded-lg p-0.5 border ${isSolar ? 'bg-zinc-100/50 border-zinc-200' : 'bg-zinc-900/80 border-white/10'}`}>
                    {['AGRESSIF', 'SÉCURITÉ', 'CRÉATIF'].map(t => (
                      <button 
                        key={t}
                        onClick={() => {
                          setSelectedTactic(t as any);
                          if (playPing) playPing(1000, 'sine', 0.05);
                        }}
                        className={`flex-1 py-1 rounded-md text-[7px] font-black transition-all ${selectedTactic === t ? (isSolar ? 'bg-black text-white' : 'bg-[#c9964a] text-black') : (isSolar ? 'text-zinc-400' : 'text-white/40')}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className={`flex rounded-lg p-0.5 border ${isSolar ? 'bg-zinc-100/50 border-zinc-200' : 'bg-zinc-900/80 border-white/10'}`}>
                    {['FROID', 'FORME', 'PUR'].map(f => (
                      <button 
                        key={f}
                        onClick={() => {
                          setCurrentForm(f as any);
                          if (playPing) playPing(1200, 'sine', 0.05);
                        }}
                        className={`flex-1 py-1 rounded-md text-[7px] font-black transition-all ${currentForm === f ? (isSolar ? 'bg-red-600 text-white' : 'bg-red-600 text-white') : (isSolar ? 'text-zinc-500' : 'text-white/40')}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* SCROLLING CONVERSATION */}
            <div ref={scrollRef} className={`relative z-20 flex-1 overflow-y-auto px-6 py-6 scrollbar-hide ${isSolar ? 'bg-zinc-50/50' : 'bg-transparent'}`}>
              
              {messages.map((msg) => (
                <motion.div key={msg.id} initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-6`}>
                  <div className={`max-w-[85%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      <div className={`inline-block p-3 rounded-xl text-[14px] font-bold leading-relaxed shadow-2xl ${
                        msg.role === 'user' 
                          ? (isSolar ? 'bg-white border-2 border-zinc-950 text-black shadow-zinc-200' : 'bg-zinc-800 text-white rounded-tr-none border-2 border-white/20 shadow-black/50') 
                          : (isSolar 
                              ? `bg-white text-black italic border-2 shadow-xl ${
                                   msg.speaker === 'ONYX' 
                                    ? 'border-zinc-950 border-double' 
                                    : msg.speaker === 'LOGIC' 
                                      ? 'border-blue-600' 
                                      : 'border-emerald-600'
                                 }`
                              : `bg-black text-white italic border-2 rounded-tl-none ring-2 shadow-2xl ${
                                msg.speaker === 'ONYX' 
                                  ? 'border-[#c9964a] ring-[#c9964a]/20 shadow-[#c9964a]/20' 
                                  : msg.speaker === 'LOGIC' 
                                    ? 'border-blue-500 ring-blue-500/20 shadow-blue-500/20' 
                                    : 'border-emerald-500 ring-emerald-500/20 shadow-emerald-500/20'
                                }`)
                      }`}>
                        {msg.parts.map((part: any, pIdx) => {
                          if ('text' in part) return (
                            <div key={pIdx} className="markdown-body prose prose-invert max-w-none prose-p:leading-relaxed prose-sm">
                              <ReactMarkdown>{part.text}</ReactMarkdown>
                            </div>
                          );
                          if ('inlineData' in part) return (
                            <div key={pIdx} className={`mt-4 rounded-xl overflow-hidden border-2 ${isSolar ? 'border-zinc-950' : 'border-white/30'}`}>
                               <img src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} className="w-full max-h-64 object-cover" alt="Data" />
                            </div>
                          );
                          return null;
                        })}
                      </div>
                    <div className="mt-2 flex items-center gap-2 px-1">
                      <span className={`text-[9px] font-black uppercase tracking-widest ${isSolar ? 'text-zinc-400' : 'text-white/60'}`}>
                        {msg.role === 'user' ? 'Moi' : (msg.speaker || 'Adam Mentor')}
                      </span>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        msg.role === 'user' 
                          ? (isSolar ? 'bg-zinc-300' : 'bg-white/40') 
                          : msg.speaker === 'ONYX' 
                            ? (isSolar ? 'bg-black' : 'bg-[#c9964a]') 
                            : msg.speaker === 'LOGIC' 
                              ? 'bg-blue-500' 
                              : 'bg-emerald-500'
                      }`} />
                    </div>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <div className="flex gap-3 animate-pulse">
                   <div className={`p-4 rounded-2xl border text-[11px] font-mono uppercase tracking-widest ${isSolar ? 'bg-white border-zinc-950 text-black font-black' : 'bg-black/40 border-[#c9964a]/20 text-[#c9964a]'}`}>
                     ANALYZING TELEMETRY...
                   </div>
                </div>
              )}
            </div>

            {/* TACTICAL INPUT CONSOLE - Robust for Sunlight */}
            <div className={`relative z-30 p-4 pb-6 border-t-2 shadow-[0_-10px_40px_rgba(0,0,0,0.4)] ${isSolar ? 'bg-white border-zinc-950' : 'bg-black border-red-600'}`}>
               {attachedImage && (
                 <motion.div 
                   initial={{ y: 20, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   className="mb-3 relative group"
                 >
                   <div className={`relative rounded-xl overflow-hidden border-2 shadow-2xl ${isSolar ? 'bg-zinc-100 border-zinc-950' : 'bg-zinc-900 border-[#c9964a] shadow-[0_0_30px_rgba(201,150,74,0.3)]'}`}>
                     <img 
                       src={`data:${attachedImage.mimeType};base64,${attachedImage.data}`} 
                       className={`w-full h-32 object-cover ${isSolar ? 'opacity-90' : 'opacity-60'}`} 
                       alt="Capture"
                     />
                     
                     {/* ANALYSIS OVERLAY (ONLY IN TRAINING MODE) */}
                     {activeTacticalMode === 'ENTRAÎNEMENT' && (
                       <div className="absolute inset-0 pointer-events-none">
                         {/* Scanning Laser Line */}
                         <motion.div 
                           animate={{ top: ['0%', '100%', '0%'] }}
                           transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                           className={`absolute left-0 right-0 h-0.5 z-20 ${isSolar ? 'bg-black shadow-[0_0_10px_rgba(0,0,0,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_#10b981]'}`}
                         />
                         
                         {/* AR Vector Grid */}
                         <div className="absolute inset-0 flex items-center justify-center">
                           <div className="grid grid-cols-6 grid-rows-4 w-full h-full opacity-20">
                             {Array.from({ length: 24 }).map((_, i) => (
                               <div key={i} className={`border-[0.5px] ${isSolar ? 'border-black' : 'border-emerald-500/50'}`} />
                             ))}
                           </div>
                         </div>

                         {/* Dynamic Targets */}
                         <motion.div 
                           animate={{ scale: [1, 1.2, 1] }} 
                           transition={{ duration: 2, repeat: Infinity }}
                           className={`absolute top-1/4 left-1/3 w-6 h-6 border-2 rounded-full flex items-center justify-center ${isSolar ? 'border-black' : 'border-[#c9964a]'}`}
                         >
                           <div className={`w-1 h-1 rounded-full ${isSolar ? 'bg-black' : 'bg-[#c9964a]'}`} />
                         </motion.div>

                         <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                           <div className={`backdrop-blur-md px-3 py-2 rounded-lg border ${isSolar ? 'bg-white/80 border-black' : 'bg-black/60 border-emerald-500/30'}`}>
                             <p className={`text-[8px] font-black uppercase ${isSolar ? 'text-black' : 'text-emerald-500'}`}>Surface Analytics</p>
                             <p className={`text-[10px] font-mono ${isSolar ? 'text-black' : 'text-white'}`}>VITESSE : 10.5 STIMP</p>
                           </div>
                           <div className="text-right">
                             <Sparkles size={16} className={`${isSolar ? 'text-black' : 'text-emerald-500'} mb-1 ml-auto animate-pulse`} />
                             <p className={`text-[10px] font-black italic ${isSolar ? 'text-black' : 'text-white'}`}>ONYX VISION ACTIVE</p>
                           </div>
                         </div>
                       </div>
                     )}

                     <button 
                       onClick={() => setAttachedImage(null)} 
                       className="absolute top-4 right-4 bg-red-600 text-white rounded-xl p-2 shadow-xl border-2 border-white/20 hover:scale-110 active:scale-95 transition-transform"
                     >
                       <X size={20} />
                     </button>
                   </div>
                 </motion.div>
               )}
               
               <div className="flex items-center gap-2">
                 <div className="relative">
                   <motion.button 
                     whileTap={{ scale: 0.9 }}
                     onClick={triggerMic}
                     disabled={isLoading || isSpeaking}
                     className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-2xl border-2 ${isHandsFree ? 'bg-emerald-500 border-emerald-400 text-black animate-pulse' : isListening ? 'bg-red-600 border-white text-white shadow-red-600/40' : (isSolar ? 'bg-black border-black text-white shadow-zinc-300' : 'bg-[#c9964a] border-[#c9964a]/50 text-black shadow-[#c9964a]/20')}`}
                   >
                     {isHandsFree ? <Brain size={22} /> : <Mic size={22} />}
                   </motion.button>
                   
                   <AnimatePresence>
                     {error && (
                       <motion.div 
                         initial={{ opacity: 0, scale: 0.8, y: 10 }}
                         animate={{ opacity: 1, scale: 1, y: 0 }}
                         exit={{ opacity: 0, scale: 0.8, y: 10 }}
                         className="absolute bottom-full left-0 mb-4 w-60 bg-red-600 text-white text-[10px] font-black p-3 rounded-xl shadow-2xl z-50 border-2 border-white/20"
                       >
                         <div className="flex items-center gap-2">
                           <VolumeX size={12} />
                           <span>{error}</span>
                         </div>
                         <div className="absolute top-full left-6 w-3 h-3 bg-red-600 rotate-45 -translate-y-1.5 border-r border-b border-white/10" />
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>
                 
                 <div className={`flex-1 flex items-center gap-2 border-2 rounded-xl px-3 group transition-all shadow-inner h-12 ${isSolar ? 'bg-white border-zinc-950 focus-within:ring-2 ring-black' : 'bg-zinc-900 border-white/10 focus-within:border-red-600/80 shadow-inner'}`}>
                   <motion.button 
                     whileHover={{ scale: 1.1 }}
                     whileTap={{ scale: 0.9 }}
                     onClick={() => fileInputRef.current?.click()} 
                     className={`relative p-1.5 rounded-lg transition-all ${activeTacticalMode === 'ENTRAÎNEMENT' ? (isSolar ? 'text-black' : 'text-emerald-500') : (isSolar ? 'text-zinc-300' : 'text-white')}`}
                   >
                     <Camera size={20} />
                     {activeTacticalMode === 'ENTRAÎNEMENT' && (
                       <div className={`absolute inset-0 border-2 rounded-xl animate-ping opacity-50 ${isSolar ? 'border-black' : 'border-emerald-500'}`} />
                     )}
                   </motion.button>
                   <input
                     ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange}
                   />
                   <input 
                     type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => {
                       if (e.key === 'Enter' || e.keyCode === 13) {
                         e.preventDefault();
                         handleSend();
                       }
                     }}
                     autoComplete="off"
                     placeholder="COMMANDE..." 
                     className={`flex-1 bg-transparent py-2 text-sm font-bold placeholder:text-zinc-400 focus:outline-none uppercase ${isSolar ? 'text-black' : 'text-white'}`}
                   />
                   
                   <button 
                     onClick={() => handleSend()} 
                     disabled={!input.trim() && !attachedImage}
                     className={`p-2 rounded-lg transition-all flex items-center justify-center ${
                       (!input.trim() && !attachedImage) 
                         ? 'opacity-20 grayscale' 
                         : (isSolar ? 'bg-black text-white shadow-lg' : 'bg-red-600 text-white shadow-lg shadow-red-600/20')
                     }`}
                   >
                     <Send size={18} strokeWidth={3} className={(!input.trim() && !attachedImage) ? '' : 'animate-pulse'} />
                   </button>
                 </div>
               </div>

               {/* BOTTOM VALIDATION BAR - MOVED HERE BELOW COMMANDS AS REQUESTED */}
               {!isLoading && (
                 <motion.div 
                   initial={{ y: 20, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   className="mt-4"
                 >
                   <button 
                     onClick={() => (input.trim() || attachedImage) ? handleSend() : handleSend(`[COMMANDE TACTIQUE] ${selectedTactic} / ${currentForm}.`)}
                     className={`w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 border-2 bg-red-600 text-white border-red-500 shadow-xl shadow-red-600/40 hover:bg-red-700 hover:scale-[1.01]`}
                   >
                     <Check size={20} strokeWidth={4} />
                     <span>{(input.trim() || attachedImage) ? "VALIDER LA COMMANDE" : "VALIDER LA TACTIQUE"}</span>
                   </button>
                 </motion.div>
               )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
