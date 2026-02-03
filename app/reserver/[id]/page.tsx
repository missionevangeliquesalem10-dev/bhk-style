"use client";
import React, { useEffect, useState } from 'react';
import { db, auth } from '@/app/lib/firebase';
import { doc, getDoc, addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, ShieldCheck, Check, 
  AlertTriangle, MessageCircle, ImageIcon 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ReserverVoiture() {
  const { id } = useParams();
  const router = useRouter();
  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Gestion du Diaporama
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [allImages, setAllImages] = useState<string[]>([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalPrice, setTotalPrice] = useState(0);
  
  const [bookedDates, setBookedDates] = useState<{start: Date, end: Date}[]>([]);
  const [isDateValid, setIsDateValid] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      const carSnap = await getDoc(doc(db, "cars", id as string));
      if (carSnap.exists()) {
        const data = carSnap.data();
        setCar({ id: carSnap.id, ...data });
        
        // Fusionner l'image principale et la galerie
        const images = [data.image, ...(data.gallery || [])];
        setAllImages(images);
      }

      const q = query(
        collection(db, "bookings"), 
        where("carId", "==", id),
        where("status", "==", "Confirmée")
      );
      const querySnapshot = await getDocs(q);
      const dates = querySnapshot.docs.map(doc => ({
        start: new Date(doc.data().startDate),
        end: new Date(doc.data().endDate)
      }));
      setBookedDates(dates);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (startDate && endDate && car) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 1;
      setTotalPrice(diffDays * car.price);

      const collision = bookedDates.some(range => {
        return (start <= range.end && end >= range.start);
      });

      setIsDateValid(!collision && start < end);
    }
  }, [startDate, endDate, car, bookedDates]);

  const notifyHostWhatsApp = (ownerPhone: string, carName: string, date: string) => {
    const cleanPhone = ownerPhone.replace(/\s+/g, '');
    const message = `Bonjour ! Je viens de réserver votre ${carName} sur Wotro pour le ${date}. Pouvez-vous confirmer ma demande ? Merci !`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return router.push('/inscription-client');
    if (!isDateValid) return alert("Ces dates sont déjà occupées.");

    setSubmitting(true);
    try {
      await addDoc(collection(db, "bookings"), {
        carId: car.id,
        carName: car.name,
        carImage: car.image,
        ownerId: car.ownerId,
        exactAddress: car.exactAddress || "À confirmer",
        tenantId: auth.currentUser.uid,
        tenantName: auth.currentUser.displayName || "Client Wotro",
        startDate,
        endDate,
        totalPrice,
        status: "En attente",
        createdAt: new Date().toISOString(),
      });

      toast.success("Demande enregistrée !");

      setTimeout(() => {
        if (car.ownerPhone) notifyHostWhatsApp(car.ownerPhone, car.name, startDate);
        router.push('/mes-locations');
      }, 1000);

    } catch (error) {
      toast.error("Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black uppercase text-xs animate-pulse text-blue-600">Chargement du véhicule...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest mb-8 hover:text-blue-600 transition-all">
          <ChevronLeft size={16} /> Retour
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {/* COLONNE GAUCHE : GALERIE & INFOS */}
          <div className="space-y-6">
            <h1 className="text-4xl font-black text-slate-900 uppercase italic leading-tight tracking-tighter">
              Détails du <span className="text-blue-600">Véhicule</span>
            </h1>

            {/* DIAPORAMA PHOTOS */}
            <div className="relative group bg-white p-3 rounded-[3rem] shadow-sm border border-slate-100">
              <div className="relative aspect-[16/10] overflow-hidden rounded-[2.5rem] bg-slate-100">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentImgIndex}
                    src={allImages[currentImgIndex]}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5 }}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                </AnimatePresence>

                {/* Navigation Diapo */}
                {allImages.length > 1 && (
                  <>
                    <button 
                      onClick={() => setCurrentImgIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button 
                      onClick={() => setCurrentImgIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}

                {/* Indicateur de position */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                  {allImages.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 rounded-full transition-all ${i === currentImgIndex ? 'w-8 bg-blue-600' : 'w-2 bg-white/50'}`} 
                    />
                  ))}
                </div>
              </div>

              {/* Miniatures */}
              <div className="flex gap-3 mt-4 px-2 overflow-x-auto pb-2 scrollbar-hide">
                {allImages.map((img, i) => (
                  <button 
                    key={i} 
                    onClick={() => setCurrentImgIndex(i)}
                    className={`relative w-20 h-14 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${i === currentImgIndex ? 'border-blue-600 scale-105' : 'border-transparent opacity-60'}`}
                  >
                    <img src={img} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">{car.name}</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{car.location}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-blue-600 italic leading-none">{car.price.toLocaleString()}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">FCFA / Jour</p>
                </div>
              </div>
              <div className="h-[1px] bg-slate-50 my-6" />
              <p className="text-sm font-medium text-slate-500 leading-relaxed italic">
                "{car.description || "Aucune description fournie par l'hôte."}"
              </p>
            </div>
          </div>

          {/* COLONNE DROITE : FORMULAIRE RÉSERVATION */}
          <form onSubmit={handleBooking} className="bg-white p-8 lg:p-10 rounded-[4rem] shadow-2xl border border-slate-100 space-y-8 sticky top-28">
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-6 flex items-center gap-3">
                <Check className="text-blue-600" /> Choisir vos dates
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-5 rounded-[2rem]">
                  <label className="text-[9px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Prise en charge</label>
                  <input type="date" min={new Date().toISOString().split('T')[0]} required className="bg-transparent w-full outline-none font-bold text-slate-900" onChange={(e) => setStartDate(e.target.value)} />
                </div>

                <div className="bg-slate-50 p-5 rounded-[2rem]">
                  <label className="text-[9px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Restitution</label>
                  <input type="date" min={startDate || new Date().toISOString().split('T')[0]} required className="bg-transparent w-full outline-none font-bold text-slate-900" onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
            </div>

            {!isDateValid && startDate && endDate && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-5 bg-red-50 text-red-600 rounded-[2rem] flex items-center gap-4 border border-red-100">
                <AlertTriangle size={24} />
                <p className="text-[10px] font-black uppercase leading-tight tracking-widest">Ce véhicule est déjà réservé à ces dates.</p>
              </motion.div>
            )}

            {isDateValid && totalPrice > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8 bg-slate-900 rounded-[3rem] text-white">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Montant estimé</span>
                    <p className="text-[8px] text-blue-400 font-bold uppercase tracking-widest italic">Assurance incluse</p>
                  </div>
                  <span className="text-3xl font-black italic tracking-tighter">{totalPrice.toLocaleString()} <span className="text-[10px] uppercase">FCFA</span></span>
                </div>
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={submitting || !isDateValid || !startDate || !endDate}
              className={`w-full py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl transition-all flex items-center justify-center gap-3 ${
                isDateValid && totalPrice > 0 
                ? 'bg-blue-600 text-white shadow-blue-200 hover:bg-slate-900' 
                : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
              }`}
            >
              {submitting ? "Envoi..." : "Envoyer & Prévenir l'hôte"} <MessageCircle size={20} />
            </button>
            <p className="text-center text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
              Confirmation immédiate via WhatsApp
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}