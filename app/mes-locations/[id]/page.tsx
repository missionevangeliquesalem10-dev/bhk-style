"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/app/lib/firebase";
import { doc, getDoc, addDoc, collection, updateDoc, increment } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  MapPin, 
  Calendar, 
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Star,
  Send
} from "lucide-react";

export default function DetailReservation() {
  const { id } = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // États pour le système d'avis
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) return;
      const snap = await getDoc(doc(db, "bookings", id as string));
      if (snap.exists()) {
        setBooking({ id: snap.id, ...snap.data() });
        // Vérifier si un avis existe déjà (optionnel pour la BETA, on peut aussi le stocker dans le booking)
        if (snap.data().hasReviewed) setHasReviewed(true);
      }
      setLoading(false);
    };
    fetchBooking();
  }, [id]);

  const handleDownloadPDF = () => {
    window.print();
  };

  const submitReview = async () => {
    if (!comment.trim()) return alert("Laissez un petit commentaire !");
    setIsSubmittingReview(true);

    try {
      // 1. Ajouter l'avis dans la collection "reviews"
      await addDoc(collection(db, "reviews"), {
        carId: booking.carId,
        bookingId: booking.id,
        rating: rating,
        comment: comment,
        tenantName: booking.tenantName,
        createdAt: new Date().toISOString()
      });

      // 2. Mettre à jour la voiture : Calcul du Priority Score
      // On utilise increment() de Firebase pour la performance
      const carRef = doc(db, "cars", booking.carId);
      await updateDoc(carRef, {
        priorityScore: increment(rating), // Ajoute les points au score total
        reviewCount: increment(1)
      });

      // 3. Marquer le booking comme "noté" pour cacher le formulaire
      await updateDoc(doc(db, "bookings", booking.id), {
        hasReviewed: true
      });

      setHasReviewed(true);
      alert("Merci ! Votre avis aide cet hôte à remonter dans le classement.");
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'envoi de l'avis.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black uppercase text-[10px] animate-pulse">Chargement du reçu...</div>;

  if (!booking) return <div className="p-20 text-center uppercase font-black text-slate-400">Réservation introuvable</div>;

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-20 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* ACTIONS */}
        <div className="flex items-center justify-between print:hidden">
          <button onClick={() => router.back()} className="p-4 bg-white rounded-2xl shadow-sm hover:bg-slate-100 transition">
            <ChevronLeft size={20} />
          </button>
          
          {booking.status === "Confirmée" && (
            <button 
              onClick={handleDownloadPDF}
              className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-200"
            >
              <Printer size={18} /> Imprimer le reçu
            </button>
          )}
        </div>

        {/* REÇU PDF */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 relative overflow-hidden print:shadow-none print:border-none print:p-0"
        >
          <div className="absolute top-10 right-10 opacity-5 font-black text-7xl uppercase italic -rotate-12 pointer-events-none">
            {booking.status}
          </div>

          <div className="flex flex-col md:flex-row justify-between gap-10 border-b border-slate-100 pb-10">
            <div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2">Référence Wotro</p>
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">#{booking.id.slice(0, 8)}</h1>
              <div className="mt-6">
                <h2 className="text-xl font-black text-slate-900 uppercase italic">{booking.carName}</h2>
                <p className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
                   <Calendar size={14} /> {booking.startDate} — {booking.endDate}
                </p>
              </div>
            </div>
            
            <div className="md:text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Total Réglé</p>
              <h2 className="text-4xl font-black text-blue-600 italic leading-none">{booking.totalPrice?.toLocaleString()} FCFA</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 py-10">
            <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                <MapPin size={16} className="text-blue-600" /> Lieu de prise en charge
              </h3>
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <p className="text-xs font-bold text-slate-700 leading-relaxed uppercase">
                  {booking.status === 'Confirmée' 
                    ? (booking.exactAddress || "Contactez l'hôte pour l'adresse") 
                    : "L'adresse sera révélée après confirmation."}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                <ShieldCheck size={16} className="text-blue-600" /> Rappels
              </h3>
              <ul className="text-[9px] font-bold text-slate-400 space-y-3 uppercase tracking-widest">
                <li className="flex items-center gap-3"><CheckCircle2 size={14} className="text-green-500" /> Permis de conduire original</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={14} className="text-green-500" /> État des lieux photos</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* SYSTEME DE NOTATION (Caché à l'impression) */}
        {booking.status === "Confirmée" && !hasReviewed && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 p-10 rounded-[3rem] text-white print:hidden shadow-2xl shadow-blue-200"
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl font-black uppercase italic italic tracking-tighter">Notez votre <span className="text-blue-400">Expérience</span></h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Votre note aide les meilleurs hôtes à rester en tête</p>
            </div>

            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button 
                  key={star} 
                  onClick={() => setRating(star)}
                  className={`p-2 transition-all ${rating >= star ? 'text-yellow-400 scale-125' : 'text-slate-700'}`}
                >
                  <Star size={32} fill={rating >= star ? "currentColor" : "none"} />
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <textarea 
                placeholder="Comment s'est passée la location ? (Propreté, ponctualité...)"
                className="w-full bg-slate-800 border-none rounded-2xl p-5 text-sm font-bold placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-blue-500 transition-all min-h-[120px]"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <button 
                onClick={submitReview}
                disabled={isSubmittingReview}
                className="w-full py-5 bg-blue-600 hover:bg-white hover:text-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSubmittingReview ? "Envoi..." : "Publier mon avis"} <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {hasReviewed && (
          <div className="bg-green-50 p-6 rounded-[2rem] border border-green-100 text-center print:hidden">
            <p className="text-green-600 font-black text-[10px] uppercase tracking-widest">✓ Merci pour votre avis précieux !</p>
          </div>
        )}
      </div>
    </div>
  );
}