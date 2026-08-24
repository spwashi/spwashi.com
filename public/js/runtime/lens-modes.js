const LENS_MODE_QUERY_KEYS = Object.freeze(['spw-lens', 'lens', 'mode']);
const DOCUMENT_NODE = 9;
const FALLBACK_LOCATION = Object.freeze({ hash: '', pathname: '', search: '' });

const LENS_MODE_IMPACTS = Object.freeze({
  surface: 'reader-orientation',
  syntax: 'structure-inspection',
  artifacts: 'output-proof',
  website: 'runtime-contract',
  systems: 'system-relationships',
  learning: 'practice-sequence',
  making: 'buildable-work',
  current: 'active-work',
  source: 'source-shape',
  library: 'reusable-api',
  memory: 'retention-state',
  operators: 'operator-vocabulary',
  principles: 'design-rules',
  workbench: 'implementation-context',
  reading: 'narrative-flow',
  play: 'table-lore',
  studio: 'client-systems',
  kernel: 'identity-invariants',
  lattice: 'medium-crossing',
  hospitality: 'community-horizon',
  cook: 'recipe-craft',
  theory: 'flavor-grammar',
  garden: 'botanical-soil',
  tactile: 'hand-material',
  fragments: 'code-specimens',
  collaboration: 'partner-loop',
  table: 'session-consequence',
});

const getDocument = (root = document) => {
  if (root?.nodeType === DOCUMENT_NODE) return root;
  return root?.ownerDocument || document;
};

const getLocationRef = (doc) => doc?.defaultView?.location || globalThis.location || FALLBACK_LOCATION;

const queryModePanels = (group, root = document) =>
  [...getDocument(root).querySelectorAll(`[data-mode-group="${CSS.escape(group)}"][data-mode-panel]`)];

export const LENS_MODE_SETTLE_MS = 720;

export function shouldUseLensViewTransition({
  source = 'mode-switch',
  supportsTransition = false,
  reduceMotion = false,
} = {}) {
  return supportsTransition
    && !reduceMotion
    && source !== 'initial'
    && source !== 'query';
}

export function findLensModeSwitches(buttons = []) {
  const switches = new Set();
  for (const button of buttons) {
    const switchEl = button.closest?.('.mode-switch');
    if (switchEl instanceof HTMLElement) switches.add(switchEl);
  }
  return [...switches];
}

export function findLensModeHosts(group, buttons = [], panels = []) {
  const hosts = new Set();
  const selector = `[data-spw-inspect-mode-group="${CSS.escape(group)}"]`;
  for (const node of [...buttons, ...panels]) {
    const host = node.closest?.(selector)
      || node.closest?.('.site-frame, [data-spw-feature], [data-spw-kind]');
    if (host instanceof HTMLElement) hosts.add(host);
  }
  return [...hosts];
}

export function resolveLensMode(buttons = [], mode = '') {
  const activeIndex = Math.max(
    0,
    buttons.findIndex((button) => button.getAttribute('data-set-mode') === mode)
  );
  const activeButton = buttons[activeIndex] || buttons[0] || null;
  const resolvedMode = activeButton?.getAttribute('data-set-mode') || mode;
  return { activeButton, activeIndex, resolvedMode };
}

function humanizeLensToken(value = '') {
  return String(value || '')
    .trim()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function describeLensTopography(panel, host) {
  const source = panel instanceof HTMLElement ? panel : host;
  if (!(source instanceof HTMLElement)) return '';
  const kind = humanizeLensToken(source.dataset.spwKind || source.dataset.spwComponentKind || '');
  const role = humanizeLensToken(source.dataset.spwRole || '');
  const feature = humanizeLensToken(source.dataset.spwFeature || host?.dataset?.spwFeature || '');
  const parts = [role, kind, feature].filter(Boolean);
  return [...new Set(parts)].slice(0, 2).join(' / ');
}

function describeLensFeedback({ mode, impact, panel, host }) {
  const topography = describeLensTopography(panel, host);
  const readableImpact = humanizeLensToken(impact || mode);
  if (topography && readableImpact) return `${readableImpact} · ${topography}`;
  return readableImpact || topography || humanizeLensToken(mode);
}

export function buildLensModeDeepLink(group, mode, host, locationRef = globalThis.location || FALLBACK_LOCATION) {
  const params = new URLSearchParams(locationRef.search || '');
  params.set('lens', `${group}:${mode}`);
  const search = params.toString();
  const hash = host?.id ? `#${host.id}` : locationRef.hash;
  return `${locationRef.pathname}${search ? `?${search}` : ''}${hash || ''}`;
}

export function parseLensModeQuery(grouped, search = getLocationRef().search) {
  const params = new URLSearchParams(String(search || '').replace(/^\?/, ''));
  const rawValues = LENS_MODE_QUERY_KEYS.flatMap((key) => params.getAll(key)).filter(Boolean);

  for (const rawValue of rawValues) {
    const normalized = String(rawValue || '').trim();
    if (!normalized) continue;
    const [rawGroup, rawMode] = normalized.split(/[:=\/]/, 2).map((item) => item?.trim());
    if (rawGroup && rawMode && grouped.has(rawGroup)) {
      const match = grouped.get(rawGroup).find((button) => button.getAttribute('data-set-mode') === rawMode);
      if (match) return { group: rawGroup, mode: rawMode };
    }
    for (const [group, buttons] of grouped.entries()) {
      const match = buttons.find((button) => button.getAttribute('data-set-mode') === normalized);
      if (match) return { group, mode: normalized };
    }
  }

  return null;
}

export function writeLensModeState({
  group,
  mode,
  buttons = [],
  panels = null,
  root = document,
  source = 'mode-switch',
  setTransientState = null,
} = {}) {
  if (!group || !mode) return null;

  const doc = getDocument(root);
  const resolvedPanels = Array.isArray(panels) ? panels : queryModePanels(group, doc);
  const { activeButton, activeIndex, resolvedMode } = resolveLensMode(buttons, mode);

  const applyDomUpdates = () => {
    for (const button of buttons) {
      const isActive = button.getAttribute('data-set-mode') === resolvedMode;
      button.setAttribute('aria-pressed', String(isActive));
      button.dataset.spwLensOptionState = isActive ? 'active' : 'idle';
    }

    for (const panel of resolvedPanels) {
      const show = panel.getAttribute('data-mode-panel') === resolvedMode;
      panel.hidden = !show;
      panel.dataset.spwLensPanelState = show ? 'active' : 'idle';
      panel.dataset.spwLensGroup = group;
      panel.dataset.spwLensMode = resolvedMode;
    }
  };

  const supportsTransition = typeof doc.startViewTransition === 'function';
  const reduceMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
  if (shouldUseLensViewTransition({ source, supportsTransition, reduceMotion })) {
    try {
      const transition = doc.startViewTransition(applyDomUpdates);
      // Browsers reject one or more lifecycle promises when another transition
      // supersedes this one. The DOM update is still authoritative; cancellation
      // is a progressive-enhancement outcome, not an application error.
      ['ready', 'updateCallbackDone', 'finished'].forEach((phase) => {
        transition?.[phase]?.catch?.(() => {});
      });
    } catch {
      applyDomUpdates();
    }
  } else {
    applyDomUpdates();
  }

  if (typeof globalThis.navigator?.vibrate === 'function' && !globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
    try {
      globalThis.navigator.vibrate(8);
    } catch {
      /* optional native haptic */
    }
  }

  const hosts = findLensModeHosts(group, buttons, resolvedPanels);
  const primaryHost = hosts[0] || activeButton?.closest?.('.site-frame, [data-spw-feature], [data-spw-kind]') || null;
  const activePanel = resolvedPanels.find((panel) => panel.getAttribute('data-mode-panel') === resolvedMode) || null;
  const deepLink = buildLensModeDeepLink(group, resolvedMode, primaryHost, getLocationRef(doc));
  const lensImpact = LENS_MODE_IMPACTS[resolvedMode] || `${group}-emphasis`;
  const lensFeedback = describeLensFeedback({
    mode: resolvedMode,
    impact: lensImpact,
    panel: activePanel,
    host: primaryHost,
  });

  for (const switchEl of findLensModeSwitches(buttons)) {
    switchEl.dataset.spwLensGroup = group;
    switchEl.dataset.spwLensMode = resolvedMode;
    switchEl.dataset.spwLensImpact = lensImpact;
    switchEl.dataset.spwLensFeedback = lensFeedback;
    switchEl.dataset.spwLensDeepLink = deepLink;
    switchEl.title = lensFeedback ? `Lens: ${lensFeedback}` : switchEl.title;
    switchEl.style.setProperty('--spw-lens-count', String(Math.max(1, buttons.length)));
    switchEl.style.setProperty('--spw-lens-index', String(activeIndex));
    setTransientState?.(switchEl);
  }

  for (const host of hosts) {
    host.dataset.spwLensGroup = group;
    host.dataset.spwLensMode = resolvedMode;
    host.dataset.spwLensImpact = lensImpact;
    host.dataset.spwLensFeedback = lensFeedback;
    host.dataset.spwDeepLinkState = `lens:${group}:${resolvedMode}`;
    host.dataset.spwLensDeepLink = deepLink;
    setTransientState?.(host);
  }

  doc.documentElement.dataset.spwActiveLensGroup = group;
  doc.documentElement.dataset.spwActiveLensMode = resolvedMode;
  doc.documentElement.dataset.spwActiveLensImpact = lensImpact;
  doc.documentElement.dataset.spwActiveLensFeedback = lensFeedback;

  return {
    group,
    groupName: group,
    mode: resolvedMode,
    label: activeButton?.textContent?.trim() || resolvedMode,
    index: activeIndex,
    count: buttons.length,
    source,
    deepLink,
    impact: lensImpact,
    feedback: lensFeedback,
    hostId: primaryHost?.id || null,
  };
}
