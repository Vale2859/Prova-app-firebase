(function () {
  function applySeasonBackground() {
    const month = new Date().getMonth() + 1;
    const body = document.body;

    if (!body) return;

    body.classList.remove(
      "season-primavera",
      "season-estate",
      "season-autunno",
      "season-inverno"
    );

    if (month === 12 || month === 1 || month === 2) {
      body.classList.add("season-inverno");
    } else if (month >= 3 && month <= 5) {
      body.classList.add("season-primavera");
    } else if (month >= 6 && month <= 8) {
      body.classList.add("season-estate");
    } else {
      body.classList.add("season-autunno");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applySeasonBackground);
  } else {
    applySeasonBackground();
  }
})();
