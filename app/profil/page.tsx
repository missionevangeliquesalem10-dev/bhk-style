"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/app/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { motion } from "framer-motion";
import {
  User,
  UploadCloud,
  ShieldCheck,
  CreditCard,
  ChevronLeft,
  CheckCircle2,
  Loader2,
  LogOut,
} from "lucide-react";

export default function Profil() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const router = useRouter();

  // =============================
  // RÉCUPÉRATION PROFIL
  // =============================
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/inscription-client");
        return;
      }

      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setUserData({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.error("Erreur récupération utilisateur :", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [router]);

  // =============================
  // DÉCONNEXION
  // =============================
  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  // =============================
  // UPLOAD DOCUMENTS
  // =============================
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "permis" | "cni"
  ) => {
    const file = e.target.files?.[0];
    const user = auth.currentUser;

    if (!file || !user) return;

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      console.error("Variables Cloudinary manquantes");
      return;
    }

    setUploading(type);

    try {
      // 🔹 Upload Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      if (!data.secure_url) throw new Error("Upload Cloudinary échoué");

      // 🔹 Firestore
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        // ➕ CRÉATION (obligatoire pour tes rules)
        await setDoc(userRef, {
          createdAt: new Date().toISOString(), // OBLIGATOIRE
          role: "client",
          docs: {
            [type]: data.secure_url,
          },
          isVerified: "oui",
        });
      } else {
        // ✏️ UPDATE
        await updateDoc(userRef, {
          [`docs.${type}`]: data.secure_url,
          isVerified: "oui",
        });
      }

      // 🔹 Mise à jour UI
      setUserData((prev: any) => ({
        ...prev,
        isVerified: "oui",
        docs: { ...prev?.docs, [type]: data.secure_url },
      }));
    } catch (error) {
      console.error("Erreur upload :", error);
    } finally {
      setUploading(null);
    }
  };

  // =============================
  // LOADING
  // =============================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-black uppercase text-[10px] tracking-widest animate-pulse">
        Chargement Profil...
      </div>
    );
  }

  // =============================
  // UI
  // =============================
  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-32 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-4 bg-white rounded-2xl shadow-sm hover:bg-slate-100 transition"
          >
            <ChevronLeft size={20} />
          </button>

          <h1 className="text-xl font-black uppercase italic tracking-tighter">
            Mon Profil <span className="text-blue-600">Wotro</span>
          </h1>

          <div className="w-10" />
        </div>

        {/* CARTE PROFIL */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[3rem] shadow-xl flex flex-col items-center text-center"
        >
          <div className="w-24 h-24 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black mb-4">
            {userData?.fullName?.[0] || "U"}
          </div>

          <h2 className="text-2xl font-black uppercase italic">
            {userData?.fullName}
          </h2>

          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
            {userData?.email}
          </p>

          <div
            className={`mt-6 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
              userData?.isVerified === "oui"
                ? "bg-green-100 text-green-600"
                : "bg-orange-100 text-orange-600"
            }`}
          >
            <ShieldCheck size={14} />
            {userData?.isVerified === "oui"
              ? "Profil Vérifié"
              : "Vérification en cours"}
          </div>
        </motion.div>

        {/* DOCUMENTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DocumentCard
            title="Permis de Conduire"
            icon={<CreditCard size={20} />}
            status={userData?.docs?.permis}
            loading={uploading === "permis"}
            onChange={(e: any) => handleFileUpload(e, "permis")}
          />

          <DocumentCard
            title="Pièce d'identité (CNI)"
            icon={<User size={20} />}
            status={userData?.docs?.cni}
            loading={uploading === "cni"}
            onChange={(e: any) => handleFileUpload(e, "cni")}
          />
        </div>

        {/* LOGOUT */}
        <div className="pt-8 flex justify-center">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-10 py-5 bg-red-50 text-red-500 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition"
          >
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================
// COMPONENT DOCUMENT CARD
// =============================
function DocumentCard({ title, icon, status, loading, onChange }: any) {
  return (
    <div className="bg-white p-6 rounded-[2.5rem] border shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
          {icon}
        </div>
        <h3 className="text-[11px] font-black uppercase tracking-widest">
          {title}
        </h3>
      </div>

      <div className="relative h-40 bg-slate-50 rounded-3xl border-2 border-dashed flex items-center justify-center overflow-hidden group">
        {status ? (
          <>
            <img
              src={status}
              className="w-full h-full object-cover opacity-50"
              alt="Document"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60">
              <CheckCircle2 size={32} className="text-green-500 mb-2" />
              <span className="text-[9px] font-black uppercase text-green-600">
                Reçu
              </span>
            </div>
          </>
        ) : loading ? (
          <Loader2 size={24} className="animate-spin text-blue-600" />
        ) : (
          <>
            <UploadCloud size={24} className="text-slate-300" />
            <span className="text-[9px] font-black uppercase text-slate-400 mt-2">
              Uploader
            </span>
          </>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={onChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}
