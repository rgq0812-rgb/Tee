import React, { useState } from 'react';
import { loginWithEmail, registerWithEmail } from '../services/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, ChevronRight, Mail, Lock, User as UserIcon, ArrowLeft } from 'lucide-react';

type AuthMode = 'initial' | 'email-login' | 'email-signup';

export default function AuthScreen({ onGuest }: { onGuest: () => void }) {
  const [mode, setMode] = useState<AuthMode>('initial');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: ''
  });

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'email-login') {
        await loginWithEmail(formData.email, formData.password);
      } else {
        if (!formData.displayName) throw new Error("Le nom d'affichage est requis");
        await registerWithEmail(formData.email, formData.password, formData.displayName);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let message = "Erreur d'authentification";
      if (err.code === 'auth/user-not-found') message = "Utilisateur non trouvé";
      if (err.code === 'auth/wrong-password') message = "Mot de passe incorrect";
      if (err.code === 'auth/email-already-in-use') message = "Cet email est déjà utilisé";
      if (err.code === 'auth/weak-password') message = "Mot de passe trop court";
      if (err.code === 'auth/invalid-email') message = "Format d'email invalide";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = "w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-12 text-sm focus:border-[#c9964a]/50 focus:ring-1 focus:ring-[#c9964a]/50 outline-none transition-all placeholder:text-white/20";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Image with Blur */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1587174486073-ae5e5cff02b9?auto=format&fit=crop&q=80&w=2070" 
          className="w-full h-full object-cover opacity-60 blur-sm grayscale-[0.2]"
          alt="Golf background" 
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/95 via-black/60 to-[#0a0a0a]" />
      </div>

      {/* Large Abstract Background Logo */}
      <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none select-none">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.08, scale: 1 }}
          transition={{ duration: 2.5, ease: "easeOut" }}
          className="text-[45rem] font-serif font-black italic tracking-tighter leading-none text-white blur-[2px]"
        >
          TC
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 w-full max-w-md crystal-panel p-8 md:p-12 rounded-[3rem] flex flex-col items-center relative"
      >
        {mode !== 'initial' && (
          <button 
            onClick={() => { setMode('initial'); setError(null); }}
            className="absolute top-8 left-8 text-white/40 hover:text-white transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
        )}

        <div className="flex flex-col items-center mb-8">
          <motion.div 
             animate={{ rotate: [0, 5, -5, 0] }}
             transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
             className="w-16 h-1 border-t-2 border-[#c9964a] mb-2"
          />
          <div className="text-[10px] font-black uppercase tracking-[0.8em] text-[#c9964a]/60">ONYX SQUADRON</div>
        </div>
        
        <div className="mb-8 text-center px-4">
          <h1 className="text-4xl font-serif font-black tracking-tighter text-white uppercase italic leading-none">
            THE <span className="text-[#c9964a] glow-gold">CHOSE</span>
          </h1>
          <p className="mt-4 text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">
            {mode === 'email-signup' ? "Créer un accès tactique" : 
             mode === 'email-login' ? "Connexion sécurisée" : "Matrix v2.0"}
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[10px] font-black uppercase tracking-wider text-center w-full"
          >
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {mode === 'initial' ? (
            <motion.div 
              key="initial"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full space-y-4"
            >
              {/* PRIMARY ACTION: GUEST MODE */}
              <button
                onClick={onGuest}
                className="w-full bg-[#c9964a] text-black py-6 px-6 rounded-2xl font-black uppercase text-base tracking-[0.3em] flex items-center justify-center gap-4 transition-all active:scale-[0.95] group shadow-[0_20px_50px_rgba(201,150,74,0.3)] relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <Trophy size={22} className="relative z-10 group-hover:scale-125 transition-transform duration-500" />
                <span className="relative z-10">ENTRÉE INVITÉE</span>
                <ChevronRight size={22} className="relative z-10 group-hover:translate-x-1 transition-all" />
              </button>

              <div className="py-4 flex items-center gap-4">
                <div className="h-[1px] flex-1 bg-white/10" />
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Ou connexion matricule</span>
                <div className="h-[1px] flex-1 bg-white/10" />
              </div>

              <button
                disabled={isLoading}
                onClick={() => setMode('email-login')}
                className="w-full bg-white/5 border border-white/10 text-white/60 py-5 px-6 rounded-2xl font-black uppercase text-sm tracking-[0.2em] flex items-center justify-center gap-3 transition-all hover:bg-white/10 hover:border-[#c9964a]/30 hover:text-white"
              >
                <Mail size={20} />
                Email / ID
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => setMode('email-signup')}
                className="w-full text-[#c9964a] text-[10px] font-black uppercase tracking-[0.4em] hover:underline text-center pt-2"
              >
                Pas de matricule ? S'inscrire
              </button>
            </motion.div>
          ) : (
            <motion.form 
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleEmailAuth}
              className="w-full space-y-4"
            >
              {mode === 'email-signup' && (
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                  <input 
                    type="text" 
                    placeholder="NOM D'APPEL"
                    required
                    className={inputClasses}
                    value={formData.displayName}
                    onChange={e => setFormData({...formData, displayName: e.target.value})}
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                <input 
                  type="email" 
                  placeholder="EMAIL MILITAIRE"
                  required
                  className={inputClasses}
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                <input 
                  type="password" 
                  placeholder="CODE D'ACCÈS"
                  required
                  className={inputClasses}
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#c9964a] text-black py-5 px-6 rounded-2xl font-black uppercase text-sm tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 mt-6 shadow-[0_15px_40px_rgba(201,150,74,0.3)]"
              >
                {isLoading ? "CHARGEMENT..." : mode === 'email-login' ? "VALIDER L'ACCÈS" : "CRÉER MATRICULE"}
                {!isLoading && <ChevronRight size={20} />}
              </button>

              <button
                type="button"
                onClick={() => setMode(mode === 'email-login' ? 'email-signup' : 'email-login')}
                className="w-full text-white/30 text-[10px] font-black uppercase tracking-[0.4em] text-center pt-2"
              >
                {mode === 'email-login' ? "NOUVELLE RECRUE ? S'INSCRIRE" : "ACCÈS EXISTANT ? SE CONNECTER"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="mt-10 text-[9px] text-white/20 uppercase tracking-[0.4em] font-black text-center">
          Cryptage de grade militaire actif
        </p>
      </motion.div>
    </div>
  );
}
