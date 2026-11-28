// mutex.buzz's pages: which hold is open, which hour of it, and how long it
// has left are worked out here, in the reader's browser, from the lock
// (lock.js, carried from src/ by carry.mjs). Written by hand. With scripts off
// the pages list the month's three holds and draw the mutex at rest.
import { DIAL, clockLine, countdown, dayOf, dialOf, holderFor, isoWeek, lastDay, monthDay, nowLine, seenAt, sinceWords, turnLine, turnOf } from "/lock.js";
import { hasSetRing, mountSetRing, openSetRing, slug as pathWord, spw64 } from "/set-ring.js";
import { attachPinch } from "/pinch.js";
import { mountTextScale } from "/text-scale.js";

/** Go to a page once the pinch's cue has been seen. */
const goTo = (href) => setTimeout(() => window.location.assign(href), 260);

const $ = (id) => document.getElementById(id);
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const holder = holderFor(new Date());
const since = Date.parse(holder.since);
const until = Date.parse(holder.releasesAt);

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

/** A line of Spw beneath lock.spw, painted as the file is. */
function writeLine(el, text) {
  el.replaceChildren();
  for (const m of text.matchAll(/(#[>:!]?[A-Za-z0-9_-]+)|([A-Za-z0-9_-]+)(?=@)|([*@~?!^%=&$])|(\[[^\]]*\])|(\{[^}]*\})|(\([^)]*\))|("[^"]*")|([^\s#@~?!^%=&$*\[{("]+|\s+|[^\S\r\n]*.)/g)) {
    const span = document.createElement("span");
    span.className = m[1] ? "m" : m[2] ? "m-at" : m[3] ? "m" : m[4] ? "b-mode" : m[5] ? "b-body" : m[6] ? "b-scene" : m[7] ? "s" : "w";
    span.textContent = m[0];
    el.append(span);
  }
  el.hidden = false;
}

if ($("holder-title")) $("holder-title").textContent = holder.title;

/**
 * The reader's last look, kept in this browser and nowhere else, so a return
 * says what changed since (sinceWords). The look is taken on arrival: a
 * refresh measures from the visit before it. visit-head.js reads the same key
 * before first paint to lay the page out for a return.
 */
const SEEN_KEY = "mutex.buzz:seen";
let lastLook = null;
if ($("since")) {
  try {
    lastLook = JSON.parse(localStorage.getItem(SEEN_KEY) || "null");
    localStorage.setItem(SEEN_KEY, JSON.stringify(seenAt(new Date())));
  } catch {
    lastLook = null;
  }
}

const dial = $("dial");
if (dial) {
  const d = dialOf(new Date());
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
  $("dial-desc").textContent = `${holder.title} holds the lock for cycle ${holder.cycle}, ${monthDay(holder.since)} through ${lastDay(holder)}.`;
  for (const item of document.querySelectorAll(".holds li")) {
    if (item.dataset.cycle === holder.cycle) item.setAttribute("aria-current", "true");
    else item.removeAttribute("aria-current");
  }
  // The bee flies from where this hold began to now, then rests there.
  const bee = $("bee");
  const from = d.holds.find((h) => h.cycle === d.current).from;
  const to = d.needle.angle;
  if (reduce) perch(bee, to);
  else {
    const start = performance.now();
    const fly = (t) => {
      const k = Math.min(1, (t - start) / 1400);
      perch(bee, from + (to - from) * (1 - (1 - k) ** 3));
      if (k < 1) requestAnimationFrame(fly);
    };
    perch(bee, from);
    requestAnimationFrame(fly);
  }
  // Each line of the rule lights the part of the lock it governs. Tap or press Enter to pin.
  const lines = [...document.querySelectorAll("#lock-spw .line")];
  let pinned = null;
  const light = (part) => { document.body.dataset.part = part ?? ""; };
  const syncPin = () => {
    for (const line of lines) line.setAttribute("aria-pressed", String(Boolean(pinned && line === pinned)));
    light(pinned ? pinned.dataset.part : null);
  };
  const togglePin = (line) => {
    pinned = pinned === line ? null : line;
    syncPin();
  };
  lines.forEach((line, index) => {
    line.tabIndex = 0;
    line.setAttribute("role", "button");
    line.setAttribute("aria-pressed", "false");
    line.addEventListener("pointerenter", () => { if (!pinned) light(line.dataset.part); });
    line.addEventListener("pointerleave", () => light(pinned ? pinned.dataset.part : null));
    line.addEventListener("focus", () => { if (!pinned) light(line.dataset.part); });
    line.addEventListener("blur", () => light(pinned ? pinned.dataset.part : null));
    line.addEventListener("click", () => togglePin(line));
    line.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        togglePin(line);
      } else if (event.key === "Escape" && pinned) {
        pinned = null;
        syncPin();
      } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const next = lines[(index + (event.key === "ArrowDown" ? 1 : -1) + lines.length) % lines.length];
        if (pinned) {
          pinned = next;
          syncPin();
        }
        next.focus();
      }
    });
  });
  if ($("now-line")) writeLine($("now-line"), nowLine(holder));
  // The tab names what holds the lock, so a tab left open says it too.
  document.title = `${holder.title} holds the lock — mutex.buzz`;
  // Back again: the explanation is folded (mutex.css), and its summary opens it.
  const explain = $("explain");
  explain?.querySelector("summary")?.addEventListener("click", (event) => {
    if (!document.documentElement.classList.contains("return") || explain.classList.contains("read")) return;
    event.preventDefault();
    explain.open = true;
    explain.classList.add("read");
  });
  // The set's ring, on the lock's own page (never /now/, which other pages frame): where the lock goes from here.
  mountSetRing("mutex.buzz", () => ({
    "factshift.center": { href: "https://factshift.center/?spw=mutex.buzz", says: "the lock read on the canvas: what holds it, as a line you can hold" },
    "tealstripesvibes.com": { href: "https://tealstripesvibes.com/@lock", says: "the stripes this hold fills in, an hour at a time" },
    "attention.productions": { href: `https://attention.productions/${pathWord(holder.title)}?shot=close-up&light=lamplight&focus=center`, says: `${holder.title}, as a shot` },
    "spw.quest": { href: `https://spw.quest/build#spw64=${spw64($("lock-spw")?.textContent ?? "")}`, says: "the rule, taken apart a slot at a time" },
    "texture.website": { href: `https://texture.website/${pathWord(holder.title)}?scale=close&light=lamplight&wear=handled&format=sheet`, says: `${holder.title}, as a surface under the lamp` },
  }));
  // The set's pinch: in is the holder, filling the frame; out is the set.
  attachPinch(dial, {
    plane: "lock",
    toward: (direction) => (direction === "in" ? "the holder" : hasSetRing() ? "the set" : null),
    go: (direction) => (direction === "in" ? goTo("/now/") : openSetRing()),
  });
}

const image = $("now-image");
if (image) {
  image.src = holder.image;
  image.alt = holder.alt;
  image.width = holder.width;
  image.height = holder.height;
  image.hidden = false;
  document.title = `${holder.title} holds the lock — mutex.buzz`;
  // Out from the holder is the lock, unless another page frames this one: then the frame stays where it is.
  if (window.top === window) attachPinch($("frame"), { plane: "holder", toward: (direction) => (direction === "out" ? "the lock" : null), go: () => goTo("/") });
}

/** Show an hour's detail of the holder: in the dial's cell, or across /now/. */
function showTurn(turn) {
  const picture = $("holder-image");
  if (picture) {
    const x = Number(picture.getAttribute("x")), y = Number(picture.getAttribute("y"));
    const w = Number(picture.getAttribute("width")), h = Number(picture.getAttribute("height"));
    const c = DIAL.size / 2;
    picture.style.transform = `translate(${c}px, ${c}px) scale(${turn.zoom}) translate(${-(x + w * turn.fx)}px, ${-(y + h * turn.fy)}px)`;
  }
  if (image) {
    image.style.transformOrigin = `${(turn.fx * 100).toFixed(1)}% ${(turn.fy * 100).toFixed(1)}%`;
    image.style.transform = `scale(${turn.zoom})`;
  }
  if ($("turn-line")) writeLine($("turn-line"), turnLine(turn));
  if ($("clock-line")) writeLine($("clock-line"), clockLine(holder, new Date()));
  if (dial) {
    const d = dialOf(new Date());
    perch($("bee"), d.needle.angle);
    $("rest").setAttribute("d", d.rest);
  }
}

// The clock: the countdown each second, a new turn each hour, the next holder at the close.
let lastTurn = -1;
function tick() {
  const now = new Date();
  if (now.getTime() >= until) return window.location.reload();
  const turn = turnOf(holder, now);
  if (turn.index !== lastTurn) {
    lastTurn = turn.index;
    showTurn(turn);
  }
  const share = (now.getTime() - since) / (until - since);
  const away = navigator.onLine === false ? " · offline, kept by this device" : "";
  const day = dayOf(holder, now);
  if ($("holder-when")) $("holder-when").textContent = `holds the lock · cycle ${holder.cycle}, day ${day.index} of ${day.of} · week ${isoWeek(now).week} · turn ${turn.index + 1} of ${turn.of} · releases in ${countdown(holder, now)}${away}`;
  const sinceLine = $("since");
  if (sinceLine) {
    const words = sinceWords(lastLook, now);
    if (sinceLine.textContent !== words) sinceLine.textContent = words;
  }
  if ($("spent")) $("spent").setAttribute("x2", (share * 100).toFixed(2));
  const rider = $("rider");
  if (rider) {
    rider.style.setProperty("--k", share.toFixed(4));
    // An SVG element has no hidden property: the attribute itself has to go.
    rider.removeAttribute("hidden");
  }
  // In the last day and a half the shackle starts to lift: the hand-off is the loud moment.
  document.body.classList.toggle("letting-go", until - now.getTime() < 36 * 3_600_000);
}
tick();
window.setInterval(tick, 1000);

// Installed, mutex.buzz keeps the lock with no network (sw.js); framed on attention.productions, /now/ installs nothing.
if ("serviceWorker" in navigator && window.top === window) navigator.serviceWorker.register("/sw.js").catch(() => {});
const keep = $("keep-app");
let offer = null;
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  offer = event;
  if (keep) keep.hidden = false;
});
keep?.addEventListener("click", async () => {
  if (!offer) return;
  offer.prompt();
  await offer.userChoice.catch(() => null);
  offer = null;
  keep.hidden = true;
});
window.addEventListener("appinstalled", () => { if (keep) keep.hidden = true; });

/**
 * The mutex you can watch. Bees are threads: they arrive, wait in line, take
 * the cell one at a time while the ring fills (the critical section), and
 * leave by the far side as the next one goes in. Send a bee adds a thread.
 * It runs only while it can be seen; with motion reduced it steps instead of flying.
 */
const threads = $("threads");
if (threads) {
  const layer = $("threads-bees");
  const ring = $("threads-ring");
  const cell = $("threads-cell");
  const count = $("threads-count");
  const send = $("send-bee");
  const CELL = [520, 90];
  const slot = (i) => [430 - i * 44, 90];
  const MAX_WAITING = 6;
  const HOLD_MS = 1600;
  const bees = [];
  let inside = null;
  let heldSince = 0;
  let acquired = 0;
  let lastSpawn = 0;
  let visible = true;

  const make = (x, y) => {
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", "#bee-shape");
    layer.append(use);
    return { use, x, y, tx: x, ty: y, angle: 0, gone: false, leaving: false };
  };
  const draw = (b) => b.use.setAttribute("transform", `translate(${b.x.toFixed(1)} ${b.y.toFixed(1)}) rotate(${b.angle.toFixed(0)}) scale(1.3)`);
  const waiting = () => bees.filter((b) => b !== inside && !b.leaving);
  const say = () => {
    const n = waiting().length;
    count.textContent = `${acquired} ${acquired === 1 ? "acquire" : "acquires"} · ${inside ? "one inside" : "the cell is free"} · ${n} waiting`;
  };
  const arrive = (now) => {
    lastSpawn = now;
    if (waiting().length >= MAX_WAITING) return;
    bees.push(make(-30, 40 + ((acquired * 37 + bees.length * 23) % 100)));
  };
  const place = () => {
    waiting().forEach((b, i) => { [b.tx, b.ty] = slot(i); b.use.setAttribute("class", "waiting"); });
    if (inside) { [inside.tx, inside.ty] = CELL; inside.use.setAttribute("class", "inside"); }
  };
  const step = (now, instant = false) => {
    // Release: the holder leaves by the far side, and the head of the line acquires.
    if (inside && (instant || now - heldSince >= HOLD_MS)) {
      inside.leaving = true;
      inside.tx = 640;
      inside.ty = 18;
      inside = null;
    }
    if (!inside) {
      const next = waiting()[0];
      if (next) { inside = next; heldSince = now; acquired += 1; }
    }
    cell.classList.toggle("held", Boolean(inside));
    ring.style.strokeDashoffset = inside && !reduce ? String(1 - Math.min(1, (now - heldSince) / HOLD_MS)) : inside ? "0" : "1";
    place();
    say();
  };
  const move = (b, k) => {
    const dx = b.tx - b.x, dy = b.ty - b.y;
    if (Math.abs(dx) + Math.abs(dy) > 0.5) b.angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    else b.angle *= 0.9;
    b.x += dx * k;
    b.y += dy * k;
    if (b.leaving && b.x > 620) { b.use.remove(); b.gone = true; }
    else draw(b);
  };
  const sweep = () => { for (let i = bees.length - 1; i >= 0; i -= 1) if (bees[i].gone) bees.splice(i, 1); };

  // Start from what the page drew: one inside, two waiting.
  layer.replaceChildren();
  for (const [x, y] of [CELL, slot(0), slot(1)]) bees.push(make(x, y));
  inside = bees[0];
  heldSince = performance.now();
  acquired = 1;
  place();
  bees.forEach(draw);
  say();

  send.hidden = false;
  send.addEventListener("click", () => {
    const now = performance.now();
    arrive(now);
    if (reduce) {
      // No flight: the line moves up one place, and every bee is set down where it belongs.
      step(now, true);
      for (const b of bees) move(b, 1);
      sweep();
    }
  });

  if (!reduce) {
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(threads);
    const frame = (now) => {
      if (visible && document.visibilityState === "visible") {
        if (now - lastSpawn > 2300) arrive(now);
        step(now);
        for (const b of bees) move(b, 0.07);
        sweep();
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
}

// Use the lock: the embed's code, copied whole.
const copyEmbed = $("copy-embed");
if (copyEmbed && navigator.clipboard) {
  copyEmbed.hidden = false;
  copyEmbed.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText($("embed-code").textContent);
      copyEmbed.textContent = "Copied";
    } catch {
      copyEmbed.textContent = "Select it above";
    }
    setTimeout(() => { copyEmbed.textContent = "Copy"; }, 1800);
  });
}

// spwashi.com's pinch on the words sizes them; the dial and the holder keep their own pinch (text-scale.js).
mountTextScale(document.querySelector("main"), { ignore: ".pinchable" });
