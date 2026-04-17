window.ChatbotSafety = {

  normalizeText(text) {
    return (text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  },



  isPregnancy(text) {

    const t = this.normalizeText(text)

    return [
      "gravidanza",
      "incinta",
      "sono incinta",
      "pregnancy",
      "pregnant"
    ].some(k => t.includes(k))

  },



  isChild(text) {

    const t = this.normalizeText(text)

    return [
      "bambino",
      "bambina",
      "neonato",
      "neonata",
      "neonati",
      "mio figlio",
      "mia figlia",
      "baby",
      "child",
      "infant"
    ].some(k => t.includes(k))

  },



  isElderly(text) {

    const t = this.normalizeText(text)

    return [
      "anziano",
      "anziana",
      "persona anziana",
      "mia nonna",
      "mio nonno",
      "elderly",
      "older"
    ].some(k => t.includes(k))

  },



  hasUrgentRedFlags(text) {

    const t = this.normalizeText(text)

    return [
      "dolore al petto",
      "dolore toracico",
      "manca il respiro",
      "difficolta respiratoria",
      "respiro male",
      "svenimento",
      "convulsioni",
      "sangue nelle feci",
      "vomito con sangue",
      "reazione allergica grave",
      "gonfiore del volto",
      "febbre alta da molti giorni",
      "febbre altissima",
      "forte dolore addominale"
    ].some(k => t.includes(k))

  },



  urgentReply() {

    return `Questa situazione potrebbe richiedere attenzione medica urgente.

Ti consiglio di contattare subito un medico oppure il servizio di emergenza.

Se preferisci, puoi anche chiamare direttamente la farmacia per un primo orientamento rapido.`

  },



  pregnancyReply() {

    return `In gravidanza è meglio essere più prudenti.

Per farmaci, integratori o sintomi specifici ti consiglio di chiedere direttamente alla farmacia oppure al medico, così da ricevere un’indicazione più sicura.`

  },



  childReply() {

    return `Per bambini e neonati è meglio usare maggiore prudenza.

Per sintomi, febbre o scelta del prodotto più adatto ti consiglio di contattare direttamente la farmacia oppure il pediatra.`

  },



  elderlyReply() {

    return `Per una persona anziana è meglio valutare con attenzione sintomi, terapie in corso e condizioni generali.

Ti consiglio di contattare direttamente la farmacia oppure il medico per un consiglio più sicuro.`

  }

};
