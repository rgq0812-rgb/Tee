import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, BookOpen, Sparkles, User, Loader2, Volume2, VolumeX, Mic, Brain } from 'lucide-react';
import { chatWithAdam, generateSpeech, startListening, isSpeechRecognitionSupported } from '../services/geminiService';
import AudioVisualizer from './AudioVisualizer';
import { useAmbientSound } from '../hooks/use-ambient-sound';
import { playRawPcm } from '../lib/audioUtils';

interface Message {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

interface AdamMentorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdamMentorModal({ isOpen, onClose }: AdamMentorModalProps) {
  const { playPing } = useAmbientSound();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      parts: [{ text: "Bienvenue à l'Académie Elite. Je suis Adam. J'écoute tes requêtes tactiques ou tes questions sur le jeu. Tapote tes écouteurs pour me parler." }]
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('onyx_voice') === 'false');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContext = useRef<AudioContext | null>(null);

  useEffect(() => {
    if ('mediaSession' in navigator && isOpen) {
      const audio = new Audio();
      audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
      audio.loop = true;

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
      audio.play().catch(() => {});
    }
  }, [isOpen]);

  const triggerMic = () => {
    if (isListening || isSpeaking || isLoading) return;
    
    if (!isSpeechRecognitionSupported()) {
      alert("La reconnaissance vocale n'est pas supportée sur ce navigateur. Essaie sur Chrome ou Safari.");
      return;
    }

    if (playPing) playPing(1000, 'sine', 0.1);
    setIsListening(true);
    startListening(
      (text) => handleSend(text),
      () => setIsListening(false),
      (error) => {
        setIsListening(false);
        if (error === 'not-allowed') {
          alert("Microphone refusé. Active l'accès micro dans tes réglages.");
        }
      }
    );
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

  const speakText = async (text: string) => {
    if (isMuted) return;
    setIsSpeaking(true);
    try {
      const base64Audio = await generateSpeech(text);
      if (base64Audio) {
        const source = await playRawPcm(base64Audio);
        if (source) {
          source.onended = () => setIsSpeaking(false);
        } else {
          setIsSpeaking(false);
        }
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error(error);
      setIsSpeaking(false);
    }
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', parts: [{ text: textToSend }] };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await chatWithAdam([...messages, userMessage]);
      const adamMessage: Message = { role: 'model', parts: [{ text: responseText || "..." }] };
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
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.3em]">Neural Mentoring Sysem</p>
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
              {messages.map((msg, i) => (
                <motion.div key={`adam-msg-${i}`} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
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
                  whileTap={{ scale: 0.9 }} onClick={triggerMic} disabled={isListening || isSpeaking || isLoading}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl ${isListening ? 'bg-red-500 animate-pulse shadow-red-500/20' : 'bg-[#c9964a] shadow-[#c9964a]/20'} text-black`}
                >
                  <Mic size={28} />
                </motion.button>
                <div className="flex-1 relative">
                  <input
                    type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Pose ta question..." className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] px-6 py-5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#c9964a]/50 transition-all font-medium"
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
