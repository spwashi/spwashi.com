/**
 * navigation-locomotion.js
 * --------------------------------------------------------------------------
 * Coordinates section travel, page transitions, spell momentum, and chrome lanes.
 */

import { syncFloatingChromeState, writeDatasetValue } from '/public/js/kernel/dom-contracts.js';
import { primeRouteTransition } from '/public/js/kernel/route-utils.js';
import { emitSpwAction } from '/public/js/kernel/shared.js';
import { PAGE_SECTION_EVENT } from './attention/shared.js';

const EXPLICIT_TRAVEL_SOURCES = new Set([
  'prev',
  'next',
  'top',
  'bottom',
  'arrow-prev',
  'arrow-next',
  'home',
  'end',
  'current',
  'current-settled',
]);

const SPELL_SOURCES = Object.freeze({
  forward: '#>section.next',
  back: '#>section.prev',
  top: '#>section.top',
  bottom: '#>section.bottom',
  steady: '#>section.current',
});

let locomotionTimer = 0;

function resolveSpellToken(detail = {}) {
  const { direction, source } = detail;
  if (source === 'top' || source === 'home') return SPELL_SOURCES.top;
  if (source === 'bottom' || source === 'end') return SPELL_SOURCES.bottom;
  if (direction === 'back') return SPELL_SOURCES.back;
  if (direction === 'forward') return SPELL_SOURCES.forward;
  return SPELL_SOURCES.steady;
}

function syncNavigationLocomotionState(detail = {}, reason = 'section-locomotion') {
  const html = document.documentElement;
  const phase = detail.phase || 'settled';

  if (phase === 'traveling') {
    writeDatasetValue(html, 'spwNavigationLocomotion', 'traveling');
    writeDatasetValue(html, 'spwNavigationTransition', detail.direction || 'steady');
    writeDatasetValue(html, 'spwSpellMomentum', 'locomotion');
    writeDatasetValue(html, 'spwNavigationSection', detail.currentId || detail.currentLabel || null);
  } else {
    if (html.dataset.spwSpellMomentum === 'locomotion') {
      delete html.dataset.spwSpellMomentum;
    }
    writeDatasetValue(html, 'spwNavigationLocomotion', null);
    writeDatasetValue(html, 'spwNavigationTransition', null);
    writeDatasetValue(html, 'spwNavigationSection', detail.currentId || null);
  }

  syncFloatingChromeState(document, {
    source: 'navigation-locomotion',
    reason,
  });

  document.dispatchEvent(new CustomEvent('spw:navigation-locomotion', { detail: { ...detail, reason } }));
}

function maybeCastTravelSpell(detail = {}) {
  const source = detail.source || '';
  if (!EXPLICIT_TRAVEL_SOURCES.has(source)) return;
  const label = detail.currentLabel || detail.currentId || 'section';
  emitSpwAction(resolveSpellToken(detail), `Section travel: ${label}`);
}

function refreshNavigationSpells() {
  document.dispatchEvent(new CustomEvent('spw:navigation-refresh', {
    detail: { reason: 'locomotion-settled' },
  }));
}

function onSectionLocomotion(event) {
  const detail = event?.detail || {};
  window.clearTimeout(locomotionTimer);
  syncNavigationLocomotionState(detail, `section-${detail.phase || 'sync'}`);

  if (detail.phase === 'traveling') {
    maybeCastTravelSpell(detail);
    return;
  }

  if (detail.phase === 'settled') {
    locomotionTimer = window.setTimeout(() => {
      refreshNavigationSpells();
      syncNavigationLocomotionState(detail, 'section-settled');
    }, 120);
  }
}

function onPageTransition(event) {
  const detail = event?.detail || {};
  if (detail.phase === 'entering' || detail.phase === 'returning') {
    writeDatasetValue(document.documentElement, 'spwNavigationLocomotion', detail.phase);
  }
}

export const SPW_NAVIGATION_LOCOMOTION_CONTRACT = Object.freeze({
  events: Object.freeze({
    locomotion: 'spw:navigation-locomotion',
    refresh: 'spw:navigation-refresh',
    section: PAGE_SECTION_EVENT,
  }),
  attributes: Object.freeze({
    locomotion: 'data-spw-navigation-locomotion',
    transition: 'data-spw-navigation-transition',
    section: 'data-spw-navigation-section',
  }),
});

function onInternalLinkIntent(event) {
  const anchor = event.target?.closest?.('a[href]');
  if (!anchor) return;

  try {
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (url.pathname === window.location.pathname) return;
  } catch {
    return;
  }

  primeRouteTransition(anchor.getAttribute('href'), {
    mode: 'locomotion-intent',
    reason: 'nav-link-intent',
  });
}

export function initNavigationLocomotion(ctx) {
  document.addEventListener(PAGE_SECTION_EVENT, onSectionLocomotion);
  document.addEventListener('spw:page-transition-state', onPageTransition);
  document.addEventListener('focusin', onInternalLinkIntent);

  const unsubNav = ctx?.bus?.on?.('spw:layout-assumptions-updated', () => {
    syncFloatingChromeState(document, {
      source: 'navigation-locomotion',
      reason: 'layout-assumptions-updated',
    });
  });

  return () => {
    document.removeEventListener(PAGE_SECTION_EVENT, onSectionLocomotion);
    document.removeEventListener('spw:page-transition-state', onPageTransition);
    document.removeEventListener('focusin', onInternalLinkIntent);
    unsubNav?.();
    window.clearTimeout(locomotionTimer);
    locomotionTimer = 0;
    const html = document.documentElement;
    if (html.dataset.spwSpellMomentum === 'locomotion') {
      delete html.dataset.spwSpellMomentum;
    }
    delete html.dataset.spwNavigationLocomotion;
    delete html.dataset.spwNavigationTransition;
    delete html.dataset.spwNavigationSection;
  };
}