import { VAPID_PUBLIC_KEY } from "./push-config.js";
import { firestore, auth, doc, setDoc } from "./firebase.js";
import {
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function makeSubscriptionId(endpoint) {
  return btoa(endpoint).replace(/[^a-zA-Z0-9]/g, "").slice(0, 80);
}

export async function askNotificationPermission() {
  if (!("Notification" in window)) {
    throw new Error("Notifiche non supportate");
  }

  if (!("serviceWorker" in navigator)) {
    throw new Error("Service Worker non supportato");
  }

  const user = auth.currentUser;
  if (!user) {
    throw new Error("Utente non autenticato");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Permesso notifiche non concesso");
  }

  const registration = await navigator.serviceWorker.ready;

  // Scriviamo subito un test nel documento utente
  await setDoc(
    doc(firestore, "users", user.uid),
    {
      pushDebug: {
        permission: permission,
        serviceWorkerReady: true,
        updatedAt: serverTimestamp()
      }
    },
    { merge: true }
  );

  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
  }

  if (!subscription) {
    throw new Error("Subscription non creata");
  }

  const subJson = subscription.toJSON();
  const subscriptionId = makeSubscriptionId(subJson.endpoint);

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

  // Scriviamo conferma finale
  await setDoc(
    doc(firestore, "users", user.uid),
    {
      pushDebug: {
        permission: permission,
        serviceWorkerReady: true,
        subscriptionSaved: true,
        updatedAt: serverTimestamp()
      }
    },
    { merge: true }
  );

  return true;
}

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
