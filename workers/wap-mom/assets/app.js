(() => {
  if ("serviceWorker" in navigator && window.top === window) navigator.serviceWorker.register("/sw.js").catch(() => {});
  const keep = document.getElementById("keep-app");
  if (!keep) return;
  let offer = null;
  addEventListener("beforeinstallprompt", (event) => { event.preventDefault(); offer = event; keep.hidden = false; });
  keep.addEventListener("click", async () => {
    if (!offer) return;
    offer.prompt();
    await offer.userChoice.catch(() => null);
    offer = null;
    keep.hidden = true;
  });
  addEventListener("appinstalled", () => { keep.hidden = true; });
})();
