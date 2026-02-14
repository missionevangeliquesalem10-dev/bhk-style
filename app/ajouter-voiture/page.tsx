"use client";
import { useEffect, useState } from 'react';
import { auth, db } from '@/app/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CldUploadWidget } from 'next-cloudinary';
import { Car, MapPin, Fuel, Gauge, Image as ImageIcon, Check, ArrowLeft, Lock, Plus, Trash2, Layers } from 'lucide-react';

export default function AjouterVoiture() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [imageUrl, setImageUrl] = useState("");
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);

  // LISTE DES COMMUNES COMPLÈTE
  const communes = [
    "Abobo", "Adjamé", "Attécoubé", "Bingerville", "Cocody", "Koumassi", 
    "Marcory", "Plateau", "Port-Bouët", "Songon", "Treichville", "Yopougon", "Anyama"
  ];

  // LISTE DES CATÉGORIES MISE À JOUR
  const categories = [
    "Voiture de luxe", "Berline", "Suv/4x4", "Citadine", "Van/Minibus", "Pick-up", "Coupé / Sport", "Utilitaire"
  ];

  const [carData, setCarData] = useState({
    name: '',
    brand: '',
    price: '',
    location: 'Cocody',
    category: 'Berline', 
    exactAddress: '',
    transmission: 'Automatique',
    fuel: 'Essence',
    description: '',
  });

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (!user) router.push('/devenir-hote');
    });
    return () => unsub();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return alert("Veuillez ajouter la photo principale.");
    if (galleryUrls.length < 1) return alert("Ajoutez au moins une photo supplémentaire pour la galerie.");
    
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Vous devez être connecté.");

      // PUBLICATION AUTOMATIQUE DIRECTE
      await addDoc(collection(db, "cars"), {
        ...carData,
        price: Number(carData.price),
        image: imageUrl,
        gallery: galleryUrls,
        ownerId: user.uid,
        createdAt: new Date().toISOString(),
        isValidated: true,    // ✅ Activé par défaut pour affichage immédiat
        priorityScore: 5,     // ✅ Score pour le classement initial
        isAvailable: true 
      });

      router.push('/dashboard');
    } catch (error: any) {
      alert("Erreur : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryUrls(galleryUrls.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-white pt-28 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 font-black text-[10px] tracking-widest mb-8 hover:text-blue-600 transition-colors uppercase">
          <ArrowLeft size={16} /> Retour
        </button>

        <h1 className="text-4xl font-black text-slate-900 mb-2 uppercase italic tracking-tighter">
          Ajouter un <span className="text-blue-600">Véhicule</span>
        </h1>
        <p className="text-gray-500 mb-12 font-medium italic">L'annonce sera publiée instantanément sur Wotro.</p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* COLONNE IMAGES */}
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] text-blue-600 font-black uppercase tracking-widest block italic">Photo de couverture (Catalogue)</label>
              <CldUploadWidget 
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                onSuccess={(result: any) => setImageUrl(result.info.secure_url)}
              >
                {({ open }) => (
                  <div 
                    onClick={() => open()}
                    className="aspect-[16/9] w-full rounded-[2.5rem] border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-all overflow-hidden relative group"
                  >
                    {imageUrl ? (
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <ImageIcon size={32} className="mx-auto text-gray-300 mb-2" />
                        <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Photo principale</span>
                      </div>
                    )}
                  </div>
                )}
              </CldUploadWidget>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] text-slate-900 font-black uppercase tracking-widest block italic">Galerie détaillée ({galleryUrls.length}/4 photos)</label>
              <div className="grid grid-cols-2 gap-4">
                {galleryUrls.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-[1.5rem] overflow-hidden group border border-slate-100 shadow-sm">
                    <img src={url} className="w-full h-full object-cover" alt="" />
                    <button type="button" onClick={() => removeGalleryImage(index)} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                
                {galleryUrls.length < 4 && (
                  <CldUploadWidget 
                    uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                    onSuccess={(result: any) => setGalleryUrls([...galleryUrls, result.info.secure_url])}
                  >
                    {({ open }) => (
                      <div onClick={() => open()} className="aspect-square rounded-[1.5rem] border-2 border-dashed border-gray-200 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-blue-400 transition-all">
                        <Plus size={24} className="text-gray-300 mb-1" />
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Ajouter</span>
                      </div>
                    )}
                  </CldUploadWidget>
                )}
              </div>
            </div>

            <div className="p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100/50">
              <h4 className="text-blue-900 font-black text-[10px] uppercase mb-2 flex items-center gap-2">
                <Lock size={14} /> Publication Directe
              </h4>
              <p className="text-blue-700/60 text-[10px] leading-relaxed font-bold uppercase italic">
                Votre véhicule sera visible immédiatement avec le badge de confiance après la publication.
              </p>
            </div>
          </div>

          {/* COLONNE DÉTAILS */}
          <div className="space-y-5">
            <div className="space-y-4">
              <div className="bg-gray-50 p-5 rounded-[1.5rem] border border-gray-100">
                <label className="text-[9px] text-gray-400 font-black uppercase mb-1 block tracking-widest italic">Nom du modèle</label>
                <input 
                  type="text" placeholder="Ex: Mercedes Classe G 63 AMG"
                  className="bg-transparent w-full outline-none text-slate-900 font-bold"
                  onChange={(e) => setCarData({...carData, name: e.target.value})}
                  required
                />
              </div>

              <div className="bg-gray-50 p-5 rounded-[1.5rem] border border-gray-100">
                <label className="text-[9px] text-gray-400 font-black uppercase mb-1 block tracking-widest flex items-center gap-2 italic">
                  <Layers size={10} /> Catégorie de véhicule
                </label>
                <select 
                  className="bg-transparent w-full outline-none text-slate-900 font-bold appearance-none cursor-pointer"
                  onChange={(e) => setCarData({...carData, category: e.target.value})}
                  value={carData.category}
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-5 rounded-[1.5rem] border border-gray-100">
                  <label className="text-[9px] text-gray-400 font-black uppercase mb-1 block tracking-widest italic">Prix / Jour (FCFA)</label>
                  <input 
                    type="number" placeholder="80000"
                    className="bg-transparent w-full outline-none text-slate-900 font-bold"
                    onChange={(e) => setCarData({...carData, price: e.target.value})}
                    required
                  />
                </div>
                <div className="bg-gray-50 p-5 rounded-[1.5rem] border border-gray-100">
                  <label className="text-[9px] text-gray-400 font-black uppercase mb-1 block tracking-widest italic">Commune</label>
                  <select 
                    className="bg-transparent w-full outline-none text-slate-900 font-bold appearance-none cursor-pointer"
                    onChange={(e) => setCarData({...carData, location: e.target.value})}
                    value={carData.location}
                  >
                    {communes.map(commune => <option key={commune} value={commune}>{commune}</option>)}
                  </select>
                </div>
              </div>

              <div className="bg-slate-900 p-5 rounded-[1.5rem] border border-slate-800 shadow-xl shadow-slate-200">
                <label className="text-[9px] text-blue-400 font-black uppercase mb-1 block tracking-widest italic">Adresse précise (Privée)</label>
                <input 
                  type="text" placeholder="Ex: Riviera 3, Rue du Lycée Français"
                  className="bg-transparent w-full outline-none text-white font-bold"
                  onChange={(e) => setCarData({...carData, exactAddress: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-5 bg-gray-50 rounded-[1.5rem] border border-gray-100">
                  <Gauge size={18} className="text-blue-600" />
                  <select 
                    className="bg-transparent flex-1 outline-none text-slate-900 font-bold text-xs"
                    onChange={(e) => setCarData({...carData, transmission: e.target.value})}
                  >
                    <option>Automatique</option>
                    <option>Manuelle</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 p-5 bg-gray-50 rounded-[1.5rem] border border-gray-100">
                  <Fuel size={18} className="text-orange-500" />
                  <select 
                    className="bg-transparent flex-1 outline-none text-slate-900 font-bold text-xs"
                    onChange={(e) => setCarData({...carData, fuel: e.target.value})}
                  >
                    <option>Essence</option>
                    <option>Diesel</option>
                    <option>Hybride</option>
                  </select>
                </div>
              </div>

              <div className="bg-gray-50 p-5 rounded-[1.5rem] border border-gray-100">
                <label className="text-[9px] text-gray-400 font-black uppercase mb-1 block tracking-widest italic">Description libre</label>
                <textarea 
                  placeholder="Détails supplémentaires, options du véhicule..."
                  className="bg-transparent w-full outline-none text-slate-900 font-bold text-xs min-h-[80px] resize-none"
                  onChange={(e) => setCarData({...carData, description: e.target.value})}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-blue-600 text-white font-black rounded-[1.5rem] hover:bg-slate-900 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3 uppercase text-[10px] tracking-[0.2em] disabled:opacity-50 active:scale-95"
            >
              {loading ? "Publication..." : "Lancer l'annonce immédiatement"} <Check size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}