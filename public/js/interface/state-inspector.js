import {
  annotateFloatingChromeElement,
  syncFloatingChromeState,
  writeRuntimeDatasetValues,
} from '/public/js/kernel/dom-contracts.js';
import { bus } from '/public/js/kernel/bus.js';
import { collapseText as normalizeText } from '/public/js/kernel/text-normalization.js';
import {
  readJson,
  removeJson,
  STORAGE_KEYS,
  writeJson,
} from '/public/js/kernel/storage-utils.js';
import { readRoom } from '/public/js/kernel/room-signal.js';

const ROOT_ATTR = 'data-spw-state-inspector-root';
const PANEL_ID = 'spw-state-inspector-panel';
const POSITION_STORAGE_KEY = STORAGE_KEYS.STATE_SATCHEL_POSITION;
const TOGGLES = [
  {
    key: 'debug',
    label: 'Inspect seams',
    datasetKey: 'spwDebugMode',
    on: 'on',
    off: null,
    dimension: 'accessibility inspectability layout',
  },
  {
    key: 'mounts',
    label: 'Show mounts',
    datasetKey: 'spwModuleVisuals',
    on: 'on',
    off: null,
    dimension: 'runtime feature-trigger layer',
  },
  {
    key: 'metadata',
    label: 'Show tags',
    datasetKey: 'spwShowSemanticMetadata',
    on: 'on',
    off: null,
    dimension: 'semantic-density component-tags',
  },
  {
    key: 'learning',
    label: 'Learning toasts',
    datasetKey: 'spwFeatureLearning',
    on: null,
    off: 'off',
    dimension: 'feedback discovery learnability',
    inverted: true,
  },
];

// Which toggle actually earns its keep depends on the room: a lab/workshop
// page wants runtime mounts visible; a reading/field-guide page wants
// learning toasts; an atlas/reference page wants semantic tags. Coarse on
// purpose — a family-name substring check, not a lookup table to maintain
// in lockstep with page-template-authoring.spw's full personality set.
function relevantToggleKeyForFamily(family = '') {
  if (/lab|workshop|toolbench|studio/.test(family)) return 'mounts';
  if (/reading|field-guide|topic|glossary/.test(family)) return 'learning';
  if (/atlas|curriculum|operator|spec/.test(family)) return 'metadata';
  return '';
}

function writeSatchelState(root, entries, reason) {
  if (!(root instanceof HTMLElement)) return;
  writeRuntimeDatasetValues(root, entries, {
    source: 'state-inspector',
    reason,
  });
}

function getToggleState(config) {
  const value = document.documentElement.dataset[config.datasetKey];
  return config.inverted ? value !== config.off : value === config.on;
}

function syncSatchelMaterial(root, launch, panel) {
  const base = document.documentElement.dataset.spwBaseMetamaterial
    || document.documentElement.dataset.spwMetamaterial
    || 'glass';

  if (root) root.dataset.spwMetamaterial = base;
  if (panel) panel.dataset.spwMetamaterial = base;
  if (launch) launch.dataset.spwMetamaterial = base;

  root
    ?.querySelectorAll?.('[data-spw-floating-chrome]')
    .forEach((element) => {
      element.dataset.spwMetamaterial = base;
    });
}

// --- Lightweight satchel position persistence + drag support ---

function loadSavedPosition() {
  const pos = readJson(POSITION_STORAGE_KEY, null, { requireObject: true });
  if (typeof pos?.left === 'number' && typeof pos?.top === 'number') {
    return { left: pos.left, top: pos.top };
  }
  return null;
}

function savePosition(left, top) {
  return writeJson(POSITION_STORAGE_KEY, { left, top });
}

function clearSavedPosition() {
  return removeJson(POSITION_STORAGE_KEY);
}

function readRootRemPx(value, fallbackRem = 0) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return fallbackRem * 16;
  const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  if (trimmed.endsWith('rem')) return parseFloat(trimmed) * rootSize;
  if (trimmed.endsWith('px')) return parseFloat(trimmed);
  const numeric = Number.parseFloat(trimmed);
  return Number.isFinite(numeric) ? numeric : fallbackRem * rootSize;
}

function getViewportBox() {
  const viewport = window.visualViewport;
  return {
    width: Math.max(1, Math.min(
      viewport?.width || Number.POSITIVE_INFINITY,
      window.innerWidth || Number.POSITIVE_INFINITY,
      document.documentElement?.clientWidth || Number.POSITIVE_INFINITY
    )),
    height: Math.max(1, Math.min(
      viewport?.height || Number.POSITIVE_INFINITY,
      window.innerHeight || Number.POSITIVE_INFINITY,
      document.documentElement?.clientHeight || Number.POSITIVE_INFINITY
    )),
  };
}

function isVisibleChromeElement(element) {
  if (!(element instanceof HTMLElement)) return false;
  if (element.closest?.(`[${ROOT_ATTR}]`)) return false;
  if (element.hidden || element.getAttribute('aria-hidden') === 'true') return false;
  if (element.dataset.spwHandleState === 'hidden') return false;

  const style = getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;

  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function getExternalBottomChromeReserve() {
  const { height } = getViewportBox();
  const selectors = [
    '.spw-console',
    '.spw-section-handle[data-spw-handle-state="visible"]',
    '.spw-section-handle-shell[data-spw-handle-state="visible"]',
    '.spw-cauldron-chip:not([hidden])',
    '[data-pwa-toast="install"]',
    '[data-spw-discovery-notice-stack]',
    '[data-spw-discovery-credits]',
    '[data-spw-state-inspector-root][data-spw-state-inspector="open"]',
  ];

  return selectors
    .flatMap((selector) => Array.from(document.querySelectorAll(selector)))
    .filter(isVisibleChromeElement)
    .reduce((reserve, element) => {
      const rect = element.getBoundingClientRect();
      if (rect.bottom <= 0 || rect.top >= height) return reserve;
      return Math.max(reserve, height - rect.top + 12);
    }, 0);
}

function getFloatingChromeTopReserve() {
  const candidates = Array.from(document.querySelectorAll('.site-header, body > header'));
  return candidates
    .filter(isVisibleChromeElement)
    .reduce((reserve, element) => {
      const rect = element.getBoundingClientRect();
      if (rect.bottom <= 0 || rect.top > 12) return reserve;
      return Math.max(reserve, rect.bottom + 8);
    }, 8);
}

function getFloatingChromeBottomReserve() {
  const externalReserve = getExternalBottomChromeReserve();
  if (!window.matchMedia('(max-width: 720px)').matches) {
    return externalReserve;
  }
  const style = getComputedStyle(document.documentElement);
  const handle = readRootRemPx(style.getPropertyValue('--touch-target-compact'), 2.15);
  const handleOffset = readRootRemPx(style.getPropertyValue('--attention-handle-offset'), 1);
  return Math.max(externalReserve, handle + handleOffset + 12);
}

function shouldSnapSatchelOnRelease() {
  return window.matchMedia('(max-width: 720px), (pointer: coarse)').matches;
}

function isMobileSatchelViewport() {
  return window.matchMedia('(max-width: 720px), (pointer: coarse)').matches;
}

function clearSatchelInlinePosition(root) {
  if (!(root instanceof HTMLElement)) return;
  root.style.position = '';
  root.style.left = '';
  root.style.top = '';
  root.style.right = '';
  root.style.bottom = '';
  root.style.transform = '';
  root.style.inlineSize = '';
  root.style.maxBlockSize = '';
  delete root.dataset.spwSatchelRail;
}

function syncInspectorBottomLane(reason = 'state-inspector') {
  syncFloatingChromeState(document, {
    source: 'state-inspector',
    reason,
  });
}

function anchorSatchelToChromeRail(root, { open = false } = {}) {
  const launch = root.querySelector('.spw-state-inspector__launch');
  if (!(launch instanceof HTMLElement)) return;

  if (open) {
    clearSatchelInlinePosition(root);
    writeSatchelState(root, {
      spwSatchelAnchor: 'chrome-rail',
      spwSatchelSnap: isMobileSatchelViewport() ? 'bottom-rail' : 'bottom-right-rail',
    }, 'satchel-anchor-open');
    syncInspectorBottomLane('satchel-anchor-open');
    return;
  }

  if (!isMobileSatchelViewport()) {
    writeSatchelState(root, {
      spwSatchelAnchor: null,
      spwSatchelSnap: null,
    }, 'satchel-anchor-desktop');
    return;
  }

  if (root.dataset.spwSatchelPositioned !== 'user') {
    clearSatchelInlinePosition(root);
    writeSatchelState(root, {
      spwSatchelAnchor: 'chrome-rail-closed',
      spwSatchelSnap: 'bottom-right',
    }, 'satchel-anchor-closed');
    syncInspectorBottomLane('satchel-anchor-closed');
    return;
  }

  writeSatchelState(root, { spwSatchelAnchor: null }, 'satchel-anchor-user');
  const rect = launch.getBoundingClientRect();
  const snapped = snapSatchelPosition(launch, rect.left, rect.top);
  applyPositionToLaunch(launch, snapped.left, snapped.top, false);
  syncInspectorBottomLane('satchel-anchor-user');
}

function mountDefaultMobileSatchel(root) {
  const launch = root.querySelector('.spw-state-inspector__launch');
  if (!(launch instanceof HTMLElement)) return;
  if (!isMobileSatchelViewport()) return;
  if (root.dataset.spwSatchelPositioned === 'user') return;

  clearSatchelInlinePosition(root);
  writeSatchelState(root, {
    spwSatchelAnchor: 'chrome-rail-closed',
    spwSatchelSnap: 'bottom-right',
  }, 'satchel-default-mobile');
  syncInspectorBottomLane('satchel-default-mobile');
}

function formatPageStateLabel() {
  const html = document.documentElement;
  const pageState = html.dataset.spwPageState || 'booting';
  const sectionToken = html.dataset.spwPageSectionCurrent || '';
  const sectionPhase = html.dataset.spwPageSectionPhase || '';
  const bits = [pageState];
  if (sectionToken) bits.push(sectionToken.replace(/\s+/g, '_'));
  if (sectionPhase && sectionPhase !== 'settled') bits.push(sectionPhase);
  return bits.join(' · ');
}

function syncSatchelRoom(root) {
  if (!(root instanceof HTMLElement)) return;

  const room = readRoom(root);
  if (room.family) root.dataset.spwRoomFamily = room.family;
  else delete root.dataset.spwRoomFamily;
  if (room.region) root.dataset.spwRoomRegion = room.region;
  else delete root.dataset.spwRoomRegion;
  if (room.accent) root.style.setProperty('--spw-room-accent', room.accent);
  else root.style.removeProperty('--spw-room-accent');

  const relevantKey = relevantToggleKeyForFamily(room.family);
  root.querySelectorAll('[data-spw-state-toggle]').forEach((node) => {
    const key = node.getAttribute('data-spw-state-toggle');
    node.dataset.spwRoomRelevant = key && key === relevantKey ? 'true' : 'false';
  });
}

function syncPageStateAwareness(root) {
  if (!(root instanceof HTMLElement)) return;
  const launch = root.querySelector('.spw-state-inspector__launch');
  const status = root.querySelector('[data-spw-state-inspector-status]');
  const label = formatPageStateLabel();
  root.dataset.spwPageStateMirror = label;
  syncSatchelRoom(root);
  if (launch instanceof HTMLElement) {
    launch.dataset.spwPageStateMirror = label;
    launch.setAttribute(
      'aria-description',
      `Page state ${label}. Drag to reposition on coarse pointers; double-tap area near edges to snap.`
    );
  }
  if (status instanceof HTMLElement && root.dataset.spwStateInspector !== 'open') {
    status.textContent = label;
  }
}

function snapSatchelPosition(launch, left, top) {
  if (!shouldSnapSatchelOnRelease()) {
    return { left, top };
  }

  const root = launch.closest?.(`[${ROOT_ATTR}]`);
  if (!(root instanceof HTMLElement)) {
    return { left, top };
  }

  const { width: vw, height: vh } = getViewportBox();
  const rect = launch.getBoundingClientRect();
  const w = rect.width || 120;
  const h = rect.height || 36;
  const margin = 12;
  const bottomReserve = getFloatingChromeBottomReserve();
  const topReserve = getFloatingChromeTopReserve();

  const candidates = shouldSnapSatchelOnRelease()
    ? [
      { left: margin, top: vh - h - margin - bottomReserve, edge: 'bottom-left' },
      { left: vw - w - margin, top: vh - h - margin - bottomReserve, edge: 'bottom-right' },
    ]
    : [
      { left: margin, top: topReserve, edge: 'top-left' },
      { left: vw - w - margin, top: topReserve, edge: 'top-right' },
      { left: margin, top: vh - h - margin - bottomReserve, edge: 'bottom-left' },
      { left: vw - w - margin, top: vh - h - margin - bottomReserve, edge: 'bottom-right' },
    ];

  const centerX = left + w / 2;
  const centerY = top + h / 2;
  let nearest = candidates[0];
  let nearestDistance = Number.POSITIVE_INFINITY;

  candidates.forEach((candidate) => {
    const distance = Math.hypot(
      centerX - (candidate.left + w / 2),
      centerY - (candidate.top + h / 2)
    );
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = candidate;
    }
  });

  root.dataset.spwSatchelSnap = nearest.edge;
  return { left: nearest.left, top: nearest.top };
}

function getSatchelSnapPosition(launch, edge = 'bottom-right') {
  const { width: vw, height: vh } = getViewportBox();
  const rect = launch.getBoundingClientRect();
  const w = rect.width || 120;
  const h = rect.height || 36;
  const margin = 12;
  const topReserve = getFloatingChromeTopReserve();
  const bottomTop = vh - h - margin - getFloatingChromeBottomReserve();

  const positions = {
    'top-left': { left: margin, top: topReserve },
    'top-right': { left: vw - w - margin, top: topReserve },
    'bottom-left': { left: margin, top: bottomTop },
    'bottom-right': { left: vw - w - margin, top: bottomTop },
  };

  return positions[edge] || positions['bottom-right'];
}

function sanitizeRestoredPosition(left, top, width, height, viewportWidth, viewportHeight) {
  const margin = 12;
  const topReserve = getFloatingChromeTopReserve();
  const bottomReserve = getFloatingChromeBottomReserve();
  const bottomRailTop = viewportHeight - height - margin - bottomReserve;
  const main = document.querySelector('main');
  const mainRect = main instanceof HTMLElement ? main.getBoundingClientRect() : null;
  const overlapsMain = mainRect
    ? left + width > mainRect.left + 12
      && left < mainRect.right - 12
      && top + height > mainRect.top + 48
      && top < mainRect.bottom - 72
    : false;
  const sitsAboveBottomRail = isMobileSatchelViewport() && top < bottomRailTop - height;

  if (!overlapsMain && !sitsAboveBottomRail) {
    return { left, top };
  }

  return {
    left: viewportWidth - width - margin,
    top: Math.max(topReserve, bottomRailTop),
  };
}

function applyPositionToLaunch(launch, left, top, fallback = false) {
  if (!launch) return;
  const root = launch.closest?.(`[${ROOT_ATTR}]`);
  if (!(root instanceof HTMLElement)) return;

  if (root.dataset.spwSatchelAnchor === 'chrome-rail' || root.dataset.spwStateInspector === 'open') {
    if (isMobileSatchelViewport()) return;
  }

  const { width: vw, height: vh } = getViewportBox();
  const rect = launch.getBoundingClientRect();
  const rootRect = root.getBoundingClientRect();
  const w = rect.width || 120;
  const h = rect.height || 36;
  const rootW = Math.min(rootRect.width || 400, Math.max(1, vw - 16));

  const margin = 8;
  const bottomReserve = getFloatingChromeBottomReserve();
  const topReserve = getFloatingChromeTopReserve();
  let nextLeft = left;
  let nextTop = top;
  if (fallback) {
    const sanitized = sanitizeRestoredPosition(left, top, w, h, vw, vh);
    if (sanitized.left !== left || sanitized.top !== top) {
      savePosition(sanitized.left, sanitized.top);
    }
    nextLeft = sanitized.left;
    nextTop = sanitized.top;
  }
  const clampedLeft = Math.max(margin, Math.min(nextLeft, vw - w - margin));
  const clampedTop = Math.max(topReserve, Math.min(nextTop, vh - h - margin - bottomReserve));
  const rail = clampedLeft + w / 2 < vw / 2 ? 'left' : 'right';
  const rootLeft = rail === 'left'
    ? clampedLeft
    : Math.max(margin, Math.min(clampedLeft + w - rootW, vw - rootW - margin));

  root.style.position = 'fixed';
  root.style.left = `${rootLeft}px`;
  root.style.top = `${clampedTop}px`;
  root.style.right = 'auto';
  root.style.bottom = 'auto';
  root.style.transform = 'none';
  root.style.inlineSize = '';
  root.dataset.spwSatchelRail = rail;

  launch.style.position = '';
  launch.style.left = '';
  launch.style.top = '';
  launch.style.right = '';
  launch.style.bottom = '';
  launch.style.transform = '';

  if (fallback) {
    // Mark that we're using a user-dragged or restored position
    root.dataset.spwSatchelPositioned = 'user';
    launch.dataset.spwSatchelPositioned = 'user';
  }
}

function snapLaunchToEdge(root, edge = 'bottom-right') {
  const launch = root?.querySelector?.('.spw-state-inspector__launch');
  if (!(root instanceof HTMLElement) || !(launch instanceof HTMLElement)) return;

  delete root.dataset.spwSatchelAnchor;
  root.dataset.spwSatchelRail = edge.includes('left') ? 'left' : 'right';
  const position = getSatchelSnapPosition(launch, edge);
  applyPositionToLaunch(launch, position.left, position.top, true);
  const settled = launch.getBoundingClientRect();
  savePosition(settled.left, settled.top);
  root.dataset.spwSatchelSnap = edge;
  root.dataset.spwSatchelPositioned = 'user';
  launch.dataset.spwSatchelPositioned = 'user';
}

function resetLaunchToDefault(launch) {
  if (!launch) return;
  const root = launch.closest?.(`[${ROOT_ATTR}]`);
  if (root instanceof HTMLElement) {
    clearSatchelInlinePosition(root);
    delete root.dataset.spwSatchelPositioned;
    delete root.dataset.spwSatchelSnap;
    delete root.dataset.spwSatchelAnchor;
    delete root.dataset.spwSatchelRail;
  }
  launch.style.position = '';
  launch.style.left = '';
  launch.style.top = '';
  launch.style.right = '';
  launch.style.bottom = '';
  launch.style.transform = '';
  delete launch.dataset.spwSatchelPositioned;
  clearSavedPosition();
}

function restoreSavedLaunchPosition(root) {
  if (!(root instanceof HTMLElement)) return false;
  if (root.dataset.spwSatchelPositioned !== 'user') return false;

  const launch = root.querySelector('.spw-state-inspector__launch');
  const saved = loadSavedPosition();
  if (!(launch instanceof HTMLElement) || !saved) return false;

  delete root.dataset.spwSatchelAnchor;
  applyPositionToLaunch(launch, saved.left, saved.top, true);
  return true;
}

function setToggleState(config, enabled) {
  const value = config.inverted
    ? (enabled ? null : config.off)
    : (enabled ? config.on : config.off);
  writeRuntimeDatasetValues(document.documentElement, {
    [config.datasetKey]: value,
    spwStateInspectorChanged: config.key,
    spwStateSerializationDimensions: TOGGLES.map((entry) => entry.dimension).join(' | '),
  }, {
    source: 'state-inspector',
    reason: 'state-toggle',
  });
}

function snapshotStateDimensions() {
  const root = document.documentElement;
  const body = document.body;
  const pickDataset = (dataset = {}, prefix = 'spw') => Object.fromEntries(
    Object.entries(dataset)
      .filter(([key]) => key.startsWith(prefix))
      .sort(([a], [b]) => a.localeCompare(b))
  );

  return {
    route: window.location.pathname,
    hash: window.location.hash || '',
    accessibility: {
      reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false,
      forcedColors: window.matchMedia?.('(forced-colors: active)').matches || false,
      activeElement: document.activeElement?.tagName?.toLowerCase() || '',
    },
    layering: {
      floatingChrome: [...document.querySelectorAll('[data-spw-floating-chrome="true"]')].map((el) => ({
        role: el.dataset.spwChromeRole || '',
        tier: el.dataset.spwChromeTier || '',
        z: getComputedStyle(el).zIndex,
      })),
    },
    runtime: {
      modules: window.__SPW_SITE__?.snapshotModules?.() || [],
      resources: window.__SPW_SITE__?.discoverRuntimeResources?.() || [],
      deepLinks: window.__SPW_SITE__?.discoverDeepLinks?.() || [],
      beats: window.__SPW_SITE__?.beats?.listActive?.() || (window.__SPW_SITE__?.beats?.snapshot?.() || null),
      // Rich positional/time context from latest beat artifacts (when available)
      positionContext: (window.__SPW_SITE__?.beats?.snapshot?.()?.lastContext || null),
    },
    pageAnatomy: {
      snapshot: window.__SPW_PAGE_ANATOMY__?.snapshot?.() || null,
      spw: window.__SPW_PAGE_ANATOMY__?.serialize?.() || '',
    },
    topicalPayload: {
      snapshot: window.__SPW_TOPICAL_PAYLOAD__?.snapshot?.() || null,
      spw: window.__SPW_TOPICAL_PAYLOAD__?.serialize?.() || '',
    },
    state: {
      html: pickDataset(root.dataset),
      body: pickDataset(body?.dataset || {}),
    },
    appearance: (window.spwSettings && typeof window.spwSettings.get === 'function')
      ? (() => {
          const s = window.spwSettings.get();
          // Reasonable default visual/appearance slice for satchel observability + templating convenience.
          return {
            colorMode: s.colorMode,
            themePack: s.themePack,
            baseMetamaterial: s.baseMetamaterial,
            highContrast: s.highContrast,
            fontSizeScale: s.fontSizeScale,
            physicsReason: s.physicsReason, // flexible interaction physics for gamified nav research + locality observability
            fontSize: s.fontSize,
            semanticDensity: s.semanticDensity,
            operatorSaturation: s.operatorSaturation,
            grainIntensity: s.grainIntensity,
            // etc; full settings available via get but this is the "shell utility" relevant subset
          };
        })()
      : null,
    // Cognitive and attentional physics models (minds attention-field, wonder-vocabulary, cognitive-navigation, material tunability).
    // Satchel and utilities must surface these so drag/tap/hold interactions are part of the field, not outside it.
    cognitive: {
      attention: root.dataset.spwAttention || '',
      wonderState: root.dataset.spwWonderState || root.dataset.spwWonderMemory || '',
      fieldResonance: root.dataset.spwFieldResonance || '',
      physicsReason: root.dataset.spwPhysicsReason || (window.spwSettings?.get?.()?.physicsReason || ''),
      semanticDensity: root.dataset.spwSemanticDensity || (window.spwSettings?.get?.()?.semanticDensity || ''),
      metamaterial: root.dataset.spwBaseMetamaterial || root.dataset.spwMetamaterial || 'glass',
      locality: root.dataset.spwLocality || '',
    },
  };
}

function emitFeedback(message, action = 'inspect') {
  bus.emit('state-inspector:feedback', {
    message,
    action,
    dimensions: TOGGLES.map((entry) => entry.dimension),
  });
  document.dispatchEvent(new CustomEvent('spw:discovery-reward', {
    detail: {
      label: 'State satchel',
      title: 'State changed',
      summary: message,
      href: `${window.location.pathname}${window.location.hash || ''}`,
      cta: 'Stay here',
      why: 'State changes are transient and visible in the document dataset.',
      presentation: 'toast',
      cadence: 'learning',
      source: 'state-inspector',
      promotion: {
        kind: 'learning',
        theme: 'glass',
        handles: ['state', action, 'feedback'],
        rewardKind: 'state-literacy',
        productionSeed: action,
      },
    },
  }));
}

function updateStatus(root, message) {
  const status = root.querySelector('[data-spw-state-inspector-status]');
  if (status) status.textContent = message;
}

function syncControls(root) {
  TOGGLES.forEach((config) => {
    const button = root.querySelector(`[data-spw-state-toggle="${config.key}"]`);
    if (!(button instanceof HTMLButtonElement)) return;
    const enabled = getToggleState(config);
    button.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    button.dataset.spwStateToggleState = enabled ? 'on' : 'off';
  });
}

function createToggleButton(config) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'operator-chip spw-state-inspector__toggle';
  button.dataset.spwStateToggle = config.key;
  button.dataset.spwStateDimension = config.dimension;
  button.textContent = config.label;
  return button;
}

function createInspector() {
  const root = document.createElement('aside');
  const launch = document.createElement('button');
  const panel = document.createElement('div');
  const title = document.createElement('h2');
  const summary = document.createElement('p');
  const actions = document.createElement('div');
  const copy = document.createElement('button');
  const copySpw = document.createElement('button');
  const positionActions = document.createElement('div');
  const status = document.createElement('p');
  const close = document.createElement('button');

  root.className = 'spw-state-inspector';
  root.setAttribute(ROOT_ATTR, '');
  root.dataset.spwStateInspector = 'closed';
  root.dataset.spwStateSerialization = 'route runtime accessibility layering interaction';
  root.dataset.spwDismissible = 'panel';
  annotateFloatingChromeElement(root, {
    role: 'state-inspector',
    island: 'state-satchel',
    tier: 'drawer',
    mutator: 'state-inspector',
    reason: 'state-inspection-controls',
    stylingAxis: 'state-inspector',
  });
  root.dataset.spwSnap = 'corners';
  root.dataset.spwChromeFluid = 'springy';

  syncSatchelMaterial(root, launch, panel);

  launch.type = 'button';
  launch.className = 'spw-state-inspector__launch';
  launch.setAttribute('aria-expanded', 'false');
  launch.setAttribute('aria-controls', PANEL_ID);
  launch.textContent = 'state satchel';
  launch.dataset.spwDragState = 'idle'; // explicit initial state

  panel.id = PANEL_ID;
  panel.className = 'spw-state-inspector__panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'false');
  panel.setAttribute('aria-labelledby', 'spw-state-inspector-title');
  panel.tabIndex = -1;
  panel.hidden = true;

  title.id = 'spw-state-inspector-title';
  title.textContent = 'State satchel';

  summary.className = 'spw-state-inspector__summary';
  summary.textContent = 'Inspect and nudge temporary page state. Changes are announced and visible as data-spw-* attributes. Drag or snap the satchel to a clear rail when it competes with reading.';

  actions.className = 'spw-state-inspector__actions';
  TOGGLES.forEach((config) => actions.append(createToggleButton(config)));

  copy.type = 'button';
  copy.className = 'operator-chip';
  copy.dataset.spwStateInspectorCopy = 'snapshot';
  copy.textContent = 'copy snapshot';

  copySpw.type = 'button';
  copySpw.className = 'operator-chip';
  copySpw.dataset.spwStateInspectorCopy = 'page-spw';
  copySpw.textContent = 'copy page Spw';

  close.type = 'button';
  close.className = 'operator-chip';
  close.dataset.spwStateInspectorClose = 'true';
  close.textContent = 'close';

  positionActions.className = 'spw-state-inspector__position-actions';
  positionActions.setAttribute('aria-label', 'Satchel position');

  ['bottom-left', 'bottom-right'].forEach((edge) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'operator-chip spw-state-inspector__position';
    button.dataset.spwStateInspectorPosition = edge;
    button.textContent = edge === 'bottom-left' ? 'lower left' : 'lower right';
    positionActions.append(button);
  });

  const resetPos = document.createElement('button');
  resetPos.type = 'button';
  resetPos.className = 'operator-chip spw-state-inspector__reset-pos';
  resetPos.dataset.spwStateInspectorResetPosition = 'true';
  resetPos.textContent = 'reset rail';
  positionActions.append(resetPos);

  status.className = 'spw-state-inspector__status';
  status.dataset.spwStateInspectorStatus = '';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.textContent = 'Closed.';

  const shareHost = document.createElement('section');
  shareHost.className = 'spw-query-composer spw-query-composer--chrome spw-state-inspector__share';
  shareHost.setAttribute('data-spw-query-composer', '');
  shareHost.dataset.spwFeature = 'query-composer';
  shareHost.dataset.spwQueryComposerCompact = 'true';
  shareHost.dataset.spwQueryComposerExpanded = 'false';
  shareHost.setAttribute('data-spw-query-composer-label', 'satchel share setup');
  shareHost.setAttribute('data-spw-box-model', 'control-card');
  const shareKicker = document.createElement('p');
  shareKicker.className = 'spw-query-composer__kicker';
  shareKicker.textContent = 'Share setup · query';
  const shareNote = document.createElement('p');
  shareNote.className = 'spw-query-composer__note';
  shareNote.textContent = 'Expand to build a link. Offer to cauldron joins spells/collectibles.';
  shareHost.append(shareKicker, shareNote);

  panel.append(title, summary, actions, shareHost, positionActions, copy, copySpw, close, status);
  root.append(launch, panel);
  return root;
}

function ensureSatchelQueryComposer(root) {
  const host = root.querySelector?.('[data-spw-query-composer]');
  if (!(host instanceof HTMLElement) || host.dataset.spwQueryComposerBound === 'true') return;

  import('/public/js/runtime/query-link-composer.js')
    .then((mod) => {
      mod.hydrateQueryComposer?.(host);
      mod.bindQueryComposers?.(root);
    })
    .catch(() => {
      /* composer optional if chunk fails */
    });
}

function setOpen(root, open) {
  const launch = root.querySelector('.spw-state-inspector__launch');
  const panel = root.querySelector('.spw-state-inspector__panel');
  if (!(launch instanceof HTMLButtonElement) || !(panel instanceof HTMLElement)) return;
  root.dataset.spwStateInspector = open ? 'open' : 'closed';
  launch.setAttribute('aria-expanded', open ? 'true' : 'false');
  panel.hidden = !open;
  updateStatus(root, open ? 'State satchel opened.' : formatPageStateLabel());
  if (open) {
    anchorSatchelToChromeRail(root, { open: true });
    syncControls(root);
    syncPageStateAwareness(root);
    ensureSatchelQueryComposer(root);
    panel.focus({ preventScroll: true });
    syncInspectorBottomLane('inspector-open');
    return;
  }

  if (isMobileSatchelViewport()) {
    requestAnimationFrame(() => {
      if (restoreSavedLaunchPosition(root)) {
        syncPageStateAwareness(root);
        syncInspectorBottomLane('inspector-closed-saved');
        return;
      }
      anchorSatchelToChromeRail(root, { open: false });
      syncPageStateAwareness(root);
      syncInspectorBottomLane('inspector-closed-mobile');
    });
    return;
  }

  if (restoreSavedLaunchPosition(root)) {
    syncPageStateAwareness(root);
    syncInspectorBottomLane('inspector-closed-saved');
    return;
  }

  delete root.dataset.spwSatchelAnchor;
  syncPageStateAwareness(root);
  syncInspectorBottomLane('inspector-closed');
}

async function copySnapshot(root) {
  const snapshot = snapshotStateDimensions();
  const serialized = JSON.stringify(snapshot, null, 2);
  try {
    await navigator.clipboard?.writeText(serialized);
    updateStatus(root, 'Copied state snapshot.');
    emitFeedback('Copied a state snapshot with route, accessibility, layering, runtime (incl. beats), and dataset dimensions.', 'copy');
  } catch {
    updateStatus(root, 'Snapshot ready in console.');
    console.info('[state inspector snapshot]', snapshot);
    emitFeedback('Clipboard unavailable. Snapshot logged to console instead.', 'console');
  }
}

async function copyPageSpw(root) {
  const serialized = window.__SPW_PAGE_ANATOMY__?.serialize?.();
  if (!serialized) {
    updateStatus(root, 'Page Spw serializer is not available on this route.');
    emitFeedback('Page Spw serializer is not available on this route.', 'copy');
    return;
  }

  try {
    await navigator.clipboard?.writeText(serialized);
    updateStatus(root, 'Copied page Spw.');
    emitFeedback('Copied the page anatomy serialization as Spw.', 'copy');
  } catch {
    updateStatus(root, 'Page Spw ready in console.');
    console.info('[page anatomy spw]', serialized);
    emitFeedback('Clipboard unavailable. Page Spw logged to console instead.', 'console');
  }
}

function bindInspector(root) {
  const handleClick = (event) => {
    if (!(event.target instanceof Element)) return;

    // Satchel launch button click (only toggles panel if not currently dragging)
    if (event.target.closest('.spw-state-inspector__launch')) {
      const launch = event.target.closest('.spw-state-inspector__launch');
      if (launch && launch.dataset.spwDragging === 'true') return; // ignore click at end of drag
      setOpen(root, root.dataset.spwStateInspector !== 'open');
      return;
    }

    if (event.target.closest('[data-spw-state-inspector-close]')) {
      setOpen(root, false);
      return;
    }

    const toggle = event.target.closest('[data-spw-state-toggle]');
    if (toggle instanceof HTMLButtonElement) {
      const config = TOGGLES.find((entry) => entry.key === toggle.dataset.spwStateToggle);
      if (!config) return;
      const next = !getToggleState(config);
      setToggleState(config, next);
      syncControls(root);
      const message = `${config.label} ${next ? 'enabled' : 'disabled'}.`;
      updateStatus(root, message);
      emitFeedback(message, config.key);
      return;
    }

    const copyButton = event.target.closest('[data-spw-state-inspector-copy]');
    if (copyButton instanceof HTMLButtonElement) {
      if (copyButton.dataset.spwStateInspectorCopy === 'page-spw') {
        void copyPageSpw(root);
        return;
      }
      void copySnapshot(root);
      return;
    }

    const positionButton = event.target.closest('[data-spw-state-inspector-position]');
    if (positionButton instanceof HTMLButtonElement) {
      const edge = positionButton.dataset.spwStateInspectorPosition || 'bottom-right';
      setOpen(root, false);
      requestAnimationFrame(() => {
        snapLaunchToEdge(root, edge);
        syncPageStateAwareness(root);
      });
      updateStatus(root, `Satchel snapped to ${edge.replace('-', ' ')}.`);
      return;
    }

    if (event.target.closest('[data-spw-state-inspector-reset-position]')) {
      const launchBtn = root.querySelector('.spw-state-inspector__launch');
      resetLaunchToDefault(launchBtn);
      if (root.dataset.spwStateInspector === 'open') {
        anchorSatchelToChromeRail(root, { open: true });
      } else {
        requestAnimationFrame(() => {
          anchorSatchelToChromeRail(root, { open: false });
          syncPageStateAwareness(root);
        });
      }
      updateStatus(root, 'Satchel position reset.');
      return;
    }
  };

  const handleKeydown = (event) => {
    if (event.key === 'Escape' && root.dataset.spwStateInspector === 'open') {
      setOpen(root, false);
    }
  };

  root.addEventListener('click', handleClick);
  window.addEventListener('keydown', handleKeydown);

  return () => {
    root.removeEventListener('click', handleClick);
    window.removeEventListener('keydown', handleKeydown);
  };
}

// --- Lightweight drag support for the satchel launch button ---

const SATCHEL_DRAG_SLOP_PX = 6;
const SATCHEL_FLING_PROJECTION_MS = 120;
const SATCHEL_FLING_MAX_PROJECTION_PX = 320;

function bindSatchelDrag(root) {
  const launch = root.querySelector('.spw-state-inspector__launch');
  if (!launch) return () => {};

  let pressed = false;
  let dragging = false;
  let activePointerId = null;
  let startX = 0, startY = 0;
  let startLeft = 0, startTop = 0;
  let lastX = 0, lastY = 0, lastT = 0;
  let velocityX = 0, velocityY = 0;
  let rafId = null;

  const updateDragPosition = (newLeft, newTop) => {
    applyPositionToLaunch(launch, newLeft, newTop, true);
  };

  const beginDrag = () => {
    dragging = true;
    launch.dataset.spwDragState = 'dragging';
    launch.dataset.spwDragging = 'true'; // the click handler reads this to swallow the post-drag click
    root.dataset.spwDragState = 'dragging'; // explicit state on container for broader styling
    // Mind attentional physics during drag (tap/hold/drag are gestures in the field model; drag here is
    // repositioning the satchel "mass" within the attention field). Use data attrs so CSS/inspect
    // (wonder, ornament) can respond; this makes satchel a first-class participant in cognitive physics.
    launch.dataset.spwGesture = 'drag';
    launch.dataset.spwAttention = 'sustained';
  };

  const onPointerDown = (e) => {
    if (!e.isPrimary || e.button !== 0) return;
    if (root.dataset.spwStateInspector === 'open') return;

    pressed = true;
    activePointerId = e.pointerId;
    startX = lastX = e.clientX;
    startY = lastY = e.clientY;
    lastT = e.timeStamp;
    velocityX = 0;
    velocityY = 0;

    const rect = launch.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;

    launch.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!pressed || e.pointerId !== activePointerId) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    // Slop gate: a press only becomes a drag after deliberate movement, so a
    // tap stays a tap and never gets charged as a drag gesture.
    if (!dragging) {
      if (Math.hypot(dx, dy) < SATCHEL_DRAG_SLOP_PX) return;
      beginDrag();
    }

    const dt = e.timeStamp - lastT;
    if (dt > 0) {
      velocityX = (e.clientX - lastX) / dt;
      velocityY = (e.clientY - lastY) / dt;
      lastX = e.clientX;
      lastY = e.clientY;
      lastT = e.timeStamp;
    }

    const newLeft = startLeft + dx;
    const newTop = startTop + dy;

    // Smooth updates via rAF
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      updateDragPosition(newLeft, newTop);
    });
  };

  const onPointerUp = (e) => {
    if (!pressed || e.pointerId !== activePointerId) return;
    pressed = false;
    activePointerId = null;

    try {
      launch.releasePointerCapture?.(e.pointerId);
    } catch {}

    if (!dragging) return; // plain tap: leave the click to the toggle handler

    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    dragging = false;
    launch.dataset.spwDragState = 'idle';
    delete root.dataset.spwDragState;
    // Clear attentional/gesture markers on release (field model decay; satchel no longer "charged" by the drag gesture).
    delete launch.dataset.spwGesture;
    delete launch.dataset.spwAttention;

    const rect = launch.getBoundingClientRect();
    // Honor the toss: project the release point a beat along the fling
    // velocity so a throw toward a corner snaps where the finger was headed,
    // not just where it let go.
    const project = (v) => Math.max(
      -SATCHEL_FLING_MAX_PROJECTION_PX,
      Math.min(SATCHEL_FLING_MAX_PROJECTION_PX, v * SATCHEL_FLING_PROJECTION_MS)
    );
    const snapped = snapSatchelPosition(launch, rect.left + project(velocityX), rect.top + project(velocityY));
    if (snapped.left !== rect.left || snapped.top !== rect.top) {
      applyPositionToLaunch(launch, snapped.left, snapped.top, true);
    }
    const settled = launch.getBoundingClientRect();
    savePosition(settled.left, settled.top);

    // The click for this pointerup dispatches synchronously after this handler,
    // so spwDragging must outlive it — clear on the next task, not inline.
    setTimeout(() => {
      delete launch.dataset.spwDragging;
      if (launch.dataset.spwDragState === 'idle') {
        delete launch.dataset.spwDragState;
      }
    }, 0);
  };

  launch.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', onPointerUp, { passive: true });
  window.addEventListener('pointercancel', onPointerUp, { passive: true });

  return () => {
    launch.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
    if (rafId) cancelAnimationFrame(rafId);
  };
}

export function initStateInspector() {
  if (document.body?.dataset?.spwStateInspector === 'off') return () => {};
  if (document.querySelector(`[${ROOT_ATTR}]`)) return () => {};

  const root = createInspector();
  const host = document.body || document.documentElement;
  host.append(root);

  // Restore any previously dragged position for the satchel launch button
  const launch = root.querySelector('.spw-state-inspector__launch');
  const saved = loadSavedPosition();
  if (saved && launch) {
    requestAnimationFrame(() => {
      applyPositionToLaunch(launch, saved.left, saved.top, true);
      syncPageStateAwareness(root);
    });
  } else if (launch) {
    requestAnimationFrame(() => {
      if (isMobileSatchelViewport()) {
        mountDefaultMobileSatchel(root);
      } else {
        const r = launch.getBoundingClientRect();
        applyPositionToLaunch(launch, r.left, r.top, false);
      }
      syncPageStateAwareness(root);
    });
  }

  const cleanupBindings = bindInspector(root);
  const cleanupDrag = bindSatchelDrag(root);
  const handlePageStateAwareness = () => syncPageStateAwareness(root);
  document.addEventListener('spw:page-attention-state', handlePageStateAwareness);
  document.addEventListener('spw:page-transition-state', handlePageStateAwareness);
  document.addEventListener('spw:section-locomotion-state', handlePageStateAwareness);
  const pageStateObserver = new MutationObserver(handlePageStateAwareness);
  pageStateObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [
      'data-spw-page-state',
      'data-spw-page-section-phase',
      'data-spw-page-section-current',
      'data-spw-page-section-index',
    ],
  });
  const clampSatchelPosition = () => {
    if (root.dataset.spwStateInspector === 'open') {
      anchorSatchelToChromeRail(root, { open: true });
      return;
    }
    if (root.dataset.spwSatchelPositioned !== 'user' && isMobileSatchelViewport()) {
      mountDefaultMobileSatchel(root);
      return;
    }
    const launchButton = root.querySelector('.spw-state-inspector__launch');
    if (!(launchButton instanceof HTMLElement)) return;
    const rect = launchButton.getBoundingClientRect();
    applyPositionToLaunch(
      launchButton,
      rect.left,
      rect.top,
      root.dataset.spwSatchelPositioned === 'user'
    );
    syncInspectorBottomLane('satchel-clamp');
  };
  window.addEventListener('resize', clampSatchelPosition, { passive: true });
  window.visualViewport?.addEventListener?.('resize', clampSatchelPosition, { passive: true });
  syncControls(root);
  requestAnimationFrame(() => {
    syncInspectorBottomLane('inspector-mounted');
  });
  writeRuntimeDatasetValues(document.documentElement, {
    spwStateInspector: 'available',
    spwStateSerializationDimensions: TOGGLES.map((entry) => entry.dimension).join(' | '),
  }, {
    source: 'state-inspector',
    reason: 'inspector-mounted',
  });

  // Re-mind material + cognitive models on changes (settings, bus, attr mutations) so satchel
  // chrome and its internal snapshot stay aligned with global tunability and attentional field.
  // This makes the satchel itself a participant in the physics models (drag moves attention mass,
  // open/inspect reads the current material/attention/wonder state).
  const l = root.querySelector('.spw-state-inspector__launch');
  const p = root.querySelector('#' + PANEL_ID);
  const reapply = () => syncSatchelMaterial(root, l, p);
  document.addEventListener('spw:settings:changed', reapply, { passive: true });
  bus?.on?.('settings:changed', reapply);
  const mo = new MutationObserver(reapply);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-spw-base-metamaterial','data-spw-metamaterial','data-spw-attention','data-spw-wonder-state','data-spw-physics-reason','data-spw-high-contrast'] });

  return () => {
    cleanupBindings();
    cleanupDrag?.();
    document.removeEventListener('spw:page-attention-state', handlePageStateAwareness);
    document.removeEventListener('spw:page-transition-state', handlePageStateAwareness);
    document.removeEventListener('spw:section-locomotion-state', handlePageStateAwareness);
    pageStateObserver.disconnect();
    window.removeEventListener('resize', clampSatchelPosition);
    window.visualViewport?.removeEventListener?.('resize', clampSatchelPosition);
    mo.disconnect();
    root.remove();
    writeRuntimeDatasetValues(document.documentElement, {
      spwStateInspector: null,
    }, {
      source: 'state-inspector',
      reason: 'inspector-cleanup',
    });
  };
}

export const spwModule = {
  mount: initStateInspector,
};
