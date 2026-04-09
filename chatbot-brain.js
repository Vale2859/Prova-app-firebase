window.ChatbotBrain = {

  assistantName: "Mia",

  lastSymptom: null,
  lastOTCTopic: null,

  normalizeText(text) {
    return (text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  },

  normalizeDate(dateStr) {
    return new Date(dateStr + "T00:00:00");
  },

  isDateActive(startStr, endStr) {
    if (!startStr || !endStr) return false;

    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);

    const start = this.normalizeDate(startStr);
    const end = this.normalizeDate(endStr);

    return oggi >= start && oggi <= end;
  },

  formatDateItalian(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long"
    });
  },

  getSiteConfig() {
    return window.SiteConfig || {};
  },

  getWhatsappLink() {
    return this.getSiteConfig()?.link?.whatsapp || "https://wa.me/393927737079";
  },

  getWhatsappText() {
    return this.getSiteConfig()?.farmacia?.whatsapp ||
           (window.FARMACIA_CONFIG && window.FARMACIA_CONFIG.whatsapp) ||
           "3927737079";
  },

  getActivePromo() {
    if (!window.PromoData) return [];

    return window.PromoData.filter(promo =>
      promo.attiva && this.isDateActive(promo.dataInizio, promo.dataFine)
    );
  },

  getActiveGiornate() {
    if (!window.GiornateData) return [];

    return window.GiornateData.filter(giornata =>
      giornata.attiva && this.isDateActive(giornata.dataInizio, giornata.dataFine)
    );
  },

  getActiveServices() {
    if (!window.ServicesData) return [];
    return window.ServicesData.filter(service => service.attivo);
  },

  trovaFarmaco(text) {
    if (!window.FARMACIA_MEDICINE) return null;

    const t = this.normalizeText(text);

    return window.FARMACIA_MEDICINE.find(f =>
      t.includes(this.normalizeText(f.nome)) ||
      t.includes(this.normalizeText(f.principio))
    );
  },

  trovaServizioLegacy(text) {
    if (!window.FARMACIA_SERVIZI) return null;

    const t = this.normalizeText(text);

    return window.FARMACIA_SERVIZI.find(s =>
      s.tags.some(tag => t.includes(this.normalizeText(tag)))
    );
  },

  trovaSintomo(text) {
    if (!window.FARMACIA_SYMPTOMS) return null;

    const t = this.normalizeText(text);

    return window.FARMACIA_SYMPTOMS.find(s =>
      s.tags.some(tag => t.includes(this.normalizeText(tag)))
    );
  },

  trovaServizioDinamico(text) {
    const t = this.normalizeText(text);
    const activeServices = this.getActiveServices();

    return activeServices.find(service => {
      const titolo = this.normalizeText(service.titolo);
      const badge = this.normalizeText(service.badge || "");
      const categoria = this.normalizeText(service.categoria || "");
      const descrizione = this.normalizeText(service.descrizione || "");

      return (
        t.includes(titolo) ||
        (badge && t.includes(badge)) ||
        (categoria && t.includes(categoria)) ||
        (t.includes("tricolog") && titolo.includes("tricolog")) ||
        (t.includes("capelli") && (titolo.includes("tricolog") || categoria.includes("analisi"))) ||
        (t.includes("pelle") && (titolo.includes("pelle") || badge.includes("pelle"))) ||
        (t.includes("disbiosi") && titolo.includes("disbiosi")) ||
        (t.includes("intestino") && (titolo.includes("disbiosi") || descrizione.includes("intestin"))) ||
        (t.includes("pressione") && titolo.includes("pressione")) ||
        (t.includes("ecg") && titolo.includes("elettrocardiogramma")) ||
        (t.includes("elettrocardiogramma") && titolo.includes("elettrocardiogramma")) ||
        (t.includes("autoanalisi") && titolo.includes("autoanalisi")) ||
        (t.includes("consulenza") && categoria.includes("consulenze"))
      );
    });
  },

  isPureGreeting(text) {
    const t = this.normalizeText(text);

    const saluti = [
      "ciao",
      "salve",
      "buongiorno",
      "buonasera",
      "hello",
      "hi",
      "hey"
    ];

    return saluti.some(s => t === s);
  },

  startsWithGreeting(text) {
    const t = this.normalizeText(text);

    const saluti = [
      "ciao",
      "salve",
      "buongiorno",
      "buonasera",
      "hello",
      "hi",
      "hey"
    ];

    return saluti.some(s => t.startsWith(s + " "));
  },

  removeGreetingPrefix(text) {
    let t = this.normalizeText(text);

    const saluti = [
      "ciao",
      "salve",
      "buongiorno",
      "buonasera",
      "hello",
      "hi",
      "hey"
    ];

    saluti.forEach(s => {
      if (t.startsWith(s + " ")) {
        t = t.slice((s + " ").length).trim();
      }
    });

    return t;
  },

  wantsProductAdvice(text) {
    const t = this.normalizeText(text);

    return [
      "posso prendere",
      "cosa posso prendere",
      "che posso prendere",
      "qualcosa per",
      "mi consigli qualcosa",
      "mi consigli un prodotto",
      "che prodotto",
      "quale prodotto",
      "what can i take",
      "what should i take",
      "can i take something",
      "something for"
    ].some(k => t.includes(k));
  },

  asksWhichProduct(text) {
    const t = this.normalizeText(text);

    return [
      "quale",
      "quale?",
      "quale prodotto",
      "quale farmaco",
      "cosa prendo",
      "cosa posso prendere",
      "which one",
      "which product",
      "which medicine"
    ].includes(t) || t.includes("quale prodotto") || t.includes("quale farmaco");
  },

  asksPromo(text) {
    const t = this.normalizeText(text);
    return [
      "promo",
      "promozione",
      "promozioni",
      "offerta",
      "offerte",
      "sconto",
      "sconti"
    ].some(k => t.includes(k));
  },

  asksGiornate(text) {
    const t = this.normalizeText(text);
    return [
      "giornata beauty",
      "giornate beauty",
      "beauty specialist",
      "eventi beauty",
      "evento beauty",
      "beauty day",
      "giornate cosmetiche",
      "giornata cosmetica",
      "caudalie",
      "uriage",
      "vichy"
    ].some(k => t.includes(k));
  },

  asksServizi(text) {
    const t = this.normalizeText(text);

    return [
      "quali servizi avete",
      "che servizi avete",
      "servizi disponibili",
      "servizi",
      "servizio",
      "fate ecg",
      "fate elettrocardiogramma",
      "fate analisi tricologica",
      "fate analisi pelle",
      "fate disbiosi",
      "fate controllo pressione",
      "avete analisi tricologica",
      "avete ecg",
      "avete servizi"
    ].some(k => t.includes(k));
  },

  rispostaSaluto(text) {
    const t = this.normalizeText(text);
    const inglese = t.includes("hello") || t === "hi" || t.includes("hey");

    if (inglese) {
      return `Hello! I'm ${this.assistantName}, the virtual assistant of Farmacia Montesano. I can help you with opening hours, contacts, services, promotions, beauty events, medicines and common symptoms.`;
    }

    return `Ciao! Io sono ${this.assistantName}, l’assistente virtuale della Farmacia Montesano. Posso aiutarti con orari, contatti, servizi, promozioni, giornate beauty, farmaci e sintomi comuni.`;
  },

  rispostaOrari() {
    if (window.FARMACIA_CONFIG && window.FARMACIA_CONFIG.orari) {
      const o = window.FARMACIA_CONFIG.orari;

      return `Certo 😊

Gli orari della farmacia sono:

Lunedì: ${o.lunedi}
Martedì: ${o.martedi}
Mercoledì: ${o.mercoledi}
Giovedì: ${o.giovedi}
Venerdì: ${o.venerdi}
Sabato: ${o.sabato}
Domenica: ${o.domenica}`;
    }

    return `In questo momento non riesco a recuperare gli orari. Se vuoi, puoi contattare direttamente la farmacia su WhatsApp: ${this.getWhatsappText()}`;
  },

  rispostaContatti() {
    if (window.FARMACIA_CONFIG) {
      return `Puoi contattare la Farmacia Montesano così:

Telefono: ${window.FARMACIA_CONFIG.telefono}
WhatsApp: ${window.FARMACIA_CONFIG.whatsapp}
Email: ${window.FARMACIA_CONFIG.email}
Indirizzo: ${window.FARMACIA_CONFIG.indirizzo}`;
    }

    const cfg = this.getSiteConfig();

    if (cfg.farmacia) {
      return `Puoi contattare la Farmacia Montesano così:

Telefono: ${cfg.farmacia.telefono}
WhatsApp: ${cfg.farmacia.whatsapp}
Email: ${cfg.farmacia.email}
Indirizzo: ${cfg.farmacia.indirizzo}`;
    }

    return "In questo momento non riesco a recuperare i contatti.";
  },

  rispostaFarmaco(farmaco) {
    return `${farmaco.nome.charAt(0).toUpperCase() + farmaco.nome.slice(1)} è un farmaco a base di ${farmaco.principio}.

Serve per: ${farmaco.uso}

Descrizione: ${farmaco.descrizione}

Ricetta: ${farmaco.ricetta}

Consiglio: ${farmaco.consiglio}`;
  },

  rispostaServizioLegacy(servizio) {
    return `${servizio.rispostaBreve}

Descrizione: ${servizio.descrizione}

Prenotazione: ${servizio.prenotazione}`;
  },

  rispostaServizioDinamico(servizio) {
    const meta = Array.isArray(servizio.meta) ? servizio.meta.join("\n• ") : "";
    const info = Array.isArray(servizio.info) ? servizio.info.join("\n• ") : "";

    return `Sì 😊

${servizio.titolo}

${servizio.descrizione || ""}

${meta ? `Dettagli:
• ${meta}

` : ""}${info ? `Info utili:
• ${info}

` : ""}Se vuoi, puoi scriverci su WhatsApp per maggiori informazioni: ${this.getWhatsappText()}`;
  },

  rispostaSintomo(sintomo) {
    return `Capisco.

${sintomo.descrizione}

Consiglio generale: ${sintomo.consiglio}

Quando sentire il medico: ${sintomo.medico}`;
  },

  rispostaPromo() {
    const promoAttive = this.getActivePromo();

    if (!promoAttive.length) {
      return `Al momento non ci sono promozioni attive.

Le nuove promozioni saranno disponibili a breve.

Se vuoi, puoi comunque scriverci su WhatsApp per chiedere informazioni: ${this.getWhatsappText()}`;
    }

    const importanti = promoAttive.slice(0, 4);

    const elenco = importanti.map(promo => {
      const prezzo = (promo.prezzoNuovo || promo.prezzoVecchio)
        ? `\nPrezzo promo: ${promo.prezzoNuovo || promo.prezzoVecchio}`
        : "";
      return `• ${promo.titolo}${promo.descrizione ? `\n${promo.descrizione}` : ""}${prezzo}`;
    }).join("\n\n");

    return `Sì 😊 al momento ci sono alcune promozioni attive.

${elenco}

Se vuoi, puoi scriverci su WhatsApp per disponibilità o maggiori informazioni: ${this.getWhatsappText()}`;
  },

  rispostaGiornate() {
    const giornateAttive = this.getActiveGiornate();
    const eventi = giornateAttive.filter(g => g.tipo === "hero" || g.tipo === "evento" || g.tipo === "strip");

    if (!eventi.length) {
      return `Al momento non sono previste giornate Beauty Specialist.

Stiamo preparando i prossimi eventi dedicati alla bellezza.

Se vuoi, puoi contattarci su WhatsApp per avere informazioni: ${this.getWhatsappText()}`;
    }

    const prossime = eventi.slice(0, 3);

    const elenco = prossime.map(g => {
      return `• ${g.titolo}
Data: ${this.formatDateItalian(g.dataEvento)}
${g.descrizione || ""}`;
    }).join("\n\n");

    return `Sì 😊 ci sono giornate beauty ed eventi dedicati.

${elenco}

Se vuoi, posso aiutarti a capire qual è il prossimo evento disponibile.`;
  },

  rispostaServizi() {
    const servizi = this.getActiveServices()
      .filter(s => s.tipo !== "focus")
      .slice(0, 8);

    if (!servizi.length) {
      return `Al momento non risultano servizi disponibili.

Se vuoi, puoi comunque scriverci su WhatsApp per chiedere informazioni: ${this.getWhatsappText()}`;
    }

    const elenco = servizi.map(s => `• ${s.titolo}`).join("\n");

    return `Certo 😊

Ecco alcuni servizi disponibili:

${elenco}

Se vuoi, scrivimi il nome di quello che ti interessa e ti spiego meglio.`;
  },

  rispostaFallback() {
    const whatsapp = this.getWhatsappText();

    return `Non ho capito bene la richiesta.

Puoi scrivermi ad esempio:

• orari
• contatti
• promozioni
• giornate beauty
• servizi disponibili
• analisi tricologica
• analisi pelle
• disbiosi
• ECG
• tachipirina
• mal di gola
• tosse
• febbre
• posso prendere qualcosa per mal di testa?

Oppure puoi contattare direttamente la farmacia su WhatsApp:

${whatsapp}`;
  },

  gestisciSicurezza(text) {
    if (!window.ChatbotSafety) return null;

    if (window.ChatbotSafety.hasUrgentRedFlags(text)) {
      return window.ChatbotSafety.urgentReply();
    }

    if (window.ChatbotSafety.isPregnancy(text)) {
      return window.ChatbotSafety.pregnancyReply();
    }

    if (window.ChatbotSafety.isChild(text)) {
      return window.ChatbotSafety.childReply();
    }

    if (window.ChatbotSafety.isElderly(text)) {
      return window.ChatbotSafety.elderlyReply();
    }

    return null;
  },

  answer(text) {
    let t = this.normalizeText(text);

    if (!t) {
      return `Scrivimi pure la tua domanda. Io sono ${this.assistantName} e cercherò di aiutarti.`;
    }

    if (this.isPureGreeting(t)) {
      return this.rispostaSaluto(t);
    }

    if (this.startsWithGreeting(t)) {
      t = this.removeGreetingPrefix(t);
      if (!t) {
        return this.rispostaSaluto(text);
      }
    }

    const safetyReply = this.gestisciSicurezza(t);
    if (safetyReply) {
      return safetyReply;
    }

    if (
      t.includes("orari") ||
      t.includes("orario") ||
      t.includes("aperti") ||
      t.includes("aperto")
    ) {
      return this.rispostaOrari();
    }

    if (
      t.includes("contatti") ||
      t.includes("telefono") ||
      t.includes("whatsapp") ||
      t.includes("email") ||
      t.includes("indirizzo")
    ) {
      return this.rispostaContatti();
    }

    if (this.asksPromo(t)) {
      return this.rispostaPromo();
    }

    if (this.asksGiornate(t)) {
      return this.rispostaGiornate();
    }

    const servizioDinamico = this.trovaServizioDinamico(t);
    if (servizioDinamico) {
      return this.rispostaServizioDinamico(servizioDinamico);
    }

    if (this.asksServizi(t)) {
      return this.rispostaServizi();
    }

    const farmaco = this.trovaFarmaco(t);
    if (farmaco) {
      return this.rispostaFarmaco(farmaco);
    }

    const servizioLegacy = this.trovaServizioLegacy(t);
    if (servizioLegacy) {
      return this.rispostaServizioLegacy(servizioLegacy);
    }

    const sintomo = this.trovaSintomo(t);

    if (sintomo && this.wantsProductAdvice(t)) {
      this.lastSymptom = sintomo.nome;
      this.lastOTCTopic = sintomo.nome;

      if (window.ChatbotOTC) {
        const otcReply = window.ChatbotOTC.getSuggestion(sintomo.nome);

        if (otcReply) {
          return `Capisco.

Per ${sintomo.nome}, in generale si possono valutare alcune soluzioni da banco.

${otcReply}

Se hai altri sintomi, se il disturbo dura a lungo o peggiora, è consigliato sentire il medico oppure contattare direttamente la farmacia.`;
        }
      }

      return this.rispostaSintomo(sintomo);
    }

    if (sintomo) {
      this.lastSymptom = sintomo.nome;
      this.lastOTCTopic = sintomo.nome;

      const baseReply = this.rispostaSintomo(sintomo);

      if (window.ChatbotOTC) {
        const otcReply = window.ChatbotOTC.getSuggestion(sintomo.nome);

        if (otcReply) {
          return `${baseReply}

Possibili soluzioni da banco:

${otcReply}`;
        }
      }

      return baseReply;
    }

    if (this.asksWhichProduct(t)) {
      if (this.lastOTCTopic && window.ChatbotOTC) {
        const suggestion = window.ChatbotOTC.getSuggestion(this.lastOTCTopic);

        if (suggestion) {
          return `Per ${this.lastOTCTopic}, in generale si possono valutare questi prodotti da banco:

${suggestion}`;
        }
      }

      if (this.lastSymptom) {
        return `Posso aiutarti meglio se mi riscrivi il sintomo completo, ad esempio:
• ho mal di gola
• ho tosse
• ho mal di testa`;
      }
    }

    if (window.ChatbotFollowup) {
      const followup = window.ChatbotFollowup.getFollowup(t);

      if (followup) {
        this.lastSymptom = followup.topic;
        this.lastOTCTopic = followup.topic;
        return followup.question;
      }

      if (this.lastSymptom) {
        const followupAnswer = window.ChatbotFollowup.answerFollowup(this.lastSymptom, t);

        if (
          followupAnswer &&
          !followupAnswer.includes("Per aiutarti meglio puoi scrivermi")
        ) {
          return followupAnswer;
        }
      }
    }

    return this.rispostaFallback();
  }

};
