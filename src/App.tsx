import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './services/AuthProvider';
import AuthScreen from './components/AuthScreen';
import SplashScreen from './components/SplashScreen';
import PathSelector from './components/PathSelector';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Challenges from './components/Challenges';
import ScorecardPage from './components/ScorecardPage';
import InnerCircle from './components/InnerCircle';
import Profile from './components/Profile';
import WelcomeTour from './components/WelcomeTour';

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

  const [playerForm, setPlayerForm] = useState<'cold' | 'hot' | 'pure'>(() => {
    return (localStorage.getItem('the-chose-player-form') as any) || 'hot';
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
          />
        )}
      </AnimatePresence>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
