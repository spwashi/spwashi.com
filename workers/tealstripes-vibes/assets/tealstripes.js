// Teal Stripes Vibes' page: every address is this one shell, painted here from
// the address by vibe.js (carried from src/ by carry.mjs). Written by hand; the
// shader and the keys are the ones the worker's page carried. With scripts off
// the shell shows the vibe it was written with.
import { FACETS, SEEDS, SHADER, expressionOf, maskLabel, readAddress, vibe, vibeCss } from "/vibe.js";

const $ = (id) => document.getElementById(id);
const root = document.documentElement;
const card = $("card");
const say = (m) => { const status = $("status"); if (status) { status.textContent = ""; setTimeout(() => { status.textContent = m; }, 40); } };

let place = readAddress(window.location.pathname, window.location.search, new Date());
if (place.kind === "root") {
  // "/" is this hour; the address says so, as the worker's 302 did.
  window.history.replaceState(null, "", place.redirect);
  place = readAddress(place.redirect, "", new Date());
}

if (place.kind === "unknown") {
  $("seed-name").textContent = "not a vibe";
  $("mood").textContent = `Try /harbor, /ledger/pr, or /lantern/pram/night. Seeds: ${Object.keys(SEEDS).join(", ")}.`;
  document.title = "Not a vibe — Teal Stripes Vibes";
} else {
  paint(place);
}

function paint({ seed, mask, filters, hour, href }) {
  const v = vibe(seed, mask, filters);
  const tuple = `/tuple?seed=${seed}&mask=${maskLabel(mask)}${filters.length ? `&filter=${filters.join(",")}` : ""}`;
  $("vibe-style").textContent = vibeCss(v);
  $("field").setAttribute("aria-label", `${SEEDS[seed].mood}: stripes of ${v.palette.join(", ")} at ${v.angle} degrees`);
  $("seed-name").textContent = seed;
  $("mood").textContent = SEEDS[seed].mood;
  $("mask").textContent = `${maskLabel(mask)}${filters.length ? ` · ${filters.join(", ")}` : ""}`;
  $("hour").textContent = `${hour}Z`;
  $("expr").textContent = expressionOf(seed, mask, filters, v);
  $("tuple-link").setAttribute("href", tuple);
  $("self-link").setAttribute("href", href);
  $("og-link").setAttribute("href", `/og/${seed}/${maskLabel(mask)}.svg`);
  for (const [i, li] of [...$("facets").children].entries()) li.className = mask.includes(FACETS[i].letter) ? "on" : "off";
  card.dataset.href = href;
  document.title = `${seed} · ${maskLabel(mask)}${filters.length ? ` · ${filters.join(",")}` : ""} — Teal Stripes Vibes`;
  document.querySelector('link[rel="canonical"]')?.setAttribute("href", href);
  // The browser's own chrome takes the vibe's ground.
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", v.palette[0]);
  shade(v);
}

addEventListener("keydown", async (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || /input|textarea/i.test(e.target.tagName)) return;
  if (e.key === "?") $("grammar").open = !$("grammar").open;
  if (e.key === "s") { card.toggleAttribute("data-stamp-large"); say(card.hasAttribute("data-stamp-large") ? "Stamp shown large." : "Stamp back in the card."); }
  if (e.key === "c") {
    try { await navigator.clipboard.writeText(card.dataset.href); say("Link copied."); }
    catch { say("Copy failed. The link is in the card."); }
  }
});

/** The shader: the same stripes as the CSS field, drifting and breathing, landed on the stripes it replaces. */
function shade(v) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = $("gl");
  const gl = canvas && canvas.getContext("webgl", { antialias: false, preserveDrawingBuffer: true });
  if (!gl) return;
  const sh = (type, text) => { const s = gl.createShader(type); gl.shaderSource(s, text); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
  const vs = sh(gl.VERTEX_SHADER, "attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }");
  const fs = sh(gl.FRAGMENT_SHADER, SHADER);
  if (!vs || !fs) return;
  const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = (n) => gl.getUniformLocation(prog, n);
  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const dpr = Math.min(2, devicePixelRatio || 1);
  const widths = v.rhythm.slice(0, 8).map((w) => w * 4 * dpr);
  while (widths.length < 8) widths.push(0);
  const resize = () => {
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr; gl.viewport(0, 0, canvas.width, canvas.height);
    const a = (v.angle * Math.PI) / 180, w = canvas.width, h = canvas.height;
    const len = Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a));
    gl.uniform1f(u("u_offset"), (w / 2) * Math.sin(a) + (h / 2) * Math.cos(a) - len / 2);
  };
  resize(); addEventListener("resize", resize);
  gl.uniform3fv(u("u_c0"), rgb(v.palette[0])); gl.uniform3fv(u("u_c1"), rgb(v.palette[1])); gl.uniform3fv(u("u_c2"), rgb(v.palette[2]));
  gl.uniform1fv(u("u_w"), widths); gl.uniform1f(u("u_n"), Math.min(8, v.rhythm.length));
  gl.uniform1f(u("u_period"), widths.reduce((a, b) => a + b, 0));
  gl.uniform1f(u("u_angle"), v.angle); gl.uniform1f(u("u_grain"), v.grain.amount * 0.5);
  gl.uniform1f(u("u_drift"), reduce ? 0 : v.motion.drift * dpr); gl.uniform1f(u("u_breath"), reduce ? 0 : v.motion.breath);
  const frame = (ms) => {
    gl.uniform1f(u("u_time"), ms / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (!reduce && !document.hidden) requestAnimationFrame(frame);
  };
  requestAnimationFrame((ms) => { frame(ms); root.dataset.gl = "on"; });
  document.addEventListener("visibilitychange", () => { if (!document.hidden && !reduce) requestAnimationFrame(frame); });
}

// Installed, it keeps every vibe offline (sw.js); framed on attention.productions or mutex.buzz, it installs nothing.
if ("serviceWorker" in navigator && window.top === window) navigator.serviceWorker.register("/sw.js").catch(() => {});
const keep = $("keep-app");
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
