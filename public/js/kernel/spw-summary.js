/**
 * A Spw line said in fewer characters without breaking it: its fractal
 * summary. The deepest { } bodies fold to {…} first, so every head stays
 * readable longest; then the outermost body keeps its first parts and an
 * ellipsis in its own separator; then it folds whole; and only then is the
 * text cut, at a word where one is near, with every pair still open closed
 * after the ellipsis. Every byte not folded or cut stays as written, so a
 * summary still reads, and still parses, as Spw.
 *
 * It needs no reader: one linear scan of the pairs, skipping quoted text,
 * so it costs the same on a phone's crumb as on a cauldron chip, and it
 * cannot recurse. factshift.center's canvas says long lines the same way
 * with the workbench's slot reader (.spw/caches/brace-literal-local-law-2026-11.spw,
 * .spw/caches/factshift-theory-of-mind-2026-11.spw#summaries).
 */

const OPENERS = { '{': '}', '[': ']', '(': ')' };
const CLOSERS = new Set(['}', ']', ')']);
const QUOTES = new Set(['"', '`']);
const FOLD = '…';

/**
 * The pairs in a text: each { } [ ] ( ) with its span, and for a { } body its
 * depth among bodies and where its top-level , and ; separators sit.
 */
function scan(text) {
  const pairs = [];
  const stack = [];
  let quote = '';
  for (let at = 0; at < text.length; at += 1) {
    const ch = text[at];
    if (quote) {
      if (ch === '\\') at += 1;
      else if (ch === quote) quote = '';
      continue;
    }
    if (QUOTES.has(ch)) {
      quote = ch;
      continue;
    }
    if (OPENERS[ch]) {
      const depth = stack.filter((open) => open.ch === '{').length;
      stack.push({ ch, at, depth, seps: [] });
      continue;
    }
    if ((ch === ',' || ch === ';') && stack.at(-1)?.ch === '{') {
      stack.at(-1).seps.push(at);
      continue;
    }
    if (CLOSERS.has(ch) && stack.length && OPENERS[stack.at(-1).ch] === ch) {
      const open = stack.pop();
      pairs.push({ ch: open.ch, open: open.at, close: at, depth: open.depth, seps: open.seps });
    }
  }
  return pairs;
}

/** Replace spans, the outermost first; a span inside one already replaced goes with it. */
function apply(text, cuts) {
  const kept = [];
  for (const cut of [...cuts].sort((a, b) => a.start - b.start || b.end - a.end)) {
    const last = kept.at(-1);
    if (last && cut.start >= last.start && cut.end <= last.end) continue;
    kept.push(cut);
  }
  let out = text;
  for (const cut of kept.reverse()) out = out.slice(0, cut.start) + cut.with + out.slice(cut.end);
  return out;
}

const fold = (body) => ({ start: body.open + 1, end: body.close, with: FOLD });

/** What a prefix of the text still owes: the closers of every pair and quote left open, innermost first. */
function owed(prefix) {
  const stack = [];
  let quote = '';
  for (let at = 0; at < prefix.length; at += 1) {
    const ch = prefix[at];
    if (quote) {
      if (ch === '\\') at += 1;
      else if (ch === quote) quote = '';
      continue;
    }
    if (QUOTES.has(ch)) quote = ch;
    else if (OPENERS[ch]) stack.push(OPENERS[ch]);
    else if (CLOSERS.has(ch) && stack.at(-1) === ch) stack.pop();
  }
  return `${quote}${stack.reverse().join('')}`;
}

/** The text cut to `budget`, at a word where one is near, with what it owes closed after the ellipsis. */
function cutClosed(text, budget) {
  for (let end = Math.max(0, budget - 1); end > 0; end -= 1) {
    let at = end;
    const space = text.lastIndexOf(' ', end);
    if (space > 0 && end - space <= 8) at = space;
    const head = text.slice(0, at).trimEnd();
    const said = `${head}${FOLD}${owed(head)}`;
    if (said.length <= budget) return said;
  }
  return FOLD;
}

/** How many depths of { } bodies a line nests: 0 with none, 1 with a body of plain parts. */
export function spwDepth(line) {
  return scan(String(line ?? '')).filter((pair) => pair.ch === '{').reduce((most, pair) => Math.max(most, pair.depth + 1), 0);
}

/** As much of a Spw line as fits in `budget` characters, folded from the inside out and never left open. */
export function summarizeSpw(line, budget) {
  const text = String(line ?? '').trim();
  if (text.length <= budget) return text;
  const bodies = scan(text).filter((pair) => pair.ch === '{' && text.slice(pair.open + 1, pair.close).trim());
  const deepest = bodies.reduce((most, body) => Math.max(most, body.depth), -1);
  for (let depth = deepest; depth >= 1; depth -= 1) {
    const said = apply(text, bodies.filter((body) => body.depth >= depth).map(fold));
    if (said.length <= budget) return said;
  }
  const nested = bodies.filter((body) => body.depth >= 1).map(fold);
  const outer = bodies.filter((body) => body.depth === 0);
  const widest = Math.min(outer.reduce((most, body) => Math.max(most, body.seps.length + 1), 0), Math.ceil(budget / 2) + 1);
  for (let keep = widest - 1; keep >= 1; keep -= 1) {
    const tails = outer
      .filter((body) => body.seps.length >= keep)
      .map((body) => {
        const sep = body.seps[keep - 1];
        let after = sep + 1;
        while (text[after] === ' ') after += 1;
        return { start: sep, end: body.close, with: `${text.slice(sep, after)}${FOLD}` };
      });
    const said = apply(text, [...tails, ...nested]);
    if (said.length <= budget) return said;
  }
  const folded = apply(text, outer.map(fold));
  return folded.length <= budget ? folded : cutClosed(folded, budget);
}
