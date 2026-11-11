// How to answer in Spw, for a reader handed this address and a line. A person
// types "spw.quest rpgwednesday<card>" to a model, or tags one on a social
// site; the model may open one page and no more, so /llms.txt carries the whole
// form and / leads to it. What is written here describes a format. It does not
// tell a model what to do, because a careful model takes its instructions from
// the person asking and treats a fetched page as reference.
//
// The card is the site's own seed card (public/js/modules/cards/seed-card.js),
// so an answer pasted on spwashi.com opens as a card with nothing translated.
// Examples are indented, not fenced, and quoted with double quotes: this text
// is a template literal, and an answer may land where backticks mean code.
// test/answer.test.mjs reads every example with the parser.
import { escapeHtml, layout } from "../../lib/shell.js";
import { CARD_CSS, cardLink, questCard } from "./cards.js";
import { EXAMPLES } from "./examples.js";
import { PAGE_CSS, QUEST_HEAD, masthead } from "./page.js";
import { PAPER_CSS } from "./paper.js";
import { PIVOT_LIMIT } from "./pivot.js";
import { readSpecimen } from "./specimen-reading.js";
import { SPECIMENS, factshiftHref, whereOf } from "./specimens.js";

const ORIGIN = "https://spw.quest";

/** Each mark in the words the canvas and the Learn panels use for it (factshift's modes/spw/operators.ts). */
export const MARK_SAYS = Object.freeze([
  ["~", "potential", "Keep a path open without taking it."],
  ["?", "wonder", "Open a question you can close again."],
  ["!", "action", "Commit a move so its consequence can be seen."],
  ["*", "value", "Mark what carries weight here."],
  [".", "ground", "Come back to the local default."],
  ["^", "ascension", "Lift parts into one relation you can inspect."],
  ["#", "vibration", "Name a structure so it can be found again."],
  ["@", "perspective", "Say who is looking, and from where."],
  ["&", "subject", "Name what the relation is about."],
  ["=", "configuration", "Keep this here, under this name."],
  ["%", "measure", "Compare, weigh, or level the field."],
  ["$", "substrate", "Name what carries the charge: time, money, memory, attention."],
]);

/** One worked answer of each kind. Written about a garden so a reader copies the form and not the facts. */
export const ANSWER_EXAMPLES = Object.freeze({
  card: `garden[weekly]{beds, compost, seedlings}(saturday)<card>
^seed[Session]{
  scene: "a shared plot, tended on Saturdays"
  carry: "the beds planted last week"
  revisit: "what survived the frost?"
}`,
  unknown: `nightmarket<card>
^seed[Wonder.Prompt]{
  question: "what is nightmarket, and who keeps it?"
  tension: "the name is all that was given"
  relay: "whoever named it"
  revisit: "once a page says what it is"
}`,
  question: `?["Will the seedlings survive a frost?"]{
  ~#expect: "the covered bed holds and the open bed does not"
  !probe{ "read both beds the morning after the first frost" }
}`,
  change: `#[episode]{
  ~[scene]{ the open bed lost its seedlings to a frost }
  ![change]{ every bed is covered before dusk in November }
  *[verify]{ all four beds came through the next frost }
}`,
  other: `garden[weekly]{beds, compost}(saturday)<plot>
*says = "a shared plot, tended on Saturdays"`,
});

const indented = (text) => text.split("\n").map((line) => `    ${line}`).join("\n");

/** The part of /llms.txt that teaches the form. No headings: the llms.txt form keeps them for its lists of links. */
export const ANSWER_FORM = `An address and a line together, as in "spw.quest rpgwednesday<card>", ask for an answer written in Spw. The line names the subject and its <concept> names the kind of answer. An answer is plain Spw text, with no code fence and no sentence before it. A person setting up a repository wants [the recipe](${ORIGIN}/init) instead.

A line is word[mode]{body}(scene)<concept>, and only the word is required.

- word: what the line is about, one name with no spaces.
- [mode]: how it is being seen.
- {body}: what belongs to it. A dot makes one name, a comma holds a company, a semicolon keeps an order, ~> is a path.
- (scene): where or when it stands.
- <concept>: what kind of thing it is.

A mark goes right before a word, with no space after it:

${MARK_SAYS.map(([sigil, name, says]) => `- ${sigil} ${name}: ${says}`).join("\n")}

Quoted text takes double quotes. #>name names a file or a line, and #:kind says what kind of file it is.

A word<card> is the line with its [mode], {body} and (scene) filled in from what is known, then a seed card, and a seed card always names its template. For a thing you know about, ^seed[Session] has the fields date, scene, turn, carry and revisit, and a field with nothing known is left out. Asked garden<card>, this is an answer, and pasted on spwashi.com it opens as a card:

${indented(ANSWER_EXAMPLES.card)}

For a word you know nothing about, not knowing is the card. ^seed[Wonder.Prompt] has the fields question, tension, material, relay and revisit, and each says what would have to be found out:

${indented(ANSWER_EXAMPLES.unknown)}

A word<question> is the question, what is expected, and the probe that would answer it:

${indented(ANSWER_EXAMPLES.question)}

A word<change> says what happened, what changed, and how it was checked:

${indented(ANSWER_EXAMPLES.change)}

Any other <concept> is the line with its slots filled and one plain sentence:

${indented(ANSWER_EXAMPLES.other)}

Facts about a word come from the Card address below, which lists what the site holds for it. On X an answer fits 280 characters and has no @ directly before a name, since that notifies the account; a # before a letter shows as a tag. A link to ${ORIGIN}/card?line= with the line percent-encoded unfurls as a link card.`;

const compact = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");

/** What the shelf holds for a word, joined or split: rpgwednesday finds rpg[wednesday], rpg_wednesday and /play/rpg-wednesday/. */
export function kinOf(word, limit = 8) {
  const wanted = compact(word);
  if (wanted.length < 3) return [];
  const rank = (specimen) => {
    const shape = specimen.reading?.shape || {};
    if (compact(`${shape.subject || ""}${shape.mode || ""}`) === wanted) return 0;
    if (compact(shape.subject) === wanted || compact(shape.scope) === wanted) return 1;
    const head = compact(shape.subject);
    if (head.length >= 3 && wanted.startsWith(head) && compact(specimen.route).includes(wanted)) return 2;
    if (compact(specimen.route).includes(wanted)) return 3;
    if ((shape.parts || []).some((part) => compact(part) === wanted) || compact(shape.mode) === wanted) return 4;
    return -1;
  };
  return SPECIMENS.map((specimen) => [rank(specimen), specimen])
    .filter(([found]) => found >= 0)
    .sort(([a], [b]) => a - b)
    .slice(0, limit)
    .map(([, specimen]) => specimen);
}

/** A line read for a card: the word, the concept asked for, and what the site holds for that word. */
export function cardReading(raw) {
  const typed = String(raw || "").trim();
  const line = typed.slice(0, PIVOT_LIMIT);
  if (!line || line.includes("\n")) return { line: "", word: "", concept: "", kin: [], pages: [], cut: false };
  const { shape = {}, slots = {} } = readSpecimen(line);
  const word = String(slots.subject || shape.subject || "").replace(/^[~?!@*^#&=%$.>:]+/, "");
  const kin = kinOf(word);
  const pages = [...new Set(kin.filter((specimen) => specimen.source === "routes").map((specimen) => specimen.route))]
    .map((route) => `https://spwashi.com${route}`);
  return { line, word, concept: String(slots.projection || ""), kin, pages, cut: typed.length > PIVOT_LIMIT };
}

const lineParam = (line) => `line=${encodeURIComponent(line)}`;

/** A line as text: what /card.txt answers, for a reader that wants no page. */
export function cardText(reading) {
  if (!reading.line) return `No line to read. Ask with one line, ${ORIGIN}/card.txt?${lineParam("rpgwednesday<card>")}.\nHow to answer in Spw is at ${ORIGIN}/llms.txt\n`;
  const held = reading.kin.length
    ? reading.kin.map((specimen) => `- ${specimen.line}  ${whereOf(specimen).href}`).join("\n")
    : `- Nothing yet. What is known about ${reading.word} has to come from somewhere else, or the card says less.`;
  const pages = reading.pages.length ? `\n\nPages that say what it is:\n${reading.pages.map((page) => `- ${page}`).join("\n")}` : "";
  return `${reading.line}${reading.cut ? `\n(Cut to ${PIVOT_LIMIT} characters.)` : ""}

word: ${reading.word}
asks for: ${reading.concept || "a line with its slots filled"}

Lines spwashi.com holds for this word:
${held}${pages}

An answer is plain Spw with no code fence: the line with its [mode], {body} and (scene) filled in from what is known, then a seed card that names its template. A field with nothing known is left out. A thing you know about:

${indented(ANSWER_EXAMPLES.card)}

A word you know nothing about:

${indented(ANSWER_EXAMPLES.unknown)}

The whole form is at ${ORIGIN}/llms.txt
As a card that unfurls: ${ORIGIN}/card?${lineParam(reading.line)}
`;
}

/** Reads a path as a line when it plainly is one, so spw.quest/rpgwednesday<card> is both the address and the question. */
export function lineFromPath(pathname) {
  let text;
  try {
    text = decodeURIComponent(pathname.slice(1));
  } catch {
    return "";
  }
  return text.length <= PIVOT_LIMIT && /^[~?!*.^#@&=%$]?[\w.-]+(?:\[[^\]/]*\]|\{[^}/]*\}|\([^)/]*\)|<[^>/]*>)+$/.test(text) ? text : "";
}

const CARD_PAGE_CSS = `${CARD_CSS}
    .card-line { font: 600 clamp(1.2rem, 5vw, 1.7rem)/1.3 var(--mono); overflow-wrap: anywhere; margin: .2rem 0 .6rem; }
    .card-form { margin: .6rem 0 0; padding: .7rem .85rem; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); font: .86rem/1.5 var(--mono); white-space: pre-wrap; overflow-wrap: anywhere; }
    .card-kin { display: grid; gap: .35rem; margin: .4rem 0 0; padding: 0; list-style: none; }
    .card-kin code { overflow-wrap: anywhere; }`;

/** The address of a line on spwashi.com's literal parser. */
const parserAt = (line) => `https://spwashi.com/tools/spw-parser/?spw_source=${encodeURIComponent(line)}#literal-parser`;

/** A line as a page: small, readable with no script, and described for a link card. */
export function renderCard(reading) {
  const { line, word, concept, kin, pages } = reading;
  const canonical = line ? `${ORIGIN}/card?${lineParam(line)}` : `${ORIGIN}/card`;
  const description = line
    ? `A line of Spw${kin.length ? `, with ${kin.length} ${kin.length === 1 ? "line" : "lines"} spwashi.com holds for ${word}` : ""}. Turn it, take it apart, or lay it out on a canvas.`
    : "A line of Spw as a card: what it asks for, and what the site holds for its word.";
  const title = line || "A line as a card";
  const head = `${QUEST_HEAD}
  <meta name="twitter:card" content="summary">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="spw.quest">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:image" content="${ORIGIN}/icons/quest-512.png">
  <meta property="og:image:alt" content="The spw.quest mark">`;
  const doors = line ? [
    cardLink(`/pivot?${lineParam(line)}`, "Turn one slot"),
    cardLink(`/build?script=${encodeURIComponent(line)}`, "Take it apart"),
    cardLink(`/physics?${lineParam(line)}`, "Feel it at rest"),
    cardLink(factshiftHref(line), "Open it on the canvas ↗"),
    cardLink(parserAt(line), "Read it on spwashi.com ↗"),
  ] : [];
  const held = kin.length
    ? `<ul class="card-kin">${kin.map((specimen) => `<li><a href="${escapeHtml(whereOf(specimen).href)}"><code>${escapeHtml(specimen.line)}</code></a></li>`).join("")}</ul>`
    : `<p>The site holds no line for this word yet.</p>`;
  const body = line ? questCard({
    tag: "section",
    level: 2,
    name: `What the site holds for ${word || "this word"}`,
    badges: [concept ? `asks for ${concept}` : "a line"],
    body: `${held}${pages.length ? `<p>${pages.map((page) => `<a href="${escapeHtml(page)}">${escapeHtml(page.replace("https://", ""))}</a>`).join(" · ")}</p>` : ""}`,
    links: doors,
  }) : `<p>Ask with one line: <a href="/card?${lineParam("rpgwednesday<card>")}">rpgwednesday&lt;card&gt;</a>.</p>`;
  return layout({
    title: line ? `${line} — spw.quest` : "spw.quest — a line as a card",
    description,
    canonical,
    head,
    themeCss: `${PAPER_CSS}\n    ${PAGE_CSS}\n    ${CARD_PAGE_CSS}`,
    body: `${masthead("/card")}
<section class="opening" aria-labelledby="title">
  <p class="eyebrow">A line, as a card</p>
  <h1 id="title" class="card-line">${line ? `<code>${readSpecimen(line).paint}</code>` : "A line as a card"}</h1>${reading.cut ? `\n  <p class="note">Cut to ${PIVOT_LIMIT} characters.</p>` : ""}
  <p class="lede">An answer to this line is written in Spw. <a href="/llms.txt">The form of an answer</a> says what each kind holds.</p>
</section>
${body}
<section class="band" aria-labelledby="form-title">
  <h2 id="form-title">A card, as a reply</h2>
  <p>Pasted on spwashi.com, this opens as a card.</p>
  <pre class="card-form">${escapeHtml(ANSWER_EXAMPLES.card)}</pre>
</section>`,
  });
}

/** /llms-full.txt: the index, then every example file whole, for a reader with room for them. */
export const fullIndex = (index) => `${index}
## Example files

${EXAMPLES.map((example) => `${example.file}: ${example.says}\n\n${indented(example.script)}\n`).join("\n")}`;
