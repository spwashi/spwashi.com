// Teal Stripes Vibes' page: every address is this one shell, painted here from
// the address by vibe.js (carried from src/ by carry.mjs). Written by hand. The
// shader and the keys are the ones the worker's page carried; tuning, the
// fading card and the share image are this page's own. With scripts off the
// shell shows the vibe it was written with.
import { FACETS, LOCK, SEEDS, SHADER, SLOTS, TUNING, holdAt, hourOf, lockVibe, canonicalPath, captionOf, choicesFor, expressionOf, maskLabel, readAddress, said, tune, tuningFor, tuningQuery, valueOf, vibe, vibeCss } from "/vibe.js";

import { mountSetRing, nearestLight, slug as pathWord, spw64 } from "/set-ring.js";

const $ = (id) => document.getElementById(id);
const root = document.documentElement;
const card = $("card");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const say = (m) => { const status = $("status"); if (status) { status.textContent = ""; setTimeout(() => { status.textContent = m; }, 40); } };

let place = readAddress(window.location.pathname, window.location.search, new Date());
if (place.kind === "root") {
  // "/" is this hour; the address says so, as the worker's 302 did.
  window.history.replaceState(null, "", place.redirect);
  place = readAddress(place.redirect, "", new Date());
}

/* ── the picture, from the place ─────────────────────────── */

/** A place being tried before it is kept: a held slot's choice, or a reroll. Null when nothing is held. */
let trying = null;
/** The slot a hand holds, or null. */
let held = null;
const shown = () => trying ?? place;
const current = () => { const p = shown(); return tune(vibe(p.seed, p.mask, p.filters), p.tuning); };
const pathOf = () => (place.kind === "lock" ? LOCK.path : place.kind === "moment" ? new URL(place.href).pathname : canonicalPath(place));
const addressOf = () => {
  const query = [tuningQuery(place.tuning), place.say ? `say=${encodeURIComponent(place.say)}` : ""].filter(Boolean).join("&");
  return `${pathOf()}${query ? `?${query}` : ""}`;
};

let shader = null;

function paint() {
  const { seed, mask, filters, hour } = shown();
  const v = current();
  const href = `https://tealstripesvibes.com${addressOf()}`;
  $("vibe-style").textContent = vibeCss(v);
  $("field").setAttribute("aria-label", `${SEEDS[seed].mood}: stripes of ${v.palette.join(", ")} at ${v.angle} degrees`);
  $("seed-name").textContent = seed;
  $("mood").textContent = SEEDS[seed].mood;
  $("mask").textContent = `${maskLabel(mask)}${filters.length ? ` · ${filters.join(", ")}` : ""}`;
  const p = shown();
  $("hour").textContent = p.kind === "lock" ? `${hour}Z · turn ${p.turn} of ${p.of}` : `${hour}Z`;
  const lock = $("lock");
  if (p.kind === "lock") {
    lock.replaceChildren(document.createTextNode(`${p.lines.join("\n")} · `));
    const from = document.createElement("a");
    from.href = LOCK.home;
    from.textContent = "from mutex.buzz";
    lock.append(from);
    lock.hidden = false;
  } else lock.hidden = true;
  writeExpression(v);
  $("tuple-link").setAttribute("href", `/tuple?seed=${seed}&mask=${maskLabel(mask)}${filters.length ? `&filter=${filters.join(",")}` : ""}`);
  $("self-link").setAttribute("href", href);
  $("og-link").setAttribute("href", `/og/${seed}/${maskLabel(mask)}.svg`);
  for (const [i, li] of [...$("facets").children].entries()) li.className = mask.includes(FACETS[i].letter) ? "on" : "off";
  $("caption").textContent = place.say;
  $("caption").hidden = !place.say;
  card.dataset.href = href;
  document.title = `${place.say ? `${place.say} · ` : ""}${seed} · ${maskLabel(mask)}${filters.length ? ` · ${filters.join(",")}` : ""} — Teal Stripes Vibes`;
  document.querySelector('link[rel="canonical"]')?.setAttribute("href", href);
  // The browser's own chrome takes the vibe's ground.
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", v.palette[0]);
  if (shader) shader.set(v);
  else shader = shade(v);
  showTuning(v);
}

/** Write the place into the address without a reload: a tuned picture is still a link. */
function keep() {
  window.history.replaceState(null, "", addressOf());
  paint();
}

if (place.kind === "lock-pending") {
  // The lock's vibe: the hour's ground first, then what mutex.buzz says the lock holds.
  place = { ...readAddress(`/@${hourOf(new Date())}`, "", new Date()), seed: Object.keys(SEEDS)[0], mask: "" };
  readLock();
}

/** Read the lock from mutex.buzz and paint what it holds; each hour fill in a facet more; at the close, read it again. */
async function readLock() {
  try {
    const response = await fetch(LOCK.schedule);
    if (!response.ok) throw new Error(String(response.status));
    const hold = holdAt((await response.json()).holds ?? [], Date.now());
    if (!hold) throw new Error("no hold");
    const fill = () => {
      if (Date.now() >= Date.parse(hold.releasesAt)) return readLock();
      if (place.kind !== "lock" && place.kind !== "moment") return;
      place = { ...lockVibe(hold, Date.now()), tuning: place.tuning ?? {}, say: place.say ?? "" };
      paint();
    };
    fill();
    clearInterval(readLock.timer);
    readLock.timer = setInterval(fill, 60_000);
    say(`${hold.title} holds the lock; turn ${place.turn} of ${place.of}.`);
  } catch {
    say("mutex.buzz did not answer; this is the hour's ground.");
  }
}

if (place.kind === "unknown") {
  $("seed-name").textContent = "not a vibe";
  $("mood").textContent = `Try /harbor, /ledger/pr, or /lantern/pram/night. Seeds: ${Object.keys(SEEDS).join(", ")}.`;
  document.title = "Not a vibe — Teal Stripes Vibes";
} else {
  paint();
  wireSlots();
  wireTuning();
  wireShare();
  // The set's ring, top left (the card keeps the bottom right): what this vibe becomes on each of the other sites.
  mountSetRing("tealstripesvibes.com", () => {
    const v = current();
    const p = shown();
    const light = nearestLight(v.palette[1]);
    const expression = expressionOf(p.seed, p.mask, p.filters, v);
    return {
      "attention.productions": { href: `https://attention.productions/${pathWord(SEEDS[p.seed].mood)}?light=${pathWord(light)}&shot=wide&ratio=widescreen`, says: `this vibe as a shot of "${SEEDS[p.seed].mood}", lit by ${light}` },
      "factshift.center": { href: `https://factshift.center/?spw=${encodeURIComponent(expression)}`, says: "this vibe's line, held on the canvas" },
      "mutex.buzz": { href: "https://mutex.buzz/", says: "the lock that /@lock here follows" },
      "spw.quest": { href: `https://spw.quest/build#spw64=${spw64(expression)}`, says: "this vibe's line, taken apart a slot at a time" },
    };
  }, { corner: "top" });
}

/* ── the expression's handles ───────────────────────────── */

// As on factshift.center: a part of the line is held, its choices are scanned
// and shown on the stripes before anything is written, and keep writes it into
// the address while let go puts it back. Its choices are borrowed from the
// other seeds, then its own family (a palette's hue turns, Euclidean rhythms,
// a number's steps). (held is declared with trying, above, since the first paint reads it.)

/** The expression, its tuple's parts as handles. */
function writeExpression(v) {
  const p = shown();
  const expr = $("expr");
  expr.replaceChildren();
  const text = (t) => expr.append(document.createTextNode(t));
  const slot = (name, label) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "slot";
    button.dataset.slot = name;
    button.textContent = label;
    button.setAttribute("aria-pressed", String(held?.slot === name));
    button.title = `Hold the ${name}: scan its choices, reroll it, keep it`;
    expr.append(button);
  };
  text("^vibe[");
  slot("seed", p.seed);
  text(`]{${[maskLabel(p.mask), ...p.filters].join(",")}}<`);
  slot("palette", said("palette", v.palette));
  text("|");
  slot("rhythm", said("rhythm", v.rhythm));
  text("|");
  slot("angle", said("angle", v.angle));
  text("|");
  slot("drift", said("drift", v.motion.drift));
  text(" ");
  slot("breath", said("breath", v.motion.breath));
  text("|");
  slot("grain", said("grain", v.grain.amount));
  text(` ${v.grain.kind}|${v.plate || "-"}>`);
}

const choices = (slot) => (slot === "seed" ? Object.keys(SEEDS) : choicesFor(slot, tune(vibe(place.seed, place.mask, place.filters), place.tuning)));
const valueNow = (slot) => (slot === "seed" ? shown().seed : valueOf(slot, current()));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Try a choice for the held slot: the stripes show it; the address does not change until it is kept. */
function tryChoice(slot, value) {
  trying = slot === "seed" ? { ...place, seed: value } : { ...place, tuning: { ...place.tuning, ...tuningFor(slot, value) } };
  paint();
  showHeld();
}

function showHeld() {
  const bar = $("held");
  if (!held) { bar.hidden = true; return; }
  const list = choices(held.slot);
  const at = list.findIndex((c) => same(c, valueNow(held.slot)));
  bar.hidden = false;
  $("held-name").textContent = held.slot;
  $("held-value").textContent = held.slot === "seed" ? valueNow("seed") : said(held.slot, valueNow(held.slot));
  $("held-count").textContent = `${at + 1} of ${list.length}`;
}

function holdSlot(slot) {
  if (held?.slot === slot) return letGo();
  trying = null;
  held = { slot };
  paint();
  showHeld();
  say(`Holding the ${slot}. Arrows scan, r rerolls, Enter keeps.`);
}

function scan(by) {
  if (!held) return;
  const list = choices(held.slot);
  const at = list.findIndex((c) => same(c, valueNow(held.slot)));
  tryChoice(held.slot, list[(at + by + list.length) % list.length]);
}

function reroll() {
  if (!held) return;
  const list = choices(held.slot).filter((c) => !same(c, valueNow(held.slot)));
  tryChoice(held.slot, list[Math.floor(Math.random() * list.length)]);
}

/** Reroll the whole tuple at once: every slot but the seed takes a choice of its own, shown before it is kept. */
function rerollAll() {
  const base = { ...place, tuning: { ...place.tuning } };
  for (const slot of SLOTS.filter((s) => s !== "seed")) {
    const list = choicesFor(slot, tune(vibe(base.seed, base.mask, base.filters), base.tuning));
    Object.assign(base.tuning, tuningFor(slot, list[Math.floor(Math.random() * list.length)]));
  }
  held = held ?? { slot: "palette" };
  trying = base;
  paint();
  showHeld();
  say("A new tuple. Enter keeps it, Escape lets it go.");
}

function keepHeld() {
  if (trying) {
    // A change kept from the lock's vibe is a vibe of its own now, at its own address, and stops following the hold.
    place = { ...trying, kind: trying.kind === "lock" ? "vibe" : trying.kind, href: place.href };
    trying = null;
    keep();
    say("Kept.");
  }
  held = null;
  showHeld();
  paint();
}

function letGo() {
  trying = null;
  held = null;
  paint();
  showHeld();
  say("Let go.");
}

function wireSlots() {
  $("expr").addEventListener("click", (event) => {
    const button = event.target.closest?.("button.slot");
    if (button) holdSlot(button.dataset.slot);
  });
  $("held-prev").addEventListener("click", () => scan(-1));
  $("held-next").addEventListener("click", () => scan(1));
  $("held-reroll").addEventListener("click", reroll);
  $("held-keep").addEventListener("click", keepHeld);
  $("held-go").addEventListener("click", letGo);
  // A swipe across the stripes scans the held slot, as a swipe steps lines on the canvas.
  let start = null;
  $("field").addEventListener("pointerdown", (event) => { start = { x: event.clientX, y: event.clientY }; });
  addEventListener("pointerup", (event) => {
    if (!start || !held) { start = null; return; }
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    start = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) scan(dx < 0 ? 1 : -1);
  });
}

/* ── tuning by hand ──────────────────────────────────────── */

function showTuning(v) {
  const now = { angle: v.angle, drift: v.motion.drift, breath: v.motion.breath, grain: v.grain.amount, beats: place.tuning.beats ?? 5, steps: place.tuning.steps ?? 8 };
  for (const key of Object.keys(now)) {
    const input = $(`t-${key}`);
    if (input && document.activeElement !== input) input.value = String(now[key]);
    const out = $(`o-${key}`);
    if (out) out.textContent = String(now[key]);
  }
  for (const button of document.querySelectorAll("[data-filter]")) button.setAttribute("aria-pressed", String(place.filters.includes(button.dataset.filter)));
  if (document.activeElement !== $("t-say")) $("t-say").value = place.say;
}

function wireTuning() {
  $("tune").hidden = false;
  for (const input of document.querySelectorAll("[data-tune]")) {
    input.addEventListener("input", () => {
      const key = input.dataset.tune;
      const { min, max } = TUNING[key];
      place.tuning = { ...place.tuning, [key]: Math.min(max, Math.max(min, Number(input.value))) };
      if ((key === "beats" || key === "steps") && place.tuning.beats !== undefined && place.tuning.steps !== undefined && place.tuning.beats > place.tuning.steps) place.tuning.beats = place.tuning.steps;
      if (key === "beats" && place.tuning.steps === undefined) place.tuning.steps = 8;
      if (key === "steps" && place.tuning.beats === undefined) place.tuning.beats = Math.min(5, place.tuning.steps);
      keep();
    });
  }
  $("t-turn").addEventListener("click", () => {
    place.tuning = { ...place.tuning, turn: ((place.tuning.turn ?? 0) + 1) % 3 };
    keep();
    say("The palette turns.");
  });
  for (const button of document.querySelectorAll("[data-filter]")) {
    button.addEventListener("click", () => {
      const f = button.dataset.filter;
      const filters = place.filters.includes(f) ? place.filters.filter((x) => x !== f) : [...place.filters, f];
      place = { ...place, kind: "vibe", filters, href: `https://tealstripesvibes.com${canonicalPath({ ...place, filters })}` };
      keep();
    });
  }
  $("t-reset").addEventListener("click", () => {
    place.tuning = {};
    keep();
    say("As written.");
  });
  $("t-say").addEventListener("input", (event) => {
    place.say = captionOf(event.target.value);
    keep();
  });
}

/* ── the fading card ─────────────────────────────────────── */

// The card fades when the hand is still, so the stripes can be taken alone. h holds it hidden; a tap, a key or Escape brings it back.
const AWAKE_MS = 3500;
let sleepTimer = 0;
const setUi = (state) => { root.dataset.ui = state; };
function wake() {
  if (root.dataset.ui === "held") return;
  setUi("awake");
  clearTimeout(sleepTimer);
  sleepTimer = setTimeout(() => {
    // Not while a hand is in the card: a slider being dragged, a caption being typed.
    if (card.contains(document.activeElement) && document.activeElement !== document.body) return wake();
    setUi("asleep");
  }, AWAKE_MS);
}
function hold() {
  if (root.dataset.ui === "held") { setUi("awake"); wake(); say("The card is back."); }
  else { clearTimeout(sleepTimer); setUi("held"); }
}
for (const type of ["pointermove", "pointerdown", "wheel", "touchstart", "focusin"]) addEventListener(type, wake, { passive: true });
addEventListener("pointerdown", () => { if (root.dataset.ui === "held") hold(); });
$("hide")?.addEventListener("click", (event) => { event.stopPropagation(); hold(); });
wake();

addEventListener("keydown", async (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (/input|textarea/i.test(e.target.tagName)) { if (e.key === "Escape") e.target.blur(); wake(); return; }
  if (held && e.key === "ArrowLeft") { e.preventDefault(); wake(); return scan(-1); }
  if (held && e.key === "ArrowRight") { e.preventDefault(); wake(); return scan(1); }
  if (held && e.key === "r") { wake(); return reroll(); }
  if (e.key === "R") { wake(); return rerollAll(); }
  if (held && e.key === "Enter" && !e.target.closest?.("button")) { wake(); return keepHeld(); }
  if (held && e.key === "Escape") { wake(); return letGo(); }
  if (e.key === "h") return hold();
  if (e.key === "Escape" && root.dataset.ui === "held") return hold();
  wake();
  if (e.key === "?") $("grammar").open = !$("grammar").open;
  if (e.key === "t" && !$("tune").hidden) $("tune").open = !$("tune").open;
  if (e.key === "s") { card.toggleAttribute("data-stamp-large"); say(card.hasAttribute("data-stamp-large") ? "Stamp shown large." : "Stamp back in the card."); }
  if (e.key === "c") {
    try { await navigator.clipboard.writeText(card.dataset.href); say("Link copied."); }
    catch { say("Copy failed. The link is in the card."); }
  }
});

/* ── the shader ──────────────────────────────────────────── */

/** The same stripes as the CSS field, drifting and breathing, landed on the stripes they replace; set() retunes it in place. */
function shade(first) {
  const canvas = $("gl");
  const gl = canvas && canvas.getContext("webgl", { antialias: false, preserveDrawingBuffer: true });
  if (!gl) return null;
  const sh = (type, text) => { const s = gl.createShader(type); gl.shaderSource(s, text); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
  const vs = sh(gl.VERTEX_SHADER, "attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }");
  const fs = sh(gl.FRAGMENT_SHADER, SHADER);
  if (!vs || !fs) return null;
  const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = (n) => gl.getUniformLocation(prog, n);
  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const dpr = Math.min(2, devicePixelRatio || 1);
  let v = first;
  const set = (next) => {
    v = next;
    const widths = v.rhythm.slice(0, 8).map((w) => w * 4 * dpr);
    while (widths.length < 8) widths.push(0);
    gl.uniform3fv(u("u_c0"), rgb(v.palette[0])); gl.uniform3fv(u("u_c1"), rgb(v.palette[1])); gl.uniform3fv(u("u_c2"), rgb(v.palette[2]));
    gl.uniform1fv(u("u_w"), widths); gl.uniform1f(u("u_n"), Math.min(8, v.rhythm.length));
    gl.uniform1f(u("u_period"), widths.reduce((a, b) => a + b, 0));
    gl.uniform1f(u("u_angle"), v.angle); gl.uniform1f(u("u_grain"), v.grain.amount * 0.5);
    gl.uniform1f(u("u_drift"), reduce ? 0 : v.motion.drift * dpr); gl.uniform1f(u("u_breath"), reduce ? 0 : v.motion.breath);
    gl.uniform1f(u("u_moire"), v.moire ? 1 : 0); gl.uniform1f(u("u_turn"), v.moire?.turn ?? 0); gl.uniform1f(u("u_stretch"), v.moire?.stretch ?? 1);
    resize();
    if (reduce) gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  const resize = () => {
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr; gl.viewport(0, 0, canvas.width, canvas.height);
    const a = (v.angle * Math.PI) / 180, w = canvas.width, h = canvas.height;
    const len = Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a));
    gl.uniform1f(u("u_offset"), (w / 2) * Math.sin(a) + (h / 2) * Math.cos(a) - len / 2);
  };
  addEventListener("resize", resize);
  set(first);
  const frame = (ms) => {
    gl.uniform1f(u("u_time"), ms / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (!reduce && !document.hidden) requestAnimationFrame(frame);
  };
  requestAnimationFrame((ms) => { frame(ms); root.dataset.gl = "on"; });
  document.addEventListener("visibilitychange", () => { if (!document.hidden && !reduce) requestAnimationFrame(frame); });
  return { set };
}

/* ── the share image ─────────────────────────────────────── */

const FORMATS = { post: [1080, 1080], story: [1080, 1920], card: [1200, 630] };

/** A small deterministic noise, so a share of one address grains the same each time. */
function grainTile(amount, seed) {
  const tile = document.createElement("canvas");
  tile.width = tile.height = 160;
  const g = tile.getContext("2d");
  const img = g.createImageData(160, 160);
  let s = seed >>> 0 || 1;
  for (let i = 0; i < img.data.length; i += 4) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const n = s & 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = n;
    img.data[i + 3] = Math.round(255 * Math.min(0.5, amount * 1.6) * (n / 255));
  }
  g.putImageData(img, 0, 0);
  return tile;
}

/** Bands of the vibe across the whole picture, at its angle, as the CSS draws them. */
function bands(ctx, w, h, v, unit, turn = 0) {
  const diag = Math.hypot(w, h);
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(((v.angle + turn - 90) * Math.PI) / 180);
  const period = v.rhythm.reduce((a, b) => a + b, 0) * unit;
  for (let x = -diag - (diag % period); x < diag; x += period) {
    let at = x;
    v.rhythm.forEach((width, i) => {
      ctx.fillStyle = v.palette[i % v.palette.length];
      ctx.fillRect(at, -diag, width * unit + 0.5, diag * 2);
      at += width * unit;
    });
  }
  ctx.restore();
}

function drawShare(format) {
  const [w, h] = FORMATS[format];
  const v = current();
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  const unit = 4 * (w / 540);
  ctx.fillStyle = v.palette[0];
  ctx.fillRect(0, 0, w, h);
  bands(ctx, w, h, v, unit);
  if (v.moire) {
    ctx.globalCompositeOperation = "difference";
    ctx.globalAlpha = 0.4;
    bands(ctx, w, h, v, unit * v.moire.stretch, v.moire.turn);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }
  const seed = [...card.dataset.href].reduce((a, c) => Math.imul(a, 31) + c.charCodeAt(0), 7);
  ctx.fillStyle = ctx.createPattern(grainTile(v.grain.amount, seed), "repeat");
  ctx.globalCompositeOperation = "overlay";
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "source-over";
  // The plate: what it is, the caption if there is one, and the address that paints it again.
  const pad = Math.round(w * 0.05);
  const plateW = Math.min(w - pad * 2, Math.round(w * 0.62));
  const plateH = Math.round((place.say ? 0.3 : 0.22) * Math.min(w, h * 1.1));
  const x = w - pad - plateW, y = h - pad - plateH;
  ctx.fillStyle = "rgba(4, 14, 16, 0.66)";
  ctx.beginPath();
  ctx.roundRect(x, y, plateW, plateH, Math.round(w * 0.022));
  ctx.fill();
  const em = Math.round(w * 0.034);
  ctx.fillStyle = "#f4fbfa";
  ctx.textBaseline = "top";
  let line = y + Math.round(em * 0.9);
  if (place.say) {
    ctx.font = `700 ${Math.round(em * 1.35)}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillText(place.say, x + em, line, plateW - em * 2);
    line += Math.round(em * 1.9);
  }
  ctx.font = `700 ${em}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillText(`${place.seed} · ${SEEDS[place.seed].mood}`, x + em, line, plateW - em * 2);
  line += Math.round(em * 1.5);
  ctx.font = `${Math.round(em * 0.62)}px ui-monospace, Menlo, monospace`;
  ctx.fillStyle = "rgba(244, 251, 250, 0.8)";
  // The address, whole if it fits the plate, else cut with an ellipsis where it stops fitting.
  const room = plateW - em * 2;
  let address = `tealstripesvibes.com${addressOf()}`;
  if (ctx.measureText(address).width > room) {
    while (address.length > 1 && ctx.measureText(`${address}…`).width > room) address = address.slice(0, -1);
    address = `${address.replace(/[&?=]+$/, "")}…`;
  }
  ctx.fillText(address, x + em, line);
  return canvas;
}

function wireShare() {
  $("share").hidden = false;
  for (const button of document.querySelectorAll("[data-share]")) {
    button.addEventListener("click", async () => {
      const format = button.dataset.share;
      const canvas = drawShare(format);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) return say("This browser could not draw the share.");
      const name = `tealstripes-${place.seed}-${format}.png`;
      const file = new File([blob], name, { type: "image/png" });
      try {
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: `Teal Stripes Vibes — ${place.seed}`, text: place.say || SEEDS[place.seed].mood, url: card.dataset.href });
          return say("Shared.");
        }
      } catch (error) {
        if (error?.name === "AbortError") return say("Not shared.");
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      say(`Saved ${name}.`);
    });
  }
}

/* ── the app ─────────────────────────────────────────────── */

// Installed, it keeps every vibe offline (sw.js); framed on attention.productions or mutex.buzz, it installs nothing.
if ("serviceWorker" in navigator && window.top === window) navigator.serviceWorker.register("/sw.js").catch(() => {});
const keepButton = $("keep-app");
let offer = null;
addEventListener("beforeinstallprompt", (event) => { event.preventDefault(); offer = event; keepButton.hidden = false; });
keepButton.addEventListener("click", async () => {
  if (!offer) return;
  offer.prompt();
  await offer.userChoice.catch(() => null);
  offer = null;
  keepButton.hidden = true;
});
addEventListener("appinstalled", () => { keepButton.hidden = true; });
