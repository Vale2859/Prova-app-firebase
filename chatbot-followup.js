window.ChatbotFollowup = {

  normalizeText(text) {
    return (text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  },



  getFollowup(text) {

    const t = this.normalizeText(text);



    if (t.includes("tosse")) {

      return {

        topic: "tosse",

        question: "Capisco. La tosse è secca oppure con catarro?"

      };

    }



    if (t.includes("febbre")) {

      return {

        topic: "febbre",

        question: "Capisco. La febbre è leggera oppure alta?"

      };

    }



    if (t.includes("mal di gola") || t.includes("gola")) {

      return {

        topic: "mal di gola",

        question: "Capisco. Hai anche febbre oppure solo gola irritata?"

      };

    }



    if (t.includes("mal di testa")) {

      return {

        topic: "mal di testa",

        question: "Capisco. Il mal di testa è occasionale oppure dura da più tempo?"

      };

    }



    if (t.includes("diarrea")) {

      return {

        topic: "diarrea",

        question: "Capisco. La diarrea dura da poco oppure da più giorni?"

      };

    }



    return null;

  },



  answerFollowup(topic, text) {

    const t = this.normalizeText(text);



    if (topic === "tosse") {

      if (t.includes("catarro") || t.includes("grassa")) {

        return "Capisco. Se la tosse è con catarro, in generale possono essere utili prodotti fluidificanti o mucolitici. Se dura a lungo, peggiora o hai febbre alta, è consigliato sentire il medico.";

      }



      if (t.includes("secca")) {

        return "Capisco. Se la tosse è secca, in generale possono essere utili prodotti lenitivi per calmare l’irritazione. Se dura a lungo o peggiora, è consigliato sentire il medico.";

      }

    }



    if (topic === "febbre") {

      if (t.includes("alta")) {

        return "Capisco. Se la febbre è alta, è importante monitorarla bene, riposare e idratarsi. Se dura più giorni o si accompagna ad altri sintomi importanti, è consigliato contattare il medico.";

      }



      if (t.includes("leggera") || t.includes("bassa")) {

        return "Capisco. Se la febbre è leggera, in generale è utile riposare, bere molto e monitorare l’andamento della temperatura.";

      }

    }



    if (topic === "mal di gola") {

      if (t.includes("febbre")) {

        return "Capisco. Se al mal di gola si associa febbre, è utile monitorare bene i sintomi. In generale possono aiutare spray o pastiglie per la gola, ma se il disturbo è intenso o persistente è consigliato sentire il medico.";

      }



      if (t.includes("solo") || t.includes("irritata")) {

        return "Capisco. Se è soprattutto irritazione della gola, in generale possono aiutare spray, pastiglie lenitive o prodotti specifici per il sollievo locale.";

      }

    }



    if (topic === "mal di testa") {

      if (t.includes("giorni") || t.includes("continua") || t.includes("piu tempo")) {

        return "Capisco. Se il mal di testa dura da più tempo o torna spesso, è consigliato parlarne con il medico.";

      }



      if (t.includes("occasionale")) {

        return "Capisco. Se è occasionale, in generale possono aiutare riposo, idratazione e, se adatto, un analgesico da banco.";

      }

    }



    if (topic === "diarrea") {

      if (t.includes("giorni") || t.includes("piu")) {

        return "Capisco. Se la diarrea dura da più giorni, è importante sentire il medico, soprattutto se c’è debolezza, febbre o segni di disidratazione.";

      }



      if (t.includes("oggi") || t.includes("poco")) {

        return "Capisco. Se dura da poco, in generale è importante bere molto e valutare prodotti di supporto come fermenti lattici o soluzioni reidratanti.";

      }

    }



    return "Capisco. Per aiutarti meglio puoi scrivermi la situazione in modo semplice, oppure contattare direttamente la farmacia su WhatsApp.";

  }

};
