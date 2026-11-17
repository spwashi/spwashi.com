/**
 * smut.today — a small daily erotic zine, a letter to the person in the room,
 * and a shelf of book pitches. The wink lives off-page.
 *
 * The reader is an adult who reads porn on purpose. The page tells them what
 * a piece is, how long it takes, and what is in it before the first line, and
 * then gets out of the way. No script, no accounts, no images: the words carry.
 */

const VERSION = "0.0.3";

const WORDS_PER_MINUTE = 220;

const STORIES = [
  {
    slug: "meeting",
    title: "Before the meeting",
    register: "slow",
    since: "2026-09-19",
    kicker: "twelve minutes, glass walls, a lock that actually works",
    summary: "You already know how the pitch will go. You do not know if you can stand up without giving yourself away.",
    pairing: "Jules (they/them), a coworker who notices",
    tags: ["glass walls", "made to wait", "tongue", "two fingers", "fucked on the table", "quiet"],
    body: [
      "The twelfth-floor conference room still smells like dry-erase and the coffee nobody finished. Your deck is open on a laptop you are not looking at. Two desks over, Jules has been watching your mouth all morning like it is a problem they intend to solve carefully, with both hands.",
      "You have been wet since the standup. Not the poetic kind. The kind that ruins an afternoon by degrees, so that every time you uncross your legs the fabric drags and you have to swallow before you can say a number out loud. Jules notices. Jules always notices; it is the least professional thing about them and the reason you are still here. When the calendar pings they mouth conference B without looking up, and you stand like a person with somewhere to be.",
      "The lock clicks. The blinds come down one slat at a time, which is a cruelty, because you have to stand there while the room turns private. Jules does not touch you. That is the filthy part. They lean on the far end of the table and wait: for your palms to find the wood, for you to look back over your shoulder, for you to say it.",
      "“Please.” It comes out under the HVAC. They cross the room slowly enough that you feel each step in your knees. The first kiss lands on the hinge of your jaw, the second under your ear, in the place that makes your knees dishonest. Your skirt goes up an inch at a time. Their knuckles trace the soaked cotton the way a hand traces a sentence it wants to remember, and then they are on the floor, and their tongue takes one long, mean stripe through you and stops, breathing, until you rock back onto their mouth and ask again without words.",
      "They take their time because time is the whole point. Circling. Sucking just enough to make you say their name into your own wrist. Two fingers slide in when you are already shaking and curl until your thighs try to close; they hold you open with a forearm and keep going, patient as a proof, until you come on their tongue with your teeth in your sleeve, ugly and grateful and quieter than you thought you could be.",
      "Only then do they stand. Spit-slick, smiling, unhurried. They push into you in one stroke slow enough to count, a hand on your clit in the same rhythm, their breath on the back of your neck saying nothing at all. You come again with the table edge in your palms, clenching around them, and Jules follows with a sound they will deny in the hallway.",
      "Eleven minutes. The blinds go up one slat at a time. You fix your hair in the black of the screen and they fix your collar, and when the room fills you sit across from each other and you give the pitch, and you are very good, and nobody on the twelfth floor ever finds out why.",
    ],
    keeps: [
      "dishonest knees",
      "the room turns private",
      "patient as a proof",
      "ugly and grateful",
    ],
    linger: [
      {
        ask: "Where did you stop breathing?",
        say: "Probably at the blinds. Most people do. The room turns private one slat at a time and you have to stand there and want it, in full view of nothing.",
        shift: "one slat at a time, and you stood there and wanted it",
      },
      {
        ask: "What would you have said instead of please?",
        say: "Nothing. That is what the scene knows about you. The asking was the whole pitch, and you gave it before the lock clicked.",
        shift: "the asking was the pitch; the lock was a formality",
      },
      {
        ask: "Read it again, slower.",
        say: "Skip the first paragraph. Start at the lock. Count the steps across the room with them, and do not let yourself get to the table before they do.",
        shift: "start at the lock. count the steps. do not get there first",
        again: true,
      },
    ],
  },
  {
    slug: "train",
    title: "The last car",
    register: "dirty",
    since: "2026-09-19",
    kicker: "coat, pole, a question asked with a look",
    summary: "Late train. Almost empty. You did not get on this car by accident.",
    pairing: "Ren (they/them), a stranger on the platform",
    tags: ["last car", "in public", "gloves", "fingers", "fast", "not a word"],
    body: [
      "Last car. Fluorescent. A balloon from three stops ago stuck to the ceiling. Ren stands close enough that their coat brushes yours when the train leans, and they smell like cold air and the peppermint from the platform.",
      "You look at their mouth. They look at your hand on the pole. The look is the consent form. You nod. Ren’s gloved fingers find the inside of your wrist, the gap in your coat, the heat of you through clothes that were not designed for this.",
      "The tunnel takes the lights. Their hand is already in your underwear, already slick, already rubbing you in tight filthy circles while the car rattles. Nobody is watching. That is the lie you both keep. You come before the announcement finishes saying the name of the stop, biting the collar of your own coat, knees a rumor.",
      "Ren licks their fingers without theater, straightens your coat, and steps off at your stop as if they had only ever been holding the pole. You ride one more. Because you can.",
    ],
    keeps: [
      "the look is the consent form",
      "knees a rumor",
      "without theater",
    ],
    linger: [
      {
        ask: "Why did you ride one more stop?",
        say: "Because it was yours. Ren stepped off into the ordinary and you stayed in the last car with the balloon and the heat, and nobody told you when the scene ended. You decided.",
        shift: "the balloon, the heat, a stop that was yours to call",
      },
      {
        ask: "What did the look actually say?",
        say: "Yes. And: not here. And: here. All three at once, which is the trick of a train at night. A form you sign with your face.",
        shift: "yes. not here. here. a form you signed with your face",
      },
      {
        ask: "Read it again, faster.",
        say: "Do not stop at the tunnel this time. Let the stop get called. Let the doors open on you still shaking.",
        shift: "do not stop at the tunnel. let the doors open on you",
        again: true,
      },
    ],
  },
];

const LETTER = {
  slug: "to-you",
  title: "For the one who sits",
  kicker: "not a follower. a person in the room.",
  body: [
    "I keep meaning to say this without making it a caption. You sit and the room has a job. I draw, I write, I ruin a paragraph trying to keep up with a mouth I am not allowed to rush.",
    "This site is the private heat. The periodical next door is the public one: Wondering About Pi, a pie that is also a proof. You would look ridiculous and perfect holding the 22/7 issue to a camera. I will not tell anyone what the letters are for. They already know.",
    "If we work, we work like this: you in the chair, me on the sentence, both of us pretending the oven is the only thing that is hot. Come sit. Bring the look you use when you are about to laugh.",
  ],
};

const PITCHES = [
  {
    slug: "ministry",
    title: "The Ministry of Circumference",
    hook: "A math office that files wonders about a number that never ends. Domestic. Exact. Warm.",
    why: "A premise you can hold up to a camera without a synopsis. A ministry. A pie. A proof that flakes.",
  },
  {
    slug: "issue-pie",
    title: "Issue pie",
    hook: "A periodical that arrives the way a pie arrives: steam, a knife, a claim.",
    why: "Short enough for a stitch. Serious enough for a shelf. The innuendo is optional and not printed.",
  },
  {
    slug: "sits-for-proofs",
    title: "She sits for the proof",
    hook: "A sitting. A circle. A kitchen that is also a department of wonder.",
    why: "The model is the argument. The math is the alibi. The comments will do the rest.",
  },
];

/* Where the leave link goes. Somewhere boring, loads fast, explains nothing. */
const LEAVE_URL = "https://en.wikipedia.org/wiki/Main_Page";

/* The site talking to itself, one line a day, under the door. */
const MURMURS = [
  "The door is shut. Tomorrow it is a different door.",
  "You came here for a scene. Stay for the sentence you did not expect to keep.",
  "Slow is not a length. It is a decision about who gets to hurry.",
  "Nobody on this page is in a rush. That includes you, if you let it.",
  "Read it once for the heat. Read it again for the room.",
  "The lock, the coat, the look. Small things carry the weight here.",
  "You do not owe anyone an explanation for the tab you have open.",
];

function murmur(now) {
  return MURMURS[dayIndex(now) % MURMURS.length];
}

import { escapeHtml, securityHeaders } from "../../lib/http.js";
import { rgbOf, squarePng } from "../../lib/png.js";

const BASE_SECURITY = securityHeaders({
  corp: "same-origin",
  csp: "default-src 'none'; style-src 'unsafe-inline'; script-src 'self'; img-src 'self'; connect-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
});

const SMUT_BG = rgbOf("#14040a");
const SMUT_CRIMSON = rgbOf("#ff3366");
const SMUT_RING_SOFT = rgbOf("#6b1833");

function smutIconPng(size, { scale = 1 } = {}) {
  return squarePng(size, (x, y) => {
    const u = (x / size - 0.5) / scale;
    const v = (y / size - 0.5) / scale;
    const d = Math.hypot(u, v);
    if (d <= 0.085) return SMUT_CRIMSON;
    if (d >= 0.23 && d <= 0.30) return SMUT_CRIMSON;
    if (d >= 0.36 && d <= 0.39) return SMUT_RING_SOFT;
    return SMUT_BG;
  });
}

const ICONS = Object.freeze({
  "icon-192.png": { size: 192 },
  "icon-512.png": { size: 512 },
  "icon-maskable-512.png": { size: 512, scale: 0.78 },
  "apple-touch-icon.png": { size: 180 },
});

const MANIFEST = Object.freeze({
  name: "smut.today",
  short_name: "smut.today",
  description: "One scene a day, door shut. Short explicit fiction for adults.",
  id: "/",
  start_url: "/",
  scope: "/",
  display: "standalone",
  background_color: "#14040a",
  theme_color: "#14040a",
  icons: [
    { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
  ],
  shortcuts: [
    { name: "Today", url: "/", icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }] },
    { name: "The letter", url: "/to-you/", icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }] },
    { name: "Settle in", url: "/settle/", icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }] },
  ],
});

const TEXT_SCALE_HEAD_JS = `(() => {
  try {
    const step = localStorage.getItem("set.text-scale/1");
    if (["70", "80", "90", "110", "120"].includes(step)) document.documentElement.setAttribute("data-text-scale", step);
  } catch {}
})();
`;

const STORY_SLUGS = STORIES.map((s) => `/${s.slug}/`);
const SW_JS = `const CACHE = "smut-today-${VERSION}";
const KEPT = ${JSON.stringify([
  "/",
  "/to-you/",
  "/pitches/",
  ...STORY_SLUGS,
  "/app.js",
  "/text-scale-head.js",
  "/favicon.svg",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
])};

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(KEPT)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith("smut-today-") && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/settle")) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && !res.headers.get("Set-Cookie")) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit ?? (req.mode === "navigate" ? caches.match("/") : Response.error())))
  );
});
`;

const APP_JS = `(() => {
  if ("serviceWorker" in navigator && window.top === window) navigator.serviceWorker.register("/sw.js").catch(() => {});

  /* 1. Cluster-shared two-finger pinch to scale (70%-120%, key "set.text-scale/1"). */
  const STEPS = ["70", "80", "90", "100", "110", "120"];
  const TEXT_KEY = "set.text-scale/1";
  const IGNORE = "a, button, input, select, textarea, label, summary, details, video, audio, iframe";
  let badge = null;
  let badgeTimer = 0;
  const sayScale = (text) => {
    if (!badge) {
      badge = document.createElement("p");
      badge.className = "text-scale-badge";
      badge.setAttribute("role", "status");
      badge.setAttribute("aria-live", "polite");
      document.body.append(badge);
    }
    badge.textContent = text;
    badge.classList.add("on");
    clearTimeout(badgeTimer);
    badgeTimer = setTimeout(() => badge.classList.remove("on"), 1100);
  };
  const getScale = () => {
    const v = document.documentElement.getAttribute("data-text-scale");
    return STEPS.includes(v) ? v : "100";
  };
  const setScale = (step) => {
    if (!STEPS.includes(step)) return;
    if (step === "100") document.documentElement.removeAttribute("data-text-scale");
    else document.documentElement.setAttribute("data-text-scale", step);
    try {
      if (step === "100") localStorage.removeItem(TEXT_KEY);
      else localStorage.setItem(TEXT_KEY, step);
    } catch {}
    sayScale("Text " + step + "%");
  };
  const main = document.querySelector("main");
  const canTouch = (Number(navigator.maxTouchPoints) || 0) >= 2 || matchMedia("(any-pointer: coarse)").matches;
  if (main && canTouch) {
    let active = false;
    let startDist = 0;
    let startIdx = 3;
    let previewIdx = 3;
    const dist = (ts) => Math.hypot(ts[1].clientX - ts[0].clientX, ts[1].clientY - ts[0].clientY);
    const ok = (el) => el instanceof Element && main.contains(el) && !el.closest(IGNORE);
    const clear = () => {
      active = false;
      startDist = 0;
      document.documentElement.removeAttribute("data-spw-pinch-scaling");
    };
    document.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 2 || ![...e.touches].every((t) => ok(t.target))) {
        if (active) clear();
        return;
      }
      active = true;
      startDist = dist(e.touches);
      startIdx = STEPS.indexOf(getScale());
      previewIdx = startIdx;
      document.documentElement.setAttribute("data-spw-pinch-scaling", "true");
    }, { passive: true });
    document.addEventListener("touchmove", (e) => {
      if (!active || e.touches.length !== 2) { if (active) clear(); return; }
      const d = dist(e.touches);
      if (!(d > 0) || !(startDist > 0)) return;
      e.preventDefault();
      const change = Math.round(Math.log2(d / startDist) / 0.12);
      const next = Math.max(0, Math.min(STEPS.length - 1, startIdx + change));
      if (next !== previewIdx) { previewIdx = next; setScale(STEPS[next]); }
    }, { passive: false });
    document.addEventListener("touchend", clear, { passive: true });
    document.addEventListener("touchcancel", clear, { passive: true });
  }

  /* 2. PWA controls & privacy sweep on Forget me. */
  const keep = document.getElementById("keep-app");
  const pwaNote = document.getElementById("pwa-status");
  const isStandalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  if (pwaNote) {
    if (!navigator.onLine) { pwaNote.textContent = "Offline — reading saved copy on device."; pwaNote.hidden = false; }
    else if (isStandalone) { pwaNote.textContent = "Kept privately on this device. Tapping Forget clears saved offline copies too."; pwaNote.hidden = false; }
    else if (isIos) { pwaNote.textContent = "For offline reading on iOS: tap Share, then Add to Home Screen."; pwaNote.hidden = false; }
  }
  let offer = null;
  if (keep) {
    addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      offer = e;
      keep.hidden = false;
    });
    keep.addEventListener("click", async () => {
      if (!offer) return;
      offer.prompt();
      await offer.userChoice.catch(() => null);
      offer = null;
      keep.hidden = true;
    });
    addEventListener("appinstalled", () => {
      keep.hidden = true;
      if (pwaNote) { pwaNote.textContent = "Kept offline on this device."; pwaNote.hidden = false; }
    });
  }
  const forgetBtn = document.querySelector('form.settle button[name="forget"]');
  forgetBtn?.addEventListener("click", async () => {
    try { localStorage.removeItem(TEXT_KEY); } catch {}
    try {
      if ("caches" in window) {
        for (const k of await caches.keys()) {
          if (k.startsWith("smut-today-")) await caches.delete(k);
        }
      }
      const regs = await navigator.serviceWorker?.getRegistrations?.();
      if (regs) await Promise.all(regs.map((r) => r.unregister()));
    } catch {}
  });

  /* 3. Scroll-tracking crimson reading thread on prose/letter pages. */
  const prose = document.querySelector(".prose");
  const thread = document.querySelector(".reading-thread");
  if (prose && thread) {
    const syncThread = () => {
      const rect = prose.getBoundingClientRect();
      const total = Math.max(1, prose.offsetHeight - window.innerHeight * 0.65);
      const passed = Math.min(total, Math.max(0, -rect.top + window.innerHeight * 0.2));
      thread.style.setProperty("--read-progress", (passed / total).toFixed(4));
    };
    addEventListener("scroll", syncThread, { passive: true });
    addEventListener("resize", syncThread, { passive: true });
    syncThread();
  }

  /* 4. "One breath at a time" focused reading mode for late-night mobile reading. */
  const focusBtn = document.getElementById("focus-toggle");
  if (prose && focusBtn) {
    const paras = [...prose.querySelectorAll("p")];
    let focusedIdx = -1;
    const paintFocus = () => {
      const on = focusedIdx >= 0;
      prose.classList.toggle("is-focused", on);
      focusBtn.setAttribute("aria-pressed", String(on));
      focusBtn.textContent = on ? "Open full page" : "One breath at a time";
      paras.forEach((p, idx) => p.classList.toggle("is-lit", !on || idx === focusedIdx));
      if (on && paras[focusedIdx]) paras[focusedIdx].scrollIntoView({ behavior: document.documentElement.dataset.move === "still" ? "auto" : "smooth", block: "center" });
    };
    focusBtn.hidden = false;
    focusBtn.addEventListener("click", () => {
      focusedIdx = focusedIdx >= 0 ? -1 : 0;
      paintFocus();
    });
    paras.forEach((p, idx) => {
      p.addEventListener("click", () => {
        if (focusedIdx < 0) return;
        if (idx === focusedIdx) {
          focusedIdx = idx + 1 < paras.length ? idx + 1 : -1;
        } else {
          focusedIdx = idx;
        }
        paintFocus();
      });
    });
  }

  /* 5. Interactive "Words this piece keeps" -> locate and pulse phrase right in the prose. */
  const escapeRe = (s) => s.replace(/[.*+?^$\{\}()|[\\]\\\\]/g, "\\\\$&");
  document.querySelectorAll(".keeps li").forEach((li) => {
    const phrase = li.textContent.trim();
    if (!prose || !phrase) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "keep-jump";
    btn.textContent = phrase;
    btn.title = "Find this phrase in the piece";
    li.replaceChildren(btn);
    btn.addEventListener("click", () => {
      prose.querySelectorAll("mark.prose-echo").forEach((m) => m.replaceWith(document.createTextNode(m.textContent)));
      const re = new RegExp(escapeRe(phrase), "i");
      for (const p of prose.querySelectorAll("p")) {
        const hit = p.textContent.match(re);
        if (!hit) continue;
        const idx = hit.index;
        const txt = p.textContent;
        p.replaceChildren(
          document.createTextNode(txt.slice(0, idx)),
          Object.assign(document.createElement("mark"), { className: "prose-echo", textContent: txt.slice(idx, idx + hit[0].length) }),
          document.createTextNode(txt.slice(idx + hit[0].length)),
        );
        p.scrollIntoView({ behavior: document.documentElement.dataset.move === "still" ? "auto" : "smooth", block: "center" });
        break;
      }
    });
  });

  /* 6. Interactive murmur cycle, .end closing whisper, 22/7 letter note & colophon pace slider. */
  const murmurEl = document.querySelector(".murmur");
  const MURMURS_ALL = ${JSON.stringify(MURMURS)};
  if (murmurEl && MURMURS_ALL.length > 1) {
    murmurEl.setAttribute("role", "button");
    murmurEl.tabIndex = 0;
    murmurEl.title = "Tap for another line under the door";
    let at = Math.max(0, MURMURS_ALL.indexOf(murmurEl.textContent.trim()));
    const nextMurmur = () => {
      at = (at + 1) % MURMURS_ALL.length;
      murmurEl.dataset.turn = "true";
      murmurEl.textContent = MURMURS_ALL[at];
      setTimeout(() => { delete murmurEl.dataset.turn; }, 220);
    };
    murmurEl.addEventListener("click", nextMurmur);
    murmurEl.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); nextMurmur(); } });
  }

  document.querySelectorAll(".end").forEach((end) => {
    end.removeAttribute("aria-hidden");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "end-btn";
    btn.textContent = end.textContent;
    btn.title = "Tap";
    end.replaceChildren(btn);
    const whisper = document.createElement("p");
    whisper.className = "end-whisper note";
    whisper.hidden = true;
    whisper.innerHTML = 'Nothing here kept your name. <a href="#main">Top</a> · <a href="/">Today</a>';
    end.after(whisper);
    btn.addEventListener("click", () => { whisper.hidden = !whisper.hidden; });
  });

  /* Highlight 22/7 reference inside /to-you/ letter when hovered or tapped. */
  if (location.pathname.startsWith("/to-you") && prose) {
    for (const p of prose.querySelectorAll("p")) {
      if (!p.textContent.includes("22/7")) continue;
      p.innerHTML = p.innerHTML.replace(/22\\/7/, '<a class="pi-wink" href="https://wap.mom/22-7/" title="The periodical next door (off by 1 part in 2,500)">22/7</a>');
      break;
    }
  }

  /* Colophon pace calibrator & Leave shortcut (double-Escape or "l"). */
  const verNote = document.getElementById("footer-colophon");
  const paceDrawer = document.getElementById("pace-drawer");
  if (verNote && paceDrawer) {
    verNote.setAttribute("role", "button");
    verNote.tabIndex = 0;
    verNote.setAttribute("aria-expanded", "false");
    const toggle = () => {
      const open = paceDrawer.hidden;
      paceDrawer.hidden = !open;
      verNote.setAttribute("aria-expanded", String(open));
    };
    verNote.addEventListener("click", toggle);
    verNote.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
    const wpmInput = paceDrawer.querySelector("input[type='range']");
    const wpmOut = paceDrawer.querySelector("output");
    if (wpmInput && wpmOut) {
      const syncWpm = () => {
        const wpm = Number(wpmInput.value) || 220;
        wpmOut.textContent = wpm + " wpm";
        document.querySelectorAll("[data-words]").forEach((el) => {
          const words = Number(el.dataset.words);
          if (!words) return;
          const mins = Math.max(1, Math.round(words / wpm));
          el.textContent = mins + " min";
        });
      };
      wpmInput.addEventListener("input", syncWpm);
    }
  }

  let lastEsc = 0;
  const leaveLink = document.querySelector("a.leave")?.getAttribute("href");
  addEventListener("keydown", (e) => {
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "Escape") {
      const now = Date.now();
      if (now - lastEsc < 500 && leaveLink) location.replace(leaveLink);
      lastEsc = now;
    } else if (e.key === "l" && leaveLink) {
      location.replace(leaveLink);
    }
  });
})();
`;

const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#14040a"/>
  <circle cx="16" cy="16" r="7" fill="none" stroke="#ff3366" stroke-width="2"/>
  <circle cx="16" cy="16" r="2" fill="#ff3366"/>
</svg>`;

function dayIndex(now = Date.now()) {
  return Math.floor(now / 86400000);
}

function featuredStory(now) {
  return STORIES[dayIndex(now) % STORIES.length];
}

function storyBySlug(slug) {
  return STORIES.find((s) => s.slug === slug) || null;
}

function otherStory(story) {
  return STORIES.find((s) => s.slug !== story.slug) || null;
}

/* Settling in. One small cookie, set only when the reader asks, holding how
   they like the room: which register leads, how big the words are, whether
   the page moves. Cleared with one button. Never read for anything else. */
const SETTLE_COOKIE = "settle";
const SETTLE = Object.freeze({
  pace: Object.freeze({ day: "let the day pick", slow: "slow first", dirty: "dirty first" }),
  type: Object.freeze({ set: "as they are", larger: "larger" }),
  move: Object.freeze({ breathe: "let it breathe", still: "hold still" }),
});
const SETTLE_DEFAULT = Object.freeze({ pace: "day", type: "set", move: "breathe" });

function readSettle(request) {
  const header = request.headers.get("Cookie") || "";
  const raw = header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SETTLE_COOKIE}=`));
  const prefs = { ...SETTLE_DEFAULT, kept: false };
  if (!raw) return prefs;
  for (const pair of raw.slice(SETTLE_COOKIE.length + 1).split(".")) {
    const [key, value] = pair.split("-");
    if (SETTLE[key] && SETTLE[key][value]) {
      prefs[key] = value;
      prefs.kept = true;
    }
  }
  return prefs;
}

function settleCookie(prefs) {
  const value = Object.keys(SETTLE)
    .map((key) => `${key}-${prefs[key]}`)
    .join(".");
  return `${SETTLE_COOKIE}=${value}; Path=/; Max-Age=31536000; SameSite=Lax; Secure; HttpOnly`;
}

const SETTLE_CLEAR = `${SETTLE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax; Secure; HttpOnly`;

function isSettled(prefs) {
  return Object.keys(SETTLE).some((key) => prefs[key] !== SETTLE_DEFAULT[key]);
}

/* What the room remembers, said back in a line. */
function settleLine(prefs) {
  const parts = Object.keys(SETTLE)
    .filter((key) => prefs[key] !== SETTLE_DEFAULT[key])
    .map((key) => SETTLE[key][prefs[key]]);
  return parts.join(", ");
}

function leadStory(now, prefs) {
  if (prefs.pace === "slow" || prefs.pace === "dirty") {
    const own = STORIES.filter((s) => s.register === prefs.pace);
    if (own.length) return own[dayIndex(now) % own.length];
  }
  return featuredStory(now);
}

function wordCount(story) {
  return story.body.join(" ").split(/\s+/).filter(Boolean).length;
}

function readMinutes(story) {
  return Math.max(1, Math.round(wordCount(story) / WORDS_PER_MINUTE));
}

function readLength(story) {
  const minutes = readMinutes(story);
  return minutes === 1 ? "1 min" : `${minutes} min`;
}

/* The zine keeps its own words. Each piece names the phrases it adds, dated
   to the day it ran, so the language grows one issue at a time and a later
   piece can lean on a phrase an earlier one earned. */
const LEXICON = STORIES.flatMap((story) =>
  (story.keeps || []).map((phrase) => ({ phrase, from: story.slug, register: story.register, since: story.since }))
);

/* Two registers. The reader picks a mood, not a genre. */
const REGISTER = Object.freeze({
  slow: {
    name: "slow",
    promise: "make me wait",
    pick: "Takes its time. The heat builds by degrees and the payoff is earned. For nights you want to be kept waiting.",
    handoff: "Want it faster? The dirty one is next."
  },
  dirty: {
    name: "dirty",
    promise: "now",
    pick: "Blunt and fast and done before the stop is called. For when the wait is already over.",
    handoff: "Want to be kept waiting? The slow one is next."
  },
});

function registerOf(story) {
  return REGISTER[story.register] || REGISTER.slow;
}

/* brief: the page head already said register and length; only say who and what. */
function renderMeta(story, { brief = false } = {}) {
  const reg = registerOf(story);
  const head = brief
    ? ""
    : `<dt>Pace</dt><dd><span class="badge badge-${escapeHtml(reg.name)}">${escapeHtml(reg.name)}</span> ${escapeHtml(reg.promise)}</dd>
    <dt>Takes</dt><dd data-words="${wordCount(story)}">${escapeHtml(readLength(story))}</dd>`;
  const tags = story.tags?.length
    ? `<dt>Inside</dt><dd>${story.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join(" ")}</dd>`
    : "";
  return `<dl class="meta">
    ${head}
    ${story.pairing ? `<dt>With</dt><dd>${escapeHtml(story.pairing)}</dd>` : ""}
    ${tags}
  </dl>`;
}

/* Stay a minute: a few questions the reader can open after the text, answered
   in the scene's own voice. Details, so it reads with no script and opens from
   the keyboard. */
function renderLinger(story) {
  const items = (story.linger || [])
    .map(
      (l, i) => `<details class="linger-item" id="linger-${i}" name="linger">
      <summary>${escapeHtml(l.ask)}</summary>
      <p>${escapeHtml(l.say)}${l.again ? ` <a href="#text">Go back in</a>.` : ""}</p>
    </details>`
    )
    .join("");
  if (!items) return "";
  return `<section class="linger" aria-labelledby="linger-title">
    <h2 id="linger-title" class="kicker">Stay a minute</h2>
    <p class="note">Open one and the line under the title turns with it. Close it and the line comes back. Nothing here is loud.</p>
    ${items}
  </section>`;
}

/* The line under the title. Opening a linger item fades it into the phrase
   that choice earned; closing it fades the original back. CSS only, so the
   page keeps the no-script promise, and the reader keeps a light hand. */
function renderShift(story) {
  const alts = (story.linger || [])
    .map((l, i) => (l.shift ? `<span class="shift-alt" data-shift="${i}" aria-hidden="true">${escapeHtml(l.shift)}</span>` : ""))
    .join("");
  return `<p class="card-kicker shift"><span class="shift-base">${escapeHtml(story.kicker)}</span>${alts}</p>`;
}

function renderKeeps(story) {
  const items = (story.keeps || []).map((phrase) => `<li>${escapeHtml(phrase)}</li>`).join("");
  if (!items) return "";
  return `<section class="keeps" aria-labelledby="keeps-title">
    <h2 id="keeps-title" class="kicker">Words this piece keeps · since ${escapeHtml(story.since)}</h2>
    <ul>${items}</ul>
  </section>`;
}

function renderParagraphs(lines) {
  return lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
}

function renderStoryCard(story, { today = false } = {}) {
  const reg = registerOf(story);
  return `<article class="card card-${escapeHtml(reg.name)}${today ? " card-today" : ""}">
  <p class="kicker">${escapeHtml(reg.name)} · ${escapeHtml(reg.promise)}</p>
  <h3 class="card-title"><a href="/${escapeHtml(story.slug)}/">${escapeHtml(story.title)}</a></h3>
  <p class="card-kicker">${escapeHtml(story.kicker)}</p>
  <p class="card-summary">${escapeHtml(story.summary)}</p>
  ${renderMeta(story)}
  <p class="cta-row"><a class="cta" href="/${escapeHtml(story.slug)}/">Read it <span aria-hidden="true">→</span></a></p>
</article>`;
}

function layout({ title, description, canonical, body, crumb = "", prefs = SETTLE_DEFAULT }) {
  const current = (name) => (crumb === name ? ' aria-current="page"' : "");
  const htmlAttrs = [prefs.type === "larger" ? ' data-type="larger"' : "", prefs.move === "still" ? ' data-move="still"' : ""].join("");
  return `<!DOCTYPE html>
<html lang="en"${htmlAttrs}>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="noindex, nofollow">
  <meta name="rating" content="adult">
  <meta name="theme-color" content="#14040a">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="smut.today">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <script src="/text-scale-head.js"></script>
  <script src="/app.js" defer></script>
  <style>
    :root {
      color-scheme: dark;
      --bg: #14040a;
      --panel: #1c0812;
      --panel-2: #23101a;
      --fg: #f6e3ea;
      --muted: #c9a3b1;
      --line: rgba(255, 51, 102, .26);
      --accent: #ff3366;
      --accent-ink: #14040a;
      --slow: #ffb3c6;
      --dirty: #ff6b8f;
      --touch: 44px;
      --measure: 36rem;
    }
    * { box-sizing: border-box; }
    html { -webkit-text-size-adjust: 100%; }
    body {
      margin: 0;
      font: 1.0625rem/1.65 ui-serif, Georgia, "Times New Roman", serif;
      background: radial-gradient(circle at 85% -10%, rgba(255, 51, 102, .14), transparent 42%), var(--bg);
      color: var(--fg);
    }
    body > header, main, body > footer { width: min(var(--measure), 100% - 2rem); margin-inline: auto; padding-inline: env(safe-area-inset-left) env(safe-area-inset-right); }
    body > header { padding-top: max(1rem, env(safe-area-inset-top)); padding-bottom: .25rem; }
    main { padding: 1rem 0 3rem; }
    /* Cluster-shared pinch-to-scale steps & transient badge. */
    html[data-text-scale="70"] { font-size: 70%; }
    html[data-text-scale="80"] { font-size: 80%; }
    html[data-text-scale="90"] { font-size: 90%; }
    html[data-text-scale="110"] { font-size: 110%; }
    html[data-text-scale="120"] { font-size: 120%; }
    .text-scale-badge { position: fixed; left: 50%; top: max(14px, env(safe-area-inset-top)); z-index: 60; margin: 0; padding: 7px 14px; border-radius: 999px; border: 1px solid var(--line); background: rgba(20, 4, 10, .9); color: var(--fg); font: 600 13px/1 ui-monospace, SFMono-Regular, Menlo, monospace; transform: translateX(-50%); opacity: 0; pointer-events: none; transition: opacity .2s ease; }
    .text-scale-badge.on { opacity: 1; }
    .reading-thread { position: fixed; inset: 0 0 auto; height: 2px; z-index: 50; background: var(--accent); transform-origin: left center; transform: scaleX(var(--read-progress, 0)); opacity: .7; pointer-events: none; }
    html[data-move="still"] .reading-thread { display: none; }
    main > section + section { margin-top: 1.75rem; }
    h1, h2, h3 { line-height: 1.12; letter-spacing: -.02em; margin: 0 0 .5rem; text-wrap: balance; }
    h1 { font-size: clamp(1.9rem, 6vw, 2.7rem); color: var(--accent); }
    h2 { font-size: 1.45rem; }
    p { margin: 0 0 1rem; text-wrap: pretty; }
    a { color: var(--accent); text-underline-offset: .15em; }
    a:hover { text-decoration-thickness: 2px; }
    :focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: .2rem; }
    .kicker, .note, .meta, .tag, .badge, .topbar, body > footer, .cta {
      font: .92rem/1.5 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    }
    .kicker, .note, .meta, body > footer { color: var(--muted); }
    .kicker { text-transform: uppercase; letter-spacing: .08em; font-size: .78rem; margin: 0 0 .5rem; }
    .lede { font-size: 1.2rem; line-height: 1.5; max-width: 40ch; }
    .skip { position: absolute; left: -9999px; top: 0; padding: .6rem .9rem; background: var(--accent); color: var(--accent-ink); font-weight: 600; text-decoration: none; }
    .skip:focus { left: 1rem; top: 1rem; z-index: 2; }

    /* Chrome: wordmark, nav, leave. Every target is at least 44px on touch. */
    .topbar { display: flex; flex-wrap: wrap; align-items: center; gap: .25rem 1rem; }
    .wordmark { font: 700 1.05rem/1 ui-sans-serif, system-ui, sans-serif; letter-spacing: -.01em; color: var(--fg); text-decoration: none; display: inline-flex; align-items: center; min-height: var(--touch); }
    .wordmark b { color: var(--accent); font-weight: inherit; }
    .topbar nav { display: flex; flex-wrap: wrap; gap: .1rem .25rem; margin-left: auto; }
    .topbar nav a, .leave { display: inline-flex; align-items: center; min-height: var(--touch); padding: 0 .7rem; color: var(--muted); text-decoration: none; border-radius: 999px; }
    .topbar nav a[aria-current="page"] { color: var(--fg); text-decoration: underline; text-underline-offset: .3em; }
    .topbar nav a:hover, .leave:hover { color: var(--fg); background: var(--panel); }
    .leave { color: var(--fg); border: 1px solid var(--line); }
    .age { font-size: .85rem; margin: .25rem 0 0; }

    /* Cards */
    .card { border: 1px solid var(--line); border-radius: 1.1rem; padding: 1.15rem 1.15rem 1.1rem; background: var(--panel); margin: 1rem 0; }
    .card-today { background: linear-gradient(160deg, var(--panel-2), var(--panel)); border-color: rgba(255, 51, 102, .5); }
    .card-title { font-size: 1.6rem; margin-bottom: .15rem; }
    .card-title a { color: var(--fg); text-decoration: none; }
    .card-title a:hover, .card-title a:focus-visible { color: var(--accent); }
    .card-kicker { color: var(--muted); font-style: italic; margin-bottom: .6rem; }
    .card-summary { font-size: 1.1rem; }
    .cta-row { margin: .9rem 0 0; }
    .cta { display: inline-flex; align-items: center; gap: .4rem; min-height: var(--touch); padding: 0 1.1rem; border-radius: 999px; background: var(--accent); color: var(--accent-ink); font-weight: 600; text-decoration: none; }
    .cta:hover { filter: brightness(1.08); }
    .cta-quiet { background: transparent; color: var(--accent); border: 1px solid var(--accent); }

    /* Meta: register, length, who, what's in it. */
    .meta { display: grid; grid-template-columns: max-content 1fr; gap: .2rem .8rem; margin: .5rem 0 0; }
    .meta dt { color: var(--muted); }
    .meta dd { margin: 0; color: var(--fg); }
    .badge { display: inline-block; padding: .05rem .5rem; border-radius: 999px; font-weight: 600; font-size: .8rem; letter-spacing: .04em; text-transform: uppercase; border: 1px solid currentColor; }
    .badge-slow { color: var(--slow); }
    .badge-dirty { color: var(--dirty); }
    .tag { display: inline-block; padding: .05rem .5rem; border-radius: 999px; background: var(--panel-2); border: 1px solid var(--line); color: var(--fg); font-size: .82rem; margin: .1rem .1rem .1rem 0; }

    /* Register picker on the index */
    .registers { display: grid; gap: .75rem; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); margin: .5rem 0 1.5rem; padding: 0; list-style: none; }
    .registers li { border: 1px solid var(--line); border-radius: .9rem; padding: .9rem 1rem; background: var(--panel); }
    .registers .badge { margin-bottom: .35rem; }
    .registers p { margin: 0; color: var(--muted); font-size: .98rem; }

    /* The piece itself. The text is the whole point; give it room. */
    .piece-head { margin-bottom: 1.25rem; }
    .piece-head .card-kicker { font-size: 1.05rem; }
    .before { border: 1px solid var(--line); border-radius: .9rem; padding: .9rem 1rem; background: var(--panel); margin: 0 0 1.75rem; }
    .before .kicker { margin-bottom: .35rem; }
    .before .note { margin: .6rem 0 0; }
    .prose { font-size: 1.15rem; line-height: 1.75; }
    .prose p { margin: 0 0 1.25rem; }
    .prose p:first-of-type::first-letter { font-size: 2.6em; line-height: .85; float: left; padding: .12em .12em 0 0; color: var(--accent); }
    .end { margin: 1.25rem 0 0; color: var(--muted); text-align: center; letter-spacing: .4em; }
    .linger { margin: 1.5rem 0 0; border-top: 1px dashed var(--line); padding-top: 1rem; }
    .linger .note { margin-bottom: .25rem; }
    .linger-item { border-bottom: 1px solid var(--line); }
    .linger-item summary { display: flex; align-items: center; gap: .6rem; min-height: var(--touch); padding: .35rem 0; cursor: pointer; font-style: italic; font-size: 1.1rem; list-style: none; }
    .linger-item summary::-webkit-details-marker { display: none; }
    .linger-item summary::before { content: "○"; color: var(--accent); font-style: normal; flex: none; }
    .linger-item[open] summary::before { content: "●"; }
    .linger-item summary:hover { color: var(--accent); }
    .linger-item p { margin: 0 0 1rem 1.5rem; color: var(--fg); line-height: 1.65; }
    .murmur { font-style: italic; color: var(--muted); text-align: center; margin: .25rem 0 0; }
    .shift { display: grid; }
    .shift > span { grid-area: 1 / 1; transition: opacity 1.1s ease; }
    .shift-alt { opacity: 0; }
    article:has(#linger-0[open]) .shift-base, article:has(#linger-1[open]) .shift-base, article:has(#linger-2[open]) .shift-base { opacity: 0; }
    article:has(#linger-0[open]) [data-shift="0"], article:has(#linger-1[open]) [data-shift="1"], article:has(#linger-2[open]) [data-shift="2"] { opacity: 1; }
    @media (prefers-reduced-motion: reduce) { .shift > span { transition: none; } }
    html[data-type="larger"] { font-size: 118%; }
    html[data-type="larger"] body { line-height: 1.7; }
    html[data-move="still"] .prose p:first-of-type::first-letter { font-size: inherit; float: none; padding: 0; color: inherit; line-height: inherit; }
    html[data-move="still"] .shift > span { transition: none; }
    html[data-move="still"] body { background: var(--bg); }
    .settle fieldset { border: 1px solid var(--line); border-radius: .9rem; padding: .75rem 1rem .5rem; margin: 0 0 1rem; background: var(--panel); }
    .settle legend { padding: 0 .4rem; font-style: italic; }
    .settle label { display: flex; align-items: flex-start; gap: .7rem; min-height: var(--touch); padding: .55rem 0; cursor: pointer; }
    .settle input[type="radio"] { width: 1.15rem; height: 1.15rem; accent-color: var(--accent); margin: .2rem 0 0; flex: none; }
    .settle .actions { display: flex; flex-wrap: wrap; gap: .6rem; align-items: center; }
    .settle button { font: inherit; cursor: pointer; }
    .settle .cta { border: 0; }
    .settle .cta-quiet { background: transparent; }
    .settled { border-left: 3px solid var(--accent); padding: .3rem .8rem; margin: 1rem 0 0; }
    .keeps { margin: 1.75rem 0 0; border-top: 1px dashed var(--line); padding-top: 1rem; }
    .keeps ul { margin: 0; padding-left: 1.1rem; columns: 2 12rem; column-gap: 1.5rem; }
    .keeps li { margin: .2rem 0; break-inside: avoid; }
    /* Region tap effects & tactile reading affordances. */
    .card, .before, .registers li, .linger-item summary, .keeps li {
      transition: transform 120ms ease, border-color 180ms ease, background-color 180ms ease;
      -webkit-tap-highlight-color: transparent;
    }
    .card:active, .before:active, .registers li:active { transform: scale(.994); border-color: var(--accent); }
    .focus-toggle, .keep-jump, .end-btn {
      font: inherit; color: var(--accent); background: transparent; border: 1px solid var(--line); border-radius: 999px;
      padding: .15rem .75rem; min-height: 36px; cursor: pointer; font-size: .85rem;
    }
    .focus-toggle:hover, .keep-jump:hover, .end-btn:hover { border-color: var(--accent); background: rgba(255, 51, 102, .1); }
    .focus-toggle[aria-pressed="true"] { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }
    .keep-jump { color: var(--fg); border: 0; border-bottom: 1px dashed var(--line); border-radius: .2rem; padding: .15rem .25rem; text-align: left; font-size: 1rem; }
    .keep-jump:hover { border-bottom-color: var(--accent); color: var(--accent); }
    .prose.is-focused p { opacity: .28; cursor: pointer; transition: opacity .25s ease; }
    .prose.is-focused p.is-lit { opacity: 1; }
    mark.prose-echo { background: rgba(255, 51, 102, .28); color: var(--fg); padding: .05em .2em; border-radius: .2rem; border-bottom: 1px solid var(--accent); }
    .murmur { cursor: pointer; border-radius: .4rem; padding: .2rem .5rem; transition: opacity 180ms ease, color 180ms ease; }
    .murmur:hover, .murmur[data-turn="true"] { color: var(--fg); }
    .end-btn { border: 0; color: var(--muted); letter-spacing: .4em; padding-inline: .8rem; }
    .end-whisper { text-align: center; margin: .4rem 0 0; }
    .pi-wink { text-decoration-style: dotted; }
    .pace-drawer { margin: .75rem 0; padding: .75rem .9rem; border: 1px solid var(--line); border-radius: .8rem; background: var(--panel); }
    .pace-drawer[hidden] { display: none; }
    .pace-drawer label { display: flex; flex-wrap: wrap; align-items: center; gap: .4rem .8rem; font-size: .9rem; }
    .pace-drawer input[type="range"] { flex: 1 1 8rem; min-height: 44px; accent-color: var(--accent); }
    #footer-colophon { cursor: pointer; text-decoration: underline dotted var(--line); text-underline-offset: .25em; }
    .pwa-note { margin: .5rem 0 0; }
    @media (pointer: coarse) { .focus-toggle, .keep-jump, .end-btn { min-height: 44px; } }
    html[data-move="still"] *, html[data-move="still"] *::before, html[data-move="still"] *::after { transition: none !important; transform: none !important; }
    @media (prefers-reduced-motion: reduce) {
      .card, .before, .registers li, .linger-item summary, .keeps li, .text-scale-badge, .prose.is-focused p { transition: none; transform: none !important; }
    }
    .next { margin: 2rem 0 0; }
    .next .card { margin-top: .5rem; }

    ul.pieces { list-style: none; padding: 0; margin: 0; }
    ul.pieces .card { margin: .75rem 0; }

    .also { display: grid; gap: .75rem; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); margin: .5rem 0 0; }
    .also .card { margin: 0; }
    .also h3 { font-size: 1.2rem; }
    .also a { display: inline-flex; align-items: center; min-height: var(--touch); }

    body > footer { padding: 1rem 0 2.5rem; border-top: 1px solid var(--line); }
    body > footer nav { display: flex; flex-wrap: wrap; gap: .1rem .25rem; margin: 0 -.7rem; }
    body > footer nav a { display: inline-flex; align-items: center; min-height: var(--touch); padding: 0 .7rem; }

    @media (max-width: 30rem) {
      .meta { grid-template-columns: 1fr; gap: .05rem; }
      .meta dt { margin-top: .4rem; font-size: .78rem; text-transform: uppercase; letter-spacing: .08em; }
    }
    @media (hover: hover) and (pointer: fine) {
      :root { --touch: 36px; }
    }
    @media print {
      body > header, body > footer, .before, .next, .cta-row { display: none; }
      body { background: #fff; color: #000; }
      h1, a { color: #000; }
    }
  </style>
</head>
<body>
  <div class="reading-thread" aria-hidden="true"></div>
  <a class="skip" href="#main">Skip to content</a>
  <header>
    <div class="topbar">
      <a class="wordmark" href="/" aria-label="smut.today home"><b>smut</b>.today</a>
      <nav aria-label="Site">
        <a href="/"${current("home")}>Today</a>
        <a href="/to-you/"${current("letter")}>The letter</a>
        <a href="/pitches/"${current("pitches")}>The shelf</a>
        <a href="/settle/"${current("settle")}>Settle in</a>
        <a class="leave" href="${escapeHtml(LEAVE_URL)}" rel="noreferrer">Leave</a>
      </nav>
    </div>
  </header>
  <main id="main">
    ${body}
  </main>
  <footer>
    <p>For adults. Everyone in these pieces is grown and says yes. No ads, no accounts, nothing watching you read. <a href="${escapeHtml(LEAVE_URL)}" rel="noreferrer">Leave</a> whenever you like; the door does not lock behind you.</p>
    <nav aria-label="Footer">
      <a href="/">Today</a>
      <a href="/to-you/">The letter</a>
      <a href="/pitches/">The shelf</a>
      <a href="/settle/">Settle in</a>
      <a href="/today.json">today.json</a>
      <a href="https://wap.mom/">wap.mom</a>
    </nav>
    <p class="note" id="footer-colophon">smut.today ${escapeHtml(VERSION)}. The periodical is next door.</p>
    <aside class="pace-drawer" id="pace-drawer" hidden>
      <label><span>Your reading pace</span><input type="range" min="150" max="320" step="10" value="220" aria-label="Reading pace in words per minute"><output>220 wpm</output></label>
      <p class="note">Recalculates reading time locally. Choosing Forget me in Settle in clears offline copies too.</p>
    </aside>
  </footer>
</body>
</html>`;
}

function renderIndex(now, prefs) {
  const featured = leadStory(now, prefs);
  const others = STORIES.filter((s) => s.slug !== featured.slug);
  const settled = isSettled(prefs)
    ? `<p class="settled note">The room remembers: ${escapeHtml(settleLine(prefs))}. <a href="/settle/">Change it</a>, or forget it there.</p>`
    : `<p class="note">Want slow first every time, or larger words? <a href="/settle/">Settle in</a> and the room will remember.</p>`;
  const registers = Object.values(REGISTER)
    .map(
      (reg) => `<li>
    <span class="badge badge-${escapeHtml(reg.name)}">${escapeHtml(reg.name)}</span> <span class="note">${escapeHtml(reg.promise)}</span>
    <p>${escapeHtml(reg.pick)}</p>
  </li>`
    )
    .join("");
  const list = others.map((s) => `<li>${renderStoryCard(s)}</li>`).join("");
  return layout({
    prefs,
    crumb: "home",
    title: "smut.today — one scene a day, door shut",
    description: "Short, explicit fiction for adults. One scene a day: slow when you want to be kept waiting, dirty when you don't. You know how long it takes and what happens before the first line.",
    canonical: "https://smut.today/",
    body: `<section aria-labelledby="site-title">
  <h1 id="site-title">Something to read with the door shut.</h1>
  <p class="lede">One scene a day. Slow when you want to be kept waiting, dirty when you don’t. You’ll know how long it takes and what happens before the first line, and after that it’s only the words and you.</p>
  <p class="age">18+. If that isn’t you, or this isn’t the night for it, <a href="${escapeHtml(LEAVE_URL)}" rel="noreferrer">leave</a>. Nothing here follows you out.</p>
</section>
<section aria-labelledby="today-title">
  <h2 id="today-title" class="kicker">Today · ${escapeHtml(new Date(now).toISOString().slice(0, 10))}</h2>
  ${renderStoryCard(featured, { today: true })}
  <p class="murmur">${escapeHtml(murmur(now))}</p>
  ${settled}
</section>
<section aria-labelledby="registers-title">
  <h2 id="registers-title" class="kicker">Two ways in</h2>
  <ul class="registers">${registers}</ul>
</section>
<section aria-labelledby="pieces-title">
  <h2 id="pieces-title" class="kicker">Still warm</h2>
  <ul class="pieces">${list}</ul>
</section>
<section aria-labelledby="also-title">
  <h2 id="also-title" class="kicker">Down the hall</h2>
  <div class="also">
    <article class="card">
      <h3><a href="/to-you/">${escapeHtml(LETTER.title)}</a></h3>
      <p class="note">A letter to the person who sits for the drawings. Not smut. Not not.</p>
    </article>
    <article class="card">
      <h3><a href="/pitches/">Three book pitches</a></h3>
      <p class="note">Premises a hand can hold up to a camera. They belong to the periodical next door, <a href="https://wap.mom/">Wondering About Pi</a>.</p>
    </article>
  </div>
</section>`,
  });
}

function renderLetter(prefs) {
  return layout({
    prefs,
    crumb: "letter",
    title: `${LETTER.title} — smut.today`,
    description: LETTER.kicker,
    canonical: "https://smut.today/to-you/",
    body: `<article>
  <header class="piece-head">
    <p class="kicker">A letter · ${escapeHtml(LETTER.kicker)}</p>
    <h1>${escapeHtml(LETTER.title)}</h1>
    <p><button type="button" class="focus-toggle" id="focus-toggle" aria-pressed="false" hidden>One breath at a time</button></p>
  </header>
  <div class="prose">${renderParagraphs(LETTER.body)}</div>
  <p class="end" aria-hidden="true">· · ·</p>
</article>
<nav class="next" aria-label="Where next">
  <p class="cta-row"><a class="cta cta-quiet" href="/">Back to today’s piece</a></p>
</nav>`,
  });
}

function renderPitches(prefs) {
  const cards = PITCHES.map(
    (p) => `<article class="card">
  <h2>${escapeHtml(p.title)}</h2>
  <p>${escapeHtml(p.hook)}</p>
  <p class="note">${escapeHtml(p.why)}</p>
</article>`
  ).join("");
  return layout({
    prefs,
    crumb: "pitches",
    title: "The shelf — smut.today",
    description: "Three book premises for a shelf that already knows how to caption.",
    canonical: "https://smut.today/pitches/",
    body: `<header class="piece-head">
  <p class="kicker">For the shelf</p>
  <h1>Three books that would be good to be seen holding.</h1>
  <p class="lede">Premises, not manuscripts. Each one fits in a caption and survives being held up to a lens. None of them explain the domain next door: <a href="https://wap.mom/">wap.mom</a> is the periodical, and this side of the wall is the heat.</p>
</header>
${cards}
<nav class="next" aria-label="Where next">
  <p class="cta-row"><a class="cta cta-quiet" href="/">Back to today’s piece</a></p>
</nav>`,
  });
}

function renderStory(story, prefs) {
  const other = otherStory(story);
  const reg = registerOf(story);
  const next = other
    ? `<nav class="next" aria-labelledby="next-title">
  <h2 id="next-title" class="kicker">${escapeHtml(reg.handoff)}</h2>
  ${renderStoryCard(other)}
</nav>`
    : "";
  return layout({
    prefs,
    title: `${story.title} — smut.today`,
    description: `${story.summary} ${reg.name[0].toUpperCase()}${reg.name.slice(1)}, ${readLength(story)}.`,
    canonical: `https://smut.today/${story.slug}/`,
    body: `<article>
  <header class="piece-head">
    <p class="kicker"><span class="badge badge-${escapeHtml(reg.name)}">${escapeHtml(reg.name)}</span> ${escapeHtml(reg.promise)} · <span data-words="${wordCount(story)}">${escapeHtml(readLength(story))}</span></p>
    <h1>${escapeHtml(story.title)}</h1>
    ${renderShift(story)}
  </header>
  <aside class="before" aria-labelledby="before-title">
    <h2 id="before-title" class="kicker">Before the door shuts</h2>
    ${renderMeta(story, { brief: true })}
    <p class="note">Told to you, in second person. Everyone here is grown and says yes. <a href="#text">Go straight in</a> · <button type="button" class="focus-toggle" id="focus-toggle" aria-pressed="false" hidden>One breath at a time</button></p>
  </aside>
  <div class="prose" id="text">${renderParagraphs(story.body)}</div>
  <p class="end" aria-hidden="true">· · ·</p>
  ${renderLinger(story)}
  ${renderKeeps(story)}
</article>
${next}`,
  });
}

const SETTLE_ASK = Object.freeze({
  pace: "Which do you want first?",
  type: "How big should the words be?",
  move: "How much should the page move?",
});
const SETTLE_HINT = Object.freeze({
  pace: { day: "the date decides, and both are always one link away", slow: "make me wait, every time", dirty: "now, every time" },
  type: { set: "", larger: "a size up, everywhere" },
  move: { breathe: "the drop cap, the line that turns, the glow", still: "no fades, no flourishes, just the page" },
});

function renderSettle(prefs) {
  const groups = Object.keys(SETTLE)
    .map((key) => {
      const options = Object.entries(SETTLE[key])
        .map(([value, label]) => {
          const hint = SETTLE_HINT[key][value];
          return `<label><input type="radio" name="${key}" value="${value}"${prefs[key] === value ? " checked" : ""}> <span>${escapeHtml(label)}${hint ? ` <span class="note">· ${escapeHtml(hint)}</span>` : ""}</span></label>`;
        })
        .join("");
      return `<fieldset><legend>${escapeHtml(SETTLE_ASK[key])}</legend>${options}</fieldset>`;
    })
    .join("");
  const remembered = isSettled(prefs)
    ? `<p class="settled note">Kept on this device: ${escapeHtml(settleLine(prefs))}.</p>`
    : "";
  return layout({
    prefs,
    crumb: "settle",
    title: "Settle in — smut.today",
    description: "Tell the room how you like it: slow or dirty first, how big the words are, whether the page moves. Kept on this device until you say forget.",
    canonical: "https://smut.today/settle/",
    body: `<header class="piece-head">
  <p class="kicker">Settle in</p>
  <h1>Tell the room how you like it.</h1>
  <p class="lede">It remembers on this device only, in one small cookie, and only because you asked. Come back and the room is already the way you left it. Say forget and it is gone.</p>
  ${remembered}
</header>
<form class="settle" method="post" action="/settle/">
  ${groups}
  <p class="actions">
    <button class="cta" type="submit" name="keep" value="1">Keep this</button>
    <button class="cta cta-quiet" type="submit" name="forget" value="1">Forget me</button>
  </p>
  <p class="keep"><button type="button" class="cta cta-quiet" id="keep-app" hidden>Keep smut.today offline on this device</button></p>
  <p class="note pwa-note" id="pwa-status" aria-live="polite" hidden></p>
</form>`,
  });
}

function settleFromForm(form) {
  const prefs = { ...SETTLE_DEFAULT };
  for (const key of Object.keys(SETTLE)) {
    const value = String(form.get(key) || "");
    if (SETTLE[key][value]) prefs[key] = value;
  }
  return prefs;
}

function jsonToday(now) {
  const featured = featuredStory(now);
  return {
    site: "smut.today",
    date: new Date(now).toISOString().slice(0, 10),
    featured: featured.slug,
    murmur: murmur(now),
    stories: STORIES.map((s) => ({
      slug: s.slug,
      title: s.title,
      summary: s.summary,
      register: s.register,
      since: s.since,
      minutes: readMinutes(s),
      pairing: s.pairing,
      tags: s.tags,
      linger: (s.linger || []).map((l) => l.ask),
    })),
    language: LEXICON,
  };
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const now = Date.now();
    const cache = "public, max-age=300";

    if (url.hostname.startsWith("www.")) {
      return Response.redirect(`https://smut.today${url.pathname}${url.search}`, 302);
    }

    if (url.pathname === "/favicon.svg") {
      return new Response(FAVICON, {
        headers: {
          ...BASE_SECURITY,
          "Content-Type": "image/svg+xml; charset=UTF-8",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    if (url.pathname === "/manifest.webmanifest") {
      return new Response(`${JSON.stringify(MANIFEST, null, 2)}\n`, {
        headers: {
          ...BASE_SECURITY,
          "Content-Type": "application/manifest+json; charset=UTF-8",
          "Cache-Control": cache,
        },
      });
    }

    if (url.pathname === "/text-scale-head.js") {
      return new Response(TEXT_SCALE_HEAD_JS, {
        headers: {
          ...BASE_SECURITY,
          "Content-Type": "text/javascript; charset=UTF-8",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    if (url.pathname === "/app.js") {
      return new Response(APP_JS, {
        headers: {
          ...BASE_SECURITY,
          "Content-Type": "text/javascript; charset=UTF-8",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    if (url.pathname === "/sw.js") {
      return new Response(SW_JS, {
        headers: {
          ...BASE_SECURITY,
          "Content-Type": "text/javascript; charset=UTF-8",
          "Cache-Control": "no-cache",
        },
      });
    }

    const iconName = url.pathname.startsWith("/icons/") ? url.pathname.slice(7) : "";
    if (iconName && ICONS[iconName]) {
      return new Response(smutIconPng(ICONS[iconName].size, ICONS[iconName]), {
        headers: {
          ...BASE_SECURITY,
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    if (url.pathname === "/robots.txt") {
      return new Response("User-agent: *\nDisallow: /\n", {
        headers: {
          ...BASE_SECURITY,
          "Content-Type": "text/plain; charset=UTF-8",
          "Cache-Control": cache,
        },
      });
    }

    if (url.pathname === "/today.json") {
      return new Response(JSON.stringify({ version: VERSION, ...jsonToday(now) }, null, 2), {
        headers: {
          ...BASE_SECURITY,
          "Content-Type": "application/json; charset=UTF-8",
          "Cache-Control": cache,
          "X-Robots-Tag": "noindex",
        },
      });
    }

    const prefs = readSettle(request);
    const htmlHeaders = {
      ...BASE_SECURITY,
      "Content-Type": "text/html; charset=UTF-8",
      "Cache-Control": prefs.kept ? "private, max-age=300" : cache,
      Vary: "Cookie",
      "X-Robots-Tag": "noindex, nofollow",
    };

    if (url.pathname === "/settle" || url.pathname === "/settle/") {
      if (request.method === "POST") {
        const form = await request.formData();
        const forget = form.has("forget");
        return new Response(null, {
          status: 303,
          headers: {
            ...BASE_SECURITY,
            Location: "/",
            "Cache-Control": "no-store",
            "Set-Cookie": forget ? SETTLE_CLEAR : settleCookie(settleFromForm(form)),
          },
        });
      }
      return new Response(renderSettle(prefs), { headers: { ...htmlHeaders, "Cache-Control": "no-store" } });
    }

    if (url.pathname === "/" || url.pathname === "") {
      return new Response(renderIndex(now, prefs), { headers: htmlHeaders });
    }

    if (url.pathname === "/to-you" || url.pathname === "/to-you/") {
      return new Response(renderLetter(prefs), { headers: htmlHeaders });
    }

    if (url.pathname === "/pitches" || url.pathname === "/pitches/") {
      return new Response(renderPitches(prefs), { headers: htmlHeaders });
    }

    const slug = url.pathname.replace(/^\/+|\/+$/g, "");
    const story = storyBySlug(slug);
    if (story) {
      return new Response(renderStory(story, prefs), { headers: htmlHeaders });
    }

    return new Response("No door here. The way in is https://smut.today/\n", {
      status: 404,
      headers: {
        ...BASE_SECURITY,
        "Content-Type": "text/plain; charset=UTF-8",
        "Cache-Control": "no-store",
      },
    });
  },
};
