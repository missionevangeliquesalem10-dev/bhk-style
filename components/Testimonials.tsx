"use client";
import React, { useEffect, useState } from 'react';
import { db } from '@/app/lib/firebase';
import { collection, query, where, limit, getDocs, orderBy } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

export default function Testimonials() {
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    const fetchTopReviews = async () => {
      const q = query(
        collection(db, "reviews"),
        where("rating", "==", 5), // On ne montre que le top
        orderBy("createdAt", "desc"),
        limit(3)
      );
      const snap = await getDocs(q);
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchTopReviews();
  }, []);

  if (reviews.length === 0) return null;

  return (
    <section className="py-24 bg-slate-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900">
            Ils ont voyagé avec <span className="text-blue-600">Wotro</span>
          </h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-4">
            Avis vérifiés de la communauté
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((rev, index) => (
            <motion.div
              key={rev.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative"
            >
              <Quote className="absolute top-6 right-8 text-blue-50 opacity-20" size={60} />
              
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill="#facc15" className="text-yellow-400" />
                ))}
              </div>

              <p className="text-slate-600 font-medium italic text-sm leading-relaxed mb-6">
                "{rev.comment}"
              </p>

              <div className="flex items-center gap-3 border-t border-slate-50 pt-6">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-xs">
                  {rev.tenantName?.[0]}
                </div>
                <div>
                  <p className="font-black text-[10px] uppercase text-slate-900 tracking-widest">
                    {rev.tenantName}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                    Client Vérifié
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}