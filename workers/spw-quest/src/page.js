// What every spw.quest HTML page shares: the masthead, the measure and the
// quiet buttons, and the policy that lets a page set the site's faces from
// this origin (workers/lib/peer-assets.js serves them under /fonts/).
import { BASE_SECURITY, htmlResponse } from "../../lib/shell.js";
import { DISPLAY_CSS, DISPLAY_HEAD } from "./display.js";
import { PAPER_HEAD } from "./paper.js";

/** Every quest page's head: the site's faces, then the reader's display choices, applied before the body paints. */
export const QUEST_HEAD = `${PAPER_HEAD}\n  ${DISPLAY_HEAD}`;

/** spw.quest's pages set the site's faces from their own origin; text and JSON keep the shell's policy. */
export const PAGE_CSP = BASE_SECURITY["Content-Security-Policy"].replace("style-src 'unsafe-inline';", "style-src 'unsafe-inline'; font-src 'self';");
/** Pages that read as you type load the parser by URL (/parser.js, same origin). */
export const LIVE_CSP = PAGE_CSP.replace("script-src 'unsafe-inline'", "script-src 'self' 'unsafe-inline'");

/** An HTML page under spw.quest's policy: the shell's, plus the faces from this origin. */
export function page(html, extra = {}, csp = PAGE_CSP) {
  const response = htmlResponse(html, extra);
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

/** The top of every page: the name, and the four places to go. */
export function masthead(current = "") {
  const links = [["/learn", "Learn"], ["/build", "Build"], ["/parser/", "Parser"], ["/install", "Install"]]
    .map(([href, label]) => `<a href="${href}"${href === current ? ' aria-current="page"' : ""}>${label}</a>`).join("");
  return `<header class="masthead">
  <a class="brand" href="/"${current === "/" ? ' aria-current="page"' : ""}>spw.quest</a>
  <nav class="top" aria-label="spw.quest">${links}</nav>
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
    .measure { max-width: 46rem; }
    .quiet-button, .file-actions button { min-height: 36px; margin: 0; padding: .2rem .75rem; border: 1px solid transparent; border-radius: var(--pill); background: transparent; color: var(--accent); font: 500 .88rem/1 var(--font); cursor: pointer; }
    .quiet-button:hover, .file-actions button:hover, .quiet-button:focus-visible, .file-actions button:focus-visible { border-color: var(--line); background: var(--accent-soft); }
    @media (pointer: coarse) { .quiet-button, .file-actions button { min-height: 44px; } }
    html:not(.js) [data-tool="copy"] { display: none; }
    .also { margin: 2.5rem 0 0; color: var(--muted); font-size: .9rem; }
    footer { margin-top: 2rem; }
    ${DISPLAY_CSS}`;
