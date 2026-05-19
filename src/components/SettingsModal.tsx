import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Settings, Volume2, Wind, Target, Ruler, Bell, Eye, Shield, Globe, Cpu, Music, CheckCircle2, Youtube, Smartphone, Plus, Trash2, Brain } from 'lucide-react';
import { get, set } from 'idb-keyval';

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
  const [isSpotifyConnected, setIsSpotifyConnected] = useState(() => localStorage.getItem('onyx_spotify_connected') === 'true');
  const [isYoutubeConnected, setIsYoutubeConnected] = useState(() => localStorage.getItem('onyx_youtube_connected') === 'true');
  const [localTracks, setLocalTracks] = useState<{ name: string; size: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadLocalTracks = async () => {
      try {
        const stored = await get('onyx_local_tracks') as { name: string; size: string }[] | undefined;
        if (stored) setLocalTracks(stored);
      } catch (e) {
        console.error('Failed to load local tracks', e);
      }
    };
    loadLocalTracks();
  }, []);

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newTracks = Array.from(files).map((f: File) => ({
      name: f.name,
      size: (f.size / (1024 * 1024)).toFixed(1) + ' MB'
    }));

    const updated = [...localTracks, ...newTracks];
    setLocalTracks(updated);
    await set('onyx_local_tracks', updated);
  };

  const removeTrack = async (index: number) => {
    const updated = localTracks.filter((_, i) => i !== index);
    setLocalTracks(updated);
    await set('onyx_local_tracks', updated);
  };

  const handleConnectSpotify = async () => {
    try {
      const response = await fetch('/api/auth/spotify/url');
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();

      const authWindow = window.open(
        url,
        'spotify_popup',
        'width=600,height=700'
      );

      if (!authWindow) {
        alert('Veuillez autoriser les popups pour connecter votre compte Spotify.');
      }
    } catch (error) {
      console.error('Spotify connect error:', error);
    }
  };

  const handleConnectYoutube = async () => {
    try {
      const response = await fetch('/api/auth/youtube/url');
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();

      const authWindow = window.open(
        url,
        'youtube_popup',
        'width=600,height=700'
      );

      if (!authWindow) {
        alert('Veuillez autoriser les popups pour connecter votre compte YouTube.');
      }
    } catch (error) {
      console.error('YouTube connect error:', error);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Basic origin check - in production you should be more strict
      if (event.data?.type === 'SPOTIFY_AUTH_SUCCESS') {
        setIsSpotifyConnected(true);
        localStorage.setItem('onyx_spotify_connected', 'true');
      }
      if (event.data?.type === 'YOUTUBE_AUTH_SUCCESS') {
        setIsYoutubeConnected(true);
        localStorage.setItem('onyx_youtube_connected', 'true');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

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

                {/* MAINTENANCE SYSTÈME */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <Shield size={14} className="text-red-600" />
                    <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Maintenance Système</h3>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                    <p className="text-[10px] text-white/40 uppercase leading-relaxed tracking-wider">
                      Si la voix est métallique ou si le caddie ne répond plus, lancez une réinitialisation des services neuraux.
                    </p>
                    <button 
                      onClick={async () => {
                        try {
                          const { TextToSpeech } = await import('@capacitor-community/text-to-speech');
                          await TextToSpeech.stop();
                        } catch (e) {
                          console.error('Failed to stop speech', e);
                        }
                        localStorage.removeItem('onyx_voice_stuck');
                        // Reload the page to clear all memory states
                        window.location.reload();
                      }}
                      className="w-full bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 text-red-500 font-black uppercase text-[10px] py-4 rounded-xl tracking-[0.2em] transition-all"
                    >
                      Réinitialiser Services Neuraux
                    </button>
                  </div>
                </section>

                {/* VOIX DES CADDIES */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <Brain size={14} className="text-[#c9964a]" />
                    <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Voix des Caddies</h3>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
                    {[
                      { id: 'strat', name: 'Adam', title: 'Le Mentor Sage', voice: 'Charon' },
                      { id: 'mage', name: 'Antoni', title: 'Le Stratège Précis', voice: 'Kore' },
                      { id: 'pred', name: 'Arnold', title: 'L\'Autorité Tactique', voice: 'Fenrir' },
                      { id: 'clock', name: 'Josh', title: 'L\'Analyse Directe', voice: 'Puck' }
                    ].map(c => (
                      <div key={`voice-prev-${c.id}`} className="p-5 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white uppercase tracking-tight mb-1">{c.name}</span>
                          <span className="text-[8px] text-white/30 uppercase tracking-widest">{c.title} ({c.voice})</span>
                        </div>
                        <button 
                          onClick={async () => {
                            try {
                              const { generateSpeech, speakWithBrowser } = await import('../services/geminiService');
                              const { playRawPcm } = await import('../lib/audioUtils');
                              const res = await generateSpeech(`Bonjour, je suis ${c.name}. Je suis prêt pour la partie.`, c);
                              if (typeof res === 'object' && res.fallback) {
                                speakWithBrowser(res.text);
                              } else if (typeof res === 'string') {
                                playRawPcm(res);
                              }
                            } catch (e) {
                              console.error("Test speech error", e);
                            }
                          }}
                          className="px-4 py-2 bg-white/5 hover:bg-[#c9964a]/20 border border-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest text-[#c9964a] transition-colors"
                        >
                          Tester
                        </button>
                      </div>
                    ))}
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

                {/* MEDIA & SYNC */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <Music size={14} className="text-[#c9964a]" />
                    <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Médias & Sync</h3>
                  </div>
                  
                  {/* Spotify */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden p-5 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isSpotifyConnected ? 'bg-[#1DB954]/20 text-[#1DB954]' : 'bg-white/5 text-white/40'}`}>
                          <Music size={18} />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold text-white uppercase tracking-tight leading-none mb-1">Spotify Playlist</span>
                          <span className="text-[9px] text-white/30 uppercase tracking-widest">Synchroniser ma musique tactique</span>
                        </div>
                      </div>
                      <button
                        onClick={handleConnectSpotify}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                          isSpotifyConnected 
                            ? 'bg-[#1DB954]/10 text-[#1DB954] border border-[#1DB954]/20' 
                            : 'bg-[#1DB954] text-black shadow-lg shadow-[#1DB954]/20'
                        }`}
                      >
                        {isSpotifyConnected ? (
                          <>
                            <CheckCircle2 size={12} />
                            Connecté
                          </>
                        ) : (
                          'Connecter'
                        )}
                      </button>
                    </div>

                    {isSpotifyConnected && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="mt-6 pt-6 border-t border-white/5"
                      >
                        <p className="text-[10px] text-[#1DB954] uppercase tracking-widest font-black mb-4">Playlists Spotify</p>
                        <div className="space-y-3">
                          <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-colors">
                            <span className="text-[10px] text-white/60 uppercase font-bold tracking-tighter">Onyx Focus - 128 BPM</span>
                            <div className="w-6 h-6 bg-[#1DB954]/20 text-[#1DB954] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Target size={12} />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* YouTube */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden p-5 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isYoutubeConnected ? 'bg-[#FF0000]/20 text-[#FF0000]' : 'bg-white/5 text-white/40'}`}>
                          <Youtube size={18} />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold text-white uppercase tracking-tight leading-none mb-1">YouTube Music</span>
                          <span className="text-[9px] text-white/30 uppercase tracking-widest">Flux audio Google & Playlists</span>
                        </div>
                      </div>
                      <button
                        onClick={handleConnectYoutube}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                          isYoutubeConnected 
                            ? 'bg-[#FF0000]/10 text-[#FF0000] border border-[#FF0000]/20' 
                            : 'bg-[#FF0000] text-white shadow-lg shadow-[#FF0000]/20'
                        }`}
                      >
                        {isYoutubeConnected ? (
                          <>
                            <CheckCircle2 size={12} />
                            Connecté
                          </>
                        ) : (
                          'Connecter'
                        )}
                      </button>
                    </div>
                    
                    {isYoutubeConnected && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="mt-6 pt-6 border-t border-white/5"
                      >
                        <p className="text-[10px] text-[#FF0000] uppercase tracking-widest font-black mb-4">Playlists YouTube</p>
                        <div className="space-y-3">
                          <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-colors">
                            <span className="text-[10px] text-white/60 uppercase font-bold tracking-tighter">Golf Vibes (YouTube)</span>
                            <div className="w-6 h-6 bg-[#FF0000]/20 text-[#FF0000] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Target size={12} />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Fichiers Appareil */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${localTracks.length > 0 ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/40'}`}>
                          <Smartphone size={18} />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold text-white uppercase tracking-tight leading-none mb-1">Fichiers Appareil</span>
                          <span className="text-[9px] text-white/30 uppercase tracking-widest">Importer tes musiques locales</span>
                        </div>
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        multiple 
                        accept="audio/*"
                        onChange={handleFileImport}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 text-white"
                      >
                        <Plus size={12} />
                        Importer
                      </button>
                    </div>

                    {localTracks.length > 0 && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="mt-6 pt-6 border-t border-white/5"
                      >
                        <p className="text-[10px] text-blue-400 uppercase tracking-widest font-black mb-4">Bibliothèque Mobile</p>
                        <div className="space-y-2">
                          {localTracks.map((track, idx) => (
                            <div key={`local-track-${track.name}-${idx}`} className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between group">
                              <div className="flex flex-col">
                                <span className="text-[10px] text-white font-bold tracking-tighter truncate max-w-[180px]">{track.name}</span>
                                <span className="text-[8px] text-white/20 uppercase font-mono">{track.size}</span>
                              </div>
                              <button 
                                onClick={() => removeTrack(idx)}
                                className="p-2 text-white/20 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
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
