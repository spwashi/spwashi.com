import { bus } from '/public/js/kernel/bus.js';
import { writeDatasetValue } from '/public/js/kernel/dom-contracts.js';
import { deriveSemanticBraceExpression } from '/public/js/semantic/semantic-braces.js';
import { humanizeToken, normalizeText, normalizeToken, unique } from '/public/js/semantic/semantic-utils.js';

const DEFAULT_SELECTOR = [
  '[data-spw-semantic-cluster]',
  '[data-spw-vocab]',
  '[data-spw-semantic-expression]',
  '[data-spw-topic]',
  '.spw-topic',
  '[data-spw-living-term]',
  '.spw-living-term',
].join(', ');

const SOURCE_ATTRIBUTE = 'spwCrossrefSource';
const STATE_ATTRIBUTE = 'spwCrossref';

// What the page shows as focused now. pointerover repeats for one target as the
// pointer crosses its children, and every touch on a phone scroll lands one, so
// a focus writes only its difference from this and an idle clear is skipped.
const focused = { token: '', source: null, marked: new Set() };

function splitTokens(value = '') {
  return normalizeText(value)
    .split(/\s+/)
    .map(normalizeToken)
    .filter(Boolean);
}

function getTopicToken(el) {
  if (!el) return '';
  const authored = normalizeText(el.dataset.spwTopic || '');
  const label = authored || normalizeText(el.textContent || '');
  return normalizeToken(label);
}

function getElementTokens(el) {
  if (!(el instanceof Element)) return [];

  const semantic = deriveSemanticBraceExpression(el);
  const tokens = [
    normalizeToken(el.dataset.spwVocab || ''),
    ...splitTokens(el.dataset.spwSemanticCluster || ''),
    semantic?.root || '',
    semantic?.variant || '',
    semantic?.behavior || '',
    semantic?.lens || '',
    normalizeToken(el.dataset.spwInput || ''),
    normalizeToken(el.dataset.spwOperation || ''),
    normalizeToken(el.dataset.spwReturn || ''),
    normalizeToken(el.dataset.spwTone || ''),
    getTopicToken(el),
  ];

  return unique(tokens);
}

function describeElement(el, tokens) {
  const semantic = deriveSemanticBraceExpression(el);
  const section = el.closest('[id]')?.id || '';
  const heading = el.closest('section, article, main')?.querySelector('h1, h2, h3')?.textContent || '';

  return {
    label: normalizeText(el.getAttribute('aria-label') || el.textContent || el.dataset.spwSemanticExpression || ''),
    section,
    heading: normalizeText(heading),
    semanticExpression: semantic?.key || normalizeText(el.dataset.spwSemanticExpression || ''),
    semanticRoot: semantic?.root || '',
    semanticVariant: semantic?.variant || '',
    semanticBehavior: semantic?.behavior || '',
    semanticLens: semantic?.lens || '',
    input: normalizeText(el.dataset.spwInput || ''),
    operation: normalizeText(el.dataset.spwOperation || ''),
    returnValue: normalizeText(el.dataset.spwReturn || ''),
    tone: normalizeText(el.dataset.spwTone || ''),
    signature: normalizeText(el.dataset.spwSignature || ''),
    tokens,
  };
}

function collectCrossrefTargets(root, selector) {
  const scope = root?.querySelectorAll ? root : document;
  const nodes = Array.from(scope.querySelectorAll(selector));

  if (root instanceof Element && root.matches(selector)) {
    nodes.unshift(root);
  }

  return unique(nodes).filter((el) => getElementTokens(el).length > 0);
}

function buildRegistry(targets) {
  const byToken = new Map();
  const metadata = new Map();

  targets.forEach((el) => {
    const tokens = getElementTokens(el);
    metadata.set(el, describeElement(el, tokens));

    tokens.forEach((token) => {
      if (!byToken.has(token)) byToken.set(token, new Set());
      byToken.get(token).add(el);
    });
  });

  return { byToken, metadata, targets };
}

function clearState(root = document) {
  const html = document.documentElement;
  delete html.dataset.spwSemanticCrossref;
  delete html.dataset.spwSemanticCrossrefLabel;

  root.querySelectorAll?.('[data-spw-crossref], [data-spw-crossref-source]').forEach((el) => {
    delete el.dataset[STATE_ATTRIBUTE];
    delete el.dataset[SOURCE_ATTRIBUTE];
  });

  focused.token = '';
  focused.source = null;
  focused.marked = new Set();
  bus.emit('semantic-crossref:cleared', {});
}

function focusToken(registry, token, source = null) {
  const normalized = normalizeToken(token);
  if (!normalized) return [];

  const matches = Array.from(registry.byToken.get(normalized) || []);
  if (!matches.length) {
    clearState();
    return [];
  }
  if (normalized === focused.token && source === focused.source) return matches;

  const html = document.documentElement;
  writeDatasetValue(html, 'spwSemanticCrossref', normalized);
  writeDatasetValue(html, 'spwSemanticCrossrefLabel', humanizeToken(normalized));

  const next = new Map(matches.map((el) => [el, el === source ? 'source' : 'peer']));
  if (source instanceof Element && !next.has(source)) next.set(source, null);

  focused.marked.forEach((el) => {
    if (next.has(el)) return;
    delete el.dataset[STATE_ATTRIBUTE];
    delete el.dataset[SOURCE_ATTRIBUTE];
  });
  next.forEach((state, el) => {
    writeDatasetValue(el, STATE_ATTRIBUTE, state);
    writeDatasetValue(el, SOURCE_ATTRIBUTE, el === source ? 'true' : null);
  });

  focused.token = normalized;
  focused.source = source;
  focused.marked = new Set(next.keys());

  bus.emit('semantic-crossref:focused', {
    token: normalized,
    count: matches.length,
    source,
    matches,
  });

  return matches;
}

function findPreferredToken(el, registry) {
  const tokens = getElementTokens(el);
  return tokens.find((token) => (registry.byToken.get(token)?.size || 0) > 1) || tokens[0] || '';
}

function installEventHandlers(registry) {
  const cleanups = [];
  let clearTimer = 0;
  // Hover previews kin; an open note holds them. A finger has no hover: its
  // pointerover lands on every touch, a scroll's too, and its pointerout
  // follows at once, so touch lights kin only through a living term's note,
  // which stays open while the reader scrolls to find them and lets go when
  // it closes. While a note holds, hover does not move the light.
  let held = false;

  const resolveTarget = (el) => {
    const target = el?.closest?.(DEFAULT_SELECTOR);
    return target && registry.metadata.has(target) ? target : null;
  };

  const focusTarget = (target) => {
    window.clearTimeout(clearTimer);
    const token = findPreferredToken(target, registry);
    focusToken(registry, token, target);
  };

  const handleEnter = (event) => {
    if (held || event.pointerType === 'touch') return;
    const target = resolveTarget(event.target);
    if (target) focusTarget(target);
  };

  const scheduleClear = (event) => {
    window.clearTimeout(clearTimer);
    if (held || event?.pointerType === 'touch' || !focused.token) return;
    clearTimer = window.setTimeout(() => clearState(), 80);
  };

  const holdInspected = (event) => {
    const target = resolveTarget(event.target);
    if (!target) return;
    held = true;
    focusTarget(target);
  };

  const releaseInspected = () => {
    if (!held) return;
    held = false;
    clearState();
  };

  document.addEventListener('pointerover', handleEnter);
  document.addEventListener('focusin', handleEnter);
  document.addEventListener('pointerout', scheduleClear);
  document.addEventListener('focusout', scheduleClear);
  const offInspected = bus.on('concept:inspected', holdInspected);
  const offReleased = bus.on('concept:released', releaseInspected);

  cleanups.push(() => {
    window.clearTimeout(clearTimer);
    document.removeEventListener('pointerover', handleEnter);
    document.removeEventListener('focusin', handleEnter);
    document.removeEventListener('pointerout', scheduleClear);
    document.removeEventListener('focusout', scheduleClear);
    offInspected();
    offReleased();
    clearState();
  });

  return () => cleanups.forEach((cleanup) => cleanup());
}

function installConsoleApi(registry) {
  if (typeof window === 'undefined') return;

  const api = {
    clear: () => clearState(),
    focus: (token) => focusToken(registry, token),
    list: () => {
      const result = {};
      registry.byToken.forEach((set, token) => {
        result[token] = Array.from(set).map((el) => registry.metadata.get(el));
      });
      return result;
    },
    tokens: () => Array.from(registry.byToken.keys()).sort(),
    describe: (token) => {
      const normalized = normalizeToken(token);
      return Array.from(registry.byToken.get(normalized) || [])
        .map((el) => registry.metadata.get(el))
        .filter(Boolean);
    },
  };

  window.spwSemanticCrossrefs = api;

  const siteApi = window.__SPW_SITE__ || {};
  const inspect = siteApi.inspect || {};
  window.__SPW_SITE__ = {
    ...siteApi,
    inspect: {
      ...inspect,
      semanticCrossrefs: api,
    },
  };

  // `window.spwCompose` is intentionally frozen by the runtime console. Keep this
  // API separate so extensions can opt in without mutating the console contract.
}

export function initSpwSemanticCrossrefs(options = {}) {
  const root = options.root || document;
  const selector = options.selector || DEFAULT_SELECTOR;
  const targets = collectCrossrefTargets(root, selector);

  if (!targets.length) return null;

  const registry = buildRegistry(targets);
  installConsoleApi(registry);
  return installEventHandlers(registry);
}
