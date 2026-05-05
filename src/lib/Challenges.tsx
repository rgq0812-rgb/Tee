import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Zap, Shield, Sparkles, Trophy, Lock, X, ChevronRight, Brain } from 'lucide-react';
import { CHALLENGES, CADDIES } from '../constants';

export default function Challenges() {
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);

  const getCaddieInfo = (caddieId: string) => {
    return (CADDIES as any)[caddieId] || CADDIES.strat;
  };

  return (
    <div className="relative -mx-6 -mt-6 min-h-[calc(100vh-140px)] p-6 bg-black text-white font-sans overflow-y-auto">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-5" style={{ backgroundImage: 'radial-gradient(circle, #c9964a 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      <div className="relative z-10 space-y-8 pb-32">
        <div className="border-b border-white/10 pb-6 pt-6">
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white mb-1">CHALLENGES</h2>
          <p className="text-[10px] font-mono text-[#c9964a] tracking-[0.3em] uppercase">VALIDATEURS DE PERFORMANCE OPÉRATIONNELLE</p>
        </div>

        <div className="space-y-4">
          {CHALLENGES.map((c) => (
            <motion.button
              key={`challenge-item-${c.id}`}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedChallenge(c)}
              className="w-full text-left bg-white/5 border border-white/10 p-6 rounded-[2rem] relative overflow-hidden group backdrop-blur-sm"
            >
               <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-5">
                     <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-black/40 border border-[#c9964a]/20 shadow-lg text-[#c9964a]">
                        <Trophy size={28} />
                     </div>
                     <div>
                        <h4 className="text-xl font-black italic text-white tracking-tight uppercase leading-none mb-1">{c.name}</h4>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{c.description}</p>
                     </div>
                  </div>
                  <div className="bg-[#c9964a]/10 px-3 py-1 rounded-full border border-[#c9964a]/20">
                    <span className="text-[9px] font-black text-[#c9964a] font-mono">0 / {c.target}</span>
                  </div>
               </div>

               <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-4">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `0%` }}
                    className="h-full bg-[#c9964a]"
                  />
               </div>
               
               <div className="flex justify-between items-center text-[8px] font-black tracking-[0.2em] text-white/20 uppercase font-mono">
                  <div className="flex items-center gap-2">
                    <Target size={12} />
                    <span>OBJECTIF : {c.target} IMPACTS</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#c9964a]">
                    <ChevronRight size={12} />
                    <span>DÉTAILS</span>
                  </div>
               </div>
               
               {/* Lock overlay for prototype feel */}
               <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex items-center gap-2 text-[10px] font-black text-white px-4 py-2 bg-black border border-white/20 rounded-full uppercase tracking-tighter">
                    <Sparkles size={12} className="text-[#c9964a]" />
                    OUVRIR LE DOSSIER TACTIQUE
                  </div>
               </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Challenge Detail Modal */}
      <AnimatePresence>
        {selectedChallenge && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex flex-col justify-end"
          >
            <motion.div
               initial={{ y: '100%' }}
               animate={{ y: 0 }}
               exit={{ y: '100%' }}
               className="bg-[#111] border-t border-[#c9964a]/30 rounded-t-[3rem] p-8 pb-32 max-h-[90vh] overflow-y-auto shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-[#c9964a] uppercase tracking-[0.3em] mb-2">DOSSIER OPÉRATIONNEL</span>
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-3xl bg-black border border-[#c9964a]/30 flex items-center justify-center text-[#c9964a]">
                      <Trophy size={32} />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black italic text-white uppercase tracking-tighter leading-none">{selectedChallenge.name}</h3>
                      <div className="mt-2 flex items-center gap-2">
                         <div className="bg-[#c9964a]/10 px-2 py-0.5 rounded text-[10px] font-black text-[#c9964a]">MISSION {selectedChallenge.id.toUpperCase()}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedChallenge(null)} 
                  className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                   <p className="text-sm font-medium text-white/80 leading-relaxed italic">
                     "{selectedChallenge.description}"
                   </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1 block">RÉCOMPENSE</span>
                      <div className="flex items-center gap-2 text-emerald-500">
                         <Award size={14} />
                         <span className="text-[11px] font-black uppercase tracking-tight">{selectedChallenge.reward}</span>
                      </div>
                   </div>
                   <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1 block">UNITÉ REQUISE</span>
                      <div className="flex items-center gap-2 text-[#c9964a]">
                         <Brain size={14} />
                         <span className="text-[11px] font-black uppercase tracking-tight">{getCaddieInfo(selectedChallenge.caddie).name}</span>
                      </div>
                   </div>
                </div>

                <div className="bg-black/40 border border-[#c9964a]/10 rounded-2xl p-6 text-center">
                   <span className="text-[10px] font-black text-[#c9964a] uppercase tracking-[0.2em] mb-4 block">VOTRE PROGRESSION</span>
                   <div className="flex items-center justify-center gap-8 mb-4">
                      <div className="flex flex-col items-center">
                         <span className="text-4xl font-black italic text-white">0</span>
                         <span className="text-[8px] font-bold text-white/20 uppercase">ACTUEL</span>
                      </div>
                      <div className="text-white/10 text-2xl font-black italic">/</div>
                      <div className="flex flex-col items-center">
                         <span className="text-4xl font-black italic text-white/40">{selectedChallenge.target}</span>
                         <span className="text-[8px] font-bold text-white/20 uppercase">OBJECTIF</span>
                      </div>
                   </div>
                   <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '0%' }}
                        className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                      />
                   </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setSelectedChallenge(null)}
                  className="flex-1 bg-white/5 border border-white/10 py-5 rounded-2xl font-black uppercase tracking-widest text-white active:scale-95 transition-all"
                >
                  FERMER
                </button>
                <button 
                  onClick={() => {
                    alert("Mission activée dans le processeur tactique.");
                    setSelectedChallenge(null);
                  }}
                  className="flex-[2] bg-[#c9964a] py-5 rounded-2xl font-black uppercase tracking-widest text-black flex items-center justify-center gap-3 active:scale-95 transition-all shadow-[0_10px_30px_rgba(201,150,74,0.3)]"
                >
                  <Zap size={18} fill="currentColor" />
                  ACTIVER MISSION
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Award({ size }: { size: number }) {
  return <Sparkles size={size} />;
}
