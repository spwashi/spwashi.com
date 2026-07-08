/**
 * precipitation-request.js
 * ---------------------------------------------------------------------------
 * Query-driven condensation and print preparation from Spw projection requests.
 */

import { writeRuntimeDatasetValues } from '/public/js/kernel/dom-contracts.js';
import { parseModularQuery, serializeSpwQuery } from '/public/js/kernel/query-composer.js';

const CONDENSE_TIERS = new Set(['brief', 'card', 'print', 'full']);
const PRECIPITATE_MODES = new Set(['screenshot', 'card', 'condensed', 'print']);

function resolveTier(params = {}) {
  const raw = params.condense || params.precipitate || params.screenshot || '';
  const tier = String(raw || '').trim().toLowerCase();
  if (CONDENSE_TIERS.has(tier)) return tier;
  if (tier === 'screenshot' || tier === 'condensed') return 'card';
  if (tier === 'print') return 'print';
  return '';
}

function resolveMode(params = {}, tier = '') {
  const precipitate = String(params.precipitate || '').trim().toLowerCase();
  if (PRECIPITATE_MODES.has(precipitate)) return precipitate;
  if (params.screenshot) return 'screenshot';
  if (tier === 'print') return 'print';
  if (tier === 'card' || tier === 'brief') return 'condensed';
  return '';
}

export function applyPrecipitationRequest(root = document, search = root.defaultView?.location?.search || '') {
  const html = root.documentElement;
  const body = root.body;
  if (!html) return null;

  const { params } = parseModularQuery(search);
  const tier = resolveTier(params);
  const mode = resolveMode(params, tier);
  const printReady = tier === 'print' || mode === 'print' || mode === 'screenshot' || params.screenshot === '1';
  const active = Boolean(tier || mode);

  writeRuntimeDatasetValues(html, {
    spwCondenseTier: tier || null,
    spwPrecipitationMode: mode || null,
    spwPrintReady: printReady ? 'true' : null,
    spwPrecipitationActive: active ? 'true' : null,
    spwQueryCondense: active
      ? serializeSpwQuery({ condense: tier || mode }).replace(/^\?/, '') || tier || mode
      : null,
  }, {
    source: 'precipitation-request',
    reason: 'query-precipitation',
  });

  if (printReady) {
    body?.setAttribute('data-spw-capture-mode', 'screenshot');
  } else {
    body?.removeAttribute('data-spw-capture-mode');
  }

  return { tier, mode, printReady, params };
}

export function initPrecipitationRequest(root = document) {
  applyPrecipitationRequest(root);
  const onPopState = () => applyPrecipitationRequest(root);
  window.addEventListener('popstate', onPopState);
  return () => window.removeEventListener('popstate', onPopState);
}