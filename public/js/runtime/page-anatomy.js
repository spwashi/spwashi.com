import { bus } from '/public/js/kernel/bus.js';
import {
  annotateFloatingChromeElement,
  writeDatasetValue,
} from '/public/js/kernel/dom-contracts.js';

const ANATOMY_SELECTOR = '[data-spw-anatomy]';
const INTERACTIVE_SELECTOR = 'a[href], button, input, select, textarea, summary, [role="button"], [tabindex]';
const PARALLEL_NAV_ID = 'spw-parallel-nav';
const READY_DELAY_MS = 80;
const PARALLEL_SWIPE_PX = 46;
const THEME_BIOME_BY_PACK = Object.freeze({
  'neutral-paper': 'temperate-field',
  'ritual-vellum': 'shade-garden',
  'oxide-ledger': 'mineral-marsh',
  'electric-studio': 'signal-reef',
  'copper-brace': 'copper-grove',
  'glass-console': 'glasshouse',
});
const PALETTE_TRACE_STORAGE_KEY = 'spw-palette-trace-v1';
const PALETTE_TRACE_LIMIT = 9;
const PUBLISHER_SIGNAL_SELECTOR = [
  '[data-spw-audience]',
  '[data-spw-trope]',
  '[data-spw-disclosure]',
  '[data-spw-comedic-timing]',
  '[data-spw-spatial-affordance]',
  '[data-spw-inline-tone]',
].join(', ');
const POPUP_TIMING_PROFILE = Object.freeze({
  calm: Object.freeze({ preview: 780, hold: 560, doubleTap: 380 }),
  responsive: Object.freeze({ preview: 520, hold: 460, doubleTap: 340 }),
  expressive: Object.freeze({ preview: 360, hold: 360, doubleTap: 300 }),
});

let pinnedElement = null;
let parallelGroups = new Map();
let parallelGroupOrder = [];
let activeParallelGroup = '';
let activeParallelIndex = 0;

function normalizeText(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function normalizeToken(value = '') {
  return normalizeText(value)
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function spwQuote(value = '') {
  return `\`${normalizeText(value).replace(/\\/g, '\\\\').replace(/`/g, '\\`')}\``;
}

function isReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
}

function isCompactAnatomyTarget(element) {
  if (!(element instanceof HTMLElement)) return false;
  if (['SECTION', 'ARTICLE', 'MAIN', 'BODY'].includes(element.tagName)) return false;
  return element.classList.contains('spw-anatomy-anchor') || Boolean(element.dataset.spwVocabulary);
}

function getAnatomyTargets(root = document) {
  return Array.from(root.querySelectorAll?.(ANATOMY_SELECTOR) || [])
    .filter(isCompactAnatomyTarget);
}

function getAllAnatomyElements(root = document) {
  return Array.from(root.querySelectorAll?.(ANATOMY_SELECTOR) || [])
    .filter((element) => element instanceof HTMLElement);
}

function getParallelTargets(root = document) {
  return getAnatomyTargets(root)
    .filter((element) => normalizeText(element.dataset.spwParallel));
}

function isNaturallyInteractive(element) {
  return Boolean(element?.matches?.(INTERACTIVE_SELECTOR));
}

function readVocabulary(element) {
  return element?.dataset?.spwVocabulary
    || element?.closest?.('[data-spw-vocabulary]')?.dataset?.spwVocabulary
    || '';
}

function readElementLabel(element) {
  return normalizeText(
    element?.dataset?.spwLabel
    || element?.dataset?.spwCopyLabel
    || element?.getAttribute?.('aria-label')
    || element?.textContent
    || ''
  );
}

function readPaletteTrace() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PALETTE_TRACE_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter(Boolean).slice(0, PALETTE_TRACE_LIMIT) : [];
  } catch {
    return [];
  }
}

function writePaletteTrace(trace = []) {
  try {
    localStorage.setItem(PALETTE_TRACE_STORAGE_KEY, JSON.stringify(trace.slice(0, PALETTE_TRACE_LIMIT)));
  } catch {}
}

function recordPaletteTrace({ themePack, paletteResonance, themeBiome, materialLens }) {
  const route = window.location.pathname || '/';
  const signature = `${route}|${themePack}|${paletteResonance}|${themeBiome}|${materialLens}`;
  const current = readPaletteTrace();
  const previous = current.find((entry) => entry.signature === signature);
  const entry = {
    signature,
    route,
    themePack,
    paletteResonance,
    themeBiome,
    materialLens,
    touchedAt: Date.now(),
    count: (previous?.count || 0) + 1,
  };
  const next = [
    entry,
    ...current.filter((item) => item.signature !== signature),
  ].slice(0, PALETTE_TRACE_LIMIT);

  writePaletteTrace(next);
  writeDatasetValue(document.documentElement, 'spwPaletteTraceCount', String(next.length), {
    source: 'page-anatomy',
    reason: 'palette-trace-count',
  });
  document.documentElement.style.setProperty('--spw-palette-trace-count', String(next.length));
  writeDatasetValue(document.documentElement, 'spwPaletteTraceRecent', `${paletteResonance}:${themeBiome}`, {
    source: 'page-anatomy',
    reason: 'palette-trace-recent',
  });
  return next;
}

function describeElementPath(element) {
  if (!(element instanceof HTMLElement)) return '';
  if (element.id) return `#${element.id}`;
  const owner = element.closest?.('[id]');
  const ownerId = owner?.id ? `#${owner.id}` : element.localName;
  const anatomy = element.dataset.spwAnatomy ? `[${element.dataset.spwAnatomy}]` : '';
  return `${ownerId}${anatomy}`;
}

function clearElementState(element) {
  if (!(element instanceof HTMLElement)) return;
  writeDatasetValue(element, 'spwAnatomyState', null, {
    source: 'page-anatomy',
    reason: 'clear-anatomy-state',
  });
}

function clearRootState() {
  writeDatasetValue(document.documentElement, 'spwAnatomyFocus', null, {
    source: 'page-anatomy',
    reason: 'clear-focus',
  });
  writeDatasetValue(document.documentElement, 'spwAnatomyVocabulary', null, {
    source: 'page-anatomy',
    reason: 'clear-vocabulary',
  });
  writeDatasetValue(document.documentElement, 'spwAnatomyPinned', null, {
    source: 'page-anatomy',
    reason: 'clear-pinned',
  });
}

function clearParallelElementStates(groupKey = '') {
  const targets = groupKey
    ? parallelGroups.get(groupKey) || []
    : getParallelTargets(document);

  targets.forEach((element) => {
    writeDatasetValue(element, 'spwParallelState', null, {
      source: 'page-anatomy',
      reason: 'clear-parallel-state',
    });
  });
}

function clearActiveState({ clearPinned = false } = {}) {
  getAnatomyTargets(document).forEach((element) => {
    if (!clearPinned && element === pinnedElement) return;
    clearElementState(element);
  });

  if (clearPinned) {
    pinnedElement = null;
    clearRootState();
    clearParallelElementStates();
    return;
  }

  if (!pinnedElement) clearRootState();
}

function refreshParallelGroups(root = document) {
  const groups = new Map();

  getParallelTargets(root).forEach((element) => {
    const key = normalizeToken(element.dataset.spwParallel);
    if (!key) return;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(element);
  });

  parallelGroups = groups;
  parallelGroupOrder = Array.from(groups.entries())
    .filter(([, elements]) => elements.length > 1)
    .map(([key]) => key);

  if (!parallelGroupOrder.includes(activeParallelGroup)) {
    activeParallelGroup = parallelGroupOrder[0] || '';
    activeParallelIndex = 0;
  }

  writeDatasetValue(document.documentElement, 'spwParallelGroups', parallelGroupOrder.length ? String(parallelGroupOrder.length) : null, {
    source: 'page-anatomy',
    reason: 'parallel-groups-refresh',
  });

  return groups;
}

function getGroupLabel(groupKey, items = parallelGroups.get(groupKey) || []) {
  return normalizeText(items[0]?.dataset?.spwParallelLabel)
    || groupKey.replace(/[-_]+/g, ' ');
}

function updateParallelRootState(groupKey = activeParallelGroup, index = activeParallelIndex) {
  const items = parallelGroups.get(groupKey) || [];
  const target = items[index] || null;

  writeDatasetValue(document.documentElement, 'spwParallelActive', target ? groupKey : null, {
    source: 'page-anatomy',
    reason: 'parallel-active',
  });
  writeDatasetValue(document.documentElement, 'spwParallelActiveIndex', target ? String(index + 1) : null, {
    source: 'page-anatomy',
    reason: 'parallel-active-index',
  });
  writeDatasetValue(document.documentElement, 'spwParallelActiveCount', target ? String(items.length) : null, {
    source: 'page-anatomy',
    reason: 'parallel-active-count',
  });
}

function updateParallelNavigator(nav = document.getElementById(PARALLEL_NAV_ID)) {
  if (!(nav instanceof HTMLElement)) return;
  if (!parallelGroupOrder.length) {
    nav.hidden = true;
    updateParallelRootState('', 0);
    return;
  }

  const groupKey = activeParallelGroup || parallelGroupOrder[0];
  const items = parallelGroups.get(groupKey) || [];
  const index = Math.min(Math.max(activeParallelIndex, 0), Math.max(0, items.length - 1));
  const target = items[index];
  const label = getGroupLabel(groupKey, items);
  const state = nav.querySelector('[data-spw-parallel-action="group"]');

  nav.hidden = false;
  nav.dataset.spwParallelGroup = groupKey;
  nav.dataset.spwParallelCount = String(items.length);
  nav.dataset.spwParallelIndex = String(index + 1);
  nav.dataset.spwState = target ? 'ready' : 'idle';

  if (state instanceof HTMLButtonElement) {
    const anatomy = target?.dataset?.spwAnatomy || 'parallel';
    state.textContent = `${label} ${index + 1}/${items.length}`;
    state.title = `${anatomy}: ${readElementLabel(target)}`;
  }

  updateParallelRootState(groupKey, index);
}

function syncParallelFocusFromElement(element) {
  if (!(element instanceof HTMLElement)) return;
  const groupKey = normalizeToken(element.dataset.spwParallel);
  if (!groupKey || !parallelGroups.has(groupKey)) return;

  const items = parallelGroups.get(groupKey);
  const index = Math.max(0, items.indexOf(element));
  activeParallelGroup = groupKey;
  activeParallelIndex = index;

  items.forEach((item) => {
    writeDatasetValue(item, 'spwParallelState', item === element ? 'active' : null, {
      source: 'page-anatomy',
      reason: 'parallel-focus',
    });
  });

  updateParallelRootState(groupKey, index);
  updateParallelNavigator();
}

function setActiveAnatomy(element, state = 'active') {
  if (!(element instanceof HTMLElement)) return;
  const anatomy = element.dataset.spwAnatomy || '';
  const vocabulary = readVocabulary(element);

  getAnatomyTargets(document).forEach((target) => {
    if (target === element) return;
    if (target === pinnedElement && state !== 'pinned') return;
    clearElementState(target);
  });

  writeDatasetValue(element, 'spwAnatomyState', state, {
    source: 'page-anatomy',
    reason: state === 'pinned' ? 'pin-anatomy' : 'focus-anatomy',
  });
  writeDatasetValue(document.documentElement, 'spwAnatomyFocus', anatomy || null, {
    source: 'page-anatomy',
    reason: 'focus-anatomy',
  });
  writeDatasetValue(document.documentElement, 'spwAnatomyVocabulary', vocabulary || null, {
    source: 'page-anatomy',
    reason: 'focus-vocabulary',
  });
  writeDatasetValue(document.documentElement, 'spwAnatomyPinned', state === 'pinned' ? anatomy || 'true' : null, {
    source: 'page-anatomy',
    reason: 'pin-state',
  });
  syncParallelFocusFromElement(element);

  bus.emit?.('page-anatomy:focus', {
    element,
    anatomy,
    vocabulary,
    state,
  });
  document.dispatchEvent(new CustomEvent('spw:page-anatomy-focus', {
    detail: {
      anatomy,
      vocabulary,
      state,
    },
  }));
}

function selectParallelTarget(groupKey = activeParallelGroup, nextIndex = 0, options = {}) {
  const items = parallelGroups.get(groupKey) || [];
  if (!items.length) return false;

  const index = (nextIndex + items.length) % items.length;
  const target = items[index];
  if (!(target instanceof HTMLElement)) return false;

  activeParallelGroup = groupKey;
  activeParallelIndex = index;
  clearParallelElementStates(groupKey);
  writeDatasetValue(target, 'spwParallelState', 'active', {
    source: 'page-anatomy',
    reason: options.reason || 'parallel-select',
  });
  setActiveAnatomy(target, 'active');

  target.scrollIntoView({
    block: 'center',
    inline: 'nearest',
    behavior: isReducedMotion() ? 'auto' : 'smooth',
  });
  target.focus?.({ preventScroll: true });

  bus.emit?.('page-anatomy:parallel', {
    group: groupKey,
    index,
    count: items.length,
    anatomy: target.dataset.spwAnatomy || '',
    label: readElementLabel(target),
    source: options.source || 'navigator',
  });
  document.dispatchEvent(new CustomEvent('spw:page-anatomy-parallel', {
    detail: {
      group: groupKey,
      index,
      count: items.length,
      anatomy: target.dataset.spwAnatomy || '',
    },
  }));

  updateParallelNavigator();
  return true;
}

function moveParallel(direction = 1) {
  if (!activeParallelGroup && parallelGroupOrder.length) activeParallelGroup = parallelGroupOrder[0];
  return selectParallelTarget(activeParallelGroup, activeParallelIndex + direction, {
    reason: direction < 0 ? 'parallel-previous' : 'parallel-next',
  });
}

function cycleParallelGroup() {
  if (!parallelGroupOrder.length) return false;
  const current = Math.max(0, parallelGroupOrder.indexOf(activeParallelGroup));
  activeParallelGroup = parallelGroupOrder[(current + 1) % parallelGroupOrder.length];
  activeParallelIndex = 0;
  return selectParallelTarget(activeParallelGroup, activeParallelIndex, {
    reason: 'parallel-group-cycle',
  });
}

function pinAnatomy(element) {
  if (pinnedElement === element) {
    clearActiveState({ clearPinned: true });
    return;
  }
  pinnedElement = element;
  setActiveAnatomy(element, 'pinned');
}

function prepareTargets(targets) {
  targets.forEach((element, index) => {
    element.style.setProperty('--spw-anatomy-order', String(Math.min(index, 12)));
    if (!isNaturallyInteractive(element)) {
      element.tabIndex = 0;
      element.setAttribute('role', 'button');
    }
    if (!element.getAttribute('aria-label')) {
      const anatomy = element.dataset.spwAnatomy || 'page anatomy';
      const vocabulary = readVocabulary(element);
      element.setAttribute('aria-label', vocabulary ? `${anatomy}, ${vocabulary} vocabulary` : anatomy);
    }
  });
}

function bindParallelNavigator(nav) {
  if (!(nav instanceof HTMLElement) || nav.dataset.spwParallelBound === 'true') return;
  nav.dataset.spwParallelBound = 'true';
  let pointerStart = null;

  nav.addEventListener('click', (event) => {
    const button = event.target?.closest?.('[data-spw-parallel-action]');
    if (!(button instanceof HTMLElement)) return;
    const action = button.dataset.spwParallelAction;
    if (action === 'previous') {
      event.preventDefault();
      moveParallel(-1);
    } else if (action === 'next') {
      event.preventDefault();
      moveParallel(1);
    } else if (action === 'group') {
      event.preventDefault();
      cycleParallelGroup();
    }
  });

  nav.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch' || !event.isPrimary) return;
    pointerStart = {
      x: event.clientX,
      y: event.clientY,
    };
  }, { passive: true });

  nav.addEventListener('pointerup', (event) => {
    if (!pointerStart || event.pointerType !== 'touch') return;
    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;
    pointerStart = null;
    if (Math.abs(dx) < PARALLEL_SWIPE_PX || Math.abs(dx) < Math.abs(dy) * 1.35) return;
    moveParallel(dx < 0 ? 1 : -1);
  }, { passive: true });

  nav.addEventListener('pointercancel', () => {
    pointerStart = null;
  }, { passive: true });
}

function ensureParallelNavigator() {
  if (!parallelGroupOrder.length) return null;

  let nav = document.getElementById(PARALLEL_NAV_ID);
  if (nav instanceof HTMLElement) {
    updateParallelNavigator(nav);
    return nav;
  }

  nav = document.createElement('nav');
  nav.id = PARALLEL_NAV_ID;
  nav.className = 'spw-parallel-nav';
  nav.setAttribute('aria-label', 'Parallel page anatomy');
  nav.dataset.spwChromeIsland = 'parallel-navigator';
  nav.dataset.spwDismissible = 'false';
  annotateFloatingChromeElement(nav, {
    role: 'parallel-navigator',
    tier: 'docked',
    mutator: 'page-anatomy',
    reason: 'parallel-copy-navigation',
    stylingAxis: 'page-anatomy',
  });

  const previous = document.createElement('button');
  previous.type = 'button';
  previous.className = 'spw-parallel-nav__button';
  previous.dataset.spwParallelAction = 'previous';
  previous.setAttribute('aria-label', 'Previous parallel');
  previous.textContent = '<';

  const state = document.createElement('button');
  state.type = 'button';
  state.className = 'spw-parallel-nav__state';
  state.dataset.spwParallelAction = 'group';
  state.setAttribute('aria-label', 'Switch parallel group');

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'spw-parallel-nav__button';
  next.dataset.spwParallelAction = 'next';
  next.setAttribute('aria-label', 'Next parallel');
  next.textContent = '>';

  nav.append(previous, state, next);
  document.body.append(nav);
  bindParallelNavigator(nav);
  updateParallelNavigator(nav);
  return nav;
}

function getPageTitle() {
  return normalizeText(
    document.querySelector('main h1, article h1, h1')?.textContent
    || document.title
    || 'page'
  );
}

function getPageSummary() {
  return normalizeText(
    document.querySelector('meta[name="description"]')?.getAttribute('content')
    || document.querySelector('.page-lede, .inline-note, .frame-note, main p')?.textContent
    || ''
  );
}

function getRelatedRoutes() {
  return normalizeText(document.body?.dataset?.spwRelatedRoutes || '')
    .split('|')
    .map((route) => route.trim())
    .filter(Boolean);
}

function collectAnatomyRecords(root = document) {
  return getAllAnatomyElements(root)
    .filter(isCompactAnatomyTarget)
    .slice(0, 24)
    .map((element, index) => ({
      index: index + 1,
      anatomy: element.dataset.spwAnatomy || '',
      vocabulary: readVocabulary(element),
      label: readElementLabel(element),
      parallel: normalizeToken(element.dataset.spwParallel || ''),
      path: describeElementPath(element),
    }));
}

function groupParallelRecords(root = document) {
  const groups = new Map();
  getParallelTargets(root).forEach((element) => {
    const key = normalizeToken(element.dataset.spwParallel || '');
    if (!key) return;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(element);
  });
  return groups;
}

function collectParallelRecords(root = document) {
  const groups = groupParallelRecords(root);
  return Array.from(groups.entries()).map(([key, items]) => ({
    key,
    label: getGroupLabel(key, items),
    count: items.length,
    anatomy: items.map((element) => element.dataset.spwAnatomy || '').filter(Boolean),
  }));
}

function collectFloatingChromeRecords() {
  return Array.from(document.querySelectorAll('[data-spw-floating-chrome="true"]'))
    .slice(0, 12)
    .map((element) => ({
      role: element.dataset.spwChromeRole || '',
      island: element.dataset.spwChromeIsland || '',
      tier: element.dataset.spwChromeTier || '',
      state: element.dataset.spwState || element.dataset.spwStateInspector || '',
    }));
}

function collectPublisherSignals(root = document) {
  return Array.from(root.querySelectorAll?.(PUBLISHER_SIGNAL_SELECTOR) || [])
    .filter((element) => element instanceof HTMLElement)
    .slice(0, 18)
    .map((element) => ({
      audience: element.dataset.spwAudience || '',
      trope: element.dataset.spwTrope || '',
      disclosure: element.dataset.spwDisclosure || '',
      timing: element.dataset.spwComedicTiming || '',
      affordance: element.dataset.spwSpatialAffordance || '',
      tone: element.dataset.spwInlineTone || element.dataset.spwTone || '',
      label: readElementLabel(element),
      path: describeElementPath(element),
    }));
}

export function buildPageAnatomySnapshot(root = document) {
  const html = document.documentElement;
  const body = document.body;
  const themePack = html.dataset.spwThemePack || 'neutral-paper';
  const paletteResonance = html.dataset.spwPaletteResonance || 'route';
  const materialLens = html.dataset.spwMaterialLens
    || html.dataset.spwBaseMetamaterial
    || body?.dataset?.spwBaseMetamaterial
    || 'glass';

  return {
    route: window.location.pathname || '/',
    hash: window.location.hash || '',
    title: getPageTitle(),
    summary: getPageSummary(),
    surface: body?.dataset?.spwSurface || 'site',
    family: body?.dataset?.spwPageFamily || '',
    role: body?.dataset?.spwPageRole || '',
    anatomy: collectAnatomyRecords(root),
    parallels: collectParallelRecords(root),
    publisher: {
      audience: body?.dataset?.spwAudience || '',
      disclosure: body?.dataset?.spwDisclosure || '',
      tone: body?.dataset?.spwTone || '',
      signals: collectPublisherSignals(root),
    },
    relatedRoutes: getRelatedRoutes().slice(0, 12),
    overlay: {
      popupPosture: html.dataset.spwPopupPosture || html.dataset.spwInteractionTuner || 'calm',
      themeBiome: html.dataset.spwThemeBiome || THEME_BIOME_BY_PACK[themePack] || 'temperate-field',
      paletteSpecies: html.dataset.spwPaletteSpecies || `${paletteResonance}:${themePack}`,
      themePack,
      paletteResonance,
      materialLens,
      paletteTrace: readPaletteTrace(),
    },
    floatingChrome: collectFloatingChromeRecords(),
  };
}

export function serializePageAnatomy(snapshot = buildPageAnatomySnapshot()) {
  const routeToken = normalizeToken(snapshot.surface || snapshot.route || 'page') || 'page';
  const lines = [`#>page[${routeToken}]{`];
  lines.push(`  route = ${spwQuote(snapshot.route)}`);
  lines.push(`  title = ${spwQuote(snapshot.title)}`);
  if (snapshot.summary) lines.push(`  summary = ${spwQuote(snapshot.summary)}`);
  if (snapshot.role) lines.push(`  role = ${spwQuote(snapshot.role)}`);
  if (snapshot.family) lines.push(`  family = ${spwQuote(snapshot.family)}`);

  if (snapshot.anatomy.length) {
    lines.push('  anatomy = #[');
    snapshot.anatomy.forEach((entry) => {
      const parallel = entry.parallel ? ` parallel=${spwQuote(entry.parallel)}` : '';
      lines.push(`    .{ part=${spwQuote(entry.anatomy)} vocab=${spwQuote(entry.vocabulary)} label=${spwQuote(entry.label)}${parallel} path=${spwQuote(entry.path)} }`);
    });
    lines.push('  ][reg=set]');
  }

  if (snapshot.parallels.length) {
    lines.push('  parallels = #[');
    snapshot.parallels.forEach((entry) => {
      lines.push(`    .{ key=${spwQuote(entry.key)} label=${spwQuote(entry.label)} count=${entry.count} anatomy=${spwQuote(entry.anatomy.join(' -> '))} }`);
    });
    lines.push('  ][reg=set]');
  }

  if (snapshot.publisher?.signals?.length) {
    lines.push('  publisher = .{');
    if (snapshot.publisher.audience) lines.push(`    audience = ${spwQuote(snapshot.publisher.audience)}`);
    if (snapshot.publisher.disclosure) lines.push(`    disclosure = ${spwQuote(snapshot.publisher.disclosure)}`);
    if (snapshot.publisher.tone) lines.push(`    tone = ${spwQuote(snapshot.publisher.tone)}`);
    lines.push('    signals = #[');
    snapshot.publisher.signals.forEach((entry) => {
      lines.push(`      .{ audience=${spwQuote(entry.audience)} trope=${spwQuote(entry.trope)} disclosure=${spwQuote(entry.disclosure)} timing=${spwQuote(entry.timing)} affordance=${spwQuote(entry.affordance)} tone=${spwQuote(entry.tone)} label=${spwQuote(entry.label)} }`);
    });
    lines.push('    ][reg=set]');
    lines.push('  }');
  }

  lines.push('  overlay = .{');
  lines.push(`    popup_posture = ${spwQuote(snapshot.overlay.popupPosture)}`);
  lines.push(`    theme_biome = ${spwQuote(snapshot.overlay.themeBiome)}`);
  lines.push(`    palette_species = ${spwQuote(snapshot.overlay.paletteSpecies)}`);
  lines.push(`    material_lens = ${spwQuote(snapshot.overlay.materialLens)}`);
  if (snapshot.overlay.paletteTrace.length) {
    lines.push(`    palette_trace = ${spwQuote(snapshot.overlay.paletteTrace.map((entry) => `${entry.paletteResonance}:${entry.themeBiome}`).join(' -> '))}`);
  }
  lines.push('  }');

  if (snapshot.floatingChrome.length) {
    lines.push('  floating_islands = #[');
    snapshot.floatingChrome.forEach((entry) => {
      lines.push(`    .{ role=${spwQuote(entry.role)} island=${spwQuote(entry.island)} tier=${spwQuote(entry.tier)} state=${spwQuote(entry.state)} }`);
    });
    lines.push('  ][reg=set]');
  }

  if (snapshot.relatedRoutes.length) {
    lines.push('  related_routes = #[');
    snapshot.relatedRoutes.slice(0, 8).forEach((route) => lines.push(`    ~${spwQuote(route)}`));
    lines.push('  ][reg=set]');
  }

  lines.push('}');
  return lines.join('\n');
}

function publishPageAnatomyApi() {
  const api = {
    snapshot: () => buildPageAnatomySnapshot(),
    serialize: () => serializePageAnatomy(buildPageAnatomySnapshot()),
    parallels: () => Array.from(groupParallelRecords(document).entries()).map(([key, items]) => ({
      key,
      label: getGroupLabel(key, items),
      count: items.length,
    })),
    goParallel: (direction = 1, group = activeParallelGroup) => selectParallelTarget(
      normalizeToken(group || activeParallelGroup || parallelGroupOrder[0] || ''),
      activeParallelIndex + Number(direction || 1),
      { source: 'api', reason: 'api-parallel-select' }
    ),
  };
  window.__SPW_PAGE_ANATOMY__ = api;
  window.spwPageAnatomy = api;

  writeDatasetValue(document.documentElement, 'spwPageSerialization', 'available', {
    source: 'page-anatomy',
    reason: 'page-serialization-api',
  });
}

function syncThemeAndPopupPosture() {
  const html = document.documentElement;
  const body = document.body;
  const themePack = html.dataset.spwThemePack || 'neutral-paper';
  const resonance = html.dataset.spwPaletteResonance || 'route';
  const materialLens = html.dataset.spwBaseMetamaterial
    || body?.dataset?.spwBaseMetamaterial
    || html.dataset.spwMetamaterial
    || 'glass';
  const posture = resolvePopupPosture(html.dataset);
  const profile = POPUP_TIMING_PROFILE[posture] || POPUP_TIMING_PROFILE.calm;

  html.style.setProperty('--spw-popup-preview-delay', `${profile.preview}ms`);
  html.style.setProperty('--spw-popup-hold-open-delay', `${profile.hold}ms`);
  html.style.setProperty('--spw-popup-double-tap-window', `${profile.doubleTap}ms`);

  writeDatasetValue(html, 'spwPopupPosture', posture, {
    source: 'page-anatomy',
    reason: 'popup-posture-sync',
  });
  writeDatasetValue(html, 'spwThemeBiome', THEME_BIOME_BY_PACK[themePack] || 'temperate-field', {
    source: 'page-anatomy',
    reason: 'theme-biome-sync',
  });
  writeDatasetValue(html, 'spwMaterialLens', materialLens, {
    source: 'page-anatomy',
    reason: 'material-lens-sync',
  });
  writeDatasetValue(html, 'spwPaletteSpecies', `${resonance}:${themePack}`, {
    source: 'page-anatomy',
    reason: 'palette-species-sync',
  });
  recordPaletteTrace({
    themePack,
    paletteResonance: resonance,
    themeBiome: THEME_BIOME_BY_PACK[themePack] || 'temperate-field',
    materialLens,
  });
}

function resolvePopupPosture(dataset = document.documentElement.dataset) {
  if (dataset.spwInteractionTuner === 'expressive') return 'expressive';
  if (dataset.spwExplorePosture === 'workshop') return 'expressive';
  if (dataset.spwInteractionTuner === 'responsive') return 'responsive';
  if (dataset.spwExplorePosture === 'field') return 'responsive';
  if (dataset.spwSemanticDensity === 'rich') return 'responsive';
  return 'calm';
}

export function initPageAnatomy(root = document) {
  const targets = getAnatomyTargets(root);
  if (!targets.length) return () => {};

  prepareTargets(targets);
  refreshParallelGroups(root);
  publishPageAnatomyApi();
  syncThemeAndPopupPosture();
  ensureParallelNavigator();

  const markReady = window.setTimeout(() => {
    writeDatasetValue(document.documentElement, 'spwAnatomyReady', 'true', {
      source: 'page-anatomy',
      reason: 'anatomy-ready',
    });
  }, READY_DELAY_MS);

  const onPointerEnter = (event) => {
    const target = event.target?.closest?.(ANATOMY_SELECTOR);
    if (!(target instanceof HTMLElement)) return;
    setActiveAnatomy(target);
  };

  const onPointerLeave = (event) => {
    const target = event.target?.closest?.(ANATOMY_SELECTOR);
    if (!(target instanceof HTMLElement) || target === pinnedElement) return;
    clearElementState(target);
    if (!pinnedElement) clearRootState();
  };

  const onFocusIn = (event) => {
    const target = event.target?.closest?.(ANATOMY_SELECTOR);
    if (!(target instanceof HTMLElement)) return;
    setActiveAnatomy(target);
  };

  const onFocusOut = (event) => {
    const target = event.target?.closest?.(ANATOMY_SELECTOR);
    if (!(target instanceof HTMLElement) || target === pinnedElement) return;
    clearElementState(target);
    if (!pinnedElement) clearRootState();
  };

  const onClick = (event) => {
    const target = event.target?.closest?.(ANATOMY_SELECTOR);
    if (!(target instanceof HTMLElement)) return;
    if (target.matches('a[href]')) return;
    event.preventDefault();
    pinAnatomy(target);
  };

  const onPointerDown = (event) => {
    if (!pinnedElement) return;
    if (event.target?.closest?.(ANATOMY_SELECTOR)) return;
    clearActiveState({ clearPinned: true });
  };

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      clearActiveState({ clearPinned: true });
      return;
    }

    if (event.key !== 'Enter' && event.key !== ' ') return;
    const target = event.target?.closest?.(ANATOMY_SELECTOR);
    if (!(target instanceof HTMLElement) || target.matches('a[href]')) return;
    event.preventDefault();
    pinAnatomy(target);
  };

  const onSettingsChanged = () => {
    syncThemeAndPopupPosture();
    refreshParallelGroups(document);
    ensureParallelNavigator();
    updateParallelNavigator();
  };

  const settingsObserver = new MutationObserver(onSettingsChanged);
  settingsObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [
      'data-spw-theme-pack',
      'data-spw-palette-resonance',
      'data-spw-base-metamaterial',
      'data-spw-metamaterial',
      'data-spw-interaction-tuner',
      'data-spw-explore-posture',
      'data-spw-semantic-density',
    ],
  });
  if (document.body) {
    settingsObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-spw-base-metamaterial'],
    });
  }

  document.addEventListener('pointerenter', onPointerEnter, true);
  document.addEventListener('pointerleave', onPointerLeave, true);
  document.addEventListener('focusin', onFocusIn, true);
  document.addEventListener('focusout', onFocusOut, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('pointerdown', onPointerDown, true);
  document.addEventListener('keydown', onKeyDown, true);
  document.addEventListener('spw:settings-change', onSettingsChanged);
  document.addEventListener('spw:settings:changed', onSettingsChanged);

  return () => {
    window.clearTimeout(markReady);
    settingsObserver.disconnect();
    document.removeEventListener('pointerenter', onPointerEnter, true);
    document.removeEventListener('pointerleave', onPointerLeave, true);
    document.removeEventListener('focusin', onFocusIn, true);
    document.removeEventListener('focusout', onFocusOut, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('pointerdown', onPointerDown, true);
    document.removeEventListener('keydown', onKeyDown, true);
    document.removeEventListener('spw:settings-change', onSettingsChanged);
    document.removeEventListener('spw:settings:changed', onSettingsChanged);
    document.getElementById(PARALLEL_NAV_ID)?.remove();
    clearActiveState({ clearPinned: true });
    writeDatasetValue(document.documentElement, 'spwAnatomyReady', null, {
      source: 'page-anatomy',
      reason: 'cleanup',
    });
    writeDatasetValue(document.documentElement, 'spwPageSerialization', null, {
      source: 'page-anatomy',
      reason: 'cleanup',
    });
  };
}

export const spwModule = {
  mount: initPageAnatomy,
};
