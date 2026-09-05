import assert from 'node:assert/strict';
import test from 'node:test';

import {
  chunkPages,
  classifyPageWrap,
  classifyWrap,
  extractBlocks,
  classifyExpressionShape,
  extractCopyUnitHosts,
  extractExpressionHosts,
  extractPageMeta,
  kindForTag,
  parseCopyUnit,
  readSemanticExpression,
  readSpwAttr,
  matchesRouteFilter,
  parseAuditArgs,
  previewText,
  stripMarkup,
  summarizePretextPage,
  toRoutePath,
} from '../lib/page-copy-audit.mjs';
import { PAGE_COPY_AUDITS } from '../page-copy-audit.mjs';
import {
  assignDevelopmentClusters,
  flagCopyVoice,
} from '../lib/page-copy-audits/accessor.mjs';
import { inventoryAudit } from '../lib/page-copy-audits/inventory.mjs';
import { pretextAudit } from '../lib/page-copy-audits/pretext.mjs';

test('toRoutePath maps index files onto public paths', () => {
  assert.equal(toRoutePath('index.html'), '/');
  assert.equal(toRoutePath('about/index.html'), '/about/');
  assert.equal(toRoutePath('topics/software/pretext/index.html'), '/topics/software/pretext/');
});

test('kindForTag maps markup onto pretext archetypes', () => {
  assert.equal(kindForTag('h1'), 'heading');
  assert.equal(kindForTag('h2'), 'heading');
  assert.equal(kindForTag('h3'), 'subheading');
  assert.equal(kindForTag('p'), 'body');
  assert.equal(kindForTag('blockquote'), 'body');
  assert.equal(kindForTag('li'), 'label');
});

test('stripMarkup and extractBlocks read main-column copy only', () => {
  const html = `
    <header><p>Chrome should be ignored if it sits outside main.</p></header>
    <main>
      <h1>Short</h1>
      <p>A long enough body paragraph for the inventory threshold.</p>
      <li>tiny</li>
      <script>ignore me</script>
      <p>Second <em>body</em> with&nbsp;entities &amp; marks.</p>
    </main>
  `;
  const blocks = extractBlocks(html);
  assert.deepEqual(blocks.map((block) => [block.tag, block.kind, block.text]), [
    ['h1', 'heading', 'Short'],
    ['p', 'body', 'A long enough body paragraph for the inventory threshold.'],
    ['p', 'body', 'Second body with entities & marks.'],
  ]);
  assert.equal(stripMarkup('<p>Hello <b>there</b></p>'), 'Hello there');
});

test('classifyWrap and classifyPageWrap match the pretext bus thresholds', () => {
  assert.equal(classifyWrap(3, 3), 'stable');
  assert.equal(classifyWrap(5, 3), 'responsive');
  assert.equal(classifyWrap(8, 3), 'volatile');
  assert.equal(classifyPageWrap([]), 'stable');
  assert.equal(classifyPageWrap([
    { wrap: 'stable' },
    { wrap: 'stable' },
    { wrap: 'stable' },
    { wrap: 'stable' },
    { wrap: 'responsive' },
  ]), 'stable');
  assert.equal(classifyPageWrap([
    { wrap: 'volatile' },
    { wrap: 'volatile' },
    { wrap: 'volatile' },
    { wrap: 'volatile' },
  ]), 'volatile');
});

test('chunkPages splits oversized routes and packs small ones', () => {
  const pages = [
    { route: '/a/', blockCount: 2, blocks: [{ text: 'a1' }, { text: 'a2' }] },
    { route: '/b/', blockCount: 5, blocks: [1, 2, 3, 4, 5].map((n) => ({ text: `b${n}` })) },
  ];
  const batches = chunkPages(pages, 3);
  assert.equal(batches.length, 3);
  assert.deepEqual(batches[0].map((page) => page.route), ['/a/']);
  assert.equal(batches[1][0].blocks.length, 3);
  assert.equal(batches[2][0].blocks.length, 2);
});

test('summarizePretextPage uses block-share wrap, not summed line-count', () => {
  const stableBand = { phone: { lineCount: 1 }, desktop: { lineCount: 1 } };
  const page = summarizePretextPage(
    { file: 'about/index.html', route: '/about/', chars: 200 },
    [
      { tag: 'h1', kind: 'heading', chars: 10, preview: 'About', bands: { phone: { lineCount: 2 }, desktop: { lineCount: 1 } } },
      { tag: 'p', kind: 'body', chars: 30, preview: 'Long', bands: { phone: { lineCount: 20 }, desktop: { lineCount: 6 } } },
      ...Array.from({ length: 8 }, (_, i) => ({
        tag: 'p',
        kind: 'body',
        chars: 12,
        preview: `Short ${i}`,
        bands: stableBand,
      })),
    ],
  );
  assert.equal(page.wrap, 'stable');
  assert.equal(page.phoneBodyLines, 28);
  assert.equal(page.desktopBodyLines, 14);
  assert.equal(page.blockWrap.volatile, 1);
  assert.equal(page.h1.phoneLines, 2);
});

test('inventory audit summarizes without a browser', () => {
  const page = inventoryAudit.summarize(
    { file: 'about/index.html', route: '/about/', chars: 40 },
    [
      { tag: 'h1', kind: 'heading', chars: 10, text: 'About Spwashi' },
      { tag: 'p', kind: 'body', chars: 30, text: 'A long enough body paragraph.' },
    ],
  );
  assert.equal(page.kinds.body, 1);
  assert.equal(page.longest.chars, 30);
  assert.equal(inventoryAudit.needsBrowser, false);
  assert.equal(pretextAudit.needsBrowser, true);
});

test('dispatcher registry names the two starter audits', () => {
  assert.deepEqual(PAGE_COPY_AUDITS.map((audit) => audit.id), ['inventory', 'variety', 'pretext', 'align', 'expr', 'accessor']);
});

test('resolveCompareWidth picks the farther reference band', async () => {
  const { resolveCompareWidth, PRETEXT_REFERENCE_WIDTHS, preparePretextHandle, selectFittingExpression } = await import('../../public/js/semantic/pretext-measurement-bus.js');
  assert.equal(resolveCompareWidth(900), PRETEXT_REFERENCE_WIDTHS.phone);
  assert.equal(resolveCompareWidth(200), PRETEXT_REFERENCE_WIDTHS.desktop);
  assert.equal(resolveCompareWidth(400, 640), 640);
  const engine = {
    prepareWithSegments(text, font) { return { kind: 'segments', text, font }; },
    prepare() { return { kind: 'plain' }; },
    layoutWithLines(handle, width) {
      const lineCount = Math.max(1, Math.ceil((handle.text.length * 8) / width));
      return { lineCount, lines: [{ width }] };
    },
  };
  assert.equal(preparePretextHandle(engine, 'hi', '16px sans').kind, 'segments');
  const fit = selectFittingExpression({
    engine,
    width: 160,
    lineHeightPx: 24,
    variants: [
      { id: 'tight', expression: 'copy[hook]{wrap}' },
      { id: 'full', expression: 'copy[hook]{wrap.align.pack.measure}' },
    ],
  });
  assert.equal(fit.chosen.id, 'tight');
  assert.equal(fit.measured.length, 2);
});

test('classifyExpressionShape names unused richer forms', () => {
  assert.equal(classifyExpressionShape('copy[hook]{wrap}'), 'plain');
  assert.equal(classifyExpressionShape('copy[hook]{wrap}<align>'), 'projection');
  assert.equal(classifyExpressionShape('component[machine]{attention} ~ copy[hook]{wrap}'), 'compound');
  assert.equal(classifyExpressionShape('?copy[fit]{brace.select}<measure>'), 'operator-led');
});

test('extractExpressionHosts keys wrap by authored Spw expression', () => {
  const html = `
    <main>
      <p data-spw-semantic-expression="copy[hook]{wrap.align}">A component is a small machine for arranging attention.</p>
      <p>Plain prose without an expression is ignored.</p>
    </main>
  `;
  const hosts = extractExpressionHosts(html);
  assert.equal(hosts.length, 1);
  assert.equal(hosts[0].expression, 'copy[hook]{wrap.align}');
  assert.equal(readSemanticExpression(' data-spw-semantic-expression="home[reading]{author.craft.return}" '), 'home[reading]{author.craft.return}');
});

test('parseAuditArgs and previewText stay small', () => {
  assert.equal(parseAuditArgs(['--route', '/about/', '--json']).route, '/about/');
  assert.equal(parseAuditArgs(['--json']).json, true);
  assert.equal(previewText('abcdefghij', 6), 'abcdef…');
  assert.equal(matchesRouteFilter('about/index.html', '/about/', 'about'), true);
  assert.equal(matchesRouteFilter('play/index.html', '/play/', 'about'), false);
});

test('parseCopyUnit splits the dotted localization projection', () => {
  assert.deepEqual(parseCopyUnit('curriculum.hook.lede'), {
    id: 'curriculum.hook.lede',
    parts: ['curriculum', 'hook', 'lede'],
    arity: 3,
    namespace: 'curriculum',
    cluster: 'hook',
    slot: 'lede',
    shape: 'triple',
    valid: true,
  });
  assert.equal(parseCopyUnit('home.promoWonderCycle.daily.promo').shape, 'nested');
  assert.equal(parseCopyUnit('home.promoWonderCycle.daily.promo').slot, 'daily.promo');
  assert.equal(parseCopyUnit('lede').shape, 'short');
  assert.equal(parseCopyUnit('').shape, 'empty');
  assert.equal(readSpwAttr(' data-spw-copy-unit="about.hook.lede" ', 'copy-unit'), 'about.hook.lede');
});

test('extractCopyUnitHosts joins the dotted key to the Spw handle', () => {
  const html = `
    <body data-spw-page-family="curriculum" data-spw-related-routes="/curriculum/|/topics/math/|/recipes/">
      <main>
        <p class="hook-lede" data-spw-copy-unit="curriculum.hook.lede" data-spw-semantic-expression="curriculum[reading]{memory}">
          A module names a technical mechanism.
        </p>
        <p class="hook-lede">Lens variant without a copy-unit.</p>
        <article data-spw-copy-unit="home.promoWonderCycle.daily.promo" data-spw-locale="en">
          <p>Daily promo card.</p>
        </article>
      </main>
    </body>
  `;
  const hosts = extractCopyUnitHosts(html);
  const units = hosts.filter((block) => block.copyUnit);
  const gaps = hosts.filter((block) => !block.copyUnit && block.kind === 'gap');
  assert.equal(units.length, 2);
  assert.equal(units[0].copyUnit, 'curriculum.hook.lede');
  assert.equal(units[0].expression, 'curriculum[reading]{memory}');
  assert.equal(units[0].namespace, 'curriculum');
  assert.deepEqual(units[0].relatedRoutes, ['/curriculum/', '/topics/math/', '/recipes/']);
  assert.equal(units[1].shape, 'nested');
  assert.equal(gaps.length, 1);
  const meta = extractPageMeta(html);
  assert.equal(meta.pageFamily, 'curriculum');
});

test('flagCopyVoice and development clusters stay conservative', () => {
  assert.deepEqual(
    flagCopyVoice({
      text: 'Boonhonk is five transforms on one beat.',
      html: '',
      copyUnit: 'about.boonhonk.lede',
      textualRole: 'note',
    }),
    [],
  );
  assert.ok(flagCopyVoice({
    text: 'Hold the count into the cauldron if you want the number.',
    html: '<p>Hold the count into the cauldron if you want the number.</p>',
    copyUnit: 'recipes.soilCompanions.lede',
    textualRole: 'note',
    className: '',
  }).includes('unglossed:cauldron'));
  assert.ok(flagCopyVoice({
    text: "It's like x, y, and z for your workflow.",
    html: '',
    copyUnit: 'home.hook.lede',
    textualRole: 'lede',
  }).includes('ai-like'));
  assert.deepEqual(
    assignDevelopmentClusters('curriculum.memory.lede', { route: '/curriculum/' }),
    ['curriculum-numericity'],
  );
  assert.deepEqual(
    assignDevelopmentClusters('recipes.soilCompanions.lede', { route: '/recipes/' }),
    ['curriculum-numericity'],
  );
  assert.deepEqual(
    assignDevelopmentClusters('about.hook.lede', { route: '/about/' }),
    ['person-magazine'],
  );
});
