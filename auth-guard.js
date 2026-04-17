import { auth, firestore, onAuthStateChanged, doc, getDoc, signOut } from './firebase.js';

function getLoginUrl(redirect = 'login.html') {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  const search = window.location.search || '';
  const hash = window.location.hash || '';
  const target = `${current}${search}${hash}`;
  const joiner = redirect.includes('?') ? '&' : '?';
  return `${redirect}${joiner}redirect=${encodeURIComponent(target)}`;
}

export function waitForAuth() {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      resolve(user || null);
    });
  });
}

export async function getUserProfile(uid) {
  if (!uid) return null;
  try {
    const snap = await getDoc(doc(firestore, 'users', uid));
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    console.error('Errore lettura profilo utente:', error);
    return null;
  }
}

export async function requireAuth(options = {}) {
  const { redirect = 'login.html', allow = null } = options;
  const user = await waitForAuth();
  if (!user) {
    window.location.replace(getLoginUrl(redirect));
    return null;
  }
  if (typeof allow === 'function') {
    const profile = await getUserProfile(user.uid);
    const ok = await allow(user, profile);
    if (!ok) {
      await signOut(auth).catch(() => {});
      window.location.replace(getLoginUrl(redirect));
      return null;
    }
    window.__FM_USER__ = user;
    window.__FM_PROFILE__ = profile;
    return { user, profile };
  }
  window.__FM_USER__ = user;
  return { user, profile: null };
}

export async function redirectIfAuthenticated(target = 'index.html') {
  const user = await waitForAuth();
  if (user) {
    window.location.replace(target);
    return true;
  }
  return false;
}
