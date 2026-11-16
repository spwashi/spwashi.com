// mutex.buzz's pages: which hold is open is worked out here, in the reader's
// browser, from the lock (lock.js, carried from src/ by carry.mjs). Written by
// hand. With scripts off the pages list the month's three holds instead.
import { DIAL, dialOf, holderFor, lastDay, monthDay, nowLine, untilRelease } from "/lock.js";

const $ = (id) => document.getElementById(id);
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const now = new Date();
const holder = holderFor(now);
const since = Date.parse(holder.since);
const until = Date.parse(holder.releasesAt);
const spent = Math.min(1, Math.max(0, (now.getTime() - since) / (until - since)));

/** The words under the holder: its hold, its days, and when it lets go. */
const when = `holds the lock · cycle ${holder.cycle} · ${monthDay(holder.since)} through ${lastDay(holder)} · ${untilRelease(holder, now)}`;
if ($("holder-title")) $("holder-title").textContent = holder.title;
if ($("holder-when")) $("holder-when").textContent = when;
// In the last day and a half the shackle starts to lift: the hand-off is the loud moment.
document.body.classList.toggle("letting-go", until - now.getTime() < 36 * 3_600_000);

/** A place on the ring, by its angle from the top, clockwise. */
const onRing = (angle) => {
  const a = ((angle - 90) * Math.PI) / 180;
  return [DIAL.size / 2 + DIAL.r * Math.cos(a), DIAL.size / 2 + DIAL.r * Math.sin(a)];
};

/** Set the bee down on the ring at an angle, facing the way the month runs. */
const perch = (bee, angle) => {
  const [x, y] = onRing(angle);
  bee.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle.toFixed(1)}) scale(1.5)`);
};

/** The line beneath lock.spw that says what holds now, painted as the file is. */
function writeNowLine(el, text) {
  el.replaceChildren();
  for (const m of text.matchAll(/(\*)|(\[[^\]]*\])|(\{[^}]*\})|(\([^)]*\))|([^*[{(]+)/g)) {
    const span = document.createElement("span");
    span.className = m[1] ? "m" : m[2] ? "b-mode" : m[3] ? "b-body" : m[4] ? "b-scene" : "w";
    span.textContent = m[0];
    el.append(span);
  }
  el.hidden = false;
}

const dial = $("dial");
if (dial) {
  const d = dialOf(now);
  for (const path of dial.querySelectorAll(".hold")) {
    const hold = d.holds.find((h) => h.cycle === path.dataset.cycle);
    path.setAttribute("d", hold.path);
    path.classList.toggle("current", hold.cycle === d.current);
  }
  for (const text of dial.querySelectorAll(".labels text")) {
    const hold = d.holds.find((h) => h.cycle === text.dataset.cycle);
    text.setAttribute("x", hold.label.x);
    text.setAttribute("y", hold.label.y);
    text.classList.toggle("current", hold.cycle === d.current);
  }
  $("rest").setAttribute("d", d.rest);
  $("holder-image").setAttribute("href", holder.image);
  $("window-word").classList.add("gone");
  $("dial-desc").textContent = `${holder.title} holds the lock for cycle ${holder.cycle}, ${monthDay(holder.since)} through ${lastDay(holder)}; it ${untilRelease(holder, now)}.`;
  for (const item of document.querySelectorAll(".holds li")) {
    if (item.dataset.cycle === holder.cycle) item.setAttribute("aria-current", "true");
    else item.removeAttribute("aria-current");
  }

  // The bee flies from where this hold began to today, then rests there.
  const bee = $("bee");
  const from = d.holds.find((h) => h.cycle === d.current).from;
  const to = d.needle.angle;
  if (reduce) perch(bee, to);
  else {
    const start = performance.now();
    const ease = (t) => 1 - (1 - t) ** 3;
    const fly = (t) => {
      const k = Math.min(1, (t - start) / 1400);
      perch(bee, from + (to - from) * ease(k));
      if (k < 1) requestAnimationFrame(fly);
    };
    perch(bee, from);
    requestAnimationFrame(fly);
  }

  // Each line of the rule lights the part of the lock it governs.
  const light = (part) => { document.body.dataset.part = part ?? ""; };
  for (const line of document.querySelectorAll("#lock-spw .line")) {
    line.tabIndex = 0;
    line.addEventListener("pointerenter", () => light(line.dataset.part));
    line.addEventListener("pointerleave", () => light(null));
    line.addEventListener("focus", () => light(line.dataset.part));
    line.addEventListener("blur", () => light(null));
  }
  const nowEl = $("now-line");
  if (nowEl) writeNowLine(nowEl, nowLine(holder));
}

const image = $("now-image");
if (image) {
  image.src = holder.image;
  image.alt = holder.alt;
  image.width = holder.width;
  image.height = holder.height;
  image.hidden = false;
  $("spent").setAttribute("x2", (spent * 100).toFixed(1));
  const rider = $("rider");
  rider.style.setProperty("--k", spent.toFixed(3));
  // An SVG element has no hidden property: the attribute itself has to go.
  rider.removeAttribute("hidden");
  document.title = `${holder.title} holds the lock — mutex.buzz`;
}
