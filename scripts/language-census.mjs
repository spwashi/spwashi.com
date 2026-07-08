/**
 * language-census.mjs
 * ---------------------------------------------------------------------------
 * Generated-artifact producer: inventories the codebase's language surfaces
 * and writes .spw/audits/language-census.spw. Regenerable at any time; the
 * output is invalidatable from source files and owned by the
 * agentic-dev-contracts doctrine (never hand-edited).
 *
 * Census dimensions:
 *  1. data-spw-* attribute inventory, classified by surface presence
 *     (js / css / html / spw-conventions) — the trace-rule coverage measure
 *     from data-spw-attribute-governance.spw (rhythm.trace_rule).
 *  2. Suffix taxonomy (grammatical categories: -state, -phase, -mode, ...).
 *  3. Event census across both grammars (spw:* broadcast vs domain:verb bus).
 *  4. Homonym keyword spread (files touched per load-bearing word).
 *
 * Usage: node scripts/language-census.mjs
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(ROOT, '.spw/audits/language-census.spw');

const ATTR_RE = /data-spw-[a-z0-9]+(?:-[a-z0-9]+)*/g;
const EVENT_NAME = '((?:spw:)?[a-z][a-z0-9:-]*:[a-z][a-z0-9:-]*)';
const EMIT_PATTERNS = [
  new RegExp(`\\bemit(?:\\?\\.)?\\(\\s*['"\`]${EVENT_NAME}['"\`]`, 'g'),
  new RegExp(`\\bemitSpwEvent\\(\\s*['"\`]${EVENT_NAME}['"\`]`, 'g'),
  new RegExp(`CustomEvent\\(\\s*['"\`]${EVENT_NAME}['"\`]`, 'g'),
];
const LISTEN_PATTERNS = [
  new RegExp(`\\b(?:on|addEventListener)(?:\\?\\.)?\\(\\s*['"\`]${EVENT_NAME}['"\`]`, 'g'),
];
const HOMONYMS = ['settle', 'prime', 'charge', 'ground', 'arc', 'phase', 'harmony', 'tempo', 'climate', 'spell'];
const SKIP_DIRS = new Set(['node_modules', '.git', 'bundles', 'dist', 'dist-vite', '_workbench', '.claude']);
const GENERATED_HTML_PREFIXES = ['design/catalog/'];

function repoPath(path) {
  return relative(ROOT, path).replaceAll('\\', '/');
}

function isAuthoredHtml(path) {
  const rel = repoPath(path);
  return !GENERATED_HTML_PREFIXES.some((prefix) => rel === prefix.slice(0, -1) || rel.startsWith(prefix));
}

function* walk(dir, exts) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) yield* walk(path, exts);
    else if (exts.includes(extname(name))) yield path;
  }
}

const surfaces = {
  js: [...walk(join(ROOT, 'public/js'), ['.js'])],
  css: [...walk(join(ROOT, 'public/css'), ['.css'])],
  html: [...walk(ROOT, ['.html'])].filter(isAuthoredHtml),
  spw: [...walk(join(ROOT, '.spw'), ['.spw'])],
};

const attrs = new Map(); // name -> Set of surfaces
const events = new Map(); // name -> { emits, listens, surfaces: Set }
const homonymSpread = Object.fromEntries(HOMONYMS.map((w) => [w, { js: 0, css: 0 }]));

for (const [surface, files] of Object.entries(surfaces)) {
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(ATTR_RE)) {
      const name = match[0];
      if (!attrs.has(name)) attrs.set(name, new Set());
      attrs.get(name).add(surface);
    }
    if (surface === 'js') {
      for (const re of EMIT_PATTERNS) {
        for (const match of text.matchAll(re)) {
          const name = match[1];
          if (!events.has(name)) events.set(name, { emits: 0, listens: 0 });
          events.get(name).emits += 1;
        }
      }
      for (const re of LISTEN_PATTERNS) {
        for (const match of text.matchAll(re)) {
          const name = match[1];
          if (!events.has(name)) events.set(name, { emits: 0, listens: 0 });
          events.get(name).listens += 1;
        }
      }
    }
    if (surface === 'js' || surface === 'css') {
      const lower = text.toLowerCase();
      for (const word of HOMONYMS) {
        if (lower.includes(word)) homonymSpread[word][surface] += 1;
      }
    }
  }
}

const attrEntries = [...attrs.entries()];
const bySurfaces = (want) => attrEntries.filter(([, s]) => want(s)).map(([n]) => n).sort();

const fullTrace = bySurfaces((s) => s.has('js') && s.has('css') && s.has('spw'));
const jsOnly = bySurfaces((s) => s.has('js') && !s.has('css') && !s.has('spw') && !s.has('html'));
const cssOnly = bySurfaces((s) => s.has('css') && !s.has('js') && !s.has('html'));
const unregistered = bySurfaces((s) => !s.has('spw'));

const suffixCounts = new Map();
for (const [name] of attrEntries) {
  const suffix = name.split('-').at(-1);
  suffixCounts.set(suffix, (suffixCounts.get(suffix) || 0) + 1);
}
const topSuffixes = [...suffixCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 16);

const eventEntries = [...events.entries()].sort();
const broadcastEvents = eventEntries.filter(([n]) => n.startsWith('spw:'));
const busLocalEvents = eventEntries.filter(([n]) => !n.startsWith('spw:'));
const emittedNeverHeard = eventEntries.filter(([, v]) => v.emits > 0 && v.listens === 0).map(([n]) => n);
const heardNeverEmitted = eventEntries.filter(([, v]) => v.listens > 0 && v.emits === 0).map(([n]) => n);

const cap = (list, n = 48) => (list.length > n ? [...list.slice(0, n), `… +${list.length - n} more`] : list);
const setBlock = (name, list) => `${name}: #[\n${cap(list).map((x) => `  \`${x}\``).join(',\n')}\n][reg=set]`;

const today = new Date().toISOString().slice(0, 10);
const out = `# Language Census — generated ${today}
#
# GENERATED ARTIFACT — do not hand-edit. Regenerate: node scripts/language-census.mjs
# Measures the trace rule from data-spw-attribute-governance.spw (rhythm.trace_rule):
# every attribute family should appear in a JS contract, a convention, and the inspector.

#>language_census
#:audit #!language #!attributes #!events
#:operation observe

@generator: ~"../../scripts/language-census.mjs"
@governance: ~"../conventions/data-spw-attribute-governance.spw"

totals: .{
  attributes = ${attrs.size}
  attrs_full_trace_js_css_spw = ${fullTrace.length}
  attrs_unregistered_in_spw = ${unregistered.length}
  attrs_js_only = ${jsOnly.length}
  attrs_css_only = ${cssOnly.length}
  events_total = ${events.size}
  events_broadcast_spw = ${broadcastEvents.length}
  events_bus_local = ${busLocalEvents.length}
}[reg=facet]

suffix_taxonomy: .{
${topSuffixes.map(([s, c]) => `  ${s} = ${c}`).join('\n')}
}[reg=facet]

homonym_spread: .{
${HOMONYMS.map((w) => `  ${w} = "js:${homonymSpread[w].js} css:${homonymSpread[w].css}"`).join('\n')}
}[reg=facet]

${setBlock('attrs_css_only_never_written_by_js', cssOnly)}

${setBlock('attrs_js_only_never_spent_or_registered', jsOnly)}

${setBlock('events_emitted_never_heard', emittedNeverHeard)}

${setBlock('events_heard_never_emitted', heardNeverEmitted)}

${setBlock('bus_local_event_domains', [...new Set(busLocalEvents.map(([n]) => n.split(':')[0]))].sort())}

note "css-only attributes are either authored-HTML-driven (fine) or dead selectors; js-only attributes are unspent state or narration missing its convention registration. Both lists are the census's working surface — each entry either gains its missing trace legs or gets retired via the homonym-renaming / language-reclustering plans."
`;

writeFileSync(OUT, out);
console.log(`[language-census] ${attrs.size} attributes (${fullTrace.length} full-trace, ${unregistered.length} unregistered in .spw), ${events.size} events (${broadcastEvents.length} broadcast / ${busLocalEvents.length} bus-local)`);
console.log(`[language-census] wrote ${relative(ROOT, OUT)}`);
