import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, ChevronDown, Check, Info, Target, MapPin, X, Plus, Minus, ArrowRight, Brain, Sparkles, Loader2 } from 'lucide-react';
import { useScore, GameMode } from '../hooks/use-score';
import { getGameDebrief, generateSpeech } from '../services/geminiService';
import { playRawPcm } from '../lib/audioUtils';

export default function ScorecardPage({ scorecard, setScorecard, selectedCourse, currentHole, setCurrentHole }: any) {
  const { calculateStableford } = useScore();
  const [selectedMode, setSelectedMode] = useState<GameMode>(GameMode.STROKE);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [editingHole, setEditingHole] = useState<number | null>(null);
  const [activeScoreField, setActiveScoreField] = useState<'strokes' | 'putts'>('strokes');
  const [isLoadingDebrief, setIsLoadingDebrief] = useState(false);
  const [debriefText, setDebriefText] = useState<string | null>(null);

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const scorecardData = useMemo(() => {
    return selectedCourse.holes.map((hole: any) => ({
      hole: hole.number,
      par: hole.par,
      strokes: scorecard[hole.number]?.strokes || null,
      putts: scorecard[hole.number]?.putts || 0,
    }));
  }, [scorecard, selectedCourse]);

  const totalScore = useMemo(() => {
    return scorecardData.reduce((acc: number, h: any) => acc + (h.strokes ? h.strokes - h.par : 0), 0);
  }, [scorecardData]);

  const totalStrokes = useMemo(() => {
    return scorecardData.reduce((acc: number, h: any) => acc + (h.strokes || 0), 0);
  }, [scorecardData]);

  const isGameFinished = useMemo(() => {
    return scorecardData.filter((h: any) => h.strokes !== null).length >= 18;
  }, [scorecardData]);

  const handleAdamDebrief = async () => {
    if (isLoadingDebrief) return;
    setIsLoadingDebrief(true);
    setDebriefText(null);
    try {
      const text = await getGameDebrief(scorecard, totalScore, totalStrokes);
      setDebriefText(text);
      
      const isMuted = localStorage.getItem('onyx_voice') === 'false';
      if (!isMuted) {
        const audioData = await generateSpeech(text);
        if (audioData) {
          await playRawPcm(audioData);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingDebrief(false);
    }
  };

  const updateScore = (holeNum: number, strokes: number, putts?: number) => {
    const holeData = scorecard[holeNum] || { strokes: 0, putts: 0 };
    setScorecard({
      ...scorecard,
      [holeNum]: {
        ...holeData,
        strokes: strokes > 0 ? strokes : null,
        putts: putts !== undefined ? putts : holeData.putts
      }
    });
  };

  return (
    <div className="relative -mx-6 -mt-6 min-h-[calc(100vh-140px)] p-6 bg-black text-white font-sans overflow-x-hidden">
      {/* Background Dots */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-5" style={{ backgroundImage: 'radial-gradient(circle, #c9964a 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      {/* RAZ Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div 
            key="reset-confirm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111] border border-red-600/30 p-8 rounded-[2.5rem] max-w-sm w-full text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                <X size={32} />
              </div>
              <h3 className="text-xl font-black italic uppercase text-white mb-2">REMISE À ZÉRO</h3>
              <p className="text-xs text-white/40 uppercase tracking-widest leading-relaxed mb-8">
                Voulez-vous vraiment effacer toutes les données tactiques de cette partie ?
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    setScorecard({});
                    setCurrentHole(1);
                    setShowResetConfirm(false);
                  }}
                  className="w-full bg-red-600 text-white h-14 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-[0_10px_20px_rgba(220,38,38,0.2)]"
                >
                  EFFACER TOUT
                </button>
                <button 
                  onClick={() => setShowResetConfirm(false)}
                  className="w-full bg-white/5 text-white/40 h-14 rounded-2xl font-black uppercase tracking-widest border border-white/10 active:scale-95 transition-all"
                >
                  ANNULER
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 space-y-8 pb-32">
        <div className="flex justify-between items-end border-b border-white/10 pb-6 pt-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={12} className="text-red-600" />
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] font-mono">GOLF INTERNATIONAL DE PONT ROYAL</span>
            </div>
            <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">SCORECARD</h2>
            <p className="text-[10px] font-mono text-[#c9964a] tracking-[0.2em] uppercase mt-1">TRANSMISSION DE DONNÉES EN DIRECT — ONYX</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowResetConfirm(true)}
              className="bg-red-600/10 border border-red-600/30 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600/20 transition-all active:scale-95"
            >
              RAZ
            </button>
            <button 
              onClick={() => setShowModeSelector(true)}
              className="bg-[#c9964a]/10 border border-[#c9964a]/30 text-[#c9964a] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#c9964a]/20 transition-all active:scale-95"
            >
              {selectedMode === GameMode.STROKE ? 'Stroke' : selectedMode === GameMode.STABLEFORD ? 'Stableford' : 'Match'}
              <ChevronDown size={14} />
            </button>
          </div>
        </div>

        {/* Tactical KPIs */}
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-sm shadow-2xl">
              <p className="text-[10px] font-black tracking-widest text-[#c9964a] uppercase mb-2">SCORE TOTAL</p>
              <div className={`text-5xl font-black italic font-mono ${totalScore < 0 ? 'text-green-500' : totalScore === 0 ? 'text-white' : 'text-red-600'}`}>
                 {totalScore > 0 ? `+${totalScore}` : totalScore === 0 ? 'E' : totalScore}
              </div>
              <div className="mt-2 text-[8px] font-mono text-white/20 uppercase tracking-[0.2em]">CUMULATIF</div>
           </div>
           <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col items-center justify-center backdrop-blur-sm shadow-2xl">
              <p className="text-[10px] font-black tracking-widest text-[#c9964a] uppercase mb-2">COUPS BRUTS</p>
              <div className="text-5xl font-black italic font-mono text-white">
                 {totalStrokes || '--'}
              </div>
              <div className="mt-2 text-[8px] font-mono text-white/20 uppercase tracking-[0.2em]">TOTAL STROKES</div>
           </div>
        </div>

        {/* The Tactical Matrix */}
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm">
          {/* Cinematic 19th Hole Button */}
          {(isGameFinished || currentHole === 18) && (
            <div className="p-6 border-b border-white/10 bg-gradient-to-r from-[#c9964a]/5 to-transparent flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <Brain size={16} className="text-[#c9964a]" />
                <h3 className="text-xs font-black text-white/60 uppercase tracking-widest">Le 19ème Trou — Conclusion</h3>
              </div>
              
              {debriefText ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-black/60 border border-[#c9964a]/20 p-8 rounded-[2.5rem] relative overflow-hidden group backdrop-blur-xl"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles size={60} className="text-[#c9964a]" />
                  </div>
                  <div className="relative z-10 flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-[#c9964a]" />
                       <span className="text-[10px] font-black text-[#c9964a] uppercase tracking-widest">Analyse de Mentor</span>
                    </div>
                    <p className="text-lg text-white font-medium leading-relaxed italic">
                      "{debriefText}"
                    </p>
                    <div className="mt-4 flex justify-end">
                      <button 
                        onClick={() => setDebriefText(null)}
                        className="bg-white/5 border border-white/10 px-6 py-2 rounded-full text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-colors"
                      >
                        Nouvelle Analyse
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.button 
                  onClick={handleAdamDebrief}
                  disabled={isLoadingDebrief}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative w-full h-56 rounded-[2.5rem] overflow-hidden group shadow-2xl transition-all disabled:opacity-50"
                  id="btn-19th-hole"
                >
                  {/* Premium Background Image - Using a cinematic luxury bar atmosphere */}
                  <img 
                    src="https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=2669&auto=format&fit=crop" 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-70" 
                    alt="19th Hole secret bar"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />
                  <div className="absolute inset-0 border border-white/10 rounded-[2.5rem] pointer-events-none" />
                  
                  <div className="relative z-10 h-full p-8 flex flex-col justify-end items-start gap-3">
                    <div className="flex items-center gap-2 bg-[#c9964a] text-black px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(201,150,74,0.4)]">
                      <Sparkles size={14} />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Accès Club Privé</span>
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-4xl font-black italic text-white uppercase tracking-tighter leading-[0.8] mb-1">
                        19ÈME TROU &<br />BILAN D'ADAM
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className="h-[1px] w-8 bg-[#c9964a]/40" />
                        <p className="text-[9px] font-black text-[#c9964a] uppercase tracking-[0.3em]">Débriefing tactique final</p>
                      </div>
                    </div>
                  </div>
                  
                  {isLoadingDebrief && (
                    <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                       <div className="flex flex-col items-center gap-4">
                          <Loader2 size={40} className="text-[#c9964a] animate-spin" />
                          <span className="text-[10px] font-black text-[#c9964a] uppercase tracking-[0.5em] animate-pulse">Adam analyse tes données...</span>
                       </div>
                    </div>
                  )}
                </motion.button>
              )}
            </div>
          )}

          <div className="bg-white/5 px-6 py-4 flex text-[9px] font-black tracking-[0.3em] text-[#c9964a] uppercase border-b border-white/10">
            <span className="w-12 text-left">TROU</span>
            <span className="w-12 text-center">PAR</span>
            <span className="flex-1 text-center">SCORE</span>
            <span className="w-14 text-right">VARIANT</span>
          </div>
          <div className="divide-y divide-white/10">
            {scorecardData.map((h: any) => (
              <motion.button 
                key={`hole-item-${h.hole}`} 
                whileTap={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                onClick={() => setEditingHole(h.hole)}
                className={`w-full px-6 py-4 flex items-center transition-colors text-left ${currentHole === h.hole ? 'bg-red-600/5' : ''}`}
              >
                  <div className="w-12 text-left flex flex-col">
                    <span className={`font-mono text-xl font-black ${currentHole === h.hole ? 'text-red-600' : 'text-white/40'}`}>
                      {h.hole < 10 ? `0${h.hole}` : h.hole}
                    </span>
                    {h.putts > 0 && <span className="text-[8px] font-black text-white/10 tracking-widest">{h.putts} PUTTS</span>}
                  </div>
                  <span className="w-12 text-center font-mono text-xl font-black text-white/20">{h.par}</span>
                  <div className="flex-1 flex justify-center">
                    {h.strokes ? (
                      <div className="flex items-center gap-3">
                         <span className="font-mono text-3xl font-black italic text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{h.strokes}</span>
                         <div className={`w-2 h-2 rounded-full ${
                           h.strokes < h.par ? 'bg-green-500' : 
                           h.strokes === h.par ? 'bg-white/20' : 'bg-red-600'
                         }`} />
                      </div>
                    ) : (
                      <span className="text-white/5 font-mono text-2xl font-black tracking-widest group-hover:text-white/10 transition-colors">----</span>
                    )}
                  </div>
                  <div className="w-14 text-right">
                    {h.strokes ? (
                      <span className={`font-mono font-black italic text-lg ${
                        h.strokes < h.par ? 'text-green-500' : 
                        h.strokes === h.par ? 'text-white/20' : 'text-red-600'
                      }`}>
                        {h.strokes - h.par > 0 ? `+${h.strokes - h.par}` : h.strokes - h.par === 0 ? 'E' : h.strokes - h.par}
                      </span>
                    ) : (
                      <Plus size={16} className="text-white/10 ml-auto" />
                    )}
                  </div>
              </motion.button>
            ))}
          </div>
          <div className="p-6 bg-white/5 flex items-center justify-center gap-3 text-[9px] font-black text-white/20 tracking-[0.4em] uppercase">
            <Target size={12} className="text-[#c9964a]" /> SYNC OPÉRATIONNELLE TERMINÉE
          </div>
        </div>
      </div>

      {/* Quick Entry Pad Overlay */}
      <AnimatePresence>
        {editingHole !== null && (
          <motion.div 
            key={`editing-hole-overlay-${editingHole}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col justify-end"
          >
            <motion.div
               initial={{ y: '100%' }}
               animate={{ y: 0 }}
               exit={{ y: '100%' }}
               className="bg-[#111] border-t border-[#c9964a]/30 rounded-t-[3rem] p-8 pb-32 mb-[-20px] max-h-[95vh] overflow-y-auto shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => {
                      const prev = editingHole > 1 ? editingHole - 1 : 18;
                      setEditingHole(prev);
                      setCurrentHole(prev);
                    }}
                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#c9964a] active:scale-90"
                  >
                    <Minus size={20} />
                  </button>
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] font-black text-[#c9964a] uppercase tracking-[0.2em] mb-1">TROU ACTUEL</span>
                    <div className="flex items-center gap-2">
                       <h3 className="text-3xl font-black italic text-white uppercase tracking-tighter">{editingHole}</h3>
                       <div className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-black text-white/60">P{selectedCourse.holes[editingHole - 1].par}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const next = editingHole < 18 ? editingHole + 1 : 1;
                      setEditingHole(next);
                      setCurrentHole(next);
                    }}
                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#c9964a] active:scale-90"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <button 
                  onClick={() => setEditingHole(null)} 
                  className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Input Display */}
              <div className="flex gap-4 mb-8">
                <button 
                  onClick={() => setActiveScoreField('strokes')}
                  className={`flex-1 border rounded-2xl p-6 flex flex-col items-center transition-all ${
                    activeScoreField === 'strokes' 
                    ? 'bg-white/10 border-[#c9964a] shadow-[0_0_20px_rgba(201,150,74,0.1)]' 
                    : 'bg-white/5 border-white/10 opacity-50'
                  }`}
                >
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-2">STROKES</span>
                  <span className={`text-5xl font-black italic font-mono ${activeScoreField === 'strokes' ? 'text-white' : 'text-white/40'}`}>
                    {scorecard[editingHole]?.strokes || '--'}
                  </span>
                </button>
                <button 
                  onClick={() => setActiveScoreField('putts')}
                  className={`flex-1 border rounded-2xl p-6 flex flex-col items-center transition-all ${
                    activeScoreField === 'putts' 
                    ? 'bg-[#c9964a]/10 border-[#c9964a] shadow-[0_0_20px_rgba(201,150,74,0.1)]' 
                    : 'bg-white/5 border-white/10 opacity-50'
                  }`}
                >
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-2">PUTTS</span>
                  <span className={`text-5xl font-black italic font-mono ${activeScoreField === 'putts' ? 'text-[#c9964a]' : 'text-[#c9964a]/40'}`}>
                    {scorecard[editingHole]?.putts || '0'}
                  </span>
                </button>
              </div>

              {/* Numeric Pad High-Speed Grid */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                  <motion.button
                    key={`num-pad-${num}`}
                    whileTap={{ scale: 0.9, backgroundColor: '#c9964a', color: '#000' }}
                    onClick={() => {
                        if (activeScoreField === 'strokes') {
                          updateScore(editingHole, num);
                        } else {
                          updateScore(editingHole, scorecard[editingHole]?.strokes || 0, num);
                        }
                    }}
                    className={`h-16 rounded-2xl border font-mono text-2xl font-black transition-all ${
                      (activeScoreField === 'strokes' ? scorecard[editingHole]?.strokes === num : scorecard[editingHole]?.putts === num) 
                      ? 'bg-[#c9964a] border-[#c9964a] text-black shadow-[0_0_20px_rgba(201,150,74,0.3)]' 
                      : 'bg-white/5 border-white/10 text-white'
                    }`}
                  >
                    {num}
                  </motion.button>
                ))}
                
                {/* Plus / Minus for quick adjustments */}
                <button 
                  onClick={() => {
                    if (activeScoreField === 'strokes') {
                      updateScore(editingHole, Math.max(1, (scorecard[editingHole]?.strokes || 0) - 1));
                    } else {
                      updateScore(editingHole, scorecard[editingHole]?.strokes || 0, Math.max(0, (scorecard[editingHole]?.putts || 0) - 1));
                    }
                  }}
                  className="h-16 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center text-white active:bg-red-600/20"
                >
                  <Minus size={24} />
                </button>
                <button 
                  onClick={() => {
                    if (activeScoreField === 'strokes') {
                      updateScore(editingHole, (scorecard[editingHole]?.strokes || 0) + 1);
                    } else {
                      updateScore(editingHole, scorecard[editingHole]?.strokes || 0, (scorecard[editingHole]?.putts || 0) + 1);
                    }
                  }}
                  className="h-16 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center text-white active:bg-green-600/20"
                >
                  <Plus size={24} />
                </button>
                <button 
                  onClick={() => {
                    updateScore(editingHole, 0, 0); // Clear current hole
                  }}
                  className="h-16 rounded-2xl border border-red-600/30 bg-red-600/5 flex flex-col items-center justify-center text-red-600 active:bg-red-600/20"
                >
                   <span className="text-[9px] font-black uppercase tracking-widest">RAZ</span>
                </button>
                <button 
                  onClick={() => {
                    setActiveScoreField(activeScoreField === 'strokes' ? 'putts' : 'strokes');
                  }}
                  className="h-16 rounded-2xl border border-[#c9964a]/30 bg-[#c9964a]/5 flex flex-col items-center justify-center text-[#c9964a] active:bg-[#c9964a]/20"
                >
                   <span className="text-[9px] font-black uppercase tracking-widest">{activeScoreField === 'strokes' ? 'PUTT' : 'SCO'}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button 
                  onClick={() => setEditingHole(null)}
                  className="flex-1 bg-white/5 border border-white/10 py-5 rounded-2xl font-black uppercase tracking-widest text-white/40 active:scale-95 transition-all"
                >
                  Annuler
                </button>
                <button 
                  onClick={() => {
                    if (activeScoreField === 'strokes') {
                      setActiveScoreField('putts');
                    } else {
                      if (editingHole === 18) {
                        setEditingHole(null);
                      } else {
                        const nextHole = editingHole < 18 ? editingHole + 1 : 1;
                        setEditingHole(nextHole);
                        setCurrentHole(nextHole);
                        setActiveScoreField('strokes');
                      }
                    }
                  }}
                  className="flex-[2] bg-emerald-600 py-5 rounded-2xl font-black uppercase tracking-widest text-white flex items-center justify-center gap-3 active:scale-95 transition-all shadow-[0_10px_30px_rgba(16,185,129,0.3)]"
                >
                  {activeScoreField === 'strokes' ? 'PASSAGE PUTTS' : editingHole === 18 ? 'TERMINER' : `TROU SUIVANT (${editingHole + 1})`}
                  <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mode Selector Overlay */}
      <AnimatePresence>
        {showModeSelector && (
          <motion.div 
            key="mode-selector-overlay"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="fixed inset-0 z-[300] bg-black/95 p-6 flex flex-col pt-16"
          >
            <div className="flex justify-between items-center mb-12">
               <h3 className="font-black text-[#c9964a] text-xs tracking-[0.5em] uppercase">SYSTÈME DE CALCUL</h3>
               <button onClick={() => setShowModeSelector(false)} className="text-white/40 text-[10px] font-black border border-white/10 px-6 py-2 rounded-full uppercase tracking-widest active:scale-90 transition-transform">Fermer</button>
            </div>

            <div className="flex-1 space-y-4">
               {[
                 { id: GameMode.STROKE, name: 'STROKE PLAY', desc: 'Score classique brut vs par. Standard tactique.', color: 'border-white/10' },
                 { id: GameMode.STABLEFORD, name: 'STABLEFORD', desc: 'Calcul de points net. Analyse de performance.', color: 'border-[#c9964a]/30' },
                 { id: GameMode.MATCHPLAY, name: 'MATCH PLAY', desc: 'Face-à-face tactique. Domination de trous.', color: 'border-red-600/30' },
               ].map((mode) => (
                 <motion.button
                   key={`gamemode-${mode.id}`}
                   whileTap={{ scale: 0.98 }}
                   onClick={() => { setSelectedMode(mode.id); setShowModeSelector(false); }}
                   className={`w-full bg-white/5 p-8 text-left rounded-[2rem] border transition-all ${mode.color} ${selectedMode === mode.id ? 'bg-white/10 scale-[1.02]' : ''}`}
                 >
                    <h4 className="text-white text-xl font-black italic mb-2 tracking-tight uppercase">{mode.name}</h4>
                    <p className="text-[10px] text-white/40 font-bold mb-4 uppercase tracking-widest leading-relaxed">{mode.desc}</p>
                    {selectedMode === mode.id && <div className="text-[10px] font-black text-[#c9964a] flex items-center gap-2 uppercase tracking-[0.3em]"><Check size={12}/> ACTIF</div>}
                 </motion.button>
               ))}
            </div>

            <div className="flex items-center gap-3 text-[9px] font-black text-white/20 tracking-[0.3em] uppercase justify-center mt-8 border-t border-white/10 pt-8">
               <Info size={12} /> PROTOCOLE DE CALCUL HOMOLOGUÉ THE CHOSE
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

