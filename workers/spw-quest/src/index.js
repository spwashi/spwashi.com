import { CONTAINERS, OPERATORS } from "./guide.js";
import { EXAMPLES, exampleById } from "./examples.js";
import { EXPECTED_FILES, GIT_GUIDE, GIT_MARKDOWN, INSTRUCTION_SETS, QUEST_PROMPTS, QUEST_TEXT, WORKBENCH } from "./quest.js";
import { STEPS } from "./steps.js";
import { LINE_LIMIT, liveScript, readLine } from "./reader.js";
import { FILE_CSS, FILE_LIMIT, editorField, liveFileScript, outlineFile, readFile } from "./file-reader.js";
import { noteBootScript } from "./note.js";
import { PANEL_CSS, stepSurface } from "./panel.js";
import { BUILD_CSS, BUILD_DEFAULTS, MAX_SCRIPT, assemble, buildFrom, buildSurface, focusSlots, formatScript, safeName, toolActions } from "./build.js";
import { PAPER_CSS, PAPER_THEME } from "./paper.js";
import { LIVE_CSP, PAGE_CSS, QUEST_HEAD, masthead, page } from "./page.js";
import { displayMenu, displayScript } from "./display.js";
import { PARSER_JS } from "./parser-text.js";
import { handleParser, isParserPath } from "./parser-releases.js";
import { SWITCH_CSS, parserSwitch, switchBanner, switchLoader, switchModulePath } from "./parser-switch.js";
import { SPECIMENS_CSS, specimenState, specimensBody } from "./specimens.js";
import { renderConstructs } from "./constructs.js";
import { pivotState, renderPivot } from "./pivot.js";
import { BASE_SECURITY, escapeHtml, jsonResponse, layout, wantsJson } from "../../lib/shell.js";
import { PEER_BRACES, PEER_SIGILS } from "../../lib/peer-kit.js";
import { isPeerAssetPath, servePeerAsset } from "../../lib/peer-assets.js";

const VERSION = "0.1.0";
const FEEDBACK_CONFIG = {
  schema: "autonomous-feedback.client.v0",
  host: "spw.quest",
  name: "spw.quest",
  title: "Feedback",
  intro: "What was hard to follow in this guide or the setup instructions.",
  kinds: ["broken", "confusing", "missing", "wrong", "question"],
  routes: [{ name: "Guide", path: "/" }, { name: "Reading", path: "/read" }, { name: "Install", path: "/install" }, { name: "Recipe", path: "/init" }],
  contact: { bluesky: "spwashi.com", x: "spwashi" },
  button: "Send",
  queue: { want: true },
  frame: { ancestors: ["https://spw.quest", "https://spwashi.com"] },
  theme: { mode: "light", ...PAPER_THEME, corners: "round", font: "system" },
};
const SIGIL_TYPES = new Map(PEER_SIGILS.map(({ sigil, type }) => [sigil, type]));
const BRACE_TYPES = new Map(PEER_BRACES.map(({ open, type }) => [open, type]));
const QUEST = Object.freeze({
  designer: "Spwashi",
  ...WORKBENCH,
  entrypoint: "https://spw.quest/init",
  source: `${WORKBENCH.repository}/blob/${WORKBENCH.revision}/docs/runtime/md/quick-start.md`,
  ownership: `${WORKBENCH.repository}/blob/${WORKBENCH.revision}/docs/runtime/md/mounted-workbench.md`,
});

/** "^20.19.0 || >=22.12.0" reads as "20.19+ or 22.12+". Agents keep the exact range in /init. */
function readableNode(range) {
  return range.split("||").map((part) => part.trim().replace(/^(\^|>=)(\d+\.\d+)\.0$/, "$2+")).join(" or ");
}

/**
 * Tabs for who runs the setup (ARIA tabs pattern). Without script every set
 * shows stacked with its own caption; with script one panel shows, arrows move
 * between tabs, and the hash (#claude) keeps the choice.
 */
function questTabs() {
  document.documentElement.classList.add("tabs-ready");
  const tabs = [...document.querySelectorAll('[role="tab"][data-set]')];
  const git = document.getElementById("git-guide");
  const gitNote = document.getElementById("git-covered");
  if (!tabs.length) return;
  const panelFor = (tab) => document.getElementById(tab.getAttribute("aria-controls"));

  const select = (tab, { focus = false, remember = true } = {}) => {
    for (const other of tabs) {
      const chosen = other === tab;
      other.setAttribute("aria-selected", String(chosen));
      other.tabIndex = chosen ? 0 : -1;
      panelFor(other).hidden = !chosen;
    }
    // The shell set already runs the git guide; step it aside instead of repeating it.
    const covered = tab.dataset.includesGit === "true";
    if (git) git.hidden = covered;
    if (gitNote) gitNote.hidden = !covered;
    if (focus) tab.focus();
    if (remember) history.replaceState(null, "", `#${tab.dataset.set}`);
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", (event) => {
      const moves = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 };
      if (!(event.key in moves)) return;
      event.preventDefault();
      select(tabs[(moves[event.key] + tabs.length) % tabs.length], { focus: true });
    });
  });

  // Include the git guide in an agent set's copy.
  document.querySelectorAll("[data-include-git]").forEach((box) => {
    const pre = document.getElementById(box.dataset.includeGit);
    const base = pre.textContent;
    const guide = document.getElementById("git-copy")?.textContent.trim() || "";
    box.addEventListener("change", () => {
      pre.textContent = box.checked ? `${base}\n\n${guide}` : base;
    });
  });

  const fromHash = tabs.find((tab) => `#${tab.dataset.set}` === location.hash);
  select(fromHash || tabs.find((tab) => tab.getAttribute("aria-selected") === "true") || tabs[0], { remember: Boolean(fromHash) });
}

function renderInstall() {
  const tabs = INSTRUCTION_SETS.map((set, index) => `<button type="button" role="tab" id="tab-${escapeHtml(set.id)}" aria-controls="panel-${escapeHtml(set.id)}" aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}" data-set="${escapeHtml(set.id)}" data-includes-git="${set.includesGit}">${escapeHtml(set.label)}</button>`).join("\n    ");
  const panels = INSTRUCTION_SETS.map((set) => `<section class="tabpanel" role="tabpanel" id="panel-${escapeHtml(set.id)}" aria-labelledby="tab-${escapeHtml(set.id)}" tabindex="0">
    <aside class="draft-card">
      <p class="draft-eyebrow">What this does</p>
      <p><strong>${escapeHtml(set.does)}</strong> ${escapeHtml(set.keeps)}</p>
      <p class="note">${escapeHtml(set.next)}</p>
    </aside>
    ${set.includesGit ? "" : `<label class="check"><input type="checkbox" data-include-git="set-${escapeHtml(set.id)}"> Include the git commands in this copy</label>
    <p class="git-added">This copy now ends with the five git commands. They do not commit.</p>`}
    <figure class="codeblock">
      <figcaption><span>${escapeHtml(set.label)}</span><button type="button" data-copy="set-${escapeHtml(set.id)}">${escapeHtml(set.copy)}</button></figcaption>
      <pre id="set-${escapeHtml(set.id)}">${escapeHtml(set.text)}</pre>
    </figure>
  </section>`).join("\n  ");
  const firstPatch = QUEST_PROMPTS.find((prompt) => prompt.id === "first-patch");
  return layout({
    title: "spw.quest — initialize Spw Workbench",
    description: "Choose who runs the setup, copy one block, and run it from the repository root. It stops before any commit.",
    canonical: "https://spw.quest/install",
    head: QUEST_HEAD,
    script: `(${questTabs.toString()})();`,
    themeCss: `${PAPER_CSS}
    ${PAGE_CSS}
    main > :not(.masthead) { max-width: 46rem; }
    html:not(.js) label.check, html:not(.js) .git-added { display: none; }
    html.js .tabpanel .git-added { display: none; margin: .2rem 0 .7rem; }
    html.js .tabpanel:has([data-include-git]:checked) .git-added { display: block; }`,
    body: `${masthead("/install")}
<h1>Initialize the workbench in this repository.</h1>
<p class="lede">Choose who runs the setup. Copy one block. Run it from the repository root. It stops before any commit.</p>
<p>Spw Workbench adds the Spw language, parser, CLI, and editor tooling. It mounts at <code>.spw/_workbench</code>; your repository keeps its own <code>.spw/</code>. It needs Git and Node ${escapeHtml(readableNode(WORKBENCH.node))}.</p>
<div class="tabs">
  <div class="tablist" role="tablist" aria-label="Who runs the setup">
    ${tabs}
  </div>
  ${panels}
</div>
<p class="note" id="git-covered" hidden>Git is already in the commands above. The same five commands are at <a href="/git.txt">git.txt</a> and <a href="/git.md">git.md</a>.</p>
<section id="git-guide">
  <h2>Git, in this order</h2>
  <p>Use this when the block you copied does not already run git. Run only the command that matches the folder you have.</p>
  <ol>
    <li>No <code>.git</code> yet → <code>git init</code>. Creates the repository.</li>
    <li>No <code>.spw/_workbench</code> in <code>.gitmodules</code> → <code>git submodule add</code>. Records where the workbench comes from.</li>
    <li>Link just added → <code>checkout</code>. Pins the reviewed revision.</li>
    <li>Link recorded, folder empty → <code>submodule update --init</code>. Downloads that revision.</li>
    <li><code>git diff --check</code> only looks. It does not edit or commit.</li>
  </ol>
  <figure class="codeblock">
    <figcaption><span><a href="/git.txt">git.txt</a> · <a href="/git.md">git.md</a></span><button type="button" data-copy="git-copy">Copy</button></figcaption>
    <pre id="git-copy">${escapeHtml(GIT_GUIDE)}</pre>
  </figure>
</section>
<section id="after" aria-labelledby="after-title">
  <h2 id="after-title">When it worked</h2>
  <p>Same result for every choice above.</p>
  <ul>
    <li><code>spw:doctor</code> finishes with no errors.</li>
    <li>These files exist: ${EXPECTED_FILES.map((file) => `<code>${escapeHtml(file)}</code>`).join(", ")}. The initializer may add a few more.</li>
    <li>Nothing was committed. Read the diff, then commit it yourself.</li>
  </ul>
  <h2 id="next-title">Then, if you want</h2>
  <p>After doctor, give the same agent one question about this repository. Skip this if you only wanted the mount.</p>
  <figure class="codeblock">
    <figcaption><span>${escapeHtml(firstPatch.title)}</span><button type="button" data-copy="first-patch">Copy</button></figcaption>
    <pre id="first-patch">${escapeHtml(firstPatch.body)}</pre>
  </figure>
</section>
<p><a href="/">What Spw is</a> · <a href="/init">Full recipe</a> · <a href="/prompts.json">Prompts</a> · <a href="/quest.json">quest.json</a> · <a href="${QUEST.source}">Upstream quick start</a> · <a href="https://autonomous.feedback/spw.quest?at=/install">What was hard to follow</a></p>`,
  });
}

/** Old links carried the setup choice (#claude) or a panel (#act) on the front page; send them where those live now. */
function forwardOldHash() {
  const sets = document.documentElement.dataset.setupSets.split(" ");
  const panels = document.documentElement.dataset.panels.split(" ");
  const id = location.hash.slice(1);
  if (sets.includes(id)) location.replace(`/install#${id}`);
  else if (panels.includes(id)) location.replace(`/learn#${id}`);
}

/** Which panels' lines use each operator and each brace pair: the edges back from a card to the panels. */
const EDGES_IN = (() => {
  const ops = new Map();
  const braces = new Map();
  const add = (map, key, index) => (map.get(key) || map.set(key, new Set()).get(key)).add(index);
  STEPS.forEach((step, index) => {
    for (const line of [step.try, ...(step.then || [])]) {
      const reading = readLine(step.id, line);
      for (const op of reading.operators) if (op.name) add(ops, op.name, index);
      for (const c of reading.containers) add(braces, c.name, index);
    }
  });
  return { ops, braces };
})();

/** Links to the panels in a set, as number and name. */
const panelLinks = (indexes) => [...(indexes || [])].sort((a, b) => a - b)
  .map((i) => `<a href="/learn#${escapeHtml(STEPS[i].id)}"><span class="n">${i + 1}</span> ${escapeHtml(STEPS[i].id)}</a>`).join(" ");

/** A heading's own address, named by the heading. */
const selfLink = (section, title) => `<a class="self" href="#${section}" aria-labelledby="${title}">#</a>`;

/** The seven panels as a path of numbered nodes; the node of the panel you landed on lights. */
const PATH_CSS = `.path { margin: 0 0 1.5rem; }
    .path ol { position: relative; display: grid; grid-template-columns: repeat(${STEPS.length}, minmax(0, 1fr)); margin: 0; padding: 0; list-style: none; }
    .path ol::before { content: ""; position: absolute; top: 22px; left: calc(100% / ${STEPS.length * 2}); right: calc(100% / ${STEPS.length * 2}); height: 1px; background: var(--edge); }
    .path li { display: flex; justify-content: center; margin: 0; }
    .path a { position: relative; display: grid; justify-items: center; gap: .3rem; color: var(--muted); text-decoration: none; }
    .path a:visited { color: color-mix(in oklab, var(--accent) 55%, var(--muted)); }
    .path .n { display: grid; place-items: center; width: 44px; height: 44px; border: 4px solid transparent; border-radius: 50%; background: var(--surface) padding-box; box-shadow: inset 0 0 0 1px currentColor; font: 600 .92rem/1 var(--mono); font-variant-numeric: tabular-nums; transition: background-color 140ms ease, box-shadow 140ms ease; }
    .path a[aria-current="step"] { color: var(--accent); }
    .path a[aria-current="step"] .n { background-color: var(--accent); color: var(--field); box-shadow: none; }
    .path .id { font: .76rem/1 var(--mono); }
    .path a:hover, .path a:focus-visible { color: var(--accent); }
    .path a:hover .n, .path a:focus-visible .n { background: var(--accent-soft); }
    .path a:focus-visible { outline: none; }
    .path a:focus-visible .n { outline: 2px solid var(--accent); outline-offset: 2px; }
    ${STEPS.map((step) => `body:has(#${step.id}:target) .path a[href="#${step.id}"]`).join(",\n    ")} { color: var(--accent); }
    ${STEPS.map((step) => `body:has(#${step.id}:target) .path a[href="#${step.id}"] .n`).join(",\n    ")} { background-color: var(--accent-soft); box-shadow: inset 0 0 0 2px var(--accent); }
    @media (prefers-reduced-motion: reduce) { .path .n { transition: none; } }`;

/** The path itself: on the guide each node is a panel on this page; on /read it is that panel's own reading. */
function pathNav(current = -1) {
  const nodes = STEPS.map((step, index) => {
    const id = escapeHtml(step.id);
    const href = current < 0 ? `#${id}` : `/read?step=${id}`;
    return `<li><a href="${href}"${index === current ? ' aria-current="step"' : ""}><span class="n">${index + 1}</span><span class="id">${id}</span></a></li>`;
  });
  return `<nav class="path" aria-label="Panels">
  <ol>
    ${nodes.join("\n    ")}
  </ol>
</nav>`;
}

/** The guide's own sections below the file. */
const GUIDE_CSS = `.opening { margin: 0 0 1.4rem; }
    .opening h1 { max-width: 17ch; margin: 0 0 .7rem; }
    .opening .lede { max-width: 40rem; margin: 0; color: var(--ink-soft); font-size: clamp(1.05rem, 2.4vw, 1.2rem); line-height: 1.5; }
    .eyebrow { margin: 0 0 .5rem; color: var(--muted); font: 600 .78rem/1.2 var(--font); letter-spacing: .08em; text-transform: uppercase; }
    section.band { margin: 3.2rem 0 0; padding: 2rem 0 0; border-top: 1px solid var(--line); }
    section.band > p { max-width: 46rem; }
    [id] { scroll-margin-top: 1.25rem; }
    h2 .self { margin-left: .45rem; color: var(--muted); font: 400 .7em var(--mono); text-decoration: none; opacity: .5; }
    h2 .self:hover, h2 .self:focus-visible, section:target h2 .self { color: var(--accent); opacity: 1; }
    .sigils { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 15.5rem), 1fr)); gap: .6rem; margin: 1.2rem 0 0; padding: 0; list-style: none; }
    .sigils li { display: grid; grid-template-columns: 2.4rem minmax(0, 1fr); gap: .1rem .7rem; align-content: start; margin: 0; padding: .75rem .85rem .8rem; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); }
    .sigils li:target { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
    .sigils .sigil { grid-row: span 4; font: 600 1.7rem/1 var(--mono); }
    .sigils p { margin: 0; }
    .sigils .name { font-weight: 650; }
    .sigils .name code { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
    .sigils .reads { font-size: .95rem; line-height: 1.45; }
    .sigils .note { margin-top: .2rem; font-size: .8rem; line-height: 1.4; }
    @media (max-width: 40rem) { .sigils { gap: 0; } .sigils li { padding: .65rem 0 .7rem; border: 0; border-top: 1px solid var(--line); border-radius: 0; background: none; } .sigils li:target { box-shadow: inset 3px 0 0 var(--accent); padding-left: .6rem; } }
    .edges-in { display: flex; flex-wrap: wrap; gap: 0 .6rem; padding-top: .3rem; font: .78rem/1.2 var(--mono); }
    .edges-in a { display: inline-flex; align-items: center; gap: .25rem; min-height: 32px; text-decoration: none; }
    .edges-in .n { color: var(--muted); font-variant-numeric: tabular-nums; }
    .braces { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 20rem), 1fr)); gap: 0 1.4rem; margin: 1.2rem 0 0; padding: 0; list-style: none; }
    .braces li { display: grid; grid-template-columns: 3.4rem minmax(0, 1fr); gap: .1rem .6rem; align-items: baseline; margin: 0; padding: .55rem 0; border-top: 1px solid var(--line); }
    .braces li:target { background: var(--accent-soft); }
    .braces .pair { font: 600 1.15rem/1.2 var(--mono); }
    .braces .edges-in { grid-column: 2; padding-top: 0; }
    .doors { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 16rem), 1fr)); gap: .7rem; margin: 1.2rem 0 0; }
    .door { display: grid; align-content: start; gap: .35rem; margin: 0; padding: 1rem 1rem 1.05rem; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); box-shadow: none; }
    .door:has(a:hover, a:focus-visible) { border-color: var(--accent); }
    .door h3 { margin: 0; }
    .door h3 a { color: var(--fg); text-decoration: none; }
    .door h3 a::after { content: " →"; color: var(--accent); }
    .door p { margin: 0; color: var(--ink-soft); font-size: .95rem; line-height: 1.45; }
    .door code { overflow-wrap: anywhere; font-size: .82rem; }
    #origin p { max-width: 40rem; font-family: var(--manuscript); font-size: 1.12rem; line-height: 1.55; }`;

/** The guide. With `parser` ({ value, from }, from a valid ?parser=), a banner leads and the page reads with that build. */
function renderGuide(parser = null, example = EXAMPLES[0]) {
  const sigils = OPERATORS.map((op) => `<li id="op-${escapeHtml(op.name)}">
      <span class="sigil" data-t="${escapeHtml(SIGIL_TYPES.get(op.sigil) || "")}" aria-hidden="true">${escapeHtml(op.sigil)}</span>
      <p class="name">${escapeHtml(op.name)} <code>${escapeHtml(op.sigil)}</code></p>
      <p class="reads">${escapeHtml(op.reads)}</p>
      <p class="note">Runtime: ${escapeHtml(op.does)}</p>${EDGES_IN.ops.has(op.name) ? `
      <p class="edges-in">${panelLinks(EDGES_IN.ops.get(op.name))}</p>` : ""}
    </li>`).join("\n    ");
  const braces = CONTAINERS.map((c) => `<li id="brace-${escapeHtml(c.name)}"><code class="pair" data-t="b-${escapeHtml(BRACE_TYPES.get(c.open) || "")}">${escapeHtml(c.open)} ${escapeHtml(c.close)}</code><span><strong>${escapeHtml(c.name)}</strong> ${escapeHtml(c.reads)}</span>${EDGES_IN.braces.has(c.name) ? `<span class="edges-in">${panelLinks(EDGES_IN.braces.get(c.name))}</span>` : ""}</li>`).join("\n    ");
  const setIds = INSTRUCTION_SETS.map((set) => set.id).join(" ");
  return layout({
    title: "spw.quest — a guide to the Spw language",
    description: "Spw is plain text with a few marks. Open a file people keep, change it, and see what a tool can read from it.",
    canonical: "https://spw.quest/",
    head: QUEST_HEAD,
    script: `document.documentElement.dataset.setupSets = ${JSON.stringify(setIds)};\ndocument.documentElement.dataset.panels = ${JSON.stringify(STEPS.map((step) => step.id).join(" "))};\n(${forwardOldHash.toString()})();\n(${toolActions.toString()})();`,
    themeCss: `${PAPER_CSS}
    ${PAGE_CSS}
    ${FILE_CSS}
    ${GUIDE_CSS}${parser ? `\n    ${SWITCH_CSS}` : ""}`,
    body: `${masthead("/")}
${parser ? `${switchBanner(parser.value, parser.from)}\n` : ""}<section class="opening" aria-labelledby="title">
  <h1 id="title">A small language for the shape of a thought.</h1>
  <p class="lede">Spw is plain text with a few marks. A mark in front of a word says what the word is doing, and braces say what belongs together. A note stays readable as a note, and a tool can still find it, check it and follow its links.</p>
</section>
${fileWorkspace(example)}

<section id="operators" class="band" aria-labelledby="operators-title">
  <h2 id="operators-title">Twelve marks, four braces${selfLink("operators", "operators-title")}</h2>
  <p>Each mark has a reader's name, which is how you think with it, and a runtime behavior, which is what the interpreter does today. They are kept separate on purpose: a name is not a promise about evaluation. The numbers under a mark are the panels in <a href="/learn">Learn</a> that use it.</p>
  <ul class="sigils">
    ${sigils}
  </ul>
  <ul class="braces" id="braces" aria-label="Four ways to hold things">
    ${braces}
  </ul>
  <p class="note">Read together, the braces make a sentence: <code>&lt;concept&gt;(scene)[mode]{definition}</code>, what it is about, where, through which lens, and what belongs inside. Marks and braces compose: <code>#[…]</code> is a set, <code>.{…}</code> is a property sheet.</p>
</section>

<section id="ways" class="band" aria-labelledby="ways-title">
  <h2 id="ways-title">Ways in${selfLink("ways", "ways-title")}</h2>
  <div class="doors">
    <article class="door"><h3><a href="/learn">Learn it a mark at a time</a></h3><p>Seven panels, one line each, from plain words to a question that carries its own probe. Each line is read again as you change it.</p></article>
    <article class="door"><h3><a href="/build">Take one line apart</a></h3><p>Change the mark, the scene, or what the braces hold, and the rest of the line holds still.</p><p><code>${escapeHtml(assemble(BUILD_DEFAULTS))}</code></p></article>
    <article class="door"><h3><a href="/install">Keep it in a repository</a></h3><p>The workbench mounts at <code>.spw/_workbench</code> with a parser, a CLI and an editor language server. Setup stops before any commit.</p></article>
    <article class="door"><h3><a href="/parser/">Read it on your own page</a></h3><p>Dated builds of the parser this page runs, one ES module each, with an integrity hash to pin.</p></article>
  </div>
</section>

<section id="origin" class="band" aria-labelledby="origin-title">
  <h2 id="origin-title">The shape it came from${selfLink("origin", "origin-title")}</h2>
  <p>The difficulty was not having language for what I was thinking about, so I could not tell when a thought was ready to set down. Spw gives a thought somewhere to land: one character says what a word is doing, braces say what belongs together, and a thought can be set down whole instead of chased.</p>
  <p>It started in 2017, alongside reading about how people learn from text and helping with research in an adult learning lab. Part of it was wanting language to share what I was learning, in a place where I could keep learning what I wanted to. The question it keeps asking is about cognition: where do two understandings stop sharing ground, and what would help them share more?</p>
  <p>And it wonders about geometry: how a mind represents the thoughts it holds, what shape a circuit of thought might take on a page, and how findings from different fields could sit side by side in one form you can read.</p>
  <p>It is not built for anyone in particular. It has been designed with care, and it has turned out to be useful, most of all toward a culture where media literacy can grow across generations.</p>
</section>
<p class="also"><a href="/init">Recipe for agents</a> · <a href="/quest.json">quest.json</a> · <a href="${QUEST.repository}">Source</a> · <a href="https://autonomous.feedback/spw.quest?at=/">What was hard to follow</a></p>
${liveFileScript(EXAMPLES, parser ? switchLoader(parser.from) : undefined, { note: true })}
${displayScript()}`,
  });
}

/** The file area: a tab per example, the file as an editor, and what a tool reads from it. */
function fileWorkspace(example) {
  const reading = readFile(example.script);
  const display = displayMenu();
  const tabs = EXAMPLES.map((item) => `<a href="/?example=${escapeHtml(item.id)}#try" data-example="${escapeHtml(item.id)}"${item === example ? ' aria-current="page"' : ""}><span class="tab">${escapeHtml(item.tab)}</span><span class="file">${escapeHtml(item.file)}</span></a>`).join("\n    ");
  return `<section id="try" class="try" aria-labelledby="try-title">
  <h2 id="try-title" class="eyebrow">Five files, written in Spw</h2>
  <nav class="examples" aria-label="Files">
    ${tabs}
  </nav>
  <div class="workspace">
    <form class="file" data-file method="post" action="/build#build">
      <div class="file-head">
        <p class="file-name"><code data-file-name>${escapeHtml(example.file)}</code></p>
        <div class="file-actions">
          ${display.toggle}
          <button type="button" data-tool="copy">Copy</button>
          <button type="submit" name="tool" value="download" formaction="/script.spw" data-tool="download">Download</button>
        </div>
      </div>
      ${display.panel}
      <p class="note-choice" data-note-choice-line hidden><span>A note on this device differs from this template.</span> <span class="note-choice-actions"><button type="button" class="quiet-button" data-note-keep>Keep this note</button> <button type="button" class="quiet-button" data-note-use>Use this template</button></span></p>
      <p class="note-state" data-note-state role="status" hidden></p>
      <noscript><p class="note-state">Scripts are off, so this field is a template. A note kept in this browser is not shown. Nothing is sent unless you use Download or Open in the editor.</p></noscript>
      <p class="says" data-file-says>${escapeHtml(example.says)}</p>
      <input type="hidden" name="filename" value="${escapeHtml(example.file)}">
      ${editorField({ id: "script", value: example.script, label: "The file", describedBy: "file-try" })}
      <div class="file-foot">
        <p class="try-this" id="file-try"><span class="label">Try</span> <span data-file-try>${escapeHtml(example.try)}</span></p>
        <button type="submit" name="tool" value="read" data-tool="read" class="quiet-button">Open in the editor →</button>
      </div>
    </form>
    ${noteBootScript(EXAMPLES, FILE_LIMIT)}
    <aside class="reading-card" aria-labelledby="reading-title">
      <h2 id="reading-title">What a tool reads</h2>
      <div id="reading">${outlineFile(reading)}</div>
    </aside>
  </div>
</section>`;
}

/** The seven panels from the workbench's quest, walked as a path; each line is read as it changes. */
function renderLearn() {
  const steps = STEPS.map((step, index) => `<li>${stepSurface(step, { index })}</li>`).join("\n  ");
  return layout({
    title: "spw.quest — learn Spw a mark at a time",
    description: "Seven panels, one line each, from plain words to a question that carries its own probe.",
    canonical: "https://spw.quest/learn",
    head: QUEST_HEAD,
    themeCss: `${PAPER_CSS}
    ${PAGE_CSS}
    ${PANEL_CSS}
    ${PATH_CSS}
    .opening { margin: 0 0 1.2rem; }
    .opening h1 { margin: 0 0 .5rem; font-size: clamp(1.8rem, 5vw, 2.4rem); }
    .opening .lede { margin: 0; color: var(--ink-soft); }
    .learn { max-width: 46rem; }
    .quest { list-style: none; padding: 0; margin: 0; display: grid; gap: 1.4rem; }
    .quest > li { margin: 0; }`,
    body: `${masthead("/learn")}
<div class="learn">
<section class="opening" aria-labelledby="learn-title">
  <h1 id="learn-title">Learn it a mark at a time</h1>
  <p class="lede">Seven panels, one line each. Change a line and it is read again; with scripts off, Read sends it to the worker, which reads it the same way.</p>
</section>
${pathNav()}
<ol class="quest" role="list" aria-label="Seven panels">
  ${steps}
</ol>
<p class="also"><a href="/">Back to the guide</a> · <a href="/build">Take one line apart</a> · <a href="/specimens">Specimens</a> · <a href="/constructs">Constructs</a> · <a href="/pivot">Pivot a line</a> · <a href="/install">Install the workbench</a></p>
</div>
${liveScript()}
${displayScript()}`,
  });
}

function renderBuild(slots, script = assemble(slots), filename = `${slots.word || "line"}.spw`) {
  return layout({
    title: "spw.quest — take one line apart",
    description: "A whole file you can edit, what a tool reads from it, and its first line taken apart: change one part and the rest holds.",
    canonical: "https://spw.quest/build",
    head: QUEST_HEAD,
    script: `(${toolActions.toString()})();`,
    themeCss: `${PAPER_CSS}
    ${PAGE_CSS}
    ${FILE_CSS}
    ${BUILD_CSS}
    .opening { margin: 0 0 1.2rem; }
    .opening h1 { margin: 0 0 .5rem; font-size: clamp(1.8rem, 5vw, 2.4rem); }
    .opening .lede { max-width: 42rem; margin: 0; color: var(--ink-soft); }`,
    body: `${masthead("/build")}
<section class="opening" aria-labelledby="build-title">
  <h1 id="build-title">Take one line apart</h1>
  <p class="lede">The whole file is yours to edit, and the reading follows it. Below it, the file's first line is taken apart: change one part, and the rest of the line holds still.</p>
</section>
<section id="build" aria-labelledby="build-title">
  ${buildSurface(slots, script, filename)}
</section>
<p class="also"><a href="/">Back to the guide</a> · <a href="/learn">Learn it a mark at a time</a> · <a href="/specimens">Specimens</a> · <a href="/constructs">Constructs</a> · <a href="/pivot">Pivot a line</a> · <a href="/install">Install the workbench</a></p>
${liveFileScript()}
${displayScript()}`,
  });
}

/** The shelf of specimens, a search by slot, and two lines side by side; all of it in the address, all of it with scripts off. */
function renderSpecimens(state) {
  return layout({
    title: "spw.quest — specimens",
    description: "Lines of Spw from spwashi.com, read with scripts off: find them by slot, and hold two side by side.",
    canonical: "https://spw.quest/specimens",
    head: QUEST_HEAD,
    themeCss: `${PAPER_CSS}
    ${PAGE_CSS}
    ${SPECIMENS_CSS}`,
    body: `${masthead("/specimens")}
${specimensBody(state)}
<p class="also"><a href="/">Back to the guide</a> · <a href="/constructs">Constructs</a> · <a href="/pivot">Pivot a line</a> · <a href="/build">Take one line apart</a> · <a href="/learn">Learn it a mark at a time</a></p>`,
  });
}

function renderRead(step, line, { cut = false } = {}) {
  const index = STEPS.indexOf(step);
  const next = STEPS[index + 1];
  const onward = next
    ? `<a class="chip" href="/read?step=${escapeHtml(next.id)}">Next: ${escapeHtml(next.id)}</a>`
    : `<a class="chip" href="/install">Install the workbench</a>`;
  return layout({
    title: `spw.quest — ${step.id}, panel ${index + 1} of ${STEPS.length}`,
    description: step.reads,
    canonical: `https://spw.quest/learn#${step.id}`,
    head: QUEST_HEAD,
    themeCss: `${PAPER_CSS}
    ${PAGE_CSS}
    ${PANEL_CSS}
    ${PATH_CSS}
    main > :not(.masthead) { max-width: 46rem; }
    .path { margin: .4rem 0 1.1rem; }
    .step-nav { display: flex; flex-wrap: wrap; gap: .5rem; margin: 1.2rem 0 0; }
    .step-nav .chip { margin: 0; }`,
    body: `${masthead("/learn")}
<p class="kicker">Panel ${index + 1} of ${STEPS.length}</p>
${pathNav(index)}
${stepSurface(step, { index, line, heading: "h1" })}
${cut ? `<p class="note">Only the first ${LINE_LIMIT} characters were read.</p>` : ""}
<nav class="step-nav" aria-label="Panels">
  <a class="chip" href="/learn#${escapeHtml(step.id)}">Back to the panel</a>
  ${onward}
</nav>`,
  });
}

function renderNoStep(asked) {
  const list = STEPS.map((step, index) => `<li><a href="/read?step=${escapeHtml(step.id)}">${index + 1}. ${escapeHtml(step.id)}</a></li>`).join("\n  ");
  return layout({
    title: "spw.quest — no such panel",
    description: "The panels spw.quest can read a line for.",
    canonical: "https://spw.quest/",
    head: QUEST_HEAD,
    themeCss: `${PAPER_CSS}
    ${PAGE_CSS}`,
    body: `${masthead("/learn")}
<h1>No panel named ${asked ? `“${escapeHtml(asked)}”` : "in this link"}.</h1>
<p>These are the panels:</p>
<ol>
  ${list}
</ol>`,
  });
}

function handleRead(url) {
  const asked = url.searchParams.get("step") || "";
  const step = STEPS.find((s) => s.id === asked);
  if (!step) return page(renderNoStep(asked), { status: 404 });
  const given = url.searchParams.has("line") ? url.searchParams.get("line") : step.try;
  return page(renderRead(step, given.slice(0, LINE_LIMIT), { cut: given.length > LINE_LIMIT }), { cache: "public, max-age=300" });
}

function scriptFile(body, filename) {
  const text = body && !body.endsWith("\n") ? `${body}\n` : body;
  return new Response(text, {
    headers: {
      ...BASE_SECURITY,
      "Content-Type": "text/plain; charset=UTF-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

async function handleTool(request, url) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return new Response("Bad request", { status: 400, headers: BASE_SECURITY });
  }
  const script = String(form.get("script") ?? "").slice(0, MAX_SCRIPT);
  const filename = safeName(form.get("filename") || "line.spw");
  if (url.pathname === "/script.spw" || form.get("tool") === "download") return scriptFile(script, filename);
  const formatted = form.get("tool") === "format" ? formatScript(script) : script;
  const slots = focusSlots(formatted) || { ...BUILD_DEFAULTS };
  return page(renderBuild(slots, formatted, filename), { cache: "no-store" }, LIVE_CSP);
}

async function handleQuest(request, url) {
  if (request.method === "POST" && (url.pathname === "/build" || url.pathname === "/script.spw")) return handleTool(request, url);
  if (!["GET", "HEAD"].includes(request.method)) {
    return new Response("Method not allowed", { status: 405, headers: { ...BASE_SECURITY, Allow: "GET, HEAD" } });
  }
  let response;
  if (url.pathname === "/git.txt") {
    response = new Response(GIT_GUIDE, { headers: { ...BASE_SECURITY,
      "Content-Type": "text/plain; charset=UTF-8", "Cache-Control": "public, max-age=300" } });
  } else if (url.pathname === "/git.md") {
    response = new Response(GIT_MARKDOWN, { headers: { ...BASE_SECURITY,
      "Content-Type": "text/markdown; charset=UTF-8", "Cache-Control": "public, max-age=300" } });
  } else if (["/init", "/init.md", "/llms.txt"].includes(url.pathname) ||
      (url.pathname === "/" && /text\/(plain|markdown)/.test(request.headers.get("accept") || ""))) {
    response = new Response(QUEST_TEXT, { headers: { ...BASE_SECURITY,
      "Content-Type": "text/plain; charset=UTF-8", "Cache-Control": "public, max-age=300", Vary: "Accept" } });
  } else if (url.pathname === "/quest.json" || (url.pathname === "/" && wantsJson(request))) {
    response = jsonResponse({ version: VERSION, schema: "quest.v2", ...QUEST, prompts: QUEST_PROMPTS }, "public, max-age=300");
  } else if (url.pathname === "/prompts.json") {
    response = jsonResponse({ version: VERSION, schema: "prompts.v1", prompts: QUEST_PROMPTS }, "public, max-age=300");
  } else if (url.pathname === "/install") {
    response = page(renderInstall());
  } else if (url.pathname === "/") {
    // ?parser= tries another build in the page; an invalid value is ignored, and the page is the default.
    // ?example= opens one of the files; an unknown one opens the first.
    const value = parserSwitch(url.searchParams);
    const example = exampleById(url.searchParams.get("example")) || EXAMPLES[0];
    response = page(renderGuide(value && { value, from: switchModulePath(value) }, example), {}, LIVE_CSP);
  } else if (url.pathname === "/learn") {
    response = page(renderLearn(), {}, LIVE_CSP);
  } else if (url.pathname === "/build") {
    const asked = buildFrom(url.searchParams);
    response = page(renderBuild(asked.slots, asked.script, asked.filename), { cache: "public, max-age=300" }, LIVE_CSP);
  } else if (url.pathname === "/script.spw") {
    const asked = buildFrom(url.searchParams);
    response = scriptFile(asked.script, asked.filename);
  } else if (url.pathname === "/read") {
    response = handleRead(url);
  } else if (url.pathname === "/specimens") {
    response = page(renderSpecimens(specimenState(url.searchParams)), { cache: "public, max-age=300" });
  } else if (url.pathname === "/constructs") {
    response = page(renderConstructs(), { cache: "public, max-age=300" });
  } else if (url.pathname === "/pivot") {
    response = page(renderPivot(pivotState(url.searchParams)), { cache: "public, max-age=300" });
  } else if (url.pathname === "/parser.js") {
    response = new Response(PARSER_JS, { headers: { ...BASE_SECURITY,
      "Content-Type": "text/javascript; charset=UTF-8", "Cache-Control": "public, max-age=3600" } });
  } else if (url.pathname === "/.well-known/autonomous-feedback.json") {
    response = jsonResponse(FEEDBACK_CONFIG, "public, max-age=300");
  } else if (url.pathname === "/robots.txt") {
    response = new Response("User-agent: *\nAllow: /\n", { headers: { ...BASE_SECURITY, "Content-Type": "text/plain" } });
  } else if (url.pathname === "/health" || url.pathname === "/ready") {
    response = jsonResponse({ ok: true, worker: "spw-quest", surface: "quest", version: VERSION }, "no-store");
  } else {
    response = new Response("Not found", { status: 404, headers: BASE_SECURITY });
  }
  if (url.pathname === "/") response.headers.set("Vary", "Accept");
  if (request.method === "HEAD") return new Response(null, { status: response.status, headers: response.headers });
  return response;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === "www.spw.quest") {
      return Response.redirect(`https://spw.quest${url.pathname}${url.search}`, 302);
    }
    // Dated parser releases come from static assets (src/parser-releases.js); /parser.js is not one of them.
    if (isParserPath(url.pathname)) return handleParser(request, url, env);
    // The site's faces and script modules, carried by scripts/build-peer-kit.mjs into assets/fonts/ and assets/peer/.
    if (isPeerAssetPath(url.pathname)) return servePeerAsset(request, url, env);
    return handleQuest(request, url);
  },
};
