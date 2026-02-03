"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/app/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  deleteDoc,
  orderBy
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car,
  Settings,
  LogOut,
  LayoutDashboard,
  Plus,
  ChevronRight,
  Mail,
  MessageSquare,
  Power,
  Trash2,
  Edit3,
  MapPin,
  Wallet,
  TrendingUp,
  Star,
  FileText
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ChatFloating from "@/components/ChatFloating";
import { toast, Toaster } from "react-hot-toast";

export default function Dashboard() {
  const [userData, setUserData] = useState<any>(null);
  const [cars, setCars] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // STATS FINANCIÈRES
  const [stats, setStats] = useState({
    totalEarnings: 0,
    activeRentals: 0,
    pendingRequests: 0
  });

  const [view, setView] = useState<"dashboard" | "messages">("dashboard");
  const [showChat, setShowChat] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string>("");
  const [selectedChatInfo, setSelectedChatInfo] = useState<any>(null);

  const router = useRouter();

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/devenir-hote");
        return;
      }

      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (userSnap.exists()) setUserData(userSnap.data());

      // Écoute des voitures
      const qCars = query(collection(db, "cars"), where("ownerId", "==", user.uid));
      const unsubCars = onSnapshot(qCars, (snap) => {
        setCars(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      });

      // Écoute des réservations + Calcul des Revenus
      const qBookings = query(collection(db, "bookings"), where("ownerId", "==", user.uid));
      const unsubBookings = onSnapshot(qBookings, (snap) => {
        // CORRECTION ICI : Ajout de (d.data() as any) pour le champ 'status'
        const bookingsData = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setBookings(bookingsData);

        // LOGIQUE FINANCIÈRE : On calcule uniquement les réservations "Confirmées"
        const confirmed = bookingsData.filter(b => b.status === "Confirmée");
        const total = confirmed.reduce((acc, curr) => acc + (Number(curr.totalPrice) || 0), 0);
        
        setStats({
          totalEarnings: total,
          activeRentals: confirmed.length,
          pendingRequests: bookingsData.filter(b => b.status === "En attente").length
        });

        snap.docChanges().forEach((change) => {
          if (change.type === "added" && !loading) {
            const data = change.doc.data() as any; // CORRECTION ICI
            if (data.status === "En attente") {
              toast.success(`Nouvelle demande : ${data.carName}`, { icon: '🚗' });
            }
          }
        });
      });

      // Écoute des messages
      const qChats = query(
        collection(db, "chats"),
        where("participants", "array-contains", user.uid),
        orderBy("updatedAt", "desc")
      );
      const unsubChats = onSnapshot(qChats, (snap) => {
        setChats(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
        setLoading(false);
      });

      return () => { unsubCars(); unsubBookings(); unsubChats(); };
    });

    return () => unsubAuth();
  }, [router, loading]);

  /* ======================
      LOGIQUE PDF CONTRAT
  ======================= */
  const generateOwnerPDF = (booking: any) => {
    const docHTML = `
      <html>
        <head>
          <title>WOTRO_CONTRAT_${booking.id.slice(0,5)}</title>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 50px; color: #0f172a; line-height: 1.5; }
            .header { border-bottom: 5px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .logo { font-size: 32px; font-weight: 900; font-style: italic; color: #2563eb; letter-spacing: -2px; }
            .title { text-transform: uppercase; font-size: 18px; font-weight: 900; text-align: right; }
            .section { margin-bottom: 25px; padding: 20px; border-radius: 20px; border: 1px solid #e2e8f0; background: #f8fafc; }
            .label { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #64748b; margin-bottom: 5px; letter-spacing: 1px; }
            .value { font-size: 14px; font-weight: 700; color: #1e293b; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .footer { margin-top: 50px; font-size: 9px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            .stamp { border: 3px solid #2563eb; color: #2563eb; padding: 10px; display: inline-block; font-weight: 900; transform: rotate(-5deg); border-radius: 10px; opacity: 0.8; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">WOTRO.</div>
            <div class="title">Contrat de Mise à Disposition<br/><span style="color:#2563eb">#${booking.id.slice(0,8)}</span></div>
          </div>

          <div class="stamp">VALIDE / CONFIRMÉ</div>

          <div class="section" style="margin-top: 20px;">
            <p class="label">Véhicule loué</p>
            <p class="value" style="font-size: 20px;">${booking.carName}</p>
          </div>

          <div class="grid">
            <div class="section">
              <p class="label">Locataire (Client)</p>
              <p class="value">${booking.tenantName}</p>
            </div>
            <div class="section">
              <p class="label">Propriétaire (Hôte)</p>
              <p class="value">${userData?.fullName}</p>
            </div>
          </div>

          <div class="grid">
            <div class="section">
              <p class="label">Début de location</p>
              <p class="value">${booking.startDate}</p>
            </div>
            <div class="section">
              <p class="label">Fin de location</p>
              <p class="value">${booking.endDate}</p>
            </div>
          </div>

          <div class="section">
            <p class="label">Lieu de retrait & retour</p>
            <p class="value">${booking.exactAddress}</p>
          </div>

          <div class="section" style="background: #2563eb; color: white;">
            <p class="label" style="color: #bfdbfe;">Montant total de la transaction</p>
            <p class="value" style="font-size: 24px; color: white;">${booking.totalPrice.toLocaleString()} FCFA</p>
          </div>

          <div class="footer">
            Document généré numériquement par Wotro. Ce contrat engage le locataire à respecter le code de la route et les conditions d'utilisation du véhicule. L'hôte doit vérifier la pièce d'identité et le permis original avant la remise des clés.
          </div>
        </body>
      </html>
    `;

    const win = window.open("", "_blank");
    win?.document.write(docHTML);
    win?.document.close();
    setTimeout(() => win?.print(), 500);
  };

  /* ======================
      LOGIQUE DE GESTION
  ======================= */
  
  const updateBookingStatus = async (bookingId: string, status: string, carId: string) => {
    try {
      await updateDoc(doc(db, "bookings", bookingId), { status, updatedAt: new Date() });
      if (status === "Confirmée") {
        await updateDoc(doc(db, "cars", carId), { isAvailable: false });
        toast.success("Réservation confirmée !");
      }
    } catch (e) { toast.error("Erreur statut"); }
  };

  const toggleCarAvailability = async (carId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "cars", carId), { isAvailable: !currentStatus });
      toast.success(currentStatus ? "Véhicule désactivé" : "Véhicule en ligne");
    } catch (e) { toast.error("Erreur de mise à jour"); }
  };

  const handleDeleteCar = async (carId: string, carName: string) => {
    if (window.confirm(`Supprimer définitivement la ${carName} ?`)) {
      try {
        await deleteDoc(doc(db, "cars", carId));
        toast.success("Annonce supprimée");
      } catch (e) { toast.error("Erreur lors de la suppression"); }
    }
  };

  const handleEditAddress = async (carId: string, currentAddress: string) => {
    const newAddr = window.prompt("Nouvelle adresse précise de retrait :", currentAddress);
    if (newAddr !== null && newAddr !== currentAddress) {
      try {
        await updateDoc(doc(db, "cars", carId), { exactAddress: newAddr });
        toast.success("Adresse mise à jour");
      } catch (e) { toast.error("Erreur"); }
    }
  };

  const openChat = (chat: any) => {
    setActiveChatId(chat.id);
    setSelectedChatInfo({
      carName: chat.carName,
      carImage: chat.carImage,
      ownerId: chat.ownerId,
      tenantId: chat.tenantId
    });
    setShowChat(true);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-blue-600 font-black animate-pulse text-xs tracking-widest uppercase">Initialisation Wotro...</div>;

  return (
    <div className="min-h-screen bg-white pt-28 pb-20 px-6 max-w-7xl mx-auto">
      <Toaster position="top-right" />
      <div className="flex flex-col lg:flex-row gap-8">

        {/* SIDEBAR */}
        <aside className="w-full lg:w-72">
          <div className="sticky top-28 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">
                {userData?.fullName?.[0]}
              </div>
              <div>
                <p className="text-[10px] uppercase text-blue-600 font-black tracking-widest leading-none mb-1">Hôte</p>
                <h2 className="font-black text-slate-900 truncate w-32 leading-none">{userData?.fullName}</h2>
              </div>
            </div>

            <nav className="space-y-2">
              <button onClick={() => setView("dashboard")} className={`w-full flex gap-3 p-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all relative ${view === 'dashboard' ? 'bg-slate-900 text-white shadow-xl' : 'hover:bg-blue-100 text-slate-600'}`}>
                <LayoutDashboard size={18} /> Dashboard
                {stats.pendingRequests > 0 && <span className="absolute top-4 right-4 w-5 h-5 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center animate-bounce border-2 border-white">{stats.pendingRequests}</span>}
              </button>
              <button onClick={() => setView("messages")} className={`w-full flex gap-3 p-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all relative ${view === 'messages' ? 'bg-slate-900 text-white shadow-xl' : 'hover:bg-blue-100 text-slate-600'}`}>
                <Mail size={18} /> Messages
                {chats.length > 0 && <span className="absolute top-4 right-4 w-2 h-2 bg-orange-500 rounded-full border-2 border-white" />}
              </button>
              <Link href="/ajouter-voiture" className="w-full flex gap-3 p-4 hover:bg-blue-100 rounded-2xl text-xs font-bold uppercase tracking-widest text-slate-600">
                <Plus size={18} /> Ajouter voiture
              </Link>
              <div className="pt-10">
                <button onClick={() => auth.signOut()} className="w-full flex gap-3 p-4 bg-red-50 text-red-500 rounded-2xl font-black text-xs uppercase tracking-widest">
                  <LogOut size={18} /> Déconnexion
                </button>
              </div>
            </nav>
          </div>
        </aside>

        {/* MAIN */}
        <main className="flex-1 space-y-8">
          {view === "dashboard" ? (
            <>
              {/* SECTION REVENUS BENTO */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl shadow-slate-200">
                   <div className="flex justify-between items-start mb-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Gains Totaux</p>
                      <Wallet size={18} className="text-blue-500" />
                   </div>
                   <h2 className="text-3xl font-black italic tracking-tighter leading-none">
                     {stats.totalEarnings.toLocaleString()} <span className="text-xs text-blue-500 font-black">FCFA</span>
                   </h2>
                   <div className="flex justify-between items-center mt-4">
                      <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Paiements confirmés</p>
                      <button onClick={() => toast.success("Demande de retrait envoyée")} className="bg-blue-600 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase active:scale-90 transition-transform">Retirer</button>
                   </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                   <div className="flex justify-between items-start mb-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Locations Actives</p>
                      <TrendingUp size={18} className="text-green-500" />
                   </div>
                   <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter leading-none">
                     {stats.activeRentals} <span className="text-xs text-slate-400 font-black uppercase">Voyages</span>
                   </h2>
                   <p className="text-[9px] font-bold text-green-500 mt-4 uppercase tracking-widest">En cours de route</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                   <div className="flex justify-between items-start mb-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Score de Confiance</p>
                      <Star size={18} className="text-orange-400" fill="currentColor" />
                   </div>
                   <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter leading-none">
                     {userData?.priorityScore || 0} <span className="text-xs text-slate-400 font-black uppercase">Points</span>
                   </h2>
                   <p className="text-[9px] font-bold text-orange-400 mt-4 uppercase tracking-widest">Visibilité catalogue</p>
                </motion.div>
              </div>

              {/* HISTORIQUE DES GAINS ET CONTRATS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* RÉSERVATIONS EN ATTENTE */}
                <div className="p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
                  <h3 className="text-[10px] font-black uppercase mb-6 tracking-widest text-gray-400">Demandes de location</h3>
                  <div className="space-y-4">
                    {bookings.filter(b => b.status === "En attente").map((b) => (
                      <div key={b.id} className="p-4 bg-blue-50/50 rounded-2xl border border-blue-50">
                        <div className="flex justify-between items-center mb-3 text-[11px] font-black uppercase">
                          <p className="text-blue-900">{b.carName}</p>
                          <p className="text-blue-600">{b.totalPrice} FCFA</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => updateBookingStatus(b.id, "Confirmée", b.carId)} className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-[9px] font-black uppercase shadow-md transition-transform active:scale-95">Accepter</button>
                          <button onClick={() => updateBookingStatus(b.id, "Refusée", b.carId)} className="flex-1 bg-white text-red-500 border border-red-100 py-2 rounded-xl text-[9px] font-black uppercase active:scale-95">Refuser</button>
                        </div>
                      </div>
                    ))}
                    {bookings.filter(b => b.status === "En attente").length === 0 && <p className="text-center py-6 text-[10px] font-bold text-gray-300 uppercase italic">Aucune demande en attente</p>}
                  </div>
                </div>

                {/* HISTORIQUE DES TRANSACTIONS / CONTRATS */}
                <div className="p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
                  <h3 className="text-[10px] font-black uppercase mb-6 tracking-widest text-gray-400">Historique des Gains & Contrats</h3>
                  <div className="space-y-4">
                    {bookings.filter(b => b.status === "Confirmée").length > 0 ? (
                      bookings.filter(b => b.status === "Confirmée").map((b) => (
                        <div key={b.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-blue-50 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm font-black text-xs italic">W</div>
                            <div>
                              <p className="text-[10px] font-black text-slate-900 uppercase italic leading-none">{b.carName}</p>
                              <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">Client: {b.tenantName}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <p className="text-[11px] font-black text-slate-900">+{b.totalPrice.toLocaleString()} F</p>
                            <button 
                              onClick={() => generateOwnerPDF(b)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-blue-600 transition-colors"
                            >
                              <FileText size={10} /> Contrat
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-6 text-[10px] font-bold text-gray-300 uppercase italic">Aucun revenu pour le moment</p>
                    )}
                  </div>
                </div>
              </div>

              {/* MON GARAGE GESTION */}
              <div className="p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
                <h3 className="text-[10px] font-black uppercase mb-6 tracking-widest text-gray-400">Mon Garage (Actions)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cars.map((car) => (
                    <div key={car.id} className="p-5 bg-slate-50 rounded-[2rem] border border-transparent hover:border-blue-50 transition-all">
                      <div className="flex items-center gap-4 mb-4">
                        <img src={car.image} className="w-14 h-14 rounded-2xl object-cover shadow-sm" />
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-[10px] uppercase text-blue-900 truncate">{car.name}</p>
                          <p className="text-[8px] text-slate-400 uppercase font-bold flex items-center gap-1 mt-1 truncate">
                            <MapPin size={10} /> {car.exactAddress || car.location}
                          </p>
                        </div>
                        <button onClick={() => handleDeleteCar(car.id, car.name)} className="p-2 text-red-300 hover:text-red-500 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => toggleCarAvailability(car.id, car.isAvailable !== false)}
                          className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2 ${car.isAvailable !== false ? 'bg-white text-slate-900 border border-slate-200 shadow-sm' : 'bg-green-600 text-white shadow-lg shadow-green-100'}`}
                        >
                          <Power size={14} /> {car.isAvailable !== false ? "Désactiver" : "Activer"}
                        </button>
                        <button 
                          onClick={() => handleEditAddress(car.id, car.exactAddress)}
                          className="py-3 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-slate-900 transition-all shadow-lg shadow-blue-100"
                        >
                          <Edit3 size={14} /> Adresse
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* SECTION MESSAGERIE */
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[3rem] border border-gray-100 shadow-xl overflow-hidden min-h-[600px] flex">
              <div className="w-full md:w-80 border-r bg-slate-50/50 overflow-y-auto">
                <div className="p-6 border-b bg-white"><h2 className="text-xs font-black uppercase tracking-widest text-blue-900">Boîte de réception</h2></div>
                {chats.map((chat) => (
                  <button key={chat.id} onClick={() => openChat(chat)} className={`w-full p-5 flex gap-4 border-b transition-all text-left ${activeChatId === chat.id ? 'bg-white border-l-4 border-l-blue-600 shadow-inner' : 'hover:bg-white/80'}`}>
                    <img src={chat.carImage} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                    <div className="min-w-0">
                      <h4 className="font-black text-[11px] uppercase truncate text-slate-800">{chat.carName}</h4>
                      <p className="text-[10px] text-slate-400 truncate mt-1 italic">"{chat.lastMessage}"</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="hidden md:flex flex-1 flex-col items-center justify-center p-12 bg-white text-center">
                <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mb-4 text-blue-600 shadow-inner"><MessageSquare size={32} /></div>
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 italic">Messagerie Wotro</h3>
                <p className="text-[10px] text-slate-300 mt-2">Cliquez sur une discussion pour répondre.</p>
              </div>
            </motion.div>
          )}
        </main>
      </div>

      <AnimatePresence>
        {showChat && (
          <ChatFloating
            chatId={activeChatId}
            carInfo={selectedChatInfo}
            onClose={() => setShowChat(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}