// Before first paint, on the lock's own page. A reader who has looked before
// (mutex.js keeps the last look in this browser and nowhere else) sees the
// lock and this moment first, with the explanation folded; the page is laid
// out that way from its first frame, so nothing moves. Scripts on is marked
// too, so the lines the page script fills keep their room. Written by hand.
(() => {
  const root = document.documentElement;
  root.classList.add("js");
  try {
    if (localStorage.getItem("mutex.buzz:seen")) root.classList.add("return");
  } catch {
    // Storage refused: every visit reads as the first.
  }
})();
