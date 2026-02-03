"use client";
import { motion } from 'framer-motion';
import { Fuel, Gauge, MapPin, Star, ChevronRight } from 'lucide-react';

interface CarProps {
  name: string;
  image: string;
  price: number;
  location: string;
  transmission: string;
  fuel: string;
}

const CarCard = ({ name, image, price, location, transmission, fuel }: CarProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -10 }}
      viewport={{ once: true }}
      className="relative group bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden backdrop-blur-md transition-all hover:border-blue-500/50 hover:shadow-[0_20px_40px_rgba(37,99,235,0.15)]"
    >
      {/* Badge Prix Flottant */}
      <div className="absolute top-4 right-4 z-20 bg-blue-600/90 backdrop-blur-md text-white text-xs font-black px-4 py-2 rounded-xl shadow-xl">
        {price.toLocaleString()} FCFA <span className="text-[10px] font-normal opacity-80">/j</span>
      </div>

      {/* Image de la voiture */}
      <div className="relative h-56 w-full overflow-hidden">
        <img
          src={image} 
          alt={name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
      </div>

      {/* Contenu */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-xl font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">
            {name}
          </h3>
        </div>

        <div className="flex items-center gap-1.5 text-gray-400 text-sm mb-5">
          <MapPin size={14} className="text-orange-500" />
          <span className="font-medium">{location}</span>
        </div>

        {/* Specs techniques */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="flex items-center gap-2 p-2.5 bg-white/5 rounded-xl border border-white/5">
            <Gauge size={16} className="text-blue-500" />
            <span className="text-[11px] font-bold text-gray-300 uppercase">{transmission}</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 bg-white/5 rounded-xl border border-white/5">
            <Fuel size={16} className="text-orange-500" />
            <span className="text-[11px] font-bold text-gray-300 uppercase">{fuel}</span>
          </div>
        </div>

        {/* Bouton Action */}
        <button className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-black rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 group/btn active:scale-95">
          VOIR LES DÉTAILS
          <ChevronRight size={18} className="transition-transform group-hover/btn:translate-x-1" />
        </button>
      </div>
    </motion.div>
  );
};

export default CarCard;