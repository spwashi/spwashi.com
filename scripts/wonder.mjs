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
 *   node scripts/wonder.mjs                 # all site wonders, grouped by surface
 *   node scripts/wonder.mjs --probes        # probe lines only, for running
 *   node scripts/wonder.mjs --surface arrival
 *   node scripts/wonder.mjs --json
 *   node scripts/wonder.mjs --canon         # include the workbench's 176
 */

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SPW_ROOT = path.join(ROOT, '.spw');
const CANON = path.join(SPW_ROOT, '_workbench');

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

async function collectSpw(dir, out = [], { includeCanon = false } = {}) {
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
      if (entry.name === 'node_modules') continue;
      await collectSpw(full, out, { includeCanon });
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
function parseWonders(source, file) {
  const wonders = [];
  const lines = source.split('\n');

  for (let i = 0; i < lines.length; i += 1) {
    const idMatch = lines[i].match(/^#>(\w*wonder\w*)/i);
    const openMatch = lines[i].match(/\?\[["`](.+?)["`]\]\s*\{/);
    // A wonder is either an id line followed by the question, or a bare `?[…]{`.
    let id = null;
    let questionLine = i;
    if (idMatch) {
      id = idMatch[1];
      questionLine = i + 1;
    } else if (!openMatch) {
      continue;
    }

    const qMatch = lines[questionLine]?.match(/\?\[["`](.+?)["`]\]\s*\{/);
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

    const probes = body
      .filter((l) => l.includes('!probe{'))
      .map((l) => l.replace(/^\s*!probe\{\s*["`]?/, '').replace(/["`]?\s*\}\s*$/, ''));

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
      goal: field('goal'),
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
const PRODUCERS = [
  ['scripts/page-reasons.mjs', 'measure'],
  ['public/js/runtime/arrival-shells.js', 'runtime'],
  ['public/js/runtime/load-trace.js', 'runtime'],
  ['public/js/runtime/familiarity-gate.js', 'runtime'],
  ['public/js/site.js', 'api'],
];

async function resolveSubstrates(terms) {
  const sources = [];
  for (const [file, kind] of PRODUCERS) {
    try {
      sources.push({ file, kind, text: await readFile(path.join(ROOT, file), 'utf8') });
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
    const hit = sources.find((source) => probe.test(source.text));
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

async function main() {
  const args = process.argv.slice(2);
  const asJson = args.includes('--json');
  const probesOnly = args.includes('--probes');
  const includeCanon = args.includes('--canon');
  const surfaceFilter = args.includes('--surface') ? args[args.indexOf('--surface') + 1] : null;

  const files = await collectSpw(SPW_ROOT, [], { includeCanon });
  let wonders = [];
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    if (!source.includes('?[')) continue;
    wonders.push(...parseWonders(source, file));
  }

  if (surfaceFilter) {
    wonders = wonders.filter((w) => w.file.includes(surfaceFilter) || w.id.includes(surfaceFilter));
  }

  if (asJson) {
    console.log(JSON.stringify({ generatedAt: new Date().toISOString(), wonders }, null, 2));
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

main().catch((error) => {
  console.error('[wonder]', error);
  process.exitCode = 1;
});
