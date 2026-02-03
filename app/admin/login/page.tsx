"use client";
import { useState } from "react";
import { auth, db } from "@/app/lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ShieldAlert, ArrowRight, UserPlus, LogIn } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

export default function AdminAuth() {
  const [isLogin, setIsLogin] = useState(true); // Switch entre Login et Signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secretKey, setSecretKey] = useState(""); // Clé pour autoriser la création
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // CLÉ SECRÈTE (À changer par ce que tu veux)
  const MASTER_KEY = "WOTRO_ADMIN_2026"; 

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // --- LOGIQUE CONNEXION ---
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
        
        if (userDoc.exists() && userDoc.data().role === "admin") {
          toast.success("Accès Maître autorisé");
          router.push("/admin");
        } else {
          await auth.signOut();
          toast.error("Vous n'êtes pas administrateur.");
        }
      } else {
        // --- LOGIQUE CRÉATION ---
        if (secretKey !== MASTER_KEY) {
          toast.error("Clé de création invalide !");
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // On enregistre directement le rôle admin
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email,
          role: "admin",
          fullName: "Administrateur Wotro",
          createdAt: new Date().toISOString()
        });

        toast.success("Compte Admin créé ! Connectez-vous.");
        setIsLogin(true);
      }
    } catch (error: any) {
      toast.error("Erreur : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-6 py-12">
      <Toaster />
      <motion.div 
        layout
        className="max-w-md w-full p-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] shadow-2xl"
      >
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-500/20">
            {isLogin ? <Lock size={30} /> : <UserPlus size={30} />}
          </div>
          <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter">
            {isLogin ? "Connexion Admin" : "Nouvel Admin"}
          </h1>
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mt-2 hover:text-white transition-colors"
          >
            {isLogin ? "Créer un accès ?" : "Déjà un compte ? Se connecter"}
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <input 
            type="email" placeholder="Email Admin" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-blue-500 transition-all"
            required
          />

          <input 
            type="password" placeholder="Mot de passe" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-blue-500 transition-all"
            required
          />

          {!isLogin && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <input 
                type="text" placeholder="Clé Secrète de Création" value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="w-full p-5 bg-blue-600/10 border border-blue-500/30 rounded-2xl text-blue-400 font-black outline-none focus:border-blue-500 placeholder:text-blue-900"
                required
              />
            </motion.div>
          )}

          <button 
            disabled={loading}
            className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-white hover:text-blue-600 transition-all flex items-center justify-center gap-3"
          >
            {loading ? "Chargement..." : isLogin ? "Se connecter" : "Créer le compte"} 
            {isLogin ? <LogIn size={18} /> : <ArrowRight size={18} />}
          </button>
        </form>

        <div className="mt-8 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
          <ShieldAlert size={16} className="text-red-500" />
          <p className="text-[8px] font-bold text-red-200 uppercase leading-tight tracking-widest italic">
            Avertissement : Zone de haute sécurité Wotro.
          </p>
        </div>
      </motion.div>
    </div>
  );
}