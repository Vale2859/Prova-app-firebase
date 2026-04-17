export const HOME_SECTIONS_DEFAULTS = [
  { id:'servizi', title:'Servizi', href:'servizi.html', image:'images/servizi.jpg', description:'Scopri i servizi attivi', visibilityLabel:'Servizi', requiresAuth:false },
  { id:'promo', title:'Promo', href:'promo.html', image:'images/promo.jpg', description:'Offerte del momento', visibilityLabel:'Promo', requiresAuth:false },
  { id:'giornate', title:'Giornate Beauty', href:'giornate.html', image:'images/beauty.jpg', description:'Eventi benessere', visibilityLabel:'Giornate', requiresAuth:false },
  { id:'turni', title:'Farmacia di turno', href:'turno.html', image:'images/turno.jpg', description:'Trova la farmacia aperta', visibilityLabel:'Turni', requiresAuth:false },
  { id:'fidelity', title:'Fidelity', href:'fidelity.html', image:'images/fidelity.jpg', description:'Card e vantaggi', visibilityLabel:'Fidelity', requiresAuth:true },
  { id:'fortuna', title:'Fortuna', href:'fortuna.html', image:'images/fortuna.jpg', description:'Gioca oggi', visibilityLabel:'Fortuna', requiresAuth:true },
  { id:'premi', title:'Premi', href:'premi.html', image:'images/premi.jpg', description:'Riscatta i premi', visibilityLabel:'Premi', requiresAuth:true },
  { id:'profilo', title:'Profilo', href:'profilo.html', image:'images/profilo.jpg', description:'I tuoi dati', visibilityLabel:'Profilo', requiresAuth:true }
];

export const HOME_SECTIONS_DOC = { collection:'app_settings', id:'home_cards' };

export function normalizeHomeSections(rawSections) {
  const map = new Map(HOME_SECTIONS_DEFAULTS.map((item, index) => [item.id, {
    ...item,
    visible: index < 4,
    order: index + 1,
    badge: ''
  }]));

  if (Array.isArray(rawSections)) {
    rawSections.forEach((item, index) => {
      if (!item || !map.has(item.id)) return;
      const base = map.get(item.id);
      map.set(item.id, {
        ...base,
        visible: typeof item.visible === 'boolean' ? item.visible : base.visible,
        order: Number.isFinite(Number(item.order)) ? Number(item.order) : (index + 1),
        badge: typeof item.badge === 'string' ? item.badge : ''
      });
    });
  }

  return Array.from(map.values())
    .sort((a,b) => (Number(a.order)||999) - (Number(b.order)||999) || a.title.localeCompare(b.title, 'it'))
    .map((item, index) => ({ ...item, order: index + 1 }));
}

export function visibleHomeSections(sections) {
  return normalizeHomeSections(sections).filter(item => item.visible);
}
