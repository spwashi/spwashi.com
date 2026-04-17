/**
 * Spw Guide Badge State Machine
 *
 * Implements the five-state guide-badge contract from ornament-contract.spw:
 *
 *   default ←→ browsing ←→ inspecting ←→ collected
 *                                   └── resonant (orthogonal, from field)
 *
 * This module is conservative:
 *   - It never preventDefaults existing click handlers.
 *   - It only fully owns interaction on elements that opt in via
 *     data-spw-guide-badge (including "inspect", "collect", or "true").
 *   - On passive markers (frame-sigil without a real target, spec-pill),
 *     it sets data-spw-interaction-context on hover/focus only.
 *
 * Interaction vocabulary:
 *   - data-spw-interaction-context: reading | browsing | inspecting | collecting
 *   - data-spw-collected:           true | (absent)
 *   - data-spw-collection-strength: 0.3–1.0
 *
 * Collections persist in localStorage and are emitted on the bus.
 */

import { bus } from './spw-bus.js';

const COLLECTION_KEY = 'spw-badge-collection';

const AMBIENT_SELECTOR = [
  '.operator-chip',
  '.frame-sigil',
  '.frame-card-sigil',
  '.spec-pill'
].join(', ');

const COLLECTIBLE_ATTR = 'data-spw-guide-badge';

const INITIAL_COLLECTION_STRENGTH = 0.9;
const COLLECTION_FLOOR = 0.3;
const DECAY_HALF_LIFE_MS = 96_000;

const store = {
  read() {
    try {
      const raw = localStorage.getItem(COLLECTION_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },
  write(entries) {
    try {
      localStorage.setItem(COLLECTION_KEY, JSON.stringify(entries));
    } catch {
      /* non-fatal */
    }
  }
};

function isCollectible(element) {
  const mode = element.getAttribute(COLLECTIBLE_ATTR);
  return mode === 'true' || mode === 'collect' || mode === 'inspect';
}

function badgeId(element) {
  if (element.id) return `id:${element.id}`;
  const op = element.dataset.spwOperator || '';
  const role = element.dataset.spwRole || '';
  const text = (element.textContent || '').trim().slice(0, 40);
  return [op, role, text].filter(Boolean).join('|') || null;
}

function setContext(element, context) {
  if (!context) {
    delete element.dataset.spwInteractionContext;
    return;
  }
  element.dataset.spwInteractionContext = context;
}

function markCollected(element, strength) {
  element.dataset.spwCollected = 'true';
  element.dataset.spwCollectionStrength = strength.toFixed(2);
  element.setAttribute('aria-pressed', 'true');
}

function unmarkCollected(element) {
  delete element.dataset.spwCollected;
  delete element.dataset.spwCollectionStrength;
  if (element.hasAttribute('aria-pressed')) {
    element.setAttribute('aria-pressed', 'false');
  }
}

function decayedStrength(collectedAt) {
  const elapsed = Date.now() - collectedAt;
  const decayed = INITIAL_COLLECTION_STRENGTH * Math.pow(0.5, elapsed / DECAY_HALF_LIFE_MS);
  return Math.max(COLLECTION_FLOOR, decayed);
}

export function getCollection() {
  return store.read();
}

function restoreCollection(root) {
  const entries = store.read();
  if (!entries.length) return;

  const byId = new Map(entries.map((entry) => [entry.id, entry]));

  root.querySelectorAll(`[${COLLECTIBLE_ATTR}]`).forEach((element) => {
    if (!isCollectible(element)) return;
    const id = badgeId(element);
    if (!id) return;
    const entry = byId.get(id);
    if (!entry) return;
    markCollected(element, decayedStrength(entry.collectedAt));
  });
}

function collect(element) {
  const id = badgeId(element);
  if (!id) return null;

  const entries = store.read();
  const existing = entries.findIndex((entry) => entry.id === id);
  const record = {
    id,
    operator: element.dataset.spwOperator || null,
    role: element.dataset.spwRole || null,
    label: (element.textContent || '').trim().slice(0, 80),
    collectedAt: Date.now()
  };

  if (existing >= 0) {
    entries[existing] = record;
  } else {
    entries.push(record);
  }

  store.write(entries);
  markCollected(element, INITIAL_COLLECTION_STRENGTH);
  bus.emit?.('guide-badge:collected', record);
  return record;
}

function release(element) {
  const id = badgeId(element);
  if (!id) return;

  const entries = store.read().filter((entry) => entry.id !== id);
  store.write(entries);
  unmarkCollected(element);
  bus.emit?.('guide-badge:released', { id });
}

function attachAmbient(element) {
  if (element.dataset.spwGuideBadgeBound) return () => {};
  element.dataset.spwGuideBadgeBound = 'ambient';

  const onEnter = () => {
    if (element.dataset.spwInteractionContext !== 'inspecting'
      && element.dataset.spwInteractionContext !== 'collecting') {
      setContext(element, 'browsing');
    }
  };

  const onLeave = () => {
    if (element.dataset.spwInteractionContext === 'browsing') {
      setContext(element, null);
    }
  };

  element.addEventListener('pointerenter', onEnter);
  element.addEventListener('pointerleave', onLeave);
  element.addEventListener('focus', onEnter);
  element.addEventListener('blur', onLeave);

  return () => {
    element.removeEventListener('pointerenter', onEnter);
    element.removeEventListener('pointerleave', onLeave);
    element.removeEventListener('focus', onEnter);
    element.removeEventListener('blur', onLeave);
    delete element.dataset.spwGuideBadgeBound;
  };
}

function attachCollectible(element) {
  if (element.dataset.spwGuideBadgeBound === 'collectible') return () => {};
  const ambientCleanup = element.dataset.spwGuideBadgeBound === 'ambient'
    ? null
    : attachAmbient(element);
  element.dataset.spwGuideBadgeBound = 'collectible';

  if (!element.hasAttribute('aria-pressed')) {
    element.setAttribute('aria-pressed', 'false');
  }

  const onClick = (event) => {
    if (event.defaultPrevented) return;

    const ctx = element.dataset.spwInteractionContext;

    if (element.dataset.spwCollected === 'true') {
      event.preventDefault();
      release(element);
      setContext(element, 'browsing');
      return;
    }

    if (ctx !== 'inspecting') {
      event.preventDefault();
      setContext(element, 'inspecting');
      return;
    }

    event.preventDefault();
    setContext(element, 'collecting');
    collect(element);
    setContext(element, 'inspecting');
  };

  const onKeydown = (event) => {
    if (event.key === 'Escape') {
      if (element.dataset.spwCollected === 'true') release(element);
      setContext(element, null);
      element.blur?.();
    }
  };

  element.addEventListener('click', onClick);
  element.addEventListener('keydown', onKeydown);

  return () => {
    element.removeEventListener('click', onClick);
    element.removeEventListener('keydown', onKeydown);
    ambientCleanup?.();
    delete element.dataset.spwGuideBadgeBound;
  };
}

function attach(element) {
  return isCollectible(element) ? attachCollectible(element) : attachAmbient(element);
}

export function initGuideBadges(root = document) {
  const cleanups = [];
  const seen = new WeakSet();

  const bind = (element) => {
    if (seen.has(element)) return;
    seen.add(element);
    cleanups.push(attach(element));
  };

  root.querySelectorAll(AMBIENT_SELECTOR).forEach(bind);
  root.querySelectorAll(`[${COLLECTIBLE_ATTR}]`).forEach(bind);

  restoreCollection(root);

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        if (node.matches?.(AMBIENT_SELECTOR) || node.hasAttribute?.(COLLECTIBLE_ATTR)) {
          bind(node);
        }
        node.querySelectorAll?.(`${AMBIENT_SELECTOR}, [${COLLECTIBLE_ATTR}]`).forEach(bind);
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });

  bus.emit?.('guide-badge:ready', { count: cleanups.length });

  return () => {
    observer.disconnect();
    cleanups.forEach((cleanup) => cleanup());
  };
}

if (typeof window !== 'undefined') {
  window.spwGuideBadge = {
    init: initGuideBadges,
    getCollection,
    clear() {
      store.write([]);
      document.querySelectorAll('[data-spw-collected="true"]').forEach(unmarkCollected);
      bus.emit?.('guide-badge:cleared', {});
    }
  };
}
