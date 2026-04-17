(function () {
  const isLogged = localStorage.getItem("farmaciaLoggedIn");
  const user = localStorage.getItem("farmaciaCurrentUser");

  if (isLogged !== "true" || !user) {
    window.location.href = "login.html";
  }
})();
