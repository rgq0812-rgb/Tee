import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Video } from 'lucide-react';
import AIAnalyst from './AIAnalyst';

interface SwingCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SwingCoachModal({ isOpen, onClose }: SwingCoachModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-0 sm:p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 50 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            className="w-full h-full sm:h-auto sm:max-w-2xl bg-[#0a0a0a] border-t sm:border border-white/10 sm:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col relative"
          >
            <div className="relative z-10 p-8 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-500/30">
                  <Video size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black italic text-white uppercase tracking-tighter">COACH DE SWING IA</h2>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.3em]">Analyse Tactique Visuelle</p>
                </div>
              </div>
              <button onClick={onClose} className="p-3 text-white/40 hover:text-white"><X size={28} /></button>
            </div>

            <div className="relative z-10 flex-1 overflow-y-auto px-8 py-10 scrollbar-hide">
              <AIAnalyst />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
