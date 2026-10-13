// The guide's parser switch, for testing a build on production without changing the default:
// /?parser=next | latest | YYYY.MM.DD | YYYY.MM.DD-pre.N | YYYY.MM.DD-patch.N loads the page's
// in-browser parser from /parser/ instead of /parser.js, and a banner names the build that
// actually runs, from its SPW_PARSER_BUILD stamp. Any other value is ignored and never written
// into the page. The worker's own readings (scripts off, /read) keep the built-in parser.
import { DEFAULT_FILE, isCalendarDay, readName } from "./parser-releases.js";
import { escapeHtml } from "../../lib/shell.js";

/** The switch's value: exactly one ?parser=, holding next, latest, or a name on a real day; otherwise null. */
export function parserSwitch(searchParams) {
  const values = searchParams.getAll("parser");
  if (values.length !== 1) return null;
  const [value] = values;
  if (value === "next" || value === "latest") return value;
  const named = readName(value);
  return named && isCalendarDay(named.day) ? value : null;
}

/** The module the switch loads: the moving paths as they are, and a name's own parser.js. */
export function switchModulePath(value) {
  if (value === "next" || value === "latest") return `/parser/${value}.js`;
  return `/parser/${value}/${DEFAULT_FILE}`;
}

export const SWITCH_CSS = `.parser-switch { margin: 0 0 1.2rem; padding: .6rem .9rem; border: 1px dashed var(--accent); border-radius: var(--radius); background: var(--accent-soft); font-size: .9rem; }
    .parser-switch p { margin: .2rem 0; }
    .parser-switch code { overflow-wrap: anywhere; }
    .parser-switch #parser-running[data-state="fallback"], .parser-switch #parser-running[data-state="failed"] { font-weight: 600; }
    html.js .parser-switch .scripts-off, html:not(.js) .parser-switch .scripts-on { display: none; }`;

/** The banner, as the worker writes it. Scripts on, the loader below rewrites #parser-running. */
export function switchBanner(value, from) {
  return `<aside class="parser-switch" aria-labelledby="parser-switch-title">
  <p id="parser-switch-title"><strong>Parser test.</strong> <code>?parser=${escapeHtml(value)}</code> asks this page to read with <a href="${escapeHtml(from)}"><code>${escapeHtml(from)}</code></a> instead of <code>/parser.js</code>.</p>
  <p id="parser-running" data-state="pending"><span class="scripts-on">Loading it…</span><span class="scripts-off">Scripts are off, so it did not load.</span></p>
  <p class="note">With scripts off, and at <code>/read</code>, every line is read by the worker's built-in parser, whatever this asks for. <a href="/">Back to the default parser</a></p>
</aside>`;
}

/**
 * Runs in the page (it travels by toString): import the switched module, fall back to
 * /parser.js when it does not load or has no parse, and say in #parser-running which build
 * runs. Built with text nodes only, so nothing from a stamp is read as markup.
 */
async function loadSwitched(wanted) {
  const line = document.getElementById("parser-running");
  const node = (tag, text, href) => {
    const el = document.createElement(tag);
    el.textContent = text;
    if (href) el.setAttribute("href", href);
    return el;
  };
  const show = (state, parts) => {
    if (!line) return;
    line.dataset.state = state;
    line.replaceChildren(...parts.map((part) => (typeof part === "string" ? document.createTextNode(part) : part)));
  };
  const describe = (stamp) => {
    if (!stamp || typeof stamp !== "object") return ["a build with no SPW_PARSER_BUILD stamp."];
    const named = /^\d{4}\.\d{2}\.\d{2}(?:-(pre|patch)\.[1-9]\d*)?$/.exec(typeof stamp.release === "string" ? stamp.release : "");
    const commit = /^[0-9a-f]{7,40}$/.test(String(stamp.commit)) ? String(stamp.commit) : "an unnamed revision";
    const kind = stamp.prerelease === true || (named && named[1] === "pre") ? "prerelease"
      : stamp.patch === true || (named && named[1] === "patch") ? "patch" : "release";
    const parts = !named
      ? ["the site's built-in parser, workbench ", node("code", commit), "."]
      : [`${kind} `, node("strong", named[0]), ", workbench ", node("code", commit), ". ", node("a", "Its release page", `/parser/${named[0]}/`), "."];
    if (stamp.dirty === true) parts.push(" Cut from a tree with uncommitted changes.");
    return parts;
  };
  let module = null;
  try {
    module = await import(wanted);
    if (typeof module.parse !== "function") throw new TypeError(`${wanted} has no parse export`);
  } catch {
    try {
      module = await import("/parser.js");
    } catch {
      show("failed", ["Neither ", node("code", wanted), " nor ", node("code", "/parser.js"), " loaded; the readings here are the worker's."]);
      throw new Error(`could not load ${wanted} or /parser.js`);
    }
    show("fallback", [node("code", wanted), " did not load, so this page fell back to ", node("code", "/parser.js"), ": ", ...describe(module.SPW_PARSER_BUILD)]);
    return module.parse;
  }
  show("running", ["Running ", ...describe(module.SPW_PARSER_BUILD), " Every panel is read again with it."]);
  return module.parse;
}

/** What the guide's module script runs in place of its static import of /parser.js. */
export function switchLoader(from) {
  return {
    before: `const parse = await (${loadSwitched.toString()})(${JSON.stringify(from)});`,
    after: `for (const input of document.querySelectorAll("form.line [name=line]")) input.dispatchEvent(new Event("input"));`,
  };
}
