/**
 * Wonder — harvest the site's open questions and the probes that settle them.
 *
 * The workbench canon carries 176 `#>wonder` blocks: a question in the
 * language's interrogative form, a hypothesis or tension, and a `!probe{}` that
 * says what you would do to find out. This site carried none. It asserted
 * (claims), it checked (validation), it remembered (caches) — but it had no
 * form for a question, so every open question lived in chat and died there.
 *
 * That gap is the reason this script exists rather than a lint rule: bringing
 * the form over is only half of it. The other half is that the form has to be
 * *recognizable in a second space*. A `?["…"]{ … }` block has a contour — the
 * question mark, the bracket, the indented probe — and that contour is what
 * makes it findable at a glance in a file. If it renders in the terminal as
 * undifferentiated prose, the convention did not actually travel; only the text
 * did. So the output here preserves the contour deliberately:
 *
 *   proximity      a wonder prints adjacent to the surface that holds it and to
 *                  the neighbours it names, because a question's meaning is
 *                  partly its location. Regional adjacency is not decoration -
 *                  `~<path>` and `@ref` are the edges of the graph a reader
 *                  traverses to know whether the question is still live.
 *   alignment      hypothesis, tension and probe align to a shared column, so
 *                  the eye reads down the kind of statement rather than across
 *                  the sentence. Lists keep their `#[ ]` bracketing.
 *   similarity     operators keep one hue each: the same syntax highlighting
 *                  the editor gives them, so `?` reads as `?` in both places.
 *   common region  each wonder is enclosed, because a brace is a wall and the
 *                  wall is what makes the group a group.
 *
 * Those four are the Gestalt grouping principles, which is not a coincidence:
 * they are also how a reader perceives structure without reading it, which is
 * the same problem .spw/conventions/arrival-electrostatics.spw is solving in
 * the browser. A convention that only holds in one medium is a style, not a
 * convention.
 *
 * Usage:
 *   node scripts/wonder.mjs                 # site wonders plus live plan questions
 *   node scripts/wonder.mjs --probes        # probe lines only, for running
 *   node scripts/wonder.mjs --surface wonder_plan
 *   node scripts/wonder.mjs --json
 *   node scripts/wonder.mjs --contour       # each wonder's lifecycle and what its block lacks
 *   node scripts/wonder.mjs --run [--surface x] [--limit n] [--write]
 *                                           # run read-only probes; keep the receipts in .spw/gen/
 *   node scripts/wonder.mjs --canon         # include the workbench's 176
 *   node scripts/wonder.mjs --summary       # one count line, then one line a question
 *
 * The lifecycle is the one .spw/caches/theory-map-2026-10.spw ^"lifecycle"
 * gives: ~#expect says what the probe should show before it runs; a
 * >>[date] probe line in a stream that names the wonder says what it showed;
 * ~#answer names the alternative left in the $% set; ~#retired says why the
 * question stopped mattering. ~#probe(run) marks a probe that is a command and
 * ~#probe(read) one that is a judgment. A run proposes; the answer and its
 * verdict stay a reader's, written as ~#answer beside a result_ref in the
 * claim protocol's terms (capabilities.spw inquiry_loop).
 *
 * --summary is what check:local runs: "[wonder] N open on S surfaces · U without
 * a probe", then "? <key> <file>:<line> <question>" per wonder. The key is a
 * hash of the question's words, so a wonder keeps it when lines above it move,
 * and the gate can say which questions opened or settled since its last run.
 *
 * Live plan .spw under .agents/plans is part of the harvest. archive/ is not.
 * The rest of .agents stays out: diaries and state are not questions.
 */

import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { writeProjectionIndex } from './lib/spw-projections.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SPW_ROOT = path.join(ROOT, '.spw');
const PLANS_ROOT = path.join(ROOT, '.agents', 'plans');
const CANON = path.join(SPW_ROOT, '_workbench');
// Generated projections (route trees, session memos) restate surfaces; a question there would be harvested twice.
const GENERATED = path.join(SPW_ROOT, 'gen');

/**
 * One hue per operator, matching how the editor colours them. Similarity is a
 * grouping principle: `?` must read as `?` in every space it appears, or the
 * reader learns two vocabularies for one language.
 */
const ANSI = {
  reset: '[0m',
  dim: '[2m',
  bold: '[1m',
  question: '[38;5;213m',   // ?  — interrogative
  ground: '[38;5;80m',      // #> — grounds / addresses
  induct: '[38;5;179m',     // ~  — inducts, carries across
  project: '[38;5;141m',    // ^  — projects
  probe: '[38;5;114m',      // !  — acts
  measure: '[38;5;110m',    // $% — measures
  wall: '[38;5;240m',       // braces / enclosure
};

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (hue, text) => (useColor ? `${ANSI[hue]}${text}${ANSI.reset}` : text);

async function collectSpw(dir, out = [], { includeCanon = false, skipArchive = false } = {}) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!includeCanon && full === CANON) continue;
      if (full === GENERATED) continue;
      if (entry.name === 'node_modules') continue;
      if (skipArchive && entry.name === 'archive') continue;
      await collectSpw(full, out, { includeCanon, skipArchive });
    } else if (entry.name.endsWith('.spw')) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Parse `#>wonder_x` / `?["…"]{ … }` blocks by brace depth rather than by line
 * shape, so a probe containing braces does not truncate the block.
 */
// The form opening a wonder, unless it sits inside a backtick span: a value
// that shows the syntax (`?["Question"]{ … }`) documents a wonder, it is not one.
const WONDER_OPEN = /\?\[["`](.+?)["`]\]\s*\{/;
export function matchWonderOpen(line = '') {
  const match = WONDER_OPEN.exec(line);
  if (!match) return null;
  const ticks = (line.slice(0, match.index).match(/`/g) || []).length;
  return ticks % 2 === 0 ? match : null;
}

export function parseWonders(source, file) {
  const wonders = [];
  const lines = source.split('\n');

  for (let i = 0; i < lines.length; i += 1) {
    const idMatch = lines[i].match(/^#>(\w*wonder\w*)/i);
    const openMatch = matchWonderOpen(lines[i]);
    // A wonder is either an id line followed by the question, or a bare `?[…]{`.
    let id = null;
    let questionLine = i;
    if (idMatch) {
      id = idMatch[1];
      questionLine = i + 1;
    } else if (!openMatch) {
      continue;
    }

    const qMatch = matchWonderOpen(lines[questionLine]);
    if (!qMatch) continue;

    // Walk to the matching close brace.
    let depth = 0;
    let end = questionLine;
    for (let j = questionLine; j < lines.length; j += 1) {
      for (const ch of lines[j]) {
        if (ch === '{') depth += 1;
        else if (ch === '}') depth -= 1;
      }
      if (depth <= 0 && j > questionLine - 1) { end = j; break; }
    }

    const body = lines.slice(questionLine + 1, end);
    const field = (name) => {
      const line = body.find((l) => l.trim().startsWith(`~#${name}:`));
      return line ? line.replace(/^\s*~#\w+:\s*/, '').replace(/^["`]|["`]$/g, '') : '';
    };

    // A probe quoted with "…" carries Spw string escapes; unescape it so the
    // text is what a shell would be handed. A backtick probe is already raw.
    const probes = body
      .filter((l) => l.includes('!probe{'))
      .map((l) => {
        const quoted = /^\s*!probe\{\s*"/.test(l);
        const text = l.replace(/^\s*!probe\{\s*["`]?/, '').replace(/["`]?\s*\}\s*$/, '');
        return quoted ? text.replace(/\\(["\\])/g, '$1') : text;
      });

    const measures = body
      .filter((l) => l.trim().startsWith('$%['))
      .map((l) => l.trim());

    // Referentiality: what this question reaches for. `~<path>` is a neighbour
    // read, `@name` is a named root. Both are edges, and a question with no
    // edges is a question with no way to become answerable.
    const refs = [...body.join('\n').matchAll(/~<["`]?([^">`]+)["`]?>/g)].map((m) => m[1]);
    const roots = [...body.join('\n').matchAll(/@([a-z_][\w]*)/gi)].map((m) => m[1]);
    const depthTag = body.join('\n').match(/#:depth\s+#!(\w+)/)?.[1] || '';
    // Apposition unit cells: `~#name(body)`, the form `spw lattice` reads. The
    // site had none — it wrote `// lens: …` as a comment, which is invisible to
    // the lattice and therefore uncountable. A reading placed beside its subject
    // is apposition; a reading placed in a comment is only a note.
    const readings = Object.fromEntries(
      [...body.join('\n').matchAll(/~#(\w+)\(([^)]*)\)/g)].map((m) => [m[1], m[2].trim()]),
    );
    const lens = readings.lens || body.join('\n').match(/\/\/\s*lens:\s*(.+)$/m)?.[1]?.trim() || '';

    wonders.push({
      id: id || `wonder@${questionLine + 1}`,
      file: path.relative(ROOT, file),
      line: questionLine + 1,
      question: qMatch[1],
      depth: depthTag,
      lens,
      hypothesis: field('hypothesis'),
      tension: field('tension'),
      expect: field('expect'),
      answer: field('answer'),
      retired: field('retired'),
      unblocks: field('unblocks'),
      probeKind: readings.probe === 'run' || readings.probe === 'read' ? readings.probe : '',
      goal: field('goal'),
      taste: field('taste'),
      probes,
      measures,
      refs,
      readings,
      roots: [...new Set(roots)],
      canon: file.startsWith(CANON),
    });

    i = end;
  }
  return wonders;
}

/**
 * A probe is a command when its block marks it ~#probe(run), or when it opens
 * with a command a shell knows; otherwise it is a reading a person makes.
 */
const COMMAND_HEAD = /^(?:rg|grep|git|npm|node|sed|wc|ls|test|find|cat|head|tail|awk|jq|diff|du|stat|curl|python3?|bash|sh|cd)\b/;
// Outside its quotes, a command does not end a sentence and start another, or
// set a clause off with a dash: "grep swipe in x.js. if the count is 0, …" is
// an instruction to a person that happens to open with a command's name.
const PROSE = /;\s+then\b|\.\s+[a-z]|\s[—–]\s|,\s+(?:then|and|if|so)\b/;
const outsideQuotes = (text) => String(text).replace(/'[^']*'|"(?:[^"\\]|\\.)*"/g, "''");
export function probeKind(probe = '', marked = '') {
  if (marked === 'run' || marked === 'read') return marked;
  const command = String(probe).trim();
  return COMMAND_HEAD.test(command) && !PROSE.test(outsideQuotes(command)) ? 'run' : 'read';
}

/**
 * Whether --run may execute a probe here: read-only commands, joined by pipes
 * only. Anything that could write, chain, substitute or redirect is refused,
 * and so is a script this file does not know to be a reading.
 */
const SAFE_HEADS = new Set(['rg', 'grep', 'wc', 'head', 'tail', 'sort', 'uniq', 'cut', 'tr', 'ls', 'test', 'cat', 'find', 'git', 'npm', 'sed']);
const SAFE_GIT = /^git\s+(?:-C\s+\S+\s+)?(?:log|show|ls-files|grep|rev-parse|diff\s+--stat|status\s+--short)\b/;
// Scripts read before they were listed: each reads the tree and prints, with no
// file written and no browser launched. audit:layer-flip, audit:living-terms,
// audit:portable and audit:css-custom-properties write; audit:root-* and sense
// drive a headless browser. They stay off this list.
const SAFE_NPM = /^npm\s+run\s+(?:-s\s+)?(?:wonder(?::json|:measures)?|audit:(?:braces|copy(?::\w+)?|page-structure|plans|route-links|spw-tree|js-tree(?::json)?|region-seats|folio-highres)|spw:integrity(?::json)?|spw:routes|css:payload(?::json)?|css:tree|check:agents|tending:queue|plans:index:check|ecology:language(?::json)?|spw\s+--\s+(?:skim|analyze|query|lint|resolve|fingerprint|tree|roots|doctor|lattice|delta|--help))(?=\s|$)/;
const WRITE_FLAGS = /(?:^|\s)--(?:write|fix|receipt|out|apply|reap)\b/;
// stderr folded into stdout, or dropped, is a reading still.
const QUIET_STDERR = /\s2>(?:&1|\/dev\/null)(?=\s|$)/g;
/**
 * Split a command on its unquoted pipes. Returns null when it chains,
 * substitutes or redirects outside single quotes, since sh would act on those.
 */
export function pipeStages(command = '') {
  const stages = [];
  let current = '';
  let quote = '';
  for (let i = 0; i < command.length; i += 1) {
    const ch = command[i];
    if (quote === "'") {
      if (ch === "'") quote = '';
      current += ch;
      continue;
    }
    if (ch === '\\') {
      current += ch + (command[i + 1] ?? '');
      i += 1;
      continue;
    }
    if (ch === '`' || (ch === '$' && command[i + 1] === '(')) return null;
    if (quote === '"') {
      if (ch === '"') quote = '';
      current += ch;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === ';' || ch === '&' || ch === '>' || ch === '<') return null;
    if (ch === '|') {
      if (command[i + 1] === '|') return null;
      stages.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (quote) return null;
  stages.push(current.trim());
  return stages;
}

export function safeProbeCommand(probe = '') {
  const command = String(probe).trim();
  if (!command) return { ok: false, reason: 'empty' };
  const stages = pipeStages(command.replace(QUIET_STDERR, ''));
  if (!stages) return { ok: false, reason: 'chains, substitutes or redirects' };
  for (const part of stages) {
    const head = part.split(/\s+/)[0];
    if (!SAFE_HEADS.has(head)) return { ok: false, reason: `${head || 'an empty stage'} is not a reading command here` };
    if (head === 'sed' && !/^sed\s+-n\b/.test(part)) return { ok: false, reason: 'sed without -n may edit' };
    if (head === 'find' && /\s-(?:delete|exec|execdir|ok|fprint\w*)\b/.test(part)) return { ok: false, reason: 'find that acts' };
    if (head === 'git' && !SAFE_GIT.test(part)) return { ok: false, reason: 'a git command that is not a reading' };
    if (head === 'npm' && (!SAFE_NPM.test(part) || WRITE_FLAGS.test(part))) return { ok: false, reason: 'an npm script not known to only read' };
  }
  return { ok: true, reason: '' };
}

/** Where a wonder stands: retired, answered, probed (a stream line names it), or open. */
export function lifecycleOf(wonder, probed = new Map()) {
  if (wonder.retired) return 'retired';
  if (wonder.answer) return 'answered';
  if (probed.has(wonder.id)) return 'probed';
  return 'open';
}

/** Stream lines that record a probe: >>[date] probe … naming wonder ids. */
export function readProbeLines(source = '') {
  const found = new Map();
  for (const line of String(source).split('\n')) {
    const hit = /^\s*>>\[(\d{4}-\d{2}-\d{2})[^\]]*\]\s+probe\b/.exec(line);
    if (!hit) continue;
    for (const id of line.match(/\b\w*wonder\w*/gi)?.filter((token) => token.includes('_')) || []) {
      if (!found.has(id) || found.get(id) < hit[1]) found.set(id, hit[1]);
    }
  }
  return found;
}

/**
 * Regional proximity: which other surfaces sit near this one? A sibling in the
 * same directory is nearer than a cousin, and nearness is how a reader decides
 * whether a question has already been answered next door.
 */
function neighbourhood(wonder, allFiles) {
  const dir = path.dirname(wonder.file);
  return allFiles
    .map((f) => path.relative(ROOT, f))
    .filter((f) => f !== wonder.file && path.dirname(f) === dir)
    .map((f) => path.basename(f, '.spw'));
}

/** Wrap prose to a column so alignment survives long sentences. */
function wrap(text, width, indent) {
  const words = String(text).split(/\s+/);
  const out = [];
  let line = '';
  for (const word of words) {
    if (line.length + word.length + 1 > width) {
      out.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) out.push(line);
  return out.map((l, index) => (index === 0 ? l : indent + l)).join('\n');
}

/**
 * Render one wonder as an enclosed region. The label column is fixed so the eye
 * can read down the kinds — hypothesis, tension, probe — instead of across the
 * sentences. That column is the alignment; the enclosure is the common region.
 */
function renderWonder(wonder, neighbours) {
  const LABEL = 14;
  const WIDTH = 84;
  const indent = ' '.repeat(LABEL + 2);
  const lines = [];

  const bar = paint('wall', '│ ');
  const label = (name, hue) => paint(hue, name.padEnd(LABEL));

  lines.push(paint('wall', '┌─ ') + paint('ground', `#>${wonder.id}`)
    + paint('dim', `  ${wonder.file}:${wonder.line}`)
    + (wonder.depth ? paint('dim', `  #!${wonder.depth}`) : '')
    + (wonder.lens ? paint('dim', `  lens: ${wonder.lens}`) : ''));

  lines.push(bar + paint('question', `?["${wonder.question}"]`));

  if (wonder.taste) {
    lines.push(bar + label('~#taste', 'induct') + wrap(wonder.taste, WIDTH, indent));
  }
  if (wonder.hypothesis) {
    lines.push(bar + label('~#hypothesis', 'induct') + wrap(wonder.hypothesis, WIDTH, indent));
  }
  if (wonder.tension) {
    lines.push(bar + label('~#tension', 'induct') + wrap(wonder.tension, WIDTH, indent));
  }
  if (wonder.goal) {
    lines.push(bar + label('~#goal', 'induct') + wrap(wonder.goal, WIDTH, indent));
  }
  for (const probe of wonder.probes) {
    lines.push(bar + label('!probe', 'probe') + wrap(probe, WIDTH, indent));
  }
  for (const measure of wonder.measures) {
    lines.push(bar + label('$%measure', 'measure') + paint('measure', measure));
  }

  // Referentiality and proximity, printed as the question's edges.
  const edges = [];
  if (wonder.roots.length) edges.push(`@${wonder.roots.slice(0, 6).join(' @')}`);
  if (wonder.refs.length) edges.push(`~<${wonder.refs.join('> ~<')}>`);
  if (edges.length) {
    lines.push(bar + label('edges', 'induct') + paint('dim', edges.join('  ')));
  }
  if (neighbours.length) {
    lines.push(bar + label('near', 'induct')
      + paint('dim', wrap(neighbours.slice(0, 8).join(', '), WIDTH, indent)));
  }

  lines.push(paint('wall', '└' + '─'.repeat(3)));
  return lines.join('\n');
}

/**
 * A `$%[…]` list is a component contract before it is a note: it names what a
 * surface must be able to show for the question above it to become answerable.
 * Collected across every wonder, the substrates are the backlog of inspection
 * components the site has implicitly promised itself.
 *
 * Grouping is by substrate root (`route.`, `seat.`, `module.`…) because the
 * root is the region that would have to serialize itself to satisfy it. A root
 * with many demands and no surface is a component waiting to be designed.
 */
/**
 * Where a substrate could come from. A probe is only runnable if something in
 * the repo actually produces the measurement it asks for, so resolution is a
 * grep against the surfaces that produce measurements rather than a hardcoded
 * allowlist — a new producer makes a substrate resolvable without editing this
 * file, which is the property that lets the backlog shrink on its own.
 */
// A sensor names the roots it measures. Without them a large script lends its
// generic keys (kept, same, status) to every question that happens to use the
// word: a trial on 2026-10-27 resolved 71 more terms that way, about ten honestly.
const PRODUCERS = [
  ['scripts/page-reasons.mjs', 'measure'],
  ['public/js/runtime/arrival/arrival-shells.js', 'runtime'],
  ['public/js/runtime/arrival/load-trace.js', 'runtime'],
  ['public/js/runtime/memory/familiarity-gate.js', 'runtime'],
  ['public/js/site.js', 'api'],
  ['scripts/spw-routes.mjs', 'sensor', ['diff', 'shape', 'tree']],
  ['scripts/audit-spw-tree.mjs', 'sensor', ['spw']],
  ['scripts/build-expression-manifest.mjs', 'sensor', ['expression']],
  ['scripts/tending-queue.mjs', 'sensor', ['plan']],
];

async function resolveSubstrates(terms) {
  const sources = [];
  for (const [file, kind, roots = null] of PRODUCERS) {
    try {
      sources.push({ file, kind, roots, text: await readFile(path.join(ROOT, file), 'utf8') });
    } catch {
      // A missing producer is not an error; it just cannot resolve anything.
    }
  }

  const resolved = new Map();
  for (const term of terms) {
    const field = term.includes('.') ? term.split('.').slice(1).join('.') : term;
    const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // A mention is not a producer. Require the field to appear in a producing
    // position — an object key, an assignment, or an accessor — or `liminality`
    // resolves against any file that merely says the word, which is how a
    // backlog quietly reports itself as complete.
    const probe = new RegExp(`(^|[\\s{,(])${escaped}\\s*[:=]|\\bget\\s+${escaped}\\b`, 'm');
    const root = term.includes('.') ? term.split('.')[0] : '';
    const hit = sources.find((source) => (!source.roots || source.roots.includes(root)) && probe.test(source.text));
    resolved.set(term, hit ? { by: hit.file, kind: hit.kind } : null);
  }
  return resolved;
}

function renderMeasures(wonders, resolution = new Map()) {
  const byRoot = new Map();
  for (const wonder of wonders) {
    for (const measure of wonder.measures) {
      const inner = measure.replace(/^\$%\[/, '').replace(/\]$/, '');
      for (const term of inner.split(',').map((t) => t.trim()).filter(Boolean)) {
        const root = term.includes('.') ? term.split('.')[0] : term;
        if (!byRoot.has(root)) byRoot.set(root, new Map());
        const terms = byRoot.get(root);
        if (!terms.has(term)) terms.set(term, []);
        terms.get(term).push(wonder.id);
      }
    }
  }

  const out = [];
  out.push(paint('bold', 'measurement substrates — the inspection components these questions imply'));
  out.push(paint('dim', '='.repeat(78)));
  out.push(paint('dim', 'each root is a region that would have to serialize itself to answer.'));
  out.push('');

  const roots = [...byRoot.entries()].sort((a, b) => b[1].size - a[1].size);
  for (const [root, terms] of roots) {
    out.push(paint('wall', '┌─ ') + paint('measure', `$%[${root}.…]`)
      + paint('dim', `  ${terms.size} demand${terms.size === 1 ? '' : 's'}`));
    for (const [term, askedBy] of terms) {
      const found = resolution.get(term);
      const mark = found
        ? paint('probe', '✓ ') + paint('dim', found.by)
        : paint('question', '· unresolved');
      out.push(paint('wall', '│ ') + term.padEnd(28) + mark.padEnd(46) + paint('dim', askedBy.join(' ')));
    }
    out.push(paint('wall', '└' + '─'.repeat(3)));
    out.push('');
  }

  const all = [...resolution.values()];
  if (all.length) {
    const open = all.filter((entry) => !entry).length;
    out.push(paint('dim', `${all.length - open} of ${all.length} substrates resolve against a producer.`));
    out.push(paint('dim', `${open} unresolved — each is a component the runtime cannot yet be asked about.`));
  }
  return out.join('\n');
}

function renderSummary(wonders, files) {
  const bySurface = new Map();
  for (const wonder of wonders) {
    const key = wonder.file;
    if (!bySurface.has(key)) bySurface.set(key, []);
    bySurface.get(key).push(wonder);
  }

  const out = [];
  out.push(paint('bold', 'wonder — the site\'s open questions, in the form that can be probed'));
  out.push(paint('dim', '='.repeat(78)));

  const site = wonders.filter((w) => !w.canon);
  const canon = wonders.filter((w) => w.canon);
  out.push(`${site.length} site wonders across ${new Set(site.map((w) => w.file)).size} surfaces`
    + (canon.length ? paint('dim', `   (+${canon.length} in workbench canon)`) : ''));

  const unprobed = wonders.filter((w) => !w.probes.length);
  if (unprobed.length) {
    out.push(paint('dim', `${unprobed.length} without a probe — a question with no probe cannot be settled`));
  }
  out.push('');

  for (const group of bySurface.values()) {
    for (const wonder of group) {
      out.push(renderWonder(wonder, neighbourhood(wonder, files)));
      out.push('');
    }
  }
  return out.join('\n');
}

/** A question's identity: its words, so it survives lines moving around it. */
export function wonderKey(wonder) {
  const words = String(wonder.question || '').toLowerCase().replace(/\s+/g, ' ').trim();
  return createHash('sha1').update(words).digest('hex').slice(0, 8);
}

export function renderCountLine(wonders) {
  const surfaces = new Set(wonders.map((wonder) => wonder.file)).size;
  const unprobed = wonders.filter((wonder) => !wonder.probes.length).length;
  return `[wonder] ${wonders.length} open on ${surfaces} surfaces · ${unprobed} without a probe`;
}

/** The terms of a $%[…] line, as written. */
const termsOf = (measure) => measure.replace(/^\$%\[/, '').replace(/\]$/, '').split(',').map((term) => term.trim()).filter(Boolean);

/** True when an ~#answer names one of the alternatives its block offered. */
export function answerInSet(wonder) {
  const terms = wonder.measures.flatMap(termsOf);
  return terms.some((term) => String(wonder.answer).includes(term));
}

/** What a block still lacks for its question to move, in the order the lifecycle needs it. */
export function gapsOf(wonder) {
  const gaps = [];
  const settled = Boolean(wonder.answer || wonder.retired);
  if (!wonder.probes.length && !settled) gaps.push('probe');
  if (!wonder.expect && !settled) gaps.push('expect');
  if (!wonder.measures.length) gaps.push('$% set');
  if (wonder.answer && wonder.measures.length && !answerInSet(wonder)) gaps.push('answer outside its set');
  return gaps;
}

/** One record per probe: its kind, and whether --run may execute it, with the reason when not. */
export function probeRecords(wonder) {
  return wonder.probes.map((probe) => {
    const kind = probeKind(probe, wonder.probeKind);
    const safety = kind === 'run' ? safeProbeCommand(probe) : { ok: false, reason: 'a reading' };
    return { probe, kind, safe: safety.ok, held: safety.reason };
  });
}

function countBy(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

/**
 * The contour: where each question stands and what its block lacks. Headlines
 * first, then the questions nearest to closing, then the surfaces carrying the
 * most gaps; the line saying what to do next comes last.
 */
function renderContour(wonders, probed, { full = false } = {}) {
  const out = [];
  const stage = (wonder) => lifecycleOf(wonder, probed);
  const records = wonders.flatMap((wonder) => probeRecords(wonder).map((record) => ({ ...record, wonder })));
  const runs = records.filter((record) => record.kind === 'run');
  const safe = runs.filter((record) => record.safe);
  const markedRun = wonders.filter((wonder) => wonder.probeKind === 'run').length;
  const markedRead = wonders.filter((wonder) => wonder.probeKind === 'read').length;
  const unprobed = wonders.filter((wonder) => !wonder.probes.length).length;
  const stages = Object.fromEntries(countBy(wonders.map(stage)));
  const held = countBy(runs.filter((record) => !record.safe).map((record) => record.held));

  out.push(paint('bold', 'wonder contour — where each question stands, and what its block still needs'));
  out.push(paint('dim', '='.repeat(78)));
  out.push(`${'lifecycle'.padEnd(13)}${wonders.length} · open ${stages.open || 0} · probed ${stages.probed || 0} · answered ${stages.answered || 0} · retired ${stages.retired || 0}`);
  out.push(`${'probes'.padEnd(13)}run ${runs.length} (${markedRun} marked) · read ${records.length - runs.length} (${markedRead} marked) · none ${unprobed}`);
  out.push(`${'safe to run'.padEnd(13)}${safe.length} of ${runs.length}`
    + (held.length ? paint('dim', `; held: ${held.map(([reason, n]) => `${reason} ${n}`).join(' · ')}`) : ''));
  out.push(`${'marks'.padEnd(13)}~#expect ${wonders.filter((w) => w.expect).length} · $% set ${wonders.filter((w) => w.measures.length).length} · ~#unblocks ${wonders.filter((w) => w.unblocks).length} · ~#answer ${wonders.filter((w) => w.answer).length} · ~#retired ${wonders.filter((w) => w.retired).length}`);
  out.push('');

  const moved = wonders.filter((wonder) => stage(wonder) !== 'open');
  if (moved.length) {
    out.push(paint('bold', 'moved'));
    for (const wonder of moved) {
      const gaps = gapsOf(wonder);
      const when = probed.get(wonder.id);
      out.push(`  ${stage(wonder).padEnd(9)} ${paint('ground', wonder.id)}  ${paint('dim', `${wonder.file}:${wonder.line}`)}`
        + (when ? paint('dim', `  probed ${when}`) : '')
        + (gaps.length ? paint('question', `  lacks ${gaps.join(', ')}`) : ''));
    }
    out.push('');
  }

  const ready = wonders.filter((wonder) => stage(wonder) === 'open' && wonder.expect && probeRecords(wonder).some((record) => record.safe));
  if (ready.length) {
    out.push(paint('bold', 'ready — a guess on record and a probe --run may execute'));
    for (const wonder of ready) out.push(`  ${paint('ground', wonder.id)}  ${paint('dim', `${wonder.file}:${wonder.line}`)}`);
    out.push('');
  }

  const bySurface = new Map();
  for (const wonder of wonders.filter((w) => !['answered', 'retired'].includes(stage(w)))) {
    if (!bySurface.has(wonder.file)) bySurface.set(wonder.file, []);
    bySurface.get(wonder.file).push(wonder);
  }
  const surfaces = [...bySurface.entries()]
    .map(([file, group]) => [file, group, group.reduce((sum, wonder) => sum + gapsOf(wonder).length, 0)])
    .filter(([, , gaps]) => gaps > 0)
    .sort((a, b) => b[2] - a[2]);
  if (surfaces.length) {
    out.push(paint('bold', full ? 'every open question and what it lacks' : 'surfaces carrying the most gaps'));
    for (const [file, group, gaps] of full ? surfaces : surfaces.slice(0, 12)) {
      out.push(paint('wall', '┌─ ') + file + paint('dim', `  ${group.length} open · ${gaps} gaps`));
      if (full) {
        for (const wonder of group) {
          const gapsHere = gapsOf(wonder);
          const kinds = probeRecords(wonder).map((record) => (record.kind === 'run' ? (record.safe ? 'run' : 'run held') : 'read'));
          out.push(paint('wall', '│ ') + paint('ground', wonder.id.padEnd(40)) + paint('dim', (kinds.join(',') || '—').padEnd(12))
            + (gapsHere.length ? paint('question', `lacks ${gapsHere.join(', ')}`) : paint('probe', 'whole')));
        }
      }
    }
    if (!full && surfaces.length > 12) out.push(paint('dim', `  … ${surfaces.length - 12} more; --surface <path> or --all lists each question`));
    out.push('');
  }

  const noExpect = wonders.filter((wonder) => wonder.probes.length && !wonder.expect && stage(wonder) === 'open').length;
  const have = (n) => (n === 1 ? 'has' : 'have');
  out.push(`next: ${ready.length} can run and be judged now (npm run wonder -- --run); `
    + `${noExpect} ${have(noExpect)} a probe but no ~#expect, so a run would not teach; ${unprobed} ${have(unprobed)} no probe.`);
  return out.join('\n');
}

function gitRevision() {
  try {
    return execFileSync('git', ['rev-parse', '--short=8', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

/** Run one probe through the shell, read-only by construction (safeProbeCommand), with a timeout. */
export function runProbe(command, { timeout = 90_000 } = {}) {
  const started = Date.now();
  const result = spawnSync('/bin/sh', ['-c', command], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout,
    maxBuffer: 16 * 1024 * 1024,
    env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
  });
  const timedOut = result.error?.code === 'ETIMEDOUT' || result.signal === 'SIGTERM';
  return {
    exit: timedOut ? 'timeout' : (result.status ?? 1),
    ms: Date.now() - started,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

/** Commands a probe needs that this shell cannot find; the heads are allowlisted words, never input. */
const found = new Map();
export function missingCommands(command = '') {
  const heads = (pipeStages(String(command).replace(QUIET_STDERR, '')) || []).map((stage) => stage.split(/\s+/)[0]);
  return [...new Set(heads)].filter((head) => {
    if (!found.has(head)) found.set(head, spawnSync('/bin/sh', ['-c', `command -v ${head}`]).status === 0);
    return !found.get(head);
  });
}

/** The last lines a probe printed, plain, short enough to sit in one quoted value. */
export function observationOf(stdout = '', stderr = '', keep = 4) {
  const text = (String(stdout).trim() ? stdout : stderr).replace(/\x1b\[[0-9;]*m/g, '');
  const tail = text.split('\n').map((line) => line.trim()).filter(Boolean).slice(-keep).join(' / ');
  const plain = tail.replace(/["`\\]/g, "'");
  return (plain.length > 280 ? `${plain.slice(0, 279)}…` : plain) || '(no output)';
}

const quote = (text) => `"${String(text).replace(/["`\\]/g, "'")}"`;
const RUNS_FILE = path.join(GENERATED, 'wonder-runs.spw');

/**
 * The runs as one .spw file in the claim protocol's result_ref terms and the
 * harness runs index's verdict words, so an answered wonder's receipt is a
 * claim's receipt. The verdict is always needs-review: a run proposes.
 */
export function renderRuns(runs, { stamp, revision }) {
  const out = [
    '# Wonder runs — each runnable probe, run read-only, with what it printed.',
    '# Written by npm run wonder -- --run --write. .spw/gen is gitignored: this is a working',
    '# receipt. A verdict stays needs-review until a reader writes ~#answer on the wonder',
    '# and a >>[date] probe line in the stream of the file that holds it.',
    '',
    '#>wonder_runs',
    '#:operation #!cache',
    '#:fixity #!volatile',
    '',
    '@inquiry_loop: ~"../reviews/upstream-workbench-recommendations/capabilities.spw#inquiry_loop"',
    '@lifecycle: ~"../caches/theory-map-2026-10.spw#lifecycle"',
    '',
    `^"runs"{`,
  ];
  const seen = new Map();
  for (const run of runs) {
    const base = run.wonder.id.replace(/\W/g, '_');
    const n = (seen.get(base) || 0) + 1;
    seen.set(base, n);
    const key = n === 1 ? base : `${base}_${n}`;
    const target = path.relative(GENERATED, path.join(ROOT, run.wonder.file)) + (run.wonder.id.startsWith('wonder@') ? '' : `#${run.wonder.id}`);
    out.push(`  ${key}: .{`);
    out.push(`    run_id = \`${stamp.replace(' ', 'T')}-${key}\``);
    out.push(`    surface = ~"${target}"`);
    out.push(`    command = \`${run.probe}\``);
    out.push('    effect_boundary = #read');
    out.push('    evidence_basis = #observed');
    if (revision) out.push(`    source_revision = \`${revision}\``);
    out.push(`    exit = ${run.exit === 'timeout' ? '#timeout' : run.exit}`);
    out.push(`    ms = ${run.ms}`);
    if (run.wonder.expect) out.push(`    expect: ${quote(run.wonder.expect)}`);
    out.push(`    observation: ${quote(run.observation)}`);
    out.push('    verdict = `needs-review`');
    out.push('  }[reg=facet]');
  }
  out.push('}', '');
  return out.join('\n');
}

/** The stream line a reader would paste after judging the run, prefilled with what the run saw. */
export function streamLineOf(run, stamp) {
  const status = run.exit === 'timeout' ? 'timed out' : `exit ${run.exit}`;
  return `>>[${stamp}] probe — ${run.wonder.id}: ${status}, printed "${run.observation.slice(0, 120)}". `
    + (run.wonder.expect ? 'Against ~#expect: <held or not>.' : 'No ~#expect was on record.');
}

function localStamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const say = (line) => console.log(line);

async function runWonders(wonders, probed, { limit = Infinity, write = false, json = false } = {}) {
  const queue = wonders
    .filter((wonder) => !['answered', 'retired'].includes(lifecycleOf(wonder, probed)))
    .flatMap((wonder) => probeRecords(wonder).filter((record) => record.safe).map((record) => ({ ...record, wonder })))
    .slice(0, limit);
  const stamp = localStamp();
  const revision = gitRevision();
  const runs = [];
  const skipped = [];
  for (const record of queue) {
    const missing = missingCommands(record.probe);
    if (missing.length) {
      skipped.push({ ...record, missing });
      continue;
    }
    process.stderr.write(paint('dim', `[wonder] running ${record.wonder.id} …\n`));
    const result = runProbe(record.probe);
    runs.push({ ...record, ...result, observation: observationOf(result.stdout, result.stderr) });
  }
  if (json) {
    console.log(JSON.stringify({
      stamp,
      revision,
      runs: runs.map(({ wonder, stdout, stderr, ...run }) => ({ ...run, wonder: wonder.id, file: wonder.file })),
      skipped: skipped.map(({ wonder, probe, missing }) => ({ wonder: wonder.id, file: wonder.file, probe, missing })),
    }, null, 2));
  } else {
    for (const run of runs) {
      const ok = run.exit === 0;
      say(`${paint(ok ? 'probe' : 'question', ok ? '✓' : '·')} ${String(run.exit).padEnd(8)}${String(run.ms).padStart(7)}ms  ${paint('ground', run.wonder.id)}`);
      say(`  ${paint('dim', run.observation)}`);
    }
    if (runs.length) {
      say('');
      say(paint('bold', 'stream lines to judge and paste, one per wonder, in the file that holds it'));
      for (const run of runs) say(`  ${paint('dim', run.wonder.file)}\n  ${streamLineOf(run, stamp)}`);
      say('');
    }
  }
  if (write) {
    await mkdir(GENERATED, { recursive: true });
    await writeFile(RUNS_FILE, renderRuns(runs, { stamp, revision }), 'utf8');
    await writeProjectionIndex();
  }
  const failed = runs.filter((run) => run.exit !== 0).length;
  if (!json && skipped.length) {
    const byCommand = countBy(skipped.flatMap((record) => record.missing));
    say(paint('question', `skipped ${skipped.length}: ${byCommand.map(([head, n]) => `${head} is not on this PATH (${n})`).join(' · ')}`));
  }
  if (!json) {
    say(`${runs.length} run${runs.length === 1 ? '' : 's'}, ${failed} without exit 0`
      + (write ? `; receipts in ${path.relative(ROOT, RUNS_FILE)}` : '; --write keeps the receipts')
      + '. Each verdict waits on a reader.');
  }
}


async function main() {
  const args = process.argv.slice(2);
  const asJson = args.includes('--json');
  const probesOnly = args.includes('--probes');
  const includeCanon = args.includes('--canon');
  const surfaceFilter = args.includes('--surface') ? args[args.indexOf('--surface') + 1] : null;

  const files = await collectSpw(SPW_ROOT, [], { includeCanon });
  await collectSpw(PLANS_ROOT, files, { skipArchive: true });
  let wonders = [];
  const probed = new Map();
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    for (const [id, date] of readProbeLines(source)) {
      if (!probed.has(id) || probed.get(id) < date) probed.set(id, date);
    }
    if (!source.includes('?[')) continue;
    wonders.push(...parseWonders(source, file));
  }

  if (surfaceFilter) {
    wonders = wonders.filter((w) => w.file.includes(surfaceFilter) || w.id.includes(surfaceFilter));
  }

  if (args.includes('--run')) {
    const limit = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) || Infinity : Infinity;
    await runWonders(wonders, probed, { limit, write: args.includes('--write'), json: asJson });
    return;
  }
  if (args.includes('--contour')) {
    console.log(renderContour(wonders, probed, { full: Boolean(surfaceFilter) || args.includes('--all') }));
    return;
  }
  if (asJson) {
    const lifecycle = (wonder) => ({ ...wonder, lifecycle: lifecycleOf(wonder, probed), probed: probed.get(wonder.id) || '', gaps: gapsOf(wonder) });
    console.log(JSON.stringify({ generatedAt: new Date().toISOString(), wonders: wonders.map(lifecycle) }, null, 2));
    return;
  }
  if (args.includes('--summary')) {
    console.log(renderCountLine(wonders));
    for (const wonder of wonders) console.log(`? ${wonderKey(wonder)} ${wonder.file}:${wonder.line} ${wonder.question}`);
    return;
  }
  if (args.includes('--measures')) {
    const terms = new Set();
    for (const wonder of wonders) {
      for (const measure of wonder.measures) {
        for (const term of measure.replace(/^\$%\[/, '').replace(/\]$/, '').split(',')) {
          if (term.trim()) terms.add(term.trim());
        }
      }
    }
    console.log(renderMeasures(wonders, await resolveSubstrates(terms)));
    return;
  }
  if (probesOnly) {
    for (const wonder of wonders) {
      for (const probe of wonder.probes) {
        console.log(`${wonder.id}\t${probe}`);
      }
    }
    return;
  }
  console.log(renderSummary(wonders, files));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error('[wonder]', error);
    process.exitCode = 1;
  });
}
