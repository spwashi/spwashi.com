// attention.productions' page: reads the address as a shot and draws it. Written
// by hand; the composer it imports (compose.js, vocabulary.js, materials.js) is
// carried from src/ by carry.mjs. With scripts off the page shows its first
// shot and its links still lead to each word's address.
import { readNote } from "/lib/near-word.js";
import { FIRST_SHOT, SUBJECT_DEPTH, addressOf, beatHrefOf, canvasHrefOf, dayShot, expressionHtml, stepKey, stepShot, cornersOf, geometryOf, nearestFocus, nearestFrom, nearestSheet, promptOf, readShot, slug, slotText, spwOf, tempoAt, tempoOf, textureHrefOf, textureReturnOf, paletteFilterOf, SURFACE_KEYS } from "/compose.js";
import { DEFAULT_SUBJECT, LADDERS, SHAPES, TEMPO } from "/vocabulary.js";
import { hasSetRing, mountSetRing, nearestSeed, openSetRing, slug as pathWord, spw64 } from "/set-ring.js";
import { attachPinch, wasPinch } from "/pinch.js";
import { mountTextScale } from "/text-scale.js";
import { mountCleanStill } from "/clean-still.js";
import { bindSlotScrub } from "/slot-scrub.js";
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
/** A scrub across a bracket in the expression: the ladder it holds, where the hand started, and how many words it has crossed. */
let scrub = null;
/** The site that sent the reader here to tune something (via=), so the page can offer the way back. */
let cameVia = "";
/** The texture.website address the reader left (back=), kept so the way back changes only what was tuned here. */
let cameBack = "";
/** The last kept shot. A scrub or a drag previews in `shot`; only a kept change moves this, so undo never lands mid-gesture. */
let committed = FIRST_SHOT;
/** Kept shots before and after this one, for undo and redo. */
const past = [];
const future = [];
const UNDO_DEPTH = 40;
/** The last change's group and time, so a burst of typing is one undo step. */
let lastGroup = { key: "", at: 0 };
/** This tab's takes and the way back to the site that sent the reader, kept across a reload (sessionStorage). */
const SESSION = "attention.session/1";
/** Up to six recent takes kept in memory for one-tap A/B comparison. */
const MAX_TAKES = 6;
let takes = [];

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
  paintExpr();
  $("vf-desc").textContent = plain;
  $("shot-label").textContent = shot.named ? "Your shot" : "Today's shot";
  $("shot-day").textContent = shot.named ? "" : shot.day;
  svg.dataset.light = slug(shot.light);
  svg.dataset.move = slug(shot.move);
  svg.toggleAttribute("data-surface", Boolean(shot.material));
  // A palette prints the whole frame in its inks, as texture.website prints its stage.
  const palette = $("palette"), scene = $("gate-scene");
  const inks = paletteFilterOf(shot.palette);
  if (palette && palette.dataset.word !== (shot.palette ?? "")) { palette.innerHTML = inks; palette.dataset.word = shot.palette ?? ""; }
  if (scene) { if (inks) scene.setAttribute("filter", "url(#palette)"); else scene.removeAttribute("filter"); }
  const image = $("surface-image");
  if (shot.material) image.setAttribute("href", `https://texture.website/${shot.material.slug}.png`);
  else image.removeAttribute("href");
  const target = geometryOf(shot);
  // What a lens adds or takes away is shown or hidden, not tweened: the flare and the bokeh.
  $("flare").classList.toggle("off", !target.flare.on);
  svg.querySelectorAll("#bokeh ellipse").forEach((e, i) => e.classList.toggle("off", !target.bokeh[i].on));
  svg.style.setProperty("--tempo", String(shot.tempo));
  // Every way to factshift.center opens the canvas on this shot: its Spw and the prompt it makes.
  for (const link of document.querySelectorAll('a[href^="https://factshift.center/"]:not(#beat-canvas)')) link.setAttribute("href", canvasHrefOf(shot));
  $("beat-canvas")?.setAttribute("href", beatHrefOf(shot));
  const textureLink = $("texture-link");
  if (textureLink) textureLink.setAttribute("href", textureReturnOf(shot, cameBack));
  // Arrived from texture.website to turn its light: the way back says, as the lamp moves, what light it carries.
  const returnLink = $("return-link");
  if (returnLink && cameVia === "texture.website") {
    returnLink.setAttribute("href", textureReturnOf(shot, cameBack));
    returnLink.textContent = `← back to texture.website: ${shot.light}, from ${shot.from === "behind" ? "behind" : shot.from === "above" || shot.from === "below" ? shot.from : `the ${shot.from}`}`;
  }
  const subjectInput = $("subject-input");
  if (subjectInput && document.activeElement !== subjectInput && subjectInput.value !== shot.subject) subjectInput.value = shot.subject;
  const materialSelect = $("material-select");
  if (materialSelect) materialSelect.value = shot.material?.slug ?? "";
  paintTakes();
  set($("beat"), { "aria-valuenow": shot.tempo, "aria-valuetext": `tempo ×${shot.tempo.toFixed(1)}` });
  set($("lamp"), { "aria-valuetext": `light from ${shot.from}` });
  svg.style.setProperty("--fx", `${target.focus.x}px`);
  svg.style.setProperty("--fy", `${target.focus.y}px`);
  sharpen(target);
  // A scrub steps through words; the frame follows at once, as a handle does, and eases only when the hand lets go.
  if (scrub) { cancelAnimationFrame(tweenFrame); drawn = target; apply(target); }
  else moveTo(target);
  rackFocus();
  const undoButton = $("undo-shot"), redoButton = $("redo-shot");
  if (undoButton) undoButton.disabled = !past.length;
  if (redoButton) redoButton.disabled = !future.length;
  for (const row of document.querySelectorAll(".ladder")) {
    const key = row.dataset.key;
    for (const link of row.querySelectorAll("a[data-word]")) {
      const word = link.dataset.word;
      const material = key === "material" ? MATERIALS.find((m) => m.slug === word) ?? null : shot.material;
      // A surface row's "none" is no word: the prompt says nothing of wear or process.
      const next = key === "material" ? { ...shot, material } : { ...shot, [key]: SURFACE_KEYS.includes(key) ? word || null : word };
      link.setAttribute("href", addressOf(next));
      const current = key === "material" ? (shot.material?.slug ?? "") === word : (shot[key] ?? "") === word;
      if (current) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    }
  }
  centreLadders();
}

/** On a phone a ladder is one row that scrolls sideways: bring each row's word to the middle, past its pinned name. */
function centreLadders() {
  for (const row of document.querySelectorAll(".ladder")) {
    if (row.scrollWidth <= row.clientWidth + 1) continue;
    const on = row.querySelector("a[aria-current]");
    const name = row.querySelector(".key")?.offsetWidth ?? 0;
    if (on) row.scrollLeft = on.offsetLeft - name - (row.clientWidth - name - on.offsetWidth) / 2;
  }
}

/** The expression: each bracket is the word it holds. The nodes stay, so a scrub keeps its hand. */
function paintExpr() {
  const expr = $("expr");
  if (!expr) return;
  if (!expr.querySelector(".slot")) expr.innerHTML = expressionHtml(shot);
  // The subject is the address's own words; the page may arrive carrying another's.
  const subject = expr.querySelector(".subject");
  if (subject && subject.textContent !== `{${shot.subject}}`) subject.textContent = `{${shot.subject}}`;
  for (const slot of expr.querySelectorAll(".slot")) {
    const key = slot.dataset.key;
    const word = slotText(shot, key);
    const shown = slot.querySelector(".word");
    if (shown && shown.textContent !== word) shown.textContent = word;
    const href = addressOf({ ...shot, ...stepKey(shot, key, 1) });
    if (slot.getAttribute("href") !== href) slot.setAttribute("href", href);
    slot.setAttribute("role", "slider");
    slot.setAttribute("aria-label", key);
    slot.setAttribute("aria-valuetext", word);
    slot.classList.toggle("scrubbing", scrub?.key === key);
  }
}

/**
 * The brackets. A drag sideways steps that ladder, one word per 28px (slot-scrub.js),
 * and the frame follows; letting go keeps the word (commit: "on-lift"). A tap, or
 * the arrow keys, steps once. The link underneath is the next word, for when scripts are off.
 */
function wireExpr() {
  const expr = $("expr");
  if (!expr) return;
  bindSlotScrub(expr, {
    selector: ".slot",
    commit: "on-lift",
    onStart: (key) => {
      scrub = { key, base: shot };
      return shot;
    },
    onStep: (key, _dir, { delta, base }) => {
      scrub = { key, base };
      shot = { ...base, ...stepKey(base, key, delta) };
      render();
    },
    onRelease: (key, { delta, base }) => {
      scrub = null;
      commit(stepKey(base, key, delta));
    },
    onTap: (key) => {
      scrub = null;
      commit(stepKey(shot, key, 1));
    },
    onKey: (key, by) => {
      scrub = null;
      commit(stepKey(shot, key, by));
    },
  });
}

/** Remember up to MAX_TAKES distinct framings for quick A/B comparison. */
function rememberTake(entry) {
  const addr = addressOf(entry);
  takes = [{ ...entry, addr }, ...takes.filter((t) => t.addr !== addr)].slice(0, MAX_TAKES);
}

/** The words where a take differs from a shot, subject first, in the order the page shows its ladders. */
function takeDifference(take, from) {
  const words = [];
  if (take.subject !== from.subject) words.push(take.subject);
  for (const key of Object.keys(LADDERS)) if (take[key] !== from[key]) words.push(take[key]);
  if ((take.material?.slug ?? "") !== (from.material?.slug ?? "")) words.push(take.material?.word ?? "no surface");
  for (const key of SURFACE_KEYS) if ((take[key] ?? null) !== (from[key] ?? null)) words.push(take[key] ?? `no ${key}`);
  if (take.tempo !== from.tempo) words.push(`tempo ${take.tempo}`);
  return words.length ? words : ["the same words"];
}

/** Paint the recent-take strip once more than one take exists. */
function paintTakes() {
  const box = $("takes");
  if (!box) return;
  if (takes.length < 2) { box.hidden = true; return; }
  box.hidden = false;
  const currentAddr = addressOf(shot);
  box.replaceChildren();
  const label = document.createElement("span");
  label.className = "takes-label";
  label.textContent = "Takes";
  box.append(label);
  for (const entry of takes) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "take-chip";
    // A take is named by what it would change: the words where it differs from the shot on screen.
    const here = entry.addr === currentAddr;
    const differs = takeDifference(entry, shot);
    btn.textContent = here ? "this shot" : `${differs.slice(0, 3).join(" · ")}${differs.length > 3 ? ` +${differs.length - 3}` : ""}`;
    btn.title = `${entry.subject} · ${entry.shot} · ${entry.lens} · ${entry.light}${entry.material ? ` · ${entry.material.word}` : ""}`;
    if (here) btn.setAttribute("aria-current", "true");
    btn.addEventListener("click", () => {
      const { addr: _addr, ...rest } = entry;
      setShot({ ...rest }, { record: false });
    });
    box.append(btn);
  }
}

/** Copy text with explicit temporary confirmation on the pressed button. */
async function copyWithReceipt(button, text) {
  const original = button.dataset.label || button.textContent;
  button.dataset.label = original;
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = "Copied";
  } catch {
    button.textContent = "Select prompt";
  }
  button.dataset.copied = "";
  clearTimeout(button._copyTimer);
  button._copyTimer = setTimeout(() => {
    button.textContent = original;
    delete button.dataset.copied;
  }, 1400);
}

/**
 * The one way the shot changes. The last kept shot goes on the undo stack (a
 * change to the same address adds nothing, and a burst in one `group`, such as
 * typing the subject, is one step), the address becomes the new shot's, so a
 * reload or a shared link is this shot, the take is remembered, this tab's
 * session is kept, and the page is drawn.
 */
function setShot(next, { record = true, group = "" } = {}) {
  const now = Date.now();
  const sameBurst = Boolean(group) && lastGroup.key === group && now - lastGroup.at < 1500;
  lastGroup = { key: group, at: now };
  if (addressOf(next) !== addressOf(committed) && !sameBurst) {
    past.push(committed);
    if (past.length > UNDO_DEPTH) past.shift();
    future.length = 0;
  }
  shot = committed = next;
  if (record) rememberTake(shot);
  settle();
}

/** Keep a change to some of the shot's words. */
function commit(change, options) {
  setShot({ ...shot, ...change, named: true }, options);
}

/** Write the kept shot to the address and this tab's session, and draw it. */
function settle() {
  window.history.replaceState(null, "", addressOf(shot));
  keepSession();
  render();
}

/** Step back to the shot kept before this one, or forward again. */
function undo() {
  if (!past.length) return;
  future.push(committed);
  shot = committed = past.pop();
  lastGroup = { key: "", at: 0 };
  settle();
}
function redo() {
  if (!future.length) return;
  past.push(committed);
  shot = committed = future.pop();
  lastGroup = { key: "", at: 0 };
  settle();
}

function keepSession() {
  try {
    sessionStorage.setItem(SESSION, JSON.stringify({ takes: takes.map((t) => t.addr), via: cameVia, back: cameBack }));
  } catch {
    // Storage refused: the session lives in the page.
  }
}

/** On a reload or a return to this page, bring back this tab's takes and the way back. A new arrival starts fresh. */
function restoreSession() {
  const how = performance.getEntriesByType?.("navigation")?.[0]?.type;
  if (how !== "reload" && how !== "back_forward") return;
  try {
    const kept = JSON.parse(sessionStorage.getItem(SESSION) ?? "null");
    if (!kept) return;
    if (!cameVia && kept.via) { cameVia = kept.via; cameBack = kept.back ?? ""; }
    takes = (kept.takes ?? []).slice(0, MAX_TAKES).map((addr) => {
      const at = new URL(addr, window.location.origin);
      return { ...readShot(at.pathname, at.search, today()), addr };
    });
  } catch {
    // Nothing kept, or kept by an older page: start fresh.
  }
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
    if (wasPinch()) return;
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
    else if (SURFACE_KEYS.includes(key)) commit({ [key]: link.dataset.word || null });
    else commit({ [key]: link.dataset.word });
  });
  wireExpr();
  const subjectInput = $("subject-input");
  subjectInput?.addEventListener("input", () => {
    const clean = subjectInput.value.replace(/\s+/g, " ").trim().slice(0, 80);
    commit({ subject: clean || DEFAULT_SUBJECT }, { record: false, group: "subject" });
  });
  subjectInput?.addEventListener("change", () => rememberTake(shot));
  $("expr")?.addEventListener("click", (event) => {
    if (event.target.closest?.(".subject")) {
      subjectInput?.focus();
      subjectInput?.select();
    }
  });
  $("material-select")?.addEventListener("change", (event) => {
    const chosen = event.target.value;
    commit({ material: MATERIALS.find((m) => m.slug === chosen) ?? null });
  });
  $("copy-mj")?.addEventListener("click", (event) => copyWithReceipt(event.currentTarget, promptOf(shot).midjourney));
  $("copy-plain")?.addEventListener("click", (event) => copyWithReceipt(event.currentTarget, promptOf(shot).plain));
  $("copy-spw")?.addEventListener("click", (event) => copyWithReceipt(event.currentTarget, spwOf(shot)));
  $("roll-shot")?.addEventListener("click", () => {
    const next = {};
    for (const [key, words] of Object.entries(LADDERS)) {
      const others = words.filter((w) => w !== shot[key]);
      next[key] = others[Math.floor(Math.random() * others.length)] ?? words[0];
    }
    commit(next);
  });
  $("today-shot")?.addEventListener("click", () => {
    const d = today();
    setShot({ ...shot, ...dayShot(d), day: d, named: shot.subject !== DEFAULT_SUBJECT });
  });
  $("undo-shot")?.addEventListener("click", undo);
  $("redo-shot")?.addEventListener("click", redo);
  // ⌘Z / Ctrl+Z steps back, with Shift (or Ctrl+Y) forward; a text field keeps its own undo.
  document.addEventListener("keydown", (event) => {
    if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
    if (event.target.closest?.("input, textarea, select, [contenteditable]")) return;
    const key = event.key.toLowerCase();
    if (key === "z") { event.preventDefault(); if (event.shiftKey) redo(); else undo(); }
    else if (key === "y" && event.ctrlKey) { event.preventDefault(); redo(); }
  });
  const prompt = $("prompt");
  prompt?.closest(".prompt")?.addEventListener("click", async () => {
    const el = prompt.closest(".prompt");
    try {
      await navigator.clipboard.writeText(prompt.textContent);
    } catch {
      const range = document.createRange();
      range.selectNodeContents(prompt);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
    el.dataset.copied = "";
    setTimeout(() => { delete el.dataset.copied; }, 1200);
  });
  reduce.addEventListener?.("change", () => { apply(drawn); rackFocus(); });
}

if (svg) {
  cameVia = new URLSearchParams(window.location.search).get("via") ?? "";
  cameBack = cameVia === "texture.website" ? new URLSearchParams(window.location.search).get("back") ?? "" : "";
  restoreSession();
  if (cameVia === "texture.website" && $("return-note")) $("return-note").hidden = false;
  shot = committed = readShot(window.location.pathname, window.location.search, today());
  // A link from a neighbour may speak its own words: say once how they were read.
  const readLine = readNote(shot.read);
  const readEl = $("read-note");
  if (readEl && readLine) { readEl.textContent = readLine; readEl.hidden = false; }
  rememberTake(shot);
  keepSession();
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
      "texture.website": shot.material
        ? { href: textureReturnOf(shot, cameBack), says: `its surface, ${shot.material.word}, at this distance and light` }
        : { href: textureReturnOf(shot, cameBack), says: "a surface for this distance and light" },
    };
  });
  // The set's pinch: in is a tighter shot, out a wider one, and out past establishing is the set.
  attachPinch(svg, {
    plane: "shot",
    toward: (direction) => stepShot(shot, direction) ?? (direction === "out" && hasSetRing() ? "the set" : null),
    go: (direction) => { const next = stepShot(shot, direction); if (next) commit({ shot: next }); else openSetRing(); },
  });
}

let centring = 0;
window.addEventListener("resize", () => { cancelAnimationFrame(centring); centring = requestAnimationFrame(centreLadders); }, { passive: true });

// spwashi.com's pinch on the words sizes them; the viewfinder keeps its own pinch (text-scale.js).
mountTextScale(document.querySelector("main"), { ignore: ".pinchable" });
mountCleanStill({ key: "p", idleMs: 4500 });

if ("serviceWorker" in navigator && window.top === window) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}
