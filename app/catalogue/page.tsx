"use client";

import { useEffect, useState, Suspense } from "react";
import { db } from "@/app/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit, onSnapshot } from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Fuel, Gauge, Search, Star, Wallet, FilterX, X, ExternalLink } from "lucide-react";
import Link from "next/link";

function CatalogueContent() {
  const searchParams = useSearchParams();
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ÉTATS PUBLICITÉ
  const [activeAd, setActiveAd] = useState<any>(null);
  const [showAd, setShowAd] = useState(false);
  
  // États des filtres
  const [filterCity, setFilterCity] = useState(searchParams.get("location") || "Toutes");
  const [maxPrice, setMaxPrice] = useState(Number(searchParams.get("maxPrice")) || 500000);

  const communes = ["Toutes", "Cocody", "Marcory", "Plateau", "Angré", "Riviera", "Yopougon"];

  useEffect(() => {
    // 1. Charger les voitures
    const fetchCars = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "cars"),
          where("isAvailable", "==", true),
          orderBy("priorityScore", "desc") 
        );
        const snap = await getDocs(q);
        setCars(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Erreur Firestore :", error);
      } finally {
        setLoading(false);
      }
    };

    // 2. Écoute de la publicité active (Idem Accueil)
    const qAds = query(collection(db, "ads"), where("isActive", "==", true), limit(1));
    const unsubAds = onSnapshot(qAds, (snap) => {
      if (!snap.empty) {
        setActiveAd({ id: snap.docs[0].id, ...snap.docs[0].data() });
        const hasSeenAd = sessionStorage.getItem('hasSeenWotroAd');
        if (!hasSeenAd) {
          setTimeout(() => setShowAd(true), 3000); // Apparaît après 3s sur le catalogue
        }
      }
    });

    fetchCars();
    return () => unsubAds();
  }, []);

  const closeAd = () => {
    setShowAd(false);
    sessionStorage.setItem('hasSeenWotroAd', 'true');
  };

  const filteredCars = cars.filter((car) => {
    const matchCity = filterCity === "Toutes" || car.location === filterCity;
    const matchPrice = car.price <= maxPrice;
    return matchCity && matchPrice;
  });

  return (
    <div className="min-h-screen bg-white pt-28 pb-20 px-6">
      
      {/* --- POP-UP PUBLICITAIRE --- */}
      <AnimatePresence>
        {showAd && activeAd && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-[3rem] overflow-hidden shadow-2xl"
            >
              <button onClick={closeAd} className="absolute top-4 right-4 z-10 p-3 bg-white/20 backdrop-blur-xl text-white rounded-full hover:bg-red-500 transition-all">
                <X size={20} />
              </button>

              <div className="relative aspect-square">
                <img src={activeAd.imageUrl} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 p-10 w-full">
                   <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4">{activeAd.company}</h2>
                   <div className="flex gap-3">
                     {activeAd.link && (
                       <a href={activeAd.link} target="_blank" className="flex-1 py-4 bg-blue-600 text-white text-center rounded-2xl font-black text-[10px] uppercase tracking-widest">
                         Découvrir
                       </a>
                     )}
                     <button onClick={closeAd} className="px-6 py-4 bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/20">
                       Fermer
                     </button>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        {/* EN-TÊTE & FILTRES */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none">
              Explorez <br /><span className="text-blue-600">Le Garage</span>
            </h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">
              {filteredCars.length} Véhicules disponibles à Abidjan
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="flex-1 bg-slate-50 p-4 rounded-3xl border border-slate-100">
              <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Commune</label>
              <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} className="bg-transparent w-full outline-none font-black text-xs uppercase text-slate-900 appearance-none cursor-pointer">
                {communes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex-1 bg-slate-50 p-4 rounded-3xl border border-slate-100">
              <label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Budget Max / J</label>
              <select value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="bg-transparent w-full outline-none font-black text-xs uppercase text-slate-900 appearance-none cursor-pointer">
                <option value={500000}>Tous les prix</option>
                <option value={30000}>Sous 30.000 F</option>
                <option value={60000}>Sous 60.000 F</option>
                <option value={100000}>Sous 100.000 F</option>
              </select>
            </div>
          </div>
        </div>

        {/* GRILLE DES VOITURES */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => <div key={i} className="h-96 bg-slate-50 animate-pulse rounded-[3rem]" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <AnimatePresence mode="popLayout">
              {filteredCars.map((car) => (
                <motion.div key={car.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="group bg-white border border-slate-100 rounded-[3rem] overflow-hidden hover:shadow-xl transition-all duration-500">
                  <div className="relative aspect-[16/11] overflow-hidden">
                    <img src={car.image} alt={car.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-sm">
                      <p className="font-black text-sm text-slate-900">{car.price?.toLocaleString()} <span className="text-[10px] text-blue-600">F</span></p>
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-2xl font-black uppercase italic tracking-tighter truncate pr-4">{car.name}</h3>
                      <div className="flex items-center gap-1.5 text-yellow-500 font-black text-[11px] bg-yellow-50 px-3 py-1 rounded-full">
                        <Star size={12} fill="currentColor" /> {car.reviewCount || 0}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 mb-8 font-black text-[10px] uppercase tracking-widest italic">
                      <MapPin size={16} className="text-blue-500" /> {car.location}
                    </div>

                    <Link href={`/voiture/${car.id}`} className="block w-full py-5 bg-slate-900 text-white text-center rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl active:scale-95">
                      Détails & Réservation
                    </Link>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* ÉTAT VIDE */}
        {!loading && filteredCars.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32 border-2 border-dashed border-slate-100 rounded-[4rem]">
            <FilterX size={40} className="mx-auto mb-6 text-slate-200" />
            <h3 className="text-2xl font-black uppercase italic tracking-tighter">Aucun résultat</h3>
            <button onClick={() => {setFilterCity("Toutes"); setMaxPrice(500000);}} className="mt-8 text-blue-600 font-black text-[10px] uppercase tracking-widest border-b-2 border-blue-600 pb-1">
              Réinitialiser
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function Catalogue() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white pt-32 text-center font-black uppercase text-[10px] animate-pulse italic">Chargement du garage...</div>}>
      <CatalogueContent />
    </Suspense>
  );
}