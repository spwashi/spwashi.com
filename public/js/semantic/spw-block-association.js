/**
 * spw-block-association.js
 * ---------------------------------------------------------------------------
 * HTML-Spw block association and editorial publishing convenience.
 * Enables zero-boilerplate embedding of Spw definitions into HTML frames,
 * local AST mapping, selection affordances, and bi-directional synchronization.
 * See .spw/conventions/html-spw-block-association.spw.
 */

import { bus } from '/public/js/kernel/bus.js';
import { writeDatasetValue } from '/public/js/kernel/dom-contracts.js';
import { scanSpwExpression } from '/public/js/semantic/spw-expression-geometry.js';

const BLOCK_HOST_SELECTOR = [
  'script[type="text/spw"]',
  '[data-spw-definition]',
  'template[data-spw-block]',
  '[data-spw-ref]',
].join(', ');

export function parseSpwDefinition(source = '') {
  const text = source.trim();
  if (!text) return null;

  // Read handle #>handle
  const handleMatch = text.match(/^#>([a-zA-Z0-9_\-]+)/);
  const handle = handleMatch ? handleMatch[1] : '';

  // Read capsule / expression
  const capsuleMatch = text.match(/([a-zA-Z0-9_.\-]+(?:\[[^\]]*\])?(?:\{[^}]*\})?(?:<[^>]*>)?)/);
  const expression = capsuleMatch ? capsuleMatch[1] : text;

  // Read claims #:key #!val
  const claims = {};
  for (const match of text.matchAll(/#:([a-zA-Z0-9_\-]+)\s+#!([^\n]+)/g)) {
    claims[match[1]] = match[2].trim();
  }

  const geometry = scanSpwExpression(expression);

  return {
    raw: text,
    handle,
    expression,
    claims,
    geometry,
  };
}

export function resolveElementSpwBlock(element) {
  if (!(element instanceof HTMLElement)) return null;

  // Direct attribute definition
  if (element.dataset.spwDefinition) {
    return parseSpwDefinition(element.dataset.spwDefinition);
  }

  // Adjacent or nested script[type="text/spw"]
  const script = element.querySelector('script[type="text/spw"]')
    || element.parentElement?.querySelector(`script[type="text/spw"][data-for="${CSS.escape(element.id || '')}"]`);
  if (script?.textContent) {
    return parseSpwDefinition(script.textContent);
  }

  // Expression attribute fallback
  if (element.dataset.spwSemanticExpression) {
    return parseSpwDefinition(element.dataset.spwSemanticExpression);
  }

  return null;
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

  return true;
}

export function copySpwToClipboard(text) {
  if (!navigator?.clipboard?.writeText) return false;
  navigator.clipboard.writeText(text);
  bus.emit('spw:copied', { text });
  return true;
}

export function initSpwBlockAssociations(root = document) {
  if (typeof document === 'undefined') return () => {};

  const onDblClick = (event) => {
    const host = event.target?.closest?.('.site-frame, .frame-card, [data-spw-definition], [data-spw-semantic-expression]');
    if (!host) return;

    const block = resolveElementSpwBlock(host);
    if (!block?.expression) return;

    copySpwToClipboard(block.expression);
    writeDatasetValue(host, 'spwCopiedState', 'flashed', {
      source: 'spw-block-association',
      reason: 'copy-spw',
    });
    setTimeout(() => {
      delete host.dataset.spwCopiedState;
    }, 600);
  };

  root.addEventListener('dblclick', onDblClick, { passive: true });

  return () => {
    root.removeEventListener('dblclick', onDblClick);
  };
}

export const SPW_BLOCK_ASSOCIATION_CONTRACT = Object.freeze({
  selectors: BLOCK_HOST_SELECTOR,
  parse: parseSpwDefinition,
  resolve: resolveElementSpwBlock,
  serialize: serializeElementToSpw,
  hydrate: hydrateElementFromSpw,
});
