import {
  PRETEXT_BANDS,
  measurePagesWithPretext,
  summarizePretextPage,
} from '../page-copy-audit.mjs';

function printPretextReport(report) {
  const pages = report.pages;
  const volatile = pages.filter((page) => page.wrap === 'volatile');
  const responsive = pages.filter((page) => page.wrap === 'responsive');
  const empty = pages.filter((page) => page.blockCount === 0);
  const longestPhone = [...pages].sort((a, b) => b.phoneBodyLines - a.phoneBodyLines).slice(0, 12);
  const jumpyHeadings = pages
    .filter((page) => page.h1 && page.h1.phoneLines >= 3)
    .sort((a, b) => (b.h1.phoneLines - a.h1.phoneLines) || (b.wrapDelta - a.wrapDelta));

  process.stdout.write(`\npretext page measure  ${report.at}\n`);
  process.stdout.write(`pages=${report.pageCount}  blocks=${report.blockCount}  chars=${report.chars}  engine=${report.engine}\n`);
  if (report.fonts?.body) {
    process.stdout.write(`fonts: body=${report.fonts.body.font} / ${report.fonts.body.lineHeightPx}px\n`);
  }
  process.stdout.write(`wrap: stable=${pages.length - volatile.length - responsive.length}  responsive=${responsive.length}  volatile=${volatile.length}  empty=${empty.length}\n\n`);

  process.stdout.write('route                                      wrap        phone  desk  Δ    h1φ  chars\n');
  process.stdout.write(`${'-'.repeat(96)}\n`);
  for (const page of pages) {
    process.stdout.write(
      `${page.route.slice(0, 42).padEnd(42)} ${String(page.wrap || '-').padEnd(11)} ${String(page.phoneBodyLines ?? '-').padStart(5)} ${String(page.desktopBodyLines ?? '-').padStart(5)} ${String(page.wrapDelta ?? '-').padStart(4)}  ${String(page.h1?.phoneLines ?? '-').padStart(3)}  ${String(page.chars).padStart(5)}\n`,
    );
  }

  if (longestPhone.length) {
    process.stdout.write('\nlongest phone-body pages\n');
    for (const page of longestPhone) {
      process.stdout.write(
        `  ${String(page.phoneBodyLines).padStart(4)}L  ${page.route}  (${page.wrap}, ${page.chars} chars)\n`,
      );
    }
  }

  if (volatile.length) {
    process.stdout.write('\nvolatile wrap (block share, not summed line-count)\n');
    for (const page of volatile.sort((a, b) => (b.blockWrap?.volatile || 0) - (a.blockWrap?.volatile || 0))) {
      const preview = page.worstBlock?.preview || '';
      process.stdout.write(
        `  ${String(page.blockWrap?.volatile || 0).padStart(3)}/${String(page.blockCount).padStart(3)}  ${page.route}  ${preview}\n`,
      );
    }
  }

  if (jumpyHeadings.length) {
    process.stdout.write('\nheadings that wrap to 3+ lines on phone\n');
    for (const page of jumpyHeadings) {
      process.stdout.write(
        `  ${page.h1.phoneLines}L  ${page.route}  ${page.h1.preview}\n`,
      );
    }
  }

  if (empty.length) {
    process.stdout.write('\npages with no measurable main text\n');
    for (const page of empty) process.stdout.write(`  ${page.route}\n`);
  }

  process.stdout.write(`\nwidths phone=${PRETEXT_BANDS.phone.width} tablet=${PRETEXT_BANDS.tablet.width} desktop=${PRETEXT_BANDS.desktop.width}\n`);
}

export const pretextAudit = {
  id: 'pretext',
  title: 'Measure main-column copy with Pretext at phone/tablet/desktop',
  kind: 'page-pretext-measure',
  engine: 'pretext',
  measureKind: 'objective',
  source: 'scripts/measure-page-pretext.mjs',
  logPrefix: 'measure:pretext',
  profilePrefix: 'spw-pretext-',
  needsBrowser: true,
  widths: PRETEXT_BANDS,
  async measure({ pages, session, fonts, log }) {
    const measured = await measurePagesWithPretext(session, pages, fonts, { log });
    return { measured, fonts };
  },
  summarize: summarizePretextPage,
  decorateReport(pages) {
    return {
      wrap: {
        stable: pages.filter((page) => page.wrap === 'stable').length,
        responsive: pages.filter((page) => page.wrap === 'responsive').length,
        volatile: pages.filter((page) => page.wrap === 'volatile').length,
        empty: pages.filter((page) => page.blockCount === 0).length,
      },
    };
  },
  print: printPretextReport,
};
