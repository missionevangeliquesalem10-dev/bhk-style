"use client";
import { useEffect, useState } from 'react';
import { auth, db } from '@/app/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CldUploadWidget } from 'next-cloudinary';
import {
  Car,
  MapPin,
  Fuel,
  Gauge,
  Image as ImageIcon,
  Check,
  ArrowLeft,
  Lock,
  Plus,
  Trash2,
  Layers
} from 'lucide-react';

export default function AjouterVoiture() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [imageUrl, setImageUrl] = useState("");
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);

  const communes = [
    "Abobo", "Adjamé", "Attécoubé", "Bingerville", "Cocody", "Koumassi",
    "Marcory", "Plateau", "Port-Bouët", "Songon", "Treichville", "Yopougon", "Anyama"
  ];

  const categories = [
    "Voiture de luxe", "Berline", "Suv/4x4", "Citadine",
    "Van/Minibus", "Pick-up", "Coupé / Sport", "Utilitaire"
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
    if (galleryUrls.length < 5) {
      return alert("Veuillez ajouter au minimum 5 photos pour la galerie.");
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Vous devez être connecté.");

      await addDoc(collection(db, "cars"), {
        ...carData,
        price: Number(carData.price),
        image: imageUrl,
        gallery: galleryUrls,
        ownerId: user.uid,
        createdAt: new Date().toISOString(),
        isValidated: true,
        priorityScore: 5,
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
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 font-black text-[10px] tracking-widest mb-8 hover:text-blue-600 transition-colors uppercase"
        >
          <ArrowLeft size={16} /> Retour
        </button>

        <h1 className="text-4xl font-black text-slate-900 mb-2 uppercase italic tracking-tighter">
          Ajouter un <span className="text-blue-600">Véhicule</span>
        </h1>
        <p className="text-gray-500 mb-12 font-medium italic">
          L'annonce sera publiée instantanément sur Wotro.
        </p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-16">

          {/* COLONNE IMAGES */}
          <div className="space-y-8">

            {/* IMAGE PRINCIPALE */}
            <div className="space-y-3">
              <label className="text-[10px] text-blue-600 font-black uppercase tracking-widest block italic">
                Photo de couverture (Catalogue)
              </label>
              <CldUploadWidget
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                onSuccess={(result: any) => setImageUrl(result.info.secure_url)}
              >
                {({ open }) => (
                  <div
                    onClick={() => open()}
                    className="aspect-[16/9] w-full rounded-[2.5rem] border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center cursor-pointer overflow-hidden"
                  >
                    {imageUrl ? (
                      <img src={imageUrl} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={32} className="text-gray-300" />
                    )}
                  </div>
                )}
              </CldUploadWidget>
            </div>

            {/* GALERIE */}
            <div className="space-y-3">
              <label className="text-[10px] text-slate-900 font-black uppercase tracking-widest italic block">
                Galerie détaillée
              </label>

              {/* COMPTEUR VISUEL */}
              <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                <span className={galleryUrls.length < 5 ? "text-red-500" : "text-green-600"}>
                  {galleryUrls.length}/5 photos minimum
                </span>

                {galleryUrls.length >= 5 && (
                  <motion.span
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-1 text-green-600"
                  >
                    <Check size={12} /> Galerie complète
                  </motion.span>
                )}
              </div>

              {/* GRILLE */}
              <motion.div layout className="grid grid-cols-2 gap-4">
                {galleryUrls.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-[1.5rem] overflow-hidden group border">
                    <img src={url} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(index)}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}

                {galleryUrls.length < 10 && (
                  <CldUploadWidget
                    uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                    onSuccess={(result: any) =>
                      setGalleryUrls([...galleryUrls, result.info.secure_url])
                    }
                  >
                    {({ open }) => (
                      <div
                        onClick={() => open()}
                        className="aspect-square rounded-[1.5rem] border-2 border-dashed border-gray-200 bg-slate-50 flex items-center justify-center cursor-pointer"
                      >
                        <Plus size={22} className="text-gray-300" />
                      </div>
                    )}
                  </CldUploadWidget>
                )}
              </motion.div>

              {galleryUrls.length < 5 && (
                <p className="text-[9px] text-red-500 font-bold uppercase">
                  Ajoutez encore {5 - galleryUrls.length} photo(s)
                </p>
              )}
            </div>
          </div>

          {/* COLONNE DÉTAILS */}
          <div className="space-y-5">
            <div className="bg-gray-50 p-5 rounded-[1.5rem] border">
              <input
                placeholder="Nom du véhicule"
                className="bg-transparent w-full outline-none font-bold"
                onChange={(e) => setCarData({ ...carData, name: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || galleryUrls.length < 5}
              className="w-full py-5 bg-blue-600 text-white font-black rounded-[1.5rem]
              uppercase tracking-[0.2em] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Publication..." : "Lancer l'annonce immédiatement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
