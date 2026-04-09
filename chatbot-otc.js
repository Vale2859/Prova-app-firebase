window.ChatbotOTC = {

  normalizeText(text) {
    return (text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  },

  getSuggestion(text) {
    const t = this.normalizeText(text);

    if (t.includes("mal di gola") || t.includes("gola")) {
      return `
• Tantum Verde spray  
• Benagol  
• Neo Borocillina  

In generale possono essere utili spray lenitivi o pastiglie antisettiche.`;
    }

    if (t.includes("tosse secca")) {
      return `
• Seki sciroppo  
• Grintuss  
• Bronchenolo sedativo  

In generale si possono valutare prodotti calmanti per la tosse secca.`;
    }

    if (t.includes("tosse grassa") || t.includes("catarro")) {
      return `
• Fluimucil  
• Bisolvon  
• Bronchenolo tosse grassa  

In generale si possono valutare fluidificanti o mucolitici.`;
    }

    if (t.includes("tosse")) {
      return `
Per la tosse è importante capire se è:
• secca
• con catarro

Se vuoi, puoi scrivermi:
• tosse secca
oppure
• tosse con catarro`;
    }

    if (t.includes("reflusso") || t.includes("acidita") || t.includes("bruciore di stomaco")) {
      return `
• Gaviscon  
• Maalox  
• Riopan  

In generale si possono valutare antiacidi o prodotti contro il reflusso.`;
    }

    if (t.includes("diarrea")) {
      return `
• Enterogermina  
• Yovis  
• Diosmectal  

In generale si possono valutare fermenti lattici, reidratazione e prodotti di supporto.`;
    }

    if (t.includes("raffreddore") || t.includes("naso chiuso")) {
      return `
• Rinazina  
• Vicks Sinex  
• spray acqua di mare  

In generale si possono valutare spray nasali e lavaggi nasali.`;
    }

    if (t.includes("febbre") || t.includes("mal di testa") || t.includes("dolore")) {
      return `
• Tachipirina  
• Moment  
• Oki  

In generale si possono valutare analgesici o antipiretici da banco, in base al caso.`;
    }

    return null;
  }

};
