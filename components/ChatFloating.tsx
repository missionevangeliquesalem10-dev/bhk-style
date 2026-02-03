"use client";

import React, { useState, useEffect, useRef } from "react";
import { db, auth } from "@/app/lib/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
  where
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, X, User, MessageCircle, Minus, MapPin, 
  Mic, Square, Image as ImageIcon, Smile, Check, CheckCheck 
} from "lucide-react";
import { CldUploadWidget } from 'next-cloudinary';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

export default function ChatFloating({ chatId, carInfo, onClose }: any) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [open, setOpen] = useState(true);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 🔄 Messages temps réel + Double Check
  useEffect(() => {
    if (!chatId) return;

    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    // Marquer comme lu
    const qUnread = query(
      collection(db, "chats", chatId, "messages"),
      where("senderId", "!=", auth.currentUser?.uid),
      where("read", "==", false)
    );
    const unsubRead = onSnapshot(qUnread, (snap) => {
      snap.docs.forEach(d => updateDoc(doc(db, "chats", chatId, "messages", d.id), { read: true }));
    });

    return () => { unsub(); unsubRead(); };
  }, [chatId]);

  // ✍️ Gestion Typing
  const handleTyping = async (text: string) => {
    setNewMessage(text);
    if (!chatId || !auth.currentUser) return;
    const typingDoc = doc(db, "chats", chatId, "typing", "status");
    await setDoc(typingDoc, { isTyping: text.length > 0, userId: auth.currentUser.uid }, { merge: true });
  };

  // ✉️ Envoi message
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !auth.currentUser) return;

    const text = newMessage;
    setNewMessage("");
    setShowEmoji(false);

    await addDoc(collection(db, "chats", chatId, "messages"), {
      type: "text",
      text,
      senderId: auth.currentUser.uid,
      read: false,
      createdAt: new Date().toISOString(),
    });

    await updateDoc(doc(db, "chats", chatId), {
      lastMessage: text,
      updatedAt: new Date().toISOString(),
    });
  };

  // 📍 Envoi Position
  const sendLocation = () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const url = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
      await addDoc(collection(db, "chats", chatId, "messages"), {
        type: "location",
        text: "📍 Ma position actuelle",
        fileUrl: url,
        senderId: auth.currentUser?.uid,
        read: false,
        createdAt: new Date().toISOString()
      });
    });
  };

  // 🎤 Logique Audio Cloudinary
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: any[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      uploadMedia(blob, "video");
    };
    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
  };

  const uploadMedia = async (file: any, type: "image" | "video") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${type}/upload`, {
      method: "POST", body: formData
    });
    const data = await res.json();
    await addDoc(collection(db, "chats", chatId, "messages"), {
      type: type === "image" ? "image" : "audio",
      fileUrl: data.secure_url,
      senderId: auth.currentUser?.uid,
      read: false,
      createdAt: new Date().toISOString()
    });
  };

  if (!open) {
    return (
      <motion.button
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 z-[999] w-16 h-16 rounded-full bg-blue-600 text-white shadow-2xl flex items-center justify-center border-4 border-white"
        onClick={() => setOpen(true)}
      >
        <MessageCircle size={28} />
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        drag dragMomentum={false}
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-0 right-0 md:bottom-6 md:right-6 z-[999] w-full md:w-[380px] h-[100dvh] md:h-[550px] bg-white md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-gray-100"
      >
        {/* HEADER */}
        <div className="cursor-grab active:cursor-grabbing p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-blue-600 flex items-center justify-center font-black">
              {carInfo?.ownerPhoto ? <img src={carInfo.ownerPhoto} className="w-full h-full object-cover" /> : <User size={20}/>}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase italic leading-none">{carInfo?.carName || "Hôte Wotro"}</p>
              <p className="text-[8px] uppercase tracking-widest text-blue-400 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> En ligne
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setOpen(false)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20"><Minus size={16} /></button>
            <button onClick={onClose} className="p-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500 hover:text-white"><X size={16} /></button>
          </div>
        </div>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.senderId === auth.currentUser?.uid ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-4 py-3 rounded-[1.5rem] text-xs font-bold shadow-sm ${
                msg.senderId === auth.currentUser?.uid ? "bg-blue-600 text-white rounded-tr-none" : "bg-white border rounded-tl-none"
              }`}>
                {msg.type === "image" && <img src={msg.fileUrl} className="rounded-lg mb-1" />}
                {msg.type === "audio" && <div className="flex items-center gap-2"><Mic size={12}/> Vocal</div>}
                {msg.type === "location" && <a href={msg.fileUrl} target="_blank" className="underline flex items-center gap-1"><MapPin size={12}/> Position</a>}
                <p>{msg.text}</p>
                <div className="flex justify-end items-center gap-1 mt-1 opacity-50 text-[8px]">
                  {msg.senderId === auth.currentUser?.uid && (msg.read ? <CheckCheck size={10} className="text-blue-200" /> : <Check size={10} />)}
                </div>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        {/* EMOJI PICKER */}
        {showEmoji && (
          <div className="absolute bottom-20 left-4 z-50 scale-75 origin-bottom-left">
            <Picker data={data} onEmojiSelect={(e: any) => setNewMessage(p => p + e.native)} />
          </div>
        )}

        {/* ACTIONS & INPUT */}
        <div className="p-3 bg-white border-t space-y-3">
          <div className="flex items-center gap-2 px-2">
            <button onClick={() => setShowEmoji(!showEmoji)} className="text-slate-400 hover:text-yellow-500"><Smile size={20}/></button>
            <CldUploadWidget uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET} onSuccess={(res: any) => uploadMedia(res.info.secure_url, "image")}>
              {({ open }) => <button onClick={() => open()} className="text-slate-400"><ImageIcon size={20}/></button>}
            </CldUploadWidget>
            <button onClick={sendLocation} className="text-slate-400"><MapPin size={20}/></button>
            <button 
              onClick={isRecording ? () => mediaRecorder?.stop() : startRecording}
              className={`p-1 rounded-full ${isRecording ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}
            >
              <Mic size={20}/>
            </button>
          </div>
          
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              value={newMessage}
              onChange={(e) => handleTyping(e.target.value)}
              placeholder="Message..."
              className="flex-1 bg-slate-100 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
            />
            <button type="submit" disabled={!newMessage.trim()} className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100 active:scale-95 transition-all disabled:opacity-50">
              <Send size={18} />
            </button>
          </form>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}