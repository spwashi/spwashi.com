/**
 * attn-register.js
 * ---------------------------------------------------------------------------
 * Purpose
 * - Session-scoped attentional register for chargeable phrases and badges.
 * - Maintains a stable floating bar with delegated events.
 * - Scopes badge discovery to a provided root instead of rescanning document.
 *
 * Component contract
 * - Charge sources:
 *   [data-spw-charge-key]
 *   .spec-pill
 *   .field-note-tag
 *   .specimen-api-tag
 *   .specimen-index-tag
 *   .blog-chip-list li
 *
 * Root flags (read from documentElement / body)
 * - data-spw-charge="off"      -> disable register interactions entirely
 * - data-spw-enhance="off"     -> keep logic, avoid non-essential flourish
 *
 * Public API
 * - initAttnRegister(root?, options?)
 *   Returns an instance with:
 *     destroy()
 *     render()
 *     clear()
 *     getTerms()
 *     addTerm(term)
 *     removeTerm(term)
 */

const REGISTER_KEY = 'spw-attn-register';

const DEFAULT_SELECTORS = [
  '[data-spw-charge-key]',
  '.spec-pill',
  '.field-note-tag',
  '.specimen-api-tag',
  '.specimen-index-tag',
  '.blog-chip-list li',
].join(',');

const DEFAULTS = Object.freeze({
  badgeSelectors: DEFAULT_SELECTORS,
  registerHost: document.body,
  storageKey: REGISTER_KEY,
  swipeMinPx: 40,
  barAttribute: 'data-attn-register',
  barLabel: 'Attentional register',
  themeToggleSelector: '.atelier-theme-toggle',
  enableThemeSwipe: true,
  enableMutationObserver: true,
});

function createAttnRegisterConfig(options = {}) {
  return { ...DEFAULTS, ...options };
}

function isElement(value) {
  return value instanceof Element;
}

function getRootElement(root) {
  if (isElement(root)) return root;
  return document;
}

function getSurfaceBody() {
  return document.body;
}

function getFeatureState() {
  const html = document.documentElement;
  const body = getSurfaceBody();

  return {
    chargeEnabled:
      html.dataset.spwCharge !== 'off' &&
      body?.dataset.spwCharge !== 'off',
    enhanceEnabled:
      html.dataset.spwEnhance !== 'off' &&
      body?.dataset.spwEnhance !== 'off',
  };
}

function loadTerms(storageKey) {
  try {
    const raw = sessionStorage.getItem(storageKey);
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? new Set(parsed.filter(Boolean)) : new Set();
  } catch {
    return new Set();
  }
}

function saveTerms(storageKey, terms) {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify([...terms]));
  } catch {
    /* storage unavailable */
  }
}

function normalizeTerm(value) {
  return String(value || '').trim();
}

function displayTerm(term) {
  return term.replace(/-/g, ' ');
}

function termFor(node) {
  if (!node) return '';
  const explicit = normalizeTerm(node.dataset.spwChargeKey);
  if (explicit) return explicit;

  const label = normalizeTerm(node.dataset.spwChargeLabel);
  if (label) return label;

  return normalizeTerm(node.textContent);
}

function isActualLink(node) {
  if (!node) return false;
  return node.tagName === 'A' || Boolean(node.closest('a[href]'));
}

function ensureButtonSemantics(node) {
  if (!node || isActualLink(node)) return;

  if (!node.hasAttribute('tabindex')) {
    node.tabIndex = 0;
  }
  if (!node.hasAttribute('role')) {
    node.setAttribute('role', 'button');
  }
  if (!node.hasAttribute('aria-pressed')) {
    node.setAttribute('aria-pressed', 'false');
  }
  if (!node.hasAttribute('aria-label')) {
    const label = node.dataset.spwChargeLabel || displayTerm(termFor(node));
    if (label) node.setAttribute('aria-label', `Toggle attention charge: ${label}`);
  }
}

function createBadgeRegistry() {
  /** @type {Map<string, Set<Element>>} */
  const byTerm = new Map();
  /** @type {WeakMap<Element, string>} */
  const byNode = new WeakMap();

  function add(node) {
    const term = termFor(node);
    if (!term) return;

    byNode.set(node, term);
    if (!byTerm.has(term)) byTerm.set(term, new Set());
    byTerm.get(term).add(node);
  }

  function remove(node) {
    const term = byNode.get(node);
    if (!term) return;

    const set = byTerm.get(term);
    if (set) {
      set.delete(node);
      if (!set.size) byTerm.delete(term);
    }
    byNode.delete(node);
  }

  function replaceAll(nodes) {
    byTerm.clear();
    nodes.forEach(add);
  }

  function termOf(node) {
    return byNode.get(node) || termFor(node);
  }

  function nodesFor(term) {
    return byTerm.get(term) || new Set();
  }

  function terms() {
    return [...byTerm.keys()];
  }

  return {
    add,
    remove,
    replaceAll,
    termOf,
    nodesFor,
    terms,
  };
}

function createBar(config) {
  const bar = document.createElement('aside');
  bar.setAttribute(config.barAttribute, '');
  bar.setAttribute('role', 'log');
  bar.setAttribute('aria-label', config.barLabel);

  const openLabel = document.createElement('span');
  openLabel.className = 'attn-label';
  openLabel.textContent = '?[';

  const termsWrap = document.createElement('div');
  termsWrap.className = 'attn-terms';

  const closeLabel = document.createElement('span');
  closeLabel.className = 'attn-label';
  closeLabel.textContent = ']';

  const clearButton = document.createElement('button');
  clearButton.type = 'button';
  clearButton.className = 'attn-clear';
  clearButton.setAttribute('data-attn-action', 'clear');
  clearButton.setAttribute('aria-label', 'Clear register');
  clearButton.textContent = '× clear';

  bar.append(openLabel, termsWrap, closeLabel, clearButton);

  return {
    bar,
    termsWrap,
    clearButton,
  };
}

function createChip(term) {
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'attn-chip';
  chip.setAttribute('data-attn-action', 'remove');
  chip.setAttribute('data-attn-term', term);
  chip.setAttribute('aria-label', `Remove "${term}"`);
  chip.textContent = displayTerm(term);
  return chip;
}

export function initAttnRegister(root = document, options = {}) {
  const config = createAttnRegisterConfig(options);
  const rootEl = getRootElement(root);
  const body = getSurfaceBody();
  const featureState = getFeatureState();

  if (!body || !featureState.chargeEnabled) {
    return {
      destroy() {},
      render() {},
      clear() {},
      getTerms() { return []; },
      addTerm() {},
      removeTerm() {},
    };
  }

  const terms = loadTerms(config.storageKey);
  const registry = createBadgeRegistry();

  let destroyed = false;
  let observer = null;
  let badgeNodes = [];
  let swipeStartY = 0;
  let themeSwipeStartX = 0;
  let themeSwipeStartY = 0;

  const { bar, termsWrap } = createBar(config);
  config.registerHost.appendChild(bar);

  function collectBadges() {
    badgeNodes = [...rootEl.querySelectorAll(config.badgeSelectors)]
      .filter((node) => !isActualLink(node));

    badgeNodes.forEach(ensureButtonSemantics);
    registry.replaceAll(badgeNodes);
  }

  function applyPressedState(node, active) {
    if (node.getAttribute('role') === 'button') {
      node.setAttribute('aria-pressed', String(active));
    }
  }

  function syncBadgeStates() {
    badgeNodes.forEach((badge) => {
      const term = registry.termOf(badge);
      const active = Boolean(term && terms.has(term));

      if (active) {
        badge.setAttribute('data-attn-active', '');
      } else {
        badge.removeAttribute('data-attn-active');
      }

      applyPressedState(badge, active);
    });
  }

  function renderBar() {
    if (destroyed) return;

    if (!terms.size) {
      bar.hidden = true;
      termsWrap.replaceChildren();
      return;
    }

    bar.hidden = false;
    const fragment = document.createDocumentFragment();

    [...terms]
      .sort((a, b) => a.localeCompare(b))
      .forEach((term) => {
        fragment.appendChild(createChip(term));
      });

    termsWrap.replaceChildren(fragment);
  }

  function persistAndRender() {
    saveTerms(config.storageKey, terms);
    syncBadgeStates();
    renderBar();
  }

  function addTerm(term) {
    const normalized = normalizeTerm(term);
    if (!normalized) return;
    terms.add(normalized);
    persistAndRender();
  }

  function removeTerm(term) {
    const normalized = normalizeTerm(term);
    if (!normalized) return;
    terms.delete(normalized);
    persistAndRender();
  }

  function clear() {
    if (!terms.size) return;
    terms.clear();
    persistAndRender();
  }

  function toggleBadge(node) {
    const term = registry.termOf(node);
    if (!term) return;

    if (terms.has(term)) {
      terms.delete(term);
    } else {
      terms.add(term);
    }

    persistAndRender();
  }

  function onRootClick(event) {
    const badge = event.target.closest(config.badgeSelectors);
    if (!badge || !rootEl.contains(badge) || isActualLink(badge)) return;

    if (!featureState.chargeEnabled) return;

    const term = termFor(badge);
    if (!term) return;

    event.preventDefault();
    toggleBadge(badge);
  }

  function onRootKeydown(event) {
    const badge = event.target.closest(config.badgeSelectors);
    if (!badge || !rootEl.contains(badge) || isActualLink(badge)) return;

    if (event.key !== 'Enter' && event.key !== ' ') return;

    event.preventDefault();
    toggleBadge(badge);
  }

  function onBarClick(event) {
    const actionNode = event.target.closest('[data-attn-action]');
    if (!actionNode || !bar.contains(actionNode)) return;

    const action = actionNode.getAttribute('data-attn-action');
    if (action === 'clear') {
      event.preventDefault();
      clear();
      return;
    }

    if (action === 'remove') {
      event.preventDefault();
      removeTerm(actionNode.getAttribute('data-attn-term') || '');
    }
  }

  function onBarTouchStart(event) {
    if (!event.target.closest(`[${config.barAttribute}]`)) return;
    swipeStartY = event.touches[0].clientY;
  }

  function onBarTouchEnd(event) {
    if (!event.target.closest(`[${config.barAttribute}]`)) return;
    const dy = event.changedTouches[0].clientY - swipeStartY;
    if (dy > config.swipeMinPx) {
      clear();
    }
  }

  function onThemeTouchStart(event) {
    if (!config.enableThemeSwipe) return;

    const toggle = event.target.closest(config.themeToggleSelector);
    if (!toggle) return;

    themeSwipeStartX = event.touches[0].clientX;
    themeSwipeStartY = event.touches[0].clientY;
  }

  function onThemeTouchEnd(event) {
    if (!config.enableThemeSwipe) return;

    const toggle = event.target.closest(config.themeToggleSelector);
    if (!toggle) return;

    const dx = event.changedTouches[0].clientX - themeSwipeStartX;
    const dy = event.changedTouches[0].clientY - themeSwipeStartY;

    if (Math.abs(dx) < config.swipeMinPx || Math.abs(dy) > Math.abs(dx)) return;

    const current = body.dataset.theme || 'atelier-light';
    const next = current === 'atelier-light' ? 'atelier-dark' : 'atelier-light';
    body.dataset.theme = next;

    document.querySelectorAll('[data-theme-set]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.themeSet === next));
    });
  }

  function maybeRefreshFromMutations(mutations) {
    let shouldRefresh = false;

    for (const mutation of mutations) {
      if (mutation.type !== 'childList') continue;

      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        if (node.matches?.(config.badgeSelectors) || node.querySelector?.(config.badgeSelectors)) {
          shouldRefresh = true;
        }
      });

      mutation.removedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        if (node.matches?.(config.badgeSelectors) || node.querySelector?.(config.badgeSelectors)) {
          shouldRefresh = true;
        }
      });

      if (shouldRefresh) break;
    }

    if (!shouldRefresh) return;

    collectBadges();
    syncBadgeStates();
  }

  function observeRoot() {
    if (!config.enableMutationObserver || !(rootEl instanceof Element || rootEl === document)) return;

    const observeTarget = rootEl === document ? document.body : rootEl;
    if (!observeTarget) return;

    observer = new MutationObserver((mutations) => {
      maybeRefreshFromMutations(mutations);
    });

    observer.observe(observeTarget, {
      childList: true,
      subtree: true,
    });
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;

    rootEl.removeEventListener('click', onRootClick);
    rootEl.removeEventListener('keydown', onRootKeydown);
    bar.removeEventListener('click', onBarClick);
    bar.removeEventListener('touchstart', onBarTouchStart);
    bar.removeEventListener('touchend', onBarTouchEnd);

    if (config.enableThemeSwipe) {
      document.removeEventListener('touchstart', onThemeTouchStart, { passive: true });
      document.removeEventListener('touchend', onThemeTouchEnd, { passive: true });
    }

    observer?.disconnect();
    bar.remove();
  }

  collectBadges();
  syncBadgeStates();
  renderBar();
  observeRoot();

  rootEl.addEventListener('click', onRootClick);
  rootEl.addEventListener('keydown', onRootKeydown);
  bar.addEventListener('click', onBarClick);
  bar.addEventListener('touchstart', onBarTouchStart, { passive: true });
  bar.addEventListener('touchend', onBarTouchEnd, { passive: true });

  if (config.enableThemeSwipe && featureState.enhanceEnabled) {
    document.addEventListener('touchstart', onThemeTouchStart, { passive: true });
    document.addEventListener('touchend', onThemeTouchEnd, { passive: true });
  }

  return {
    destroy,
    render: renderBar,
    clear,
    getTerms() {
      return [...terms];
    },
    addTerm,
    removeTerm,
  };
}