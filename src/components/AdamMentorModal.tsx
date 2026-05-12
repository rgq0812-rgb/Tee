import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { X, Send, BookOpen, Sparkles, User, Loader2, Volume2, VolumeX, Mic, Brain, Camera, Paperclip, Target, Map as MapIcon, Check, Zap } from 'lucide-react';
import { chatWithAdam, generateSpeech, isSpeechRecognitionSupported, speakWithBrowser } from '../services/geminiService';
import { ADAM_AVATAR_URL } from '../constants';
import AudioVisualizer from './AudioVisualizer';
import { useAmbientSound } from '../hooks/use-ambient-sound';
import { playRawPcm } from '../lib/audioUtils';
import { useLiveChat, type SafeMessage } from '../hooks/useLiveChat';

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
  onSetCurrentHole?: (hole: number) => void;
  onOpenScanner?: () => void;
  selectedTee: 'black' | 'white' | 'yellow' | 'blue' | 'red';
}

import { resizeImage } from '../utils/imageProcessing';

export default function AdamMentorModal({ isOpen, onClose, selectedCourse, currentHole, scorecard, arsenal, initialMessage, handicap = 18, playerForm = 'forme', displayMode, onUpdateScore, onSetCurrentHole, onOpenScanner, selectedTee }: AdamMentorModalProps) {
  const { playPing } = useAmbientSound();
  const [activeTacticalMode, setActiveTacticalMode] = useState<'PARCOURS' | 'STRATÉGIE' | 'ENTRAÎNEMENT'>('PARCOURS');
  const [selectedTactic, setSelectedTactic] = useState<'AGRESSIF' | 'SÉCURITÉ' | 'CRÉATIF'>('SÉCURITÉ');
  const [currentForm, setCurrentForm] = useState<'FROID' | 'FORME' | 'PUR'>('FORME');
  const [userLocation, setUserLocation] = useState<GeolocationPosition | null>(null);
  const [isHandsFree, setIsHandsFree] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const wakeWordDetectedRef = useRef(false);
  const handsFreeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScoreUpdateRef = useRef<{ hole: number, strokes: number, putts: number } | null>(null);
  const [lastScoreUpdate, setLastScoreUpdate] = useState<{ hole: number, strokes: number, putts: number } | null>(null);

  const {
    messages, setMessages, input, setInput, attachedImage, setAttachedImage,
    isLoading, isListening, isSpeaking, isMuted, setIsMuted, lastTranscript,
    handleSend: baseHandleSend, toggleListening, startListening, stopListening, speakText, currentSpeaker, setCurrentSpeaker, voiceError,
    repeatLastAdvice, lastAdvice
  } = useLiveChat({
    initialMessage: initialMessage,
    initialSpeaker: activeTacticalMode === 'ENTRAÎNEMENT' ? 'ONYX' : activeTacticalMode === 'STRATÉGIE' ? 'LOGIC' : 'ADAM',
    silenceDelay: isHandsFree ? 4000 : 2500,
    wakeWords: [],
    autoRestartMic: true,
    courseContext: {
      selectedCourse,
      currentHole,
      scorecard,
      arsenal,
      handicap,
      playerForm: currentForm,
      selectedTee,
      activeTacticalMode,
      selectedTactic
    },
    onToolCall: (toolCalls) => {
      toolCalls.forEach((call: any) => {
        if (call.name === 'update_score' && onUpdateScore) {
          const { hole_number, strokes, putts } = call.args;
          onUpdateScore(hole_number, strokes, putts);
          setLastScoreUpdate({ hole: hole_number, strokes, putts });
          setTimeout(() => setLastScoreUpdate(null), 4000);
          if (playPing) playPing(1000, 'sine', 0.1);
        } else if (call.name === 'set_current_hole' && onSetCurrentHole) {
          const { hole_number } = call.args;
          onSetCurrentHole(hole_number);
          if (playPing) playPing(880, 'sine', 0.05);
        }
      });
    }
  });

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

  useEffect(() => {
    if (isOpen && currentHole && initializedRef.current) {
      // If hole changes, we could potentially inject a context reminder 
      // but the chatWithAdam call already uses the fresh currentHole.
      // However, it's good to clear any "Old Hole" mental state from the AI.
      console.log(`[ONYX] Context sync: hole ${currentHole}`);
    }
  }, [currentHole, isOpen]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentAudioSource = useRef<AudioBufferSourceNode | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsOptimizing(true);
    const reader = new FileReader();
    reader.onload = async (readerEvent) => {
      try {
        const fullBase64 = (readerEvent.target?.result as string).split(',')[1];
        // Resize image to 1024px max to save memory and avoid "Insufficient Memory" errors
        const optimizedBase64 = await resizeImage(fullBase64, 1024);
        setAttachedImage({ mimeType: 'image/jpeg', data: optimizedBase64 });
        if (playPing) playPing(1500, 'sine', 0.1);
      } catch (err) {
        console.error("Optimization error:", err);
      } finally {
        setIsOptimizing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerMic = () => {
    if (isListening) {
      stopListening();
      return;
    }

    if (isLoading) return;

    // Interrupt Adam if he is speaking
    if (isSpeaking && currentAudioSource.current) {
      try {
        currentAudioSource.current.stop();
      } catch (e) {}
    }
    
    if (isHandsFree) {
        toggleHandsFree();
        return;
    }

    if (playPing) playPing(1200, 'sine', 0.05);
    toggleListening();
  };

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
      startListening(true, 45000);
      if (playPing) playPing(1500, 'sine', 0.1);
      
      if (handsFreeTimeoutRef.current) clearTimeout(handsFreeTimeoutRef.current);
      handsFreeTimeoutRef.current = setTimeout(() => {
        setIsHandsFree(false);
        stopListening();
        if (playPing) playPing(400, 'sine', 0.05);
      }, 45000);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((position) => {
          setUserLocation(position);
        }, (err) => console.log("Geolocation error:", err));
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading, isSpeaking, isListening]);

  const handleSend = async (textOverride?: string) => {
    let textToSend = textOverride || input;
    if (!textToSend.trim() && !attachedImage) return;

    if (isHandsFree) {
      textToSend = `[AUDIO HUD MODE: RÉPONSE CHIRURGICALE MAX 10 MOTS] ${textToSend}`;
    }

    if (userLocation) {
        textToSend = `[DATA GPS: ${userLocation.coords.latitude.toFixed(5)},${userLocation.coords.longitude.toFixed(5)}] ${textToSend}`;
    }

    baseHandleSend(textToSend);
  };

  const handleClose = () => {
    stopListening();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className={`fixed inset-0 z-[400] ${isSolar ? 'bg-zinc-900/60' : 'bg-black/40'} backdrop-blur-3xl flex items-center justify-center p-0 sm:p-4`}
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 30 }}
            className={`w-full h-full sm:max-w-xl sm:h-[90vh] ${isSolar ? 'bg-white' : 'bg-black'} border-t sm:border ${isSolar ? 'border-zinc-200 shadow-2xl' : 'border-white/10'} sm:rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] flex flex-col relative`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`absolute inset-0 z-0 pointer-events-none transition-opacity duration-1000 ${isSolar ? 'opacity-100' : 'opacity-100'}`}>
               <AudioVisualizer 
                 isActive={isLoading || isSpeaking || isListening} 
                 mode={isLoading ? 'thinking' : isSpeaking ? 'speaking' : isListening ? 'listening' : 'idle'}
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
            <div className={`relative z-30 flex flex-col ${isSolar ? 'bg-white border-b-2 border-black shadow-lg' : 'bg-black/95 border-b-2 border-zinc-800 shadow-2xl'} group`}>
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
                    <img src="/icon-192.png" alt="ONYX Logo" className="w-8 h-8 object-contain" />
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
                        { id: 'COURSE', label: 'ADAM', sub: 'PARCOURS', icon: <MapIcon size={16} />, color: isSolar ? 'from-zinc-100' : 'from-white/10', mode: 'PARCOURS' as const },
                        { id: 'LOGIC', label: 'LOGIC', sub: 'STRATÉGIE', icon: <Brain size={16} />, color: isSolar ? 'from-zinc-200' : 'from-zinc-500/20', mode: 'STRATÉGIE' as const },
                        { id: 'TRAINING', label: 'ONYX', sub: 'ENTRAÎNEMENT', icon: <Target size={16} />, color: isSolar ? 'from-[#c9964a]/10' : 'from-[#c9964a]/20', mode: 'ENTRAÎNEMENT' as const },
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
                        className={`flex-1 py-1 rounded-md text-[7px] font-black transition-all ${currentForm === f ? (isSolar ? 'bg-black text-white' : 'bg-[#c9964a] text-black') : (isSolar ? 'text-zinc-500' : 'text-white/40')}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* HUD Commands & Power Info */}
              <div className="px-4 pb-4 space-y-3 relative z-10">
                <div className="flex gap-4">
                  <div className="flex-1 space-y-4">
                    <div className={`p-4 rounded-3xl border ${isSolar ? 'bg-zinc-50 border-zinc-200 shadow-md' : 'bg-white/5 border-white/10 backdrop-blur-xl'}`}>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-60">Commandes HUD Actives</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { cmd: 'Hey Tee', desc: 'Réveil Onyx' },
                          { cmd: 'Aide moi', desc: 'Conseil survie' },
                          { cmd: 'Club', desc: 'Calcul distance' },
                          { cmd: 'Tactique', desc: 'Analyse risque' },
                          { cmd: 'Par/Birdie', desc: 'Score rapide' },
                          { cmd: 'Suivant', desc: 'Coup suivant' }
                        ].map(c => (
                          <div key={c.cmd} className="flex flex-col">
                            <span className={`text-[10px] font-bold ${isSolar ? 'text-black' : 'text-[#c9964a]'}`}>{c.cmd}</span>
                            <span className="text-[8px] opacity-40 uppercase font-black">{c.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className={`w-32 p-4 rounded-3xl border flex flex-col items-center justify-center gap-1 ${isSolar ? 'bg-zinc-50 border-zinc-200' : 'bg-black/40 border-white/5 shadow-inner'}`}>
                    <Zap size={16} className="text-[#c9964a] mb-2 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#c9964a]">ONYX Power</span>
                    <span className={`text-[14px] font-black ${isSolar ? 'text-black' : 'text-white'}`}>OPTIMISÉ</span>
                    <span className="text-[8px] opacity-40 uppercase font-black text-center mt-2">Dimming auto</span>
                  </div>
                </div>

                <div className={`flex items-center gap-2 p-2 px-4 rounded-full ${isSolar ? 'bg-zinc-100' : 'bg-[#c9964a]/10'} border ${isSolar ? 'border-zinc-200' : 'border-[#c9964a]/20'}`}>
                  <Sparkles size={12} className="text-[#c9964a]" />
                  <p className={`text-[9px] font-bold italic ${isSolar ? 'text-zinc-600' : 'text-[#c9964a]/80'}`}>
                    "Hey Tee, quel est mon club pour 145m ?"
                  </p>
                </div>
              </div>

            </div>

            {/* SCROLLING CONVERSATION */}
            <div ref={scrollRef} className={`relative z-20 flex-1 overflow-y-auto px-6 py-6 scrollbar-hide ${isSolar ? 'bg-zinc-50/50' : 'bg-transparent'}`}>
              
              {messages.slice(-10).map((msg) => (
                <motion.div key={msg.id} initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-6`}>
                  <div className={`max-w-[85%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      <div className={`inline-block p-4 rounded-2xl text-[14px] font-medium leading-relaxed shadow-2xl ${
                        msg.role === 'user' 
                          ? (isSolar ? 'bg-black text-white' : 'bg-white/10 text-white rounded-tr-none border border-white/20 backdrop-blur-md') 
                          : (isSolar 
                              ? `bg-white text-black italic border shadow-xl ${
                                   msg.speaker === 'ONYX' 
                                    ? 'border-[#c9964a]' 
                                    : 'border-zinc-950'
                                 }`
                              : `bg-black text-white italic border rounded-tl-none shadow-[0_10px_40px_rgba(0,0,0,0.8)] ${
                                msg.speaker === 'ONYX' 
                                  ? 'border-[#c9964a]/60 ring-1 ring-[#c9964a]/10 shadow-[#c9964a]/5' 
                                  : msg.speaker === 'LOGIC' 
                                    ? 'border-zinc-700/50 ring-1 ring-zinc-700/10 shadow-zinc-700/5' 
                                    : 'border-white/30 ring-1 ring-white/5 shadow-white/5'
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
                              ? 'bg-zinc-500' 
                              : 'bg-white'
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
            <div className={`relative z-30 p-4 pb-6 border-t border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.4)] ${isSolar ? 'bg-white border-zinc-950' : 'bg-[#0a0a0a]'}`}>
               
               {/* Live Transcription HUD */}
               <AnimatePresence>
                 {(isListening || (lastTranscript && !isLoading)) && (
                   <motion.div 
                     initial={{ opacity: 0, y: 10, scale: 0.95 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: 10, scale: 0.95 }}
                     className={`mb-4 p-4 rounded-2xl border-2 flex flex-col gap-1 items-center justify-center text-center shadow-2xl relative overflow-hidden ${isSolar ? 'bg-zinc-100 border-zinc-950' : 'bg-zinc-900 border-[#c9964a]/30'}`}
                   >
                     {isListening && (
                       <div className="absolute inset-0 opacity-10 pointer-events-none">
                         <AudioVisualizer isActive={true} isSolar={isSolar} />
                       </div>
                     )}
                     <span className={`text-[8px] font-black uppercase tracking-[0.4em] ${isSolar ? 'text-black/40' : 'text-[#c9964a]/50'}`}>
                       {isListening ? "ADAM À L'ÉCOUTE" : "VOIX DÉTECTÉE"}
                     </span>
                     <div className={`text-sm font-medium italic ${isSolar ? 'text-black' : 'text-white'} line-clamp-2`}>
                       {lastTranscript || "Parlez maintenant..."}
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>

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
                 <AnimatePresence>
                   {lastAdvice && (
                     <motion.button
                       initial={{ opacity: 0, x: -10 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0, x: -10 }}
                       whileTap={{ scale: 0.9 }}
                       onClick={repeatLastAdvice}
                       className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all border-2 ${isSolar ? 'bg-white border-black text-black' : 'bg-black/40 border-[#c9964a]/30 text-[#c9964a]'}`}
                     >
                       <Volume2 size={22} className={isSpeaking ? 'animate-pulse' : ''} />
                     </motion.button>
                   )}
                 </AnimatePresence>

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
                     {voiceError && (
                       <motion.div 
                         initial={{ opacity: 0, scale: 0.8, y: 10 }}
                         animate={{ opacity: 1, scale: 1, y: 0 }}
                         exit={{ opacity: 0, scale: 0.8, y: 10 }}
                         className="absolute bottom-full left-0 mb-4 w-60 bg-zinc-900 text-[#c9964a] text-[10px] font-black p-3 rounded-xl shadow-2xl z-50 border border-[#c9964a]/30"
                       >
                         <div className="flex items-center gap-2">
                            <VolumeX size={12} />
                            <span>{voiceError}</span>
                         </div>
                         <div className="absolute top-full left-6 w-3 h-3 bg-red-600 rotate-45 -translate-y-1.5 border-r border-b border-white/10" />
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>
                 
                 <div className={`flex-1 flex items-center gap-2 border-2 rounded-xl px-3 group transition-all shadow-inner h-12 ${isSolar ? 'bg-white border-zinc-950 focus-within:ring-2 ring-black' : 'bg-zinc-900 border-white/10 focus-within:border-[#c9964a]/50 shadow-inner'}`}>
                   <motion.button 
                     whileHover={{ scale: 1.1 }}
                     whileTap={{ scale: 0.9 }}
                     onClick={() => {
                       if (activeTacticalMode === 'ENTRAÎNEMENT' && onOpenScanner) {
                         onOpenScanner();
                       } else {
                         fileInputRef.current?.click();
                       }
                     }} 
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
                         : (isSolar ? 'bg-black text-white shadow-lg' : 'bg-[#c9964a] text-black shadow-lg shadow-[#c9964a]/20')
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
                     className={`w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 border border-[#c9964a]/50 ${isSolar ? 'bg-black text-white' : 'bg-gradient-to-r from-[#c9964a] via-[#f5e6d3] to-[#c9964a] text-zinc-950 shadow-[0_0_30px_rgba(201,150,74,0.3)]'} hover:scale-[1.01] overflow-hidden relative group`}
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
