/**
 * Measure hosts that already carry a Spw expression.
 * Wrap is keyed by the authored expression, not only by route prose.
 */

import {
  collectRoutePages,
  extractExpressionHosts,
  measurePagesWithPretext,
  previewText,
  summarizePretextBlock,
} from '../page-copy-audit.mjs';

function summarizeExprPage(page, measuredBlocks) {
  const source = measuredBlocks.length ? measuredBlocks : page.blocks || [];
  const blocks = source.map((block) => (
    block.bands ? summarizePretextBlock(block) : {
      ...block,
      preview: previewText(block.text || block.preview || ''),
      phoneLines: 0,
      desktopLines: 0,
      wrap: 'stable',
    }
  ));
  const jumpy = blocks.filter((block) => (block.phoneLines || 0) >= 2);

  return {
    file: page.file,
    route: page.route,
    chars: page.chars,
    blockCount: blocks.length,
    wrap: jumpy.length ? 'responsive' : 'stable',
    jumpyCount: jumpy.length,
    phoneBodyLines: blocks.reduce((sum, block) => sum + (block.phoneLines || 0), 0),
    desktopBodyLines: blocks.reduce((sum, block) => sum + (block.desktopLines || 0), 0),
    blocks,
  };
}

function printExprReport(report) {
  const rows = report.pages
    .flatMap((page) => (page.blocks || []).map((block) => ({ route: page.route, ...block })))
    .filter((row) => row.expression)
    .sort((a, b) => (b.phoneLines || 0) - (a.phoneLines || 0));

  process.stdout.write(`\ncopy-flow expr  ${report.at}\n`);
  process.stdout.write(`pages=${report.pageCount}  expression hosts=${report.blockCount}  engine=${report.engine}\n\n`);
  process.stdout.write('φL  desk  wrap         expression                               route\n');
  process.stdout.write(`${'-'.repeat(110)}\n`);
  for (const row of rows.filter((item) => (item.phoneLines || 0) >= 2)) {
    process.stdout.write(
      `${String(row.phoneLines).padStart(2)}  ${String(row.desktopLines).padStart(4)}  ${String(row.wrap || '-').padEnd(12)} ${String(row.expression).slice(0, 38).padEnd(38)} ${row.route}\n`,
    );
  }
  process.stdout.write(`\n${rows.filter((item) => (item.phoneLines || 0) >= 2).length} wrapping expression hosts. Manifest stays the parse; this pass is measure only.\n`);
}

export const exprAudit = {
  id: 'expr',
  title: 'Measure data-spw-semantic-expression hosts for wrap / packing',
  kind: 'page-copy-expr',
  engine: 'pretext',
  measureKind: 'objective',
  source: 'scripts/page-copy-audit.mjs expr',
  logPrefix: 'audit:expr',
  profilePrefix: 'spw-expr-',
  needsBrowser: true,
  async collect({ filter } = {}) {
    return collectRoutePages({ filter, extract: extractExpressionHosts });
  },
  async measure({ pages, session, fonts, log }) {
    const measured = await measurePagesWithPretext(session, pages, fonts, { log });
    return { measured, fonts };
  },
  summarize: summarizeExprPage,
  print: printExprReport,
};
