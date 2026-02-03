"use client";

import React, { useState } from "react";
import { auth, db } from "@/app/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  User, 
  Mail, 
  Lock, 
  ChevronRight, 
  ArrowLeft, 
  ShieldCheck 
} from "lucide-react";
import Link from "next/link";

export default function InscriptionClient() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Création du compte dans Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Mise à jour du nom dans le profil Auth
      await updateProfile(user, { displayName: fullName });

      // 3. Création du document utilisateur dans Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullName: fullName,
        email: email,
        role: "client", // Différencie le client du vendeur si besoin
        isVerified: "non", // Par défaut non vérifié
        docs: {
          permis: null,
          cni: null
        },
        createdAt: serverTimestamp(),
      });

      // 4. Redirection vers la page Profil pour les documents
      router.push("/profil");

    } catch (err: any) {
      console.error("Erreur Inscription:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("Cet email est déjà utilisé.");
      } else {
        setError("Une erreur est survenue lors de l'inscription.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center px-6 py-12">
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        {/* LOGO & TITRE */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="p-2 bg-blue-50 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
              <ArrowLeft size={18} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Retour</span>
          </Link>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900">
            Rejoindre <span className="text-blue-600">Wotro</span>
          </h1>
          <p className="text-slate-400 font-medium mt-2">Créez votre compte pour louer en toute simplicité.</p>
        </div>

        {/* FORMULAIRE */}
        <form onSubmit={handleSignup} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-xs font-bold border border-red-100 animate-shake">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                <User size={18} />
              </div>
              <input
                type="text"
                required
                placeholder="NOM COMPLET"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all font-bold text-xs uppercase tracking-widest placeholder:text-slate-300"
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                <Mail size={18} />
              </div>
              <input
                type="email"
                required
                placeholder="VOTRE EMAIL"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all font-bold text-xs uppercase tracking-widest placeholder:text-slate-300"
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                placeholder="MOT DE PASSE"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all font-bold text-xs uppercase tracking-widest placeholder:text-slate-300"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-xl shadow-slate-100 disabled:opacity-50"
          >
            {loading ? "Création en cours..." : "S'inscrire"} <ChevronRight size={18} />
          </button>
        </form>

        <div className="pt-6 border-t border-slate-50 flex flex-col items-center gap-4">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
            Déjà inscrit ? <Link href="/connexion" className="text-blue-600 hover:underline">Se connecter</Link>
          </p>
          
          <div className="flex items-center gap-2 text-[8px] font-black uppercase text-slate-300 tracking-widest">
            <ShieldCheck size={12} /> Données sécurisées par Firebase
          </div>
        </div>
      </motion.div>
    </div>
  );
}