(function () {
  const isMobile = window.innerWidth <= 768;
  if (!isMobile) return;

  if (document.documentElement.dataset.mobilePreviewApplied === "true") return;
  document.documentElement.dataset.mobilePreviewApplied = "true";

  const CONFIG = {
    phone: "+390835335921",
    whatsapp: "393927737079",
    email: "info@farmaciamontesano.it",
    maps: "https://maps.google.com/?q=Farmacia+Montesano+Matera",

    homeLink: "index.html",
    serviziLink: "servizi.html",
    promoLink: "promo.html",
    beautyLink: "giornate.html",
    turnoLink: "turno.html",
    prenotaLink: "calendario.html",
    miaLink: "assistente.html",

    loginLink: "login.html",
    registerLink: "register.html",
    fidelityLink: "fidelity.html",
    fortunaLink: "fortuna.html",
    premiLink: "premi.html",
    profiloLink: "profilo.html",

    heroImages: ["farmacia2.jpg", "farmacia3.jpg", "farmacia4.jpg"],

    cardImages: {
      servizi: "images/servizi.jpg",
      promo: "images/promo.jpg",
      beauty: "images/beauty.jpg",
      turno: "images/turno.jpg"
    },

    extraCardImages: {
      punti: "images/fidelity.jpg",
      fortuna: "images/fortuna.jpg",
      premi: "images/premi.jpg",
      profilo: "images/profilo.jpg"
    },

    promoBadge: "1",
    beautyBadge: "2"
  };

  const firebaseSession = {
    user: null,
    ready: false
  };


  const homeCardsState = {
    sections: null
  };

  import("./firebase.js")
    .then(({ auth, onAuthStateChanged }) => {
      onAuthStateChanged(auth, (user) => {
        firebaseSession.user = user || null;
        firebaseSession.ready = true;
        if (typeof window.__refreshPrivateCardsState === "function") window.__refreshPrivateCardsState();
        if (typeof window.__refreshMiaBubble === "function") window.__refreshMiaBubble();
      });
    })
    .catch((error) => {
      console.error("Firebase mobile preview auth error:", error);
      firebaseSession.ready = true;
      if (typeof window.__refreshPrivateCardsState === "function") window.__refreshPrivateCardsState();
      if (typeof window.__refreshMiaBubble === "function") window.__refreshMiaBubble();
    });


  Promise.all([
    import('./firebase.js'),
    import('./home-sections-config.js')
  ]).then(async ([firebaseMod, configMod]) => {
    const { firestore, doc, getDoc } = firebaseMod;
    const { HOME_SECTIONS_DEFAULTS, HOME_SECTIONS_DOC, normalizeHomeSections } = configMod;
    const fallback = HOME_SECTIONS_DEFAULTS.map((item, index) => ({ ...item, visible: index < 4, order: index + 1 }));
    try {
      const snap = await getDoc(doc(firestore, HOME_SECTIONS_DOC.collection, HOME_SECTIONS_DOC.id));
      homeCardsState.sections = normalizeHomeSections(snap.exists() ? snap.data().sections : fallback).filter(item => item.visible);
    } catch (error) {
      console.error('Mobile card settings error:', error);
      homeCardsState.sections = fallback.filter(item => item.visible);
    }
    renderManagedMobileCards();
  }).catch((error) => {
    console.error('Mobile card config import error:', error);
    renderManagedMobileCards();
  });

  const existingLogo = document.querySelector(
    "header img, .logo img, .navbar-brand img, .brand img, img[alt*='logo' i]"
  );

  const logoSrc = existingLogo ? existingLogo.getAttribute("src") : "logo.png";
  const miaSrc = "images/mia.png?v=2";

  const oldStyle = document.getElementById("mobile-preview-style");
  if (oldStyle) oldStyle.remove();

  const style = document.createElement("style");
  style.id = "mobile-preview-style";
  style.textContent = `
    @media (max-width: 768px) {
      html, body {
        overflow-x: hidden !important;
      }

      body.mobile-preview-mode {
        background:
          radial-gradient(circle at top left, rgba(255,255,255,0.92), rgba(244,247,245,0.92)),
          linear-gradient(180deg, #f4f6f5 0%, #eef3f1 100%) !important;
        font-family: Inter, Arial, sans-serif !important;
        padding-bottom: 16px !important;
        color: #1f4a43;
      }

      body.mobile-preview-mode *,
      body.mobile-preview-mode *::before,
      body.mobile-preview-mode *::after {
        box-sizing: border-box;
      }

      body.mobile-preview-mode .mobile-preview-original-hide {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }

      body.mobile-preview-mode .mobile-preview-root {
        width: 100%;
        max-width: 430px;
        margin: 0 auto;
        padding: calc(env(safe-area-inset-top) + 8px) 10px 14px;
      }

      body.mobile-preview-mode .glass-card {
        background: rgba(255,255,255,0.78);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        box-shadow: 0 10px 24px rgba(21, 56, 49, 0.08);
        border: 1px solid rgba(255,255,255,0.55);
      }

      body.mobile-preview-mode .mobile-preview-topbar {
        margin-bottom: 8px;
      }

      body.mobile-preview-mode .mobile-preview-topbar-inner {
        min-height: 78px;
        border-radius: 24px;
        padding: 12px 16px;
        display: flex;
        align-items: center;
      }

      body.mobile-preview-mode .mobile-preview-topbar-inner img {
        display: block;
        max-width: 150px;
        width: 100%;
        height: auto;
      }

      body.mobile-preview-mode .mobile-preview-statusbar {
        margin-bottom: 10px;
      }

      body.mobile-preview-mode .mobile-preview-statusbar-inner {
        min-height: 52px;
        border-radius: 18px;
        padding: 0 14px;
        display: flex;
        align-items: center;
        gap: 10px;
        overflow: hidden;
      }

      body.mobile-preview-mode .status-dot {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #2aa06f;
        flex: 0 0 14px;
        box-shadow: 0 0 0 6px rgba(42,160,111,0.10);
      }

      body.mobile-preview-mode .status-fixed {
        flex: 0 0 auto;
        font-size: 14px;
        line-height: 1.15;
        font-weight: 900;
        color: #264d46;
        white-space: nowrap;
      }

      body.mobile-preview-mode .status-marquee {
        position: relative;
        min-width: 0;
        flex: 1;
        overflow: hidden;
        white-space: nowrap;
        mask-image: linear-gradient(to right, transparent 0, black 14px, black calc(100% - 14px), transparent 100%);
        -webkit-mask-image: linear-gradient(to right, transparent 0, black 14px, black calc(100% - 14px), transparent 100%);
      }

      body.mobile-preview-mode .status-marquee-track {
        display: inline-block;
        padding-left: 100%;
        font-size: 14px;
        line-height: 1.15;
        font-weight: 600;
        color: #526e68;
        white-space: nowrap;
        animation: mobileStatusMarquee 12s linear infinite;
        will-change: transform;
      }

      @keyframes mobileStatusMarquee {
        from { transform: translateX(0); }
        to { transform: translateX(-100%); }
      }

      body.mobile-preview-mode .mobile-preview-hero {
        display: block;
        width: 100%;
        position: relative;
        min-height: 190px;
        border-radius: 26px;
        overflow: hidden;
        margin-bottom: 10px;
        box-shadow: 0 14px 28px rgba(21, 56, 49, 0.09);
        text-decoration: none;
        color: inherit;
      }

      body.mobile-preview-mode .mobile-preview-hero-bg {
        position: absolute;
        inset: 0;
        overflow: hidden;
      }

      body.mobile-preview-mode .mobile-preview-hero-bg::after {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 2;
        background: linear-gradient(90deg, rgba(255,255,255,0.90) 0%, rgba(255,255,255,0.78) 43%, rgba(255,255,255,0.16) 100%);
      }

      body.mobile-preview-mode .mobile-preview-hero-slide {
        position: absolute;
        inset: 0;
        background-position: center;
        background-size: cover;
        background-repeat: no-repeat;
        opacity: 0;
        transition: opacity 1s ease-in-out;
        filter: saturate(0.96) brightness(1.02);
      }

      body.mobile-preview-mode .mobile-preview-hero-slide.is-active {
        opacity: 1;
      }

      body.mobile-preview-mode .mobile-preview-bubble {
        position: absolute;
        left: 14px;
        top: 14px;
        width: 57%;
        z-index: 4;
        background: rgba(255,255,255,0.95);
        border-radius: 22px;
        padding: 12px 12px 14px;
        box-shadow: 0 12px 24px rgba(21,56,49,0.09);
        transform-origin: left top;
      }

      body.mobile-preview-mode .mobile-preview-bubble::after {
        content: "";
        position: absolute;
        right: -10px;
        top: 50%;
        margin-top: 6px;
        width: 22px;
        height: 18px;
        background: rgba(255,255,255,0.95);
        clip-path: polygon(0 0, 100% 50%, 0 100%);
        transform: rotate(-6deg);
      }

      body.mobile-preview-mode .mobile-preview-bubble-title {
        margin: 0 0 8px;
        font-size: 20px;
        line-height: 1.02;
        font-weight: 900;
        color: #234942;
      }

      body.mobile-preview-mode .mobile-preview-bubble-subtitle {
        margin: 0;
        font-size: 13px;
        line-height: 1.2;
        font-weight: 500;
        color: #3c5f58;
      }

      body.mobile-preview-mode .mobile-preview-mia {
        position: absolute;
        right: 0;
        bottom: 0;
        width: 42%;
        height: 100%;
        z-index: 3;
        display: flex;
        align-items: flex-end;
        justify-content: flex-end;
        pointer-events: none;
      }

      body.mobile-preview-mode .mobile-preview-mia img {
        display: block;
        max-height: 96%;
        width: auto;
        max-width: 100%;
        object-fit: contain;
        filter: drop-shadow(0 10px 18px rgba(0,0,0,0.12));
      }

      body.mobile-preview-mode .mobile-preview-actions {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-bottom: 10px;
      }

      body.mobile-preview-mode .mobile-preview-action {
        min-height: 48px;
        border-radius: 999px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 0 8px;
        color: #fff;
        text-decoration: none;
        font-size: 13px;
        font-weight: 800;
        box-shadow: 0 10px 20px rgba(21,56,49,0.10);
      }

      body.mobile-preview-mode .mobile-preview-action .icon {
        font-size: 16px;
        line-height: 1;
      }

      body.mobile-preview-mode .action-call {
        background: linear-gradient(135deg, #18574f 0%, #2f7b70 100%);
      }

      body.mobile-preview-mode .action-whatsapp {
        background: linear-gradient(135deg, #6fa65f 0%, #80c76e 100%);
      }

      body.mobile-preview-mode .action-book {
        background: linear-gradient(135deg, #69b5af 0%, #47a9b0 100%);
      }

      body.mobile-preview-mode .mobile-preview-slider {
        width: 100%;
        overflow: hidden;
      }

      body.mobile-preview-mode .mobile-preview-slider-track {
        display: flex;
        width: 100%;
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }

      body.mobile-preview-mode .mobile-preview-slider-track::-webkit-scrollbar {
        display: none;
      }

      body.mobile-preview-mode .mobile-preview-slider-page {
        min-width: 100%;
        width: 100%;
        flex: 0 0 100%;
        scroll-snap-align: start;
      }

      body.mobile-preview-mode .mobile-preview-slider-page .mobile-preview-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      body.mobile-preview-mode .mobile-preview-card {
        position: relative;
        display: block;
        min-height: 124px;
        height: 124px;
        border-radius: 20px;
        overflow: hidden;
        text-decoration: none;
        box-shadow: 0 12px 24px rgba(21,56,49,0.09);
      }

      body.mobile-preview-mode .mobile-preview-card img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      body.mobile-preview-mode .mobile-preview-card::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.26) 100%);
      }

      body.mobile-preview-mode .private-card-link {
        position: relative;
      }

      body.mobile-preview-mode .mobile-preview-lock {
        position: absolute;
        top: 10px;
        left: 10px;
        z-index: 3;
        width: 40px;
        height: 40px;
        border-radius: 999px;
        display: grid;
        place-items: center;
        background: rgba(255,255,255,0.92);
        box-shadow: 0 8px 18px rgba(21, 56, 49, 0.12);
        font-size: 1.15rem;
      }

      body.mobile-preview-mode .private-card-link.is-unlocked .mobile-preview-lock {
        display: none;
      }

      body.mobile-preview-mode .mobile-preview-card-content {
        position: absolute;
        left: 12px;
        right: 12px;
        bottom: 10px;
        z-index: 2;
      }

      body.mobile-preview-mode .mobile-preview-card-title {
        margin: 0 0 4px;
        font-size: 18px;
        line-height: 1.02;
        font-weight: 900;
        color: #fff;
        text-shadow: 0 2px 8px rgba(0,0,0,0.16);
      }

      body.mobile-preview-mode .mobile-preview-card-text {
        margin: 0;
        font-size: 12px;
        line-height: 1.12;
        font-weight: 500;
        color: rgba(255,255,255,0.96);
        text-shadow: 0 2px 8px rgba(0,0,0,0.14);
      }

      body.mobile-preview-mode .mobile-preview-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        z-index: 3;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: #ff6a84;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: 900;
        box-shadow: 0 10px 18px rgba(255,106,132,0.28);
      }

      body.mobile-preview-mode .mobile-preview-dots {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-top: 10px;
      }

      body.mobile-preview-mode .mobile-preview-dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: #d9d9d9;
        transition: all 0.2s ease;
      }

      body.mobile-preview-mode .mobile-preview-dot.active {
        background: #6eb8b0;
        transform: scale(1.08);
      }

      body.mobile-preview-mode .mobile-preview-bottom-links {
        display: none;
      }

      body.mobile-preview-mode .private-access-modal {
        position: fixed;
        inset: 0;
        background: rgba(8,20,16,0.64);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: none;
        align-items: center;
        justify-content: center;
        padding: 18px;
        z-index: 999999;
      }

      body.mobile-preview-mode .private-access-modal.open {
        display: flex;
      }

      body.mobile-preview-mode .private-access-modal-card {
        position: relative;
        width: min(100%, 390px);
        background: #ffffff;
        border-radius: 28px;
        padding: 22px 18px 18px;
        box-shadow: 0 24px 48px rgba(0,0,0,0.18);
        text-align: center;
      }

      body.mobile-preview-mode .private-access-close {
        position: absolute;
        top: 12px;
        right: 12px;
        width: 40px;
        height: 40px;
        border: none;
        border-radius: 12px;
        background: #f2f4f3;
        color: #27443d;
        font-size: 24px;
        cursor: pointer;
      }

      body.mobile-preview-mode .private-access-icon {
        font-size: 3rem;
        line-height: 1;
        margin-bottom: 10px;
      }

      body.mobile-preview-mode .private-access-title {
        margin: 0 0 10px;
        font-size: 1.45rem;
        line-height: 1;
        font-weight: 900;
        letter-spacing: -0.04em;
        color: #17352f;
      }

      body.mobile-preview-mode .private-access-text {
        margin: 0;
        color: #6c7c76;
        font-size: 0.98rem;
        line-height: 1.55;
        font-weight: 600;
      }

      body.mobile-preview-mode .private-access-benefits {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 14px;
        margin-bottom: 16px;
      }

      body.mobile-preview-mode .private-access-benefit {
        background: linear-gradient(180deg, #f7fbf9 0%, #f1f8f4 100%);
        border: 1px solid #dfece6;
        border-radius: 16px;
        padding: 11px 12px;
        color: #17352f;
        font-size: 0.92rem;
        line-height: 1.35;
        font-weight: 700;
        text-align: left;
      }

      body.mobile-preview-mode .private-access-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      body.mobile-preview-mode .private-access-btn {
        min-height: 50px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-decoration: none;
        font-size: 1rem;
        font-weight: 900;
      }

      body.mobile-preview-mode .private-access-btn-login {
        background: linear-gradient(135deg,#1a8b6c 0%, #58a891 100%);
        color: #fff;
      }

      body.mobile-preview-mode .private-access-btn-register {
        background: #eef3f1;
        color: #17352f;
        border: 1px solid #dfe8e4;
      }

      @media (max-width: 390px) {
        body.mobile-preview-mode .mobile-preview-root {
          padding-left: 8px;
          padding-right: 8px;
        }

        body.mobile-preview-mode .mobile-preview-topbar-inner {
          min-height: 72px;
          border-radius: 22px;
          padding: 10px 14px;
        }

        body.mobile-preview-mode .mobile-preview-topbar-inner img {
          max-width: 138px;
        }

        body.mobile-preview-mode .mobile-preview-statusbar-inner {
          min-height: 48px;
          padding: 0 12px;
        }

        body.mobile-preview-mode .status-fixed,
        body.mobile-preview-mode .status-marquee-track {
          font-size: 13px;
        }

        body.mobile-preview-mode .mobile-preview-hero {
          min-height: 178px;
          border-radius: 24px;
        }

        body.mobile-preview-mode .mobile-preview-bubble {
          width: 58%;
          left: 12px;
          top: 12px;
          padding: 10px 10px 12px;
        }

        body.mobile-preview-mode .mobile-preview-bubble-title {
          font-size: 18px;
        }

        body.mobile-preview-mode .mobile-preview-bubble-subtitle {
          font-size: 12px;
        }

        body.mobile-preview-mode .mobile-preview-mia {
          width: 42%;
        }

        body.mobile-preview-mode .mobile-preview-actions {
          gap: 7px;
        }

        body.mobile-preview-mode .mobile-preview-action {
          min-height: 46px;
          font-size: 12px;
          padding: 0 6px;
        }

        body.mobile-preview-mode .mobile-preview-slider-page .mobile-preview-grid {
          gap: 8px;
        }

        body.mobile-preview-mode .mobile-preview-card {
          min-height: 120px;
          height: 120px;
          border-radius: 18px;
        }

        body.mobile-preview-mode .mobile-preview-card-content {
          left: 10px;
          right: 10px;
          bottom: 9px;
        }

        body.mobile-preview-mode .mobile-preview-card-title {
          font-size: 17px;
        }

        body.mobile-preview-mode .mobile-preview-card-text {
          font-size: 11px;
        }

        body.mobile-preview-mode .mobile-preview-badge {
          width: 28px;
          height: 28px;
          font-size: 15px;
        }
      }
    }
  `;
  document.head.appendChild(style);

  document.body.classList.add("mobile-preview-mode");
  Array.from(document.body.children).forEach((child) => {
    if (child.id !== "mobile-preview-root" && child.id !== "mobile-preview-style") {
      if (child.tagName !== "SCRIPT" && child.tagName !== "STYLE" && child.tagName !== "LINK") {
        child.classList.add("mobile-preview-original-hide");
      }
    }
  });

  const root = document.createElement("div");
  root.id = "mobile-preview-root";
  root.className = "mobile-preview-root";
  root.innerHTML = `
    <header class="mobile-preview-topbar">
      <div class="mobile-preview-topbar-inner glass-card">
        <img src="${logoSrc}" alt="Farmacia Montesano" />
      </div>
    </header>

    <section class="mobile-preview-statusbar">
      <div class="mobile-preview-statusbar-inner glass-card">
        <span class="status-dot" id="mobilePreviewStatusDot"></span>
        <div class="status-fixed" id="mobilePreviewStatusLabel">Siamo aperti</div>
        <div class="status-marquee">
          <div class="status-marquee-track" id="mobilePreviewStatusDetail">
            Chiudiamo alle 13:00 • Chiudiamo alle 13:00 •
          </div>
        </div>
      </div>
    </section>

    <a class="mobile-preview-hero" href="${CONFIG.miaLink}" id="mobilePreviewHero">
      <div class="mobile-preview-hero-bg">
        ${CONFIG.heroImages.map((img, index) => `
          <div
            class="mobile-preview-hero-slide ${index === 0 ? "is-active" : ""}"
            style="background-image:url('${img}')"
          ></div>
        `).join("")}
      </div>

      <div class="mobile-preview-bubble" id="mobilePreviewBubble">
        <h2 class="mobile-preview-bubble-title" id="mobilePreviewBubbleTitle">Buongiorno</h2>
        <p class="mobile-preview-bubble-subtitle" id="mobilePreviewBubbleSubtitle">
          Sono Mia. Posso aiutarti con servizi, prenotazioni e informazioni della farmacia
        </p>
      </div>

      <div class="mobile-preview-mia">
        <img src="${miaSrc}" alt="Mia assistente" />
      </div>
    </a>

    <section class="mobile-preview-actions">
      <a class="mobile-preview-action action-call" href="tel:${CONFIG.phone}">
        <span class="icon">📞</span><span>Chiama</span>
      </a>
      <a class="mobile-preview-action action-whatsapp" href="https://wa.me/${CONFIG.whatsapp}" target="_blank" rel="noopener">
        <span class="icon">💬</span><span>WhatsApp</span>
      </a>
      <a class="mobile-preview-action action-book" href="${CONFIG.prenotaLink}">
        <span class="icon">🗓️</span><span>Prenota</span>
      </a>
    </section>

    <section class="mobile-preview-slider">
      <div class="mobile-preview-slider-track" id="mobilePreviewSliderTrack">

        <div class="mobile-preview-slider-page">
          <div class="mobile-preview-grid">
            <a href="${CONFIG.serviziLink}" class="mobile-preview-card">
              <img src="${CONFIG.cardImages.servizi}" alt="Servizi">
              <div class="mobile-preview-card-content">
                <h3 class="mobile-preview-card-title">Servizi</h3>
                <p class="mobile-preview-card-text">Scopri i servizi attivi</p>
              </div>
            </a>

            <a href="${CONFIG.promoLink}" class="mobile-preview-card">
              <img src="${CONFIG.cardImages.promo}" alt="Promo">
              <span class="mobile-preview-badge">${CONFIG.promoBadge}</span>
              <div class="mobile-preview-card-content">
                <h3 class="mobile-preview-card-title">Promo</h3>
                <p class="mobile-preview-card-text">Offerte del momento</p>
              </div>
            </a>

            <a href="${CONFIG.beautyLink}" class="mobile-preview-card">
              <img src="${CONFIG.cardImages.beauty}" alt="Giornate Beauty">
              <span class="mobile-preview-badge">${CONFIG.beautyBadge}</span>
              <div class="mobile-preview-card-content">
                <h3 class="mobile-preview-card-title">Giornate<br>Beauty</h3>
                <p class="mobile-preview-card-text">Eventi benessere</p>
              </div>
            </a>

            <a href="${CONFIG.turnoLink}" class="mobile-preview-card">
              <img src="${CONFIG.cardImages.turno}" alt="Farmacie di turno">
              <div class="mobile-preview-card-content">
                <h3 class="mobile-preview-card-title">Farmacie<br>di turno</h3>
                <p class="mobile-preview-card-text">Trova la farmacia aperta</p>
              </div>
            </a>
          </div>
        </div>

        <div class="mobile-preview-slider-page">
          <div class="mobile-preview-grid">
            <a href="#" class="mobile-preview-card private-card-link" data-private-target="${CONFIG.fidelityLink}"><span class="mobile-preview-lock">🔒</span>
              <img
                src="${CONFIG.extraCardImages.punti}" onerror="this.onerror=null;this.src='images/promo.jpg'"
                alt="Fidelity"
                onerror="this.onerror=null;this.src='images/fidelity.jpg';"
              >
              <div class="mobile-preview-card-content">
                <h3 class="mobile-preview-card-title">Fidelity</h3>
                <p class="mobile-preview-card-text">Card e vantaggi</p>
              </div>
            </a>

            <a href="#" class="mobile-preview-card private-card-link" data-private-target="${CONFIG.fortunaLink}"><span class="mobile-preview-lock">🔒</span>
              <img
                src="${CONFIG.extraCardImages.fortuna}" onerror="this.onerror=null;this.src='images/promo.jpg'"
                alt="Fortuna"
                onerror="this.onerror=null;this.src='images/promo.jpg';"
              >
              <div class="mobile-preview-card-content">
                <h3 class="mobile-preview-card-title">Fortuna</h3>
                <p class="mobile-preview-card-text">Gioca oggi</p>
              </div>
            </a>

            <a href="#" class="mobile-preview-card private-card-link" data-private-target="${CONFIG.premiLink}"><span class="mobile-preview-lock">🔒</span>
              <img
                src="${CONFIG.extraCardImages.premi}" onerror="this.onerror=null;this.src='images/promo.jpg'"
                alt="Premi"
                onerror="this.onerror=null;this.src='images/promo.jpg';"
              >
              <div class="mobile-preview-card-content">
                <h3 class="mobile-preview-card-title">Premi</h3>
                <p class="mobile-preview-card-text">Riscatta</p>
              </div>
            </a>

            <a href="#" class="mobile-preview-card private-card-link" data-private-target="${CONFIG.profiloLink}"><span class="mobile-preview-lock">🔒</span>
              <img
                src="${CONFIG.extraCardImages.profilo}" onerror="this.onerror=null;this.src='images/promo.jpg'"
                alt="Profilo"
                onerror="this.onerror=null;this.src='images/profilo.jpg';"
              >
              <div class="mobile-preview-card-content">
                <h3 class="mobile-preview-card-title">Profilo</h3>
                <p class="mobile-preview-card-text">I tuoi dati</p>
              </div>
            </a>
          </div>
        </div>

      </div>

      <div class="mobile-preview-dots" aria-hidden="true">
        <span class="mobile-preview-dot active"></span>
        <span class="mobile-preview-dot"></span>
      </div>
    </section>

    <div class="private-access-modal" id="privateAccessModal" aria-hidden="true">
      <div class="private-access-modal-card">
        <button class="private-access-close" id="privateAccessClose" aria-label="Chiudi">×</button>

        <div class="private-access-icon">🔒</div>

        <h3 class="private-access-title">Accedi per sbloccare questa area</h3>

        <p class="private-access-text">
          Registrandoti potrai usare la tua card fidelity, accumulare punti, tentare la fortuna,
          riscattare premi e gestire il tuo profilo cliente.
        </p>

        <div class="private-access-benefits">
          <div class="private-access-benefit">🎁 Premi e vantaggi esclusivi</div>
          <div class="private-access-benefit">★ Card fidelity personale e punti</div>
          <div class="private-access-benefit">🍀 Un tentativo al giorno nella Fortuna</div>
        </div>

        <div class="private-access-actions">
          <a href="${CONFIG.loginLink}" class="private-access-btn private-access-btn-login">Accedi</a>
          <a href="${CONFIG.registerLink}" class="private-access-btn private-access-btn-register">Registrati</a>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(root);

  const sliderTrack = document.getElementById("mobilePreviewSliderTrack");
  const dotsWrap = document.querySelector('.mobile-preview-dots');

  function getManagedSections() {
    return Array.isArray(homeCardsState.sections) && homeCardsState.sections.length ? homeCardsState.sections : [
      { id:'servizi', title:'Servizi', href:CONFIG.serviziLink, image:CONFIG.cardImages.servizi, description:'Scopri i servizi attivi', visible:true, requiresAuth:false },
      { id:'promo', title:'Promo', href:CONFIG.promoLink, image:CONFIG.cardImages.promo, description:'Offerte del momento', visible:true, requiresAuth:false },
      { id:'giornate', title:'Giornate Beauty', href:CONFIG.beautyLink, image:CONFIG.cardImages.beauty, description:'Eventi benessere', visible:true, requiresAuth:false },
      { id:'turni', title:'Farmacia di turno', href:CONFIG.turnoLink, image:CONFIG.cardImages.turno, description:'Trova la farmacia aperta', visible:true, requiresAuth:false },
      { id:'fidelity', title:'Fidelity', href:CONFIG.fidelityLink, image:CONFIG.extraCardImages.punti, description:'Card e vantaggi', visible:false, requiresAuth:true },
      { id:'fortuna', title:'Fortuna', href:CONFIG.fortunaLink, image:CONFIG.extraCardImages.fortuna, description:'Gioca oggi', visible:false, requiresAuth:true },
      { id:'premi', title:'Premi', href:CONFIG.premiLink, image:CONFIG.extraCardImages.premi, description:'Riscatta', visible:false, requiresAuth:true },
      { id:'profilo', title:'Profilo', href:CONFIG.profiloLink, image:CONFIG.extraCardImages.profilo, description:'I tuoi dati', visible:false, requiresAuth:true }
    ].filter(item => item.visible);
  }

  function cardTitleMarkup(title) {
    return String(title || '').replace(' di ', '<br>di ').replace(' Beauty', '<br>Beauty');
  }

  function buildCard(section) {
    const classes = ['mobile-preview-card'];
    const href = section.requiresAuth ? '#' : section.href;
    const attrs = section.requiresAuth
      ? ` href="#" class="${classes.concat('private-card-link').join(' ')}" data-private-target="${section.href}"`
      : ` href="${href}" class="${classes.join(' ')}"`;
    const lock = section.requiresAuth ? '<span class="mobile-preview-lock">🔒</span>' : '';
    return `<a${attrs}>${lock}
      <img src="${section.image}" onerror="this.onerror=null;this.src='images/promo.jpg'" alt="${section.title}">
      <div class="mobile-preview-card-content">
        <h3 class="mobile-preview-card-title">${cardTitleMarkup(section.title)}</h3>
        <p class="mobile-preview-card-text">${section.description || ''}</p>
      </div>
    </a>`;
  }

  function renderManagedMobileCards() {
    if (!sliderTrack) return;
    const visibleSections = getManagedSections();
    const pages = [];
    for (let i = 0; i < visibleSections.length; i += 4) {
      const chunk = visibleSections.slice(i, i + 4);
      pages.push(`<div class="mobile-preview-slider-page"><div class="mobile-preview-grid">${chunk.map(buildCard).join('')}</div></div>`);
    }
    sliderTrack.innerHTML = pages.join('');
    if (dotsWrap) {
      const count = Math.max(1, pages.length);
      dotsWrap.innerHTML = Array.from({ length: count }, (_, i) => `<span class="mobile-preview-dot${i===0 ? ' active' : ''}"></span>`).join('');
    }
    const privateLinksNow = document.querySelectorAll('.private-card-link');
    privateLinksNow.forEach((link) => {
      link.addEventListener('click', async function (e) {
        e.preventDefault();
        const target = this.getAttribute('data-private-target') || CONFIG.profiloLink;
        await waitForAuthReady();
        if (firebaseSession.user) {
          window.location.href = target;
          return;
        }
        openPrivateModal(target);
      });
    });
    refreshPrivateCardsState();
  }

  if (sliderTrack) {
    sliderTrack.addEventListener("scroll", () => {
      const pageIndex = Math.round(sliderTrack.scrollLeft / sliderTrack.offsetWidth);
      sliderDots.forEach((dot, index) => {
        dot.classList.toggle("active", index === pageIndex);
      });
    });
  }

  const privateModal = document.getElementById("privateAccessModal");
  const privateModalClose = document.getElementById("privateAccessClose");
  let privateLinks = document.querySelectorAll(".private-card-link");
  const privateLoginBtn = document.querySelector(".private-access-btn-login");
  const privateRegisterBtn = document.querySelector(".private-access-btn-register");
  let pendingPrivateTarget = CONFIG.profiloLink;

  function refreshPrivateCardsState() {
    privateLinks = document.querySelectorAll(".private-card-link");
    privateLinks.forEach((link) => {
      link.classList.toggle("is-unlocked", !!firebaseSession.user);
    });
  }
  window.__refreshPrivateCardsState = refreshPrivateCardsState;
  refreshPrivateCardsState();

  function openPrivateModal(target) {
    if (!privateModal) return;
    pendingPrivateTarget = target || CONFIG.profiloLink;

   if (privateLoginBtn) {
  privateLoginBtn.href = CONFIG.loginLink;
}

if (privateRegisterBtn) {
  privateRegisterBtn.href = CONFIG.registerLink;
}

    privateModal.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closePrivateModal() {
    if (!privateModal) return;
    privateModal.classList.remove("open");
    document.body.style.overflow = "";
  }

  async function waitForAuthReady() {
    if (firebaseSession.ready) return;
    await new Promise((resolve) => {
      const timer = setInterval(() => {
        if (firebaseSession.ready) {
          clearInterval(timer);
          resolve();
        }
      }, 50);
    });
  }

  if (privateModalClose) {
    privateModalClose.addEventListener("click", closePrivateModal);
  }

  if (privateModal) {
    privateModal.addEventListener("click", function (e) {
      if (e.target === privateModal) {
        closePrivateModal();
      }
    });
  }

  (function setupMobileHeroSlider() {
    const slides = Array.from(document.querySelectorAll('.mobile-preview-hero-slide'));
    if (!slides.length) return;
    let current = 0;
    setInterval(function() {
      slides[current].classList.remove('is-active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('is-active');
    }, 4200);
  })();

  (function setupMobileMiaBubble() {
    const hero = document.getElementById('mobilePreviewHero');
    const bubble = document.getElementById('mobilePreviewBubble');
    const title = document.getElementById('mobilePreviewBubbleTitle');
    const subtitle = document.getElementById('mobilePreviewBubbleSubtitle');
    if (!hero || !bubble || !title || !subtitle) return;

    function getUser() {
      return firebaseSession.user || null;
    }

    function getFirstName() {
      const user = getUser();
      const raw = user && user.displayName ? String(user.displayName).trim() : '';
      return raw ? raw.split(/\s+/)[0] : '';
    }

    function isLogged() {
      return !!getUser();
    }

    window.__refreshMiaBubble = function() {
      const firstName = getFirstName();
      const logged = isLogged();
      const seenInitialNow = sessionStorage.getItem('mobileMiaSeenInitial') === 'true';
      if (seenInitialNow) {
        title.textContent = logged ? `${firstName || 'Cliente'}` : 'Mia';
        subtitle.innerHTML = logged
          ? 'Resto a tua disposizione per qualsiasi esigenza'
          : 'Resto a disposizione per informazioni, servizi e prenotazioni';
      } else {
        title.textContent = logged ? `Buongiorno ${firstName || 'Cliente'}` : 'Buongiorno';
        subtitle.innerHTML = 'Sono Mia. Posso aiutarti con servizi, prenotazioni e informazioni della farmacia';
      }
    }

    const seenInitial = sessionStorage.getItem('mobileMiaSeenInitial') === 'true';
    let hideTimer = null;

    function renderMessage(kind) {
      const firstName = getFirstName();
      const logged = isLogged();

      if (kind === 'return') {
        title.textContent = logged ? `${firstName}` : 'Mia';
        subtitle.innerHTML = logged
          ? 'Resto a tua disposizione per qualsiasi esigenza'
          : 'Resto a disposizione per informazioni, servizi e prenotazioni';
      } else {
        title.textContent = logged ? `Buongiorno ${firstName}` : 'Buongiorno';
        subtitle.innerHTML = logged
          ? 'Sono Mia. Posso aiutarti con servizi, prenotazioni e informazioni della farmacia'
          : 'Sono Mia. Posso aiutarti con servizi, prenotazioni e informazioni della farmacia';
      }
    }

    function showBubble(kind) {
      clearTimeout(hideTimer);
      renderMessage(kind);
      bubble.style.opacity = '1';
      bubble.style.transform = 'translateY(0) scale(1)';
      hideTimer = setTimeout(() => {
        bubble.style.opacity = '0';
        bubble.style.transform = 'translateY(8px) scale(.98)';
      }, 5000);
    }

    bubble.style.transition = 'opacity .28s ease, transform .28s ease';
    bubble.style.opacity = '0';
    bubble.style.transform = 'translateY(8px) scale(.98)';

    setTimeout(() => {
      showBubble(seenInitial ? 'return' : 'intro');
      sessionStorage.setItem('mobileMiaSeenInitial', 'true');
    }, 650);

    hero.addEventListener('click', function() {
      sessionStorage.setItem('mobileMiaReturnPending', 'true');
    });

    window.addEventListener('pageshow', function() {
      if (sessionStorage.getItem('mobileMiaReturnPending') === 'true') {
        sessionStorage.removeItem('mobileMiaReturnPending');
        setTimeout(() => showBubble('return'), 500);
      }
    });

    document.addEventListener('visibilitychange', function() {
      if (!document.hidden && sessionStorage.getItem('mobileMiaReturnPending') === 'true') {
        sessionStorage.removeItem('mobileMiaReturnPending');
        setTimeout(() => showBubble('return'), 300);
      }
    });
  })();

  (function updateOpeningStatus() {
    const dot = document.getElementById("mobilePreviewStatusDot");
    const label = document.getElementById("mobilePreviewStatusLabel");
    const detail = document.getElementById("mobilePreviewStatusDetail");
    if (!dot || !label || !detail) return;

    const now = new Date();
    const day = now.getDay();
    const minutes = now.getHours() * 60 + now.getMinutes();

    let isOpen = false;
    let message = "Riapriamo domani";

    if (day >= 1 && day <= 5) {
      const morningOpen = 8 * 60 + 30;
      const morningClose = 13 * 60;
      const afternoonOpen = 16 * 60;
      const afternoonClose = 20 * 60;

      if (minutes >= morningOpen && minutes < morningClose) {
        isOpen = true;
        message = "Chiudiamo alle 13:00";
      } else if (minutes >= afternoonOpen && minutes < afternoonClose) {
        isOpen = true;
        message = "Chiudiamo alle 20:00";
      } else if (minutes >= morningClose && minutes < afternoonOpen) {
        message = "Riapriamo oggi alle 16:00";
      } else if (minutes < morningOpen) {
        message = "Apriamo oggi alle 8:30";
      } else {
        message = "Riapriamo domani alle 8:30";
      }
    } else if (day === 6) {
      const saturdayOpen = 8 * 60 + 30;
      const saturdayClose = 13 * 60;

      if (minutes >= saturdayOpen && minutes < saturdayClose) {
        isOpen = true;
        message = "Chiudiamo alle 13:00";
      } else if (minutes < saturdayOpen) {
        message = "Apriamo oggi alle 8:30";
      } else {
        message = "Riapriamo lunedì alle 8:30";
      }
    } else {
      message = "Riapriamo lunedì alle 8:30";
    }

    label.textContent = isOpen ? "Siamo aperti" : "Siamo chiusi";
    detail.textContent = `${message} • ${message} • `;

    if (isOpen) {
      dot.style.background = "#2aa06f";
      dot.style.boxShadow = "0 0 0 6px rgba(42,160,111,0.10)";
    } else {
      dot.style.background = "#db6b6b";
      dot.style.boxShadow = "0 0 0 6px rgba(219,107,107,0.10)";
    }
  })();
})();

(function(){
  function preloadLockedCards(){
    ["images/fidelity.jpg","images/fortuna.jpg","images/premi.jpg","images/profilo.jpg"].forEach(function(src){
      var i=new Image();
      i.decoding='async';
      i.loading='eager';
      i.src=src;
    });
  }
  window.addEventListener("load", preloadLockedCards);
})();
