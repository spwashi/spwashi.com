/**
 * site-search.js
 * ---------------------------------------------------------------------------
 * Structured sitewide route search over public/data/site-search-index.json.
 *
 * Spells:
 *   Ctrl/Cmd+K  → open site search
 *   Escape      → close
 *   ? (bare)    → open when not typing
 *
 * Structure:
 *   Facets: all | nest | operators | places | labs
 *   Nest groups by nestRoot (topics/, design/, …)
 *   Sigil queries (#>, ?, ^, ~, !, &, {) boost geometry matches
 *
 * Progressive hosts: [data-spw-site-search-host]
 * Triggers: [data-spw-site-search-open], window.spwSearch
 */

import {
  annotateFloatingChromeElement,
  syncFloatingChromeState,
} from '/public/js/kernel/dom-contracts.js';
import { emitSpwAction, isInputFocused } from '/public/js/kernel/shared.js';
import { readMicrointeractionPulseMs } from './pulse-beat-tuner.js';

const INDEX_HREF = '/public/data/site-search-index.json';
const ROOT_ATTR = 'data-spw-site-search';
const OPEN_SELECTOR = '[data-spw-site-search-open]';
const HOST_SELECTOR = '[data-spw-site-search-host]';
const MAX_RESULTS = 28;

const FACETS = Object.freeze([
  { id: 'all', label: 'All' },
  { id: 'nest', label: 'Nested' },
  { id: 'operators', label: 'Operators' },
  { id: 'places', label: 'Places' },
  { id: 'labs', label: 'Labs' },
]);

/** Sigil / motion tokens → filter boosts (balance-physics resolution moves). */
const SIGIL_ALIASES = Object.freeze({
  '#>': { motion: 'anchor', operator: 'frame', label: 'frame' },
  '#': { motion: 'anchor', operator: 'frame', label: 'frame' },
  '?': { motion: 'collapse', operator: 'wonder', label: 'probe' },
  '^': { motion: 'lift', operator: 'integration', label: 'object' },
  '~': { motion: 'tether', operator: 'potential', label: 'ref' },
  '!': { motion: 'discharge', operator: 'action', label: 'action' },
  '&': { motion: 'pair', operator: 'subject', label: 'subject' },
  '{': { motion: 'seal', operator: 'direction', label: 'brace' },
  '[': { motion: 'snap', operator: null, label: 'mode' },
  '(': { motion: 'encapsulate', operator: null, label: 'payload' },
  '.': { motion: 'anchor', operator: 'ground', label: 'ground' },
});

let initialized = false;
let indexPromise = null;
let dialog = null;
let input = null;
let list = null;
let status = null;
let facetBar = null;
let lastFocus = null;
let activeIndex = -1;
let entries = [];
let facetsMeta = null;
let geometryLegend = null;
let filterText = '';
let activeFacet = 'all';
let debounceTimer = 0;
let flatResults = [];

function tokenize(query = '') {
  return String(query || '')
    .toLowerCase()
    .split(/[\s/|,_-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 1);
}

function extractSigilHints(query = '') {
  const raw = String(query || '');
  const hints = [];
  for (const [sigil, profile] of Object.entries(SIGIL_ALIASES)) {
    if (raw.includes(sigil)) hints.push({ sigil, ...profile });
  }
  return hints;
}

function hasBoundaryMatch(text, token) {
  if (!text || !token) return false;
  if (text === token) return true;
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, 'i').test(text);
}

function passesFacet(entry, facet) {
  if (facet === 'all' || facet === 'nest') return true;
  if (facet === 'operators') return entry.kind === 'operator' || Boolean(entry.operatorSlug);
  if (facet === 'places') return entry.kind === 'place' || entry.kind === 'atlas';
  if (facet === 'labs') return entry.kind === 'lab' || entry.kind === 'play';
  return true;
}

function scoreEntry(entry, tokens, sigilHints) {
  let score = 0;
  const title = String(entry.title || '').toLowerCase();
  const route = String(entry.route || '').toLowerCase();
  const haystack = String(entry.haystack || '').toLowerCase();
  const routeSegments = route.split('/').filter(Boolean);
  const nestLabel = String(entry.nestLabel || '').toLowerCase();

  for (const hint of sigilHints) {
    if (entry.motion && hint.motion && entry.motion === hint.motion) score += 36;
    if (entry.operator && hint.operator && entry.operator === hint.operator) score += 32;
    if (entry.sigil && hint.sigil && entry.sigil === hint.sigil) score += 40;
    if (hint.label && (title.includes(hint.label) || haystack.includes(hint.label))) score += 8;
  }

  if (!tokens.length && !sigilHints.length) return score;

  for (const token of tokens) {
    // Skip pure punctuation already handled as sigils
    if (SIGIL_ALIASES[token] || /^[#?^~!&{[(.]+$/.test(token)) continue;

    if (title === token) score += 40;
    else if (title.startsWith(token)) score += 22;
    else if (hasBoundaryMatch(title, token)) score += 16;
    else if (title.includes(token)) score += 8;

    if (route === token || route === `/${token}/`) score += 30;
    else if (routeSegments.some((segment) => segment === token || segment.startsWith(token))) score += 18;
    else if (hasBoundaryMatch(route, token)) score += 12;
    else if (route.includes(token)) score += 5;

    if (nestLabel.includes(token)) score += 6;
    if (entry.motion === token || entry.geometry === token || entry.brace === token) score += 14;
    if (entry.kind === token) score += 10;

    if (hasBoundaryMatch(haystack, token)) score += 5;
    else if (haystack.includes(token)) score += 1;
    else if (!sigilHints.length) score -= 8;
  }

  if (entry.pageRole === 'topic-register' || entry.pageFamily === 'field-guide') score += 1;
  if (entry.kind === 'operator') score += 1;
  return score;
}

function rankEntries(query, facet = activeFacet) {
  const tokens = tokenize(query);
  const sigilHints = extractSigilHints(query);
  const pool = entries.filter((entry) => passesFacet(entry, facet));

  if (!tokens.length && !sigilHints.length) {
    const seed = pool.slice(0, facet === 'operators' ? 20 : 14);
    return seed.map((entry) => ({ entry, score: 0 }));
  }

  return pool
    .map((entry) => ({ entry, score: scoreEntry(entry, tokens, sigilHints) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.route.localeCompare(b.entry.route))
    .slice(0, MAX_RESULTS);
}

function groupByNest(ranked) {
  const groups = new Map();
  for (const row of ranked) {
    const key = row.entry.nestRoot || 'home';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function loadIndex() {
  if (indexPromise) return indexPromise;
  indexPromise = fetch(INDEX_HREF, { credentials: 'same-origin' })
    .then(async (response) => {
      if (!response.ok) throw new Error(`search index ${response.status}`);
      const payload = await response.json();
      entries = Array.isArray(payload?.routes) ? payload.routes : [];
      facetsMeta = payload?.facets || null;
      geometryLegend = payload?.geometryLegend || null;
      return entries;
    })
    .catch((error) => {
      console.warn('[site-search] index load failed', error);
      entries = [];
      facetsMeta = null;
      geometryLegend = null;
      return entries;
    });
  return indexPromise;
}

function ensureDialog() {
  if (dialog) return dialog;

  dialog = document.createElement('div');
  dialog.className = 'spw-site-search';
  dialog.setAttribute(ROOT_ATTR, 'closed');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-label', 'Search routes');
  dialog.hidden = true;

  const panel = document.createElement('div');
  panel.className = 'spw-site-search__panel';

  const header = document.createElement('div');
  header.className = 'spw-site-search__header';

  const op = document.createElement('span');
  op.className = 'spw-site-search__op';
  op.setAttribute('aria-hidden', 'true');
  op.textContent = '?[';

  input = document.createElement('input');
  input.className = 'spw-site-search__input';
  input.type = 'search';
  input.placeholder = 'Routes, nest, sigil (#> ? ^ ~ ! & {)…';
  input.setAttribute('aria-label', 'Search the site');
  input.setAttribute('aria-controls', 'spw-site-search-list');
  input.setAttribute('aria-autocomplete', 'list');
  input.autocomplete = 'off';
  input.enterKeyHint = 'search';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'spw-site-search__close';
  closeBtn.setAttribute('aria-label', 'Close search');
  closeBtn.textContent = '×';

  header.append(op, input, closeBtn);

  facetBar = document.createElement('div');
  facetBar.className = 'spw-site-search__facets';
  facetBar.setAttribute('role', 'tablist');
  facetBar.setAttribute('aria-label', 'Search structure');
  FACETS.forEach((facet) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'spw-site-search__facet';
    button.dataset.facet = facet.id;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', facet.id === activeFacet ? 'true' : 'false');
    button.textContent = facet.label;
    button.addEventListener('click', () => {
      activeFacet = facet.id;
      syncFacetBar();
      renderResults();
      input?.focus();
    });
    facetBar.appendChild(button);
  });

  status = document.createElement('p');
  status.className = 'spw-site-search__status';
  status.id = 'spw-site-search-status';
  status.setAttribute('aria-live', 'polite');

  list = document.createElement('div');
  list.className = 'spw-site-search__list';
  list.id = 'spw-site-search-list';
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-label', 'Search results');

  const footer = document.createElement('div');
  footer.className = 'spw-site-search__footer';
  footer.innerHTML = [
    '<span class="spw-spell">⌘K</span> open',
    '<span class="spw-spell">esc</span> close',
    '<span class="spw-spell">? ^ ~</span> geometry',
    '<a href="/topics/search/">field guide</a>',
    '<a href="/topics/software/spw/">operator atlas</a>',
    '<a href="/design/experiments/subject-balance/">brace physics</a>',
  ].join(' · ');

  panel.append(header, facetBar, status, list, footer);
  dialog.appendChild(panel);
  document.body.appendChild(dialog);

  annotateFloatingChromeElement(dialog, {
    role: 'site-search',
    island: 'search-dialog',
    reason: 'site-search-open',
  });

  closeBtn.addEventListener('click', () => closeSearch());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeSearch();
  });
  input.addEventListener('input', () => {
    filterText = input.value;
    scheduleRender();
  });
  input.addEventListener('keydown', handleInputKeydown);
  list.addEventListener('click', handleListClick);
  list.addEventListener('keydown', handleListKeydown);

  return dialog;
}

function syncFacetBar() {
  if (!facetBar) return;
  facetBar.querySelectorAll('.spw-site-search__facet').forEach((button) => {
    const selected = button.dataset.facet === activeFacet;
    button.setAttribute('aria-selected', selected ? 'true' : 'false');
    button.dataset.active = selected ? 'true' : 'false';
  });
}

function scheduleRender() {
  if (debounceTimer) window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => {
    debounceTimer = 0;
    renderResults();
  }, 60);
}

function geometryMeta(entry) {
  return [
    entry.sigil,
    entry.geometry,
    entry.motion ? `motion:${entry.motion}` : null,
    entry.brace ? `brace:${entry.brace}` : null,
  ].filter(Boolean).join(' · ');
}

function appendResult(container, entry, index) {
  const item = document.createElement('div');
  item.className = 'spw-site-search__item';
  item.setAttribute('role', 'option');
  item.id = `spw-site-search-option-${index}`;

  const link = document.createElement('a');
  link.className = 'spw-site-search__result';
  link.href = entry.route;
  link.dataset.index = String(index);
  if (entry.motion) link.dataset.spwMotion = entry.motion;
  if (entry.geometry) link.dataset.spwGeometry = entry.geometry;
  if (entry.operator) link.dataset.spwOperator = entry.operator;
  if (index === activeIndex) {
    link.setAttribute('aria-selected', 'true');
    item.dataset.active = 'true';
  }

  const titleRow = document.createElement('span');
  titleRow.className = 'spw-site-search__title-row';

  if (entry.sigil) {
    const sigil = document.createElement('span');
    sigil.className = 'spw-site-search__sigil';
    sigil.setAttribute('aria-hidden', 'true');
    sigil.textContent = entry.sigil;
    titleRow.appendChild(sigil);
  }

  const title = document.createElement('span');
  title.className = 'spw-site-search__title';
  title.textContent = entry.title;
  titleRow.appendChild(title);

  const meta = document.createElement('span');
  meta.className = 'spw-site-search__meta';
  meta.textContent = [
    entry.nestLabel || entry.route,
    entry.kind,
    entry.surface,
    geometryMeta(entry),
    entry.wonder,
  ].filter(Boolean).join(' · ');

  link.append(titleRow, meta);
  item.appendChild(link);
  container.appendChild(item);
}

function renderResults() {
  if (!list || !status) return;
  const ranked = rankEntries(filterText, activeFacet);
  list.replaceChildren();
  flatResults = ranked;
  activeIndex = ranked.length ? 0 : -1;

  if (!ranked.length) {
    status.textContent = filterText.trim()
      ? `No routes match “${filterText.trim()}”.`
      : entries.length
        ? `${entries.length} routes indexed. Try a nest (topics), kind (operators), or sigil (? ^ ~).`
        : 'Search index unavailable.';
    return;
  }

  const sigilHints = extractSigilHints(filterText);
  const hintNote = sigilHints.length
    ? ` · geometry ${sigilHints.map((h) => h.sigil || h.motion).join(' ')}`
    : '';

  status.textContent = filterText.trim()
    ? `${ranked.length} match${ranked.length === 1 ? '' : 'es'}${hintNote}`
    : `Showing ${ranked.length} · facet ${activeFacet}`;

  const useNest = activeFacet === 'nest' || (!filterText.trim() && activeFacet === 'all');
  let index = 0;

  if (useNest) {
    const groups = groupByNest(ranked);
    groups.forEach(([nestRoot, rows]) => {
      const group = document.createElement('section');
      group.className = 'spw-site-search__group';
      group.setAttribute('aria-label', nestRoot);

      const heading = document.createElement('h3');
      heading.className = 'spw-site-search__group-label';
      heading.textContent = `${nestRoot} · ${rows.length}`;
      group.appendChild(heading);

      rows.forEach((row) => {
        appendResult(group, row.entry, index);
        index += 1;
      });
      list.appendChild(group);
    });
  } else {
    ranked.forEach((row) => {
      appendResult(list, row.entry, index);
      index += 1;
    });
  }

  input?.setAttribute('aria-activedescendant', activeIndex >= 0
    ? `spw-site-search-option-${activeIndex}`
    : '');
}

function setActive(index) {
  if (!list) return;
  const items = [...list.querySelectorAll('.spw-site-search__result')];
  if (!items.length) {
    activeIndex = -1;
    return;
  }
  activeIndex = Math.max(0, Math.min(items.length - 1, index));
  items.forEach((item, i) => {
    const selected = i === activeIndex;
    item.setAttribute('aria-selected', selected ? 'true' : 'false');
    item.parentElement.dataset.active = selected ? 'true' : 'false';
    if (selected) item.scrollIntoView({ block: 'nearest' });
  });
  input?.setAttribute('aria-activedescendant', `spw-site-search-option-${activeIndex}`);
}

function activateActive() {
  if (!list || activeIndex < 0) return;
  const link = list.querySelector(`.spw-site-search__result[data-index="${activeIndex}"]`);
  if (link instanceof HTMLAnchorElement) {
    emitSpwAction('@search.navigate', `Open ${link.getAttribute('href')}`);
    window.location.assign(link.href);
  }
}

function handleInputKeydown(event) {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    setActive(activeIndex < 0 ? 0 : activeIndex + 1);
    return;
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    setActive(activeIndex <= 0 ? 0 : activeIndex - 1);
    return;
  }
  if (event.key === 'Enter') {
    event.preventDefault();
    activateActive();
    return;
  }
  if (event.key === 'Escape') {
    event.preventDefault();
    closeSearch();
  }
}

function handleListKeydown(event) {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === 'Escape') {
    handleInputKeydown(event);
  }
}

function handleListClick(event) {
  const link = event.target?.closest?.('a.spw-site-search__result');
  if (!(link instanceof HTMLAnchorElement)) return;
  emitSpwAction('@search.navigate', `Open ${link.getAttribute('href')}`);
}

function pulseOpen() {
  const html = document.documentElement;
  html.dataset.spwSiteSearch = 'open';
  html.dataset.spwSearchSelectionPulse = 'open';
  const ms = readMicrointeractionPulseMs(document);
  window.setTimeout(() => {
    if (html.dataset.spwSearchSelectionPulse === 'open') {
      delete html.dataset.spwSearchSelectionPulse;
    }
  }, ms);
}

export async function openSearch({ query = '', facet = null, source = 'api' } = {}) {
  ensureDialog();
  await loadIndex();

  lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  dialog.hidden = false;
  dialog.setAttribute(ROOT_ATTR, 'open');
  document.documentElement.dataset.spwSiteSearch = 'open';
  if (facet && FACETS.some((item) => item.id === facet)) activeFacet = facet;
  syncFacetBar();
  pulseOpen();
  syncFloatingChromeState(document, { source: 'site-search', reason: 'open' });

  filterText = query || '';
  input.value = filterText;
  renderResults();
  input.focus();
  input.select();

  emitSpwAction('@search.open', `Site search (${source})`);
  document.dispatchEvent(new CustomEvent('spw:site-search', {
    detail: {
      state: 'open',
      source,
      query: filterText,
      facet: activeFacet,
      geometryLegend,
      facets: facetsMeta,
    },
    bubbles: true,
  }));
}

export function closeSearch({ restoreFocus = true } = {}) {
  if (!dialog) return;
  dialog.hidden = true;
  dialog.setAttribute(ROOT_ATTR, 'closed');
  delete document.documentElement.dataset.spwSiteSearch;
  delete document.documentElement.dataset.spwSearchSelectionPulse;
  syncFloatingChromeState(document, { source: 'site-search', reason: 'close' });

  if (restoreFocus && lastFocus?.focus) {
    try { lastFocus.focus(); } catch { /* detached */ }
  }
  lastFocus = null;

  emitSpwAction('@search.close', 'Site search closed');
  document.dispatchEvent(new CustomEvent('spw:site-search', {
    detail: { state: 'closed' },
    bubbles: true,
  }));
}

export function isSearchOpen() {
  return dialog?.getAttribute(ROOT_ATTR) === 'open';
}

function hydrateHost(host) {
  if (!(host instanceof HTMLElement) || host.dataset.spwSiteSearchBound === 'true') return;
  host.dataset.spwSiteSearchBound = 'true';

  const form = host.querySelector('form');
  const hostInput = host.querySelector('input[type="search"], input[name="q"]');
  const results = host.querySelector('[data-spw-site-search-results]');
  const facetLinks = host.querySelectorAll('[data-spw-search-facet]');

  facetLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const facet = link.getAttribute('data-spw-search-facet');
      if (!facet) return;
      event.preventDefault();
      openSearch({
        query: hostInput instanceof HTMLInputElement ? hostInput.value : '',
        facet,
        source: 'page-facet',
      });
    });
  });

  if (form instanceof HTMLFormElement) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const q = hostInput instanceof HTMLInputElement ? hostInput.value : '';
      openSearch({ query: q, source: 'page-host' });
    });
  }

  if (hostInput instanceof HTMLInputElement) {
    hostInput.addEventListener('focus', () => {
      loadIndex();
    });
    hostInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        openSearch({ query: hostInput.value, source: 'page-host-key' });
      }
    });
  }

  if (results instanceof HTMLElement) {
    results.hidden = false;
    results.innerHTML = [
      '<p class="frame-note">',
      'Structured search: facets for nested places, operators, and labs. ',
      'Sigils like <code>?[</code>, <code>#&gt;</code>, <code>^</code>, <code>~</code> boost geometry. ',
      'Press <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd> anywhere.',
      '</p>',
    ].join('');
  }

  if (host.closest('body[data-spw-page-seed="page_topics_search"]')) {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    const facet = params.get('facet') || '';
    if (q || facet) {
      if (hostInput instanceof HTMLInputElement && q) hostInput.value = q;
      openSearch({ query: q, facet: facet || null, source: 'query-param' });
    }
  }
}

function bindOpeners(root) {
  root.querySelectorAll(OPEN_SELECTOR).forEach((node) => {
    if (!(node instanceof HTMLElement) || node.dataset.spwSiteSearchOpenBound === 'true') return;
    node.dataset.spwSiteSearchOpenBound = 'true';
    node.addEventListener('click', (event) => {
      event.preventDefault();
      openSearch({ source: 'trigger' });
    });
  });
}

function onDocumentKeydown(event) {
  if (event.key === 'Escape' && isSearchOpen()) {
    event.preventDefault();
    closeSearch();
    return;
  }

  const mod = event.metaKey || event.ctrlKey;
  if (mod && (event.key === 'k' || event.key === 'K')) {
    event.preventDefault();
    if (isSearchOpen()) closeSearch();
    else openSearch({ source: 'keyboard' });
    return;
  }

  if (!mod && event.key === '?' && !isInputFocused() && !isSearchOpen()) {
    event.preventDefault();
    openSearch({ source: 'probe-key' });
  }
}

export function initSiteSearch(ctx, root) {
  if (!(root instanceof Node)) {
    root = document;
  }
  if (initialized) return () => {};
  initialized = true;

  const controller = new AbortController();
  ensureDialog();
  loadIndex();
  bindOpeners(root);
  root.querySelectorAll(HOST_SELECTOR).forEach(hydrateHost);

  document.addEventListener('keydown', onDocumentKeydown, { signal: controller.signal });

  if (typeof MutationObserver === 'function') {
    const observer = new MutationObserver(() => {
      bindOpeners(root);
      root.querySelectorAll(HOST_SELECTOR).forEach(hydrateHost);
    });
    observer.observe(root.body || root.documentElement, { childList: true, subtree: true });
    controller.signal.addEventListener('abort', () => observer.disconnect(), { once: true });
  }

  window.spwSearch = {
    open: openSearch,
    close: closeSearch,
    isOpen: isSearchOpen,
    setFacet: (facet) => {
      if (FACETS.some((item) => item.id === facet)) {
        activeFacet = facet;
        syncFacetBar();
        renderResults();
      }
    },
    reload: () => {
      indexPromise = null;
      return loadIndex();
    },
  };

  controller.signal.addEventListener('abort', () => {
    closeSearch({ restoreFocus: false });
    dialog?.remove();
    dialog = null;
    input = null;
    list = null;
    status = null;
    facetBar = null;
    delete window.spwSearch;
    initialized = false;
  }, { once: true });

  return () => controller.abort();
}
