// Every address on this site that does something with a line, said the way a
// tool is described to a new colleague: when to reach for it, what comes back,
// and what it will not take. A link is a call and a page is its result, so a
// reader following links, person or agent, gets from this what a tool
// description gives: a name, parameters named for what they hold, and an error
// that says how to ask again. The shape follows Anthropic's "Writing effective
// tools for agents" and the llms.txt form its own documentation serves.
//
// An agent's fetch runs no scripts, sends no fragment and sets no headers, so
// each example is a percent-encoded path and query, and the line it carries is
// written out beside it. Limits come from the worker's own constants, and each
// example is called in test/addresses.test.mjs.
import { ANSWER_FORM, fullIndex } from "./answer.js";
import { SHARE_MAX } from "./build.js";
import { PIVOT_LIMIT } from "./pivot.js";
import { LINE_LIMIT } from "./reader.js";
import { FACTSHIFT_LIMIT } from "./specimens.js";

const SHELF_WEIGHT = "The page is about 280 KB whatever is asked: the answer comes first, and the whole shelf follows it.";

export const ADDRESSES = Object.freeze([
  { name: "Card", path: "/card.txt", params: [["line", "rpgwednesday<card>"]], when: "You hold a line and want what the site holds for its word before answering it, as text.", takes: `line: one line, ${PIVOT_LIMIT} characters. /card with the same line is a small page that unfurls as a link card, and spw.quest/ followed by the line itself answers the same.` },
  { name: "Pivot", path: "/pivot", params: [["line", "home[hook]{software.art}"]], when: "You hold one line and want the lines one change away from it, grouped by the slot each turns. A turn that lands on a line a page already holds says which page, with a link to it.", takes: `line: one line, ${PIVOT_LIMIT} characters; past that it is cut and the page says so. In a browser, #turn-mode, #turn-body, #turn-subject, #turn-scope or #turn-projection scrolls to one slot; a fetch gets the whole page.` },
  { name: "Find", path: "/specimens", params: [["q", "recipe[*]"]], when: "You want every line on spwashi.com with some shape: the same word through other lenses, the same lens on other words.", takes: `q: slots to match, with * for any value. ${SHELF_WEIGHT}` },
  { name: "Compare", path: "/specimens", params: [["a", "h-capsule"], ["b", "h-induct_join"]], when: "You hold two shelf lines and want the slots they share and the slot where they part.", takes: `a, b: shelf ids, as Find prints them. ${SHELF_WEIGHT}` },
  { name: "Take apart", path: "/build", params: [["script", "~door[ajar]{hinge}"]], when: "You hold a file, or a line among others, and want what a tool reads from it and each slot's alternatives from the file's own lines.", takes: `script: up to ${SHARE_MAX} characters in an address. line: which of its lines to take apart, counted from 1.` },
  { name: "Read a file", path: "/", params: [["example", "record"]], when: "You want a whole example of a kind of file (a log, a catalog record, a question with its probe) and what a tool reads from it.", takes: "example: notebook, record, vocabulary, question, script, revision, persona, calibration, perspectives, loops, gradient, syntax, headings, perform, outline, recurrence, laws or pantry. at: a name in the file, to land on its line." },
  { name: "Check a line", path: "/read", params: [["step", "act"], ["line", "~door"]], when: "You are learning one mark and want a single line checked against that panel's rule.", takes: `step: write, act, hold, name, point, ask or grow. line: up to ${LINE_LIMIT} characters.` },
  { name: "At rest", path: "/physics", params: [["line", "home[hook]{software.art}"]], when: "You want a line drawn as bodies at rest, with the laws that placed them.", takes: "line: one line." },
  { name: "Canvas", path: "/canvas", params: [["line", "home[hook]{software.art}"]], when: "You want a person to see a line laid out as a force-directed canvas on factshift.center. It draws with scripts, so a reader without them gets only its chrome: use Pivot to read the line.", takes: `line: up to ${FACTSHIFT_LIMIT} characters, or s: a shelf id. Answers with a redirect to factshift.center.` },
]);

const ORIGIN = "https://spw.quest";
const encoded = (params) => params.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join("&");

/** An address's example as a link any client can follow. */
export const addressHref = ({ path, params }) => `${path}?${encoded(params)}`;

/** /llms.txt: what can be done here by address, then where the rest is. */
export const ADDRESS_INDEX = `# spw.quest

> Spw is a notation for a reading you can compare: a mark says what a word is doing, and a brace says which slot it fills. An answer written in Spw can be parsed, compared, and opened as a card or a canvas.

${ANSWER_FORM}

## Addresses

Every address below answers with a page that reads with no script, except Canvas.

${ADDRESSES.map((address) => `- [${address.name}](${ORIGIN}${addressHref(address)}): ${address.when} ${address.takes} Example: ${address.params.map(([key, value]) => `${key} = ${value}`).join(", ")}.`).join("\n")}

## Reference

- [Marks and braces](${ORIGIN}/#operators): each mark and brace pair, what it reads as, and what the runtime does with it.
- [Constructs](${ORIGIN}/constructs): the shapes a line takes, each with a pressed example.
- [Dated parser builds](${ORIGIN}/parser/): the parser as a file to load on your own page.

## Optional

- [Initialize a repository](${ORIGIN}/init): the recipe for mounting Spw Workbench, for an agent asked to set one up.
- [quest.json](${ORIGIN}/quest.json): that recipe's facts as data.
- [Every example file](${ORIGIN}/llms-full.txt): this index, then each file whole.
`;

/** /llms-full.txt. */
export const FULL_INDEX = fullIndex(ADDRESS_INDEX);

/** A 404 that says where to go. */
export const notFoundText = (path) => `Not found: ${path}\nEvery address this site answers is at ${ORIGIN}/llms.txt\n`;

/** Why /canvas could not open, and how to ask again. */
export function canvasRefusal(line, limit = FACTSHIFT_LIMIT) {
  if (!line) return `No line to open. Ask with one line, /canvas?line=${encodeURIComponent("home[hook]{software.art}")}, or a shelf id, /canvas?s=h-capsule.\nEvery address this site answers is at ${ORIGIN}/llms.txt\n`;
  return `This line is ${line.length} characters and the canvas holds ${limit}. Shorten it, or open it in /build, which carries a whole file to the canvas.\n`;
}
