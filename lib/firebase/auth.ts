import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";
import { onAuthStateChanged, type User } from "firebase/auth";

export const subscribeToAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      name: user.displayName || "",
      email: user.email || "",
      photoURL: user.photoURL || "",
      isAdmin: false,
      createdAt: serverTimestamp(),
    });
  }

  return user;
};
