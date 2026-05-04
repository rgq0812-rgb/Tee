import { motion } from 'motion/react';

interface ConfettiProps {
  onComplete: () => void;
}

export default function Fireworks({ onComplete }: ConfettiProps) {
  // Simplistic CSS-based firework animation for performance and reliability
  // Real version would use a Canvas, but this matches the Bible's visual intent for a "burst"
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onAnimationComplete={() => setTimeout(onComplete, 2400)}
      className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center bg-emerald-950/20 backdrop-blur-sm"
    >
      <div className="relative">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={`firework-particle-${i}`}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ 
              scale: [0, 1.5, 0],
              opacity: [1, 1, 0],
              x: [0, (i - 2) * 100],
              y: [0, -100 - (i % 2) * 50]
            }}
            transition={{ duration: 1.2, delay: i * 0.2 }}
            className="absolute w-4 h-4 rounded-full bg-brg-primary blur-md"
          />
        ))}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="air-panel p-8 text-center"
        >
          <h2 className="font-cinzel text-brg-gold text-2xl tracking-[0.3em] uppercase mb-2">DÉFI VALIDÉ</h2>
          <div className="h-0.5 w-12 bg-brg-primary mx-auto mb-4" />
          <p className="font-mono text-[10px] text-white/50 tracking-widest uppercase">Exploit enregistré dans le Cercle</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
