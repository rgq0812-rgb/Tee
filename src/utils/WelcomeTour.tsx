import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Shield, Zap, Target, Award, Volume2, VolumeX, Brain, Share2 } from 'lucide-react';

const SLIDES = [
  {
    id: 'hud',
    title: "VOTRE HUD TACTIQUE",
    subtitle: "VISER & ANALYSER",
    description: "Visez sur la carte satellite. ONYX calcule la distance au drapeau.",
    accent: "#c9964a",
    icon: <Target className="w-8 h-8 text-[#c9964a]" />,
    gradient: "from-black via-[#0a0a0a] to-[#1a1a0a]",
    bg: "https://images.unsplash.com/photo-1592919016322-309a473e6d6a?q=80&w=2670&auto=format&fit=crop"
  },
  {
    id: 'adam',
    title: "CONSEILS D'ELITE",
    subtitle: "ADAM : CADDIE IA",
    description: "Parlez à Adam, votre Caddie IA. Il analyse votre jeu pour suggérer le meilleur club.",
    accent: "#c9964a",
    icon: <Brain className="w-8 h-8 text-[#c9964a]" />,
    gradient: "from-black via-[#0a1a14] to-black",
    bg: "https://images.unsplash.com/photo-1549419163-f2575797072a?q=80&w=2626&auto=format&fit=crop"
  },
  {
    id: 'share',
    title: "NOTORIÉTÉ",
    subtitle: "PARTAGE 8K STYLÉ",
    description: "Partagez vos exploits. ONYX crée votre carte tactique.",
    accent: "#c9964a",
    icon: <Share2 className="w-8 h-8 text-[#c9964a]" />,
    gradient: "from-black via-[#140a1a] to-black",
    bg: "https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?q=80&w=2000&auto=format&fit=crop"
  }
];

export default function WelcomeTour({ onComplete }: { onComplete: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAuto, setIsAuto] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const musicNodesRef = useRef<any[]>([]);

  // Lancement de la musique d'ambiance
  const startMusic = useCallback(() => {
    if (audioCtxRef.current) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const baseFreqs = [220.00, 277.18, 329.63, 440.00]; // A minor chord frequencies for ambient lounge
      const masterGain = ctx.createGain();
      masterGain.gain.value = isMuted ? 0 : 0.05;
      masterGain.connect(ctx.destination);
      
      const nodes: any[] = [masterGain];

      baseFreqs.forEach(freq => {
        const osc = ctx.createOscillator();
        const lfo = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        lfo.type = 'sine';
        lfo.frequency.value = 0.1 + Math.random() * 0.2; // Slow modulation
        
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.5;
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        
        osc.connect(gain);
        gain.connect(masterGain);
        
        osc.start();
        lfo.start();
        
        nodes.push({ osc, lfo, gain, lfoGain });
      });

      musicNodesRef.current = nodes;
    } catch (e) {
      console.warn("Ambient music not supported", e);
    }
  }, [isMuted]);

  const stopMusic = useCallback(() => {
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
      musicNodesRef.current = [];
    }
  }, []);

  // Update music volume when muted state changes
  useEffect(() => {
    if (musicNodesRef.current.length > 0) {
      const masterGain = musicNodesRef.current[0];
      // Ramp volume smoothly
      masterGain.gain.setTargetAtTime(isMuted ? 0 : 0.05, audioCtxRef.current!.currentTime + 0.5);
    }
  }, [isMuted]);

  useEffect(() => {
    return () => stopMusic();
  }, [stopMusic]);

  const playSubtleSound = useCallback((freq: number, type: OscillatorType = 'triangle') => {
    if (isMuted) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq / 2, ctx.currentTime + 0.3);
      
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  }, [isMuted]);

  const next = useCallback(() => {
    playSubtleSound(150, 'triangle');
    if (currentSlide === SLIDES.length - 1) {
      stopMusic();
      onComplete();
    } else {
      setCurrentSlide(s => s + 1);
    }
  }, [currentSlide, onComplete, playSubtleSound, stopMusic]);

  const prev = useCallback(() => {
    playSubtleSound(100, 'triangle');
    setCurrentSlide(s => Math.max(0, s - 1));
  }, [playSubtleSound]);

  // Slideshow auto-advance
  useEffect(() => {
    if (!hasStarted || !isAuto) return;
    const timer = setTimeout(() => {
      next();
    }, 6000); // 6 seconds per slide for visual reading

    return () => clearTimeout(timer);
  }, [currentSlide, hasStarted, isAuto, next]);

  if (!hasStarted) {
    return (
      <div className="fixed inset-0 z-[110] bg-black flex items-center justify-center p-8 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img src={SLIDES[0].bg} className="w-full h-full object-cover grayscale" alt="bg" />
        </div>
        <div className="relative z-10 text-center space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <h1 className="text-[10px] font-black tracking-[1em] text-white/40 uppercase mb-8">
              BRIEFING TACTIQUE • ONYX V2
            </h1>
            <div className="w-24 h-[1px] bg-[#c9964a]/50 mx-auto" />
          </motion.div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                onComplete();
              }}
              className="px-10 py-4 bg-zinc-900 text-white/60 border border-white/10 rounded-full font-black tracking-[0.2em] text-[10px] hover:text-white hover:border-white/30 transition-all"
            >
              MODE DÉMO
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setHasStarted(true);
                startMusic();
                playSubtleSound(200, 'sine');
              }}
              className="group relative px-12 py-5 bg-[#c9964a] text-black rounded-full overflow-hidden transition-all shadow-[0_0_30px_rgba(201,150,74,0.3)]"
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative font-black tracking-[0.3em] text-[11px] uppercase">
                S'IDENTIFIER
              </span>
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-hidden font-sans select-none">
      <div className="absolute top-12 left-10 md:left-auto md:right-10 flex gap-4 items-center z-50">
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="p-3 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white/60 hover:text-white transition-colors"
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <button 
          onClick={() => { stopMusic(); onComplete(); }}
          className="px-4 py-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-[10px] font-black tracking-[0.3em] text-white/60 hover:text-white transition-colors uppercase"
        >
          PASSER
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 flex flex-col items-center justify-center p-8"
        >
          {/* Background Image with Overlay */}
          <motion.div 
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.6 }}
            transition={{ duration: 4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 z-0"
          >
            <img 
              src={SLIDES[currentSlide].bg} 
              className="w-full h-full object-cover" 
              alt="background"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
          </motion.div>

          {/* Noise/Grain texture */}
          <div className="absolute inset-0 opacity-[0.08] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-10" />
          
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-white/5 overflow-hidden z-50">
            <motion.div 
              key={`progress-${currentSlide}`}
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              transition={{ duration: 6, ease: "linear" }}
              className="h-full"
              style={{ backgroundColor: SLIDES[currentSlide].accent }}
            />
          </div>

          <div className="max-w-2xl w-full text-center space-y-16 relative z-20">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring", damping: 20 }}
              className="flex justify-center"
            >
              <div className="p-10 rounded-full bg-black/40 border border-white/10 backdrop-blur-3xl relative">
                <motion.div 
                  animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.05, 0.2] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute inset-0 rounded-full bg-white/20"
                />
                <div className="relative z-10 scale-150">
                  {SLIDES[currentSlide].icon}
                </div>
              </div>
            </motion.div>

            <div className="space-y-8">
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                <h2 className="text-[11px] font-black tracking-[1.2em] text-[#c9964a]/80 uppercase mb-4">
                  {SLIDES[currentSlide].title}
                </h2>
                <h1 className="text-4xl md:text-6xl font-black text-white leading-none tracking-tighter uppercase">
                  {SLIDES[currentSlide].subtitle}
                </h1>
              </motion.div>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-white text-xl md:text-2xl leading-relaxed max-w-lg mx-auto font-black italic drop-shadow-2xl"
              >
                "{SLIDES[currentSlide].description}"
              </motion.p>
            </div>
            
            {/* Visualizer instead of voice */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="flex justify-center gap-2 h-6 items-center"
            >
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={`visualizer-bar-${i}`}
                  animate={{ height: [4, Math.random() * 16 + 4, 4], opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                  className="w-1.5 rounded-full"
                  style={{ backgroundColor: SLIDES[currentSlide].accent }}
                />
              ))}
            </motion.div>
          </div>
          
          <div className="absolute bottom-16 left-0 w-full px-8 flex items-center justify-between z-30">
            <button 
              onClick={() => { prev(); setIsAuto(false); }}
              className={`p-5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 transition-all ${currentSlide === 0 ? 'opacity-0 pointer-events-none' : 'hover:bg-white/10 hover:border-white/30'}`}
            >
              <ChevronLeft className="w-8 h-8 text-white" />
            </button>

            <div className="flex gap-4">
              {SLIDES.map((_, i) => (
                <button
                  key={`slide-dot-${i}`}
                  onClick={() => { setCurrentSlide(i); setIsAuto(false); }}
                  className={`relative h-1.5 rounded-full transition-all duration-700 ${i === currentSlide ? 'w-12 bg-white' : 'w-3 bg-white/20 hover:bg-white/40'}`}
                />
              ))}
            </div>

            <button 
              onClick={() => { next(); setIsAuto(false); }}
              className="p-5 rounded-full bg-white text-black hover:bg-[#c9964a] transition-all shadow-[0_0_30px_rgba(201,150,74,0.3)] flex items-center justify-center translate-y-0 hover:-translate-y-1"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
