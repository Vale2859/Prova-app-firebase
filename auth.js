(function () {
  import('./auth-guard.js')
    .then(({ requireAuth }) => requireAuth({ redirect: 'login.html' }))
    .catch((error) => {
      console.error('Errore controllo accesso:', error);
      window.location.replace('login.html');
    });
})();
