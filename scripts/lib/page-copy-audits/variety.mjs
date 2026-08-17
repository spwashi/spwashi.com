/**
 * Offline census of authored data-spw-semantic-expression shapes.
 * Reports plain / projection / compound / operator-led variety without Chrome.
 */

import {
  classifyExpressionShape,
  collectRoutePages,
  extractExpressionHosts,
} from '../page-copy-audit.mjs';

function summarizeVarietyPage(page, blocks = page.blocks || []) {
  const shapes = { plain: 0, projection: 0, compound: 0, 'operator-led': 0, colon: 0, other: 0, empty: 0 };
  const expressions = [];
  for (const block of blocks) {
    const shape = classifyExpressionShape(block.expression);
    shapes[shape] = (shapes[shape] || 0) + 1;
    expressions.push(block.expression);
  }
  return {
    file: page.file,
    route: page.route,
    chars: page.chars,
    blockCount: blocks.length,
    shapes,
    expressions,
  };
}

function printVarietyReport(report) {
  const totals = { plain: 0, projection: 0, compound: 0, 'operator-led': 0, colon: 0, other: 0 };
  const counts = new Map();
  for (const page of report.pages) {
    for (const [shape, n] of Object.entries(page.shapes || {})) {
      if (totals[shape] != null) totals[shape] += n;
    }
    for (const expression of page.expressions || []) {
      counts.set(expression, (counts.get(expression) || 0) + 1);
    }
  }
  const unique = counts.size;
  const repeats = [...counts.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]);
  const rich = totals.projection + totals.compound + totals['operator-led'];

  process.stdout.write(`\ncopy-flow variety  ${report.at}\n`);
  process.stdout.write(`hosts=${report.blockCount}  unique=${unique}  engine=${report.engine}\n`);
  process.stdout.write(`plain=${totals.plain}  projection=${totals.projection}  compound=${totals.compound}  operator-led=${totals['operator-led']}  colon=${totals.colon}\n`);
  process.stdout.write(`rich-form share=${report.blockCount ? Math.round((rich / report.blockCount) * 100) : 0}%\n`);
  if (repeats.length) {
    process.stdout.write('\nrepeated expressions\n');
    for (const [expression, n] of repeats.slice(0, 12)) {
      process.stdout.write(`  ${String(n).padStart(2)}  ${expression}\n`);
    }
  }
}

export const varietyAudit = {
  id: 'variety',
  title: 'Census Spw expression shapes (offline)',
  kind: 'page-copy-variety',
  engine: 'extract',
  measureKind: 'objective',
  source: 'scripts/page-copy-audit.mjs variety',
  logPrefix: 'audit:variety',
  needsBrowser: false,
  async collect({ filter } = {}) {
    return collectRoutePages({ filter, extract: extractExpressionHosts });
  },
  measure() {
    return { measured: [], fonts: null };
  },
  summarize: summarizeVarietyPage,
  decorateReport(pages) {
    const totals = { plain: 0, projection: 0, compound: 0, 'operator-led': 0, colon: 0 };
    for (const page of pages) {
      for (const [shape, n] of Object.entries(page.shapes || {})) {
        if (totals[shape] != null) totals[shape] += n;
      }
    }
    return { shapes: totals };
  },
  print: printVarietyReport,
};
