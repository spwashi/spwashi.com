// attention.productions' page: reads the address as a shot and draws it. Written
// by hand; the composer it imports (compose.js, vocabulary.js, materials.js) is
// carried from src/ by carry.mjs. With scripts off the page shows its first
// shot and its links still lead to each word's address.
import { FIRST_SHOT, SUBJECT_DEPTH, addressOf, canvasHrefOf, cornersOf, geometryOf, nearestFocus, nearestFrom, nearestSheet, promptOf, readShot, slug, spwOf, tempoAt, tempoOf } from "/compose.js";
import { LADDERS, SHAPES, TEMPO } from "/vocabulary.js";
import { mountSetRing, nearestSeed, slug as pathWord, spw64 } from "/set-ring.js";
import { MATERIALS } from "/materials.js";

const svg = document.getElementById("viewfinder");
const $ = (id) => document.getElementById(id);
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
const ARROWS = { ArrowLeft: "left third", ArrowRight: "right third", ArrowUp: "upper third", ArrowDown: "lower third", Enter: "center", " ": "center", Home: "center" };

let shot = FIRST_SHOT;
let drawn = geometryOf(FIRST_SHOT);
let pointerDepth = -1;
let tweenFrame = 0;
let rackTimer = 0;
/** What a hand is dragging: "focus", "light" or "tempo"; and whether it moved, so the click that ends a drag is not a tap. */
let dragging = "";
let dragged = false;

/** Today in Chicago, where the season is kept, as YYYY-MM-DD. */
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

const set = (el, attrs) => { if (el) for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v)); };

/** Draw a geometry's numbers onto the viewfinder's elements. */
function apply(g) {
  const box = { x: g.frame.x, y: g.frame.y, width: g.frame.w, height: g.frame.h };
  for (const el of [$("gate-rect"), $("wash"), $("frame"), svg.querySelector(".grain")]) set(el, box);
  set($("corners"), { d: cornersOf(g.frame) });
  set($("key-light"), { cx: g.light.cx, cy: g.light.cy, r: g.light.r });
  svg.querySelectorAll("#thirds line").forEach((line, i) => set(line, g.thirds[i]));
  for (const s of g.sheets) {
    const sheet = svg.querySelector(`.sheet[data-depth="${s.depth}"]`);
    if (!sheet) continue;
    set(sheet, { transform: `rotate(${s.rot.toFixed(2)} ${(s.x + s.w / 2).toFixed(1)} ${(s.y + s.h / 2).toFixed(1)})` });
    sheet.querySelectorAll("rect").forEach((rect) => set(rect, { x: s.x, y: s.y, width: s.w, height: s.h }));
  }
  svg.querySelectorAll(".point").forEach((p, i) => set(p, { cx: g.points[i].x, cy: g.points[i].y, r: g.points[i].r }));
  svg.querySelectorAll("#bokeh ellipse").forEach((e, i) => set(e, { cx: g.bokeh[i].x, cy: g.bokeh[i].y, rx: g.bokeh[i].rx, ry: g.bokeh[i].ry }));
  set($("flare"), { x1: g.frame.x, x2: g.frame.x + g.frame.w, y1: g.flare.y, y2: g.flare.y });
  svg.querySelectorAll("#streaks line").forEach((l, i) => set(l, { x1: g.streaks[i].x1, x2: g.streaks[i].x2, y1: g.streaks[i].y, y2: g.streaks[i].y }));
  set($("ring"), { cx: g.focus.x, cy: g.focus.y, r: g.focus.r });
  set($("bar"), { x1: g.bar.x1, x2: g.bar.x2, y1: g.bar.y, y2: g.bar.y });
  set($("beat"), { cx: g.bar.x2, cy: g.bar.y });
  set($("lamp"), { transform: `translate(${g.lamp.x.toFixed(1)} ${g.lamp.y.toFixed(1)})` });
}

/** Which sheets are sharp: a class per sheet, from four fixed blurs, so nothing animates a filter. */
function sharpen(g) {
  for (const s of g.sheets) {
    const sheet = svg.querySelector(`.sheet[data-depth="${s.depth}"]`);
    if (!sheet) continue;
    for (const n of [0, 1, 2, 3]) sheet.classList.toggle(`b${n}`, n === s.blur);
  }
}

/** Numbers between two geometries, a share t of the way; anything else is the target's. */
function between(a, b, t) {
  if (typeof b === "number" && typeof a === "number") return a + (b - a) * t;
  if (Array.isArray(b)) return b.map((item, i) => between(a?.[i], item, t));
  if (b && typeof b === "object") return Object.fromEntries(Object.entries(b).map(([k, v]) => [k, between(a?.[k], v, t)]));
  return b;
}

/** Move the drawing to a geometry, eased over half a second, or at once when motion is reduced. */
function moveTo(target) {
  cancelAnimationFrame(tweenFrame);
  const from = drawn;
  drawn = target;
  if (reduce.matches) return apply(target);
  const start = performance.now();
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  const step = (now) => {
    const t = Math.min(1, (now - start) / 560);
    apply(between(from, target, ease(t)));
    if (t < 1) tweenFrame = requestAnimationFrame(step);
  };
  tweenFrame = requestAnimationFrame(step);
}

/** Rack focus: the sharp sheet moves between the subject and the nearest sheet, while the shot says so. */
function rackFocus() {
  clearInterval(rackTimer);
  if (shot.move !== "rack focus" || reduce.matches) return;
  let near = false;
  rackTimer = setInterval(() => {
    if (pointerDepth >= 0 || dragging) return;
    near = !near;
    sharpen(geometryOf(shot, near ? 0 : SUBJECT_DEPTH));
  }, 2400 * shot.tempo);
}

/** Write the shot everywhere it shows: the drawing, the prompt, the lines, the address, the words. */
function render() {
  const { midjourney, plain } = promptOf(shot);
  $("prompt").textContent = midjourney;
  $("plain").textContent = plain;
  $("spw").textContent = spwOf(shot);
  $("vf-desc").textContent = plain;
  $("address").setAttribute("href", addressOf(shot));
  $("shot-label").textContent = shot.named ? "Your shot" : "Today's shot";
  $("shot-day").textContent = shot.named ? "" : shot.day;
  svg.dataset.light = slug(shot.light);
  svg.dataset.move = slug(shot.move);
  svg.toggleAttribute("data-surface", Boolean(shot.material));
  const image = $("surface-image");
  if (shot.material) image.setAttribute("href", `https://texture.website/${shot.material.slug}.png`);
  else image.removeAttribute("href");
  const target = geometryOf(shot);
  // What a lens adds or takes away is shown or hidden, not tweened: the flare and the bokeh.
  $("flare").classList.toggle("off", !target.flare.on);
  svg.querySelectorAll("#bokeh ellipse").forEach((e, i) => e.classList.toggle("off", !target.bokeh[i].on));
  svg.style.setProperty("--tempo", String(shot.tempo));
  // Every way to factshift.center opens the canvas on this shot: its Spw and the prompt it makes.
  for (const link of document.querySelectorAll('a[href^="https://factshift.center/"]')) link.setAttribute("href", canvasHrefOf(shot));
  set($("beat"), { "aria-valuenow": shot.tempo, "aria-valuetext": `tempo ×${shot.tempo.toFixed(1)}` });
  set($("lamp"), { "aria-valuetext": `light from ${shot.from}` });
  svg.style.setProperty("--fx", `${target.focus.x}px`);
  svg.style.setProperty("--fy", `${target.focus.y}px`);
  sharpen(target);
  moveTo(target);
  rackFocus();
  for (const row of document.querySelectorAll(".ladder")) {
    const key = row.dataset.key;
    for (const link of row.querySelectorAll("a[data-word]")) {
      const word = link.dataset.word;
      const material = key === "material" ? MATERIALS.find((m) => m.slug === word) ?? null : shot.material;
      const next = key === "material" ? { ...shot, material } : { ...shot, [key]: word };
      link.setAttribute("href", addressOf(next));
      const current = key === "material" ? (shot.material?.slug ?? "") === word : shot[key] === word;
      if (current) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    }
  }
}

/** Keep a change: the address becomes the shot's, so a reload or a shared link is this shot. */
function commit(change) {
  shot = { ...shot, ...change, named: true };
  window.history.replaceState(null, "", addressOf(shot));
  render();
}

/** A place on the screen, in the viewfinder's own units. */
function inView(event) {
  const matrix = svg.getScreenCTM();
  if (!matrix) return null;
  const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
  return { x: point.x, y: point.y };
}

/**
 * The handles: the focus ring, the lamp and the end of the bar. While a hand
 * drags one, the drawing follows it at once; when it lets go, the shot takes
 * the nearest word (or the tempo) and the address keeps it.
 */
function wireHandles() {
  const handles = { focus: $("ring"), light: $("lamp"), tempo: $("beat") };
  const live = (p) => {
    if (dragging === "focus") apply(geometryOf(shot, SUBJECT_DEPTH, { at: [(p.x - drawn.frame.x) / drawn.frame.w, (p.y - drawn.frame.y) / drawn.frame.h].map((n) => Math.min(0.92, Math.max(0.08, n))) }));
    if (dragging === "light") apply(geometryOf(shot, SUBJECT_DEPTH, { lightAt: [(p.x - drawn.frame.x) / drawn.frame.w, (p.y - drawn.frame.y) / drawn.frame.h].map((n) => Math.min(1.05, Math.max(-0.05, n))) }));
    if (dragging === "tempo") {
      const tempo = tempoAt(drawn, p.x);
      svg.style.setProperty("--tempo", String(tempo));
      apply(geometryOf({ ...shot, tempo }));
    }
  };
  const letGo = (p) => {
    const kind = dragging;
    dragging = "";
    svg.classList.remove("dragging");
    if (!p) return render();
    if (kind === "focus") commit({ focus: nearestFocus(drawn, p.x, p.y) });
    if (kind === "light") commit({ from: nearestFrom(drawn, p.x, p.y) });
    if (kind === "tempo") commit({ tempo: tempoAt(drawn, p.x) });
  };
  for (const [kind, el] of Object.entries(handles)) {
    if (!el) continue;
    el.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      cancelAnimationFrame(tweenFrame);
      dragging = kind;
      dragged = false;
      svg.classList.add("dragging");
      el.setPointerCapture(event.pointerId);
    });
    el.addEventListener("pointermove", (event) => {
      if (dragging !== kind) return;
      const p = inView(event);
      if (!p) return;
      dragged = true;
      live(p);
    });
    el.addEventListener("pointerup", (event) => { if (dragging === kind) letGo(dragged ? inView(event) : null); });
    el.addEventListener("pointercancel", () => { if (dragging === kind) letGo(null); });
  }
  // The keys: the lamp steps through the light's directions, the bar through tempos, each a tenth.
  const lamp = handles.light;
  set(lamp, { tabindex: "0", role: "slider", "aria-label": "The light's direction", "aria-valuemin": 0, "aria-valuemax": LADDERS.from.length - 1 });
  lamp.addEventListener("keydown", (event) => {
    // The frame's own keys stay the frame's: nothing pressed on a handle reaches them.
    event.stopPropagation();
    const by = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[event.key];
    if (!by) return;
    event.preventDefault();
    const words = LADDERS.from;
    commit({ from: words[(words.indexOf(shot.from) + by + words.length) % words.length] });
  });
  const beat = handles.tempo;
  set(beat, { tabindex: "0", role: "slider", "aria-label": "The move's tempo", "aria-valuemin": TEMPO.min, "aria-valuemax": TEMPO.max });
  beat.addEventListener("keydown", (event) => {
    // The frame's own keys stay the frame's: nothing pressed on a handle reaches them.
    event.stopPropagation();
    const by = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[event.key];
    if (!by) return;
    event.preventDefault();
    commit({ tempo: tempoOf(shot.tempo + by * TEMPO.step) });
  });
}

function wire() {
  svg.setAttribute("tabindex", "0");
  svg.setAttribute("aria-keyshortcuts", "ArrowLeft ArrowRight ArrowUp ArrowDown Enter");
  let pending = 0;
  wireHandles();
  svg.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch" || dragging) return;
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(() => {
      const p = inView(event);
      if (!p) return;
      svg.classList.add("pointing");
      set($("hand"), { cx: p.x.toFixed(1), cy: p.y.toFixed(1) });
      const depth = nearestSheet(drawn, p.x, p.y);
      if (depth !== pointerDepth) {
        pointerDepth = depth;
        sharpen(geometryOf(shot, depth));
      }
    });
  });
  svg.addEventListener("pointerleave", () => {
    svg.classList.remove("pointing");
    pointerDepth = -1;
    sharpen(geometryOf(shot));
  });
  svg.addEventListener("click", (event) => {
    if (dragged) { dragged = false; return; }
    // A tap on the lamp or the bar is not a tap on the frame.
    if (event.target.closest?.("#lamp, #beat")) return;
    const p = inView(event);
    if (p) commit({ focus: nearestFocus(drawn, p.x, p.y) });
  });
  svg.addEventListener("keydown", (event) => {
    const focus = ARROWS[event.key];
    if (!focus) return;
    event.preventDefault();
    commit({ focus });
  });
  document.querySelector(".ladders")?.addEventListener("click", (event) => {
    const link = event.target.closest?.("a[data-word]");
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    const key = link.closest(".ladder").dataset.key;
    if (key === "material") commit({ material: MATERIALS.find((m) => m.slug === link.dataset.word) ?? null });
    else commit({ [key]: link.dataset.word });
  });
  const copy = $("copy");
  copy.hidden = false;
  copy.addEventListener("click", async () => {
    const text = $("prompt").textContent;
    try {
      await navigator.clipboard.writeText(text);
      copy.textContent = "Copied";
    } catch {
      const range = document.createRange();
      range.selectNodeContents($("prompt"));
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      copy.textContent = "Selected: copy it";
    }
    setTimeout(() => { copy.textContent = "Copy prompt"; }, 1600);
  });
  reduce.addEventListener?.("change", () => { apply(drawn); rackFocus(); });
}

if (svg) {
  shot = readShot(window.location.pathname, window.location.search, today());
  wire();
  render();
  // The set's ring: what this shot becomes on each of the other sites.
  mountSetRing("attention.productions", () => {
    const seed = nearestSeed(SHAPES.light[shot.light].key);
    return {
      "tealstripesvibes.com": { href: `https://tealstripesvibes.com/${seed}?say=${encodeURIComponent(shot.subject.slice(0, 60))}`, says: `this shot as ${seed}'s stripes, captioned "${shot.subject}"` },
      "factshift.center": { href: canvasHrefOf(shot), says: "this shot's lines and its prompt, held on the canvas" },
      "mutex.buzz": { href: "https://mutex.buzz/", says: "what holds the frame this cycle" },
      "spw.quest": { href: `https://spw.quest/build#spw64=${spw64(spwOf(shot))}`, says: "this shot's Spw, to take apart a slot at a time" },
      ...(shot.material ? { "texture.website": { href: `https://texture.website/${shot.material.slug}`, says: `its surface, ${shot.material.word}` } } : {}),
    };
  });
}
