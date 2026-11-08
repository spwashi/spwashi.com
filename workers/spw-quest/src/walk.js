// Your walk through spw.quest, precipitated as Spw. The guide does not assume
// a visitor brings any Spw: its first offer is a file written from where they
// have been here, in the marks the guide teaches (the creator, 2026-11-08:
// "a flushable precipitation of how their navigation through the site can be
// summarized with Spw").
//
// A step is a room and, when the address says one, a word: the file a guide
// opened, the panel read, the line built or pivoted, the shelf's question.
// Steps live in this browser only (spw.quest.walk/1), at most WALK_LIMIT of
// them, day-stamped and never sent. Clear flushes them away; Open in Build and
// Canvas carry the precipitate out through the fragment (#spw64=), which no
// server reads. With scripts off the guide shows where a walk begins.
//
// walkStep and recordWalk travel into <head> by toString, ahead of the __name
// shim in workers/lib/shell.js, so they bind no named inner functions.
import { PEER_BRACES, PEER_SIGILS } from "../../lib/peer-kit.js";

export const WALK_KEY = "spw.quest.walk/1";

/** base64url of the UTF-8 text, the #spw64= form /build and factshift.center read. */
const spw64 = (text) => btoa(String.fromCharCode(...new TextEncoder().encode(text))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
export const WALK_LIMIT = 40;

/**
 * The rooms a walk can still offer, in order, and where each is: only rooms the
 * guide already links (its doors and masthead), so the card adds no new way
 * out of the guide. The shelf keeps its one link in the masthead, and the
 * guide still never links /pivot or /constructs (test/specimens.test.mjs,
 * test/constructs.test.mjs).
 */
export const OPEN_ROOMS = Object.freeze([
  ["learn", "/learn"], ["build", "/build"], ["forms", "/forms/"], ["parser", "/parser/"], ["install", "/install"],
]);

/** One address as a step: { room, detail?, kind? }, or null for an address that is not a room. */
export function walkStep(href) {
  const url = new URL(href, "https://spw.quest");
  const path = url.pathname;
  // [room, the parameter that names its word, what kind of word it is]
  const rooms = {
    "/": ["guide", "example", "about"],
    "/learn": ["learn"],
    "/read": ["learn", "step", "scene"],
    "/build": ["build", "word", "made"],
    "/specimens": ["shelf", "q", "asked"],
    "/pivot": ["pivot", "line", "made"],
    "/constructs": ["constructs"],
    "/forms/": ["forms"],
    "/install": ["install"],
  };
  let room = rooms[path];
  if (!room && path.startsWith("/shelf/")) room = ["shelf"];
  if (!room && path.startsWith("/parser/")) room = ["parser"];
  if (!room) return null;
  let raw = room[1] ? url.searchParams.get(room[1]) : "";
  if (!raw && path === "/build") raw = url.searchParams.get("script");
  const detail = (String(raw || "").toLowerCase().match(/[a-z][a-z0-9_]*/) || [""])[0].slice(0, 24);
  return detail ? { room: room[0], detail, kind: room[2] } : { room: room[0] };
}

/** Runs in <head> on every quest page: this address joins the walk, unless it is the step already at the end. */
export function recordWalk(key, limit, stepOf) {
  try {
    const step = stepOf(location.href);
    if (!step) return;
    const kept = JSON.parse(localStorage.getItem(key) || "[]");
    const steps = Array.isArray(kept) ? kept : [];
    const last = steps[steps.length - 1];
    if (last && last.room === step.room && (last.detail || "") === (step.detail || "")) return;
    steps.push({ ...step, day: new Date().toISOString().slice(0, 10) });
    localStorage.setItem(key, JSON.stringify(steps.slice(-limit)));
  } catch {
    // Storage refused: the walk is simply not kept.
  }
}

export const WALK_HEAD = `<script>(${recordWalk.toString()})(${JSON.stringify(WALK_KEY)}, ${WALK_LIMIT}, ${walkStep.toString()});</script>`;

/**
 * The walk as Spw: one line per thing it says, each in the mark the guide
 * teaches for it. Returns the text, its lines with their kind, and the rooms
 * still open.
 */
export function precipitate(steps, here = "guide", rooms = OPEN_ROOMS) {
  const walk = (Array.isArray(steps) ? steps : []).filter((step) => step && typeof step.room === "string" && /^[a-z]+$/.test(step.room));
  const lines = [["#>walk", "frame"], [`you@${here}`, "perspective"]];
  const tokens = [];
  for (const step of walk) {
    const word = /^[a-z][a-z0-9_]*$/.test(step.detail || "") ? step.detail : "";
    const token = !word ? step.room
      : step.kind === "scene" ? `${step.room}(${word})`
        : step.kind === "asked" ? `${step.room}[${word}]`
          : `${step.room}<${word}>`;
    if (tokens[tokens.length - 1] !== token) tokens.push(token);
  }
  const path = tokens.slice(-8);
  if (path.length > 1) lines.push([`^[walked]{${path.join(" ~> ")}}`, "path"]);
  const counts = {};
  for (const step of walk) counts[step.room] = (counts[step.room] || 0) + 1;
  let heaviest = "";
  for (const step of walk) if (counts[step.room] >= 2 && counts[step.room] >= (counts[heaviest] || 0)) heaviest = step.room;
  if (heaviest) lines.push([`*${heaviest}`, "weight"]);
  const words = (kind) => walk.filter((step) => step.kind === kind && /^[a-z][a-z0-9_]*$/.test(step.detail || ""));
  for (const word of [...new Set(words("asked").map((step) => step.detail))].slice(-3)) lines.push([`?${word}(shelf)`, "asked"]);
  for (const [word, room] of [...new Map(words("made").map((step) => [step.detail, step.room]))].slice(-3)) lines.push([`!${word}(${room})`, "made"]);
  const seen = new Set(walk.map((step) => step.room));
  const open = rooms.filter(([room]) => !seen.has(room)).slice(0, 3);
  if (open.length) lines.push([open.map(([room]) => `~${room}`).join(" "), "open"]);
  return { text: lines.map(([line]) => line).join("\n"), lines, open, steps: walk.length };
}

/** The marks and braces as the paint's token types (data-t), from the peer kit. */
export const WALK_TYPES = Object.freeze({
  marks: Object.fromEntries(PEER_SIGILS.filter(({ sigil }) => sigil.length <= 2 && sigil !== ">" && sigil !== "<").map(({ sigil, type }) => [sigil, type])),
  braces: Object.fromEntries(PEER_BRACES.flatMap(({ open, type }) => [[open, `b-${type}`], [{ "<": ">", "(": ")", "[": "]", "{": "}" }[open], `b-${type}`]])),
});

/** Paint a precipitate: marks at the start of a token, braces, and the ~> join, each as its type. */
export function paintWalk(text, types) {
  const escape = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const span = (type, value) => `<span data-t="${type}">${escape(value)}</span>`;
  let html = "";
  for (let i = 0; i < text.length; i += 1) {
    const two = text.slice(i, i + 2);
    const before = i === 0 ? "\n" : text[i - 1];
    const starts = /[\s{(\[<]/.test(before) || text[i] === "@"; // @ also sits between a context and its subject
    if (two === "~>") { html += span("stream", two); i += 1; continue; }
    if (starts && types.marks[two]) { html += span(types.marks[two], two); i += 1; continue; }
    if (starts && types.marks[text[i]]) { html += span(types.marks[text[i]], text[i]); continue; }
    if (types.braces[text[i]]) { html += span(types.braces[text[i]], text[i]); continue; }
    html += escape(text[i]);
  }
  return html;
}

/** What each kind of line says, in the guide's own reading of its mark. */
export const WALK_SAYS = Object.freeze({
  frame: "<code>#&gt;</code> names it, so it can be found again.",
  perspective: "<code>@</code> sets a perspective: the context before it, the subject after it. Here, you, at the guide.",
  path: "<code>^</code> lifts the rooms you passed through into one path; <code>~&gt;</code> carries each on to the next.",
  weight: "<code>*</code> marks what carries weight: the room you came back to most.",
  asked: "<code>?</code> opens a question you can close again: what you asked the shelf.",
  made: "<code>!</code> commits a move: a line you made.",
  open: "<code>~</code> keeps a path open without taking it: rooms not opened yet.",
});

/** The card's inside, from a precipitate. Travels to the page by toString with its arguments. */
export function walkInside(result, painted, says) {
  const kinds = [...new Set(result.lines.map(([, kind]) => kind))];
  const open = result.open.map(([room, href]) => `<a href="${href}">${room}</a>`).join(" ");
  return `<pre id="walk-text"><code>${painted}</code></pre>
    ${open ? `<p class="walk-open"><span>Still open:</span> ${open}</p>` : ""}
    <details class="walk-says"><summary>Read it line by line</summary><ul>${kinds.map((kind) => `<li>${says[kind]}</li>`).join("")}</ul></details>`;
}

/**
 * Runs right after the card, before the rest of the page paints: the visitor's
 * own walk replaces the opening one, the links carry it by fragment, and Clear
 * flushes it.
 */
function walkBoot(key, here, rooms, types, says, precipitateFn, paintFn, insideFn) {
  const card = document.getElementById("walk");
  const body = card?.querySelector("[data-walk-body]");
  if (!body) return;
  const read = () => {
    try {
      const kept = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(kept) ? kept : [];
    } catch {
      return [];
    }
  };
  const spw64 = (text) => btoa(String.fromCharCode(...new TextEncoder().encode(text))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const said = card.querySelector("[data-walk-said]");
  const show = () => {
    const result = precipitateFn(read(), here, rooms);
    body.innerHTML = insideFn(result, paintFn(result.text, types), says);
    card.querySelector("[data-walk-build]").href = `/build#spw64=${spw64(result.text)}`;
    card.querySelector("[data-walk-canvas]").href = `https://factshift.center/#spw64=${spw64(result.text)}`;
    card.querySelector("[data-walk-clear]").hidden = result.steps < 2;
    card.querySelector("[data-walk-count]").textContent = result.steps === 1 ? "1 room so far" : `${result.steps} rooms so far`;
  };
  card.classList.add("walk-live");
  show();
  card.querySelector("[data-walk-clear]").addEventListener("click", () => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Nothing kept, nothing to clear.
    }
    show();
    card.querySelector("[data-walk-build]").focus();
    said.textContent = "Cleared. The next room you open starts a new walk.";
    said.hidden = false;
  });
  addEventListener("storage", (event) => {
    if (event.key === key) show();
  });
}

/** The card at the top of the guide: where a walk begins, painted by the worker, then the visitor's own. */
export function walkSection(here = "guide") {
  const opening = precipitate([{ room: here }], here);
  return `<section id="walk" class="walk" aria-labelledby="walk-title">
  <div class="walk-head">
    <h2 id="walk-title" class="eyebrow">Your walk, in Spw</h2>
    <p class="walk-count" data-walk-count></p>
  </div>
  <p class="walk-lede">This file writes itself as you open rooms here, in the marks this guide teaches. It stays in this browser; nothing is sent.<span class="walk-off"> With scripts off it shows where a walk begins.</span></p>
  <div class="walk-file">
    <div data-walk-body>${walkInside(opening, paintWalk(opening.text, WALK_TYPES), WALK_SAYS)}</div>
    <p class="walk-actions">
      <a class="walk-primary" href="/build?script=${encodeURIComponent(opening.text)}" data-walk-build>Open in Build</a>
      <a href="https://factshift.center/#spw64=${spw64(opening.text)}" data-walk-canvas>Canvas</a>
      <button type="button" class="quiet-button" data-copy="walk-text">Copy</button>
      <button type="button" class="quiet-button" data-walk-clear hidden>Clear</button>
    </p>
    <p class="note" data-walk-said role="status" hidden></p>
  </div>
</section>
<script>(${walkBoot.toString()})(${JSON.stringify(WALK_KEY)}, ${JSON.stringify(here)}, ${JSON.stringify(OPEN_ROOMS)}, ${JSON.stringify(WALK_TYPES)}, ${JSON.stringify(WALK_SAYS)}, ${precipitate.toString()}, ${paintWalk.toString()}, ${walkInside.toString()});</script>`;
}

export const WALK_CSS = `.walk { margin: 0 0 2rem; padding: 1rem 1.1rem 1.05rem; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); box-shadow: var(--shadow); }
    .walk-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: .2rem 1rem; }
    .walk-head .eyebrow { margin: 0; }
    .walk-count { margin: 0; color: var(--muted); font: .78rem/1.2 var(--mono); }
    .walk-count:empty { display: none; }
    .walk-lede { max-width: 40rem; margin: .4rem 0 .7rem; color: var(--ink-soft); font-size: .95rem; line-height: 1.5; }
    html.js .walk-off { display: none; }
    .walk pre { margin: 0; padding: .7rem .85rem; border-radius: calc(var(--radius) * .8); background: var(--field); font: .95rem/1.65 var(--mono); white-space: pre-wrap; overflow-wrap: anywhere; font-variant-ligatures: none; font-feature-settings: "calt" 0, "liga" 0; }
    .walk-open { display: flex; flex-wrap: wrap; align-items: center; gap: 0 .2rem; margin: .5rem 0 0; color: var(--muted); font-size: .9rem; }
    .walk-open span { margin-right: .3rem; }
    .walk-open a { display: inline-flex; align-items: center; min-height: 44px; padding: 0 .45rem; font-family: var(--mono); }
    .walk-says { margin: .3rem 0 0; }
    .walk-says summary { min-height: 44px; font-size: .9rem; }
    .walk-says ul { margin: 0 0 .3rem; padding-left: 1.1rem; color: var(--ink-soft); font-size: .92rem; }
    .walk-actions { display: flex; flex-wrap: wrap; align-items: center; gap: .3rem .5rem; margin: .6rem 0 0; }
    .walk-actions a { display: inline-flex; align-items: center; min-height: 44px; padding: 0 .75rem; border-radius: var(--pill); text-decoration: none; }
    .walk-actions a.walk-primary { border: 1px solid var(--accent); font-weight: 600; }
    .walk-actions a:hover, .walk-actions a:focus-visible { background: var(--accent-soft); }
    html:not(.js) .walk-actions button { display: none; }`;
