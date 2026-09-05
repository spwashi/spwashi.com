/**
 * operator-interactions.js
 * ---------------------------------------------------------------------------
 * Progressive behaviors for operator-bearing controls (probe wiring, ref labels).
 */

import { bus } from '/public/js/kernel/bus.js';
import {
  REGION_SELECTOR,
  writeDatasetValue,
} from '/public/js/kernel/dom-contracts.js';
import { normalizeToken } from '/public/js/kernel/shared.js';
import { formatMicrointeractionExpression } from '/public/js/semantic/interaction-expression.js';

const SIGIL_TRANSITION_SELECTOR = [
  '.frame-sigil',
  '.frame-card-sigil',
  '.frame-panel-sigil',
  '.syntax-token',
  '.spw-chip',
  '.spec-pill',
  '.header-sigil',
  '.site-footer__brand',
  'a[data-spw-operator]',
  'button[data-spw-operator]',
  '[role="button"][data-spw-operator]',
  '[data-spw-sigil]',
].join(', ');

export const SIGIL_TRANSITION_CONTRACT = Object.freeze({
  selector: SIGIL_TRANSITION_SELECTOR,
  phases: Object.freeze(['approach', 'prime', 'commit', 'release', 'settle']),
  rootAttributes: Object.freeze([
    'data-spw-sigil-transitions-ready',
    'data-spw-active-sigil',
    'data-spw-active-sigil-operator',
    'data-spw-active-sigil-page',
    'data-spw-active-sigil-region',
    'data-spw-sigil-transition',
    'data-spw-sigil-transition-source',
    'data-spw-sigil-transition-from',
    'data-spw-sigil-transition-to',
  ]),
  localAttributes: Object.freeze([
    'data-spw-sigil-transition',
    'data-spw-sigil-transition-source',
    'data-spw-sigil-previous',
    'data-spw-sigil-next',
    'data-spw-sigil-payload-scope',
    'data-spw-sigil-payload-page',
    'data-spw-sigil-payload-family',
    'data-spw-sigil-payload-role',
    'data-spw-sigil-payload-topic',
    'data-spw-sigil-region',
    'data-spw-sigil-region-harmony',
    'data-spw-sigil-region-tempo',
    'data-spw-sigil-region-density',
  ]),
  event: 'spw:sigil-transition',
  busEvent: 'sigil:transition',
  portableUse:
    'Use snapshotSigilTransition() or window.__SPW_SIGIL_TRANSITIONS__.snapshot() when page anatomy, inspectors, '
    + 'or composition surfaces need the current sigil/page/region handoff without binding their own hover listeners.',
});

const TRANSITION_CLEAR_DELAY_MS = 420;
const COMMIT_SETTLE_DELAY_MS = 180;
const PAGE_PAYLOAD_CACHE_MS = 600;

let sigilTransitionsBound = false;
let activeSigil = null;
let pagePayloadCache = null;
let pagePayloadCacheAt = 0;

const transitionTimers = new WeakMap();

export function snapshotSigilTransition(html = document.documentElement) {
  if (!(html instanceof HTMLElement)) return null;

  const phase = html.dataset.spwSigilTransition || '';
  const active = html.dataset.spwActiveSigil || '';
  if (!phase && !active) return null;

  return {
    phase,
    active,
    operator: html.dataset.spwActiveSigilOperator || '',
    page: html.dataset.spwActiveSigilPage || '',
    region: html.dataset.spwActiveSigilRegion || '',
    source: html.dataset.spwSigilTransitionSource || '',
    from: html.dataset.spwSigilTransitionFrom || '',
    to: html.dataset.spwSigilTransitionTo || '',
  };
}

function normalizeText(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function safeDatasetToken(value = '') {
  return normalizeToken(value) || '';
}

function readPrimaryTopic(payload) {
  const topic = payload?.topics?.find?.((entry) => entry?.text);
  return topic?.text || '';
}

function readPagePayload() {
  const now = Date.now();
  if (pagePayloadCache && now - pagePayloadCacheAt < PAGE_PAYLOAD_CACHE_MS) {
    return pagePayloadCache;
  }

  const body = document.body;
  const anatomy = window.__SPW_PAGE_ANATOMY__?.snapshot?.() || null;
  const topical = anatomy?.topicalPayload || window.__SPW_TOPICAL_PAYLOAD__?.snapshot?.() || null;
  const surface = anatomy?.surface || body?.dataset?.spwSurface || 'site';
  const family = anatomy?.family || body?.dataset?.spwPageFamily || '';
  const role = anatomy?.role || body?.dataset?.spwPageRole || '';
  const key = safeDatasetToken(
    body?.dataset?.spwPageSeed
    || `${surface}-${family || role || window.location.pathname || 'page'}`,
  ) || 'page';

  pagePayloadCache = {
    key,
    route: anatomy?.route || window.location.pathname || '/',
    surface,
    family,
    role,
    context: body?.dataset?.spwContext || '',
    wonder: body?.dataset?.spwWonder || '',
    modes: body?.dataset?.spwPageModes || '',
    primaryTopic: readPrimaryTopic(topical),
    topicalCount: topical?.topics?.length || 0,
  };
  pagePayloadCacheAt = now;
  return pagePayloadCache;
}

function readRegionLabel(region) {
  if (!(region instanceof HTMLElement)) return '';

  return normalizeText(
    region.getAttribute('aria-label')
    || region.querySelector(':scope > .frame-topline .frame-sigil, :scope > .frame-heading .frame-sigil')?.textContent
    || region.querySelector(':scope > h1, :scope > h2, :scope > h3, :scope > header h1, :scope > header h2, :scope > header h3')?.textContent
    || region.id
    || region.dataset.spwRegionKey
    || '',
  );
}

function readRegionPayload(element) {
  const region = element.closest(REGION_SELECTOR)
    || element.closest('section[id], article[id], aside[id], nav[id], main');

  if (!(region instanceof HTMLElement)) return null;

  const label = readRegionLabel(region);
  const key = safeDatasetToken(
    region.dataset.spwRegionKey
    || region.dataset.spwFeature
    || region.dataset.spwSlot
    || region.id
    || label
    || 'region',
  ) || 'region';

  const index = Number.parseInt(region.style.getPropertyValue('--region-index') || '', 10);

  return {
    element: region,
    key,
    label,
    kind: region.dataset.spwKind || region.dataset.spwComponentKind || '',
    role: region.dataset.spwRole || '',
    context: region.dataset.spwContext || '',
    surface: region.dataset.spwSurface || '',
    harmony: region.dataset.spwHarmony || '',
    tempo: region.dataset.spwTempo || '',
    density: region.dataset.spwDensity || '',
    genome: region.dataset.spwRegionGenome || '',
    index: Number.isFinite(index) ? index : 0,
  };
}

function readSigilPayload(element) {
  const page = readPagePayload();
  const region = readRegionPayload(element);
  const sigil = normalizeText(element.dataset.spwSigil || element.textContent || '');
  const operator = element.dataset.spwOperatorResolved || element.dataset.spwOperator || '';
  const sigilName = element.dataset.spwSigilName || safeDatasetToken(sigil);
  const identifier = element.dataset.spwIdentifier || '';
  const key = safeDatasetToken(identifier || sigilName || sigil || operator || 'sigil') || 'sigil';

  return {
    key,
    sigil,
    sigilName,
    identifier,
    operator,
    page,
    region,
    scope: region ? 'page-region' : 'page',
  };
}

function writeRootSigilState(payload, phase, source, previousKey = '') {
  const html = document.documentElement;

  writeDatasetValue(html, 'spwActiveSigil', payload.key);
  writeDatasetValue(html, 'spwActiveSigilOperator', payload.operator || null);
  writeDatasetValue(html, 'spwActiveSigilPage', payload.page.key);
  writeDatasetValue(html, 'spwActiveSigilRegion', payload.region?.key || null);
  writeDatasetValue(html, 'spwSigilTransition', phase);
  writeDatasetValue(html, 'spwSigilTransitionSource', source);
  writeDatasetValue(html, 'spwSigilTransitionFrom', previousKey || null);
  writeDatasetValue(html, 'spwSigilTransitionTo', payload.key);
}

function clearRootSigilState(element) {
  if (activeSigil && activeSigil !== element) return;

  const html = document.documentElement;
  writeDatasetValue(html, 'spwActiveSigil', null);
  writeDatasetValue(html, 'spwActiveSigilOperator', null);
  writeDatasetValue(html, 'spwActiveSigilPage', null);
  writeDatasetValue(html, 'spwActiveSigilRegion', null);
  writeDatasetValue(html, 'spwSigilTransition', null);
  writeDatasetValue(html, 'spwSigilTransitionSource', null);
  writeDatasetValue(html, 'spwSigilTransitionFrom', null);
  writeDatasetValue(html, 'spwSigilTransitionTo', null);
}

function writeLocalPayloadState(element, payload, phase, source, previousKey = '') {
  writeDatasetValue(element, 'spwSigilTransition', phase);
  writeDatasetValue(element, 'spwSigilTransitionSource', source);
  writeDatasetValue(element, 'spwSigilPrevious', previousKey || null);
  writeDatasetValue(element, 'spwSigilPayloadScope', payload.scope);
  writeDatasetValue(element, 'spwSigilPayloadPage', payload.page.key);
  writeDatasetValue(element, 'spwSigilPayloadFamily', payload.page.family || null);
  writeDatasetValue(element, 'spwSigilPayloadRole', payload.page.role || null);
  writeDatasetValue(element, 'spwSigilPayloadTopic', payload.page.primaryTopic || null);
  writeDatasetValue(element, 'spwSigilRegion', payload.region?.key || null);
  writeDatasetValue(element, 'spwSigilRegionHarmony', payload.region?.harmony || null);
  writeDatasetValue(element, 'spwSigilRegionTempo', payload.region?.tempo || null);
  writeDatasetValue(element, 'spwSigilRegionDensity', payload.region?.density || null);

  element.style.setProperty('--spw-sigil-stagger-delay', `${Math.min(payload.region?.index || 0, 8) * 12}ms`);
  element.style.setProperty('--spw-sigil-topic-alpha', `${Math.min(18, 6 + (payload.page.topicalCount || 0))}%`);
}

function clearLocalPayloadState(element) {
  writeDatasetValue(element, 'spwSigilTransition', null);
  writeDatasetValue(element, 'spwSigilTransitionSource', null);
  writeDatasetValue(element, 'spwSigilPrevious', null);
  writeDatasetValue(element, 'spwSigilNext', null);
  writeDatasetValue(element, 'spwSigilPayloadScope', null);
  writeDatasetValue(element, 'spwSigilPayloadPage', null);
  writeDatasetValue(element, 'spwSigilPayloadFamily', null);
  writeDatasetValue(element, 'spwSigilPayloadRole', null);
  writeDatasetValue(element, 'spwSigilPayloadTopic', null);
  writeDatasetValue(element, 'spwSigilRegion', null);
  writeDatasetValue(element, 'spwSigilRegionHarmony', null);
  writeDatasetValue(element, 'spwSigilRegionTempo', null);
  writeDatasetValue(element, 'spwSigilRegionDensity', null);
  element.style.removeProperty('--spw-sigil-stagger-delay');
  element.style.removeProperty('--spw-sigil-topic-alpha');
}

function emitSigilTransition(payload, phase, source, previousKey = '') {
  const expression = formatMicrointeractionExpression({
    input: payload.key || payload.sigil || 'sigil',
    gesture: source || 'interaction',
    transform: `!${phase} ~> $sigil`,
    destination: payload.region?.key || payload.page?.key || 'page',
    register: payload.operator || 'sigil',
    state: phase,
  });
  const detail = {
    phase,
    source,
    expression,
    key: payload.key,
    sigil: payload.sigil,
    operator: payload.operator,
    previous: previousKey,
    page: payload.page,
    region: payload.region ? {
      key: payload.region.key,
      label: payload.region.label,
      kind: payload.region.kind,
      role: payload.region.role,
      context: payload.region.context,
      harmony: payload.region.harmony,
      tempo: payload.region.tempo,
      density: payload.region.density,
      genome: payload.region.genome,
    } : null,
  };

  bus.emit?.('sigil:transition', detail);
  document.dispatchEvent(new CustomEvent('spw:sigil-transition', { detail }));
}

function clearTransitionTimer(element) {
  const timer = transitionTimers.get(element);
  if (timer) window.clearTimeout(timer);
  transitionTimers.delete(element);
}

function scheduleClear(element) {
  clearTransitionTimer(element);
  transitionTimers.set(element, window.setTimeout(() => {
    if (element.matches?.(':hover, :focus-within')) return;
    clearLocalPayloadState(element);
    if (activeSigil === element) {
      activeSigil = null;
      clearRootSigilState(element);
    }
    transitionTimers.delete(element);
  }, TRANSITION_CLEAR_DELAY_MS));
}

function releaseSigil(element, nextKey = '') {
  if (!(element instanceof HTMLElement)) return;
  writeDatasetValue(element, 'spwSigilTransition', 'release');
  writeDatasetValue(element, 'spwSigilNext', nextKey || null);
  scheduleClear(element);
}

function activateSigil(element, phase = 'approach', source = 'pointer') {
  if (!(element instanceof HTMLElement)) return;

  prepareSigilTransitionTarget(element);

  const previous = activeSigil && activeSigil !== element ? activeSigil : null;
  const previousKey = previous?.dataset?.spwIdentifier
    || previous?.dataset?.spwSigilName
    || safeDatasetToken(previous?.dataset?.spwSigil || previous?.textContent || '');
  const payload = readSigilPayload(element);

  if (previous) releaseSigil(previous, payload.key);
  activeSigil = element;

  clearTransitionTimer(element);
  writeLocalPayloadState(element, payload, phase, source, previousKey || '');
  writeRootSigilState(payload, phase, source, previousKey || '');
  emitSigilTransition(payload, phase, source, previousKey || '');
}

function settleSigil(element, source = 'pointer') {
  if (!(element instanceof HTMLElement)) return;
  if (element.matches?.(':hover, :focus-within')) return;

  writeDatasetValue(element, 'spwSigilTransition', 'settle');
  writeDatasetValue(element, 'spwSigilTransitionSource', source);
  scheduleClear(element);
}

function commitSigil(element, source = 'pointer') {
  if (!(element instanceof HTMLElement)) return;
  activateSigil(element, 'commit', source);

  clearTransitionTimer(element);
  transitionTimers.set(element, window.setTimeout(() => {
    if (activeSigil === element) {
      writeDatasetValue(element, 'spwSigilTransition', 'settle');
      writeDatasetValue(document.documentElement, 'spwSigilTransition', 'settle');
    }
    scheduleClear(element);
  }, COMMIT_SETTLE_DELAY_MS));
}

function findSigilTransitionTarget(event) {
  const target = event.target?.closest?.(SIGIL_TRANSITION_SELECTOR);
  if (!(target instanceof HTMLElement)) return null;
  if (target.matches('.spw-delimiter')) return null;
  return target;
}

function prepareSigilTransitionTarget(element) {
  if (!(element instanceof HTMLElement)) return;
  if (element.dataset.spwSigilTransitionsWired === 'true') return;
  writeDatasetValue(element, 'spwSigilTransitionsWired', 'true');
}

function publishSigilTransitionApi() {
  const api = {
    contract: SIGIL_TRANSITION_CONTRACT,
    snapshot: () => snapshotSigilTransition(document.documentElement),
  };

  window.__SPW_SIGIL_TRANSITIONS__ = api;
  window.spwSigilTransitions = api;

  writeDatasetValue(document.documentElement, 'spwSigilTransitionsReady', 'true');
}

export function wireSigilTransitions(root = document) {
  root.querySelectorAll?.(SIGIL_TRANSITION_SELECTOR).forEach(prepareSigilTransitionTarget);
  publishSigilTransitionApi();

  if (sigilTransitionsBound) return;
  sigilTransitionsBound = true;

  document.addEventListener('pointerover', (event) => {
    const target = findSigilTransitionTarget(event);
    if (!target) return;
    if (event.relatedTarget instanceof Node && target.contains(event.relatedTarget)) return;
    activateSigil(target, 'approach', event.pointerType || 'pointer');
  }, true);

  document.addEventListener('pointerout', (event) => {
    const target = findSigilTransitionTarget(event);
    if (!target) return;
    if (event.relatedTarget instanceof Node && target.contains(event.relatedTarget)) return;
    settleSigil(target, event.pointerType || 'pointer');
  }, true);

  document.addEventListener('focusin', (event) => {
    const target = findSigilTransitionTarget(event);
    if (!target) return;
    activateSigil(target, 'prime', 'focus');
  }, true);

  document.addEventListener('focusout', (event) => {
    const target = findSigilTransitionTarget(event);
    if (!target) return;
    if (event.relatedTarget instanceof Node && target.contains(event.relatedTarget)) return;
    settleSigil(target, 'focus');
  }, true);

  document.addEventListener('pointerdown', (event) => {
    const target = findSigilTransitionTarget(event);
    if (!target) return;
    commitSigil(target, event.pointerType || 'pointer');
  }, true);
}

export function wireProbeSigils(root = document) {
  const probeSigils = Array.from(
    root.querySelectorAll('[data-spw-operator="probe"][href^="#"]'),
  );

  for (const sigil of probeSigils) {
    if (sigil.dataset.spwProbeWired === 'true') continue;

    const frame = sigil.closest('.spw-frame');
    if (!frame) continue;

    const panels = Array.from(frame.querySelectorAll('[data-mode-panel]'));
    if (!panels.length) continue;

    const match = sigil.textContent.match(/\?\[["']?([^\]"']+)/);
    const probeName = match ? match[1].toLowerCase().replace(/\s+/g, '_') : null;

    const target = probeName
      ? panels.find((panel) => panel.dataset.modePanel === probeName) || panels[0]
      : panels[0];

    if (target && target.hidden) {
      sigil.dataset.spwProbeWired = 'true';
      sigil.addEventListener('click', (event) => {
        if (sigil.tagName === 'A') event.preventDefault();

        if (target.dataset.modeGroup && target.dataset.modePanel && window.spwInterface?.setGroupMode) {
          window.spwInterface.setGroupMode(target.dataset.modeGroup, target.dataset.modePanel, {
            source: 'probe',
            force: true,
          });
        } else {
          target.hidden = false;
          target.classList.add('is-active-panel');
        }

        if (window.spwInterface?.activateFrame) {
          window.spwInterface.activateFrame(frame, {
            source: 'probe',
            force: true,
          });
        }
      });
    }
  }
}

export function annotateRefs(root = document) {
  const refSigils = Array.from(
    root.querySelectorAll('[data-spw-operator="ref"]'),
  );

  for (const sigil of refSigils) {
    const text = sigil.textContent.trim();
    const match = text.match(/~["#]?([^"}\s]+)/);
    if (match) {
      const ref = match[1].replace(/['"]/g, '');
      sigil.setAttribute('aria-label', `reference: ${ref}`);
      if (!sigil.title) sigil.title = `~"${ref}"`;
    }
  }
}
