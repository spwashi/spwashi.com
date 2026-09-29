import { CONTAINERS, EXAMPLE, EXAMPLE_NOTES, OPERATORS, READERS, spiral } from "./guide.js";
import { EXPECTED_FILES, GIT_GUIDE, GIT_MARKDOWN, INSTRUCTION_SETS, QUEST_PROMPTS, QUEST_TEXT, WORKBENCH } from "./quest.js";
import { BASE_SECURITY, escapeHtml, htmlResponse, jsonResponse, layout, wantsJson } from "../../lib/shell.js";

const VERSION = "0.1.0";
const FEEDBACK_CONFIG = {
  schema: "autonomous-feedback.client.v0",
  host: "spw.quest",
  name: "spw.quest",
  title: "Feedback",
  intro: "What was hard to follow in this guide or the setup instructions.",
  kinds: ["broken", "confusing", "missing", "wrong", "question"],
  routes: [{ name: "Guide", path: "/" }, { name: "Install", path: "/install" }, { name: "Recipe", path: "/init" }],
  contact: { bluesky: "spwashi.com", x: "spwashi" },
  button: "Send",
  queue: { want: true },
  frame: { ancestors: ["https://spw.quest", "https://spwashi.com"] },
  theme: { mode: "dark", background: "#0a1012", text: "#e8eef1", accent: "#5eead4", corners: "round", font: "system" },
};
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
    script: `(${questTabs.toString()})();`,
    themeCss: `html:not(.js) label.check, html:not(.js) .git-added { display: none; }
    html.js .tabpanel .git-added { display: none; margin: .2rem 0 .7rem; }
    html.js .tabpanel:has([data-include-git]:checked) .git-added { display: block; }`,
    body: `<p class="kicker"><a href="/">spw.quest</a> · install</p>
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

/** Old links carried the setup choice on the front page (#claude); send them to the install page. */
function forwardSetupHash() {
  const sets = document.documentElement.dataset.setupSets.split(" ");
  const id = location.hash.slice(1);
  if (sets.includes(id)) location.replace(`/install#${id}`);
}

function renderGuide() {
  const sigils = OPERATORS.map((op, index) => `<li id="op-${escapeHtml(op.name)}">
      <span class="turn" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
      <span class="sigil" aria-hidden="true">${escapeHtml(op.sigil)}</span>
      <p><strong>${escapeHtml(op.name)}</strong> <code>${escapeHtml(op.sigil)}</code></p>
      <p>${escapeHtml(op.reads)}</p>
      <p class="note">Runtime: ${escapeHtml(op.does)}</p>
    </li>`).join("\n    ");
  const braces = CONTAINERS.map((c) => `<li><code class="pair">${escapeHtml(c.open)} ${escapeHtml(c.close)}</code> <strong>${escapeHtml(c.name)}</strong> ${escapeHtml(c.reads)}</li>`).join("\n    ");
  const notes = EXAMPLE_NOTES.map((n) => `<div><dt><code>${escapeHtml(n.code)}</code></dt><dd>${escapeHtml(n.note)}</dd></div>`).join("\n    ");
  const readers = READERS.map((r) => `<li><strong>${escapeHtml(r.who)}.</strong> ${escapeHtml(r.why)}</li>`).join("\n    ");
  const setIds = INSTRUCTION_SETS.map((set) => set.id).join(" ");
  const turn = spiral();
  const view = turn.viewBox;
  const marks = OPERATORS.map((op, index) => {
    const { x, y } = turn.nodes[index];
    return `<a href="#op-${escapeHtml(op.name)}" aria-label="${escapeHtml(`${op.name}, ${op.sigil}`)}">
      <circle cx="${x}" cy="${y}" r="${turn.radius}"/>
      <text x="${x}" y="${y}" dy=".35em">${escapeHtml(op.sigil)}</text>
    </a>`;
  }).join("\n    ");
  const hero = `<svg class="spiral" viewBox="${view}" aria-labelledby="spiral-title" focusable="false">
    <title id="spiral-title">The ${OPERATORS.length} sigils on one spiral, from potential at the center to coupling at the edge</title>
    <path class="spiral__turn" d="${turn.path}"/>
    ${marks}
  </svg>`;
  return layout({
    title: "spw.quest — a guide to the Spw language",
    description: "Spw is a small language for the shape of a thought: one character says what a word is doing, and braces say what belongs together. The file stays plain text.",
    canonical: "https://spw.quest/",
    script: `document.documentElement.dataset.setupSets = ${JSON.stringify(setIds)};\n(${forwardSetupHash.toString()})();`,
    themeCss: `main { width: min(52rem, calc(100% - 2rem)); }
    .hero { display: grid; grid-template-columns: minmax(0, 1fr); gap: 1rem 2rem; align-items: center; margin: .4rem 0 1.4rem; }
    @media (min-width: 46rem) { .hero { grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr); } }
    .hero h1 { font-size: clamp(2rem, 6vw, 3.1rem); }
    .spiral { display: block; width: 100%; max-width: 26rem; height: auto; margin: 0 auto; overflow: visible; }
    .spiral__turn { fill: none; stroke: var(--accent); stroke-opacity: .32; stroke-width: 1.4; stroke-linecap: round; }
    .spiral a { outline: none; }
    .spiral circle { fill: var(--surface); stroke: rgba(94,234,212,.45); stroke-width: 1.2; transition: fill .2s, stroke .2s; }
    .spiral text { fill: var(--accent); font: 600 22px/1 ui-monospace, SFMono-Regular, monospace; text-anchor: middle; pointer-events: none; }
    .spiral a:hover circle, .spiral a:focus-visible circle { fill: var(--accent); stroke: var(--fg); stroke-width: 2.5; }
    .spiral a:hover text, .spiral a:focus-visible text { fill: var(--bg); }
    @media (prefers-reduced-motion: no-preference) {
      .spiral__turn { stroke-dasharray: 6 10; animation: spw-flow 18s linear infinite; }
      @keyframes spw-flow { to { stroke-dashoffset: -320; } }
    }
    .sigils li { position: relative; scroll-margin-top: 1rem; }
    .sigils li:target { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
    .turn { position: absolute; top: .7rem; right: .85rem; color: var(--muted); font: .78rem/1 ui-monospace, SFMono-Regular, monospace; letter-spacing: .08em; }
    .install { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .4rem 1rem; margin: 1.1rem 0 1.6rem; padding: .7rem .9rem; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); }
    .install p { margin: 0; }
    .install .chip { margin: 0; }
    section { margin: 2.2rem 0; }
    .sigils { list-style: none; padding: 0; margin: 1rem 0 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr)); gap: .6rem; }
    .sigils li { margin: 0; padding: .8rem .9rem; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); }
    .sigils p { margin: .15rem 0; }
    .sigil { display: block; font: 600 2rem/1 ui-monospace, SFMono-Regular, monospace; color: var(--accent); margin-bottom: .35rem; }
    .braces { list-style: none; padding: 0; }
    .braces li { padding: .45rem 0; border-top: 1px solid var(--line); }
    .pair { display: inline-block; min-width: 3.2rem; color: var(--accent); font-size: 1.05rem; }
    dl.notes { margin: 0; }
    dl.notes div { padding: .5rem 0; border-top: 1px solid var(--line); }
    dl.notes dt { margin: 0 0 .15rem; }
    dl.notes dd { margin: 0; color: var(--fg); }
    .readers li { margin: .5rem 0; }`,
    body: `<header class="hero">
  <div>
    <p class="kicker">spw.quest · a guide to Spw</p>
    <h1>A small language for the shape of a thought.</h1>
    <p class="lede">In Spw, one character in front of a word says what the word is doing: keeping a path open, asking, committing, weighing. Braces say what belongs together. The file stays plain text you can read, and editors get structure they can navigate.</p>
  </div>
  ${hero}
</header>
<aside class="install" aria-label="Install">
  <p>Want it in a repository? The workbench mounts at <code>.spw/_workbench</code> and stops before any commit.</p>
  <a class="chip" href="/install">Install the workbench →</a>
</aside>

<section id="origin" aria-labelledby="origin-title">
  <h2 id="origin-title">The shape it came from</h2>
  <p>My thoughts were already spirals. Part of the difficulty was not having language for what I was thinking about, so I could not tell when a thought was ready to set down. Spw gives that shape somewhere to land: one character says what a word is doing, braces say what belongs together, and a thought can be set down whole instead of chased.</p>
  <p>It started in 2017, alongside reading about how people learn from text and helping with research in an adult learning lab. Part of it was wanting language to share what I was learning, in a place where I could keep learning what I wanted to. The question it keeps asking is about cognition: where do two understandings stop sharing ground, and what would help them share more?</p>
  <p>And it wonders about geometry: how a mind represents the thoughts it holds, what shape a circuit of thought might take on a page, and how findings from different fields could sit side by side in one form you can read.</p>
  <p>It is not built for anyone in particular. It has been designed with care, and it has turned out to be useful, most of all toward a culture where media literacy can grow across generations.</p>
</section>

<section id="read" aria-labelledby="read-title">
  <h2 id="read-title">Read one page</h2>
  <p>A journal entry, written in Spw. Every line is still readable as a note.</p>
  <figure class="codeblock">
    <figcaption><span>morning_pages.spw</span><button type="button" data-copy="example">Copy</button></figcaption>
    <pre id="example">${escapeHtml(EXAMPLE)}</pre>
  </figure>
  <dl class="notes">
    ${notes}
  </dl>
</section>

<section id="operators" aria-labelledby="operators-title">
  <h2 id="operators-title">Twelve sigils and a couple</h2>
  <p>Each operator has a reader's name, which is how you think with it, and a runtime behavior, which is what the interpreter does today. They are kept separate on purpose: a name is not a promise about evaluation.</p>
  <ul class="sigils">
    ${sigils}
  </ul>
</section>

<section id="braces" aria-labelledby="braces-title">
  <h2 id="braces-title">Four ways to hold things</h2>
  <p>Brace pairs are containers. Read together, they make a sentence: <code>&lt;concept&gt;(scene)[mode]{definition}</code>, what it is about, where, through which lens, and what belongs inside.</p>
  <ul class="braces">
    ${braces}
  </ul>
  <p class="note">Operators and containers compose: <code>#[…]</code> is a set, <code>.{…}</code> is a property sheet.</p>
</section>

<section id="readers" aria-labelledby="readers-title">
  <h2 id="readers-title">You might find it interesting if…</h2>
  <ul class="readers">
    ${readers}
  </ul>
</section>

<section id="next" aria-labelledby="next-title">
  <h2 id="next-title">Keep going</h2>
  <p><a class="chip" href="https://spwashi.com/tools/spw-parser/">Try the parser</a> <a class="chip" href="https://spwashi.com/topics/software/spw/">Operator atlas</a> <a class="chip" href="${QUEST.repository}">Read the source</a> <a class="chip" href="/install">Install</a></p>
</section>
<p><a href="/init">Recipe for agents</a> · <a href="/quest.json">quest.json</a> · <a href="https://autonomous.feedback/spw.quest?at=/">What was hard to follow</a></p>`,
  });
}

function handleQuest(request, url) {
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
    response = htmlResponse(renderInstall());
  } else if (url.pathname === "/") {
    response = htmlResponse(renderGuide());
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
  async fetch(request) {
    const url = new URL(request.url);
    if (url.hostname === "www.spw.quest") {
      return Response.redirect(`https://spw.quest${url.pathname}${url.search}`, 302);
    }
    return handleQuest(request, url);
  },
};
