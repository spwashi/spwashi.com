// Teal Stripes Vibes, the pure part: the facets, the seeds, the filters, the
// grammar of an address, the masked and filtered vibe, its hour, and how it is
// painted (a stripe gradient, grain, the shader, a preview card). No imports
// and no secrets, so the same code runs in the worker (site-hub-next until the
// host's route moves, then this unit's /m/ and /stamp/ routes) and in the
// reader's browser (assets/tealstripes.js, which carry.mjs copies this beside).
// Moved here from site-hub-next/src/tealstripes.js on 2026-11-16, unchanged.

const escapeHtml = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export const HOST = "tealstripesvibes.com";

/** Facets in canonical order, with the URL letter and the Spw operator that names each. */
// Workbench relation: extension. Visual facets for six sigils.
export const FACETS = Object.freeze([
  { name: "palette", letter: "p", sigil: "*" },
  { name: "rhythm", letter: "r", sigil: "#" },
  { name: "angle", letter: "a", sigil: "@" },
  { name: "motion", letter: "m", sigil: "~" },
  { name: "grain", letter: "g", sigil: "." },
  { name: "plate", letter: "s", sigil: "$" },
]);
export const ALL = FACETS.map((f) => f.letter).join("");

/** The canonical teal stripes: what a masked-out facet falls back to. */
export const GROUND = Object.freeze({
  name: "ground",
  mood: "teal stripes",
  palette: ["#0b3b3a", "#14b8a6", "#e6fffb"],
  rhythm: [10, 10],
  angle: 90,
  motion: { drift: 0.4, breath: 0 },
  grain: { amount: 0.06, kind: "paper" },
  plate: null,
});

/**
 * DRAFT seeds for the creator to recolor, rename, or replace. Rhythm values
 * are stripe widths in units of 4px, cycling through the palette.
 */
export const SEEDS = Object.freeze({
  harbor: {
    name: "harbor",
    mood: "harbor at dusk",
    palette: ["#062a2b", "#0f766e", "#a7f3d0"],
    rhythm: [14, 3, 8, 3],
    angle: 112,
    motion: { drift: 0.6, breath: 13 },
    grain: { amount: 0.12, kind: "salt" },
    plate: null,
  },
  ledger: {
    name: "ledger",
    mood: "ink on a ledger line",
    palette: ["#0b1f24", "#2dd4bf", "#f5efe0"],
    rhythm: [2, 11, 2, 23],
    angle: 90,
    motion: { drift: 0.2, breath: 26 },
    grain: { amount: 0.18, kind: "paper" },
    plate: null,
  },
  lantern: {
    name: "lantern",
    mood: "a lamp through teal glass",
    palette: ["#11302c", "#f5b041", "#5eead4"],
    rhythm: [18, 3, 6, 2],
    angle: 64,
    motion: { drift: 0.9, breath: 8 },
    grain: { amount: 0.08, kind: "bloom" },
    plate: null,
  },
});

export const FILTERS = Object.freeze({
  night: "shift toward dark",
  hush: "stop motion",
  mono: "keep one hue",
});

/* ── grammar ─────────────────────────────────────────────── */

const SIGIL_TO_LETTER = Object.fromEntries(FACETS.map((f) => [f.sigil, f.letter]));

/** "*#", "%23*", "pr", "-" → canonical letters in facet order ("" means brand only). null when invalid. */
export function parseMask(raw) {
  if (raw == null || raw === "") return ALL;
  let text;
  try { text = decodeURIComponent(String(raw)); } catch { return null; }
  if (text === "-") return "";
  const seen = new Set();
  for (const ch of text) {
    const letter = SIGIL_TO_LETTER[ch] || (ALL.includes(ch) ? ch : null);
    if (!letter) return null;
    seen.add(letter);
  }
  return FACETS.map((f) => f.letter).filter((l) => seen.has(l)).join("");
}

/** "night,hush" or "night+hush" → ["night", "hush"]; null when a word is unknown. */
export function parseFilters(raw) {
  if (raw == null || raw === "" || raw === "-") return [];
  let text;
  try { text = decodeURIComponent(String(raw)); } catch { return null; }
  const words = text.split(/[,+ ]/).filter(Boolean);
  return words.every((w) => Object.hasOwn(FILTERS, w)) ? words : null;
}

export const maskLabel = (mask) => (mask === "" ? "-" : mask);
export const filterLabel = (filters) => (filters.length ? filters.join(",") : "-");

export function canonicalPath({ seed, mask, filters }) {
  let path = `/${seed}`;
  if (mask !== ALL || filters.length) path += `/${maskLabel(mask)}`;
  if (filters.length) path += `/${filters.join(",")}`;
  return path;
}

/* ── color ───────────────────────────────────────────────── */

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const rgbToHex = (rgb) => `#${rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")}`;
const mix = (a, b, t) => rgbToHex(hexToRgb(a).map((v, i) => v + (hexToRgb(b)[i] - v) * t));

function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}

function hslToHex([h, s, l]) {
  const f = (n) => {
    const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l);
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return rgbToHex([f(0) * 255, f(8) * 255, f(4) * 255]);
}

/* ── the filtered seed ───────────────────────────────────── */

/** Mask the seed onto the ground, then run the filters in order. */
export function vibe(seedName, mask, filters) {
  const seed = SEEDS[seedName];
  if (!seed) return null;
  const pass = (letter) => mask.includes(letter);
  const out = {
    palette: [...(pass("p") ? seed.palette : GROUND.palette)],
    rhythm: [...(pass("r") ? seed.rhythm : GROUND.rhythm)],
    angle: pass("a") ? seed.angle : GROUND.angle,
    motion: { ...(pass("m") ? seed.motion : GROUND.motion) },
    grain: { ...(pass("g") ? seed.grain : GROUND.grain) },
    plate: pass("s") ? seed.plate : GROUND.plate,
  };
  for (const f of filters) {
    if (f === "night") out.palette = out.palette.map((c, i) => mix(c, "#02070a", i === 1 ? 0.35 : 0.62));
    if (f === "hush") out.motion = { drift: 0, breath: 0 };
    if (f === "mono") {
      const [h, s] = rgbToHsl(hexToRgb(out.palette[1]));
      out.palette = out.palette.map((c) => hslToHex([h, s, rgbToHsl(hexToRgb(c))[2]]));
    }
  }
  return out;
}

export const TUPLE_NAMES = ["palette", "rhythm", "angle", "drift", "breath", "grain", "grainKind", "plate"];

export function tupleOf(v) {
  return [v.palette, v.rhythm, v.angle, v.motion.drift, v.motion.breath, v.grain.amount, v.grain.kind, v.plate];
}

export function expressionOf(seed, mask, filters, v) {
  const inner = [maskLabel(mask), ...filters].join(",");
  const t = [v.palette.join(" "), v.rhythm.join(" "), v.angle, `${v.motion.drift} ${v.motion.breath}`, `${v.grain.amount} ${v.grain.kind}`, v.plate || "-"];
  return `^vibe[${seed}]{${inner}}<${t.join("|")}>`;
}

/* ── time ────────────────────────────────────────────────── */

const pad = (n) => String(n).padStart(2, "0");
export const hourOf = (date) => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}`;
export const hourStart = (hour) => new Date(`${hour}:00:00Z`);
export const nextHour = (hour) => hourOf(new Date(hourStart(hour).getTime() + 3600e3));

function fnv(text) {
  let h = 0x811c9dc5;
  for (const ch of text) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return h;
}

/** A moment picks a seed by hashing its bucket, so the same hour always shows the same vibe. */
export function seedForMoment(bucket) {
  const names = Object.keys(SEEDS);
  return names[fnv(bucket) % names.length];
}


export function stripeGradient(v, unit = 4) {
  const stops = [];
  let at = 0;
  v.rhythm.forEach((w, i) => {
    const c = v.palette[i % v.palette.length];
    stops.push(`${c} ${at * unit}px`, `${c} ${(at + w) * unit}px`);
    at += w;
  });
  return { css: `repeating-linear-gradient(${v.angle}deg, ${stops.join(", ")})`, period: at * unit };
}

export const grainUri = (v) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='${v.grain.kind === "salt" ? 1.1 : v.grain.kind === "bloom" ? 0.45 : 0.8}' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 ${Math.min(0.5, v.grain.amount * 2.2)} 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`)}")`;

export const SHADER = `
precision mediump float;
uniform vec2 u_res; uniform float u_time, u_angle, u_drift, u_breath, u_grain, u_period, u_offset;
uniform vec3 u_c0, u_c1, u_c2; uniform float u_w[8]; uniform float u_n;
float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
vec3 pal(float i){ float k = mod(i, 3.0); return k < 0.5 ? u_c0 : (k < 1.5 ? u_c1 : u_c2); }
void main(){
  vec2 p = gl_FragCoord.xy;
  float a = radians(u_angle);
  float breath = u_breath > 0.0 ? 1.0 + 0.035 * sin(6.2831 * u_time / u_breath) : 1.0;
  // CSS angles point clockwise from up; in GL (y up) that direction is (sin a, cos a).
  float x = dot(p, vec2(sin(a), cos(a))) / breath - u_time * u_drift * 18.0;
  float t = mod(x - u_offset, u_period);
  float acc = 0.0; vec3 col = u_c0;
  for (int i = 0; i < 8; i++) {
    if (float(i) >= u_n) break;
    float w = u_w[i];
    if (t >= acc && t < acc + w) { col = pal(float(i)); }
    acc += w;
  }
  float g = (h(p + floor(u_time * 12.0)) - 0.5) * u_grain;
  gl_FragColor = vec4(col + g, 1.0);
}`;


export function ogSvg(seed, mask, v) {
  let at = 0;
  const rects = v.rhythm.map((w, i) => {
    const r = `<rect x="${at * 4}" y="0" width="${w * 4}" height="4000" fill="${v.palette[i % 3]}"/>`;
    at += w;
    return r;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><pattern id="s" width="${at * 4}" height="4000" patternUnits="userSpaceOnUse" patternTransform="rotate(${v.angle - 90})">${rects}</pattern></defs>
  <rect width="1200" height="630" fill="${v.palette[0]}"/><rect width="1200" height="630" fill="url(#s)"/>
  <rect x="760" y="440" width="400" height="150" rx="18" fill="rgba(4,14,16,.66)"/>
  <text x="788" y="500" font-family="ui-sans-serif, system-ui, sans-serif" font-size="40" font-weight="700" fill="#f4fbfa">${escapeHtml(seed)}</text>
  <text x="788" y="545" font-family="ui-monospace, monospace" font-size="22" fill="#cfe9e5">${escapeHtml(`mask ${maskLabel(mask)} · tealstripesvibes.com`)}</text>
</svg>`;
}

/** The per-vibe styles: the page's ground, the striped field with its grain, and the drift. */
export function vibeCss(v) {
  const { css, period } = stripeGradient(v);
  const drift = v.motion.drift ? `@keyframes drift { to { background-position: ${period}px 0, 0 0; } }` : "";
  return `body { background: ${v.palette[0]}; }
.field { background: ${grainUri(v)}, ${css}; background-size: 220px 220px, auto; }
@media (prefers-reduced-motion: no-preference) { .field { animation: drift ${v.motion.drift ? (8 / v.motion.drift).toFixed(2) : 0}s linear infinite; } }
${drift}`;
}

/**
 * An address read as a page, the way the worker reads one: "/" is this hour
 * (and becomes /@hour), /@date[Thh] is that moment's seed, /seed[/mask[/filters]]
 * or /?seed=&mask=&filter= is a vibe, and anything else is not a vibe. A page
 * the assets layer served from a file (/harbor.html) reads as its address.
 */
export function readAddress(pathname, search, now) {
  const params = new URLSearchParams(search);
  const path = String(pathname || "/").replace(/\/index\.html$/, "/").replace(/\.html$/, "");
  if (path === "/" && !params.has("seed")) return { kind: "root", redirect: `/@${hourOf(now)}` };
  const moment = path.match(/^\/@(\d{4}-\d{2}-\d{2})(?:T(\d{2}))?\/?$/);
  if (moment) {
    if (Number.isNaN(Date.parse(`${moment[1]}T00:00:00Z`))) return { kind: "unknown" };
    const bucket = moment[2] ? `${moment[1]}T${moment[2]}` : moment[1];
    return { kind: "moment", seed: seedForMoment(bucket), mask: ALL, filters: [], hour: moment[2] ? bucket : `${moment[1]}T00`, href: `https://${HOST}/@${bucket}` };
  }
  let parts;
  if (path === "/" && params.has("seed")) parts = { seed: params.get("seed"), mask: parseMask(params.get("mask")), filters: parseFilters(params.get("filter")) };
  else {
    const segs = path.split("/").filter(Boolean);
    if (!segs.length || segs.length > 3) return { kind: "unknown" };
    parts = { seed: segs[0], mask: parseMask(segs[1]), filters: parseFilters(segs[2]) };
  }
  if (!Object.hasOwn(SEEDS, parts.seed) || parts.mask === null || parts.filters === null) return { kind: "unknown" };
  return { kind: "vibe", ...parts, hour: hourOf(now), href: `https://${HOST}${canonicalPath(parts)}` };
}
