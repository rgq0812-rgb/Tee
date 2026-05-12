import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Zap, Brain, Trophy, ChevronRight, Loader2, Star, User, Edit3, CheckCircle2, Play, Flame, Filter, Clock, X, Volume2, Activity, ShieldAlert, Timer as TimerIcon, PlayCircle, GraduationCap, BookOpen, Quote, Sparkles, MessageSquare, Mic, Lock, Circle, Flag, ShieldCheck } from 'lucide-react';
import { getTrainingProgram, speakWithBrowser, getTeacherCoaching, generateSpeech, chatWithTeacher } from '../services/geminiService';
import { useChat } from '../services/ChatContext';
import { ACADEMY_CATALOG, AcademyDrill } from '../data/academyDrills';
import { playWhistle, playRawPcm, playPing } from '../lib/audioUtils';

interface Drill extends AcademyDrill {
  intensity?: string;
}

interface TrainingProgram {
  summary: string;
  drills: Drill[];
}

const AcademyBackground = React.memo(({ isSolar }: { isSolar: boolean }) => {
  const relics = useMemo(() => [
    { Icon: Target, size: 32 },
    { Icon: Brain, size: 48 },
    { Icon: Zap, size: 32 },
    { Icon: Trophy, size: 40 },
    { Icon: Flag, size: 36 },
    { Icon: Circle, size: 44 },
    { Icon: Flame, size: 32 },
    { Icon: Star, size: 32 },
    { Icon: Activity, size: 32 },
    { Icon: Sparkles, size: 48 },
    { Icon: GraduationCap, size: 40 },
    { Icon: Clock, size: 32 },
    { Icon: Target, size: 24, rotation: 45 },
    { Icon: Brain, size: 24, rotation: -15 }
  ].map((r, i) => ({
    ...r,
    x: (Math.random() * 95 + 2.5) + '%',
    y: (Math.random() * 95 + 2.5) + '%',
    delay: Math.random() * 10,
    duration: 30 + Math.random() * 20
  })), [isSolar]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Dynamic Lens Flare / Glow */}
      <div className={`absolute top-[-10%] right-[-10%] w-[60%] aspect-square rounded-full blur-[150px] opacity-25 ${isSolar ? 'bg-black/5' : 'bg-[#c9964a]/20'}`} />
      <div className={`absolute bottom-[-10%] left-[-10%] w-[50%] aspect-square rounded-full blur-[120px] opacity-15 ${isSolar ? 'bg-black/5' : 'bg-[#c9964a]/10'}`} />

      {/* Floating Technical Lines */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={`line-${i}`}
            initial={{ x: i % 2 === 0 ? '-100%' : '100%', y: (i * 10) + '%', rotate: i % 2 === 0 ? 15 : -15, opacity: 0 }}
            animate={{ 
              x: i % 2 === 0 ? '150%' : '-150%',
              opacity: [0, 0.1, 0.3, 0.1, 0],
              transition: { 
                duration: 25 + (i * 3), 
                repeat: Infinity, 
                ease: "linear",
                delay: i * 1.2 
              } 
            }}
            className={`absolute h-[1px] w-[1200px] bg-gradient-to-r from-transparent via-current to-transparent ${isSolar ? 'text-black/20' : 'text-[#c9964a]/30'}`}
          />
        ))}
      </div>

      {/* Floating Golf Relics (Minimalist Icons) */}
      <div className="absolute inset-0">
        {relics.map((relic, i) => (
          <motion.div
             key={`relic-${i}`}
             initial={{ 
               x: relic.x, 
               y: relic.y, 
               scale: 0.5, 
               opacity: 0,
               rotate: (relic as any).rotation || 0 
             }}
             animate={{ 
               y: ['-40px', '40px', '-40px'],
               x: ['-20px', '20px', '-20px'],
               rotate: [0, 180, 360],
               opacity: [0, 0.1, 0.2, 0.1, 0],
               scale: [0.5, 0.7, 0.5],
               transition: { 
                 duration: relic.duration, 
                 repeat: Infinity, 
                 ease: "easeInOut",
                 times: [0, 0.25, 0.5, 0.75, 1],
                 delay: relic.delay
               } 
             }}
             className={`absolute ${isSolar ? 'text-black' : 'text-[#c9964a]'}`}
          >
            <relic.Icon size={relic.size} strokeWidth={0.5} />
          </motion.div>
        ))}
      </div>

      {/* Additional Golf Objects (Static/Slow Decoration) */}
      <div className="absolute inset-0 opacity-5 overflow-hidden">
         <Target size={200} className="absolute -top-20 -left-20 rotate-12" />
         <Brain size={150} className="absolute bottom-40 -right-20 -rotate-12" />
         <Trophy size={180} className="absolute top-1/2 -left-20 rotate-45" />
      </div>

      {/* Modern Grid Overlay (Architectural) */}
      <div className={`absolute inset-0 opacity-[0.05] ${isSolar ? 'bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)]' : 'bg-[linear-gradient(to_right,#c9964a_1px,transparent_1px),linear-gradient(to_bottom,#c9964a_1px,transparent_1px)]'} bg-[size:80px_80px]`} />
    </div>
  );
});

export default function Academy({ 
  displayMode, 
  scorecard,
  pseudo,
  setPseudo,
  arsenal = [],
  index = 0,
  currentHole,
  activeSession,
  sessionTimeLeft,
  isSessionRunning,
  startDrillSession,
  stopDrillSession
}: { 
  displayMode: 'tactical' | 'solar';
  scorecard: any;
  pseudo: string;
  setPseudo: (p: string) => void;
  arsenal?: any[];
  index?: number;
  currentHole?: number;
  activeSession: AcademyDrill | null;
  sessionTimeLeft: number;
  isSessionRunning: boolean;
  startDrillSession: (drill: AcademyDrill) => void;
  stopDrillSession: () => void;
}) {
  const isSolar = displayMode === 'solar';
  const { lastAdvice } = useChat();
  const [activeTab, setActiveTab] = useState<'plan' | 'catalogue' | 'competition'>('plan');
  const [selectedCategory, setSelectedCategory] = useState<string>('ESSENTIELS');
  const [program, setProgram] = useState<TrainingProgram | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingPseudo, setIsEditingPseudo] = useState(false);
  const [tempPseudo, setTempPseudo] = useState(pseudo);
  const [activeDrill, setActiveDrill] = useState<number | null>(null);
  const [expandedCatalogDrill, setExpandedCatalogDrill] = useState<string | null>(null);
  const [selectedArenaLevel, setSelectedArenaLevel] = useState<string | null>(() => {
    return localStorage.getItem('onyx_selected_arena_level') || null;
  });
  const [showTeacherChat, setShowTeacherChat] = useState(false);
  const [sessionBriefing, setSessionBriefing] = useState<AcademyDrill | null>(null);

  const getTechnicalLevel = () => {
    // Priority 1: Current Session
    if (activeSession) return activeSession.category;
    // Priority 2: Previewing a Session
    if (sessionBriefing) return sessionBriefing.category;
    // Priority 3: Current Selected Category in Catalogue
    if (activeTab === 'catalogue' && selectedCategory) return selectedCategory;
    
    // Default: Arena Level
    const levelMap: Record<string, string> = {
      'rookie': 'NEW GEN',
      'grinder': 'GRINDER',
      'challenger': 'CHALLENGER',
      'tour': 'TOUR PRO'
    };
    return (selectedArenaLevel && levelMap[selectedArenaLevel]) || 'UNITÉ ONYX';
  };

  const getLevelColor = () => {
    const level = getTechnicalLevel();
    if (level === 'NEW GEN') return 'text-blue-400';
    if (level === 'GRINDER') return 'text-emerald-400';
    if (level === 'CHALLENGER') return 'text-amber-400';
    if (level === 'TOUR PRO') return 'text-red-500';
    
    // Category Colors
    if (level === 'WARMUP') return 'text-sky-300';
    if (level === 'ESSENTIELS') return 'text-zinc-50';
    if (level === 'BIOMÉCANIQUE') return 'text-[#c9964a]';
    if (level === 'SCORING ZONE') return 'text-emerald-300';
    if (level === 'STRATÉGIE') return 'text-indigo-300';
    if (level === 'MENTAL') return 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]';
    if (level === 'FUN') return 'text-rose-300';

    return isSolar ? 'text-black' : 'text-[#c9964a]';
  };

  useEffect(() => {
    if (selectedArenaLevel) {
      localStorage.setItem('onyx_selected_arena_level', selectedArenaLevel);
    }
  }, [selectedArenaLevel]);

  const [validatedPoints, setValidatedPoints] = useState<string[]>([]);
  const [drillReps, setDrillReps] = useState(0);
  const [drillSuccess, setDrillSuccess] = useState(0);
  const [completedDrills, setCompletedDrills] = useState<string[]>(() => {
    const saved = localStorage.getItem('onyx_completed_drills');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    setValidatedPoints([]);
    setDrillReps(0);
    setDrillSuccess(0);
  }, [activeSession?.id]);

  const togglePoint = (point: string) => {
    setValidatedPoints(prev => 
      prev.includes(point) ? prev.filter(p => p !== point) : [...prev, point]
    );
  };

  const handleStartRequest = (drill: AcademyDrill) => {
    setSessionBriefing(drill);
  };

  const confirmStartSession = (drill: AcademyDrill) => {
    startDrillSession(drill);
    setSessionBriefing(null);
  };

  const validateDrill = (drillId: string) => {
    if (completedDrills.includes(drillId)) return;
    
    // Check if all mastery points are validated
    if (activeSession?.masteryPoints && validatedPoints.length < activeSession.masteryPoints.length) {
      handleTeacherSpeak("Validation impossible. Tous les points de maîtrise doivent être cochés pour confirmer la compétence.", 'strat');
      return;
    }

    const newList = [...completedDrills, drillId];
    setCompletedDrills(newList);
    localStorage.setItem('onyx_completed_drills', JSON.stringify(newList));
    
    // Feedback
    const text = "Validation enregistrée. Adam : Excellent travail sur ce module technique. Persévérez.";
    handleTeacherSpeak(text, 'strat');
  };

  // Elite Faculty state
  const [selectedTeacher, setSelectedTeacher] = useState<'marcus' | 'elena' | null>(null);
  const [teacherAnalysis, setTeacherAnalysis] = useState<string | null>(null);
  const [isTeacherLoading, setIsTeacherLoading] = useState(false);
  const [isTeacherSpeaking, setIsTeacherSpeaking] = useState(false);
  const [commMode, setCommMode] = useState<'pro' | 'casual'>('pro');
  const [isHandsFree, setIsHandsFree] = useState(false);
  const recognitionRef = useRef<any>(null);
  const wakeWordDetectedRef = useRef(false);

  const TEACHERS = {
    marcus: {
      id: 'marcus',
      name: 'MARCUS',
      title: "L'Enseignant Élite",
      voiceId: 'seve',
      avatar: 'https://images.unsplash.com/photo-1591491640784-3232eb748d4b?q=80&w=2574&auto=format&fit=crop', // Professional male golfer
      philosophy: 'Penick & Leadbetter',
      focus: 'Biomécanique',
      description: 'Expert en biomécanique et fondamentaux du swing.'
    },
    elena: {
      id: 'elena',
      name: 'ELENA',
      title: "L'Architecte Performance",
      voiceId: 'strat',
      avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=2671&auto=format&fit=crop', // Better professional female golfer portrait
      philosophy: 'Butch Harmon & Bob Rotella',
      focus: 'Mental & Trajectoires',
      description: 'Spécialiste de la psychologie et des trajectoires élites.'
    }
  };

  const [teacherChat, setTeacherChat] = useState<{role: 'user' | 'model', parts: {text: string}[]}[]>([]);
  const [teacherInput, setTeacherInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  // Auto-load coaching when entering teacher chat
  useEffect(() => {
    if (showTeacherChat && teacherChat.length === 0 && !isTeacherLoading) {
      const teacherToLoad = selectedTeacher || 'marcus';
      if (!selectedTeacher) setSelectedTeacher('marcus');
      loadTeacherCoaching(teacherToLoad);
    }
  }, [showTeacherChat, teacherChat.length, isTeacherLoading]);

  const handleTeacherChat = async (text: string) => {
    let teacherToUse = selectedTeacher;
    if (!teacherToUse) {
      teacherToUse = 'marcus';
      setSelectedTeacher('marcus');
    }
    if (!text.trim() || isTeacherLoading) return;
    
    const newUserMsg = { role: 'user' as const, parts: [{ text }] };
    const newHistory = [...teacherChat, newUserMsg];
    setTeacherChat(newHistory);
    setTeacherInput('');
    setIsTeacherLoading(true);

    try {
      console.log(`[Academy] Sending chat to ${teacherToUse}:`, text);
      const response = await chatWithTeacher(
        teacherToUse,
        pseudo,
        newHistory,
        scorecard,
        null, // lastAdvice
        commMode,
        arsenal,
        index,
        currentHole
      );
      
      if (response) {
        const newModelMsg = { role: 'model' as const, parts: [{ text: response }] };
        setTeacherChat(prev => [...prev, newModelMsg]);
        handleTeacherSpeak(response, TEACHERS[teacherToUse].voiceId);
      } else {
        throw new Error("Empty response from teacher");
      }
    } catch (e) {
      console.error("[Academy Chat Error]", e);
      const errorMsg = "La connexion est momentanément interrompue. Je reste à votre écoute.";
      setTeacherChat(prev => [...prev, { role: 'model', parts: [{ text: errorMsg }] }]);
      handleTeacherSpeak(errorMsg, TEACHERS[teacherToUse].voiceId);
    } finally {
      setIsTeacherLoading(false);
    }
  };

  const loadTeacherCoaching = async (teacherKey: 'marcus' | 'elena') => {
    setSelectedTeacher(teacherKey);
    setIsTeacherLoading(true);
    setTeacherAnalysis(null);
    setTeacherChat([]);
    try {
      const analysis = await getTeacherCoaching(teacherKey, pseudo, scorecard, lastAdvice, commMode, arsenal, index);
      setTeacherAnalysis(analysis);
      setTeacherChat([{ role: 'model', parts: [{ text: analysis }] }]);
      
      const isMuted = localStorage.getItem('onyx_voice') === 'false';
      if (!isMuted && analysis) {
        handleTeacherSpeak(analysis, TEACHERS[teacherKey].voiceId);
      }
    } catch (e) {
      console.error(e);
      setTeacherAnalysis("Une erreur de communication est survenue avec l'Académie.");
    } finally {
      setIsTeacherLoading(false);
    }
  };

  const stripMarkdown = (text: string) => {
    if (!text) return "";
    return text
      .replace(/\*\*/g, '')                  // Remove bold
      .replace(/\*/g, '')                   // Remove italics
      .replace(/#/g, '')                    // Remove headers (croisillons)
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links but keep text
      .replace(/[_~`]/g, '')                // Remove other markdown
      .replace(/[^\w\sàâäéèêëîïôöùûüç.,!?;:'"()-]/gi, ' ') // Remove remaining symbols
      .replace(/\s+/g, ' ')                 // Normalize whitespace
      .trim();
  };

  const [conversationTimeout, setConversationTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleTeacherSpeak = async (text: string, voiceId: string) => {
    if (isTeacherSpeaking) return;
    setIsTeacherSpeaking(true);
    const cleanText = stripMarkdown(text);
    
    const onEnded = () => {
      setIsTeacherSpeaking(false);
      // Restart hands-free conversation window if active
      if (isHandsFree) {
        wakeWordDetectedRef.current = true;
        // Keep mic "awake" for 30s for follow-up conversation
        if (conversationTimeout) clearTimeout(conversationTimeout);
        const timer = setTimeout(() => {
          wakeWordDetectedRef.current = false;
        }, 30000); // 30 seconds
        setConversationTimeout(timer);
      }
    };

    try {
      const audioData = await generateSpeech(cleanText, { id: voiceId });
      if (typeof audioData === 'string') {
        const source = await playRawPcm(audioData);
        if (source) source.onended = onEnded;
        else onEnded();
      } else {
        speakWithBrowser(cleanText, onEnded);
      }
    } catch (e) {
      console.error("Teacher Speech Error:", e);
      speakWithBrowser(cleanText, onEnded);
    }
  };

  const [isDrillSpeaking, setIsDrillSpeaking] = useState(false);

  const handleDrillSpeak = async (drill: AcademyDrill) => {
    if (isDrillSpeaking) return;
    setIsDrillSpeaking(true);
    
    const theory = (drill as any).theory || drill.description;
    const steps = (drill as any).steps ? (drill as any).steps.join('. ') : '';
    const mentorTip = (drill as any).mentorTip || '';
    const durationMins = Math.floor(drill.duration / 60);
    const textToSpeak = `${drill.title}. Durée : ${durationMins} minutes. ${theory} ${steps ? `Les étapes : ${steps}` : ''} ${mentorTip ? `Astuce d'Adam : ${mentorTip}` : ''}`;
    
    const cleanText = stripMarkdown(textToSpeak);
    try {
      const audioData = await generateSpeech(cleanText, { id: 'strat' }); // Use Elena/Strat voice for drills
      if (typeof audioData === 'string') {
        const source = await playRawPcm(audioData);
        if (source) source.onended = () => setIsDrillSpeaking(false);
        else setIsDrillSpeaking(false);
      } else {
        speakWithBrowser(cleanText, () => setIsDrillSpeaking(false));
      }
    } catch (e) {
      console.error("Drill Speech Error:", e);
      speakWithBrowser(cleanText, () => setIsDrillSpeaking(false));
    }
  };

  useEffect(() => {
    if (activeSession) {
      handleDrillSpeak(activeSession);
    }
  }, [activeSession?.id]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Hands-Free Voice Control logic for Academy
  useEffect(() => {
    if (!isHandsFree || isTeacherSpeaking) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    const rec = new SpeechRec();
    rec.continuous = false; // Use non-continuous to avoid cumulative transcript bugs
    rec.interimResults = false;
    rec.lang = 'fr-FR';

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      console.log("[Academy Speech] Heard:", transcript);

      // 1. Wake Word Detection or Follow-up window
      if (transcript.includes('hey tee') || transcript.includes('hey t') || wakeWordDetectedRef.current) {
        if (!wakeWordDetectedRef.current) {
          playWhistle(); // Audio feedback for wake word
        }
        
        wakeWordDetectedRef.current = true;
        
        // Reset/Start 30s timer on any voice detected in active window or by wake word
        if (conversationTimeout) clearTimeout(conversationTimeout);
        const timer = setTimeout(() => {
          console.log("[Academy Speech] Wake word window expired");
          wakeWordDetectedRef.current = false;
        }, 30000); // 30 seconds
        setConversationTimeout(timer);

        const cleanTranscript = transcript.split(/hey tee|hey t/).pop()?.trim();
        if (!cleanTranscript) return;

        // Command processing
        if (cleanTranscript.includes('stop') || cleanTranscript.includes('terminer') || cleanTranscript.includes('arrête')) {
          if (activeSession) stopDrillSession();
          wakeWordDetectedRef.current = false;
          return;
        }

        if (cleanTranscript.includes('démarrer') || cleanTranscript.includes('commence')) {
          if (!activeSession && program?.drills[0]) {
            startDrillSession(program.drills[0]);
          }
          wakeWordDetectedRef.current = false;
          return;
        }

        if (cleanTranscript.includes('répète') || cleanTranscript.includes('réécouter') || cleanTranscript.includes('encore')) {
          if (activeSession) handleDrillSpeak(activeSession);
          wakeWordDetectedRef.current = false;
          return;
        }

        if (cleanTranscript.length > 3) {
          console.log("[Academy Speech] Processing dialogue:", cleanTranscript);
          if (selectedTeacher) {
            handleTeacherChat(cleanTranscript);
          } else {
            const text = "Je vous écoute. Choisissez un mentor pour une analyse approfondie, ou dites 'Démarrer'.";
            handleTeacherSpeak(text, 'strat');
          }
          // Note: we don't set wakeWordDetected to false here because we want to allow follow-up for 30s
        }
      }
    };

    rec.onend = () => { if (isHandsFree) rec.start(); };
    rec.onstart = () => console.log("[Academy Speech] Listening...");
    
    rec.start();
    recognitionRef.current = rec;

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [isHandsFree, selectedTeacher, activeSession, program, conversationTimeout]);

  useEffect(() => {
    if (activeDrill !== null && isHandsFree && selectedTeacher && program) {
      const drill = program.drills[activeDrill];
      if (drill) {
        const theory = (drill as any).theory || '';
        const steps = (drill as any).steps ? (drill as any).steps.join('. ') : '';
        const textToSpeak = `${drill.title}. ${theory} ${steps ? `Les étapes : ${steps}` : ''}`;
        handleTeacherSpeak(textToSpeak, TEACHERS[selectedTeacher].voiceId);
      }
    }
  }, [activeDrill, isHandsFree, selectedTeacher, program]);

  // Automatic speech for drill Bible when hands-free is active
  useEffect(() => {
    if (expandedCatalogDrill && isHandsFree && selectedTeacher) {
      const drill = ACADEMY_CATALOG.find(d => d.id === expandedCatalogDrill);
      if (drill) {
        const textToSpeak = `${drill.title}. La théorie : ${drill.theory}. Étape par étape : ${drill.steps.join('. ')}`;
        handleTeacherSpeak(textToSpeak, TEACHERS[selectedTeacher].voiceId);
      }
    }
  }, [expandedCatalogDrill, isHandsFree, selectedTeacher]);

  const filteredDrills = ACADEMY_CATALOG.filter(d => 
    selectedCategory === 'TOUS' || d.category === selectedCategory
  ).sort((a, b) => {
    if (a.category === 'WARMUP' && b.category !== 'WARMUP') return -1;
    if (a.category !== 'WARMUP' && b.category === 'WARMUP') return 1;
    return 0;
  });

  const fetchProgram = async () => {
    setIsLoading(true);
    try {
      const data = await getTrainingProgram(pseudo, scorecard, lastAdvice);
      setProgram(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProgram();
  }, [pseudo]);

  const isLevelUnlocked = (levelId: string) => {
    switch (levelId) {
      case 'rookie': return index >= 36 || true; // Always open for all
      case 'grinder': return index < 36;
      case 'challenger': return index < 18;
      case 'tour': return index < 5;
      default: return false;
    }
  };

  const getArenaDrills = (levelId: string) => {
    const difficultyMap: Record<string, string> = {
      'rookie': 'NEW GEN',
      'grinder': 'GRINDER',
      'challenger': 'CHALLENGER',
      'tour': 'TOUR PRO'
    };
    const difficulty = difficultyMap[levelId];
    return ACADEMY_CATALOG.filter(d => d.difficulty === difficulty);
  };

  return (
    <div className={`relative min-h-screen ${isSolar ? 'bg-white' : 'bg-black'}`}>
      <AcademyBackground isSolar={isSolar} />
      
      <div className={`relative z-10 max-w-4xl mx-auto space-y-12 pb-32 pt-12 px-4 md:px-8 ${isSolar ? 'text-black' : 'text-white'}`}>
      {/* Persistent Timer Header (Sticky Onyx Bar) */}
      <div className="sticky top-0 z-[100] -mx-4 md:-mx-8 lg:-mx-12 px-4 md:px-8 lg:px-12 py-3 pointer-events-none mb-12">
        <AnimatePresence>
          {activeSession && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.95 }}
              className={`w-full max-w-2xl mx-auto p-5 md:p-6 rounded-[2.5rem] border-2 shadow-2xl pointer-events-auto backdrop-blur-3xl flex items-center justify-between gap-6 ${
                isSolar ? 'bg-white/95 border-black shadow-xl font-bold' : 'bg-black/90 border-[#c9964a] shadow-2xl shadow-[#c9964a]/30'
              }`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 animate-pulse ${
                  isSolar ? 'bg-black text-white' : 'bg-[#c9964a] text-black shadow-lg shadow-[#c9964a]/50'
                }`}>
                  <TimerIcon size={32} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <motion.div 
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-2 h-2 rounded-full bg-red-500" 
                    />
                    <h6 className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40 whitespace-nowrap">MISSION ONYX SÉCURISÉE</h6>
                  </div>
                  <p className="text-sm md:text-lg font-black italic uppercase tracking-tighter leading-none truncate">{activeSession.title}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 shrink-0">
                <div className={`flex flex-col items-end px-4 py-2 rounded-2xl border ${isSolar ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'}`}>
                   <span className="text-[7px] font-black uppercase tracking-widest opacity-30 mb-0.5">CHRONO-ONYX</span>
                   <span className="text-xl md:text-2xl font-black font-mono leading-none tracking-tighter tabular-nums">{formatTime(sessionTimeLeft)}</span>
                </div>
                <button 
                  onClick={stopDrillSession}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all active:scale-90 ${
                    isSolar ? 'border-black hover:bg-black hover:text-white' : 'border-white/20 hover:border-red-500 hover:text-red-500'
                  }`}
                >
                  <X size={20} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Tactical Briefing Modal */}
      <AnimatePresence>
        {sessionBriefing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className={`w-full max-w-2xl p-8 rounded-[3rem] border-2 shadow-2xl relative ${
                isSolar ? 'bg-white border-black' : 'bg-zinc-900 border-[#c9964a]'
              }`}
            >
              <button 
                onClick={() => setSessionBriefing(null)}
                className="absolute top-8 right-8 w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-[#c9964a] text-black flex items-center justify-center">
                  <Target size={32} />
                </div>
                <div>
                  <h6 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-1">MÉMORANDUM TACTIQUE</h6>
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none">{sessionBriefing.title}</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="space-y-6">
                  <div>
                    <h6 className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-3 flex items-center gap-2">
                       <GraduationCap size={10} /> THÉORIE DU JOUR
                    </h6>
                    <p className="text-sm font-bold italic opacity-80 leading-relaxed border-l-2 border-[#c9964a] pl-4">
                      "{sessionBriefing.theory || sessionBriefing.description}"
                    </p>
                  </div>

                  <div>
                     <h6 className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-3">POINTS DE PASSAGE</h6>
                     <div className="space-y-2">
                        {(sessionBriefing.masteryPoints || ['Impact centré', 'Rythme régulier', 'Poste propre']).map((pt, i) => (
                           <div key={i} className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#c9964a]" />
                              <span className="text-[10px] font-black uppercase tracking-tight">{pt}</span>
                           </div>
                        ))}
                     </div>
                  </div>
                </div>

                <div className="h-full min-h-[200px] rounded-3xl bg-black/40 border border-white/5 flex flex-col items-center justify-center p-6 text-center">
                   <h6 className="text-[8px] font-black uppercase tracking-widest opacity-30 mb-4 self-start">VISUALISATION 3D</h6>
                   <div className="relative w-full aspect-video flex items-center justify-center">
                      <svg viewBox="0 0 200 100" className="w-full h-full stroke-[#c9964a] fill-none opacity-60">
                         <path d="M20,80 Q100,20 180,80" strokeWidth="2" strokeDasharray="5 3" />
                         <motion.circle 
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           transition={{ duration: 1, repeat: Infinity }}
                           cx="180" cy="80" r="4" fill="#c9964a" 
                         />
                         <text x="30" y="20" className="fill-white/20 text-[6px] font-mono uppercase">Vecteur A-B</text>
                      </svg>
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c9964a] mt-4">
                      Précision de Caisse : 98%
                   </p>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => confirmStartSession(sessionBriefing)}
                  className="flex-1 py-5 rounded-[2rem] bg-[#c9964a] text-black font-black uppercase tracking-[0.4em] text-xs shadow-2xl shadow-[#c9964a]/20 hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <Play size={14} fill="currentColor" />
                  DÉPLOYER UNITÉ ONYX • {Math.floor(sessionBriefing.duration / 60)}:00
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Session Content Context (Integrated, not fixed) */}
      <AnimatePresence>
        {activeSession && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`w-full p-6 md:p-8 rounded-[2.5rem] border-2 shadow-2xl mb-12 backdrop-blur-2xl flex flex-col gap-8 relative z-10 overflow-hidden ${
              isSolar ? 'bg-zinc-50 border-black shadow-black/10' : 'bg-zinc-900 border-[#c9964a]/30 shadow-[#c9964a]/5'
            }`}
          >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center animate-pulse ${
                    isSolar ? 'bg-black text-white' : 'bg-[#c9964a] text-black shadow-lg shadow-[#c9964a]/50'
                  }`}>
                    <Brain size={28} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <h6 className="text-[8px] font-black uppercase tracking-widest opacity-40 leading-none">Équipement Stratégique</h6>
                    </div>
                    <p className="text-xl md:text-2xl font-black italic uppercase tracking-tighter leading-none">{activeSession.title}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                   <button 
                      onClick={() => activeSession && handleDrillSpeak(activeSession)}
                      disabled={isDrillSpeaking}
                      className={`flex-1 md:flex-none h-14 px-6 rounded-2xl flex items-center justify-center gap-3 border-2 transition-all ${
                        isSolar ? 'border-black text-black hover:bg-black/5' : 'border-[#c9964a]/20 hover:border-[#c9964a] text-[#c9964a]'
                      }`}
                    >
                      {isDrillSpeaking ? <Loader2 size={18} className="animate-spin" /> : <Volume2 size={18} />}
                      <span className="text-[10px] font-black uppercase tracking-widest">Écouter</span>
                    </button>
                    <button 
                      onClick={() => {
                        if (!selectedTeacher) setSelectedTeacher('marcus');
                        setShowTeacherChat(!showTeacherChat);
                      }}
                      className={`flex-1 md:flex-none h-14 px-6 rounded-2xl flex items-center justify-center gap-3 border-2 transition-all relative overflow-hidden group ${
                        showTeacherChat ? 'bg-[#c9964a] border-[#c9964a] text-black shadow-[#c9964a]/30' : (isSolar ? 'border-black text-black hover:bg-black/5' : 'border-[#c9964a]/40 hover:border-[#c9964a] text-[#c9964a]')
                      }`}
                    >
                      <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                      <MessageSquare size={18} className="relative z-10" />
                      <span className="text-[10px] font-black uppercase tracking-widest relative z-10">Chat Guru</span>
                    </button>
                </div>
              </div>

              {/* Validation Points & Performance Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                {/* 3-Point Validation */}
                <div className={`p-6 rounded-3xl border flex flex-col h-full ${isSolar ? 'bg-zinc-100 border-zinc-200' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex items-center justify-between mb-6">
                    <h6 className="text-[8px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                       <ShieldCheck size={12} className="text-[#c9964a]" /> POINTS DE MAÎTRISE
                    </h6>
                    <span className="text-[10px] font-black text-[#c9964a] px-3 py-1 rounded-full bg-[#c9964a]/10">
                      ÉTAT: {validatedPoints.length}/{(activeSession.masteryPoints?.length || 3)}
                    </span>
                  </div>
                  <div className="space-y-4 flex-1">
                    {(activeSession.masteryPoints || ['Impact centré', 'Rythme Onyx', 'Poste Parfait']).map((point, i) => (
                      <button 
                        key={`mastery-point-${i}`}
                        onClick={() => togglePoint(point)}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all group ${
                          validatedPoints.includes(point)
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500 shadow-lg shadow-emerald-500/10'
                            : 'bg-black/20 border-white/5 text-white/40 hover:border-white/20'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                          validatedPoints.includes(point) ? 'bg-emerald-500 border-emerald-500' : 'border-current opacity-30 group-hover:opacity-60'
                        }`}>
                          {validatedPoints.includes(point) && <CheckCircle2 size={14} className="text-black" />}
                        </div>
                        <span className="text-sm font-black uppercase tracking-tight text-left flex-1">{point}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Performance Box (Repetitions Counter) */}
                <div className={`p-6 rounded-3xl border flex flex-col h-full ${isSolar ? 'bg-zinc-100 border-zinc-200' : 'bg-black/80 border-[#c9964a]/20 shadow-2xl relative overflow-hidden'}`}>
                  {/* Decorative Scan Line */}
                  <motion.div 
                    animate={{ x: ['100%', '-100%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute top-0 bottom-0 w-px bg-[#c9964a]/20 blur-[2px] opacity-30 h-full pointer-events-none"
                  />
                  
                  <div className="flex items-center justify-between mb-8">
                     <h6 className="text-[8px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                       <Activity size={12} className="text-[#c9964a]" /> BOX DE PERFORMANCE
                     </h6>
                     <div className="flex gap-1">
                        <div className="w-1 h-1 rounded-full bg-[#c9964a] animate-ping" />
                        <div className="w-1 h-1 rounded-full bg-[#c9964a] opacity-30" />
                     </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center space-y-8">
                    <div className="flex items-center justify-around">
                      <div className="text-center group cursor-pointer" onClick={() => setDrillReps(prev => prev + 1)}>
                        <p className="text-[8px] font-black uppercase tracking-widest opacity-30 mb-2 group-hover:text-[#c9964a] transition-colors">Répétitions</p>
                        <p className="text-5xl font-black font-mono tracking-tighter tabular-nums group-active:scale-125 transition-transform">{drillReps}</p>
                      </div>
                      <div className="w-px h-12 bg-white/10" />
                      <div className="text-center group cursor-pointer" onClick={() => setDrillSuccess(prev => prev + 1)}>
                        <p className="text-[8px] font-black uppercase tracking-widest opacity-30 mb-2 group-hover:text-emerald-500 transition-colors">Succès</p>
                        <p className="text-5xl font-black font-mono tracking-tighter tabular-nums text-emerald-500 group-active:scale-125 transition-transform">{drillSuccess}</p>
                      </div>
                    </div>

                   <div className="grid grid-cols-2 gap-4 mt-6">
                      <button 
                        onClick={() => setDrillReps(prev => Math.max(0, prev - 1))}
                        className={`py-4 rounded-2xl border-2 font-black uppercase tracking-widest text-[8px] transition-all ${isSolar ? 'border-black text-black' : 'border-white/20 text-white/60 hover:border-white/40 hover:text-white'}`}
                      >
                        -1 REP
                      </button>
                      <button 
                        onClick={() => {
                          setDrillReps(prev => prev + 1);
                          setDrillSuccess(prev => prev + 1);
                          playPing(1200, 'sine', 0.1, 0.05);
                        }}
                        className={`py-4 rounded-2xl font-black uppercase tracking-widest text-[8px] transition-all shadow-xl active:scale-95 ${
                          isSolar ? 'bg-black text-white' : 'bg-emerald-500 text-black shadow-emerald-500/30'
                        }`}
                      >
                        +1 SUCCÈS
                      </button>
                   </div>
                  </div>

                  <div className={`mt-8 p-4 rounded-2xl border bg-black/40 ${isSolar ? 'border-zinc-200' : 'border-white/5'}`}>
                    <div className="flex justify-between items-center mb-1">
                       <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Taux de Précision Tactique</span>
                       <span className="text-[10px] font-black font-mono text-emerald-500">{drillReps > 0 ? Math.round((drillSuccess / drillReps) * 100) : 0}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                       <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${drillReps > 0 ? (drillSuccess / drillReps) * 100 : 0}%` }}
                          className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                       />
                    </div>
                  </div>
                </div>
              </div>

              <button 
                  onClick={() => validateDrill(activeSession.id)}
                  disabled={completedDrills.includes(activeSession.id)}
                  className={`w-full h-16 rounded-2xl flex items-center justify-center gap-4 border-2 font-black uppercase tracking-[0.4em] text-xs transition-all shadow-2xl ${
                    completedDrills.includes(activeSession.id)
                      ? 'bg-emerald-500 border-emerald-500 text-black'
                      : (validatedPoints.length === (activeSession.masteryPoints?.length || 3)
                        ? 'bg-[#c9964a] border-[#c9964a] text-black shadow-[#c9964a]/50 scale-105 active:scale-95'
                        : (isSolar ? 'border-black hover:bg-black/5 text-black' : 'border-white/20 hover:border-white/40 text-white/60 hover:bg-white/5 grayscale'))
                  }`}
                >
                  <CheckCircle2 size={24} /> 
                  <span className="mt-0.5">{completedDrills.includes(activeSession.id) ? 'MAÎTRISE ACQUISE' : 'VALIDER MAÎTRISE'}</span>
                </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTeacherChat && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-lg h-[75vh] rounded-[3.5rem] border-2 z-[100] overflow-hidden flex flex-col backdrop-blur-3xl shadow-2xl transition-all duration-500 ${
              isSolar ? 'bg-white/40 border-black/20 shadow-black/10 text-black' : 'bg-black/40 border-[#c9964a]/20 shadow-[#c9964a]/10 text-white'
            }`}
          >
             {/* Mini Chat Header */}
             <div className="p-8 border-b border-current/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-black text-[#c9964a] flex items-center justify-center border border-[#c9964a]/30">
                      {selectedTeacher ? (
                        <img src={TEACHERS[selectedTeacher].avatar} className="w-full h-full rounded-xl object-cover" />
                      ) : (
                        <GraduationCap size={20} />
                      )}
                   </div>
                   <div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">
                        {selectedTeacher ? TEACHERS[selectedTeacher].name : "ACADÉMIE ONYX"}
                      </h3>
                      <p className="text-[8px] font-black opacity-40 uppercase tracking-widest">
                        {selectedTeacher ? TEACHERS[selectedTeacher].focus : "Intelligence Mentorielle Active"}
                      </p>
                   </div>
                </div>
                <div className="flex gap-2">
                   <div className="flex -space-x-2">
                      <button 
                        onClick={() => {
                          setSelectedTeacher('marcus');
                          loadTeacherCoaching('marcus');
                        }} 
                        className={`w-8 h-8 rounded-full border overflow-hidden hover:scale-110 transition-transform ${selectedTeacher === 'marcus' ? 'border-[#c9964a] z-10' : 'border-white/20 opacity-40 hover:opacity-100'}`}
                      >
                         <img src={TEACHERS.marcus.avatar} className="w-full h-full object-cover" />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedTeacher('elena');
                          loadTeacherCoaching('elena');
                        }} 
                        className={`w-8 h-8 rounded-full border overflow-hidden hover:scale-110 transition-transform ${selectedTeacher === 'elena' ? 'border-[#c9964a] z-10' : 'border-white/20 opacity-40 hover:opacity-100'}`}
                      >
                         <img src={TEACHERS.elena.avatar} className="w-full h-full object-cover" />
                      </button>
                   </div>
                   <button onClick={() => setShowTeacherChat(false)} className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center ml-2 hover:bg-white/5 transition-colors">
                      <X size={14} />
                   </button>
                </div>
             </div>

             {/* Chat History */}
             <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                {teacherChat.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-30">
                    <Brain size={48} className="mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                      Adam : La Faculté est à votre disposition. <br/> Posez vos questions techniques sur votre jeu ou sur cet exercice.
                    </p>
                  </div>
                ) : (
                  teacherChat.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-[#c9964a] text-black font-bold rounded-tr-none' 
                          : 'bg-white/5 text-white/90 rounded-tl-none border border-white/5 shadow-inner'
                      }`}>
                        {msg.parts[0].text}
                      </div>
                    </div>
                  ))
                )}
                {isTeacherLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl rounded-tl-none">
                      <Loader2 size={16} className="animate-spin opacity-40" />
                    </div>
                  </div>
                )}
             </div>

             {/* Input Area */}
             <div className="p-6 border-t border-white/10 bg-black/20">
                <div className="relative">
                  <input
                    type="text"
                    value={teacherInput}
                    onChange={(e) => setTeacherInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTeacherChat(teacherInput)}
                    placeholder={isHandsFree ? "Adam & Facultés vous écoutent..." : "Échangez avec l'Académie..."}
                    className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-6 pr-24 text-xs font-bold focus:border-[#c9964a] outline-none transition-all placeholder:opacity-30"
                  />
                  <div className="absolute right-2 top-2 flex gap-2">
                    {isHandsFree && (
                      <div className="w-10 h-10 rounded-xl bg-[#c9964a] text-black flex items-center justify-center animate-pulse">
                         <Mic size={16} />
                      </div>
                    )}
                    <button 
                      onClick={() => handleTeacherChat(teacherInput)}
                      disabled={isTeacherLoading || !teacherInput.trim()}
                      className={`w-10 h-10 rounded-xl bg-[#c9964a] text-black flex items-center justify-center transition-opacity ${(!teacherInput.trim() || isTeacherLoading) ? 'opacity-20' : 'hover:scale-105'}`}
                    >
                       <Zap size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-[7px] font-black uppercase tracking-widest opacity-20 mt-3 text-center">
                  SÉESSION SÉCURISÉE • PROTOCOLE ADAM V2.1
                </p>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Academy Elite Header */}
      <div className="relative h-72 rounded-[3.5rem] overflow-hidden group shadow-2xl border-4 border-white/5">
        <img 
          src="https://images.unsplash.com/photo-1587174486073-ae5e5cff47bc?q=80&w=2670&auto=format&fit=crop" 
          alt="Practice Onyx"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className={`absolute inset-0 transition-opacity ${isSolar ? 'bg-white/30' : 'bg-gradient-to-b from-black/60 via-black/20 to-black'}`} />
        
        {/* Scanning Effect Overlay */}
        {!isSolar && (
          <motion.div 
            animate={{ y: ['-100%', '200%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-b from-transparent via-[#c9964a]/10 to-transparent h-[50%] pointer-events-none"
          />
        )}
        
        <div className="absolute inset-0 p-10 flex flex-col justify-end">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-[2px] bg-[#c9964a]" />
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#c9964a]">ONYX PERFORMANCE HUB</span>
            </div>
            <h1 className="text-6xl font-black italic uppercase tracking-tighter text-white leading-none">
              ACADÉMIE
            </h1>
          </div>
        </div>

        <div className="absolute top-10 right-10">
          <div className="p-1 px-4 rounded-full border-2 border-white/20 backdrop-blur-md bg-white/5 flex items-center gap-3">
             <div className="flex -space-x-4">
                  <button 
                    onClick={() => {
                      loadTeacherCoaching('marcus');
                      setShowTeacherChat(true);
                    }}
                    className="w-10 h-10 rounded-full border-2 border-black object-cover hover:scale-110 transition-transform hover:z-10 relative"
                  >
                    <img src={TEACHERS.marcus.avatar} className="w-full h-full rounded-full object-cover" />
                  </button>
                  <button 
                    onClick={() => {
                      loadTeacherCoaching('elena');
                      setShowTeacherChat(true);
                    }}
                    className="w-10 h-10 rounded-full border-2 border-black object-cover hover:scale-110 transition-transform hover:z-10 relative"
                  >
                    <img src={TEACHERS.elena.avatar} className="w-full h-full rounded-full object-cover" />
                  </button>
             </div>
             <span className="text-[10px] font-bold text-white italic">CONSULTER FACULTÉ</span>
          </div>
        </div>
      </div>

      {/* Tab Selection Navigation */}
      <div className="flex gap-2 p-1.5 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-xl">
        {(['plan', 'catalogue', 'competition'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative flex-1 h-12 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${
              activeTab === tab 
                ? (isSolar ? 'bg-black text-white shadow-lg' : 'bg-[#c9964a] text-black shadow-lg shadow-[#c9964a]/20') 
                : (isSolar ? 'text-black/40 hover:text-black hover:bg-black/5' : 'text-white/60 hover:text-white hover:bg-white/5')
            }`}
          >
            {tab === 'plan' ? 'Mon Plan' : tab === 'catalogue' ? 'Catalogue' : 'Compétition'}
            {activeTab === tab && (
              <motion.div 
                layoutId="activeTabUnderline"
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-current rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* Top Stats Grid - Only show in Plan / Catalogue */}
      {activeTab !== 'competition' && (
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-6 rounded-[2.5rem] border-2 shadow-2xl relative overflow-hidden group ${isSolar ? 'bg-white border-black' : 'bg-black/80 border-[#c9964a]/20 shadow-[#c9964a]/5'}`}>
             <motion.div 
               animate={{ x: ['100%', '-100%'] }}
               transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
               className="absolute top-0 bottom-0 w-px bg-[#c9964a]/10 blur-[2px] opacity-30 h-full pointer-events-none"
             />
             <div className="flex items-center gap-2 mb-3">
               <Trophy size={14} className={isSolar ? 'text-black' : 'text-[#c9964a]'} />
               <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40">Missions Terminées</span>
             </div>
             <div className="flex items-end gap-2">
               <p className="text-4xl font-black italic font-mono tracking-tighter tabular-nums">12</p>
               <span className="text-[10px] font-black opacity-20 mb-1">UNITÉS</span>
             </div>
          </div>

          <div className={`p-6 rounded-[2.5rem] border-2 shadow-2xl relative overflow-hidden group ${isSolar ? 'bg-white border-black' : 'bg-black/95 border-[#c9964a]/60 shadow-[#c9964a]/20 translate-y-[-2px]'}`}>
             <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                <Target size={80} strokeWidth={1} className={getLevelColor()} />
             </div>
             
             <motion.div 
               animate={{ y: ['-100%', '300%'] }}
               transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
               className="absolute left-0 right-0 h-px bg-white/30 blur-[2px] opacity-40 w-full pointer-events-none"
             />

             <div className="flex items-center gap-2 mb-4">
               <div className={`p-1.5 rounded-lg ${isSolar ? 'bg-black text-white' : 'bg-[#c9964a]/20 text-[#c9964a]'}`}>
                 <Star size={14} className={getLevelColor()} />
               </div>
               <span className="text-[9px] font-black uppercase tracking-[0.5em] opacity-60">SÉLECTION TACTIQUE</span>
             </div>

             <div className="flex flex-col relative z-10">
               <motion.p 
                 key={getTechnicalLevel()}
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
                 className={`text-3xl md:text-5xl font-black italic uppercase tracking-tighter leading-none mb-2 ${getLevelColor()} drop-shadow-[0_0_20px_rgba(201,150,74,0.3)]`}
               >
                 {getTechnicalLevel()}
               </motion.p>
               <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full animate-pulse shadow-[0_0_15px_rgba(201,150,74,1)] ${isSolar ? 'bg-black' : 'bg-[#c9964a]'}`} />
                  <span className="text-[8px] font-black uppercase tracking-[0.4em] opacity-40 whitespace-nowrap">MODULE ONYX CORE V2.0.4</span>
               </div>
             </div>
          </div>
        </div>
      )}

      {/* Competition Tab Content */}
      {activeTab === 'competition' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center space-y-2">
            <h3 className="text-4xl font-black italic uppercase tracking-tighter text-[#c9964a]">ARENA DE PRÉPARATION</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Missions de Progression Onyx</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { id: 'rookie', label: 'NEW GEN', icon: Zap, sub: 'Débutant (Index 36-54)', color: 'text-blue-500' },
              { id: 'grinder', label: 'GRINDER', icon: Activity, sub: 'Amateur (Index 18-36)', color: 'text-emerald-500' },
              { id: 'challenger', label: 'CHALLENGER', icon: Target, sub: 'Amateur Pro (Index 5-18)', color: 'text-amber-500' },
              { id: 'tour', label: 'TOUR PRO', icon: Trophy, sub: 'Pro (Index < 5)', color: 'text-red-500' }
            ].map(status => {
              const unlocked = isLevelUnlocked(status.id);
              return (
                <motion.button
                  key={status.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedArenaLevel(status.id)}
                  className={`p-8 rounded-[3rem] border-4 text-left transition-all relative overflow-hidden group ${
                    isSolar ? 'bg-white border-zinc-200' : 'bg-black/60 border-white/5 hover:border-[#c9964a]/50'
                  } ${!unlocked ? 'opacity-50 grayscale' : ''}`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${isSolar ? 'bg-zinc-100' : 'bg-white/5 shadow-inner'}`}>
                    <status.icon className={status.color} size={28} />
                  </div>
                  <h4 className="font-black italic uppercase tracking-tighter text-2xl mb-1">{status.label}</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4">{status.sub}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                      unlocked ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white/40'
                    }`}>
                      {unlocked ? 'Prêt' : 'Verrouillé'}
                    </div>
                    <ChevronRight size={16} className={unlocked ? 'text-emerald-500' : 'opacity-20'} />
                  </div>

                  {!unlocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                       <Lock size={32} className="text-[#c9964a] opacity-50" />
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 h-[3px] bg-gradient-to-r from-transparent via-[#c9964a]/20 to-transparent w-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence>
            {selectedArenaLevel && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
              >
                <div className={`w-full max-w-xl rounded-[3rem] border-2 p-10 overflow-hidden relative ${
                  isSolar ? 'bg-white border-black' : 'bg-zinc-900 border-[#c9964a]/50'
                }`}>
                  <button 
                    onClick={() => setSelectedArenaLevel(null)}
                    className="absolute top-8 right-8 w-10 h-10 rounded-full flex items-center justify-center border border-white/10 hover:bg-white/5"
                  >
                    <X size={20} />
                  </button>

                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-[#c9964a] text-black flex items-center justify-center">
                      <GraduationCap size={32} />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black italic uppercase tracking-tighter text-[#c9964a]">
                        OBECTIF {selectedArenaLevel === 'rookie' ? 'NEW GEN' : selectedArenaLevel.toUpperCase()}
                      </h3>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Prérequis Techniques de Niveau</p>
                    </div>
                  </div>

                  <div className="p-4 mb-6 rounded-2xl bg-[#c9964a]/10 border border-[#c9964a]/20 flex gap-4 items-center">
                    <Quote size={16} className="text-[#c9964a] shrink-0" />
                    <p className="text-[11px] italic font-bold">
                       {selectedArenaLevel === 'rookie' && "Adam : La base est tout. Ne fuyez pas les fondamentaux."}
                       {selectedArenaLevel === 'grinder' && "Adam : Le travail acharné bat le talent quand le talent ne travaille pas."}
                       {selectedArenaLevel === 'challenger' && "Adam : À ce niveau, chaque détail compte. La précision devient votre langue maternelle."}
                       {selectedArenaLevel === 'tour' && "Adam : La pression est un privilège. Montrez-moi de quoi vous êtes capable sous le feu."}
                    </p>
                  </div>

                  <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                    {getArenaDrills(selectedArenaLevel).map(drill => {
                      const isDone = completedDrills.includes(drill.id);
                      return (
                        <div key={`arena-drill-${drill.id}`} className={`p-6 rounded-2xl border transition-all ${
                          isDone ? 'bg-emerald-500/10 border-emerald-500/40 shadow-inner' : 'bg-white/10 border-white/20'
                        } flex items-center justify-between group hover:border-[#c9964a]/50 shadow-lg`}>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className={`text-sm font-black italic uppercase tracking-tight ${isDone ? 'text-emerald-500' : ''}`}>
                                {drill.title}
                              </h4>
                              {isDone && <CheckCircle2 size={12} className="text-emerald-500" />}
                            </div>
                            <div className="flex items-center gap-3 opacity-40">
                               <span className="text-[9px] font-black uppercase tracking-widest">{drill.category}</span>
                               <span className="w-1 h-1 rounded-full bg-[#c9964a]" />
                               <span className="text-[9px] font-black uppercase tracking-widest text-[#c9964a]">{drill.focus}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {isDone && (
                              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded">MAÎTRISÉ</span>
                            )}
                            <button 
                              onClick={() => {
                                handleStartRequest(drill);
                              }}
                              className={`px-6 py-2 rounded-xl text-black text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2 ${
                                isDone ? 'bg-emerald-500' : 'bg-[#c9964a]'
                              }`}
                            >
                              <Play size={10} fill="currentColor" /> {isDone ? 'REFAIRE' : 'DÉMARRER'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className={`mt-10 p-6 rounded-2xl border-2 border-dashed ${isSolar ? 'bg-zinc-50 border-zinc-200' : 'bg-[#c9964a]/5 border-[#c9964a]/20'}`}>
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Missions de Niveau Accomplies</span>
                       <span className="text-[10px] font-black font-mono">
                          {getArenaDrills(selectedArenaLevel || '').filter(d => completedDrills.includes(d.id)).length} / {getArenaDrills(selectedArenaLevel || '').length}
                       </span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mb-4">
                       <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(getArenaDrills(selectedArenaLevel || '').filter(d => completedDrills.includes(d.id)).length / getArenaDrills(selectedArenaLevel || '').length) * 100}%` }}
                          className={`h-full ${
                             (getArenaDrills(selectedArenaLevel || '').filter(d => completedDrills.includes(d.id)).length / getArenaDrills(selectedArenaLevel || '').length) >= 0.8
                             ? 'bg-emerald-500' : 'bg-[#c9964a]'
                          }`}
                       />
                    </div>
                    <p className="text-[10px] italic opacity-60 leading-relaxed text-center">
                      "Adam : La maîtrise de ces piliers ({getArenaDrills(selectedArenaLevel || '').length} modules) est obligatoire pour valider votre échelon supérieur. Concentrez-vous sur l'exécution parfaite."
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={`p-8 rounded-[3.5rem] border-2 border-dashed ${isSolar ? 'bg-zinc-50 border-zinc-200' : 'bg-[#c9964a]/5 border-[#c9964a]/20'}`}>
            <div className="flex items-center gap-4 mb-6">
              <ShieldAlert className="text-red-500" />
              <h4 className="text-base font-black uppercase tracking-widest italic">Analyse de Régularité ADAM</h4>
            </div>
            <div className="space-y-4">
              <p className="text-xs italic opacity-70 leading-relaxed text-justify">
                "Votre ascension dans l'Arena est dictée par votre performance réelle. Adam analyse chaque tour, chaque pression. Pour débloquer les niveaux supérieurs (GRINDER, CHALLENGER, TOUR PRO), vous devez maintenir une régularité de performance sur 10 sorties consécutives."
              </p>
              <div className="flex items-center gap-2">
                <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '15%' }}
                    className="h-full bg-[#c9964a]"
                  />
                </div>
                <span className="text-[10px] font-black font-mono">15%</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Catalogue Tab Container */}
      {activeTab === 'catalogue' && (
        <div className="space-y-12">
          {/* Elite Faculty bible header */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 px-2">
              <GraduationCap size={16} className={isSolar ? 'text-black' : 'text-[#c9964a]'} />
              <h3 className="text-xs font-black uppercase tracking-[0.3em] italic">La Bible Onyx : Faculté Élite</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {Object.entries(TEACHERS).map(([key, t]) => (
                <motion.button
                  key={`teacher-faculty-btn-${key}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => loadTeacherCoaching(key as 'marcus' | 'elena')}
                  className={`relative overflow-hidden rounded-[2.5rem] border-2 h-72 group transition-all ${
                    isSolar ? 'border-zinc-200' : 'border-[#c9964a]/30'
                  }`}
                >
                  <img 
                    src={t.avatar} 
                    alt={t.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-110 duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                  
                  <div className="absolute inset-0 p-6 flex flex-col justify-end text-left">
                    <div className="bg-[#c9964a] text-black px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest w-fit mb-2">
                      {t.focus}
                    </div>
                    <h4 className="text-xl font-black italic uppercase tracking-tighter text-white leading-none">
                      {t.name}
                    </h4>
                    <p className="text-[8px] font-black uppercase tracking-widest text-[#c9964a] mb-2">{t.title}</p>
                    <p className="text-[9px] text-white/60 line-clamp-2 leading-relaxed italic">
                      {t.description}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>

            <AnimatePresence>
              {selectedTeacher && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className={`p-8 rounded-[3rem] border-2 shadow-2xl relative overflow-hidden ${
                    isSolar ? 'bg-white border-black' : 'bg-zinc-900 border-[#c9964a]/50'
                  }`}
                >
                  {/* Prestige Background Element */}
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <GraduationCap size={120} />
                  </div>

                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#c9964a]">
                        <img src={TEACHERS[selectedTeacher].avatar} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h5 className="text-2xl font-black italic uppercase tracking-tighter leading-none text-[#c9964a]">
                          {TEACHERS[selectedTeacher].name}
                        </h5>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mt-1">
                          {TEACHERS[selectedTeacher].title} • {TEACHERS[selectedTeacher].philosophy}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedTeacher(null)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                        isSolar ? 'border-zinc-200 hover:bg-zinc-100' : 'border-white/10 hover:bg-white/5'
                      }`}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {isTeacherLoading ? (
                      <div className="py-12 flex flex-col items-center gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-[#c9964a]" />
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">
                          Transmission du dossier technique en cours...
                        </p>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                      >
                        <div className="flex justify-between items-center bg-white/5 p-2 rounded-2xl border border-white/10">
                        <div className="flex gap-1 items-center">
                          {(['pro', 'casual'] as const).map(mode => (
                            <button
                              key={mode}
                              onClick={() => setCommMode(mode)}
                              className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${
                                commMode === mode 
                                  ? (isSolar ? 'bg-black text-white' : 'bg-[#c9964a] text-black shadow-lg shadow-[#c9964a]/20') 
                                  : (isSolar ? 'text-black/40 hover:text-black' : 'text-white/70 hover:text-white hover:bg-white/5')
                              }`}
                            >
                              {mode === 'pro' ? 'PROFESSIONNEL' : 'FAMILIER'}
                            </button>
                          ))}
                        </div>
                          <div className="flex items-center gap-2 px-3 text-[8px] font-black uppercase tracking-widest text-[#c9964a]">
                            <Activity size={12} /> MODE ONYX ACTIF
                          </div>
                        </div>

                        <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto no-scrollbar pb-4">
                          {teacherChat.map((msg, idx) => (
                            <div key={`teacher-msg-${idx}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                                msg.role === 'user' 
                                  ? (isSolar ? 'bg-black text-white shadow-xl' : 'bg-[#c9964a] text-black font-bold shadow-lg shadow-[#c9964a]/20') 
                                  : (isSolar ? 'bg-zinc-100 border border-zinc-200 text-zinc-800' : 'bg-white/5 border border-white/10 text-white/90 backdrop-blur-md')
                              }`}>
                                {msg.parts[0].text}
                              </div>
                            </div>
                          ))}
                          {isTeacherLoading && (
                            <div className="flex justify-start">
                              <div className="bg-white/5 p-4 rounded-2xl flex items-center gap-4">
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4].map(i => (
                                    <motion.div
                                      key={`teacher-loader-bar-${i}`}
                                      animate={{ height: [8, 16, 8] }}
                                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                      className="w-1 bg-[#c9964a] rounded-full"
                                    />
                                  ))}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Analyse du Maître...</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-4">
                          <div className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${
                            isSolar ? 'bg-white border-zinc-200 focus-within:border-black' : 'bg-black/40 border-white/5 focus-within:border-[#c9964a]/50 shadow-inner'
                          }`}>
                            <input 
                              type="text"
                              value={teacherInput}
                              onChange={(e) => setTeacherInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleTeacherChat(teacherInput)}
                              placeholder={`Parler à ${TEACHERS[selectedTeacher!].name}...`}
                              className="flex-1 bg-transparent outline-none text-xs font-bold py-2"
                            />
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => setIsHandsFree(!isHandsFree)}
                                className={`group relative w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                                  isHandsFree ? 'bg-[#c9964a] text-black shadow-lg shadow-[#c9964a]/40' : (isSolar ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200' : 'bg-white/10 text-white/70 hover:text-[#c9964a] hover:bg-white/20')
                                }`}
                              >
                                {isHandsFree && (
                                  <motion.div 
                                    className="absolute inset-0 rounded-full border-2 border-[#c9964a]"
                                    animate={{ scale: [1, 1.4], opacity: [1, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                  />
                                )}
                                {isHandsFree ? (
                                  <div className="flex items-end gap-0.5 h-3">
                                    {[1, 2, 3, 2, 1].map((h, i) => (
                                      <motion.div
                                        key={`voice-bar-${i}`}
                                        animate={{ height: [4, 12, 4] }}
                                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                                        className="w-0.5 bg-black rounded-full"
                                      />
                                    ))}
                                  </div>
                                ) : <Mic size={18} />}
                              </button>
                              <button 
                                onClick={() => handleTeacherChat(teacherInput)}
                                disabled={!teacherInput.trim()}
                                className="w-12 h-12 rounded-full bg-[#c9964a] text-black flex items-center justify-center disabled:opacity-30 shadow-lg shadow-[#c9964a]/20 hover:scale-105 active:scale-95 transition-transform"
                              >
                                <ChevronRight size={24} />
                              </button>
                            </div>
                          </div>
                          {isHandsFree && (
                            <div className="text-center">
                              <p className="text-[7px] font-black uppercase tracking-[0.3em] text-[#c9964a] animate-pulse">
                                "Hey Tee, comment je peux améliorer mon rythme ?"
                              </p>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className={`p-6 rounded-[2rem] border-2 flex flex-col gap-4 ${
                              isSolar ? 'bg-zinc-50 border-zinc-200' : 'bg-[#c9964a]/5 shadow-inner border-[#c9964a]/10'
                            }`}>
                            <div className="flex items-center gap-2">
                              <TimerIcon size={16} className="text-[#c9964a]" />
                              <span className="text-[10px] font-black uppercase tracking-widest italic">Plan Focus Catalogue</span>
                            </div>
                            
                            <div className="space-y-3">
                              {[
                                { title: "Séquence Rythme Onyx", time: 600 },
                                { title: "Focus Visualisation", time: 300 },
                                { title: "Drill de Connexion", time: 600 }
                              ].map((d, i) => (
                                <div key={`teacher-drill-mini-${i}`} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                                  <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[#c9964a]">EXERCICE 0{i + 1}</span>
                                    <span className="text-[11px] font-bold">{d.title}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black opacity-40 italic">{d.time / 60} MIN</span>
                                    <PlayCircle 
                                      size={18} 
                                      className="text-[#c9964a] cursor-pointer hover:scale-110 transition-transform" 
                                      onClick={() => startDrillSession({
                                        id: `teacher-drill-${i}`,
                                        title: d.title,
                                        category: 'STRATÉGIE',
                                        description: `Session prescrite par ${TEACHERS[selectedTeacher!].name} pour affiner votre DNA technique.`,
                                        duration: d.time,
                                        difficulty: 'TOUR PRO',
                                        focus: d.title,
                                        theory: `Conseil d'élite : Travaillez sur la transition et le rythme.`,
                                        steps: [`Préparez votre club`, `Ouvrez la Vision 3D`, `Exécutez avec fluidité`]
                                      })}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>

                            <button 
                              onClick={() => {
                                fetchProgram();
                                setSelectedTeacher(null);
                              }}
                              className={`mt-2 w-full h-12 rounded-xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[9px] shadow-lg transition-all ${
                                isSolar ? 'bg-black text-white' : 'bg-[#c9964a] text-black shadow-[#c9964a]/20'
                              }`}
                            >
                              <Play size={16} /> APPLIQUER À MON PROGRAMME
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                   )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Mon Plan Tab Container */}
      {activeTab === 'plan' && (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Brain size={16} className={isSolar ? 'text-black' : 'text-[#c9964a]'} />
              {!isSolar && (
                <motion.div 
                  animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-[#c9964a] rounded-full blur-[2px]"
                />
              )}
            </div>
            <h3 className="text-xs font-black uppercase tracking-[0.3em] italic">Analyse & Prescription</h3>
          </div>
          <button 
            onClick={fetchProgram}
            disabled={isLoading}
            className={`p-2 rounded-xl border ${isSolar ? 'bg-zinc-100 border-zinc-200' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
          </button>
        </div>

        {program ? (
          <div className="space-y-6">
            {/* Status Summary */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-6 rounded-[2.5rem] border-2 ${isSolar ? 'bg-white border-black' : 'bg-gradient-to-br from-zinc-900 to-black border-white/10'}`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isSolar ? 'bg-black text-white' : 'bg-[#c9964a] text-black shadow-lg shadow-[#c9964a]/20'}`}>
                  <Brain size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Observation d'ADAM</h4>
                  <p className="text-xs font-bold leading-relaxed italic">"{program.summary}"</p>
                </div>
              </div>
              <div className="h-px bg-current opacity-5 mx-2" />
              <div className="mt-4 flex items-center justify-between px-2">
                <span className="text-[8px] font-black uppercase tracking-widest opacity-30">Diagnostic validé par ONYX CORTEX</span>
                <CheckCircle2 size={12} className="text-emerald-500" />
              </div>
            </motion.div>

            {/* Drills List */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] px-2 opacity-60">PLAN D'ENTRAÎNEMENT REQUIS</h4>
              {program.drills.map((drill, idx) => (
                <motion.div
                  key={`program-drill-${drill.id || idx}-${idx}`}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`border-2 rounded-[2rem] overflow-hidden transition-all ${
                    activeSession?.id === drill.id
                      ? (isSolar ? 'bg-zinc-50 border-black shadow-xl ring-2 ring-black/5' : 'bg-zinc-900/80 border-[#c9964a] shadow-2xl')
                      : (isSolar ? 'bg-white border-zinc-100' : 'bg-white/5 border-white/10 hover:border-white/20')
                  }`}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                       <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                           isSolar ? 'bg-black text-white' : 'bg-[#c9964a] text-black border-black'
                         }`}>
                           <Target size={18} />
                         </div>
                         <div>
                            <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${isSolar ? 'text-zinc-400' : 'text-[#c9964a]'}`}>DRILL {idx + 1} — {drill.focus}</p>
                            <h5 className="font-black italic uppercase tracking-tight leading-none text-lg">{drill.title}</h5>
                         </div>
                       </div>
                    </div>

                    <p className={`text-xs leading-relaxed italic mb-6 px-2 opacity-70`}>
                      {drill.description}
                    </p>

                    <div className="flex items-center justify-between gap-4 mb-6 px-2">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-30">INTENSITÉ</span>
                        <span className="text-xs font-black font-mono">{drill.intensity}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-30">DIFFICULTÉ</span>
                        <div className="flex items-center gap-1">
                          <Flame size={10} className="text-red-600" />
                          <span className="text-xs font-black uppercase italic tracking-tighter">{drill.difficulty}</span>
                        </div>
                      </div>
                    </div>

                      <button 
                        onClick={() => activeSession?.id === (drill.id || `program-drill-${idx}`) ? stopDrillSession() : handleStartRequest({
                          ...drill,
                          id: drill.id || `program-drill-${idx}`,
                          category: drill.category || 'ESSENTIELS',
                          duration: drill.duration || 600,
                          difficulty: drill.difficulty as any || 'TOUR PRO',
                          theory: (drill as any).theory || drill.description,
                          steps: (drill as any).steps || [drill.description]
                        })}
                        className={`w-full py-5 rounded-2xl flex items-center justify-center gap-4 font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl transition-all relative overflow-hidden group active:scale-95 ${
                          activeSession?.id === (drill.id || `program-drill-${idx}`)
                            ? 'bg-red-500 text-white shadow-red-500/30'
                            : (isSolar ? 'bg-black text-white' : 'bg-white text-black hover:bg-[#c9964a] shadow-white/5')
                        }`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        <Play size={16} fill="currentColor" />
                        {activeSession?.id === (drill.id || `program-drill-${idx}`) ? 'ARRÊTER LE PROTOCOLE' : 'DÉPLOYER TACTIQUE'}
                      </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center gap-4 text-center">
            <Loader2 size={40} className="animate-spin opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Génération du protocole technique...</p>
          </div>
        )}
      </div>

                  <div className={`p-8 rounded-[3rem] border-2 border-dashed flex flex-col items-center text-center gap-4 ${isSolar ? 'bg-zinc-50 border-zinc-500' : 'bg-[#c9964a]/10 border-[#c9964a]/30 shadow-2xl shadow-[#c9964a]/5'}`}>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isSolar ? 'bg-black text-white' : 'bg-[#c9964a] text-black shadow-lg shadow-[#c9964a]/30'}`}>
            <Brain size={24} />
          </div>
          <div>
            <h4 className="text-lg font-black italic uppercase tracking-tighter leading-none mb-2">Coach de Swing Vidéo</h4>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Analysez votre propre swing par Vision Artificielle ONYX</p>
          </div>
          <button 
             onClick={() => window.location.hash = '#swing'}
             className={`px-8 py-3 rounded-xl border-2 font-black uppercase tracking-widest text-[10px] transition-all relative overflow-hidden group ${
               isSolar ? 'bg-black text-white border-black' : 'bg-[#c9964a] border-[#c9964a] text-black hover:bg-[#c9964a]/80 shadow-lg shadow-[#c9964a]/20'
             }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <span className="relative z-10">Lancer Analyse</span>
          </button>
       </div>
       
       <p className="text-[8px] font-black uppercase tracking-[0.5em] text-center opacity-20 pt-8 italic">
          AUTOMATIC PROGRESSION MATRIX • V2.1.0
       </p>
    </>
  )}

  {/* Catalog & Dropdown Section */}
  {activeTab === 'catalogue' && (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Filter size={16} className={isSolar ? 'text-black' : 'text-[#c9964a]'} />
            <h3 className="text-xs font-black uppercase tracking-[0.3em] italic">Catalogue Académie</h3>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {['WARMUP', 'ESSENTIELS', 'BIOMÉCANIQUE', 'SCORING ZONE', 'MENTAL', 'STRATÉGIE', 'FUN', 'TOUS'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] whitespace-nowrap border-2 transition-all relative overflow-hidden group ${
                  selectedCategory === cat 
                    ? (isSolar ? 'bg-black text-white border-black scale-105' : 'bg-[#c9964a] text-black border-[#c9964a] scale-105 shadow-[0_0_15px_rgba(201,150,74,0.3)]')
                    : (isSolar ? 'bg-white border-zinc-200 text-zinc-400 hover:border-black hover:text-black' : 'bg-white/10 border-white/10 text-white hover:border-[#c9964a]/50 hover:bg-white/20 shadow-inner shadow-white/5')
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {filteredDrills.map((drill, idx) => (
                <motion.div
                  key={`catalog-drill-${drill.id}-${idx}`}
                  layout
                  className={`rounded-[2.5rem] border-2 shadow-sm transition-all overflow-hidden ${
                    activeSession?.id === drill.id
                      ? (isSolar ? 'bg-zinc-50 border-black shadow-xl ring-2 ring-black/5' : 'bg-zinc-900/80 border-[#c9964a] shadow-2xl')
                      : (isSolar ? 'bg-white border-zinc-100 hover:border-black shadow-md' : 'bg-white/10 border-white/10 hover:border-white/30 shadow-lg')
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                          activeSession?.id === drill.id ? 'bg-[#c9964a] text-black' : 'bg-white/5'
                        }`}>
                          <GraduationCap size={18} />
                        </div>
                        <div>
                          <span className={`text-[7px] font-black uppercase tracking-widest p-1 px-2 rounded-full border ${
                            activeSession?.id === drill.id
                              ? 'border-emerald-500 text-emerald-500 animate-pulse'
                              : (isSolar ? 'border-zinc-200 text-zinc-400' : 'border-white/10 text-white/30')
                          }`}>
                            {activeSession?.id === drill.id ? 'EN COURS' : drill.category}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Flame size={10} className={drill.difficulty === 'TOUR PRO' ? 'text-red-500' : drill.difficulty === 'CHALLENGER' ? 'text-[#c9964a]' : 'text-zinc-500'} />
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-40">{drill.difficulty}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h5 className="font-black italic uppercase tracking-tight text-lg leading-none mb-2">{drill.title}</h5>
                        <p className={`text-xs opacity-60 max-w-lg`}>{drill.description}</p>
                      </div>
                      <button 
                        onClick={() => setExpandedCatalogDrill(expandedCatalogDrill === drill.id ? null : drill.id)}
                        className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border flex items-center gap-2 transition-all ${
                          expandedCatalogDrill === drill.id 
                            ? (isSolar ? 'bg-black text-white' : 'bg-[#c9964a] text-black')
                            : (isSolar ? 'bg-zinc-100 text-black' : 'bg-white/10 text-white hover:bg-white/20')
                        }`}
                      >
                        {expandedCatalogDrill === drill.id ? 'FERMER' : 'LIRE LA BIBLE'} <BookOpen size={10} />
                      </button>
                    </div>

                    <AnimatePresence>
                      {expandedCatalogDrill === drill.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-6 pt-4 mt-4 border-t border-current/10"
                        >
                          <div className={`p-6 rounded-2xl border-l-4 ${isSolar ? 'bg-zinc-50 border-black' : 'bg-white/5 border-[#c9964a]'}`}>
                            <div className="flex items-center gap-2 mb-3">
                              <Quote size={14} className="text-[#c9964a]" />
                              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">La Théorie Limpide</span>
                            </div>
                            <p className="text-sm font-bold italic leading-relaxed">"{drill.theory}"</p>
                          </div>

                          <div className="space-y-3">
                             <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Protocole de Progression Étap-par-Étape</span>
                             {drill.steps.map((step, sIdx) => (
                               <div key={`step-${drill.id}-${sIdx}`} className="flex items-start gap-4">
                                 <div className="w-5 h-5 rounded-full bg-[#c9964a] text-black flex-shrink-0 flex items-center justify-center text-[10px] font-black mt-0.5">
                                   {sIdx + 1}
                                 </div>
                                 <p className="text-xs opacity-80 leading-relaxed font-medium">{step}</p>
                               </div>
                             ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-current/5">
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                          <span className="text-[7px] font-black uppercase tracking-widest opacity-30 mb-1">INTENSITÉ CHRONO</span>
                          <div className="flex items-center gap-2">
                             <Clock size={12} className="opacity-30" />
                             <span className="text-[10px] font-black font-mono">
                                {activeSession?.id === drill.id ? formatTime(sessionTimeLeft) : `${Math.floor(drill.duration / 60)}:00`}
                             </span>
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[7px] font-black uppercase tracking-widest opacity-30 mb-1">FOCUS ONYX</span>
                          <span className="text-[10px] font-black italic">{drill.focus}</span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => activeSession?.id === drill.id ? stopDrillSession() : handleStartRequest(drill)}
                        className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all ${
                          activeSession?.id === drill.id
                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/20 shadow-red-500/20'
                            : (isSolar ? 'bg-black text-white' : 'bg-[#c9964a] text-black shadow-lg shadow-[#c9964a]/20')
                        }`}
                      >
                        {activeSession?.id === drill.id ? 'ARRÊTER' : 'ÉQUIPER SESSION'} <Play size={12} fill="currentColor" />
                      </button>
                    </div>
                  </div>
                </motion.div>
          ))}
        </div>
      </div>
    </>
  )}

      {/* Persistent Timer Overlay - Moved to App.tsx for persistence */}

      <p className="text-[8px] font-black uppercase tracking-[0.5em] text-center opacity-10 py-12 italic">
        DATA CATALOGUE ELITE • 590 ENTRÉES DISPONIBLES
      </p>
      </div>
    </div>
  );
}
