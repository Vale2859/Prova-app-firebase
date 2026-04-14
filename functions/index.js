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
  .document("giornate/{giornataId}")
  .onCreate(async (snap) => {
    const data = snap.data() || {};
    const users = await getEligibleUsersByFlag("giornate");

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

    const giornateSnap = await db.collection("giornate").get();
    const users = await getEligibleUsersByFlag("giornate");

    for (const doc of giornateSnap.docs) {
      const data = doc.data() || {};
      const dataEvento = data.data || data.date || data.dataEvento || "";

      if (dataEvento === todayKey) {
        await sendPushToMany(users, {
          title: "La giornata è oggi",
          body: data.titolo
            ? `Oggi c'è: ${data.titolo}`
            : "Oggi c'è una giornata in farmacia.",
          url: `${app.baseUrl}/beauty.html`,
          tag: `giornata-today-${doc.id}-${todayKey}`
        });
      }
    }

    return null;
  });

/**
 * 3) TURNO / APPOGGIO
 * Ogni 30 minuti controlla i documenti in collection "turni"
 * Formato consigliato:
 * {
 *   data: "2026-04-14",
 *   stato: "turno" oppure "appoggio",
 *   farmacia: "montesano",
 *   notificato: false
 * }
 */
exports.notifyTurniEAppoggi = functions.pubsub
  .schedule("every 30 minutes")
  .timeZone("Europe/Rome")
  .onRun(async () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayKey = `${yyyy}-${mm}-${dd}`;

    const response = await fetch(`${app.baseUrl}/turno.html`);
    const html = await response.text();

    const match = html.match(
      /<script id="turni-data" type="application\/json">([\s\S]*?)<\/script>/
    );

    if (!match) return null;

    const turni = JSON.parse(match[1]);

    for (const item of turni) {
      const data = item.data || "";
      const stato = (item.stato || "").toLowerCase();
      const farmacia = (item.farmacia || "").toLowerCase();

      if (data !== todayKey || farmacia !== "montesano") continue;

      if (stato === "turno") {
        const users = await getEligibleUsersByFlag("turno");
        await sendPushToMany(users, {
          title: "Farmacia Montesano di turno",
          body: "Oggi la Farmacia Montesano è di turno.",
          url: `${app.baseUrl}/turni.html`,
          tag: `turno-${todayKey}`
        });
      }

      if (stato === "appoggio") {
        const users = await getEligibleUsersByFlag("appoggio");
        await sendPushToMany(users, {
          title: "Farmacia Montesano di appoggio",
          body: "Oggi la Farmacia Montesano è di appoggio.",
          url: `${app.baseUrl}/turni.html`,
          tag: `appoggio-${todayKey}`
        });
      }
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
      url: `${app.baseUrl}/turni.html`,
      tag: "test-turno"
    });

    res.send("Notifica turno inviata");
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore");
  }
});
