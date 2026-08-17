import { previewText } from '../page-copy-audit.mjs';

function summarizeInventoryPage(page, blocks = page.blocks || []) {
  const kinds = { heading: 0, subheading: 0, body: 0, label: 0 };
  let longest = null;
  for (const block of blocks) {
    kinds[block.kind] = (kinds[block.kind] || 0) + 1;
    if (!longest || block.chars > longest.chars) {
      longest = {
        tag: block.tag,
        kind: block.kind,
        chars: block.chars,
        preview: previewText(block.text || block.preview || ''),
      };
    }
  }

  return {
    file: page.file,
    route: page.route,
    chars: page.chars,
    blockCount: blocks.length,
    kinds,
    longest,
  };
}

function printInventoryReport(report) {
  const pages = [...report.pages].sort((a, b) => b.chars - a.chars);
  process.stdout.write(`\npage copy inventory  ${report.at}\n`);
  process.stdout.write(`pages=${report.pageCount}  blocks=${report.blockCount}  chars=${report.chars}  engine=${report.engine}\n\n`);
  process.stdout.write('route                                      blocks  chars   body  h*   longest\n');
  process.stdout.write(`${'-'.repeat(96)}\n`);
  for (const page of pages) {
    const longest = page.longest ? `${page.longest.chars}c ${page.longest.preview}` : '';
    process.stdout.write(
      `${page.route.slice(0, 42).padEnd(42)} ${String(page.blockCount).padStart(6)} ${String(page.chars).padStart(6)} ${String(page.kinds?.body || 0).padStart(5)} ${String((page.kinds?.heading || 0) + (page.kinds?.subheading || 0)).padStart(4)}  ${longest.slice(0, 28)}\n`,
    );
  }
  process.stdout.write('\nThis audit is extract-only. Run `pretext` to measure wrap.\n');
}

export const inventoryAudit = {
  id: 'inventory',
  title: 'Extract main-column copy without a browser (sibling of pretext)',
  kind: 'page-copy-inventory',
  engine: 'extract',
  measureKind: 'objective',
  source: 'scripts/page-copy-audit.mjs inventory',
  logPrefix: 'audit:inventory',
  needsBrowser: false,
  measure() {
    return { measured: [], fonts: null };
  },
  summarize: summarizeInventoryPage,
  print: printInventoryReport,
};
