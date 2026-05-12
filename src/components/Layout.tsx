import React from 'react';
import { motion } from 'motion/react';
import { Home, Trophy, Video, User, MapPin, Award, Users, Settings, Shield, Crosshair, Sun, Moon, Brain } from 'lucide-react';
import { useAuth } from '../services/AuthProvider';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  displayMode: 'tactical' | 'solar';
  setDisplayMode: (mode: 'tactical' | 'solar') => void;
}

export default function Layout({ children, activeTab, setActiveTab, displayMode, setDisplayMode }: LayoutProps) {
  const { user } = useAuth();
  const tabs = [
    { id: 'dashboard', label: 'HUD', icon: MapPin },
    { id: 'tactical', label: 'Tactique', icon: Crosshair },
    { id: 'academy', label: 'Entraînement', icon: Brain },
    { id: 'scorecard', label: 'Score', icon: Trophy },
    { id: 'profile', label: 'Élite', icon: Shield },
  ];

  const isSolar = displayMode === 'solar';

  return (
    <div className={`min-h-screen ${isSolar ? 'bg-zinc-50 text-black' : 'bg-black text-white'} font-sans transition-colors duration-500 selection:bg-[#c9964a]/30 overflow-x-hidden`}>
      <header className={`fixed top-0 left-0 right-0 z-[60] ${isSolar ? 'bg-white/90 border-zinc-200 shadow-sm' : 'bg-black/95 border-white/10'} backdrop-blur-xl border-b px-4 py-3 flex justify-between items-center h-16 transition-all`}>
        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-1">
            <h1 className={`font-black italic text-3xl tracking-tighter uppercase leading-none ${isSolar ? 'text-black' : 'bg-gradient-to-r from-white via-[#c9964a] to-[#c9964a]/80 bg-clip-text text-transparent'}`}>
              THE<span className={isSolar ? 'text-[#856424]' : 'text-white'}>CHOSE</span>
            </h1>
            <div className="bg-red-600 px-1 rounded-sm">
              <span className="text-[8px] font-black text-white uppercase italic">V2</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* THEME TOGGLE */}
          <button 
            onClick={() => setDisplayMode(isSolar ? 'tactical' : 'solar')}
            className={`p-2 rounded-xl border transition-all ${isSolar ? 'bg-zinc-100 border-zinc-200 text-zinc-900' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
          >
            {isSolar ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <div className="flex flex-col items-end">
            <span className={`text-[7px] font-black uppercase tracking-widest leading-none ${isSolar ? 'text-zinc-400' : 'text-white/40'}`}>Status</span>
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter animate-pulse">Connected</span>
          </div>
          <div className={`w-8 h-8 rounded-full border flex items-center justify-center overflow-hidden ${isSolar ? 'bg-zinc-100 border-zinc-200' : 'bg-white/5 border-white/10'}`}>
              {(() => {
                const customAvatar = user ? localStorage.getItem(`user-custom-avatar-${user.uid}`) : null;
                const pic = customAvatar || user?.photoURL;
                if (pic) return <img src={pic} alt="Me" className="w-full h-full object-cover" />;
                return <User size={16} className={isSolar ? 'text-zinc-300' : 'text-white/40'} />;
              })()}
          </div>
        </div>
      </header>

      <main className="pt-16 pb-32 max-w-md mx-auto relative z-10 min-h-screen">
        <motion.div
          key={`tab-container-${activeTab}-${displayMode}`}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="px-4"
        >
          {children}
        </motion.div>
      </main>

      <nav className="fixed bottom-6 left-0 right-0 z-[70] px-6 pointer-events-none pb-safe">
        <div className={`max-w-md mx-auto flex justify-between items-center ${isSolar ? 'bg-white border-zinc-200 text-black shadow-xl' : 'bg-zinc-900/90 border-white/20 text-white'} backdrop-blur-3xl border p-1.5 rounded-[2.5rem] shadow-2xl pointer-events-auto transition-all`}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all relative rounded-2xl ${
                  isActive ? (isSolar ? 'text-black' : 'text-white') : (isSolar ? 'text-zinc-300' : 'text-white/30')
                }`}
              >
                <Icon size={isActive ? 20 : 18} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className={`text-[7px] font-black uppercase tracking-[0.2em] transition-all ${isActive ? 'opacity-100' : 'opacity-0 h-0 w-0'}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className={`absolute inset-0 ${isSolar ? 'bg-zinc-100' : 'bg-white/5'} rounded-2xl -z-10`}
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
