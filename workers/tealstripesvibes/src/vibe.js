// Teal Stripes Vibes, the pure part: the facets, the seeds, the filters, the
// grammar of an address, the masked and filtered vibe, its hour, and how it is
// painted (a stripe gradient, grain, the shader, a preview card). No secrets,
// so the same code runs in the worker (site-hub-next until the host's route
// moves, then this unit's /m/ and /stamp/ routes) and in the reader's browser
// (assets/vibe.js, which carry.mjs copies this beside). The hold's two lines
// come from workers/lib/hold.js; from this file that import is /lib/hold.js
// in the browser. Moved here from site-hub-next/src/tealstripes.js on 2026-11-16.

import { holdLines, holdTurn } from "../../lib/hold.js";

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
  euclid: "space the stripes as a Euclidean rhythm",
  golden: "Fibonacci widths at the golden angle",
  moire: "a second stripe a hair off the first, so they interfere",
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

/**
 * The six facets as the card shows them: each lit when it comes from the seed
 * and dim when the teal ground stands in, with the address that switches it
 * (`mask` is that address's letters) and words for a hand about to tap it.
 */
export function facetChips(seed, mask, filters) {
  return FACETS.map((f) => {
    const on = mask.includes(f.letter);
    const switched = FACETS.filter((g) => (g === f ? !on : mask.includes(g.letter))).map((g) => g.letter).join("");
    return {
      letter: f.letter,
      name: f.name,
      on,
      mask: switched,
      href: canonicalPath({ seed, mask: switched, filters }),
      title: on ? `${f.name} from ${seed}; tap for the teal ground's` : `${f.name} from the teal ground; tap for ${seed}'s`,
    };
  });
}

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
    if (f === "euclid") out.rhythm = euclidRhythm(EUCLID.k, EUCLID.n);
    if (f === "golden") {
      out.rhythm = [1, 1, 2, 3, 5, 8, 13].map((w) => w * 2);
      out.angle = 137.5;
    }
    if (f === "moire") out.moire = { turn: 2.5, stretch: 1.04 };
  }
  return out;
}

/* ── the algorithms ──────────────────────────────────────── */

/** The Euclidean rhythm the euclid filter uses unless a hand tunes it: five beats in eight steps, the cinquillo. */
export const EUCLID = Object.freeze({ k: 5, n: 8, step: 3 });

/**
 * Bjorklund's algorithm: k onsets spread as evenly as they can go over n
 * steps (E(3,8) is the tresillo, x..x..x.), the way a drummer, a neutron
 * accelerator's timing system and a leap-year calendar all spread them.
 */
export function bjorklund(k, n) {
  if (k <= 0) return Array(n).fill(0);
  if (k >= n) return Array(n).fill(1);
  let groups = [...Array(k).fill(null).map(() => [1]), ...Array(n - k).fill(null).map(() => [0])];
  while (true) {
    const heads = groups.filter((g) => g === groups[0] || JSON.stringify(g) === JSON.stringify(groups[0]));
    const tails = groups.slice(heads.length);
    if (tails.length <= 1) break;
    const pairs = Math.min(heads.length, tails.length);
    groups = [...Array(pairs).fill(null).map((_, i) => [...heads[i], ...tails[i]]), ...heads.slice(pairs), ...tails.slice(pairs)];
  }
  return groups.flat();
}

/** A Euclidean rhythm as stripe widths: each onset starts a stripe that runs to the next. */
export function euclidRhythm(k, n, step = EUCLID.step) {
  const pattern = bjorklund(k, n);
  const widths = [];
  for (const beat of pattern) {
    if (beat || !widths.length) widths.push(step);
    else widths[widths.length - 1] += step;
  }
  return widths;
}

/* ── tuning by hand ──────────────────────────────────────── */

/** What a hand may tune, each held to a range, kept in the address so a link is still the picture. */
export const TUNING = Object.freeze({
  angle: { min: 0, max: 180, step: 1 },
  drift: { min: 0, max: 3, step: 0.1 },
  breath: { min: 0, max: 60, step: 1 },
  grain: { min: 0, max: 0.5, step: 0.01 },
  turn: { min: 0, max: 2, step: 1 },
  beats: { min: 1, max: 15, step: 1 },
  steps: { min: 2, max: 16, step: 1 },
});

const held = (key, value) => {
  const { min, max, step } = TUNING[key];
  const n = Math.min(max, Math.max(min, Number(value)));
  return Math.round(n / step) * step === 0 ? 0 : Number((Math.round(n / step) * step).toFixed(2));
};

const HEX6 = /^[0-9a-f]{6}$/i;

/** A palette or a rhythm an address carries, as palette=062a2b-0f766e-a7f3d0 and rhythm=14-3-8-3; null when it does not read. */
export function readList(key, raw) {
  const parts = String(raw ?? "").split(/[-.,]/).filter(Boolean);
  if (key === "palette") return parts.length >= 2 && parts.length <= 4 && parts.every((p) => HEX6.test(p)) ? parts.map((p) => `#${p.toLowerCase()}`) : null;
  if (key === "rhythm") return parts.length >= 1 && parts.length <= 12 && parts.every((p) => /^\d{1,2}$/.test(p) && Number(p) >= 1 && Number(p) <= 40) ? parts.map(Number) : null;
  return null;
}

/** The tuning an address carries: only the keys it names that read as numbers, and a palette or rhythm that reads whole. */
export function readTuning(params) {
  const out = {};
  for (const key of ["palette", "rhythm"]) {
    const list = params.has(key) ? readList(key, params.get(key)) : null;
    if (list) out[key] = list;
  }
  for (const key of Object.keys(TUNING)) {
    if (!params.has(key)) continue;
    const n = Number.parseFloat(params.get(key));
    if (Number.isFinite(n)) out[key] = held(key, n);
  }
  if (out.beats !== undefined && out.steps !== undefined && out.beats > out.steps) out.beats = out.steps;
  return out;
}

/** A tuning as the query that reads back as it. */
export const tuningQuery = (tuning) => [
  ...(tuning.palette ? [`palette=${tuning.palette.map((c) => c.slice(1)).join("-")}`] : []),
  ...(tuning.rhythm ? [`rhythm=${tuning.rhythm.join("-")}`] : []),
  ...Object.keys(TUNING).filter((key) => tuning[key] !== undefined).map((key) => `${key}=${tuning[key]}`),
].join("&");

/** A caption, as the address may carry one: plain characters, no more than sixty. */
export const captionOf = (raw) => String(raw ?? "").replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 60);

/** A vibe with a hand's tuning on it: the angle, the motion, the grain, the palette turned, and a Euclidean rhythm of its own. */
export function tune(v, tuning = {}) {
  const out = { ...v, palette: [...v.palette], rhythm: [...v.rhythm], motion: { ...v.motion }, grain: { ...v.grain } };
  if (tuning.angle !== undefined) out.angle = tuning.angle;
  if (tuning.drift !== undefined) out.motion.drift = tuning.drift;
  if (tuning.breath !== undefined) out.motion.breath = tuning.breath;
  if (tuning.grain !== undefined) out.grain.amount = tuning.grain;
  for (let i = 0; i < (tuning.turn ?? 0); i += 1) out.palette.push(out.palette.shift());
  if (tuning.beats !== undefined || tuning.steps !== undefined) {
    const n = tuning.steps ?? EUCLID.n;
    out.rhythm = euclidRhythm(Math.min(n, tuning.beats ?? EUCLID.k), n);
  }
  // A palette or rhythm a hand kept stands over the seed's, and turns as the seed's would.
  if (tuning.palette) {
    out.palette = [...tuning.palette];
    for (let i = 0; i < (tuning.turn ?? 0); i += 1) out.palette.push(out.palette.shift());
  }
  if (tuning.rhythm) out.rhythm = [...tuning.rhythm];
  return out;
}

/* ── scanning a slot ─────────────────────────────────────── */

/** The parts of a tuple a hand can hold, in the order the expression says them. */
export const SLOTS = Object.freeze(["seed", "palette", "rhythm", "angle", "drift", "breath", "grain"]);

/** A palette turned around the colour wheel, its lightness kept: a sibling of itself. */
export function turnHue(palette, degrees) {
  return palette.map((c) => {
    const [h, s, l] = rgbToHsl(hexToRgb(c));
    return hslToHex([(((h * 360 + degrees) % 360) + 360) % 360 / 360, s, l]);
  });
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const unique = (list) => list.filter((item, i) => list.findIndex((other) => same(other, item)) === i);

/**
 * What a held slot can become, in the order a scan walks it: the values the
 * other seeds use, borrowed as factshift.center borrows a slot from the other
 * lines, then the family of the value it holds (a palette's hue turns, the
 * Euclidean rhythms, a number's steps). The current value is always among them.
 */
export function choicesFor(slot, v) {
  const seeds = Object.values(SEEDS);
  if (slot === "palette") return unique([v.palette, ...seeds.map((s) => s.palette), GROUND.palette, ...[30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((d) => turnHue(v.palette, d))]);
  if (slot === "rhythm") {
    const euclids = [];
    for (let n = 5; n <= 13; n += 1) for (let k = 2; k <= n - 2; k += 1) euclids.push(euclidRhythm(k, n));
    return unique([v.rhythm, ...seeds.map((s) => s.rhythm), GROUND.rhythm, [2, 2, 4, 6, 10, 16, 26], ...euclids]);
  }
  const steps = { angle: [0, 15, 30, 45, 60, 64, 75, 90, 105, 112, 120, 135, 137.5, 150, 165], drift: [0, 0.2, 0.4, 0.6, 0.9, 1.2, 1.8, 2.4], breath: [0, 4, 8, 13, 21, 26, 34], grain: [0, 0.04, 0.06, 0.08, 0.12, 0.18, 0.25, 0.35] }[slot];
  const now = { angle: v.angle, drift: v.motion.drift, breath: v.motion.breath, grain: v.grain.amount }[slot];
  return [...new Set([...steps, now])].sort((a, b) => a - b);
}

/** The value a vibe holds in a slot. */
export const valueOf = (slot, v) => ({ palette: v.palette, rhythm: v.rhythm, angle: v.angle, drift: v.motion.drift, breath: v.motion.breath, grain: v.grain.amount })[slot];

/** A slot's value as the tuning that keeps it. */
export const tuningFor = (slot, value) => (slot === "palette" || slot === "rhythm" ? { [slot]: value, ...(slot === "palette" ? { turn: undefined } : { beats: undefined, steps: undefined }) } : { [slot]: value });

/** A slot's value as the expression writes it. */
export function said(slot, value) {
  if (slot === "palette") return value.join(" ");
  if (slot === "rhythm") return value.join(" ");
  return String(value);
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
uniform float u_moire, u_turn, u_stretch;
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
  if (u_moire > 0.5) {
    // A second band, a hair turned and stretched: where the two disagree, the difference shows.
    float a2 = radians(u_angle + u_turn);
    float x2 = dot(p, vec2(sin(a2), cos(a2))) / breath - u_time * u_drift * 18.0;
    float t2 = mod(x2 - u_offset, u_period * u_stretch);
    float acc2 = 0.0; vec3 col2 = u_c0;
    for (int i = 0; i < 8; i++) {
      if (float(i) >= u_n) break;
      float w2 = u_w[i] * u_stretch;
      if (t2 >= acc2 && t2 < acc2 + w2) { col2 = pal(float(i)); }
      acc2 += w2;
    }
    col = mix(col, abs(col - col2), 0.4);
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
  // Moiré: the same stripes a hair turned and stretched, laid over by difference, so the two interfere in slow waves.
  const moire = v.moire ? `.field::after { content: ""; position: absolute; inset: -12%; background: ${stripeGradient({ ...v, angle: v.angle + v.moire.turn }, 4 * v.moire.stretch).css}; mix-blend-mode: difference; opacity: 0.4; }` : "";
  return `body { background: ${v.palette[0]}; }
.field { background: ${grainUri(v)}, ${css}; background-size: 220px 220px, auto; }
@media (prefers-reduced-motion: no-preference) { .field { animation: drift ${v.motion.drift ? (8 / v.motion.drift).toFixed(2) : 0}s linear infinite; } }
${drift}${moire ? `\n${moire}` : ""}`;
}

/**
 * An address read as a page, the way the worker reads one: "/" is this hour
 * (and becomes /@hour), /@date[Thh] is that moment's seed, /seed[/mask[/filters]]
 * or /?seed=&mask=&filter= is a vibe, and anything else is not a vibe. A page
 * the assets layer served from a file (/harbor.html) reads as its address.
 */
export function readAddress(pathname, search, now) {
  const params = new URLSearchParams(search);
  // Cloudflare's assets send /@lock on to /%40lock, so an address is read as it was written.
  let written = String(pathname || "/");
  try {
    written = decodeURIComponent(written);
  } catch {
    // A malformed escape is read as it stands.
  }
  const path = written.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
  if (path === "/" && !params.has("seed")) return { kind: "root", redirect: `/@${hourOf(now)}` };
  // /@lock is the vibe mutex.buzz's lock holds; the page reads the lock to paint it.
  if (path === LOCK.path || path === `${LOCK.path}/`) return { kind: "lock-pending" };
  const moment = path.match(/^\/@(\d{4}-\d{2}-\d{2})(?:T(\d{2}))?\/?$/);
  if (moment) {
    if (Number.isNaN(Date.parse(`${moment[1]}T00:00:00Z`))) return { kind: "unknown" };
    const bucket = moment[2] ? `${moment[1]}T${moment[2]}` : moment[1];
    return { kind: "moment", seed: seedForMoment(bucket), mask: ALL, filters: [], hour: moment[2] ? bucket : `${moment[1]}T00`, ...tuned(params), href: `https://${HOST}/@${bucket}${queryOf(params)}` };
  }
  let parts;
  if (path === "/" && params.has("seed")) parts = { seed: params.get("seed"), mask: parseMask(params.get("mask")), filters: parseFilters(params.get("filter")) };
  else {
    const segs = path.split("/").filter(Boolean);
    if (!segs.length || segs.length > 3) return { kind: "unknown" };
    parts = { seed: segs[0], mask: parseMask(segs[1]), filters: parseFilters(segs[2]) };
  }
  if (!Object.hasOwn(SEEDS, parts.seed) || parts.mask === null || parts.filters === null) return { kind: "unknown" };
  return { kind: "vibe", ...parts, hour: hourOf(now), ...tuned(params), href: `https://${HOST}${canonicalPath(parts)}${queryOf(params)}` };
}

/** What a hand added to an address: its tuning and its caption. */
const tuned = (params) => ({ tuning: readTuning(params), say: captionOf(params.get("say")) });

/** The tuning and caption as the query that keeps them. */
function queryOf(params) {
  const { tuning, say } = tuned(params);
  const query = [tuningQuery(tuning), say ? `say=${encodeURIComponent(say)}` : ""].filter(Boolean).join("&");
  return query ? `?${query}` : "";
}

/* ── the lock's vibe ─────────────────────────────────────── */

/** Where the lock is kept, and the address on this host that shows what it holds. */
export const LOCK = Object.freeze({ schedule: "https://mutex.buzz/now.json", home: "https://mutex.buzz/", path: "/@lock" });

/** The hold open at a moment, from mutex.buzz's schedule (mutex.schedule.v1); null when it has none. */
export const holdAt = (holds, now) => holds.find((h) => Date.parse(h.since) <= now && now < Date.parse(h.releasesAt)) ?? null;

/**
 * The vibe the lock holds: one seed for the whole hold, chosen by its holder,
 * that fills in as the hold runs. On its first hour the frame is the ground's
 * teal stripes; each hour more of the seed comes through, facet by facet in
 * their order (palette, rhythm, angle, motion, grain, plate), and on its last
 * hour the seed is whole. At the close the next hold starts over from the ground.
 */
export function lockVibe(hold, now) {
  const { index, of } = holdTurn(hold, now);
  const names = Object.keys(SEEDS);
  const seed = names[fnv(hold.title) % names.length];
  const through = Math.min(FACETS.length, Math.floor((index / Math.max(1, of - 1)) * FACETS.length));
  const mask = FACETS.slice(0, through).map((f) => f.letter).join("");
  return {
    kind: "lock",
    seed,
    mask,
    filters: [],
    hour: hourOf(new Date(now)),
    href: `https://${HOST}${LOCK.path}`,
    tuning: {},
    say: "",
    hold,
    turn: index + 1,
    of,
    lines: holdLines(hold, now),
  };
}
