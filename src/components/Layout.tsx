import React from 'react';
import { motion } from 'motion/react';
import { Home, Trophy, Video, User, MapPin, Award, Users, Settings, Shield } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const tabs = [
    { id: 'dashboard', label: 'HUD', icon: MapPin },
    { id: 'challenges', label: 'Jeu', icon: Award },
    { id: 'scorecard', label: 'Score', icon: Trophy },
    { id: 'circle', label: 'Cercle', icon: Users },
    { id: 'profile', label: 'Élite', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#c9964a]/30 overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 z-[60] bg-black/80 backdrop-blur-md border-b border-white/5 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#c9964a] rounded-full flex items-center justify-center text-black shadow-lg shadow-[#c9964a]/20">
            <Trophy size={14} strokeWidth={3} />
          </div>
          <h1 className="font-black italic text-lg tracking-tighter uppercase leading-none">
            THE<span className="text-[#c9964a]">CHOSE</span>
          </h1>
        </div>
        
        <div className="bg-white/5 px-2 py-0.5 rounded border border-white/10">
          <span className="text-[8px] font-mono tracking-widest text-[#c9964a] uppercase">SYS_LIVE</span>
        </div>
      </header>

      <main className="pt-16 pb-32 max-w-md mx-auto relative z-10 min-h-screen">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="px-4"
        >
          {children}
        </motion.div>
      </main>

      <nav className="fixed bottom-6 left-0 right-0 z-[70] px-6 pointer-events-none pb-safe">
        <div className="max-w-md mx-auto flex justify-between items-center bg-zinc-900/40 backdrop-blur-2xl border border-white/10 p-1.5 rounded-[2.5rem] shadow-2xl pointer-events-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all relative rounded-2xl ${
                  isActive ? 'text-white' : 'text-white/30'
                }`}
              >
                <Icon size={isActive ? 20 : 18} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className={`text-[7px] font-black uppercase tracking-[0.2em] transition-all ${isActive ? 'opacity-100' : 'opacity-0 h-0 w-0'}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-white/5 rounded-2xl -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
