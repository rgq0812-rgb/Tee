import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { logout, db, handleFirestoreError, OperationType } from '../services/firebase';
import { useAuth } from '../services/AuthProvider';
import { collection, query, where, getDocs, onSnapshot, addDoc, serverTimestamp, setDoc, doc, orderBy, limit } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { ADAM_AVATAR_URL } from '../constants';
import { LogOut, User, Settings, Shield, Award, Image as ImageIcon, ChevronRight, ChevronDown, X, Clock, Box, Zap, Snowflake, Gem, Target, Plus, Minus, Upload, Loader2, AlertCircle, BookOpen, Brain, Video, Volume2, ShieldCheck, Play, Camera as CameraIcon, TrendingUp, ArrowRight } from 'lucide-react';
import { useAmbientSound } from '../hooks/use-ambient-sound';
import RulesModal from '../services/RulesModal';
import SettingsModal from './SettingsModal';
import SwingCoachModal from './SwingCoachModal';

import { useHoleAssets } from '../hooks/useHoleAssets';
import { assetService } from '../services/assetService';
import { Trash2, CreditCard, HelpCircle } from 'lucide-react';
import { CADDIES } from '../constants';
import LegalPage from './LegalPage';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

export default function Profile({ 
  selectedCourse, arsenal, setArsenal, playerForm, setPlayerForm, 
  handicap, setHandicap, setTourSeen, setActiveTab, 
  setShowMentorModal, setMentorInitialMessage,
  setMissionStarted, setAppPath,
  displayMode
}: { 
  selectedCourse: any, arsenal: any[], setArsenal: any, playerForm: string, setPlayerForm: any, 
  handicap: number, setHandicap: any, setTourSeen: (val: boolean) => void, setActiveTab: (tab: string) => void, 
  setShowMentorModal: (val: boolean) => void, setMentorInitialMessage: (val: string) => void,
  setMissionStarted: (val: boolean) => void, setAppPath: (val: any) => void,
  displayMode?: 'tactical' | 'solar'
  key?: string 
}) {
  const isSolar = displayMode === 'solar';
  const { user } = useAuth();
  const [playerName, setPlayerName] = useState(() => user?.displayName || localStorage.getItem('onyx_player_name') || 'ONYX_OPERATIVE');

  useEffect(() => {
    if (user?.displayName && !localStorage.getItem('onyx_player_name')) {
      setPlayerName(user.displayName);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('onyx_player_name', playerName);
  }, [playerName]);
  const { playPing } = useAmbientSound();
  const { assets, loading: assetsLoading, quotaExceeded } = useHoleAssets();
  const [advices, setAdvices] = useState<any[]>([]);
  const [advicesLoading, setAdvicesLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  
  // Tactical history fetch
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'tactical_advice'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAdvices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setAdvicesLoading(false);
    }, (error) => {
      console.error("Advice history error:", error);
      setAdvicesLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [units, setUnits] = useState(() => localStorage.getItem('onyx_units') || 'meters');

  useEffect(() => {
    const handleStorage = () => setUnits(localStorage.getItem('onyx_units') || 'meters');
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(handleStorage, 2000);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [holeToUpload, setHoleToUpload] = useState<number>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 800000) { // Limit to ~800KB for Firestore 1MB limit
      setUploadError("Fichier trop volumineux. Max 800KB.");
      return;
    }

    setUploading(true);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const assetId = `${selectedCourse.id}_${holeToUpload}`;
      
      try {
        await setDoc(doc(db, 'hole_assets', assetId), {
          userId: user.uid,
          courseId: selectedCourse.id,
          holeNumber: holeToUpload,
          imageData: base64,
          updatedAt: new Date().toISOString()
        });
        
        if (playPing) playPing(1200, 'sine', 0.1);
        setShowUploadModal(false);
      } catch (error: any) {
        console.error("Upload error:", error);
        if (error.message?.includes('quota')) {
          setUploadError("Quota de lecture/écriture dépassé. Réessayez demain.");
        } else {
          setUploadError("Erreur lors de l'envoi au Vault.");
        }
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const [showSwingCoach, setShowSwingCoach] = useState(false);
  const [savedRounds, setSavedRounds] = useState<any[]>([]);

  useEffect(() => {
    const rounds = JSON.parse(localStorage.getItem('the-chose-saved-rounds') || '[]');
    setSavedRounds(rounds);
  }, []);

  const [analyzingRoundId, setAnalyzingRoundId] = useState<number | null>(null);

  const handleAnalyzeRound = async (round: any) => {
    setAnalyzingRoundId(round.id);
    try {
      const { getGameDebrief } = await import('../services/geminiService');
      const response = await getGameDebrief(round.scorecard, round.totalScore, round.totalStrokes);
      
      setMentorInitialMessage(`Analyse de votre partie du ${new Date(round.date).toLocaleDateString()} :\n\n${response}`);
      setShowMentorModal(true);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzingRoundId(null);
    }
  };

  const deleteRound = (id: number) => {
    if (confirm("Supprimer cette carte définitivement ?")) {
      const updated = savedRounds.filter(r => r.id !== id);
      setSavedRounds(updated);
      localStorage.setItem('the-chose-saved-rounds', JSON.stringify(updated));
    }
  };
  const [showArsenalMenu, setShowArsenalMenu] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    vault: false,
    history: false,
    rounds: true,
    academy: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    if (playPing) playPing(1000, 'sine', 0.05);
  };

  const [showLegal, setShowLegal] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const handlePayment = async () => {
    if (!user) {
      alert("Veuillez vous connecter pour procéder au paiement.");
      return;
    }
    setIsPaying(true);
    try {
      const resp = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid })
      });
      const data = await resp.json();
      if (data.id) {
        const stripe = await stripePromise;
        if (stripe) {
          await (stripe as any).redirectToCheckout({ sessionId: data.id });
        }
      } else {
        throw new Error(data.error || "Session creation failed");
      }
    } catch (err: any) {
      console.error(err);
      alert(`Erreur de paiement: ${err.message}. Verifiez que STRIPE_SECRET_KEY est configurée sur le serveur.`);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className={`relative -mx-6 -mt-6 min-h-[calc(100vh-140px)] p-6 font-sans overflow-y-auto ${isSolar ? 'bg-zinc-50 text-black' : 'bg-black text-white'}`}>
      {/* Background with Cinematic Overlay */}
      <div className={`absolute inset-0 z-0 pointer-events-none ${isSolar ? 'hidden' : ''}`}>
        <img 
          src="https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=2670&auto=format&fit=crop" 
          className="w-full h-full object-cover opacity-10"
          alt="Vaultbg"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black/95" />
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, #c9964a 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      </div>

      <div className="relative z-10 space-y-8 pb-32">
        {/* Header Photo Section */}
        <div className="flex flex-col items-center text-center pt-8">
          <div className="relative">
            <div className={`w-28 h-28 rounded-full flex items-center justify-center mb-6 overflow-hidden border-2 shadow-lg ${isSolar ? 'bg-white border-black text-black' : 'bg-[#c9964a]/10 border-[#c9964a]/30 text-[#c9964a] shadow-[0_0_30px_rgba(201,150,74,0.1)]'}`}>
              {(() => {
                const customAvatar = user ? localStorage.getItem(`user-custom-avatar-${user.uid}`) : null;
                if (customAvatar) return <img src={customAvatar} alt="Profile" className="w-full h-full object-cover" />;
                if (user?.photoURL) return <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />;
                return <User size={48} />;
              })()}
            </div>
            <button 
              onClick={() => {
                const newUrl = prompt("Entrez le lien direct vers votre image d'avatar :");
                if (newUrl && user) {
                  localStorage.setItem(`user-custom-avatar-${user.uid}`, newUrl);
                  window.location.reload(); 
                }
              }}
              className={`absolute -bottom-2 right-4 p-2 rounded-full border-2 shadow-lg hover:scale-110 transition-transform ${isSolar ? 'bg-black text-white border-white' : 'bg-[#c9964a] text-black border-black'}`}
            >
              <CameraIcon size={14} />
            </button>
          </div>
          
          <h2 className={`text-3xl font-black italic tracking-tighter uppercase ${isSolar ? 'text-black' : 'text-white'}`}>
            {playerName}
          </h2>
          <button 
            onClick={() => {
              const newName = prompt("Entrez votre Nom de Code Onyx:", playerName);
              if (newName) setPlayerName(newName.toUpperCase());
            }}
            className={`text-[8px] font-black underline uppercase tracking-widest mt-1 opacity-40 hover:opacity-100 ${isSolar ? 'text-black' : 'text-[#c9964a]'}`}
          >
            Modifier Identité
          </button>
          <p className={`text-[10px] font-mono tracking-[0.3em] uppercase mt-2 font-bold ${isSolar ? 'text-zinc-500' : 'text-[#c9964a]'}`}>INSTRUMENT DE PRÉCISION • RÉSEAU ONYX</p>
          
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm mt-8">
            <div className={`border p-4 rounded-2xl flex flex-col items-center ${isSolar ? 'bg-white border-zinc-200 shadow-sm' : 'bg-white/5 border-white/10'}`}>
              <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${isSolar ? 'text-zinc-400' : 'text-white/40'}`}>Handicap</p>
              <p className={`text-xl font-black font-mono ${isSolar ? 'text-black' : 'text-[#c9964a]'}`}>{handicap}</p>
            </div>
            <div className={`border p-4 rounded-2xl flex flex-col items-center ${isSolar ? 'bg-white border-zinc-200 shadow-sm' : 'bg-white/5 border-white/10'}`}>
              <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${isSolar ? 'text-zinc-400' : 'text-white/40'}`}>XP Élite</p>
              <p className="text-xl font-black font-mono text-red-600">4,250</p>
            </div>
          </div>
        </div>

        {/* Tactical Photo Gallery (Hole Assets from Firebase) */}
        <div className="space-y-4">
          <button 
            onClick={() => toggleSection('vault')}
            className="w-full flex items-center justify-between px-2"
          >
            <div className="flex items-center gap-2">
              <ImageIcon size={16} className={isSolar ? "text-black" : "text-[#c9964a]"} />
              <h3 className={`text-xs font-black tracking-[0.3em] uppercase ${isSolar ? 'text-black' : 'text-white'}`}>VAULT TACTIQUE</h3>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-[10px] font-mono font-bold ${isSolar ? 'text-zinc-400' : 'text-white/20'}`}>{assets.length} FICHIERS</span>
              {expandedSections.vault ? <ChevronDown size={16} className="opacity-20" /> : <ChevronRight size={16} className="opacity-20" />}
            </div>
          </button>

          <AnimatePresence>
            {expandedSections.vault && (
              <motion.div 
                key="vault-section"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-4"
              >
                <div className="flex justify-end">
                   <button 
                    onClick={() => setShowUploadModal(true)}
                    className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 border border-dashed transition-all active:scale-95 ${isSolar ? 'bg-white border-zinc-200 text-black' : 'bg-white/5 border-white/10 text-[#c9964a] hover:bg-[#c9964a]/10 hover:border-[#c9964a]/30'}`}
                  >
                    <Plus size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Ajouter Capture</span>
                  </button>
                </div>

                {assetsLoading ? (
                   <div className="grid grid-cols-3 gap-2">
                      {[1,2,3].map(i => <div key={`profile-vault-skeleton-${i}`} className={`aspect-square rounded-xl animate-pulse ${isSolar ? 'bg-zinc-200' : 'bg-white/5'}`} />)}
                   </div>
                ) : assets.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                     {assets.map((asset, idx) => (
                       <motion.button
                         key={`profile-vault-asset-${asset.id}-${idx}`}
                         whileTap={{ scale: 0.95 }}
                         onClick={() => setSelectedAsset(asset)}
                         className={`relative aspect-square rounded-xl overflow-hidden border group ${isSolar ? 'border-zinc-200' : 'border-white/5'}`}
                       >
                         <img src={asset.imageData} alt="Tactical plan" className={`w-full h-full object-cover transition-opacity ${isSolar ? 'opacity-90' : 'opacity-60 group-hover:opacity-100'}`} />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                         <div className="absolute bottom-2 left-2 text-[10px] font-black italic text-white leading-none">
                           T{asset.holeNumber}
                         </div>
                       </motion.button>
                     ))}
                  </div>
                ) : (
                  <div className={`border border-dashed rounded-2xl p-12 text-center flex flex-col items-center gap-3 ${isSolar ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/10'}`}>
                    <ImageIcon size={32} className={isSolar ? 'text-zinc-200' : 'text-white/10'} />
                    <p className={`text-[10px] font-black uppercase tracking-widest ${isSolar ? 'text-zinc-400' : 'text-white/20'}`}>Aucune photo tactique enregistrée</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tactical Advice History */}
        <div className="space-y-4">
           <button 
             onClick={() => toggleSection('history')}
             className="w-full flex items-center justify-between gap-2 px-2"
           >
              <div className="flex items-center gap-2">
                <Brain size={16} className={isSolar ? "text-black" : "text-[#c9964a]"} />
                <h3 className={`text-xs font-black tracking-[0.3em] uppercase ${isSolar ? 'text-black' : 'text-white'}`}>HISTORIQUE TACTIQUE</h3>
              </div>
              {expandedSections.history ? <ChevronDown size={16} className="opacity-20" /> : <ChevronRight size={16} className="opacity-20" />}
           </button>
           
           <AnimatePresence>
             {expandedSections.history && (
               <motion.div 
                 key="history-section"
                 initial={{ height: 0, opacity: 0 }}
                 animate={{ height: 'auto', opacity: 1 }}
                 exit={{ height: 0, opacity: 0 }}
                 className={`border rounded-2xl overflow-hidden divide-y ${isSolar ? 'bg-white border-zinc-200 divide-zinc-100 shadow-sm' : 'bg-white/5 border-white/10 divide-white/5'}`}
               >
                  {advicesLoading ? (
                     <div className="p-6 flex justify-center"><Loader2 className="animate-spin text-white/20" /></div>
                  ) : advices.length > 0 ? (
                    advices.map((adv, idx) => (
                      <div key={`${adv.id}-${idx}`} className="p-4 space-y-2 group">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className={`text-[8px] font-black uppercase tracking-widest ${isSolar ? 'text-black' : 'text-[#c9964a]'}`}>{adv.caddieName} — TROU {adv.holeNumber}</span>
                            <span className={`text-[7px] font-mono uppercase ${isSolar ? 'text-zinc-400' : 'text-white/10'}`}>{adv.courseName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[8px] font-mono uppercase ${isSolar ? 'text-zinc-400 font-bold' : 'text-white/20'}`}>
                              {adv.createdAt?.toDate ? adv.createdAt.toDate().toLocaleTimeString() : '...'}
                            </span>
                            <button 
                              onClick={async () => {
                                try {
                                  const { generateSpeech, speakWithBrowser } = await import('../services/geminiService');
                                  const { playRawPcm } = await import('../lib/audioUtils');
                                  const caddie = Object.values(CADDIES).find(c => c.name === adv.caddieName) || CADDIES.strat;
                                  const res = await generateSpeech(adv.advice, caddie);
                                  if (typeof res === 'object' && res.fallback) {
                                    speakWithBrowser(res.text);
                                  } else if (typeof res === 'string') {
                                    playRawPcm(res);
                                  }
                                } catch (e) {
                                  console.error("Playback error", e);
                                }
                              }}
                              className={`p-2 rounded-lg transition-colors ${isSolar ? 'bg-zinc-100 hover:bg-zinc-200' : 'bg-white/5 hover:bg-[#c9964a]/20'}`}
                            >
                              <Volume2 size={10} className={isSolar ? 'text-black' : 'text-[#c9964a]'} />
                            </button>
                          </div>
                        </div>
                        {(() => {
                          const cleanAdvice = adv.advice.includes(':') ? adv.advice.split(':').slice(1).join(':').trim() : adv.advice.trim();
                          const finalAdvice = cleanAdvice.length > 200 ? cleanAdvice.substring(0, 200) + '...' : cleanAdvice;
                          return (
                            <p className={`text-xs leading-relaxed italic ${isSolar ? 'text-zinc-600' : 'text-white/60'}`}>"{finalAdvice}"</p>
                          );
                        })()}
                      </div>
                    ))
                  ) : (
                    <div className={`p-8 text-center text-[10px] font-black uppercase tracking-widest ${isSolar ? 'text-zinc-400' : 'text-white/20'}`}>Aucun conseil récent</div>
                  )}
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* Academy Button */}
        <div className="space-y-4">
           <button 
             onClick={() => toggleSection('academy')}
             className="w-full flex items-center justify-between gap-2 px-2"
           >
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className={isSolar ? "text-black" : "text-[#c9964a]"} />
                <h3 className={`text-xs font-black tracking-[0.3em] uppercase ${isSolar ? 'text-black' : 'text-white'}`}>ACADÉMIE DE PROGRESSION</h3>
              </div>
              {expandedSections.academy ? <ChevronDown size={16} className="opacity-20" /> : <ChevronRight size={16} className="opacity-20" />}
           </button>

           <AnimatePresence>
             {expandedSections.academy && (
               <motion.div 
                 key="academy-section"
                 initial={{ height: 0, opacity: 0 }}
                 animate={{ height: 'auto', opacity: 1 }}
                 exit={{ height: 0, opacity: 0 }}
                 className="overflow-hidden py-2"
               >
                  <button 
                    onClick={() => setActiveTab('community')}
                    className={`w-full p-8 rounded-[2.5rem] border flex flex-col items-center text-center gap-4 transition-all group ${isSolar ? 'bg-white border-zinc-200' : 'bg-gradient-to-br from-[#c9964a]/20 to-black border-[#c9964a]/30'}`}
                  >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all group-hover:scale-110 ${isSolar ? 'bg-black text-white border-black' : 'bg-[#c9964a] text-black border-black shadow-lg shadow-[#c9964a]/20'}`}>
                      <TrendingUp size={24} />
                    </div>
                    <div>
                      <h4 className="text-lg font-black italic uppercase tracking-tighter leading-none mb-2">Visualiser ma Progression</h4>
                      <p className={`text-[10px] font-black uppercase tracking-widest opacity-50`}>Analyse 8K de vos performances & Défis communautaires</p>
                    </div>
                    <div className={`mt-2 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.3em] ${isSolar ? 'text-black' : 'text-[#c9964a]'}`}>
                      Ouvrir Réseau <ArrowRight size={10} />
                    </div>
                  </button>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* Saved Scorecards Section */}
        <div className="space-y-4">
           <button 
            onClick={() => toggleSection('rounds')}
            className="w-full flex items-center justify-between gap-2 px-2"
           >
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className={isSolar ? "text-black" : "text-[#c9964a]"} />
                <h3 className={`text-xs font-black tracking-[0.3em] uppercase ${isSolar ? 'text-black' : 'text-white'}`}>ARCHIVES MISSIONS</h3>
              </div>
              {expandedSections.rounds ? <ChevronDown size={16} className="opacity-20" /> : <ChevronRight size={16} className="opacity-20" />}
           </button>
           
           <AnimatePresence>
             {expandedSections.rounds && (
               <motion.div 
                 key="rounds-section"
                 initial={{ height: 0, opacity: 0 }}
                 animate={{ height: 'auto', opacity: 1 }}
                 exit={{ height: 0, opacity: 0 }}
                 className="overflow-hidden space-y-3"
               >
                  {savedRounds.length > 0 ? (
                    savedRounds.map((round, idx) => (
                      <div key={`saved-round-${round.id}-${idx}`} className={`border rounded-2xl p-5 space-y-4 relative overflow-hidden group shadow-sm ${isSolar ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/10'}`}>
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                          <ShieldCheck size={40} className={isSolar ? 'text-zinc-200' : 'text-[#c9964a]'} />
                        </div>
                        
                        <div className="flex justify-between items-start">
                          <div>
                            <p className={`text-[8px] font-black uppercase tracking-widest leading-none mb-1 ${isSolar ? 'text-zinc-400' : 'text-[#c9964a]'}`}>{round.courseName}</p>
                            <h4 className={`text-sm font-black italic uppercase tracking-tighter ${isSolar ? 'text-black' : 'text-white'}`}>PARTIE DU {new Date(round.date).toLocaleDateString()}</h4>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className={`text-xl font-black font-mono leading-none ${round.totalScore < 0 ? 'text-green-500' : round.totalScore === 0 ? (isSolar ? 'text-black' : 'text-white') : 'text-red-600'}`}>
                              {round.totalScore > 0 ? `+${round.totalScore}` : round.totalScore === 0 ? 'E' : round.totalScore}
                            </span>
                            <span className={`text-[7px] font-mono uppercase tracking-widest mt-1 ${isSolar ? 'text-zinc-300 font-bold' : 'text-white/20'}`}>{round.totalStrokes} COUPS</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 pt-2">
                          <button 
                            onClick={() => handleAnalyzeRound(round)}
                            disabled={analyzingRoundId === round.id}
                            className={`flex-1 h-10 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg ${isSolar ? 'bg-black text-white' : 'bg-[#c9964a] text-black shadow-[#c9964a]/10'}`}
                          >
                            {analyzingRoundId === round.id ? <Loader2 size={12} className="animate-spin" /> : <Brain size={12} />}
                            ANALYSE ADAM
                          </button>
                          <button 
                            onClick={() => deleteRound(round.id)}
                            className={`px-4 border rounded-xl transition-all active:scale-95 ${isSolar ? 'bg-zinc-50 border-zinc-200 text-zinc-300 hover:text-red-500 hover:bg-red-50 hover:border-red-200' : 'bg-white/5 border-white/10 text-white/20 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20'}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={`border border-dashed rounded-2xl p-10 text-center flex flex-col items-center gap-3 ${isSolar ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/10'}`}>
                       <ShieldCheck size={32} className={isSolar ? 'text-zinc-200' : 'text-white/10'} />
                       <p className={`text-[10px] font-black uppercase tracking-widest ${isSolar ? 'text-zinc-400' : 'text-white/20'}`}>Aucune carte archivée</p>
                    </div>
                  )}
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* Action Menu */}
        <div className="space-y-6 pt-4 border-t border-white/5 uppercase">
           <h3 className={`text-xs font-black tracking-[0.3em] px-2 ${isSolar ? 'text-black' : 'text-white'}`}>REGLAGES SYSTÈME</h3>
          
          {/* UPGRADE BUTTON */}
          <button
            onClick={handlePayment}
            disabled={isPaying}
            className={`w-full p-6 rounded-[2rem] border-2 flex items-center justify-between transition-all group overflow-hidden relative ${
              isSolar ? 'bg-white border-black shadow-lg' : 'bg-[#c9964a]/10 border-[#c9964a]/50 shadow-[0_0_30px_rgba(201,150,74,0.1)]'
            }`}
          >
            <div className={`absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1593005517304-1935c162ebbc?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center pointer-events-none`} />
            <div className="relative flex items-center gap-5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 ${isSolar ? 'bg-black text-white border-black' : 'bg-[#c9964a] text-black border-black/20'}`}>
                {isPaying ? <Loader2 className="animate-spin" /> : <CreditCard size={28} />}
              </div>
              <div className="text-left">
                <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-1 ${isSolar ? 'text-zinc-400' : 'text-white/40'}`}>SÉCURISÉ PAR STRIPE</p>
                <h4 className={`text-lg font-black italic uppercase tracking-tighter leading-none ${isSolar ? 'text-black' : 'text-white'}`}>ONYX ACCESS (Full Pass)</h4>
                <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${isSolar ? 'text-zinc-600' : 'text-[#c9964a]'}`}>19.00€ — ACCÈS ILLIMITÉ</p>
              </div>
            </div>
            <ArrowRight size={24} className={isSolar ? 'text-black' : 'text-[#c9964a]'} />
          </button>

          {[
            { label: 'Adam Live (AI Mentor)', icon: Brain, color: isSolar ? 'text-black' : 'text-[#c9964a]', bg: isSolar ? 'bg-zinc-100' : 'bg-[#c9964a]/20', action: () => setShowMentorModal(true) },
            { label: 'Modifier Parcours / Tee', icon: Target, color: isSolar ? 'text-zinc-600' : 'text-white/40', bg: isSolar ? 'bg-zinc-100' : 'bg-white/10', action: () => {
              if(confirm("Retourner à la sélection du parcours ? Votre progression actuelle sera conservée.")) {
                setMissionStarted(false);
              }
            }},
            { label: 'Coach de Swing IA', icon: Video, color: 'text-emerald-600', bg: isSolar ? 'bg-emerald-50' : 'bg-emerald-500/10', action: () => setShowSwingCoach(true) },
            { label: 'Conditions & Confidentialité', icon: Shield, color: 'text-zinc-500', bg: isSolar ? 'bg-zinc-100' : 'bg-white/5', action: () => setShowLegal(true) },
            { label: 'Ouvrir les Paramètres', icon: Settings, color: isSolar ? 'text-black' : 'text-white', bg: isSolar ? 'bg-zinc-100' : 'bg-white/10', action: () => setShowSettingsModal(true) },
            { label: 'Règles du Golf', icon: BookOpen, color: 'text-blue-600', bg: isSolar ? 'bg-blue-50' : 'bg-blue-500/10', action: () => setShowRulesModal(true) },
            { label: 'Relancer le Tutoriel', icon: Zap, color: 'text-emerald-600', bg: isSolar ? 'bg-emerald-50' : 'bg-emerald-500/10', action: () => { localStorage.removeItem('tourSeen'); setTourSeen(false); } },
          ].map((item, idx) => (
            <button
              key={`profile-action-central-${idx}-${item.label}`}
              onClick={() => item.action && item.action()}
              className={`w-full p-5 rounded-2xl border flex items-center justify-between transition-all group ${
                item.label.includes('CONFIGURATION') 
                  ? (isSolar ? 'bg-red-50 border-red-500 shadow-sm' : 'bg-red-600/10 border-red-600 animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.1)]') 
                  : (isSolar ? 'bg-white border-zinc-200 hover:bg-zinc-50 shadow-sm' : 'bg-white/5 border-white/10 hover:bg-white/10')
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 ${item.bg} ${item.color} rounded-xl flex items-center justify-center border border-white/5`}>
                  <item.icon size={20} />
                </div>
                <span className={`font-bold uppercase tracking-widest text-[10px] ${isSolar ? 'text-black' : 'text-white'}`}>{item.label}</span>
              </div>
              <ChevronRight size={18} className={`${isSolar ? 'text-zinc-300' : 'text-white/20 group-hover:text-white'} transition-colors`} />
            </button>
          ))}
          
          {user ? (
            <button
              onClick={logout}
              className={`w-full p-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 border active:scale-[0.98] transition-all mt-8 ${isSolar ? 'bg-zinc-100 text-red-600 border-zinc-200 hover:bg-red-50 hover:border-red-200' : 'bg-red-600/10 text-red-600 border-red-600/20 hover:bg-red-600/20'}`}
            >
              <LogOut size={16} />
              DÉCONNEXION DU TERMINAL
            </button>
          ) : (
            <button
              onClick={() => window.location.reload()} // Simple way to go back to auth if they really want
              className={`w-full p-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 border active:scale-[0.98] transition-all mt-8 ${isSolar ? 'bg-black text-white border-black' : 'bg-[#c9964a]/10 text-[#c9964a] border-[#c9964a]/20 hover:bg-[#c9964a]/20'}`}
            >
              <User size={16} />
              CONNEXION (GOOGLE)
            </button>
          )}
        </div>
      </div>

      {/* Fullscreen Photo Viewer Overlay */}
      <AnimatePresence>
        {selectedAsset && (
          <motion.div
            key="asset-viewer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[200] flex flex-col items-center justify-center p-6 backdrop-blur-xl ${isSolar ? 'bg-white/95' : 'bg-black/95'}`}
          >
            <button 
              onClick={() => setSelectedAsset(null)}
              className={`absolute top-12 right-6 hover:scale-110 transition-transform ${isSolar ? 'text-black' : 'text-white/40 hover:text-white'}`}
            >
              <X size={32} />
            </button>

            <div className={`w-full max-w-lg aspect-[3/4] border rounded-[3rem] overflow-hidden relative shadow-2xl ${isSolar ? 'bg-zinc-50 border-black' : 'bg-black border-[#c9964a]/30'}`}>
               <img src={selectedAsset.imageData} alt="Tactical Plan" className="w-full h-full object-contain" />
               <div className="absolute bottom-12 left-12 right-12 flex items-center justify-between">
                  <div>
                    <h4 className={`text-3xl font-black italic uppercase tracking-tighter leading-none ${isSolar ? 'text-black' : 'text-[#c9964a]'}`}>TROU {selectedAsset.holeNumber}</h4>
                    <p className={`text-[10px] font-mono uppercase tracking-[0.3em] flex items-center gap-2 mt-2 ${isSolar ? 'text-zinc-400 font-bold' : 'text-white/40'}`}>
                      <Clock size={10} /> {new Date(selectedAsset.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button 
                    onClick={async () => {
                      if (confirm("Supprimer ce plan tactique ?")) {
                        const success = await assetService.deleteAsset(selectedAsset.id);
                        if (success) setSelectedAsset(null);
                      }
                    }}
                    className={`w-12 h-12 rounded-full border flex items-center justify-center transition-colors ${isSolar ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-600 hover:text-white' : 'bg-red-600/20 border-red-600/30 text-red-600 hover:bg-red-600 hover:text-white'}`}
                  >
                    <Trash2 size={20} />
                  </button>
               </div>
            </div>
            
            <p className={`mt-8 text-[10px] font-black uppercase tracking-[0.5em] ${isSolar ? 'text-black font-bold' : 'text-white/20'}`}>ARCHIVES TACTIQUES ONYX</p>
          </motion.div>
        )}

        {showUploadModal && (
          <motion.div
            key="upload-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[200] flex flex-col items-center justify-center p-6 backdrop-blur-xl ${isSolar ? 'bg-white/95' : 'bg-black/95'}`}
          >
            <div className={`border rounded-[2.5rem] w-full max-w-sm p-8 relative shadow-2xl ${isSolar ? 'bg-white border-black' : 'bg-[#1a1a1a] border-[#c9964a]/30'}`}>
              <button 
                onClick={() => { setShowUploadModal(false); setUploadError(null); }}
                className={`absolute top-6 right-6 hover:scale-110 transition-transform ${isSolar ? 'text-black' : 'text-white/40 hover:text-white'}`}
              >
                <X size={24} />
              </button>

              <div className="flex flex-col items-center text-center mb-8">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-inner ${isSolar ? 'bg-black text-white' : 'bg-[#c9964a]/10 text-[#c9964a]'}`}>
                  <Upload size={32} />
                </div>
                <h3 className={`text-xl font-black italic uppercase tracking-tight ${isSolar ? 'text-black' : 'text-white'}`}>DÉPÔT SÉCURISÉ</h3>
                <p className={`text-[10px] uppercase tracking-widest mt-2 ${isSolar ? 'text-zinc-500 font-bold' : 'text-white/40'}`}>Dépôt plan tactique dans le Vault</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className={`text-[8px] font-black uppercase tracking-[0.3em] mb-3 block ${isSolar ? 'text-black' : 'text-[#c9964a]'}`}>SÉLECTION DU TROU (1-18)</label>
                  <div className="grid grid-cols-6 gap-2">
                    {Array.from({ length: 18 }, (_, i) => i + 1).map(h => (
                      <button
                        key={`hole-sel-${h}`}
                        onClick={() => setHoleToUpload(h)}
                        type="button"
                        className={`aspect-square rounded-lg border font-mono text-xs flex items-center justify-center transition-all ${
                          holeToUpload === h 
                            ? (isSolar ? 'bg-black border-black text-white font-black scale-110 shadow-lg' : 'bg-[#c9964a] border-[#c9964a] text-black font-black scale-110 shadow-lg shadow-[#c9964a]/20') 
                            : (isSolar ? 'bg-white border-zinc-200 text-zinc-400' : 'bg-white/5 border-white/10 text-white/40')
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    type="button"
                    className={`w-full border p-6 rounded-2xl flex flex-col items-center gap-3 transition-colors border-dashed group ${isSolar ? 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                  >
                    {uploading ? (
                      <Loader2 size={32} className={`${isSolar ? 'text-black' : 'text-[#c9964a]'} animate-spin`} />
                    ) : (
                      <ImageIcon size={32} className={`${isSolar ? 'text-zinc-200' : 'text-white/20'} group-hover:text-white/40 transition-colors`} />
                    )}
                    <span className={`text-[10px] font-black uppercase tracking-widest text-center ${isSolar ? 'text-zinc-400' : 'text-white/40'}`}>
                      {uploading ? "SÉCURISATION EN COURS..." : "CHOISIR FICHIER TACTIQUE"}
                    </span>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      className="hidden"
                    />
                  </button>
                </div>

                {uploadError && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-center gap-3 text-red-500"
                  >
                    <AlertCircle size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-tight">{uploadError}</span>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        <RulesModal isOpen={showRulesModal} onClose={() => setShowRulesModal(false)} />
        <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
        <SwingCoachModal isOpen={showSwingCoach} onClose={() => setShowSwingCoach(false)} />
        
        <AnimatePresence>
          {showLegal && (
            <LegalPage onClose={() => setShowLegal(false)} displayMode={displayMode} />
          )}
        </AnimatePresence>
        
        {/* ARSENAL MENU OVERLAY */}
        <AnimatePresence>
          {showArsenalMenu && (
            <motion.div
              key="arsenal-menu-overlay"
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              className={`fixed inset-0 z-[300] p-6 flex flex-col pt-16 ${isSolar ? 'bg-zinc-50' : 'bg-black'}`}
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <Box size={20} className={isSolar ? 'text-black' : 'text-orange-500'} />
                  <h3 className={`font-black text-xs tracking-[0.4em] uppercase ${isSolar ? 'text-black' : 'text-white'}`}>ARSENAL TACTIQUE</h3>
                </div>
                <button 
                  onClick={() => setShowArsenalMenu(false)} 
                  className={`text-[10px] font-black border px-6 py-2 rounded-full uppercase tracking-widest active:scale-95 transition-all ${isSolar ? 'bg-black text-white border-black' : 'text-white/40 border-white/10'}`}
                >
                  Fermer
                </button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar space-y-8">
                {/* Form Selector */}
                <div className="space-y-4">
                  <p className={`text-[9px] font-black uppercase tracking-widest px-2 ${isSolar ? 'text-zinc-500' : 'text-[#c9964a]'}`}>CALIBRAGE DU TOUCHER</p>
                  <div className={`flex items-center gap-3 p-4 rounded-3xl border ${isSolar ? 'bg-white border-zinc-200 shadow-sm' : 'bg-white/5 border-white/10'}`}>
                    {[
                      { id: 'cold', label: 'Froid', icon: Snowflake, color: isSolar ? 'text-blue-600' : 'text-blue-400', bg: isSolar ? 'bg-blue-50' : 'bg-blue-400/10' },
                      { id: 'forme', label: 'En Forme', icon: Zap, color: isSolar ? 'text-emerald-600' : 'text-emerald-400', bg: isSolar ? 'bg-emerald-50' : 'bg-emerald-400/10' },
                      { id: 'pur', label: 'Toucher Pur', icon: Gem, color: isSolar ? 'text-purple-600' : 'text-purple-400', bg: isSolar ? 'bg-purple-50' : 'bg-purple-400/10' }
                    ].map(f => (
                      <button
                        key={`arsenal-form-btn-${f.id}`}
                        onClick={() => setPlayerForm(f.id)}
                        className={`flex-1 flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all ${
                          playerForm === f.id 
                            ? (isSolar ? 'border-black bg-zinc-50' : `border-${f.color.split('-')[1]}-500 bg-white/10`) 
                            : (isSolar ? 'border-zinc-100 opacity-40' : 'border-white/5 opacity-40')
                        }`}
                      >
                        <f.icon size={24} className={playerForm === f.id ? f.color : (isSolar ? 'text-zinc-200' : 'text-white')} />
                        <span className={`text-[8px] font-black uppercase tracking-widest ${playerForm === f.id ? (isSolar ? 'text-black' : 'text-white') : (isSolar ? 'text-zinc-300' : 'text-white/40')}`}>{f.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Club List */}
                <div className="space-y-4">
                  <p className={`text-[9px] font-black uppercase tracking-widest px-2 ${isSolar ? 'text-zinc-500' : 'text-[#c9964a]'}`}>DISTANCES DE RÉFÉRENCE ({units === 'yards' ? 'YARDS' : 'MÈTRES'})</p>
                  <div className="grid gap-3 pb-32">
                    {arsenal.map((club, idx) => (
                      <div key={`arsenal-club-${club.id}-${idx}`} className={`border p-5 rounded-3xl flex items-center justify-between shadow-sm transition-all ${isSolar ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-xl border flex items-center justify-center font-mono font-black italic ${isSolar ? 'bg-zinc-100 border-zinc-200 text-black shadow-inner' : 'bg-black/40 border-white/5 text-orange-500'}`}>
                            {club.type.charAt(0)}
                          </div>
                          <div>
                            <h4 className={`font-black italic uppercase tracking-tight leading-none mb-1 ${isSolar ? 'text-black' : 'text-white'}`}>{club.name}</h4>
                            <p className={`text-[8px] font-black uppercase tracking-widest ${isSolar ? 'text-zinc-300 font-bold' : 'text-white/20'}`}>{club.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => {
                              const newArsenal = [...arsenal];
                              newArsenal[idx].dist = Math.max(0, (newArsenal[idx].dist || 0) - 5);
                              setArsenal(newArsenal);
                            }}
                            className={`w-10 h-10 rounded-xl border flex items-center justify-center active:scale-95 transition-all shadow-sm ${isSolar ? 'bg-zinc-50 border-zinc-200 text-zinc-300' : 'bg-white/5 border-white/10 text-white/40'}`}
                          >
                            <Minus size={16} />
                          </button>
                          <div className="w-20 text-center">
                            <span className={`text-3xl font-black font-mono italic ${isSolar ? 'text-black' : 'text-[#c9964a]'}`}>{club.dist || '--'}</span>
                          </div>
                          <button 
                            onClick={() => {
                              const newArsenal = [...arsenal];
                              newArsenal[idx].dist = (newArsenal[idx].dist || 0) + 5;
                              setArsenal(newArsenal);
                            }}
                            className={`w-10 h-10 rounded-xl border flex items-center justify-center active:scale-95 transition-all shadow-sm ${isSolar ? 'bg-black border-black text-white' : 'bg-white/10 border-white/10 text-white'}`}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </AnimatePresence>
    </div>
  );
}
