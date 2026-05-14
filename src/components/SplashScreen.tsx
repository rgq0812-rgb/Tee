import { motion } from 'motion/react';
import { Trophy } from 'lucide-react';
import { useEffect } from 'react';

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div 
      className="min-h-screen bg-brg-bg flex items-center justify-center p-6 relative overflow-hidden brg-gradient cursor-pointer"
      onClick={onComplete}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: [0.87, 0, 0.13, 1] }}
        className="flex flex-col items-center"
      >
        <motion.div
          animate={{ 
            rotateY: [0, 180, 360],
            opacity: [0, 1, 1]
          }}
          transition={{ duration: 2, times: [0, 0.5, 1] }}
          className="w-24 h-24 bg-brg-primary rounded-full flex items-center justify-center text-white mb-8 shadow-2xl shadow-emerald-500/10"
        >
          <Trophy size={48} />
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, letterSpacing: '0.5em' }}
          animate={{ opacity: 1, letterSpacing: '0.22em' }}
          transition={{ duration: 2, delay: 0.5 }}
          className="font-cinzel text-5xl font-bold tracking-tighter mb-2"
        >
          THE CHOSE
        </motion.h1>
        
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 40 }}
          transition={{ duration: 1, delay: 2 }}
          className="h-[1px] bg-brg-gold mb-4"
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 1, delay: 2.5 }}
          className="font-mono text-[10px] uppercase tracking-[0.3em] font-light"
        >
          Instrument de Précision
        </motion.p>
      </motion.div>
    </div>
  );
}
