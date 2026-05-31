import {
  annotateFloatingChromeElement,
  writeRuntimeDatasetValues,
} from '/public/js/kernel/dom-contracts.js';
import { bus } from '/public/js/kernel/bus.js';

const ROOT_ATTR = 'data-spw-state-inspector-root';
const PANEL_ID = 'spw-state-inspector-panel';
const POSITION_STORAGE_KEY = 'spw-state-satchel-position';
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

function normalizeText(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function getToggleState(config) {
  const value = document.documentElement.dataset[config.datasetKey];
  return config.inverted ? value !== config.off : value === config.on;
}

// --- Lightweight satchel position persistence + drag support ---

function loadSavedPosition() {
  try {
    const raw = localStorage.getItem(POSITION_STORAGE_KEY);
    if (!raw) return null;
    const pos = JSON.parse(raw);
    if (typeof pos?.left === 'number' && typeof pos?.top === 'number') {
      return { left: pos.left, top: pos.top };
    }
  } catch {}
  return null;
}

function savePosition(left, top) {
  try {
    localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify({ left, top }));
  } catch {}
}

function clearSavedPosition() {
  try {
    localStorage.removeItem(POSITION_STORAGE_KEY);
  } catch {}
}

function applyPositionToLaunch(launch, left, top, fallback = false) {
  if (!launch) return;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const rect = launch.getBoundingClientRect();
  const w = rect.width || 120;
  const h = rect.height || 36;

  // Clamp to viewport with small margin
  const margin = 8;
  const clampedLeft = Math.max(margin, Math.min(left, vw - w - margin));
  const clampedTop = Math.max(margin, Math.min(top, vh - h - margin));

  launch.style.position = 'fixed';
  launch.style.left = `${clampedLeft}px`;
  launch.style.top = `${clampedTop}px`;
  launch.style.right = 'auto';
  launch.style.bottom = 'auto';
  launch.style.transform = 'none';

  if (fallback) {
    // Mark that we're using a user-dragged or restored position
    launch.dataset.spwSatchelPositioned = 'user';
  }
}

function resetLaunchToDefault(launch) {
  if (!launch) return;
  launch.style.position = '';
  launch.style.left = '';
  launch.style.top = '';
  launch.style.right = '';
  launch.style.bottom = '';
  launch.style.transform = '';
  delete launch.dataset.spwSatchelPositioned;
  clearSavedPosition();
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
    state: {
      html: pickDataset(root.dataset),
      body: pickDataset(body?.dataset || {}),
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
  const status = document.createElement('p');
  const close = document.createElement('button');

  root.className = 'spw-state-inspector';
  root.setAttribute(ROOT_ATTR, '');
  root.dataset.spwStateInspector = 'closed';
  root.dataset.spwStateSerialization = 'route runtime accessibility layering interaction';
  annotateFloatingChromeElement(root, {
    role: 'state-inspector',
    tier: 'drawer',
    mutator: 'state-inspector',
    reason: 'state-inspection-controls',
    stylingAxis: 'state-inspector',
  });

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
  summary.textContent = 'Inspect and nudge temporary page state. Changes are learnable, announced, and visible as data-spw-* attributes.';

  actions.className = 'spw-state-inspector__actions';
  TOGGLES.forEach((config) => actions.append(createToggleButton(config)));

  copy.type = 'button';
  copy.className = 'operator-chip';
  copy.dataset.spwStateInspectorCopy = 'snapshot';
  copy.textContent = 'copy snapshot';

  close.type = 'button';
  close.className = 'operator-chip';
  close.dataset.spwStateInspectorClose = 'true';
  close.textContent = 'close';

  // Lightweight reset for user-dragged satchel position
  const resetPos = document.createElement('button');
  resetPos.type = 'button';
  resetPos.className = 'operator-chip spw-state-inspector__reset-pos';
  resetPos.dataset.spwStateInspectorResetPosition = 'true';
  resetPos.textContent = 'Reset position';
  resetPos.style.fontSize = '0.7rem';
  resetPos.style.opacity = '0.75';

  status.className = 'spw-state-inspector__status';
  status.dataset.spwStateInspectorStatus = '';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.textContent = 'Closed.';

  panel.append(title, summary, actions, copy, close, resetPos, status);
  root.append(launch, panel);
  return root;
}

function setOpen(root, open) {
  const launch = root.querySelector('.spw-state-inspector__launch');
  const panel = root.querySelector('.spw-state-inspector__panel');
  if (!(launch instanceof HTMLButtonElement) || !(panel instanceof HTMLElement)) return;
  root.dataset.spwStateInspector = open ? 'open' : 'closed';
  launch.setAttribute('aria-expanded', open ? 'true' : 'false');
  panel.hidden = !open;
  updateStatus(root, open ? 'State satchel opened.' : 'State satchel closed.');
  if (open) {
    syncControls(root);
    panel.focus({ preventScroll: true });
  }
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

    if (event.target.closest('[data-spw-state-inspector-copy]')) {
      void copySnapshot(root);
      return;
    }

    // Lightweight "Reset satchel position" action inside the panel
    if (event.target.closest('[data-spw-state-inspector-reset-position]')) {
      const launchBtn = root.querySelector('.spw-state-inspector__launch');
      resetLaunchToDefault(launchBtn);
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

function bindSatchelDrag(root) {
  const launch = root.querySelector('.spw-state-inspector__launch');
  if (!launch) return () => {};

  let dragging = false;
  let startX = 0, startY = 0;
  let startLeft = 0, startTop = 0;
  let rafId = null;

  const updateDragPosition = (newLeft, newTop) => {
    applyPositionToLaunch(launch, newLeft, newTop, true);
  };

  const onPointerDown = (e) => {
    if (!e.isPrimary || e.button !== 0) return;
    if (root.dataset.spwStateInspector === 'open') return;

    dragging = true;
    launch.dataset.spwDragState = 'dragging';
    launch.dataset.spwDragging = 'true'; // keep legacy for now
    root.dataset.spwDragState = 'dragging'; // explicit state on container for broader styling
    startX = e.clientX;
    startY = e.clientY;

    const rect = launch.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;

    launch.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  };

  const onPointerMove = (e) => {
    if (!dragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const newLeft = startLeft + dx;
    const newTop = startTop + dy;

    // Smooth updates via rAF
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      updateDragPosition(newLeft, newTop);
    });
  };

  const onPointerUp = (e) => {
    if (!dragging) return;

    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    dragging = false;
    delete launch.dataset.spwDragging;
    launch.dataset.spwDragState = 'idle';
    delete root.dataset.spwDragState;

    // Save final position
    const rect = launch.getBoundingClientRect();
    savePosition(rect.left, rect.top);

    try {
      launch.releasePointerCapture?.(e.pointerId);
    } catch {}

    // Small delay so the click handler can see the flag
    setTimeout(() => {
      if (launch.dataset.spwDragState === 'idle') {
        delete launch.dataset.spwDragState;
      }
    }, 80);
  };

  launch.addEventListener('pointerdown', onPointerDown, { passive: false });
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
    });
  } else if (launch) {
    // Bake an explicit initial position so that enabling debug/seams (which mutates DOM)
    // does not cause the fixed element to jump due to inset recalculation.
    requestAnimationFrame(() => {
      const r = launch.getBoundingClientRect();
      applyPositionToLaunch(launch, r.left, r.top, false);
    });
  }

  const cleanupBindings = bindInspector(root);
  const cleanupDrag = bindSatchelDrag(root);
  syncControls(root);
  writeRuntimeDatasetValues(document.documentElement, {
    spwStateInspector: 'available',
    spwStateSerializationDimensions: TOGGLES.map((entry) => entry.dimension).join(' | '),
  }, {
    source: 'state-inspector',
    reason: 'inspector-mounted',
  });

  return () => {
    cleanupBindings();
    cleanupDrag?.();
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
