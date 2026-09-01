/**
 * spw-block-association.js
 * ---------------------------------------------------------------------------
 * HTML-Spw block association and editorial publishing convenience.
 * Cheap path reads subject/mode/parts via expression-query. Kernel parse()
 * is lazy and inspect-only. Kinship stays on the build-time manifest.
 * See .spw/conventions/html-spw-block-association.spw.
 */

import { bus } from '/public/js/kernel/bus.js';
import { writeDatasetValue, writeDatasetValueIfMissing } from '/public/js/kernel/dom-contracts.js';
import { parseExpressionQuery } from '/public/js/semantic/expression-query.js';
import { scanSpwExpression } from '/public/js/semantic/spw-expression-geometry.js';

const BLOCK_HOST_SELECTOR = [
  'script[type="text/spw"]',
  '[data-spw-definition]',
  'template[data-spw-block]',
  '[data-spw-ref]',
].join(', ');

const INSPECT_HOST_SELECTOR = [
  '.site-frame',
  '.frame-card',
  '[data-spw-definition]',
  '[data-spw-semantic-expression]',
].join(', ');

function expressionLineFrom(source = '') {
  const text = String(source || '').trim();
  if (!text) return '';
  const line = text
    .split('\n')
    .map((entry) => entry.trim())
    .find((entry) => entry && !entry.startsWith('#:') && !entry.startsWith('#!'))
    || text;
  return line.replace(/^#>[A-Za-z0-9_-]+\s*/, '').trim() || line;
}

export function parseSpwDefinition(source = '') {
  const text = String(source || '').trim();
  if (!text) return null;

  const handleMatch = text.match(/^#>([A-Za-z0-9_-]+)/);
  const handle = handleMatch ? handleMatch[1] : '';
  const expression = expressionLineFrom(text);
  const shape = parseExpressionQuery(expression);
  const geometry = scanSpwExpression(expression);

  const claims = {};
  for (const match of text.matchAll(/#:([A-Za-z0-9_-]+)\s+#!([^\n]+)/g)) {
    claims[match[1]] = match[2].trim();
  }

  return {
    raw: text,
    handle,
    expression: shape.raw || expression,
    claims,
    geometry,
    shape,
    join: shape.join,
  };
}

export async function challengeSpwDefinition(source, options = {}) {
  const parsed = parseSpwDefinition(source);
  if (!parsed) return null;
  const { parseSpw } = await import('/public/js/semantic/spw-runtime-parser.js');
  const kernel = parseSpw(parsed.expression || parsed.raw, options);
  return { ...parsed, kernel };
}

export function resolveElementSpwBlock(element) {
  if (!(element instanceof HTMLElement)) return null;

  if (element.dataset.spwDefinition) {
    return parseSpwDefinition(element.dataset.spwDefinition);
  }

  const script = element.querySelector('script[type="text/spw"]')
    || element.parentElement?.querySelector(`script[type="text/spw"][data-for="${CSS.escape(element.id || '')}"]`);
  if (script?.textContent) {
    return parseSpwDefinition(script.textContent);
  }

  if (element.dataset.spwSemanticExpression) {
    return parseSpwDefinition(element.dataset.spwSemanticExpression);
  }

  return null;
}

export function applyExpressionSlots(element, parsed = resolveElementSpwBlock(element)) {
  if (!(element instanceof HTMLElement) || !parsed?.shape) return false;
  const join = parsed.shape.join;
  if (join && join !== 'none') {
    writeDatasetValueIfMissing(element, 'spwJoin', join, {
      source: 'spw-block-association',
      reason: 'apply-slots',
    });
  }
  return true;
}

export function serializeElementToSpw(element) {
  if (!(element instanceof HTMLElement)) return '';

  const handle = element.id ? `#>${element.id.replace(/-/g, '_')}` : '';
  const expression = element.dataset.spwSemanticExpression || element.dataset.spwDefinition || '';
  const lines = [];

  if (expression) {
    lines.push(expression.startsWith('#>') ? expression : `${handle || '#>item'}[${expression}]`);
  } else if (handle) {
    lines.push(handle);
  }

  const claims = [];
  if (element.dataset.spwFixity) claims.push(`#:fixity #!${element.dataset.spwFixity}`);
  if (element.dataset.spwPhase) claims.push(`#:phase #!${element.dataset.spwPhase}`);
  if (element.dataset.spwTangibility) claims.push(`#:tangibility #!${element.dataset.spwTangibility}`);
  if (element.dataset.spwViscosity) claims.push(`#:viscosity #!${element.dataset.spwViscosity}`);
  if (element.dataset.spwCoherence) claims.push(`#:coherence #!${element.dataset.spwCoherence}`);
  if (element.dataset.spwBiome) claims.push(`#:biome #!${element.dataset.spwBiome}`);
  if (element.dataset.spwChargeState) claims.push(`#:charge_state #!${element.dataset.spwChargeState}`);

  return [...lines, ...claims].join('\n');
}

export function hydrateElementFromSpw(element, spwSource) {
  if (!(element instanceof HTMLElement) || !spwSource) return false;

  const parsed = parseSpwDefinition(spwSource);
  if (!parsed) return false;

  if (parsed.claims) {
    for (const [key, val] of Object.entries(parsed.claims)) {
      const datasetKey = `spw${key.charAt(0).toUpperCase()}${key.slice(1).replace(/_([a-z])/g, (_, c) => c.toUpperCase())}`;
      writeDatasetValue(element, datasetKey, val, {
        source: 'spw-block-association',
        reason: 'hydrate-from-spw',
      });
    }
  }

  if (parsed.expression) {
    writeDatasetValue(element, 'spwDefinition', parsed.raw, {
      source: 'spw-block-association',
      reason: 'hydrate-from-spw',
    });
  }

  applyExpressionSlots(element, parsed);
  return true;
}

export function copySpwToClipboard(text) {
  if (!navigator?.clipboard?.writeText) return false;
  navigator.clipboard.writeText(text);
  bus.emit('spw:copied', { text });
  return true;
}

function emitBlockSelection(host, block, extra = {}) {
  const shape = block?.shape || {};
  bus.emit('spw:block-selection', {
    subject: shape.subject || block?.handle || '',
    mode: shape.mode || '',
    activePart: (shape.parts || [])[0] || '',
    claim: Object.keys(block?.claims || {})[0] || '',
    join: shape.join || block?.join || '',
    host,
    ...extra,
  });
}

export function initSpwBlockAssociations(root = document) {
  if (typeof document === 'undefined') return () => {};
  const scope = root instanceof Document || root instanceof Element ? root : document;

  scope.querySelectorAll('[data-spw-definition], script[type="text/spw"]').forEach((host) => {
    if (host instanceof HTMLElement) applyExpressionSlots(host);
  });

  const onDblClick = (event) => {
    const host = event.target?.closest?.(INSPECT_HOST_SELECTOR);
    if (!host) return;

    const block = resolveElementSpwBlock(host);
    if (!block?.expression) return;

    copySpwToClipboard(block.expression);
    applyExpressionSlots(host, block);
    emitBlockSelection(host, block, { action: 'copy' });
    writeDatasetValue(host, 'spwCopiedState', 'flashed', {
      source: 'spw-block-association',
      reason: 'copy-spw',
    });
    setTimeout(() => {
      delete host.dataset.spwCopiedState;
    }, 600);
  };

  const onFocusIn = (event) => {
    const host = event.target?.closest?.('[data-spw-definition], script[type="text/spw"]');
    if (!(host instanceof HTMLElement)) return;
    const block = resolveElementSpwBlock(host);
    if (!block) return;
    applyExpressionSlots(host, block);
    emitBlockSelection(host, block, { action: 'inspect' });
    const source = block.raw || block.expression;
    if (!source) return;
    challengeSpwDefinition(source).then((challenged) => {
      if (!challenged?.kernel) return;
      emitBlockSelection(host, challenged, {
        action: 'parse',
        entry: challenged.kernel.entry,
      });
    }).catch(() => {});
  };

  scope.addEventListener('dblclick', onDblClick, { passive: true });
  scope.addEventListener('focusin', onFocusIn);

  return () => {
    scope.removeEventListener('dblclick', onDblClick);
    scope.removeEventListener('focusin', onFocusIn);
  };
}

export const SPW_BLOCK_ASSOCIATION_CONTRACT = Object.freeze({
  selectors: BLOCK_HOST_SELECTOR,
  parse: parseSpwDefinition,
  resolve: resolveElementSpwBlock,
  serialize: serializeElementToSpw,
  hydrate: hydrateElementFromSpw,
  apply: applyExpressionSlots,
  challenge: challengeSpwDefinition,
  entry: 'parse',
  refuse: 'parseExpression truncates identifier-led noun forms',
});

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'spw-block-association',
  mount: (ctx, root) => initSpwBlockAssociations(root instanceof Node ? root : document),
  describes: 'block[association]{definition.expression.inspect}<parse>',
  updates: ['inspect:data-spw-copied-state', 'flourish:data-spw-join'],
});

export const spwModule = SPW_MODULE_EXPORT;
