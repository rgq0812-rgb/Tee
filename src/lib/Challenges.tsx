import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Zap, Shield, Sparkles, Trophy, Lock, X, ChevronRight, Brain, AlertCircle, Info, Activity, Volume2 } from 'lucide-react';
import { CHALLENGES, CADDIES } from '../constants';

const ADAM_ADVICE = {
  sniper: "Le practice est une forge, pas un bac à sable. Si vous continuez à creuser ces tranchées, je vais devoir appeler le génie civil pour une autorisation de terrassement. Visez la cible, pas le centre de la Terre.",
  predator: "La puissance sans cible est un gaspillage d'énergie cinétique. Envoyer une balle dans le parking n'est pas une 'attaque spectaculaire', c'est un constat d'échec pour mon processeur.",
  clockwork: "La répétition est la mère de la maîtrise. Pour vous, c'est apparemment la mère de la confusion. Essayez de faire deux fois le même geste, juste pour voir si mon code plante.",
  mage: "Le Mage ne frappe jamais de balles droites. Si vous frappez droit par erreur, considérez cela comme un bug système. Apprenez à courber l'espace avant que je ne courbe votre score.",
  trizone: "Le contrôle des distances est une science. Toucher le seau du voisin à 20 mètres n'est pas une validation de zone. Soyez précis, ou je désinfecte vos data-logs."
};

const CHALLENGE_CRITERIA = {
  sniper: "EXERCICE : Sniper Élite. 10 balles à 60m. Si vous manquez, ne cherchez pas d'excuses sur le vent, mon capteur indique un calme plat et une erreur humaine à 99%.",
  predator: "EXERCICE : Couloirs de la Mort. 10 drives. Seules les balles qui ne menacent pas l'intégrité physique des autres joueurs sont comptabilisées.",
  clockwork: "EXERCICE : Métronome Humain. 20 swings à 75%. Si votre rythme ressemble plus à un combat de catch qu'à une horloge suisse, on recommence tout.",
  mage: "EXERCICE : Sortilèges Balistiques. Alternez Draw et Fade. Le 'Slicing involontaire' n'est pas considéré comme une courbe magique, c'est juste triste.",
  trizone: "EXERCICE : Escalier Militaire. 50m, 100m, 150m. Si vous confondez encore les mètres et les yards, je passerai votre interface en mode 'Débutant Fragile'."
};

const ValidationTouchpad = ({ onComplete, isReady, isSolar }: { onComplete: () => void, isReady: boolean, isSolar: boolean }) => {
  const [progress, setProgress] = useState(0);
  const [isValidated, setIsValidated] = useState(false);
  const timerRef = useRef<any>(null);

  const startHolding = () => {
    if (isValidated || !isReady) return;
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / 1500) * 100, 100);
      setProgress(newProgress);
      if (newProgress >= 100) {
        clearInterval(timerRef.current);
        setIsValidated(true);
        onComplete();
      }
    }, 20);
  };

  const stopHolding = () => {
    if (isValidated) return;
    clearInterval(timerRef.current);
    setProgress(0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-2">
        <Activity size={14} className={isReady ? "text-[#c9964a]" : "text-white/20"} />
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">ZONE DE VALIDATION TACTILE</h4>
      </div>
      
      <div className={`relative group ${!isReady && 'opacity-50'}`}>
        <motion.button
          onMouseDown={startHolding}
          onMouseUp={stopHolding}
          onMouseLeave={stopHolding}
          onTouchStart={startHolding}
          onTouchEnd={stopHolding}
          disabled={!isReady}
          className="w-full h-32 bg-zinc-900 border-2 border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 active:bg-zinc-800 transition-colors relative overflow-hidden disabled:cursor-not-allowed"
        >
          {/* Progress fill */}
          <motion.div 
            className="absolute bottom-0 left-0 right-0 bg-[#c9964a]/20"
            initial={{ height: 0 }}
            animate={{ height: `${progress}%` }}
          />

          <div className="w-16 h-16 rounded-full border border-[#c9964a]/20 flex items-center justify-center relative z-10">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="30"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-white/5"
              />
              <motion.circle
                cx="32"
                cy="32"
                r="30"
                fill="none"
                stroke="#c9964a"
                strokeWidth="2"
                strokeDasharray="188.49"
                animate={{ strokeDashoffset: 188.49 - (188.49 * progress) / 100 }}
              />
            </svg>
            {isValidated ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Trophy className="text-[#c9964a]" size={28} /></motion.div>
            ) : (
              <Shield size={24} className={isReady ? "text-[#c9964a]" : "text-white/20"} />
            )}
          </div>
          
          <div className="flex flex-col items-center relative z-10">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">
              {!isReady ? "OBJECTIF NON ATTEINT" : isValidated ? "MISSION VALIDÉE" : progress > 0 ? "SCAN EN COURS..." : "MAINTENIR POUR VALIDER"}
            </span>
            <div className="flex gap-1 mt-1">
              {[1,2,3,4,5].map(i => (
                <div key={i} className={`w-4 h-1 rounded-full transition-colors ${progress >= (i * 20) ? 'bg-[#c9964a]' : 'bg-white/5'}`} />
              ))}
            </div>
          </div>
        </motion.button>
      </div>
      
      {!isReady && (
        <p className="text-[8px] text-center text-[#c9964a]/60 uppercase tracking-[0.2em] font-mono leading-relaxed px-8 italic">
          Verrouillage tactique : Atteignez l'objectif de l'exercice pour activer l'authentification.
        </p>
      )}
    </div>
  );
};

export default function Challenges({ onAskAdam, displayMode }: { onAskAdam: (msg: string) => void, displayMode?: 'tactical' | 'solar' }) {
  const isSolar = displayMode === 'solar';
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [progressData, setProgressData] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('onyx_challenge_progress');
    return saved ? JSON.parse(saved) : {};
  });

  const updateProgress = (id: string, delta: number, target: number) => {
    const current = progressData[id] || 0;
    const next = Math.max(0, Math.min(target, current + delta));
    const newData = { ...progressData, [id]: next };
    setProgressData(newData);
    localStorage.setItem('onyx_challenge_progress', JSON.stringify(newData));
  };

  const getCaddieInfo = (caddieId: string) => {
    return (CADDIES as any).find?.((c: any) => c.id === caddieId) || (CADDIES as any)[caddieId] || (CADDIES as any)[0];
  };

  return (
    <div className={`relative -mx-6 -mt-6 min-h-[calc(100vh-140px)] p-6 font-sans overflow-y-auto ${isSolar ? 'bg-zinc-50 text-black' : 'bg-black text-white'}`}>
      {/* Background Pattern */}
      <div className={`absolute inset-0 z-0 pointer-events-none ${isSolar ? 'opacity-10' : 'opacity-5'}`} style={{ backgroundImage: `radial-gradient(circle, ${isSolar ? '#000' : '#c9964a'} 1px, transparent 1px)`, backgroundSize: '30px 30px' }} />

      <div className="relative z-10 space-y-8 pb-32">
        <div className={`border-b pb-6 pt-6 ${isSolar ? 'border-zinc-200' : 'border-white/10'}`}>
          <div className="flex items-center gap-3 mb-2">
            <Trophy className={isSolar ? "text-black" : "text-[#c9964a]"} size={20} />
            <h2 className={`text-3xl font-black italic tracking-tighter uppercase ${isSolar ? 'text-black' : 'text-white'}`}>CHALLENGES</h2>
          </div>
          <p className={`text-[10px] font-mono tracking-[0.3em] uppercase ${isSolar ? 'text-zinc-500 font-bold' : 'text-[#c9964a]'}`}>VALIDATEURS DE PERFORMANCE • UNITÉ ONYX</p>
        </div>

        <div className="space-y-4">
          {CHALLENGES.map((c) => (
            <motion.button
              key={`challenge-item-${c.id}`}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedChallenge(c)}
              className={`w-full text-left border p-6 rounded-[2.5rem] relative overflow-hidden group backdrop-blur-md transition-all duration-300 ${
                isSolar 
                ? 'bg-white border-zinc-200 shadow-sm hover:border-black active:bg-zinc-100' 
                : 'bg-zinc-900/40 border-white/5 hover:bg-zinc-900/60'
              }`}
            >
               <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-5">
                     <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-inner transition-colors ${
                       isSolar 
                       ? 'bg-zinc-50 border-zinc-200 text-black group-hover:border-black' 
                       : 'bg-black/60 border-[#c9964a]/10 text-[#c9964a] group-hover:border-[#c9964a]/40'
                     }`}>
                        <Trophy size={32} className="group-hover:scale-110 transition-transform" />
                     </div>
                     <div>
                        <h4 className={`text-xl font-black italic tracking-tight uppercase leading-none mb-2 ${isSolar ? 'text-black' : 'text-white'}`}>{c.name}</h4>
                        <div className="flex items-center gap-2">
                          <Activity size={10} className="text-emerald-600" />
                          <p className={`text-[10px] font-bold uppercase tracking-widest leading-none ${isSolar ? 'text-zinc-500' : 'text-white/40'}`}>OBJECTIF: {c.target} UNITÉS</p>
                        </div>
                     </div>
                  </div>
                  <div className={`px-4 py-2 rounded-xl border shadow-inner ${isSolar ? 'bg-zinc-50 border-zinc-200' : 'bg-black/60 border-white/10'}`}>
                    <span className={`text-xs font-black font-mono tracking-tighter italic ${isSolar ? 'text-black' : 'text-[#c9964a]'}`}>
                       {progressData[c.id] || 0}/{c.target}
                    </span>
                  </div>
               </div>

               <div className="space-y-4">
                 <div className={`border p-4 rounded-2xl ${isSolar ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border-white/5'}`}>
                    <p className={`text-[11px] font-bold leading-relaxed italic line-clamp-2 ${isSolar ? 'text-zinc-600' : 'text-white/60'}`}>
                       "{c.description}"
                    </p>
                 </div>

                 <div className={`h-1 rounded-full overflow-hidden ${isSolar ? 'bg-zinc-200' : 'bg-white/5'}`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${((progressData[c.id] || 0) / c.target) * 100}%` }}
                      className={`h-full ${isSolar ? 'bg-black' : 'bg-gradient-to-r from-[#c9964a] to-[#8a652f]'}`}
                    />
                 </div>
                 
                 <div className={`flex justify-between items-center text-[8px] font-black tracking-[0.2em] uppercase font-mono ${isSolar ? 'text-zinc-400' : 'text-white/20'}`}>
                    <div className="flex items-center gap-2">
                      <Brain size={12} className={isSolar ? "text-black/30" : "text-[#c9964a]/50"} />
                      <span>{getCaddieInfo(c.caddie).name.toUpperCase()} REQUIS</span>
                    </div>
                    <div className={`flex items-center gap-2 transition-colors ${isSolar ? 'text-black' : 'text-[#c9964a] group-hover:text-white'}`}>
                      <span>VOIR CRITÈRES</span>
                      <ChevronRight size={12} />
                    </div>
                 </div>
               </div>
               
               {/* Hover effect highlight */}
               <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                 <Sparkles size={16} className={isSolar ? "text-black/20" : "text-[#c9964a]/40"} />
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
            className={`fixed inset-0 z-[600] backdrop-blur-2xl flex flex-col justify-end ${isSolar ? 'bg-zinc-900/60' : 'bg-black/95'}`}
          >
            <motion.div
               initial={{ y: '100%' }}
               animate={{ y: 0 }}
               exit={{ y: '100%' }}
               className={`border-t rounded-t-[3.5rem] p-8 pb-32 max-h-[95vh] overflow-y-auto shadow-2xl relative ${isSolar ? 'bg-white border-zinc-200' : 'bg-[#0a0a0a] border-[#c9964a]/30'}`}
            >
              {/* HUD Accents */}
              <div className={`absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 pointer-events-none ${isSolar ? 'border-zinc-200' : 'border-[#c9964a]/20'}`} />
              <div className={`absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 pointer-events-none ${isSolar ? 'border-zinc-200' : 'border-[#c9964a]/20'}`} />

              <div className="flex justify-between items-start mb-10 pt-4">
                <div className="flex flex-col">
                  <span className={`text-[10px] font-black uppercase tracking-[0.4em] mb-4 flex items-center gap-2 ${isSolar ? 'text-zinc-400' : 'text-[#c9964a]'}`}>
                    <Shield size={12} /> DOSSIER OPÉRATIONNEL
                  </span>
                  <div className="flex items-center gap-6">
                    <div className={`w-20 h-20 rounded-[2rem] border flex items-center justify-center shadow-2xl ${isSolar ? 'bg-zinc-100 border-zinc-200 text-black' : 'bg-zinc-900 border-[#c9964a]/30 text-[#c9964a]'}`}>
                      <Trophy size={40} />
                    </div>
                    <div>
                      <h3 className={`text-4xl font-black italic uppercase tracking-tighter leading-none ${isSolar ? 'text-black' : 'text-white'}`}>{selectedChallenge.name}</h3>
                      <div className="mt-3 flex items-center gap-3">
                         <div className={`px-3 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter italic ${isSolar ? 'bg-black text-white' : 'bg-[#c9964a] text-black'}`}>MISSION ID-0{selectedChallenge.id.length}</div>
                         <div className={`border px-3 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${isSolar ? 'bg-zinc-100 border-zinc-200 text-zinc-500' : 'bg-white/5 border-white/10 text-white/40'}`}>ACTIF</div>
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedChallenge(null)} 
                  className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all active:scale-90 ${isSolar ? 'bg-zinc-100 border-zinc-200 text-black hover:bg-zinc-200 shadow-md' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
                >
                  <X size={28} />
                </button>
              </div>

              <div className="space-y-8 mb-10">
                {/* Adam's Quote - The "Intervention" */}
                <div className={`relative p-8 rounded-[2.5rem] border overflow-hidden group ${isSolar ? 'bg-zinc-50 border-zinc-200 shadow-inner' : 'bg-zinc-900/60 border-[#c9964a]/10'}`}>
                  <div className="absolute top-0 left-0 p-4 opacity-5 pointer-events-none">
                    <Brain size={120} className={isSolar ? 'text-black' : 'text-white'} />
                  </div>
                  <div className="flex items-center gap-3 mb-4 relative z-10">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${isSolar ? 'bg-black' : 'bg-[#c9964a]'}`} />
                    <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${isSolar ? 'text-zinc-500 font-bold' : 'text-[#c9964a]'}`}>CONSIGNES D'ADAM (MENTEUR ONYX)</span>
                  </div>
                  <p className={`text-lg font-black italic leading-tight relative z-10 mb-6 font-serif ${isSolar ? 'text-black' : 'text-white/90'}`}>
                    "{ADAM_ADVICE[selectedChallenge.id as keyof typeof ADAM_ADVICE] || "Le calme avant l'impact est votre meilleure arme."}"
                  </p>
                  <div className="flex items-center justify-between relative z-10">
                    <div className={`flex items-center gap-2 transition-opacity ${isSolar ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'}`}>
                      <div className={`w-8 h-[1px] ${isSolar ? 'bg-black/20' : 'bg-white/40'}`} />
                      <span className={`text-[8px] font-black uppercase tracking-widest ${isSolar ? 'text-zinc-400' : 'text-white/40'}`}>Protocol Adam 0.1v</span>
                    </div>
                    <button 
                      onClick={() => onAskAdam(`Adam, parlez-moi du challenge ${selectedChallenge.name}. ${ADAM_ADVICE[selectedChallenge.id as keyof typeof ADAM_ADVICE]}`)}
                      className={`border px-4 py-2 rounded-xl flex items-center gap-2 transition-all active:scale-95 ${isSolar ? 'bg-black border-black shadow-lg text-white' : 'bg-[#c9964a]/20 hover:bg-[#c9964a]/40 border-[#c9964a]/30 text-[#c9964a]'}`}
                    >
                      <Volume2 size={12} />
                      <span className="text-[8px] font-black uppercase tracking-tighter">Conseil Vocal</span>
                    </button>
                  </div>
                </div>

                {/* Explicit Criteria - The "Fonction Clear" */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 px-2">
                    <Info size={14} className="text-sky-600" />
                    <h4 className={`text-[10px] font-black uppercase tracking-[0.3em] ${isSolar ? 'text-zinc-500' : 'text-white/60'}`}>PROTOCOLE DE VALIDATION</h4>
                  </div>
                  <div className={`border rounded-2xl p-6 flex gap-5 ${isSolar ? 'bg-white border-zinc-200 shadow-sm' : 'bg-white/5 border-white/10'}`}>
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 shrink-0">
                      <Zap size={20} />
                    </div>
                    <p className={`text-xs font-bold leading-relaxed uppercase tracking-tight ${isSolar ? 'text-black' : 'text-white/80'}`}>
                      {CHALLENGE_CRITERIA[selectedChallenge.id as keyof typeof CHALLENGE_CRITERIA] || "Consultez le terminal tactical pour les critères."}
                    </p>
                  </div>
                </div>

                {/* Progression Logger Section */}
                <div className={`border rounded-[2.5rem] p-8 text-center relative overflow-hidden shadow-inner ${isSolar ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900 border-white/5'}`}>
                   <div className={`absolute inset-0 ${isSolar ? 'bg-zinc-100/50' : 'bg-gradient-to-b from-[#c9964a]/5 to-transparent'}`} />
                   <span className={`text-[10px] font-black uppercase tracking-[0.3em] mb-6 block relative z-10 ${isSolar ? 'text-black font-bold' : 'text-[#c9964a]'}`}>LOG DE PROGRESSION ENTRAÎNEMENT</span>
                   
                   <div className="flex items-center justify-between gap-4 mb-8 relative z-10 max-w-xs mx-auto">
                      <button 
                        onClick={(e) => { e.stopPropagation(); updateProgress(selectedChallenge.id, -1, selectedChallenge.target); }}
                        className={`w-16 h-16 rounded-2xl border flex items-center justify-center transition-all font-black text-2xl active:scale-90 ${isSolar ? 'bg-white border-zinc-200 text-black shadow-sm' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
                      >
                        -
                      </button>
                      <div className="flex flex-col items-center">
                         <span className={`text-7xl font-black italic leading-none mb-2 font-mono ${isSolar ? 'text-black' : 'text-white'}`}>
                           {progressData[selectedChallenge.id] || 0}
                         </span>
                         <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${isSolar ? 'text-zinc-500 font-bold' : 'text-white/20'}`}>VALIDÉS / {selectedChallenge.target}</span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); updateProgress(selectedChallenge.id, 1, selectedChallenge.target); }}
                        className={`w-16 h-16 rounded-2xl border flex items-center justify-center transition-all font-black text-2xl active:scale-90 ${isSolar ? 'bg-black border-black text-white shadow-lg' : 'bg-[#c9964a]/10 border-[#c9964a]/30 text-[#c9964a] hover:bg-[#c9964a]/20'}`}
                      >
                        +
                      </button>
                   </div>

                   <div className={`h-3 rounded-full overflow-hidden relative z-10 shadow-inner ${isSolar ? 'bg-zinc-200' : 'bg-white/5'}`}>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${((progressData[selectedChallenge.id] || 0) / selectedChallenge.target) * 100}%` }}
                        className={`h-full ${isSolar ? 'bg-black shadow-[0_0_10px_rgba(0,0,0,0.2)]' : 'bg-gradient-to-r from-[#c9964a] to-[#8a652f] shadow-[0_0_20px_rgba(201,150,74,0.3)]'}`}
                      />
                   </div>
                </div>

                <ValidationTouchpad 
                  isReady={(progressData[selectedChallenge.id] || 0) >= selectedChallenge.target}
                  isSolar={isSolar}
                  onComplete={() => {
                    onAskAdam(`Bilan tactique sur le challenge ${selectedChallenge.name} terminé. Félicitations soldat. Vos logs de progression indiquent que vous avez enfin compris de quel côté tenir le club. L'unité Onyx valide officiellement votre badge : ${selectedChallenge.reward}. Ne vous emballez pas trop, mon processeur estime que votre prochain swing a 45% de chances de finir dans un bunker. On continue ou vous allez faire une sieste ?`);
                  }} 
                />

                <div className="grid grid-cols-2 gap-4">
                   <div className={`border rounded-[2rem] p-6 relative overflow-hidden shadow-sm ${isSolar ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/10'}`}>
                      <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Award size={48} className={isSolar ? 'text-black' : 'text-white'} />
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-widest mb-3 block ${isSolar ? 'text-zinc-400 font-bold' : 'text-white/20'}`}>RÉCOMPENSE ÉLITE</span>
                      <div className="flex items-center gap-3 text-emerald-600">
                         <div className="w-8 h-8 rounded-full bg-emerald-600/10 flex items-center justify-center border border-emerald-600/20">
                           <Award size={16} />
                         </div>
                         <span className="text-xs font-black uppercase tracking-tighter italic">{selectedChallenge.reward}</span>
                      </div>
                   </div>
                   <div className={`border rounded-[2rem] p-6 relative overflow-hidden shadow-sm ${isSolar ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/10'}`}>
                      <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Brain size={48} className={isSolar ? 'text-black' : 'text-white'} />
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-widest mb-3 block ${isSolar ? 'text-zinc-400 font-bold' : 'text-white/20'}`}>CADDIES DÉDIÉ</span>
                      <div className={`flex items-center gap-3 ${isSolar ? 'text-black' : 'text-[#c9964a]'}`}>
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${isSolar ? 'bg-black/10 border-black/20' : 'bg-[#c9964a]/10 border-[#c9964a]/20'}`}>
                           <Brain size={16} />
                         </div>
                         <span className="text-xs font-black uppercase tracking-tighter italic">{getCaddieInfo(selectedChallenge.caddie).name}</span>
                      </div>
                   </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setSelectedChallenge(null)}
                  className={`flex-1 border py-6 rounded-3xl font-black uppercase tracking-widest active:scale-95 transition-all text-[11px] ${isSolar ? 'bg-zinc-100 border-zinc-200 text-zinc-500' : 'bg-white/5 border-white/10 text-white/60'}`}
                >
                  FERMER
                </button>
                <button 
                  onClick={() => {
                    setSelectedChallenge(null);
                  }}
                  className={`flex-[2] py-6 rounded-3xl font-black uppercase tracking-widest flex items-center justify-center gap-4 active:scale-95 transition-all text-[11px] ${isSolar ? 'bg-black text-white shadow-xl' : 'bg-[#c9964a] text-black shadow-[0_15px_40px_rgba(201,150,74,0.4)]'}`}
                >
                  <Zap size={20} fill="currentColor" />
                  INITIALISER LA MISSION
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Award({ size, className }: { size: number, className?: string }) {
  return <Sparkles size={size} className={className} />;
}

