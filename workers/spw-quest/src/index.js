import { GIT_GUIDE, GIT_MARKDOWN, INSTRUCTION_SETS, QUEST_PROMPTS, QUEST_TEXT, WORKBENCH } from "./quest.js";
import { BASE_SECURITY, escapeHtml, htmlResponse, jsonResponse, layout, wantsJson } from "../../lib/shell.js";

const VERSION = "0.1.0";
const FEEDBACK_CONFIG = {
  schema: "autonomous-feedback.client.v0",
  host: "spw.quest",
  name: "spw.quest",
  intro: "A note about these setup instructions.",
  kinds: ["problem", "suggestion", "question"],
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

function renderQuest() {
  const choices = INSTRUCTION_SETS.map((set, index) => `<label><input type="radio" name="runner" value="${escapeHtml(set.id)}"${index === 0 ? " checked" : ""}> ${escapeHtml(set.label)}</label>`).join("");
  return layout({
    title: "spw.quest — initialize Spw Workbench",
    description: "Pick Claude, Codex, Grok, another agent, or the shell. Git has its own section.",
    canonical: "https://spw.quest/",
    body: `<p class="kicker">spw.quest</p>
<h1>Initialize the workbench in this repository.</h1>
<p>Choose who runs the setup. Each set asks for <code>.spw/_workbench</code>, then doctor. Your repository keeps the surrounding <code>.spw/</code>. Node <code>${escapeHtml(WORKBENCH.node)}</code>.</p>
<fieldset>
  <legend>Instruction set</legend>
  ${choices}
  <label><input type="checkbox" id="include-git"> Include the git guide in the copy</label>
</fieldset>
<figure class="codeblock">
  <figcaption><span id="instruction-label">Claude</span><button type="button" data-copy="instruction">Copy</button></figcaption>
  <pre id="instruction"></pre>
</figure>
<script type="application/json" id="quest-sets">${JSON.stringify(INSTRUCTION_SETS)}</script>
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
