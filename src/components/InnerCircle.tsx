import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Users, Award, Share2, Star, ChevronRight, Download, Target, Zap, Activity, Brain, Ruler, Shield, Plus, Minus, Check, Settings } from 'lucide-react';
import { toPng } from 'html-to-image';
import { CADDIES } from '../constants';

export default function InnerCircle({ 
  displayMode,
  handicap, setHandicap,
  arsenal, setArsenal,
  playerForm, setPlayerForm,
  selectedTee, setSelectedTee,
  selectedMode, setSelectedMode
}: any) {
  const isSolar = displayMode === 'solar';
  const [subTab, setSubTab] = useState<'lobby' | 'leaderboard' | 'tactical' | 'share'>('tactical');
  const certRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!certRef.current) return;
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const dataUrl = await toPng(certRef.current, { 
        quality: 1, 
        pixelRatio: 2,
        backgroundColor: isSolar ? '#ffffff' : '#000000'
      });
      const link = document.createElement('a');
      link.download = `ONYX_Performance_${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  const exploits = [
    { id: 1, user: "Jean-Michel", type: "BIRDIE", hole: 4, course: "Saint-Nom-la-Bretèche", score: -1, time: "Il y a 12m" },
    { id: 2, user: "Nicolas P.", type: "EAGLE", hole: 12, course: "Golf de Joyenval", score: -2, time: "Il y a 45m" },
    { id: 3, user: "Marc B.", type: "BIRDIE", hole: 18, course: "Chantilly Old Course", score: -5, time: "Il y a 1h" },
  ];

  return (
    <div className={`space-y-6 ${isSolar ? 'text-black' : 'text-white'}`}>
      <div className="flex justify-between items-end mb-2">
        <div className="pt-4">
          <h2 className={`text-3xl font-cinzel font-black tracking-tight uppercase italic ${isSolar ? 'text-black' : 'text-white'}`}>Académie</h2>
          <p className={`text-[10px] font-mono tracking-[0.2em] uppercase mt-1 ${isSolar ? 'text-zinc-500 font-bold' : 'text-[#c9964a]'}`}>Progression & Paramètres Tactiques</p>
        </div>
      </div>

      <div className={`flex gap-2 p-1 rounded-xl border sticky top-[72px] z-40 backdrop-blur-md ${isSolar ? 'bg-zinc-100 border-zinc-200' : 'bg-white/5 border-white/5'}`}>
        {[
          { id: 'tactical', label: 'Tactique' },
          { id: 'leaderboard', label: 'Classement' },
          { id: 'lobby', label: 'Lobby' },
          { id: 'share', label: 'Certificat' }
        ].map((t) => (
          <button
            key={`subtab-${t.id}`}
            onClick={() => setSubTab(t.id as any)}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
              subTab === t.id 
                ? (isSolar ? 'bg-black text-white shadow-lg' : 'bg-[#c9964a] text-black shadow-lg') 
                : (isSolar ? 'text-zinc-400 hover:text-black' : 'text-gray-500 hover:text-gray-300')
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {subTab === 'tactical' && (
          <motion.div
            key="tactical-params"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8 pb-12"
          >
            {/* AI Mentor Presence */}
            <div className={`p-6 rounded-[2rem] border-2 flex items-center gap-6 relative overflow-hidden ${isSolar ? 'bg-zinc-50 border-zinc-950' : 'bg-white/5 border-white/10 shadow-[0_0_50px_rgba(201,150,74,0.05)]'}`}>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 ${isSolar ? 'bg-zinc-950 text-white' : 'bg-black border-[#c9964a] text-[#c9964a]'}`}>
                <Brain size={32} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black italic uppercase tracking-tighter leading-none mb-2">Centre de Commande</h3>
                <p className="text-[10px] italic opacity-60 leading-relaxed font-medium">"Opérateur, centralisez ici vos paramètres de combat. Ajustez votre handicap et votre arsenal pour une synchronisation optimale."</p>
              </div>
            </div>

            {/* Handicap Calibration */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2 text-red-600">
                  <Activity size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">INDEX TACTIQUE (HCP)</span>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => setHandicap(Math.max(0, Number((handicap - 0.1).toFixed(1))))} className={`w-10 h-10 rounded-xl border flex items-center justify-center ${isSolar ? 'bg-zinc-100 border-zinc-200' : 'bg-white/5 border-white/10'}`}><Minus size={16}/></button>
                  <span className="text-4xl font-mono font-black italic">{Number(handicap).toFixed(1)}</span>
                  <button onClick={() => setHandicap(Number((handicap + 0.1).toFixed(1)))} className={`w-10 h-10 rounded-xl border flex items-center justify-center ${isSolar ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-white/10 border-white/10'}`}><Plus size={16}/></button>
                </div>
              </div>
              <div className={`p-8 rounded-[2.5rem] border-2 ${isSolar ? 'bg-white border-zinc-950' : 'bg-white/5 border-white/10'}`}>
                <input 
                  type="range"
                  min="0"
                  max="54"
                  step="0.1"
                  value={handicap}
                  onChange={(e) => setHandicap(parseFloat(e.target.value))}
                  className="w-full accent-red-600"
                />
                <div className="flex justify-between mt-4 text-[8px] font-black opacity-30 tracking-widest">
                  <span>SCRATCH</span>
                  <span>MOYEN</span>
                  <span>NOVICE</span>
                </div>
              </div>
            </div>

            {/* Arsenal Calibration */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2 text-[#c9964a]">
                  <Zap size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">CALIBRATION DE L'ARSENAL</span>
                </div>
                <span className={`text-[10px] font-black uppercase opacity-40`}>{arsenal.filter((a: any) => a.dist > 0).length} CLUBS ACTIFS</span>
              </div>
              <div className={`rounded-[2.5rem] border-2 overflow-hidden ${isSolar ? 'bg-white border-zinc-950' : 'bg-white/5 border-white/10'}`}>
                <div className="max-h-80 overflow-y-auto no-scrollbar divide-y divide-current/5">
                  {arsenal.map((club: any, idx: number) => (
                    <div key={`academy-arsenal-${club.id}-${idx}`} className="px-6 py-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase opacity-40">{club.type}</span>
                        <span className="text-sm font-black italic uppercase">{club.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => {
                            const n = [...arsenal];
                            n[idx] = { ...club, dist: Math.max(0, club.dist - 5) };
                            setArsenal(n);
                          }}
                          className={`w-8 h-8 rounded-lg border flex items-center justify-center ${isSolar ? 'bg-zinc-100 border-zinc-200' : 'bg-white/5 border-white/5'}`}
                        >
                          <Minus size={14} />
                        </button>
                        <div className="flex items-baseline gap-1 min-w-[70px] justify-center">
                          <span className="text-2xl font-black font-mono">{club.dist}</span>
                          <span className="text-[8px] font-black uppercase opacity-40">M</span>
                        </div>
                        <button 
                          onClick={() => {
                            const n = [...arsenal];
                            n[idx] = { ...club, dist: club.dist + 5 };
                            setArsenal(n);
                          }}
                          className={`w-8 h-8 rounded-lg border flex items-center justify-center ${isSolar ? 'bg-zinc-950 text-white' : 'bg-white/10 border-white/10'}`}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mode & Tee Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-2 text-emerald-600">
                  <Ruler size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">DÉPART (TEE)</span>
                </div>
                <div className={`p-4 rounded-[2rem] border-2 flex flex-col gap-2 ${isSolar ? 'bg-white border-zinc-950' : 'bg-white/5 border-white/10'}`}>
                  {['black', 'white', 'yellow', 'blue', 'red'].map((t, idx) => (
                    <button 
                      key={`tee-aca-v2-${t}-${idx}`}
                      onClick={() => setSelectedTee(t as any)}
                      className={`h-10 rounded-xl flex items-center justify-between px-4 transition-all ${selectedTee === t ? (isSolar ? 'bg-zinc-950 text-white' : 'bg-white text-black shadow-lg shadow-white/10') : 'opacity-30'}`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest">{t}</span>
                      <div className={`w-3 h-3 rounded-full border border-white/20`} style={{ backgroundColor: t === 'black' ? '#000' : t === 'yellow' ? '#fbbf24' : t === 'red' ? '#dc2626' : t === 'blue' ? '#2563eb' : '#fff' }} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 px-2 text-blue-600">
                  <Shield size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">MODE DE JEU</span>
                </div>
                <div className={`p-4 rounded-[2rem] border-2 flex flex-col gap-2 ${isSolar ? 'bg-white border-zinc-950' : 'bg-white/5 border-white/10'}`}>
                  {['STROKE', 'STABLEFORD', 'MATCH'].map((m, idx) => (
                    <button 
                      key={`mode-aca-v2-${m}-${idx}`}
                      onClick={() => setSelectedMode(m)}
                      className={`h-10 rounded-xl flex items-center justify-center transition-all ${selectedMode === m ? (isSolar ? 'bg-zinc-950 text-white' : 'bg-white text-black shadow-lg') : 'opacity-30'}`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest">{m}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Units & Preference */}
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-2 text-[#c9964a]">
                  <Star size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">FORME DU JOUR (VIBE)</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {['ZEN', 'COMBAT', 'ELITE'].map((v, idx) => (
                    <button 
                      key={`vibe-v2-${v}-${idx}`}
                      onClick={() => setPlayerForm(v)}
                      className={`h-12 rounded-xl border-2 font-black text-[9px] uppercase tracking-widest transition-all ${playerForm === v ? (isSolar ? 'bg-zinc-950 text-white' : 'bg-white text-black shadow-lg') : 'bg-white/5 opacity-40 hover:opacity-100'}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 px-2 opacity-50">
                  <Settings size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">PRÉFÉRENCES UNITÉS</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => {
                      localStorage.setItem('onyx_units', 'meters');
                      window.dispatchEvent(new Event('storage'));
                    }}
                    className={`h-16 rounded-2xl border-2 flex items-center justify-center font-black uppercase tracking-widest text-[10px] transition-all ${localStorage.getItem('onyx_units') !== 'yards' ? (isSolar ? 'bg-zinc-950 text-white' : 'bg-[#c9964a] text-black') : 'opacity-30 bg-white/5'}`}
                  >
                    MÈTRES
                  </button>
                  <button 
                    onClick={() => {
                      localStorage.setItem('onyx_units', 'yards');
                      window.dispatchEvent(new Event('storage'));
                    }}
                    className={`h-16 rounded-2xl border-2 flex items-center justify-center font-black uppercase tracking-widest text-[10px] transition-all ${localStorage.getItem('onyx_units') === 'yards' ? (isSolar ? 'bg-zinc-950 text-white' : 'bg-[#c9964a] text-black') : 'opacity-30 bg-white/5'}`}
                  >
                    YARDS
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[8px] font-black uppercase tracking-[0.5em] text-center opacity-20 pt-8 uppercase italic italic italic italic italic italic italic italic italic">
              AUTO-SÉCURISATION DU RÉSEAU ONYX TERMINÉE
            </p>
          </motion.div>
        )}

        {subTab === 'lobby' && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {exploits.map((exploit) => (
              <div key={`exploit-${exploit.id}`} className={`p-5 relative overflow-hidden group rounded-3xl border ${isSolar ? 'bg-white border-zinc-200 shadow-sm' : 'bg-white/5 border-white/5'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${isSolar ? 'bg-zinc-100 border-zinc-200 text-black shadow-inner' : 'bg-white/5 border-white/5 text-[#c9964a]'}`}>
                      <Users size={18} />
                    </div>
                    <div>
                      <h4 className={`font-bold text-sm tracking-wide ${isSolar ? 'text-black' : 'text-white'}`}>{exploit.user}</h4>
                      <p className={`text-[9px] font-mono uppercase ${isSolar ? 'text-zinc-500' : 'text-gray-500'}`}>{exploit.course}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-mono ${isSolar ? 'text-zinc-400' : 'text-gray-600'}`}>{exploit.time}</span>
                </div>

                <div className={`flex items-center gap-4 p-3 rounded-xl border ${isSolar ? 'bg-zinc-50 border-zinc-200' : 'bg-black/30 border-white/5'}`}>
                  <div className={`text-2xl font-black ${exploit.type === 'EAGLE' ? (isSolar ? 'text-red-600' : 'text-[#c9964a]') : (isSolar ? 'text-black' : 'text-emerald-500')}`}>
                    {exploit.score}
                  </div>
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${isSolar ? 'text-black' : 'text-gray-300'}`}>{exploit.type} — Trou {exploit.hole}</p>
                    <p className={`text-[8px] font-mono ${isSolar ? 'text-zinc-400 font-bold' : 'text-gray-500'}`}>MOTEUR TACTIQUE : STRAT</p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {subTab === 'leaderboard' && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border rounded-[2.5rem] overflow-hidden shadow-sm ${isSolar ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/5'}`}
          >
            <div className={`px-4 py-3 border-b flex justify-between text-[10px] font-mono tracking-widest uppercase ${isSolar ? 'bg-zinc-50 border-zinc-200 text-zinc-500 font-bold' : 'bg-white/5 border-white/5 text-gray-500'}`}>
               <span>Joueur</span>
               <span>VS PAR</span>
            </div>
            <div className={`divide-y ${isSolar ? 'divide-zinc-100' : 'divide-white/5'}`}>
               {[
                 { user: "Marc B.", score: -5, pos: 1 },
                 { user: "Jean-Michel (Moi)", score: -2, pos: 2, me: true },
                 { user: "Nicolas P.", score: +1, pos: 3 },
                 { user: "Thomas L.", score: +4, pos: 4 },
               ].map((entry) => (
                 <div key={`leaderboard-${entry.pos}`} className={`px-4 py-4 flex justify-between items-center ${entry.me ? (isSolar ? 'bg-zinc-100' : 'bg-[#c9964a]/10') : ''}`}>
                    <div className="flex items-center gap-4">
                       <span className={`text-xs font-bold ${entry.pos === 1 ? (isSolar ? 'text-black font-black' : 'text-[#c9964a]') : 'text-gray-500'}`}>{entry.pos}</span>
                       <span className={`font-bold text-sm ${entry.me ? (isSolar ? 'text-black' : 'text-[#c9964a]') : (isSolar ? 'text-black' : 'text-gray-200')}`}>{entry.user}</span>
                    </div>
                    <span className={`text-lg font-black italic ${entry.me ? (isSolar ? 'text-black' : 'text-white') : (entry.score < 0 ? 'text-emerald-500' : 'text-red-500')}`}>
                       {entry.score > 0 ? `+${entry.score}` : entry.score === 0 ? 'E' : entry.score}
                    </span>
                 </div>
               ))}
            </div>
          </motion.div>
        )}

        {subTab === 'share' && (
          <motion.div
            key="share"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div 
              ref={certRef}
              className={`aspect-[4/3] w-full p-8 relative overflow-hidden flex flex-col justify-between border shadow-2xl rounded-[2.5rem] ${isSolar ? 'bg-white border-zinc-200' : 'bg-black border-[#c9964a]/20'}`}
            >
               <div className={`absolute inset-0 pointer-events-none ${isSolar ? 'bg-gradient-to-br from-black/5 to-transparent' : 'bg-gradient-to-br from-[#c9964a]/10 to-transparent'}`} />
               <div className="z-10 flex justify-between items-start text-left">
                  <div className="text-left">
                    <h1 className="font-cinzel text-2xl font-black tracking-tighter text-left italic">THE<span className={isSolar ? 'text-black' : 'text-[#c9964a]'}>CHOSE</span></h1>
                    <p className={`text-[8px] font-mono tracking-widest uppercase text-left ${isSolar ? 'text-zinc-400 font-bold' : 'text-gray-500'}`}>Round Certificate — 2026</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-[8px] font-mono uppercase ${isSolar ? 'text-zinc-400 font-bold' : 'text-gray-500'}`}>Date</p>
                    <p className={`text-[10px] font-bold ${isSolar ? 'text-black' : 'text-white'}`}>11 MAI 2026</p>
                  </div>
               </div>

               <div className="z-10 text-center py-4">
                  <p className={`text-[10px] font-mono uppercase tracking-[0.4em] mb-2 ${isSolar ? 'text-zinc-400 font-bold' : 'text-[#c9964a]'}`}>Performance Rank</p>
                  <h3 className={`font-cinzel text-4xl font-black italic uppercase ${isSolar ? 'text-black' : 'text-white'}`}>ELITE GOLD</h3>
               </div>

               <div className="z-10 grid grid-cols-4 gap-2">
                  <StatBox label="Score" value="-2" isSolar={isSolar} />
                  <StatBox label="Putts" value="28" isSolar={isSolar} />
                  <StatBox label="GIR" value="68%" isSolar={isSolar} />
                  <StatBox label="HCP" value={Number(handicap).toFixed(1)} isSolar={isSolar} />
               </div>

               <div className={`absolute bottom-4 right-4 opacity-10 ${isSolar ? 'text-black' : 'text-white'}`}>
                  <Trophy size={80} />
               </div>
            </div>

            <button 
              onClick={handleExport}
              disabled={isExporting}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-transform uppercase tracking-widest text-xs disabled:opacity-50 ${isSolar ? 'bg-black text-white' : 'bg-[#c9964a] text-black shadow-lg shadow-[#c9964a]/20'}`}
            >
               <Download size={18} />
               {isExporting ? 'GÉNÉRATION...' : 'Exporter Magazine 8K (PNG)'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatBox({ label, value, isSolar }: { label: string, value: string, isSolar?: boolean }) {
  return (
    <div className={`p-3 rounded-xl border text-center ${isSolar ? 'bg-zinc-50 border-zinc-200 px-1' : 'bg-white/5 border-white/5'}`}>
      <p className={`text-[7px] font-mono uppercase tracking-widest mb-1 ${isSolar ? 'text-zinc-400 font-bold' : 'text-gray-500'}`}>{label}</p>
      <p className={`text-lg font-black ${isSolar ? 'text-black' : 'text-white'}`}>{value}</p>
    </div>
  );
}

function UserIcon({ size }: { size: number }) {
  return <Users size={size} />;
}
