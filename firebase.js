import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyB7p69J89r5Kwu2YgawkBb9omjojdM4HTM",
  authDomain: "farmaciamontesano.firebaseapp.com",
  databaseURL: "https://farmaciamontesano-default-rtdb.firebaseio.com",
  projectId: "farmaciamontesano",
  storageBucket: "farmaciamontesano.firebasestorage.app",
  messagingSenderId: "881461241551",
  appId: "1:881461241551:web:c74d6ee74cb857fa5179ba"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, set, get, remove };
