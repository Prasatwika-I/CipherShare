// ============================================================
// CipherShare — Firebase Web App Initialization
// SDK Version: 10.12.0
// ============================================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

// Firebase project configuration for CipherShare
const firebaseConfig = {
  apiKey:            "AIzaSyCKNtHFqFJRUaNMaBrt6RGP3z7BfjAXCw8",
  authDomain:        "ciphershare-91dee.firebaseapp.com",
  projectId:         "ciphershare-91dee",
  storageBucket:     "ciphershare-91dee.firebasestorage.app",
  messagingSenderId: "895286306243",
  appId:             "1:895286306243:web:7c7469a41191821e99c976",
  measurementId:     "G-T7XJBL3Ti9"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Configure Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// ============================================================
// Exports — consumed by login.jsp, register.jsp pages
// ============================================================
export {
  auth,
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut
};
