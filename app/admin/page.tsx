"use client";
import { useEffect, useState } from "react";
import { db, auth } from "@/app/lib/firebase";
import { 
  collection, query, getDocs, where, addDoc, 
  deleteDoc, doc, onSnapshot, updateDoc, getDoc 
} from "firebase/firestore";
import { motion } from "framer-motion";
import { 
  Users, Car, Megaphone, TrendingUp, 
  Plus, Trash2, Eye, EyeOff, BarChart3,
  LayoutDashboard, PieChart, LogOut, ShieldCheck
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminPanel() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({ clients: 0, hosts: 0, totalCars: 0 });
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newAd, setNewAd] = useState({ company: "", imageUrl: "", link: "", isActive: true });

  // 1. SÉCURITÉ ET AUTHENTIFICATION
  useEffect(() => {
    const checkAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/admin/login");
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists() && userDoc.data().role === "admin") {
        setIsAdmin(true);
        fetchStats();
      } else {
        toast.error("Accès non autorisé");
        router.push("/");
      }
    });

    return () => checkAuth();
  }, [router]);

  // 2. RÉCUPÉRATION DES DONNÉES
  const fetchStats = async () => {
    const usersSnap = await getDocs(collection(db, "users"));
    const carsSnap = await getDocs(collection(db, "cars"));
    const allUsers = usersSnap.docs.map(d => d.data());
    
    setStats({
      clients: allUsers.filter(u => u.role === "client").length,
      hosts: allUsers.filter(u => u.role === "host").length,
      totalCars: carsSnap.size
    });

    onSnapshot(collection(db, "ads"), (snap) => {
      setAds(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  };

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/admin/login");
  };

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAd.company || !newAd.imageUrl) return toast.error("Infos manquantes");
    await addDoc(collection(db, "ads"), { ...newAd, createdAt: new Date().toISOString() });
    setNewAd({ company: "", imageUrl: "", link: "", isActive: true });
    toast.success("Publicité en ligne !");
  };

  const toggleAdStatus = async (adId: string, currentStatus: boolean) => {
    await updateDoc(doc(db, "ads", adId), { isActive: !currentStatus });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-blue-600 animate-pulse uppercase tracking-widest text-xs">Accès Sécurisé Wotro...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <Toaster />

      {/* SIDEBAR ADMIN */}
      <aside className="w-full lg:w-64 bg-slate-900 text-white p-6 flex flex-col">
        <div className="mb-10 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <ShieldCheck size={18} />
          </div>
          <span className="font-black italic tracking-tighter text-xl">WOTRO. <span className="text-[10px] not-italic text-blue-400">ADM</span></span>
        </div>

        <nav className="flex-1 space-y-2">
          <Link href="/admin" className="flex items-center gap-3 p-4 bg-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">
            <LayoutDashboard size={16} /> Vue d'ensemble
          </Link>
          <Link href="/admin/stats" className="flex items-center gap-3 p-4 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all">
            <PieChart size={16} /> Statistiques
          </Link>
          <Link href="/admin/ads" className="flex items-center gap-3 p-4 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all">
            <Megaphone size={16} /> Publicités
          </Link>
        </nav>

        <button onClick={handleLogout} className="mt-auto flex items-center gap-3 p-4 bg-red-500/10 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
          <LogOut size={16} /> Déconnexion
        </button>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-10">
          
          {/* HEADER AVEC STATS RAPIDES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-4 text-blue-600"><Users size={20}/><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Utilisateurs</span></div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black">{stats.clients + stats.hosts}</p>
                <p className="text-[8px] font-black text-slate-400 uppercase">Total membres</p>
              </div>
            </div>

            <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-4 text-orange-500"><Car size={20}/><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Flotte</span></div>
              <p className="text-3xl font-black">{stats.totalCars}</p>
              <p className="text-[8px] font-black text-slate-400 uppercase">Véhicules en ligne</p>
            </div>

            <div className="p-8 bg-blue-600 rounded-[2.5rem] text-white shadow-xl shadow-blue-100">
              <div className="flex justify-between items-center mb-4"><TrendingUp size={20}/><span className="text-[10px] font-black uppercase tracking-widest text-blue-200">Mode</span></div>
              <p className="text-3xl font-black italic uppercase tracking-tighter tracking-tighter">Beta 1.0</p>
              <p className="text-[8px] font-black uppercase text-blue-200">Système opérationnel</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* RÉGIE PUB FORM */}
            <div className="lg:col-span-1">
              <div className="p-8 bg-white rounded-[3rem] border border-slate-100 shadow-sm sticky top-10">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-8 text-blue-600">Nouvelle Campagne</h3>
                <form onSubmit={handleCreateAd} className="space-y-4">
                  <input placeholder="Entreprise" value={newAd.company} onChange={e => setNewAd({...newAd, company: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl text-[11px] font-bold outline-none border border-transparent focus:border-blue-200" />
                  <input placeholder="Image URL" value={newAd.imageUrl} onChange={e => setNewAd({...newAd, imageUrl: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl text-[11px] font-bold outline-none border border-transparent focus:border-blue-200" />
                  <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-blue-600 transition-all">Lancer Pub</button>
                </form>
              </div>
            </div>

            {/* LISTE DES PUBS */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Bannières actives sur le site</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ads.map((ad) => (
                  <div key={ad.id} className="group rounded-[2rem] overflow-hidden border border-slate-100 bg-white shadow-sm">
                    <img src={ad.imageUrl} className={`w-full h-32 object-cover ${!ad.isActive && 'grayscale opacity-50'}`} />
                    <div className="p-4 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-black uppercase">{ad.company}</p>
                        <p className={`text-[8px] font-bold uppercase ${ad.isActive ? 'text-green-500' : 'text-red-400'}`}>
                          {ad.isActive ? 'En ligne' : 'Arrêtée'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => toggleAdStatus(ad.id, ad.isActive)} className="p-2 bg-slate-50 rounded-lg">
                          {ad.isActive ? <EyeOff size={14}/> : <Eye size={14}/>}
                        </button>
                        <button onClick={() => deleteDoc(doc(db, "ads", ad.id))} className="p-2 bg-red-50 text-red-500 rounded-lg"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}