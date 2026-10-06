/**
 * What a gate run means beyond pass or fail, for the two readers it has.
 *
 * An agent reads the gate to learn what its change moved, whether a warning
 * is its own, and how to rerun one stage without paying for all of them. A
 * director reads it to learn what has been waiting on a decision, and for how
 * long. Both are answered by comparing this run with the ones before it, so
 * every run leaves a JSON receipt and one line of history
 * (.agents/state/runtime/, gitignored), and the text output ends with what
 * changed since the last run instead of what held.
 */

export const RECEIPT_SCHEMA = 'check-local.v1';
export const HISTORY_LIMIT = 200;

export const TAGGED = /^\[[\w:./-]+\]\s/;
export const WARNED = /⚠|^\s*warn\b/i;
// Tagged lines that say nothing a reader acts on.
export const CHATTER = /^\[check\] phase=|^\[check:agents\] spend$|\bmodule audit \|/;
const TEST_COUNT = /^ℹ (tests|fail) (\d+)/;
const TEST_TIME = /^\s*✔ (.+) \((\d+(?:\.\d+)?)ms\)$/;
const BUNDLE_SIZE = /^\s*bundle: ([\w-]+):([\w-]+) (\d+(?:\.\d+)?) KiB\b/;

/** The longest passing tests in a node:test listing, slowest first. */
export function slowestTests(output = '', { limit = 3, minMs = 2000 } = {}) {
  const rows = [];
  for (const line of String(output).split('\n')) {
    const match = TEST_TIME.exec(line);
    if (match && Number(match[2]) >= minMs) rows.push({ name: match[1], ms: Number(match[2]) });
  }
  return rows.sort((a, b) => b.ms - a.ms).slice(0, limit);
}

const seconds = (ms) => `${(ms / 1000).toFixed(1)}s`;
const clip = (text, width = 56) => (text.length > width ? `${text.slice(0, width - 1)}…` : text);

/**
 * What a passing stage shows by default: the lines it tags with its own name
 * ("[js-tree] ok …"), anything marked as a warning, and for a test runner one
 * count and its slowest tests. A test stage keeps tagged lines only from its
 * own `tag`, because tests print other tools' lines while exercising them.
 */
export function stageHeadline(output = '', { tests = false, tag = null } = {}) {
  const lines = String(output).trimEnd().split('\n');
  if (!tests) return lines.filter((line) => (TAGGED.test(line) || WARNED.test(line)) && !CHATTER.test(line));
  let count = 0;
  let failed = 0;
  let runs = 0;
  const kept = [];
  for (const line of lines) {
    const match = TEST_COUNT.exec(line);
    if (match) {
      if (match[1] === 'tests') {
        count += Number(match[2]);
        runs += 1;
      } else {
        failed += Number(match[2]);
      }
      continue;
    }
    if ((tag && line.startsWith(`[${tag}]`)) || WARNED.test(line)) kept.push(line);
  }
  if (runs) {
    const slow = slowestTests(output);
    const slowNote = slow.length ? ` · slowest ${slow.map((row) => `${clip(row.name, 48)} ${seconds(row.ms)}`).join(', ')}` : '';
    kept.unshift(`ℹ tests ${count} · fail ${failed}${slowNote}`);
  }
  return kept;
}

/**
 * What a failed test stage shows: its count and node's closing "failing tests"
 * section, without the runner's own stack frames. Hundreds of passing lines
 * before it cost a reader (and an agent's context) and say nothing about the
 * failure; they stay in the log. Output without that section (a crash before
 * the summary) is returned whole.
 */
export function testFailureExcerpt(output = '') {
  const lines = String(output).trimEnd().split('\n');
  const start = lines.findIndex((line) => line.startsWith('✖ failing tests:'));
  if (start < 0) return lines;
  const counts = stageHeadline(output, { tests: true }).filter((line) => line.startsWith('ℹ tests'));
  const section = lines.slice(start).filter((line) => !/^\s+at (?:async )?.*\(?node:internal\//.test(line));
  return [...counts, ...section];
}

/** The test files node named in its failing section ("test at <file>:line:col"). */
export function failingTestFiles(output = '') {
  const files = new Set();
  for (const line of String(output).split('\n')) {
    const match = /^test at (.+?):\d+:\d+$/.exec(line.trim());
    if (match) files.add(match[1]);
  }
  return [...files];
}

/**
 * A warning's identity across runs: its words without the numbers that move
 * (dates, weeks, counts), so "stale for 1 week" and "stale for 2 weeks" are
 * one standing warning, not two new ones.
 */
export function warningId(text = '') {
  return String(text)
    .replace(/^\s*(?:⚠\s*|warn:\s*|warn\s+)+/i, '')
    .replace(/\d+(?:[.,]\d+)*/g, '#')
    .replace(/# (\w+?)s\b/g, '# $1')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * A warning that asks someone to confirm or decide waits on a director; any
 * other is drift a change can clear. Kept apart so the closing lines say
 * which of the standing ones are a person's call.
 */
export function warningKind(text = '') {
  return /\b(confirm|decide|choose|approve)\b/i.test(text) ? 'decision' : 'drift';
}

const parseNearItems = (line) => {
  const near = /^\[(css-build|check:agents)\] near (?:soft )?budget: (.+)$/.exec(line);
  if (!near) return [];
  return near[2].split(/,\s+(?=\S+ \d)/).map((item) => item.trim()).filter(Boolean)
    .map((item) => ({ source: near[1], item, key: item.split(' ')[0] }));
};

/**
 * Read the signals out of a run's stages (each with its full output):
 * warnings by identity, near-limit items, bundle sizes, test counts. A test
 * stage that skipped its run on a cache hit reports no count, so it carries
 * the last known one (from `previousTests`), marked cached.
 */
export function readSignals(stages = [], { previousTests = {} } = {}) {
  const warnings = new Map();
  const near = [];
  const bundles = {};
  const tests = {};
  for (const stage of stages) {
    const output = String(stage.output || '');
    let count = 0;
    let failed = 0;
    let sawTests = false;
    for (const line of output.split('\n')) {
      if (WARNED.test(line) && !CHATTER.test(line)) {
        const id = warningId(line);
        if (id && !warnings.has(id)) warnings.set(id, { id, text: line.trim(), stage: stage.label, kind: warningKind(line) });
      }
      near.push(...parseNearItems(line));
      const bundle = BUNDLE_SIZE.exec(line);
      if (bundle) bundles[bundle[1] === 'core' ? 'core' : `${bundle[1]}:${bundle[2]}`] = Number(bundle[3]);
      const testCount = TEST_COUNT.exec(line);
      if (testCount) {
        sawTests = true;
        if (testCount[1] === 'tests') count += Number(testCount[2]);
        else failed += Number(testCount[2]);
      }
    }
    if (sawTests) tests[stage.label] = { count, failed };
    else if (/\bcache\b/.test(output) && previousTests[stage.label]) tests[stage.label] = { ...previousTests[stage.label], cached: true };
  }
  return { warnings: [...warnings.values()], near, bundles, tests };
}

/** One history line: small enough that two hundred of them stay cheap to read. */
export function historyEntry(receipt) {
  return {
    at: receipt.at,
    sha: receipt.sha,
    dirty: receipt.dirty?.count || 0,
    verdict: receipt.verdict,
    ms: receipt.ms,
    warnings: receipt.signals.warnings.map((warning) => warning.id),
    warningTexts: Object.fromEntries(receipt.signals.warnings.map((warning) => [warning.id, warning.text])),
    near: receipt.signals.near.map((entry) => entry.key),
    bundles: receipt.signals.bundles,
    tests: receipt.signals.tests,
  };
}

/**
 * This run against the history before it (oldest first): warnings that are
 * new or cleared since the last run, bundles whose size moved, and for each
 * warning still here how many runs in a row have carried it and since when.
 */
export function compareRuns(signals, history = [], { minDeltaKiB = 0.05 } = {}) {
  const last = history.at(-1) || null;
  const ids = signals.warnings.map((warning) => warning.id);
  const lastIds = new Set(last?.warnings || []);
  const newWarnings = last ? signals.warnings.filter((warning) => !lastIds.has(warning.id)) : [];
  const cleared = last ? [...lastIds].filter((id) => !ids.includes(id)) : [];
  const standing = signals.warnings.filter((warning) => lastIds.has(warning.id)).map((warning) => {
    let runs = 1;
    let since = null;
    for (let index = history.length - 1; index >= 0; index -= 1) {
      if (!(history[index].warnings || []).includes(warning.id)) break;
      runs += 1;
      since = history[index].at;
    }
    return { ...warning, runs, since };
  });
  const moved = [];
  if (last?.bundles) {
    for (const [name, kib] of Object.entries(signals.bundles)) {
      const before = last.bundles[name];
      if (typeof before !== 'number') continue;
      const delta = kib - before;
      if (Math.abs(delta) >= minDeltaKiB) moved.push({ name, from: before, to: kib, delta });
    }
    moved.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  }
  return { last, newWarnings, cleared, standing, moved };
}

const shortSha = (sha) => (sha ? String(sha).slice(0, 8) : 'the last run');
const day = (iso) => (iso ? String(iso).slice(0, 10) : '');

/** The closing lines of a gate run: only what changed, and how long the rest has waited. */
export function formatComparison(comparison, { prefix = '[check:local]', limit = 5 } = {}) {
  const { last, newWarnings, cleared, standing, moved } = comparison;
  if (!last) return [`${prefix} first run with a history here; the next run will say what changed`];
  const since = `since ${shortSha(last.sha)}${last.dirty ? ` (+${last.dirty} uncommitted)` : ''}`;
  const lines = [];
  for (const warning of newWarnings.slice(0, limit)) lines.push(`${prefix} new ${since}: ${warning.text}`);
  if (newWarnings.length > limit) lines.push(`${prefix} … ${newWarnings.length - limit} more new warnings (receipt)`);
  for (const id of cleared.slice(0, limit)) lines.push(`${prefix} cleared ${since}: ${id}`);
  if (moved.length) {
    const items = moved.slice(0, 6).map((row) => `${row.name} ${row.delta > 0 ? '+' : '−'}${Math.abs(row.delta).toFixed(1)} KiB → ${row.to.toFixed(1)}`);
    lines.push(`${prefix} moved ${since}: ${items.join(', ')}${moved.length > 6 ? `, … ${moved.length - 6} more` : ''}`);
  }
  const words = (warning) => warning.text.replace(/^(?:⚠\s*|warn:\s*)+/i, '');
  const decisions = standing.filter((warning) => warningKind(warning.text) === 'decision');
  const drift = standing.filter((warning) => warningKind(warning.text) !== 'decision');
  if (decisions.length) {
    const oldest = decisions.reduce((a, b) => (b.runs > a.runs ? b : a));
    const when = oldest.since ? ` since ${day(oldest.since)}` : '';
    lines.push(`${prefix} awaiting a decision, ${oldest.runs} runs${when}: ${decisions.map((warning) => clip(words(warning), 48)).join(' · ')}`);
  }
  if (drift.length) {
    const oldest = drift.reduce((a, b) => (b.runs > a.runs ? b : a));
    const when = oldest.since ? ` since ${day(oldest.since)}` : '';
    lines.push(`${prefix} standing: ${drift.length} warning(s) carried over; the oldest for ${oldest.runs} runs${when}: ${clip(words(oldest), 72)}`);
  }
  return lines;
}

/** How to rerun one stage alone, from the command the gate spawned. */
export function rerunCommand(result) {
  if (!Array.isArray(result?.command) || !result.command.length) return null;
  const [command, ...args] = result.command;
  const program = /(^|\/)node(\.exe)?$/.test(command) || command === process.execPath ? 'node' : command;
  return [program, ...args].map((part) => (/\s/.test(part) ? JSON.stringify(part) : part)).join(' ');
}

/** Keep the newest `limit` history lines. */
export function trimHistory(lines = [], limit = HISTORY_LIMIT) {
  return lines.filter(Boolean).slice(-limit);
}

/**
 * Many runs read as one picture: how often the gate passed, how each bundle
 * and the test count moved over the window, and every warning still standing
 * with the first run that carried it. For a director between pushes.
 */
export function digestHistory(entries = []) {
  if (!entries.length) return { runs: 0 };
  const first = entries[0];
  const last = entries.at(-1);
  const passed = entries.filter((entry) => entry.verdict === 'passed').length;
  const bundles = {};
  for (const name of Object.keys(last.bundles || {})) {
    const series = entries.map((entry) => entry.bundles?.[name]).filter((value) => typeof value === 'number');
    if (series.length) bundles[name] = { first: series[0], last: series.at(-1), max: Math.max(...series) };
  }
  const totalTests = (entry) => Object.values(entry.tests || {}).reduce((sum, row) => sum + row.count, 0);
  const standing = (last.warnings || []).map((id) => {
    let firstAt = last.at;
    let runs = 0;
    for (let index = entries.length - 1; index >= 0 && (entries[index].warnings || []).includes(id); index -= 1) {
      firstAt = entries[index].at;
      runs += 1;
    }
    const text = String(last.warningTexts?.[id] || id).replace(/^(?:⚠\s*|warn:\s*)+/i, '');
    return { id, text, kind: warningKind(text), runs, since: firstAt };
  }).sort((a, b) => b.runs - a.runs);
  return {
    runs: entries.length,
    from: first.at,
    to: last.at,
    passed,
    tests: { first: totalTests(first), last: totalTests(last) },
    bundles,
    near: last.near || [],
    standing,
  };
}

export function formatDigest(digest, { prefix = '[check:signals]' } = {}) {
  if (!digest.runs) return [`${prefix} no history yet: run npm run check:local`];
  const lines = [`${prefix} ${digest.runs} runs ${day(digest.from)} → ${day(digest.to)}; ${digest.passed} passed`];
  const grown = Object.entries(digest.bundles)
    .filter(([, row]) => Math.abs(row.last - row.first) >= 0.05)
    .sort((a, b) => Math.abs(b[1].last - b[1].first) - Math.abs(a[1].last - a[1].first))
    .slice(0, 8)
    .map(([name, row]) => `${name} ${row.first.toFixed(1)} → ${row.last.toFixed(1)} KiB`);
  if (grown.length) lines.push(`${prefix} bundles moved: ${grown.join(', ')}`);
  if (digest.tests.first || digest.tests.last) lines.push(`${prefix} tests ${digest.tests.first} → ${digest.tests.last}`);
  if (digest.near.length) lines.push(`${prefix} near a limit now: ${digest.near.join(', ')}`);
  for (const row of digest.standing) {
    const label = row.kind === 'decision' ? 'awaiting a decision' : 'standing';
    lines.push(`${prefix} ${label} ${row.runs} run(s) since ${day(row.since)}: ${row.text || row.id}`);
  }
  return lines;
}
