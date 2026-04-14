import { VAPID_PUBLIC_KEY } from "./push-config.js";
import { db, auth } from "./firebase.js";
import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export async function askNotificationPermission() {
  if (!("Notification" in window)) {
    throw new Error("Notifiche non supportate");
  }

  const result = await Notification.requestPermission();
  if (result !== "granted") {
    throw new Error("Permesso notifiche non concesso");
  }

  if (!("serviceWorker" in navigator)) {
    throw new Error("Service Worker non supportato");
  }

  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  });

  const user = auth.currentUser;
  if (!user) throw new Error("Utente non autenticato");

  const subJson = subscription.toJSON();

  await setDoc(
    doc(db, "users", user.uid, "push_subscriptions", btoa(subscription.endpoint).slice(0, 80)),
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
