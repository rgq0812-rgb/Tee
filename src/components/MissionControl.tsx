import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Brain, Zap, MapPin, Play, Minus, Plus, ChevronRight, User, Terminal, Scan, Crosshair, Activity } from 'lucide-react';
import { COURSES, CADDIES } from '../constants';
import { GameMode } from './use-score';

interface MissionControlProps {
  onStart: () => void;
  selectedCourse: any;
  setSelectedCourse: (course: any) => void;
  handicap: number;
  setHandicap: (h: any) => void;
  playerForm: 'cold' | 'forme' | 'pur';
  setPlayerForm: (f: 'cold' | 'forme' | 'pur') => void;
  activeCaddie: any;
  setActiveCaddie: (c: any) => void;
  arsenal: any[];
  selectedMode: any;
  setSelectedMode: (m: any) => void;
  selectedTee: 'black' | 'white' | 'yellow' | 'blue' | 'red';
  setSelectedTee: (t: 'black' | 'white' | 'yellow' | 'blue' | 'red') => void;
  displayMode: 'tactical' | 'solar';
}

export default function MissionControl({
  onStart,
  selectedCourse, setSelectedCourse,
  handicap, setHandicap,
  playerForm, setPlayerForm,
  activeCaddie, setActiveCaddie,
  arsenal,
  selectedMode, setSelectedMode,
  selectedTee, setSelectedTee,
  displayMode
}: MissionControlProps) {
  const isSolar = displayMode === 'solar';
  const [acceptedProtocol, setAcceptedProtocol] = useState(false);
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('onyx_player_name') || 'ONYX_OPERATIVE');

  const handleStart = () => {
    localStorage.setItem('onyx_player_name', playerName);
    onStart();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-[600] flex flex-col font-sans transition-colors duration-500 overflow-hidden ${isSolar ? 'bg-[#f8f8f8]' : 'bg-black text-white'}`}
    >
      {/* Background Ambience */}
      <div className={`absolute inset-0 z-0 pointer-events-none opacity-[0.03] ${isSolar ? 'bg-[radial-gradient(circle_at_center,_#000_1px,_transparent_1px)]' : 'bg-[radial-gradient(circle_at_center,_#fff_1px,_transparent_1px)]'}`} style={{ backgroundSize: '40px 40px' }} />
      
      {/* Giant Background Text */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 select-none pointer-events-none overflow-hidden w-full text-center">
        <h1 className={`text-[35vw] font-black italic uppercase leading-none tracking-tighter opacity-[0.02] ${isSolar ? 'text-black' : 'text-white'}`}>
          ONYX
        </h1>
      </div>

      <div className="relative z-10 flex flex-col h-full overflow-y-auto no-scrollbar">
        {/* Cinematic Header Section */}
        <section className="pt-20 px-8 mb-12">
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-4">
               <div className={`h-[1px] w-12 ${isSolar ? 'bg-black' : 'bg-red-600'}`} />
               <span className={`text-[10px] font-black uppercase tracking-[0.5em] ${isSolar ? 'text-black font-black' : 'text-red-500'}`}>CENTRE DE COMMANDE</span>
            </div>
            <h2 className={`text-7xl font-black italic uppercase tracking-tighter leading-[0.8] mb-4 ${isSolar ? 'text-black' : 'text-white'}`}>
              DÉPLOIEMENT <br />
              <span className={isSolar ? 'text-zinc-400' : 'text-white/40'}>TACTIQUE</span>
            </h2>
            <div className="flex items-center gap-6">
              <div className="flex flex-col text-left">
                <span className={`text-[8px] font-black uppercase tracking-widest ${isSolar ? 'text-zinc-300' : 'text-white/20'}`}>SÉCURITÉ</span>
                <span className="text-[10px] font-mono font-black text-red-600">EN-CRYPTÉE_RSA-4096</span>
              </div>
              <div className={`w-px h-8 ${isSolar ? 'bg-zinc-200' : 'bg-white/10'}`} />
              <div className="flex flex-col text-left">
                <span className={`text-[8px] font-black uppercase tracking-widest ${isSolar ? 'text-zinc-300' : 'text-white/20'}`}>LOCALISATION</span>
                <span className={`text-[10px] font-mono font-black ${isSolar ? 'text-black' : 'text-white'}`}>{selectedCourse.name.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Tactical Grid */}
        <div className="px-8 space-y-12 pb-40">
          
          {/* Identity & Status */}
          <div className="grid grid-cols-1 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Scan size={14} className={isSolar ? 'text-black' : 'text-red-600'} />
                <span className={`text-[9px] font-black uppercase tracking-[0.4em] ${isSolar ? 'text-black font-black' : 'text-white/40'}`}>IDENTITÉ OPÉRATIONNELLE</span>
              </div>
              <div className="group relative">
                <input 
                  type="text" 
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                  className={`w-full bg-transparent border-b-2 py-4 text-3xl font-black italic uppercase tracking-tighter outline-none focus:ring-0 transition-colors ${
                    isSolar ? 'border-zinc-200 focus:border-black text-black' : 'border-white/10 focus:border-red-600 text-white'
                  }`}
                  placeholder="NOM DE CODE..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Activity size={14} className={isSolar ? 'text-black' : 'text-[#c9964a]'} />
                  <span className={`text-[9px] font-black uppercase tracking-[0.4em] ${isSolar ? 'text-black font-black' : 'text-white/40'}`}>HANDICAP</span>
                </div>
                <div className={`h-20 rounded-[2rem] border flex items-center justify-between px-6 shadow-sm ${isSolar ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/10'}`}>
                   <button onClick={() => setHandicap(Math.max(0, handicap - 1))} className={`active:scale-90 transition-transform ${isSolar ? 'text-black' : 'text-white/40'}`}><Minus size={20} /></button>
                   <span className={`text-3xl font-mono font-black italic ${isSolar ? 'text-black' : 'text-[#c9964a]'}`}>{handicap}</span>
                   <button onClick={() => setHandicap(handicap + 1)} className={`active:scale-90 transition-transform ${isSolar ? 'text-black font-black' : 'text-white'}`}><Plus size={20} /></button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Terminal size={14} className={isSolar ? 'text-black' : 'text-white/40'} />
                  <span className={`text-[9px] font-black uppercase tracking-[0.4em] ${isSolar ? 'text-black font-black' : 'text-white/40'}`}>FORME</span>
                </div>
                <div className={`h-20 rounded-[2rem] border grid grid-cols-3 p-1.5 shadow-sm ${isSolar ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/10'}`}>
                  {(['cold', 'forme', 'pur'] as const).map(f => (
                    <button 
                      key={f}
                      onClick={() => setPlayerForm(f)}
                      className={`rounded-2xl transition-all flex items-center justify-center text-[7px] font-black uppercase tracking-widest ${
                        playerForm === f 
                        ? (isSolar ? 'bg-black text-white shadow-xl shadow-black/20 font-black' : 'bg-red-600 text-white shadow-lg font-black') 
                        : (isSolar ? 'text-zinc-300 font-bold' : 'text-white/20 font-black')
                      }`}
                    >
                      {f.charAt(0)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tee Selector */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin size={14} className={isSolar ? 'text-black' : 'text-red-600'} />
                <span className={`text-[9px] font-black uppercase tracking-[0.4em] ${isSolar ? 'text-black font-black' : 'text-white/40'}`}>DÉPART TACTIQUE</span>
              </div>
              <div className={`rounded-[2.5rem] border p-4 shadow-sm ${isSolar ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/10'}`}>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { id: 'black', color: 'bg-zinc-950', border: 'border-white/20', label: 'NOIR' },
                    { id: 'white', color: 'bg-white', border: 'border-zinc-200', label: 'BLANC' },
                    { id: 'yellow', color: 'bg-yellow-400', border: 'border-yellow-200', label: 'JAUNE' },
                    { id: 'blue', color: 'bg-blue-600', border: 'border-blue-400', label: 'BLEU' },
                    { id: 'red', color: 'bg-red-600', border: 'border-red-400', label: 'ROUGE' },
                  ].map(tee => (
                    <button 
                      key={tee.id}
                      onClick={() => setSelectedTee(tee.id as any)}
                      className={`h-24 rounded-3xl flex flex-col items-center justify-center gap-2 transition-all border-2 relative overflow-hidden ${
                        selectedTee === tee.id 
                        ? 'border-[#c9964a] scale-105 shadow-xl shadow-[#c9964a]/20' 
                        : 'border-transparent opacity-40 hover:opacity-100'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full ${tee.color} ${tee.border} border-2 shadow-inner`} />
                      <span className={`text-[7px] font-black tracking-widest ${isSolar ? 'text-black' : 'text-white'}`}>{tee.label}</span>
                      {selectedTee === tee.id && (
                        <div className="absolute top-1 right-1 w-2 h-2 bg-[#c9964a] rounded-full animate-pulse" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Configuration Mission */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Crosshair size={14} className={isSolar ? 'text-black' : 'text-red-600'} />
              <span className={`text-[9px] font-black uppercase tracking-[0.4em] ${isSolar ? 'text-black font-black' : 'text-white/40'}`}>MODULES DE MISSION</span>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={() => setSelectedCourse(COURSES[(COURSES.findIndex(c => c.id === selectedCourse.id) + 1) % COURSES.length])}
                className={`relative group h-32 rounded-[2.5rem] border overflow-hidden text-left transition-all shadow-sm ${
                  isSolar ? 'bg-white border-zinc-200 hover:border-black' : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                  <div className="absolute top-0 right-0 p-6 opacity-[0.05] group-hover:scale-110 transition-transform">
                    <MapPin size={80} />
                  </div>
                  <div className="relative z-10 p-8 h-full flex flex-col justify-center">
                    <span className={`text-[8px] font-black uppercase tracking-widest mb-1 ${isSolar ? 'text-zinc-400 font-bold' : 'text-white/20'}`}>PARCOURS</span>
                    <h4 className={`text-2xl font-black italic uppercase tracking-tighter leading-[0.8] mb-1 ${isSolar ? 'text-black' : 'text-white'}`}>{selectedCourse.name}</h4>
                    <span className={`text-[7px] font-bold uppercase tracking-widest ${isSolar ? 'text-blue-600 font-black' : 'text-white/10'}`}>COORDONNÉES : {selectedCourse.id.toUpperCase()}</span>
                  </div>
              </button>

              <div className={`rounded-[2.5rem] border p-8 flex flex-col justify-center gap-6 shadow-sm ${isSolar ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/10'}`}>
                <span className={`text-[8px] font-black uppercase tracking-widest mb-1 text-center ${isSolar ? 'text-zinc-400 font-bold' : 'text-white/20'}`}>MODE DE CALCUL TACTIQUE</span>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: GameMode.STROKE, label: 'STROKE' },
                    { id: GameMode.STABLEFORD, label: 'STABLE' },
                    { id: GameMode.MATCHPLAY, label: 'MATCH' },
                  ].map(m => (
                    <button
                      key={`mission-mode-${m.id}`}
                      onClick={() => setSelectedMode(m.id)}
                      className={`py-3 rounded-2xl border text-[8px] font-black tracking-widest transition-all ${
                        selectedMode === m.id 
                        ? (isSolar ? 'bg-black border-black text-white font-black' : 'bg-[#c9964a] border-[#c9964a] text-black shadow-lg shadow-[#c9964a]/20 font-black') 
                        : (isSolar ? 'bg-zinc-50 border-zinc-100 text-zinc-300 font-bold' : 'bg-white/5 border-white/10 text-white/20 font-black')
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tactical Units Bar */}
          <div className="grid grid-cols-2 gap-4">
            <div className={`h-24 rounded-[2rem] border p-6 flex items-center gap-4 transition-all shadow-sm ${isSolar ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/10'}`}>
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isSolar ? 'bg-black text-white shadow-xl' : 'bg-[#c9964a] text-black shadow-lg shadow-[#c9964a]/20'}`}>
                 <Brain size={24} />
               </div>
               <div className="flex flex-col text-left">
                 <span className={`text-[7px] font-black uppercase tracking-[0.2em] ${isSolar ? 'text-zinc-300 font-bold' : 'text-white/20'}`}>ANALYSTE IA</span>
                 <span className={`text-sm font-black italic uppercase tracking-tighter ${isSolar ? 'text-black font-black' : 'text-white'}`}>{activeCaddie.name}</span>
               </div>
            </div>
            <div className={`h-24 rounded-[2rem] border p-6 flex items-center gap-4 transition-all shadow-sm ${isSolar ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/10'}`}>
               <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${isSolar ? 'bg-orange-600 text-white shadow-md' : 'bg-orange-500/10 border-orange-500/20 text-orange-500'}`}>
                 <Zap size={24} />
               </div>
               <div className="flex flex-col text-left">
                 <span className={`text-[7px] font-black uppercase tracking-[0.2em] ${isSolar ? 'text-zinc-300 font-bold' : 'text-white/20'}`}>ARSENAL</span>
                 <span className={`text-sm font-black italic uppercase tracking-tighter ${isSolar ? 'text-black font-black' : 'text-white'}`}>{arsenal.filter((a: any) => a.dist > 0).length} UNITÉS</span>
               </div>
            </div>
          </div>

          {/* Final Deployment Protocol */}
          <div className="flex flex-col items-center gap-10 pt-8">
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={() => setAcceptedProtocol(!acceptedProtocol)}
              className={`group flex items-center gap-4 px-8 py-5 rounded-full border transition-all shadow-lg ${
                acceptedProtocol 
                ? (isSolar ? 'bg-black border-black text-white' : 'bg-white border-white text-black') 
                : (isSolar ? 'bg-white border-zinc-200 text-zinc-300 hover:border-black' : 'bg-white/5 border-white/10 text-white/20 hover:border-white/40')
              }`}
            >
              <ShieldCheck size={18} className={acceptedProtocol ? (isSolar ? 'text-white' : 'text-black') : (isSolar ? 'text-zinc-100' : 'text-white/10')} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">ACCEPTER PROTOCOLE ONYX</span>
            </motion.button>

            <motion.button
              disabled={!acceptedProtocol}
              onClick={handleStart}
              whileHover={acceptedProtocol ? { scale: 1.05 } : {}}
              whileTap={acceptedProtocol ? { scale: 0.95 } : {}}
              className={`w-full max-w-sm h-28 rounded-[3rem] flex items-center justify-center gap-6 font-black italic uppercase tracking-[0.6em] text-3xl transition-all relative overflow-hidden group ${
                acceptedProtocol 
                ? (isSolar ? 'bg-black text-white shadow-[0_30px_70px_rgba(0,0,0,0.3)] font-black' : 'bg-red-600 text-white shadow-[0_30px_70px_rgba(220,38,38,0.4)] font-black') 
                : (isSolar ? 'bg-zinc-100 text-zinc-200' : 'bg-white/5 text-white/5')
              }`}
            >
              <Play size={32} fill={acceptedProtocol ? "currentColor" : "transparent"} className="relative z-10" />
              <span className="relative z-10">LANCEMENT</span>
            </motion.button>
            
            <p className={`text-[8px] font-black uppercase tracking-[0.5em] text-center max-w-[280px] leading-loose opacity-30 italic ${isSolar ? 'text-black font-black' : 'text-white'}`}>
              LA VICTOIRE SE PRÉPARE DANS LE SILENCE DE LA STRATÉGIE. DÉPLOYEZ VOTRE POTENTIEL.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
