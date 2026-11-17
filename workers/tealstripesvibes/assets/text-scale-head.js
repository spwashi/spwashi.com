// Before the page paints: the text step a device kept (text-scale.js) goes on <html>, so nothing moves when the rest arrives.
(() => {
  try {
    const step = localStorage.getItem("set.text-scale/1");
    if (["70", "80", "90", "110", "120"].includes(step)) document.documentElement.setAttribute("data-text-scale", step);
  } catch {
    // Storage refused: the page opens at 100%.
  }
})();
