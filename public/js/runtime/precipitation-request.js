/**
 * precipitation-request.js
 * ---------------------------------------------------------------------------
 * Query-driven condensation and print preparation from Spw projection requests.
 */

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

  if (tier) html.dataset.spwCondenseTier = tier;
  else delete html.dataset.spwCondenseTier;

  if (mode) html.dataset.spwPrecipitationMode = mode;
  else delete html.dataset.spwPrecipitationMode;

  const printReady = tier === 'print' || mode === 'print' || mode === 'screenshot' || params.screenshot === '1';
  if (printReady) {
    html.dataset.spwPrintReady = 'true';
    body?.setAttribute('data-spw-capture-mode', 'screenshot');
  } else {
    delete html.dataset.spwPrintReady;
  }

  if (tier || mode) {
    html.dataset.spwPrecipitationActive = 'true';
    html.dataset.spwQueryCondense = serializeSpwQuery({ condense: tier || mode }).replace(/^\?/, '') || tier || mode;
  } else {
    delete html.dataset.spwPrecipitationActive;
    delete html.dataset.spwQueryCondense;
  }

  return { tier, mode, printReady, params };
}

export function initPrecipitationRequest(root = document) {
  const result = applyPrecipitationRequest(root);
  const onPopState = () => applyPrecipitationRequest(root);
  window.addEventListener('popstate', onPopState);
  return () => window.removeEventListener('popstate', onPopState);
}