const LENS_MODE_QUERY_KEYS = Object.freeze(['spw-lens', 'lens', 'mode']);
const DOCUMENT_NODE = 9;
const FALLBACK_LOCATION = Object.freeze({ hash: '', pathname: '', search: '' });

const getDocument = (root = document) => {
  if (root?.nodeType === DOCUMENT_NODE) return root;
  return root?.ownerDocument || document;
};

const getLocationRef = (doc) => doc?.defaultView?.location || globalThis.location || FALLBACK_LOCATION;

const queryModePanels = (group, root = document) =>
  [...getDocument(root).querySelectorAll(`[data-mode-group="${CSS.escape(group)}"][data-mode-panel]`)];

export const LENS_MODE_SETTLE_MS = 720;

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

  const hosts = findLensModeHosts(group, buttons, resolvedPanels);
  const primaryHost = hosts[0] || activeButton?.closest?.('.site-frame, [data-spw-feature], [data-spw-kind]') || null;
  const deepLink = buildLensModeDeepLink(group, resolvedMode, primaryHost, getLocationRef(doc));

  for (const switchEl of findLensModeSwitches(buttons)) {
    switchEl.dataset.spwLensGroup = group;
    switchEl.dataset.spwLensMode = resolvedMode;
    switchEl.dataset.spwLensDeepLink = deepLink;
    switchEl.style.setProperty('--spw-lens-count', String(Math.max(1, buttons.length)));
    switchEl.style.setProperty('--spw-lens-index', String(activeIndex));
    setTransientState?.(switchEl);
  }

  for (const host of hosts) {
    host.dataset.spwLensGroup = group;
    host.dataset.spwLensMode = resolvedMode;
    host.dataset.spwDeepLinkState = `lens:${group}:${resolvedMode}`;
    host.dataset.spwLensDeepLink = deepLink;
    setTransientState?.(host);
  }

  doc.documentElement.dataset.spwActiveLensGroup = group;
  doc.documentElement.dataset.spwActiveLensMode = resolvedMode;

  return {
    group,
    groupName: group,
    mode: resolvedMode,
    label: activeButton?.textContent?.trim() || resolvedMode,
    index: activeIndex,
    count: buttons.length,
    source,
    deepLink,
    hostId: primaryHost?.id || null,
  };
}
