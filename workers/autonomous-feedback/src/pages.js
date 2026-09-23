import { escapeHtml, layout } from "../../lib/shell.js";
import { CONTEXTS, DEFAULT_KIND, NOTE_MAX, NOTE_MIN, cleanPath, contextBySlug, isPublicSite } from "./model.js";
import { CLIENT_SCRIPT } from "./client.js";
import { CONFIG_PATH, configToFile, defaultConfig, siteKinds, starterConfig, themeCss } from "./config.js";

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
    where: "Paste it where readers should find it, such as your footer or an About page.",
    language: "html",
    template: `<a href="${ORIGIN}/{{host}}/{{kind}}">Send feedback</a>`,
  },
  frame: {
    label: "Frame",
    choice: "The form inside your page. Readers can switch between the kinds of note you offer.",
    where: "Paste it where the form should appear. It is 560 pixels tall; change height to fit.",
    language: "html",
    template: `<iframe title="Feedback for {{host}}" src="${ORIGIN}/embed/{{host}}/{{kind}}" width="100%" height="560" style="border:0" loading="lazy"></iframe>`,
  },
  form: {
    label: "HTML form",
    choice: "A plain form that sends one kind of note. No script, styled by your own CSS.",
    where: "Paste it where the form should appear. Readers land on their card after sending.",
    language: "html",
    template: `<form method="post" action="${ORIGIN}/{{host}}">
  <input type="hidden" name="kind" value="{{kind}}">
  <label for="feedback-note">{{title}} for {{host}}</label>
  <textarea id="feedback-note" name="note" rows="5" minlength="${NOTE_MIN}" maxlength="${NOTE_MAX}" required></textarea>
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
function cardMarkup({ context, host, note, issued, id = "", sample = false, name = "", from = "", path = "", routeName = "" }) {
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
    ${path ? `<span class="card-route">${escapeHtml(routeName ? `${routeName} · ${path}` : path)}</span>` : ""}
  </header>
  <blockquote class="card-note">${escapeHtml(note)}</blockquote>
  ${from ? `<p class="card-from">— ${escapeHtml(from)}</p>` : ""}
  <footer>
    <time datetime="${escapeHtml(issued)}">${escapeHtml(day)}</time>
    <span class="card-address">${escapeHtml(address)}</span>
  </footer>
  ${sample ? "" : `<p class="card-stamp" data-stamp></p>`}
</article>`;
}

function routeField(routes, path) {
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
  return `<fieldset id="page">
  <legend>Page</legend>
  ${choices}
  <label for="path">Path</label>
  <p class="hint" id="path-hint">Where on the site this happened, like /checkout. Optional.</p>
  <input id="path" name="path" type="text" value="${escapeHtml(clean)}" placeholder="/checkout" maxlength="200" spellcheck="false" autocapitalize="none" aria-describedby="path-hint">
</fieldset>`;
}

function kindLinks(host = "", embed = false, current = "") {
  const items = CONTEXTS.map((c) => {
    const href = host ? `${embed ? "/embed" : ""}/${encodeURIComponent(host)}/${c.slug}` : `/${c.slug}`;
    const here = c.slug === current ? ` aria-current="page"` : "";
    return `<li><a class="door" href="${href}"${here}><strong>${escapeHtml(c.title)}</strong><span>${escapeHtml(c.prompt)}</span></a></li>`;
  }).join("\n  ");
  return `<ul class="doors">\n  ${items}\n</ul>`;
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
  <li><strong>A reader writes a note.</strong> They say what broke, what was confusing, what was missing, or what was wrong, and which page.</li>
  <li><strong>The reader sends you the card.</strong> They save the image or copy the text and send it by direct message, or in a post that mentions your site.</li>
</ol>
<h2>What it costs</h2>
<ol class="steps">
  <li><strong>Any site: free.</strong> <span>Readers can write about any public site. The card travels by hand, and nothing is kept.</span></li>
  <li><strong>Your site: free.</strong> <span>Publish one file to choose the kinds of note, name your pages, match your colours, and say where you take messages. <a href="/start">The setup page</a> writes it for you.</span></li>
  <li><strong>An inbox: on request.</strong> <span>Add <code>"queue": { "want": true }</code> to your file to ask for one. An inbox keeps every card for your site in one place. Until yours opens, nothing is kept.</span></li>
</ol>
<h2>Write a note about a site</h2>
${kindLinks()}`,
  });
}

export function renderStart({ host = "", how = "link", kind = DEFAULT_KIND, error = "", config = null, desk = "none" } = {}) {
  const offered = config?.found ? siteKinds(config) : CONTEXTS;
  const context = offered.find((c) => c.slug === (contextBySlug(kind)?.slug)) || offered[0];
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
    <legend>Kind of note it starts on</legend>
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
  <p>Write a note yourself at <a data-fill="test-link" href="/${encodeURIComponent(named)}/${context.slug}">autonomous.feedback/${escapeHtml(named)}/${context.slug}</a>, or send one from a terminal:</p>
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
      <dt><code>labels</code></dt><dd>Rename a kind and change its prompt or example. Title up to 40 characters, prompt up to 160.</dd>
      <dt><code>name</code>, <code>intro</code>, <code>button</code></dt><dd>Your site's display name, a line above the form (up to 300 characters), and the submit button text.</dd>
      <dt><code>contact</code></dt><dd>Where you take cards by direct message: <code>{ "bluesky": "example.com", "x": "example" }</code>. The card page shows Message buttons and puts your handle in the Post links.</dd>
      <dt><code>from</code></dt><dd><code>"off"</code>, <code>"optional"</code>, or <code>"required"</code>: a field for the writer's name or handle, printed on the card. Nothing is stored either way. Do not put a token or password in this file.</dd>
      <dt><code>note</code></dt><dd><code>min</code> and <code>max</code> characters, between 1 and ${NOTE_MAX.toLocaleString("en-US")}.</dd>
      <dt><code>queue.want</code></dt><dd><code>true</code> asks for an inbox that keeps each card for your site. Until the inbox opens, nothing is kept and readers send cards by hand. The status above says which.</dd>
      <dt><code>frame.ancestors</code></dt><dd>Other https origins that may show the frame, such as a blog on a different domain. Up to 10.</dd>
      <dt><code>theme</code></dt><dd><code>mode</code> (<code>"light"</code> or <code>"dark"</code>), <code>background</code>, <code>text</code>, and <code>accent</code> as hex colours, <code>corners</code> (<code>"sharp"</code>, <code>"round"</code>, <code>"soft"</code>), and <code>font</code> (<code>"system"</code>, <code>"serif"</code>, <code>"mono"</code>, <code>"rounded"</code>). Colours that are hard to read are replaced with the defaults.</dd>
    </dl>
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
    ? `<p><strong>Inbox: open.</strong> Cards for ${escapeHtml(host)} are kept.</p>`
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
  <a class="door" href="/${encodeURIComponent(host)}/${DEFAULT_KIND}"><strong>Write a note</strong><span>about ${escapeHtml(host)}</span></a>
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
  context = kindsShown.find((k) => k.slug === context.slug) || kindsShown[0];
  const display = site.name || host;
  const heading = site.title || (lockHost ? `Feedback for ${display}` : "Write feedback");
  const root = embed ? "/embed" : "";
  const action = lockHost ? `${root}/${encodeURIComponent(host)}` : `/${context.slug}`;
  const canonical = lockHost ? `${ORIGIN}${root}/${encodeURIComponent(host)}/${context.slug}` : `${ORIGIN}/${context.slug}`;
  const note = values.note ?? "";
  const kinds = kindsShown.map((c) => `<label class="choice compact">
      <input type="radio" name="kind" value="${c.slug}"${c.slug === context.slug ? " checked" : ""} data-prompt="${escapeHtml(c.prompt)}" data-example="${escapeHtml(c.example)}" data-href="${root}${lockHost ? `/${encodeURIComponent(host)}` : ""}/${c.slug}">
      <span><strong>${escapeHtml(c.title)}</strong><span>${escapeHtml(c.prompt)}</span></span>
    </label>`).join("\n      ");
  const noteDescribed = ["note-hint", "note-count", errors.note ? "note-error" : ""].filter(Boolean).join(" ");
  const listed = [["host", errors.host], ["from", errors.from], ["note", errors.note], ["kind", errors.kind]].filter(([, m]) => m);
  const summary = listed.length
    ? `<div class="error-summary" role="alert" tabindex="-1" data-error-summary><p>The card was not made. Fix ${listed.length > 1 ? "these" : "this"} and send again:</p><ul>${listed.map(([id, m]) => `<li><a href="#${id === "kind" ? "kinds" : id}">${escapeHtml(m)}</a></li>`).join("")}</ul></div>`
    : "";
  const fromField = site.from === "off" ? "" : `<label for="from">Your name or handle${site.from === "optional" ? " (optional)" : ""}</label>
  <p class="hint" id="from-hint">Printed on the card so the owner knows who wrote it. Not stored.</p>
  ${fieldError("from-error", errors.from)}
  <input id="from" name="from" type="text" value="${escapeHtml(values.from ?? "")}" maxlength="80" autocomplete="nickname" aria-describedby="from-hint${errors.from ? " from-error" : ""}"${site.from === "required" ? " required" : ""}${errors.from ? ` aria-invalid="true"` : ""}>`;
  return layout({
    title: `${heading} — autonomous.feedback`,
    description: lockHost ? `Write a note about ${host} and get a card to send to its owner.` : "Write a note about any site and get a card to send to its owner.",
    canonical,
    quiet: true,
    embed,
    script: CLIENT_SCRIPT,
    themeCss: themeCss(site.theme),
    body: `${embed ? "" : kicker()}
<h1>${escapeHtml(heading)}</h1>
${lockHost && isPublicSite(host) ? `<p class="visit"><a href="https://${escapeHtml(host)}/">Open ${escapeHtml(host)}</a></p>` : ""}
${site.intro ? `<p class="lede">${escapeHtml(site.intro)}</p>` : ""}
${embed ? "" : `<p class="${site.intro ? "note" : "lede"}">${desk === "open"
    ? `Your note is kept for ${escapeHtml(display)}, and becomes a card you can also save and send.`
    : lockHost
      ? `Your note becomes a card you can save and send to whoever runs ${escapeHtml(display)}. Nothing is stored.`
      : "Your note becomes a card you can save and send to whoever runs the site. Nothing is stored unless the site has an inbox."}</p>`}
${summary}
<form method="post" action="${escapeHtml(action)}" class="panel" id="write" data-draft-key="${escapeHtml(lockHost ? host : "")}">
  <fieldset id="kinds"${kindsShown.length === 1 ? " hidden" : ""}>
    <legend>Kind of note</legend>
    ${fieldError("kind-error", errors.kind)}
    <div class="choices">
      ${kinds}
    </div>
  </fieldset>
  ${kindsShown.length === 1 ? `<input type="hidden" name="kind" value="${context.slug}">` : ""}
  ${routeField(site.routes || [], values.path ?? "")}
  ${lockHost ? `<input type="hidden" name="host" value="${escapeHtml(host)}">` : hostField({ host: values.host ?? host, error: errors.host, label: "Site the note is about", hint: "A domain like example.com." })}
  ${fromField}
  <label for="note">${kindsShown.length === 1 ? escapeHtml(context.title) : "Your note"}</label>
  <p class="hint" id="note-hint" data-fill="prompt">${escapeHtml(context.prompt)}</p>
  ${fieldError("note-error", errors.note)}
  <textarea class="note" id="note" name="note" rows="6" required minlength="${site.note.min}" maxlength="${site.note.max}" placeholder="For example: ${escapeHtml(context.example)}" aria-describedby="${noteDescribed}"${errors.note ? ` aria-invalid="true"` : ""} enterkeyhint="send">${escapeHtml(note)}</textarea>
  <p class="count" id="note-count"><span data-count>${note.length}</span> of ${site.note.max.toLocaleString("en-US")} characters, at least ${site.note.min}</p>
  <div class="hp" aria-hidden="true">
    <label for="company">Leave this empty</label>
    <input id="company" name="company" tabindex="-1" autocomplete="off">
  </div>
  <p class="actions"><button type="submit" data-pending="Making the card…">${escapeHtml(site.button)}</button></p>
</form>
${embed ? "" : `<p class="note">Run a site? <a href="/start">Set up a form for it</a>.</p>`}`,
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
  const back = `${root}/${encodeURIComponent(filing.host)}/${filing.context.slug}`;
  const address = `autonomous.feedback/${filing.host}`;
  const post = `${filing.context.title} for ${filing.host}: "${excerpt(filing.note)}" (via ${address})`;
  const contact = site.contact || {};
  // A post that names the owner's handle reaches them as a mention.
  const bskyPost = contact.bluesky ? `@${contact.bluesky} ${post}` : post;
  const xPost = contact.x ? `@${contact.x} ${post}` : post;
  const dms = [
    contact.bluesky ? `<a class="door" data-share="dm" target="_blank" rel="noopener" href="https://bsky.app/profile/${encodeURIComponent(contact.bluesky)}"><strong>Message on Bluesky</strong><span>@${escapeHtml(contact.bluesky)}</span></a>` : "",
    contact.x ? `<a class="door" data-share="dm" target="_blank" rel="noopener" href="https://x.com/${encodeURIComponent(contact.x)}"><strong>Message on X</strong><span>@${escapeHtml(contact.x)}</span></a>` : "",
  ].filter(Boolean);
  const sendTo = dms.length
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
<h1>Your card is ready</h1>
<p class="lede">${filing.stored
    ? `Kept for ${escapeHtml(display)}. You can still save or share the card.`
    : filing.queue === "full"
      ? `The inbox for ${escapeHtml(display)} is full, so this card was not kept. Send it by hand, or ask them to clear the inbox.`
      : filing.queue === "requested"
        ? `${escapeHtml(display)} has asked for an inbox, but it is not open yet, so this card was not kept. Save it as an image or copy the text, and send it by hand.`
      : dms.length
        ? `Save it as an image or copy the text, then send it to ${escapeHtml(display)} in a direct message below, or in a post that mentions them.`
        : `Save it as an image or copy the text, then send it to whoever runs ${escapeHtml(display)}: in a direct message, or in a post that mentions the site.`}</p>
${cardMarkup({ context: filing.context, host: filing.host, note: filing.note, issued: filing.issued, id: "card", name: site.name, from: filing.from, path: filing.path, routeName: filing.route })}
<div class="actions share" data-share-text="${escapeHtml(post)}" data-share-url="https://${escapeHtml(address)}" data-file-name="feedback-${escapeHtml(filing.host)}-${escapeHtml(filing.issued.slice(0, 10))}.png">
  <button type="button" class="door" data-save-image hidden><strong>Save image</strong><span>PNG, made on this device</span></button>
  <button type="button" class="door" data-share="native" hidden><strong>Share</strong><span>from this device</span></button>
  <a class="door" data-share="post" target="_blank" rel="noopener" href="https://bsky.app/intent/compose?text=${encodeURIComponent(bskyPost)}"><strong>Post</strong><span>on Bluesky${contact.bluesky ? `, mentioning @${escapeHtml(contact.bluesky)}` : ""}</span></a>
  <a class="door" data-share="post" target="_blank" rel="noopener" href="https://x.com/intent/post?text=${encodeURIComponent(xPost)}"><strong>Post</strong><span>on X${contact.x ? `, mentioning @${escapeHtml(contact.x)}` : ""}</span></a>
  <button type="button" class="door" data-copy="slip"><strong>Copy text</strong><span>as Markdown</span></button>
</div>
${sendTo}
<p class="note">${filing.stored
    ? "Kept in the inbox for this site. The card is also on this page."
    : "Nothing was stored. The card exists on this page and in anything you save or send."}</p>
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
