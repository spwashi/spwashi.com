/**
 * scene-interaction.js
 * ---------------------------------------------------------------------------
 * Interactive scene beds: lane focus, image lens coupling, and local memory.
 */

import { bus } from '/public/js/kernel/bus.js';
import { writeDatasetValue } from '/public/js/kernel/dom-contracts.js';
import { semanticToken as normalizeToken } from '/public/js/kernel/text-normalization.js';
import { readJson, STORAGE_KEYS, writeJson } from '/public/js/kernel/storage-utils.js';

const BED_SELECTOR = '.spw-scene-bed[data-spw-scene-interactive], .spw-scene-bed[data-spw-scene-posture]';
const LANE_SELECTOR = '.spw-scene-bed__lane, [data-spw-scene-lane]';
const FIGURE_SELECTOR = '.spw-scene-bed__figure, .image-study[data-spw-scene-lane-bind]';
const STORAGE_KEY = STORAGE_KEYS.SCENE_INTERACTION;

let initialized = false;
const bedState = new Map();

function readLaneId(lane) {
  if (!(lane instanceof HTMLElement)) return '';
  return lane.dataset.spwSceneLane
    || normalizeToken(lane.querySelector('strong')?.textContent || '')
    || '';
}

function readBedId(bed) {
  if (!(bed instanceof HTMLElement)) return '';
  const frame = bed.closest('.site-frame');
  const mode = bed.getAttribute('data-mode-panel') || bed.dataset.spwScenePosture || 'scene';
  return `${window.location.pathname}::${frame?.id || 'bed'}::${mode}`;
}

function readStorage() {
  return readJson(STORAGE_KEY, {}, { requireObject: true });
}

function writeStorage(store) {
  writeJson(STORAGE_KEY, store);
}

function readActiveMode(bed) {
  const group = bed.getAttribute('data-mode-group');
  if (!group) return bed.getAttribute('data-mode-panel') || '';
  const pressed = bed.closest('.site-frame')?.querySelector(
    `[data-mode-group="${CSS.escape(group)}"][data-set-mode][aria-pressed="true"]`,
  );
  return pressed?.getAttribute('data-set-mode')
    || bed.getAttribute('data-mode-panel')
    || '';
}

function listLanes(bed) {
  return [...bed.querySelectorAll(LANE_SELECTOR)].filter((node) => node instanceof HTMLElement);
}

function listFigures(bed) {
  return [...bed.querySelectorAll(FIGURE_SELECTOR)].filter((node) => node instanceof HTMLElement);
}

function updateMemoryStrip(bed, state) {
  const strip = bed.querySelector('[data-spw-scene-memory-value]');
  if (!(strip instanceof HTMLElement)) return;
  const lane = state.focusLane || 'none';
  const lens = state.imageLens || '—';
  strip.textContent = `${state.mode || '—'} · lane:${lane} · lens:${lens}`;
  const memory = bed.querySelector('[data-spw-scene-memory]');
  if (memory instanceof HTMLElement) memory.hidden = false;
}

function applyLaneFocus(bed, laneId, { persist = true, source = 'pointer' } = {}) {
  if (!(bed instanceof HTMLElement) || !laneId) return;

  const lanes = listLanes(bed);
  const figures = listFigures(bed);
  let matched = false;

  lanes.forEach((lane) => {
    const id = readLaneId(lane);
    const active = id === laneId;
    if (active) matched = true;
    lane.dataset.spwSceneLaneActive = active ? 'true' : 'false';
    lane.setAttribute('aria-checked', active ? 'true' : 'false');
    if (active) {
      lane.setAttribute('tabindex', '0');
    } else {
      lane.setAttribute('tabindex', '-1');
    }
  });

  figures.forEach((figure) => {
    const bind = figure.dataset.spwSceneLaneBind || 'focus';
    const active = bind === laneId;
    figure.dataset.spwSceneImageActive = active ? 'on' : 'off';
    if (active) {
      figure.dataset.spwImageInteractionState = figure.dataset.spwImageInteractionState || 'primed';
    }
  });

  const bedId = readBedId(bed);
  const next = {
    ...(bedState.get(bedId) || {}),
    bedId,
    posture: bed.dataset.spwScenePosture || '',
    mode: readActiveMode(bed),
    focusLane: laneId,
    imageLens: figures.find((f) => f.dataset.spwSceneImageActive === 'on')?.dataset.spwImageLensActive || '',
    updatedAt: Date.now(),
    source,
  };
  bedState.set(bedId, next);

  writeDatasetValue(bed, 'spwSceneFocusLane', laneId, {
    source: 'scene-interaction',
    reason: 'lane-focus',
  });
  writeDatasetValue(bed, 'spwSceneInteractive', 'ready', {
    source: 'scene-interaction',
    reason: 'lane-focus',
  });

  const frame = bed.closest('.site-frame');
  if (frame instanceof HTMLElement) {
    writeDatasetValue(frame, 'spwSceneLocalState', 'active', {
      source: 'scene-interaction',
      reason: 'lane-focus',
    });
  }

  updateMemoryStrip(bed, next);

  if (persist) {
    const store = readStorage();
    store[bedId] = next;
    writeStorage(store);
  }

  bus.emit('scene:lane-focus', { bedId, lane: laneId, mode: next.mode, source });
  bus.emit('scene:state-changed', { bedId, state: { ...next } });
  document.dispatchEvent(new CustomEvent('spw:scene-lane-focus', {
    bubbles: true,
    detail: { bedId, lane: laneId, mode: next.mode, source },
  }));
}

function restoreBed(bed) {
  const bedId = readBedId(bed);
  const store = readStorage();
  const saved = store[bedId];
  if (!saved?.focusLane) return;

  bedState.set(bedId, saved);
  applyLaneFocus(bed, saved.focusLane, { persist: false, source: 'restore' });
  updateMemoryStrip(bed, saved);
}

function prepareBed(bed) {
  if (!(bed instanceof HTMLElement) || bed.dataset.spwSceneInteractive === 'ready') return;

  const stage = bed.querySelector('.spw-scene-bed__stage');
  if (stage instanceof HTMLElement) {
    stage.setAttribute('role', 'radiogroup');
    stage.setAttribute('aria-label', stage.getAttribute('aria-label') || 'Scene lanes');
  }

  listLanes(bed).forEach((lane, index) => {
    lane.setAttribute('role', 'radio');
    lane.setAttribute('tabindex', index === 0 ? '0' : '-1');
    lane.setAttribute('aria-checked', 'false');
    if (!lane.dataset.spwSceneLane) {
      lane.dataset.spwSceneLane = readLaneId(lane);
    }
  });

  listFigures(bed).forEach((figure) => {
    if (!figure.hasAttribute('tabindex')) figure.setAttribute('tabindex', '0');
    if (!figure.dataset.spwSceneLaneBind) figure.dataset.spwSceneLaneBind = 'focus';
  });

  bed.dataset.spwSceneInteractive = 'ready';
  document.dispatchEvent(new CustomEvent('spw:scene-bed-ready', {
    bubbles: true,
    detail: { bedId: readBedId(bed), posture: bed.dataset.spwScenePosture || '' },
  }));
  restoreBed(bed);
  if (!bed.dataset.spwSceneFocusLane) {
    const firstLane = readLaneId(listLanes(bed)[0]);
    if (firstLane) applyLaneFocus(bed, firstLane, { source: 'prime' });
  }
}

function roveLane(bed, direction = 1) {
  const lanes = listLanes(bed);
  if (!lanes.length) return;

  const currentIndex = lanes.findIndex((lane) => lane.dataset.spwSceneLaneActive === 'true');
  const start = currentIndex < 0 ? 0 : currentIndex;
  const nextIndex = (start + direction + lanes.length) % lanes.length;
  const lane = lanes[nextIndex];
  const laneId = readLaneId(lane);
  applyLaneFocus(bed, laneId, { source: 'keyboard' });
  lane.focus({ preventScroll: true });
}

function onLaneClick(event) {
  const lane = event.target.closest(LANE_SELECTOR);
  const bed = lane?.closest(BED_SELECTOR);
  if (!(lane instanceof HTMLElement) || !(bed instanceof HTMLElement)) return;
  if (lane.closest('a[href]')) return;

  const laneId = readLaneId(lane);
  if (!laneId) return;
  applyLaneFocus(bed, laneId, { source: 'pointer' });
}

function onLaneKeydown(event) {
  const lane = event.target.closest(LANE_SELECTOR);
  const bed = lane?.closest(BED_SELECTOR);
  if (!(lane instanceof HTMLElement) || !(bed instanceof HTMLElement)) return;

  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      event.preventDefault();
      roveLane(bed, 1);
      break;
    case 'ArrowLeft':
    case 'ArrowUp':
      event.preventDefault();
      roveLane(bed, -1);
      break;
    case 'Home':
      event.preventDefault();
      applyLaneFocus(bed, readLaneId(listLanes(bed)[0]), { source: 'keyboard' });
      break;
    case 'End': {
      event.preventDefault();
      const lanes = listLanes(bed);
      applyLaneFocus(bed, readLaneId(lanes[lanes.length - 1]), { source: 'keyboard' });
      break;
    }
    case 'Enter':
    case ' ':
      event.preventDefault();
      applyLaneFocus(bed, readLaneId(lane), { source: 'keyboard-commit' });
      break;
    default:
      break;
  }
}

function onVariantSelected(event) {
  const beds = [...document.querySelectorAll(BED_SELECTOR)];
  beds.forEach((bed) => {
    if (!(bed instanceof HTMLElement)) return;
    if (bed.hidden) return;
    const bedId = readBedId(bed);
    const state = bedState.get(bedId) || readStorage()[bedId];
    if (state?.focusLane) {
      window.setTimeout(() => applyLaneFocus(bed, state.focusLane, { persist: true, source: 'mode-sync' }), 40);
    } else {
      const firstLane = readLaneId(listLanes(bed)[0]);
      if (firstLane) applyLaneFocus(bed, firstLane, { source: 'mode-prime' });
    }
  });
}

function onImageLens(event) {
  const figure = event.detail?.figure instanceof HTMLElement
    ? event.detail.figure
    : event.target?.closest?.(FIGURE_SELECTOR);
  const bed = figure?.closest?.(BED_SELECTOR);
  if (!(figure instanceof HTMLElement) || !(bed instanceof HTMLElement)) return;

  const bedId = readBedId(bed);
  const next = {
    ...(bedState.get(bedId) || {}),
    bedId,
    imageLens: figure.dataset.spwImageLensActive || event.detail?.lens || '',
    focusLane: bed.dataset.spwSceneFocusLane || '',
    mode: readActiveMode(bed),
    posture: bed.dataset.spwScenePosture || '',
    updatedAt: Date.now(),
    source: 'image-lens',
  };
  bedState.set(bedId, next);

  const store = readStorage();
  store[bedId] = next;
  writeStorage(store);
  updateMemoryStrip(bed, next);
  bus.emit('scene:state-changed', { bedId, state: { ...next } });
}

function onSceneEnter(event) {
  const sceneId = event.detail?.scene?.id;
  if (!sceneId) return;
  const frame = document.getElementById(sceneId);
  const bed = frame?.querySelector(`${BED_SELECTOR}:not([hidden])`);
  if (!(bed instanceof HTMLElement)) return;
  const firstLane = readLaneId(listLanes(bed)[0]);
  if (firstLane) applyLaneFocus(bed, firstLane, { source: 'scene-enter' });
}

export function getSceneInteractionSnapshot() {
  const beds = [...document.querySelectorAll(BED_SELECTOR)]
    .filter((bed) => bed instanceof HTMLElement && !bed.hidden)
    .map((bed) => {
      const bedId = readBedId(bed);
      const state = bedState.get(bedId) || readStorage()[bedId] || null;
      return {
        bedId,
        posture: bed.dataset.spwScenePosture || '',
        mode: readActiveMode(bed),
        focusLane: bed.dataset.spwSceneFocusLane || state?.focusLane || '',
        imageLens: state?.imageLens || '',
        figures: listFigures(bed).map((figure) => ({
          bind: figure.dataset.spwSceneLaneBind || '',
          lens: figure.dataset.spwImageLensActive || '',
          active: figure.dataset.spwSceneImageActive === 'on',
          state: figure.dataset.spwImageInteractionState || '',
        })),
      };
    });

  return {
    route: window.location.pathname,
    beds,
    storageKey: STORAGE_KEY,
  };
}

function publishApi() {
  const api = {
    snapshot: getSceneInteractionSnapshot,
    focusLane: (bed, laneId) => {
      if (typeof bed === 'string') bed = document.querySelector(bed);
      if (bed instanceof HTMLElement) applyLaneFocus(bed, laneId, { source: 'api' });
    },
    clearLocal: () => {
      writeStorage({});
      bedState.clear();
      document.querySelectorAll(BED_SELECTOR).forEach((bed) => {
        if (!(bed instanceof HTMLElement)) return;
        delete bed.dataset.spwSceneFocusLane;
        listLanes(bed).forEach((lane) => {
          delete lane.dataset.spwSceneLaneActive;
          lane.setAttribute('aria-checked', 'false');
        });
        listFigures(bed).forEach((figure) => delete figure.dataset.spwSceneImageActive);
        const strip = bed.querySelector('[data-spw-scene-memory-value]');
        if (strip) strip.textContent = 'cleared';
      });
    },
  };
  window.__SPW_SCENE_INTERACTION__ = api;
  window.spwSceneInteraction = api;
}

export function initSceneInteraction(root = document) {
  if (initialized) return () => {};
  initialized = true;

  publishApi();
  root.querySelectorAll(BED_SELECTOR).forEach(prepareBed);

  root.addEventListener('click', onLaneClick, true);
  root.addEventListener('keydown', onLaneKeydown, true);
  root.addEventListener('spw:variant-selected', onVariantSelected);
  root.addEventListener('spw:image-lens', onImageLens, true);
  root.addEventListener('spw:scene-enter', onSceneEnter);

  const observer = new MutationObserver(() => {
    root.querySelectorAll(BED_SELECTOR).forEach(prepareBed);
  });
  observer.observe(root.body || root.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['hidden', 'data-mode-panel'],
  });

  return () => {
    initialized = false;
    observer.disconnect();
    root.removeEventListener('click', onLaneClick, true);
    root.removeEventListener('keydown', onLaneKeydown, true);
    root.removeEventListener('spw:variant-selected', onVariantSelected);
    root.removeEventListener('spw:image-lens', onImageLens, true);
    root.removeEventListener('spw:scene-enter', onSceneEnter);
    delete window.__SPW_SCENE_INTERACTION__;
    delete window.spwSceneInteraction;
  };
}

export const spwModule = {
  updates: ['attr:data-spw-scene-active', 'attr:data-spw-scene-phase'],
  mount: (mod, ctx, root) => initSceneInteraction(root),
};