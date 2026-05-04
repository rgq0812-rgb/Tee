import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Users, Award, Share2, Star, ChevronRight } from 'lucide-react';

export default function InnerCircle() {
  const [subTab, setSubTab] = useState<'lobby' | 'leaderboard' | 'share'>('lobby');

  const exploits = [
    { id: 1, user: "Jean-Michel", type: "BIRDIE", hole: 4, course: "Saint-Nom-la-Bretèche", score: -1, time: "Il y a 12m" },
    { id: 2, user: "Nicolas P.", type: "EAGLE", hole: 12, course: "Golf de Joyenval", score: -2, time: "Il y a 45m" },
    { id: 3, user: "Marc B.", type: "BIRDIE", hole: 18, course: "Chantilly Old Course", score: -5, time: "Il y a 1h" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-3xl font-cinzel font-bold tracking-tight">Inner Circle</h2>
          <p className="text-[10px] font-mono text-brg-primary tracking-[0.2em] uppercase mt-1">L'Elite du réseau privé</p>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/5 sticky top-[72px] z-40 backdrop-blur-md">
        {['lobby', 'leaderboard', 'share'].map((t) => (
          <button
            key={`subtab-${t}`}
            onClick={() => setSubTab(t as any)}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
              subTab === t ? 'bg-brg-primary text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
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
              <div key={`exploit-${exploit.id}`} className="air-panel p-5 relative overflow-hidden group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-brg-gold border border-white/5">
                      <UserIcon size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm tracking-wide">{exploit.user}</h4>
                      <p className="text-[9px] font-mono text-gray-500 uppercase">{exploit.course}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-gray-600">{exploit.time}</span>
                </div>

                <div className="flex items-center gap-4 bg-black/30 p-3 rounded-xl border border-white/5">
                  <div className={`text-2xl font-cockpit font-black ${exploit.type === 'EAGLE' ? 'text-brg-gold' : 'text-brg-primary'}`}>
                    {exploit.score}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-300">{exploit.type} — Trou {exploit.hole}</p>
                    <p className="text-[8px] font-mono text-gray-500">MOTEUR TACTIQUE : STRAT</p>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                   <button className="flex items-center gap-2 group-active:scale-95 transition-transform px-3 py-1.5 rounded-full hover:bg-white/5 text-gray-400 hover:text-brg-primary">
                      <Trophy size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Saluer l'exploit</span>
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
            className="air-panel overflow-hidden"
          >
            <div className="bg-white/5 px-4 py-3 border-b border-white/5 flex justify-between text-[10px] font-mono tracking-widest text-gray-500 uppercase">
               <span>Joueur</span>
               <span>VS PAR</span>
            </div>
            <div className="divide-y divide-white/5">
               {[
                 { user: "Marc B.", score: -5, pos: 1 },
                 { user: "Jean-Michel (Moi)", score: -2, pos: 2, me: true },
                 { user: "Nicolas P.", score: +1, pos: 3 },
                 { user: "Thomas L.", score: +4, pos: 4 },
               ].map((entry) => (
                 <div key={`leaderboard-${entry.pos}`} className={`px-4 py-4 flex justify-between items-center ${entry.me ? 'bg-brg-gold/5' : ''}`}>
                    <div className="flex items-center gap-4">
                       <span className={`text-xs font-cockpit font-bold ${entry.pos === 1 ? 'text-brg-gold' : 'text-gray-500'}`}>{entry.pos}</span>
                       <span className={`font-bold text-sm ${entry.me ? 'text-brg-gold' : 'text-gray-200'}`}>{entry.user}</span>
                    </div>
                    <span className={`text-lg font-cockpit font-black ${entry.score < 0 ? 'text-brg-primary' : entry.score === 0 ? 'text-white' : 'text-red-500'}`}>
                       {entry.score > 0 ? `+${entry.score}` : entry.score === 0 ? 'E' : entry.score}
                    </span>
                 </div>
               ))}
            </div>
            <div className="p-4 bg-white/5 flex items-center justify-center text-[8px] font-mono text-gray-600 tracking-[0.4em] uppercase">
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
            <div className="aspect-[4/3] w-full air-panel p-8 relative overflow-hidden flex flex-col justify-between border-brg-gold/20 shadow-2xl">
               <div className="absolute inset-0 bg-gradient-to-br from-brg-primary/10 to-transparent pointer-events-none" />
               <div className="z-10 flex justify-between items-start">
                  <div>
                    <h1 className="font-cinzel text-2xl font-bold tracking-tighter">THE<span className="text-brg-primary">CHOSE</span></h1>
                    <p className="text-[8px] font-mono tracking-widest text-gray-500 uppercase">Round Certificate — 2026</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-mono text-gray-500 uppercase">Date</p>
                    <p className="text-[10px] font-bold">14 AVRIL 2026</p>
                  </div>
               </div>

               <div className="z-10 text-center py-4">
                  <p className="text-[10px] font-mono text-brg-gold uppercase tracking-[0.4em] mb-2">Performance Rank</p>
                  <h3 className="font-cinzel text-4xl font-bold">ELITE GOLD</h3>
               </div>

               <div className="z-10 grid grid-cols-4 gap-2">
                  <StatBox label="Score" value="-2" />
                  <StatBox label="Putts" value="28" />
                  <StatBox label="GIR" value="68%" />
                  <StatBox label="HCP" value="12.4" />
               </div>

               <div className="absolute bottom-4 right-4 opacity-10">
                  <Trophy size={80} />
               </div>
            </div>

            <button className="w-full bg-brg-gold text-black py-4 rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-yellow-900/20 active:scale-95 transition-transform uppercase tracking-widest text-xs">
               <Share2 size={18} />
               Exporter Magazine 8K (PNG)
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatBox({ label, value }: { label: string, value: string }) {
  return (
    <div className="bg-black/50 p-3 rounded-xl border border-white/5 text-center">
      <p className="text-[7px] font-mono text-gray-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-lg font-cockpit font-black text-white">{value}</p>
    </div>
  );
}

function UserIcon({ size }: { size: number }) {
  return <Award size={size} />;
}
