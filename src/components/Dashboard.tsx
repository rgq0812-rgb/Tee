import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, where, orderBy, getDocs, limit, setDoc, doc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { useAuth } from '../services/AuthProvider';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, Trophy, ChevronLeft, ChevronRight, MapPin, Brain, Cloud, 
  Download, Upload as UploadIcon, X, Navigation, Shield, 
  AlertCircle, Image as ImageIcon, BookOpen, Camera, Sparkles 
} from 'lucide-react';
import { useAmbientSound } from '../hooks/use-ambient-sound';
import { COURSES, CADDIES } from '../constants';
import TacticalHoleView from './TacticalHoleView';
import { getHaversineDistance } from '../utils/geo';
import { generateSpeech, getTacticalAdvice } from '../services/geminiService';
import { playRawPcm } from '../lib/audioUtils';
import RulesModal from './RulesModal';
import LieScanner from './LieScanner';

export default function Dashboard({ 
  scorecard, setScorecard, 
  currentHole, setCurrentHole, 
  selectedCourse, setSelectedCourse, 
  advice, setAdvice, 
  arsenal,
  playerForm, setPlayerForm,
  handicap,
  setActiveTab,
  setShowLieScanner
}: any) {
  const { user } = useAuth();
  const { playWind, playPing } = useAmbientSound();
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
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('onyx_voice') === 'false');

  // Sync units and muted state
  useEffect(() => {
    const handleStorage = () => {
      const savedUnits = localStorage.getItem('onyx_units') || 'meters';
      setUnits(savedUnits);
      setIsMuted(localStorage.getItem('onyx_voice') === 'false');
    };
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(handleStorage, 2000);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);
  
  // Real-time listener for custom images
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'hole_assets'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const images: Record<string, string> = {};
      snapshot.forEach(doc => {
        images[doc.id] = doc.data().imageData;
      });
      setCustomHoleImages(images);
      setQuotaExceeded(false);
    }, (error) => {
      if (error.message.includes('quota')) setQuotaExceeded(true);
    });
    return () => unsub();
  }, [user]);

  // GPS Tracking
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus('unavailable');
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setGpsStatus('active');
      },
      (error) => setGpsStatus(error.code === 1 ? 'denied' : 'unavailable'),
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
         for (const [assetId, imageData] of Object.entries(importedData)) {
            await setDoc(doc(db, 'hole_assets', assetId), {
                imageData,
                updatedAt: new Date().toISOString(),
                userId: user.uid,
                courseId: assetId.split('_')[0],
                holeNumber: parseInt(assetId.split('_')[1])
            });
         }
         setShowSyncMenu(false);
       } catch (err) { console.error(err); }
    };
    reader.readAsText(file);
  };

  const distance = useMemo(() => {
    const courseHole = selectedCourse.holes[currentHole - 1];
    if (gpsStatus === 'active' && userLocation && courseHole) {
      const targetCoords = courseHole.green[activeCaddie.zone];
      return Math.round(getHaversineDistance(userLocation.lat, userLocation.lng, targetCoords.lat, targetCoords.lng));
    }
    const baseDist = courseHole?.distanceTee?.black || 340;
    return Math.max(0, baseDist - (scorecard[currentHole]?.strokes || 0) * 110);
  }, [scorecard, currentHole, selectedCourse, activeCaddie, userLocation, gpsStatus]);

  const currentHoleData = useMemo(() => selectedCourse.holes[currentHole - 1], [currentHole, selectedCourse]);

  const generateAdvice = useCallback(async () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    playWind();
    
    try {
      const message = await getTacticalAdvice(activeCaddie, currentHoleData, distance, wind, arsenal, playerForm, handicap);
      setAdvice(message);
      
      if (!isMuted) {
        const audioData = await generateSpeech(message);
        if (audioData) {
          const source = await playRawPcm(audioData);
          if (source) {
            source.onended = () => setIsSpeaking(false);
          } else {
            setIsSpeaking(false);
          }
        } else {
          setIsSpeaking(false);
        }
      } else {
        setIsSpeaking(false);
      }
    } catch (err) {
      console.error(err);
      setIsSpeaking(false);
    }
  }, [isSpeaking, playWind, currentHoleData, distance, wind, arsenal, playerForm, handicap, activeCaddie, setAdvice, isMuted]);

  // Ear Gesture
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (Math.abs(e.beta || 0) > 75 && Math.abs(e.gamma || 0) < 35 && !isEarPosition && !isSpeaking) {
        if (window.navigator.vibrate) window.navigator.vibrate([40, 20, 40]);
        generateAdvice();
      }
      setIsEarPosition(Math.abs(e.beta || 0) > 75 && Math.abs(e.gamma || 0) < 35);
    };
    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [isSpeaking, isEarPosition, generateAdvice]);

  const navigateHole = (direction: 'next' | 'prev') => {
    if (playPing) playPing(direction === 'next' ? 880 : 440, 'sine', 0.05);
    if (direction === 'next' && currentHole < 18) setCurrentHole(currentHole + 1);
    if (direction === 'prev' && currentHole > 1) setCurrentHole(currentHole - 1);
    setWind({
      speed: Math.floor(Math.random() * 22) + 4,
      direction: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)]
    });
  };

  const currentCustomImage = useMemo(() => customHoleImages[`${selectedCourse.id}_${currentHole}`], [customHoleImages, selectedCourse.id, currentHole]);

  return (
    <div className="relative -mx-6 -mt-6 min-h-[calc(100vh-140px)] flex flex-col overflow-hidden bg-black text-white font-sans">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=2670&auto=format&fit=crop" 
          className="w-full h-full object-cover opacity-20"
          alt="Coursebg"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black/95" />
      </div>

      <div className="relative z-20 p-6 pt-12 flex flex-col gap-4 border-b border-red-600 bg-black/40 backdrop-blur-md">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-red-600 uppercase tracking-tighter">🚨 ONYX V2</h1>
            <div className="flex items-center gap-2">
              <span className="text-[#c9964a] text-[10px] font-black tracking-[0.5em] uppercase">HUD TACTIQUE ACTIF</span>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${gpsStatus === 'active' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
                <span className="text-[7px] font-black uppercase text-white/40">{gpsStatus.toUpperCase()} GPS</span>
              </div>
            </div>
          </div>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={generateAdvice}
            disabled={isSpeaking}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${isSpeaking ? 'bg-red-600 animate-pulse' : 'bg-[#c9964a]'}`}
          >
            <Mic size={24} className={isSpeaking ? 'text-white' : 'text-black'} />
          </motion.button>
        </div>

          <div className="flex flex-col gap-3">
            <button onClick={() => setShowCourseSelector(true)} className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-xl hover:bg-white/10">
              <MapPin size={16} className="text-[#c9964a]" />
              <div className="flex flex-col items-start text-left">
                <span className="text-[8px] font-black text-white/40 uppercase">Course</span>
                <span className="text-xs font-bold text-white">{selectedCourse.name}</span>
              </div>
              <ChevronRight size={14} className="ml-auto text-white/20" />
            </button>

            <button 
              onClick={() => setShowLieScanner(true)}
              className="w-full h-24 bg-zinc-900/40 backdrop-blur-2xl border border-white/5 p-4 rounded-[2.5rem] hover:bg-[#c9964a]/5 hover:border-[#c9964a]/20 transition-all duration-500 active:scale-[0.97] group relative overflow-hidden flex items-center justify-between"
            >
              {/* Animated HUD corner accents */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-[#c9964a]/30" />
              <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-[#c9964a]/30" />
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-[#c9964a]/30" />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-[#c9964a]/30" />
              
              <div className="flex items-center gap-5 relative z-10 pl-2">
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(201,150,74,0.2)] transition-all duration-500">
                    <Camera size={26} className="text-[#c9964a]" />
                  </div>
                  <motion.div 
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]"
                  />
                </div>
                
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[7px] font-black uppercase text-[#c9964a] tracking-[0.4em] leading-none">Lie Analysis</span>
                  </div>
                  <span className="text-xl font-black italic text-white uppercase tracking-tight leading-none">Scanner</span>
                  <div className="flex items-center gap-1 mt-1 opacity-40 group-hover:opacity-100 transition-opacity">
                    <div className="w-1 h-3 bg-[#c9964a] rounded-full" />
                    <span className="text-[7px] font-bold text-white uppercase tracking-widest">Neural Mode Active</span>
                  </div>
                </div>
              </div>
              
              <div className="pr-4 flex items-center gap-3">
                <div className="flex flex-col items-end opacity-20 group-hover:opacity-100 transition-opacity">
                   <div className="text-[6px] font-mono text-white/40">HUD_v2</div>
                   <div className="text-[8px] font-black text-[#c9964a]">001</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#c9964a]/20 group-hover:border-[#c9964a]/40 transition-all">
                  <ChevronRight size={18} className="text-white/40 group-hover:text-[#c9964a] translate-x-0 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </button>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button onClick={() => navigateHole('prev')} disabled={currentHole === 1} className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 active:scale-95 disabled:opacity-20"><ChevronLeft size={20} /></button>
            
            <div className="flex gap-1.5 px-1">
              {Array.from({ length: 18 }, (_, i) => i + 1).map(h => (
                <button
                  key={`hole-nav-${h}`}
                  onClick={() => setCurrentHole(h)}
                  className={`flex-shrink-0 w-10 h-10 rounded-lg border font-mono font-black italic text-xs transition-all active:scale-90 flex flex-col items-center justify-center ${
                    currentHole === h 
                    ? 'bg-red-600 border-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' 
                    : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                  }`}
                >
                  <span className="text-[7px] leading-none mb-0.5 opacity-60">T</span>
                  {h}
                </button>
              ))}
            </div>

            <button onClick={() => navigateHole('next')} disabled={currentHole === 18} className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 active:scale-95 disabled:opacity-20"><ChevronRight size={20} /></button>
            
            <div className="flex-shrink-0 bg-emerald-600/10 border border-emerald-600/30 px-3 py-1 rounded-lg flex flex-col items-center min-w-[50px]">
               <div className="flex items-center gap-1">
                 <Navigation size={8} style={{ transform: `rotate(${wind.direction === 'N' ? 0 : 180}deg)` }} className="text-emerald-500" />
                 <span className="text-[8px] font-black text-emerald-500">{wind.direction}</span>
               </div>
               <span className="text-sm font-black italic font-mono">{wind.speed}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-6 pt-6 flex-1 flex flex-col">
        {currentHoleData && <TacticalHoleView hole={currentHoleData as any} customImage={currentCustomImage} userLocation={userLocation} />}
        
        <div className="flex-1 flex flex-col items-center justify-center py-8">
           <div className="flex gap-4 mb-4">
             {['cold', 'forme', 'pur'].map(f => (
               <button key={`form-btn-${f}`} onClick={() => setPlayerForm(f)} className={`text-[8px] font-black px-3 py-1 rounded-full border ${playerForm === f ? 'bg-[#c9964a] text-black border-[#c9964a]' : 'bg-white/5 text-white/40 border-white/10'}`}>{f.toUpperCase()}</button>
             ))}
           </div>
           <div className="text-[120px] font-black italic leading-none font-mono text-white drop-shadow-2xl">
             {units === 'yards' ? Math.round(distance * 1.09361) : distance}
           </div>
           <div className="text-[#c9964a] font-black tracking-[0.5em] text-[10px] uppercase">{units === 'yards' ? 'YARDS' : 'METERS'}</div>
        </div>

        <motion.button onClick={() => setShowCaddieSelector(true)} className="w-full bg-black/80 border border-red-600 p-5 rounded-[2rem] flex items-center gap-4 mb-6">
          <Brain size={24} className="text-red-600" />
          <div className="text-left">
            <div className="text-[10px] font-black text-red-600 uppercase">CADDIE ACTIF : {activeCaddie.name}</div>
            <p className="text-xs text-white/60 italic">"{activeCaddie.title}"</p>
          </div>
        </motion.button>
      </div>

      <div className="fixed bottom-6 right-6 z-50">
        <button onClick={() => setShowSyncMenu(true)} className="bg-black/80 p-3 rounded-full border border-white/10 text-white/40 hover:text-[#c9964a] transition-all"><Cloud size={20} /></button>
      </div>

      {advice && (
        <div className="fixed bottom-32 left-6 right-6 z-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-black/90 p-4 border-l-4 border-[#c9964a] shadow-2xl">
            <div className="text-[8px] font-black text-[#c9964a] uppercase mb-1">CONSEIL D'ADAM</div>
            <p className="text-[10px] font-mono text-white/90 italic">{advice}</p>
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {showSyncMenu && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-[#1a1a1a] border border-white/10 p-8 rounded-[2rem] w-full max-w-sm relative">
              <button onClick={() => setShowSyncMenu(false)} className="absolute top-6 right-6 text-white/40"><X size={24} /></button>
              <h3 className="text-xl font-black uppercase text-[#c9964a] mb-6">Gestion Tactique</h3>
              <div className="grid gap-3">
                <button onClick={handleExport} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10"><Download size={18} /><span className="text-[10px] font-black uppercase">Exporter Plans</span></button>
                <label className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 cursor-pointer"><UploadIcon size={18} /><span className="text-[10px] font-black uppercase">Importer Plans</span><input type="file" onChange={handleImport} className="hidden" /></label>
                <button onClick={() => { setShowRulesModal(true); setShowSyncMenu(false); }} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10"><BookOpen size={18} /><span className="text-[10px] font-black uppercase">Règles</span></button>
              </div>
            </div>
          </motion.div>
        )}

        {showCourseSelector && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} className="fixed inset-0 z-[200] bg-black p-6 pt-16">
            <button onClick={() => setShowCourseSelector(false)} className="text-white/40 uppercase text-[10px] border border-white/10 px-4 py-2 rounded-full mb-8">Fermer</button>
            <div className="grid gap-4">
              {COURSES.map(c => <button key={`course-sel-${c.id}`} onClick={() => { setSelectedCourse(c); setShowCourseSelector(false); }} className="p-6 text-left bg-white/5 rounded-3xl border border-white/10 font-black uppercase">{c.name}</button>)}
            </div>
          </motion.div>
        )}

        {showCaddieSelector && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} className="fixed inset-0 z-[200] bg-black p-6 pt-16">
             <button onClick={() => setShowCaddieSelector(false)} className="text-white/40 uppercase text-[10px] border border-white/10 px-4 py-2 rounded-full mb-8">Fermer</button>
             <div className="grid gap-4">
              {Object.values(CADDIES).map((c: any) => <button key={`caddie-sel-${c.id}`} onClick={() => { setActiveCaddie(c); setShowCaddieSelector(false); }} className="p-6 text-left bg-white/5 rounded-3xl border border-white/10 flex items-center gap-4"><Brain size={20} /><div className="font-black uppercase">{c.name}</div></button>)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <RulesModal isOpen={showRulesModal} onClose={() => setShowRulesModal(false)} />
    </div>
  );
}
