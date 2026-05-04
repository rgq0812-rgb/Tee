import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, ChevronRight, ShieldCheck, Info } from 'lucide-react';
import { GOLF_RULES } from '../constants';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RulesModal({ isOpen, onClose }: RulesModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-2xl overflow-y-auto"
        >
          <div className="min-h-screen px-6 py-12">
            <div className="max-w-md mx-auto relative">
              <button 
                onClick={onClose}
                className="absolute -top-4 -right-2 p-2 text-white/40 hover:text-white"
              >
                <X size={28} />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-[#c9964a]/20 rounded-xl flex items-center justify-center text-[#c9964a]">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black italic text-white uppercase tracking-tight">MANUEL TACTIQUE</h2>
                  <p className="text-[10px] text-white/40 uppercase tracking-[0.3em]">Principes Fondamentaux du Golf</p>
                </div>
              </div>

              <div className="space-y-6">
                {GOLF_RULES.map((section, idx) => (
                  <motion.div
                    key={section.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <ShieldCheck size={16} className="text-[#c9964a]" />
                      <h3 className="text-sm font-black text-white uppercase tracking-widest">{section.title}</h3>
                    </div>
                    <ul className="space-y-3">
                      {section.rules.map((rule, ridx) => (
                        <li key={ridx} className="flex gap-3">
                          <span className="text-[#c9964a] font-mono text-[10px] mt-1 shrink-0">{ridx + 1}.</span>
                          <p className="text-xs text-white/70 leading-relaxed font-medium">
                            {rule}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl flex items-start gap-4"
                >
                  <Info size={20} className="text-blue-400 mt-1" />
                  <div>
                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">NOTE OFFICIELLE</h4>
                    <p className="text-[10px] text-white/40 italic leading-relaxed">
                      En compétition officielle, le nombre maximum de clubs autorisés dans le sac est de 14. Vos caddies sont configurés pour respecter cette norme.
                    </p>
                  </div>
                </motion.div>
              </div>

              <button
                onClick={onClose}
                className="w-full mt-12 bg-white text-black font-black uppercase text-xs py-5 rounded-2xl hover:bg-[#c9964a] transition-colors"
                id="close-rules-btn"
              >
                J'AI COMPRIS LE RÈGLEMENT
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
