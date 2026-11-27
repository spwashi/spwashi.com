// wap.mom as an app: its manifest, the small script every page loads to keep
// it on a device, and the service worker that keeps the periodical readable
// offline. The worker prints all three, and carry-pages.mjs carries them with
// the pages; the icons are drawn by src/icon.js at carry time.
import { numbered, printed } from "./catalog.js";
import { PINCH_TEXT, VERSION } from "./layout.js";
import { SERIES } from "./room.js";

export const MANIFEST = Object.freeze({
  name: "wap.mom",
  short_name: "wap.mom",
  description: "A periodical numbered by the decimal expansion of π, with a supplement numbered by e. Each issue adds a place.",
  id: "/",
  start_url: "/",
  scope: "/",
  display: "standalone",
  display_override: ["minimal-ui", "standalone"],
  categories: ["books", "education", "magazines"],
  background_color: "#f4efe4",
  theme_color: "#f4efe4",
  icons: [
    { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
  ],
  shortcuts: [
    { name: "Contents", url: "/contents/", icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }] },
    { name: "22/7", url: "/22-7/", icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }] },
    { name: "The room", url: "/room", icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }] },
  ],
});

const ISSUE_ROUTES = printed.flatMap((issue) => [
  `/${issue.slug}/`,
  `/${issue.slug}/offprint/`,
  ...(issue.clip ? [`/${issue.slug}/clip/`] : []),
]);

/** Every page a reader keeps: the front page, index pages, scripts, feeds, icons, and every printed issue, offprint, and clipping. */
export const KEPT = Object.freeze([
  "/",
  "/contents/",
  "/room",
  "/colophon/",
  "/corrections/",
  "/now.json",
  "/feed.xml",
  "/figures.js",
  "/app.js",
  "/text-scale.js",
  "/text-scale.css",
  "/text-scale-head.js",
  ...(PINCH_TEXT ? [PINCH_TEXT] : []),
  "/favicon.svg",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
  ...ISSUE_ROUTES,
]);

/** The service worker: instant stale-while-revalidate on kept issues & offline assets, bypassing cabinet and drawn figures cleanly. */
export const SW_JS = `// Printed by wap.mom's worker (src/app.js). Each printing lists its issues here, so a new one reaches an installed reader.
const CACHE = "wapmom-pages-${VERSION}";
const KEPT = ${JSON.stringify(KEPT)};
const LIVE = /^\\/cabinet|\\/draw$/;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(KEPT)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith("wapmom-") && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || LIVE.test(url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request);
    const refreshing = fetch(request).then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    }).catch(() => null);
    if (cached) {
      event.waitUntil(refreshing);
      return cached;
    }
    const fresh = await refreshing;
    if (fresh) return fresh;
    if (request.mode === "navigate") {
      const contents = await cache.match("/contents/");
      if (contents) return contents;
    }
    return Response.error();
  })());
});
`;

const ISSUE_META = numbered.map((i) => ({
  slug: i.slug,
  series: i.series,
  title: i.title,
  no: i.no,
  status: i.status,
  question: i.question || "",
  uses: i.uses || {},
}));

const CURIOSITIES = {
  pi: [
    "355/113 matches π to 6 places; write 113355 and fold it in half.",
    "e^π − π ≈ 19.999099979 — nearly 20 by an accidental coincidence.",
    "One in every ten digits of π settles nowhere: [3; 7, 15, 1, 292, …] leaps suddenly at 292.",
    "Multiply a pie tin's diameter by 22 and divide by 7 to land within a hair of its rim.",
  ],
  e: [
    "e^π ≈ 23.14069 beats π^e ≈ 22.45916 — e wins any exponent duel against other numbers.",
    "1/0! + 1/1! + 1/2! + 1/3! + … arrives at e fast enough to reach 9 places by step 12.",
    "Split e to climb a hill: e^(1/e) ≈ 1.44467 is the steepest real fixed-point base.",
    "Continuous 100% growth turns 1 into e in a single unit of time.",
  ],
};

/** The script every page loads: pinch-to-scale, PWA install & offline readiness, dog-ears, Uses concordance, ruled proof slips, and Pocket π/e Apparatus. */
export const APP_JS = `(() => {
  const CACHE_NAME = "wapmom-pages-${VERSION}";
  const DOGEAR_KEY = "set.wap-dogear/1";
  const MARGIN_KEY = "set.wap-margin/1";
  const ISSUES = ${JSON.stringify(ISSUE_META)};
  const CURIOSITIES = ${JSON.stringify(CURIOSITIES)};

  /* 1. Pinch-to-scale text on main prose surfaces (respecting figure canvas gestures). */
  import("/text-scale.js").then(({ mountTextScale }) => {
    const main = document.querySelector("main");
    if (main) mountTextScale(main, { ignore: ".fig-stage, .fig-controls, .pocket-pi" });
  }).catch(() => {});

  /* 2. PWA lifecycle, offline shelf count, update banner & local shelf wipe. */
  const keep = document.getElementById("keep-app");
  const reloadBtn = document.getElementById("reload-printing");
  const clearBtn = document.getElementById("clear-shelf");
  const statusEl = document.getElementById("pwa-status");
  const isStandalone = window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone === true;
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;

  const readJson = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; }
  };
  const writeJson = (key, val) => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  };

  let shelfStats = "";
  const inspectCache = async () => {
    if (!("caches" in window)) return;
    try {
      const cache = await caches.open(CACHE_NAME);
      const keys = await cache.keys();
      if (keys.length) shelfStats = keys.length + " files kept offline";
    } catch {}
  };

  const syncStatus = () => {
    if (!statusEl) return;
    if (!navigator.onLine) {
      statusEl.textContent = "Offline — reading the kept printing" + (shelfStats ? " (" + shelfStats + ")." : ".");
      statusEl.hidden = false;
    } else if (isStandalone) {
      statusEl.textContent = "Installed locally" + (shelfStats ? " · " + shelfStats : "") + ".";
      statusEl.hidden = false;
    } else if (isIos && keep?.hidden) {
      statusEl.textContent = "Offline reading on iOS: tap Share, then Add to Home Screen." + (shelfStats ? " (" + shelfStats + " cached)" : "");
      statusEl.hidden = false;
    } else if (shelfStats) {
      statusEl.textContent = "Printing ${VERSION} · " + shelfStats + ".";
      statusEl.hidden = false;
    } else {
      statusEl.hidden = true;
    }
  };

  if ("serviceWorker" in navigator && window.top === window) {
    navigator.serviceWorker.register("/sw.js").then((reg) => {
      reg.addEventListener("updatefound", () => {
        const next = reg.installing;
        next?.addEventListener("statechange", () => {
          if (next.state === "installed" && navigator.serviceWorker.controller && reloadBtn) {
            reloadBtn.hidden = false;
          }
        });
      });
    }).catch(() => {});
    reloadBtn?.addEventListener("click", () => location.reload());
  }

  let offer = null;
  if (keep) {
    addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      offer = event;
      keep.hidden = false;
      syncStatus();
    });
    keep.addEventListener("click", async () => {
      if (!offer) return;
      offer.prompt();
      await offer.userChoice.catch(() => null);
      offer = null;
      keep.hidden = true;
      await inspectCache();
      syncStatus();
    });
    addEventListener("appinstalled", async () => {
      keep.hidden = true;
      await inspectCache();
      syncStatus();
    });
  }
  if (clearBtn) {
    const syncClearVisible = () => {
      const hasNotes = Object.keys(readJson(DOGEAR_KEY, {})).length > 0 || Object.keys(readJson(MARGIN_KEY, {})).length > 0;
      let hasScale = false;
      try { hasScale = Boolean(localStorage.getItem("set.text-scale/1")); } catch {}
      clearBtn.hidden = !(hasNotes || hasScale);
    };
    syncClearVisible();
    clearBtn.addEventListener("click", async () => {
      try {
        localStorage.removeItem(DOGEAR_KEY);
        localStorage.removeItem(MARGIN_KEY);
        localStorage.removeItem("set.text-scale/1");
      } catch {}
      location.reload();
    });
  }
  addEventListener("online", syncStatus);
  addEventListener("offline", syncStatus);
  inspectCache().then(syncStatus);

  /* 3. Reader dog-ear memory across printed issues & interactive masthead decimal expansion. */
  const slugMatch = location.pathname.match(/^\\/([a-z0-9-]+)\\/$/);
  const currentIssue = slugMatch ? ISSUES.find((i) => i.status !== "open" && i.slug === slugMatch[1]) : null;
  const dogears = readJson(DOGEAR_KEY, {});
  if (currentIssue && !dogears[currentIssue.slug]) {
    dogears[currentIssue.slug] = Date.now();
    writeJson(DOGEAR_KEY, dogears);
  }
  document.querySelectorAll(".back li a[href^='/']").forEach((a) => {
    const m = a.getAttribute("href")?.match(/^\\/([a-z0-9-]+)\\/$/);
    if (m && dogears[m[1]]) a.closest("li")?.setAttribute("data-dogeared", "true");
  });

  document.querySelectorAll(".expansion").forEach((exp) => {
    const lead = exp.closest(".supplement") ? "e" : "pi";
    const series = ISSUES.filter((i) => i.series === lead);
    const visual = exp.querySelector("span[aria-hidden='true']");
    if (!visual || !series.length) return;
    const raw = visual.textContent.replace("…", "");
    const prefix = raw.slice(0, 2);
    const digits = raw.slice(2);
    const row = document.createElement("span");
    row.className = "expansion-digits";
    row.append(document.createTextNode(prefix));
    const note = document.createElement("p");
    note.className = "expansion-note";
    note.setAttribute("aria-live", "polite");
    note.hidden = true;
    const buttons = [];
    for (let i = 0; i < digits.length; i += 1) {
      const owner = series[i];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "expansion-digit";
      if (visual.children[i]?.classList.contains("here")) btn.classList.add("here");
      else if (owner?.status === "open") btn.classList.add("ahead");
      if (owner && dogears[owner.slug]) btn.setAttribute("data-dogeared", "true");
      btn.textContent = digits[i];
      btn.title = owner ? \`\${owner.no} — \${owner.title}\` : \`Decimal place \${i + 1}\`;
      btn.setAttribute("aria-pressed", "false");
      btn.addEventListener("click", () => {
        const was = btn.getAttribute("aria-pressed") === "true";
        buttons.forEach((b) => b.setAttribute("aria-pressed", "false"));
        if (was) {
          if (owner && owner.status !== "open" && location.pathname !== \`/\${owner.slug}/\`) {
            location.href = \`/\${owner.slug}/\`;
            return;
          }
          note.hidden = true;
          return;
        }
        btn.setAttribute("aria-pressed", "true");
        if (!owner) return;
        note.hidden = false;
        note.replaceChildren();
        if (owner.status === "open") {
          note.textContent = \`No. \${owner.no} (\${owner.title}) — open slot in the room: \${owner.question}\`;
        } else {
          const mark = dogears[owner.slug] ? " · dog-eared" : "";
          note.append(document.createTextNode(\`\${owner.no} — \`), Object.assign(document.createElement("a"), { href: \`/\${owner.slug}/\`, textContent: owner.title }), document.createTextNode(location.pathname === \`/\${owner.slug}/\` ? " (this issue)" : " · tap again to read" + mark));
        }
      });
      buttons.push(btn);
      row.append(btn);
    }
    row.append(document.createTextNode("…"));
    visual.replaceWith(row);
    exp.after(note);
  });

  /* 4. Interactive Euler's identity walk (e^(iπ) + 1 = 0) in colophon. */
  const eulerBtn = document.querySelector(".colophon .printers-mark");
  const eulerCard = document.getElementById("euler-card");
  if (eulerBtn && eulerCard) {
    eulerBtn.setAttribute("role", "button");
    eulerBtn.tabIndex = 0;
    eulerBtn.setAttribute("aria-expanded", "false");
    const EULER_STEPS = [
      { x: 42, y: 26, text: "Step 1 · start at e^(i·0) = +1 (east on the unit circle)." },
      { x: 26, y: 10, text: "Step 2 · quarter turn π/2: e^(i·π/2) = i (due north)." },
      { x: 10, y: 26, text: "Step 3 · half turn π: e^(i·π) = −1 (due west, π radians round)." },
      { x: 26, y: 26, text: "Step 4 · add +1: −1 + 1 = 0 (back at the origin)." },
    ];
    let step = -1;
    const renderEuler = () => {
      if (step < 0) {
        eulerCard.hidden = true;
        eulerBtn.setAttribute("aria-expanded", "false");
        return;
      }
      const s = EULER_STEPS[step];
      eulerCard.hidden = false;
      eulerBtn.setAttribute("aria-expanded", "true");
      eulerCard.innerHTML = \`<svg class="euler-svg" viewBox="0 0 52 52" aria-hidden="true"><line x1="6" y1="26" x2="46" y2="26"/><line x1="26" y1="6" x2="26" y2="46"/><circle cx="26" cy="26" r="16"/><circle class="dot" cx="\${s.x}" cy="\${s.y}" r="3.5"/></svg><span>\${s.text}</span>\`;
    };
    const advance = () => {
      step = step + 1 >= EULER_STEPS.length ? -1 : step + 1;
      renderEuler();
    };
    eulerBtn.addEventListener("click", advance);
    eulerBtn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); advance(); }
    });
  }

  /* 5. Fleuron curiosities, Uses cross-issue concordance, ruled Forthcoming margin slips, Pullquote & Citation copy. */
  document.querySelectorAll(".fleuron").forEach((fl) => {
    const series = document.body.classList.contains("series-e") ? "e" : "pi";
    const list = CURIOSITIES[series];
    let idx = -1;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "fleuron-btn";
    btn.textContent = fl.textContent;
    btn.title = "Tap for a marginalia note";
    fl.removeAttribute("aria-hidden");
    fl.replaceChildren(btn);
    const cue = document.createElement("p");
    cue.className = "fleuron-note";
    cue.setAttribute("aria-live", "polite");
    cue.hidden = true;
    fl.after(cue);
    btn.addEventListener("click", () => {
      idx = (idx + 1) % list.length;
      cue.hidden = false;
      cue.textContent = list[idx];
    });
  });

  const USE_KEYS = ["hand", "table", "work", "mind"];
  document.querySelectorAll(".uses").forEach((panel) => {
    const dl = panel.querySelector("dl");
    if (!dl) return;
    const conc = document.createElement("p");
    conc.className = "uses-concordance";
    conc.setAttribute("aria-live", "polite");
    conc.hidden = true;
    dl.after(conc);
    const children = [...dl.children];
    const wraps = [];
    for (let i = 0; i < children.length; i += 2) {
      const dt = children[i];
      const dd = children[i + 1];
      if (!dt || !dd) continue;
      const key = USE_KEYS[Math.floor(i / 2)] || "";
      const wrap = document.createElement("div");
      wrap.tabIndex = 0;
      wrap.setAttribute("role", "button");
      wrap.setAttribute("aria-pressed", "false");
      dt.before(wrap);
      wrap.append(dt, dd);
      wraps.push(wrap);
      const toggle = () => {
        const next = wrap.dataset.picked !== "true";
        wraps.forEach((w) => { w.dataset.picked = "false"; w.setAttribute("aria-pressed", "false"); });
        wrap.dataset.picked = next ? "true" : "false";
        wrap.setAttribute("aria-pressed", String(next));
        if (!next || !key) { conc.hidden = true; return; }
        const peers = ISSUES.filter((each) => each.status !== "open" && each.slug !== currentIssue?.slug && each.uses?.[key]);
        if (!peers.length) { conc.hidden = true; return; }
        const pick = peers.slice(0, 2);
        conc.hidden = false;
        conc.replaceChildren(document.createTextNode(\`\${dt.textContent} elsewhere: \`));
        pick.forEach((other, idx) => {
          if (idx > 0) conc.append(document.createTextNode(" · "));
          conc.append(
            Object.assign(document.createElement("a"), { href: \`/\${other.slug}/\`, textContent: \`\${other.no} (\${other.title})\` }),
            document.createTextNode(\` — \${other.uses[key]}\`),
          );
        });
      };
      wrap.addEventListener("click", toggle);
      wrap.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
      });
    }
  });

  /* Forthcoming ruled slots: turn lined paper into a local margin slip. */
  const marginNotes = readJson(MARGIN_KEY, {});
  document.querySelectorAll(".slot").forEach((slotEl) => {
    const title = slotEl.querySelector("h2")?.textContent?.trim() || "slot";
    const lines = slotEl.querySelector(".lines");
    if (!lines) return;
    lines.dataset.interactive = "true";
    lines.title = "Tap to leave a margin line for the room (kept locally)";
    const editor = document.createElement("div");
    editor.className = "slot-note";
    const initial = marginNotes[title] || "";
    editor.hidden = !initial;
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 120;
    input.value = initial;
    input.placeholder = "Pencil a question or ratio for this column…";
    input.setAttribute("aria-label", \`Margin note for \${title}\`);
    const status = document.createElement("span");
    status.textContent = initial ? \`Margin note kept locally: "\${initial}"\` : "Ruled proof slip (tap lines above to fold or write).";
    editor.append(input, status);
    lines.after(editor);
    lines.addEventListener("click", () => {
      editor.hidden = !editor.hidden;
      if (!editor.hidden) input.focus();
    });
    input.addEventListener("input", () => {
      const val = input.value.trim();
      if (val) marginNotes[title] = val;
      else delete marginNotes[title];
      writeJson(MARGIN_KEY, marginNotes);
      status.textContent = val ? \`Margin note kept locally: "\${val}"\` : "Empty slip.";
      if (clearBtn) clearBtn.hidden = false;
    });
  });

  document.querySelectorAll(".pull, .cite").forEach((el) => {
    const text = el.classList.contains("pull")
      ? el.querySelector("blockquote")?.textContent?.trim()
      : el.textContent.replace(/^Cite\\s+/i, "").trim();
    if (!text) return;
    el.style.cursor = "pointer";
    el.title = el.classList.contains("pull") ? "Tap to copy quotation" : "Tap to copy citation";
    el.addEventListener("click", async () => {
      try { await navigator.clipboard?.writeText(text); } catch {}
      el.dataset.copied = "true";
      setTimeout(() => { delete el.dataset.copied; }, 700);
    });
  });

  /* 6. Discreet footer door whisper before stepping through the wall. */
  const door = document.querySelector(".colophon .door");
  if (door) {
    const whisper = document.createElement("span");
    whisper.className = "door-whisper";
    whisper.textContent = "Four rooms down one corridor, for adults.";
    whisper.hidden = true;
    door.before(whisper);
    const show = () => { whisper.hidden = false; };
    const hide = () => { whisper.hidden = true; };
    door.addEventListener("pointerenter", show);
    door.addEventListener("pointerleave", hide);
    door.addEventListener("focus", show);
    door.addEventListener("blur", hide);
  }

  /* 7. Calendar whimsy + Pocket π & e Apparatus (colophon trigger, Convergents slider, 240-digit finder, Cross-wall correspondence). */
  const today = new Date();
  const md = \`\${String(today.getMonth() + 1).padStart(2, "0")}-\${String(today.getDate()).padStart(2, "0")}\`;
  const holiday = md === "03-14" ? "π Day · 3.14" : md === "07-22" ? "22/7 Day" : md === "02-07" ? "e Day · 2.7" : "";
  const volEar = document.querySelector(".masthead .ears span:first-child");
  if (volEar && holiday) volEar.textContent = \`\${volEar.textContent} · \${holiday}\`;

  function computeDigits() {
    const scale = 10n ** 260n;
    const arccot = (x) => {
      let sum = scale / BigInt(x);
      let term = sum;
      const x2 = BigInt(x) * BigInt(x);
      for (let k = 3n, sign = -1n; term !== 0n; k += 2n, sign = -sign) {
        term /= x2;
        if (term === 0n) break;
        sum += sign * (term / k);
      }
      return sum;
    };
    const piBig = 4n * (4n * arccot(5) - arccot(239));
    let eBig = scale;
    let fact = scale;
    for (let k = 1n; fact !== 0n; k += 1n) {
      fact /= k;
      eBig += fact;
    }
    return {
      pi: \`3.\${piBig.toString().slice(1, 241)}\`,
      e: \`2.\${eBig.toString().slice(1, 241)}\`,
    };
  }

  const CONVERGENTS = [
    [3, 1, "/pi/"],
    [22, 7, "/22-7/"],
    [333, 106, "/355-113/"],
    [355, 113, "/355-113/"],
    [103993, 33102, "/355-113/"],
    [104348, 33215, "/355-113/"],
    [208341, 66317, "/355-113/"],
  ];

  let pocketEl = null;
  const pocketTrigger = document.getElementById("pocket-trigger");
  if (pocketTrigger) pocketTrigger.hidden = false;

  function togglePocket() {
    if (pocketEl) {
      pocketEl.hidden = !pocketEl.hidden;
      pocketTrigger?.setAttribute("aria-expanded", String(!pocketEl.hidden));
      if (!pocketEl.hidden) pocketEl.querySelector("input[type='text']")?.focus();
      return;
    }
    const { pi, e } = computeDigits();
    const box = document.createElement("aside");
    box.className = "pocket-pi";
    box.setAttribute("aria-label", "Pocket pi and e instrument");
    box.innerHTML = \`<p class="caps head">Pocket π &amp; e · convergent bench &amp; 240 decimals</p>
      <div class="pocket-pi-row">
        <input type="text" inputmode="numeric" maxlength="12" placeholder="Search digits (e.g. 42, 314, 0722)…" aria-label="Search digits in pi and e">
        <button type="button" data-close>Close</button>
      </div>
      <div class="pocket-pi-digits" data-out></div>
      <div class="pocket-range">
        <label for="conv-slider">Continued fraction convergent of π</label>
        <output id="conv-out">22/7</output>
        <input id="conv-slider" type="range" min="0" max="\${CONVERGENTS.length - 1}" step="1" value="1">
        <p class="muted" id="conv-err"></p>
      </div>
      <p class="pocket-wall">Architectural note: <a href="https://smut.today/to-you/" rel="nofollow">smut.today</a> keeps a kitchen across the wall where 22/7 sits for its portraits.</p>\`;

    const input = box.querySelector("input[type='text']");
    const out = box.querySelector("[data-out]");
    const slider = box.querySelector("#conv-slider");
    const convOut = box.querySelector("#conv-out");
    const convErr = box.querySelector("#conv-err");
    box.querySelector("[data-close]").addEventListener("click", () => {
      box.hidden = true;
      pocketTrigger?.setAttribute("aria-expanded", "false");
    });

    const piRaw = pi.slice(2);
    const eRaw = e.slice(2);
    const sliceAt = (raw, pos, len) => {
      const start = Math.max(0, pos - 4);
      const end = Math.min(raw.length, pos + len + 4);
      const p = document.createElement("span");
      p.append(
        document.createTextNode((start > 0 ? "…" : "") + raw.slice(start, pos)),
        Object.assign(document.createElement("mark"), { textContent: raw.slice(pos, pos + len) }),
        document.createTextNode(raw.slice(pos + len, end) + (end < raw.length ? "…" : "")),
      );
      return p;
    };
    const lookup = () => {
      const q = input.value.replace(/\\D+/g, "");
      out.replaceChildren();
      if (!q) {
        out.textContent = \`π^e ≈ \${(Math.PI ** Math.E).toFixed(5)} · e^π ≈ \${(Math.E ** Math.PI).toFixed(5)} (e^π − π ≈ \${(Math.E ** Math.PI - Math.PI).toFixed(5)}).\`;
        return;
      }
      const atPi = piRaw.indexOf(q);
      const atE = eRaw.indexOf(q);
      out.append(document.createTextNode(atPi >= 0 ? \`π d.\${atPi + 1} \` : "π — "));
      if (atPi >= 0) out.append(sliceAt(piRaw, atPi, q.length));
      out.append(document.createTextNode(atE >= 0 ? \` · e d.\${atE + 1} \` : " · e — "));
      if (atE >= 0) out.append(sliceAt(eRaw, atE, q.length));
    };
    const syncConv = () => {
      const [num, den, href] = CONVERGENTS[Number(slider.value) || 0];
      const err = Math.abs(num / den - Math.PI);
      convOut.textContent = \`\${num}/\${den}\`;
      convErr.replaceChildren(
        document.createTextNode(\`≈ \${(num / den).toFixed(7)} · error \${err.toExponential(2)} · \`),
        Object.assign(document.createElement("a"), { href, textContent: \`Issue \${num}/\${den}\` }),
      );
    };
    input.addEventListener("input", lookup);
    slider.addEventListener("input", syncConv);
    lookup();
    syncConv();
    document.querySelector(".masthead")?.after(box);
    pocketEl = box;
    pocketTrigger?.setAttribute("aria-expanded", "true");
    input.focus();
  }

  pocketTrigger?.addEventListener("click", togglePocket);

  if (volEar) {
    volEar.dataset.secret = "true";
    volEar.title = "Triple-tap for the Pocket π & e Instrument";
    let taps = 0;
    let lastTap = 0;
    volEar.addEventListener("click", () => {
      const now = Date.now();
      taps = now - lastTap < 650 ? taps + 1 : 1;
      lastTap = now;
      if (taps >= 3) { taps = 0; togglePocket(); }
    });
  }

  let keys = "";
  addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName)) return;
    if (/^\\d$/.test(event.key)) {
      keys = (keys + event.key).slice(-3);
      if (keys === "314" || keys === "271") togglePocket();
    } else if (event.key === "Escape" && pocketEl && !pocketEl.hidden) {
      pocketEl.hidden = true;
      pocketTrigger?.setAttribute("aria-expanded", "false");
    }
  });
})();
`;
