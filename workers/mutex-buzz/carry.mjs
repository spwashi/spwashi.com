// Carries mutex.buzz into assets/ as files, so no request runs a script (it
// answered 429, error 1027, under site-hub-next when the account's daily
// Worker requests ran out). What it computed per request was the date: which
// of the month's three holds is open. The pages' script works that out in the
// reader's browser from src/lock.js, and /now.json is the schedule itself. It
// writes:
// - assets/lock.js: the lock, byte for byte, for the pages' script to import;
// - assets/index.html and assets/now/index.html: each page with the month's
//   holds drawn and listed, so they read with scripts off;
// - assets/now.json: every hold from October 2026 through 2027, with its holder;
// - assets/folios/*.webp: the resting folios, copied from the site's images;
// - favicon.svg, robots.txt, ecosystem.json, registry.json (the paths the host
//   answered under site-hub-next), llms.txt, 404.html and _headers.
// --check fails when a carried file differs from what this would write.
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { escapeHtml } from "../lib/http.js";
import { writeOrCheck } from "../lib/carry.js";
import { ecosystemJson } from "../site-hub-next/src/hosts/ecosystem.js";
import { CYCLES, DIAL, FOLIOS, QUEUE, dialOf, scheduleBetween } from "./src/lock.js";
import { ICONS, iconPng } from "./src/icon.js";
import { parse } from "../../public/js/semantic/spw-workbench-reader.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(HERE, "assets");
const ROOT = path.resolve(HERE, "../..");
const ORIGIN = "https://mutex.buzz";

/** The folios' images, from the site's own files. */
export const FOLIO_SOURCES = Object.freeze({
  "lined-stage-facade.webp": "public/images/assets/folios/folio-lined-stage-facade-hero.webp",
  "teal-stripes-vibes-wash.webp": "public/images/assets/folios/folio-teal-stripes-vibes-wash-hero.webp",
  "factshift-cabinet.webp": "public/images/assets/folios/folio-factshift-cabinet-hero.webp",
});

/** The schedule a file can hold: the season, and the feature's year after it. Fixed, so the carry is the same on any day. */
export const SCHEDULE = Object.freeze({ from: "2026-10-01", until: "2028-01-01" });

/** The month the pages draw before the script redraws it for today. */
const DRAWN_MONTH = new Date(Date.UTC(2026, 10, 1));

const BASE = ["X-Content-Type-Options: nosniff", "Referrer-Policy: strict-origin-when-cross-origin", "Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()"];
export const CSP_HOME = "default-src 'none'; img-src 'self'; style-src 'self'; script-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests";
export const CSP_NOW = "default-src 'none'; img-src 'self'; style-src 'self'; script-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'self' https://attention.productions; upgrade-insecure-requests";

function headersFile() {
  // Cloudflare joins every rule a path matches, so no two rules here set the same header on one path:
  // / and /now/ each carry their own policy, and only / refuses to be framed.
  const rule = (pattern, lines) => [pattern, ...lines.map((line) => `  ${line}`), ""].join("\n");
  return [
    "# Written by workers/mutex-buzz/carry.mjs.",
    rule("/*", BASE),
    rule("/", [`Content-Security-Policy: ${CSP_HOME}`, "X-Frame-Options: DENY"]),
    rule("/now/", [`Content-Security-Policy: ${CSP_NOW}`]),
    rule("/*.json", ["Cache-Control: public, max-age=300", "Access-Control-Allow-Origin: *"]),
    rule("/*.js", ["Cache-Control: public, max-age=300", "Content-Type: text/javascript; charset=UTF-8"]),
    rule("/*.css", ["Cache-Control: public, max-age=300"]),
    rule("/*.spw", ["Cache-Control: public, max-age=300", "Content-Type: text/plain; charset=UTF-8", "Access-Control-Allow-Origin: *"]),
    rule("/*.txt", ["Cache-Control: public, max-age=300", "Content-Type: text/plain; charset=UTF-8"]),
    rule("/folios/*", ["Cache-Control: public, max-age=86400"]),
    rule("/icons/*", ["Cache-Control: public, max-age=86400"]),
    rule("/manifest.webmanifest", ["Cache-Control: public, max-age=300", "Content-Type: application/manifest+json"]),
    // The service worker is always asked for afresh, so a deploy reaches an installed app.
    rule("/sw.js", ["Cache-Control: no-cache"]),
  ].join("\n");
}

const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#120d07"/>
  <polygon points="16,3.5 27,9.75 27,22.25 16,28.5 5,22.25 5,9.75" fill="#ffc53d"/>
  <path d="M5 13.5h22M5 19h22" stroke="#120d07" stroke-width="3"/>
  <path d="M11 10.5V8.5a5 5 0 0 1 10 0v2" fill="none" stroke="#120d07" stroke-width="2"/>
</svg>
`;

const ordinal = (n) => `${n}${n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th"}`;

/** The month's three holds as a list: which days, and what rests in each. */
const holdsList = () => `<ol class="holds" aria-label="The month's three holds">
        ${CYCLES.map(({ cycle, from, through }) => `<li data-cycle="${cycle}"><b>${cycle}</b> <span class="days">${ordinal(from)} to the ${through}</span> <span class="who">${escapeHtml(FOLIOS[cycle].title)}</span></li>`).join("\n        ")}
      </ol>`;

/** A bee facing along the ring, at the origin; the script sets where it flies. */
export const BEE = `<g class="bee-body"><ellipse class="wing" cx="-3" cy="-10" rx="8" ry="5"/><ellipse class="wing" cx="4" cy="-10" rx="7" ry="4.5"/><path class="sting" d="M-12 0h-6"/><ellipse class="abdomen" cx="0" cy="0" rx="13" ry="9"/><path class="stripe" d="M-5 -8.2V8.2M2 -8.8V8.8"/><circle class="head" cx="13" cy="0" r="5.5"/></g>`;

/** A pointy-topped hexagon around a centre, as polygon points. */
const hexagon = (cx, cy, r) => [-90, -30, 30, 90, 150, 210].map((deg) => { const a = (deg * Math.PI) / 180; return `${Math.round((cx + r * Math.cos(a)) * 10) / 10},${Math.round((cy + r * Math.sin(a)) * 10) / 10}`; }).join(" ");

/**
 * The dial, drawn for one month; the script redraws it for the reader's month
 * and flies the bee to where today sits. The holder sits in one cell of a
 * comb: one bee to a cell, one concept to a frame.
 */
function dial() {
  const d = dialOf(DRAWN_MONTH);
  const c = DIAL.size / 2;
  const R = 185;
  const w = Math.round(Math.sqrt(3) * R * 10) / 10;
  const s = 12;
  const cw = Math.round(Math.sqrt(3) * s * 100) / 100;
  return `<svg class="dial" id="dial" viewBox="0 0 ${DIAL.size} ${DIAL.size}" role="img" aria-labelledby="dial-title dial-desc">
        <title id="dial-title">The lock's month</title>
        <desc id="dial-desc">A ring for the month, in three holds: A to the 13th, B to the 26th, C to the last day. One holder sits in the cell at a time.</desc>
        <defs>
          <pattern id="comb" width="${cw}" height="${3 * s}" patternUnits="userSpaceOnUse"><path d="M${cw / 2} 0L${cw} ${s / 2}V${(3 * s) / 2}L${cw / 2} ${2 * s}L0 ${(3 * s) / 2}V${s / 2}ZM${cw / 2} ${2 * s}V${3 * s}"/></pattern>
          <clipPath id="cell-clip"><polygon points="${hexagon(c, c, R)}"/></clipPath>
        </defs>
        <circle class="comb" cx="${c}" cy="${c}" r="${DIAL.r - 14}"/>
        <path class="shackle" id="shackle" d="M${c - 26} ${c - DIAL.r + 2}V${c - DIAL.r - 18}a26 26 0 0 1 52 0V${c - DIAL.r + 2}"/>
        <circle class="track" cx="${c}" cy="${c}" r="${DIAL.r}"/>
        <g class="arcs">${d.holds.map((h) => `<path class="hold" data-cycle="${h.cycle}" d="${h.path}"/>`).join("")}</g>
        <g class="labels">${d.holds.map((h) => `<text data-cycle="${h.cycle}" x="${h.label.x}" y="${h.label.y}">${h.cycle}</text>`).join("")}</g>
        <path class="rest" id="rest" d=""/>
        <polygon class="window" points="${hexagon(c, c, R)}"/>
        <g clip-path="url(#cell-clip)"><image class="holder" id="holder-image" x="${Math.round((c - w / 2) * 10) / 10}" y="${c - R}" width="${w}" height="${2 * R}" preserveAspectRatio="xMidYMid meet"/></g>
        <text class="window-word" id="window-word" x="${c}" y="${c + 6}">one to a cell</text>
        <g class="bee" id="bee" transform="translate(${c} ${c - DIAL.r}) scale(1.5)">${BEE}</g>
      </svg>`;
}

/** Which part of the lock each line of lock.spw governs, by how the line begins; the page lights that part while the line is pointed at. */
const PARTS = [["^lock", "lock"], ["=holders", "window"], ["$clock", "clock"], ["!hold", "hold"], [".rest", "rest"], ["~wait", "wait"], ["%release", "release"], ["@", "frame"], ["&frame", "dial"], ["#", "name"]];
const partOf = (line) => (PARTS.find(([start]) => line.startsWith(start)) ?? [null, "now"])[1];

/** A token's class on the page: a mark, a word, a pair of walls by its slot, a phrase, a join. */
function classOf(token) {
  switch (token.type) {
    case "OPERATOR": return "m";
    case "PARTICLE": case "ANNOTATION": return "p";
    case "IDENTIFIER": case "NUMBER": case "BOOLEAN": return "w";
    case "STRING": case "PHRASE": case "TEXT": return "s";
    case "CONNECTOR": case "COMMA": case "COLON": return "j";
    case "CAPSULE_OPEN": case "CAPSULE_CLOSE": return "b-concept";
    case "CONTAINER_OPEN": case "CONTAINER_CLOSE": return { "[": "b-mode", "]": "b-mode", "{": "b-body", "}": "b-body", "(": "b-scene", ")": "b-scene" }[token.value] ?? "";
    default: return "";
  }
}

/**
 * lock.spw painted from the reader's own tokens, one span per line naming the
 * part of the lock it governs. Every character comes back in order; a ?[…]
 * block's lines all point at what holds now.
 */
export function paintLock(source) {
  const result = parse(source, { eventPolicy: "none" });
  if (!result.success || result.completeness?.proseFallback || result.errors.length) throw new Error("[mutex-carry] lock.spw does not read whole");
  const cls = new Array(source.length).fill("");
  for (const token of result.tokens) {
    const c = classOf(token);
    if (c) for (let i = token.span.start.offset; i < token.span.end.offset; i += 1) cls[i] = c;
  }
  let at = 0;
  let inQuestion = false;
  return source.replace(/\n$/, "").split("\n").map((line) => {
    const start = at;
    at += line.length + 1;
    if (line.startsWith("?[")) inQuestion = true;
    const part = inQuestion ? "now" : partOf(line);
    if (inQuestion && line === "}") inQuestion = false;
    let html = "";
    for (let i = 0; i < line.length; ) {
      let j = i + 1;
      while (j < line.length && cls[start + j] === cls[start + i]) j += 1;
      const text = escapeHtml(line.slice(i, j));
      html += cls[start + i] ? `<span class="${cls[start + i]}">${text}</span>` : text;
      i = j;
    }
    return line ? `<span class="line" data-part="${part}">${html}</span>` : "";
  }).join("\n");
}

/** The rule as Spw, painted, with the line that says what holds now beneath it, and ways to read it elsewhere. */
function sample(source) {
  const b64 = Buffer.from(source, "utf8").toString("base64url");
  return `<section class="sample" aria-labelledby="sample-title">
      <h2 class="kicker" id="sample-title">The rule, in Spw</h2>
      <pre class="spw" id="lock-spw">${paintLock(source)}
<span class="line now-line" data-part="now" id="now-line" hidden></span>
<span class="line" data-part="now" id="turn-line" hidden></span></pre>
      <p class="data"><a href="/lock.spw">lock.spw</a> · <a href="https://factshift.center/#spw64=${b64}">read it on the canvas ↗</a> · <a href="https://spw.quest/build#spw64=${b64}">take it apart on spw.quest ↗</a></p>
    </section>`;
}

/**
 * A mutex you can watch: threads, drawn as bees, line up at one cell and take
 * it one at a time. Drawn here at rest (one inside, two waiting) so it reads
 * with scripts off; the pages' script sets it going.
 */
function threads() {
  const cell = hexagon(520, 90, 46);
  const bee = (x, y, cls) => `<use href="#bee-shape" class="${cls}" transform="translate(${x} ${y}) scale(1.3)"/>`;
  return `<figure class="threads" id="threads">
          <svg viewBox="0 0 600 180" role="img" aria-labelledby="threads-title">
            <title id="threads-title">Threads at a mutex: one inside the cell, the rest waiting their turn in line.</title>
            <defs><g id="bee-shape">${BEE}</g></defs>
            <line class="lane" x1="30" y1="90" x2="462" y2="90"/>
            <circle class="turn-ring" id="threads-ring" cx="520" cy="90" r="58" pathLength="1"/>
            <polygon class="cell held" id="threads-cell" points="${cell}"/>
            <g id="threads-bees">${bee(520, 90, "inside")}${bee(430, 90, "waiting")}${bee(386, 90, "waiting")}</g>
          </svg>
          <figcaption><span id="threads-count">One inside, two waiting.</span> <button type="button" id="send-bee" hidden>Send a bee</button></figcaption>
        </figure>`;
}

function head(title, description, canonical) {
  return `<meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
  <meta name="theme-color" content="#120d07">
  <meta name="apple-mobile-web-app-title" content="mutex.buzz">
  <link rel="stylesheet" href="/mutex.css">
  <link rel="stylesheet" href="/set-ring.css">
  <script type="module" src="/mutex.js"></script>`;
}

function home(source) {
  const queue = QUEUE.length ? `<ol class="queue">${QUEUE.map((q) => `<li>${escapeHtml(q.title)}</li>`).join("")}</ol>` : `<p class="quiet">Nobody is waiting. The folio rests in the frame.</p>`;
  return `<!doctype html>
<html lang="en">
<head>
  ${head("mutex.buzz — one concept in the frame at a time", "A lock on attention: one concept holds the frame, each hold releases at a close, and a laminated folio holds it the rest of the time.", `${ORIGIN}/`)}
</head>
<body class="home">
  <main>
    <section class="say" aria-labelledby="t">
      <p class="kicker">mutex.buzz · a lock on attention</p>
      <h1 id="t">One concept in the frame <code>at a time</code>.</h1>
      <p>A mutex lets one thread in and makes the rest wait. This one does that for attention: whatever holds the lock is the single thing the frame shows.</p>
      <section class="explain" aria-labelledby="what-title">
        <h2 class="kicker" id="what-title">What a mutex is</h2>
        <p>A mutex, short for <em>mutual exclusion</em>, is a lock a program puts around something several threads might touch at once: a file, a counter, a printer. A thread acquires the lock before it touches the thing and releases it when it is done. If another thread already holds it, the newcomer waits. The code that runs while the lock is held is the critical section, and only one thread is ever inside it.</p>
        <p>A semaphore can let several in at once; a mutex lets in exactly one, and only the one holding it can let go. One bee to a cell.</p>
        <p>Here, the shared thing is attention. A hold is the critical section, a close is the release, and the line of anyone waiting is public.</p>
        ${threads()}
      </section>
      <ul class="rules">
        <li><b>hold</b>A hold starts at a close and releases at the next: the 13th, the 26th, and the last day of the month.</li>
        <li><b>rest</b>When nothing else holds it, a laminated folio does. The resting state is the work itself.</li>
        <li><b>wait</b>Anyone waiting lines up in public, in order.</li>
      </ul>
      <h2 class="kicker">Waiting</h2>
      ${queue}
      <p class="data"><a href="/now/">/now/</a> · <a href="/now.json">/now.json</a> · framed on <a href="https://attention.productions/">attention.productions</a></p>
      <p class="data"><button type="button" id="keep-app" hidden>Keep it on this device</button></p>
    </section>
    <figure class="lock">
      ${dial()}
      <figcaption>
        <p class="holding"><strong id="holder-title">A folio</strong> <span id="holder-when">holds the lock this cycle.</span></p>
      ${holdsList()}
      </figcaption>
    </figure>
    ${sample(source)}
  </main>
</body>
</html>
`;
}

function now() {
  return `<!doctype html>
<html lang="en">
<head>
  ${head("What holds the lock — mutex.buzz", "What holds the frame this cycle on mutex.buzz, and when it lets go.", `${ORIGIN}/now/`)}
</head>
<body class="now">
  <a class="frame" id="frame" href="/" target="_top">
    <img id="now-image" alt="" hidden>
    <svg class="rider" id="rider" viewBox="-20 -18 40 30" aria-hidden="true" hidden>${BEE}</svg>
    <p class="lock-line"><strong id="holder-title">One concept holds the frame.</strong> <span id="holder-when">A to the 13th, B to the 26th, C to the last day.</span>
      <svg class="progress" viewBox="0 0 100 4" preserveAspectRatio="none" aria-hidden="true"><line class="track" x1="0" y1="2" x2="100" y2="2"/><line class="spent" id="spent" x1="0" y1="2" x2="0" y2="2"/></svg>
    </p>
  </a>
</body>
</html>
`;
}

const NOT_FOUND = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Not held — mutex.buzz</title>
  <link rel="stylesheet" href="/mutex.css">
  <link rel="stylesheet" href="/set-ring.css">
</head>
<body class="home">
  <main><section class="say"><p class="kicker">mutex.buzz</p><h1>Nothing holds this address.</h1><p><a href="/">The lock</a> · <a href="/now/">what holds it now</a></p></section></main>
</body>
</html>
`;

function llms() {
  return `# mutex.buzz

A mutex (mutual exclusion) is a lock a program puts around something several threads might touch at once: one thread acquires it, the rest wait, and only the holder releases it. mutex.buzz is a lock on attention: one concept holds the frame at a time. A hold starts at a close and releases at the next: the 13th, the 26th, and the last day of the month (UTC). When nothing else holds it, a laminated folio does. Anyone waiting lines up in public, in order.

- /lock.spw: the rule written in Spw, every mark doing one job: ^ gathers the lock, = fixes one holder, $ names the clock it runs on, ! is a hold, . the folio that rests, ~ the waiting, % the time to release, @ where it is seen, & what the frame is about, ? asks what holds now, # names the file.
- Each hold is cut into turns of an hour: each turn the cell shows a different detail of the holder, whole on the first and last turns. The page says which turn it is as Spw, %turn[62/312]{hour}, and counts down to the release by the second.
- /now/: what holds the lock now, framed by attention.productions.
- /now.json: the schedule, schema mutex.schedule.v1: every hold from ${SCHEDULE.from} up to ${SCHEDULE.until}, each with its cycle, since, releasesAt and holder. What holds now is the hold whose since is at or before now and whose releasesAt is after it.
`;
}

/** What an installed mutex.buzz is: its names, colours, icons, and a shortcut to what holds now. */
function manifest() {
  const icons = Object.entries(ICONS).filter(([name]) => name.startsWith("icon-")).map(([name, icon]) => ({ src: `/icons/${name}`, sizes: `${icon.size}x${icon.size}`, type: "image/png", purpose: icon.purpose ?? "any" }));
  return `${JSON.stringify({
    name: "mutex.buzz — one concept in the frame at a time",
    short_name: "mutex.buzz",
    description: "A lock on attention: one concept holds the frame, each hold releases at a close, and a laminated folio holds it the rest of the time.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#120d07",
    theme_color: "#120d07",
    icons: [...icons, { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
    shortcuts: [{ name: "What holds now", short_name: "Now", url: "/now/", icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }] }],
  }, null, 2)}\n`;
}

/** Everything the service worker keeps, so the lock opens and keeps time with no network. */
const SHELL = ["/", "/now/", "/mutex.css", "/mutex.js", "/lock.js", "/lock.spw", "/now.json", "/favicon.svg", "/manifest.webmanifest", ...Object.keys(FOLIO_SOURCES).map((name) => `/folios/${name}`), ...Object.keys(ICONS).map((name) => `/icons/${name}`)];

/**
 * The service worker. Pages come from the network when there is one and from
 * the cache when there is not; everything else from the cache, refreshed
 * behind it. Its cache is named for a hash of what it keeps, so a deploy that
 * changes any of it takes over cleanly and the old cache goes.
 */
function serviceWorker(version) {
  return `// Written by workers/mutex-buzz/carry.mjs. The lock works out "now" in the page, so with these kept it keeps time offline.
const CACHE = "mutex-${version}";
const SHELL = ${JSON.stringify(SHELL)};

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("mutex-") && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => {
      const copy = response.clone();
      if (response.ok) caches.open(CACHE).then((cache) => cache.put(request, copy));
      return response;
    }).catch(() => caches.match(request).then((hit) => hit ?? caches.match(url.pathname.startsWith("/now") ? "/now/" : "/"))));
    return;
  }
  event.respondWith(caches.match(request).then((hit) => {
    const fresh = fetch(request).then((response) => {
      if (response.ok) { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(request, copy)); }
      return response;
    });
    return hit ?? fresh;
  }));
});
`;
}

export async function carried() {
  const schedule = { schema: "mutex.schedule.v1", note: "What holds now is the hold whose since is at or before now and whose releasesAt is after it. Times are UTC.", queue: QUEUE.map(({ title, kind }) => ({ title, kind })), holds: scheduleBetween(new Date(`${SCHEDULE.from}T00:00:00Z`), new Date(`${SCHEDULE.until}T00:00:00Z`)) };
  const source = await readFile(path.join(HERE, "src/lock.spw"), "utf8");
  // The set's ring, shared by the set's pages (workers/lib/set-ring.js).
  const ring = await Promise.all(["set-ring.js", "set-ring.css"].map(async (file) => [file, await readFile(path.join(HERE, "../lib", file), "utf8")]));
  return [
    ...ring,
    ["lock.js", await readFile(path.join(HERE, "src/lock.js"), "utf8")],
    ["lock.spw", source],
    ["index.html", home(source)],
    ["now/index.html", now()],
    ["404.html", NOT_FOUND],
    ["now.json", `${JSON.stringify(schedule, null, 2)}\n`],
    ["favicon.svg", FAVICON],
    ["robots.txt", "User-agent: *\nAllow: /\n"],
    ["ecosystem.json", JSON.stringify(ecosystemJson, null, 2)],
    ["registry.json", JSON.stringify(ecosystemJson, null, 2)],
    ["llms.txt", llms()],
    ["_headers", headersFile()],
    ["manifest.webmanifest", manifest()],
  ];
}

/** The carried text files and the service worker named for them, with the hand-written page files and the images in its hash. */
export async function carriedWithWorker() {
  const files = await carried();
  const hash = createHash("sha256");
  for (const [name, body] of files) hash.update(name).update(body);
  for (const name of ["mutex.css", "mutex.js"]) hash.update(name).update(await readFile(path.join(ASSETS, name)));
  for (const source of Object.values(FOLIO_SOURCES)) hash.update(await readFile(path.join(ROOT, source)));
  for (const [name, icon] of Object.entries(ICONS)) hash.update(name).update(iconPng(icon.size, icon));
  return [...files, ["sw.js", serviceWorker(hash.digest("hex").slice(0, 12))]];
}

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** The folios' images, compared by hash: they are bytes, not text. */
async function folios(check) {
  let drift = 0;
  for (const [name, source] of Object.entries(FOLIO_SOURCES)) {
    const want = await readFile(path.join(ROOT, source));
    const target = path.join(ASSETS, "folios", name);
    if (check) {
      const have = await readFile(target).catch(() => null);
      if (!have || sha(have) !== sha(want)) { drift += 1; console.error(`[mutex-carry] assets/folios/${name} differs from ${source}`); }
      continue;
    }
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, want);
  }
  return drift;
}

/** The app icons, drawn by src/icon.js and compared by hash. */
async function icons(check) {
  let drift = 0;
  for (const [name, icon] of Object.entries(ICONS)) {
    const want = iconPng(icon.size, icon);
    const target = path.join(ASSETS, "icons", name);
    if (check) {
      const have = await readFile(target).catch(() => null);
      if (!have || sha(have) !== sha(want)) { drift += 1; console.error(`[mutex-carry] assets/icons/${name} differs from src/icon.js`); }
      continue;
    }
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, want);
  }
  return drift;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const check = process.argv.includes("--check");
  const drift = (await writeOrCheck(ASSETS, await carriedWithWorker(), { check, label: "mutex-carry", hint: "run node workers/mutex-buzz/carry.mjs" })) + (await folios(check)) + (await icons(check));
  if (check && drift) process.exit(1);
  if (!check) console.log("[mutex-carry] wrote the lock, both pages, the schedule and the folios into workers/mutex-buzz/assets");
}
