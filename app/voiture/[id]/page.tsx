"use client";

import React, { useEffect, useState } from "react";
import { db, auth } from "@/app/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Gauge,
  Fuel,
  ShieldCheck,
  ChevronLeft,
  MessageCircle,
  CalendarCheck
} from "lucide-react";
import ChatFloating from "@/components/ChatFloating";

export default function VoitureDetail() {
  const { id } = useParams();
  const router = useRouter();

  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [activeChatId, setActiveChatId] = useState("");

  useEffect(() => {
    if (!id) return;

    const fetchCar = async () => {
      try {
        const carId = Array.isArray(id) ? id[0] : id;

        const carSnap = await getDoc(doc(db, "cars", carId));
        if (!carSnap.exists()) return;

        const carData = carSnap.data();

        const ownerSnap = await getDoc(doc(db, "users", carData.ownerId));
        const ownerData = ownerSnap.exists() ? ownerSnap.data() : {};

        const completeCar = {
          id: carSnap.id,
          ...carData,
          ownerName: ownerData.fullName || "Hôte Wotro",
          ownerPhoto:
            ownerData.photoURL ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              ownerData.fullName || "H"
            )}&background=2563eb&color=fff`,
        };

        setCar(completeCar);

        if (auth.currentUser?.uid && carData.ownerId) {
          const ids = [auth.currentUser.uid, carData.ownerId].sort();
          const chatId = `${ids[0]}_${ids[1]}_${carSnap.id}`;
          setActiveChatId(chatId);
        }
      } catch (e) {
        console.error("Erreur chargement voiture :", e);
      } finally {
        setLoading(false);
      }
    };

    fetchCar();
  }, [id, auth.currentUser?.uid]);

  const handleContact = async () => {
    if (!auth.currentUser) {
      router.push("/inscription-client");
      return;
    }

    if (!car || !activeChatId) return;

    if (auth.currentUser.uid === car.ownerId) {
      alert("C'est votre propre annonce !");
      return;
    }

    try {
      const chatRef = doc(db, "chats", activeChatId);

      await setDoc(chatRef, {
        id: activeChatId,
        participants: [auth.currentUser.uid, car.ownerId],
        carId: car.id,
        carName: car.name,
        carImage: car.image,
        ownerName: car.ownerName,
        ownerPhoto: car.ownerPhoto,
        tenantId: auth.currentUser.uid,
        ownerId: car.ownerId,
        lastMessage: "Demande de renseignement...",
        updatedAt: new Date(),
      }, { merge: true });

      setShowChat(true);
    } catch (error) {
      console.error("Erreur création chat :", error);
      alert("Erreur Firestore (permissions)");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!car)
    return (
      <div className="p-20 text-center text-xs font-black uppercase tracking-widest text-slate-400">
        Véhicule introuvable
      </div>
    );

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* IMAGE HEADER */}
      <div className="relative h-[50vh] lg:h-[70vh] bg-slate-900 overflow-hidden lg:rounded-b-[5rem]">
        <button
          onClick={() => router.back()}
          className="absolute top-12 left-6 z-20 p-4 bg-white/20 backdrop-blur-md text-white rounded-2xl hover:bg-white hover:text-slate-900 transition shadow-xl"
        >
          <ChevronLeft size={24} />
        </button>
        <img
          src={car.image}
          alt={car.name}
          className="w-full h-full object-cover opacity-90"
        />
      </div>

      {/* CONTENU GLOBAL */}
      <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* COLONNE INFOS (GAUCHE) */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 lg:p-12 rounded-[3rem] shadow-xl border border-slate-100"
            >
              <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
                <div>
                  <h1 className="text-4xl lg:text-6xl font-black uppercase italic tracking-tighter text-slate-900">
                    {car.name}
                  </h1>
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-black uppercase tracking-widest mt-2">
                    <MapPin size={14} className="text-blue-600" /> {car.location}
                  </div>
                </div>
                <div className="bg-blue-50 px-6 py-4 rounded-3xl h-fit">
                  <p className="text-2xl font-black text-blue-600 italic">
                    {car.price?.toLocaleString()} <span className="text-[10px] uppercase tracking-widest">FCFA/J</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-y border-slate-50 py-8 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="p-3 bg-slate-50 rounded-2xl text-slate-900"><Gauge size={20} /></div>
                  {car.transmission}
                </div>
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="p-3 bg-slate-50 rounded-2xl text-slate-900"><Fuel size={20} /></div>
                  {car.fuel}
                </div>
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="p-3 bg-slate-50 rounded-2xl text-slate-900"><ShieldCheck size={20} /></div>
                  Assurance incluse
                </div>
              </div>

              <div className="mt-8">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-4 text-slate-400">Description</h4>
                <p className="text-slate-600 leading-relaxed font-medium">{car.description}</p>
              </div>
            </motion.div>
          </div>

          {/* COLONNE ACTIONS (DROITE) */}
          <div className="lg:sticky lg:top-32 h-fit">
            <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[60px] rounded-full" />
              
              <div className="relative z-10 space-y-6">
                <div>
                  <h3 className="text-xl font-black uppercase italic leading-tight">
                    Prêt pour <span className="text-blue-500 text-2xl">Abidjan ?</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Vérifiez la disponibilité et réservez.</p>
                </div>

                <div className="flex flex-col gap-3">
                  {/* BOUTON RÉSERVER */}
                  <button
                    onClick={() => router.push(`/reserver/${car.id}`)}
                    className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-white hover:text-blue-600 transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <CalendarCheck size={18} /> Réserver maintenant
                  </button>

                  {/* BOUTON CONTACTER */}
                  <button
                    onClick={handleContact}
                    className="w-full py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <MessageCircle size={18} /> Contacter l'hôte
                  </button>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                    <img src={car.ownerPhoto} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Propriétaire</p>
                    <p className="text-[10px] font-black uppercase">{car.ownerName}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* CHAT FLOTTANT */}
      <AnimatePresence>
        {showChat && (
          <ChatFloating
            chatId={activeChatId}
            carInfo={{
              ownerName: car.ownerName,
              ownerPhoto: car.ownerPhoto,
              carName: car.name,
            }}
            onClose={() => setShowChat(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}