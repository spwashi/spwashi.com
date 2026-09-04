/**
 * In-page hops: landmark rooms, provenance links, and section-handle travel.
 * Writes existing loop-state / aria-current; progression owns the phase pulse.
 */
import { IN_PAGE_HOP_SELECTOR } from './interaction-vocabulary.js';

export const SECTION_TRAVEL_SOURCES = Object.freeze(new Set([
  'prev',
  'next',
  'top',
  'bottom',
  'arrow-prev',
  'arrow-next',
  'home',
  'end',
  'similar',
  'contrast',
  'resonate',
]));

const LANDMARK_CONTRACT = 'tap:travel swipe:cycle';
const HEADER_CONTRACT = 'tap:open swipe:cycle';
const SWIPE_DELTA_PX = 48;
const HOP_LOCK_MS = 90;
const HEADER_SELECTOR = '.site-header, body > header';

function isElement(node) {
  return Boolean(node) && node.nodeType === 1 && typeof node.querySelectorAll === 'function';
}

export function headerRoomHrefs(header) {
  if (!isElement(header)) return [];
  return [...header.querySelectorAll('nav[aria-label="Primary"] a[href]')]
    .map((link) => link.getAttribute('href') || '')
    .filter(Boolean);
}

export function headerRoomCurrentIndex(header, pathname = '') {
  if (!isElement(header)) return -1;
  const links = [...header.querySelectorAll('nav[aria-label="Primary"] a[href]')];
  const marked = links.findIndex((link) => link.getAttribute('aria-current') === 'page');
  if (marked >= 0) return marked;
  const path = String(pathname || '').replace(/\/$/, '') || '/';
  return links.findIndex((link) => {
    const href = link.getAttribute('href') || '';
    if (!href || href.startsWith('#')) return false;
    try {
      const resolved = new URL(href, 'https://spwashi.com').pathname.replace(/\/$/, '') || '/';
      return resolved === path;
    } catch {
      return false;
    }
  });
}

/**
 * Closed toggle-header: swipe/arrow cycles sibling hubs.
 * Open drawer keeps its own tap path. A short or mostly-vertical drag is not a hop.
 */
export function resolveHeaderRoomHop({
  direction = 0,
  menuOpen = false,
  menuMode = '',
  hrefs = [],
  currentIndex = -1,
} = {}) {
  if (menuOpen) return null;
  if (menuMode !== 'toggle') return null;
  if (direction !== 1 && direction !== -1) return null;
  if (!Array.isArray(hrefs) || hrefs.length < 2) return null;
  const from = currentIndex >= 0 ? currentIndex : 0;
  const next = (from + direction + hrefs.length) % hrefs.length;
  if (next === from) return null;
  return { href: hrefs[next], index: next };
}

export function readHopHash(target) {
  if (!(target instanceof Element)) return '';
  const link = target.closest(IN_PAGE_HOP_SELECTOR);
  if (!link) return '';
  const href = link.getAttribute('href') || '';
  const hashIndex = href.indexOf('#');
  return hashIndex >= 0 ? href.slice(hashIndex + 1) : '';
}

export function landmarkHashFromHref(href = '') {
  const value = String(href || '');
  if (value.startsWith('#')) return value.slice(1);
  const hashIndex = value.indexOf('#');
  return hashIndex >= 0 ? value.slice(hashIndex + 1) : '';
}

export function syncLandmarkLoopState(root = document) {
  const hash = String(root.defaultView?.location?.hash || window.location.hash || '').replace(/^#/, '');
  root.querySelectorAll?.('.spw-page-landmarks a[href]').forEach((link) => {
    if (!(link instanceof HTMLElement)) return;
    if (!link.dataset.spwGestureContract) {
      link.dataset.spwGestureContract = LANDMARK_CONTRACT;
    }
    const targetHash = landmarkHashFromHref(link.getAttribute('href') || '');
    const current = Boolean(hash) && targetHash === hash;
    if (current) {
      link.setAttribute('aria-current', 'location');
      link.dataset.spwLoopState = 'activated';
    } else {
      if (link.getAttribute('aria-current') === 'location') link.removeAttribute('aria-current');
      if (link.dataset.spwLoopState === 'activated') {
        link.dataset.spwLoopState = 'resolved';
      }
    }
  });
}

function landmarkLinks(nav) {
  return [...(nav?.querySelectorAll?.('a[href^="#"]') || [])].filter((link) => link instanceof HTMLElement);
}

function cycleLandmarkNav(nav, direction = 1) {
  const links = landmarkLinks(nav);
  if (links.length < 2) return '';
  const current = links.findIndex((link) => link.getAttribute('aria-current') === 'location');
  const from = current >= 0 ? current : 0;
  const next = Math.max(0, Math.min(links.length - 1, from + direction));
  if (next === from && current >= 0) return '';
  return landmarkHashFromHref(links[next].getAttribute('href') || '');
}

let hopsBound = false;
let hopsPhaseWriter = null;
let hopsApi = null;

export function bindInteractionHops({ html, root = document, writePhase, signal }) {
  if (typeof writePhase === 'function') hopsPhaseWriter = writePhase;
  if (hopsBound) return hopsApi;

  hopsBound = true;
  let hopCooldown = 0;

  const hop = (source, hash = '') => {
    const now = Date.now();
    if (now - hopCooldown < HOP_LOCK_MS) return;
    hopCooldown = now;
    if (typeof hopsPhaseWriter === 'function') {
      hopsPhaseWriter(html, hash ? 'discover' : 'settle', { source, hash, force: true });
    }
    syncLandmarkLoopState(root);
  };

  const onHashHop = () => {
    const hash = String(window.location.hash || '').replace(/^#/, '');
    hop('hash-hop', hash);
  };

  const onSectionTravel = (event) => {
    const source = event?.detail?.source || '';
    if (!SECTION_TRAVEL_SOURCES.has(source)) return;
    hop('section-travel', event?.detail?.currentId || '');
  };

  const swipeState = new WeakMap();
  const onLandmarkPointerDown = (event) => {
    if (!(event.target instanceof Element)) return;
    const nav = event.target.closest('.spw-page-landmarks');
    if (!nav) return;
    swipeState.set(nav, { x: event.clientX || 0, y: event.clientY || 0 });
  };
  const onLandmarkPointerUp = (event) => {
    if (!(event.target instanceof Element)) return;
    const nav = event.target.closest('.spw-page-landmarks');
    if (!nav) return;
    const start = swipeState.get(nav);
    swipeState.delete(nav);
    if (!start) return;
    const dx = (event.clientX || 0) - start.x;
    const dy = (event.clientY || 0) - start.y;
    if (Math.abs(dx) < SWIPE_DELTA_PX || Math.abs(dx) < Math.abs(dy)) return;
    const hash = cycleLandmarkNav(nav, dx < 0 ? 1 : -1);
    if (!hash) return;
    event.preventDefault();
    nav.addEventListener('click', (clickEvent) => clickEvent.preventDefault(), { once: true, capture: true });
    const nextHash = `#${hash}`;
    if (window.location.hash === nextHash) {
      hop('landmark-swipe', hash);
      return;
    }
    window.location.hash = hash;
  };

  const onSamePageHopClick = (event) => {
    if (!(event.target instanceof Element)) return;
    const hash = readHopHash(event.target);
    if (!hash) return;
    const href = event.target.closest('a')?.getAttribute('href') || '';
    const inPage = href.startsWith('#');
    if (inPage && `#${hash}` === window.location.hash) hop('in-page-hop', hash);
  };

  syncLandmarkLoopState(root);
  window.addEventListener('hashchange', onHashHop, { signal });
  window.addEventListener('popstate', onHashHop, { signal });
  document.addEventListener('spw:section-locomotion-state', onSectionTravel, { signal });
  document.addEventListener('click', onSamePageHopClick, { signal });
  let headerSwipe = null;
  const syncHeaderContract = (header) => {
    if (!(header instanceof HTMLElement)) return;
    if (header.dataset.spwMenuMode !== 'toggle') return;
    if (!header.dataset.spwGestureContract) {
      header.dataset.spwGestureContract = HEADER_CONTRACT;
    }
  };
  const headerFromEvent = (event) => {
    if (!(event.target instanceof Element)) return null;
    return event.target.closest(HEADER_SELECTOR);
  };
  const onHeaderPointerDown = (event) => {
    const header = headerFromEvent(event);
    if (!header) return;
    syncHeaderContract(header);
    headerSwipe = { header, x: event.clientX || 0, y: event.clientY || 0 };
  };
  const onHeaderPointerUp = (event) => {
    const start = headerSwipe;
    headerSwipe = null;
    if (!start?.header) return;
    const header = start.header;
    const dx = (event.clientX || 0) - start.x;
    const dy = (event.clientY || 0) - start.y;
    if (Math.abs(dx) < SWIPE_DELTA_PX || Math.abs(dx) < Math.abs(dy)) return;
    const intent = resolveHeaderRoomHop({
      direction: dx < 0 ? 1 : -1,
      menuOpen: header.getAttribute('data-spw-menu') === 'open',
      menuMode: header.dataset.spwMenuMode || '',
      hrefs: headerRoomHrefs(header),
      currentIndex: headerRoomCurrentIndex(header, window.location.pathname),
    });
    if (!intent?.href) return;
    event.preventDefault();
    const rooms = [...header.querySelectorAll('nav[aria-label="Primary"] a[href]')];
    const room = rooms[intent.index];
    header.addEventListener('click', (clickEvent) => {
      const dest = clickEvent.target instanceof Element
        ? clickEvent.target.closest('nav[aria-label="Primary"] a[href]')
        : null;
      if (dest) return;
      clickEvent.preventDefault();
      clickEvent.stopPropagation();
    }, { once: true, capture: true });
    hop('header-swipe', intent.href);
    if (room instanceof HTMLAnchorElement) {
      room.click();
      return;
    }
    if (window.location.pathname.replace(/\/$/, '') === String(intent.href).replace(/\/$/, '')) {
      return;
    }
    window.location.assign(intent.href);
  };
  const onHeaderKeydown = (event) => {
    if (event.altKey || event.metaKey || event.ctrlKey) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const header = headerFromEvent(event);
    if (!header) return;
    const target = event.target;
    if (target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable="true"]')) {
      return;
    }
    const intent = resolveHeaderRoomHop({
      direction: event.key === 'ArrowRight' ? 1 : -1,
      menuOpen: header.getAttribute('data-spw-menu') === 'open',
      menuMode: header.dataset.spwMenuMode || '',
      hrefs: headerRoomHrefs(header),
      currentIndex: headerRoomCurrentIndex(header, window.location.pathname),
    });
    if (!intent?.href) return;
    event.preventDefault();
    hop('header-swipe', intent.href);
    const rooms = [...header.querySelectorAll('nav[aria-label="Primary"] a[href]')];
    const room = rooms[intent.index];
    if (room instanceof HTMLAnchorElement) {
      room.click();
      return;
    }
    window.location.assign(intent.href);
  };

  root.querySelectorAll?.(HEADER_SELECTOR).forEach((header) => syncHeaderContract(header));
  document.addEventListener('pointerdown', onLandmarkPointerDown, { signal, capture: true });
  document.addEventListener('pointerup', onLandmarkPointerUp, { signal, capture: true });
  document.addEventListener('pointercancel', onLandmarkPointerUp, { signal, capture: true });
  document.addEventListener('pointerdown', onHeaderPointerDown, { signal, capture: true });
  document.addEventListener('pointerup', onHeaderPointerUp, { signal, capture: true });
  document.addEventListener('pointercancel', onHeaderPointerUp, { signal, capture: true });
  document.addEventListener('keydown', onHeaderKeydown, { signal });

  hopsApi = { hop, readHopHash, syncLandmarkLoopState };
  return hopsApi;
}
