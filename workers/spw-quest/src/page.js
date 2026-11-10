// What every spw.quest HTML page shares: the masthead, the measure and the
// quiet buttons, and the policy that lets a page set the site's faces from
// this origin (workers/lib/peer-assets.js serves them under /fonts/).
import { BASE_SECURITY, htmlResponse } from "../../lib/shell.js";
import { DISPLAY_CSS, DISPLAY_HEAD } from "./display.js";
import { PAPER_HEAD } from "./paper.js";
import { APP_HEAD } from "./quest-manifest.js";
import { WALK_HEAD } from "./walk.js";

/** Every quest page's head: the site's faces, the app manifest, the reader's display choices applied before the body paints, and this address added to the walk. */
export const QUEST_HEAD = `${PAPER_HEAD}\n  ${APP_HEAD}\n  ${DISPLAY_HEAD}\n  ${WALK_HEAD}`;

/**
 * spw.quest's pages set the site's faces, read the app manifest, let the browser
 * load its icons, and register the shell (/sw.js), all from their own origin;
 * text and JSON keep the shell's policy. img-src 'self' is there because Chrome
 * fetches manifest icons under the page's policy: without it, a headless check on
 * 2026-11-08 reported no-acceptable-icon and the app was not installable.
 */
export const PAGE_CSP = BASE_SECURITY["Content-Security-Policy"].replace("style-src 'unsafe-inline';", "style-src 'unsafe-inline'; font-src 'self'; img-src 'self'; manifest-src 'self'; worker-src 'self';");
/** Pages that read as you type load the parser by URL (/parser.js, or the guide's pinned reader, same origin), and the guide asks /parser/index.json whether a newer release is out. */
export const LIVE_CSP = `${PAGE_CSP.replace("script-src 'unsafe-inline'", "script-src 'self' 'unsafe-inline'")}; connect-src 'self'`;

/**
 * Runs on the guide, /learn, /build and /install (it travels by toString): registers
 * the shell, and is the whole update protocol (note-shell-design.md, "How the
 * worker updates and rolls back"). A new shell waits until the reader asks for it;
 * the first install claims the page without reloading it.
 */
export function registerShell() {
  if (!("serviceWorker" in navigator)) return;
  let reloadOnControllerChange = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloadOnControllerChange) location.reload();
  });
  const line = (text, action) => {
    let node = document.getElementById("shell-line");
    if (!node) {
      node = document.createElement("p");
      node.id = "shell-line";
      node.className = "shell-line";
      node.setAttribute("role", "status");
      document.body.append(node);
    }
    node.textContent = text;
    if (action) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quiet-button";
      button.textContent = action.label;
      button.addEventListener("click", action.run);
      node.append(" ", button);
    }
  };
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data && event.data.type === "pin-mismatch") line("The file at this address does not match the shell's pin.");
  });
  window.addEventListener("offline", () => {
    line("You are reading offline. Pages you have opened and your walk are still here.");
  });
  window.addEventListener("online", () => {
    const node = document.getElementById("shell-line");
    if (node && node.textContent.includes("offline")) node.remove();
  });
  const start = () => navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).then((registration) => {
    registration.update().catch(() => {});
    const tell = () => {
      if (!registration.waiting || !navigator.serviceWorker.controller) return;
      line("A new shell is saved.", {
        label: "Reload to use it",
        run: () => {
          reloadOnControllerChange = true;
          registration.waiting?.postMessage({ type: "skip-waiting" });
        },
      });
    };
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed") tell();
      });
    });
    tell();
  }).catch(() => {});
  if (document.readyState === "complete") start();
  else addEventListener("load", start, { once: true });
}

const REGISTER_SCRIPT = `<script>(${registerShell.toString()})();</script>`;

/**
 * An HTML page under spw.quest's policy: the shell's, plus the faces from this
 * origin. Pages that read as you type (LIVE_CSP), and any page asked with
 * { shell: true }, register the shell before </body>.
 */
export function page(html, extra = {}, csp = PAGE_CSP) {
  const withShell = csp === LIVE_CSP || extra.shell === true;
  const body = withShell && html.includes("</body>") ? html.replace(/<\/body>(?![\s\S]*<\/body>)/, `  ${REGISTER_SCRIPT}\n</body>`) : html;
  const response = htmlResponse(body, extra);
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

/** The top of every page: the name, and the four places to go. */
/** The shelf's rooms: the lines kept, the shapes they take, a line turned one slot at a time, and a line at rest under the hand. */
const SHELF_ROOMS = Object.freeze([["/specimens", "Specimens"], ["/constructs", "Constructs"], ["/pivot", "Pivot"], ["/physics", "Physics"], ["/forms/", "Forms"], ["/arcs/", "Arcs"], ["/bench/", "Bench"]]);

export function masthead(current = "") {
  const onShelf = SHELF_ROOMS.some(([href]) => href === current);
  const links = [["/learn", "Learn"], ["/build", "Build"], ["/specimens", "Shelf"], ["/parser/", "Parser"], ["/install", "Install"]]
    .map(([href, label]) => {
      const here = href === current || (label === "Shelf" && onShelf);
      return `<a href="${href}"${here ? ' aria-current="page"' : ""}>${label}</a>`;
    }).join("");
  const shelf = onShelf
    ? `\n  <nav class="shelf-rooms" aria-label="The shelf">${SHELF_ROOMS.map(([href, label]) => `<a href="${href}"${href === current ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</nav>`
    : "";
  return `<header class="masthead">
  <a class="brand" href="/"${current === "/" ? ' aria-current="page"' : ""}>spw.quest</a>
  <nav class="top" aria-label="spw.quest">${links}</nav>${shelf}
</header>`;
}

/** Shared by every HTML page: the masthead, the measure, and the quiet buttons. */
export const PAGE_CSS = `main { width: min(72rem, calc(100% - 2rem)); padding-top: 1rem; }
    .masthead { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .4rem 1.2rem; margin: 0 0 1.6rem; padding: 0 0 .7rem; border-bottom: 1px solid var(--line); }
    .masthead .brand { color: var(--fg); font: 600 1.05rem/1 var(--mono); letter-spacing: -.01em; text-decoration: none; }
    .masthead .top { display: flex; flex-wrap: wrap; gap: .1rem; margin-right: -.6rem; }
    .masthead .top a { display: inline-flex; align-items: center; min-height: 44px; padding: 0 .6rem; color: var(--muted); font-size: .95rem; text-decoration: none; }
    .masthead a:hover, .masthead a:focus-visible, .masthead a[aria-current="page"] { color: var(--accent); }
    .masthead .top a[aria-current="page"] { box-shadow: inset 0 -2px 0 var(--accent); }
    .masthead .shelf-rooms { display: flex; flex-wrap: wrap; flex-basis: 100%; gap: .1rem; margin: 0 0 0 -.6rem; }
    .masthead .shelf-rooms a { display: inline-flex; align-items: center; min-height: 44px; padding: 0 .6rem; color: var(--muted); font-size: .88rem; text-decoration: none; }
    .masthead .shelf-rooms a[aria-current="page"] { color: var(--fg); font-weight: 600; }
    .measure { max-width: 46rem; }
    .file-actions a { display: inline-flex; align-items: center; text-decoration: none; }
    .quiet-button, .file-actions button, .file-actions a { min-height: 36px; margin: 0; padding: .2rem .75rem; border: 1px solid transparent; border-radius: var(--pill); background: transparent; color: var(--accent); font: 500 .88rem/1 var(--font); cursor: pointer; }
    .quiet-button:hover, .file-actions button:hover, .file-actions a:hover, .quiet-button:focus-visible, .file-actions button:focus-visible, .file-actions a:focus-visible { border-color: var(--line); background: var(--accent-soft); }
    @media (pointer: coarse) { .quiet-button, .file-actions button, .file-actions a { min-height: 44px; } }
    .shell-line { position: fixed; inset-inline: 1rem; bottom: calc(1rem + env(safe-area-inset-bottom)); z-index: 5; margin: 0; padding: .55rem .9rem; border: 1px solid var(--edge, var(--line)); border-radius: var(--radius); background: var(--surface); box-shadow: var(--shadow); color: var(--fg); font-size: .92rem; }
    html:not(.js) [data-tool="copy"] { display: none; }
    .also { margin: 2.5rem 0 0; color: var(--muted); font-size: .9rem; }
    footer { margin-top: 2rem; }
    ${DISPLAY_CSS}`;
