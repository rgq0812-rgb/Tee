import React, { useState } from 'react';
import { signInWithGoogle } from '../services/firebase';
import { motion } from 'motion/react';
import { Trophy, ChevronRight } from 'lucide-react';

export default function AuthScreen() {
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setError(null);
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Échec de la connexion. Veuillez réessayer.");
    }
  };

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
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] border border-white/10 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/10 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/10 rounded-full" />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 w-full max-w-md crystal-panel p-10 md:p-14 rounded-[3rem] flex flex-col items-center"
      >
        <div className="flex flex-col items-center mb-12">
          <motion.div 
             animate={{ rotate: [0, 5, -5, 0] }}
             transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
             className="w-16 h-1 border-t-2 border-[#c9964a] mb-2"
          />
          <div className="relative">
            <div className="text-[10px] font-black uppercase tracking-[0.8em] text-[#c9964a]/60 mb-2">ONYX SQUADRON</div>
          </div>
        </div>
        
        <div className="mb-10 text-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="inline-block"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.6em] text-[#c9964a] mb-2 block">L'Infaillible</span>
            <div className="flex items-center justify-center gap-4">
              <div className="h-[2px] w-6 md:w-8 bg-gradient-to-r from-transparent to-[#c9964a]" />
              <h1 className="text-5xl md:text-6xl font-serif font-black tracking-tighter text-white uppercase italic">
                THE <span className="text-[#c9964a] glow-gold">CHOSE</span>
              </h1>
              <div className="h-[2px] w-6 md:w-8 bg-gradient-to-l from-transparent to-[#c9964a]" />
            </div>
          </motion.div>
        </div>
        <p className="text-gray-300 font-medium mb-12 italic text-lg leading-tight scale-x-95 text-center">
          Enregistrez chaque coup.<br />
          Analysez chaque swing.<br />
          Maîtrisez le jeu.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold uppercase tracking-wider text-center w-full">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          className="w-full bg-[#c9964a] text-black py-5 px-6 rounded-2xl font-black uppercase text-sm tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-[0.98] group shadow-[0_15px_40px_rgba(201,150,74,0.3)] hover:shadow-[#c9964a]/40 hover:-translate-y-1"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5 brightness-0" alt="Google" referrerPolicy="no-referrer" />
          Continuer avec Google
          <motion.span
            animate={{ x: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <ChevronRight size={20} />
          </motion.span>
        </button>

        <p className="mt-10 text-[10px] text-white/30 uppercase tracking-[0.4em] font-black">Tactical Performance Matrix v2.0</p>
      </motion.div>
    </div>
  );
}
