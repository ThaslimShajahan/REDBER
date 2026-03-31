import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCt5xsrB-AzJ1sNtGolKjJvERrCkLn-LhU",
  authDomain: "redber-persona-mvp.firebaseapp.com",
  projectId: "redber-persona-mvp",
  storageBucket: "redber-persona-mvp.firebasestorage.app",
  messagingSenderId: "5861574207",
  appId: "1:5861574207:web:8826b67b566c2701089a8a",
};

// Prevent re-initialisation in Next.js hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
