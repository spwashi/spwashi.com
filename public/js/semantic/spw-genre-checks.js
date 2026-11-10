// What a file of a known kind is asked, and why. A parser says whether a
// source is Spw; a genre says what a file of that kind owes its next reader:
// a log's entries are dated and named, a question carries the probe that
// would answer it, a change record says how it was checked. Each check gives
// its sentence, the reason the rule exists, and the line to go to.
//
// The sentences are the ones spw.quest's reading says (fileKit in
// workers/spw-quest/src/file-reader.js, which must stay self-contained to
// travel into its page); workers/spw-quest/test/genre.test.mjs holds the two
// equal over every file the guide keeps. No imports: this reads a parse
// result and nothing else.

/** Why each rule exists, in one sentence a writer can act on. */
export const GENRE_REASONS = Object.freeze({
  log: 'A dated, named entry can be sorted, counted and summed by a tool. Without a date and a kind it can only be read.',
  wonder: 'A probe says what evidence would close the question, so it can be run and not only wondered.',
  episode: 'A record that names its check can be repeated. One that leaves it out is only a claim that something changed.',
  identity: 'A layer says what kind of file this is. A name lets another file point here.',
});

/**
 * One small file of each kind that has a rule, to load and break. The parser
 * tool opens them by address (?spw_source=), not from its gallery, so they
 * stay off the shelves that harvest the gallery.
 */
export const GENRE_SPECIMENS = Object.freeze({
  log: Object.freeze({ name: 'lab-notebook.spw', source: `#>lab_notebook
#:log #!components

^"stream"{
 >>[2026-11-06 09:10] catalog — the chip, in three dialects: pill, ring, plain
 >>[2026-11-06 11:40] try — the matte theme on the chip: the ring holds its edge
 >>[2026-11-06 17:30] land — one inset for every panel on a phone
}` }),
  wonder: Object.freeze({ name: 'experiment.spw', source: `#>wonder_ring_on_glass
?["Does the ring chip read on the glass theme at a phone's width?"]{
  ~#expect: \`the ring holds 3:1 against the busiest panel\`
  !probe{ "screenshot the chip row on glass at 390px and measure each edge" }
}` }),
  episode: Object.freeze({ name: 'change.spw', source: `#[episode]{
  ~[scene]{ a panel body drew a second wall on a phone }
  ![change]{ a body slot keeps no wall of its own below 45rem }
  *[verify]{ heading, body and first line share one edge on fourteen frames }
}` }),
});

const ENTRY = /^\[(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}))?\]\s*(?:([A-Za-z][\w-]*)\s*(?:—|–|--|-)\s*)?(.*)$/;
const squash = (value) => String(value || '').replace(/\s+/g, ' ').trim();
const isNode = (value) => typeof value.type === 'string' && value.type[0] === value.type[0].toUpperCase() && value.type !== value.type.toUpperCase();

function nodesIn(root) {
  const out = [];
  const visit = (value) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) { value.forEach(visit); return; }
    if (isNode(value)) out.push(value);
    for (const key of Object.keys(value)) if (key !== 'span') visit(value[key]);
  };
  visit(root);
  return out;
}

const lineOf = (node) => (node && node.span && node.span.start ? node.span.start.line : 0);
const spanText = (source, node) => (node && node.span && node.span.start && node.span.end ? source.slice(node.span.start.offset, node.span.end.offset) : '');

/**
 * Read a parse result for the kinds of file it holds. Returns the layers it
 * declares (#:log), the names it answers to (#>lab_notebook), and one check
 * per genre found: { genre, state: 'pass' | 'fail', says, why, line }. A file
 * with no entries, questions or episode has no checks, which is not a failure.
 */
export function readGenre(output, source = '') {
  const text = String(source ?? '');
  const nodes = nodesIn(output && output.ast);
  const layers = [];
  const names = [];
  const entries = [];
  const questions = [];
  const frames = [];
  for (const node of nodes) {
    if (node.type === 'Particle' && node.name) {
      if (node.aim === '>') names.push(node.name.value);
      else if (node.aim === ':') layers.push(node.name.value);
    } else if (node.type === 'Bullet' && node.marker && node.marker.kind === '>>' && node.item) {
      const match = squash(node.item.text || spanText(text, node.item)).match(ENTRY);
      entries.push({ whole: Boolean(match && match[1] && match[3]), line: lineOf(node) });
    }
    if (node.type === 'Operation' && node.operator && node.frame && node.frame.type === 'Frame') {
      const param = (node.frame.content || []).find((part) => part && part.type === 'Parameter');
      if (!param || !param.value) continue;
      if (node.operator.value === '?' && param.value.type === 'Literal') {
        const probe = node.body && nodesIn(node.body).some((inner) => inner.type === 'Operation' && inner.operator && inner.operator.value === '!' && inner.operatorLabel && inner.operatorLabel.value === 'probe');
        questions.push({ probed: Boolean(probe), line: lineOf(node) });
      } else {
        const id = nodesIn(param.value).find((inner) => inner.type === 'Identifier');
        if (id && id.token) frames.push({ word: id.token.value, line: lineOf(node) });
      }
    }
  }

  const checks = [];
  if (entries.length) {
    const loose = entries.filter((entry) => !entry.whole);
    checks.push(loose.length
      ? { genre: 'log', state: 'fail', says: `${loose.length} of ${entries.length} entries ${loose.length === 1 ? 'has' : 'have'} no [date] and kind yet.`, why: GENRE_REASONS.log, line: loose[0].line }
      : { genre: 'log', state: 'pass', says: 'Every entry has a date and a kind.', why: GENRE_REASONS.log, line: entries[0].line });
  }
  if (questions.length) {
    const open = questions.filter((question) => !question.probed);
    checks.push(open.length
      ? { genre: 'wonder', state: 'fail', says: `${open.length === 1 ? 'A question has' : `${open.length} questions have`} no !probe yet: nothing says what would answer it.`, why: GENRE_REASONS.wonder, line: open[0].line }
      : { genre: 'wonder', state: 'pass', says: 'Every question carries a probe that would answer it.', why: GENRE_REASONS.wonder, line: questions[0].line });
  }
  const episode = frames.find((frame) => frame.word === 'episode');
  if (episode) {
    const said = new Set(frames.map((frame) => frame.word));
    const missing = ['scene', 'change', 'verify'].filter((word) => !said.has(word));
    checks.push(missing.length
      ? { genre: 'episode', state: 'fail', says: `No ${missing.map((word) => `[${word}]`).join(' or ')} yet${missing.includes('verify') ? ': it does not say how the change was checked' : ''}.`, why: GENRE_REASONS.episode, line: episode.line }
      : { genre: 'episode', state: 'pass', says: 'Says what happened, what changed, and how it was checked.', why: GENRE_REASONS.episode, line: episode.line });
  }
  return { layers, names, checks };
}
