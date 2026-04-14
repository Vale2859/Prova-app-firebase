import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getMessaging, getToken } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js";
import { VAPID_PUBLIC_KEY } from "./push-config.js";

// 🔥 CONFIG GIÀ INSERITA (perfetta)
const firebaseConfig = {
  apiKey: "AIzaSyB7p69J89r5Kwu2YgawkBb9omjojdM4HTM",
  authDomain: "farmaciamontesano.firebaseapp.com",
  databaseURL: "https://farmaciamontesano-default-rtdb.firebaseio.com",
  projectId: "farmaciamontesano",
  storageBucket: "farmaciamontesano.firebasestorage.app",
  messagingSenderId: "881461241551",
  appId: "1:881461241551:web:c74d6ee74cb857fa5179ba"
};

// 🚀 INIT
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// 🔔 ATTIVA NOTIFICHE
async function attivaNotifiche() {
  try {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      console.log("Notifiche attive");

      const token = await getToken(messaging, {
        vapidKey: VAPID_PUBLIC_KEY
      });

      console.log("TOKEN:", token);

    } else {
      console.log("Notifiche rifiutate");
    }

  } catch (error) {
    console.error("Errore notifiche:", error);
  }
}

// 🚀 AVVIO
attivaNotifiche();
