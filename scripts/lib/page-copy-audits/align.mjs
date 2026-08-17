/**
 * Alignment-facing Pretext pass: measure titles and playable hooks
 * at phone / desktop. For packing and HUD work — not a sitewide physics mount.
 */

import {
  collectRoutePages,
  extractMainHtml,
  measurePagesWithPretext,
  previewText,
  readSemanticExpression,
  stripMarkup,
  summarizePretextBlock,
} from '../page-copy-audit.mjs';

function extractAlignTargets(html) {
  const main = extractMainHtml(html);
  const blocks = [];
  const push = (tag, kind, raw, attrs = '') => {
    const text = stripMarkup(raw);
    if (!text || text.length < 4) return;
    blocks.push({
      tag,
      kind,
      text,
      chars: text.length,
      expression: readSemanticExpression(attrs),
    });
  };

  for (const match of main.matchAll(/<h1\b([^>]*)>([\s\S]*?)<\/h1>/gi)) {
    push('h1', 'heading', match[2], match[1]);
  }
  for (const match of main.matchAll(/<(p|div|span)\b([^>]*spw-playable-hook[^>]*)>([\s\S]*?)<\/\1>/gi)) {
    push(match[1].toLowerCase(), 'body', match[3], match[2]);
  }
  for (const match of main.matchAll(/<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi)) {
    const text = stripMarkup(match[2]);
    if (text.length >= 28) push('h2', 'heading', match[2], match[1]);
  }
  return blocks;
}

function summarizeAlignPage(page, measuredBlocks) {
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
  const hooks = blocks.filter((block) => block.tag === 'h1' || block.kind === 'body' || block.tag === 'p');
  const jumpy = hooks.filter((block) => (block.phoneLines || 0) >= 2);

  return {
    file: page.file,
    route: page.route,
    chars: page.chars,
    blockCount: blocks.length,
    wrap: jumpy.length ? 'responsive' : 'stable',
    jumpyCount: jumpy.length,
    phoneBodyLines: hooks.reduce((sum, block) => sum + (block.phoneLines || 0), 0),
    desktopBodyLines: hooks.reduce((sum, block) => sum + (block.desktopLines || 0), 0),
    h1: blocks.find((block) => block.tag === 'h1') || null,
    hook: blocks.find((block) => /hook/i.test(block.kind) || block.tag === 'p') || null,
    blocks,
  };
}

function printAlignReport(report) {
  const jumpy = report.pages
    .flatMap((page) => (page.blocks || [])
      .filter((block) => (block.phoneLines || 0) >= 2)
      .map((block) => ({ route: page.route, ...block })))
    .sort((a, b) => b.phoneLines - a.phoneLines);

  process.stdout.write(`\ncopy-flow align  ${report.at}\n`);
  process.stdout.write(`pages=${report.pageCount}  title/hook blocks=${report.blockCount}  engine=${report.engine}\n`);
  process.stdout.write('titles and hooks that take 2+ lines on phone (288px)\n\n');
  process.stdout.write('φL  desk  wrap         route                                      preview\n');
  process.stdout.write(`${'-'.repeat(110)}\n`);
  for (const row of jumpy) {
    process.stdout.write(
      `${String(row.phoneLines).padStart(2)}  ${String(row.desktopLines).padStart(4)}  ${String(row.wrap || '-').padEnd(12)} ${String(row.route).slice(0, 42).padEnd(42)} ${row.expression ? `${row.expression} · ` : ''}${row.preview || ''}\n`,
    );
  }
  process.stdout.write(`\n${jumpy.length} wrapping titles/hooks. Import collectRoutePages + measurePagesWithPretext from scripts/lib/page-copy-audit.mjs.\n`);
}

export const alignAudit = {
  id: 'align',
  title: 'Measure titles and playable hooks for packing / HUD alignment',
  kind: 'page-copy-align',
  engine: 'pretext',
  measureKind: 'objective',
  source: 'scripts/page-copy-audit.mjs align',
  logPrefix: 'audit:align',
  profilePrefix: 'spw-align-',
  needsBrowser: true,
  async collect({ filter } = {}) {
    return collectRoutePages({ filter, extract: extractAlignTargets });
  },
  async measure({ pages, session, fonts, log }) {
    const measured = await measurePagesWithPretext(session, pages, fonts, { log });
    return { measured, fonts };
  },
  summarize: summarizeAlignPage,
  print: printAlignReport,
};
