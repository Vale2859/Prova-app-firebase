import { VAPID_PUBLIC_KEY } from "./push-config.js";
import { firestore, auth } from "./firebase.js";
import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 🔧 converte la public key
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

// 🔑 crea ID sicuro per subscription
function makeSubscriptionId(endpoint) {
  return btoa(endpoint).replace(/[^a-zA-Z0-9]/g, "").slice(0, 80);
}

// 🔔 ATTIVA NOTIFICHE
export async function askNotificationPermission() {
  // controlli base
  if (!("Notification" in window)) {
    throw new Error("Notifiche non supportate");
  }

  if (!("serviceWorker" in navigator)) {
    throw new Error("Service Worker non supportato");
  }

  // chiede permesso
  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error("Permesso notifiche non concesso");
  }

  // utente loggato
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Utente non autenticato");
  }

  // prende service worker
  const registration = await navigator.serviceWorker.ready;

  // controlla se già registrato
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
  }

  const subJson = subscription.toJSON();
  const subscriptionId = makeSubscriptionId(subJson.endpoint);

  // salva su Firestore
  await setDoc(
    doc(firestore, "users", user.uid, "push_subscriptions", subscriptionId),
    {
      endpoint: subJson.endpoint,
      keys: subJson.keys,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  return true;
}

// 💾 SALVA PREFERENZE NOTIFICHE
export async function saveNotificationSettings(settings) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Utente non autenticato");
  }

  await setDoc(
    doc(firestore, "users", user.uid),
    {
      notificationSettings: {
        turno: !!settings.turno,
        appoggio: !!settings.appoggio,
        giornate: !!settings.giornate,
        fortuna: !!settings.fortuna
      },
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}
