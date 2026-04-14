const admin = require("firebase-admin");
const functions = require("firebase-functions");
const webpush = require("web-push");
const { vapid, app } = require("./config");

admin.initializeApp();
const db = admin.firestore();

webpush.setVapidDetails(
  "mailto:noreply@farmaciamontesano.it",
  vapid.publicKey,
  vapid.privateKey
);

function safeDate(value) {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function getUserSubscriptions(uid) {
  const snap = await db
    .collection("users")
    .doc(uid)
    .collection("push_subscriptions")
    .get();

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));
}

async function getEligibleUsersByFlag(flagName) {
  const snap = await db
    .collection("users")
    .where(`notificationSettings.${flagName}`, "==", true)
    .get();

  return snap.docs.map((doc) => ({
    uid: doc.id,
    ...doc.data()
  }));
}

async function sendPushToUser(uid, payload) {
  const subscriptions = await getUserSubscriptions(uid);
  if (!subscriptions.length) return;

  const jobs = subscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys
        },
        JSON.stringify(payload)
      );
    } catch (err) {
      const status = err?.statusCode || 0;

      if (status === 404 || status === 410) {
        await db
          .collection("users")
          .doc(uid)
          .collection("push_subscriptions")
          .doc(sub.id)
          .delete()
          .catch(() => {});
      } else {
        console.error("Push error", uid, sub.id, err.message);
      }
    }
  });

  await Promise.all(jobs);
}

async function sendPushToMany(userDocs, payload) {
  for (const user of userDocs) {
    await sendPushToUser(user.uid, payload);
  }
}

/**
 * 1) GIORNATE: quando viene pubblicata una nuova giornata
 */
exports.onGiornataCreated = functions.firestore
  .document("beauty/{giornataId}")
  .onCreate(async (snap) => {
    const data = snap.data() || {};
    const users = await getEligibleUsersByFlag("giornate");

    if (data.attivo !== true) return null;

    const title = "Nuova giornata in farmacia";
    const body = data.titolo
      ? `${data.titolo} è ora disponibile.`
      : "È stata pubblicata una nuova giornata.";

    await sendPushToMany(users, {
      title,
      body,
      url: `${app.baseUrl}/beauty.html`,
      tag: `giornata-created-${snap.id}`
    });

    return null;
  });

/**
 * 2) GIORNATE: notifica il giorno stesso
 * Ogni 30 minuti controlla gli eventi di oggi
 */
exports.notifyGiornateOggi = functions.pubsub
  .schedule("every 30 minutes")
  .timeZone("Europe/Rome")
  .onRun(async () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayKey = `${yyyy}-${mm}-${dd}`;

    const giornateSnap = await db.collection("beauty").get();
    const users = await getEligibleUsersByFlag("giornate");

    for (const doc of giornateSnap.docs) {
      const data = doc.data() || {};
      const dataEvento = data.data || data.date || data.dataEvento || "";

      if (data.attivo !== true) continue;
      if (dataEvento !== todayKey) continue;

      await sendPushToMany(users, {
        title: "La giornata è oggi",
        body: data.titolo
          ? `Oggi c'è: ${data.titolo}`
          : "Oggi c'è una giornata in farmacia.",
        url: `${app.baseUrl}/beauty.html`,
        tag: `giornata-today-${doc.id}-${todayKey}`
      });
    }

    return null;
  });

/**
 * 3) TURNO / APPOGGIO
 * Controlla ogni 30 minuti, ma invia solo alle 8 del mattino
 * e una sola volta al giorno.
 */
exports.notifyTurniEAppoggi = functions.pubsub
  .schedule("every 30 minutes")
  .timeZone("Europe/Rome")
  .onRun(async () => {
    const now = new Date();

    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const todayKey = `${yyyy}-${mm}-${dd}`;

    const hour = now.getHours();
    if (hour !== 8) return null;

    const response = await fetch(`${app.baseUrl}/turno.html`);
    const html = await response.text();

    const match = html.match(/const turni = (\{[\s\S]*?\});/);

    if (!match) {
      console.log("Oggetto turni non trovato in turno.html");
      return null;
    }

    let turni;
    try {
      turni = Function(`"use strict"; return (${match[1]});`)();
    } catch (err) {
      console.error("Errore parsing oggetto turni:", err);
      return null;
    }

    const todayData = turni[todayKey];
    if (!todayData) {
      console.log("Nessun turno trovato per oggi:", todayKey);
      return null;
    }

    const docRef = db.collection("system").doc(`notifiche_${todayKey}`);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      console.log("Notifica già inviata oggi");
      return null;
    }

    let sentSomething = false;

    if ((todayData.turno || "").toUpperCase() === "MONTESANO") {
      const users = await getEligibleUsersByFlag("turno");

      await sendPushToMany(users, {
        title: "Farmacia Montesano di turno",
        body: "Oggi la Farmacia Montesano è di turno.",
        url: `${app.baseUrl}/turno.html`,
        tag: `turno-${todayKey}`
      });

      sentSomething = true;
    }

    if ((todayData.appoggio || "").toUpperCase() === "MONTESANO") {
      const users = await getEligibleUsersByFlag("appoggio");

      await sendPushToMany(users, {
        title: "Farmacia Montesano di appoggio",
        body: "Oggi la Farmacia Montesano è di appoggio.",
        url: `${app.baseUrl}/turno.html`,
        tag: `appoggio-${todayKey}`
      });

      sentSomething = true;
    }

    if (sentSomething) {
      await docRef.set({
        data: todayKey,
        sentAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    return null;
  });
/**
 * 4) FORTUNA
 * Controlla ogni 30 minuti chi può ritentare
 * Legge users/{uid}.fortuneState.nextAttemptAt
 */
exports.notifyFortunaReady = functions.pubsub
  .schedule("every 30 minutes")
  .timeZone("Europe/Rome")
  .onRun(async () => {
    const now = new Date();

    const users = await db
      .collection("users")
      .where("notificationSettings.fortuna", "==", true)
      .get();

    for (const doc of users.docs) {
      const data = doc.data() || {};
      const state = data.fortuneState || {};
      const nextAttemptAt = safeDate(state.nextAttemptAt);
      const readyNotifiedAt = safeDate(state.readyNotifiedAt);

      if (!nextAttemptAt) continue;
      if (nextAttemptAt > now) continue;

      const alreadyToday =
        readyNotifiedAt &&
        readyNotifiedAt.toDateString() === now.toDateString();

      if (alreadyToday) continue;

      await sendPushToUser(doc.id, {
        title: "Fortuna disponibile",
        body: "Puoi tentare di nuovo la fortuna.",
        url: `${app.baseUrl}/fortuna.html`,
        tag: `fortuna-ready-${doc.id}`
      });

      await db.collection("users").doc(doc.id).set(
        {
          fortuneState: {
            ...state,
            readyNotifiedAt: admin.firestore.FieldValue.serverTimestamp()
          }
        },
        { merge: true }
      );
    }

    return null;
  });

exports.testPush = functions.https.onRequest(async (req, res) => {
  try {
    const users = await db.collection("users").get();

    for (const doc of users.docs) {
      await sendPushToUser(doc.id, {
        title: "🚀 TEST NOTIFICA",
        body: "Funziona davvero! 🔔",
        url: app.baseUrl,
        tag: "test-notifica"
      });
    }

    res.send("Notifica inviata");
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore");
  }
});
exports.testTurnoPush = functions.https.onRequest(async (req, res) => {
  try {
    const users = await getEligibleUsersByFlag("turno");

    await sendPushToMany(users, {
      title: "Farmacia Montesano di turno",
      body: "Test turno: la notifica funziona 🔔",
      url: `${app.baseUrl}/turno.html`,
      tag: "test-turno"
    });

    res.send("Notifica turno inviata");
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore");
  }
});
