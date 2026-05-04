import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Settings, Volume2, Wind, Target, Ruler, Bell, Eye, Shield, Globe, Cpu } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [units, setUnits] = useState(() => localStorage.getItem('onyx_units') || 'meters');
  const [haptics, setHaptics] = useState(() => localStorage.getItem('onyx_haptics') !== 'false');
  const [ambientSound, setAmbientSound] = useState(() => localStorage.getItem('onyx_ambient') !== 'false');
  const [voiceActivation, setVoiceActivation] = useState(() => localStorage.getItem('onyx_voice') !== 'false');
  const [preciseWind, setPreciseWind] = useState(() => localStorage.getItem('onyx_wind') !== 'false');
  const [innerCircle, setInnerCircle] = useState(() => localStorage.getItem('onyx_inner_circle') !== 'false');
  const [anonScores, setAnonScores] = useState(() => localStorage.getItem('onyx_anon_scores') === 'true');

  useEffect(() => {
    localStorage.setItem('onyx_units', units);
    localStorage.setItem('onyx_haptics', String(haptics));
    localStorage.setItem('onyx_ambient', String(ambientSound));
    localStorage.setItem('onyx_voice', String(voiceActivation));
    localStorage.setItem('onyx_wind', String(preciseWind));
    localStorage.setItem('onyx_inner_circle', String(innerCircle));
    localStorage.setItem('onyx_anon_scores', String(anonScores));
  }, [units, haptics, ambientSound, voiceActivation, preciseWind, innerCircle, anonScores]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] bg-black overflow-y-auto"
        >
          <div className="min-h-screen px-6 py-12 flex flex-col">
            <div className="max-w-md mx-auto w-full relative pb-20">
              <button 
                onClick={onClose}
                className="absolute top-0 right-0 p-2 text-white/40 hover:text-white"
              >
                <X size={28} />
              </button>

              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-[#c9964a]/20 rounded-xl flex items-center justify-center text-[#c9964a]">
                  <Settings size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black italic text-white uppercase tracking-tight">PARAMÈTRES ONYX</h2>
                  <p className="text-[10px] text-white/40 uppercase tracking-[0.3em]">Configuration Système Elite</p>
                </div>
              </div>

              <div className="space-y-8">
                {/* UNITÉS */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <Ruler size={14} className="text-[#c9964a]" />
                    <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Unités de mesure</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 p-1 bg-white/5 rounded-2xl border border-white/10">
                    <button
                      onClick={() => setUnits('meters')}
                      className={`py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        units === 'meters' ? 'bg-[#c9964a] text-black shadow-lg shadow-[#c9964a]/20' : 'text-white/40 hover:text-white'
                      }`}
                    >
                      Mètres
                    </button>
                    <button
                      onClick={() => setUnits('yards')}
                      className={`py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        units === 'yards' ? 'bg-[#c9964a] text-black shadow-lg shadow-[#c9964a]/20' : 'text-white/40 hover:text-white'
                      }`}
                    >
                      Yards
                    </button>
                  </div>
                </section>

                {/* TACTICAL OPTIONS */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <Target size={14} className="text-[#c9964a]" />
                    <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Options Tactiques</h3>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
                    <ToggleItem 
                      icon={Cpu} 
                      label="Moteur de Précision Onyx" 
                      description="Analyse avancée des trajectoires" 
                      active={true}
                      readOnly
                    />
                    <ToggleItem 
                      icon={Wind} 
                      label="Analyse de Vent Précise" 
                      description="Utilisation du Mistral local" 
                      active={preciseWind}
                      onToggle={setPreciseWind}
                    />
                    <ToggleItem 
                      icon={Globe} 
                      label="Grounding Maps" 
                      description="Données topographiques réelles" 
                      active={true}
                      readOnly
                    />
                  </div>
                </section>

                {/* AUDIO & FEEDBACK */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <Volume2 size={14} className="text-[#c9964a]" />
                    <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Audio & Feedback</h3>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
                    <ToggleItem 
                      icon={Bell} 
                      label="Sons Ambiants" 
                      description="Retours sonores tactiques" 
                      active={ambientSound}
                      onToggle={setAmbientSound}
                    />
                    <ToggleItem 
                      icon={Cpu} 
                      label="Vibration Haptique" 
                      description="Confirmation des actions" 
                      active={haptics}
                      onToggle={setHaptics}
                    />
                    <ToggleItem 
                      icon={Eye} 
                      label="Mode 'Ghost' Ear" 
                      description="Activation vocale automatique" 
                      active={voiceActivation}
                      onToggle={setVoiceActivation}
                    />
                  </div>
                </section>

                {/* PRIVACY */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <Shield size={14} className="text-red-500" />
                    <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Confidentialité</h3>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
                    <ToggleItem 
                      icon={Globe} 
                      label="Partage Inner Circle" 
                      description="Visibilité par les autres agents" 
                      active={innerCircle}
                      onToggle={setInnerCircle}
                    />
                    <ToggleItem 
                      icon={Target} 
                      label="Anonymisation des scores" 
                      description="Cacher les scores sur le leaderboard" 
                      active={anonScores}
                      onToggle={setAnonScores}
                    />
                  </div>
                </section>

                <div className="pt-8 text-center">
                  <p className="text-[8px] font-mono text-white/20 uppercase tracking-[0.5em]">ONYX V2.42 — BUILD 2026.05.04</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full mt-12 bg-white text-black font-black uppercase text-xs py-5 rounded-2xl hover:bg-[#c9964a] transition-colors"
              >
                APPLIQUER LES CONFIGURATIONS
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ToggleItem({ icon: Icon, label, description, active, onToggle, readOnly = false }: any) {
  return (
    <div className="p-5 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/40">
          <Icon size={18} />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-xs font-bold text-white uppercase tracking-tight leading-none mb-1">{label}</span>
          <span className="text-[9px] text-white/30 uppercase tracking-widest">{description}</span>
        </div>
      </div>
      <button 
        disabled={readOnly}
        onClick={() => onToggle && onToggle(!active)}
        className={`w-12 h-6 rounded-full relative transition-colors ${active ? 'bg-[#c9964a]' : 'bg-white/10'}`}
      >
        <motion.div 
          animate={{ x: active ? 26 : 2 }}
          initial={false}
          className={`w-5 h-5 rounded-full shadow-sm absolute top-0.5 ${active ? 'bg-black' : 'bg-white/20'}`}
        />
      </button>
    </div>
  );
}
