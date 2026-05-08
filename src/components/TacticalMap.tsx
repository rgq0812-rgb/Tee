import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { Crosshair, Navigation, Target, Shield, Brain, Zap, Info, ChevronRight, Map as MapIcon, X } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || 
                process.env.VITE_GOOGLE_MAPS_API_KEY || 
                process.env.GOOGLE_MAPS_API_KEY ||
                (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || 
                '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY' && API_KEY.length > 5;

interface TacticalMapProps {
  selectedCourse: any;
  currentHole: number;
  activeCaddie: any;
  selectedTee: 'black' | 'white' | 'yellow' | 'blue' | 'red';
  key?: string;
}

// Distance helper
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

const MapPin = ({ size, className }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const AIScreen = ({ isSolar }: { isSolar?: boolean }) => (
  <div className={`flex flex-col items-center justify-center h-full p-8 text-center ${isSolar ? 'bg-zinc-50 text-black' : 'bg-black text-white'}`}>
    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 animate-pulse ${isSolar ? 'bg-black/5 border-black/10' : 'bg-[#c9964a]/20 border-[#c9964a]/40'}`}>
      <MapPin size={32} className={isSolar ? 'text-black' : 'text-[#c9964a]'} />
    </div>
    <h2 className={`text-xl font-black uppercase tracking-[0.3em] mb-4 ${isSolar ? 'text-black' : 'text-[#c9964a]'}`}>GPS Non Configuré</h2>
    <p className={`text-sm leading-relaxed max-w-xs mb-8 ${isSolar ? 'text-zinc-500 font-bold' : 'text-white/40'}`}>
      Le protocole satellite nécessite une clé d'accès Google Maps Platform pour le rendu tactique.
    </p>
    <div className={`border p-6 rounded-3xl text-left w-full space-y-4 ${isSolar ? 'bg-white border-zinc-200 shadow-sm' : 'bg-white/5 border-white/10'}`}>
      <div className="flex gap-4">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-sans shrink-0 ${isSolar ? 'bg-black text-white' : 'bg-[#c9964a] text-black'}`}>1</div>
        <div className="flex flex-col">
          <p className={`text-[10px] uppercase tracking-widest leading-tight mb-1 font-bold ${isSolar ? 'text-black' : 'text-white/80'}`}>Activer <span className={`${isSolar ? 'text-black font-black underline decoration-2' : 'text-[#c9964a] underline'}`}>Maps JavaScript API</span></p>
          <p className={`text-[9px] leading-normal italic text-xs ${isSolar ? 'text-zinc-500' : 'text-white/40'}`}>C'est différent du 'SDK Android'. Activez 'Maps JavaScript API' dans la console Google Cloud.</p>
        </div>
      </div>
      <div className="flex gap-4 text-red-600">
        <div className="w-6 h-6 rounded-full bg-red-600/10 flex items-center justify-center text-[10px] font-bold shrink-0">!</div>
        <div className="flex flex-col">
          <p className="text-[10px] uppercase tracking-widest leading-tight mb-1 font-black">ApiTargetBlockedMapError</p>
          <p className={`text-[9px] leading-normal italic text-xs ${isSolar ? 'text-red-800 font-medium' : ''}`}>Cette erreur (présente dans vos logs) signifie que l'API n'est pas activée sur cette clé.</p>
        </div>
      </div>
      <div className="flex gap-4">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isSolar ? 'bg-zinc-100 text-zinc-400' : 'bg-white/10'}`}>2</div>
        <div className="flex flex-col">
          <p className={`text-[10px] uppercase tracking-widest leading-tight mb-1 font-bold ${isSolar ? 'text-zinc-400' : 'text-white/60'}`}>VÉRIFIER LE DOMAINE (Referrer)</p>
          <p className={`text-[9px] leading-normal italic text-xs ${isSolar ? 'text-zinc-500' : 'text-white/40'}`}>Assurez-vous que l'URL de l'application est autorisée dans les restrictions de clés.</p>
        </div>
      </div>
    </div>
  </div>
);

const CaddieOverlay = ({ commentary, onClose, isSolar }: { commentary: string; onClose: () => void; isSolar?: boolean }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 20 }}
    className={`absolute bottom-32 left-4 right-4 backdrop-blur-3xl border p-6 rounded-[2rem] z-[100] shadow-2xl ${isSolar ? 'bg-white/95 border-zinc-200' : 'bg-black/80 border-[#c9964a]/30'}`}
  >
    <div className="flex justify-between items-start mb-3">
      <div className="flex items-center gap-2">
        <Brain size={16} className={isSolar ? 'text-black' : 'text-[#c9964a]'} />
        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isSolar ? 'text-black' : 'text-[#c9964a]'}`}>Analyse Tactique Onyx</span>
      </div>
      <button onClick={onClose} className={isSolar ? 'text-black/20' : 'text-white/20'}><X size={16} /></button>
    </div>
    <p className={`text-xs font-black italic leading-relaxed ${isSolar ? 'text-black' : 'text-white/90'}`}>
      "{commentary}"
    </p>
  </motion.div>
);

const LineOverlay = ({ points, isSolar }: { points: any[], isSolar?: boolean }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map || points.length < 2) return;
    
    let polyline: google.maps.Polyline | null = null;

    const renderLine = () => {
      if (window.google && window.google.maps) {
        polyline = new window.google.maps.Polyline({
          path: points,
          geodesic: true,
          strokeColor: isSolar ? '#000000' : '#c9964a',
          strokeOpacity: 0.8,
          strokeWeight: 3,
          map: map,
        });
      }
    };

    renderLine();
    
    return () => {
      if (polyline) polyline.setMap(null);
    };
  }, [map, points, isSolar]);

  return null;
};

export default function TacticalMap({ selectedCourse, currentHole, activeCaddie, displayMode, selectedTee }: TacticalMapProps & { displayMode?: 'tactical' | 'solar' }) {
  const isSolar = displayMode === 'solar';
  const hole = selectedCourse.holes.find((h: any) => h.number === currentHole) || selectedCourse.holes[0];
  const [mire, setMire] = useState<any>({ 
    lat: (hole.teeBox.lat + hole.green.middle.lat) / 2, 
    lng: (hole.teeBox.lng + hole.green.middle.lng) / 2 
  });
  const [commentary, setCommentary] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const distAB = calculateDistance(hole.teeBox.lat, hole.teeBox.lng, mire.lat, mire.lng);
  const distBC = calculateDistance(mire.lat, mire.lng, hole.green.middle.lat, hole.green.middle.lng);

  const analyzeTarget = async () => {
    if (!process.env.GEMINI_API_KEY) return;
    setIsAnalyzing(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const genAI = new GoogleGenAI({ apiKey });
      
      const prompt = `Tu es ${activeCaddie.name}, l'IA caddie de l'application de golf "The Chose".
      Situation tactique :
      - Couleur de départ : ${selectedTee.toUpperCase()}
      - Point A (Départ) vers Point B (Cible actuelle) : ${distAB}m.
      - Point B vers Point C (Green) : ${distBC}m.
      
      Rédige une analyse courte (max 2 phrases).
      Format : "Départ ${selectedTee.toUpperCase()}. Mire à ${distAB}m. Reste ${distBC}m. [Conseil]".`;

      const response = await genAI.models.generateContent({
        model: "gemini-flash-latest",
        contents: prompt
      });
      setCommentary(response.text || `Objectif validé.`);
    } catch (error) {
      console.error("AI error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
     const timeout = setTimeout(analyzeTarget, 1500);
     return () => clearTimeout(timeout);
  }, [mire.lat, mire.lng]);

  if (!hasValidKey) return <AIScreen isSolar={isSolar} />;

  return (
    <div className={`h-[calc(100vh-8rem)] w-full rounded-[2.5rem] overflow-hidden border relative shadow-2xl ${isSolar ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900 border-white/10'}`}>
      <APIProvider apiKey={API_KEY} version="weekly" language="fr">
        <Map
          mapId="DEMO_MAP_ID"
          defaultCenter={mire}
          defaultZoom={17}
          mapTypeId={isSolar ? "terrain" : "satellite"}
          disableDefaultUI={true}
          gestureHandling={'greedy'}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Points A, B, C */}
          <AdvancedMarker 
            key={`tee-marker-${hole.number}`}
            position={hole.teeBox} 
            title="Tee Box (A)"
          >
            <div className={`border-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${isSolar ? 'bg-black border-black text-white' : 'bg-black border-white text-white'}`}>A</div>
          </AdvancedMarker>

          <AdvancedMarker 
            key={`mire-marker-${hole.number}`}
            position={mire} 
            draggable={true}
            onDragEnd={(e: any) => {
              if (e.latLng) setMire({ lat: e.latLng.lat(), lng: e.latLng.lng() });
            }}
          >
            <div className={`w-8 h-8 rounded-full border-2 backdrop-blur-md flex items-center justify-center ${isSolar ? 'bg-white/80 border-black text-black shadow-lg' : 'bg-black/60 border-[#c9964a] text-[#c9964a]'}`}>
              <Target size={16} />
            </div>
          </AdvancedMarker>

          <AdvancedMarker 
            key={`green-marker-${hole.number}`}
            position={hole.green.middle}
            title="Green (C)"
          >
            <div className={`border-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${isSolar ? 'bg-black border-black text-white' : 'bg-[#c9964a] border-black text-black'}`}>C</div>
          </AdvancedMarker>
 
          <LineOverlay points={[hole.teeBox, mire, hole.green.middle]} isSolar={isSolar} />
        </Map>
      </APIProvider>
 
      {/* HUD OVERLAY */}
      <div className="absolute top-6 left-6 right-6 pointer-events-none flex flex-col gap-3">
        <div className="flex justify-between items-start">
           <div className="flex flex-col gap-1">
             <div className={`backdrop-blur-md border px-4 py-2 rounded-2xl inline-flex flex-col shadow-sm ${isSolar ? 'bg-white/90 border-zinc-200' : 'bg-black/60 border-white/10'}`}>
                <span className={`text-[8px] font-black uppercase tracking-widest ${isSolar ? 'text-zinc-400 font-bold' : 'text-white/40'}`}>Hole 0{currentHole}</span>
                <span className={`text-sm font-black italic uppercase tracking-tighter leading-none ${isSolar ? 'text-black' : 'text-[#c9964a]'}`}>{hole.name}</span>
             </div>
           </div>
           
           <div className="flex flex-col gap-2 items-end">
              <div className={`backdrop-blur-md border p-3 rounded-2xl flex items-center gap-4 shadow-sm ${isSolar ? 'bg-white/90 border-zinc-200' : 'bg-black/60 border-white/10'}`}>
                 <div className="flex flex-col">
                    <span className={`text-[7px] font-black uppercase tracking-widest leading-none ${isSolar ? 'text-zinc-400 font-bold' : 'text-white/40'}`}>Vitesse Vent</span>
                    <span className={`text-xs font-black italic ${isSolar ? 'text-black' : 'text-white'}`}>14 KM/H NW</span>
                 </div>
                 <div className={`w-[1px] h-6 ${isSolar ? 'bg-zinc-200' : 'bg-white/10'}`} />
                 <div className="flex flex-col">
                    <span className={`text-[7px] font-black uppercase tracking-widest leading-none ${isSolar ? 'text-zinc-400 font-bold' : 'text-white/40'}`}>Conditions</span>
                    <span className={`text-xs font-black italic uppercase tracking-tight ${isSolar ? 'text-emerald-600' : 'text-sky-400'}`}>Climat Optimal</span>
                 </div>
              </div>
           </div>
        </div>
 
        {/* Distance Indicator */}
        <div className="grid grid-cols-2 gap-3 mt-4">
           <div className={`p-4 rounded-[1.8rem] flex flex-col items-center shadow-xl relative overflow-hidden ${isSolar ? 'bg-black text-white' : 'bg-[#c9964a] text-black shadow-[0_15px_40px_rgba(201,150,74,0.4)]'}`}>
              <div className="absolute top-0 right-0 p-3 opacity-10">
                 <Navigation size={48} className={isSolar ? 'text-white' : 'text-black'} />
              </div>
              <span className={`text-[8px] font-black uppercase tracking-widest leading-none mb-1 ${isSolar ? 'text-zinc-400' : 'text-black/40'}`}>Ditance Portée (A→B)</span>
              <div className="flex items-baseline gap-1">
                 <span className={`text-3xl font-black italic leading-none font-mono ${isSolar ? 'text-white' : 'text-black'}`}>{distAB}</span>
                 <span className={`text-[10px] font-black ${isSolar ? 'text-white/30' : 'text-black/30'}`}>METERS</span>
              </div>
           </div>
           <div className={`backdrop-blur-xl border p-4 rounded-[1.8rem] flex flex-col items-center shadow-sm ${isSolar ? 'bg-white/90 border-zinc-200 shadow-zinc-200' : 'bg-zinc-900/90 border-white/10'}`}>
              <span className={`text-[8px] font-black uppercase tracking-widest leading-none mb-1 ${isSolar ? 'text-zinc-400 font-bold' : 'text-white/40'}`}>Reste au Green (B→C)</span>
              <div className="flex items-baseline gap-1">
                 <span className={`text-3xl font-black italic leading-none font-mono ${isSolar ? 'text-black' : 'text-white'}`}>{distBC}</span>
                 <span className={`text-[10px] font-black ${isSolar ? 'text-black/20' : 'text-white/20'}`}>METERS</span>
              </div>
           </div>
        </div>
      </div>
 
      <AnimatePresence>
        {commentary && (
          <CaddieOverlay commentary={commentary} onClose={() => setCommentary(null)} isSolar={isSolar} />
        )}
      </AnimatePresence>
 
      <div className="absolute bottom-6 left-6 right-6 flex items-center gap-3">
         <motion.div 
            animate={isAnalyzing ? { scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
            className={`backdrop-blur-3xl border h-16 rounded-[1.8rem] flex items-center px-6 gap-4 shadow-lg ${isSolar ? 'bg-white/95 border-zinc-200' : 'bg-black/80 border-white/10'}`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${isSolar ? 'bg-black shadow-inner border-black text-white' : 'bg-white/5 border-white/10 text-[#c9964a]'}`}>
               <Shield size={18} />
            </div>
            <div className="flex flex-col">
               <span className={`text-[8px] font-black uppercase tracking-[0.2em] leading-none mb-1 ${isSolar ? 'text-zinc-400 font-bold' : 'text-white/30'}`}>ANALYSE BALISTIQUE</span>
               <span className={`text-[10px] font-black italic uppercase tracking-widest ${isSolar ? 'text-black' : 'text-[#c9964a]'}`}>
                 {isAnalyzing ? 'Calcul en cours...' : 'Prêt pour engagement'}
               </span>
            </div>
         </motion.div>
         <button 
           onClick={analyzeTarget}
           className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center shadow-xl active:scale-95 transition-all ${isSolar ? 'bg-black text-white' : 'bg-[#c9964a] text-black shadow-[0_15px_40px_rgba(201,150,74,0.3)]'}`}
          >
            <Navigation size={24} />
         </button>
      </div>
    </div>
  );
}
