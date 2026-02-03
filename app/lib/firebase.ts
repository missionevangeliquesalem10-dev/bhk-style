import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDRk8yqSXAREzKoTjh1PQtVuq3TAZ-QVEo",
  authDomain: "wotro-auto.firebaseapp.com",
  projectId: "wotro-auto",
  storageBucket: "wotro-auto.firebasestorage.app",
  messagingSenderId: "58828181619",
  appId: "1:58828181619:web:4137e206271e7abba25a06",
  measurementId: "G-WC7E4PJ8N5"
};

// Initialisation (évite les bugs au rafraîchissement sur Next.js)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
export const auth = getAuth(app);