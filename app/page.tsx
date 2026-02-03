"use client";
import React, { useEffect, useState } from 'react';
import { db } from '@/app/lib/firebase';
import { collection, query, limit, getDocs, orderBy, where, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, ArrowRight, Star, Zap, ShieldCheck, Search, Wallet,
  CheckCircle2, Car, TrendingUp, Play, X, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Testimonials from '@/components/Testimonials';

export default function Home() {
  const router = useRouter();
  const [cars, setCars] = useState<any[]>([]);
  const [activeAd, setActiveAd] = useState<any>(null); // Pour le pop-up publicitaire
  const [showAd, setShowAd] = useState(false);
  const [loading, setLoading] = useState(true);

  // ÉTATS RECHERCHE & SIMULATEUR
  const [searchLocation, setSearchLocation] = useState("Toutes");
  const [searchPrice, setSearchPrice] = useState("500000");
  const [jours, setJours] = useState(15);
  const [prixSimule, setPrixSimule] = useState(35000);

  useEffect(() => {
    // 1. Charger les voitures
    const fetchTopCars = async () => {
      try {
        const q = query(collection(db, "cars"), where("isAvailable", "==", true), orderBy("priorityScore", "desc"), limit(3));
        const querySnapshot = await getDocs(q);
        setCars(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    // 2. Gestion du Pop-up Publicitaire
    const qAds = query(collection(db, "ads"), where("isActive", "==", true), limit(1));
    const unsubAds = onSnapshot(qAds, (snap) => {
      if (!snap.empty) {
        const adData = { id: snap.docs[0].id, ...snap.docs[0].data() };
        setActiveAd(adData);
        
        // Vérifier si on a déjà montré la pub dans cette session
        const hasSeenAd = sessionStorage.getItem('hasSeenWotroAd');
        if (!hasSeenAd) {
          setTimeout(() => setShowAd(true), 2000); // Apparaît après 2 secondes
        }
      }
    });

    fetchTopCars();
    return () => unsubAds();
  }, []);

  const closeAd = () => {
    setShowAd(false);
    sessionStorage.setItem('hasSeenWotroAd', 'true');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/catalogue?location=${searchLocation}&maxPrice=${searchPrice}`);
  };

  return (
    <main className="min-h-screen bg-white">

      {/* --- POP-UP PUBLICITAIRE --- */}
      <AnimatePresence>
        {showAd && activeAd && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[3rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.4)]"
            >
              {/* Bouton Fermer */}
              <button 
                onClick={closeAd}
                className="absolute top-4 right-4 z-10 p-3 bg-white/20 backdrop-blur-xl text-white rounded-full hover:bg-red-500 transition-all"
              >
                <X size={20} />
              </button>

              {/* Contenu de la Pub */}
              <div className="relative aspect-[4/5] md:aspect-square group">
                <img src={activeAd.imageUrl} className="w-full h-full object-cover" alt={activeAd.company} />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                
                <div className="absolute bottom-0 left-0 p-10 w-full space-y-4">
                   <div className="inline-flex px-3 py-1 bg-blue-600 rounded-full text-[8px] font-black uppercase text-white tracking-widest mb-2">
                     Sponsorisé par Wotro
                   </div>
                   <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">
                     {activeAd.company}
                   </h2>
                   <div className="flex gap-3">
                     {activeAd.link && (
                       <a 
                        href={activeAd.link} 
                        target="_blank" 
                        className="flex-1 py-4 bg-white text-slate-900 text-center rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2"
                       >
                         Découvrir l'offre <ExternalLink size={14} />
                       </a>
                     )}
                     <button 
                      onClick={closeAd}
                      className="px-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest"
                     >
                       Fermer
                     </button>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center space-y-10 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-100">
              <Zap size={14} className="text-blue-600" fill="currentColor" />
              <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest italic">Location Premium à Abidjan</span>
            </div>
            <h1 className="text-6xl md:text-[10rem] font-black text-slate-900 leading-[0.85] uppercase italic tracking-tighter">
              Roulez <br /> <span className="text-blue-600">Libre.</span>
            </h1>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            onSubmit={handleSearch}
            className="bg-white p-3 rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.12)] border border-slate-100 flex flex-col md:flex-row items-center gap-2 max-w-4xl mx-auto"
          >
            <div className="flex-1 flex items-center gap-3 px-8 py-5 bg-slate-50 rounded-[2.2rem] w-full group focus-within:bg-white transition-all">
              <MapPin size={20} className="text-blue-600" />
              <div className="flex flex-col text-left flex-1">
                <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Localisation</label>
                <select value={searchLocation} onChange={(e) => setSearchLocation(e.target.value)} className="bg-transparent text-sm font-black uppercase text-slate-900 outline-none appearance-none cursor-pointer">
                  <option>Toutes</option><option>Cocody</option><option>Marcory</option><option>Plateau</option>
                </select>
              </div>
            </div>
            <div className="flex-1 flex items-center gap-3 px-8 py-5 bg-slate-50 rounded-[2.2rem] w-full group focus-within:bg-white transition-all">
              <Wallet size={20} className="text-orange-500" />
              <div className="flex flex-col text-left flex-1">
                <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Budget Max / Jour</label>
                <select value={searchPrice} onChange={(e) => setSearchPrice(e.target.value)} className="bg-transparent text-sm font-black uppercase text-slate-900 outline-none appearance-none cursor-pointer">
                  <option value="500000">Illimité</option><option value="30000">30k FCFA</option><option value="60000">60k FCFA</option>
                </select>
              </div>
            </div>
            <button type="submit" className="p-6 bg-blue-600 text-white rounded-[2.2rem] hover:bg-slate-900 transition-all shadow-xl shadow-blue-200 w-full md:w-auto flex items-center justify-center">
              <Search size={24} />
            </button>
          </motion.form>
        </div>
      </section>

      {/* --- SECTION CATALOGUE FLASH --- */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <h3 className="text-3xl font-black uppercase italic tracking-tighter">Top <span className="text-blue-600">Sélection</span></h3>
          <Link href="/catalogue" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-all flex items-center gap-2">Voir tout <ArrowRight size={14} /></Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cars.map((car) => (
            <Link href={`/voiture/${car.id}`} key={car.id} className="group">
              <div className="relative aspect-[16/10] rounded-[2.5rem] overflow-hidden mb-4 shadow-sm border border-slate-50">
                <img src={car.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                <div className="absolute top-4 right-4 px-4 py-2 bg-white/90 backdrop-blur-md rounded-2xl font-black text-xs">{car.price.toLocaleString()} F</div>
              </div>
              <h4 className="font-black text-slate-900 uppercase italic tracking-tighter">{car.name}</h4>
            </Link>
          ))}
        </div>
      </section>

      {/* --- SECTION VIDÉO TUTORIEL --- */}
      <section className="py-24 px-6 bg-slate-50 rounded-[4rem] mx-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-4">Commencez facilement</h2>
          <h3 className="text-4xl md:text-6xl font-black text-slate-900 uppercase italic tracking-tighter mb-12">
            Comment ça <span className="text-blue-600">Marche ?</span>
          </h3>
          <div className="relative aspect-video rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white bg-slate-200 group">
            <img
              src="https://images.unsplash.com/photo-1594982630653-53d7195f1d4f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1600&q=80"
              alt="Tutoriel Wotro"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
              <div className="p-8 bg-blue-600 rounded-full text-white shadow-xl hover:scale-110 transition-transform duration-300">
                <Play size={48} fill="currentColor" />
              </div>
            </div>
          </div>
          <p className="mt-8 text-slate-500 font-medium text-lg max-w-2xl mx-auto uppercase text-xs tracking-widest font-black italic">
            Apprenez à commander en 90 secondes.
          </p>
        </div>
      </section>

      {/* --- SECTION HÔTES --- */}
      <section className="py-24 bg-slate-900 mx-6 rounded-[4rem] text-white relative overflow-hidden mt-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 blur-[100px] rounded-full" />
        <div className="max-w-6xl mx-auto px-10 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <h2 className="text-5xl md:text-7xl font-black uppercase italic leading-[0.9] tracking-tighter">
              Gagnez de <br /> l'argent avec <br /><span className="text-blue-400">votre voiture.</span>
            </h2>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600/20 rounded-2xl text-blue-400"><ShieldCheck size={24}/></div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-300">Paiements sécurisés & Profils vérifiés</p>
              </div>
            </div>
            <Link href="/devenir-hote" className="inline-flex items-center gap-3 px-10 py-5 bg-blue-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white hover:text-blue-600 transition-all">
              Inscrire mon véhicule <ArrowRight size={16}/>
            </Link>
          </div>

          {/* SIMULATEUR MINI */}
          <div className="p-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] space-y-8">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Revenu Net Mensuel Estimé</p>
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase"><span className="text-slate-500">Jours / Mois</span> <span>{jours} Jours</span></div>
                <input type="range" min="1" max="30" value={jours} onChange={(e) => setJours(parseInt(e.target.value))} className="w-full accent-blue-500 h-1 bg-slate-800 rounded-full appearance-none cursor-pointer" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase"><span className="text-slate-500">Tarif Journalier</span> <span>{prixSimule.toLocaleString()} F</span></div>
                <input type="range" min="15000" max="150000" step="5000" value={prixSimule} onChange={(e) => setPrixSimule(parseInt(e.target.value))} className="w-full accent-blue-500 h-1 bg-slate-800 rounded-full appearance-none cursor-pointer" />
              </div>
            </div>
            <div className="pt-8 border-t border-white/10">
              <h3 className="text-5xl font-black italic tracking-tighter">{(jours * prixSimule * 0.85).toLocaleString()} <span className="text-xs uppercase italic text-slate-500">FCFA Net</span></h3>
            </div>
          </div>
        </div>
      </section>

      <Testimonials />
    </main>
  );
}