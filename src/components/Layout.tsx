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
      <header className="fixed top-0 left-0 right-0 z-[60] bg-black/80 backdrop-blur-md border-b border-white/5 px-4 py-3 flex justify-between items-center h-16">
        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-1">
            <h1 className="font-black italic text-3xl tracking-tighter uppercase leading-none bg-gradient-to-r from-white via-[#c9964a] to-[#c9964a]/80 bg-clip-text text-transparent">
              THE<span className="text-white">CHOSE</span>
            </h1>
            <div className="bg-red-600 px-1 rounded-sm">
              <span className="text-[8px] font-black text-white uppercase italic">V2</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[7px] font-black text-white/40 uppercase tracking-widest leading-none">Status</span>
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter animate-pulse">Connected</span>
          </div>
          <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center overflow-hidden bg-white/5">
             <User size={16} className="text-white/40" />
          </div>
        </div>
      </header>

      <main className="pt-16 pb-32 max-w-md mx-auto relative z-10 min-h-screen">
        <motion.div
          key={`tab-container-${activeTab}`}
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
