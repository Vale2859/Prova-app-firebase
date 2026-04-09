// ===============================
// CALCOLO PUNTI
// ===============================
function calcolaPunti(euro) {
  return Math.floor(euro / 0.5);
}

// ===============================
// LIVELLI
// ===============================
function calcolaLivello(punti) {
  if (punti >= 3000) return "Diamond";
  if (punti >= 1000) return "Gold";
  return "Bronze";
}

// ===============================
// AGGIUNGI ACQUISTO
// ===============================
function aggiungiAcquisto(importo, descrizione = "Acquisto farmacia") {
  let profile = JSON.parse(localStorage.getItem("farmaciaProfileData")) || {};
  let puntiData = JSON.parse(localStorage.getItem("farmaciaPuntiData")) || {};

  let puntiCorrenti = Number(profile.points || 0);

  const puntiGuadagnati = calcolaPunti(importo);
  const nuoviPunti = puntiCorrenti + puntiGuadagnati;
  const nuovoLivello = calcolaLivello(nuoviPunti);

  // aggiorna profilo
  profile.points = nuoviPunti;
  profile.level = nuovoLivello;

  // crea operazione
  const operazione = {
    name: descrizione,
    meta: `${importo.toFixed(2)}€ • ${new Date().toLocaleDateString("it-IT")}`,
    points: puntiGuadagnati,
    icon: "🛒"
  };

  // salva operazioni
  puntiData.operations = puntiData.operations || [];
  puntiData.operations.unshift(operazione);

  // attività veloce (per fidelity)
  puntiData.activities = puntiData.activities || [];
  puntiData.activities.unshift({
    label: descrizione,
    points: puntiGuadagnati,
    date: new Date().toLocaleDateString("it-IT")
  });

  // salva tutto
  localStorage.setItem("farmaciaProfileData", JSON.stringify(profile));
  localStorage.setItem("farmaciaPuntiData", JSON.stringify(puntiData));

  return {
    puntiGuadagnati,
    nuoviPunti,
    nuovoLivello
  };
}

// ===============================
// USA PUNTI (PREMI)
// ===============================
function usaPunti(punti, descrizione = "Riscatto premio") {
  let profile = JSON.parse(localStorage.getItem("farmaciaProfileData")) || {};
  let puntiData = JSON.parse(localStorage.getItem("farmaciaPuntiData")) || {};

  let puntiCorrenti = Number(profile.points || 0);

  if (puntiCorrenti < punti) {
    return { errore: true };
  }

  const nuoviPunti = puntiCorrenti - punti;
  const nuovoLivello = calcolaLivello(nuoviPunti);

  profile.points = nuoviPunti;
  profile.level = nuovoLivello;

  const operazione = {
    name: descrizione,
    meta: `${new Date().toLocaleDateString("it-IT")}`,
    points: -punti,
    icon: "🎁"
  };

  puntiData.operations = puntiData.operations || [];
  puntiData.operations.unshift(operazione);

  localStorage.setItem("farmaciaProfileData", JSON.stringify(profile));
  localStorage.setItem("farmaciaPuntiData", JSON.stringify(puntiData));

  return { successo: true };
}
