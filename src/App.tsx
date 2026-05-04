import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './services/AuthProvider';
import AuthScreen from './components/AuthScreen';
import SplashScreen from './components/SplashScreen';
import PathSelector from './components/PathSelector';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Challenges from './Challenges';
import ScorecardPage from './components/ScorecardPage';
import InnerCircle from './components/InnerCircle';
import Profile from './components/Profile';
import WelcomeTour from './components/WelcomeTour';
import AdamMentorModal from './components/AdamMentorModal';
import LieScanner from './components/LieScanner';
import { BookOpen, Sparkles } from 'lucide-react';

import { AppPath, HoleScore, Club } from './types';
import { INITIAL_CLUBS, COURSES, CHALLENGES } from './constants';

function AppContent() {
  const { user, loading } = useAuth();
  
  // --- Global State from Bible ---
  const [splashSeen, setSplashSeen] = useState(() => sessionStorage.getItem('splashSeen') === 'true');
  const [tourSeen, setTourSeen] = useState(() => localStorage.getItem('tourSeen') === 'true');
  const [appPath, setAppPath] = useState<AppPath | null>(() => localStorage.getItem('app_path') as AppPath);
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

  const [eliteXP, setEliteXP] = useState(() => {
    try {
      return Number(localStorage.getItem('the-chose-elite-xp')) || 0;
    } catch (e) {
      return 0;
    }
  });

  const [handicap, setHandicap] = useState<number>(() => {
    return Number(localStorage.getItem('the-chose-handicap')) || 18;
  });

  const [advice, setAdvice] = useState<string | null>(null);
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [showLieScanner, setShowLieScanner] = useState(false);

  // --- Persistence ---
  useEffect(() => {
    if (appPath) localStorage.setItem('app_path', appPath);
    localStorage.setItem('the-chose-scorecard', JSON.stringify(scorecard));
    localStorage.setItem('the-chose-current-hole', String(currentHole));
    localStorage.setItem('the-chose-selected-course', selectedCourse.id);
    localStorage.setItem('the-chose-elite-xp', eliteXP.toString());
    localStorage.setItem('the-chose-arsenal', JSON.stringify(arsenal));
    localStorage.setItem('the-chose-player-form', playerForm);
    localStorage.setItem('the-chose-handicap', handicap.toString());
  }, [appPath, scorecard, currentHole, selectedCourse, eliteXP, arsenal, playerForm, handicap]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
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

  return (
    <>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
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
            playerForm={playerForm}
            setPlayerForm={setPlayerForm}
            handicap={handicap}
            setActiveTab={setActiveTab}
            setShowLieScanner={setShowLieScanner}
          />
        )}
        {activeTab === 'challenges' && <Challenges key="challenges" />}
        {activeTab === 'scorecard' && (
          <ScorecardPage 
            key="scorecard" 
            scorecard={scorecard} 
            setScorecard={setScorecard}
            selectedCourse={selectedCourse}
            currentHole={currentHole}
            setCurrentHole={setCurrentHole}
          />
        )}
        {activeTab === 'circle' && <InnerCircle key="circle" />}
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
          Adam Mentoring
        </span>
      </motion.button>
    </Layout>
    <AdamMentorModal isOpen={showMentorModal} onClose={() => setShowMentorModal(false)} />
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
