import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { logout, db, handleFirestoreError, OperationType } from '../services/firebase';
import { useAuth } from '../services/AuthProvider';
import { collection, query, where, getDocs, onSnapshot, addDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, User, Settings, Shield, Award, Image as ImageIcon, ChevronRight, X, Clock, Box, Zap, Snowflake, Gem, Target, Plus, Upload, Loader2, AlertCircle, BookOpen } from 'lucide-react';
import { useAmbientSound } from '../hooks/use-ambient-sound';
import RulesModal from './RulesModal';

export default function Profile({ selectedCourse, arsenal, setArsenal, playerForm, setPlayerForm, handicap, setHandicap, setTourSeen }: { selectedCourse: any, arsenal: any[], setArsenal: any, playerForm: string, setPlayerForm: any, handicap: number, setHandicap: any, setTourSeen: (val: boolean) => void, key?: string }) {
  const { user } = useAuth();
  const { playPing } = useAmbientSound();
  const [assets, setAssets] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [holeToUpload, setHoleToUpload] = useState<number>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    
    // Real-time listener for tactical photos
    const q = query(collection(db, 'hole_assets'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAssets(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'hole_assets');
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

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

  return (
    <div className="relative -mx-6 -mt-6 min-h-[calc(100vh-140px)] p-6 bg-black text-white font-sans overflow-y-auto">
      {/* Background with Cinematic Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none">
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
            <div className="w-28 h-28 bg-[#c9964a]/10 rounded-full flex items-center justify-center text-[#c9964a] mb-6 overflow-hidden border-2 border-[#c9964a]/30 shadow-[0_0_30px_rgba(201,150,74,0.1)]">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User size={48} />
              )}
            </div>
            <div className="absolute -bottom-2 right-4 bg-red-600 text-white p-2 rounded-full border-2 border-black shadow-lg">
              <Shield size={14} />
            </div>
          </div>
          
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">{user?.displayName || "Agent Tactique"}</h2>
          <p className="text-[10px] font-mono text-[#c9964a] tracking-[0.3em] uppercase mt-2 font-bold">{user?.email}</p>
          
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm mt-8">
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col items-center">
              <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Handicap</p>
              <p className="text-xl font-black font-mono text-[#c9964a]">{handicap}</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col items-center">
              <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">XP Élite</p>
              <p className="text-xl font-black font-mono text-red-600">4,250</p>
            </div>
          </div>
        </div>

        {/* Tactical Photo Gallery (Hole Assets from Firebase) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <ImageIcon size={16} className="text-[#c9964a]" />
              <h3 className="text-xs font-black tracking-[0.3em] uppercase text-white">VAULT TACTIQUE</h3>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-mono font-bold text-white/20">{assets.length} FICHIERS</span>
              <button 
                onClick={() => setShowUploadModal(true)}
                className="w-8 h-8 rounded-lg bg-[#c9964a] flex items-center justify-center text-black shadow-lg shadow-[#c9964a]/20 active:scale-95 transition-transform"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {loading ? (
             <div className="grid grid-cols-3 gap-2">
                {[1,2,3].map(i => <div key={i} className="aspect-square bg-white/5 rounded-xl animate-pulse" />)}
             </div>
          ) : assets.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
               {assets.map((asset) => (
                 <motion.button
                   key={asset.id}
                   whileTap={{ scale: 0.95 }}
                   onClick={() => setSelectedAsset(asset)}
                   className="relative aspect-square rounded-xl overflow-hidden border border-white/5 group"
                 >
                   <img src={asset.imageData} alt="Tactical plan" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                   <div className="absolute bottom-2 left-2 text-[10px] font-black italic text-white leading-none">
                     T{asset.holeNumber}
                   </div>
                 </motion.button>
               ))}
            </div>
          ) : (
            <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-12 text-center flex flex-col items-center gap-3">
              <ImageIcon size={32} className="text-white/10" />
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Aucune photo tactique enregistrée</p>
            </div>
          )}
        </div>

        {/* Action Menu */}
        <div className="space-y-6">
          {/* HANDICAP CONFIGURATION SECTION */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 px-2">
                <Target size={16} className="text-emerald-500" />
                <h3 className="text-xs font-black tracking-[0.3em] uppercase text-white">INDEX DE JEU (HANDICAP)</h3>
             </div>
             <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest text-left">Niveau Actuel</span>
                    <span className="text-3xl font-black text-emerald-500">{Number(handicap).toFixed(1)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    <button 
                      onClick={() => setHandicap((prev: number) => parseFloat(Math.max(0, prev - 1).toFixed(1)))}
                      className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold hover:bg-red-500/10 hover:border-red-500/30 transition-all text-white/40 text-[10px]"
                    >-1</button>
                    <button 
                      onClick={() => setHandicap((prev: number) => parseFloat(Math.max(0, prev - 0.1).toFixed(1)))}
                      className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all text-white"
                    >-0.1</button>
                    <button 
                      onClick={() => setHandicap((prev: number) => parseFloat(Math.min(54, prev + 0.1).toFixed(1)))}
                      className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-500"
                    >+0.1</button>
                    <button 
                      onClick={() => setHandicap((prev: number) => parseFloat(Math.min(54, prev + 1).toFixed(1)))}
                      className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center font-bold text-black shadow-lg shadow-emerald-500/20"
                    >+1</button>
                  </div>
                </div>
                
                <input 
                  type="range" 
                  min="0" 
                  max="54" 
                  step="0.1" 
                  value={handicap} 
                  onChange={(e) => setHandicap(parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                
                <div className="flex justify-between text-[8px] font-black text-white/20 uppercase tracking-widest">
                  <span>PRO (0)</span>
                  <span>DÉBUTANT (54)</span>
                </div>
             </div>
          </div>

          {/* ARSENAL CONFIGURATION SECTION */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 px-2">
                <Box size={16} className="text-orange-500" />
                <h3 className="text-xs font-black tracking-[0.3em] uppercase text-white">CONFIGURATION ARSENAL</h3>
             </div>
             
             <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                {/* Form Selector inside Arsenal Config */}
                <div className="p-4 border-b border-white/10 bg-white/5">
                   <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-3">ÉTAT DU TOUCHER (MAINTENANT)</p>
                   <div className="flex items-center gap-2">
                      {[
                        { id: 'cold', label: 'Froid', icon: Snowflake, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                        { id: 'hot', label: 'Forme', icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                        { id: 'pure', label: 'Pure', icon: Gem, color: 'text-purple-400', bg: 'bg-purple-400/10' }
                      ].map(f => (
                        <button
                          key={f.id}
                          onClick={() => setPlayerForm(f.id)}
                          className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                            playerForm === f.id ? `border-${f.color.split('-')[1]}-500/50 ${f.bg}` : 'border-white/5 bg-transparent opacity-40'
                          }`}
                        >
                          <f.icon size={16} className={playerForm === f.id ? f.color : 'text-white'} />
                          <span className={`text-[7px] font-black uppercase tracking-widest ${playerForm === f.id ? f.color : 'text-white'}`}>{f.label}</span>
                        </button>
                      ))}
                   </div>
                </div>

                {/* Full Club List */}
                <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto no-scrollbar">
                   {arsenal.map((club, idx) => (
                      <div key={club.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                         <div className="flex flex-col">
                            <span className="text-[7px] font-black text-orange-500/60 uppercase tracking-widest">{club.type}</span>
                            <span className="text-sm font-bold text-white">{club.name}</span>
                         </div>
                         <div className="flex items-center gap-3">
                            <input 
                              type="number" 
                              value={club.dist} 
                              onChange={(e) => {
                                const newArsenal = [...arsenal];
                                newArsenal[idx].dist = parseInt(e.target.value) || 0;
                                setArsenal(newArsenal);
                              }}
                              className="w-16 bg-black border border-white/10 rounded-lg p-2 text-center font-mono text-white text-xs focus:border-orange-500/50 outline-none"
                            />
                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">M</span>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>

          {[
            { label: 'Règles & Étiquette Golf', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10', action: () => setShowRulesModal(true) },
            { label: 'Introduction ONYX (Elite Mode)', icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-500/10', action: () => { localStorage.removeItem('tourSeen'); setTourSeen(false); } },
            { label: 'Succès & Badges', icon: Award, color: 'text-purple-600', bg: 'bg-purple-600/10' },
            { label: 'Paramètres ONYX', icon: Settings, color: 'text-[#c9964a]', bg: 'bg-[#c9964a]/10' },
          ].map((item: any, i) => (
            <button
              key={i}
              onClick={() => item.action && item.action()}
              className="w-full bg-white/5 p-5 rounded-2xl border border-white/10 flex items-center justify-between hover:bg-white/10 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 ${item.bg} ${item.color} rounded-xl flex items-center justify-center border border-white/5`}>
                  <item.icon size={20} />
                </div>
                <span className="font-bold text-white uppercase tracking-widest text-[10px]">{item.label}</span>
              </div>
              <ChevronRight size={18} className="text-white/20 group-hover:text-white transition-colors" />
            </button>
          ))}
          
          <button
            onClick={logout}
            className="w-full bg-red-600/10 text-red-600 p-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 border border-red-600/20 active:scale-[0.98] transition-all hover:bg-red-600/20 mt-8"
          >
            <LogOut size={16} />
            DÉCONNEXION DU TERMINAL
          </button>
        </div>
      </div>

      {/* Fullscreen Photo Viewer Overlay */}
      <AnimatePresence>
        {selectedAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6"
          >
            <button 
              onClick={() => setSelectedAsset(null)}
              className="absolute top-12 right-6 text-white/40 hover:text-white"
            >
              <X size={32} />
            </button>

            <div className="w-full max-w-lg aspect-[3/4] bg-black border border-[#c9964a]/30 rounded-[3rem] overflow-hidden relative shadow-2xl">
               <img src={selectedAsset.imageData} alt="Tactical Plan" className="w-full h-full object-contain" />
               <div className="absolute bottom-12 left-12 right-12 flex items-center justify-between">
                  <div>
                    <h4 className="text-3xl font-black italic text-[#c9964a] uppercase tracking-tighter leading-none">TROU {selectedAsset.holeNumber}</h4>
                    <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em] flex items-center gap-2 mt-2">
                      <Clock size={10} /> {new Date(selectedAsset.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
               </div>
            </div>
            
            <p className="mt-8 text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">ARCHIVES TACTIQUES ONYX</p>
          </motion.div>
        )}

        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6"
          >
            <div className="bg-[#1a1a1a] border border-[#c9964a]/30 rounded-[2.5rem] w-full max-w-sm p-8 relative shadow-2xl">
              <button 
                onClick={() => { setShowUploadModal(false); setUploadError(null); }}
                className="absolute top-6 right-6 text-white/40 hover:text-white"
              >
                <X size={24} />
              </button>

              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 bg-[#c9964a]/10 rounded-full flex items-center justify-center text-[#c9964a] mb-4 shadow-inner">
                  <Upload size={32} />
                </div>
                <h3 className="text-xl font-black text-white italic uppercase tracking-tight">DÉPÔT SÉCURISÉ</h3>
                <p className="text-white/40 text-[10px] uppercase tracking-widest mt-2">Dépôt plan tactique dans le Vault</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[8px] font-black text-[#c9964a] uppercase tracking-[0.3em] mb-3 block">SÉLECTION DU TROU (1-18)</label>
                  <div className="grid grid-cols-6 gap-2">
                    {Array.from({ length: 18 }, (_, i) => i + 1).map(h => (
                      <button
                        key={h}
                        onClick={() => setHoleToUpload(h)}
                        type="button"
                        className={`aspect-square rounded-lg border font-mono text-xs flex items-center justify-center transition-all ${
                          holeToUpload === h ? 'bg-[#c9964a] border-[#c9964a] text-black font-black scale-110 shadow-lg shadow-[#c9964a]/20' : 'bg-white/5 border-white/10 text-white/40'
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
                    className="w-full bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col items-center gap-3 hover:bg-white/10 transition-colors border-dashed group"
                  >
                    {uploading ? (
                      <Loader2 size={32} className="text-[#c9964a] animate-spin" />
                    ) : (
                      <ImageIcon size={32} className="text-white/20 group-hover:text-white/40 transition-colors" />
                    )}
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest text-center">
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
      </AnimatePresence>
    </div>
  );
}
