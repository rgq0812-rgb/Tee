import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, BookOpen, Sparkles, User, Loader2, Volume2, VolumeX, Mic, Brain } from 'lucide-react';
import { chatWithAdam, generateSpeech, isSpeechRecognitionSupported, speakWithBrowser } from '../services/geminiService';
import AudioVisualizer from './AudioVisualizer';
import { useAmbientSound } from '../hooks/use-ambient-sound';
import { playRawPcm } from '../lib/audioUtils';
import { useVoiceInput } from '../hooks/useVoiceInput';

interface SafeMessage {
  id: string;
  role: 'user' | 'model';
  parts: [{ text: string }];
}

interface AdamMentorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCourse?: any;
  currentHole?: number;
}

export default function AdamMentorModal({ isOpen, onClose, selectedCourse, currentHole }: AdamMentorModalProps) {
  const { playPing } = useAmbientSound();
  const [messages, setMessages] = useState<SafeMessage[]>([
    {
      id: 'msg-init',
      role: 'model',
      parts: [{ text: "Bonjour. Je suis Adam. Je vous écoute." }]
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('onyx_voice') === 'false');
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentAudioSource = useRef<AudioBufferSourceNode | null>(null);
  const micTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use the new voice input hook
  const { isListening, startListening, stopListening } = useVoiceInput((text) => {
    if (micTimeoutRef.current) {
      clearTimeout(micTimeoutRef.current);
      micTimeoutRef.current = null;
    }
    if (playPing) playPing(800, 'sine', 0.05); // "Received" beep
    handleSend(text);
  });

  const startAutoMic = useCallback(() => {
    if (micTimeoutRef.current) clearTimeout(micTimeoutRef.current);
    
    // On force le mode auto-restart pour que le micro ne se coupe pas s'il y a un silence
    startListening(true);
    
    // On programme la coupure dans 20 secondes pile
    micTimeoutRef.current = setTimeout(() => {
      stopListening();
      micTimeoutRef.current = null;
    }, 20000);
  }, [startListening, stopListening]);

  useEffect(() => {
    if ('mediaSession' in navigator && isOpen) {
      const setupMediaSession = () => {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'Adam AI Mentoring',
          artist: 'Onyx Elite',
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

    // Clearer tactical "listening" beep
    if (playPing) playPing(1200, 'sine', 0.05);

    // Démarrage en mode Continu pour le chat fluide
    startListening(true);

    // On programme aussi la coupure automatique pour le déclenchement manuel
    micTimeoutRef.current = setTimeout(() => {
      stopListening();
      micTimeoutRef.current = null;
    }, 20000);
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading, isSpeaking, isListening]);

  // Handle initial greeting
  useEffect(() => {
    if (isOpen && messages.length === 1 && !isMuted) {
      speakText(messages[0].parts[0].text);
    }
  }, [isOpen]);

  const wasListeningRef = useRef(false);

  const speakText = async (text: string) => {
    if (isMuted) return;
    
    // Pause listening while Adam speaks
    if (isListening) {
      wasListeningRef.current = true;
      stopListening();
    }

    setIsSpeaking(true);
    try {
      const result = await generateSpeech(text);
      
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

  const handleSend = async (textOverride?: string) => {
    if (micTimeoutRef.current) {
      clearTimeout(micTimeoutRef.current);
      micTimeoutRef.current = null;
    }
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    if (playPing) playPing(600, 'sine', 0.03); // "Sent" feedback
    const userMessage: SafeMessage = { 
      id: `user-${Date.now()}-${Math.random()}`,
      role: 'user', 
      parts: [{ text: textToSend }] 
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Cast the history for the API which expects Message[]
      const historyForApi = [...messages, userMessage].map(m => ({ role: m.role, parts: m.parts }));
      const responseText = await chatWithAdam(historyForApi, selectedCourse, currentHole);
      const adamMessage: SafeMessage = { 
        id: `adam-${Date.now()}-${Math.random()}`,
        role: 'model', 
        parts: [{ text: responseText || "..." }] 
      };
      setMessages(prev => [...prev, adamMessage]);
      if (responseText) speakText(responseText);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-0 sm:p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }}
            className="w-full h-full sm:h-auto sm:max-w-xl bg-gradient-to-b from-[#1a1a1a] to-black border-t sm:border border-white/10 sm:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col relative"
          >
            {/* Cinematic 8k Blurred Golf Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
               <img 
                 src="https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=2670&auto=format&fit=crop" 
                 className="w-full h-full object-cover scale-110 blur-xl opacity-20" 
                 alt="Golf Course Background"
               />
               <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-[#0a1a0f]" />
               {/* Light Glows */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-[#c9964a]/5 blur-[100px] rounded-full" />
               <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#1a4d2e]/10 blur-[150px] rounded-full" />
            </div>

            <div className="relative z-10 p-8 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[#c9964a] to-[#8a652f] rounded-2xl flex items-center justify-center text-black shadow-lg shadow-[#c9964a]/20">
                  <Brain size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">ADAM LIVE</h2>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.3em]">Neural Mentoring System</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsMuted(!isMuted)} className={`p-3 rounded-2xl border transition-all ${isMuted ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-white/5 border-white/10 text-white/40'}`}>
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <button onClick={onClose} className="p-3 text-white/40 hover:text-white"><X size={28} /></button>
              </div>
            </div>

            <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto px-8 py-10 space-y-8 scrollbar-hide">
              {messages.map((msg) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse text-right' : ''}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-white/10 text-white/40' : 'bg-[#c9964a]/20 text-[#c9964a]'}`}>
                      {msg.role === 'user' ? <Mic size={18} /> : <Sparkles size={18} />}
                    </div>
                    <div className={`p-5 rounded-[1.5rem] text-[15px] leading-relaxed backdrop-blur-2xl ${msg.role === 'user' ? 'bg-white/5 text-white border border-white/10 rounded-tr-none' : 'bg-[#c9964a]/5 text-[#c9964a] border border-[#c9964a]/20 italic font-medium rounded-tl-none'}`}>
                      {msg.parts[0].text}
                    </div>
                  </div>
                </motion.div>
              ))}
              {(isLoading || isSpeaking || isListening) && <div className="flex justify-center py-4"><AudioVisualizer isActive={true} /></div>}
            </div>

            <div className="relative z-10 p-8 pb-safe bg-black/40 border-t border-white/5 backdrop-blur-3xl">
              <div className="flex items-center gap-4">
                <motion.button 
                  whileTap={{ scale: 0.9 }} onClick={triggerMic} disabled={isSpeaking || isLoading}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl ${isListening ? 'bg-red-500 animate-pulse shadow-red-500/20' : 'bg-[#c9964a] shadow-[#c9964a]/20'} text-black`}
                >
                  <Mic size={28} />
                </motion.button>
                <div className="flex-1 relative">
                  <input
                    type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Posez votre question..." className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] px-6 py-5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#c9964a]/50 transition-all font-medium"
                  />
                  {input.trim() && (
                    <button onClick={() => handleSend()} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#c9964a] text-black rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all"><Send size={18} /></button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
