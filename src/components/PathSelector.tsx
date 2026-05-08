import React from 'react';
import { motion } from 'motion/react';
import { User, GraduationCap, Trophy, ChevronRight, Target, Cpu } from 'lucide-react';
import { AppPath } from '../types';

interface PathSelectorProps {
  onSelect: (path: AppPath) => void;
}

export default function PathSelector({ onSelect }: PathSelectorProps) {
  return (
    <div className="min-h-screen bg-black flex flex-col p-8 md:p-20 relative overflow-hidden font-sans text-white">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0 select-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#222_0%,_transparent_50%)]" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '100px 100px' }} />
      </div>
      
      {/* Large Floating Text */}
      <div className="absolute bottom-[-5%] left-[-5%] z-0 leading-none select-none pointer-events-none">
        <h1 className="text-[25vw] font-black italic uppercase tracking-tighter text-white/[0.03]">SELECT</h1>
      </div>

      <header className="relative z-10 mb-20 flex flex-col items-start">
        <div className="flex items-center gap-3 mb-6">
           <div className="h-[2px] w-12 bg-red-600" />
           <span className="text-[10px] font-black uppercase tracking-[0.6em] text-red-500">ONYX TACTICAL SYSTEM v2</span>
        </div>
        <h1 className="text-7xl font-black italic tracking-tighter uppercase text-white leading-[0.8]">
          CHOISISSEZ VOTRE <br />
          <span className="text-white/40">IDENTITÉ</span>
        </h1>
      </header>

      <div className="relative z-10 flex flex-col md:flex-row gap-8 flex-1 max-h-[600px]">
        {/* THE PLAYER Profile */}
        <motion.div
           onClick={() => onSelect('player')}
           initial={{ opacity: 0, x: -50 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.1 }}
           className="flex-1 group cursor-pointer"
        >
          <div className="h-full border-l-2 border-white/10 group-hover:border-red-600 p-8 flex flex-col transition-all duration-500 relative bg-gradient-to-r from-white/[0.02] to-transparent hover:from-white/5">
            <div className="flex items-center justify-between mb-8">
              <div className="text-[10px] font-mono font-black text-white/40 group-hover:text-red-500 transition-colors tracking-widest">PROP01_OPERATIVE</div>
              <Target size={20} className="text-white/20 group-hover:text-red-600 transition-colors" />
            </div>
            
            <div className="mb-auto">
              <h3 className="text-5xl font-black italic uppercase tracking-tighter mb-4 text-white group-hover:translate-x-2 transition-transform duration-500">THE PLAYER</h3>
              <p className="text-sm font-bold uppercase tracking-widest leading-loose text-white/30 group-hover:text-white/60 transition-colors max-w-sm">
                OPTIMISEZ CHAQUE IMPACT. ACCÈS DIRECT AU CADDIE TACTIQUE, À L'ARSENAL ET AUX SCANNEURS DE LIE. POUR LES EXÉCUTANTS DE HAUT VOL.
              </p>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-red-600 group-hover:border-red-600 transition-all duration-500">
                <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 group-hover:text-white group-hover:tracking-[0.5em] transition-all">INITIALISER LE PROTOCOLE</span>
            </div>
          </div>
        </motion.div>

        {/* THE STUDENT Profile */}
        <motion.div
           onClick={() => onSelect('student')}
           initial={{ opacity: 0, x: 50 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.2 }}
           className="flex-1 group cursor-pointer"
        >
          <div className="h-full border-l-2 border-white/10 group-hover:border-[#c9964a] p-8 flex flex-col transition-all duration-500 relative bg-gradient-to-r from-white/[0.02] to-transparent hover:from-white/5">
            <div className="flex items-center justify-between mb-8">
              <div className="text-[10px] font-mono font-black text-white/40 group-hover:text-[#c9964a] transition-colors tracking-widest">PROP02_ACADEMIC</div>
              <Cpu size={20} className="text-white/20 group-hover:text-[#c9964a] transition-colors" />
            </div>

            <div className="mb-auto">
              <h3 className="text-5xl font-black italic uppercase tracking-tighter mb-4 text-white group-hover:translate-x-2 transition-transform duration-500">THE STUDENT</h3>
              <p className="text-sm font-bold uppercase tracking-widest leading-loose text-white/30 group-hover:text-white/60 transition-colors max-w-sm">
                DÉCORTIQUEZ LE MOUVEMENT. ACCÈS AU RÉSEAU DE MENTORS, ANALYSE BIOMÉCANIQUE ET ARCHIVES TECHNIQUES. POUR CEUX QUI VEULENT COMPRENDRE.
              </p>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-[#c9964a] group-hover:border-[#c9964a] transition-all duration-500">
                <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform text-white group-hover:text-black" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 group-hover:text-white group-hover:tracking-[0.5em] transition-all">ACCÉDER À L'ACADÉMIE</span>
            </div>
          </div>
        </motion.div>
      </div>

      <footer className="relative z-10 mt-20 flex justify-between items-end border-t border-white/10 pt-8 opacity-20">
        <div className="flex flex-col">
          <span className="text-[8px] font-black uppercase tracking-widest">AUTH_SYSTEM : VERIFIED</span>
          <span className="text-[8px] font-black uppercase tracking-widest text-red-600">STRICT_PROTOCOL = ON</span>
        </div>
        <div className="text-[10px] font-black uppercase tracking-[0.5em]">
          ONYX EST. 1992
        </div>
      </footer>
    </div>
  );
}
