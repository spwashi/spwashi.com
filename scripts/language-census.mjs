/**
 * language-census.mjs
 * ---------------------------------------------------------------------------
 * Generated-artifact producer: inventories the codebase's language surfaces
 * and writes .spw/audits/language-census.spw. Regenerable at any time; the
 * output is invalidatable from source files and owned by the
 * agentic-dev-contracts doctrine (never hand-edited).
 *
 * Architecture (recursive-improvement.spw ^script_architecture): each census
 * dimension is a collector object — { name, scan(surface, file, text),
 * finish() } — registered in COLLECTORS. A new dimension lands as a new
 * collector, never as a rewrite. Shared walking/emitting lives in
 * scripts/lib/spw-inventory-core.mjs.
 *
 * Census dimensions:
 *  1. attributes — data-spw-* inventory classified by surface presence
 *     (js / css / html / spw-conventions) with occurrence counts; the
 *     trace-rule coverage measure from data-spw-attribute-governance.spw.
 *  2. contracts — SPW_*_CONTRACT object census: which attributes are
 *     enumerated inside a frozen JS contract block (trace_rule leg one).
 *  3. events — spw:* broadcast vs domain:verb bus grammar, emit/listen
 *     balance, orphan lists.
 *  4. homonyms — load-bearing word spread, word-boundary matched (so
 *     `ground` no longer counts `background`), files + hits per surface.
 *  Derived: stem families (data-spw-<stem>-…) with per-family trace legs;
 *  suffix taxonomy (grammatical categories: -state, -phase, -mode, …).
 *
 * Usage: node scripts/language-census.mjs            (npm run census)
 *        node scripts/language-census.mjs --json     (npm run census:json)
 *   --json prints the full uncapped report for agent loops; the .spw artifact
 *   caps its sets for readability.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  ROOT,
  walkFiles,
  isAuthoredHtml,
  repoPath,
  spwSet,
  spwFacet,
  spwStemFacet,
} from './lib/spw-inventory-core.mjs';

const OUT = join(ROOT, '.spw/audits/language-census.spw');
const JSON_OUT = process.argv.includes('--json');
const GENERATOR_VERSION = 2;

const ATTR_RE = /data-spw-[a-z0-9]+(?:-[a-z0-9]+)*/g;
const EVENT_NAME = '((?:spw:)?[a-z][a-z0-9:-]*:[a-z][a-z0-9:-]*)';
const HOMONYMS = ['settle', 'prime', 'charge', 'ground', 'arc', 'phase', 'harmony', 'tempo', 'climate', 'spell'];

const surfaces = {
  js: walkFiles(join(ROOT, 'public/js'), { exts: ['.js'] }),
  css: walkFiles(join(ROOT, 'public/css'), { exts: ['.css'] }),
  html: walkFiles(ROOT, { exts: ['.html'] }).filter(isAuthoredHtml),
  // The census's own artifact must not count as registration — otherwise every
  // attribute it lists becomes "registered in .spw" on the next run.
  spw: walkFiles(join(ROOT, '.spw'), { exts: ['.spw'] }).filter((f) => f !== OUT),
};

// --- collectors -------------------------------------------------------------

function attributeCollector() {
  const attrs = new Map(); // name -> { surfaces: Set, hits: number }
  return {
    name: 'attributes',
    scan(surface, _file, text) {
      for (const match of text.matchAll(ATTR_RE)) {
        const name = match[0];
        if (!attrs.has(name)) attrs.set(name, { surfaces: new Set(), hits: 0 });
        const entry = attrs.get(name);
        entry.surfaces.add(surface);
        entry.hits += 1;
      }
    },
    finish() {
      return attrs;
    },
  };
}

function contractCollector() {
  const HEAD = /\bconst\s+(SPW_[A-Z0-9_]+_CONTRACT)\s*=\s*Object\.freeze\s*\(/g;
  const contracts = []; // { name, file }
  const contractAttrs = new Set();
  return {
    name: 'contracts',
    scan(surface, file, text) {
      if (surface !== 'js') return;
      for (const match of text.matchAll(HEAD)) {
        const open = match.index + match[0].length - 1;
        const block = balancedParenSlice(text, open);
        contracts.push({ name: match[1], file: repoPath(file) });
        for (const attr of block.matchAll(ATTR_RE)) contractAttrs.add(attr[0]);
      }
    },
    finish() {
      return { contracts, contractAttrs };
    },
  };
}

function eventCollector() {
  const EMIT_PATTERNS = [
    new RegExp(`\\bemit(?:\\?\\.)?\\(\\s*['"\`]${EVENT_NAME}['"\`]`, 'g'),
    new RegExp(`\\bemitSpwEvent\\(\\s*['"\`]${EVENT_NAME}['"\`]`, 'g'),
    new RegExp(`CustomEvent\\(\\s*['"\`]${EVENT_NAME}['"\`]`, 'g'),
  ];
  const LISTEN_PATTERNS = [
    new RegExp(`\\b(?:on|addEventListener)(?:\\?\\.)?\\(\\s*['"\`]${EVENT_NAME}['"\`]`, 'g'),
  ];
  const events = new Map(); // name -> { emits, listens }
  const touch = (name) => {
    if (!events.has(name)) events.set(name, { emits: 0, listens: 0 });
    return events.get(name);
  };
  return {
    name: 'events',
    scan(surface, _file, text) {
      if (surface !== 'js') return;
      for (const re of EMIT_PATTERNS) {
        for (const match of text.matchAll(re)) touch(match[1]).emits += 1;
      }
      for (const re of LISTEN_PATTERNS) {
        for (const match of text.matchAll(re)) touch(match[1]).listens += 1;
      }
    },
    finish() {
      return events;
    },
  };
}

function homonymCollector() {
  // Word-boundary stems: `ground` matches ground/grounded/grounding but not
  // background; `arc` no longer matches search. Inflections still count.
  const regexes = Object.fromEntries(HOMONYMS.map((w) => [w, new RegExp(`\\b${w}[a-z]*`, 'g')]));
  const spread = Object.fromEntries(
    HOMONYMS.map((w) => [w, { js: { files: 0, hits: 0 }, css: { files: 0, hits: 0 } }]),
  );
  return {
    name: 'homonyms',
    scan(surface, _file, text) {
      if (surface !== 'js' && surface !== 'css') return;
      const lower = text.toLowerCase();
      for (const word of HOMONYMS) {
        const hits = lower.match(regexes[word]);
        if (!hits) continue;
        spread[word][surface].files += 1;
        spread[word][surface].hits += hits.length;
      }
    },
    finish() {
      return spread;
    },
  };
}

function balancedParenSlice(text, open) {
  let depth = 0;
  for (let i = open; i < text.length; i += 1) {
    if (text[i] === '(') depth += 1;
    else if (text[i] === ')') {
      depth -= 1;
      if (depth === 0) return text.slice(open, i + 1);
    }
  }
  return text.slice(open);
}

// --- scan -------------------------------------------------------------------

const COLLECTORS = [attributeCollector(), contractCollector(), eventCollector(), homonymCollector()];

for (const [surface, files] of Object.entries(surfaces)) {
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const collector of COLLECTORS) collector.scan(surface, file, text);
  }
}

const dimension = Object.fromEntries(COLLECTORS.map((c) => [c.name, c.finish()]));
const attrs = dimension.attributes;
const { contracts, contractAttrs } = dimension.contracts;
const events = dimension.events;
const homonymSpread = dimension.homonyms;

// --- derived dimensions -----------------------------------------------------

const attrEntries = [...attrs.entries()];
const bySurfaces = (want) => attrEntries.filter(([, e]) => want(e.surfaces)).map(([n]) => n).sort();

const fullTrace = bySurfaces((s) => s.has('js') && s.has('css') && s.has('spw'));
const jsOnly = bySurfaces((s) => s.has('js') && !s.has('css') && !s.has('spw') && !s.has('html'));
const cssOnly = bySurfaces((s) => s.has('css') && !s.has('js') && !s.has('html'));
const unregistered = bySurfaces((s) => !s.has('spw'));
const contractAndConvention = attrEntries
  .filter(([n, e]) => contractAttrs.has(n) && e.surfaces.has('spw'))
  .map(([n]) => n);

const families = new Map(); // stem -> { members, fullTrace, unregistered, contract }
for (const [name, entry] of attrEntries) {
  const stem = name.slice('data-spw-'.length).split('-')[0];
  if (!families.has(stem)) families.set(stem, { members: 0, fullTrace: 0, unregistered: 0, contract: 0 });
  const fam = families.get(stem);
  fam.members += 1;
  if (entry.surfaces.has('js') && entry.surfaces.has('css') && entry.surfaces.has('spw')) fam.fullTrace += 1;
  if (!entry.surfaces.has('spw')) fam.unregistered += 1;
  if (contractAttrs.has(name)) fam.contract += 1;
}
const topFamilies = [...families.entries()].sort((a, b) => b[1].members - a[1].members).slice(0, 24);

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
const busDomains = [...new Set(busLocalEvents.map(([n]) => n.split(':')[0]))].sort();

const filesScanned = Object.fromEntries(Object.entries(surfaces).map(([k, v]) => [k, v.length]));
const totals = {
  attributes: attrs.size,
  attrs_full_trace_js_css_spw: fullTrace.length,
  attrs_unregistered_in_spw: unregistered.length,
  attrs_js_only: jsOnly.length,
  attrs_css_only: cssOnly.length,
  attrs_contract_enumerated: contractAttrs.size,
  attrs_contract_and_convention: contractAndConvention.length,
  contract_objects: contracts.length,
  stem_families: families.size,
  events_total: events.size,
  events_broadcast_spw: broadcastEvents.length,
  events_bus_local: busLocalEvents.length,
};

// --- emit -------------------------------------------------------------------

const today = new Date().toISOString().slice(0, 10);

if (JSON_OUT) {
  console.log(JSON.stringify({
    generated: today,
    generator_version: GENERATOR_VERSION,
    files_scanned: filesScanned,
    totals,
    attributes: Object.fromEntries(attrEntries.map(([n, e]) => [n, {
      surfaces: [...e.surfaces].sort(),
      hits: e.hits,
      contract: contractAttrs.has(n),
    }])),
    families: Object.fromEntries([...families.entries()].sort((a, b) => b[1].members - a[1].members)),
    suffixes: Object.fromEntries(topSuffixes),
    homonyms: homonymSpread,
    contracts,
    events: Object.fromEntries(eventEntries.map(([n, v]) => [n, v])),
    sets: {
      attrs_css_only_never_written_by_js: cssOnly,
      attrs_js_only_never_spent_or_registered: jsOnly,
      events_emitted_never_heard: emittedNeverHeard,
      events_heard_never_emitted: heardNeverEmitted,
      bus_local_event_domains: busDomains,
    },
  }, null, 2));
} else {
  const famLine = (f) => `"members:${f.members} full:${f.fullTrace} unreg:${f.unregistered} contract:${f.contract}"`;
  const homLine = (h) => `"js:${h.js.files}f/${h.js.hits}x css:${h.css.files}f/${h.css.hits}x"`;

  const out = `# Language Census — generated ${today}
#
# GENERATED ARTIFACT — do not hand-edit. Regenerate: npm run census
# (npm run census:json emits the full uncapped report for agent loops.)
# Measures the trace rule from data-spw-attribute-governance.spw (rhythm.trace_rule):
# every attribute family should appear in a JS contract, a convention, and the inspector.

#>language_census
#:audit #!language #!attributes #!events
#:operation observe

@generator: ~"../../scripts/language-census.mjs"
@inventory_core: ~"../../scripts/lib/spw-inventory-core.mjs"
@governance: ~"../conventions/data-spw-attribute-governance.spw"
@recursive_improvement: ~"../conventions/recursive-improvement.spw"
@audits_index: ~"./index.spw"
@reclustering_plan: ~"../../.agents/plans/language-reclustering/index.spw"
@homonym_plan: ~"../../.agents/plans/homonym-renaming/index.spw"

operation = "observe"
fixity = "tending"

${spwFacet('audit_run', {
    at: `\`${today}\``,
    method: '`collector scan of js/css/html/spw surfaces; word-boundary homonyms; SPW_*_CONTRACT block enumeration`',
    generator_version: GENERATOR_VERSION,
    files_scanned: `\`js:${filesScanned.js} css:${filesScanned.css} html:${filesScanned.html} spw:${filesScanned.spw}\``,
  })}

${spwStemFacet('dimensions', {
    practice_depth: '"observation"',
    semantic_layer: '"pragmatics"',
    memory_tier: '"hot"',
  })}

${spwStemFacet('totals', totals)}

${spwStemFacet('suffix_taxonomy', Object.fromEntries(topSuffixes))}

${spwStemFacet('stem_families', Object.fromEntries(topFamilies.map(([s, f]) => [s, famLine(f)])))}

${spwStemFacet('homonym_spread', Object.fromEntries(HOMONYMS.map((w) => [w, homLine(homonymSpread[w])])))}

${spwSet('contract_objects', contracts.map((c) => `${c.name} — ${c.file}`), { cap: 64 })}

${spwSet('attrs_css_only_never_written_by_js', cssOnly)}

${spwSet('attrs_js_only_never_spent_or_registered', jsOnly)}

${spwSet('events_emitted_never_heard', emittedNeverHeard)}

${spwSet('events_heard_never_emitted', heardNeverEmitted)}

${spwSet('bus_local_event_domains', busDomains)}

note "css-only attributes are either authored-HTML-driven (fine) or dead selectors; js-only attributes are unspent state or narration missing its convention registration. Both lists are the census's working surface — each entry either gains its missing trace legs or gets retired via the homonym-renaming / language-reclustering plans. attrs_contract_and_convention is the honest trace-rule floor: enumerated in a frozen JS contract AND registered in .spw."
`;

  writeFileSync(OUT, out);
  console.log(`[language-census] ${attrs.size} attributes (${fullTrace.length} full-trace, ${unregistered.length} unregistered in .spw, ${contractAttrs.size} contract-enumerated), ${events.size} events (${broadcastEvents.length} broadcast / ${busLocalEvents.length} bus-local)`);
  console.log(`[language-census] ${contracts.length} SPW_*_CONTRACT objects; ${families.size} stem families`);
  console.log(`[language-census] wrote ${relative(ROOT, OUT)}`);
}
