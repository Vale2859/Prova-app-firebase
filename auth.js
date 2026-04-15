(function () {
  const isLogged = localStorage.getItem("farmaciaLoggedIn") === "true";
  const user = localStorage.getItem("farmaciaCurrentUser");
  if (!isLogged || !user) {
    const redirect = encodeURIComponent(location.pathname.split('/').pop() || 'index.html');
    window.location.href = `login.html?redirect=${redirect}`;
  }
})();
