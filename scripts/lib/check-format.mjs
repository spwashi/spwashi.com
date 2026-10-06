/**
 * How a gate run reads in a terminal: phases under a rule, one aligned line
 * per stage (mark, name, time), each stage's own lines indented beneath it
 * without repeating its tag, warnings under one glyph, long lines wrapped at
 * a word instead of cut, and the run closing on what changed and its
 * verdict, last, so `tail -1` answers. Colour only when the stream is a
 * terminal and NO_COLOR is unset (FORCE_COLOR overrides), so an agent's
 * captured output carries no escape codes.
 *
 * Presentation only. The receipt and the log keep every line as the tools
 * printed it; scripts/lib/check-signals.mjs reads those.
 */
import process from 'node:process';

import { WARNED, rerunCommand, stageHeadline, testFailureExcerpt, failingTestFiles, warningKind } from './check-signals.mjs';

const LABEL = 10;
const STAGE = 28;

export function createStyle({ color = false, width = 100 } = {}) {
  const paint = (code) => (text) => (color ? `\x1b[${code}m${text}\x1b[0m` : String(text));
  return {
    color,
    width: Math.max(60, Math.min(width, 120)),
    bold: paint(1),
    dim: paint(2),
    red: paint(31),
    green: paint(32),
    yellow: paint(33),
    magenta: paint(35),
  };
}

export function styleForStream(stream = process.stdout, env = process.env) {
  const forced = env.FORCE_COLOR !== undefined && env.FORCE_COLOR !== '' ? env.FORCE_COLOR !== '0' : null;
  const color = forced ?? (Boolean(stream?.isTTY) && env.NO_COLOR === undefined && env.TERM !== 'dumb');
  return createStyle({ color, width: stream?.isTTY && stream.columns ? stream.columns : 100 });
}

/** Length as it shows, without colour codes. */
export const visibleLength = (text) => String(text).replace(/\x1b\[[0-9;]*m/g, '').length;

/**
 * Wrap at spaces to `width`. The first line starts with `first` (already
 * counted), continuation lines with `indent`. A word longer than a line
 * stands alone rather than being cut. A line that already fits is returned
 * as written, so its own spacing (an aligned column) survives.
 */
export function wrap(text, width, { first = '', indent = '' } = {}) {
  if (visibleLength(`${first}${text}`) <= width) return [`${first}${text}`];
  const words = String(text).split(/ +/).filter(Boolean);
  const lines = [];
  let line = first;
  let fresh = true;
  for (const word of words) {
    const candidate = fresh ? `${line}${word}` : `${line} ${word}`;
    if (!fresh && visibleLength(candidate) > width) {
      lines.push(line);
      line = `${indent}${word}`;
    } else {
      line = candidate;
    }
    fresh = false;
  }
  lines.push(line);
  return lines;
}

export function rule(title, style) {
  const head = `── ${title} `;
  const length = Math.min(style.width, 72);
  return `${style.dim('──')} ${title} ${style.dim('─'.repeat(Math.max(3, length - visibleLength(head))))}`;
}

/**
 * Wrap whole segments (joined by `sep`) to `width`; a segment is split at
 * words only when it is longer than a line by itself.
 */
export function wrapSegments(segments, width, { first = '', indent = '', sep = ' · ' } = {}) {
  const lines = [];
  let line = first;
  let fresh = true;
  for (const segment of segments) {
    const candidate = fresh ? `${line}${segment}` : `${line}${sep}${segment}`;
    if (visibleLength(candidate) <= width) {
      line = candidate;
    } else if (fresh) {
      const parts = wrap(segment, width, { first: line, indent });
      lines.push(...parts.slice(0, -1));
      line = parts.at(-1);
    } else {
      lines.push(line);
      const parts = wrap(segment, width, { first: indent, indent });
      lines.push(...parts.slice(0, -1));
      line = parts.at(-1);
    }
    fresh = false;
  }
  lines.push(line);
  return lines;
}

/** How full an item is, from "x of y" or "x/y", as a whole percent; null when unreadable. */
export function fullness(value = '') {
  const match = /(\d+(?:\.\d+)?)\s*(?:of|\/)\s*(\d+(?:\.\d+)?)/.exec(value);
  if (!match || !Number(match[2])) return null;
  return Math.round((Number(match[1]) / Number(match[2])) * 100);
}

/**
 * A labelled row: the label in a fixed column, the text wrapped beside it,
 * and an optional suffix (an age, a count) kept whole: on the last line when
 * it fits, else on a line of its own.
 */
export function row(label, text, style, { paint = (value) => value, suffix = '' } = {}) {
  const pad = label.padEnd(LABEL);
  const indent = ' '.repeat(LABEL + 2);
  const lines = wrap(text, style.width, { first: `${paint(pad)}`, indent });
  if (suffix) {
    const last = lines.length - 1;
    if (visibleLength(lines[last]) + visibleLength(suffix) <= style.width) lines[last] += suffix;
    else lines.push(`${indent}${suffix.trimStart()}`);
  }
  return lines;
}

/**
 * A stage's own line as it shows under the stage: its tag dropped (the stage
 * line names it), "warn:" and "⚠" as one glyph, a bare "passed" or "ok"
 * dropped since the mark already says so, and a count of warnings dropped
 * since the warnings follow. Returns null for a line with nothing left.
 */
export function displayLine(line) {
  let text = String(line).trim().replace(/^\[[\w:./-]+\]\s+/, '');
  if (WARNED.test(line)) return { warn: true, text: text.replace(/^(?:⚠\s*|warn:\s*|warn\s+)+/i, '') };
  if (/^warnings=\d+$/.test(text)) return null;
  const pass = /^(?:passed|ok)\b[\s—:-]*\(?(.*?)\)?$/i.exec(text);
  if (pass) text = pass[1].trim();
  return text ? { warn: false, text } : null;
}

// A census line: key=value pairs, optionally after one word ("css files=217 …").
const CENSUS = /^(?:\w+ )?[\w-]+=\S+(?: [\w-]+=\S+)*$/;
const NEAR = /^near (soft )?budget: (.+)$/;

/** Items of a near-budget line, as [name, how close]. */
export function nearItems(text) {
  const match = NEAR.exec(text);
  if (!match) return null;
  return match[2].split(/,\s+(?=\S+ \d)/).map((item) => {
    const at = item.indexOf(' ');
    return at < 0 ? [item, ''] : [item.slice(0, at), item.slice(at + 1)];
  });
}

/**
 * A passing stage's lines as they show: consecutive census lines joined into
 * one, and a near-budget line as an aligned list, one item a line.
 */
export function formatHeadline(lines, style, { body = '    ' } = {}) {
  const shown = lines.map(displayLine).filter(Boolean);
  const out = [];
  for (let index = 0; index < shown.length; index += 1) {
    const { warn, text } = shown[index];
    if (!warn && CENSUS.test(text)) {
      const census = [text];
      while (index + 1 < shown.length && !shown[index + 1].warn && CENSUS.test(shown[index + 1].text)) census.push(shown[(index += 1)].text);
      out.push(...wrapSegments(census, style.width, { first: body, indent: `${body}  ` }));
      continue;
    }
    const items = !warn ? nearItems(text) : null;
    if (items) {
      out.push(`${body}${style.yellow(text.startsWith('near soft') ? 'near soft budget' : 'near budget')}`);
      const width = Math.min(style.width - 30, Math.max(...items.map(([name]) => name.length)));
      for (const [name, value] of items) {
        const percent = fullness(value);
        const share = percent === null ? '    ' : `${String(percent).padStart(3)}%`;
        out.push(`${body}  ${name.padEnd(width)}  ${percent !== null && percent >= 100 ? style.yellow(share) : share}  ${value}`);
      }
      continue;
    }
    const first = warn ? `${body}${style.yellow('⚠')} ` : body;
    out.push(...wrap(text, style.width, { first, indent: `${body}  ` }));
  }
  return out;
}

/** One stage: its mark, name and time, then what it said, indented. */
export function formatStage(result, { verbose = false, style = createStyle(), stageWidth = STAGE } = {}) {
  const { label, status, ms, output = '', cache, headline } = result;
  const ok = status === 0;
  const mark = ok ? style.green('✔') : style.red('✖');
  const time = style.dim(`${(ms / 1000).toFixed(2)}s`.padStart(7));
  const name = label.padEnd(stageWidth);
  const lines = [];
  const body = '    ';
  // A stage that reports only that it used its cache says so on its own line.
  let cached = Boolean(cache);
  if (output.trim()) {
    if (verbose || !ok) {
      const raw = !verbose && headline?.tests ? testFailureExcerpt(output) : output.trimEnd().split('\n');
      for (const line of raw) lines.push(line ? `${body}${line}` : '');
    } else {
      const headlineLines = stageHeadline(output, headline).filter((line) => {
        const shown = displayLine(line);
        if (shown && !shown.warn && /^cache\b/.test(shown.text)) {
          cached = true;
          return false;
        }
        return true;
      });
      lines.push(...formatHeadline(headlineLines, style, { body }));
    }
  }
  lines.unshift(`${mark} ${ok ? name : style.bold(name)} ${time}${cached ? style.dim(' cache') : ''}`);
  if (!ok) {
    const rerun = rerunCommand(result);
    if (rerun) lines.push(...wrap(rerun, style.width, { first: `${body}${style.bold('rerun')}  `, indent: `${body}       ` }));
    const files = headline?.fileCommand ? failingTestFiles(output) : [];
    if (files.length) {
      const command = rerunCommand({ command: [...headline.fileCommand, ...files] });
      lines.push(...wrap(command, style.width, { first: `${body}${style.bold('file')}   `, indent: `${body}       ` }));
    }
  }
  return lines;
}

/** A phase: its rule, then its stages, names aligned across phases. */
export function formatPhase(phase, results, options = {}) {
  const style = options.style || createStyle();
  return [rule(phase, style), ...results.flatMap((result) => formatStage(result, { ...options, style }))];
}

const shortSha = (sha) => (sha ? String(sha).slice(0, 8) : 'the last run');
const day = (iso) => (iso ? String(iso).slice(0, 10) : '');
const words = (text) => String(text).replace(/^(?:⚠\s*|warn:\s*|warn\s+)+/i, '');
const age = (warning, style) => (warning.runs > 1 ? style.dim(` · ${warning.runs} runs${warning.since ? ` since ${day(warning.since)}` : ''}`) : '');
const ageOf = (entry, style) => style.dim(` · ${entry.runs} run${entry.runs === 1 ? '' : 's'} since ${day(entry.since)}`);

/** What changed since the last run, as labelled rows under one rule. */
export function formatComparison(comparison, { style = createStyle(), limit = 5 } = {}) {
  const { last, newWarnings, cleared, standing, moved } = comparison;
  if (!last) return [rule('history', style), ...row('first', 'run with a history here; the next run will say what changed', style)];
  const lines = [rule(`since ${shortSha(last.sha)}${last.dirty ? ` +${last.dirty} uncommitted` : ''}`, style)];
  const decisions = standing.filter((warning) => warningKind(warning.text) === 'decision');
  const drift = standing.filter((warning) => warningKind(warning.text) !== 'decision');
  const rows = [
    ...newWarnings.slice(0, limit).map((warning) => ['new', `${style.yellow('⚠')} ${words(warning.text)}`, style.yellow]),
    ...(newWarnings.length > limit ? [['new', `… ${newWarnings.length - limit} more in the receipt`, style.yellow]] : []),
    ...cleared.slice(0, limit).map((id) => ['cleared', id, style.green]),
    ...decisions.map((warning) => ['decide', words(warning.text), style.magenta, age(warning, style)]),
    ...drift.map((warning) => ['standing', words(warning.text), style.dim, age(warning, style)]),
  ];
  if (moved.length) {
    const items = moved.slice(0, 6).map((entry) => `${entry.name} ${entry.delta > 0 ? '+' : '−'}${Math.abs(entry.delta).toFixed(1)} KiB → ${entry.to.toFixed(1)}`);
    rows.push(['moved', `${items.join(' · ')}${moved.length > 6 ? ` · … ${moved.length - 6} more` : ''}`, style.yellow]);
  }
  if (!rows.length) rows.push(['quiet', 'nothing new, cleared, moved or waiting', style.green]);
  let previous = null;
  for (const [label, text, paint, suffix = ''] of rows) {
    lines.push(...row(label === previous ? '' : label, text, style, { paint, suffix }));
    previous = label;
  }
  return lines;
}

/**
 * The close: where the full text is, then the verdict as the last line.
 * `tree` is { sha, dirty: { count } }.
 */
export function formatVerdict({ passed, ms, tree, failedAt = null, failed = [], log, receipt, verbose = false }, { style = createStyle() } = {}) {
  const where = tree?.sha ? ` · ${tree.sha.slice(0, 8)}${tree.dirty?.count ? ` +${tree.dirty.count} uncommitted` : ''}` : '';
  const lines = [];
  if (!passed && failed.length) lines.push(...row('failed', failed.join(', '), style, { paint: style.red }));
  if (!verbose && log) lines.push(...row('log', log, style, { paint: style.dim }));
  if (receipt) lines.push(...row('receipt', receipt, style, { paint: style.dim }));
  const title = passed
    ? style.green(`✔ check:local passed in ${(ms / 1000).toFixed(1)}s${where}`)
    : style.red(`✖ check:local failed at ${failedAt}${where}`);
  lines.push(rule(title, style));
  return lines;
}

/** Many runs as one picture, for check:signals. */
export function formatDigest(digest, { style = createStyle() } = {}) {
  if (!digest.runs) return [rule('gate history', style), ...row('empty', 'no runs yet: npm run check:local', style)];
  const span = day(digest.from) === day(digest.to) ? day(digest.to) : `${day(digest.from)} → ${day(digest.to)}`;
  const lines = [rule(`gate history · ${digest.runs} runs, ${span} · ${digest.passed} passed`, style)];
  if (digest.tests.first || digest.tests.last) {
    lines.push(...row('tests', digest.tests.first === digest.tests.last ? `${digest.tests.last}` : `${digest.tests.first} → ${digest.tests.last}`, style));
  }
  const grown = Object.entries(digest.bundles)
    .filter(([, entry]) => Math.abs(entry.last - entry.first) >= 0.05)
    .sort((a, b) => Math.abs(b[1].last - b[1].first) - Math.abs(a[1].last - a[1].first))
    .slice(0, 8)
    .map(([name, entry]) => `${name} ${entry.first.toFixed(1)} → ${entry.last.toFixed(1)} KiB`);
  if (grown.length) lines.push(...row('bundles', grown.join(' · '), style, { paint: style.yellow }));
  if (digest.near.length) lines.push(...row('near', digest.near.join(', '), style, { paint: style.yellow }));
  let previous = null;
  for (const entry of digest.standing) {
    const label = entry.kind === 'decision' ? 'decide' : 'standing';
    const paint = entry.kind === 'decision' ? style.magenta : style.dim;
    lines.push(...row(label === previous ? '' : label, entry.text || entry.id, style, { paint, suffix: ageOf(entry, style) }));
    previous = label;
  }
  return lines;
}
