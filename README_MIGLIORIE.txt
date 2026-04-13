Migliorie applicate senza rompere la base:
- firebase.js con init guard
- index.html: una sola registrazione service worker
- sw.js: cache meno aggressiva per HTML
- attivita.html: auth.js legacy rimosso, ora usa Firebase Auth
- dashboard-admin.html: link turni-admin corretto verso fortuna-admin
- beauty-admin.html, servizi-admin.html, premi-admin.html, fortuna-admin.html, dashboard-admin.html sincronizzati con versioni modulari ove disponibili
- offerte-admin.html reso sicuro con guard firebase.apps.length
- effetto no-flash aggiunto alle pagine principali
