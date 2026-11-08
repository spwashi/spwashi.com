// spw.quest as an app on a phone: the manifest, its icons, and the head lines
// that point a browser at them (PR 4 of .agents/plans/spw-quest/note-shell-design.md,
// with the creator's 2026-11-08 change: /install says how to add it).
//
// Installing from the browser's menu needs only these (Chrome 108+ on Android,
// Safari's Add to Home Screen). The browser's own install prompt also wants a
// service worker with a fetch handler: the shell, assets/sw.js (PR 3).
// Colors are PAPER_THEME in paper.js. Icons are committed PNGs under
// assets/icons/, drawn from assets/icons/quest.svg (its comment has the render line).
import { PAPER_THEME } from "./paper.js";

export const MANIFEST_PATH = "/manifest.webmanifest";

/** The four committed icons, by the path they are served at. */
export const APP_ICONS = Object.freeze({
  "/icons/quest-180.png": 180,
  "/icons/quest-192.png": 192,
  "/icons/quest-512.png": 512,
  "/icons/quest-mask-512.png": 512,
});

/**
 * start_url is the guide, which assumes no Spw of the visitor's own: it opens
 * on their walk here, written in Spw (src/walk.js). The shell design had
 * /?note; the creator changed that on 2026-11-08, before any install existed.
 */
export const MANIFEST = Object.freeze({
  id: "/",
  name: "spw.quest",
  short_name: "spw.quest",
  description: "Spw as a tool in your pocket: write a line and see what it reads as, keep a note, and get your walk through the guide back as Spw. Lines go to factshift.center to be laid out.",
  start_url: "/",
  scope: "/",
  display: "standalone",
  // A link from factshift.center's ↗ or spwashi.com lands in the open window instead of stacking another.
  launch_handler: { client_mode: ["navigate-existing", "auto"] },
  categories: ["education", "productivity", "utilities"],
  background_color: PAPER_THEME.background,
  theme_color: PAPER_THEME.accent,
  lang: "en",
  icons: [
    { src: "/icons/quest-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icons/quest-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/icons/quest-mask-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
  // What only this app does, one press from the home screen (long-press on Android, right-click on a desktop).
  shortcuts: [
    { name: "Your walk, in Spw", short_name: "Walk", url: "/#walk", description: "The guide's rooms you have opened, written as Spw." },
    { name: "Build a line", short_name: "Build", url: "/build", description: "Write one line and take it apart, slot by slot." },
    { name: "Learn a mark at a time", short_name: "Learn", url: "/learn", description: "Seven panels, one line each." },
    { name: "The shelf of lines", short_name: "Shelf", url: "/specimens", description: "Lines from spwashi.com, found by slot." },
  ],
});

/** Every quest page's head: the manifest, the tab's icon, and the icon and name iOS uses for Add to Home Screen. */
export const APP_HEAD = `<link rel="manifest" href="${MANIFEST_PATH}">
  <link rel="icon" type="image/png" sizes="192x192" href="/icons/quest-192.png">
  <link rel="apple-touch-icon" href="/icons/quest-180.png">
  <meta name="apple-mobile-web-app-title" content="spw.quest">`;

const NOSNIFF = { "X-Content-Type-Options": "nosniff" };

/** GET /manifest.webmanifest: no BASE_SECURITY, which would give it a page's policy it does not need. */
export function serveManifest(request) {
  return new Response(request.method === "HEAD" ? null : JSON.stringify(MANIFEST, null, 2), {
    headers: { ...NOSNIFF, "Content-Type": "application/manifest+json; charset=UTF-8", "Cache-Control": "public, max-age=300" },
  });
}

export const isAppIconPath = (pathname) => Object.hasOwn(APP_ICONS, pathname);

/** An icon from env.ASSETS, for a day: not immutable, so a redrawn icon keeps its address. */
export async function serveAppIcon(request, url, env) {
  if (!["GET", "HEAD"].includes(request.method)) return new Response("Method not allowed", { status: 405, headers: { ...NOSNIFF, Allow: "GET, HEAD" } });
  const asset = await env?.ASSETS?.fetch(new Request(new URL(url.pathname, url.origin), { method: "GET" }));
  if (!asset || !asset.ok) return new Response("Not found", { status: 404, headers: NOSNIFF });
  return new Response(request.method === "HEAD" ? null : asset.body, {
    headers: { ...NOSNIFF, "Content-Type": "image/png", "Cross-Origin-Resource-Policy": "same-origin", "Cache-Control": "public, max-age=86400" },
  });
}

/**
 * Runs on /install (it travels by toString). Marks the way for this device,
 * says so when the page is already the installed app, offers a link to send
 * to a phone, and shows an Add button only when the browser offers its own
 * prompt (beforeinstallprompt). Without script the steps stand as written.
 */
export function questAppInstall() {
  const section = document.getElementById("phone");
  if (!section) return;
  const said = section.querySelector("[data-app-said]");
  const say = (text) => {
    said.textContent = text;
    said.hidden = false;
  };
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const device = ios ? "ios" : /Android/.test(ua) ? "android" : "computer";
  const way = section.querySelector(`[data-way="${device}"]`);
  if (way) {
    way.classList.add("here");
    way.querySelector(".here-tag").hidden = false;
  }
  if (matchMedia("(display-mode: standalone)").matches || navigator.standalone === true) {
    section.querySelector("[data-app-here]").hidden = false;
    section.querySelector(".app-ways").hidden = true;
    return;
  }
  const offer = section.querySelector("[data-app-offer]");
  let deferred = null;
  addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event;
    offer.hidden = false;
  });
  offer.querySelector("button").addEventListener("click", async () => {
    if (!deferred) return;
    const asked = deferred;
    deferred = null;
    offer.hidden = true;
    asked.prompt();
    const { outcome } = await asked.userChoice;
    say(outcome === "accepted" ? "Adding spw.quest to this device." : "Not added. The steps below still work whenever you want them.");
  });
  addEventListener("appinstalled", () => {
    offer.hidden = true;
    say("spw.quest is on this device now. Open it from your home screen or app list.");
  });
  const share = section.querySelector("[data-app-share]");
  if (share && navigator.share) {
    share.hidden = false;
    share.addEventListener("click", () => {
      navigator.share({ title: "spw.quest", url: section.querySelector("#app-address").textContent.trim() })
        .then(() => say("Sent. Open the link on your phone and follow the step for it."))
        .catch(() => {});
    });
  }
}

/** The section at the top of /install. */
export function appInstallSection() {
  return `<section id="phone" class="phone" aria-labelledby="phone-title">
  <h2 id="phone-title">On your phone</h2>
  <p>Add spw.quest to your home screen. It opens on the guide, in its own window, without the browser around it.</p>
  <p class="note" data-app-here hidden>You opened this from your home screen, so spw.quest is already on this device.</p>
  <p class="app-offer" data-app-offer hidden><button type="button" data-app-install>Add spw.quest to this device</button></p>
  <ul class="app-ways">
    <li data-way="ios"><strong>iPhone or iPad</strong> <span class="here-tag" hidden>this device</span><span>Tap Share, then <em>Add to Home Screen</em>. If Share is not in view, it is in the ••• menu.</span></li>
    <li data-way="android"><strong>Android</strong> <span class="here-tag" hidden>this device</span><span>Open the browser’s menu (⋮), then <em>Add to Home screen</em> or <em>Install app</em>.</span></li>
    <li data-way="computer"><strong>On a computer</strong> <span class="here-tag" hidden>this device</span><span>Open this page on your phone: <code id="app-address">https://spw.quest/install#phone</code></span><span class="app-send"><button type="button" class="quiet-button" data-copy="app-address">Copy the link</button><button type="button" class="quiet-button" data-app-share hidden>Send it</button></span></li>
  </ul>
  <p class="note" data-app-said role="status" hidden></p>
  <p class="note">Pages you have opened with a connection open again without one; a page never opened shows a short offline note instead. On iPhone and iPad the home-screen app keeps its own storage, so a note kept in Safari does not follow it there: copy or download the note first.</p>
</section>`;
}

export const APP_INSTALL_CSS = `.phone { margin: 0 0 2.4rem; padding: 0 0 1.6rem; border-bottom: 1px solid var(--line); }
    .phone .app-offer button { margin: .2rem 0 .4rem; }
    .app-ways { display: grid; gap: .5rem; margin: .9rem 0; padding: 0; list-style: none; }
    .app-ways li { margin: 0; padding: .7rem .9rem; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); }
    .app-ways li > span:not(.here-tag) { display: block; margin-top: .2rem; }
    .app-ways li.here { border-color: var(--accent); box-shadow: inset 3px 0 0 var(--accent); }
    .app-ways .here-tag { margin-left: .4rem; color: var(--accent); font: 600 .72rem/1 var(--font); letter-spacing: .06em; text-transform: uppercase; }
    .app-ways code { overflow-wrap: anywhere; }
    .app-ways li > .app-send { display: flex; flex-wrap: wrap; gap: .3rem; margin: .3rem 0 0 -.75rem; }
    @media (pointer: coarse) { .app-send .quiet-button { min-height: 44px; } }
    html:not(.js) .app-send { display: none; }`;
