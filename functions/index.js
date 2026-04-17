const admin = require("firebase-admin");
const functions = require("firebase-functions");
const webpush = require("web-push");
const { vapid } = require("./config");

admin.initializeApp();
const db = admin.firestore();

const BASE_URL = "https://farmaciamontesano.web.app";

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

function normalizeDateKey(date) {
  const d = safeDate(date) || new Date(date);
  if (!d || Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateDisplay(dateKey) {
  if (!dateKey) return "";
  const d = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateKey;

  return d.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
}

function getAppointmentUrl(data = {}) {
  const type = String(data.type || "").toLowerCase();

  if (type === "giornata") {
    return `${BASE_URL}/calendario.html`;
  }

  if (type === "visita") {
    return `${BASE_URL}/calendario.html`;
  }

  return `${BASE_URL}/calendario.html`;
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
  if (!uid) return;

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

async function sendAppointmentConfirmationIfPossible(docId, data) {
  const uid = data.userId || null;
  if (!uid) return;
  if (data.status === "cancelled") return;
  if (data.confirmationNotificationSentAt) return;

  const userSnap = await db.collection("users").doc(uid).get();
  const userData = userSnap.exists ? (userSnap.data() || {}) : {};
  if (userData.notificationSettings && userData.notificationSettings.prenotazioni === false) return;

  const title = data.title || "Prenotazione";
  const dateText = formatDateDisplay(data.date || "");
  const timeText = data.startTime || "";

  await sendPushToUser(uid, {
    title: "Prenotazione confermata ✅",
    body: `${title} prenotato per ${dateText}${timeText ? ` alle ${timeText}` : ""}.`,
    url: getAppointmentUrl(data),
    tag: `appointment-confirmed-${docId}`
  });

  await db.collection("appointments").doc(docId).set(
    {
      confirmationNotificationSentAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}

/**
 * 1) GIORNATE BEAUTY: quando viene pubblicata una nuova giornata
 */
exports.onGiornataCreated = functions.firestore
  .document("beauty/{giornataId}")
  .onCreate(async (snap) => {
    const data = snap.data() || {};
    const users = await getEligibleUsersByFlag("giornate");

    if (data.attivo !== true) return null;

    const title = "Nuova giornata beauty ✨";
    const body = data.titolo
      ? `${data.titolo} è ora disponibile. Tocca per scoprire i dettagli.`
      : "Abbiamo pubblicato un nuovo evento beauty. Tocca per scoprirlo.";

    await sendPushToMany(users, {
      title,
      body,
      url: `${BASE_URL}/giornate.html`,
      tag: `giornata-created-${snap.id}`
    });

    return null;
  });

/**
 * 2) GIORNATE BEAUTY: promemoria il giorno stesso
 * Controlla ogni 30 minuti
 */
exports.notifyGiornateOggi = functions.pubsub
  .schedule("every 30 minutes")
  .timeZone("Europe/Rome")
  .onRun(async () => {
    const today = new Date();
    const todayKey = normalizeDateKey(today);

    const giornateSnap = await db.collection("beauty").get();
    const users = await getEligibleUsersByFlag("giornate");

    for (const doc of giornateSnap.docs) {
      const data = doc.data() || {};
      const dataEvento = data.data || data.date || data.dataEvento || "";

      if (data.attivo !== true) continue;
      if (dataEvento !== todayKey) continue;

      await sendPushToMany(users, {
        title: "La giornata beauty è oggi 💆‍♀️",
        body: data.titolo
          ? `${data.titolo} è prevista per oggi. Tocca per vedere tutte le informazioni.`
          : "Oggi c'è una giornata beauty in farmacia. Tocca per i dettagli.",
        url: `${BASE_URL}/giornate.html`,
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

    const todayKey = normalizeDateKey(now);
    const hour = now.getHours();
    if (hour !== 8) return null;

    const response = await fetch(`${BASE_URL}/turno.html`);
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
        title: "Farmacia Montesano di turno oggi 🏥",
        body: "Oggi siamo la farmacia di turno. Tocca per posizione, contatti e dettagli.",
        url: `${BASE_URL}/turno.html`,
        tag: `turno-${todayKey}`
      });

      sentSomething = true;
    }

    if ((todayData.appoggio || "").toUpperCase() === "MONTESANO") {
      const users = await getEligibleUsersByFlag("appoggio");

      await sendPushToMany(users, {
        title: "Farmacia Montesano di appoggio oggi 📍",
        body: "Oggi siamo farmacia di appoggio. Tocca per tutte le informazioni utili.",
        url: `${BASE_URL}/turno.html`,
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
        title: "La tua fortuna è pronta 🍀",
        body: "Hai un nuovo tentativo disponibile. Tocca ora e prova la ruota.",
        url: `${BASE_URL}/fortuna.html`,
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

/**
 * 5) PRENOTAZIONE: conferma subito quando nasce una prenotazione
 * Invia solo se c'è userId collegato
 */
exports.onAppointmentCreated = functions.firestore
  .document("appointments/{appointmentId}")
  .onCreate(async (snap) => {
    const data = snap.data() || {};
    await sendAppointmentConfirmationIfPossible(snap.id, data);
    return null;
  });

/**
 * 6) PRENOTAZIONE: fallback se una prenotazione viene aggiornata
 * e riceve userId dopo la creazione
 */
exports.onAppointmentUpdated = functions.firestore
  .document("appointments/{appointmentId}")
  .onUpdate(async (change) => {
    const before = change.before.data() || {};
    const after = change.after.data() || {};

    const beforeUid = before.userId || null;
    const afterUid = after.userId || null;

    const gainedUserId = !beforeUid && !!afterUid;
    const stillNeedsConfirmation = !after.confirmationNotificationSentAt;

    if (gainedUserId && stillNeedsConfirmation && after.status !== "cancelled") {
      await sendAppointmentConfirmationIfPossible(change.after.id, after);
    }

    return null;
  });

/**
 * 7) PRENOTAZIONI: promemoria stesso giorno alle 8:30
 * Controlla ogni 30 minuti.
 * Invia solo una volta per appuntamento.
 */
exports.notifyTodayAppointmentsReminder = functions.pubsub
  .schedule("every 30 minutes")
  .timeZone("Europe/Rome")
  .onRun(async () => {
    const now = new Date();
    const todayKey = normalizeDateKey(now);
    const hour = now.getHours();
    const minute = now.getMinutes();

    if (!(hour === 8 && minute < 30)) {
      return null;
    }

    const snap = await db
      .collection("appointments")
      .where("date", "==", todayKey)
      .where("status", "in", ["confirmed", "requested"])
      .get();

    for (const doc of snap.docs) {
      const data = doc.data() || {};
      const uid = data.userId || null;

      if (!uid) continue;
      if (data.reminderSameDaySentDate === todayKey) continue;

      const userSnap = await db.collection("users").doc(uid).get();
      const userData = userSnap.exists ? (userSnap.data() || {}) : {};
      if (userData.notificationSettings && userData.notificationSettings.prenotazioni === false) continue;

      const title = data.title || "Prenotazione";
      const timeText = data.startTime || "";

      await sendPushToUser(uid, {
        title: "Promemoria appuntamento 📅",
        body: `Ti aspettiamo oggi${timeText ? ` alle ${timeText}` : ""} per ${title}.`,
        url: getAppointmentUrl(data),
        tag: `appointment-reminder-${doc.id}-${todayKey}`
      });

      await db.collection("appointments").doc(doc.id).set(
        {
          reminderSameDaySentDate: todayKey,
          reminderSameDaySentAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
      );
    }

    return null;
  });

/**
 * TEST NOTIFICA GENERALE
 */
exports.testPush = functions.https.onRequest(async (req, res) => {
  try {
    const users = await db.collection("users").get();

    for (const doc of users.docs) {
      await sendPushToUser(doc.id, {
        title: "Test notifica premium ✨",
        body: "Le notifiche della Farmacia Montesano funzionano correttamente.",
        url: BASE_URL,
        tag: "test-notifica"
      });
    }

    res.send("Notifica inviata");
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore");
  }
});

/**
 * TEST NOTIFICA TURNO
 */
exports.testTurnoPush = functions.https.onRequest(async (req, res) => {
  try {
    const users = await getEligibleUsersByFlag("turno");

    await sendPushToMany(users, {
      title: "Farmacia Montesano di turno oggi 🏥",
      body: "Questa è una prova della nuova notifica premium del turno.",
      url: `${BASE_URL}/turno.html`,
      tag: "test-turno"
    });

    res.send("Notifica turno inviata");
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore");
  }
});

/**
 * TEST NOTIFICA PRENOTAZIONE
 * Usa: /testAppointmentPush?uid=USER_ID
 */
exports.testAppointmentPush = functions.https.onRequest(async (req, res) => {
  try {
    const uid = String(req.query.uid || "").trim();

    if (!uid) {
      res.status(400).send("Manca uid");
      return;
    }

    await sendPushToUser(uid, {
      title: "Prenotazione confermata ✅",
      body: "Questa è una prova della notifica prenotazione cliente.",
      url: `${BASE_URL}/calendario.html`,
      tag: `test-appointment-${uid}`
    });

    res.send("Notifica prenotazione inviata");
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore");
  }
});
