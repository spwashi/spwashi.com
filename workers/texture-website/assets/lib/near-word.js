// The nearest word a host knows, for a word a neighbour sent. Each site in the
// set speaks its own ladders: texture.website's scale runs macro to far,
// attention.productions' shot runs extreme close-up to establishing, and
// spwashi.com's theater links say raking sun and 100mm. A link carries the
// sender's words; the reader resolves each one, in this order:
//
//   exact    the word itself
//   alias    a neighbour's word, written down in the host's own table
//   measure  a focal length or an aspect ratio, nearest on a log scale
//   shared   a word in common ("north window" and "window light")
//   prefix   the start of a word ("candle", "candlelight")
//   slip     a spelling a slip or two away ("moqette", "moquette")
//
// What is not near stays unread, and the host says so. Pure, with no DOM.
// Copied byte for byte to each host's /lib/near-word.js; check:workers holds
// the copies. From a host's src/ or assets/, the import is ../../lib/near-word.js,
// which the browser resolves to /lib/near-word.js.

export const slug = (word) => String(word ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** What a link carries when its sender wrote out a missing value: read as no word at all. */
export const ABSENT = new Set(["undefined", "null", "nan"]);

/** Words that name a ladder's kind rather than a rung, so sharing one says nothing. */
const GENERIC = new Set(["light", "shot", "lens", "focus", "third", "angle", "hour", "night", "with", "from"]);

/** Edits between two words (insert, delete, substitute, swap two neighbours), giving up past `cap`. */
export function editDistance(a, b, cap = Infinity) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > cap) return cap + 1;
  let prev2 = null;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i += 1) {
    const row = [i];
    let low = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let d = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
      if (prev2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d = Math.min(d, prev2[j - 2] + 1);
      row.push(d);
      if (d < low) low = d;
    }
    if (low > cap) return cap + 1;
    prev2 = prev;
    prev = row;
  }
  return prev[b.length];
}

/** How many slips a word of this length may carry and still be the word meant. */
export const slipsFor = (length) => (length < 5 ? 0 : length < 8 ? 1 : 2);

/** The number a word measures: 85mm is 85, 16:9 is 1.78, 2.39 is 2.39. Anything else is null. */
export function measureOf(raw) {
  const text = String(raw ?? "").toLowerCase().trim();
  let m = text.match(/^(\d+(?:\.\d+)?)\s*mm$/);
  if (m) return Number(m[1]);
  m = text.match(/^(\d+(?:\.\d+)?)\s*[:x/]\s*(\d+(?:\.\d+)?)$/);
  if (m) return Number(m[2]) > 0 ? Number(m[1]) / Number(m[2]) : null;
  m = text.match(/^(\d+(?:\.\d+)?)$/);
  return m ? Number(m[1]) : null;
}

/**
 * Read `raw` as one of `words`. `aliases` maps a neighbour's slug to a word of
 * this ladder; `measures` maps the words that have one to a number. Returns
 * null for an empty value, { word, how, asked } for a word read, and
 * { word: null, how: "unread", asked } for one with nothing near.
 */
export function nearWord(raw, words, { aliases = {}, measures = null } = {}) {
  const asked = String(raw ?? "").trim();
  const key = slug(asked);
  // A sender that wrote out a missing value ("undefined", "null", "NaN") said nothing.
  if (!key || ABSENT.has(key)) return null;
  const bySlug = new Map(words.map((word) => [slug(word), word]));
  const read = (word, how) => ({ word, how, asked });

  if (bySlug.has(key)) return read(bySlug.get(key), "exact");
  const alias = bySlug.get(slug(aliases[key]));
  if (alias) return read(alias, "alias");

  const n = measures ? measureOf(asked) : null;
  if (n > 0) {
    let best = null;
    let gap = Infinity;
    for (const [word, m] of Object.entries(measures)) {
      const d = Math.abs(Math.log(n / m));
      if (d < gap && bySlug.has(slug(word))) [best, gap] = [word, d];
    }
    if (best) return read(best, "measure");
  }

  const parts = key.split("-").filter((part) => part.length >= 4 && !GENERIC.has(part));
  let shared = null;
  let most = 0;
  for (const word of words) {
    const theirs = slug(word).split("-");
    const count = parts.filter((part) => theirs.includes(part)).length;
    if (count > most) [shared, most] = [word, count];
  }
  if (shared) return read(shared, "shared");

  if (key.length >= 4) {
    const prefix = words.find((word) => {
      const s = slug(word);
      return s.startsWith(key) || (s.length >= 4 && key.startsWith(s));
    });
    if (prefix) return read(prefix, "prefix");
  }

  const slips = slipsFor(key.length);
  if (slips) {
    let best = null;
    let gap = slips + 1;
    for (const word of words) {
      const d = editDistance(key, slug(word), slips);
      if (d < gap) [best, gap] = [word, d];
    }
    if (best) return read(best, "slip");
  }
  return { word: null, how: "unread", asked };
}

/** One short line for what a host read as something else: "read 100mm as macro · orbit: no rung". Empty when every word was its own. */
export function readNote(reads) {
  const said = (text) => String(text).replace(/[_-]+/g, " ").trim();
  const items = reads
    .filter((r) => r && r.how !== "exact")
    .map((r) => (r.how === "unread" ? `${said(r.asked)}: no rung` : `${said(r.asked)} as ${r.word}`));
  return items.length ? `read ${items.join(" · ")}` : "";
}
