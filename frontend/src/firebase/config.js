// Firebase configuration & initialization
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCKNtHFqfJBUaNMeBrt6RGP3z7RfjAXCw8",
  authDomain: "ciphershare-91dee.firebaseapp.com",
  projectId: "ciphershare-91dee",
  storageBucket: "ciphershare-91dee.firebasestorage.app",
  messagingSenderId: "895286306243",
  appId: "1:895286306243:web:7c7469a41191821e99c976",
  measurementId: "G-T7XJ3L3T19"
};

// Prevent duplicate app error during Vite hot module reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
export default app;
