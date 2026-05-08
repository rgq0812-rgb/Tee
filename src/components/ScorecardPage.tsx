import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, ChevronDown, Check, Info, Target, MapPin, X, Plus, Minus, ArrowRight, Brain, Sparkles, Loader2, ShieldCheck, Zap, Activity, Share2 } from 'lucide-react';
import { useScore, GameMode } from './use-score';
import { getGameDebrief, generateSpeech, speakWithBrowser } from '../services/geminiService';
import { playRawPcm } from '../lib/audioUtils';
import { CADDIES } from '../constants';

export default function ScorecardPage({ 
  user,
  scorecard, setScorecard, 
  selectedCourse, setSelectedCourse,
  currentHole, setCurrentHole,
  activeCaddie, setActiveCaddie,
  selectedMode, setSelectedMode,
  handicap, setHandicap,
  arsenal, setArsenal,
  setShowMentorModal, setMentorInitialMessage,
  setMissionStarted, setAppPath,
  displayMode,
  setActiveTab,
  selectedTee
}: any) {
  const isSolar = displayMode === 'solar';
  const { calculateStableford } = useScore();
  const [playerName] = useState(() => localStorage.getItem('onyx_player_name') || 'ONYX_OPERATIVE');
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showCaddieSelector, setShowCaddieSelector] = useState(false);
  const [showArsenalMenu, setShowArsenalMenu] = useState(false);
  const [editingHole, setEditingHole] = useState<number | null>(null);
  const [activeScoreField, setActiveScoreField] = useState<'strokes' | 'putts'>('strokes');
  const [isLoadingDebrief, setIsLoadingDebrief] = useState(false);
  const [debriefText, setDebriefText] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const formattedHandicap = useMemo(() => Number(handicap).toFixed(1), [handicap]);

  const scorecardData = useMemo(() => {
    return selectedCourse.holes.map((hole: any) => ({
      hole: hole.number,
      par: hole.par,
      distance: (hole.distanceTee as any)?.[selectedTee] || hole.distanceTee?.white,
      strokes: scorecard[hole.number]?.strokes || null,
      putts: scorecard[hole.number]?.putts || 0,
    }));
  }, [scorecard, selectedCourse, selectedTee]);

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
        const resultData = await generateSpeech(text);
        if (typeof resultData === 'object' && resultData.fallback) {
          speakWithBrowser(resultData.text);
        } else if (typeof resultData === 'string') {
          await playRawPcm(resultData);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingDebrief(false);
    }
  };

  const handleSaveScorecard = () => {
    if (Object.keys(scorecard).length === 0) return;
    setSaveStatus('saving');
    
    try {
      const savedRounds = JSON.parse(localStorage.getItem('the-chose-saved-rounds') || '[]');
      const newRound = {
        id: Date.now(),
        date: new Date().toISOString(),
        courseId: selectedCourse.id,
        courseName: selectedCourse.name,
        scorecard: scorecard,
        totalScore,
        totalStrokes,
        mode: selectedMode,
        handicapAtTime: handicap
      };
      
      savedRounds.unshift(newRound);
      localStorage.setItem('the-chose-saved-rounds', JSON.stringify(savedRounds.slice(0, 50)));
      
      setTimeout(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }, 1000);
    } catch (e) {
      console.error(e);
      setSaveStatus('idle');
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
    <div className={`relative -mx-6 -mt-6 min-h-[calc(100vh-140px)] p-6 font-sans overflow-x-hidden transition-colors duration-300 ${isSolar ? 'bg-white text-zinc-950 font-black' : 'bg-black text-white'}`}>
      {/* Background Dots */}
      <div className={`absolute inset-0 z-0 pointer-events-none opacity-5 ${isSolar ? 'bg-[radial-gradient(circle_at_center,_#000_1px,_transparent_1px)]' : 'bg-[radial-gradient(circle_at_center,_#c9964a_1px,_transparent_1px)]'}`} style={{ backgroundSize: '30px 30px' }} />

      <AnimatePresence>
        {showResetConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[500] flex items-center justify-center p-6 backdrop-blur-2xl ${isSolar ? 'bg-white/95' : 'bg-black/95'}`}
          >
            <div className={`border p-8 rounded-[2.5rem] max-w-sm w-full text-center shadow-2xl ${isSolar ? 'bg-white border-zinc-950' : 'bg-[#111] border-red-600/30'}`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-red-600/10 text-red-600`}>
                <X size={32} />
              </div>
              <h3 className={`text-xl font-black italic uppercase mb-2 ${isSolar ? 'text-zinc-950' : 'text-white'}`}>REMISE À ZÉRO</h3>
              <p className={`text-xs uppercase tracking-widest leading-relaxed mb-8 ${isSolar ? 'text-zinc-500 font-bold' : 'text-white/40'}`}>Voulez-vous vraiment effacer tout ?</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => { setScorecard({}); setMissionStarted(false); setShowResetConfirm(false); }} className="w-full bg-red-600 text-white h-14 rounded-2xl font-black uppercase tracking-widest">EFFACER TOUT</button>
                <button onClick={() => setShowResetConfirm(false)} className={`w-full h-14 rounded-2xl font-black uppercase tracking-widest border ${isSolar ? 'text-zinc-400 border-zinc-200' : 'text-white/40 border-white/10'}`}>ANNULER</button>
              </div>
            </div>
          </motion.div>
        )}

        {/* MODAL CADDIE / CENTRE TACTIQUE */}
        <AnimatePresence>
        {showCaddieSelector && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[650] p-6 flex flex-col font-sans backdrop-blur-3xl ${isSolar ? 'bg-zinc-50/98' : 'bg-black/98'}`}
          >
            <div className="flex justify-between items-center mb-8 pt-16">
              <div className="flex flex-col">
                <h3 className={`text-2xl font-black italic uppercase tracking-tighter ${isSolar ? 'text-black' : 'text-white'}`}>CENTRE TACTIQUE</h3>
                <span className={`text-[8px] font-black uppercase tracking-[0.4em] ${isSolar ? 'text-zinc-400' : 'text-white/20'}`}>OPÉRATEUR : {playerName}</span>
              </div>
              <button 
                onClick={() => { setShowCaddieSelector(false); setDebriefText(null); }} 
                className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${isSolar ? 'bg-black text-white border-black shadow-xl shadow-black/20' : 'bg-white/5 border-white/20 text-white/40'}`}
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 space-y-8 overflow-y-auto no-scrollbar pb-32 focus:outline-none">
              
              {/* Tactical Index Slider with Precision Controls */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <Activity size={14} className={isSolar ? 'text-black' : 'text-[#c9964a]'} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isSolar ? 'text-black' : 'text-white/40'}`}>CALIBRATION INDEX</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setHandicap(Math.max(0, parseFloat((handicap - 0.1).toFixed(1))))}
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center active:scale-90 transition-all ${isSolar ? 'bg-zinc-100 border-zinc-200' : 'bg-white/5 border-white/10'}`}
                    >
                      <Minus size={14} />
                    </button>
                    <span className={`text-3xl font-mono font-black italic min-w-[60px] text-center ${isSolar ? 'text-black font-black' : 'text-[#c9964a]'}`}>{Number(handicap).toFixed(1)}</span>
                    <button 
                      onClick={() => setHandicap(parseFloat((handicap + 0.1).toFixed(1)))}
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center active:scale-90 transition-all ${isSolar ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-white/10 border-white/10'}`}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <div className={`p-8 rounded-[2.5rem] border-2 shadow-sm ${isSolar ? 'bg-white border-zinc-950' : 'bg-white/5 border-white/10'}`}>
                  <input 
                    type="range"
                    min="0"
                    max="54"
                    step="0.1"
                    value={handicap}
                    onChange={(e) => setHandicap(parseFloat(e.target.value))}
                    className={`w-full h-3 rounded-lg appearance-none cursor-pointer accent-red-600 ${isSolar ? 'bg-zinc-100' : 'bg-white/10'}`}
                  />
                  <div className="flex justify-between mt-4 text-[8px] font-black opacity-30 select-none">
                    <span>SCRATCH (0.0)</span>
                    <span>MOYEN (24.0)</span>
                    <span>DÉBUTANT (54.0)</span>
                  </div>
                </div>
              </div>

              {/* Arsenal Calibration Menu with Dynamic Editing */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-2">
                  <Zap size={14} className={isSolar ? 'text-black' : 'text-red-600'} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isSolar ? 'text-black' : 'text-white/40'}`}>ARMEMENT TACTIQUE</span>
                </div>
                <div className={`rounded-[2.5rem] border-2 overflow-hidden shadow-sm ${isSolar ? 'bg-white border-zinc-950' : 'bg-white/5 border-white/10'}`}>
                   <div className="max-h-64 overflow-y-auto no-scrollbar divide-y divide-current/5">
                      {arsenal.map((club: any, idx: number) => (
                        <div key={`tactical-club-edit-${club.id}-${idx}`} className="px-6 py-5 flex items-center justify-between group">
                           <div className="flex flex-col">
                              <span className={`text-[8px] font-black uppercase opacity-40 ${isSolar ? 'text-black' : 'text-white'}`}>{club.type}</span>
                              <span className={`text-sm font-black italic uppercase ${isSolar ? 'text-black' : 'text-white'}`}>{club.name}</span>
                           </div>
                           <div className="flex items-center gap-4">
                              <button 
                                onClick={() => {
                                  const newArsenal = [...arsenal];
                                  newArsenal[idx] = { ...club, dist: Math.max(0, club.dist - 5) };
                                  setArsenal(newArsenal);
                                }}
                                className={`w-8 h-8 rounded-lg border flex items-center justify-center active:scale-90 transition-all ${isSolar ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border-white/10'}`}
                              >
                                <Minus size={14} />
                              </button>
                              <div className="flex items-baseline gap-1 min-w-[60px] justify-center">
                                <span className={`text-xl font-black font-mono italic ${isSolar ? 'text-zinc-950 font-black' : 'text-white'}`}>{club.dist}</span>
                                <span className="text-[8px] font-black opacity-20">M</span>
                              </div>
                              <button 
                                onClick={() => {
                                  const newArsenal = [...arsenal];
                                  newArsenal[idx] = { ...club, dist: club.dist + 5 };
                                  setArsenal(newArsenal);
                                }}
                                className={`w-8 h-8 rounded-lg border flex items-center justify-center active:scale-90 transition-all ${isSolar ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-white/10 border-white/10'}`}
                              >
                                <Plus size={14} />
                              </button>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              </div>

              {/* Caddie Selection & Validation */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                  <Brain size={14} className={isSolar ? 'text-black' : 'text-[#c9964a]'} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isSolar ? 'text-black' : 'text-white/40'}`}>SÉLECTION DU CADDIE</span>
                </div>
                
                <div className="space-y-2">
                  {Object.values(CADDIES).map((c: any) => (
                    <button 
                      key={c.id}
                      onClick={() => setActiveCaddie(c)}
                      className={`w-full p-6 p-4 rounded-[2rem] border-2 text-left transition-all flex items-center gap-6 shadow-sm ${activeCaddie.id === c.id ? (isSolar ? 'bg-white border-zinc-950 shadow-xl' : 'bg-[#c9964a]/10 border-[#c9964a] shadow-lg shadow-[#c9964a]/10') : (isSolar ? 'bg-white border-zinc-100 opacity-40' : 'bg-white/5 border-white/10 opacity-40')}`}
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${activeCaddie.id === c.id ? (isSolar ? 'bg-zinc-950 text-white' : 'bg-black text-[#c9964a]') : 'bg-white/10'}`}>
                        <Brain size={24} />
                      </div>
                      <div className="flex-1">
                        <h4 className={`text-lg font-black italic uppercase tracking-tight leading-none ${isSolar && activeCaddie.id === c.id ? 'text-black' : ''}`}>{c.name}</h4>
                        <p className={`text-[9px] font-black uppercase tracking-widest mt-1 opacity-60 ${isSolar && activeCaddie.id === c.id ? 'text-zinc-950 font-black' : ''}`}>{c.title}</p>
                      </div>
                      {activeCaddie.id === c.id && (
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isSolar ? 'bg-zinc-950 text-white' : 'bg-[#c9964a] text-black'}`}>
                          <Check size={14} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Mission Validation Button */}
                <div className="pt-6 relative">
                  <motion.button
                    disabled={isLoadingDebrief}
                    onClick={async () => {
                      setIsLoadingDebrief(true);
                      setDebriefText(null);
                      try {
                        const text = await getGameDebrief(scorecard, totalScore, totalStrokes, `Donne-moi une validation de mission en seulement DEUX MOTS chirurgicaux en tant que ${activeCaddie.name}.`);
                        const cleanText = text.replace(/[^a-zA-Z\s]/g, '').split(' ').filter((w: string) => w.length > 1).slice(0, 2).join(' ').toUpperCase();
                        setDebriefText(cleanText);
                        
                        const isMuted = localStorage.getItem('onyx_voice') === 'false';
                        if (!isMuted) {
                          const resultData = await generateSpeech(text);
                          if (typeof resultData === 'object' && resultData.fallback) speakWithBrowser(resultData.text);
                          else if (typeof resultData === 'string') await playRawPcm(resultData);
                        }

                        // Short delay for the user to see the "Mission Validated" text, then redirect to Hub
                        setTimeout(() => {
                          setShowCaddieSelector(false);
                          setActiveTab('dashboard');
                        }, 1800);
                      } catch (e) {
                        console.error(e);
                      } finally {
                        setIsLoadingDebrief(false);
                      }
                    }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-full h-24 rounded-[2.5rem] flex flex-col items-center justify-center transition-all relative overflow-hidden group shadow-2xl ${isSolar ? 'bg-zinc-950 text-white font-black' : 'bg-red-600 text-white shadow-lg shadow-red-600/30'}`}
                  >
                    {debriefText ? (
                      <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] opacity-40 mb-1">MISSION VALIDÉE</span>
                        <span className="text-3xl font-black italic uppercase tracking-widest">{debriefText}</span>
                      </motion.div>
                    ) : (
                      <>
                        <ShieldCheck size={28} className="mb-1" />
                        <span className="text-[10px] font-black uppercase tracking-[0.5em]">VALIDER MISSION ONYX</span>
                        {isLoadingDebrief && <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center"><Loader2 className="animate-spin text-white" size={32} /></div>}
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>

        {/* MODAL ARSENAL */}
        {showArsenalMenu && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[650] p-6 flex flex-col backdrop-blur-3xl ${isSolar ? 'bg-white/95' : 'bg-black/95'}`}
          >
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black italic uppercase tracking-tighter">ARSENAL TACTIQUE</h3>
              <button onClick={() => setShowArsenalMenu(false)} className="w-12 h-12 rounded-full border border-current flex items-center justify-center"><X size={24} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 overflow-y-auto pr-2 no-scrollbar">
              {arsenal.map((club: any, idx: number) => (
                <div key={`arsenal-menu-${club.id}-${idx}`} className={`p-5 rounded-3xl border ${club.dist > 0 ? (isSolar ? 'bg-white border-zinc-950 shadow-md' : 'bg-white/10 border-white/20') : 'opacity-20 grayscale border-white/5'}`}>
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">{club.type}</p>
                   <h5 className="text-xl font-black italic uppercase">{club.name}</h5>
                   <div className="mt-4 flex items-end gap-1">
                      <span className="text-2xl font-black font-mono">{club.dist}</span>
                      <span className="text-[10px] font-black uppercase mb-1 opacity-40">M</span>
                   </div>
                </div>
              ))}
            </div>
            <p className="mt-10 text-[10px] font-black uppercase tracking-[0.3em] text-center opacity-30 italic">MODIFIEZ VOTRE ARSENAL DANS LE PROFIL</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 space-y-8 pb-32">
        {/* Tactical Header */}
        <section className={`border-b pb-8 pt-4 space-y-6 ${isSolar ? 'border-zinc-950/10' : 'border-white/10'}`}>
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <div className="flex items-center gap-4 mb-4">
                 <div className={`h-12 border-l-4 ${isSolar ? 'border-zinc-950' : 'border-red-600'} pl-4 flex flex-col justify-center`}>
                    <span className={`text-[8px] font-black uppercase tracking-[0.4em] ${isSolar ? 'text-zinc-400' : 'text-white/30'}`}>COMMANDANT</span>
                    <span className="text-2xl font-black italic uppercase tracking-tighter truncate max-w-[200px]">{playerName}</span>
                 </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${isSolar ? 'text-zinc-300' : 'text-white/20'}`}>INDEX TACTIQUE</span>
                  <span className={`text-xl font-mono font-black italic ${isSolar ? 'text-zinc-950 font-black' : 'text-[#c9964a]'}`}>{formattedHandicap}</span>
                </div>
                <div className={`w-px h-8 ${isSolar ? 'bg-zinc-200' : 'bg-white/10'}`} />
                <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${isSolar ? 'text-zinc-300' : 'text-white/20'}`}>ARSENAL</span>
                  <span className={`text-xl font-mono font-black italic ${isSolar ? 'text-emerald-600 font-black' : 'text-white'}`}>{arsenal.filter((a: any) => a.dist > 0).length}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
               <button 
                onClick={() => {
                  if (Object.keys(scorecard).length > 0) {
                    if (confirm("Retourner au briefing ? Votre progression actuelle sera conservée.")) {
                      setMissionStarted(false);
                      setAppPath('player');
                    }
                  } else {
                    setMissionStarted(false);
                    setAppPath('player');
                  }
                }}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${isSolar ? 'bg-zinc-950 text-white border-zinc-950 shadow-lg' : 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/30'}`}
               >
                 BRIEFING
               </button>
               <button 
                 onClick={() => setShowCaddieSelector(true)}
                 className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${isSolar ? 'bg-white border-zinc-950 text-zinc-950 font-black' : 'bg-white/10 border-white/20 text-white'}`}
               >
                 TACTIQUE
               </button>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-4">
          <div className={`border p-6 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden shadow-2xl ${isSolar ? 'bg-white border-zinc-950 shadow-md' : 'bg-black border-white/20'}`}>
            <p className={`text-[11px] font-black tracking-widest uppercase mb-2 ${isSolar ? 'text-zinc-950 font-black' : 'text-[#c9964a]'}`}>SCORE TOTAL</p>
            <div className={`text-6xl font-black italic font-mono ${totalScore < 0 ? 'text-green-500' : totalScore === 0 ? (isSolar ? 'text-zinc-950 font-black' : 'text-white') : 'text-red-600'}`}>
               {totalScore > 0 ? `+${totalScore}` : totalScore === 0 ? 'E' : totalScore}
            </div>
            <div className={`mt-2 text-[8px] font-black uppercase tracking-widest ${isSolar ? 'text-zinc-300' : 'text-white/20'}`}>VAR / PAR</div>
          </div>
          <div className={`border p-6 rounded-3xl flex flex-col items-center justify-center shadow-2xl ${isSolar ? 'bg-white border-zinc-950 shadow-md' : 'bg-black border-white/20'}`}>
            <p className={`text-[11px] font-black tracking-widest uppercase mb-2 ${isSolar ? 'text-zinc-950 font-black' : 'text-[#c9964a]'}`}>COUPS BRUTS</p>
            <div className={`text-6xl font-black italic font-mono ${isSolar ? 'text-zinc-950 font-black' : 'text-white'}`}>
               {totalStrokes || '--'}
            </div>
            <button onClick={() => setShowArsenalMenu(true)} className={`mt-2 text-[8px] font-black uppercase tracking-widest text-emerald-600 font-black`}>VIEW ARSENAL</button>
          </div>
        </div>

        <div className={`border rounded-3xl overflow-hidden shadow-xl ${isSolar ? 'bg-white border-zinc-950 border-2' : 'bg-black border-white/20'}`}>
          <div className={`p-4 border-b flex items-center justify-between ${isSolar ? 'bg-zinc-50 border-zinc-950/10' : 'bg-white/5 border-white/10'}`}>
            <div className="flex items-center gap-3">
              <MapPin size={14} className="text-red-600" />
              <span className="text-[10px] font-black uppercase tracking-widest">{selectedCourse.name}</span>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'Ma carte THE CHOSE',
                      text: `J'ai terminé ma partie à ${selectedCourse.name} avec un score de ${totalScore > 0 ? '+' : ''}${totalScore}.`,
                      url: window.location.href
                    }).catch(console.error);
                  } else {
                    alert("Le partage n'est pas supporté sur ce navigateur.");
                  }
                }}
                className="text-[10px] font-black text-[#c9964a]"
              >
                PARTAGE
              </button>
              <button onClick={() => setShowResetConfirm(true)} className="text-[10px] font-black text-red-600">RAZ</button>
              <button onClick={handleSaveScorecard} className="text-[10px] font-black text-emerald-600">{saveStatus === 'saving' ? 'SYNC...' : 'SAUVER'}</button>
            </div>
          </div>
          {(isGameFinished || currentHole === 18) && (
            <div className={`p-6 border-b flex flex-col gap-6 ${isSolar ? 'border-zinc-950/10 bg-zinc-50' : 'border-white/10 bg-[#c9964a]/5'}`}>
              <button 
                onClick={handleAdamDebrief}
                className={`relative w-full h-40 rounded-3xl overflow-hidden transition-all ${isSolar ? 'bg-zinc-950 text-white shadow-xl' : 'bg-[#c9964a] text-black shadow-lg shadow-[#c9964a]/20'}`}
              >
                <div className="flex flex-col items-center justify-center h-full gap-2 px-6">
                  <Sparkles size={24} />
                  <span className="text-xl font-black italic uppercase italic tracking-tighter">19ÈME TROU & BILAN D'ADAM</span>
                </div>
                {isLoadingDebrief && <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>}
              </button>
              {debriefText && (
                <div className={`p-6 rounded-2xl text-[13px] leading-relaxed italic ${isSolar ? 'bg-zinc-100 text-black border-2 border-zinc-950' : 'bg-white/5 text-white/80'}`}>
                  "{debriefText}"
                </div>
              )}
            </div>
          )}

          <div className={`px-6 py-5 flex text-[10px] font-black tracking-[0.4em] uppercase border-b ${isSolar ? 'bg-zinc-950 text-white' : 'bg-white/10 text-[#c9964a]'}`}>
            <span className="w-10 text-left">N°</span>
            <span className="w-14 text-center">DIST</span>
            <span className="w-10 text-center">PAR</span>
            <span className="flex-1 text-center font-black">SCORE</span>
            <span className="w-12 text-right">VAR</span>
          </div>
          <div className={`divide-y ${isSolar ? 'divide-zinc-950/10' : 'divide-white/10'}`}>
            {scorecardData.map((h: any, idx: number) => (
              <button 
                key={`score-hole-row-${h.hole}-${idx}`} 
                onClick={() => { setEditingHole(h.hole); setCurrentHole(h.hole); }}
                className={`w-full px-6 py-5 flex items-center transition-colors ${currentHole === h.hole ? (isSolar ? 'bg-zinc-100' : 'bg-red-600/10') : ''}`}
              >
                <span className={`w-10 font-mono text-lg font-black ${isSolar ? 'text-zinc-300' : 'text-white/30'}`}>{h.hole < 10 ? `0${h.hole}` : h.hole}</span>
                <span className={`w-14 text-center font-mono text-xs font-bold opacity-60`}>{h.distance}m</span>
                <span className={`w-10 text-center font-mono text-lg font-bold opacity-30`}>{h.par}</span>
                <div className="flex-1 flex justify-center">
                  {h.strokes ? (
                    <span className={`font-mono text-3xl font-black italic ${isSolar ? 'text-zinc-950' : 'text-white'}`}>{h.strokes}</span>
                  ) : (
                    <span className="opacity-10 text-xl font-black">----</span>
                  )}
                </div>
                <div className="w-12 text-right font-mono font-black italic text-lg">
                  {h.strokes ? (
                    <span className={h.strokes < h.par ? 'text-green-500' : h.strokes === h.par ? (isSolar ? 'text-zinc-300' : 'text-white/20') : 'text-red-500'}>
                      {h.strokes - h.par > 0 ? `+${h.strokes - h.par}` : h.strokes - h.par === 0 ? 'E' : h.strokes - h.par}
                    </span>
                  ) : <Plus size={14} className="opacity-10 ml-auto" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {editingHole !== null && (
          <motion.div 
            key="hole-score-editor"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className={`fixed inset-x-0 bottom-0 z-[600] border-t-2 p-8 pb-32 rounded-t-[3rem] shadow-2xl transition-all ${isSolar ? 'bg-white border-zinc-950' : 'bg-zinc-900 border-[#c9964a]/30'}`}
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <h3 className="text-3xl font-black italic uppercase tracking-tighter">TROU {editingHole}</h3>
                <div className={`px-3 py-1 rounded bg-black/10 text-[10px] font-black uppercase`}>PAR {selectedCourse.holes[editingHole - 1].par}</div>
              </div>
              <button onClick={() => setEditingHole(null)} className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center"><X size={24}/></button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
               <button onClick={() => setActiveScoreField('strokes')} className={`p-6 rounded-2xl border-2 transition-all ${activeScoreField === 'strokes' ? (isSolar ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-[#c9964a] border-[#c9964a] text-black') : (isSolar ? 'bg-white border-zinc-100 text-zinc-300' : 'bg-white/5 border-white/10 text-white/40')}`}>
                 <span className="text-[10px] font-black uppercase mb-2 block">STROKES</span>
                 <span className="text-5xl font-black font-mono italic">{scorecard[editingHole]?.strokes || '--'}</span>
               </button>
               <button onClick={() => setActiveScoreField('putts')} className={`p-6 rounded-2xl border-2 transition-all ${activeScoreField === 'putts' ? (isSolar ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-[#c9964a] border-[#c9964a] text-black') : (isSolar ? 'bg-white border-zinc-100 text-zinc-300' : 'bg-white/5 border-white/10 text-white/40')}`}>
                 <span className="text-[10px] font-black uppercase mb-2 block">PUTTS</span>
                 <span className="text-5xl font-black font-mono italic">{scorecard[editingHole]?.putts || '0'}</span>
               </button>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-8">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num, pidx) => (
                <button 
                  key={`score-pad-${editingHole}-${num}-${pidx}`}
                  onClick={() => {
                    if (activeScoreField === 'strokes') updateScore(editingHole, num);
                    else updateScore(editingHole, scorecard[editingHole]?.strokes || 0, num);
                  }}
                  className={`h-16 rounded-2xl border-2 font-mono text-2xl font-black transition-all ${
                    (activeScoreField === 'strokes' ? scorecard[editingHole]?.strokes === num : scorecard[editingHole]?.putts === num) 
                    ? (isSolar ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-white text-black border-white shadow-xl') 
                    : (isSolar ? 'bg-zinc-50 border-zinc-100 text-zinc-400' : 'bg-white/5 border-white/10 text-white/60')
                  }`}
                >
                  {num}
                </button>
              ))}
              <button onClick={() => updateScore(editingHole, 0, 0)} className="h-16 rounded-2xl border-2 border-red-600/30 text-red-500 font-black text-xs uppercase">RAZ</button>
              <button 
                onClick={() => {
                  if (editingHole < 18) {
                    const next = editingHole + 1;
                    setEditingHole(next);
                    setCurrentHole(next);
                    setActiveScoreField('strokes');
                  } else {
                    setEditingHole(null);
                  }
                }}
                className={`col-span-2 h-16 rounded-2xl font-black uppercase text-xs tracking-widest ${isSolar ? 'bg-zinc-950 text-white' : 'bg-emerald-600 text-white shadow-lg'}`}
              >
                {editingHole === 18 ? 'TERMINER' : 'SUIVANT ›'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
