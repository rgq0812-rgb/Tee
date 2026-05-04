import React from 'react';
import { motion } from 'motion/react';
import { User, GraduationCap, Trophy } from 'lucide-react';
import { AppPath } from '../types';

interface PathSelectorProps {
  onSelect: (path: AppPath) => void;
}

export default function PathSelector({ onSelect }: PathSelectorProps) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #c9964a 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 text-center mb-16"
      >
        <h2 className="text-[#c9964a] font-black tracking-[0.5em] text-xs uppercase mb-4">SÉLECTION DU PROTOCOLE</h2>
        <h1 className="text-5xl font-black italic tracking-tighter uppercase text-white">THE CHOSE</h1>
        <div className="h-1 w-24 bg-red-600 mx-auto mt-4" />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl relative z-10">
        {/* THE PLAYER */}
        <motion.button
          whileHover={{ scale: 1.02, translateY: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect('player')}
          className="bg-white/5 border border-white/10 p-10 text-left rounded-[3rem] group relative overflow-hidden backdrop-blur-xl hover:border-red-600/50 transition-all"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity text-red-600">
            <Trophy size={140} />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-600/10 flex items-center justify-center text-red-600 mb-6 border border-red-600/20">
            <User size={24} />
          </div>
          <h3 className="text-3xl font-black italic mb-4 text-white uppercase tracking-tight">THE PLAYER</h3>
          <p className="text-white/40 text-sm mb-10 leading-relaxed font-medium uppercase tracking-wide">
            L'Âme des Légendes. Stratégie de parcours, Caddie IA tactique et défis de terrain. Focus sur la performance pure.
          </p>
          <div className="flex items-center gap-3 text-red-600 font-black text-[10px] uppercase tracking-[0.3em] mt-auto group-hover:gap-5 transition-all">
            ACTIVER LE MODE <div className="w-12 h-[1px] bg-red-600" />
          </div>
        </motion.button>

        {/* THE STUDENT */}
        <motion.button
          whileHover={{ scale: 1.02, translateY: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect('student')}
          className="bg-white/5 border border-white/10 p-10 text-left rounded-[3rem] group relative overflow-hidden backdrop-blur-xl hover:border-[#c9964a]/50 transition-all"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity text-[#c9964a]">
            <GraduationCap size={140} />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#c9964a]/10 flex items-center justify-center text-[#c9964a] mb-6 border border-[#c9964a]/20">
            <GraduationCap size={24} />
          </div>
          <h3 className="text-3xl font-black italic mb-4 text-white uppercase tracking-tight">THE STUDENT</h3>
          <p className="text-white/40 text-sm mb-10 leading-relaxed font-medium uppercase tracking-wide">
            L'École de Golf. Accès aux Mentors, analyse biomécanique et coaching technique avancé. Maîtrisez chaque coup.
          </p>
          <div className="flex items-center gap-3 text-[#c9964a] font-black text-[10px] uppercase tracking-[0.3em] mt-auto group-hover:gap-5 transition-all">
            ACCÉDER À L'ÉLITE <div className="w-12 h-[1px] bg-[#c9964a]" />
          </div>
        </motion.button>
      </div>

      <div className="absolute bottom-12 text-[10px] text-white/20 font-black tracking-[0.5em] uppercase z-10">
        ONYX TACTICAL SYSTEM — EST 1992
      </div>
    </div>
  );
}
