import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { collection, query, where, orderBy, getDocs, limit, setDoc, doc, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { useAuth } from '../services/AuthProvider';
import { useChat } from '../services/ChatContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, Trophy, ChevronLeft, ChevronRight, MapPin, Brain, Cloud, 
  Download, Upload as UploadIcon, X, Navigation, Shield, 
  AlertCircle, Image as ImageIcon, BookOpen, Camera, Sparkles,
  Plus, Minus, Check, Info, Zap 
} from 'lucide-react';
import { useAmbientSound } from '../hooks/use-ambient-sound';
import { COURSES, CADDIES } from '../constants';
import TacticalHoleView from './TacticalHoleView';
import { getHaversineDistance } from '../utils/geo';
import { generateSpeech, getTacticalAdvice, speakWithBrowser } from '../services/geminiService';
import { playRawPcm } from '../lib/audioUtils';
import RulesModal from '../services/RulesModal';
import LieScanner from './LieScanner';
import { GameMode } from './use-score';

import { useHoleAssets } from '../hooks/useHoleAssets';
import { useVoiceInput } from '../hooks/useVoiceInput';
import AudioVisualizer from './AudioVisualizer';

export default function Dashboard({ 
  scorecard, setScorecard, 
  currentHole, setCurrentHole, 
  selectedCourse, setSelectedCourse, 
  advice, setAdvice, 
  arsenal, setArsenal,
  selectedMode, setSelectedMode,
  playerForm, setPlayerForm,
  handicap,
  onUpdateScore,
  setActiveTab,
  setShowLieScanner,
  activeCaddie,
  setActiveCaddie,
  setMissionStarted,
  setAppPath,
  displayMode,
  selectedTee
}: any) {
  const { user } = useAuth();
  const isSolar = displayMode === 'solar';
  const { assets, quotaExceeded: globalQuotaExceeded } = useHoleAssets();
  const { playWind, playPing } = useAmbientSound();
  const [showCourseSelector, setShowCourseSelector] = useState(false);
  const [showSyncMenu, setShowSyncMenu] = useState(false);
  const [showCaddieSelector, setShowCaddieSelector] = useState(false);
  const [showArsenalMenu, setShowArsenalMenu] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const { messages } = useChat();

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastSpeechData, setLastSpeechData] = useState<any>(null);
  const welcomePlayedRef = React.useRef(false);

  const customHoleImages = useMemo(() => {
    const images: Record<string, string> = {};
    // assets is already filtered by userId and sorted newest-first in assetService
    assets.forEach(a => {
      const key = `${a.courseId}_${a.holeNumber}`;
      if (!images[key]) {
        images[key] = a.imageData;
      }
    });
    return images;
  }, [assets]);

  const [wind, setWind] = useState({ speed: Math.floor(Math.random() * 25) + 5, direction: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)] });
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'searching' | 'active' | 'denied' | 'unavailable'>('searching');
  const [isEarPosition, setIsEarPosition] = useState(false);
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
    const interval = setInterval(() => {
       const savedUnits = localStorage.getItem('onyx_units') || 'meters';
       const savedMuted = localStorage.getItem('onyx_voice') === 'false';
       setUnits(prev => savedUnits !== prev ? savedUnits : prev);
       setIsMuted(prev => savedMuted !== prev ? savedMuted : prev);
    }, 2000);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

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
            const path = `hole_assets/${assetId}`;
            try {
              await setDoc(doc(db, 'hole_assets', assetId), {
                  imageData,
                  updatedAt: new Date().toISOString(),
                  userId: user.uid,
                  courseId: assetId.split('_')[0],
                  holeNumber: parseInt(assetId.split('_')[1])
              });
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, path);
            }
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
    const baseDist = (courseHole?.distanceTee as any)?.[selectedTee] || courseHole?.distanceTee?.white || 340;
    return Math.max(0, baseDist - (scorecard[currentHole]?.strokes || 0) * 110);
  }, [scorecard, currentHole, selectedCourse, activeCaddie, userLocation, gpsStatus, selectedTee]);

  const currentHoleData = useMemo(() => selectedCourse.holes[currentHole - 1], [currentHole, selectedCourse]);

  const [tacticalHistory, setTacticalHistory] = useState<any[]>([]);
  const [currentProfile, setCurrentProfile] = useState<any>(null);

  // Fetch current course tactical profile
  useEffect(() => {
    if (!user || !selectedCourse) return;
    const profileId = `${user.uid}_${selectedCourse.name.replace(/\s+/g, '_')}`;
    const unsubscribe = onSnapshot(doc(db, 'course_tactical_profiles', profileId), (snap) => {
      if (snap.exists()) {
        setCurrentProfile(snap.data());
      } else {
        setCurrentProfile(null);
      }
    }, (error) => {
       console.error("Error fetching course profile:", error);
    });
    return () => unsubscribe();
  }, [user, selectedCourse]);

  // Fetch tactical history for context
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'tactical_advice'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTacticalHistory(snapshot.docs.map(doc => doc.data()));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tactical_advice');
    });
    return () => unsubscribe();
  }, [user]);

  const navigateHole = useCallback((direction: 'next' | 'prev') => {
    if (playPing) playPing(direction === 'next' ? 880 : 440, 'sine', 0.05);
    if (direction === 'next' && currentHole < 18) {
      setCurrentHole(currentHole + 1);
    }
    if (direction === 'prev' && currentHole > 1) {
      setCurrentHole(currentHole - 1);
    }
    setWind({
      speed: Math.floor(Math.random() * 22) + 4,
      direction: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)]
    });
  }, [currentHole, setCurrentHole, playPing]);

  const repeatLastAdvice = useCallback(async () => {
    if (isSpeaking || !lastSpeechData) return;
    setIsSpeaking(true);
    
    try {
      const isMutedLocal = localStorage.getItem('onyx_voice') === 'false';
      if (!isMutedLocal) {
        if (typeof lastSpeechData === 'object' && lastSpeechData.fallback) {
          speakWithBrowser(lastSpeechData.text, () => setIsSpeaking(false));
        } else if (typeof lastSpeechData === 'string') {
          const source = await playRawPcm(lastSpeechData);
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
      console.error("Repeat failed", err);
      setIsSpeaking(false);
    }
  }, [isSpeaking, lastSpeechData]);

  const generateAdvice = useCallback(async (textOverride?: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    playWind();
    
    try {
      // Pass tee color and specific feedback in the override
      const feedbackTag = textOverride?.toLowerCase().includes('parfait') ? ' [FEEDBACK:PARFAIT]' : 
                         textOverride?.toLowerCase().includes('raté') ? ' [FEEDBACK:RATÉ]' : '';
      const systemContext = `TEE_COLOR:${selectedTee} ${textOverride || ''}${feedbackTag}`;
      
      const message = await getTacticalAdvice(
        activeCaddie, 
        selectedCourse.holes[currentHole - 1], 
        distance, 
        wind, 
        arsenal, 
        playerForm, 
        handicap,
        { 
          scorecard, 
          history: tacticalHistory,
          activeMode: selectedMode === GameMode.STROKE ? 'PARCOURS' : 'STRATÉGIE',
          lastAdvice: systemContext,
          historicalProfile: currentProfile
        }
      );
      setAdvice(message);
      
      // Save to Firestore history
      if (user) {
        try {
          await addDoc(collection(db, 'tactical_advice'), {
            userId: user.uid,
            caddieName: activeCaddie.name,
            holeNumber: currentHole,
            courseName: selectedCourse.name,
            advice: message,
            createdAt: serverTimestamp()
          });
        } catch (e) {
          handleFirestoreError(e, OperationType.CREATE, 'tactical_advice');
        }
      }
      
      const isMutedLocal = localStorage.getItem('onyx_voice') === 'false';
      if (!isMutedLocal) {
        const result = await generateSpeech(message, activeCaddie);
        setLastSpeechData(result);
        if (typeof result === 'object' && result.fallback) {
          speakWithBrowser(result.text, () => setIsSpeaking(false));
        } else if (typeof result === 'string') {
          const source = await playRawPcm(result);
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
  }, [isSpeaking, playWind, currentHole, selectedCourse, distance, wind, arsenal, playerForm, handicap, activeCaddie, setAdvice, tacticalHistory, selectedMode, scorecard, user]);

  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Voice Command Handler
  const { isListening, startListening, stopListening, error: voiceError } = useVoiceInput((text, isFinal) => {
    setLastTranscript(text);

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    const processCommand = (finalText: string) => {
      const transcript = finalText.toLowerCase();
      console.log("[ONYX] Commande vocale traitée:", transcript);
      
      if (transcript.includes('suivant') || transcript.includes('prochain')) {
        if (currentHole < 18) {
          navigateHole('next');
          generateAdvice("Passage au trou suivant. Analyse la ligne de jeu immédiatement.");
        }
      } else if (transcript.includes('paysage') || transcript.includes('alentour') || transcript.includes('regarde')) {
        generateAdvice("Décris-moi le paysage, la lumière et les dangers avec ton œil de pro complicit.");
      } else if (transcript.includes('anecdote') || transcript.includes('histoire') || transcript.includes('raconte')) {
        generateAdvice("Raconte-moi une anecdote historique sur le golf ou ce parcours pour détendre l'atmosphère.");
      } else if (transcript.includes('répète') || transcript.includes('encore') || transcript.includes('quoi')) {
        repeatLastAdvice();
      } else if (transcript.includes('parfait') || transcript.includes('génial') || transcript.includes('top')) {
        generateAdvice("Le dernier coup était parfait ! Rebondis sur ma réussite.");
      } else if (transcript.includes('raté') || transcript.includes('nul') || transcript.includes('merde')) {
        generateAdvice("J'ai raté mon coup. Sois mon mentor et analyse l'erreur possible.");
      } else if (transcript.includes('score') || transcript.includes('combien')) {
        generateAdvice("Fais un point sur mon score actuel et donne-moi ton ressenti de mentor.");
      } else {
        // Enregistrement rapide du score via mot-clé
        const words = transcript.split(' ');
        const scoreKeywords: Record<string, number> = {
          'albatros': -3, 'eagle': -2, 'birdie': -1, 'par': 0, 'bogey': 1, 'double': 2, 'triple': 3, 'quadruple': 4
        };
        
        let foundScore = null;
        for (const [kw, offset] of Object.entries(scoreKeywords)) {
          if (transcript.includes(kw)) {
            const holePar = selectedCourse.holes[currentHole - 1]?.par || 4;
            foundScore = holePar + offset;
            break;
          }
        }

        // Détection de score numérique type "score de 5" ou "5 coups"
        if (foundScore === null) {
          const scoreMatch = transcript.match(/(?:score de|noter|marque|fait)\s*(\d+)/i) || transcript.match(/(\d+)\s*(?:coups|frappes)/i);
          if (scoreMatch) {
            foundScore = parseInt(scoreMatch[1]);
          }
        }
        
        if (foundScore !== null && onUpdateScore) {
          onUpdateScore(currentHole, foundScore, 2); // 2 putts d'office comme demandé
          if (currentHole === 9) {
            generateAdvice("J'ai fini le trou 9. Fais-moi mon briefing de mi-parcours automatique maintenant avec ton analyse mentor.");
          } else {
            generateAdvice(`Entendu. Score enregistré sur le ${currentHole}. 2 putts d'office. On passe au suivant.`);
          }
        } else if (transcript.trim().length > 3) {
          generateAdvice(transcript);
        }
      }
      
      stopListening();
    };

    if (text.trim().length > 3) {
      silenceTimerRef.current = setTimeout(() => {
        processCommand(text);
      }, 2500); 
    }
  });

  const [lastTranscript, setLastTranscript] = useState("");
  useEffect(() => {
    if (isListening) {
      setLastTranscript("");
    }
  }, [isListening]);

  const handleMicTrigger = () => {
    if (isSpeaking) {
      // If Adam is talking, we can't listen or we stop him?
      // For now, ignore if speaking to avoid feedback loops
      return;
    }
    
    if (isListening) {
      stopListening();
    } else {
      if (playPing) playPing(1200, 'sine', 0.05);
      // Increased sensitivity/timeout for golf context
      startListening(false, 45000); 
    }
  };

  // Ear Gesture & Media Key Tap
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      // Beta > 75 is roughly phone vertical (near ear)
      const inPosition = Math.abs(e.beta || 0) > 75 && Math.abs(e.gamma || 0) < 35;
      
      if (inPosition && !isEarPosition && !isSpeaking && !isListening) {
        if (window.navigator.vibrate) window.navigator.vibrate([40, 20, 40]);
        handleMicTrigger();
      }
      setIsEarPosition(inPosition);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Many Bluetooth earpieces send media keys when "tapped"
      const mediaKeys = ['MediaPlayPause', 'MediaTrackNext', 'MediaTrackPrevious', 'AudioVolumeUp', 'AudioVolumeDown'];
      if (mediaKeys.includes(e.key) || [176, 177, 179].includes(e.keyCode)) {
        e.preventDefault();
        if (!isSpeaking) {
          generateAdvice();
        }
      }
    };

    const requestPermission = async () => {
      // @ts-ignore - iOS specific permission request
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
          // @ts-ignore
          const response = await DeviceOrientationEvent.requestPermission();
          if (response === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        } catch (e) {
          console.error("Orientation permission denied:", e);
        }
      } else {
        window.addEventListener('deviceorientation', handleOrientation);
      }
    };

    requestPermission();
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSpeaking, isEarPosition, generateAdvice]);

  // Handle audio unlocking and welcome message
  useEffect(() => {
    const unlockAudio = async () => {
      if (welcomePlayedRef.current) return;
      welcomePlayedRef.current = true;

      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);

      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        ctx.resume();
      }

      // Voice confirmation of connection
      try {
        const welcomeResult = await generateSpeech("Connecté");
        if (typeof welcomeResult === 'object' && welcomeResult.fallback) {
          speakWithBrowser(welcomeResult.text);
        } else if (typeof welcomeResult === 'string') {
          await playRawPcm(welcomeResult);
        }
      } catch (e) {
        console.error("Welcome speech failed", e);
      }
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // Auto-clear advice after 10 seconds
  useEffect(() => {
    if (advice) {
      const timer = setTimeout(() => {
        setAdvice(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [advice, setAdvice]);

  const currentCustomImage = useMemo(() => customHoleImages[`${selectedCourse.id}_${currentHole}`], [customHoleImages, selectedCourse.id, currentHole]);

  return (
    <div className={`relative -mx-6 -mt-6 min-h-[calc(100vh-140px)] flex flex-col overflow-hidden ${isSolar ? 'bg-white text-zinc-950 font-black' : 'bg-black text-white'} font-sans transition-colors duration-500`}>
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=2670&auto=format&fit=crop" 
          className={`w-full h-full object-cover ${isSolar ? 'opacity-5 grayscale contrast-150' : 'opacity-20'}`}
          alt="Coursebg"
        />
        <div className={`absolute inset-0 ${isSolar ? 'bg-white/98' : 'bg-gradient-to-b from-black via-black/80 to-black/95'}`} />
      </div>

      {globalQuotaExceeded && (
        <div className="relative z-[100] bg-red-600/20 border-b border-red-600/50 p-2 text-center backdrop-blur-md">
          <p className="text-[8px] font-black uppercase text-red-500 flex items-center justify-center gap-2">
            <AlertCircle size={10} /> Quota Firestore Atteint - Mode Dégradé
          </p>
        </div>
      )}

      <div className={`relative z-20 p-6 pt-12 flex flex-col gap-4 border-b ${isSolar ? 'border-red-600 bg-white' : 'border-red-600 bg-black/90 backdrop-blur-xl'} transition-all`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            {user && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('profile')}
                className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all ${isSolar ? 'bg-zinc-50 border-zinc-950/10' : 'bg-white/5 border-white/10'}`}
                title="Vault Tactique"
              >
                <ImageIcon size={22} className={isSolar ? 'text-zinc-950' : 'text-[#c9964a]'} />
              </motion.button>
            )}
            {!user ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={async () => {
                   try {
                     const { signInWithGoogle } = await import('../services/firebase');
                     await signInWithGoogle();
                   } catch (e: any) {
                     alert(e.message || "Échec Google Login");
                   }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 bg-white/5 text-white text-[10px] font-black uppercase tracking-widest`}
              >
                <img src="https://www.google.com/favicon.ico" className="w-3 h-3 grayscale opacity-80" alt="G" />
                Login
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCaddieSelector(true)}
                className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all ${
                  isSpeaking 
                    ? (isSolar ? 'bg-red-600 border-red-600 shadow-xl' : 'bg-red-600 border-red-600 animate-pulse') 
                    : (isSolar ? 'bg-zinc-50 border-zinc-950/10' : 'bg-white/5 border-white/10')
                }`}
              >
                <Brain size={24} className={isSpeaking ? 'text-white' : (isSolar ? 'text-zinc-950 font-black' : '#c9964a')} />
              </motion.button>
            )}
            <div>
              <h1 className={`text-sm font-black uppercase tracking-tighter leading-tight flex items-center gap-1.5 ${isSolar ? 'text-zinc-950' : 'text-white'}`}>
                {activeCaddie.name} <span className="text-red-600 italic">ONYX</span>
              </h1>
              <div className="flex items-center gap-2">
                <div className={`w-1 h-1 rounded-full ${gpsStatus === 'active' ? 'bg-emerald-600' : 'bg-red-600 animate-pulse'}`} />
                <span className={`text-[7px] font-black uppercase tracking-widest ${isSolar ? 'text-zinc-950 font-black' : 'text-white/40'}`}>{activeCaddie.title}</span>
              </div>
            </div>
          </div>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={handleMicTrigger}
            disabled={isSpeaking}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${isListening ? 'bg-red-600 scale-110 shadow-red-600/50' : (isSolar ? 'bg-zinc-950' : 'bg-[#c9964a]')}`}
          >
            <Mic size={20} className={(isListening || isSpeaking) ? 'text-white animate-pulse' : (isSolar ? 'text-white' : 'text-black')} />
          </motion.button>
        </div>
        
        {/* Real-time Voice Feedback Overlay */}
        <AnimatePresence>
          {(isListening || voiceError || (lastTranscript && !lastSpeechData)) && (
            <motion.div 
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0 }}
              className="absolute bottom-4 left-4 right-4 z-50 origin-bottom"
            >
              <div className={`relative w-full rounded-[2rem] overflow-hidden border shadow-2xl ${isSolar ? 'bg-white border-zinc-950' : 'bg-zinc-900/95 border-[#c9964a]/30'}`}>
                <div className="h-16 w-full opacity-30 absolute inset-0 pointer-events-none">
                  <AudioVisualizer isActive={isListening} isSolar={isSolar} />
                </div>
                
                <div className="relative p-5 flex flex-col items-center justify-center text-center gap-1">
                  {voiceError ? (
                    <>
                      <div className="text-red-500 text-[10px] uppercase font-black tracking-widest">{voiceError}</div>
                      <button onClick={() => stopListening()} className="text-[8px] font-bold opacity-30 underline mt-1">FERMER</button>
                    </>
                  ) : isListening ? (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                         <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                         <span className={`text-[9px] font-black uppercase tracking-[0.3em] ${isSolar ? 'text-black' : 'text-[#c9964a]'}`}>
                           {lastTranscript ? "Saisie en cours..." : "Adam est à l'écoute..."}
                         </span>
                      </div>
                      <div className={`text-sm font-bold max-w-[90%] break-words ${isSolar ? 'text-zinc-800' : 'text-white'}`}>
                        {lastTranscript ? `"${lastTranscript}"` : "Dites quelque chose..."}
                      </div>
                    </>
                  ) : lastTranscript && (
                    <div className="flex flex-col items-center gap-1">
                       <span className="text-[8px] font-black opacity-20 uppercase tracking-[0.5em]">Commande traitée</span>
                       <div className="text-[10px] font-medium italic opacity-60">"{lastTranscript}"</div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

          <div className="flex flex-col gap-3">
            <button onClick={() => setShowCourseSelector(true)} className={`flex items-center gap-3 p-3 rounded-xl hover:opacity-80 shadow-md transition-all border-2 ${isSolar ? 'bg-white border-zinc-950' : 'bg-white/10 border-white/20'}`}>
              <MapPin size={16} className={isSolar ? 'text-zinc-950' : 'text-[#c9964a]'} />
              <div className="flex flex-col items-start text-left">
                <span className={`text-[10px] font-black uppercase ${isSolar ? 'text-zinc-400 font-black' : 'text-white/50'}`}>Course</span>
                <span className={`text-sm font-black italic uppercase ${isSolar ? 'text-zinc-950' : 'text-white'}`}>{selectedCourse.name}</span>
              </div>
              <ChevronRight size={14} className={`ml-auto ${isSolar ? 'text-zinc-950' : 'text-white/20'}`} />
            </button>

            <button 
              onClick={() => setShowLieScanner(true)}
              className={`w-full h-24 p-4 rounded-[2.5rem] transition-all duration-500 active:scale-[0.97] group relative overflow-hidden flex items-center justify-between shadow-2xl border-2 ${isSolar ? 'bg-white border-zinc-900 border-2' : 'bg-zinc-900 border-white/20'}`}
            >
              {/* Animated HUD corner accents */}
              <div className={`absolute top-4 left-4 w-4 h-4 border-t border-l ${isSolar ? 'border-black' : 'border-[#c9964a]/30'}`} />
              <div className={`absolute top-4 right-4 w-4 h-4 border-t border-r ${isSolar ? 'border-black' : 'border-[#c9964a]/30'}`} />
              <div className={`absolute bottom-4 left-4 w-4 h-4 border-b border-l ${isSolar ? 'border-black' : 'border-[#c9964a]/30'}`} />
              <div className={`absolute bottom-4 right-4 w-4 h-4 border-b border-r ${isSolar ? 'border-black' : 'border-[#c9964a]/30'}`} />
              
              <div className="flex items-center gap-5 relative z-10 pl-2">
                <div className="relative">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 ${isSolar ? 'bg-zinc-100 border-black' : 'bg-gradient-to-br from-white/10 to-white/5 border-white/10'}`}>
                    <Camera size={26} className={isSolar ? 'text-black' : 'text-[#c9964a]'} />
                  </div>
                  <motion.div 
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]"
                  />
                </div>
                
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[7px] font-black uppercase tracking-[0.4em] leading-none ${isSolar ? 'text-black' : 'text-[#c9964a]'}`}>Scanner de Terrain</span>
                  </div>
                  <span className={`text-xl font-black italic uppercase tracking-tight leading-none ${isSolar ? 'text-black' : 'text-white'}`}>Scanner</span>
                  <div className={`flex items-center gap-1 mt-1 transition-opacity ${isSolar ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'}`}>
                    <div className={`w-1 h-3 rounded-full ${isSolar ? 'bg-red-600' : 'bg-[#c9964a]'}`} />
                    <span className={`text-[7px] font-bold uppercase tracking-widest ${isSolar ? 'text-black' : 'text-white'}`}>Analyse Photo Active</span>
                  </div>
                </div>
              </div>
              
              <div className="pr-4 flex items-center gap-3">
                <div className={`flex flex-col items-end transition-opacity ${isSolar ? 'opacity-100' : 'opacity-20 group-hover:opacity-100'}`}>
                   <div className={`text-[6px] font-mono ${isSolar ? 'text-zinc-500' : 'text-white/40'}`}>HUD_v2</div>
                   <div className={`text-[8px] font-black ${isSolar ? 'text-red-600' : 'text-[#c9964a]'}`}>001</div>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isSolar ? 'bg-black text-white' : 'bg-white/5 border border-white/10 group-hover:bg-[#c9964a]/20 group-hover:border-[#c9964a]/40'}`}>
                  <ChevronRight size={18} className={`${isSolar ? 'text-white' : 'text-white/40 group-hover:text-[#c9964a]'} translate-x-0 group-hover:translate-x-0.5 transition-all`} />
                </div>
              </div>
            </button>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button onClick={() => navigateHole('prev')} disabled={currentHole === 1} className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border active:scale-95 disabled:opacity-20 shadow-md ${isSolar ? 'bg-white border-zinc-300 text-black' : 'bg-white/15 border border-white/30 text-white'}`}><ChevronLeft size={20} /></button>
            
            <div className="flex gap-1.5 px-1">
              {Array.from({ length: 18 }, (_, i) => i + 1).map(h => (
                <button
                  key={`hole-nav-${h}`}
                  onClick={() => {
                    setCurrentHole(h);
                  }}
                  className={`flex-shrink-0 w-10 h-10 rounded-lg border font-mono font-black italic text-xs transition-all active:scale-90 flex flex-col items-center justify-center ${
                    currentHole === h 
                    ? `bg-red-600 border-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,${isSolar ? '0.3' : '0.7'})]` 
                    : (isSolar ? 'bg-white border-zinc-200 text-black hover:border-black shadow-sm' : 'bg-white/15 border border-white/30 text-white hover:border-[#c9964a]/60 shadow-md')
                  }`}
                >
                  <span className={`text-[7px] leading-none mb-0.5 ${isSolar ? 'opacity-40' : 'opacity-60'}`}>T</span>
                  {h}
                </button>
              ))}
            </div>

            <button onClick={() => navigateHole('next')} disabled={currentHole === 18} className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border active:scale-95 disabled:opacity-20 shadow-md ${isSolar ? 'bg-white border-zinc-300 text-black' : 'bg-white/15 border-white/30 text-white'}`}><ChevronRight size={20} /></button>
            
            <div className={`flex-shrink-0 border px-3 py-1 rounded-lg flex flex-col items-center min-w-[50px] shadow-sm ${isSolar ? 'bg-green-50 border-green-200' : 'bg-emerald-600/20 border-emerald-600/50'}`}>
               <div className="flex items-center gap-1">
                 <Navigation size={8} style={{ transform: `rotate(${wind.direction === 'N' ? 0 : 180}deg)` }} className="text-emerald-600" />
                 <span className={`text-[8px] font-black ${isSolar ? 'text-emerald-700' : 'text-emerald-500'}`}>{wind.direction}</span>
               </div>
               <span className={`text-sm font-black italic font-mono ${isSolar ? 'text-black' : 'text-white'}`}>{wind.speed}</span>
            </div>
          </div>
        </div>
      </div>

      <div 
        className="relative z-10 px-6 pt-6 flex-1 flex flex-col transition-transform"
      >
        {currentHoleData && (
          <TacticalHoleView 
            hole={currentHoleData as any} 
            customImage={currentCustomImage} 
            userLocation={userLocation} 
            selectedTee={selectedTee}
          />
        )}
        
        <div className="flex-1 flex flex-col items-center justify-center py-8" onClick={() => setActiveTab('scorecard')}>
            <div className="flex gap-4 mb-4" onClick={(e) => e.stopPropagation()}>
              {['cold', 'forme', 'pur'].map(f => (
                <button key={`dash-form-btn-${f}`} onClick={() => setPlayerForm(f)} className={`text-[10px] font-black px-4 py-1.5 rounded-full border-2 transition-all ${playerForm === f ? (isSolar ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-[#c9964a] text-black border-[#c9964a]') : (isSolar ? 'bg-white text-zinc-950 border-zinc-200' : 'bg-white/10 text-white/70 border-white/30 backdrop-blur-md')}`}>{f.toUpperCase()}</button>
              ))}
            </div>
           <div className={`text-[120px] font-black italic leading-none font-mono drop-shadow-2xl ${isSolar ? 'text-zinc-950' : 'text-white'}`}>
             {units === 'yards' ? Math.round(distance * 1.09361) : distance}
           </div>
           <div className={`font-black tracking-[0.5em] text-[10px] uppercase ${isSolar ? 'text-zinc-950' : 'text-[#c9964a]'}`}>{units === 'yards' ? 'YARDS' : 'METERS'}</div>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-50">
        <button onClick={() => setShowSyncMenu(true)} className="bg-black/80 p-3 rounded-full border border-white/10 text-white/40 hover:text-[#c9964a] transition-all"><Cloud size={20} /></button>
      </div>

      <AnimatePresence>
        {advice && (
          <div className="fixed bottom-32 left-6 right-6 z-[60]">
            <motion.div 
              key={`advice-box-v5-${advice.substring(0, 50)}`}
              initial={{ opacity: 0, y: 20, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className={`${isSolar ? 'bg-white border-zinc-900 border-2 shadow-2xl' : 'bg-black/95 border-[#c9964a]/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)]'} p-5 rounded-3xl backdrop-blur-xl relative overflow-hidden`}
            >
              <div className={`absolute top-0 left-0 w-full h-[2px] ${isSolar ? 'bg-black' : 'bg-gradient-to-r from-transparent via-[#c9964a] to-transparent opacity-50'}`} />
              <div className="flex items-start gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isSolar ? 'bg-black text-white' : 'bg-[#c9964a]/20 border border-[#c9964a]/40 text-[#c9964a]'}`}>
                  <Brain size={16} />
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-[8px] font-black uppercase tracking-widest ${isSolar ? 'text-black' : 'text-[#c9964a]'}`}>CONSEIL DU CADDIE</span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); repeatLastAdvice(); }} 
                          className={`p-1 rounded-full ${isSolar ? 'hover:bg-zinc-100 text-zinc-950' : 'hover:bg-white/10 text-white/40'}`}
                          title="Répéter le conseil"
                        >
                          <Zap size={10} className={isSpeaking ? 'animate-pulse' : ''} />
                        </button>
                        <button onClick={() => setAdvice(null)} className={isSolar ? 'text-zinc-400' : 'text-white/20 hover:text-white'}><X size={12} /></button>
                      </div>
                    </div>
                  {(() => {
                    const cleanAdvice = advice.includes(':') ? advice.split(':').slice(1).join(':').trim() : advice.trim();
                    return cleanAdvice.length > 0 ? (
                      <p className={`text-[11px] font-bold leading-relaxed italic ${isSolar ? 'text-black' : 'text-white/90'}`}>
                        "{cleanAdvice}"
                      </p>
                    ) : null;
                  })()}
                </div>
              </div>
              
              {/* Progress bar for the 10s disappearance */}
              <motion.div 
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 10, ease: "linear" }}
                className={`absolute bottom-0 left-0 h-0.5 w-full origin-left ${isSolar ? 'bg-red-600' : 'bg-[#c9964a]'}`}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSyncMenu && (
          <motion.div key="sync-menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`fixed inset-0 z-[100] ${isSolar ? 'bg-black/40' : 'bg-black/80'} backdrop-blur-md flex items-center justify-center p-6`}>
            <div className={`${isSolar ? 'bg-white border-zinc-900 border-2' : 'bg-[#1a1a1a] border border-white/10'} p-8 rounded-[2rem] w-full max-w-sm relative`}>
              <button onClick={() => setShowSyncMenu(false)} className={isSolar ? 'absolute top-6 right-6 text-black' : 'absolute top-6 right-6 text-white/40'}><X size={24} /></button>
              <h3 className={`text-xl font-black uppercase mb-6 ${isSolar ? 'text-black' : 'text-[#c9964a]'}`}>Gestion Tactique</h3>
              <div className="grid gap-3">
                <button onClick={handleExport} className={`flex items-center justify-between p-4 rounded-2xl border ${isSolar ? 'bg-zinc-100 border-zinc-200 text-black' : 'bg-white/5 border-white/10 text-white'}`}><Download size={18} /><span className="text-[10px] font-black uppercase">Exporter Plans</span></button>
                <label className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer ${isSolar ? 'bg-zinc-100 border-zinc-200 text-black' : 'bg-white/5 border-white/10 text-white'}`}><UploadIcon size={18} /><span className="text-[10px] font-black uppercase">Importer Plans</span><input type="file" onChange={handleImport} className="hidden" /></label>
                <button onClick={() => { setShowRulesModal(true); setShowSyncMenu(false); }} className={`flex items-center justify-between p-4 rounded-2xl border ${isSolar ? 'bg-zinc-100 border-zinc-200 text-black' : 'bg-white/5 border-white/10 text-white'}`}><BookOpen size={18} /><span className="text-[10px] font-black uppercase">Règles</span></button>
              </div>
            </div>
          </motion.div>
        )}

        {showCourseSelector && (
          <motion.div key="course-selector" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className={`fixed inset-0 z-[500] ${isSolar ? 'bg-white' : 'bg-black'} p-6 pt-16`}>
            <button onClick={() => setShowCourseSelector(false)} className={`${isSolar ? 'text-black border-black shadow-md' : 'text-white/40 border-white/10'} uppercase text-[10px] border px-4 py-2 rounded-full mb-8 font-black`}>Fermer</button>
            <div className="grid gap-4">
                {COURSES.map((c, cidx) => <button key={`dash-course-sel-v12-${c.id}-${cidx}-${c.name.substring(0, 5)}`} onClick={() => { setSelectedCourse(c); setShowCourseSelector(false); }} className={`p-6 text-left rounded-3xl border font-black uppercase transition-all ${isSolar ? 'bg-zinc-100 border-zinc-200 text-black shadow-sm active:bg-zinc-200' : 'bg-white/5 border-white/10 text-white active:bg-white/10'}`}>{c.name}</button>)}
            </div>
          </motion.div>
        )}

        {showCaddieSelector && (
          <motion.div 
            key="tactical-hub-overlay-dash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[600] ${isSolar ? 'bg-white' : 'bg-black/95'} backdrop-blur-2xl flex flex-col pt-16`}
          >
            <div className="px-6 flex justify-between items-center mb-10">
               <div className="flex flex-col">
                 <h3 className={`font-black text-xs tracking-[0.5em] uppercase mb-1 ${isSolar ? 'text-black' : 'text-[#c9964a]'}`}>CENTRE TACTIQUE</h3>
                 <p className={`text-[7px] font-black uppercase tracking-widest font-mono ${isSolar ? 'text-zinc-400' : 'text-white/20'}`}>STATION : {selectedCourse.name.toUpperCase()}</p>
               </div>
               <button onClick={() => setShowCaddieSelector(false)} className={`text-[10px] font-black border px-6 py-2 rounded-full uppercase tracking-widest active:scale-90 transition-all ${isSolar ? 'bg-black text-white border-black shadow-lg' : 'text-white/40 border-white/10'}`}>TERMINER</button>
            </div>

            <div className="flex-1 px-6 space-y-8 overflow-y-auto pb-32">
              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={() => { setShowCaddieSelector(false); setShowArsenalMenu(true); }}
                  className={`border p-4 rounded-3xl flex flex-col gap-2 items-center hover:opacity-80 transition-all active:scale-95 group ${isSolar ? 'bg-zinc-100 border-zinc-200' : 'bg-white/5 border-white/10'}`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isSolar ? 'bg-black text-white border border-black shadow-md' : 'bg-orange-500/10 border border-orange-500/20 text-orange-500 group-hover:bg-orange-500 group-hover:text-black'}`}>
                    <Zap size={20} />
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-widest ${isSolar ? 'text-black' : 'text-white/60'}`}>ARSENAL</span>
                </button>
                <button 
                  onClick={() => { setShowCaddieSelector(false); setShowModeSelector(true); }}
                  className={`border p-4 rounded-3xl flex flex-col gap-2 items-center hover:opacity-80 transition-all active:scale-95 group ${isSolar ? 'bg-zinc-100 border-zinc-200' : 'bg-white/5 border-white/10'}`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isSolar ? 'bg-black text-white border border-black shadow-md' : 'bg-sky-500/10 border border-sky-500/20 text-sky-400 group-hover:bg-sky-500 group-hover:text-black'}`}>
                    <Navigation size={20} />
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-widest ${isSolar ? 'text-black' : 'text-white/60'}`}>MODE JEU</span>
                </button>
                <button 
                  onClick={() => { setShowCaddieSelector(false); setActiveTab('profile'); }}
                  className={`border p-4 rounded-3xl flex flex-col gap-2 items-center hover:opacity-80 transition-all active:scale-95 group ${isSolar ? 'bg-zinc-100 border-zinc-200' : 'bg-white/5 border-white/10'}`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isSolar ? 'bg-black text-white border border-black shadow-md' : 'bg-[#c9964a]/10 border border-[#c9964a]/20 text-[#c9964a] group-hover:bg-[#c9964a] group-hover:text-black'}`}>
                    <ImageIcon size={20} />
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-widest ${isSolar ? 'text-black' : 'text-white/60'}`}>VAULT</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 px-2 mb-2">
                  <Brain size={14} className={isSolar ? 'text-black' : 'text-[#c9964a]'} />
                  <h4 className={`text-[10px] font-black uppercase tracking-[0.3em] italic ${isSolar ? 'text-zinc-400' : 'text-white/40'}`}>Unités Caddie</h4>
                </div>
                  {Object.values(CADDIES).map((c: any, cidx: number) => (
                    <motion.button
                      key={`caddie-dash-sel-v3-${c.id}-${cidx}`}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setActiveCaddie(c); }}
                    className={`w-full p-6 text-left rounded-[2rem] border transition-all flex items-center gap-5 ${
                      activeCaddie.id === c.id ? (isSolar ? 'bg-white border-black border-2 shadow-xl' : 'bg-[#c9964a]/10 border-[#c9964a]') : (isSolar ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border-white/10 grayscale opacity-40')
                    }`}
                  >
                     <div className={`w-14 h-14 rounded-2xl overflow-hidden border-2 transition-all shadow-xl ${activeCaddie.id === c.id ? (isSolar ? 'border-black' : 'border-[#c9964a]') : 'border-white/10 opacity-40'}`}>
                        <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                     </div>
                     <div className="flex-1">
                        <h4 className={`text-lg font-black italic tracking-tighter uppercase leading-none mb-1 ${isSolar ? 'text-black' : 'text-white'}`}>{c.name} {activeCaddie.id === c.id && <span className="text-[10px] text-emerald-500 ml-1">●</span>}</h4>
                        <p className={`text-[9px] font-bold uppercase tracking-[0.2em] ${isSolar ? 'text-zinc-500' : 'text-white/30'}`}>{c.title}</p>
                     </div>
                  </motion.button>
                ))}
              </div>

              {/* Connected Chat Liaison Preview */}
              <button 
                onClick={() => { setShowCaddieSelector(false); (window as any).document.getElementById('floating-adam-btn')?.click(); }}
                className={`p-6 rounded-[2rem] border-2 shadow-xl text-left transition-all active:scale-[0.98] ${isSolar ? 'bg-zinc-50 border-black shadow-lg' : 'bg-white/5 border-white/5 shadow-2xl shadow-[#c9964a]/5'}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSolar ? 'bg-black text-white' : 'bg-[#c9964a] text-black shadow-lg shadow-[#c9964a]/20'}`}>
                    <Brain size={16} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black italic uppercase tracking-widest leading-none mb-1">Liaison ONYX Directe</h4>
                    <p className={`text-[7px] font-black uppercase tracking-[0.2em] ${isSolar ? 'text-zinc-400' : 'text-white/20'}`}>Centralisé & Connecté</p>
                  </div>
                </div>
                
                <div className={`p-4 rounded-2xl border ${isSolar ? 'bg-white border-black/10' : 'bg-white/5 border-white/5'} mb-3`}>
                  <p className={`text-[10px] italic leading-relaxed ${isSolar ? 'text-zinc-600' : 'text-white/60'}`}>
                    {messages.length > 0 
                      ? (messages[messages.length - 1].parts.map((p: any) => 'text' in p ? p.text : '').join(' ').substring(0, 80) + '...')
                      : "Liaison cryptée active. En attente de transmission tactique par le Mentor ADAM."
                    }
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${isSolar ? 'text-black' : 'text-[#c9964a]'}`}>Ouvrir le canal central</span>
                  <ChevronRight size={14} className={isSolar ? 'text-black' : 'text-[#c9964a]'} />
                </div>
              </button>

              <div className={`pt-4 border-t ${isSolar ? 'border-zinc-200' : 'border-white/5'}`}>
                <button 
                  onClick={() => {
                    setMissionStarted(false);
                    setAppPath('player');
                  }}
                  className={`w-full h-16 rounded-2xl border font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-3 ${isSolar ? 'bg-red-50 text-red-600 border-red-600 shadow-md' : 'bg-red-600/10 border border-red-600 text-red-500'}`}
                >
                  <Shield size={16} />
                  RETOUR BRIEFING (MISSION CONTROL)
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Arsenal Selector Overlay */}
      <AnimatePresence>
        {showArsenalMenu && (
          <motion.div 
            key="arsenal-selector-overlay-dash"
            initial={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.95, filter: 'blur(20px)' }}
            className="fixed inset-0 z-[600] bg-black p-6 flex flex-col pt-16"
          >
            <div className="flex justify-between items-start mb-10 pt-4 relative z-10">
                <div className="flex flex-col">
                   <div className="flex items-center gap-2 mb-1">
                      <Zap size={14} className="text-[#c9964a]" />
                      <h3 className="font-black text-[#c9964a] text-[11px] tracking-[0.5em] uppercase">ARSENAL TACTIQUE</h3>
                   </div>
                   <p className="text-[10px] font-black text-white/50 uppercase tracking-widest leading-none">Étalonnage des unités de distance (M)</p>
                </div>
                <button 
                  onClick={() => setShowArsenalMenu(false)} 
                  className="bg-zinc-800 w-12 h-12 rounded-full flex items-center justify-center border-2 border-white/20 active:scale-90 transition-all shadow-lg"
                >
                  <X size={24} className="text-white" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-32 no-scrollbar relative z-10 px-1">
              <div className="grid gap-4">
                {arsenal.map((club: any, aidx: number) => (
                  <motion.div 
                    key={`arsenal-dash-item-v3-${aidx}-${club.id}`} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: aidx * 0.02 }}
                    className="bg-zinc-900 border-2 border-white/20 p-4 rounded-[2rem] flex items-center justify-between group relative overflow-hidden shadow-xl"
                  >
                    <span className="absolute -left-2 -top-2 text-[45px] font-black text-white/[0.05] italic select-none uppercase">{club.type}</span>
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-14 h-14 bg-black rounded-2xl border-2 border-white/30 flex items-center justify-center font-mono font-black italic text-white text-xl shadow-inner group-hover:border-[#c9964a] transition-colors">
                        {club.name.replace(/[a-z]/g, '') || club.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-base font-black text-white uppercase tracking-tight leading-none mb-1">{club.name}</p>
                        <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">{club.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 relative z-10">
                      <div className="flex flex-col gap-1.5">
                        <button 
                          onClick={() => {
                            const newArsenal = [...arsenal];
                            newArsenal[aidx].dist = (newArsenal[aidx].dist || 0) + 5;
                            setArsenal(newArsenal);
                          }}
                          className="w-12 h-9 rounded-xl bg-[#c9964a] flex items-center justify-center text-black active:scale-95 transition-all shadow-lg"
                        >
                          <Plus size={20} fontWeight="black" />
                        </button>
                        <button 
                          onClick={() => {
                            const newArsenal = [...arsenal];
                            newArsenal[aidx].dist = Math.max(0, (newArsenal[aidx].dist || 0) - 5);
                            setArsenal(newArsenal);
                          }}
                          className="w-12 h-9 rounded-xl bg-zinc-800 border-2 border-white/20 flex items-center justify-center text-white active:scale-95 transition-all"
                        >
                          <Minus size={20} />
                        </button>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <p className="text-4xl font-black italic text-white tracking-tighter leading-none font-mono group-hover:text-[#c9964a] transition-colors">{club.dist}</p>
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-1">METERS</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="fixed bottom-10 left-6 right-6 z-30">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowArsenalMenu(false)}
                className="w-full bg-[#c9964a] text-black h-16 rounded-[2rem] flex items-center justify-center gap-3 font-black text-xs tracking-[0.4em] uppercase shadow-[0_15px_40px_rgba(201,150,74,0.3)]"
              >
                APPLIQUER ÉTALONNAGE
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mode Selector Overlay */}
      <AnimatePresence>
        {showModeSelector && (
          <motion.div 
            key="mode-selector-overlay-dash"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="fixed inset-0 z-[600] bg-black/95 p-6 flex flex-col pt-16"
          >
            <div className="flex justify-between items-center mb-12">
               <h3 className="font-black text-[#c9964a] text-xs tracking-[0.5em] uppercase">SYSTÈME DE CALCUL</h3>
               <button onClick={() => setShowModeSelector(false)} className="text-white/40 text-[10px] font-black border border-white/10 px-6 py-2 rounded-full uppercase tracking-widest active:scale-90 transition-transform">Fermer</button>
            </div>

            <div className="flex-1 space-y-4">
                {[
                  { id: GameMode.STROKE, name: 'STROKE PLAY', desc: 'Score classique brut vs par. Standard tactique.', color: 'border-white/10' },
                  { id: GameMode.STABLEFORD, name: 'STABLEFORD', desc: 'Calcul de points net. Analyse de performance.', color: 'border-[#c9964a]/30' },
                  { id: GameMode.MATCHPLAY, name: 'MATCH PLAY', desc: 'Face-à-face tactique. Domination de trous.', color: 'border-red-600/30' },
                ].map((mode, idx) => (
                  <motion.button
                    key={`gamemode-dash-v2-${idx}-${mode.id}`}
                   whileTap={{ scale: 0.98 }}
                   onClick={() => { setSelectedMode(mode.id); setShowModeSelector(false); }}
                   className={`w-full bg-white/5 p-8 text-left rounded-[2rem] border transition-all ${mode.color} ${selectedMode === mode.id ? 'bg-white/10 scale-[1.02]' : ''}`}
                 >
                    <h4 className="text-white text-xl font-black italic mb-2 tracking-tight uppercase">{mode.name}</h4>
                    <p className="text-[10px] text-white/40 font-bold mb-4 uppercase tracking-widest leading-relaxed">{mode.desc}</p>
                    {selectedMode === mode.id && <div className="text-[10px] font-black text-[#c9964a] flex items-center gap-2 uppercase tracking-[0.3em]"><Check size={12}/> ACTIF</div>}
                 </motion.button>
               ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <RulesModal isOpen={showRulesModal} onClose={() => setShowRulesModal(false)} />
    </div>
  );
}
