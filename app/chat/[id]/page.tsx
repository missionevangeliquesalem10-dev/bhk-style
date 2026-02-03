"use client";
import { useEffect, useState, useRef } from 'react';
import { db, auth } from '@/app/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, where } from 'firebase/firestore';
import { CldUploadWidget } from 'next-cloudinary';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, MapPin, Mic, Square, Image as ImageIcon, 
  Play, ArrowLeft, Smile, Check, CheckCheck 
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

export default function ChatRoom() {
  const { id } = useParams();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Charger les messages et scroller en bas
  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, "chats", id as string, "messages"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsubscribe();
  }, [id]);

  // 2. Système de "Vu" (Marquer les messages de l'autre comme lus)
  useEffect(() => {
    if (!id || !auth.currentUser) return;
    const q = query(
      collection(db, "chats", id as string, "messages"),
      where("senderId", "!=", auth.currentUser.uid),
      where("read", "==", false)
    );
    const unsub = onSnapshot(q, (snap) => {
      snap.docs.forEach((d) => {
        updateDoc(doc(db, "chats", id as string, "messages", d.id), { read: true });
      });
    });
    return () => unsub();
  }, [id]);

  // 3. Envoi de texte
  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !auth.currentUser) return;

    await addDoc(collection(db, "chats", id as string, "messages"), {
      type: "text",
      text: newMessage,
      senderId: auth.currentUser.uid,
      read: false,
      createdAt: new Date().toISOString()
    });
    setNewMessage("");
    setShowEmoji(false);
  };

  // 4. Envoi de la position GPS
  const sendLocation = () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const url = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
      await addDoc(collection(db, "chats", id as string, "messages"), {
        type: "location",
        text: "📍 Ma position actuelle",
        fileUrl: url,
        senderId: auth.currentUser?.uid,
        read: false,
        createdAt: new Date().toISOString()
      });
    });
  };

  // 5. Logique Audio Cloudinary
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: any[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      uploadToCloudinary(blob, "video");
    };
    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
  };

  const uploadToCloudinary = async (file: any, type: "image" | "video") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
    
    const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${type}/upload`, {
      method: "POST",
      body: formData
    });
    const data = await res.json();

    await addDoc(collection(db, "chats", id as string, "messages"), {
      type: type === "image" ? "image" : "audio",
      fileUrl: data.secure_url,
      senderId: auth.currentUser?.uid,
      read: false,
      createdAt: new Date().toISOString()
    });
  };

  return (
    <div className="flex flex-col h-screen bg-white fixed inset-0 z-[100]">
      {/* HEADER */}
      <div className="p-4 border-b flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-50 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-xs">W</div>
          <h2 className="font-black text-xs uppercase tracking-widest text-slate-900">Discussion Wotro</h2>
        </div>
      </div>

      {/* ZONE MESSAGES */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.senderId === auth.currentUser?.uid ? 'justify-end' : 'justify-start'}`}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className={`p-4 rounded-[2rem] shadow-sm max-w-[85%] ${
                msg.senderId === auth.currentUser?.uid ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-900 rounded-tl-none border border-slate-100'
              }`}
            >
              {msg.type === "text" && <p className="text-sm font-bold">{msg.text}</p>}
              
              {msg.type === "image" && (
                <img src={msg.fileUrl} className="rounded-2xl max-h-60 w-full object-cover" alt="img" onClick={() => window.open(msg.fileUrl)} />
              )}

              {msg.type === "location" && (
                <a href={msg.fileUrl} target="_blank" className="flex items-center gap-2 text-[10px] font-black uppercase underline">
                  <MapPin size={14} /> {msg.text}
                </a>
              )}

              {msg.type === "audio" && (
                <div className="flex items-center gap-3 min-w-[150px]">
                   <button onClick={() => new Audio(msg.fileUrl).play()} className={`p-2 rounded-full ${msg.senderId === auth.currentUser?.uid ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>
                      <Play size={14} fill="currentColor" />
                   </button>
                   <div className="h-1 flex-1 bg-current opacity-20 rounded-full" />
                </div>
              )}

              {/* STATUS & TIME */}
              <div className="flex justify-end items-center gap-1 mt-1 opacity-60">
                <span className="text-[8px] font-black uppercase">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.senderId === auth.currentUser?.uid && (
                  msg.read ? <CheckCheck size={12} className="text-blue-200" /> : <Check size={12} />
                )}
              </div>
            </motion.div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* EMOJI PICKER */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="absolute bottom-24 left-6 z-50">
            <Picker data={data} onEmojiSelect={(e: any) => setNewMessage(p => p + e.native)} theme="light" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* INPUT BAR */}
      <div className="p-4 border-t bg-white pb-8">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          <button onClick={() => setShowEmoji(!showEmoji)} className="p-2 text-slate-400 hover:text-yellow-500 transition-colors"><Smile /></button>
          
          <CldUploadWidget 
            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
            onSuccess={(res: any) => uploadToCloudinary(res.info.secure_url, "image")}
          >
            {({ open }) => <button onClick={() => open()} className="p-2 text-slate-400"><ImageIcon /></button>}
          </CldUploadWidget>

          <button onClick={sendLocation} className="p-2 text-slate-400"><MapPin /></button>

          <input 
            value={newMessage} 
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 bg-slate-50 rounded-full px-6 py-3 text-sm font-bold outline-none border border-slate-100 focus:border-blue-200"
            placeholder={isRecording ? "Enregistrement..." : "Message..."}
          />

          <button 
            onClick={isRecording ? () => mediaRecorder?.stop() : startRecording}
            className={`p-3 rounded-full transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 bg-slate-50'}`}
          >
            {isRecording ? <Square size={20} /> : <Mic size={20} />}
          </button>

          <button onClick={() => sendMessage()} className="p-4 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-100 active:scale-90 transition-all">
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}