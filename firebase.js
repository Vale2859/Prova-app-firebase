import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getDatabase,
  ref,
  set,
  get,
  remove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 🔐 CONFIG FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyB7p69J89r5Kwu2YgawkBb9omjojdM4HTM",
  authDomain: "farmaciamontesano.firebaseapp.com",
  projectId: "farmaciamontesano",
  storageBucket: "farmaciamontesano.firebasestorage.app",
  messagingSenderId: "881461241551",
  appId: "1:881461241551:web:c74d6ee74cb857fa5179ba",
  databaseURL: "https://farmaciamontesano-default-rtdb.firebaseio.com"
};

// 🚀 INIZIALIZZA FIREBASE
const app = initializeApp(firebaseConfig);

// 🔗 SERVIZI
const db = getDatabase(app);
const auth = getAuth(app);
const firestore = getFirestore(app);

// 📦 EXPORT COMPLETO (QUESTO ERA IL PROBLEMA!)
export {
  app,

  // Realtime DB
  db,
  ref,
  set,
  get,
  remove,

  // Auth
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,

  // Firestore
  firestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs
};
