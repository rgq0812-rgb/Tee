import { motion } from 'motion/react';
import { Trophy } from 'lucide-react';
import { useEffect } from 'react';

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div 
      className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden cursor-pointer"
      onClick={onComplete}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-20 h-20 bg-[#c9964a] rounded-full flex items-center justify-center text-black mb-6 shadow-[0_0_30px_rgba(201,150,74,0.3)]"
        >
          <Trophy size={40} />
        </motion.div>
        
        <h1 className="text-white text-3xl font-black italic tracking-[0.3em] uppercase mb-2">THE CHOSE</h1>
        <p className="text-[#c9964a] text-[8px] font-mono uppercase tracking-[0.5em] opacity-40">ONYX v2.0</p>

        <button 
          onClick={(e) => { e.stopPropagation(); onComplete(); }}
          className="mt-12 px-6 py-2 border border-[#c9964a]/20 rounded-full text-[8px] text-white/40 uppercase tracking-[0.2em] hover:bg-white/5 transition-all"
        >
          Skip Mission Intro
        </button>
      </motion.div>
    </div>
  );
}
