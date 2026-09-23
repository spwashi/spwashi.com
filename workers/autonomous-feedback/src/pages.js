import { escapeHtml, layout } from "../../lib/shell.js";
import { CONTEXTS, DEFAULT_KIND, NOTE, NOTE_MAX, cleanPath, contextBySlug, isPublicSite } from "./model.js";
import { CLIENT_SCRIPT } from "./client.js";
import { CONFIG_PATH, configToFile, defaultConfig, siteKinds, starterConfig, subjectFor, themeCss } from "./config.js";

/**
 * Every page autonomous.feedback renders. Copy is plain on purpose: a reader
 * arrives with no context and should know what each control does from its
 * label alone.
 */

const ORIGIN = "https://autonomous.feedback";
const EXAMPLE_HOST = "example.com";

/** One source for the code a site pastes: the server fills it, and so does the setup page as you type. */
export const SNIPPETS = Object.freeze({
  link: {
    label: "Link",
    choice: "A text link that opens the form on autonomous.feedback. Works anywhere you can add a link.",
    where: "Paste it where readers should find it, such as your footer or an About page. The form learns which page the reader came from.",
    language: "html",
    template: `<a href="${ORIGIN}/{{host}}{{kindpath}}" referrerpolicy="no-referrer-when-downgrade">Send feedback</a>`,
  },
  frame: {
    label: "Frame",
    choice: "The form inside your page. Readers can switch between the kinds of note you offer.",
    where: "Paste it where the form should appear. It is 560 pixels tall; change height to fit.",
    language: "html",
    template: `<iframe title="Feedback for {{host}}" src="${ORIGIN}/embed/{{host}}{{kindpath}}" width="100%" height="560" style="border:0" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`,
  },
  form: {
    label: "HTML form",
    choice: "A plain form that sends one kind of note. No script, styled by your own CSS. The kind is enough; the box is an optional detail.",
    where: "Paste it where the form should appear. Readers land on their card after sending. With a kind selected above, an empty box still sends and is counted with no words. With None, the reader has to write. To name the page, add a hidden input: name=\"path\" value=\"/this/page\".",
    language: "html",
    template: `<form method="post" action="${ORIGIN}/{{host}}">
  <input type="hidden" name="kind" value="{{kind}}">
  <label for="feedback-note">{{title}} for {{host}} <span>Optional detail</span></label>
  <textarea id="feedback-note" name="note" rows="5" maxlength="${NOTE_MAX}" placeholder="Optional detail"></textarea>
  <button type="submit">Send</button>
</form>`,
  },
  fetch: {
    label: "Your own form",
    choice: "Send notes from your own code. You get the card back as JSON.",
    where: "Call it from your form's submit handler. Unless your site has an open inbox, nothing is kept; show or send the card yourself.",
    language: "js",
    template: `const response = await fetch("${ORIGIN}/{{host}}", {
  method: "POST",
  headers: { "content-type": "application/json", accept: "application/json" },
  body: JSON.stringify({ kind: "{{kind}}", note }),
});
const card = await response.json(); // { host, context, issued, markdown }`,
  },
});

export const TEST_TEMPLATE = `curl -X POST ${ORIGIN}/{{host}} \\
  -H 'accept: application/json' -H 'content-type: application/json' \\
  -d '{"kind":"{{kind}}","note":"Testing the feedback form."}'`;

export function fillTemplate(template, host, context) {
  return template
    .replaceAll("{{host}}", host)
    .replaceAll("{{kindpath}}", context.slug === NOTE.slug ? "" : `/${context.slug}`)
    .replaceAll("{{kind}}", context.slug)
    .replaceAll("{{title}}", context.title);
}

function kicker() {
  return `<p class="kicker"><a href="/">autonomous.feedback</a></p>`;
}

function fieldError(id, message) {
  return message ? `<p class="error" id="${id}">${escapeHtml(message)}</p>` : "";
}

function hostField({ id = "host", host = "", error = "", label = "Your site", hint = "A domain like example.com. A full link works too." } = {}) {
  const described = [`${id}-hint`, error ? `${id}-error` : ""].filter(Boolean).join(" ");
  return `<label for="${id}">${escapeHtml(label)}</label>
  <p class="hint" id="${id}-hint">${escapeHtml(hint)}</p>
  ${fieldError(`${id}-error`, error)}
  <input id="${id}" name="host" type="text" inputmode="url" value="${escapeHtml(host)}" placeholder="${EXAMPLE_HOST}" maxlength="253" autocomplete="url" autocapitalize="none" spellcheck="false" enterkeyhint="go" data-host-field aria-describedby="${described}"${error ? ` aria-invalid="true" autofocus` : ""}>
  <p class="visit"><a data-visit hidden>Open this site</a></p>`;
}

/** A static card used as an example; the same markup the card page renders. */
function cardMarkup({ context, host, note, issued, id = "", sample = false, name = "", from = "", path = "", routeName = "", subject = "", thread = "", asks = [], worded = true }) {
  const day = issued.slice(0, 10);
  const address = `autonomous.feedback/${host}`;
  const site = name || host;
  const data = sample
    ? ""
    : ` data-kind="${escapeHtml(context.title)}" data-site="${escapeHtml(site)}" data-note="${escapeHtml(from ? `${note}\n\n— ${from}` : note)}" data-day="${escapeHtml(day)}" data-address="${escapeHtml(address)}"`;
  return `<article class="card${sample ? " sample" : ""}"${id ? ` id="${id}"` : ""} data-spw-kind="frame" data-spw-operator="${escapeHtml(context.operator)}" data-spw-semantic-expression="${escapeHtml(context.expression)}"${data}>
  <header>
    <span class="card-kind">${escapeHtml(context.title)}</span>
    <span class="card-site">${escapeHtml(site)}</span>
    ${subject ? `<span class="card-subject">${escapeHtml(thread ? `${subject} · ${thread}` : subject)}</span>` : ""}
    ${path ? `<span class="card-route">${escapeHtml(routeName ? `${routeName} · ${path}` : path)}</span>` : ""}
  </header>
  ${worded ? `<blockquote class="card-note">${escapeHtml(note)}</blockquote>` : `<p class="card-count">${escapeHtml(note)}</p>`}
  ${asks.length ? `<dl class="card-asks">${asks.map((a) => `<dt>${escapeHtml(a.question)}</dt><dd>${escapeHtml(a.answer)}</dd>`).join("")}</dl>` : ""}
  ${from ? `<p class="card-from">— ${escapeHtml(from)}</p>` : ""}
  <footer>
    <time datetime="${escapeHtml(issued)}">${escapeHtml(day)}</time>
    <span class="card-address">${escapeHtml(address)}</span>
  </footer>
  ${sample ? "" : `<p class="card-stamp" data-stamp></p>`}
</article>`;
}

function routeField(routes, path, pathFrom = "") {
  const clean = cleanPath(path);
  const named = routes.some((route) => route.path === clean);
  const options = routes.map((route) => `<label class="choice"><input type="radio" name="route" value="${escapeHtml(route.path)}"${route.path === clean ? " checked" : ""}> <span><strong>${escapeHtml(route.name)}</strong><span>${escapeHtml(route.path)}</span></span></label>`).join("\n      ");
  // The choices get their own grid so the path field below keeps the full width.
  const choices = routes.length
    ? `<div class="choices">
      ${options}
      <label class="choice"><input type="radio" name="route" value=""${!named ? " checked" : ""}> <span><strong>Another page</strong><span>Type its path below</span></span></label>
    </div>`
    : "";
  const picker = `${choices}
  <label for="path">Path</label>
  <p class="hint" id="path-hint">Where on the site this happened, like /checkout. Optional.</p>
  <input id="path" name="path" type="text" value="${escapeHtml(clean)}" placeholder="/checkout" maxlength="200" spellcheck="false" autocapitalize="none" aria-describedby="path-hint">`;
  // A page the link named or the reader came from is shown, not asked; the picker stays one click away.
  if (clean && pathFrom) {
    const route = routes.find((r) => r.path === clean);
    return `<div id="page" class="page">
  <p class="page-known">On <strong>${escapeHtml(route ? `${route.name} · ${clean}` : clean)}</strong></p>
  <details>
    <summary>Change or clear the page</summary>
    <fieldset>
      <legend class="sr-only">Page</legend>
  ${picker}
    </fieldset>
  </details>
</div>`;
  }
  // Unknown page: never a question the reader must answer; the picker waits behind one line.
  return `<details id="page" class="page">
  <summary>Which page? Optional.</summary>
  <fieldset>
    <legend class="sr-only">Page</legend>
  ${picker}
  </fieldset>
</details>`;
}


export function renderHome(host = "") {
  const sample = contextBySlug(DEFAULT_KIND);
  return layout({
    title: "autonomous.feedback — a feedback form for any website",
    description: "Readers write a note about a site and get a card they can save and send to its owner. Nothing to install, and nothing kept unless the site has an inbox.",
    canonical: `${ORIGIN}/`,
    quiet: true,
    script: CLIENT_SCRIPT,
    body: `<p class="kicker">autonomous.feedback</p>
<h1>A feedback form for any website</h1>
<p class="lede">Readers write a note about a site. Each note becomes a card they can save as an image and send to the site's owner. There is nothing to install to start, and nothing is kept unless the site has an inbox.</p>
<section aria-labelledby="sample-title">
  <h2 id="sample-title" class="sr-only">Example card</h2>
  ${cardMarkup({ context: sample, host: EXAMPLE_HOST, note: sample.example, issued: "2026-09-22T12:00:00.000Z", sample: true })}
</section>
<form method="get" action="/start" class="panel">
  ${hostField({ host })}
  <p class="actions">
    <button type="submit">Set up the form</button>
    <button type="submit" formaction="/meter" class="secondary">Check the site responds</button>
  </p>
</form>
<h2>How it works</h2>
<ol class="steps">
  <li><strong>Add a link, frame, or form to your site.</strong> The setup page writes the code with your domain filled in.</li>
  <li><strong>A reader picks what it is.</strong> <span>Broken, confusing, missing, wrong, a question, or thanks. That is enough to send. A detail is optional, and only those words are kept as words.</span></li>
  <li><strong>The card reaches you.</strong> With an inbox, it waits there for you. Without one, the reader sends it by direct message, or in a post that mentions your site.</li>
</ol>
<h2>What it costs</h2>
<ol class="steps">
  <li><strong>Any site: free.</strong> <span>Readers can write about any public site. The card travels by hand, and nothing is kept.</span></li>
  <li><strong>Your site: free.</strong> <span>Publish one file to choose the kinds of note, name your pages, match your colours, and say where you take messages. <a href="/start">The setup page</a> writes it for you.</span></li>
  <li><strong>An inbox: on request.</strong> <span>Add <code>"queue": { "want": true }</code> to your file to ask for one. An inbox keeps new cards for three days. You save the ones worth keeping; the rest become counts by page and kind. Until yours opens, nothing is kept.</span></li>
</ol>
<h2>Write a note about a site</h2>
<form method="get" action="/note" class="panel">
  ${hostField({ id: "note-host", label: "Which site?", hint: "Any public site. Its owner does not need to have set anything up." })}
  <p class="actions"><button type="submit">Write a note</button></p>
</form>`,
  });
}

export function renderStart({ host = "", how = "link", kind = NOTE.slug, error = "", config = null, desk = "none" } = {}) {
  // "None" comes first: a preselected kind files every untouched note under it.
  const none = { ...NOTE, title: "None (recommended)", prompt: "Readers tap a common note or write their own; nothing is chosen for them." };
  const offered = [none, ...(config?.found ? siteKinds(config) : CONTEXTS)];
  const context = offered.find((c) => c.slug === (contextBySlug(kind)?.slug)) || none;
  const snippet = SNIPPETS[how] || SNIPPETS.link;
  const named = host || EXAMPLE_HOST;
  const hows = Object.entries(SNIPPETS).map(([id, s]) => `<label class="choice">
      <input type="radio" name="how" value="${id}"${(SNIPPETS[how] ? how : "link") === id ? " checked" : ""}>
      <span><strong>${escapeHtml(s.label)}</strong><span>${escapeHtml(s.choice)}</span></span>
    </label>`).join("\n    ");
  const kinds = offered.map((c) => `<label class="choice">
      <input type="radio" name="kind" value="${c.slug}"${c.slug === context.slug ? " checked" : ""}>
      <span><strong>${escapeHtml(c.title)}</strong><span>${escapeHtml(c.prompt)}</span></span>
    </label>`).join("\n    ");
  const ownFile = config?.found ? configToFile(config) : null;
  const configTemplate = JSON.stringify(ownFile ? { ...ownFile, host: "{{host}}" } : starterConfig("{{host}}"), null, 2);
  const data = { snippets: SNIPPETS, test: TEST_TEMPLATE, config: configTemplate, kinds: offered.map(({ slug, title }) => ({ slug, title })), example: EXAMPLE_HOST };
  return layout({
    title: host ? `Set up feedback for ${host} — autonomous.feedback` : "Set up the form — autonomous.feedback",
    description: "Choose a link, a frame, or a form, and copy the code with your domain filled in.",
    canonical: `${ORIGIN}/start`,
    quiet: true,
    script: CLIENT_SCRIPT,
    body: `${kicker()}
<h1>Set up the form</h1>
<p class="lede">Choose how readers reach the form. The code below updates as you choose, with your domain filled in.</p>
<form method="get" action="/start" class="panel" id="setup" novalidate>
  ${hostField({ host, error })}
  <fieldset>
    <legend>How readers reach it</legend>
    ${hows}
  </fieldset>
  <fieldset>
    <legend>Preselect a kind of note?</legend>
    ${kinds}
  </fieldset>
  <p class="actions no-js-only"><button type="submit">Update the code</button></p>
</form>
<section aria-labelledby="code-title">
  <h2 id="code-title">Code for <span data-fill="host">${escapeHtml(named)}</span></h2>
  <p class="note${host ? " hidden-note" : ""}" data-when-empty${host ? " hidden" : ""}>Showing example.com until you enter your domain.</p>
  <figure class="codeblock">
    <figcaption><span data-fill="how-label">${escapeHtml(snippet.label)}</span><button type="button" data-copy="snippet">Copy</button></figcaption>
    <pre id="snippet">${escapeHtml(fillTemplate(snippet.template, named, context))}</pre>
  </figure>
  <p class="note" data-fill="where">${escapeHtml(snippet.where)}</p>
</section>
<section aria-labelledby="preview-title">
  <h2 id="preview-title">Preview</h2>
  <div class="preview" id="preview" data-how="${escapeHtml(how)}">${previewMarkup(how, named, context)}</div>
</section>
<section aria-labelledby="test-title">
  <h2 id="test-title">Test it</h2>
  <p>Write a note yourself at <a data-fill="test-link" href="/${encodeURIComponent(named)}${context.slug === NOTE.slug ? "" : `/${context.slug}`}">autonomous.feedback/${escapeHtml(named)}${context.slug === NOTE.slug ? "" : `/${context.slug}`}</a>, or send one from a terminal:</p>
  <figure class="codeblock">
    <figcaption><span>curl</span><button type="button" data-copy="test-snippet">Copy</button></figcaption>
    <pre id="test-snippet">${escapeHtml(fillTemplate(TEST_TEMPLATE, named, context))}</pre>
  </figure>
</section>
<section aria-labelledby="config-title">
  <h2 id="config-title">Customize (optional)</h2>
  <p>Publish a JSON file at <code data-fill="config-url">https://${escapeHtml(named)}${CONFIG_PATH}</code> to choose which kinds of note appear and in what order, rename them, add an intro, ask for the writer's name, set the note length, allow the frame on other sites you own, and match your colours. The file only affects your own domain.</p>
  ${configStatus(host, config, desk)}
  <figure class="codeblock">
    <figcaption><span>${ownFile ? "Your file, as applied" : "Starter file"} · autonomous-feedback.json</span><button type="button" data-copy="config-snippet">Copy</button></figcaption>
    <pre id="config-snippet">${escapeHtml(fillTemplate(configTemplate, named, context))}</pre>
  </figure>
  <details>
    <summary>What each field does</summary>
    <dl class="fields">
      <dt><code>title</code></dt><dd>The heading of the form, up to 80 characters. Without it, the heading is “Feedback for” the site name.</dd>
      <dt><code>kinds</code></dt><dd>Which kinds of note to show, in the order a reader meets them. Default: broken, confusing, missing, wrong, then question and appreciation.</dd>
      <dt><code>routes</code></dt><dd>Named pages on your site, <code>{ "name": "Checkout", "path": "/checkout" }</code>. The form offers them, and <code>?at=/checkout</code> preselects one.</dd>
      <dt><code>subjects</code></dt><dd>The parts of your site a note can be about, up to 12. Each has an <code>id</code>, a <code>name</code>, the <code>paths</code> it covers (the reader's page picks it), a <code>prompt</code> and <code>example</code>, the <code>kinds</code> it takes, up to three <code>asks</code>, and up to six <code>threads</code>: the notes you hear most often there, each one tap for the reader, with an optional <code>kind</code>, and a <code>stance</code> and <code>link</code> shown as your answer.</dd>
      <dt><code>thanks</code></dt><dd>Your line to every reader after they send, up to 200 characters.</dd>
      <dt><code>labels</code></dt><dd>Rename a kind and change its prompt or example. Title up to 40 characters, prompt up to 160.</dd>
      <dt><code>name</code>, <code>intro</code>, <code>button</code></dt><dd>Your site's display name, a line above the form (up to 300 characters), and the submit button text.</dd>
      <dt><code>contact</code></dt><dd>Where you take cards by direct message: <code>{ "bluesky": "example.com", "x": "example" }</code>. The card page shows Message buttons and puts your handle in the Post links.</dd>
      <dt><code>from</code></dt><dd><code>"off"</code>, <code>"optional"</code>, or <code>"required"</code>: a field for the writer's name or handle, printed on the card. Nothing is stored either way. Do not put a token or password in this file.</dd>
      <dt><code>note</code></dt><dd><code>min</code> applies only when a reader writes and does not pick a type. A chosen kind is enough to send and is stored as a count, with no words. <code>max</code> limits either way, up to ${NOTE_MAX.toLocaleString("en-US")}.</dd>
      <dt><code>queue.want</code></dt><dd><code>true</code> asks for an inbox that keeps each card for your site. Until the inbox opens, nothing is kept and readers send cards by hand. The status above says which.</dd>
      <dt><code>inbox.key</code></dt><dd><code>"sha256:"</code> and the hash of a key only you keep. The key opens <code>/yoursite/inbox</code>; the file holds only its hash. See “Make an inbox key” below.</dd>
      <dt><code>frame.ancestors</code></dt><dd>Other https origins that may show the frame, such as a blog on a different domain. Up to 10.</dd>
      <dt><code>theme</code></dt><dd><code>mode</code> (<code>"light"</code> or <code>"dark"</code>), <code>background</code>, <code>text</code>, and <code>accent</code> as hex colours, <code>corners</code> (<code>"sharp"</code>, <code>"round"</code>, <code>"soft"</code>), and <code>font</code> (<code>"system"</code>, <code>"serif"</code>, <code>"mono"</code>, <code>"rounded"</code>). Colours that are hard to read are replaced with the defaults.</dd>
    </dl>
  </details>
  <details id="inbox-key">
    <summary>Make an inbox key</summary>
    <p>Make the key on your own machine, keep it, and put only its hash in the file:</p>
    <figure class="codeblock">
      <figcaption><span>shell</span><button type="button" data-copy="keygen-snippet">Copy</button></figcaption>
      <pre id="keygen-snippet">KEY=$(openssl rand -hex 32); echo "key:  $KEY"
printf %s "$KEY" | shasum -a 256 | sed 's/ .*//; s/^/hash: sha256:/'</pre>
    </figure>
    <div data-keygen hidden>
      <p><button type="button" data-make-key>Make one in this browser</button> <span class="hint">Nothing is sent anywhere.</span></p>
      <figure class="codeblock" data-key-result hidden>
        <figcaption><span>Your key: keep it, never publish it</span><button type="button" data-copy="inbox-key-value">Copy</button></figcaption>
        <pre id="inbox-key-value"></pre>
      </figure>
      <figure class="codeblock" data-key-result hidden>
        <figcaption><span>Add to your file</span><button type="button" data-copy="inbox-key-hash">Copy</button></figcaption>
        <pre id="inbox-key-hash"></pre>
      </figure>
    </div>
  </details>
  <p class="note">On GitHub Pages without a custom build, add an empty <code>.nojekyll</code> file at the root of your site; otherwise Jekyll skips the <code>.well-known</code> folder.</p>
</section>
<script type="application/json" id="setup-data">${JSON.stringify(data).replaceAll("<", "\\u003c")}</script>`,
  });
}

function configStatus(host, config, desk = "none") {
  if (!host || !config) return "";
  const url = `https://${escapeHtml(host)}${CONFIG_PATH}`;
  const problems = config.problems.length
    ? `<ul class="problems">${config.problems.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}</ul>`
    : "";
  const lead = config.found
    ? `<p><strong>Found a configuration file for ${escapeHtml(host)}.</strong> Showing ${siteKinds(config).map((k) => escapeHtml(k.title)).join(", ")}${config.theme ? `, ${escapeHtml(config.theme.mode)} theme` : ""}.${config.problems.length ? " Some of it was not applied:" : " Everything in it was applied."}</p>`
    : `<p><strong>No configuration applied for ${escapeHtml(host)}.</strong> The defaults are in use.</p>`;
  const inbox = desk === "open"
    ? `<p><strong>Inbox: open.</strong> Cards for ${escapeHtml(host)} are kept for three days, longer if saved. ${config.inbox?.key ? `<a href="/${escapeHtml(host)}/inbox">Open the inbox</a>.` : "Add <code>inbox.key</code> to your file to read it."}</p>`
    : desk === "requested"
      ? `<p><strong>Inbox: requested.</strong> Your file asks for one. It is not open yet, so readers still send cards by hand and nothing is kept.</p>`
      : "";
  return `<div class="panel" aria-live="polite">${lead}${problems}${inbox}<p class="note">Checked <a href="${url}">${url}</a>. Changes can take up to 5 minutes to show. <a href="/${escapeHtml(host)}/config.json">See the result as JSON</a>.</p></div>`;
}

export function previewMarkup(how, host, context) {
  if (how === "frame") {
    return `<iframe title="Preview: feedback frame for ${escapeHtml(host)}" src="/embed/${encodeURIComponent(host)}/${context.slug}" width="100%" height="560" style="border:0" loading="lazy"></iframe>`;
  }
  if (how === "fetch") return `<p class="note">Your own code decides how this looks.</p>`;
  const snippet = SNIPPETS[how] || SNIPPETS.link;
  return fillTemplate(snippet.template, host, context).replace(ORIGIN, "");
}

function meterReading(probe) {
  if (probe.class === "down") {
    return {
      word: "Down",
      weather: "storm",
      sentence: probe.status ? `responded with an error (HTTP ${probe.status}).` : "did not respond within 4 seconds.",
    };
  }
  const code = probe.status >= 300 && probe.status < 400 ? `HTTP ${probe.status}, a redirect` : `HTTP ${probe.status}`;
  if (probe.ms_bucket === "slow") return { word: "Slow", weather: "haze", sentence: `took more than 1.2 seconds to respond (${code}).` };
  const pace = probe.ms_bucket === "fast" ? "in under 0.3 seconds" : "in under 1.2 seconds";
  return { word: "Up", weather: "clear", sentence: `responded ${pace} (${code}).` };
}

export function renderMeter({ host = "", probe = null, error = "" } = {}) {
  const reading = probe ? meterReading(probe) : null;
  return layout({
    title: host && reading ? `${host}: ${reading.word} — autonomous.feedback` : "Check a site — autonomous.feedback",
    description: "Whether one site responds, and how quickly.",
    canonical: `${ORIGIN}/meter`,
    quiet: true,
    script: CLIENT_SCRIPT,
    body: `${kicker()}
<h1>${reading ? escapeHtml(host) : "Check a site"}</h1>
${reading
    ? `<p class="weather" data-weather="${reading.weather}">${escapeHtml(reading.word)}</p>
<p class="lede">${escapeHtml(host)} ${escapeHtml(reading.sentence)}</p>
<p class="actions">
  <a class="door" href="/start?host=${encodeURIComponent(host)}"><strong>Set up the form</strong><span>for ${escapeHtml(host)}</span></a>
  <a class="door" href="/${encodeURIComponent(host)}"><strong>Write a note</strong><span>about ${escapeHtml(host)}</span></a>
</p>`
    : `<p class="lede">Enter a public site. autonomous.feedback requests its homepage once and reports whether it responded.</p>`}
<form method="get" action="/meter" class="panel">
  ${hostField({ host: error ? host : reading ? "" : host, error, label: reading ? "Check another site" : "Site" })}
  <p class="actions"><button type="submit">Check</button></p>
</form>`,
  });
}

/**
 * The write page. The kind is a choice inside the form, so switching it keeps
 * the note; the URL only preselects it. `values` carries a failed submission
 * back into the fields.
 */
export function renderWrite({ context, host = "", lockHost = false, embed = false, values = {}, errors = {}, config = null, desk = "none" }) {
  const site = config || defaultConfig(host);
  const kindsShown = siteKinds(site);
  // A kind is selected only when the link named it or the writer chose it; otherwise the note stays unsorted.
  const selected = kindsShown.find((k) => k.slug === contextBySlug(values.kind || context?.slug)?.slug) || null;
  context = selected || NOTE;
  const display = site.name || host;
  const heading = site.title || (lockHost ? `A note for ${display}` : "A note for a site");
  const root = embed ? "/embed" : "";
  const tail = selected ? `/${selected.slug}` : "";
  const action = lockHost ? `${root}/${encodeURIComponent(host)}` : `/${context.slug}`;
  const canonical = lockHost ? `${ORIGIN}${root}/${encodeURIComponent(host)}${tail}` : `${ORIGIN}/${context.slug}`;
  const note = values.note ?? "";

  // The creator's map. Evidence picks the subject (the page, or a chip); nothing is guessed.
  const subjects = site.subjects || [];
  const chosenSubject = subjects.find((sub) => sub.id === values.subject) || (values.subject ? null : subjectFor(site, values.path ?? ""));
  const prompt = chosenSubject?.prompt || context.prompt;
  // An example only helps when it fits: the subject's own, else the kind's when no subject is chosen.
  const exampleText = chosenSubject ? chosenSubject.example : context.example;
  const subjectChips = subjects.map((sub) => `<label class="chip"><input type="radio" name="subject" value="${escapeHtml(sub.id)}"${chosenSubject?.id === sub.id ? " checked" : ""} data-prompt="${escapeHtml(sub.prompt || NOTE.prompt)}" data-example="${escapeHtml(sub.example)}" data-name="${escapeHtml(sub.name)}"> <span>${escapeHtml(sub.name)}</span></label>`).join("\n      ");
  const subjectBlock = !subjects.length ? "" : chosenSubject
    ? `<div id="subjects" class="about-line">
    <p>About <strong data-fill="subject-name">${escapeHtml(chosenSubject.name)}</strong></p>
    <details>
      <summary>Not this?</summary>
      <fieldset class="chips">
        <legend class="sr-only">Which part of ${escapeHtml(display)}</legend>
        ${fieldError("subject-error", errors.subject)}
        <div class="row">
      ${subjectChips}
        </div>
      </fieldset>
    </details>
  </div>`
    : `<fieldset id="subjects" class="chips">
    <legend>Which part of ${escapeHtml(display)}? <span class="hint">Optional</span></legend>
    ${fieldError("subject-error", errors.subject)}
    <div class="row">
      ${subjectChips}
    </div>
  </fieldset>`;

  // The fast lane: what this creator hears often. One tap is a whole note, and it is the count they can act on.
  const threadBlocks = subjects.filter((sub) => sub.threads.length).map((sub) => `<fieldset class="chips threads" data-subject="${escapeHtml(sub.id)}">
    <legend>Often said about ${escapeHtml(sub.name)} <span class="hint">One tap counts. Add words only if you want them read.</span></legend>
    <div class="row">
      ${sub.threads.map((t) => `<label class="chip"><input type="radio" name="thread" value="${escapeHtml(`${sub.id}:${t.id}`)}"${values.thread === `${sub.id}:${t.id}` || values.thread === t.id ? " checked" : ""}> <span>${escapeHtml(t.name)}</span></label>`).join("\n      ")}
    </div>
    ${sub.threads.filter((t) => t.stance).map((t) => `<p class="stance" data-for="${escapeHtml(`${sub.id}:${t.id}`)}"><strong>${escapeHtml(display)}:</strong> ${escapeHtml(t.stance)}${t.link ? ` <a href="https://${escapeHtml(host)}${escapeHtml(t.link)}">More</a>` : ""}</p>`).join("\n    ")}
  </fieldset>`).join("\n  ");

  const kinds = kindsShown.map((c) => `<label class="chip" data-kind="${c.slug}">
      <input type="radio" name="kind" value="${c.slug}"${selected?.slug === c.slug ? " checked" : ""} data-prompt="${escapeHtml(c.prompt)}" data-example="${escapeHtml(c.example)}" data-href="${root}${lockHost ? `/${encodeURIComponent(host)}` : ""}/${c.slug}">
      <span>${escapeHtml(c.title)}</span>
    </label>`).join("\n      ");
  const askBlocks = subjects.filter((sub) => sub.asks.length).map((sub) => `<details class="asks" data-subject="${escapeHtml(sub.id)}"${sub.asks.some((_, i) => values.asks?.[i]) ? " open" : ""}>
    <summary>Say more <span class="hint">${sub.asks.length === 1 ? "one question" : `${sub.asks.length} questions`}, all optional</span></summary>
    ${sub.asks.map((q, i) => `<label for="ask-${escapeHtml(sub.id)}-${i}">${escapeHtml(q)}</label>
    <textarea id="ask-${escapeHtml(sub.id)}-${i}" name="ask-${i}" rows="2" maxlength="2000" class="note ask">${escapeHtml(values.asks?.[i] || "")}</textarea>`).join("\n    ")}
  </details>`).join("\n  ");
  // Without script, the subject decides what shows through :has(); the script only mirrors text.
  const subjectCss = subjects.map((sub) => {
    const show = `.write:has(input[name="subject"][value="${sub.id}"]:checked) [data-subject="${sub.id}"] { display: block; }`;
    const hide = sub.kinds.length ? `.write:has(input[name="subject"][value="${sub.id}"]:checked) label.chip[data-kind]:not(${sub.kinds.map((k) => `[data-kind="${k}"]`).join(", ")}):not(:has(input:checked)) { display: none; }` : "";
    const stances = sub.threads.filter((t) => t.stance).map((t) => `.write:has(input[name="thread"][value="${sub.id}:${t.id}"]:checked) .stance[data-for="${sub.id}:${t.id}"] { display: block; }`).join("\n");
    return [show, hide, stances].filter(Boolean).join("\n");
  }).join("\n");
  // The checked type reveals its own line. No script required: the choice changes what the page says will be kept.
  const outcomeCss = [
    ".write .outcome { display: none; }",
    ".write .outcome[data-outcome='none'] { display: block; }",
    ".write:has(#kinds input:checked) .outcome[data-outcome='none'] { display: none; }",
    ...kindsShown.map((c) => `.write:has(#kinds input[value="${c.slug}"]:checked) .outcome[data-outcome="${c.slug}"] { display: block; }`),
    ".write:has(input[name='thread']:checked) .outcome { display: none; }",
    ".write:has(input[name='thread'][value='thanks']:checked) .outcome[data-outcome='thanks'] { display: block; }",
    ".write:has(input[name='thread']:checked):not(:has(input[name='thread'][value='thanks']:checked)) .outcome[data-outcome='thread'] { display: block; }",
  ].join("\n");
  const kept = desk === "open"
    ? `With no detail, ${escapeHtml(display)} keeps a count, not words. Add what happened if you want it read for three days.`
    : "Nothing is stored here. The card carries this, plus any detail you add, and you send it.";
  const outcomes = [
    `<p class="outcome" data-outcome="none">Pick what this is. That is enough to send, and it is what gets counted. Without a type, write at least ${site.note.min} characters.</p>`,
    ...kindsShown.map((c) => `<p class="outcome" data-outcome="${c.slug}">This sends as <strong>${escapeHtml(c.title)}</strong>. ${escapeHtml(c.prompt)} ${kept}</p>`),
    `<p class="outcome" data-outcome="thread">This joins that common note. ${kept}</p>`,
    `<p class="outcome" data-outcome="thanks">This sends as thanks. ${kept}</p>`,
  ].join("\n    ");

  const noteDescribed = ["note-hint", "note-count", errors.note ? "note-error" : ""].filter(Boolean).join(" ");
  const listed = [["note", errors.note], ["subjects", errors.subject], ["kinds", errors.kind], ["host", errors.host], ["from", errors.from]].filter(([, m]) => m);
  const summary = listed.length
    ? `<div class="error-summary" role="alert" tabindex="-1" data-error-summary><p>Not sent yet. ${listed.length > 1 ? "A couple of things" : "One thing"} to fix:</p><ul>${listed.map(([id, m]) => `<li><a href="#${id}">${escapeHtml(m)}</a></li>`).join("")}</ul></div>`
    : "";
  const fromField = site.from === "off" ? "" : `<label for="from">Your name or handle${site.from === "optional" ? " <span class=\"hint\">optional</span>" : ""}</label>
  <p class="hint" id="from-hint">Printed on the card.</p>
  ${fieldError("from-error", errors.from)}
  <input id="from" name="from" type="text" value="${escapeHtml(values.from ?? "")}" maxlength="80" autocomplete="nickname" aria-describedby="from-hint${errors.from ? " from-error" : ""}"${site.from === "required" ? " required" : ""}${errors.from ? ` aria-invalid="true"` : ""}>`;
  const button = site.button || (desk === "open" ? `Send to ${display}` : "Make my card");
  const keep = desk === "open"
    ? `Words are kept only when you write them. ${escapeHtml(display)} sees this in their inbox for three days, longer if they save it.`
    : lockHost
      ? `Words are kept only on the card, and only if you write them. Nothing is stored. You send the card to ${escapeHtml(display)} yourself.`
      : "Words are kept only on the card, and only if you write them. Nothing is stored unless the site has an inbox.";
  return layout({
    title: `${heading} — autonomous.feedback`,
    description: lockHost ? `Pick what happened on ${host}. That is enough to send. Add a detail if you want the words kept.` : "Pick what happened on a site. That is enough to send. Add a detail if you want the words kept.",
    canonical,
    quiet: true,
    embed,
    script: CLIENT_SCRIPT,
    themeCss: `${themeCss(site.theme)}\n${subjectCss}\n${outcomeCss}`,
    body: `${embed ? "" : kicker()}
<h1>${escapeHtml(heading)}</h1>
${lockHost && isPublicSite(host) ? `<p class="visit"><a href="https://${escapeHtml(host)}/">Open ${escapeHtml(host)}</a></p>` : ""}
${site.intro ? `<p class="lede">${escapeHtml(site.intro)}</p>` : ""}
${summary}
<form method="post" action="${escapeHtml(action)}" class="panel write" id="write" data-draft-key="${escapeHtml(lockHost ? host : "")}" data-button="${escapeHtml(button)}" data-note-min="${site.note.min}">
  ${subjectBlock}
  ${threadBlocks}
  <fieldset id="kinds" class="chips tags"${kindsShown.length === 1 ? " hidden" : ""}>
    <legend>What is this? <span class="hint">Enough to send</span></legend>
    ${fieldError("kind-error", errors.kind)}
    <div class="row">
      ${kinds}
    </div>
  </fieldset>
  <p class="thanks-row"><label class="chip"><input type="radio" name="thread" value="thanks"${values.thread === "thanks" ? " checked" : ""}> <span>Just saying thanks</span></label></p>
  <aside class="draft-card" aria-live="polite">
    <p class="draft-eyebrow">What you are sending</p>
    ${outcomes}
    <p class="draft-words" data-draft-words></p>
  </aside>
  <label for="note"><span class="untapped">Or write what happened</span><span class="when-typed">Add a detail <span class="hint">optional</span></span></label>
  <p class="hint" id="note-hint"><span class="until-typed">Without a type, write at least ${site.note.min} characters. </span><span class="when-typed">Left blank, this is counted and no words are kept. </span><span data-fill="prompt">${escapeHtml(prompt)}</span> <span data-fill="example">${exampleText ? `For example: ${escapeHtml(exampleText)}` : ""}</span></p>
  ${fieldError("note-error", errors.note)}
  <textarea class="note" id="note" name="note" rows="4" maxlength="${site.note.max}" aria-describedby="${noteDescribed}"${errors.note ? ` aria-invalid="true"` : ""}${embed || chosenSubject?.threads.length || selected ? "" : " autofocus"}>${escapeHtml(note)}</textarea>
  <p class="count" id="note-count"><span data-count>${note.length}</span> of ${site.note.max.toLocaleString("en-US")}</p>
  ${askBlocks}
  ${routeField(site.routes || [], values.path ?? "", values.pathFrom || "")}
  ${lockHost ? `<input type="hidden" name="host" value="${escapeHtml(host)}">` : hostField({ host: values.host ?? host, error: errors.host, label: "Which site is this about?", hint: "A domain like example.com." })}
  ${fromField}
  <div class="hp" aria-hidden="true">
    <label for="company">Leave this empty</label>
    <input id="company" name="company" tabindex="-1" autocomplete="off">
  </div>
  <p class="hint keep">${keep}</p>
  <p class="actions"><button type="submit" data-pending="Sending…">${escapeHtml(button)}</button></p>
</form>
${embed ? "" : `<p class="note">Run a site? <a href="/start">Put this form on it</a>.</p>`}`,
  });
}

function excerpt(text, limit = 200) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > limit ? `${flat.slice(0, limit - 1).trimEnd()}…` : flat;
}

/**
 * The card page. The card is made to be saved as an image or screenshotted,
 * and carries the address where the next reader can write one.
 */
export function renderCard(filing, embed = false, config = null) {
  const site = config || defaultConfig(filing.host);
  const display = site.name || filing.host;
  const root = embed ? "/embed" : "";
  const back = `${root}/${encodeURIComponent(filing.host)}${filing.context.slug === NOTE.slug ? "" : `/${filing.context.slug}`}`;
  const address = `autonomous.feedback/${filing.host}`;
  const about = filing.subject ? ` about ${filing.subject.name}` : "";
  const post = `${filing.context.title}${about} for ${filing.host}: "${excerpt(filing.note)}" (via ${address})`;
  const contact = site.contact || {};
  // A post that names the owner's handle reaches them as a mention.
  const bskyPost = contact.bluesky ? `@${contact.bluesky} ${post}` : post;
  const xPost = contact.x ? `@${contact.x} ${post}` : post;
  const dms = [
    contact.bluesky ? `<a class="door" data-share="dm" target="_blank" rel="noopener" href="https://bsky.app/profile/${encodeURIComponent(contact.bluesky)}"><strong>Message on Bluesky</strong><span>@${escapeHtml(contact.bluesky)}</span></a>` : "",
    contact.x ? `<a class="door" data-share="dm" target="_blank" rel="noopener" href="https://x.com/${encodeURIComponent(contact.x)}"><strong>Message on X</strong><span>@${escapeHtml(contact.x)}</span></a>` : "",
  ].filter(Boolean);
  // Delivery instructions only when the writer is the one who delivers it.
  const sendTo = dms.length && !filing.stored
    ? `<section class="send-to" aria-labelledby="send-title">
  <h2 id="send-title">Send it to ${escapeHtml(display)}</h2>
  <p class="note">Save the image or copy the text first: a link can open ${escapeHtml(display)}'s profile, but it cannot fill in a direct message. Use Message on the profile, then paste or attach the card.</p>
  <div class="actions">
    ${dms.join("\n    ")}
  </div>
</section>`
    : "";
  return layout({
    title: `${filing.context.title} for ${filing.host} — autonomous.feedback`,
    description: `A card with feedback for ${filing.host}, ready to send.`,
    canonical: `${ORIGIN}${back}`,
    quiet: true,
    embed,
    script: CLIENT_SCRIPT,
    themeCss: themeCss(site.theme),
    body: `${embed ? "" : kicker()}
<h1>${filing.stored ? `Sent to ${escapeHtml(display)}` : "Your card is ready"}</h1>
${site.thanks ? `<p class="owner-thanks"><strong>${escapeHtml(display)}:</strong> ${escapeHtml(site.thanks)}</p>` : ""}
<p class="lede">${filing.worded === false ? "No written detail. This is a count of what you picked. " : ""}${filing.stored
    ? "It is in their inbox now. Keep a copy or pass it on if you like."
    : filing.queue === "full"
      ? `${escapeHtml(display)}'s inbox is full, so this one was not kept. Send the card yourself:`
      : filing.queue === "requested"
        ? `${escapeHtml(display)} has asked for an inbox, but it is not open yet, so this was not kept. Send the card yourself:`
        : dms.length
          ? `Send it to ${escapeHtml(display)}: save the image or copy the text, then message them below. Or post it and mention them.`
          : `Send it to whoever runs ${escapeHtml(display)}: save the image or copy the text, then message them or post about it.`}</p>
${cardMarkup({ context: filing.context, host: filing.host, note: filing.note, issued: filing.issued, id: "card", name: site.name, from: filing.from, path: filing.path, routeName: filing.route, subject: filing.subject?.name || "", thread: filing.thread?.name || "", asks: filing.asks || [], worded: filing.worded !== false })}
${filing.thread?.stance ? `<section class="stance-reply" aria-labelledby="stance-title">
  <h2 id="stance-title">${escapeHtml(display)} has said about this</h2>
  <p class="note">Written before your note, for everyone who raises it.</p>
  <blockquote>${escapeHtml(filing.thread.stance)}</blockquote>
  ${filing.thread.link ? `<p><a href="https://${escapeHtml(filing.host)}${escapeHtml(filing.thread.link)}">Read more on ${escapeHtml(filing.host)}</a></p>` : ""}
</section>` : ""}
<div class="actions share" data-share-text="${escapeHtml(post)}" data-share-url="https://${escapeHtml(address)}" data-file-name="feedback-${escapeHtml(filing.host)}-${escapeHtml(filing.issued.slice(0, 10))}.png">
  <button type="button" class="door" data-save-image hidden><strong>Save image</strong><span>PNG, made on this device</span></button>
  <button type="button" class="door" data-share="native" hidden><strong>Share</strong><span>from this device</span></button>
  <a class="door" data-share="post" target="_blank" rel="noopener" href="https://bsky.app/intent/compose?text=${encodeURIComponent(bskyPost)}"><strong>Post</strong><span>on Bluesky${contact.bluesky ? `, mentioning @${escapeHtml(contact.bluesky)}` : ""}</span></a>
  <a class="door" data-share="post" target="_blank" rel="noopener" href="https://x.com/intent/post?text=${encodeURIComponent(xPost)}"><strong>Post</strong><span>on X${contact.x ? `, mentioning @${escapeHtml(contact.x)}` : ""}</span></a>
  <button type="button" class="door" data-copy="slip"><strong>Copy text</strong><span>as Markdown</span></button>
</div>
${sendTo}
<p class="note">${filing.stored
    ? "Kept for three days, longer if they save it. After that it becomes a count, and the words are deleted."
    : "Nothing was stored. The card lives on this page and in whatever you save or send."}</p>
<pre id="slip" hidden>${escapeHtml(filing.markdown)}</pre>
<p class="actions"><a class="door" href="${escapeHtml(back)}"><strong>Write another</strong><span>for ${escapeHtml(filing.host)}</span></a></p>`,
  });
}

export function renderNotFound(message = "There is nothing at this address.") {
  return layout({
    title: "Not found — autonomous.feedback",
    description: message,
    canonical: `${ORIGIN}/`,
    quiet: true,
    body: `${kicker()}
<h1>Not found</h1>
<p class="lede">${escapeHtml(message)}</p>
<p class="actions"><a class="door" href="/"><strong>Start over</strong><span>autonomous.feedback</span></a></p>`,
  });
}

const DAY_MS = 24 * 60 * 60 * 1000;

function compactsOn(issued) {
  return new Date(Date.parse(issued) + 3 * DAY_MS).toISOString().slice(0, 10);
}

function keyForm({ action, label, hint, error = "", button }) {
  return `<form method="post" action="${escapeHtml(action)}" class="panel">
  <input type="hidden" name="action" value="open">
  <label for="key">${escapeHtml(label)}</label>
  <p class="hint" id="key-hint">${escapeHtml(hint)}</p>
  ${fieldError("key-error", error)}
  <input id="key" name="key" type="password" autocomplete="current-password" spellcheck="false" autocapitalize="none" required aria-describedby="key-hint${error ? " key-error" : ""}"${error ? ` aria-invalid="true" autofocus` : ""}>
  <p class="actions"><button type="submit">${escapeHtml(button)}</button></p>
</form>`;
}

/** The inbox before a key opens it, or while no desk is open for the site. */
export function renderInboxLock({ host, desk = "none", error = "" }) {
  const lede = desk === "open"
    ? `Enter the inbox key for ${escapeHtml(host)}.`
    : desk === "requested"
      ? `${escapeHtml(host)} has asked for an inbox. It is not open yet, so readers still send cards by hand and nothing is kept.`
      : `${escapeHtml(host)} has no inbox. Readers send cards by hand.`;
  return layout({
    title: `Inbox for ${host} — autonomous.feedback`,
    description: `The inbox for ${host}.`,
    canonical: `${ORIGIN}/${encodeURIComponent(host)}/inbox`,
    quiet: true,
    body: `${kicker()}
<h1>Inbox for ${escapeHtml(host)}</h1>
<p class="lede">${lede}</p>
${desk === "open" ? keyForm({ action: `/${encodeURIComponent(host)}/inbox`, label: "Inbox key", hint: "The key you kept when you added its hash to your file. It stays in this browser for 12 hours.", error, button: "Open the inbox" }) : `<p class="note"><a href="/start?host=${encodeURIComponent(host)}#config-title">How an inbox opens</a></p>`}`,
  });
}

const INBOX_NOTICES = Object.freeze({
  saved: "Saved. It keeps its words until you release it.",
  released: "Released. It will be counted once it is three days old.",
  deleted: "Deleted.",
  missing: "That card is no longer here.",
});

/** Names for what the counts are about: the creator's subject and common-note names, else the page as filed. */
function labels(config) {
  const subjects = new Map((config?.subjects || []).map((sub) => [sub.id, sub]));
  return {
    about: (about) => subjects.get(about)?.name || about || "Unsorted",
    thread: (about, thread) => thread === "thanks" ? "Thanks" : subjects.get(about)?.threads.find((t) => t.id === thread)?.name || thread,
  };
}

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function inboxCard(host, config, note, actions, { hint = "", fresh = false } = {}) {
  const name = labels(config);
  const context = contextBySlug(note.context) || { title: note.title, operator: "frame", expression: "" };
  const subject = note.subject ? name.about(note.subject) : "";
  const thread = note.thread && note.thread !== "thanks" ? name.thread(note.subject, note.thread) : "";
  return `<li${fresh ? ' class="fresh"' : ""}>
    ${fresh ? `<p class="fresh-mark">New since your last visit</p>` : ""}
    ${cardMarkup({ context, host, note: note.note, issued: note.issued, name: config?.name || "", from: note.from || "", path: note.path || "", routeName: note.route || "", subject, thread, sample: true, worded: note.worded !== false })}
    ${hint ? `<p class="hint">${hint}</p>` : ""}
    <form method="post" action="/${encodeURIComponent(host)}/inbox" class="actions">
      <input type="hidden" name="id" value="${escapeHtml(note.id)}">
      ${actions}
      <button type="submit" name="action" value="delete" class="secondary">Delete</button>
    </form>
  </li>`;
}

/** Counts as a table: used for the desk's compaction preview. */
function tallyTable(tallies, config = null) {
  if (!tallies.length) return `<p class="note">Nothing has been counted yet.</p>`;
  const name = labels(config);
  const rows = tallies.map((t) => `<tr><td>${escapeHtml(t.week)}</td><td>${escapeHtml(name.about(t.about))}</td><td>${t.thread ? escapeHtml(name.thread(t.about, t.thread)) : "—"}</td><td>${escapeHtml(contextBySlug(t.kind)?.title || t.kind)}</td><td class="num">${t.cards}</td><td class="num">${t.worded}</td></tr>`).join("\n      ");
  return `<div class="table-scroll"><table class="tally">
    <thead><tr><th scope="col">Week of</th><th scope="col">About</th><th scope="col">Common note</th><th scope="col">Kind</th><th scope="col" class="num">Cards</th><th scope="col" class="num">In own words</th></tr></thead>
    <tbody>
      ${rows}
    </tbody>
  </table></div>`;
}

/** One week in the owner's words: what came in, grouped by what it was about. */
function weekDigest(week, config) {
  const name = labels(config);
  const kindsOf = (kinds) => Object.entries(kinds).map(([k, n]) => `${n} ${k === NOTE.slug ? "untagged" : (contextBySlug(k)?.title || k).toLowerCase()}`).join(", ");
  const items = week.groups.map((g) => `<li><strong>${escapeHtml(name.about(g.about))}</strong>${g.thread ? ` · ${escapeHtml(name.thread(g.about, g.thread))}` : ""} <span class="n">${g.cards}</span> <span class="hint">${g.thread ? (g.worded ? `${g.worded} in their own words` : "all one-tap") : escapeHtml(kindsOf(g.kinds))}</span></li>`);
  if (week.thanks) items.push(`<li><strong>Thanks</strong> <span class="n">${week.thanks}</span></li>`);
  const hints = week.hints.map((h) => `<p class="hint map-hint"><strong>${escapeHtml(name.about(h.about))}:</strong> ${plural(h.cards, "note")} joined no common note. If they share a theme, add one to your file so the next reader can tap it.</p>`).join("");
  return `<ul class="digest">${items.join("")}</ul>${hints}`;
}

/** An open inbox: the week at a glance, what is due, then the cards themselves. */
export function renderInbox({ host, config = null, notes = [], summary = { due: 0, weeks: [] }, seen = "", limit = 10, done = "", role = "owner" }) {
  const display = config?.name || host;
  const saved = notes.filter((n) => n.saved);
  const fresh = notes.filter((n) => !n.saved);
  const full = saved.length >= limit;
  const isNew = (n) => Boolean(seen) && n.issued > seen;
  const notice = done === "limit"
    ? `You have saved ${plural(limit, "card")}, the most this inbox keeps. Release one to save another.`
    : INBOX_NOTICES[done] || "";
  const [thisWeek, ...earlier] = summary.weeks;
  const savedList = saved.length
    ? `<ul class="inbox">${saved.map((n) => inboxCard(host, config, n, `<button type="submit" name="action" value="release">Release</button>`)).join("\n")}</ul>`
    : `<p class="note">Nothing saved yet. Saving keeps a card's words past three days.</p>`;
  const freshList = fresh.length
    ? `<ul class="inbox">${fresh.map((n) => inboxCard(host, config, n, `<button type="submit" name="action" value="save"${full ? " disabled" : ""}>Save</button>`, { hint: `Counted on ${escapeHtml(compactsOn(n.issued))} unless you save it.`, fresh: isNew(n) })).join("\n")}</ul>`
    : `<p class="note">No new cards.</p>`;
  const newCount = fresh.filter(isNew).length;
  return layout({
    title: `Inbox for ${host} — autonomous.feedback`,
    description: `The inbox for ${host}.`,
    canonical: `${ORIGIN}/${encodeURIComponent(host)}/inbox`,
    quiet: true,
    body: `${kicker()}
<h1>${escapeHtml(display)}'s inbox</h1>
<p class="lede">${newCount ? `${plural(newCount, "new card")} since your last visit. ` : ""}Cards wait here three days. Save the ones worth keeping; the rest become counts, and their words are deleted.</p>
${notice ? `<p class="panel" role="status">${escapeHtml(notice)}</p>` : ""}
${summary.due ? `<p class="panel due" role="status"><strong>${plural(summary.due, "card")} ${summary.due === 1 ? "is" : "are"} counted within a day.</strong> <a href="#new">Save the ones worth keeping</a>.</p>` : ""}
<section aria-labelledby="week-title">
  <h2 id="week-title">This week${thisWeek ? ` <span class="hint">since ${escapeHtml(thisWeek.week)} · ${plural(thisWeek.cards, "note")}</span>` : ""}</h2>
  ${thisWeek ? weekDigest(thisWeek, config) : `<p class="note">Nothing yet this week.</p>`}
  ${earlier.length ? `<details><summary>Earlier weeks</summary>${earlier.map((w) => `<h3>Week of ${escapeHtml(w.week)} <span class="hint">${plural(w.cards, "note")}</span></h3>${weekDigest(w, config)}`).join("")}</details>` : ""}
</section>
<h2 id="new">New <span class="hint">${fresh.length}</span></h2>
${freshList}
<h2>Saved <span class="hint">${saved.length} of ${limit}</span></h2>
${savedList}
<form method="post" action="/${encodeURIComponent(host)}/inbox" class="actions">
  <input type="hidden" name="action" value="close">
  <button type="submit" class="secondary">Close the inbox on this browser</button>
  ${role === "operator" ? `<a class="door" href="/desk"><strong>Desk</strong><span>every open inbox</span></a>` : ""}
</form>`,
  });
}

export function renderDeskLock({ error = "" }) {
  return layout({
    title: "Desk — autonomous.feedback",
    description: "Every open inbox.",
    canonical: `${ORIGIN}/desk`,
    quiet: true,
    body: `${kicker()}
<h1>Desk</h1>
<p class="lede">Every open inbox, for the operator.</p>
${keyForm({ action: "/desk", label: "Operator token", hint: "INBOX_READ_TOKEN. It stays in this browser for 12 hours.", error, button: "Open the desk" })}`,
  });
}

/** The operator's desk: each open inbox with its counts and what the next compaction would count. */
export function renderDesk({ sites = [], limit = 10, compacted = null }) {
  const rows = sites.map((site) => {
    const inbox = `/${encodeURIComponent(site.host)}/inbox`;
    if (site.state !== "open") {
      return `<section class="panel" aria-labelledby="desk-${escapeHtml(site.host)}">
  <h2 id="desk-${escapeHtml(site.host)}">${escapeHtml(site.host)}</h2>
  <p class="note">Listed in DESK_HOSTS, but the site's file does not ask for an inbox (queue.want), so nothing is kept.</p>
</section>`;
    }
    const due = site.due.reduce((sum, t) => sum + t.cards, 0);
    return `<section class="panel" aria-labelledby="desk-${escapeHtml(site.host)}">
  <h2 id="desk-${escapeHtml(site.host)}"><a href="${inbox}">${escapeHtml(site.host)}</a></h2>
  <p>${site.unsaved} new · ${site.saved} of ${limit} saved${site.oldest ? ` · oldest new card ${escapeHtml(site.oldest.slice(0, 10))}` : ""}</p>
  ${due
    ? `<p>Next compaction counts ${due} card${due === 1 ? "" : "s"}:</p>${tallyTable(site.due, site.config)}
  <form method="post" action="/desk" class="actions">
    <input type="hidden" name="action" value="compact">
    <input type="hidden" name="host" value="${escapeHtml(site.host)}">
    <button type="submit">Compact now</button>
  </form>`
    : `<p class="note">Nothing is due. New cards compact three days after they arrive.</p>`}
</section>`;
  }).join("\n");
  return layout({
    title: "Desk — autonomous.feedback",
    description: "Every open inbox.",
    canonical: `${ORIGIN}/desk`,
    quiet: true,
    body: `${kicker()}
<h1>Desk</h1>
<p class="lede">Every open inbox. Unsaved cards older than three days are compacted on a schedule; Compact now runs it for one site.</p>
${compacted ? `<p class="panel" role="status">Compacted ${compacted.count} card${compacted.count === 1 ? "" : "s"} for ${escapeHtml(compacted.host)}.</p>` : ""}
${rows || `<p class="note">No site is listed in DESK_HOSTS.</p>`}
<form method="post" action="/desk" class="actions">
  <input type="hidden" name="action" value="close">
  <button type="submit" class="secondary">Close the desk on this browser</button>
</form>`,
  });
}
