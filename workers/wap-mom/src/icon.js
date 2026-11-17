// wap.mom's app icons: the favicon's π, drawn in shapes (a bar, a straight
// leg, and a leg with a small foot) in ink on the paper, at the sizes an
// installed app asks for. A maskable icon draws the π smaller, inside the
// middle of the square where every launcher's mask leaves it whole.
import { rgbOf, squarePng } from "../../lib/png.js";

const PAPER = rgbOf("#f4efe4");
const INK = rgbOf("#1c1916");

/** Whether a point, as a share of the square (0 to 1 across and down), is inside the π: a bar with a serif drop, a leg that tails left, a leg that turns out. */
function inPi(u, v) {
  const bar = u >= 0.2 && u <= 0.8 && v >= 0.29 && v <= 0.355;
  const drop = u >= 0.2 && u <= 0.255 && v >= 0.29 && v <= 0.4;
  const left = u >= 0.355 && u <= 0.43 && v >= 0.33 && v <= 0.735;
  const tail = u >= 0.315 && u <= 0.43 && v >= 0.69 && v <= 0.735;
  const right = u >= 0.57 && u <= 0.645 && v >= 0.33 && v <= 0.735;
  const turn = u >= 0.57 && u <= 0.74 && v >= 0.69 && v <= 0.735;
  return bar || drop || left || tail || right || turn;
}

/** The icon at a size; `scale` draws the π smaller for a maskable icon. */
export function iconPng(size, { scale = 1 } = {}) {
  return squarePng(size, (x, y) => {
    const u = 0.5 + (x / size - 0.5) / scale;
    const v = 0.5 + (y / size - 0.5) / scale;
    return inPi(u, v) ? INK : PAPER;
  });
}

/** The icons an installed wap.mom uses, by file name. */
export const ICONS = Object.freeze({
  "icon-192.png": { size: 192 },
  "icon-512.png": { size: 512 },
  "icon-maskable-512.png": { size: 512, scale: 0.78, purpose: "maskable" },
  "apple-touch-icon.png": { size: 180 },
});
