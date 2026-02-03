"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Phone, Building2, UserCircle, ArrowRight, CheckCircle2, Camera } from 'lucide-react';
import { auth, db } from '@/app/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function DevenirHote() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    city: 'Abidjan',
    accountType: 'particulier',
    photoURL: '', // Sera rempli par Cloudinary ou un avatar par défaut
  });

  const handleNext = () => setStep(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        router.push('/dashboard'); // Redirection vers ton dashboard vendeur
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;

        // Génération d'un avatar par défaut basé sur le nom (Cloudinary-friendly)
        const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName)}&background=2563eb&color=fff`;

        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          city: formData.city,
          accountType: formData.accountType,
          photoURL: formData.photoURL || defaultAvatar, // Utilise la photo Cloudinary si présente, sinon l'avatar
          role: 'vendeur',
          isVerified: false,
          createdAt: new Date().toISOString(),
        });

        setStep(3);
        setTimeout(() => router.push('/dashboard-hote'), 2000);
      }
    } catch (error: any) {
      alert("Erreur : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-20 relative overflow-hidden bg-white">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] left-[5%] w-[30%] h-[30%] bg-orange-500/5 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-xl bg-white border border-gray-100 rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.05)]"
      >
        {step < 3 && (
          <div className="flex bg-gray-100 p-1 rounded-2xl mb-8 border border-gray-200">
            <button 
              onClick={() => { setIsLogin(false); setStep(1); }}
              className={`flex-1 py-3 rounded-xl font-black text-[10px] tracking-widest uppercase transition-all ${!isLogin ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Inscription
            </button>
            <button 
              onClick={() => { setIsLogin(true); setStep(1); }}
              className={`flex-1 py-3 rounded-xl font-black text-[10px] tracking-widest uppercase transition-all ${isLogin ? 'bg-orange-500 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Connexion
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -10, opacity: 0 }}>
              <h2 className="text-3xl font-black mb-2 italic text-slate-900 uppercase tracking-tighter">
                {isLogin ? 'Bon retour' : 'Vos'} <span className={isLogin ? 'text-orange-500' : 'text-blue-600'}>{isLogin ? 'Hôte' : 'Identifiants'}</span>
              </h2>
              <p className="text-gray-500 mb-8 text-sm font-medium">Accédez à votre espace Wotro Pro.</p>
              
              <form onSubmit={isLogin ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="email" placeholder="Email" required className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 font-bold" onChange={(e) => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="password" placeholder="Mot de passe" required className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 font-bold" onChange={(e) => setFormData({...formData, password: e.target.value})} />
                </div>
                <button type="submit" disabled={loading} className={`w-full py-4 ${isLogin ? 'bg-orange-500' : 'bg-blue-600'} text-white font-black rounded-2xl mt-4 flex items-center justify-center gap-2 transition-all shadow-lg`}>
                  {loading ? 'CHARGEMENT...' : isLogin ? 'SE CONNECTER' : 'CONTINUER'} <ArrowRight size={18} />
                </button>
              </form>
            </motion.div>
          )}

          {step === 2 && !isLogin && (
            <motion.div key="step2" initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <h2 className="text-3xl font-black mb-2 italic text-slate-900 uppercase tracking-tighter">
                Profil <span className="text-orange-500">Vendeur</span>
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <button type="button" onClick={() => setFormData({...formData, accountType: 'particulier'})} className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${formData.accountType === 'particulier' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200 bg-gray-50 text-gray-400'}`}><UserCircle size={24} /> <span className="text-[10px] font-black tracking-widest">PARTICULIER</span></button>
                  <button type="button" onClick={() => setFormData({...formData, accountType: 'entreprise'})} className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${formData.accountType === 'entreprise' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-200 bg-gray-50 text-gray-400'}`}><Building2 size={24} /> <span className="text-[10px] font-black tracking-widest">ENTREPRISE</span></button>
                </div>
                
                <input type="text" placeholder="Nom complet / Entreprise" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 outline-none focus:border-orange-500 font-bold text-slate-900" onChange={(e) => setFormData({...formData, fullName: e.target.value})} required />
                <input type="tel" placeholder="Téléphone (07...)" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 outline-none focus:border-orange-500 font-bold text-slate-900" onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
                
                {/* Note : L'upload photo vers Cloudinary se fera via le dashboard pour plus de sécurité */}
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3">
                    <Camera className="text-blue-600" size={20} />
                    <p className="text-[10px] font-bold text-blue-700 uppercase leading-tight">Vous pourrez ajouter votre photo officielle sur votre tableau de bord.</p>
                </div>

                <button type="submit" disabled={loading} className="w-full py-4 bg-orange-500 text-white font-black rounded-2xl mt-4 shadow-xl uppercase text-xs tracking-widest">Créer mon espace pro</button>
              </form>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-10">
              <CheckCircle2 size={60} className="text-green-500 mx-auto mb-6" />
              <h2 className="text-3xl font-black mb-4 text-slate-900 uppercase italic">Bienvenue !</h2>
              <p className="text-gray-500 font-medium">Votre compte vendeur est prêt.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}