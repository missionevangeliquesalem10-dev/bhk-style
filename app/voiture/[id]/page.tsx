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
  CalendarCheck,
  BadgeCheck,
  Info
} from "lucide-react";
import ChatFloating from "@/components/ChatFloating";

export default function VoitureDetail() {
  const { id } = useParams();
  const router = useRouter();

  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [activeChatId, setActiveChatId] = useState("");

  // Remplace ton useEffect par celui-ci dans VoitureDetail
useEffect(() => {
  if (!id) return;

  const fetchCar = async () => {
    try {
      const carId = Array.isArray(id) ? id[0] : id;
      const carRef = doc(db, "cars", carId);
      const carSnap = await getDoc(carRef);

      if (!carSnap.exists()) {
        setCar(null);
        setLoading(false);
        return;
      }

      const carData = carSnap.data();

      // On récupère les infos du proprio directement dans "users" 
      // car le chemin "users/id/public/info" est peut-être vide chez toi
      const ownerSnap = await getDoc(doc(db, "users", carData.ownerId));
      const ownerData = ownerSnap.exists() ? ownerSnap.data() : {};

      setCar({
        id: carSnap.id,
        ...carData,
        ownerName: ownerData.fullName || "Hôte BHK",
        ownerPhoto: ownerData.photoURL || `https://ui-avatars.com/api/?name=H&background=2563eb&color=fff`,
      });
    } catch (error) {
      console.error("Erreur :", error);
      setCar(null);
    } finally {
      setLoading(false);
    }
  };

  fetchCar();
}, [id]);

  const handleContact = async () => {
    if (!auth.currentUser) {
      router.push("/inscription-client");
      return;
    }

    if (!car) return;

    if (auth.currentUser.uid === car.ownerId) {
      alert("C'est votre propre annonce !");
      return;
    }

    try {
      const ids = [auth.currentUser.uid, car.ownerId].sort();
      const chatId = `${ids[0]}_${ids[1]}_${car.id}`;
      setActiveChatId(chatId);

      const chatRef = doc(db, "chats", chatId);

      await setDoc(
        chatRef,
        {
          id: chatId,
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
        },
        { merge: true }
      );

      setShowChat(true);
    } catch (error) {
      console.error("Erreur création chat :", error);
      alert("Erreur lors de la mise en relation.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center">
        <Info size={48} className="text-slate-200 mb-4" />
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
          Ce véhicule n'est plus disponible ou l'annonce a été retirée.
        </p>
        <button
          onClick={() => router.push("/catalogue")}
          className="mt-6 text-blue-600 font-black text-[10px] uppercase tracking-widest border-b-2 border-blue-600"
        >
          Retour au catalogue
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-20">
      {/* IMAGE HEADER */}
      <div className="relative h-[50vh] lg:h-[65vh] bg-slate-900 overflow-hidden lg:rounded-b-[5rem] shadow-2xl">
        <button
          onClick={() => router.back()}
          className="absolute top-12 left-6 z-20 p-4 bg-white/20 backdrop-blur-md text-white rounded-2xl hover:bg-white hover:text-slate-900 transition-all shadow-xl active:scale-90"
        >
          <ChevronLeft size={24} />
        </button>
        <img
          src={car.image}
          alt={car.name}
          className="w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {/* CONTENU PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-6 -mt-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 lg:p-12 rounded-[3.5rem] shadow-sm border border-slate-100"
            >
              <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl lg:text-6xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
                      {car.name}
                    </h1>
                    {car.isValidated && (
                      <BadgeCheck className="text-blue-500 w-8 h-8 lg:w-10 lg:h-10" fill="currentColor" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                    <MapPin size={16} className="text-blue-600" />
                    {car.location}
                  </div>
                </div>
                <div className="bg-slate-900 px-8 py-5 rounded-[2rem] shadow-xl shadow-slate-200">
                  <p className="text-2xl font-black text-white italic">
                    {car.price?.toLocaleString()}{" "}
                    <span className="text-[10px] text-blue-400 uppercase not-italic tracking-widest">FCFA / Jour</span>
                  </p>
                </div>
              </div>

              {/* CARACTÉRISTIQUES */}
              <div className="grid grid-cols-3 gap-4 border-y border-slate-50 py-10">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="p-4 bg-slate-50 rounded-2xl text-slate-400"><Gauge size={24} /></div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{car.transmission}</span>
                </div>
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="p-4 bg-slate-50 rounded-2xl text-slate-400"><Fuel size={24} /></div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{car.fuel}</span>
                </div>
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="p-4 bg-blue-50 rounded-2xl text-blue-500"><ShieldCheck size={24} /></div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-blue-500 text-nowrap">Assurance incluse</span>
                </div>
              </div>

              <div className="mt-10">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">
                  Description du véhicule
                </h4>
                <p className="text-slate-600 leading-relaxed font-medium">
                  {car.description || "Aucune description fournie pour ce véhicule."}
                </p>
              </div>
            </motion.div>
          </div>

          {/* COLONNE ACTIONS */}
          <div className="lg:sticky lg:top-28 h-fit">
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl mb-6">
                <img src={car.ownerPhoto} className="w-12 h-12 rounded-xl object-cover shadow-sm" alt="" />
                <div>
                  <p className="text-[8px] font-black uppercase text-blue-600 tracking-widest">Hôte Propriétaire</p>
                  <p className="font-black text-slate-900 text-sm uppercase">{car.ownerName}</p>
                </div>
              </div>

              <button
                onClick={() => router.push(`/reserver/${car.id}`)}
                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-slate-900 transition-all shadow-xl shadow-blue-100 active:scale-95"
              >
                <CalendarCheck size={18} /> Réserver maintenant
              </button>

              <button
                onClick={handleContact}
                className="w-full py-5 bg-slate-100 text-slate-900 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-slate-200 transition-all active:scale-95"
              >
                <MessageCircle size={18} /> Contacter l'hôte
              </button>

              <p className="text-[8px] text-center text-slate-400 font-bold uppercase mt-4 px-4">
                En cliquant sur réserver, vous acceptez les conditions de location de BHK_DRIVE.
              </p>
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
              carImage: car.image,
            }}
            onClose={() => setShowChat(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
