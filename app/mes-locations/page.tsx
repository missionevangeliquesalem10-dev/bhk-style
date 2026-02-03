"use client";
import { useEffect, useState } from 'react';
import { db, auth } from '@/app/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Car, Phone, ShieldCheck, ChevronRight, Info } from 'lucide-react';
import Link from 'next/link';

export default function MesLocations() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) return;

      // On récupère les bookings du client
      const q = query(
        collection(db, "bookings"),
        where("tenantId", "==", user.uid)
      );

      const unsubscribe = onSnapshot(q, (snap) => {
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Tri par date de création (le plus récent en haut)
        setBookings(data.sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
        setLoading(false);
      });

      return () => unsubscribe();
    });

    return () => unsubAuth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* EN-TÊTE */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
              Mon historique <span className="text-blue-600">Voyage</span>
            </h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-3">Suivez vos demandes et téléchargez vos reçus</p>
          </div>
          
          <Link href="/profil" className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
             <ShieldCheck size={18} className="text-blue-600" />
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Mes Documents</span>
          </Link>
        </div>

        {/* LISTE DES RÉSERVATIONS */}
        <div className="space-y-4">
          {loading ? (
            [1, 2].map(i => <div key={i} className="h-40 bg-white rounded-[2.5rem] animate-pulse border border-slate-100" />)
          ) : (
            bookings.map((booking) => (
              /* REDIRECTION VERS LA PAGE DÉTAIL [id] */
              <Link key={booking.id} href={`/mes-locations/${booking.id}`}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className="group bg-white border border-slate-100 p-6 md:p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-200 transition-all cursor-pointer relative"
                >
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    
                    {/* INFOS VÉHICULE */}
                    <div className="flex gap-6">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
                        <img src={booking.carImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 uppercase text-lg italic tracking-tight leading-none mb-2">
                          {booking.carName}
                        </h3>
                        <div className="space-y-1">
                          <p className="flex items-center gap-2 text-slate-400 text-[9px] font-black uppercase tracking-widest">
                            <Calendar size={12} className="text-blue-500" /> {booking.startDate} — {booking.endDate}
                          </p>
                          <p className="text-blue-600 font-black text-[10px] italic uppercase tracking-tighter">
                            Total : {booking.totalPrice?.toLocaleString()} FCFA
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* STATUT & ACTION */}
                    <div className="flex items-center gap-4 self-end md:self-center">
                      <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        booking.status === 'Confirmée' ? 'bg-green-100 text-green-600 border border-green-200' : 
                        booking.status === 'En attente' ? 'bg-blue-50 text-blue-600 border border-blue-100 animate-pulse' : 
                        'bg-red-50 text-red-500 border border-red-100'
                      }`}>
                        {booking.status}
                      </span>
                      <div className="p-3 bg-slate-50 rounded-xl text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  </div>

                  {booking.status === 'En attente' && (
                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2 text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                      <Info size={12} /> Cliquez pour voir les détails de votre demande
                    </div>
                  )}
                </motion.div>
              </Link>
            ))
          )}

          {/* EMPTY STATE */}
          {!loading && bookings.length === 0 && (
            <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Car className="text-slate-200" size={40} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase italic">Aucune réservation</h3>
              <p className="text-slate-400 font-medium text-sm mt-2 italic">Partez à l'aventure dès maintenant.</p>
              <Link href="/catalogue" className="mt-8 inline-block px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-slate-900 transition-all">
                 Explorer le catalogue
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}