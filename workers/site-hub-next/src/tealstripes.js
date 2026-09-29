/**
 * tealstripesvibes.com — a proof card you can link to.
 *
 * A seed is authored: a named look (palette, stripe rhythm, angle, motion,
 * grain, an optional photo plate). A mask is a filter over the seed: each
 * facet it lets through comes from the seed; every other facet falls back to
 * the canonical teal stripes. Word filters then transform what passed, left
 * to right. The same address always paints the same picture, so a link is
 * the artwork and a screenshot carries its own receipt.
 *
 *   /                          302 to this hour: /@2026-10-13T21
 *   /@2026-10-13T21            the hour's vibe (a seed picked by the hour)
 *   /harbor                    a seed, every facet
 *   /harbor/pr                 palette and rhythm through; the rest is brand
 *   /harbor/pr/night,hush      then filters, in order
 *   /?seed=harbor&mask=*%23&filter=night   the same, as a query
 *   /tuple?seed=harbor&mask=pr             the filtered seed as data
 *   /m/harbor.pr.night.<exp>.<sig>         a signed mask that closes at <exp>
 *   /stamp/<code>?seed=&mask=&hour=        the bouncer's check
 *   /og/harbor/pr.svg                      a preview image
 *
 * Signing uses env.TSV_SIGNING_KEY (a Worker secret). Without it, signed
 * routes answer 503 and cards say "unsigned".
 */
import { escapeHtml } from "../../lib/shell.js";

export const HOST = "tealstripesvibes.com";

/** Facets in canonical order, with the URL letter and the Spw operator that names each. */
export const FACETS = Object.freeze([
  { name: "palette", letter: "p", sigil: "*" },
  { name: "rhythm", letter: "r", sigil: "#" },
  { name: "angle", letter: "a", sigil: "@" },
  { name: "motion", letter: "m", sigil: "~" },
  { name: "grain", letter: "g", sigil: "." },
  { name: "plate", letter: "s", sigil: "$" },
]);
const ALL = FACETS.map((f) => f.letter).join("");

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

const maskLabel = (mask) => (mask === "" ? "-" : mask);
const filterLabel = (filters) => (filters.length ? filters.join(",") : "-");

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
const hourStart = (hour) => new Date(`${hour}:00:00Z`);
const nextHour = (hour) => hourOf(new Date(hourStart(hour).getTime() + 3600e3));

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

/* ── crypto ──────────────────────────────────────────────── */

const enc = new TextEncoder();
const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const toB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const CROCKFORD = "0123456789abcdefghjkmnpqrstvwxyz";
const toBase32 = (buf) => [...new Uint8Array(buf)].map((b) => CROCKFORD[b & 31]).join("");

async function hmac(key, message) {
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", k, enc.encode(message));
}

export async function signMask(key, seed, mask, filters, exp) {
  return toHex(await hmac(key, `${seed}.${maskLabel(mask)}.${filterLabel(filters)}.${exp}`)).slice(0, 8);
}

export async function stampFor(key, hour, seed, mask) {
  return toBase32(await hmac(key, `${hour}|${seed}|${maskLabel(mask)}`)).slice(0, 5);
}

const sha256 = (text) => crypto.subtle.digest("SHA-256", enc.encode(text));

/* ── responses ───────────────────────────────────────────── */

const SECURITY = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
};

function page(body, { status = 200, nonce, headers = {} } = {}) {
  return new Response(body, {
    status,
    headers: {
      ...SECURITY,
      "Content-Type": "text/html; charset=UTF-8",
      "Content-Security-Policy": `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; img-src data: https://spwashi.com; base-uri 'none'; form-action 'none'; frame-ancestors 'self' https://attention.productions https://mutex.buzz`,
      "X-Robots-Tag": "index, follow",
      ...headers,
    },
  });
}

function plain(text, status, headers = {}) {
  return new Response(`${text}\n`, {
    status,
    headers: { ...SECURITY, "Content-Type": "text/plain; charset=UTF-8", "Cache-Control": "no-store", ...headers },
  });
}

const etagFor = async (text) => `"${toHex(await sha256(text)).slice(0, 20)}"`;

async function tupleResponse(request, entries) {
  const accept = request.headers.get("accept") || "";
  const lines = entries.map((e) => e.expression);
  const wantsText = /text\/plain/.test(accept) && !/application\/json/.test(accept);
  const body = wantsText
    ? `${lines.join("\n")}\n`
    : `${JSON.stringify(entries.length === 1 ? entries[0] : { schema: "tealstripes.tuples.v1", tuples: entries }, null, 2)}\n`;
  const etag = await etagFor(lines.join("\n"));
  const headers = {
    ...SECURITY,
    "Access-Control-Allow-Origin": "*",
    "Content-Type": wantsText ? "text/plain; charset=UTF-8" : "application/json; charset=UTF-8",
    "Cache-Control": "public, max-age=86400",
    ETag: etag,
    Vary: "Accept",
    "Content-Digest": `sha-256=:${toB64(await sha256(body))}:`,
    Link: '<https://tealstripesvibes.com/>; rel="describedby"',
  };
  if ((request.headers.get("if-none-match") || "").split(/\s*,\s*/).includes(etag)) {
    return new Response(null, { status: 304, headers });
  }
  return new Response(body, { headers });
}

function entryFor(seed, mask, filters) {
  const v = vibe(seed, mask, filters);
  return {
    seed,
    mood: SEEDS[seed].mood,
    mask: maskLabel(mask),
    filters,
    names: TUPLE_NAMES,
    tuple: tupleOf(v),
    expression: expressionOf(seed, mask, filters, v),
    href: `https://${HOST}${canonicalPath({ seed, mask, filters })}`,
  };
}

/* ── the painted page ────────────────────────────────────── */

function stripeGradient(v, unit = 4) {
  const stops = [];
  let at = 0;
  v.rhythm.forEach((w, i) => {
    const c = v.palette[i % v.palette.length];
    stops.push(`${c} ${at * unit}px`, `${c} ${(at + w) * unit}px`);
    at += w;
  });
  return { css: `repeating-linear-gradient(${v.angle}deg, ${stops.join(", ")})`, period: at * unit };
}

const grainUri = (v) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='${v.grain.kind === "salt" ? 1.1 : v.grain.kind === "bloom" ? 0.45 : 0.8}' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 ${Math.min(0.5, v.grain.amount * 2.2)} 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`)}")`;

const SHADER = `
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

/** Page script, written as text (not fn.toString) so bundling cannot rename helpers. */
const PAGE_SCRIPT = `
(() => {
  const root = document.documentElement;
  const status = document.getElementById('status');
  const say = (m) => { if (status) { status.textContent = ''; setTimeout(() => { status.textContent = m; }, 40); } };
  const grammar = document.getElementById('grammar');
  const card = document.getElementById('card');
  addEventListener('keydown', async (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || /input|textarea/i.test(e.target.tagName)) return;
    if (e.key === '?') { grammar.open = !grammar.open; }
    if (e.key === 's') { card.toggleAttribute('data-stamp-large'); say(card.hasAttribute('data-stamp-large') ? 'Stamp shown large.' : 'Stamp back in the card.'); }
    if (e.key === 'c') {
      try { await navigator.clipboard.writeText(card.dataset.href); say('Link copied.'); }
      catch { say('Copy failed. The link is in the card.'); }
    }
  });
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.getElementById('gl');
  const gl = canvas && canvas.getContext('webgl', { antialias: false, preserveDrawingBuffer: true });
  if (!gl) return;
  const v = JSON.parse(document.getElementById('vibe').textContent);
  const src = document.getElementById('shader').textContent;
  const sh = (type, text) => { const s = gl.createShader(type); gl.shaderSource(s, text); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
  const vs = sh(gl.VERTEX_SHADER, 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }');
  const fs = sh(gl.FRAGMENT_SHADER, src);
  if (!vs || !fs) return;
  const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = (n) => gl.getUniformLocation(prog, n);
  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const dpr = Math.min(2, devicePixelRatio || 1);
  const widths = v.rhythm.slice(0, 8).map((w) => w * 4 * dpr);
  while (widths.length < 8) widths.push(0);
  const resize = () => {
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr; gl.viewport(0, 0, canvas.width, canvas.height);
    // Start where the CSS gradient starts, so the shader lands on the same stripes it replaces.
    const a = v.angle * Math.PI / 180, w = canvas.width, h = canvas.height;
    const len = Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a));
    gl.uniform1f(u('u_offset'), (w / 2) * Math.sin(a) + (h / 2) * Math.cos(a) - len / 2);
  };
  resize(); addEventListener('resize', resize);
  gl.uniform3fv(u('u_c0'), rgb(v.palette[0])); gl.uniform3fv(u('u_c1'), rgb(v.palette[1])); gl.uniform3fv(u('u_c2'), rgb(v.palette[2]));
  gl.uniform1fv(u('u_w'), widths); gl.uniform1f(u('u_n'), Math.min(8, v.rhythm.length));
  gl.uniform1f(u('u_period'), widths.reduce((a, b) => a + b, 0));
  gl.uniform1f(u('u_angle'), v.angle); gl.uniform1f(u('u_grain'), v.grain.amount * 0.5);
  gl.uniform1f(u('u_drift'), reduce ? 0 : v.motion.drift * dpr); gl.uniform1f(u('u_breath'), reduce ? 0 : v.motion.breath);
  const frame = (ms) => {
    gl.uniform1f(u('u_time'), ms / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (!reduce && !document.hidden) requestAnimationFrame(frame);
  };
  requestAnimationFrame((ms) => { frame(ms); root.dataset.gl = 'on'; });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !reduce) requestAnimationFrame(frame); });
})();`;

function renderVibe({ seed, mask, filters, v, hour, stamp, stampHref, href, status = "", closed = null }) {
  const nonce = crypto.randomUUID().replaceAll("-", "");
  const { css, period } = stripeGradient(v);
  const expression = expressionOf(seed, mask, filters, v);
  const facetRows = FACETS.map((f) => `<li class="${mask.includes(f.letter) ? "on" : "off"}"><code>${escapeHtml(f.sigil)}</code><code>${f.letter}</code> ${f.name}</li>`).join("");
  const drift = v.motion.drift ? `@keyframes drift { to { background-position: ${period}px 0, 0 0; } }` : "";
  const body = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${escapeHtml(`${seed} · ${maskLabel(mask)}${filters.length ? ` · ${filters.join(",")}` : ""} — Teal Stripes Vibes`)}</title>
<meta name="description" content="${escapeHtml(`${SEEDS[seed].mood}. ${expression}`)}">
<link rel="canonical" href="${escapeHtml(href)}">
<meta property="og:title" content="${escapeHtml(`Teal Stripes Vibes — ${seed}`)}">
<meta property="og:description" content="${escapeHtml(SEEDS[seed].mood)}">
<meta property="og:image" content="${escapeHtml(`https://${HOST}/og/${seed}/${maskLabel(mask)}.svg`)}">
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='7' fill='${v.palette[0]}'/><path d='M6 26 26 6M-2 18 18-2M14 34 34 14' stroke='${v.palette[1]}' stroke-width='5'/></svg>`)}">
<style>
  :root { color-scheme: dark; --ink: #f4fbfa; --muted: rgba(244,251,250,.72); --glass: rgba(4,14,16,.62); --line: rgba(230,255,251,.22); }
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; }
  body { background: ${v.palette[0]}; color: var(--ink); font: 15px/1.45 ui-sans-serif, system-ui, -apple-system, sans-serif; overflow: hidden; }
  .field { position: fixed; inset: 0; background: ${grainUri(v)}, ${css}; background-size: 220px 220px, auto; }
  @media (prefers-reduced-motion: no-preference) { .field { animation: drift ${v.motion.drift ? (8 / v.motion.drift).toFixed(2) : 0}s linear infinite; } }
  ${drift}
  #gl { position: fixed; inset: 0; width: 100%; height: 100%; opacity: 0; transition: opacity .6s ease; }
  :root[data-gl="on"] #gl { opacity: 1; }
  .card { position: fixed; right: max(16px, env(safe-area-inset-right)); bottom: max(16px, env(safe-area-inset-bottom)); width: min(22rem, calc(100vw - 32px)); padding: 14px 16px 12px; border: 1px solid var(--line); border-radius: 14px; background: var(--glass); backdrop-filter: blur(14px) saturate(1.2); -webkit-backdrop-filter: blur(14px) saturate(1.2); box-shadow: 0 18px 50px rgba(0,0,0,.35); }
  .card h1 { margin: 0; font-size: 1.35rem; letter-spacing: -.02em; line-height: 1.1; }
  .card .mood { margin: 2px 0 10px; color: var(--muted); }
  .card dl { display: grid; grid-template-columns: auto 1fr; gap: 3px 12px; margin: 0; font: 12.5px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; }
  .card dt { color: var(--muted); }
  .card dd { margin: 0; overflow-wrap: anywhere; }
  .card .stamp { font-weight: 700; letter-spacing: .12em; }
  .card[data-stamp-large] .stamp { position: fixed; inset: 0; display: grid; place-items: center; font-size: clamp(4rem, 22vw, 14rem); background: rgba(2,8,10,.72); letter-spacing: .08em; }
  .card .expr { margin: 10px 0 0; padding-top: 8px; border-top: 1px solid var(--line); font: 11.5px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--muted); overflow-wrap: anywhere; }
  .card nav { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-top: 8px; font-size: 13px; }
  .card a { color: var(--ink); text-underline-offset: 3px; }
  .card a:focus-visible, summary:focus-visible { outline: 2px solid var(--ink); outline-offset: 3px; border-radius: 4px; }
  .status { margin: 8px 0 0; font-size: 13px; color: var(--ink); }
  details { margin-top: 8px; font-size: 13px; }
  summary { cursor: pointer; color: var(--muted); min-height: 24px; }
  details ul { list-style: none; margin: 6px 0; padding: 0; display: grid; grid-template-columns: repeat(3, auto); gap: 2px 10px; }
  details li code { margin-right: 4px; }
  details li.off { opacity: .45; }
  details p { margin: 6px 0 0; color: var(--muted); font: 11.5px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; }
  .closed { position: fixed; left: max(16px, env(safe-area-inset-left)); top: max(16px, env(safe-area-inset-top)); max-width: min(28rem, calc(100vw - 32px)); padding: 12px 14px; border-radius: 12px; background: var(--glass); border: 1px solid var(--line); }
  .closed h2 { margin: 0 0 4px; font-size: 1rem; }
  .closed p { margin: 0; color: var(--muted); }
  .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  @media (max-width: 30rem) { .card { left: 16px; right: 16px; width: auto; } }
</style>
</head>
<body>
<div class="field" role="img" aria-label="${escapeHtml(`${SEEDS[seed].mood}: stripes of ${v.palette.join(", ")} at ${v.angle} degrees`)}"></div>
<canvas id="gl" aria-hidden="true"></canvas>
${closed ? `<section class="closed" aria-labelledby="closed-title"><h2 id="closed-title">This mask has closed</h2><p>${escapeHtml(closed)}</p></section>` : ""}
<main class="card" id="card" data-href="${escapeHtml(href)}" aria-label="Proof card">
  <h1>${escapeHtml(seed)}</h1>
  <p class="mood">${escapeHtml(SEEDS[seed].mood)}</p>
  <dl>
    <dt>mask</dt><dd>${escapeHtml(maskLabel(mask))}${filters.length ? ` · ${escapeHtml(filters.join(", "))}` : ""}</dd>
    <dt>hour</dt><dd>${escapeHtml(hour)}Z</dd>
    <dt>stamp</dt><dd>${stamp ? `<a class="stamp" href="${escapeHtml(stampHref)}">${escapeHtml(stamp)}</a>` : "unsigned"}</dd>
  </dl>
  <p class="expr">${escapeHtml(expression)}</p>
  <nav aria-label="This vibe">
    <a href="${escapeHtml(`/tuple?seed=${seed}&mask=${maskLabel(mask)}${filters.length ? `&filter=${filters.join(",")}` : ""}`)}">tuple</a>
    <a href="${escapeHtml(href)}">link</a>
    <a href="${escapeHtml(`/og/${seed}/${maskLabel(mask)}.svg`)}">preview</a>
  </nav>
  <details id="grammar">
    <summary>Read the address <kbd>?</kbd></summary>
    <ul>${facetRows}</ul>
    <p>/seed/mask/filters · mask letters or sigils · filters: ${Object.keys(FILTERS).join(", ")} · <kbd>s</kbd> stamp · <kbd>c</kbd> copy</p>
  </details>
  <p class="status" id="status" role="status" aria-live="polite">${escapeHtml(status)}</p>
</main>
<script type="application/json" id="vibe">${JSON.stringify(v).replaceAll("<", "\\u003c")}</script>
<script type="x-shader/x-fragment" id="shader">${SHADER}</script>
<script nonce="${nonce}">${PAGE_SCRIPT}</script>
</body>
</html>`;
  return { body, nonce };
}

/* ── OG preview ──────────────────────────────────────────── */

function ogSvg(seed, mask, v) {
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

/* ── routing ─────────────────────────────────────────────── */

const nowFrom = (env) => (env && env.NOW ? new Date(env.NOW) : new Date());

async function renderResponse(request, env, { seed, mask, filters }, extra = {}) {
  const t0 = Date.now();
  const now = nowFrom(env);
  const hour = extra.hour || hourOf(now);
  const key = env && env.TSV_SIGNING_KEY;
  const v = vibe(seed, mask, filters);
  const stamp = key ? await stampFor(key, hour, seed, mask) : null;
  const stampHref = stamp ? `/stamp/${stamp}?seed=${seed}&mask=${maskLabel(mask)}&hour=${hour}` : "";
  const href = extra.href || `https://${HOST}${canonicalPath({ seed, mask, filters })}`;
  const { body, nonce } = renderVibe({ seed, mask, filters, v, hour, stamp, stampHref, href, closed: extra.closed, status: extra.status });
  const etag = await etagFor(body.replace(/nonce-?[a-f0-9]{32}|nonce="[a-f0-9]{32}"/g, ""));
  const headers = {
    "Cache-Control": extra.cache || "public, max-age=300",
    Link: `<${href}>; rel="canonical"${extra.link ? `, ${extra.link}` : ""}`,
    "Server-Timing": `vibe;dur=${Date.now() - t0};desc="${seed} ${maskLabel(mask)}"`,
    ETag: etag,
    ...(extra.headers || {}),
  };
  if (!extra.status && (request.headers.get("if-none-match") || "") === etag) {
    return new Response(null, { status: 304, headers: { ...SECURITY, ...headers } });
  }
  return page(body, { status: extra.statusCode || 200, nonce, headers });
}

function parseRequestParts(url) {
  const q = url.searchParams;
  if (url.pathname === "/" && q.has("seed")) {
    return { seed: q.get("seed"), mask: parseMask(q.get("mask")), filters: parseFilters(q.get("filter")) };
  }
  const segs = url.pathname.split("/").filter(Boolean);
  if (!segs.length || segs.length > 3) return null;
  let json = false;
  const last = segs.length - 1;
  if (segs[last].endsWith(".json")) { json = true; segs[last] = segs[last].slice(0, -5); }
  return { seed: segs[0], mask: parseMask(segs[1]), filters: parseFilters(segs[2]), json };
}

export async function handleTealstripes(request, env = {}) {
  if (!["GET", "HEAD"].includes(request.method)) return plain("Method not allowed", 405, { Allow: "GET, HEAD" });
  const url = new URL(request.url);
  const res = await route(request, env, url);
  return request.method === "HEAD" ? new Response(null, { status: res.status, headers: res.headers }) : res;
}

async function route(request, env, url) {
  const now = nowFrom(env);
  const key = env && env.TSV_SIGNING_KEY;
  const path = url.pathname;

  if (path === "/robots.txt") return plain("User-agent: *\nAllow: /", 200, { "Cache-Control": "public, max-age=86400" });

  if (path === "/" && !url.searchParams.has("seed")) {
    return new Response(null, { status: 302, headers: { ...SECURITY, Location: `/@${hourOf(now)}`, "Cache-Control": "no-store" } });
  }

  const moment = path.match(/^\/@(\d{4}-\d{2}-\d{2})(?:T(\d{2}))?\/?$/);
  if (moment) {
    const bucket = moment[2] ? `${moment[1]}T${moment[2]}` : moment[1];
    if (Number.isNaN(Date.parse(`${moment[1]}T00:00:00Z`))) return plain("Not a date", 404);
    const seed = seedForMoment(bucket);
    const hour = moment[2] ? bucket : `${moment[1]}T00`;
    return renderResponse(request, env, { seed, mask: ALL, filters: [] }, {
      href: `https://${HOST}/@${bucket}`,
      hour,
      cache: "public, max-age=3600",
      link: `<https://${HOST}${canonicalPath({ seed, mask: ALL, filters: [] })}>; rel="alternate"`,
    });
  }

  if (path === "/tuple") {
    const seeds = url.searchParams.getAll("seed");
    const mask = parseMask(url.searchParams.get("mask"));
    const filters = parseFilters(url.searchParams.get("filter"));
    if (!seeds.length || mask === null || filters === null || seeds.some((s) => !SEEDS[s])) {
      return plain(`Unknown seed, mask, or filter. Seeds: ${Object.keys(SEEDS).join(", ")}. Mask letters: ${ALL}. Filters: ${Object.keys(FILTERS).join(", ")}.`, 400);
    }
    return tupleResponse(request, seeds.map((s) => entryFor(s, mask, filters)));
  }

  const og = path.match(/^\/og\/([a-z]+)\/([^/]+)\.svg$/);
  if (og) {
    const mask = parseMask(og[2]);
    if (!SEEDS[og[1]] || mask === null) return plain("Unknown seed or mask", 404);
    return new Response(ogSvg(og[1], mask, vibe(og[1], mask, [])), {
      headers: { ...SECURITY, "Content-Type": "image/svg+xml; charset=UTF-8", "Cache-Control": "public, max-age=86400", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'" },
    });
  }

  const signed = path.match(/^\/m\/([a-z]+)\.([a-z-]*)\.([a-z,+-]+)\.(\d+)\.([0-9a-f]{8})$/);
  if (signed) {
    if (!key) return plain("Signed masks need the signing key, which this server does not have yet.", 503);
    const [, seed, maskRaw, filtersRaw, expRaw, sig] = signed;
    const mask = parseMask(maskRaw === "" ? "-" : maskRaw);
    const filters = parseFilters(filtersRaw);
    const exp = Number(expRaw);
    if (!SEEDS[seed] || mask === null || filters === null) return plain("Unknown seed, mask, or filter", 404);
    if ((await signMask(key, seed, mask, filters, exp)) !== sig) return plain("This signature does not match the mask it carries.", 403);
    const left = exp - Math.floor(now.getTime() / 1000);
    const closesAt = new Date(exp * 1000);
    const closesHour = hourOf(closesAt);
    if (left <= 0) {
      return renderResponse(request, env, { seed, mask, filters }, {
        statusCode: 410,
        status: "Closed.",
        closed: `It showed ${seed} through ${maskLabel(mask)}${filters.length ? ` with ${filters.join(", ")}` : ""}, and closed at ${closesAt.toISOString().replace(".000", "")}.`,
        href: `https://${HOST}${path}`,
        cache: "public, max-age=86400",
        link: `<https://${HOST}/@${closesHour}>; rel="predecessor-version"`,
      });
    }
    return renderResponse(request, env, { seed, mask, filters }, {
      href: `https://${HOST}${path}`,
      cache: `public, max-age=${left}, immutable`,
      headers: { Expires: closesAt.toUTCString(), Sunset: closesAt.toUTCString() },
    });
  }

  const stampMatch = path.match(/^\/stamp\/([0-9a-z]{4,6})$/);
  if (stampMatch) {
    if (!key) return plain("Stamps need the signing key, which this server does not have yet.", 503);
    const seed = url.searchParams.get("seed");
    const mask = parseMask(url.searchParams.get("mask"));
    const hour = url.searchParams.get("hour") || "";
    if (!SEEDS[seed] || mask === null || !/^\d{4}-\d{2}-\d{2}T\d{2}$/.test(hour)) return plain("unknown: this stamp needs its seed, mask, and hour", 404);
    if ((await stampFor(key, hour, seed, mask)) !== stampMatch[1]) return plain("unknown: no vibe made this stamp", 404);
    const current = hourOf(now);
    if (hour === current) return plain(`valid, ${seed} through ${maskLabel(mask)}, issued ${hour}:00Z, closes ${nextHour(hour)}:00Z`, 200);
    if (hour < current) return plain(`expired, ${seed} through ${maskLabel(mask)}, issued ${hour}:00Z, closed ${nextHour(hour)}:00Z`, 410);
    return plain("unknown: that hour has not happened yet", 404);
  }

  const parts = parseRequestParts(url);
  if (!parts || !SEEDS[parts.seed] || parts.mask === null || parts.filters === null) {
    return plain(`Not a vibe. Try /harbor, /ledger/pr, or /lantern/pram/night. Seeds: ${Object.keys(SEEDS).join(", ")}.`, 404);
  }
  if (parts.json) return tupleResponse(request, [entryFor(parts.seed, parts.mask, parts.filters)]);
  return renderResponse(request, env, parts);
}
