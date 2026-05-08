import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Shield, Lock, Scale, FileText } from 'lucide-react';

export default function LegalPage({ onClose, displayMode }: { onClose: () => void, displayMode?: 'tactical' | 'solar' }) {
  const isSolar = displayMode === 'solar';

  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      className={`fixed inset-0 z-[500] overflow-y-auto ${isSolar ? 'bg-zinc-50' : 'bg-black text-white'}`}
    >
      <div className="max-w-3xl mx-auto p-6 pt-12 pb-32">
        <button 
          onClick={onClose}
          className={`flex items-center gap-2 mb-12 text-[10px] font-black uppercase tracking-[0.3em] ${isSolar ? 'text-black' : 'text-[#c9964a]'}`}
        >
          <ArrowLeft size={16} /> Retour
        </button>

        <section className="mb-20">
          <div className="flex items-center gap-4 mb-8">
            <div className={`p-4 rounded-2xl ${isSolar ? 'bg-black text-white' : 'bg-white/5 text-[#c9964a]'}`}>
              <Shield size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-cinzel font-black italic tracking-tighter uppercase mb-1">PROTOCOLE LÉGAL</h1>
              <p className={`text-[10px] font-mono tracking-[0.4em] uppercase ${isSolar ? 'text-zinc-500' : 'text-gray-500'}`}>Version 2.0.26 — Onyx Network</p>
            </div>
          </div>

          <div className={`space-y-12 prose prose-invert max-w-none ${isSolar ? 'prose-zinc' : ''}`}>
             <div className="space-y-4">
                <h2 className={`text-xl font-black uppercase tracking-tight flex items-center gap-3 ${isSolar ? 'text-black' : 'text-[#c9964a]'}`}>
                  <FileText size={18} /> CONDITIONS GÉNÉRALES
                </h2>
                <div className={`text-xs leading-relaxed opacity-70 space-y-4 ${isSolar ? 'text-zinc-700' : 'text-white'}`}>
                   <p>L'accès au réseau ONYX (ci-après "le Service") est strictement réservé aux utilisateurs inscrits. En utilisant THE CHOSE, vous acceptez d'être lié par ces protocoles.</p>
                   <p><strong>1. Usage Personnel :</strong> Le Service est fourni pour un usage personnel et non-commercial dans le cadre de la pratique du golf. Toute revente de données tactiques extraites est interdite.</p>
                   <p><strong>2. Paiements :</strong> Nous proposons des accès "Full Pass" à usage unique ou périodique. Les paiements sont sécurisés via Stripe. Les remboursements ne sont pas applicables une fois les crédits consommés par le moteur ONYX.</p>
                   <p><strong>3. Responsabilité :</strong> ONYX fournit des conseils tactiques basés sur l'IA. La décision finale du coup appartient au joueur. Nous ne sommes pas responsables des balles perdues, des clubs cassés ou des frustrations sur le green.</p>
                </div>
             </div>

             <div className="space-y-4">
                <h2 className={`text-xl font-black uppercase tracking-tight flex items-center gap-3 ${isSolar ? 'text-black' : 'text-[#c9964a]'}`}>
                   <Lock size={18} /> PROTECTION DES DONNÉES
                </h2>
                <div className={`text-xs leading-relaxed opacity-70 space-y-4 ${isSolar ? 'text-zinc-700' : 'text-white'}`}>
                   <p>Votre vie privée est le cœur de notre architecture. ONYX opère selon un principe de "Zero-Knowledge" pour les données sensibles.</p>
                   <p><strong>Données Collectées :</strong> Scorecards, images de trous (Vault), et distnaces de clubs. Ces données sont utilisées pour entraîner ADAM à mieux vous conseiller.</p>
                   <p><strong>Vocal :</strong> Les enregistrements vocaux ne sont jamais stockés de manière permanente. Ils sont convertis en texte en temps réel via des API sécurisées et jetés après traitement.</p>
                   <p><strong>Suppression :</strong> Vous pouvez purger vos données tactiques à tout moment via le menu Profil &gt; Vault.</p>
                </div>
             </div>

             <div className="space-y-4">
                <h2 className={`text-xl font-black uppercase tracking-tight flex items-center gap-3 ${isSolar ? 'text-black' : 'text-[#c9964a]'}`}>
                   <Scale size={18} /> MENTIONS LÉGALES
                </h2>
                <div className={`p-6 rounded-3xl border text-[9px] font-mono leading-relaxed tracking-wide ${isSolar ? 'bg-zinc-100 border-zinc-200 text-zinc-500' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                   Éditeur : ONYX LABS SAS<br/>
                   Siège social : 12 Luxury Road, Silicon Valley / Paris<br/>
                   Directeur de la publication : O. Adam<br/>
                   Hébergement : Cloud Run Secure Containers<br/>
                   Contact : rgq0812@gmail.com
                </div>
             </div>
          </div>
        </section>

        <p className={`text-center text-[10px] font-black uppercase tracking-[0.5em] opacity-20 ${isSolar ? 'text-black' : 'text-white'}`}>THE CHOSE • AGENT ONYX DEPLOYED</p>
      </div>
    </motion.div>
  );
}
