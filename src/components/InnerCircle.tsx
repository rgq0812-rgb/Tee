import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Users, Award, Share2, Star, ChevronRight } from 'lucide-react';

export default function InnerCircle({ displayMode }: { key?: string; displayMode?: 'tactical' | 'solar' }) {
  const isSolar = displayMode === 'solar';
  const [subTab, setSubTab] = useState<'lobby' | 'leaderboard' | 'share'>('lobby');

  const exploits = [
    { id: 1, user: "Jean-Michel", type: "BIRDIE", hole: 4, course: "Saint-Nom-la-Bretèche", score: -1, time: "Il y a 12m" },
    { id: 2, user: "Nicolas P.", type: "EAGLE", hole: 12, course: "Golf de Joyenval", score: -2, time: "Il y a 45m" },
    { id: 3, user: "Marc B.", type: "BIRDIE", hole: 18, course: "Chantilly Old Course", score: -5, time: "Il y a 1h" },
  ];

  return (
    <div className={`space-y-6 ${isSolar ? 'text-black' : 'text-white'}`}>
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className={`text-3xl font-cinzel font-bold tracking-tight ${isSolar ? 'text-black' : 'text-white'}`}>Inner Circle</h2>
          <p className={`text-[10px] font-mono tracking-[0.2em] uppercase mt-1 ${isSolar ? 'text-zinc-500 font-bold' : 'text-brg-primary'}`}>L'Elite du réseau privé</p>
        </div>
      </div>

      <div className={`flex gap-2 p-1 rounded-xl border sticky top-[72px] z-40 backdrop-blur-md ${isSolar ? 'bg-zinc-100 border-zinc-200' : 'bg-white/5 border-white/5'}`}>
        {['lobby', 'leaderboard', 'share'].map((t) => (
          <button
            key={`subtab-${t}`}
            onClick={() => setSubTab(t as any)}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
              subTab === t 
                ? (isSolar ? 'bg-black text-white shadow-lg' : 'bg-brg-primary text-white shadow-lg') 
                : (isSolar ? 'text-zinc-400 hover:text-black' : 'text-gray-500 hover:text-gray-300')
            }`}
          >
            {t === 'lobby' ? 'Lobby' : t === 'leaderboard' ? 'Classement' : 'Partager'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {subTab === 'lobby' && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {exploits.map((exploit) => (
              <div key={`exploit-${exploit.id}`} className={`p-5 relative overflow-hidden group rounded-3xl border ${isSolar ? 'bg-white border-zinc-200 shadow-sm' : 'air-panel'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${isSolar ? 'bg-zinc-100 border-zinc-200 text-black shadow-inner' : 'bg-white/5 border-white/5 text-brg-gold'}`}>
                      <UserIcon size={18} />
                    </div>
                    <div>
                      <h4 className={`font-bold text-sm tracking-wide ${isSolar ? 'text-black' : 'text-white font-bold'}`}>{exploit.user}</h4>
                      <p className={`text-[9px] font-mono uppercase ${isSolar ? 'text-zinc-500' : 'text-gray-500'}`}>{exploit.course}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-mono ${isSolar ? 'text-zinc-400' : 'text-gray-600'}`}>{exploit.time}</span>
                </div>

                <div className={`flex items-center gap-4 p-3 rounded-xl border ${isSolar ? 'bg-zinc-50 border-zinc-200' : 'bg-black/30 border-white/5'}`}>
                  <div className={`text-2xl font-cockpit font-black ${exploit.type === 'EAGLE' ? (isSolar ? 'text-red-600' : 'text-brg-gold') : (isSolar ? 'text-black' : 'text-brg-primary')}`}>
                    {exploit.score}
                  </div>
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${isSolar ? 'text-black' : 'text-gray-300'}`}>{exploit.type} — Trou {exploit.hole}</p>
                    <p className={`text-[8px] font-mono ${isSolar ? 'text-zinc-400 font-bold' : 'text-gray-500'}`}>MOTEUR TACTIQUE : STRAT</p>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                   <button className={`flex items-center gap-2 group-active:scale-95 transition-transform px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${isSolar ? 'bg-zinc-100 text-black hover:bg-zinc-200' : 'hover:bg-white/5 text-gray-400 hover:text-brg-primary'}`}>
                      <Trophy size={14} />
                      VOIR L'EXPLOIT
                   </button>
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
            className={`border rounded-[2.5rem] overflow-hidden shadow-sm ${isSolar ? 'bg-white border-zinc-200' : 'air-panel'}`}
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
                 <div key={`leaderboard-${entry.pos}`} className={`px-4 py-4 flex justify-between items-center ${entry.me ? (isSolar ? 'bg-black' : 'bg-brg-gold/5 shadow-inner') : ''}`}>
                    <div className="flex items-center gap-4">
                       <span className={`text-xs font-cockpit font-bold ${entry.pos === 1 ? (isSolar && !entry.me ? 'text-black font-black' : 'text-brg-gold') : (isSolar && !entry.me ? 'text-zinc-400' : 'text-gray-500')}`}>{entry.pos}</span>
                       <span className={`font-bold text-sm ${entry.me ? (isSolar ? 'text-white' : 'text-brg-gold') : (isSolar ? 'text-black' : 'text-gray-200')}`}>{entry.user}</span>
                    </div>
                    <span className={`text-lg font-cockpit font-black ${entry.me ? 'text-white' : (entry.score < 0 ? (isSolar ? 'text-black' : 'text-brg-primary') : entry.score === 0 ? (isSolar ? 'text-zinc-400' : 'text-white') : 'text-red-500')}`}>
                       {entry.score > 0 ? `+${entry.score}` : entry.score === 0 ? 'E' : entry.score}
                    </span>
                 </div>
               ))}
            </div>
            <div className={`p-4 flex items-center justify-center text-[8px] font-mono tracking-[0.4em] uppercase ${isSolar ? 'bg-zinc-50 text-zinc-400 font-bold' : 'bg-white/5 text-gray-600'}`}>
               Augusta Ranking Engine
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
            <div className={`aspect-[4/3] w-full p-8 relative overflow-hidden flex flex-col justify-between border shadow-2xl rounded-3xl ${isSolar ? 'bg-white border-zinc-200 shadow-zinc-200' : 'air-panel border-brg-gold/20'}`}>
               <div className={`absolute inset-0 pointer-events-none ${isSolar ? 'bg-gradient-to-br from-black/5 to-transparent' : 'bg-gradient-to-br from-brg-primary/10 to-transparent'}`} />
               <div className="z-10 flex justify-between items-start">
                  <div>
                    <h1 className="font-cinzel text-2xl font-bold tracking-tighter">THE<span className={isSolar ? 'text-black' : 'text-brg-primary'}>CHOSE</span></h1>
                    <p className={`text-[8px] font-mono tracking-widest uppercase ${isSolar ? 'text-zinc-400 font-bold' : 'text-gray-500'}`}>Round Certificate — 2026</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-[8px] font-mono uppercase ${isSolar ? 'text-zinc-400 font-bold' : 'text-gray-500'}`}>Date</p>
                    <p className={`text-[10px] font-bold ${isSolar ? 'text-black' : 'text-white'}`}>14 AVRIL 2026</p>
                  </div>
               </div>

               <div className="z-10 text-center py-4">
                  <p className={`text-[10px] font-mono uppercase tracking-[0.4em] mb-2 ${isSolar ? 'text-zinc-400 font-bold' : 'text-brg-gold'}`}>Performance Rank</p>
                  <h3 className={`font-cinzel text-4xl font-bold ${isSolar ? 'text-black' : 'text-white'}`}>ELITE GOLD</h3>
               </div>

               <div className="z-10 grid grid-cols-4 gap-2">
                  <StatBox label="Score" value="-2" isSolar={isSolar} />
                  <StatBox label="Putts" value="28" isSolar={isSolar} />
                  <StatBox label="GIR" value="68%" isSolar={isSolar} />
                  <StatBox label="HCP" value="12.4" isSolar={isSolar} />
               </div>

               <div className={`absolute bottom-4 right-4 opacity-10 ${isSolar ? 'text-black' : 'text-white'}`}>
                  <Trophy size={80} />
               </div>
            </div>

            <button className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-transform uppercase tracking-widest text-xs ${isSolar ? 'bg-black text-white' : 'bg-brg-gold text-black shadow-yellow-900/20'}`}>
               <Share2 size={18} />
               Exporter Magazine 8K (PNG)
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatBox({ label, value, isSolar }: { label: string, value: string, isSolar?: boolean }) {
  return (
    <div className={`p-3 rounded-xl border text-center ${isSolar ? 'bg-zinc-50 border-zinc-200 px-1' : 'bg-black/50 border-white/5'}`}>
      <p className={`text-[7px] font-mono uppercase tracking-widest mb-1 ${isSolar ? 'text-zinc-400 font-bold' : 'text-gray-500'}`}>{label}</p>
      <p className={`text-lg font-cockpit font-black ${isSolar ? 'text-black' : 'text-white'}`}>{value}</p>
    </div>
  );
}

function UserIcon({ size }: { size: number }) {
  return <Award size={size} />;
}
