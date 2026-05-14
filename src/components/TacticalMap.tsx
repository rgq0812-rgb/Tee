import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { Crosshair, Navigation, Target, Shield, Brain, Zap, Info, ChevronRight, Map as MapIcon, X, Search, AlertCircle } from 'lucide-react';
import { analyzeTarget } from '../services/geminiService';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
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

const MapSearch = ({ isSolar, onPlaceSelect }: { isSolar: boolean, onPlaceSelect: (pos: { lat: number, lng: number }) => void }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const map = useMap();
  const placesService = useRef<google.maps.places.AutocompleteService | null>(null);
  const geocoder = useRef<google.maps.Geocoder | null>(null);

  useEffect(() => {
    if (window.google && window.google.maps && !placesService.current) {
      placesService.current = new window.google.maps.places.AutocompleteService();
      geocoder.current = new window.google.maps.Geocoder();
    }
  }, []);

  const handleSearch = (val: string) => {
    setQuery(val);
    if (!val || val.length < 3 || !placesService.current) {
      setSuggestions([]);
      return;
    }

    placesService.current.getPlacePredictions(
      { input: val, types: ['establishment'], componentRestrictions: { country: 'fr' } },
      (predictions) => {
        setSuggestions(predictions || []);
      }
    );
  };

  const selectPlace = (place: any) => {
    if (!geocoder.current || !map) return;
    
    geocoder.current.geocode({ placeId: place.place_id }, (results, status) => {
      if (status === 'OK' && results?.[0]?.geometry?.location) {
        const pos = {
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng()
        };
        onPlaceSelect(pos);
        map.panTo(pos);
        map.setZoom(16);
        setQuery("");
        setSuggestions([]);
      }
    });
  };

  return (
    <div className="relative pointer-events-auto max-w-md mx-auto">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all ${isSolar ? 'bg-white/90 border-zinc-200 shadow-zinc-200/50' : 'bg-black/80 border-[#c9964a]/30 shadow-[#c9964a]/10'}`}>
        <Search className={isSolar ? 'text-zinc-400' : 'text-[#c9964a]'} size={20} />
        <input 
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Trouver un parcours..."
          className="bg-transparent border-none outline-none flex-1 text-sm font-medium focus:ring-0 placeholder:text-zinc-500"
        />
      </div>

      {suggestions.length > 0 && (
        <div className={`absolute top-full left-0 right-0 mt-2 p-2 rounded-2xl border backdrop-blur-xl shadow-2xl max-h-64 overflow-y-auto ${isSolar ? 'bg-white/95 border-zinc-200 shadow-zinc-200/50' : 'bg-black/95 border-white/10 shadow-black'}`}>
          {suggestions.map((s) => (
            <button
              key={s.place_id}
              onClick={() => selectPlace(s)}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs transition-colors mb-1 last:mb-0 ${isSolar ? 'hover:bg-zinc-100 text-zinc-800' : 'hover:bg-white/5 text-zinc-300'}`}
            >
              <div className="font-bold mb-0.5 line-clamp-1">{s.structured_formatting.main_text}</div>
              <div className="opacity-50 line-clamp-1">{s.structured_formatting.secondary_text}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function TacticalMap({ selectedCourse, currentHole, activeCaddie, displayMode, selectedTee }: TacticalMapProps & { displayMode?: 'tactical' | 'solar' }) {
  const isSolar = displayMode === 'solar';
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    // Catch Google Maps auth errors globally
    (window as any).gm_authFailure = () => {
      console.error("Google Maps Authentication Failure");
      setMapError("ERREUR D'AUTHENTIFICATION : La clé API est invalide ou restreinte.");
    };
    return () => {
      (window as any).gm_authFailure = null;
    };
  }, []);

  const hole = selectedCourse.holes.find((h: any) => h.number === currentHole) || selectedCourse.holes[0];
  const [mire, setMire] = useState<any>({ 
    lat: hole.teeBox?.lat || 0,
    lng: hole.teeBox?.lng || 0 
  });
  const [commentary, setCommentary] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const map = useMap();

  // Reset Mire to midpoint and fit bounds on hole change
  useEffect(() => {
    if (!hole || !hole.teeBox || !hole.green?.middle) return;

    const midpoint = {
      lat: (hole.teeBox.lat + hole.green.middle.lat) / 2,
      lng: (hole.teeBox.lng + hole.green.middle.lng) / 2
    };

    setMire(midpoint);

    if (map) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(hole.teeBox);
      bounds.extend(hole.green.middle);
      map.fitBounds(bounds, { top: 100, bottom: 200, left: 50, right: 50 });
      
      // Smooth animation to center
      setTimeout(() => {
        map.panTo(midpoint);
      }, 500);
    }
  }, [currentHole, hole.number, map]);

  const hasGps = hole.teeBox?.lat && hole.green?.middle?.lat;
  
  const distAB = hasGps ? calculateDistance(hole.teeBox.lat, hole.teeBox.lng, mire.lat, mire.lng) : 0;
  const distBC = hasGps ? calculateDistance(mire.lat, mire.lng, hole.green.middle.lat, hole.green.middle.lng) : 0;

  const performAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeTarget(selectedTee, distAB, distBC, activeCaddie.name);
      setCommentary(result);
    } catch (error) {
      console.error("AI error in map analysis:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
     const timeout = setTimeout(performAnalysis, 1500);
     return () => clearTimeout(timeout);
  }, [mire.lat, mire.lng]);

  if (!hasValidKey || mapError) return <AIScreen isSolar={isSolar} />;

  return (
    <div className={`h-[calc(100vh-8rem)] w-full rounded-[2.5rem] overflow-hidden border relative shadow-2xl ${isSolar ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900 border-white/10'}`}>
        <Map
          mapId="DEMO_MAP_ID"
          center={mire}
          zoom={17}
          mapTypeId={isSolar ? "terrain" : "satellite"}
          disableDefaultUI={true}
          gestureHandling={'greedy'}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
        >
          {!hasGps && (
             <div className="absolute inset-0 flex items-center justify-center z-[200] bg-black/60 backdrop-blur-sm">
                <div className="bg-red-600/20 border border-red-600/50 p-6 rounded-3xl text-center max-w-xs">
                   <AlertCircle className="text-red-500 mx-auto mb-3" size={32} />
                   <div className="text-red-500 font-black uppercase text-xs tracking-widest mb-1">Satellite Perdu</div>
                   <p className="text-white/60 text-[10px] uppercase font-bold tracking-tight">Coordonnées GPS manquantes pour ce trou. Mode tactique dégradé.</p>
                </div>
             </div>
          )}
          {/* Points A, B, C */}
          {hasGps && (
            <>
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
                <motion.div 
                  layoutId="pivot-c"
                  className={`w-8 h-8 rounded-full border-2 backdrop-blur-md flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-grab active:cursor-grabbing ${isSolar ? 'bg-white/80 border-black text-black shadow-lg' : 'bg-black/60 border-[#c9964a] text-[#c9964a]'}`}>
                  <Target size={16} />
                </motion.div>
              </AdvancedMarker>

              <AdvancedMarker 
                key={`green-marker-${hole.number}`}
                position={hole.green.middle}
                title="Green (C)"
              >
                <div className={`border-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${isSolar ? 'bg-black border-black text-white' : 'bg-[#c9964a] border-black text-black'}`}>C</div>
              </AdvancedMarker>
     
              <LineOverlay points={[hole.teeBox, mire, hole.green.middle]} isSolar={isSolar} />
            </>
          )}
        </Map>
        
        {/* Places Search Overlay */}
        <div className="absolute top-24 left-6 right-6 z-[100] pointer-events-none">
           <MapSearch isSolar={isSolar} onPlaceSelect={(pos) => setMire(pos)} />
        </div>
 
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
           onClick={performAnalysis}
           className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center shadow-xl active:scale-95 transition-all ${isSolar ? 'bg-black text-white' : 'bg-[#c9964a] text-black shadow-[0_15px_40px_rgba(201,150,74,0.3)]'}`}
          >
            <Navigation size={24} />
         </button>
      </div>
    </div>
  );
}
