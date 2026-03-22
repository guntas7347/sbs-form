import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "sbs-form.firebaseapp.com",
  projectId: "sbs-form",
  storageBucket: "sbs-form.firebasestorage.app",
  messagingSenderId: "136264774034",
  appId: "1:136264774034:web:0d13208bc87fc4ad8e914b",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
