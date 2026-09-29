import test from 'node:test';
import assert from 'node:assert/strict';

import {
  composeVisionSeed,
  enrichCapturePayload,
  imageStemFromSource,
  readImageIngredient,
  readVariantIngredient,
  rememberVariantSelection,
  renderImageIngredientMarkup,
  resolveImageThumb,
} from '../../public/js/interface/cauldron/image-ingredient.js';

/* A small element stand-in: enough of closest/querySelector/dataset for the
   selectors image-ingredient.js asks (tag, [attr], [attr="value"], lists). */
function el(tag, attrs = {}, children = []) {
  const node = {
    tagName: tag.toUpperCase(),
    attributes: { ...attrs },
    children: [],
    parentElement: null,
    currentSrc: attrs.currentSrc || '',
    getAttribute(name) { return name in this.attributes ? this.attributes[name] : null; },
    get dataset() {
      const out = {};
      for (const [name, value] of Object.entries(this.attributes)) {
        if (!name.startsWith('data-')) continue;
        out[name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value;
      }
      return out;
    },
    matches(selector) {
      return selector.split(',').map((part) => part.trim()).some((part) => {
        const attr = /^\[([^\]=]+)(?:="([^"]*)")?\]$/.exec(part);
        if (attr) return attr[1] in this.attributes && (attr[2] === undefined || this.attributes[attr[1]] === attr[2]);
        return this.tagName === part.toUpperCase();
      });
    },
    closest(selector) {
      for (let at = this; at; at = at.parentElement) if (at.matches(selector)) return at;
      return null;
    },
    querySelectorAll(selector) {
      const found = [];
      const walk = (parent) => parent.children.forEach((child) => {
        if (child.matches(selector)) found.push(child);
        walk(child);
      });
      walk(this);
      return found;
    },
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; },
  };
  delete node.attributes.currentSrc;
  for (const child of children) {
    child.parentElement = node;
    node.children.push(child);
  }
  return node;
}

const FOLIO = '/public/images/assets/folios/folio-bone-box-launch';
const RENDER = '/public/images/renders/papergami/papergami-kinetic';
const GROK = '/public/images/assets/motifs/ornament-scaffold';

test('path stems drop the tier and extension, and refuse data: URIs', () => {
  assert.equal(imageStemFromSource(`https://spwashi.com${FOLIO}-display.webp?v=2`), FOLIO);
  assert.equal(imageStemFromSource(`${RENDER}.webp`), RENDER);
  assert.equal(imageStemFromSource('data:image/png;base64,AAAA'), '');
});

test('a folio scan reads as an original with its image stems, and stores no src', () => {
  const img = el('img', { src: `${FOLIO}-display.webp`, currentSrc: `${FOLIO}-display.avif`, alt: '' });
  const figure = el('figure', {
    'data-spw-image-key': 'folio-bone-box-launch',
    'data-spw-image-shape': 'portrait',
    'data-spw-image-prominence': 'feature',
  }, [img]);
  const caption = el('figcaption');
  caption.parentElement = figure;

  const record = readImageIngredient(caption);
  assert.equal(record.key, 'folio-bone-box-launch');
  assert.equal(record.stem, FOLIO);
  assert.equal(record.shape, 'portrait');
  assert.equal(record.prominence, 'feature');
  assert.equal(record.kind, 'original');
  assert.equal(record.tool, null);
  assert.equal(record.tier, 'display');
  const stored = JSON.stringify(record);
  assert.ok(!/\.(webp|avif|png)/.test(stored), 'no src is stored');
  assert.ok(!stored.includes('data:'), 'no data URI is stored');
});

test('a renders/ stem reads as generated, and a sidecar record names its tool', () => {
  const render = readImageIngredient(el('img', { src: `${RENDER}.webp` }));
  assert.equal(render.kind, 'generated');
  assert.equal(render.key, 'papergami-kinetic');
  assert.equal(render.tier, '');

  const grok = readImageIngredient(el('img', { src: `${GROK}-lattice-display.webp` }));
  assert.equal(grok.kind, 'generated');
  assert.equal(grok.tool, 'Grok Imagine');
  // ornament-scaffold ships only -display; the chip must not ask for a -thumb.
  assert.equal(grok.tier, 'display');
  assert.equal(resolveImageThumb(grok), `${GROK}-lattice-display.webp`);
});

test('a thumb in the srcset wins over the display tier served', () => {
  const img = el('img', { src: `${FOLIO}-display.webp`, srcset: `${FOLIO}-thumb.webp 480w, ${FOLIO}-display.webp 960w` });
  assert.equal(readImageIngredient(img).tier, 'thumb');
});

test('a key that image-metaphysics filled with a src path is replaced by the stem name', () => {
  const figure = el('figure', { 'data-spw-image-key': `${FOLIO}-display.webp` }, [el('img', { src: `${FOLIO}-display.webp` })]);
  assert.equal(readImageIngredient(figure).key, 'folio-bone-box-launch');
});

test('elements with no picture read as nothing', () => {
  assert.equal(readImageIngredient(el('p')), null);
  assert.equal(readImageIngredient(null), null);
  assert.equal(enrichCapturePayload({ region: 'read' }, el('p')).region, 'read');
});

test('thumbs resolve only to a tier known to exist', () => {
  assert.equal(resolveImageThumb({ stem: FOLIO, tier: 'thumb' }), `${FOLIO}-thumb.webp`);
  assert.equal(resolveImageThumb({ stem: FOLIO, tier: 'hero' }), `${FOLIO}-hero.webp`);
  assert.equal(resolveImageThumb({ stem: RENDER, tier: '' }), null);
  assert.equal(resolveImageThumb({ stem: RENDER }, new Set([`${RENDER}-thumb.avif`])), `${RENDER}-thumb.avif`);
  assert.equal(resolveImageThumb({ stem: FOLIO, tier: 'display' }, new Set([`${FOLIO}-thumb.webp`])), `${FOLIO}-thumb.webp`);
  const scaffold = `${GROK}-lattice`;
  assert.equal(resolveImageThumb({ stem: scaffold, tier: 'display' }, new Set([`${scaffold}-display.webp`])), `${scaffold}-display.webp`);
  assert.equal(resolveImageThumb({ key: 'no-stem' }), null);
});

test('the chip markup draws a lazy thumb and a labelled provenance mark', () => {
  const html = renderImageIngredientMarkup({ key: 'folio-bone-box-launch', stem: FOLIO, tier: 'thumb' });
  assert.match(html, /class="spw-cauldron-ingredient__thumb"[^>]*alt=""[^>]*loading="lazy"[^>]*decoding="async"[^>]*width="28" height="28"/);
  assert.match(html, /class="spw-cauldron-ingredient__provenance spw-cauldron-ingredient__provenance--original"[^>]*aria-label="Original artwork, scan of folio-bone-box-launch"[^>]*>\*</);
  const grok = renderImageIngredientMarkup({ key: 'ornament-scaffold', stem: GROK });
  assert.match(grok, /aria-label="Generated with Grok Imagine"[^>]*>~</);
  assert.equal(renderImageIngredientMarkup(null), '');
});

test('a capture inside a selected variant names the variant and the edge it came from', () => {
  rememberVariantSelection({ group: 'reading', variant: 'dense', previousVariant: 'plain' });
  const panel = el('div', {
    'data-mode-group': 'reading',
    'data-mode-panel': 'dense',
    'data-spw-variant-selected': 'true',
    'data-spw-semantic-expression': '#>frame[reading]{dense}',
  });
  el('article', { 'data-spw-component-variant-active': 'dense' }, [panel]);
  const leaf = el('span');
  leaf.parentElement = panel;
  assert.deepEqual(readVariantIngredient(leaf), {
    expression: '#>frame[reading]{dense}',
    variant: 'dense',
    group: 'reading',
    previous: 'plain',
  });
  assert.equal(enrichCapturePayload(null, leaf).variant.variant, 'dense');
  assert.equal(readVariantIngredient(el('span')), null);
});

test('the vision seed carries the cluster draft and points back at the scan', () => {
  const ingredients = [
    { expression: '~moss', label: 'moss', text: 'copper moss on paper', wonder: 'cultivation', payload: { image: { key: 'folio-bone-box-launch', stem: FOLIO } } },
    { expression: '~crane', label: 'crane', wonder: 'cultivation', payload: { image: { key: 'ornament-scaffold', stem: GROK } } },
  ];
  const seed = composeVisionSeed(ingredients, { lead: 'Daily observation as vision', gestureHistory: 'prime' });
  assert.ok(seed.drafts.length >= 1);
  assert.ok(seed.prompt.includes('copper moss on paper'));
  assert.ok(seed.prompt.includes('from scan folio-bone-box-launch'));
  assert.ok(seed.prompt.includes('after Grok Imagine ornament-scaffold'));
  assert.ok(!seed.prompt.includes('quiet domestic light'));
});

test('an unclustered fragment still reaches the prompt beside its scan', () => {
  const ingredients = [
    { expression: '~moss', label: 'moss', wonder: 'cultivation' },
    { expression: '~crane', label: 'crane', wonder: 'cultivation' },
    { expression: '~tide', label: 'low tide', wonder: 'orbit', payload: { image: { key: 'folio-bone-box-launch', stem: FOLIO } } },
  ];
  const seed = composeVisionSeed(ingredients);
  assert.ok(seed.prompt.includes('from scan folio-bone-box-launch'));
  assert.ok(seed.prompt.includes('low tide'), 'the scan\'s own fragment is not dropped');
});

test('the authored use line and trail label survive; only the render line went', () => {
  const held = [{ expression: '~moss', label: 'moss' }];
  const daily = composeVisionSeed(held, { gestureHistory: 'prime', use: 'Use as Library ward or character private vision.' });
  assert.equal(daily.prompt, 'Daily observation as vision: moss. Use as Library ward or character private vision. Gesture history: prime.');
  const trail = composeVisionSeed(held, {
    lead: 'Spell trail as vision',
    gestureHistory: '',
    traceLabel: 'From garden trace',
    use: 'Use as Library ward or character private vision.',
    traceFirst: true,
  });
  assert.equal(trail.prompt, 'Spell trail as vision: moss. From garden trace: direct. Use as Library ward or character private vision.');
});

test('a lone fragment still seeds a draft', () => {
  const seed = composeVisionSeed([{ expression: '~tide', label: 'low tide' }]);
  assert.deepEqual(seed.drafts, ['low tide']);
  assert.deepEqual(seed.provenance, []);
});

test('beat capture honours the capacity in effect and records undo', async () => {
  const store = new Map();
  const previousStorage = globalThis.localStorage;
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  };
  const quiet = { error: console.error, warn: console.warn };
  console.error = () => {};
  console.warn = () => {};
  document.documentElement.dataset.spwCauldronCapacity = '3';
  try {
    const composition = await import('../../public/js/interface/composition.js');
    const { canUndo, clearUndoStack, popUndoSnapshot } = await import('../../public/js/interface/cauldron/undo.js');
    const { bus } = await import('../../public/js/kernel/bus.js');
    for (const name of ['a', 'b', 'c']) composition.addIngredient({ expression: `~${name}` });
    // addIngredient already recorded undo; start clean so only the beat counts.
    clearUndoStack();
    const updates = [];
    const off = bus.on('cauldron:updated', (event) => updates.push(event?.detail ?? event));
    try {
      await composition.captureBeatAsIngredient();
    } finally {
      if (typeof off === 'function') off();
    }
    // Read the stored JSON, not getIngredients(), which normalizes on read.
    const raw = JSON.parse(store.get('spw-cauldron'));
    assert.equal(raw.length, 3);
    const beat = raw.at(-1);
    assert.equal(beat.expression.startsWith('beat[qa]'), true);
    assert.ok('phase' in beat && 'tangibility' in beat, 'the beat is normalized before it is stored');
    assert.equal(canUndo(), true, 'the beat recorded its own undo');
    assert.deepEqual(popUndoSnapshot().map((entry) => entry.expression), ['~a', '~b', '~c']);
    assert.equal(updates.length, 1, 'cauldron:updated fires once, from saveCauldron');
    assert.equal(updates.some((detail) => detail?.source === 'beat-capture'), false);
  } finally {
    delete document.documentElement.dataset.spwCauldronCapacity;
    console.error = quiet.error;
    console.warn = quiet.warn;
    globalThis.localStorage = previousStorage;
  }
});
