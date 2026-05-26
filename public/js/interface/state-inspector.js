import {
  annotateFloatingChromeElement,
  writeRuntimeDatasetValues,
} from '/public/js/kernel/dom-contracts.js';
import { bus } from '/public/js/kernel/bus.js';

const ROOT_ATTR = 'data-spw-state-inspector-root';
const PANEL_ID = 'spw-state-inspector-panel';
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

  status.className = 'spw-state-inspector__status';
  status.dataset.spwStateInspectorStatus = '';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.textContent = 'Closed.';

  panel.append(title, summary, actions, copy, close, status);
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
    emitFeedback('Copied a state snapshot with route, accessibility, layering, runtime, and dataset dimensions.', 'copy');
  } catch {
    updateStatus(root, 'Snapshot ready in console.');
    console.info('[state inspector snapshot]', snapshot);
    emitFeedback('Clipboard unavailable. Snapshot logged to console instead.', 'console');
  }
}

function bindInspector(root) {
  const handleClick = (event) => {
    if (!(event.target instanceof Element)) return;
    if (event.target.closest('.spw-state-inspector__launch')) {
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

export function initStateInspector() {
  if (document.body?.dataset?.spwStateInspector === 'off') return () => {};
  if (document.querySelector(`[${ROOT_ATTR}]`)) return () => {};

  const root = createInspector();
  document.body.append(root);
  const cleanupBindings = bindInspector(root);
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
