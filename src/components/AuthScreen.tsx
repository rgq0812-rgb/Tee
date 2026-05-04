import { signInWithGoogle } from '../services/firebase';
import { motion } from 'motion/react';
import { Trophy, ChevronRight } from 'lucide-react';

export default function AuthScreen() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow - Original Emerald vibes */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="z-10 text-center max-w-sm w-full"
      >
        <div className="w-20 h-20 bg-emerald-600 rounded-3xl mx-auto mb-8 shadow-2xl shadow-emerald-500/20 flex items-center justify-center rotate-3">
          <Trophy size={40} />
        </div>
        
        <h1 className="text-5xl font-sans font-bold tracking-tighter mb-4">
          GOLF<span className="text-emerald-500">PRO</span>
        </h1>
        <p className="text-gray-400 font-medium mb-12">Track every stroke. Analyze every swing. Master the game.</p>

        <button
          onClick={signInWithGoogle}
          className="w-full bg-white text-black py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-3 transition-transform active:scale-[0.98] group"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" referrerPolicy="no-referrer" />
          Continue with Google
          <motion.span
            animate={{ x: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <ChevronRight size={20} />
          </motion.span>
        </button>

        <p className="mt-8 text-[10px] text-gray-500 uppercase tracking-widest font-semibold opacity-50">Professional Performance Tracking</p>
      </motion.div>
    </div>
  );
}
