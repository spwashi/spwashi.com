// The set's ring: a small ring in a corner of each page in the set, a dot for
// each site, the one you are on lit. Opened, each site says in a line what you
// would carry there from here (the vibe as a shot, the shot as stripes, the
// lock as a line on the canvas), and its link carries it; going, your dot runs
// round the ring to the site before the page leaves. Each unit's carry copies
// this file and set-ring.css into its assets byte for byte; each page passes
// what it carries (mountSetRing). The tables below are checked against their
// sources (workers/attention-productions/test/set-ring.test.mjs).

/** The set, in the order the ring draws it. */
export const SET = Object.freeze([
  { host: "attention.productions", name: "Attention Productions", colour: "#c8ff00" },
  { host: "mutex.buzz", name: "mutex.buzz", colour: "#ffc53d" },
  { host: "tealstripesvibes.com", name: "Teal Stripes Vibes", colour: "#14b8a6" },
  { host: "factshift.center", name: "factshift.center", colour: "#e7d7f2" },
  { host: "spw.quest", name: "spw.quest", colour: "#9ad7ff" },
  { host: "wap.mom", name: "wap.mom", colour: "#f4efe4" },
  { host: "texture.website", name: "texture.website", colour: "#d9b38c" },
]);

/** attention.productions' lights, by their key colour (its src/vocabulary.js SHAPES.light). */
export const LIGHTS = Object.freeze({ "golden hour": "#f4b45c", overcast: "#c9d0d8", lamplight: "#ffb36b", "window light": "#f2efe6", "sodium night": "#ff9930", neon: "#ff5ad9", candlelight: "#ffce78" });

/** Teal Stripes Vibes' seeds, by their middle colour and mood (its src/vibe.js SEEDS). */
export const SEEDS = Object.freeze({ harbor: { accent: "#0f766e", mood: "harbor at dusk" }, ledger: { accent: "#2dd4bf", mood: "ink on a ledger line" }, lantern: { accent: "#f5b041", mood: "a lamp through teal glass" } });

const rgb = (hex) => [1, 3, 5].map((i) => Number.parseInt(String(hex).slice(i, i + 2), 16));
const distance = (a, b) => { const [x, y] = [rgb(a), rgb(b)]; return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]); };
const nearest = (hex, table, pick = (v) => v) => Object.entries(table).reduce((best, [key, value]) => (distance(hex, pick(value)) < best[1] ? [key, distance(hex, pick(value))] : best), ["", Infinity])[0];

/** The attention.productions light nearest a colour. */
export const nearestLight = (hex) => nearest(hex, LIGHTS);
/** The Teal Stripes Vibes seed nearest a colour. */
export const nearestSeed = (hex) => nearest(hex, SEEDS, (s) => s.accent);
/** Text as base64url, the form spw.quest and factshift.center read from a link's #spw64= fragment. */
export function spw64(text) {
  let binary = "";
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Words as an address path: lower case, hyphens for spaces. */
export const slug = (text) => String(text ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

const SVG = "http://www.w3.org/2000/svg";
const R = 15;
const at = (i) => { const a = (i / SET.length) * Math.PI * 2 - Math.PI / 2; return [22 + R * Math.cos(a), 22 + R * Math.sin(a)]; };

/**
 * Mount the ring on a page. `here` is this site's host; `carry()` returns, for
 * the other hosts it can carry to, { href, says }; a host it leaves out is a
 * plain way there. It is asked when the ring opens, so it carries what is on
 * the page now. `corner` puts it at the bottom left (the default) or the top
 * left, where a page keeps something of its own in the bottom corners.
 */
export function mountSetRing(here, carry = () => ({}), { corner = "bottom" } = {}) {
  if (document.getElementById("set-ring")) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const box = document.createElement("div");
  box.className = `set-ring ${corner === "top" ? "top" : "bottom"}`;
  box.id = "set-ring";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "set-ring-button";
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", "set-ring-list");
  button.title = "The set: carry this to another site";
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", "0 0 44 44");
  svg.setAttribute("aria-hidden", "true");
  const track = document.createElementNS(SVG, "circle");
  for (const [k, v] of Object.entries({ cx: 22, cy: 22, r: R, class: "set-ring-track" })) track.setAttribute(k, String(v));
  svg.append(track);
  const dots = SET.map((site, i) => {
    const [x, y] = at(i);
    const dot = document.createElementNS(SVG, "circle");
    for (const [k, v] of Object.entries({ cx: x.toFixed(1), cy: y.toFixed(1), r: site.host === here ? 4.2 : 2.6, class: `set-ring-dot${site.host === here ? " here" : ""}` })) dot.setAttribute(k, String(v));
    dot.style.setProperty("--dot", site.colour);
    svg.append(dot);
    return dot;
  });
  const traveller = document.createElementNS(SVG, "circle");
  traveller.setAttribute("r", "3.4");
  traveller.setAttribute("class", "set-ring-traveller");
  traveller.style.opacity = "0";
  svg.append(traveller);
  const label = document.createElement("span");
  label.className = "set-ring-label";
  label.textContent = "the set";
  button.append(svg, label);
  const list = document.createElement("nav");
  list.className = "set-ring-list";
  list.id = "set-ring-list";
  list.setAttribute("aria-label", "The set");
  list.hidden = true;
  box.append(list, button);
  document.body.append(box);

  const draw = () => {
    const carried = carry() ?? {};
    list.replaceChildren();
    const ul = document.createElement("ul");
    SET.forEach((site, i) => {
      if (site.host === here) return;
      const way = carried[site.host] ?? { href: `https://${site.host}/`, says: "" };
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = way.href;
      a.dataset.index = String(i);
      const dot = document.createElement("span");
      dot.className = "set-ring-swatch";
      dot.style.setProperty("--dot", site.colour);
      const name = document.createElement("strong");
      name.textContent = site.name;
      a.append(dot, name);
      if (way.says) {
        const says = document.createElement("span");
        says.className = "set-ring-says";
        says.textContent = way.says;
        a.append(says);
      }
      a.addEventListener("pointerenter", () => dots[i].classList.add("toward"));
      a.addEventListener("pointerleave", () => dots[i].classList.remove("toward"));
      a.addEventListener("focus", () => dots[i].classList.add("toward"));
      a.addEventListener("blur", () => dots[i].classList.remove("toward"));
      a.addEventListener("click", (event) => {
        if (reduce || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        // Your dot runs round the ring to the site, then the page goes.
        event.preventDefault();
        const from = SET.findIndex((s) => s.host === here);
        const steps = ((i - from + SET.length) % SET.length) || SET.length;
        const start = performance.now();
        traveller.style.opacity = "1";
        const run = (t) => {
          const k = Math.min(1, (t - start) / 420);
          const [x, y] = at(from + steps * (1 - (1 - k) ** 2));
          traveller.setAttribute("cx", x.toFixed(1));
          traveller.setAttribute("cy", y.toFixed(1));
          if (k < 1) requestAnimationFrame(run);
          else window.location.assign(a.href);
        };
        requestAnimationFrame(run);
      });
      li.append(a);
      ul.append(li);
    });
    list.append(ul);
  };

  const open = (yes) => {
    if (yes) draw();
    list.hidden = !yes;
    button.setAttribute("aria-expanded", String(yes));
    box.classList.toggle("open", yes);
    if (yes) list.querySelector("a")?.focus({ preventScroll: true });
  };
  button.addEventListener("click", () => open(list.hidden));
  box.addEventListener("keydown", (event) => { if (event.key === "Escape" && !list.hidden) { event.stopPropagation(); open(false); button.focus(); } });
  document.addEventListener("pointerdown", (event) => { if (!list.hidden && !box.contains(event.target)) open(false); });
}
