import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './services/AuthProvider';
import AuthScreen from './components/AuthScreen';
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
import WelcomeTour from './utils/WelcomeTour';
import AdamMentorModal from './components/AdamMentorModal';
import LieScanner from './components/LieScanner';
import { BookOpen, Sparkles } from 'lucide-react';

import { AppPath, HoleScore, Club } from './types';
import { INITIAL_CLUBS, COURSES, CHALLENGES, CADDIES } from './constants';

function AppContent() {
  const { user, loading } = useAuth();
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

  const [showMentorModal, setShowMentorModal] = useState(false);
  const [mentorInitialMessage, setMentorInitialMessage] = useState<string | undefined>(undefined);
  const [showLieScanner, setShowLieScanner] = useState(false);

  const updateScore = useCallback((holeNum: number, strokes: number, putts: number) => {
    const holeData = selectedCourse.holes.find(h => h.number === holeNum);
    setScorecard(prev => ({
      ...prev,
      [holeNum]: {
        hole: holeNum,
        par: holeData?.par || 4,
        strokes,
        putts,
        fairwayHit: prev[holeNum]?.fairwayHit ?? null,
        gir: prev[holeNum]?.gir ?? null,
        timestamp: Date.now()
      }
    }));
  }, [selectedCourse]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user && !isGuest) {
    return <AuthScreen onGuest={handleGuestMode} />;
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
    <>
      <Layout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        displayMode={displayMode}
        setDisplayMode={setDisplayMode}
      >
      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
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
            setActiveTab={setActiveTab}
            setShowLieScanner={setShowLieScanner}
            activeCaddie={activeCaddie}
            setActiveCaddie={setActiveCaddie}
            setMissionStarted={setMissionStarted}
            displayMode={displayMode}
            selectedTee={selectedTee}
          />
        )}
        {activeTab === 'community' && (
          <Community 
            key="community"
            displayMode={displayMode}
          />
        )}
        {activeTab === 'tactical' && (
          <TacticalMap 
            key="tactical"
            selectedCourse={selectedCourse}
            currentHole={currentHole}
            activeCaddie={activeCaddie}
            displayMode={displayMode}
            selectedTee={selectedTee}
          />
        )}
        {activeTab === 'scorecard' && (
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
            displayMode={displayMode}
            setActiveTab={setActiveTab}
            selectedTee={selectedTee}
          />
        )}
        {activeTab === 'circle' && <InnerCircle key="circle" displayMode={displayMode} />}
        {activeTab === 'profile' && (
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
        }} 
        selectedCourse={selectedCourse}
        currentHole={currentHole}
        scorecard={scorecard}
        arsenal={arsenal}
        initialMessage={mentorInitialMessage}
        handicap={handicap}
        playerForm={playerForm}
        onUpdateScore={updateScore}
        displayMode={displayMode}
        selectedTee={selectedTee}
      />
    <LieScanner 
      isOpen={showLieScanner} 
      onClose={() => setShowLieScanner(false)} 
      isMuted={localStorage.getItem('onyx_voice') === 'false'}
    />
  </>
);
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
