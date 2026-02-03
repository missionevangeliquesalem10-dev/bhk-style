"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Car, ArrowRight, ShieldCheck, Zap, Star } from 'lucide-react';
import Link from 'next/link';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden bg-white">
      {/* Éléments de design en arrière-plan */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-50 rounded-full blur-[120px] opacity-60" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-orange-50 rounded-full blur-[120px] opacity-60" />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
        
        {/* TEXTE À GAUCHE */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-100">
            <Zap size={14} className="text-blue-600" fill="currentColor" />
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">N°1 de la location à Abidjan</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black text-slate-900 leading-[0.9] uppercase italic tracking-tighter">
            Roulez en <br />
            <span className="text-blue-600">Liberté.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-500 font-medium max-w-lg leading-relaxed">
            Accédez aux plus beaux véhicules d'Abidjan en quelques clics. 
            Simple, sécurisé et sans paperasse inutile.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link 
              href="/catalogue" 
              className="px-10 py-5 bg-blue-600 text-white font-black rounded-2xl shadow-2xl shadow-blue-200 hover:bg-slate-900 transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest group"
            >
              Trouver une voiture <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link 
              href="/devenir-hote" 
              className="px-10 py-5 bg-white text-slate-900 border border-gray-200 font-black rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest"
            >
              Devenir Hôte
            </Link>
          </div>

          {/* PETITES STATS / REASSURANCE */}
          <div className="flex items-center gap-8 pt-8 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-green-500" size={20} />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assurance <br /> incluse</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="text-orange-500" size={20} fill="currentColor" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">4.9/5 <br /> Avis clients</span>
            </div>
          </div>
        </motion.div>

        {/* IMAGE À DROITE */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative"
        >
          <div className="relative z-10 rounded-[4rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border-8 border-white">
            <img 
              src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800" 
              alt="Voiture de luxe Wotro" 
              className="w-full h-auto object-cover"
            />
          </div>
          
          {/* Badge flottant */}
          <motion.div 
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-10 -left-10 bg-white p-6 rounded-[2.5rem] shadow-2xl z-20 hidden md:block border border-gray-50"
          >
            <p className="text-[10px] font-black text-blue-600 uppercase mb-1">Disponible maintenant</p>
            <p className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">Porsche 911</p>
            <div className="mt-2 h-1 w-12 bg-orange-500 rounded-full" />
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
};

export default Hero;