
export async function registerMontesanoNotifications() {
  if (!('serviceWorker' in navigator) || !('Notification' in window)) {
    return { ok: false, reason: 'Notifiche non supportate su questo dispositivo.' };
  }
  const registration = await navigator.serviceWorker.register('./sw.js');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { ok: false, reason: 'Permesso notifiche non concesso.' };
  }
  return { ok: true, registration };
}
