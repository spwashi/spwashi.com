/**
 * debug-qa-posture.js
 * --------------------------------------------------------------------------
 * Single source of truth for ?debug / ?qa / ?log posture used by:
 *   - layout-shift filter (site.js)
 *   - debugOnly catalog modules (module-loader via hasDebugOrQAMode)
 *   - observation-beats local gate
 *   - layout-qa recipes + root datasets
 *   - DevTools __SPW_SITE__.debugQa
 *
 * Keep dependency-light (no catalog/loader imports).
 */

import { writeDatasetValue, writeDatasetValues } from '/public/js/kernel/dom-contracts.js';

const SPLIT_RE = /[,\s]+/;

export const DEBUG_QA_TOKENS = Object.freeze({
  LAYOUT: 'layout',
  LAYOUT_SHIFT: 'layout-shift',
  CSS: 'css',
  QA: 'qa',
  AGENT: 'agent',
  BEAT: 'beat',
  DEBUG: 'debug',
  VISION: 'vision',
});

export const SPW_DEBUG_QA_PRESETS = Object.freeze({
  layout: '?debug=layout&log=layout-shift&log-level=debug',
  layoutInspect: '?view=inspect&debug=layout&diagnostics=basic&log=layout-shift&log-level=debug&meaning=inspect',
  screenshotQa: '?qa=screenshot-qa&debug=qa,layout,agent&log=layout-shift,observation-beats&log-level=debug&meaning=inspect&physics=screenshot',
  agentQa: '?debug=qa,agent,layout&qa=agent&log=layout-shift,observation-beats&log-level=debug',
  cssDebug: '?debug=css&log-level=debug',
  beats: '?debug=beat,qa&log=observation-beats&log-level=debug',
});

export const SPW_DEBUG_QA_CONTRACT = Object.freeze({
  id: 'debug-qa-posture',
  queryKeys: Object.freeze({
    debug: Object.freeze(['debug', 'spw-debug']),
    qa: Object.freeze(['qa', 'spw-qa']),
    log: Object.freeze(['log', 'spw-log']),
    mode: Object.freeze(['mode', 'spw-mode']),
  }),
  datasets: Object.freeze({
    mode: 'spwDebugMode',
    tokens: 'spwDebug',
    qa: 'spwQa',
    posture: 'spwDebugQaPosture',
    layout: 'spwDebugLayout',
    agent: 'spwDebugAgent',
  }),
  presets: SPW_DEBUG_QA_PRESETS,
  portableUse:
    'readDebugQaPosture() once at boot; hasDebugOrQAMode/hasLayoutDebug share the same token set. Prefer presets over ad-hoc query strings.',
});

function splitTokens(raw) {
  return String(raw || '')
    .toLowerCase()
    .split(SPLIT_RE)
    .map((t) => t.trim())
    .filter(Boolean);
}

function firstParam(params, keys) {
  for (const key of keys) {
    const value = params.get(key);
    if (value != null && String(value).length) return value;
  }
  return '';
}

function tokenSet(list) {
  return new Set(list);
}

/**
 * @param {string|URLSearchParams|null} search
 * @param {Document|null} doc
 */
export function readDebugQaPosture(search = null, doc = null) {
  const documentRef = doc || (typeof document !== 'undefined' ? document : null);
  const html = documentRef?.documentElement || null;
  const body = documentRef?.body || null;

  let params;
  try {
    if (search instanceof URLSearchParams) {
      params = search;
    } else if (typeof search === 'string') {
      params = new URLSearchParams(search.replace(/^\?/, ''));
    } else if (typeof window !== 'undefined' && window.location) {
      params = new URLSearchParams(String(window.location.search || '').replace(/^\?/, ''));
    } else {
      params = new URLSearchParams();
    }
  } catch {
    params = new URLSearchParams();
  }

  const debugFromQuery = splitTokens(firstParam(params, SPW_DEBUG_QA_CONTRACT.queryKeys.debug));
  const qaFromQuery = splitTokens(firstParam(params, SPW_DEBUG_QA_CONTRACT.queryKeys.qa));
  const logFromQuery = splitTokens(firstParam(params, SPW_DEBUG_QA_CONTRACT.queryKeys.log));
  const modeFromQuery = splitTokens(firstParam(params, SPW_DEBUG_QA_CONTRACT.queryKeys.mode));

  const debugFromDom = splitTokens(
    html?.dataset?.spwDebug || body?.dataset?.spwDebug || '',
  );
  const qaFromDom = splitTokens(html?.dataset?.spwQa || body?.dataset?.spwQa || '');
  const modeOn = html?.dataset?.spwDebugMode === 'on' || body?.dataset?.spwDebugMode === 'on';

  const debug = tokenSet([...debugFromQuery, ...debugFromDom]);
  const qa = tokenSet([...qaFromQuery, ...qaFromDom]);
  const log = tokenSet(logFromQuery);
  const mode = tokenSet(modeFromQuery);

  // Normalize aliases
  if (debug.has('layout-shift')) debug.add(DEBUG_QA_TOKENS.LAYOUT);
  if (log.has('layout-shift') || [...log].some((t) => t.includes('layout'))) {
    debug.add(DEBUG_QA_TOKENS.LAYOUT);
  }
  if (qa.has('screenshot') || qa.has('screenshot-qa') || mode.has('screenshot-qa')) {
    qa.add(DEBUG_QA_TOKENS.QA);
    debug.add(DEBUG_QA_TOKENS.QA);
    debug.add(DEBUG_QA_TOKENS.AGENT);
  }
  if (mode.has('qa') || mode.has('beat')) {
    qa.add(DEBUG_QA_TOKENS.QA);
    debug.add(DEBUG_QA_TOKENS.QA);
  }
  if (debug.has('on')) {
    debug.add(DEBUG_QA_TOKENS.CSS);
  }

  const has = (set, ...tokens) => tokens.some((t) => set.has(t));

  const layoutDebug = has(debug, DEBUG_QA_TOKENS.LAYOUT, DEBUG_QA_TOKENS.LAYOUT_SHIFT)
    || [...debug].some((t) => t.includes('layout'))
    || [...log].some((t) => t.includes('layout'));

  const agentQa = has(debug, DEBUG_QA_TOKENS.QA, DEBUG_QA_TOKENS.AGENT, DEBUG_QA_TOKENS.BEAT, DEBUG_QA_TOKENS.VISION)
    || has(qa, DEBUG_QA_TOKENS.QA, 'agent', 'beat', 'screenshot', 'screenshot-qa')
    || has(mode, 'qa', 'beat', 'screenshot', 'screenshot-qa');

  const cssDebug = has(debug, DEBUG_QA_TOKENS.CSS) || modeOn;
  const debugOnlyModules = agentQa
    || layoutDebug
    || has(debug, DEBUG_QA_TOKENS.DEBUG)
    || modeOn;

  const tokens = Object.freeze([...debug].sort());
  const qaTokens = Object.freeze([...qa].sort());
  const logTokens = Object.freeze([...log].sort());

  let posture = 'quiet';
  if (agentQa && layoutDebug) posture = 'agent-layout';
  else if (agentQa) posture = 'agent';
  else if (layoutDebug) posture = 'layout';
  else if (cssDebug) posture = 'css';
  else if (debugOnlyModules) posture = 'debug';

  return Object.freeze({
    tokens,
    qaTokens,
    logTokens,
    modeOn,
    layoutDebug,
    agentQa,
    cssDebug,
    debugOnlyModules,
    posture,
    search: typeof search === 'string'
      ? search
      : (typeof window !== 'undefined' ? window.location?.search || '' : ''),
  });
}

/** Catalog debugOnly modules + observation-beats style gates. */
export function hasDebugOrQAMode(ctx = null, posture = null) {
  const p = posture || readDebugQaPosture();
  if (p.debugOnlyModules) return true;
  if (ctx?.debug?.size) {
    const tokens = [...ctx.debug].map((t) => String(t).toLowerCase());
    if (tokens.some((t) => (
      t === 'qa' || t === 'agent' || t === 'beat' || t === 'layout'
      || t === 'debug' || t === 'vision' || t.includes('layout')
    ))) {
      return true;
    }
  }
  return false;
}

/** layout-shift-audit eligibility (filterEnhancementDefs). */
export function hasLayoutDebug(posture = null) {
  const p = posture || readDebugQaPosture();
  return Boolean(p.layoutDebug);
}

/** observation-beats / screenshot agent surfaces. */
export function hasAgentQa(posture = null) {
  const p = posture || readDebugQaPosture();
  return Boolean(p.agentQa);
}

/**
 * Project posture onto <html> for CSS, agents, and createRuntimeContext debug set.
 */
export function applyDebugQaPostureToRoot(html = null, posture = null) {
  const root = html
    || (typeof document !== 'undefined' ? document.documentElement : null);
  if (!(root instanceof HTMLElement)) return null;

  const p = posture || readDebugQaPosture(null, root.ownerDocument || document);

  writeDatasetValues(root, {
    spwDebugQaPosture: p.posture === 'quiet' ? null : p.posture,
    spwDebugLayout: p.layoutDebug ? 'on' : null,
    spwDebugAgent: p.agentQa ? 'on' : null,
    spwQa: p.qaTokens.length ? p.qaTokens.join(' ') : null,
  }, {
    source: 'debug-qa-posture',
    reason: 'boot-project',
  });

  // Ensure debug token set is present when only query carried layout/qa
  // (query disposition usually sets spwDebug; fill gaps for early readers).
  if (p.tokens.length && !root.dataset.spwDebug) {
    writeDatasetValue(root, 'spwDebug', p.tokens.join(' '), {
      source: 'debug-qa-posture',
      reason: 'fill-debug-tokens',
    });
  }
  if (p.debugOnlyModules && root.dataset.spwDebugMode !== 'on' && p.posture !== 'quiet') {
    writeDatasetValue(root, 'spwDebugMode', 'on', {
      source: 'debug-qa-posture',
      reason: 'debug-or-qa-active',
    });
  }

  return p;
}

export function describeDebugQaPosture(posture = null) {
  const p = posture || readDebugQaPosture();
  return {
    posture: p.posture,
    layoutDebug: p.layoutDebug,
    agentQa: p.agentQa,
    cssDebug: p.cssDebug,
    debugOnlyModules: p.debugOnlyModules,
    tokens: p.tokens,
    qaTokens: p.qaTokens,
    logTokens: p.logTokens,
    presets: SPW_DEBUG_QA_PRESETS,
    recipes: {
      enableLayout: SPW_DEBUG_QA_PRESETS.layout,
      enableAgent: SPW_DEBUG_QA_PRESETS.agentQa,
      enableScreenshot: SPW_DEBUG_QA_PRESETS.screenshotQa,
      console: [
        '__SPW_SITE__.debugQa.posture()',
        '__SPW_SITE__.debugQa.apply()',
        '__SPW_SITE__.layoutQa.summary()',
        'spwCompose.help("layout")',
        'spwCompose.debugPresets',
      ],
    },
  };
}
