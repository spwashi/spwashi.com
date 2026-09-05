/**
 * Offline census of data-spw-copy-unit accessors, their Spw handles,
 * topic/development clusters, and voice seams. Numbers only — judgments
 * live in .spw/audits/copy-accessor-cluster-2026-09.spw.
 */

import {
  collectRoutePages,
  extractCopyUnitHosts,
  parseCopyUnit,
  previewText,
} from '../page-copy-audit.mjs';

export const DEVELOPMENT_CLUSTERS = Object.freeze({
  'curriculum-numericity': {
    namespaces: ['curriculum', 'math'],
    unitPrefixes: ['recipes.soilCompanions', 'recipes.season'],
    seeds: ['/curriculum/', '/topics/math/', '/topics/software/', '/recipes/'],
  },
  'person-magazine': {
    namespaces: ['about', 'now', 'membership'],
    unitPrefixes: ['home.hook', 'home.promoWonderCycle'],
    seeds: ['/', '/about/', '/now/', '/membership/'],
  },
  'services-offer': {
    namespaces: ['services'],
    unitPrefixes: [],
    seeds: ['/services/'],
  },
  'topics-shelf': {
    namespaces: ['topics', 'knowledge'],
    unitPrefixes: [],
    seeds: ['/topics/'],
  },
  'design-surface': {
    namespaces: ['design'],
    unitPrefixes: [],
    seeds: ['/design/'],
  },
});

const JARGON = Object.freeze([
  { term: 'boonhonk', re: /\bboonhonk\b/i },
  { term: 'cauldron', re: /\bcauldrons?\b/i },
  { term: 'pretext', re: /\bpretext\b/i },
  { term: 'lattice', re: /\blattice\b/i },
  { term: 'semantic resonance', re: /semantic resonance/i },
]);

export function assignDevelopmentClusters(copyUnit = '') {
  const parsed = parseCopyUnit(copyUnit);
  const hits = [];
  if (!copyUnit) return ['unclustered'];
  for (const [id, spec] of Object.entries(DEVELOPMENT_CLUSTERS)) {
    const byNs = spec.namespaces.includes(parsed.namespace);
    const byPrefix = spec.unitPrefixes.some((prefix) => (
      copyUnit === prefix || copyUnit.startsWith(`${prefix}.`)
    ));
    if (byNs || byPrefix) hits.push(id);
  }
  return hits.length ? hits : ['unclustered'];
}

function livingTermCovers(html = '', term = '') {
  const slug = String(term).replace(/\s+/g, '-');
  const wrapped = new RegExp(`<[^>]*data-spw-living-term[^>]*>[^<]*${term}[^<]*<`, 'i');
  const concept = new RegExp(`data-spw-concept="[^"]*${slug}[^"]*"`, 'i');
  return wrapped.test(html) || concept.test(html);
}

function definesTerm(text = '', term = '', copyUnit = '') {
  if (new RegExp(`^\\s*${term}\\s+is\\b`, 'i').test(text)) return true;
  const cluster = parseCopyUnit(copyUnit).cluster.toLowerCase();
  return cluster === String(term).replace(/\s+/g, '').toLowerCase();
}

export function flagCopyVoice(block = {}) {
  const text = block.text || '';
  const html = block.html || '';
  const copyUnit = block.copyUnit || '';
  const flags = [];
  if (/\bin a world\b|\bunlock(?:s|ing)?\b|\belevate(?:s|d|ing)?\b/i.test(text)) {
    flags.push('sales-pitch');
  }
  if (/\bit['’]?s like\b/i.test(text) && /,\s+and\s+/i.test(text)) flags.push('ai-like');

  const isHookLede = block.textualRole === 'lede'
    || /\bhook-lede\b/.test(block.className || '')
    || /\.hook\./i.test(copyUnit);
  const isLongCopy = block.textualRole === 'lede'
    || isHookLede
    || /\.lede$/i.test(copyUnit);
  if (isLongCopy && (block.chars || text.length) > 320) flags.push('dense-lede');
  if (copyUnit && !block.expression && isHookLede) flags.push('flat-only');
  if (!copyUnit && /\bhook-lede\b/.test(block.className || '')) {
    flags.push('hook-lede-unaddressed');
  }
  if (copyUnit && block.shape === 'short') flags.push('arity-short');

  for (const item of JARGON) {
    if (!item.re.test(text)) continue;
    if (definesTerm(text, item.term, copyUnit)) continue;
    if (livingTermCovers(html, item.term)) continue;
    flags.push(`unglossed:${item.term}`);
  }
  return flags;
}

function contentBlocks(blocks = []) {
  return blocks.filter((block) => block.kind !== 'meta');
}

function summarizeAccessorPage(page, blocks = page.blocks || []) {
  const units = contentBlocks(blocks).map((block) => {
    const flags = flagCopyVoice(block);
    const clusters = assignDevelopmentClusters(block.copyUnit);
    return {
      ...block,
      flags,
      clusters,
      preview: previewText(block.text || '', 88),
    };
  });
  const meta = blocks[0] || {};
  return {
    file: page.file,
    route: page.route,
    chars: units.reduce((sum, block) => sum + (block.chars || 0), 0),
    blockCount: units.length,
    surface: meta.surface || '',
    pageFamily: meta.pageFamily || '',
    pageRole: meta.pageRole || '',
    relatedRoutes: meta.relatedRoutes || [],
    units,
  };
}

function tally(map, key, amount = 1) {
  if (!key) return;
  map.set(key, (map.get(key) || 0) + amount);
}

function entriesDesc(map) {
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

export function decorateAccessorPages(pages = []) {
  const shapes = { triple: 0, nested: 0, short: 0, empty: 0 };
  const namespaces = new Map();
  const flags = new Map();
  const clusters = {};
  for (const id of Object.keys(DEVELOPMENT_CLUSTERS)) {
    clusters[id] = { units: 0, routes: new Set(), copyUnits: [] };
  }
  clusters.unclustered = { units: 0, routes: new Set(), copyUnits: [] };

  let withExpression = 0;
  let uniqueUnits = new Set();
  let unitHosts = 0;
  let unaddressedHooks = 0;

  const pagesByRoute = new Map(pages.map((page) => [page.route, page]));
  for (const page of pages) {
    page.neighborHosts = (page.relatedRoutes || []).filter((route) => {
      const neighbor = pagesByRoute.get(route);
      return Boolean(neighbor?.units?.some((unit) => unit.copyUnit));
    });
    for (const unit of page.units || []) {
      if (unit.copyUnit) {
        unitHosts += 1;
        uniqueUnits.add(unit.copyUnit);
        if (unit.expression) withExpression += 1;
        tally(namespaces, unit.namespace);
      } else {
        unaddressedHooks += 1;
      }
      if (shapes[unit.shape] != null) shapes[unit.shape] += 1;
      for (const flag of unit.flags || []) tally(flags, flag);
      for (const clusterId of unit.clusters || ['unclustered']) {
        const bucket = clusters[clusterId] || clusters.unclustered;
        bucket.units += 1;
        bucket.routes.add(page.route);
        if (unit.copyUnit) bucket.copyUnits.push(unit.copyUnit);
      }
    }
  }

  const clusterSummary = {};
  for (const [id, bucket] of Object.entries(clusters)) {
    const spec = DEVELOPMENT_CLUSTERS[id];
    const seedGaps = spec
      ? spec.seeds.filter((seed) => {
        const page = pages.find((entry) => entry.route === seed);
        return page && !(page.units || []).some((unit) => unit.copyUnit);
      })
      : [];
    clusterSummary[id] = {
      units: bucket.units,
      routes: [...bucket.routes].sort(),
      copyUnits: [...new Set(bucket.copyUnits)].sort(),
      seedGaps,
    };
  }

  return {
    shapes,
    namespaces: Object.fromEntries(entriesDesc(namespaces)),
    flags: Object.fromEntries(entriesDesc(flags)),
    clusters: clusterSummary,
    unitHosts,
    uniqueUnits: uniqueUnits.size,
    withExpression,
    unaddressedHooks,
  };
}

function printAccessorReport(report) {
  const totals = report.shapes || {};
  process.stdout.write(`\ncopy-flow accessor  ${report.at}\n`);
  process.stdout.write(
    `units=${report.unitHosts || 0}  unique=${report.uniqueUnits || 0}  with-expression=${report.withExpression || 0}  `
    + `triple=${totals.triple || 0}  nested=${totals.nested || 0}  short=${totals.short || 0}  `
    + `hook-ledes-unaddressed=${report.unaddressedHooks || 0}\n`,
  );

  process.stdout.write('\nnamespaces\n');
  for (const [name, count] of Object.entries(report.namespaces || {})) {
    process.stdout.write(`  ${String(count).padStart(3)}  ${name}\n`);
  }

  process.stdout.write('\ndevelopment clusters  (copy-units on seed routes + prefix matches)\n');
  for (const [id, bucket] of Object.entries(report.clusters || {})) {
    if (!bucket.units && !bucket.routes?.length) continue;
    process.stdout.write(
      `  ${id.padEnd(24)} units=${String(bucket.units).padStart(3)}  seed-routes=${(bucket.routes || []).length}`
      + `${bucket.seedGaps?.length ? `  gaps=${bucket.seedGaps.join(',')}` : ''}\n`,
    );
    for (const copyUnit of (bucket.copyUnits || []).slice(0, 8)) {
      process.stdout.write(`      ${copyUnit}\n`);
    }
  }

  const flagEntries = Object.entries(report.flags || {});
  if (flagEntries.length) {
    process.stdout.write('\nvoice seams\n');
    for (const [flag, count] of flagEntries) {
      process.stdout.write(`  ${String(count).padStart(3)}  ${flag}\n`);
    }
    const rows = report.pages
      .flatMap((page) => (page.units || [])
        .filter((unit) => (unit.flags || []).length)
        .map((unit) => ({ route: page.route, ...unit })))
      .slice(0, 16);
    for (const row of rows) {
      process.stdout.write(
        `    ${(row.copyUnit || '(hook-lede)').padEnd(42)} ${row.flags.join(',')}  ${row.route}\n`,
      );
    }
  }

  process.stdout.write(
    '\nJudgments: .spw/audits/copy-accessor-cluster-2026-09.spw\n'
    + 'Contract:  .spw/conventions/copy-accessor.spw\n'
    + 'Do not invent a fourth accessor family. Extra dots nest categories; braces add dimensions.\n',
  );
}

export const accessorAudit = {
  id: 'accessor',
  title: 'Census copy-unit accessors, Spw handles, topic clusters, and voice seams',
  kind: 'page-copy-accessor',
  engine: 'extract',
  measureKind: 'objective',
  source: 'scripts/page-copy-audit.mjs accessor',
  logPrefix: 'audit:accessor',
  needsBrowser: false,
  async collect({ filter } = {}) {
    return collectRoutePages({ filter, extract: extractCopyUnitHosts });
  },
  measure() {
    return { measured: [], fonts: null };
  },
  summarize: summarizeAccessorPage,
  decorateReport: decorateAccessorPages,
  print: printAccessorReport,
};
