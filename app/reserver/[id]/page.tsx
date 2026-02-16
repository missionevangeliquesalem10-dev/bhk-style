"use client";

import React, { useEffect, useState } from "react";
import { db, auth } from "@/app/lib/firebase";
import { doc, getDoc, addDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, AlertTriangle, MessageCircle } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

export default function ReserverVoiture() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [allImages, setAllImages] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalPrice, setTotalPrice] = useState(0);
  const [bookedDates, setBookedDates] = useState<{ start: Date; end: Date }[]>([]);
  const [isDateValid, setIsDateValid] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const carRef = doc(db, "cars", id);
        const carSnap = await getDoc(carRef);

        if (!carSnap.exists()) {
          setCar(null);
          setLoading(false);
          return;
        }

        const data = carSnap.data();
        setCar({ id: carSnap.id, ...data });

        const images = [data.image, ...(Array.isArray(data.gallery) ? data.gallery : [])].filter(Boolean);
        setAllImages(images);

        const q = query(collection(db, "bookings"), where("carId", "==", id), where("status", "==", "Confirmée"));
        const snapshot = await getDocs(q);
        const dates = snapshot.docs.map((d) => ({
          start: new Date(d.data().startDate),
          end: new Date(d.data().endDate),
        }));
        setBookedDates(dates);
      } catch (e) {
        console.error(e);
        setCar(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (!startDate || !endDate || !car) return;
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      setIsDateValid(false);
      setTotalPrice(0);
      return;
    }

    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 1;
    const collision = bookedDates.some((range) => start <= range.end && end >= range.start);

    setIsDateValid(!collision);
    setTotalPrice(diffDays * car.price);
  }, [startDate, endDate, car, bookedDates]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) { router.push("/inscription-client"); return; }
    if (!isDateValid) { toast.error("Dates indisponibles"); return; }

    setSubmitting(true);
    try {
      await addDoc(collection(db, "bookings"), {
        carId: car.id,
        carName: car.name,
        carImage: car.image,
        ownerId: car.ownerId,
        tenantId: auth.currentUser.uid,
        tenantName: auth.currentUser.displayName || "Client Wotro",
        startDate,
        endDate,
        totalPrice,
        status: "En attente",
        createdAt: new Date().toISOString(),
      });
      toast.success("Demande envoyée !");
      router.push("/mes-locations");
    } catch (error) {
      toast.error("Erreur de permission");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-blue-600 animate-pulse">Chargement...</div>;
  if (!car) return <div className="min-h-screen flex items-center justify-center text-slate-400">Véhicule introuvable</div>;

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-20 px-6">
      <Toaster />
      <div className="max-w-5xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 font-black text-[10px] mb-8 hover:text-blue-600">
          <ChevronLeft size={16} /> Retour
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div className="relative bg-white p-3 rounded-[3rem] shadow border">
              <div className="aspect-[16/10] overflow-hidden rounded-[2.5rem]">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentImgIndex}
                    src={allImages[currentImgIndex]}
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  />
                </AnimatePresence>
              </div>
              {allImages.length > 1 && (
                <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
                  <button onClick={() => setCurrentImgIndex(i => i === 0 ? allImages.length - 1 : i - 1)} className="p-3 bg-white/80 backdrop-blur rounded-full shadow pointer-events-auto hover:bg-white"><ChevronLeft size={20}/></button>
                  <button onClick={() => setCurrentImgIndex(i => i === allImages.length - 1 ? 0 : i + 1)} className="p-3 bg-white/80 backdrop-blur rounded-full shadow pointer-events-auto hover:bg-white"><ChevronRight size={20}/></button>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleBooking} className="bg-white p-10 rounded-[4rem] shadow-xl space-y-8 h-fit">
            <h3 className="text-xs font-black uppercase flex items-center gap-2"><Check className="text-blue-600" /> Dates de location</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Début</label>
                <input type="date" required min={new Date().toISOString().split("T")[0]} onChange={(e) => setStartDate(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 border-none font-bold outline-none focus:ring-2 focus:ring-blue-600/20" />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Fin</label>
                <input type="date" required min={startDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 border-none font-bold outline-none focus:ring-2 focus:ring-blue-600/20" />
              </div>
            </div>

            {!isDateValid && <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex gap-2 items-center text-[10px] font-bold"><AlertTriangle size={14}/> Ces dates sont déjà réservées</div>}

            {totalPrice > 0 && isDateValid && (
              <div className="p-6 bg-slate-900 text-white rounded-3xl">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Montant total estimé</p>
                <p className="text-2xl font-black italic">{totalPrice.toLocaleString()} FCFA</p>
              </div>
            )}

            <button disabled={submitting || !isDateValid || !startDate || !endDate} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest disabled:bg-slate-200 shadow-xl shadow-blue-100 active:scale-95 transition-all">
              {submitting ? "Traitement..." : "Confirmer la réservation"}
            </button>
          </form>
          {/* =========================
   DÉTAILS DU VÉHICULE
========================= */}
<div className="max-w-5xl mx-auto mt-20">
  <div className="bg-white rounded-[3rem] shadow-xl p-10 space-y-10">

    {/* Titre */}
    <div>
      <h2 className="text-2xl font-black">{car.name}</h2>
      <p className="text-slate-400 text-sm mt-1">
        {car.brand} {car.model} {car.year && `• ${car.year}`}
      </p>
    </div>

    {/* Infos principales */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm font-bold">
      {car.price && (
        <div>
          <p className="text-slate-400 uppercase text-[10px]">Prix / jour</p>
          <p>{car.price.toLocaleString()} FCFA</p>
        </div>
      )}

      {car.fuel && (
        <div>
          <p className="text-slate-400 uppercase text-[10px]">Carburant</p>
          <p>{car.fuel}</p>
        </div>
      )}

      {car.gearbox && (
        <div>
          <p className="text-slate-400 uppercase text-[10px]">Transmission</p>
          <p>{car.gearbox}</p>
        </div>
      )}

      {car.seats && (
        <div>
          <p className="text-slate-400 uppercase text-[10px]">Places</p>
          <p>{car.seats}</p>
        </div>
      )}

      {car.color && (
        <div>
          <p className="text-slate-400 uppercase text-[10px]">Couleur</p>
          <p>{car.color}</p>
        </div>
      )}

      {car.location && (
        <div>
          <p className="text-slate-400 uppercase text-[10px]">Localisation</p>
          <p>{car.location}</p>
        </div>
      )}
    </div>

    {/* Description longue */}
    {car.description && (
      <div className="pt-8 border-t">
        <h3 className="text-sm font-black uppercase mb-3">
          Description du véhicule
        </h3>
        <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
          {car.description}
        </p>
      </div>
    )}

  </div>
</div>

        </div>
      </div>
    </div>
  );
}