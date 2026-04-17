function calcolaPunti(euro) {
  return Math.floor(Number(euro || 0) / 0.5);
}

function calcolaLivello(punti) {
  if (punti >= 3000) return 'Diamond';
  if (punti >= 1000) return 'Gold';
  return 'Bronze';
}

async function getFirebaseContext() {
  const mod = await import('./firebase.js');
  const user = mod.auth.currentUser || await new Promise((resolve) => {
    const unsub = mod.onAuthStateChanged(mod.auth, (value) => {
      unsub();
      resolve(value || null);
    });
  });
  if (!user) throw new Error('Utente non autenticato');
  return { ...mod, user };
}

async function aggiungiAcquisto(importo, descrizione = 'Acquisto farmacia') {
  const amount = Number(importo || 0);
  const puntiGuadagnati = calcolaPunti(amount);
  const { firestore, user, doc, getDoc, setDoc, addDoc, collection, serverTimestamp } = await getFirebaseContext();
  const userRef = doc(firestore, 'users', user.uid);
  const snap = await getDoc(userRef);
  const profile = snap.exists() ? snap.data() : {};
  const puntiCorrenti = Number(profile.punti ?? profile.points ?? 0);
  const nuoviPunti = puntiCorrenti + puntiGuadagnati;
  const nuovoLivello = calcolaLivello(nuoviPunti);

  await setDoc(userRef, {
    punti: nuoviPunti,
    points: nuoviPunti,
    livello: nuovoLivello,
    level: nuovoLivello,
    updatedAt: new Date().toISOString()
  }, { merge: true });

  await addDoc(collection(firestore, 'users', user.uid, 'fidelity_movements'), {
    type: 'earn',
    name: descrizione,
    label: descrizione,
    meta: `${amount.toFixed(2)}€ • ${new Date().toLocaleDateString('it-IT')}`,
    points: puntiGuadagnati,
    importo: amount,
    icon: '🛒',
    createdAt: new Date().toISOString(),
    createdAtServer: serverTimestamp()
  });

  return { puntiGuadagnati, nuoviPunti, nuovoLivello };
}

async function usaPunti(punti, descrizione = 'Riscatto premio') {
  const amount = Number(punti || 0);
  const { firestore, user, doc, getDoc, setDoc, addDoc, collection, serverTimestamp } = await getFirebaseContext();
  const userRef = doc(firestore, 'users', user.uid);
  const snap = await getDoc(userRef);
  const profile = snap.exists() ? snap.data() : {};
  const puntiCorrenti = Number(profile.punti ?? profile.points ?? 0);

  if (puntiCorrenti < amount) {
    return { errore: true };
  }

  const nuoviPunti = puntiCorrenti - amount;
  const nuovoLivello = calcolaLivello(nuoviPunti);

  await setDoc(userRef, {
    punti: nuoviPunti,
    points: nuoviPunti,
    livello: nuovoLivello,
    level: nuovoLivello,
    updatedAt: new Date().toISOString()
  }, { merge: true });

  await addDoc(collection(firestore, 'users', user.uid, 'fidelity_movements'), {
    type: 'redeem',
    name: descrizione,
    label: descrizione,
    meta: new Date().toLocaleDateString('it-IT'),
    points: -amount,
    icon: '🎁',
    createdAt: new Date().toISOString(),
    createdAtServer: serverTimestamp()
  });

  return { successo: true, nuoviPunti, nuovoLivello };
}

window.calcolaPunti = calcolaPunti;
window.calcolaLivello = calcolaLivello;
window.aggiungiAcquisto = aggiungiAcquisto;
window.usaPunti = usaPunti;
