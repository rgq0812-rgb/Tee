import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Trophy, Share2, Heart, MessageSquare, Send, 
  Award, Zap, Star, Layout as LayoutIcon, Globe,
  UserPlus, Flame, Target, Shield, ChevronRight, Search,
  Instagram, Twitter, Facebook, Link as LinkIcon, Info, Brain, X, Plus, Image as ImageIcon, Camera, Loader2, Sparkles, Download
} from 'lucide-react';
import { useAuth } from '../services/AuthProvider';
import { toPng } from 'html-to-image';
import { useRef } from 'react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  reward: string;
  participants: number;
  type: 'precision' | 'power' | 'mental';
  active: boolean;
}

interface Post {
  id: string;
  user: {
    name: string;
    avatar?: string;
    level: string;
  };
  content: string;
  image?: string;
  likes: number;
  isLiked?: boolean;
  comments: number;
  time: string;
  type: 'exploit' | 'status' | 'challenge';
}

export default function Community({ displayMode }: { displayMode?: 'tactical' | 'solar' }) {
  const { user } = useAuth();
  const isSolar = displayMode === 'solar';
  const [activeSubTab, setActiveSubTab] = useState<'feed' | 'challenges' | 'friends'>('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [showShare8K, setShowShare8K] = useState(false);
  const [selectedPostForShare, setSelectedPostForShare] = useState<Post | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleExportHQ = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 150));
      const dataUrl = await toPng(cardRef.current, { quality: 1, pixelRatio: 2, backgroundColor: '#000000' });
      
      const link = document.createElement('a');
      link.download = `ONYX_Network_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      if (navigator.share) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], 'ONYX_Network.png', { type: 'image/png' });
        await navigator.share({
          files: [file],
          title: 'ONYX Network Post',
          text: selectedPostForShare?.content || 'Check this out on THE CHOSE!'
        }).catch(() => {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const [posts, setPosts] = useState<Post[]>([
    { 
      id: 'p1', 
      user: { name: 'JEAN-MICHEL', level: 'ONYX MASTER' }, 
      content: 'Nouveau record personnel à Joyenval ! Grâce aux conseils d\'ADAM sur le trou 14, j\'ai sauvé le par après un drive dans le bunker. La stratégie prime.',
      likes: 24, 
      comments: 5, 
      time: '12m',
      type: 'exploit'
    },
    { 
      id: 'p2', 
      user: { name: 'SARAH G.', level: 'OPERATIVE' }, 
      content: 'Qui est chaud pour un défi de putting ce weekend ? Le perdant paie la tournée au 19ème trou ! 🍻',
      likes: 12, 
      comments: 8, 
      time: '45m',
      type: 'challenge'
    },
    { 
      id: 'p3', 
      user: { name: 'ONYX_HQ', level: 'SYSTEM' }, 
      content: 'Mise à jour du protocole tactique v2.4 déployée. Analyse des pentes de green améliorée de 15%.',
      likes: 156, 
      comments: 0, 
      time: '2h',
      type: 'status',
      image: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?q=80&w=2000&auto=format&fit=crop'
    }
  ]);

  const handleLike = (id: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, likes: p.isLiked ? p.likes - 1 : p.likes + 1, isLiked: !p.isLiked };
      }
      return p;
    }));
  };

  const handleShare = (post: Post) => {
    setSelectedPostForShare(post);
    setShowShare8K(true);
  };

  const handleCreatePost = () => {
    if (!newPostContent.trim()) return;
    const newPost: Post = {
      id: Date.now().toString(),
      user: { name: user?.displayName || 'ONYX_OPERATIVE', level: 'OPERATIVE' },
      content: newPostContent,
      likes: 0,
      comments: 0,
      time: 'Maintenant',
      type: 'status'
    };
    setPosts([newPost, ...posts]);
    setNewPostContent('');
    setShowCreatePost(false);
  };

  const challenges: Challenge[] = [
    { id: '1', title: 'ONYX PRECISION', description: 'Atteindre 100% de GIR sur 9 trous consécutifs.', reward: 'Badge Précision Élite', participants: 124, type: 'precision', active: true },
    { id: '2', title: 'POWER BOMBER', description: 'Drive de plus de 280m mesuré par le capteur.', reward: 'XP +500', participants: 89, type: 'power', active: true },
    { id: '3', title: 'MENTAL TITAN', description: 'Terminer un tour complet sans aucun double bogey.', reward: 'Statut Vétéran', participants: 45, type: 'mental', active: false },
  ];

  const shareCapabilities = [
    { name: 'Instagram', icon: Instagram, color: 'hover:text-pink-500', action: handleExportHQ },
    { name: 'Twitter', icon: Twitter, color: 'hover:text-sky-400', action: handleExportHQ },
    { name: 'Facebook', icon: Facebook, color: 'hover:text-blue-600', action: handleExportHQ },
    { name: 'Copy Link', icon: LinkIcon, color: 'hover:text-emerald-500', action: () => {
      navigator.clipboard.writeText(window.location.href);
      alert('Lien copié dans le presse-papier !');
    }},
  ];

  return (
    <div className={`relative min-h-screen pb-40 ${isSolar ? 'text-black' : 'text-white'}`}>
      
      {/* Search & Header */}
      <div className="pt-6 px-4 space-y-6">
        <div className="flex justify-between items-center">
          <div>
             <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none mb-1">RÉSEAU</h2>
             <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${isSolar ? 'text-zinc-400' : 'text-[#c9964a]'}`}>INNER CIRCLE ONYX</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowCreatePost(true)}
              className={`p-3 rounded-full border shadow-lg transition-all active:scale-95 ${isSolar ? 'bg-black text-white border-black' : 'bg-[#c9964a] border-black text-black'}`}
            >
              <Plus size={20} />
            </button>
            <button className={`p-3 rounded-full border transition-all ${isSolar ? 'bg-white border-zinc-200 text-black' : 'bg-white/5 border-white/10 text-white/40'}`}>
              <UserPlus size={20} />
            </button>
          </div>
        </div>

        <div className="relative group">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isSolar ? 'text-zinc-300' : 'text-white/20'}`} size={18} />
          <input 
            type="text" 
            placeholder="RECHERCHER UN OPÉRATIVE..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full h-14 pl-12 pr-6 rounded-2xl border-2 outline-none transition-all font-black text-xs tracking-widest ${isSolar ? 'bg-zinc-100 border-transparent focus:bg-white focus:border-black text-black' : 'bg-white/5 border-transparent focus:bg-white/10 focus:border-[#c9964a] text-white'}`}
          />
        </div>

        {/* Global Stats Bar */}
        <div className={`grid grid-cols-3 gap-2 p-2 rounded-2xl border ${isSolar ? 'bg-zinc-100 border-zinc-200' : 'bg-white/5 border-white/10'}`}>
           <div className="text-center py-2">
             <p className={`text-[7px] font-black uppercase tracking-widest leading-none mb-1 ${isSolar ? 'text-zinc-400' : 'text-white/40'}`}>En Ligne</p>
             <p className="text-sm font-black font-mono">1.2k</p>
           </div>
           <div className="text-center py-2 border-x border-white/10">
             <p className={`text-[7px] font-black uppercase tracking-widest leading-none mb-1 ${isSolar ? 'text-zinc-400' : 'text-white/40'}`}>Défis Actifs</p>
             <p className="text-sm font-black font-mono text-[#c9964a]">842</p>
           </div>
           <div className="text-center py-2">
             <p className={`text-[7px] font-black uppercase tracking-widest leading-none mb-1 ${isSolar ? 'text-zinc-400' : 'text-white/40'}`}>Réputation</p>
             <p className="text-sm font-black font-mono text-emerald-500">MAX</p>
           </div>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className={`sticky top-0 z-50 px-4 py-4 backdrop-blur-xl flex gap-2 ${isSolar ? 'bg-white/90 border-b border-zinc-100' : 'bg-black/90 border-b border-white/5'}`}>
        {[
          { id: 'feed', label: 'FLUX', icon: LayoutIcon },
          { id: 'challenges', label: 'DÉFIS', icon: Flame },
          { id: 'friends', label: 'EQUIPE', icon: Users },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveSubTab(t.id as any)}
            className={`flex-1 h-12 rounded-xl flex items-center justify-center gap-2 transition-all p-2 ${
              activeSubTab === t.id 
                ? (isSolar ? 'bg-black text-white shadow-xl' : 'bg-[#c9964a] text-black shadow-lg shadow-[#c9964a]/20') 
                : (isSolar ? 'bg-zinc-100 text-zinc-400' : 'bg-white/5 text-white/30 hover:bg-white/10')
            }`}
          >
            <t.icon size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="px-4 py-6">
        <AnimatePresence mode="wait">
          {activeSubTab === 'feed' && (
            <motion.div 
              key="feed-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {posts.map((post, idx) => (
                <div key={post.id} className={`border rounded-[2.5rem] p-6 space-y-4 shadow-sm relative overflow-hidden group ${isSolar ? 'bg-white border-zinc-100' : 'bg-zinc-900/50 border-white/5'}`}>
                  {post.type === 'exploit' && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#c9964a]" />
                  )}
                  
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center overflow-hidden ${isSolar ? 'bg-zinc-100 border-black' : 'bg-[#c9964a]/10 border-[#c9964a]/20 text-[#c9964a]'}`}>
                        <Users size={16} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black italic uppercase tracking-tighter flex items-center gap-2">
                          {post.user.name}
                          {post.user.level === 'SYSTEM' && <Shield size={10} className="text-red-500" />}
                        </h4>
                        <p className={`text-[8px] font-black uppercase tracking-widest ${isSolar ? 'text-zinc-400' : 'text-white/20'}`}>{post.user.level}</p>
                      </div>
                    </div>
                    <span className={`text-[8px] font-mono font-black ${isSolar ? 'text-zinc-300' : 'text-white/10'}`}>{post.time}</span>
                  </div>

                  <p className={`text-xs leading-relaxed font-medium ${isSolar ? 'text-zinc-600' : 'text-white/70'}`}>
                    {post.content}
                  </p>

                  {post.image && (
                    <div className="rounded-3xl overflow-hidden border border-white/5 aspect-video">
                      <img src={post.image} alt="Post content" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-6">
                      <button 
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-2 transition-colors ${post.isLiked ? 'text-red-500' : (isSolar ? 'text-zinc-400 hover:text-red-500' : 'text-white/20 hover:text-red-500')}`}
                      >
                        <Heart size={16} fill={post.isLiked ? 'currentColor' : 'none'} />
                        <span className="text-[10px] font-black font-mono">{post.likes}</span>
                      </button>
                      <button className={`flex items-center gap-2 transition-colors ${isSolar ? 'text-zinc-400 hover:text-blue-500' : 'text-white/20 hover:text-blue-500'}`}>
                        <MessageSquare size={16} />
                        <span className="text-[10px] font-black font-mono">{post.comments}</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleShare(post)}
                        className={`p-2 transition-all ${isSolar ? 'text-zinc-300' : 'text-white/10 hover:text-[#c9964a]'}`}
                      >
                        <Share2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeSubTab === 'challenges' && (
            <motion.div 
              key="challenges-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className={`p-8 rounded-[3rem] border border-dashed flex flex-col items-center text-center gap-4 mb-8 ${isSolar ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border-white/10'}`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${isSolar ? 'bg-black text-white border-black' : 'bg-[#c9964a]/10 border-[#c9964a]/30 text-[#c9964a]'}`}>
                  <Award size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black italic uppercase tracking-tight">CRÉER UN DÉFI</h3>
                  <p className={`text-[10px] font-black uppercase tracking-widest mt-2 opacity-50`}>Défiez vos amis ou la communauté</p>
                </div>
                <button 
                  onClick={() => alert("Protocole de Défi activé. Sélectionnez une cible.")}
                  className={`mt-4 px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.3em] active:scale-95 transition-all shadow-lg ${isSolar ? 'bg-black text-white shadow-black/20' : 'bg-[#c9964a] text-black shadow-[#c9964a]/20'}`}
                >
                  Lancer Mission
                </button>
              </div>

              {challenges.map((ch) => (
                <div key={ch.id} className={`border rounded-[2.5rem] p-6 space-y-4 relative overflow-hidden group shadow-sm transition-all ${isSolar ? 'bg-white border-zinc-100 hover:border-black' : 'bg-zinc-900 border-white/5 hover:border-[#c9964a]/30'}`}>
                  <div className={`absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity ${isSolar ? 'text-black' : 'text-[#c9964a]'}`}>
                    {ch.type === 'precision' ? <Target size={80} /> : ch.type === 'power' ? <Zap size={80} /> : <Brain size={80} />}
                  </div>

                  <div className="flex justify-between items-start pt-2 relative z-10">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${ch.active ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className={`text-[8px] font-black uppercase tracking-widest opacity-50`}>{ch.active ? 'EN COURS' : 'TERMINÉ'}</span>
                      </div>
                      <h4 className="text-lg font-black italic uppercase tracking-tighter leading-none mb-1">{ch.title}</h4>
                      <p className={`text-[9px] font-black uppercase tracking-widest ${isSolar ? 'text-[#c9964a]' : 'text-[#c9964a]'}`}>{ch.reward}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-[8px] font-black uppercase tracking-widest ${isSolar ? 'text-zinc-300' : 'text-white/20'}`}>OPERATIVES</p>
                      <p className="text-xl font-black font-mono">{ch.participants}</p>
                    </div>
                  </div>

                  <p className={`text-[11px] leading-relaxed relative z-10 ${isSolar ? 'text-zinc-600' : 'text-white/60'}`}>
                    {ch.description}
                  </p>

                  <div className="pt-4 flex gap-3 relative z-10">
                    <button 
                      onClick={() => alert(`Vous avez rejoint le défi ${ch.title} !`)}
                      className={`flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${isSolar ? 'bg-black text-white hover:bg-zinc-800' : 'bg-white text-black hover:bg-[#c9964a]'}`}
                    >
                      REJOINDRE
                    </button>
                    <button className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-colors ${isSolar ? 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:text-black hover:border-black' : 'bg-white/5 border-white/10 text-white/20 hover:text-white hover:border-[#c9964a]/30'}`}>
                      <Info size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeSubTab === 'friends' && (
            <motion.div 
              key="friends-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={`friend-${i}`} className={`border rounded-[2rem] p-4 flex items-center justify-between shadow-sm ${isSolar ? 'bg-white border-zinc-100' : 'bg-white/5 border-white/5'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center relative overflow-hidden ${isSolar ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-800 border-white/5'}`}>
                      <Users size={20} className={isSolar ? 'text-zinc-300' : 'text-white/20'} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black italic uppercase tracking-tighter">OPERATIVE #{1000 + i}</h4>
                      <p className={`text-[8px] font-black uppercase tracking-widest ${isSolar ? 'text-emerald-600' : 'text-emerald-500'}`}>SUR LE TERRAIN • JOYENVAL</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => alert(`Transmission de données tactiques à Operative #${1000+i}...`)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${isSolar ? 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:text-black hover:border-black shadow-sm' : 'bg-white/5 border-white/10 text-white/20 hover:bg-[#c9964a]/20 hover:text-[#c9964a] hover:border-[#c9964a]/30'}`}
                    >
                      <Send size={14} />
                    </button>
                    <button 
                      onClick={() => alert(`DÉFI DIRECT lancé à Operative #${1000+i} ! Attente de confirmation.`)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${isSolar ? 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:text-black hover:border-black shadow-sm' : 'bg-white/5 border-white/10 text-white/20 hover:bg-[#c9964a]/20 hover:text-[#c9964a] hover:border-[#c9964a]/30'}`}
                    >
                      <Target size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreatePost && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[200] p-6 flex items-center justify-center backdrop-blur-2xl ${isSolar ? 'bg-white/80' : 'bg-black/80'}`}
          >
            <div className={`w-full max-w-sm border rounded-[3rem] p-8 shadow-2xl relative ${isSolar ? 'bg-white border-black' : 'bg-[#1a1a1a] border-[#c9964a]/30'}`}>
               <button onClick={() => setShowCreatePost(false)} className="absolute top-6 right-6 opacity-40 hover:opacity-100 transition-opacity"><X size={24} /></button>
               
               <div className="flex flex-col items-center text-center mb-8">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${isSolar ? 'bg-black text-white' : 'bg-[#c9964a] text-black'}`}>
                    <Plus size={28} />
                  </div>
                  <h3 className="text-xl font-black italic uppercase tracking-tight">NOUVELLE PUBLICATION</h3>
                  <p className={`text-[10px] font-black uppercase tracking-widest mt-2 opacity-50`}>Partagez votre progression tactique</p>
               </div>

               <textarea 
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="EXFILTRER VOS PENSÉES..."
                  className={`w-full h-40 p-5 rounded-3xl border-2 outline-none transition-all font-black text-xs tracking-widest no-scrollbar resize-none ${isSolar ? 'bg-zinc-50 border-zinc-100 focus:bg-white focus:border-black text-black' : 'bg-white/5 border-white/5 focus:bg-white/10 focus:border-[#c9964a] text-white'}`}
               />

               <div className="flex gap-2 mt-6">
                  <button className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-colors ${isSolar ? 'bg-zinc-100 border-zinc-200 text-black shadow-sm' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}>
                    <ImageIcon size={18} />
                  </button>
                  <button 
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim()}
                    className={`flex-1 h-12 rounded-xl font-black text-[10px] uppercase tracking-[0.3em] transition-all active:scale-95 shadow-lg ${isSolar ? 'bg-black text-white' : 'bg-[#c9964a] text-black shadow-[#c9964a]/20 disabled:opacity-50'}`}
                  >
                    DIFFUSER
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 8K SHARE MODAL (Premium Style) */}
      <AnimatePresence>
        {showShare8K && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[300] flex flex-col items-center justify-center p-6 backdrop-blur-3xl bg-black/95`}
          >
            <button 
              onClick={() => setShowShare8K(false)}
              className="absolute top-12 right-6 p-4 text-white/20 hover:text-white transition-colors"
            >
              <X size={32} />
            </button>

            <motion.div 
              id="the-chose-8k-card"
              ref={cardRef}
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-sm aspect-[9/16] bg-black border-[3px] border-[#c9964a]/40 rounded-[3.5rem] relative overflow-hidden shadow-[0_0_80px_rgba(201,150,74,0.15)] flex flex-col"
            >
               {/* Aesthetic Background */}
               <div className="absolute inset-0 opacity-20 pointer-events-none">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#c9964a] blur-[120px] rounded-full translate-x-32 -translate-y-32" />
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#c9964a] blur-[120px] rounded-full -translate-x-32 translate-y-32" />
                  <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, #c9964a 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.2 }} />
               </div>

               {/* Card Content */}
               <div className="flex-1 p-10 flex flex-col items-center justify-center text-center relative z-10">
                  <div className="w-24 h-24 rounded-full border-4 border-[#c9964a] flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(201,150,74,0.3)] bg-black">
                    <img 
                      src={`https://ui-avatars.com/api/?name=${selectedPostForShare?.user.name}&background=c9964a&color=000&bold=true&size=128`} 
                      alt="Onyx Operative" 
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  
                  <h3 className="text-4xl font-black italic italic uppercase tracking-tighter text-white mb-2 leading-none">
                    {selectedPostForShare?.user.name}
                  </h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#c9964a] mb-12">OPERATIVE ELITE ONYX</p>

                  <div className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 space-y-6 mb-8 text-left">
                     <div className="flex items-center gap-3">
                        <Sparkles size={20} className="text-[#c9964a]" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#c9964a]">MISSION TACTIQUE RÉUSSIE</span>
                     </div>
                     <p className="text-lg font-black leading-snug italic text-white/90">
                       "{selectedPostForShare?.content}"
                     </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 w-full">
                     <div className="bg-white/5 border border-white/10 p-5 rounded-3xl">
                        <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">SCORE</p>
                        <p className="text-xl font-black font-mono text-emerald-500">-2</p>
                     </div>
                     <div className="bg-white/5 border border-white/10 p-5 rounded-3xl">
                        <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">GIR%</p>
                        <p className="text-xl font-black font-mono text-[#c9964a]">78%</p>
                     </div>
                  </div>
               </div>

               {/* Footer */}
               <div className="p-10 border-t border-white/5 bg-white/5 backdrop-blur-xl flex flex-col items-center justify-center gap-4">
                  <div className="flex items-center gap-6">
                    <img src="/logo.svg" className="h-6 w-auto grayscale opacity-50" alt="Logo" />
                    <span className="text-[10px] font-black uppercase tracking-[0.6em] text-white/40">THE CHOSE • ONYX V2</span>
                  </div>
               </div>
            </motion.div>

            {/* Sharing Options */}
            <div className="mt-12 w-full max-w-sm space-y-6">
               <div className="flex items-center justify-center gap-4">
                 {shareCapabilities.map(s => (
                   <button 
                     key={`8k-share-${s.name}`}
                     onClick={s.action}
                     className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#c9964a] hover:bg-[#c9964a] hover:text-black transition-all shadow-xl active:scale-95"
                   >
                     <s.icon size={20} />
                   </button>
                 ))}
               </div>
               <button 
                 onClick={handleExportHQ}
                 disabled={isExporting}
                 className="w-full h-16 rounded-full bg-white text-black font-black text-xs uppercase tracking-[0.4em] shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
               >
                 {isExporting ? <Loader2 className="animate-spin" /> : <Download size={18} />}
                 {isExporting ? 'EXPORTATION...' : 'TÉLÉCHARGER EXPORT HQ'}
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Share Floating Panel (Repurposed for main post creation tip) */}
      <div className="fixed bottom-32 left-4 right-4 z-[60]">
        <motion.div 
          initial={{ y: 0 }}
          animate={{ y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className={`p-6 rounded-[2.5rem] border backdrop-blur-2xl shadow-3xl flex items-center justify-between ${isSolar ? 'bg-white border-black text-black' : 'bg-black/80 border-[#c9964a]/20 text-white'}`}
        >
           <div className="flex items-center gap-3">
             <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${isSolar ? 'bg-black text-white' : 'bg-[#c9964a] text-black'}`}>
               <Globe size={20} />
             </div>
             <div>
               <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">PARTAGEZ VOTRE ERE ONYX</p>
               <p className={`text-[8px] font-black uppercase tracking-[0.2em] ${isSolar ? 'text-zinc-400' : 'text-white/40'}`}>Exportation 8K disponible pour chaque post</p>
             </div>
           </div>
           <button 
             onClick={() => setShowCreatePost(true)}
             className={`px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${isSolar ? 'bg-black text-white' : 'bg-[#c9964a] text-black shadow-[#c9964a]/20'}`}
           >
             PUBLIER
           </button>
        </motion.div>
      </div>
    </div>
  );
}
