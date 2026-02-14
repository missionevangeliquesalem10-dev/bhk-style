"use client";
import React from 'react';
import { Car, Instagram, Facebook, Twitter, Mail, MapPin, Phone, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-orange-600 pt-20 pb-10 px-6 rounded-t-[3rem] lg:rounded-t-[5rem] relative z-20">
      <div className="max-w-7xl mx-auto">
        
        {/* SECTION HAUTE : APPEL À L'ACTION */}
        <div className="flex flex-col lg:flex-row justify-between items-center mb-16 gap-8 border-b border-white/20 pb-16">
          <h2 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter text-center lg:text-left leading-none">
            Prêt à prendre <br /> la route avec nous ?
          </h2>
          <Link href="/catalogue" className="px-10 py-5 bg-white text-orange-600 font-black rounded-2xl shadow-xl hover:bg-slate-900 hover:text-white transition-all flex items-center gap-3 uppercase text-[10px] tracking-widest group">
            Explorer les offres <ArrowUpRight size={18} className="group-hover:rotate-45 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* LOGO & DESCRIPTION */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-white p-2 rounded-xl shadow-lg">
                <Car className="text-orange-600" size={20} />
              </div>
              <span className="text-2xl font-black text-white tracking-tighter italic">BHK_DRIVE</span>
            </Link>
            <p className="text-orange-50 font-medium text-sm leading-relaxed opacity-90">
              La première plateforme de location de voitures de luxe et de confort entre particuliers à Abidjan.
            </p>
            <div className="flex gap-3">
              {[Instagram, Facebook, Twitter].map((Icon, i) => (
                <a key={i} href="#" className="p-3 bg-white/10 rounded-xl text-white hover:bg-white hover:text-orange-600 transition-all border border-white/10">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* NAVIGATION RAPIDE */}
          <div className="text-white">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-8 opacity-70">Plateforme</h4>
            <ul className="space-y-4">
              <li><Link href="/catalogue" className="text-sm font-bold hover:translate-x-2 transition-transform inline-block">Explorer</Link></li>
              <li><Link href="/mes-locations" className="text-sm font-bold hover:translate-x-2 transition-transform inline-block">Mes Réservations</Link></li>
              <li><Link href="/devenir-hote" className="text-sm font-bold hover:translate-x-2 transition-transform inline-block">Devenir Hôte</Link></li>
            </ul>
          </div>

          {/* LÉGAL */}
          <div className="text-white">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-8 opacity-70">Légal</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="text-sm font-bold hover:opacity-100 opacity-80">Conditions Générales</Link></li>
              <li><Link href="#" className="text-sm font-bold hover:opacity-100 opacity-80">Assurance BHK_DRIVE</Link></li>
              <li><Link href="#" className="text-sm font-bold hover:opacity-100 opacity-80">Confidentialité</Link></li>
            </ul>
          </div>

          {/* CONTACT */}
          <div className="text-white">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-8 opacity-70">Contact</h4>
            <ul className="space-y-4 font-bold text-sm">
              <li className="flex items-center gap-3"><MapPin size={16} className="text-orange-200" /> Abidjan, Côte d'Ivoire</li>
              <li className="flex items-center gap-3"><Phone size={16} className="text-orange-200" /> +225 07 00 00 00 00</li>
              <li className="flex items-center gap-3"><Mail size={16} className="text-orange-200" /> info@bhk_drive.ci</li>
            </ul>
          </div>
        </div>

        {/* COPYRIGHT */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-center">
          <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">
            © 2026 BOLOU-HK TECHNOLOGIES.
          </p>
          <div className="flex gap-6 text-[9px] font-black text-white/60 uppercase tracking-widest">
            <span className="italic hover:text-white transition-colors cursor-pointer">Support 24/7</span>
            <span className="italic hover:text-white transition-colors cursor-pointer">Sécurité Garantie</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;