import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Battery, BatteryLow, Zap, Sparkles } from 'lucide-react';
import { speakWithBrowser } from '../services/geminiService';

interface PowerManagerProps {
  children: React.ReactNode;
}

export const PowerManager: React.FC<PowerManagerProps> = ({ children }) => {
  const [isDimmed, setIsDimmed] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<number>(100);
  const [isEcoMode, setIsEcoMode] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const DIM_TIMEOUT = 120000; // 2 minutes

  const wakeUp = useCallback(() => {
    setIsDimmed(false);
    setLastActivity(Date.now());
  }, []);

  // Monitor activity
  useEffect(() => {
    const handleActivity = () => wakeUp();
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('keydown', handleActivity);

    return () => {
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [wakeUp]);

  // Battery monitoring
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(battery.level * 100);
        
        const updateBattery = () => {
          const level = battery.level * 100;
          setBatteryLevel(level);
          if (level < 20 && !isEcoMode) {
            setIsEcoMode(true);
            speakWithBrowser("Batterie faible, passage en mode manuel pour préserver l'énergie.");
          }
        };

        battery.addEventListener('levelchange', updateBattery);
        return () => battery.removeEventListener('levelchange', updateBattery);
      });
    }
  }, [isEcoMode]);

  // Dimming logic
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isDimmed && Date.now() - lastActivity > DIM_TIMEOUT) {
        setIsDimmed(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isDimmed, lastActivity]);

  // Global wake listener for voice
  useEffect(() => {
    const handleVoiceWake = (e: any) => {
      if (e.detail?.wake) wakeUp();
    };
    window.addEventListener('onyx_voice_wake', handleVoiceWake);
    return () => window.removeEventListener('onyx_voice_wake', handleVoiceWake);
  }, [wakeUp]);

  return (
    <div className="relative min-h-screen">
      {/* Main Content */}
      <div className={`min-h-screen transition-all duration-1000 ${isDimmed ? 'opacity-40' : 'opacity-100'}`}>
        {children}
      </div>

      {/* Dim Overlay */}
      <AnimatePresence>
        {isDimmed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={wakeUp}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center cursor-pointer z-[9999]"
          >
            <div className="flex flex-col items-center gap-6">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-32 h-32 rounded-full border-2 border-[#c9964a]/30 flex items-center justify-center text-[#c9964a]"
              >
                <Zap size={48} />
              </motion.div>
              
              <div className="text-center space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#c9964a]">Mode Énergie Optimisé</p>
                <p className="text-white text-[9px] font-black italic">TOUCHEZ POUR RÉACTIVER L'INTERFACE</p>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                {batteryLevel < 20 ? <BatteryLow size={12} className="text-red-500" /> : <Battery size={12} className="text-green-500" />}
                <span className="text-[10px] font-black text-white">{Math.round(batteryLevel)}%</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Eco Mode Indicator */}
      {isEcoMode && !isDimmed && (
        <div className="fixed top-4 right-4 z-[9998] px-3 py-1 bg-red-600/20 border border-red-500/30 rounded-full flex items-center gap-2 backdrop-blur-xl">
          <BatteryLow size={10} className="text-red-500 animate-pulse" />
          <span className="text-[8px] font-black text-white uppercase tracking-widest">Mode Éco Actif</span>
        </div>
      )}
    </div>
  );
};
