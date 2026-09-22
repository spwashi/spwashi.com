import { GIT_GUIDE, GIT_MARKDOWN, INSTRUCTION_SETS, QUEST_PROMPTS, QUEST_TEXT, WORKBENCH } from "./quest.js";
import { BASE_SECURITY, escapeHtml, htmlResponse, jsonResponse, layout, wantsJson } from "../../lib/shell.js";

const VERSION = "0.1.0";
const FEEDBACK_CONFIG = {
  schema: "autonomous-feedback.client.v0",
  host: "spw.quest",
  name: "spw.quest",
  title: "Feedback",
  intro: "What was hard to follow in these setup instructions.",
  kinds: ["problem", "suggestion", "question"],
  contact: { bluesky: "spwashi.com", x: "spwashi" },
  button: "Send",
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

function renderQuest() {
  const tabs = INSTRUCTION_SETS.map((set, index) => `<button type="button" role="tab" id="tab-${escapeHtml(set.id)}" aria-controls="panel-${escapeHtml(set.id)}" aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}" data-set="${escapeHtml(set.id)}" data-includes-git="${set.includesGit}">${escapeHtml(set.label)}</button>`).join("\n    ");
  const panels = INSTRUCTION_SETS.map((set) => `<section class="tabpanel" role="tabpanel" id="panel-${escapeHtml(set.id)}" aria-labelledby="tab-${escapeHtml(set.id)}" tabindex="0">
    <p class="note">${escapeHtml(set.note)}</p>
    ${set.includesGit ? "" : `<label class="check"><input type="checkbox" data-include-git="set-${escapeHtml(set.id)}"> Add the git guide to this copy</label>`}
    <figure class="codeblock">
      <figcaption><span>${escapeHtml(set.label)}</span><button type="button" data-copy="set-${escapeHtml(set.id)}">Copy</button></figcaption>
      <pre id="set-${escapeHtml(set.id)}">${escapeHtml(set.text)}</pre>
    </figure>
  </section>`).join("\n  ");
  return layout({
    title: "spw.quest — initialize Spw Workbench",
    description: "Run the workbench setup from the shell, or hand it to Claude, Codex, Grok, or another agent.",
    canonical: "https://spw.quest/",
    script: `(${questTabs.toString()})();`,
    body: `<p class="kicker">spw.quest</p>
<h1>Initialize the workbench in this repository.</h1>
<p>Choose who runs the setup. Each set mounts <code>.spw/_workbench</code>, then runs doctor. Your repository keeps the surrounding <code>.spw/</code>. Node <code>${escapeHtml(WORKBENCH.node)}</code>.</p>
<div class="tabs">
  <div class="tablist" role="tablist" aria-label="Who runs the setup">
    ${tabs}
  </div>
  ${panels}
</div>
<p class="note" id="git-covered" hidden>The shell steps already run the git commands; the git guide is at <a href="/git.txt">git.txt</a> and <a href="/git.md">git.md</a>.</p>
<section id="git-guide">
  <h2>Git, in this order</h2>
  <ol>
    <li>no <code>.git</code> → <code>git init</code></li>
    <li>no <code>.spw/_workbench</code> in <code>.gitmodules</code> → <code>git submodule add</code></li>
    <li>link just added → <code>checkout</code></li>
    <li>link recorded, folder empty → <code>submodule update --init</code></li>
    <li><code>git diff --check</code> looks only</li>
  </ol>
  <figure class="codeblock">
    <figcaption><span><a href="/git.txt">git.txt</a> · <a href="/git.md">git.md</a></span><button type="button" data-copy="git-copy">Copy</button></figcaption>
    <pre id="git-copy">${escapeHtml(GIT_GUIDE)}</pre>
  </figure>
</section>
<p><a href="/init">Full recipe</a> · <a href="/prompts.json">Prompts</a> · <a href="/quest.json">quest.json</a> · <a href="${QUEST.source}">Upstream quick start</a> · <a href="https://autonomous.feedback/spw.quest/problem">Feedback</a></p>`,
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
  } else if (url.pathname === "/") {
    response = htmlResponse(renderQuest());
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
