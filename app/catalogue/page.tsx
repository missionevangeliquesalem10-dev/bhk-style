"use client";

import { useEffect, useState, Suspense } from "react";
import { db } from "@/app/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit, onSnapshot } from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Fuel, Gauge, Search, Star, Wallet, FilterX, X, ExternalLink, CarFront, ChevronDown } from "lucide-react";
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
  const [filterCategory, setFilterCategory] = useState("Toutes");
  const [maxPrice, setMaxPrice] = useState(Number(searchParams.get("maxPrice")) || 500000);

  const communes = ["Toutes", "Abobo", "Adjamé", "Attécoubé", "Bingerville", "Cocody", "Koumassi", "Marcory", "Plateau", "Port-Bouët", "Songon", "Treichville", "Yopougon", "Anyama"];
  const categories = ["Toutes", "Berline", "Suv/4x4", "Citadine", "Van/Minibus", "Pick-up", "Coupé / Sport", "Utilitaire"];
  const priceRanges = [
    { label: "Tous les budgets", value: 500000 },
    { label: "Sous 30.000 F", value: 30000 },
    { label: "30.000 - 60.000 F", value: 60000 },
    { label: "60.000 - 100.000 F", value: 100000 },
  ];

  useEffect(() => {
    const fetchCars = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "cars"), where("isAvailable", "==", true), orderBy("priorityScore", "desc"));
        const snap = await getDocs(q);
        setCars(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const qAds = query(collection(db, "ads"), where("isActive", "==", true), limit(1));
    const unsubAds = onSnapshot(qAds, (snap) => {
      if (!snap.empty) {
        setActiveAd({ id: snap.docs[0].id, ...snap.docs[0].data() });
        if (!sessionStorage.getItem('hasSeenWotroAd')) setTimeout(() => setShowAd(true), 3000);
      }
    });

    fetchCars();
    return () => unsubAds();
  }, []);

  const filteredCars = cars.filter((car) => {
    const matchCity = filterCity === "Toutes" || car.location === filterCity;
    const matchCategory = filterCategory === "Toutes" || car.category === filterCategory;
    const matchPrice = car.price <= maxPrice;
    return matchCity && matchCategory && matchPrice;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FB] pt-28 pb-20 px-4 md:px-8">
      <div className="max-w-[1400px] mx-auto">
        
        {/* TITRE SECTION */}
        <div className="mb-10">
          <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">
            Voitures dans <span className="text-blue-600">Côte d'Ivoire</span>
          </h1>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-2">
            {filteredCars.length} véhicules correspondent à votre recherche
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* BARRE LATÉRALE - FILTRES (GAUCHE) */}
          <aside className="w-full lg:w-80 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 mb-8 flex items-center gap-2">
                <Search size={14} /> Filtres
              </h3>

              {/* Lieu */}
              <div className="mb-8">
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-4 tracking-widest">Localisation</label>
                <div className="relative">
                  <select 
                    value={filterCity} 
                    onChange={(e) => setFilterCity(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-xs font-black uppercase text-slate-900 appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    {communes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Catégories (Type) */}
              <div className="mb-8">
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-4 tracking-widest">Type de véhicule</label>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`w-full text-left px-5 py-3 rounded-xl text-[10px] font-bold uppercase transition-all ${filterCategory === cat ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-transparent text-slate-500 hover:bg-slate-50'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div className="mb-8">
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-4 tracking-widest">Budget Max / J</label>
                <div className="space-y-3">
                  {priceRanges.map(range => (
                    <label key={range.value} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="price" 
                        checked={maxPrice === range.value}
                        onChange={() => setMaxPrice(range.value)}
                        className="w-4 h-4 text-blue-600 border-slate-200 focus:ring-blue-500"
                      />
                      <span className="text-[10px] font-bold uppercase text-slate-600 group-hover:text-blue-600 transition-colors">{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => {setFilterCity("Toutes"); setFilterCategory("Toutes"); setMaxPrice(500000);}}
                className="w-full py-4 border-2 border-dashed border-slate-100 text-slate-400 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:border-blue-200 hover:text-blue-600 transition-all"
              >
                Réinitialiser tout
              </button>
            </div>
          </aside>

          {/* GRILLE DE VOITURES (DROITE) */}
          <main className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => <div key={i} className="h-80 bg-white animate-pulse rounded-[2.5rem]" />)}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-8">
                  <AnimatePresence mode="popLayout">
                    {filteredCars.map((car) => (
                      <motion.div 
                        key={car.id} 
                        layout 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="group bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] transition-all duration-500"
                      >
                        <div className="flex flex-col sm:flex-row h-full">
                          {/* Image */}
                          <div className="relative w-full sm:w-56 h-56 sm:h-auto overflow-hidden">
                            <img src={car.image} alt={car.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl">
                               <p className="font-black text-[10px] text-blue-600 uppercase tracking-tighter">{car.category}</p>
                            </div>
                          </div>
                          
                          {/* Infos */}
                          <div className="flex-1 p-6 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-black uppercase italic tracking-tighter text-slate-900">{car.name}</h3>
                                <div className="flex items-center gap-1 text-yellow-500 font-black text-[10px] bg-yellow-50 px-2 py-1 rounded-lg">
                                  <Star size={10} fill="currentColor" /> {car.reviewCount || 0}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-slate-400 mb-4 font-black text-[9px] uppercase tracking-widest italic">
                                <MapPin size={12} className="text-blue-500" /> {car.location}
                              </div>
                              
                              <div className="flex gap-4 mb-6">
                                <div className="flex items-center gap-1.5 text-slate-500">
                                  <Gauge size={14} className="text-slate-300" />
                                  <span className="text-[9px] font-bold uppercase">{car.transmission}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-500">
                                  <Fuel size={14} className="text-slate-300" />
                                  <span className="text-[9px] font-bold uppercase">{car.fuel}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                              <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Prix / Jour</p>
                                <p className="text-lg font-black text-slate-900">{car.price?.toLocaleString()} <span className="text-[10px] text-blue-600">FCFA</span></p>
                              </div>
                              <Link href={`/voiture/${car.id}`} className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-blue-600 transition-all active:scale-90 shadow-lg shadow-slate-100">
                                <ArrowRight size={18} />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {filteredCars.length === 0 && (
                  <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                    <FilterX size={48} className="mx-auto mb-6 text-slate-200" />
                    <h3 className="text-xl font-black uppercase italic text-slate-900">Aucun véhicule trouvé</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase mt-2">Essayez de modifier vos filtres à gauche</p>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* MODAL AD (PUBS) - RESTE IDENTIQUE */}
      <AnimatePresence>
        {showAd && activeAd && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="relative w-full max-w-md bg-white rounded-[3rem] overflow-hidden shadow-2xl">
              <button onClick={() => setShowAd(false)} className="absolute top-4 right-4 z-10 p-3 bg-white/20 backdrop-blur-xl text-white rounded-full"><X size={20} /></button>
              <div className="relative aspect-square">
                <img src={activeAd.imageUrl} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                <div className="absolute bottom-0 p-8 w-full">
                   <h2 className="text-2xl font-black text-white uppercase italic mb-4">{activeAd.company}</h2>
                   <div className="flex gap-2">
                     <a href={activeAd.link} target="_blank" className="flex-1 py-4 bg-blue-600 text-white text-center rounded-2xl font-black text-[10px] uppercase">Découvrir</a>
                     <button onClick={() => setShowAd(false)} className="px-6 py-4 bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase border border-white/20">Fermer</button>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const ArrowRight = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
);

export default function Catalogue() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-black uppercase text-xs animate-pulse">Chargement du catalogue...</div>}>
      <CatalogueContent />
    </Suspense>
  );
}