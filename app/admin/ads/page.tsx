"use client";
import { useEffect, useState } from "react";
import { db, auth } from "@/app/lib/firebase";
import { 
  collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, getDoc 
} from "firebase/firestore";
import { 
  Megaphone, Trash2, Eye, EyeOff, Plus, 
  ArrowLeft, X, UploadCloud, ImageIcon
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CldUploadWidget } from 'next-cloudinary';
import Link from "next/link";

export default function AdminAds() {
  const router = useRouter();
  const [ads, setAds] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // État du formulaire
  const [newAd, setNewAd] = useState({ 
    company: "", 
    imageUrl: "", 
    link: "", 
    isActive: true 
  });

  // 1. Protection Admin
  useEffect(() => {
    const checkAdmin = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/admin/login");
        return;
      }
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists() && userDoc.data().role === "admin") {
        setLoading(false);
      } else {
        toast.error("Accès refusé");
        router.push("/");
      }
    });
    return () => checkAdmin();
  }, [router]);

  // 2. Écoute des publicités Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "ads"), (snap) => {
      setAds(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // 3. Envoi du formulaire
  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAd.company || !newAd.imageUrl) {
      return toast.error("Veuillez remplir tous les champs et charger une image.");
    }
    
    try {
      await addDoc(collection(db, "ads"), { 
        ...newAd, 
        createdAt: new Date().toISOString() 
      });
      setNewAd({ company: "", imageUrl: "", link: "", isActive: true });
      setIsModalOpen(false);
      toast.success("Publicité en ligne sur Wotro !");
    } catch (error) {
      toast.error("Erreur lors de la mise en ligne.");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-blue-600 font-black animate-pulse uppercase tracking-widest text-xs italic">
        Wotro Ads System Loading...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-20 px-6">
      <Toaster />
      
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <Link href="/admin" className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest mb-4 hover:text-blue-600 transition-all">
              <ArrowLeft size={16} /> Dashboard
            </Link>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase italic tracking-tighter">
              Régie <span className="text-blue-600">Publicitaire</span>
            </h1>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-slate-900 transition-all active:scale-95"
          >
            <Plus size={18} /> Nouvelle Pub
          </button>
        </div>

        {/* LISTE DES PUBS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ads.map((ad) => (
            <motion.div layout key={ad.id} className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm group">
              <div className="relative h-44 overflow-hidden bg-slate-100">
                <img 
                  src={ad.imageUrl} 
                  className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${!ad.isActive && 'grayscale opacity-30'}`} 
                  alt={ad.company} 
                />
                {!ad.isActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40">
                    <span className="px-3 py-1 bg-white text-slate-900 text-[8px] font-black uppercase rounded-full">Suspendue</span>
                  </div>
                )}
              </div>
              <div className="p-6 flex justify-between items-center">
                <div>
                  <h4 className="font-black text-[12px] uppercase text-slate-900 leading-none">{ad.company}</h4>
                  <p className={`text-[8px] font-black uppercase mt-2 tracking-widest ${ad.isActive ? 'text-green-500' : 'text-red-400'}`}>
                    {ad.isActive ? 'En ligne' : 'Arrêtée'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => updateDoc(doc(db, "ads", ad.id), { isActive: !ad.isActive })} 
                    className={`p-2 rounded-xl transition-all ${ad.isActive ? 'bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white' : 'bg-blue-600 text-white'}`}
                  >
                    {ad.isActive ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                  <button 
                    onClick={() => { if(confirm("Supprimer cette publicité ?")) deleteDoc(doc(db, "ads", ad.id)) }} 
                    className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                  >
                    <Trash2 size={16}/>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* POP-UP (MODAL) AVEC IMPORTATION DIRECTE */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setIsModalOpen(false)} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }} 
              className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl p-10 overflow-hidden"
            >
              <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-red-500 transition-colors">
                <X size={20} />
              </button>

              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 mb-8">
                Nouvelle <span className="text-blue-600">Pub</span>
              </h3>

              <form onSubmit={handleCreateAd} className="space-y-6">
                
                {/* ZONE D'IMPORTATION PHOTO */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-4 tracking-widest">Image de la bannière</label>
                  <CldUploadWidget 
                    uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                    onSuccess={(result: any) => {
                      if (result?.info?.secure_url) {
                        setNewAd({...newAd, imageUrl: result.info.secure_url});
                        toast.success("Image chargée !");
                      }
                    }}
                  >
                    {({ open }) => (
                      <div 
                        onClick={() => open?.()}
                        className="aspect-video w-full rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-all overflow-hidden group"
                      >
                        {newAd.imageUrl ? (
                          <img src={newAd.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                        ) : (
                          <>
                            <UploadCloud size={32} className="text-slate-300 mb-2 group-hover:text-blue-500 transition-colors" />
                            <span className="text-[9px] font-black text-slate-400 uppercase">Choisir une image</span>
                          </>
                        )}
                      </div>
                    )}
                  </CldUploadWidget>
                </div>

                <div className="space-y-4">
                  <input 
                    placeholder="Nom de l'entreprise" 
                    value={newAd.company} onChange={e => setNewAd({...newAd, company: e.target.value})} 
                    className="w-full p-5 bg-slate-50 rounded-2xl text-xs font-bold outline-none border-2 border-transparent focus:border-blue-600 transition-all"
                    required
                  />
                  <input 
                    placeholder="Lien de redirection (ex: Facebook)" 
                    value={newAd.link} onChange={e => setNewAd({...newAd, link: e.target.value})} 
                    className="w-full p-5 bg-slate-50 rounded-2xl text-xs font-bold outline-none border-2 border-transparent focus:border-blue-600 transition-all"
                  />
                </div>

                <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-slate-900 transition-all">
                  Mettre en ligne la campagne
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}