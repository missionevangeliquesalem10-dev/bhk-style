"use client";

import React, { useState } from "react";
import { auth, db } from "@/app/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Mail, 
  Lock, 
  ChevronRight, 
  ArrowLeft, 
  ShieldCheck,
  AlertCircle 
} from "lucide-react";
import Link from "next/link";

export default function Connexion() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Connexion Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Vérification du rôle pour rediriger au bon endroit
      const userSnap = await getDoc(doc(db, "users", user.uid));
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.role === "vendeur") {
          router.push("/dashboard");
        } else {
          router.push("/profil"); // Redirection vers le profil pour vérifier les docs
        }
      } else {
        router.push("/");
      }

    } catch (err: any) {
      console.error("Erreur Connexion:", err);
      setError("Email ou mot de passe incorrect.");
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
        {/* LOGO & RETOUR */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="p-2 bg-blue-50 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
              <ArrowLeft size={18} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Accueil</span>
          </Link>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900">
            Bon retour sur <span className="text-blue-600">Wotro</span>
          </h1>
          <p className="text-slate-400 font-medium mt-2 text-sm uppercase tracking-widest">Connectez-vous pour gérer vos locations.</p>
        </div>

        {/* FORMULAIRE */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-100 flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="space-y-2">
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
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all font-bold text-xs uppercase tracking-widest placeholder:text-slate-300 shadow-inner"
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
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all font-bold text-xs uppercase tracking-widest placeholder:text-slate-300 shadow-inner"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-xl shadow-slate-100 active:scale-95 disabled:opacity-50"
          >
            {loading ? "Connexion..." : "Se connecter"} <ChevronRight size={18} />
          </button>
        </form>

        <div className="pt-6 border-t border-slate-50 flex flex-col items-center gap-4">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
            Nouveau sur Wotro ? <Link href="/inscription-client" className="text-blue-600 hover:underline">Créer un compte</Link>
          </p>
          
          <div className="flex items-center gap-2 text-[8px] font-black uppercase text-slate-300 tracking-widest">
            <ShieldCheck size={12} /> Accès sécurisé
          </div>
        </div>
      </motion.div>
    </div>
  );
}