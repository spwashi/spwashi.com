import { escapeHtml, layout } from "../../lib/shell.js";
import { LISTED, NOTE, cleanPath, contextBySlug } from "./model.js";
import { CLIENT_SCRIPT } from "./client.js";
import { defaultConfig, siteKinds, subjectFor, themeCss } from "./config.js";

/**
 * Every page autonomous.feedback renders. Copy is plain on purpose: a reader
 * arrives with no context and should know what each control does from its
 * label alone. A note becomes a card its writer keeps; no page here says it
 * was sent anywhere, because nothing is.
 */

const ORIGIN = "https://autonomous.feedback";

function kicker() {
  return `<p class="kicker"><a href="/">autonomous.feedback</a></p>`;
}

function fieldError(id, message) {
  return message ? `<p class="error" id="${id}">${escapeHtml(message)}</p>` : "";
}

/** The page a card is about, as its address line reads: the site and, when known, the path. */
export const aboutAddress = (host, path = "") => `${host}${path && path !== "/" ? path : ""}`;

/** The card the card page renders. Its address is the work it is about, so a stranger who sees it reaches the work, not this form. */
function cardMarkup({ context, host, note, issued, id = "", name = "", from = "", path = "", routeName = "", subject = "", thread = "", asks = [], worded = true }) {
  const day = issued.slice(0, 10);
  const address = aboutAddress(host, path);
  const site = name || host;
  const data = ` data-kind="${escapeHtml(context.title)}" data-site="${escapeHtml(site)}" data-host="${escapeHtml(host)}" data-note="${escapeHtml(from ? `${note}\n\n— ${from}` : note)}" data-day="${escapeHtml(day)}" data-address="${escapeHtml(address)}"`;
  return `<article class="card"${id ? ` id="${id}"` : ""} data-spw-kind="frame" data-spw-operator="${escapeHtml(context.operator)}" data-spw-semantic-expression="${escapeHtml(context.expression)}"${data}>
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
    <span class="card-expression">${escapeHtml(context.expression || "")}</span>
    <span class="card-address">${escapeHtml(address)}</span>
  </footer>
  <p class="card-stamp" data-stamp></p>
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
  const picker = `${choices}
  <label for="path">Path</label>
  <p class="hint" id="path-hint">Where on the site this happened, like /about/. Optional.</p>
  <input id="path" name="path" type="text" value="${escapeHtml(clean)}" placeholder="/about/" maxlength="200" spellcheck="false" autocapitalize="none" aria-describedby="path-hint">`;
  // A page the form carries is shown, not asked: one the link named, the reader came from, or a form that came
  // back with its errors still holds. What will be sent is never folded away. The picker stays one click away.
  if (clean) {
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


/** The doors to the sites that link here. */
function siteDoors() {
  return `<p class="actions">
  ${LISTED.map((host) => `<a class="door" href="/${escapeHtml(host)}"><strong>${escapeHtml(host)}</strong><span>Write a note</span></a>`).join("\n  ")}
</p>`;
}

export function renderHome() {
  return layout({
    title: "autonomous.feedback — a note about a page",
    description: "Say what happened on a page, in a tap or a few words. You get a card to keep and send if you like. Nothing is stored.",
    canonical: `${ORIGIN}/`,
    quiet: true,
    body: `<p class="kicker">autonomous.feedback</p>
<h1>A note about a page</h1>
<p class="lede">Say what happened, in a tap or a few words. You get a card to keep, and send it if you like. Nothing is stored. A reply is not promised.</p>
<h2>Which site?</h2>
${siteDoors()}
<p class="note"><a href="/privacy">What happens to a note</a></p>`,
  });
}

/** The one place the mechanics live, so no form has to hedge. */
export function renderPrivacy() {
  return layout({
    title: "What happens to a note — autonomous.feedback",
    description: "Nothing you write is stored. The card is yours.",
    canonical: `${ORIGIN}/privacy`,
    quiet: true,
    body: `${kicker()}
<h1>What happens to a note</h1>
<p class="lede">Nothing you write is stored. The card exists on the page you get after making it, and in whatever you save or send.</p>
<h2>What is on a card</h2>
<p>What you wrote, the kind of note you chose, the page it is about when the link named one, and your name only if you wrote it.</p>
<h2>Where it goes</h2>
<p>Where you take it. Save it as an image, copy its text, message it, or post it. Nothing is sent for you.</p>
<h2>What stays in your browser</h2>
<p>A note you have not finished is kept in this tab so it is not lost if you step away. Making the card clears it.</p>
<h2>What is never kept</h2>
<p>There are no accounts, no cookies, and no counts. Like any website, requests are briefly logged by the hosting provider; what you write is in the request's body, not its address.</p>
<p class="actions"><a class="door" href="/"><strong>Write a note</strong><span>autonomous.feedback</span></a></p>`,
  });
}

/** A site this form does not take notes for. */
export function renderElsewhere(host) {
  return layout({
    title: "No form here — autonomous.feedback",
    description: "This form takes notes for a few sites only.",
    canonical: `${ORIGIN}/`,
    quiet: true,
    body: `${kicker()}
<h1>No form for ${escapeHtml(host)}</h1>
<p class="lede">This form takes notes for a few sites only. Nothing was stored.</p>
${siteDoors()}`,
  });
}

/**
 * The write page. The kind is a choice inside the form, so switching it keeps
 * the note; the URL only preselects it. `values` carries a failed submission
 * back into the fields.
 */
export function renderWrite({ context, host, values = {}, errors = {}, config = null }) {
  const site = config || defaultConfig(host);
  const kindsShown = siteKinds(site);
  // A kind is selected only when the link named it or the writer chose it; otherwise the note stays unsorted.
  const selected = kindsShown.find((k) => k.slug === contextBySlug(values.kind || context?.slug)?.slug) || null;
  context = selected || NOTE;
  const display = site.name || host;
  const aboutSite = site.about === "site";
  const heading = site.title || (aboutSite ? "A note about the site" : `A note for ${display}`);
  const tail = selected ? `/${selected.slug}` : "";
  const action = `/${encodeURIComponent(host)}`;
  const canonical = `${ORIGIN}/${encodeURIComponent(host)}${tail}`;
  const note = values.note ?? "";
  const today = new Date().toISOString().slice(0, 10);

  // The creator's map. Evidence picks the subject (the page, or a chip); nothing is guessed.
  const subjects = site.subjects || [];
  const chosenSubject = subjects.find((sub) => sub.id === values.subject) || (values.subject ? null : subjectFor(site, values.path ?? ""));
  // An unchosen card stays blank. The shop-shaped default would read as the note.
  const exampleText = chosenSubject?.example || (selected && context.slug !== NOTE.slug ? context.example : "");
  const chosenThread = chosenSubject?.threads.find((t) => values.thread === `${chosenSubject.id}:${t.id}` || values.thread === t.id) || null;
  const thanked = values.thread === "thanks";
  const prompt = chosenThread || thanked
    ? "Add a detail if you want. The choice is enough."
    : (chosenSubject?.prompt || context.prompt);

  const subjectLead = aboutSite ? "On" : "About";
  const subjectLegend = aboutSite ? "Where on the site?" : (site.about === "subject" ? "What is this about?" : `Which part of ${escapeHtml(display)}?`);
  const subjectChips = subjects.map((sub) => `<label class="chip"><input type="radio" name="subject" value="${escapeHtml(sub.id)}"${chosenSubject?.id === sub.id ? " checked" : ""} data-prompt="${escapeHtml(sub.prompt || NOTE.prompt)}" data-example="${escapeHtml(sub.example)}" data-name="${escapeHtml(sub.name)}"> <span>${escapeHtml(sub.name)}</span></label>`).join("\n      ");
  const subjectBlock = !subjects.length ? "" : chosenSubject
    ? `<div id="subjects" class="about-line">
    <p>${subjectLead} <strong data-fill="subject-name">${escapeHtml(chosenSubject.name)}</strong></p>
    <details>
      <summary>change</summary>
      <fieldset class="chips">
        <legend class="sr-only">${subjectLegend}</legend>
        ${fieldError("subject-error", errors.subject)}
        <div class="row">
      ${subjectChips}
        </div>
      </fieldset>
    </details>
  </div>`
    : `<fieldset id="subjects" class="chips">
    <legend>${subjectLegend}</legend>
    ${fieldError("subject-error", errors.subject)}
    <div class="row">
      ${subjectChips}
    </div>
  </fieldset>`;

  // "What is it" is one choice: a common note (the fast lane), a kind, or thanks. One radio group, so only one is ever sent.
  const threadRows = subjects.filter((sub) => sub.threads.length).map((sub) => `<div class="what-row threads" data-subject="${escapeHtml(sub.id)}" role="group" aria-labelledby="what-${escapeHtml(sub.id)}">
      <p class="row-caption" id="what-${escapeHtml(sub.id)}">${aboutSite ? "Often said about this part" : `Often said about ${escapeHtml(sub.name)}`}</p>
      <div class="row">
      ${sub.threads.map((t) => `<label class="chip"><input type="radio" name="what" value="${escapeHtml(`thread:${sub.id}:${t.id}`)}" data-kind-title="${escapeHtml(kindsShown.find((c) => c.slug === t.kind)?.title || NOTE.title)}" data-about="${escapeHtml(`${sub.name} · ${t.name}`)}" data-body="Count me too."${chosenThread === t && chosenSubject?.id === sub.id ? " checked" : ""}> <span>${escapeHtml(t.name)}</span></label>`).join("\n      ")}
      </div>
      ${sub.threads.filter((t) => t.stance).map((t) => `<p class="stance" data-for="${escapeHtml(`thread:${sub.id}:${t.id}`)}"><strong>${escapeHtml(display)}:</strong> ${escapeHtml(t.stance)}${t.link ? ` <a href="https://${escapeHtml(host)}${escapeHtml(t.link)}">More</a>` : ""}</p>`).join("\n      ")}
    </div>`).join("\n    ");

  const kindCaption = aboutSite ? "What happened on the site" : (subjects.some((sub) => sub.threads.length) ? "Or pick one" : "Pick one, or just write");
  const kinds = kindsShown.map((c) => `<label class="chip" data-kind="${c.slug}">
      <input type="radio" name="what" value="kind:${c.slug}"${selected?.slug === c.slug && !chosenThread && !thanked ? " checked" : ""} data-kind-title="${escapeHtml(c.title)}" data-expression="${escapeHtml(c.expression)}" data-prompt="${escapeHtml(c.prompt)}" data-body="${escapeHtml(c.tap)}">
      <span>${escapeHtml(c.title)}</span>
    </label>`).join("\n      ");
  const askBlocks = subjects.filter((sub) => sub.asks.length).map((sub) => `<details class="asks" data-subject="${escapeHtml(sub.id)}"${sub.asks.some((_, i) => values.asks?.[i]) ? " open" : ""}>
    <summary>Say more</summary>
    ${sub.asks.map((q, i) => `<label for="ask-${escapeHtml(sub.id)}-${i}">${escapeHtml(q)}</label>
    <textarea id="ask-${escapeHtml(sub.id)}-${i}" name="ask-${i}" rows="2" maxlength="2000" class="note ask">${escapeHtml(values.asks?.[i] || "")}</textarea>`).join("\n    ")}
  </details>`).join("\n  ");
  // Without script, the subject decides what shows through :has(); the script only mirrors text onto the card.
  const subjectCss = subjects.map((sub) => {
    const show = `.write:has(input[name="subject"][value="${sub.id}"]:checked) [data-subject="${sub.id}"] { display: block; }`;
    const hide = sub.kinds.length ? `.write:has(input[name="subject"][value="${sub.id}"]:checked) label.chip[data-kind]:not(${sub.kinds.map((k) => `[data-kind="${k}"]`).join(", ")}):not(:has(input:checked)) { display: none; }` : "";
    const stances = sub.threads.filter((t) => t.stance).map((t) => `.write:has(input[name="what"][value="thread:${sub.id}:${t.id}"]:checked) .stance[data-for="thread:${sub.id}:${t.id}"] { display: block; }`).join("\n");
    return [show, hide, stances].filter(Boolean).join("\n");
  }).join("\n");

  const noteDescribed = ["note-hint", errors.note ? "note-error" : ""].filter(Boolean).join(" ");
  const listed = [["note", errors.note], ["subjects", errors.subject], ["kinds", errors.kind], ["from", errors.from]].filter(([, m]) => m);
  const summary = listed.length
    ? `<div class="error-summary" role="alert" tabindex="-1" data-error-summary><p>Not sent yet:</p><ul>${listed.map(([id, m]) => `<li><a href="#${id}">${escapeHtml(m)}</a></li>`).join("")}</ul></div>`
    : "";
  // The card as it will read: the header follows the choices, the body is what you write.
  const titled = (slug) => kindsShown.find((c) => c.slug === slug)?.title || "";
  const cardKind = thanked ? (titled("appreciation") || "Appreciation") : chosenThread ? (titled(chosenThread.kind) || NOTE.title) : context.title;
  const cardAbout = chosenThread ? `${chosenSubject.name} · ${chosenThread.name}` : chosenSubject?.name || "";
  const placeholder = thanked ? "Thanks." : chosenThread ? "Count me too." : selected?.tap || exampleText || "";
  const fromLine = site.from === "off" ? "" : `<p class="card-from-line"><label for="from" class="sr-only">Your name or handle</label>— <input id="from" name="from" type="text" value="${escapeHtml(values.from ?? "")}" maxlength="80" autocomplete="nickname" placeholder="${site.from === "required" ? "your name" : "your name, if you like"}"${site.from === "required" ? " required" : ""}${errors.from ? ` aria-invalid="true"` : ""}></p>`;
  const button = site.button || "Make my card";
  const courtesy = `You keep the card for ${escapeHtml(display)}. Nothing is stored, and a reply is not promised.`;
  return layout({
    title: `${heading} — autonomous.feedback`,
    description: `Say what happened on ${host}, in a tap or a few words.`,
    canonical,
    quiet: true,
    script: CLIENT_SCRIPT,
    themeCss: `${themeCss(site.theme)}\n${subjectCss}`,
    body: `<p class="kicker"><a href="/">autonomous.feedback</a> · <a href="https://${escapeHtml(host)}/">Open ${escapeHtml(host)}</a></p>
<h1 class="write-title">${escapeHtml(heading)}</h1>
${site.intro ? `<p class="lede">${escapeHtml(site.intro)}</p>` : ""}
${summary}
<form method="post" action="${escapeHtml(action)}" class="write" id="write" data-draft-key="${escapeHtml(host)}" data-button="${escapeHtml(button)}">
  ${subjectBlock}
  <fieldset id="what" class="chips what">
    <legend class="sr-only">What is it?</legend>
    ${fieldError("kind-error", errors.kind)}
    ${aboutSite ? "" : threadRows}
    <div class="what-row" role="group" aria-labelledby="what-kinds"${kindsShown.length === 1 ? " hidden" : ""}>
      <p class="row-caption" id="what-kinds">${kindCaption}</p>
      <div class="row">
      ${kinds}
      ${kindsShown.some((c) => c.slug === "appreciation") ? `<label class="chip"><input type="radio" name="what" value="thanks" data-kind-title="${escapeHtml(kindsShown.find((c) => c.slug === "appreciation")?.title || "Appreciation")}" data-expression="${escapeHtml(kindsShown.find((c) => c.slug === "appreciation")?.expression || "")}" data-body="Thanks."${thanked ? " checked" : ""}> <span>Just saying thanks</span></label>` : ""}
      </div>
    </div>
    ${aboutSite ? threadRows : ""}
    <p class="clear-row"><button type="button" class="clear-what" data-clear-what hidden>Clear the choice</button></p>
  </fieldset>
  ${kindsShown.length === 1 ? `<input type="hidden" name="kind" value="${kindsShown[0].slug}">` : ""}
  <label for="note" class="question" data-fill="prompt" data-idle="${escapeHtml(NOTE.prompt)}">${escapeHtml(prompt)}</label>
  ${fieldError("note-error", errors.note)}
  <article class="card live" data-live-card aria-label="Your card">
    <header>
      <span class="card-kind" data-live="kind">${escapeHtml(cardKind)}</span>
      <span class="card-expression" data-live="expression"${selected ? "" : " hidden"}>${escapeHtml(selected ? context.expression : "")}</span>
      <span class="card-site">${escapeHtml(display || "your site")}</span>
      <span class="card-subject" data-live="about"${cardAbout ? "" : " hidden"}>${escapeHtml(cardAbout)}</span>
    </header>
    <textarea class="card-write" id="note" name="note" rows="3" maxlength="${site.note.max}" placeholder="${escapeHtml(placeholder)}" data-placeholder="${escapeHtml(exampleText || "")}" aria-describedby="${noteDescribed}" aria-keyshortcuts="Control+Enter Meta+Enter"${errors.note ? ` aria-invalid="true"` : ""}${chosenSubject?.threads.length || selected ? "" : " autofocus"}>${escapeHtml(note)}</textarea>
    ${fromLine}
    <footer>
      <time datetime="${today}">${today}</time>
      <span class="card-address">${escapeHtml(aboutAddress(host, cleanPath(values.path ?? "")))}</span>
    </footer>
  </article>
  <p class="sr-only" id="note-hint">${exampleText ? `For example: ${escapeHtml(exampleText)}. ` : ""}Optional once you pick something above. Control or Command and Enter sends.</p>
  <p class="hint" data-count-line hidden><span data-count>${note.length}</span> of ${site.note.max.toLocaleString("en-US")}</p>
  ${askBlocks}
  ${routeField(site.routes || [], values.path ?? "")}
  <p class="send"><button type="submit" data-pending="Making…">${escapeHtml(button)}</button> <span class="courtesy">${courtesy} <a href="/privacy">What happens to a note</a></span></p>
</form>`,
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
export function renderCard(filing, config = null) {
  const site = config || defaultConfig(filing.host);
  const display = site.name || filing.host;
  const back = `/${encodeURIComponent(filing.host)}${filing.context.slug === NOTE.slug ? "" : `/${filing.context.slug}`}`;
  const address = aboutAddress(filing.host, filing.path);
  const about = filing.subject ? ` about ${filing.subject.name}` : "";
  const post = `${filing.context.title}${about} for ${address}: "${excerpt(filing.note)}"`;
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
  <p class="note">Save or screenshot the card first. Each button opens ${escapeHtml(display)}'s profile: start a message there and attach the card, or paste its text.</p>
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
    script: CLIENT_SCRIPT,
    themeCss: themeCss(site.theme),
    body: `${kicker()}
<h1>Your card is ready</h1>
${site.thanks ? `<p class="owner-thanks"><strong>${escapeHtml(display)}:</strong> ${escapeHtml(site.thanks)}</p>` : ""}
<p class="lede">${filing.worded === false ? "No written detail: the card says what you picked. " : ""}${dms.length
    ? `Screenshot the card or save it as an image, then message it to ${escapeHtml(display)} below. Or post it and mention them.`
    : `Screenshot the card or save it as an image, then message it to whoever runs ${escapeHtml(display)}, or post it and name the site.`}</p>
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
  <button type="button" class="door" data-copy="slip" hidden><strong>Copy text</strong><span>as Markdown</span></button>
</div>
${sendTo}
<p class="note">Nothing was stored. The card lives on this page and in whatever you save or send.</p>
<details class="slip">
  <summary>The card as text</summary>
  <figure class="codeblock snippet-line">
    <figcaption><span>Markdown</span></figcaption>
    <pre id="slip">${escapeHtml(filing.markdown)}</pre>
  </figure>
</details>
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
<p class="actions">
  <a class="door" href="/"><strong>Start over</strong><span>Write a note</span></a>
</p>`,
  });
}
