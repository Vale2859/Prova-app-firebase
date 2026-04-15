import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, get, remove } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInAnonymously
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

const firebaseConfig = {
  apiKey: "AIzaSyB7p69J89r5Kwu2YgawkBb9omjojdM4HTM",
  authDomain: "farmaciamontesano.firebaseapp.com",
  projectId: "farmaciamontesano",
  storageBucket: "farmaciamontesano.firebasestorage.app",
  messagingSenderId: "881461241551",
  appId: "1:881461241551:web:c74d6ee74cb857fa5179ba",
  databaseURL: "https://farmaciamontesano-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const firestore = getFirestore(app);

function normalizeUserProfile(user, data = {}) {
  const nome = data.nome || "";
  const cognome = data.cognome || "";
  const displayName = user?.displayName || [nome, cognome].filter(Boolean).join(" ").trim();
  return {
    uid: user?.uid || data.uid || "",
    userId: user?.uid || data.uid || "",
    nome,
    name: nome,
    cognome,
    surname: cognome,
    email: user?.email || data.email || "",
    telefono: data.telefono || "",
    phone: data.telefono || "",
    dataNascita: data.dataNascita || data.birthDate || "",
    birthDate: data.dataNascita || data.birthDate || "",
    sesso: data.sesso || data.sex || "",
    sex: data.sesso || data.sex || "",
    displayName,
    clientId: data.clientId || data.clientCode || "",
    clientCode: data.clientCode || data.clientId || "",
    fidelityCard: data.fidelityCard || data.clientCode || data.clientId || ""
  };
}

function saveProfileToLocal(profile) {
  const payload = JSON.stringify(profile);
  localStorage.setItem("montesanoUserProfile", payload);
  localStorage.setItem("userProfile", payload);
  localStorage.setItem("clienteProfile", payload);
  localStorage.setItem("currentUserProfile", payload);
  localStorage.setItem("farmaciaCurrentUser", payload);
  localStorage.setItem("farmaciaLoggedIn", "true");
}

function clearLocalProfile() {
  [
    "montesanoUserProfile",
    "userProfile",
    "clienteProfile",
    "currentUserProfile",
    "farmaciaCurrentUser",
    "farmaciaLoggedIn"
  ].forEach((key) => localStorage.removeItem(key));
}

async function syncUserProfileFromFirestore(user) {
  if (!user) {
    clearLocalProfile();
    return null;
  }

  const userRef = doc(firestore, "users", user.uid);
  const snap = await getDoc(userRef);
  const data = snap.exists() ? snap.data() : {};
  const profile = normalizeUserProfile(user, data);
  saveProfileToLocal(profile);
  return profile;
}

onAuthStateChanged(auth, async (user) => {
  try {
    await syncUserProfileFromFirestore(user);
  } catch (error) {
    console.error("Errore sync profilo locale:", error);
    if (!user) clearLocalProfile();
  }
});

export {
  app,
  db,
  ref,
  set,
  get,
  remove,
  auth,
  firestore,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInAnonymously,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  syncUserProfileFromFirestore,
  clearLocalProfile
};
