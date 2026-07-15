/**
 * site-search.js
 * ---------------------------------------------------------------------------
 * Sitewide route search over public/data/site-search-index.json.
 *
 * Spells:
 *   Ctrl/Cmd+K  → open site search
 *   Escape      → close
 *
 * Progressive hosts: [data-spw-site-search-host] on /topics/search/
 * Global triggers: [data-spw-site-search-open], window.spwSearch.open()
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
const MAX_RESULTS = 24;

let initialized = false;
let indexPromise = null;
let dialog = null;
let input = null;
let list = null;
let status = null;
let lastFocus = null;
let activeIndex = -1;
let entries = [];
let filterText = '';
let debounceTimer = 0;

function tokenize(query = '') {
  return String(query || '')
    .toLowerCase()
    .split(/[\s/|,_-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 1);
}

function hasBoundaryMatch(text, token) {
  if (!text || !token) return false;
  if (text === token) return true;
  // Prefer word / path segment boundaries so "search" does not inflate "research".
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, 'i').test(text);
}

function scoreEntry(entry, tokens) {
  if (!tokens.length) return 0;
  let score = 0;
  const title = String(entry.title || '').toLowerCase();
  const route = String(entry.route || '').toLowerCase();
  const haystack = String(entry.haystack || '').toLowerCase();
  const routeSegments = route.split('/').filter(Boolean);

  for (const token of tokens) {
    if (title === token) score += 40;
    else if (title.startsWith(token)) score += 22;
    else if (hasBoundaryMatch(title, token)) score += 16;
    else if (title.includes(token)) score += 8;

    if (route === token || route === `/${token}/`) score += 30;
    else if (routeSegments.some((segment) => segment === token || segment.startsWith(token))) score += 18;
    else if (hasBoundaryMatch(route, token)) score += 12;
    else if (route.includes(token)) score += 5;

    if (hasBoundaryMatch(haystack, token)) score += 5;
    else if (haystack.includes(token)) score += 1;
    else score -= 8;
  }

  if (entry.pageRole === 'topic-register' || entry.pageFamily === 'field-guide') score += 1;
  return score;
}

function rankEntries(query) {
  const tokens = tokenize(query);
  if (!tokens.length) {
    return entries.slice(0, 12).map((entry) => ({ entry, score: 0 }));
  }

  return entries
    .map((entry) => ({ entry, score: scoreEntry(entry, tokens) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.route.localeCompare(b.entry.route))
    .slice(0, MAX_RESULTS);
}

function loadIndex() {
  if (indexPromise) return indexPromise;
  indexPromise = fetch(INDEX_HREF, { credentials: 'same-origin' })
    .then(async (response) => {
      if (!response.ok) throw new Error(`search index ${response.status}`);
      const payload = await response.json();
      entries = Array.isArray(payload?.routes) ? payload.routes : [];
      return entries;
    })
    .catch((error) => {
      console.warn('[site-search] index load failed', error);
      entries = [];
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
  input.placeholder = 'Search routes, surfaces, wonder…';
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

  status = document.createElement('p');
  status.className = 'spw-site-search__status';
  status.id = 'spw-site-search-status';
  status.setAttribute('aria-live', 'polite');

  list = document.createElement('ul');
  list.className = 'spw-site-search__list';
  list.id = 'spw-site-search-list';
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-label', 'Search results');

  const footer = document.createElement('div');
  footer.className = 'spw-site-search__footer';
  footer.innerHTML = '<span class="spw-spell">⌘K</span> open · <span class="spw-spell">esc</span> close · <a href="/topics/search/">search field guide</a>';

  panel.append(header, status, list, footer);
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

function scheduleRender() {
  if (debounceTimer) window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => {
    debounceTimer = 0;
    renderResults();
  }, 60);
}

function renderResults() {
  if (!list || !status) return;
  const ranked = rankEntries(filterText);
  list.replaceChildren();
  activeIndex = ranked.length ? 0 : -1;

  if (!ranked.length) {
    status.textContent = filterText.trim()
      ? `No routes match “${filterText.trim()}”.`
      : entries.length
        ? `${entries.length} routes indexed. Type to filter.`
        : 'Search index unavailable.';
    return;
  }

  status.textContent = filterText.trim()
    ? `${ranked.length} match${ranked.length === 1 ? '' : 'es'}`
    : `Showing ${ranked.length} routes`;

  ranked.forEach(({ entry }, index) => {
    const item = document.createElement('li');
    item.className = 'spw-site-search__item';
    item.setAttribute('role', 'option');
    item.id = `spw-site-search-option-${index}`;

    const link = document.createElement('a');
    link.className = 'spw-site-search__result';
    link.href = entry.route;
    link.dataset.index = String(index);
    if (index === activeIndex) {
      link.setAttribute('aria-selected', 'true');
      item.dataset.active = 'true';
    }

    const title = document.createElement('span');
    title.className = 'spw-site-search__title';
    title.textContent = entry.title;

    const meta = document.createElement('span');
    meta.className = 'spw-site-search__meta';
    meta.textContent = [
      entry.route,
      entry.surface,
      entry.pageRole,
      entry.wonder,
    ].filter(Boolean).join(' · ');

    link.append(title, meta);
    item.appendChild(link);
    list.appendChild(item);
  });

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

export async function openSearch({ query = '', source = 'api' } = {}) {
  ensureDialog();
  await loadIndex();

  lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  dialog.hidden = false;
  dialog.setAttribute(ROOT_ATTR, 'open');
  document.documentElement.dataset.spwSiteSearch = 'open';
  pulseOpen();
  syncFloatingChromeState(document, { source: 'site-search', reason: 'open' });

  filterText = query || '';
  input.value = filterText;
  renderResults();
  input.focus();
  input.select();

  emitSpwAction('@search.open', `Site search (${source})`);
  document.dispatchEvent(new CustomEvent('spw:site-search', {
    detail: { state: 'open', source, query: filterText },
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
    results.innerHTML = '<p class="frame-note">Press <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd> anytime for the site search dialog, or submit the form above.</p>';
  }

  // Deep-link ?q= on the search field guide
  if (host.closest('body[data-spw-page-seed="page_topics_search"]')) {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    if (q) {
      if (hostInput instanceof HTMLInputElement) hostInput.value = q;
      openSearch({ query: q, source: 'query-param' });
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

  // Bare "?" opens search when not typing (probe the site map).
  if (!mod && event.key === '?' && !isInputFocused() && !isSearchOpen()) {
    event.preventDefault();
    openSearch({ source: 'probe-key' });
  }
}

export function initSiteSearch(root = document) {
  if (initialized) return () => {};
  initialized = true;

  const controller = new AbortController();
  ensureDialog();
  loadIndex();
  bindOpeners(root);
  root.querySelectorAll(HOST_SELECTOR).forEach(hydrateHost);

  document.addEventListener('keydown', onDocumentKeydown, { signal: controller.signal });

  // Late-mounted shell triggers
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
    delete window.spwSearch;
    initialized = false;
  }, { once: true });

  return () => controller.abort();
}
