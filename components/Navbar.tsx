"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Menu, X, User, Zap, CalendarDays, LayoutDashboard, ChevronDown, KeyRound, Wallet, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { auth, db } from '@/app/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthMenu, setShowAuthMenu] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserRole(docSnap.data().role);
        }
      } else {
        setUserRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Logique de redirection : Les vendeurs vont au dashboard, 
  // les clients vont vers leur profil (pour les docs)
  const accountLink = userRole === 'vendeur' ? "/dashboard" : "/profil";

  return (
    <nav className="fixed top-4 left-0 right-0 z-50 px-4 md:px-8">
      {/* BARRE PRINCIPALE */}
      <div className="max-w-7xl mx-auto backdrop-blur-xl bg-white/70 border border-gray-200 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] relative z-50">
        <div className="flex justify-between items-center p-4">
          
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
              <Car className="text-white" size={20} />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tighter italic">WOTRO</span>
          </Link>

          {/* Menu Desktop Central */}
          <div className="hidden md:flex items-center gap-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
            <Link href="/catalogue" className="hover:text-blue-600 transition-colors">Catalogue</Link>
            {user && (
              <Link href="/mes-locations" className="flex items-center gap-2 text-blue-600 font-black italic">
                <CalendarDays size={14} /> Mes Locations
              </Link>
            )}
            <Link href="/devenir-hote" className="text-orange-500 hover:text-orange-600 transition-all">Devenir Hôte</Link>
          </div>

          {/* Boutons Actions Desktop */}
          <div className="hidden md:flex items-center gap-4 relative">
            {user ? (
              <Link href={accountLink} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white text-[10px] font-black rounded-xl tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-blue-100">
                <LayoutDashboard size={14} /> {userRole === 'vendeur' ? 'ESPACE HÔTE' : 'MON PROFIL'}
              </Link>
            ) : (
              <div className="relative" onMouseEnter={() => setShowAuthMenu(true)} onMouseLeave={() => setShowAuthMenu(false)}>
                <button className="flex items-center gap-2 px-8 py-2.5 bg-orange-500 text-white font-black rounded-xl transition-all shadow-lg active:scale-95 text-[10px] tracking-widest uppercase">
                  <User size={14} /> Connexion <ChevronDown size={14} className={`transition-transform ${showAuthMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Desktop */}
                <AnimatePresence>
                  {showAuthMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-64 bg-white border border-gray-100 rounded-[2rem] shadow-2xl p-4 space-y-2"
                    >
                      <Link href="/inscription-client" className="flex items-center gap-4 p-4 hover:bg-blue-50 rounded-2xl group transition-all">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors"><KeyRound size={18} /></div>
                        <div>
                          <p className="text-[10px] font-black text-slate-900 uppercase">Je veux Louer</p>
                          <p className="text-[8px] text-gray-400 font-bold tracking-wider">Créer mon profil</p>
                        </div>
                      </Link>
                      <Link href="/devenir-hote" className="flex items-center gap-4 p-4 hover:bg-orange-50 rounded-2xl group transition-all">
                        <div className="p-2 bg-orange-100 text-orange-500 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition-colors"><Wallet size={18} /></div>
                        <div>
                          <p className="text-[10px] font-black text-slate-900 uppercase">Devenir Hôte</p>
                          <p className="text-[8px] text-gray-400 font-bold tracking-wider">Gagner de l'argent</p>
                        </div>
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Burger Mobile Toggle */}
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-slate-900 p-2 bg-gray-100 rounded-xl transition-colors hover:bg-gray-200">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* MENU MOBILE */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-20 left-4 right-4 p-8 rounded-[2.5rem] bg-white border border-gray-100 flex flex-col gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-40"
          >
            <Link href="/catalogue" onClick={() => setIsOpen(false)} className="text-xs font-black uppercase tracking-widest text-slate-900 border-b border-gray-50 pb-4 flex justify-between items-center italic">
              Explorer le catalogue <ChevronRight size={14} className="text-blue-600" />
            </Link>
            
            {user && (
              <Link href="/mes-locations" onClick={() => setIsOpen(false)} className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 p-5 rounded-2xl flex items-center gap-3">
                <CalendarDays size={20} /> Mes Locations
              </Link>
            )}

            <Link href="/devenir-hote" onClick={() => setIsOpen(false)} className="text-xs font-black uppercase tracking-widest text-orange-500 flex items-center gap-3 px-2">
                <Zap size={20} fill="currentColor" /> Devenir Hôte
            </Link>

            <div className="h-px bg-gray-100 my-2" />

            {user ? (
              <Link href={accountLink} onClick={() => setIsOpen(false)} className="w-full py-5 bg-blue-600 text-white text-center rounded-2xl font-black text-[10px] tracking-widest uppercase shadow-lg shadow-blue-100">
                Accéder à mon profil
              </Link>
            ) : (
              <div className="flex flex-col gap-3">
                <Link href="/inscription-client" onClick={() => setIsOpen(false)} className="w-full py-5 bg-slate-900 text-white text-center rounded-2xl font-black text-[10px] tracking-widest uppercase">
                  Je veux Louer
                </Link>
                <Link href="/devenir-hote" onClick={() => setIsOpen(false)} className="w-full py-5 bg-orange-500 text-white text-center rounded-2xl font-black text-[10px] tracking-widest uppercase shadow-lg shadow-orange-100">
                  Devenir Hôte
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;