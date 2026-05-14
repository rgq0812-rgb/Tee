import { useState } from 'react';
import { motion } from 'motion/react';
import { Target, MapPin, Volume2, Loader2 } from 'lucide-react';
import { Hole } from '../types';
import { generateSpeech, speakWithBrowser } from '../services/geminiService';
import { playRawPcm } from '../lib/audioUtils';

export default function TacticalHoleView({ hole, customImage, userLocation, selectedTee = 'white' }: { hole: Hole, customImage?: string, userLocation?: {lat: number, lng: number} | null, selectedTee?: 'black' | 'white' | 'yellow' | 'blue' | 'red' }) {
  const [playing, setPlaying] = useState(false);
  
  const currentTeeDistance = (hole.distanceTee as any)[selectedTee] || hole.distanceTee.white;
  const teeColors: Record<string, string> = {
    black: '#000000',
    white: '#FFFFFF',
    yellow: '#FACC15',
    blue: '#3b82f6',
    red: '#EF4444'
  };

  // Coordinate projection logic: Map GPS to SVG (200x320)
  const getGpsPosition = () => {
    if (!userLocation || !hole.teeBox || !hole.green?.middle) return null;

    const t = hole.teeBox;
    const g = hole.green.middle;
    const p = userLocation;

    // Vector Tee -> Green
    const dLat = g.lat - t.lat;
    const dLng = g.lng - t.lng;
    const magTG = Math.sqrt(dLat * dLat + dLng * dLng);

    if (magTG === 0) return null;

    // Vector Tee -> User
    const pLat = p.lat - t.lat;
    const pLng = p.lng - t.lng;

    // Dot product for projection (longitudinal progress)
    const dot = (pLat * dLat + pLng * dLng);
    const progress = dot / (magTG * magTG);

    // Lateral offset (cross product)
    const cross = (pLng * dLat - pLat * dLng);
    const lateral = cross / magTG;

    // Map to SVG coordinates: 
    // Tee at (100, 280)
    // Green at (100, 40)
    
    // If progress is between -0.2 and 1.2, we show it on the map. 
    // Otherwise, it's "Out of hole view"
    if (progress < -0.2 || progress > 1.2 || Math.abs(lateral) > 0.005) {
      // Still show something if within reasonable range of the course?
      // For now, let's just constrain it to edges if within 500m
      const distToTee = Math.sqrt(pLat * pLat + pLng * pLng);
      if (distToTee > 0.01) return null; // Too far (> ~1km)
    }

    const y = 280 - (progress * 240);
    const x = 100 + (lateral * 20000); // Increased sensitivity

    return { 
      x: Math.max(10, Math.min(190, x)), 
      y: Math.max(10, Math.min(310, y)) 
    };
  };

  const userPos = getGpsPosition();

  const handlePlayAdvice = async () => {
    if (playing) return;
    setPlaying(true);
    try {
      const text = hole.tip || hole.description;
      const resultData = await generateSpeech(`Conseil stratégique pour le trou ${hole.number}: ${text}`);
      if (typeof resultData === 'object' && resultData.fallback) {
        speakWithBrowser(resultData.text);
      } else if (typeof resultData === 'string') {
        await playRawPcm(resultData);
      }
    } catch (err) {
      console.error("Audio playback error:", err);
    } finally {
      setPlaying(false);
    }
  };
  const getPath = () => {
    if (hole.layout === 'left') return "M 100 280 Q 60 150 100 40";
    if (hole.layout === 'right') return "M 100 280 Q 140 150 100 40";
    return "M 100 280 L 100 40";
  };

  return (
    <div className="relative aspect-[3/4] bg-black/60 border border-[#c9964a]/30 rounded-[2.5rem] overflow-hidden backdrop-blur-md group shadow-2xl">
      {/* Real Image Layer (Stored in Firestore or default asset) */}
      {(customImage || hole.customImage) && (
        <img 
          src={customImage || hole.customImage} 
          alt={`Hole ${hole.number} drawing`}
          className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-screen z-0"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535131749006-b7f58c9903e7?q=80&w=2000&auto=format&fit=crop';
          }}
        />
      )}

      {/* Background Grid Layer */}
      <div className="absolute inset-0 opacity-5 z-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#c9964a 1px, transparent 1px), linear-gradient(90deg, #c9964a 1px, transparent 1px)', backgroundSize: '15px 15px' }} />
      
      {/* HUD Labels - CLEAN VERSION */}
      <div className="absolute top-8 left-8 flex flex-col z-20">
        <div className="bg-black/40 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 shadow-2xl">
          <span className="text-4xl font-black italic text-white uppercase tracking-tighter leading-none block">
            {hole.number} <span className="text-[#c9964a] text-xl not-italic ml-1">/ {hole.name}</span>
          </span>
        </div>
      </div>

      <div className="absolute top-8 right-8 text-right z-20">
        <div className="text-sm font-black text-[#c9964a] font-mono uppercase tracking-widest bg-black/40 px-2 py-1 rounded backdrop-blur-sm border border-[#c9964a]/20">PAR {hole.par}</div>
        <div className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em] mt-1">HCP {hole.handicap}</div>
      </div>

      {/* SVG Tactical Overlay */}
      <svg viewBox="0 0 200 320" className="absolute inset-0 w-full h-full p-0 z-10 pointer-events-none">
        {/* GPS Marker (Blue Dot) */}
        {userPos && (
          <motion.g
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {/* Pulsing Aura */}
            <motion.circle
              cx={userPos.x}
              cy={userPos.y}
              r="8"
              fill="rgba(59, 130, 246, 0.4)"
              animate={{
                r: [8, 16, 8],
                opacity: [0.6, 0.2, 0.6]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            {/* Inner Core */}
            <circle
              cx={userPos.x}
              cy={userPos.y}
              r="4"
              fill="#3b82f6"
              stroke="white"
              strokeWidth="1.5"
              className="shadow-3xl"
            />
          </motion.g>
        )}
      </svg>

      {/* Footer Content - PROMINENT ADVICE & DISTANCE */}
      <div className="absolute bottom-8 left-8 right-8 flex flex-col gap-4 z-20 drop-shadow-2xl">
        {/* Advice / Tip Area */}
        <div className="bg-[#c9964a]/10 backdrop-blur-md border-l-2 border-[#c9964a] p-4 rounded-r-xl relative">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[10px] font-black text-[#c9964a] uppercase tracking-[0.2em]">CONSEIL STRATÉGIQUE</div>
            <button 
              onClick={handlePlayAdvice}
              disabled={playing}
              className="text-[#c9964a] hover:text-white transition-colors disabled:opacity-50"
            >
              {playing ? <Loader2 size={12} className="animate-spin" /> : <Volume2 size={12} />}
            </button>
          </div>
          <p className="text-sm font-medium text-white/90 leading-tight">
            {hole.tip || hole.description}
          </p>
        </div>

        {/* Main Stats Footer */}
        <div className="flex justify-between items-center bg-black/40 p-2 px-4 rounded-2xl backdrop-blur-sm border border-white/5">
           <div className="flex items-center gap-3">
             <div className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: teeColors[selectedTee] }} />
             <div className="flex flex-col">
               <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">Distance</span>
               <span className="text-2xl font-black text-white italic tracking-tighter leading-none">{currentTeeDistance}m</span>
             </div>
           </div>
           <div className="h-8 w-px bg-white/10" />
           <div className="flex flex-col items-end">
             <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">Fond Green</span>
             <span className="text-lg font-bold text-[#c9964a] leading-none">{currentTeeDistance + 12}m</span>
           </div>
        </div>
      </div>
    </div>
  );
}
