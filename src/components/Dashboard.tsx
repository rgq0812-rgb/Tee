import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, where, orderBy, getDocs, limit, setDoc, doc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { useAuth } from '../services/AuthProvider';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MessageSquare, Trophy, ChevronLeft, ChevronRight, MapPin, Target, Brain, Box, Cloud, Download, Upload as UploadIcon, X, Navigation, Shield, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { useAmbientSound } from '../hooks/use-ambient-sound';
import { INITIAL_CLUBS, COURSES, CADDIES } from '../constants';
import TacticalHoleView from './TacticalHoleView';
import { getHaversineDistance } from '../utils/geo';
import { generateSpeech, getTacticalAdvice } from '../services/geminiService';
import { playRawPcm } from '../lib/audioUtils';
import RulesModal from './RulesModal';
import { BookOpen } from 'lucide-react';

export default function Dashboard({ 
  scorecard, setScorecard, 
  currentHole, setCurrentHole, 
  selectedCourse, setSelectedCourse, 
  advice, setAdvice, 
  eliteXP, setEliteXP,
  arsenal, setArsenal,
  playerForm, setPlayerForm,
  handicap,
  setActiveTab
}: any) {
  const { user } = useAuth();
  const { playWind, playPing } = useAmbientSound();
  const [recentRounds, setRecentRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCourseSelector, setShowCourseSelector] = useState(false);
  const [showCaddieSelector, setShowCaddieSelector] = useState(false);
  const [showSyncMenu, setShowSyncMenu] = useState(false);
  const [activeCaddie, setActiveCaddie] = useState<any>(CADDIES.strat); // Default to ADAM
  const [customHoleImages, setCustomHoleImages] = useState<Record<string, string>>({});
  const [wind, setWind] = useState({ speed: Math.floor(Math.random() * 25) + 5, direction: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)] });
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'searching' | 'active' | 'denied' | 'unavailable'>('searching');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEarPosition, setIsEarPosition] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [units, setUnits] = useState(() => localStorage.getItem('onyx_units') || 'meters');

  // Sync units if changed in localStorage (e.g. from Profile menu)
  useEffect(() => {
    const handleStorage = () => {
      const savedUnits = localStorage.getItem('onyx_units') || 'meters';
      setUnits(savedUnits);
    };
    window.addEventListener('storage', handleStorage);
    // Also poll occasionally or just rely on focus
    const interval = setInterval(handleStorage, 2000);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);
  
  // Real-time listener for custom images
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, 'hole_assets'), (snapshot) => {
      const images: Record<string, string> = {};
      snapshot.forEach(doc => {
        images[doc.id] = doc.data().imageData;
      });
      setCustomHoleImages(images);
      setQuotaExceeded(false);
    }, (error) => {
      console.warn("Hole assets sync failed (likely quota):", error);
      if (error.message.includes('quota') || error.message.includes('resource-exhausted')) {
        setQuotaExceeded(true);
      }
    });
    return () => unsub();
  }, [user]);

  const handleUploadImage = async (base64: string) => {
    if (!user) return;
    const assetId = `${selectedCourse.id}_${currentHole}`;
    try {
      await setDoc(doc(db, 'hole_assets', assetId), {
        imageData: base64,
        updatedAt: new Date().toISOString(),
        userId: user.uid,
        courseId: selectedCourse.id,
        holeNumber: currentHole
      });
      if (playPing) playPing(1200, 'sine', 0.1);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'hole_assets');
    }
  };

  const currentCustomImage = useMemo(() => {
    const assetId = `${selectedCourse.id}_${currentHole}`;
    return customHoleImages[assetId];
  }, [customHoleImages, selectedCourse.id, currentHole]);

  // GPS Tracking
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus('unavailable');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setGpsStatus('active');
      },
      (error) => {
        console.error("GPS Error:", error);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsStatus('denied');
        } else {
          setGpsStatus('unavailable');
        }
      },
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(customHoleImages));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `golf_tactical_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setShowSyncMenu(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
       try {
         const importedData = JSON.parse(event.target?.result as string);
         let count = 0;
         for (const [assetId, imageData] of Object.entries(importedData)) {
            const parts = assetId.split('_');
            const courseId = parts[0];
            const holeNum = parseInt(parts[1]);
            
            await setDoc(doc(db, 'hole_assets', assetId), {
                imageData,
                updatedAt: new Date().toISOString(),
                userId: user.uid,
                courseId: courseId,
                holeNumber: holeNum
            });
            count++;
         }
         alert(`${count} plans tactiques importés avec succès !`);
         setShowSyncMenu(false);
       } catch (err) {
         console.error(err);
         alert("Erreur lors de l'importation. Vérifiez le fichier.");
       }
    };
    reader.readAsText(file);
  };

  const simulateGPS = () => {
    const hole = selectedCourse.holes[currentHole - 1];
    if (!hole) return;
    setUserLocation({
      lat: hole.teeBox.lat + 0.0002, // Just a bit offset from Tee
      lng: hole.teeBox.lng + 0.0002
    });
    setGpsStatus('active');
    setShowSyncMenu(false);
    if (playPing) playPing(1200, 'sine', 0.1);
  };

  const requestSensorPermission = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          if (playPing) playPing(1000, 'sine', 0.1);
          setShowSyncMenu(false);
          // Restart orientation listener if needed (it will pick it up on next render)
        }
      } catch (error) {
        console.error("Sensor permission error:", error);
      }
    } else {
      // Not iOS or older device
      if (playPing) playPing(800, 'sine', 0.1);
      setShowSyncMenu(false);
    }
  };

  // Derived distance logic
  const distance = useMemo(() => {
    const courseHole = selectedCourse.holes[currentHole - 1];
    
    // If GPS is active and we have course data, use Haversine
    if (gpsStatus === 'active' && userLocation && courseHole) {
      const targetCoords = courseHole.green[activeCaddie.zone];
      const dist = getHaversineDistance(
        userLocation.lat, 
        userLocation.lng, 
        targetCoords.lat, 
        targetCoords.lng
      );
      return Math.round(dist);
    }

    // Fallback: Simulation logic
    const baseDist = courseHole?.distanceTee?.black || 340;
    let zoneOffset = 0;
    if (activeCaddie.zone === 'front') zoneOffset = -12;
    if (activeCaddie.zone === 'back') zoneOffset = +12;

    return Math.max(0, (baseDist + zoneOffset) - (scorecard[currentHole]?.strokes || 0) * 110);
  }, [scorecard, currentHole, selectedCourse, activeCaddie, userLocation, gpsStatus]);

  const currentHoleData = useMemo(() => selectedCourse.holes[currentHole - 1], [currentHole, selectedCourse]);

  const generateAdvice = useCallback(async () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    playWind();
    
    const hole = selectedCourse.holes[currentHole - 1];
    
    // Preparation of context for the AI
    const clubsContext = arsenal.map((c: any) => `${c.name} (${c.dist}m)`).join(', ');
    const formLabel = playerForm === 'cold' ? 'Froid' : playerForm === 'pur' ? 'Pur' : 'Forme';
    
    let message = "";
    try {
      const windInfo = `Vent: ${wind.speed}km/h ${wind.direction}`;
      message = await getTacticalAdvice(activeCaddie, hole, distance, wind, arsenal, playerForm, handicap);
    } catch (err) {
      console.error("Advice generation error:", err);
      message = `${activeCaddie.name} : "Liaison satellite instable. Joue ton coup le plus sûr. ${distance}m."`;
    }
    
    setAdvice(message);

    try {
        const audioData = await generateSpeech(message);
        if (audioData) {
            await playRawPcm(audioData);
        }
    } catch (err: any) {
        console.error("Speech failure:", err);
        setAdvice(`⚠️ ERREUR SYSTÈME: ${err.message || 'Échec de la liaison vocale'}. Vérifiez votre Clé API dans les secrets.`);
    } finally {
        setIsSpeaking(false);
    }
  }, [isSpeaking, playWind, selectedCourse, currentHole, arsenal, playerForm, wind, activeCaddie, distance, handicap, setAdvice]);

  // Ear Gesture Detection
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const beta = e.beta || 0; // -180 to 180 (front/back tilt)
      const gamma = e.gamma || 0; // -90 to 90 (left/right tilt)
      
      // Ear position: Tilt beta is high (> 75) and gamma (lateral) is low (< 35)
      // On some android devices, beta can be negative if flipped
      const isNearEar = Math.abs(beta) > 75 && Math.abs(gamma) < 35;
      
      if (isNearEar && !isEarPosition) {
        if (!isSpeaking) {
          if (window.navigator.vibrate) window.navigator.vibrate([40, 20, 40]);
          generateAdvice();
        }
      }
      setIsEarPosition(isNearEar);
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [isSpeaking, isEarPosition, generateAdvice]);

  useEffect(() => {
    if (!user) return;

    const fetchRounds = async () => {
      const path = 'rounds';
      try {
        const q = query(
          collection(db, path),
          where('userId', '==', user.uid),
          orderBy('date', 'desc'),
          limit(1)
        );
        const snapshot = await getDocs(q);
        setRecentRounds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
      } finally {
        setLoading(false);
      }
    };

    fetchRounds();
  }, [user]);

  const navigateHole = (direction: 'next' | 'prev') => {
    if (playPing) playPing(direction === 'next' ? 880 : 440, 'sine', 0.05);
    if (direction === 'next' && currentHole < 18) setCurrentHole(currentHole + 1);
    if (direction === 'prev' && currentHole > 1) setCurrentHole(currentHole - 1);
    
    // Refresh wind on hole change for tactical variance
    setWind({
      speed: Math.floor(Math.random() * 22) + 4,
      direction: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)]
    });
  };

  const windRotationMap: Record<string, number> = {
    'N': 0,
    'NE': 45,
    'E': 90,
    'SE': 135,
    'S': 180,
    'SW': 225,
    'W': 270,
    'NW': 315
  };

  const isOffCourse = useMemo(() => {
    if (!userLocation || !selectedCourse.holes[0]) return false;
    const hole1 = selectedCourse.holes[0];
    const dist = getHaversineDistance(userLocation.lat, userLocation.lng, hole1.teeBox.lat, hole1.teeBox.lng);
    return dist > 50000; // More than 50km away
  }, [userLocation, selectedCourse]);

  return (
    <div className="relative -mx-6 -mt-6 min-h-[calc(100vh-140px)] flex flex-col overflow-hidden bg-black text-white font-sans">
      {/* Background with Cinematic Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=2670&auto=format&fit=crop" 
          className="w-full h-full object-cover opacity-20"
          alt="Coursebg"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black/95" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #c9964a 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      </div>

      {/* Header V2 - TACTICAL AREA */}
      <div className="relative z-20 p-6 pt-12 flex flex-col gap-4 border-b border-red-600 bg-black/40 backdrop-blur-md">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-red-600 uppercase tracking-tighter">🚨 ONYX V2</h1>
            <div className="flex items-center gap-2">
              <span className="text-[#c9964a] text-[10px] font-black tracking-[0.5em] uppercase">SYSTÈME TACTIQUE ACTIF</span>
              <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border ${
                gpsStatus === 'active' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 
                gpsStatus === 'denied' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                gpsStatus === 'unavailable' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' :
                'bg-white/5 border-white/10 text-white/20'
              }`}>
                {gpsStatus === 'active' ? <Navigation size={8} fill="currentColor" className="rotate-45" /> : <X size={8} />}
                <span className="text-[7px] font-black uppercase">
                  {gpsStatus === 'active' ? 'GPS LIVE' : 
                   gpsStatus === 'denied' ? 'GPS BLOCK' : 
                   gpsStatus === 'unavailable' ? 'GPS ERROR' : 'GPS SEARCH'}
                </span>
              </div>
              {isOffCourse && (
                <div className="bg-orange-500/20 border border-orange-500/30 px-1.5 py-0.5 rounded text-[6px] font-black text-orange-500 uppercase">
                  Hors Parcours
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            {isEarPosition && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 mb-1"
              >
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">Liaison Ear Active</span>
              </motion.div>
            )}
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                if (playPing) playPing(1200, 'sine', 0.05);
                generateAdvice();
              }}
              disabled={isSpeaking}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
                isSpeaking ? 'bg-red-600 shadow-red-600/40 animate-pulse' : 'bg-[#c9964a] shadow-[#c9964a]/20'
              }`}
            >
              <Mic size={24} className={isSpeaking ? 'text-white' : 'text-black'} />
            </motion.button>
          </div>
        </div>

        {/* Golf Venue & Hole Navigation */}
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => setShowCourseSelector(!showCourseSelector)}
            className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-xl hover:bg-white/10 transition-colors group"
          >
            <MapPin size={16} className="text-[#c9964a]" />
            <div className="flex flex-col items-start text-left">
              <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Lieu Actuel</span>
              <span className="text-xs font-bold text-white group-hover:text-[#c9964a] transition-colors">{selectedCourse.name}</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
               <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{selectedCourse.subtitle}</span>
               <ChevronRight size={14} className="text-white/20" />
            </div>
          </button>

          <div className="flex items-center justify-between gap-2">
            <button 
              onClick={() => navigateHole('prev')}
              disabled={currentHole === 1}
              className={`w-10 h-10 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 ${currentHole === 1 ? 'opacity-20' : 'hover:bg-white/10'}`}
            >
              <ChevronLeft size={20} className="text-[#c9964a]" />
            </button>
            <div className="flex-1 flex items-center justify-center gap-4 bg-red-600/10 border border-red-600/30 py-2 rounded-lg relative group overflow-hidden">
               <button 
                onClick={() => {
                  const current = scorecard[currentHole] || { strokes: 0, par: currentHoleData.par };
                  setScorecard({ ...scorecard, [currentHole]: { ...current, strokes: (current.strokes || 0) + 1 } });
                  if (playPing) playPing(1000, 'sine', 0.1);
                }}
                className="absolute inset-0 z-10 active:bg-white/10 transition-colors"
               />
              <div className="text-[10px] font-black text-red-600 uppercase tracking-widest pointer-events-none">TROU</div>
              <div className="text-2xl font-black italic font-mono text-white leading-none pointer-events-none">{currentHole}</div>
              <div className="h-4 w-[1px] bg-red-600/30 pointer-events-none" />
              <div className="text-xl font-black italic font-mono text-[#c9964a] pointer-events-none">{scorecard[currentHole]?.strokes || 0}</div>
            </div>
            
            {/* WIND INDICATOR */}
            <div className="bg-emerald-600/10 border border-emerald-600/30 px-3 py-1 rounded-lg flex flex-col items-center justify-center min-w-[60px]">
               <div className="flex items-center gap-1.5">
                 <div 
                   style={{ transform: `rotate(${windRotationMap[wind.direction]}deg)` }}
                   className="transition-transform duration-500 ease-in-out text-emerald-500"
                 >
                   <Navigation size={10} fill="currentColor" />
                 </div>
                 <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">{wind.direction}</span>
               </div>
               <span className="text-sm font-black italic font-mono text-white leading-none mt-0.5">{wind.speed}</span>
            </div>

            <button 
              onClick={() => navigateHole('next')}
              disabled={currentHole === 18}
              className={`w-10 h-10 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 ${currentHole === 18 ? 'opacity-20' : 'hover:bg-white/10'}`}
            >
              <ChevronRight size={20} className="text-[#c9964a]" />
            </button>
          </div>
        </div>
      </div>

      {/* TACTICAL BLUEPRINT AREA */}
      <div className="relative z-10 px-6 pt-6">
        {currentHoleData && (
          <TacticalHoleView 
            hole={currentHoleData as any} 
            customImage={currentCustomImage}
            userLocation={userLocation}
          />
        )}
        
        {/* QUOTA WARNING */}
        {quotaExceeded && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 bg-orange-500/20 border border-orange-500/30 p-3 rounded-xl flex items-center gap-3"
          >
            <AlertCircle size={16} className="text-orange-500" />
            <div className="flex-1">
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest leading-tight">QUOTA FIRESTORE ATTEINT</p>
              <p className="text-[8px] text-white/40 uppercase tracking-widest mt-1">Les images tactiques personnalisées peuvent être indisponibles temporairement.</p>
            </div>
          </motion.div>
        )}

        {/* VAULT TACTIQUE SHORTCUT */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('profile')}
          className="w-full mt-6 bg-gradient-to-r from-red-600/20 to-black border border-red-600/30 p-5 rounded-2xl flex items-center justify-between group shadow-xl"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/20">
              <Shield size={24} />
            </div>
            <div className="text-left">
              <div className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] mb-1">ACCÈS SÉCURISÉ</div>
              <p className="text-sm font-black text-white uppercase italic leading-none">VAULT TACTIQUE ONYX</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-red-600 group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </div>

      {/* CLOUD SYNC BUTTON (Subtle) */}
      <div className="fixed bottom-6 right-6 z-50">
        <button 
          onClick={() => setShowSyncMenu(true)}
          className="bg-black/80 p-3 rounded-full border border-white/10 text-white/40 hover:text-[#c9964a] hover:border-[#c9964a]/30 transition-all backdrop-blur-md"
        >
          <Cloud size={20} />
        </button>
      </div>

      <AnimatePresence>
        {showSyncMenu && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
          >
            <div className="bg-[#1a1a1a] border border-[#c9964a]/30 rounded-[2rem] w-full max-w-sm p-8 relative">
              <button 
                onClick={() => setShowSyncMenu(false)}
                className="absolute top-6 right-6 text-white/40 hover:text-white"
              >
                <X size={24} />
              </button>

              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 bg-[#c9964a]/10 rounded-full flex items-center justify-center text-[#c9964a] mb-4">
                  <Cloud size={32} />
                </div>
                <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Synchronisation Cloud</h3>
                <p className="text-white/40 text-xs mt-2">Transférez vos plans tactiques entre vos différentes versions de l'application.</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={handleExport}
                  className="w-full flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5 hover:border-[#c9964a]/30 group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Download size={20} className="text-[#c9964a]" />
                    <span className="font-bold text-white uppercase tracking-widest text-[10px]">Exporter les plans</span>
                  </div>
                  <ChevronRight size={16} className="text-white/20 group-hover:text-[#c9964a]" />
                </button>

                <label className="w-full flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5 hover:border-[#c9964a]/30 group transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <UploadIcon size={20} className="text-[#c9964a]" />
                    <span className="font-bold text-white uppercase tracking-widest text-[10px]">Importer un fichier JSON</span>
                  </div>
                  <ChevronRight size={16} className="text-white/20 group-hover:text-[#c9964a]" />
                  <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                </label>

                <button 
                  onClick={() => { setShowSyncMenu(false); setActiveTab('profile'); }}
                  className="w-full flex items-center justify-between bg-[#c9964a]/10 p-4 rounded-2xl border border-[#c9964a]/20 hover:border-[#c9964a]/40 group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <ImageIcon size={20} className="text-[#c9964a]" />
                    <span className="font-bold text-white uppercase tracking-widest text-[10px]">Upload Photo Tactique</span>
                  </div>
                  <ChevronRight size={16} className="text-white/20 group-hover:text-[#c9964a]" />
                </button>

                <button 
                  onClick={simulateGPS}
                  className="w-full flex items-center justify-between bg-emerald-600/10 p-4 rounded-2xl border border-emerald-600/20 hover:border-emerald-600/40 group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <MapPin size={20} className="text-emerald-500" />
                    <span className="font-bold text-white uppercase tracking-widest text-[10px]">Simuler GPS (Test)</span>
                  </div>
                  <ChevronRight size={16} className="text-white/20 group-hover:text-emerald-500" />
                </button>

                <button 
                  onClick={() => { setShowSyncMenu(false); setShowRulesModal(true); }}
                  className="w-full flex items-center justify-between bg-blue-600/10 p-4 rounded-2xl border border-blue-600/20 hover:border-blue-600/40 group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen size={20} className="text-blue-500" />
                    <span className="font-bold text-white uppercase tracking-widest text-[10px]">Règles & Étiquette</span>
                  </div>
                  <ChevronRight size={16} className="text-white/20 group-hover:text-blue-500" />
                </button>

                <button 
                  onClick={requestSensorPermission}
                  className="w-full flex items-center justify-between bg-blue-600/10 p-4 rounded-2xl border border-blue-600/20 hover:border-blue-600/40 group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Brain size={20} className="text-blue-500" />
                    <span className="font-bold text-white uppercase tracking-widest text-[10px]">Liaison Tactique Ear (Activer)</span>
                  </div>
                  <ChevronRight size={16} className="text-white/20 group-hover:text-blue-500" />
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5">
                <p className="text-[9px] text-center text-white/20 uppercase tracking-[0.2em]">
                  Note: L'importation remplace les plans existants pour les mêmes numéros de trous.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <RulesModal isOpen={showRulesModal} onClose={() => setShowRulesModal(false)} />
 
      {/* Hero Data - Meters */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 py-4">
        {/* PLAYER FORM SELECTOR */}
        <div className="flex items-center gap-4 mb-6 bg-white/5 p-1 rounded-full border border-white/10">
          {[
            { id: 'cold', label: 'FROID', icon: '❄️', color: 'text-blue-400' },
            { id: 'forme', label: 'FORME', icon: '⚡', color: 'text-emerald-400' },
            { id: 'pur', label: 'PUR', icon: '💎', color: 'text-purple-400' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => {
                setPlayerForm(f.id as any);
                if (playPing) playPing(f.id === 'pure' ? 1200 : f.id === 'hot' ? 1000 : 800, 'sine', 0.1);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
                playerForm === f.id ? 'bg-white/10 shadow-lg' : 'opacity-30 hover:opacity-100'
              }`}
            >
              <span className="text-xs">{f.icon}</span>
              <span className={`text-[8px] font-black uppercase tracking-widest ${playerForm === f.id ? f.color : 'text-white'}`}>{f.label}</span>
            </button>
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            const current = scorecard[currentHole] || { strokes: 0, par: currentHoleData.par };
            setScorecard({ ...scorecard, [currentHole]: { ...current, strokes: (current.strokes || 0) + 1 } });
          }}
          className="flex flex-col items-center"
        >
          <motion.div 
            key={`${selectedCourse.id}-${currentHole}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[120px] font-black italic leading-none text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] font-mono"
          >
            {units === 'yards' ? Math.round(distance * 1.09361) : distance}
          </motion.div>
          <div className="text-[#c9964a] font-black tracking-[1em] text-xs uppercase -mt-2">{units === 'yards' ? 'YARDS' : 'METERS'}</div>
          <p className="text-[10px] text-white/20 mt-4 uppercase font-black tracking-widest">Toucher pour enregistrer un coup ({scorecard[currentHole]?.strokes || 0})</p>
        </motion.button>
      </div>

      {/* Selector Overlays */}
      <AnimatePresence>
        {showCourseSelector && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="fixed inset-0 z-[100] bg-black/95 p-6 flex flex-col pt-16"
          >
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-[#c9964a] font-black tracking-widest text-xs uppercase">SÉLECTEUR DE GOLF</h3>
               <button onClick={() => setShowCourseSelector(false)} className="text-white/40 text-[10px] font-bold border border-white/10 px-4 py-2 rounded-full uppercase tracking-widest">Fermer</button>
            </div>
            <div className="flex flex-col gap-4 overflow-y-auto pb-12">
              {COURSES.map(course => (
                <button 
                  key={course.id}
                  onClick={() => {
                    setSelectedCourse(course);
                    setShowCourseSelector(false);
                    if (playPing) playPing(660, 'sine', 0.1);
                  }}
                  className={`p-6 text-left rounded-3xl border transition-all ${selectedCourse.id === course.id ? 'border-[#c9964a] bg-[#c9964a]/10' : 'border-white/5 bg-white/5 hover:border-white/10'}`}
                >
                  <div className="font-black text-white text-lg uppercase mb-1 tracking-tighter">{course.name}</div>
                  <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{course.location}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Caddie Selector Overlay */}
      <AnimatePresence>
        {showCaddieSelector && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="fixed inset-0 z-[100] bg-black/95 p-6 flex flex-col pt-16"
          >
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-[#c9964a] font-black tracking-widest text-xs uppercase">UNITÉS DE CADDIE NEURAL</h3>
               <button onClick={() => setShowCaddieSelector(false)} className="text-white/40 text-[10px] font-bold border border-white/10 px-4 py-2 rounded-full uppercase tracking-widest">Fermer</button>
            </div>
            <div className="flex flex-col gap-4">
              {Object.values(CADDIES).map((c: any) => (
                <button 
                  key={c.id}
                  onClick={() => {
                    setActiveCaddie(c);
                    setShowCaddieSelector(false);
                    if (playPing) playPing(880, 'sine', 0.1);
                    setAdvice(`${c.name} activé. Zone préférée : ${c.zone.toUpperCase()}.`);
                  }}
                  className={`p-6 text-left rounded-3xl border transition-all flex items-center gap-4 ${activeCaddie.id === c.id ? 'border-[#c9964a] bg-[#c9964a]/10' : 'border-white/5 bg-white/5'}`}
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-black border border-white/10" style={{ color: c.color }}>
                    <Brain size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="font-black text-white text-lg uppercase tracking-tighter">{c.name}</div>
                    <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{c.title} — ZONE {c.zone.toUpperCase()}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Caddie Selection Trigger */}
      <div className="relative z-20 px-6 mb-24">
        <motion.button 
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCaddieSelector(true)}
          className="w-full bg-black/80 border border-red-600 p-6 rounded-[2.5rem] flex items-center gap-4 backdrop-blur-md text-left"
        >
          <div className="w-12 h-12 rounded-full bg-red-600/10 flex items-center justify-center border border-red-600/30">
            <Brain size={24} className="text-red-600" />
          </div>
          <div className="flex-1">
            <div className="text-[10px] font-black text-red-600 uppercase tracking-widest">CADDIE ACTIF : {activeCaddie.name}</div>
            <p className="text-sm font-bold italic text-white/80">"{activeCaddie.title}. Cliquez pour changer d'unité."</p>
          </div>
          <div className="bg-red-600/20 px-2 py-1 rounded text-[8px] font-black uppercase text-red-600 border border-red-600/30">
            LIVE
          </div>
        </motion.button>
      </div>

      {/* Tactical Box from Bible */}
      {advice && (
        <div className="fixed bottom-32 left-6 right-6 z-20">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass p-4 border-l-4 border-[#c9964a] shadow-2xl relative overflow-hidden"
          >
            <div className="flex items-center gap-2 text-[9px] font-mono text-[#c9964a] mb-2 border-b border-[#c9964a]/20 pb-1">
              <Trophy size={10} />
              <span className="tracking-[0.2em] font-black uppercase">COMMANDE TACTIQUE : ACTIVE</span>
            </div>
            <p className="text-[10px] items-start font-mono text-white/90 leading-tight italic">
              {advice}
            </p>
          </motion.div>
        </div>
      )}

      {/* Subtle overlay to fade bottom for TabBar */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none z-10" />
    </div>
  );
}
