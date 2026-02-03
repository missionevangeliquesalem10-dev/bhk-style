"use client";
import { useEffect, useState } from "react";
import { db } from "@/app/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { motion } from "framer-motion";
import { Users, Car, Wallet, TrendingUp, Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminStats() {
  const [data, setData] = useState({
    clients: 0,
    hosts: 0,
    totalCars: 0,
    totalRevenue: 0,
    recentBookings: [] as any[]
  });

  useEffect(() => {
    const fetchAllStats = async () => {
      const usersSnap = await getDocs(collection(db, "users"));
      const carsSnap = await getDocs(collection(db, "cars"));
      const bookingsSnap = await getDocs(collection(db, "bookings"));

      const users = usersSnap.docs.map(d => d.data());
      const bookings = bookingsSnap.docs.map(d => d.data());

      setData({
        clients: users.filter(u => u.role === "client").length,
        hosts: users.filter(u => u.role === "host" || u.role === "admin").length,
        totalCars: carsSnap.size,
        totalRevenue: bookings.filter(b => b.status === "Confirmée").reduce((acc, b) => acc + (b.totalPrice || 0), 0),
        recentBookings: bookings.slice(0, 5)
      });
    };
    fetchAllStats();
  }, []);

  return (
    <div className="min-h-screen bg-white pt-28 pb-20 px-6 max-w-7xl mx-auto">
      <Link href="/admin" className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest mb-10 hover:text-blue-600 transition-all">
        <ArrowLeft size={16} /> Retour Dashboard
      </Link>

      <h1 className="text-5xl font-black text-slate-900 uppercase italic tracking-tighter mb-12">
        Analyse <span className="text-blue-600">Performance</span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <StatCard title="Total Clients" value={data.clients} icon={<Users className="text-blue-600" />} />
        <StatCard title="Total Hôtes" value={data.hosts} icon={<TrendingUp className="text-green-500" />} />
        <StatCard title="Véhicules" value={data.totalCars} icon={<Car className="text-orange-500" />} />
        <StatCard title="Volume d'affaires" value={`${data.totalRevenue.toLocaleString()} F`} icon={<Wallet className="text-slate-900" />} />
      </div>

      <div className="bg-slate-50 rounded-[3rem] p-10 border border-slate-100">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-8">Flux de réservations récentes</h3>
        <div className="space-y-4">
          {data.recentBookings.map((b, i) => (
            <div key={i} className="flex items-center justify-between p-5 bg-white rounded-2xl shadow-sm">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-[10px]">W</div>
                  <div>
                    <p className="text-[11px] font-black uppercase text-slate-900">{b.carName}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter italic">Par: {b.tenantName}</p>
                  </div>
               </div>
               <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${b.status === 'Confirmée' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                 {b.status}
               </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: any) {
  return (
    <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all">
      <div className="flex justify-between items-center mb-4">{icon}</div>
      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{title}</p>
      <h2 className="text-3xl font-black italic tracking-tighter text-slate-900">{value}</h2>
    </div>
  );
}