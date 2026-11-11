/**
 * Sleep — what a night does with the questions the day left open.
 *
 * The site asks faster than it settles: wonders went from 181 to 433 in
 * seventeen days with 18 answered and none retired, and the last probe receipts
 * were two weeks old when this was written. Sleep is the return. It re-runs the
 * read-only probes, compares them with the last night, and leaves one short
 * note for whoever wakes.
 *
 * It settles and it forgets. It does not ask: a sleep that adds wonders has
 * failed, and a run only proposes, so a verdict stays a reader's (~#answer, in
 * the file that holds the wonder). Nothing here reads the disk or a clock; the
 * walking is scripts/sleep.mjs, and this is what can be tested.
 *
 *   replay    a cold question whose rare words today's commits used
 *   moved     a probe that prints something different than it did last night
 *   stills    a picture older than the last change to its page
 *   retire    a cold question nothing says how to close
 *   babble    a one-slot turn of a line that lands on another page's line
 *   paid      of what the last note offered, how much was settled since
 */
import { createHash } from 'node:crypto';

const CLOSED = new Set(['answered', 'retired']);
export const isOpen = (wonder) => !CLOSED.has(wonder.lifecycle);

/**
 * One line of a probe's output with what only the clock or a line shift moves
 * taken out, so a difference means something. A number is a position only when
 * content follows it (`a.js:12:hit`, `60:hit`, `a.js-12-hit`, or rg's bare
 * context line `284-`); a number ending
 * the line is a count (`rg -c`'s `a.js:3`) and stays, or it could never move.
 */
export function normalizeObservation(text = '') {
  return String(text)
    .replace(/["`\\]/g, "'")
    .trim()
    .replace(/^\d+-$/, '#-')
    .replace(/^\d+([:-])(?=\S|\s+\S)/, '#$1')
    .replace(/^(\S+?):\d+(?::\d+)?:(?=\S|\s+\S)/, '$1:#:')
    .replace(/^(\S+?\.\w+)-\d+-(?=\S|\s+\S)/, '$1-#-')
    .replace(/\b\d+(?:ms|d)\b/g, '#')
    .replace(/\s+/g, ' ');
}

/** The key renderRuns gives a run: the wonder's id as a word, numbered when a wonder has several probes. */
export function runKeys(runs = []) {
  const seen = new Map();
  return runs.map((run) => {
    const base = String(run.wonder).replace(/\W/g, '_');
    const n = (seen.get(base) || 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base}_${n}`;
  });
}

/**
 * What a probe's whole output says, in a form two nights can compare. rg prints
 * in thread order and a receipt keeps only the last lines, so two runs on one
 * tree differ without this: the lines are normalized, then sorted, then hashed.
 */
export function probeDigest(output = '') {
  const lines = String(output).split('\n').map(normalizeObservation).filter(Boolean).sort();
  return createHash('sha256').update(lines.join('\n')).digest('hex').slice(0, 16);
}

/** Which probes printed something else, which held, and which have no last night to compare with. */
export function diffProbes(previous = {}, runs = []) {
  const keys = runKeys(runs);
  const moved = [];
  let steady = 0;
  let fresh = 0;
  runs.forEach((run, index) => {
    const key = keys[index];
    const last = previous[key];
    if (!last) { fresh += 1; return; }
    if (last.digest === run.digest) steady += 1;
    else moved.push({ key, wonder: run.wonder, file: run.file, was: last.observation, now: run.observation });
  });
  return { moved, steady, fresh };
}

const tokensOf = (text = '') => new Set(String(text).toLowerCase().match(/[\w./#-]+/g) ?? []);

/** How much of a probe's output changed, 0 to 1: the share of its words the two nights do not hold in common. */
export function changeOf(was = '', now = '') {
  const a = tokensOf(was);
  const b = tokensOf(now);
  const both = [...a].filter((token) => b.has(token)).length;
  const either = new Set([...a, ...b]).size;
  return either ? 1 - both / either : 0;
}

/** The moved probes worth a reader's next minute: those with an expectation to hold them to, then the largest change. */
export function rankMoved(moved = [], limit = 3) {
  return [...moved]
    .sort((a, b) => Number(Boolean(b.expect)) - Number(Boolean(a.expect)) || changeOf(b.was, b.now) - changeOf(a.was, a.now) || a.key.localeCompare(b.key))
    .slice(0, limit);
}

/** Whether the night closed more than the day opened. Counts alone: what they mean is a reader's. */
export function measure(previous, now) {
  if (!previous || previous.open == null) return { verdict: 'first night', open: now.open, answered: now.answered, retired: now.retired };
  const closedMore = (now.answered + now.retired) > (previous.answered + previous.retired);
  const verdict = now.open < previous.open || (closedMore && now.open === previous.open) ? 'settling'
    : now.open > previous.open ? 'accreting' : 'still';
  return { verdict, open: now.open, answered: now.answered, retired: now.retired, wasOpen: previous.open, wasAnswered: previous.answered, wasRetired: previous.retired };
}

const STOP = new Set('about above after again against almost already always among another around because become before being between beyond could would should still their there these those through under until where which while whose within without might makes people thing things other first second third every never often rather shall since some such than that then them they this what when will with from have into more most much must only over same seem seems site does doing done each even many need needs page pages line lines'.split(' '));
const wordsOf = (text = '') => new Set(String(text).toLowerCase().match(/[a-z][a-z-]{4,}/g)?.filter((word) => !STOP.has(word)) ?? []);

/**
 * Cold questions the day may have answered: open wonders on surfaces the day
 * did not touch, whose rare words the day's commits used. Rarity is across the
 * wonders themselves, so a word every question uses counts for little.
 */
export function replay(wonders, touchedText, touchedFiles, { limit = 3 } = {}) {
  const open = wonders.filter(isOpen);
  const frequency = new Map();
  for (const wonder of open) for (const word of wordsOf(wonder.question)) frequency.set(word, (frequency.get(word) || 0) + 1);
  const said = wordsOf(touchedText);
  const touched = new Set(touchedFiles);
  return open
    .filter((wonder) => !touched.has(wonder.file))
    .map((wonder) => {
      const weight = (word) => Math.log((open.length + 1) / (frequency.get(word) || 1));
      const asked = [...wordsOf(wonder.question)];
      const shared = asked.filter((word) => said.has(word)).sort((a, b) => weight(b) - weight(a) || a.localeCompare(b));
      const total = asked.reduce((sum, word) => sum + weight(word), 0);
      // How much of what the question asks the day spoke of, so a long question earns nothing for being long.
      return { wonder, shared: shared.slice(0, 5), matched: shared.length, score: total ? shared.reduce((sum, word) => sum + weight(word), 0) / total : 0 };
    })
    .filter(({ matched, score }) => matched >= 2 && score >= 0.4)
    .sort((a, b) => b.score - a.score || String(a.wonder.key).localeCompare(String(b.wonder.key)))
    .slice(0, limit);
}

/** Open questions on the longest-quiet surfaces that say neither what to expect nor how to run a check. */
export function retireCandidates(wonders, ageOf, { limit = 3 } = {}) {
  return wonders
    .filter((wonder) => isOpen(wonder) && !wonder.expect && !wonder.answer && wonder.probeKind !== 'run')
    .map((wonder) => ({ wonder, days: ageOf(wonder.file) }))
    .filter(({ days }) => days != null)
    .sort((a, b) => b.days - a.days || String(a.wonder.key).localeCompare(String(b.wonder.key)))
    .slice(0, limit);
}

/** Stills older than the last commit to their page's HTML, most recently changed page first. */
export function staleStills(recipes, captureOf, routeChangedAt) {
  const stale = [];
  const current = [];
  let missing = 0;
  for (const recipe of recipes) {
    const capture = captureOf(recipe.id);
    if (!capture) { missing += 1; continue; }
    const changed = routeChangedAt(recipe.specimenRoute);
    if (changed != null && changed > capture.at) stale.push({ id: recipe.id, route: recipe.specimenRoute, file: capture.file, changed });
    else current.push({ id: recipe.id, route: recipe.specimenRoute, file: capture.file });
  }
  stale.sort((a, b) => b.changed - a.changed || a.id.localeCompare(b.id));
  return { stale, current, missing };
}

/** The same picks for the same seed, in an order nothing about the list's own order decides. */
export function seeded(items, seed, n, keyOf = String) {
  const rank = (item) => createHash('sha256').update(`${seed}\0${keyOf(item)}`).digest('hex');
  return [...items].sort((a, b) => rank(a).localeCompare(rank(b))).slice(0, n);
}

/** Of the questions the last note offered, those closed, gone, or newly probed since. */
export function paid(offered = [], wonders = [], previousProbed = {}) {
  const byKey = new Map(wonders.map((wonder) => [wonder.key, wonder]));
  const settled = offered.filter((key) => {
    const wonder = byKey.get(key);
    return !wonder || !isOpen(wonder) || (wonder.probed && wonder.probed !== (previousProbed[key] ?? ''));
  });
  return { offered: offered.length, settled: settled.length };
}

const quote = (text, max = 220) => {
  const plain = String(text ?? '').replace(/["`\\]/g, "'").replace(/\s+/g, ' ').trim();
  return `"${plain.length > max ? `${plain.slice(0, max - 1)}…` : plain}"`;
};
const word = (text) => String(text).replace(/\W/g, '_').replace(/^(\d)/, '_$1');

/** The note, as Spw: short enough to read first, written for whoever wakes and knows nothing of the night. */
export function renderWake(night) {
  const { stamp, revision, since, tally, stages = '', lastPaid, opened = [], settled = [], moved = [], steady = 0, fresh = 0, replayed = [], stills, stillProbes = [], retire = [], babble, capture, seed } = night;
  const facet = (key, rows) => [`  ${word(key)}: .{`, ...rows.map((row) => `    ${row}`), '  }[reg=facet]'];
  const block = (name, head, entries) => [`^"${name}"{`, ...head.map((row) => `  ${row}`), ...entries.flat(), '}', ''];
  const change = tally.wasOpen == null ? '' : `; was ${tally.wasOpen} not closed, ${tally.wasAnswered} answered, ${tally.wasRetired} retired`;
  return [
    '# Wake — what the night compared, and what it leaves for a reader.',
    '# Written by npm run sense -- sleep. .spw/gen is gitignored. Nothing here is a verdict:',
    '# a reader writes ~#answer or ~#retired in the file that holds the wonder.',
    '',
    `#>wake_${stamp.slice(0, 10).replace(/\W/g, '_')}`,
    '#:operation #!cache',
    '#:fixity #!volatile',
    '',
    `slept = ${quote(`${stamp} at ${revision}${since ? `, since ${since}` : ''}`)}`,
    `measure = ${quote(`${tally.verdict}: ${tally.open} not closed${stages ? ` (${stages})` : ''}, ${tally.answered} answered, ${tally.retired} retired${change}`)}`,
    lastPaid && lastPaid.offered ? `last_note = ${quote(`offered ${lastPaid.offered} questions; ${lastPaid.settled} settled or probed since`)}` : '',
    '',
    ...block('moved', [`count = ${moved.length}`, `held = ${steady}`, `new = ${fresh}`, `note = "These printed something else than last night. Does each still meet its expectation? The rest are in .spw/gen/wonder-runs.spw."`],
      rankMoved(moved).map((item) => facet(item.key, [`file = ${quote(item.file)}`, ...(item.expect ? [`expect: ${quote(item.expect, 160)}`] : []), `was: ${quote(item.was, 120)}`, `now: ${quote(item.now, 120)}`]))),
    ...block('replay', ['note = "Cold questions whose rare words the commits since last night used. Did that work answer any?"'],
      replayed.map(({ wonder, shared }) => facet(wonder.id, [`file = ${quote(`${wonder.file}:${wonder.line}`)}`, `asks: ${quote(wonder.question)}`, `shares = ${quote(shared.join(', '))}`]))),
    ...block('questions', [`opened = ${opened.length}`, `closed_or_gone = ${settled.length}`], opened.slice(0, 3).map((wonder) => facet(wonder.id, [`opened: ${quote(wonder.question, 140)}`]))),
    ...block('stills', [`stale = ${stills.staleCount ?? stills.stale.length}`, `current = ${stills.current.length}`, `never_taken = ${stills.missing}`, ...(stills.look ? [`look = ${quote(stills.look)}`] : []), `capture = ${quote(capture)}`, 'note = "A session can read a still file directly. Taking one needs a browser, so run it from your own shell."'],
      [...stills.stale.slice(0, 2).map((still) => facet(still.id, [`route = ${quote(still.route)}`, `last = ${quote(still.file)}`, `retake = ${quote(`npm run sense -- ink ${still.id}`)}`])),
        ...stillProbes.map(({ wonder, ink }) => facet(wonder.id, [`asks: ${quote(wonder.question)}`, `file = ${quote(`${wonder.file}:${wonder.line}`)}`, ...(ink ? [`take = ${quote(`npm run sense -- ink ${ink}`)}`] : [])]))]),
    ...block('retire', ['note = "Quietest surfaces, with nothing saying what to expect or how to check. Keep each, or write ~#retired with the reason."'],
      retire.map(({ wonder, days }) => facet(wonder.id, [`file = ${quote(`${wonder.file}:${wonder.line}`)}`, `quiet_days = ${days}`, `asks: ${quote(wonder.question)}`]))),
    ...block('babble', [`seed = ${quote(seed)}`, `edges = ${babble.total}`, `new = ${babble.fresh}`, `no_door = ${babble.undoored}`, 'note = "One slot separates these lines, on different pages, and no door says so."'],
      babble.picks.map((edge, index) => facet(`edge_${index + 1}`, [`line: ${quote(edge.from)}`, `on = ${quote(edge.fromRoute)}`, `turns_to: ${quote(edge.to)}`, `on_too = ${quote(edge.toRoute)}`]))),
  ].filter((row, index, rows) => row !== '' || rows[index - 1] !== '').join('\n');
}
