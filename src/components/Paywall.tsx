import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Check, Shield, Zap, ArrowRight, Gauge } from 'lucide-react';
import { useAuth } from '../services/AuthProvider';
import { auth, signInWithGoogle } from '../services/firebase';

export default function Paywall({ onGuest }: { onGuest?: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');

  const handleSubscription = async () => {
    setLoading(true);
    try {
      let currentUser = user;
      
      // 1. Force Login if not already logged in
      if (!currentUser) {
        const result = await signInWithGoogle();
        currentUser = result.user;
      }

      if (!currentUser) throw new Error("Authentification échouée");

      // 2. Create Stripe Session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: selectedPlan,
          userId: currentUser.uid,
        }),
      });

      const session = await response.json();
      if (session.error) throw new Error(session.error);

      // 3. Redirect to Stripe
      if (session.url) {
        window.location.href = session.url;
      }
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue lors de l'initialisation du paiement.");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    "Moteur tactique ONYX illimité",
    "Analyses chirurgicales d'Adam Mentor",
    "Scanner de lie haute précision",
    "Accès au Cercle Intérieur (Communauté VIP)",
    "Sauvegarde cloud de tous vos parcours",
    "Zéro publicité, 100% Performance"
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#c9964a] selection:text-black overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#c9964a]/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 lg:py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6"
          >
            <Zap size={14} className="text-[#c9964a]" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#c9964a]">Accès ELITE ONYX</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl lg:text-7xl font-black italic tracking-tighter mb-6 leading-none"
          >
            DOMINEZ LE <span className="text-[#c9964a]">PARCOURS.</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/60 max-w-2xl mx-auto font-medium"
          >
            Libérez la puissance totale d'Adam et de l'intelligence tactique ONYX. 
            Le futur du golf commence maintenant.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Features List */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
              <h3 className="text-xl font-black uppercase tracking-widest mb-8 flex items-center gap-3">
                <Gauge size={20} className="text-[#c9964a]" />
                Inclus dans ELITE
              </h3>
              <div className="grid gap-4">
                {features.map((feature, i) => (
                  <div key={`paywall-feature-${i}-${feature.substring(0, 10)}`} className="flex items-center gap-4 group">
                    <div className="w-6 h-6 rounded-full bg-[#c9964a]/10 border border-[#c9964a]/30 flex items-center justify-center flex-shrink-0 group-hover:bg-[#c9964a] transition-all">
                      <Check size={12} className="text-[#c9964a] group-hover:text-black transition-all" />
                    </div>
                    <span className="text-sm font-medium text-white/80">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 px-6 py-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
              <Shield size={20} className="text-blue-400" />
              <p className="text-xs text-blue-100/60 font-medium">
                Paiement sécurisé via Stripe. Annulation en un clic à tout moment.
              </p>
            </div>
            
            {onGuest && (
              <button 
                onClick={onGuest}
                className="w-full py-4 text-white/30 text-[10px] font-black uppercase tracking-[0.4em] hover:text-[#c9964a] border border-dashed border-white/10 rounded-2xl transition-all"
              >
                Tester en mode invité (limité)
              </button>
            )}
          </motion.div>

          {/* Pricing Cards */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            <div className="flex flex-col gap-4">
              {/* Monthly */}
              <button
                onClick={() => setSelectedPlan('monthly')}
                className={`relative overflow-hidden p-6 rounded-3xl border transition-all text-left group ${
                  selectedPlan === 'monthly' 
                    ? 'bg-white/10 border-[#c9964a] ring-2 ring-[#c9964a]/20' 
                    : 'bg-white/5 border-white/10 hover:border-white/30'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#c9964a]">Mensuel</span>
                  {selectedPlan === 'monthly' && <Sparkles size={16} className="text-[#c9964a] animate-pulse" />}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black">9,99€</span>
                  <span className="text-sm text-white/40 font-medium">/mois</span>
                </div>
                <p className="text-xs text-white/40 mt-2 font-medium">Flexible, sans engagement.</p>
              </button>

              {/* Yearly */}
              <button
                onClick={() => setSelectedPlan('yearly')}
                className={`relative overflow-hidden p-6 rounded-3xl border transition-all text-left group ${
                  selectedPlan === 'yearly' 
                    ? 'bg-white/10 border-[#c9964a] ring-2 ring-[#c9964a]/20' 
                    : 'bg-white/5 border-white/10 hover:border-white/30'
                }`}
              >
                <div className="absolute top-4 right-4 bg-[#c9964a] text-black px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter">
                  -35% ÉCONOMIE
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#c9964a]">Annuel</span>
                  {selectedPlan === 'yearly' && <Sparkles size={16} className="text-[#c9964a] animate-pulse" />}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black">79€</span>
                  <span className="text-sm text-white/40 font-medium">/an</span>
                </div>
                <p className="text-xs text-white/40 mt-2 font-medium">L'équivalent de 6,58€/mois. Le meilleur choix.</p>
              </button>
            </div>

            <button
              onClick={handleSubscription}
              disabled={loading}
              className="w-full h-16 bg-[#c9964a] text-black rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[#d4a85a] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-[0_0_40px_rgba(201,150,74,0.3)]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Continuer avec Google
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            
            <p className="text-[8px] text-center text-white/30 font-black uppercase tracking-widest mt-4">
              ACCÈS INSTANTANÉ • SÉCURISÉ PAR STRIPE
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
