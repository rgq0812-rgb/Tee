import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './services/AuthProvider';
import { ChatProvider } from './services/ChatContext';
import AuthScreen from './components/AuthScreen';
import Paywall from './components/Paywall';
import SplashScreen from './components/SplashScreen';
import PathSelector from './components/PathSelector';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Challenges from './lib/Challenges';
import ScorecardPage from './components/ScorecardPage';
import InnerCircle from './components/InnerCircle';
import Profile from './components/Profile';
import Community from './components/Community';
import MissionControl from './components/MissionControl';
import TacticalMap from './components/TacticalMap';
import Academy from './components/Academy';
import WelcomeTour from './utils/WelcomeTour';
import AdamMentorModal from './components/AdamMentorModal';
import LieScanner from './components/LieScanner';
import { BookOpen, Sparkles, Brain, X, Clock } from 'lucide-react';
import { AcademyDrill } from './data/academyDrills';
import { speakWithBrowser, generateSpeech, getCoachingIntervention } from './services/geminiService';
import { playWhistle, playSoftBell, playRawPcm } from './lib/audioUtils';
import { APIProvider } from '@vis.gl/react-google-maps';
import { HashRouter } from 'react-router-dom';

import { AppPath, HoleScore, Club } from './types';
import { INITIAL_CLUBS, COURSES, CHALLENGES, CADDIES } from './constants';

import { PowerManager } from './components/PowerManager';

function AppContent() {
  const { user, loading, hasPaid } = useAuth();
  const [isGuest, setIsGuest] = useState(() => sessionStorage.getItem('guestMode') === 'true');
  
  const handleGuestMode = () => {
    setIsGuest(true);
    sessionStorage.setItem('guestMode', 'true');
  };
  // --- Global State from Bible ---
  const [splashSeen, setSplashSeen] = useState(() => sessionStorage.getItem('splashSeen') === 'true');
  const [tourSeen, setTourSeen] = useState(() => localStorage.getItem('tourSeen') === 'true');
  const [appPath, setAppPath] = useState<AppPath | null>(() => localStorage.getItem('app_path') as AppPath);
  const [missionStarted, setMissionStarted] = useState(() => {
    // If there's already a scorecard, consider mission started
    const saved = localStorage.getItem('the-chose-scorecard');
    if (saved && saved !== '{}') return true;
    return localStorage.getItem('onyx_mission_active') === 'true';
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pseudo, setPseudo] = useState(() => localStorage.getItem('onyx_pseudo') || 'OPÉRATEUR');

  // Drill Session State (Persistent)
  const [activeSession, setActiveSession] = useState<AcademyDrill | null>(null);
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number>(0);
  const [isSessionRunning, setIsSessionRunning] = useState(false);
  const [showTimeUp, setShowTimeUp] = useState(false);
  const coachingMilestonesRef = useRef<Set<number>>(new Set());

  // Mentor/Coaching state
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [mentorInitialMessage, setMentorInitialMessage] = useState<string | undefined>(undefined);
  const [mentorTacticalMode, setMentorTacticalMode] = useState<'PARCOURS' | 'STRATÉGIE' | 'ENTRAÎNEMENT' | undefined>(undefined);

  // Coaching Interventions logic
  const speakTactical = useCallback(async (text: string) => {
    try {
      const audioData = await generateSpeech(text, { id: 'strat' }); // Use Adam's tactical voice
      if (typeof audioData === 'string') {
        await playRawPcm(audioData);
      } else {
        speakWithBrowser(text);
      }
    } catch (e) {
      console.error("[ONYX] Coaching Speech Error:", e);
      speakWithBrowser(text);
    }
  }, []);

  useEffect(() => {
    if (!isSessionRunning || !activeSession) {
      coachingMilestonesRef.current.clear();
      return;
    }

    const elapsedSeconds = activeSession.duration - sessionTimeLeft;
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);

    // Trigger every 5 minutes
    const interval = activeSession.category === 'WARMUP' ? 1 : 5;
    
    if (elapsedMinutes > 0 && elapsedMinutes % interval === 0 && !coachingMilestonesRef.current.has(elapsedMinutes)) {
      coachingMilestonesRef.current.add(elapsedMinutes);
      
      const triggerIntervention = async () => {
        const commMode = (localStorage.getItem('onyx_chat_mode') as any) || 'pro';
        const isWarmup = activeSession.category === 'WARMUP';
        const message = await getCoachingIntervention(elapsedMinutes, activeSession.title, commMode, isWarmup);
        
        if (message) {
          // ALWAYS send to teacher chat if in a drill session, as requested by user
          window.dispatchEvent(new CustomEvent('onyx_teacher_message', { 
            detail: { text: message } 
          }));

          // Optionally, if not in academy, we could show a small toast, 
          // but user said "ONLY in the teacher's chat"
          if (activeTab !== 'academy') {
            console.log("[ONYX] Academy coaching suppressed in main chat:", message);
          }
        }
      };

      triggerIntervention();
    }
  }, [sessionTimeLeft, isSessionRunning, activeSession, setShowMentorModal, setMentorInitialMessage]);

  useEffect(() => {
    let interval: any;
    if (isSessionRunning && sessionTimeLeft > 0) {
      interval = setInterval(() => {
        setSessionTimeLeft((t) => t - 1);
      }, 1000);
    } else if (sessionTimeLeft === 0 && isSessionRunning) {
      setIsSessionRunning(false);
      setShowTimeUp(true);
      setTimeout(() => setShowTimeUp(false), 5000);
    }
    return () => clearInterval(interval);
  }, [isSessionRunning, sessionTimeLeft]);

  const startDrillSession = (drill: AcademyDrill) => {
    setActiveSession(drill);
    setSessionTimeLeft(drill.duration);
    setIsSessionRunning(true);
    speakWithBrowser("C'est parti, n'hésite pas à me demander conseil.");
  };

  const stopDrillSession = () => {
    setActiveSession(null);
    setIsSessionRunning(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    localStorage.setItem('onyx_pseudo', pseudo);
    localStorage.setItem('onyx_player_name', pseudo); // Sync with profile to avoid confusion
  }, [pseudo]);
  
  const [scorecard, setScorecard] = useState<Record<number, HoleScore>>(() => {
    try {
      return JSON.parse(localStorage.getItem('the-chose-scorecard') || '{}');
    } catch (e) {
      return {};
    }
  });

  const [currentHole, setCurrentHole] = useState(() => {
    try {
      return Number(localStorage.getItem('the-chose-current-hole')) || 1;
    } catch (e) {
      return 1;
    }
  });

  const [selectedCourse, setSelectedCourse] = useState(() => {
    const saved = localStorage.getItem('the-chose-selected-course');
    return COURSES.find(c => c.id === saved) || COURSES[0];
  });

  const [arsenal, setArsenal] = useState<Club[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('the-chose-arsenal') || JSON.stringify(INITIAL_CLUBS));
    } catch (e) {
      return INITIAL_CLUBS;
    }
  });

  const [playerForm, setPlayerForm] = useState<'cold' | 'forme' | 'pur'>(() => {
    return (localStorage.getItem('the-chose-player-form') as any) || 'forme';
  });

  const [displayMode, setDisplayMode] = useState<'tactical' | 'solar'>(() => {
    return (localStorage.getItem('the-chose-display-mode') as any) || 'tactical';
  });

  const [selectedTee, setSelectedTee] = useState<'black' | 'white' | 'yellow' | 'blue' | 'red'>(() => {
    return (localStorage.getItem('the-chose-selected-tee') as any) || 'white';
  });

  const [eliteXP, setEliteXP] = useState(() => {
    try {
      return Number(localStorage.getItem('the-chose-elite-xp')) || 0;
    } catch (e) {
      return 0;
    }
  });

  const [handicap, setHandicap] = useState<number>(() => {
    const saved = localStorage.getItem('the-chose-handicap');
    if (saved) {
      const val = parseFloat(saved);
      return isNaN(val) ? 18 : val;
    }
    return 18;
  });

  const [activeCaddie, setActiveCaddie] = useState(() => {
    const saved = localStorage.getItem('the-chose-active-caddie');
    const caddiesMap = CADDIES as any;
    return caddiesMap[saved || 'strat'] || CADDIES.strat;
  });

  const [selectedMode, setSelectedMode] = useState<any>(() => {
    return localStorage.getItem('the-chose-game-mode') || 'STROKE';
  });

  // Automatic Mid-Round & End-of-Round Briefing Trigger
  useEffect(() => {
    // Hole 9 - Mid-Round
    if (scorecard[9] && currentHole === 10) {
      const alerted = sessionStorage.getItem('mid_round_briefing_triggered');
      if (!alerted) {
        setMentorInitialMessage("MISSION UPDATE : J'ai terminé les 9 premiers trous. En tant que Mentor ADAM, effectue mon briefing automatique de mi-parcours immédiatement. Analyse mes statistiques sur l'Aller et prépare-moi techniquement pour le Retour.");
        setShowMentorModal(true);
        sessionStorage.setItem('mid_round_briefing_triggered', 'true');
      }
    } else if (currentHole < 9) {
      sessionStorage.removeItem('mid_round_briefing_triggered');
    }

    // Hole 18 - End-of-Round
    if (scorecard[18] && currentHole === 18) {
      const alerted = sessionStorage.getItem('end_round_briefing_triggered');
      if (!alerted) {
        setMentorInitialMessage("PROCOTOLE CLUBHOUSE : J'ai terminé le parcours. Emmène-moi au 19ème trou dans le Salon VIP pour mon bilan global impitoyable et mon programme d'entraînement ONYX.");
        setShowMentorModal(true);
        sessionStorage.setItem('end_round_briefing_triggered', 'true');
      }
    } else if (currentHole < 18) {
      sessionStorage.removeItem('end_round_briefing_triggered');
    }
  }, [scorecard, currentHole]);
  
  useEffect(() => {
    const handleShowScorecard = () => {
      setActiveTab('scorecard');
      setShowMentorModal(false);
      setMentorInitialMessage(undefined);
      setMentorTacticalMode(undefined);
    };
    window.addEventListener('onyx_show_scorecard', handleShowScorecard);
    return () => window.removeEventListener('onyx_show_scorecard', handleShowScorecard);
  }, []);

  const [advice, setAdvice] = useState<string | null>(null);
  const adviceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (advice) {
      if (adviceTimeoutRef.current) clearTimeout(adviceTimeoutRef.current);
      adviceTimeoutRef.current = setTimeout(() => {
        setAdvice(null);
      }, 10000);
    }
    return () => {
      if (adviceTimeoutRef.current) clearTimeout(adviceTimeoutRef.current);
    };
  }, [advice]);

  const [showLieScanner, setShowLieScanner] = useState(false);

  const updateScore = useCallback((holeNum: number, strokes: number, putts?: number) => {
    const holeData = selectedCourse.holes.find(h => h.number === holeNum);
    const existingHole = scorecard[holeNum];
    
    // STRICT RULE: Default to 2 putts if not specified
    let finalPutts = 2;
    if (putts !== undefined && putts !== null) {
      finalPutts = putts;
    } else if (existingHole && existingHole.putts !== undefined) {
      finalPutts = existingHole.putts;
    }

    setScorecard(prev => ({
      ...prev,
      [holeNum]: {
        hole: holeNum,
        par: holeData?.par || 4,
        strokes,
        putts: finalPutts,
        fairwayHit: prev[holeNum]?.fairwayHit ?? null,
        gir: prev[holeNum]?.gir ?? null,
        timestamp: Date.now()
      }
    }));
    // Advance to next hole if current hole was recorded
    if (holeNum === currentHole && holeNum < 18) {
      setCurrentHole(holeNum + 1);
    }
  }, [selectedCourse, currentHole, scorecard]);

  // --- Persistence ---
  useEffect(() => {
    if (appPath) localStorage.setItem('app_path', appPath);
    localStorage.setItem('onyx_mission_active', String(missionStarted));
    localStorage.setItem('the-chose-scorecard', JSON.stringify(scorecard));
    localStorage.setItem('the-chose-current-hole', String(currentHole));
    localStorage.setItem('the-chose-selected-course', selectedCourse.id);
    localStorage.setItem('the-chose-elite-xp', eliteXP.toString());
    localStorage.setItem('the-chose-arsenal', JSON.stringify(arsenal));
    localStorage.setItem('the-chose-player-form', playerForm);
    localStorage.setItem('the-chose-handicap', handicap.toString());
    localStorage.setItem('the-chose-active-caddie', activeCaddie.id);
    localStorage.setItem('the-chose-game-mode', selectedMode);
    localStorage.setItem('the-chose-display-mode', displayMode);
    localStorage.setItem('the-chose-selected-tee', selectedTee);
  }, [appPath, scorecard, currentHole, selectedCourse, eliteXP, arsenal, playerForm, handicap, activeCaddie, selectedMode, displayMode, selectedTee]);

  if (!user && !isGuest) {
    return <AuthScreen onGuest={handleGuestMode} />;
  }

  // Paywall for registered users who haven't paid (and not in guest mode)
  if (user && !hasPaid && !isGuest) {
    return <Paywall onGuest={handleGuestMode} />;
  }

  if (!splashSeen) {
    return <SplashScreen onComplete={() => {
      setSplashSeen(true);
      sessionStorage.setItem('splashSeen', 'true');
    }} />;
  }

  if (!tourSeen) {
    return <WelcomeTour onComplete={() => {
      setTourSeen(true);
      localStorage.setItem('tourSeen', 'true');
    }} />;
  }

  if (!appPath) {
    return <PathSelector onSelect={(path) => setAppPath(path)} />;
  }

  if (appPath === 'player' && !missionStarted) {
    return (
      <MissionControl 
        onStart={() => setMissionStarted(true)}
        selectedCourse={selectedCourse}
        setSelectedCourse={setSelectedCourse}
        handicap={handicap}
        setHandicap={setHandicap}
        playerForm={playerForm}
        setPlayerForm={setPlayerForm}
        activeCaddie={activeCaddie}
        setActiveCaddie={setActiveCaddie}
        arsenal={arsenal}
        selectedMode={selectedMode}
        setSelectedMode={setSelectedMode}
        selectedTee={selectedTee}
        setSelectedTee={setSelectedTee}
        displayMode={displayMode}
      />
    );
  }

  return (
    <PowerManager>
      <Layout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        displayMode={displayMode}
        setDisplayMode={setDisplayMode}
      >
      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <motion.div
            key="dashboard-wrapper"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.3 }}
          >
            <Dashboard 
              key="dashboard"
              scorecard={scorecard}
              setScorecard={setScorecard}
              currentHole={currentHole}
              setCurrentHole={setCurrentHole}
              selectedCourse={selectedCourse}
              setSelectedCourse={setSelectedCourse}
              advice={advice}
              setAdvice={setAdvice}
              eliteXP={eliteXP}
              setEliteXP={setEliteXP}
              arsenal={arsenal}
              setArsenal={setArsenal}
              selectedMode={selectedMode}
              setSelectedMode={setSelectedMode}
              playerForm={playerForm}
              setPlayerForm={setPlayerForm}
              handicap={handicap}
              onUpdateScore={updateScore}
              setActiveTab={setActiveTab}
              setShowLieScanner={setShowLieScanner}
              activeCaddie={activeCaddie}
              setActiveCaddie={setActiveCaddie}
              setMissionStarted={setMissionStarted}
              setAppPath={setAppPath}
              displayMode={displayMode}
              selectedTee={selectedTee}
            />
          </motion.div>
        )}
        {activeTab === 'community' && (
          <motion.div
            key="community-wrapper"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.3 }}
          >
            <Community 
              key="community"
              displayMode={displayMode}
            />
          </motion.div>
        )}
        {activeTab === 'tactical' && (
          <motion.div
            key="tactical-wrapper"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.3 }}
          >
            <TacticalMap 
              key="tactical"
              selectedCourse={selectedCourse}
              currentHole={currentHole}
              activeCaddie={activeCaddie}
              displayMode={displayMode}
              selectedTee={selectedTee}
            />
          </motion.div>
        )}
        {activeTab === 'scorecard' && (
          <motion.div
            key="scorecard-wrapper"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.3 }}
          >
            <ScorecardPage 
              key="scorecard" 
              user={user}
              scorecard={scorecard} 
              setScorecard={setScorecard}
              selectedCourse={selectedCourse}
              setSelectedCourse={setSelectedCourse}
              currentHole={currentHole}
              setCurrentHole={setCurrentHole}
              activeCaddie={activeCaddie}
              setActiveCaddie={setActiveCaddie}
              selectedMode={selectedMode}
              setSelectedMode={setSelectedMode}
              handicap={handicap}
              setHandicap={setHandicap}
              arsenal={arsenal}
              setArsenal={setArsenal}
              setShowMentorModal={setShowMentorModal}
              setMentorInitialMessage={setMentorInitialMessage}
              setMissionStarted={setMissionStarted}
              setAppPath={setAppPath}
              displayMode={displayMode}
              setActiveTab={setActiveTab}
              selectedTee={selectedTee}
            />
          </motion.div>
        )}
        {activeTab === 'academy' && (
          <motion.div
            key="academy-wrapper"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.3 }}
          >
            <Academy 
              key="academy"
              displayMode={displayMode}
              scorecard={scorecard}
              pseudo={pseudo}
              setPseudo={setPseudo}
              arsenal={arsenal}
              index={handicap}
              currentHole={currentHole}
              activeSession={activeSession}
              sessionTimeLeft={sessionTimeLeft}
              isSessionRunning={isSessionRunning}
              startDrillSession={startDrillSession}
              stopDrillSession={stopDrillSession}
            />
          </motion.div>
        )}
        {activeTab === 'profile' && (
          <motion.div
            key="profile-wrapper"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.3 }}
          >
            <Profile 
              key="profile" 
              selectedCourse={selectedCourse} 
              arsenal={arsenal}
              setArsenal={setArsenal}
              playerForm={playerForm}
              setPlayerForm={setPlayerForm}
              handicap={handicap}
              setHandicap={setHandicap}
              setTourSeen={setTourSeen}
              setActiveTab={setActiveTab}
              setShowMentorModal={setShowMentorModal}
              setMentorInitialMessage={setMentorInitialMessage}
              setMissionStarted={setMissionStarted}
              setAppPath={setAppPath}
              displayMode={displayMode}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Time Up Notification */}
    <AnimatePresence>
      {showTimeUp && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: -20 }}
          className="fixed inset-x-0 top-12 z-[1000] flex justify-center pointer-events-none"
        >
          <div className="bg-[#c9964a] text-black px-8 py-4 rounded-full shadow-2xl flex items-center gap-4 border-4 border-black">
             <Clock className="animate-bounce" />
             <span className="font-black italic uppercase tracking-widest">TEMPS ÉCOULÉ • PROTOCOLE FINI</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Floating Adam Help Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowMentorModal(true)}
        className="fixed bottom-24 right-6 z-[300] w-12 h-12 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-[#c9964a] shadow-2xl group"
        id="floating-adam-btn"
      >
        <div className="absolute inset-0 bg-[#c9964a]/10 rounded-full blur-xl group-hover:bg-[#c9964a]/20 transition-all opacity-0 group-hover:opacity-100" />
        <Sparkles size={20} className="relative z-10 animate-pulse" />
        <span className="absolute right-full mr-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-[#c9964a] opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap">
          Mentorat ONYX
        </span>
      </motion.button>
    </Layout>
      <AdamMentorModal 
        isOpen={showMentorModal} 
        onClose={() => {
          setShowMentorModal(false);
          setMentorInitialMessage(undefined);
          setMentorTacticalMode(undefined);
        }} 
        selectedCourse={selectedCourse}
        currentHole={currentHole}
        scorecard={scorecard}
        arsenal={arsenal}
        initialMessage={mentorInitialMessage}
        initialTacticalMode={mentorTacticalMode}
        handicap={handicap}
        playerForm={playerForm}
        onUpdateScore={updateScore}
        onSetCurrentHole={setCurrentHole}
        onOpenScanner={() => setShowLieScanner(true)}
        displayMode={displayMode}
        selectedTee={selectedTee}
      />
    <LieScanner 
      isOpen={showLieScanner} 
      onClose={() => setShowLieScanner(false)} 
      isMuted={localStorage.getItem('onyx_voice') === 'false'}
      currentHole={currentHole}
      courseId={selectedCourse.id}
    />

    {/* Persistent Timer Overlay (Floating, hidden if in Academy where it is pinned) */}
    <AnimatePresence>
      {(activeSession && activeTab !== 'academy') && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-24 left-4 right-4 z-[400] pointer-events-none"
        >
          <div className={`p-6 rounded-[2.5rem] border-2 shadow-2xl flex items-center justify-between pointer-events-auto backdrop-blur-xl ${
            displayMode === 'solar' ? 'bg-white/90 border-black shadow-black/10' : 'bg-black/90 border-[#c9964a] shadow-[#c9964a]/20'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center animate-pulse ${
                displayMode === 'solar' ? 'bg-black text-white' : 'bg-[#c9964a] text-black shadow-lg shadow-[#c9964a]/50'
              }`}>
                <Brain size={28} />
              </div>
              <div>
                <h6 className="text-[8px] font-black uppercase tracking-widest opacity-40 leading-none mb-1">Session Active d'ADAM</h6>
                <p className="text-sm font-black italic uppercase tracking-tighter leading-none">{activeSession.title}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[7px] font-black uppercase tracking-[0.2em] opacity-40 text-[#c9964a]">ONYX Sync Actif</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">Temps Restant</p>
                <p className="text-3xl font-black font-mono tracking-tighter tabular-nums leading-none">
                  {formatTime(sessionTimeLeft)}
                </p>
              </div>
              <button 
                onClick={stopDrillSession}
                className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${
                  displayMode === 'solar' ? 'border-black hover:bg-black hover:text-white' : 'border-[#c9964a]/30 hover:border-[#c9964a] text-[#c9964a]'
                }`}
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </PowerManager>
);
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("[ONYX] App Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-6">
            <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="text-red-500 w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-black uppercase tracking-widest text-[#c9964a]">Erreur de Liaison Tactique</h1>
              <p className="text-zinc-500 text-sm italic font-medium">L'interface ONYX a rencontré une anomalie critique. Adam tente de stabiliser le flux.</p>
              <p className="text-red-400 text-xs font-mono mt-2">{this.state.error?.message}</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-[#c9964a] text-black font-black uppercase tracking-widest text-xs rounded-full hover:scale-105 transition-transform"
            >
              Relancer la Mission
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const API_KEY = 
    (typeof process !== 'undefined' && process.env && process.env.GOOGLE_MAPS_PLATFORM_KEY) ||
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_MAPS_API_KEY) || 
    '';

  return (
    <HashRouter>
      <ErrorBoundary>
      <AuthProvider>
        <ChatProvider>
          {API_KEY && API_KEY.length > 5 ? (
            <APIProvider 
              apiKey={API_KEY} 
              libraries={['places', 'marker']}
              onLoad={() => console.log("[ONYX] Google Maps API Loaded")}
              onError={(err) => {
                console.error("[ONYX] Google Maps Load Error:", err);
              }}
            >
              <AppContent />
            </APIProvider>
          ) : (
            <div className="min-h-screen bg-black flex items-center justify-center text-white p-6 text-center">
              <div className="space-y-4 max-w-sm">
                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                  <span className="font-black">!</span>
                </div>
                <h1 className="text-sm font-black tracking-widest text-[#c9964a]">ONYX SECURE BOOT</h1>
                <p className="text-xs opacity-60">
                  Impossible d'initialiser le module cartographique. Les clés d'API système sont manquantes ou en cours d'injection.
                </p>
                <p className="text-[10px] font-mono opacity-30 mt-4 break-all">
                  API_KEY_LENGTH: {API_KEY ? API_KEY.length : 0}
                </p>
              </div>
            </div>
          )}
        </ChatProvider>
      </AuthProvider>
      </ErrorBoundary>
    </HashRouter>
  );
}
