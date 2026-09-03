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
const SWIPE_DELTA_PX = 48;
const HOP_LOCK_MS = 90;

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

export function bindInteractionHops({ html, root = document, writePhase, signal }) {
  let hopCooldown = 0;

  const hop = (source, hash = '') => {
    const now = Date.now();
    if (now - hopCooldown < HOP_LOCK_MS) return;
    hopCooldown = now;
    if (typeof writePhase === 'function') {
      writePhase(html, hash ? 'discover' : 'settle', { source, hash, force: true });
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
  document.addEventListener('pointerdown', onLandmarkPointerDown, { signal, capture: true });
  document.addEventListener('pointerup', onLandmarkPointerUp, { signal, capture: true });
  document.addEventListener('pointercancel', onLandmarkPointerUp, { signal, capture: true });

  return { hop, readHopHash, syncLandmarkLoopState };
}
