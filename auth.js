
(function () {
  const localLogin = localStorage.getItem("farmaciaLoggedIn");
  const localUser = localStorage.getItem("farmaciaCurrentUser");

  if (localLogin === "true" && localUser) {
    return;
  }

  if (sessionStorage.getItem("farmaciaSkipLegacyAuth") === "true") {
    return;
  }

  const path = window.location.pathname || "";
  const current = path.split("/").pop() || "index.html";
  window.location.href = "login.html?redirect=" + encodeURIComponent(current);
})();
