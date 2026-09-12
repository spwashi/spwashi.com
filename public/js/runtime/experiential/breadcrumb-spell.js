/**
 * Breadcrumb Spell — experiential organ
 * ---------------------------------------------------------------------------
 * Owns adaptive breadcrumbs and the live spell path:
 * - Link trail assembly across home, surface, route parts, frames, and modes
 * - Deep link resolution and hash synchronization
 * - Shell menu extension and region inspect buttons
 * - Nearby route discovery
 * - Cognitive state narration and reading guide summaries
 *
 * Extracted from experiential.js so each organ carries a single readable
 * contract. The orchestrator delegates here.
 */

import { getActiveRecentPathMemory } from '/public/js/interface/accent-palette.js';
import { bus } from '/public/js/kernel/bus.js';
import { escapeAttr as escapeAttribute, escapeHtml } from '/public/js/kernel/dom-render.js';
import {
  normalizeRouteHref,
  parseRouteList,
} from '/public/js/kernel/route-utils.js';
import { describeCognitiveState } from '/public/js/runtime/cognitive-state.js';
import {
  closeRegionMenu,
  isRegionMenuOpen,
  openRegionMenuForElement,
} from '/public/js/runtime/region-menu.js';
import { isReadingQuietChrome } from '/public/js/runtime/runtime-helpers.js';

/* ── Constants ──────────────────────────────────────────────────────────── */

const MAX_BREADCRUMB_NEIGHBORS = 3;
const SHELL_MENU_INTENT_EVENT = 'spw:shell-menu-intent';
const SHELL_MENU_STATE_EVENT = 'spw:shell-menu-state';
const HEADER_TRACE_CHANGE_EVENT = 'spw:header-trace-change';

export const BREADCRUMB_ROUTE_REGISTRY = Object.freeze({
  '/': { label: 'Home', note: 'Start or re-enter the site.' },
  '/about/': { label: 'About', note: 'Read the method and the kernel.' },
  '/blog/': { label: 'Blog', note: 'Working threads and process notes.' },
  '/cards/': { label: 'Cards', note: 'Turn a study into a local proof record.' },
  '/contact/': { label: 'Contact', note: 'Send a structured inquiry.' },
  '/curriculum/': { label: 'Curriculum', note: 'Follow learning paths and practice loops.' },
  '/design/': { label: 'Design', note: 'Open the hub for palettes, components, and labs.' },
  '/design/folios/': { label: 'Folios', note: 'Study laminated art artifacts and visual systems.' },
  '/play/': { label: 'Play', note: 'RPG Wednesday and experiments.' },
  '/recipes/': { label: 'Recipes', note: 'Culinary practice and technique.' },
  '/services/': { label: 'Services', note: 'Compare a collaboration path.' },
  '/software/': { label: 'Software', note: 'Systems, libraries, and open-source releases.' },
  '/tools/': { label: 'Tools', note: 'Interactive utilities and workbenches.' },
  '/wonder/': { label: 'Wonder', note: 'Sensory notes and architectural inquiries.' },
});

/* ── Contract ───────────────────────────────────────────────────────────── */

export const SPW_BREADCRUMB_SPELL_CONTRACT = Object.freeze({
  id: 'breadcrumb-spell',
  events: Object.freeze([
    HEADER_TRACE_CHANGE_EVENT,
    SHELL_MENU_INTENT_EVENT,
    SHELL_MENU_STATE_EVENT,
  ]),
  dataset: Object.freeze([
    'spwSpellPathState',
    'spwSpellPathViewport',
    'spwSpellPathDepth',
    'spwPageRegionAffinity',
    'spwPageRegionFamiliarity',
    'spwPageRegionLiminality',
    'spwPageRegionSurface',
    'spwBreadcrumbSurface',
    'spwBreadcrumbDepth',
    'spwBreadcrumbFrame',
    'spwBreadcrumbMode',
    'spwBreadcrumbMenuState',
    'spwBreadcrumbMenuMode',
    'spwBreadcrumbMenuChanged',
    'spwBreadcrumbMenuClarity',
    'spwBreadcrumbMenuPhase',
    'spwBreadcrumbMenuTopology',
    'spwBreadcrumbMenuPressure',
    'spwBreadcrumbMenuIntent',
    'spwBreadcrumbReversible',
    'spwBreadcrumbFamiliarity',
    'spwBreadcrumbLiminality',
    'spwBreadcrumbCognitive',
    'spwBreadcrumbMeaningMode',
    'spwBreadcrumbState',
    'spwBreadcrumbViewport',
    'spwBreadcrumbRelatedCount',
    'spwBreadcrumbPageRole',
    'spwBreadcrumbPageResponsibility',
    'spwBreadcrumbRegionMenu',
    'spwDeepLink',
    'spwDeepLinkLabel',
    'spwDeepLinkState',
    'spwSemanticExpression',
    'spwHypermediaExtension',
  ]),
  mount: 'initSpellBreadcrumbs',
});

/* ── Local state ────────────────────────────────────────────────────────── */

const state = {
  pathBar: null,
  shellSnapshot: null,
  pathExpanded: null,
  pathExpandedManual: false,
  pathCompact: null,
  lastTraceSignature: '',
};

let _onUpdate = () => {};

/* ── Device & String Utilities ──────────────────────────────────────────── */

export function getInteractionHint() {
  const isCoarse = window.matchMedia?.('(pointer: coarse)').matches;
  if (isCoarse) {
    return 'tap to ground, long-press to inspect, swipe to cycle';
  }
  return 'click to ground, hold to inspect, swipe or arrow keys to cycle';
}

export function isTouchPrimary() {
  return window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window;
}

export function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
}

export function ensureStableId(element, prefix) {
  if (!(element instanceof HTMLElement)) return '';
  if (!element.id) {
    const seed = element.dataset.setMode || element.textContent || prefix;
    element.id = `${prefix}-${slugify(seed)}`;
  }
  return `#${element.id}`;
}

export function slugify(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function humanizePathPart(value = '') {
  return String(value)
    .replace(/^!/, '')
    .replace(/[_-]+/g, ' ')
    .trim();
}

export function titleFromPath(pathname = '') {
  return humanizePathPart(pathname)
    .split('/')
    .filter(Boolean)
    .at(-1)
    ?.replace(/\b\w/g, (letter) => letter.toUpperCase()) || 'Home';
}

export function stripWhitespace(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

export function ensureHeaderTraceHost(header) {
  let host = header.querySelector('.spw-header-trace');
  if (host) return host;

  host = document.createElement('div');
  host.className = 'spw-header-trace';

  const nav = header.querySelector('nav');
  if (nav?.after) {
    nav.after(host);
  } else {
    header.appendChild(host);
  }

  return host;
}

/* ── Locomotion & Deep Linking ──────────────────────────────────────────── */

export function syncSpellPathHash(sectionId = '') {
  const id = String(sectionId || '').replace(/^#/, '').trim();
  if (!id) return false;

  const hash = `#${id}`;
  const nextUrl = `${window.location.pathname}${window.location.search}${hash}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (currentUrl === nextUrl) return false;

  history.replaceState(null, '', nextUrl);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
  return true;
}

export function navigateSpellPathTarget(sectionId, { source = 'breadcrumb' } = {}) {
  const section = document.getElementById(String(sectionId || '').replace(/^#/, ''));
  if (!(section instanceof HTMLElement)) return false;

  syncSpellPathHash(section.id);
  section.scrollIntoView({
    block: 'start',
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  });

  if (!section.hasAttribute('tabindex')) {
    section.setAttribute('tabindex', '-1');
  }
  section.focus({ preventScroll: true });

  document.dispatchEvent(new CustomEvent(HEADER_TRACE_CHANGE_EVENT, {
    detail: {
      source,
      target: section.id,
      action: 'focus-target',
    },
  }));

  return true;
}

export function resolveActiveFrameElement() {
  return document.querySelector('.spw-frame[data-state~="active"], .site-frame[data-state~="active"]')
    || (window.location.hash ? document.querySelector(window.location.hash) : null);
}

export function resolveRegionInspectTarget() {
  const frame = resolveActiveFrameElement();
  if (!(frame instanceof HTMLElement)) return null;

  return frame.querySelector(
    '.frame-sigil, [data-spw-feature], [data-spw-semantic-expression], [data-spw-kind="hook"]'
  ) || frame;
}

export function resolveBreadcrumbDeepLinkState({ url, activeFrame, activeFrameSigil } = {}) {
  const route = `${url.pathname}${url.search}`;
  const hash = url.hash || (activeFrame?.id ? `#${activeFrame.id}` : '');
  const href = `${route}${hash}`;
  const target = activeFrame instanceof HTMLElement
    ? activeFrame
    : (hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null);
  const label = target instanceof HTMLElement
    ? (
      target.dataset.spwDeepLinkLabel
      || target.getAttribute('aria-label')
      || target.querySelector?.('h1, h2, h3, h4, .frame-sigil, .page-kicker')?.textContent?.trim()
      || activeFrameSigil
      || target.id
    )
    : (activeFrameSigil || humanizePathPart(url.pathname.split('/').filter(Boolean).at(-1) || 'home'));
  const semanticExpression = target instanceof HTMLElement
    ? (
      target.dataset.spwSemanticExpression
      || target.dataset.spwFeature
      || target.dataset.spwKind
      || target.dataset.spwRole
      || `route{${hash ? 'hash' : 'top'}}`
    )
    : `route{${hash ? 'hash' : 'top'}}`;

  return {
    route,
    hash,
    href,
    label: stripWhitespace(label || 'route top'),
    semanticExpression,
  };
}

/* ── Related Route Discovery ────────────────────────────────────────────── */

export function parseRelatedRouteList(value = '') {
  return parseRouteList(value);
}

export function describeBreadcrumbRoute(pathname = '') {
  const normalized = normalizeRouteHref(pathname);
  if (!normalized) return null;
  const known = BREADCRUMB_ROUTE_REGISTRY[normalized];

  if (known) {
    return {
      href: normalized,
      label: known.label,
      note: known.note,
    };
  }

  return {
    href: normalized,
    label: titleFromPath(normalized),
    note: 'Related route from this page.',
  };
}

export function collectRelatedBreadcrumbRoutes(currentPath = '') {
  const normalizedCurrentPath = normalizeRouteHref(currentPath);
  const related = [
    document.body?.dataset.spwRelatedRoutes,
    document.querySelector('header')?.dataset.spwRelatedRoutes,
  ]
    .filter(Boolean)
    .join('|');

  return parseRelatedRouteList(related)
    .filter((pathname) => pathname && pathname !== normalizedCurrentPath)
    .map((pathname) => describeBreadcrumbRoute(pathname))
    .filter(Boolean)
    .slice(0, MAX_BREADCRUMB_NEIGHBORS);
}

/* ── Path Preference & Snapshots ────────────────────────────────────────── */

function isHomeLensFrameHashTarget() {
  const hash = window.location.hash.replace(/^#/, '').trim();
  if (!hash) return false;

  const target = document.getElementById(hash);
  if (!(target instanceof HTMLElement)) return false;

  return target.id === 'home-frame' || Boolean(target.querySelector('.mode-switch'));
}

export function resolveSpellPathExpandedDefault() {
  const mode = document.documentElement.dataset.spwSpellPath || 'auto';
  if (mode === 'expanded') return true;
  if (mode === 'collapsed') return false;

  const routeParts = window.location.pathname.split('/').filter(Boolean);
  const hasHash = Boolean(window.location.hash);
  const hasActiveLensFrame = Boolean(document.querySelector('.spw-frame[data-state~="active"], .site-frame[data-state~="active"]'));
  const hasHashFrame = Boolean(hasHash && document.querySelector(window.location.hash));
  const isHome = window.location.pathname === '/' || window.location.pathname === '';
  const deepRoute = routeParts.length >= 3;
  const hashTarget = hasHash && hasHashFrame;

  if (isHome) {
    if (!isReadingQuietChrome()) {
      return hasActiveLensFrame || isHomeLensFrameHashTarget();
    }
    return state.pathExpandedManual || isHomeLensFrameHashTarget();
  }

  if (isReadingQuietChrome()) {
    return state.pathExpandedManual || hashTarget || deepRoute;
  }

  const hasActiveFrame = hasActiveLensFrame || hasHashFrame;
  const compact = window.matchMedia('(max-width: 720px)').matches;
  if (compact) {
    return hasHash || hasActiveFrame || deepRoute;
  }

  return deepRoute || hasActiveFrame;
}

export function syncBreadcrumbViewportPreference() {
  const compact = window.matchMedia('(max-width: 720px)').matches;

  if (state.pathExpanded == null) {
    state.pathCompact = compact;
    state.pathExpanded = resolveSpellPathExpandedDefault();
    return;
  }

  state.pathCompact = compact;
}

export function readShellSnapshot() {
  const header = document.querySelector('body > header, .site-header');
  if (!(header instanceof HTMLElement)) {
    return {
      mode: 'inline',
      state: 'open',
      phase: 'resting',
      topology: 'inline-ribbon',
      pressure: 'calm',
      intent: 'survey',
      clarity: 'steady',
      changedAxes: [],
      returnHint: 'hash or route',
      reversible: true,
    };
  }

  return {
    mode: header.dataset.spwMenuMode || 'inline',
    state: header.dataset.spwMenu || 'open',
    phase: header.dataset.spwMenuPhase || 'resting',
    topology: header.dataset.spwMenuTopology || 'inline-ribbon',
    pressure: header.dataset.spwMenuPressure || 'calm',
    intent: header.dataset.spwMenuIntent || 'survey',
    clarity: header.dataset.spwMenuClarity || 'steady',
    changedAxes: (header.dataset.spwMenuChanged || '')
      .split(/\s+/)
      .filter((value) => value && value !== 'none'),
    returnHint: (header.dataset.spwMenuReturnPaths || 'toggle route').replace(/\s+/g, ', '),
    reversible: header.dataset.spwMenuReversible !== 'false',
  };
}

/* ── Literary Meaning & Summaries ───────────────────────────────────────── */

export function describeBreadcrumbSummary({
  surface,
  routeParts,
  pageResponsibility,
  pagePrimaryAction,
  activeFrameSigil,
  activeMode,
}) {
  const routeLabel = humanizePathPart(routeParts.at(-1) || surface || 'home');
  const responsibilityLabel = humanizePathPart(pageResponsibility || '');
  const actionLabel = humanizePathPart(pagePrimaryAction || '');

  if (activeFrameSigil) {
    return [routeLabel, responsibilityLabel || actionLabel, stripWhitespace(activeFrameSigil)]
      .filter(Boolean)
      .join(' · ');
  }
  if (activeMode) {
    return [routeLabel, responsibilityLabel || actionLabel, humanizePathPart(activeMode)]
      .filter(Boolean)
      .join(' · ');
  }
  return [routeLabel, responsibilityLabel || actionLabel].filter(Boolean).join(' · ') || routeLabel;
}

export function describeBreadcrumbGuide({
  pageResponsibility,
  pagePrimaryAction,
  relatedRoutes,
  compact,
  deepLinkState,
}) {
  let lead = 'Follow the trail to move through route and hash anchors without losing Spw context.';
  if (pageResponsibility === 'route sorter') {
    lead = 'Choose a doorway; reading stays in front while each route remains linkable.';
  } else if (pagePrimaryAction) {
    lead = `${humanizePathPart(pagePrimaryAction)} when you are ready.`;
  }

  const anchor = deepLinkState?.hash
    ? ` Current anchor: ${deepLinkState.label}.`
    : '';
  const nearby = !compact && relatedRoutes.length
    ? ` ${relatedRoutes.length} nearby route${relatedRoutes.length === 1 ? '' : 's'} below.`
    : '';

  return `<span class="spw-spell-path__guide-lead">${escapeHtml(`${lead}${anchor}${nearby}`)}</span>`;
}

export function describeBreadcrumbMeaning({
  surface,
  pageRole,
  pageResponsibility,
  pagePrimaryAction,
  activeFrameSigil,
  activeMode,
  shellSnapshot,
  cognitiveState,
  narrationMode,
  deepLinkState,
}) {
  const parts = [
    `surface ${surface}`,
    pageResponsibility ? `responsibility ${pageResponsibility}` : '',
    pagePrimaryAction ? `action ${pagePrimaryAction}` : '',
    pageRole ? `role ${pageRole}` : '',
    activeFrameSigil ? `frame ${stripWhitespace(activeFrameSigil)}` : 'frame route-level',
    activeMode ? `mode ${humanizePathPart(activeMode)}` : 'mode ambient',
    deepLinkState?.href ? `deep link ${deepLinkState.href}` : '',
    deepLinkState?.semanticExpression ? `spw ${deepLinkState.semanticExpression}` : '',
    `menu ${humanizePathPart(shellSnapshot.topology)} ${shellSnapshot.state}`,
    `memory ${cognitiveState.familiarity}`,
    `liminality ${cognitiveState.liminality}`,
  ];

  if (shellSnapshot.reversible) {
    parts.push(`return via ${shellSnapshot.returnHint}`);
  }

  if (narrationMode && narrationMode !== 'readable') {
    parts.push(`meaning ${narrationMode}`);
  }

  return parts.filter(Boolean).join(' · ');
}

export function describeSpellPathInteractionHint({
  compact = false,
  pageResponsibility = '',
  pathState = 'closed',
  activeFrameSigil = null,
  deepLinkState = null,
} = {}) {
  const touch = isTouchPrimary();
  const hasHashAnchor = Boolean(deepLinkState?.hash);

  if (pathState === 'open') return '';

  if (pageResponsibility === 'route sorter') {
    return touch
      ? 'Tap @ for entrances, or expand the link trail for nearby doors.'
      : 'Use @ for entrances, or expand the link trail for nearby routes.';
  }

  if (activeFrameSigil) {
    return touch
      ? 'Expand the deep-link trail, or tap ? to inspect this frame.'
      : 'Expand the deep-link trail, or use ? to inspect this frame.';
  }

  if (hasHashAnchor) {
    return 'Expand for your current hash anchor and nearby routes.';
  }

  return touch
    ? 'Expand for your deep-link trail and nearby routes.'
    : 'Expand for your deep-link trail and nearby routes.';
}

/* ── DOM Rendering ──────────────────────────────────────────────────────── */

function renderGardenTraceOnSpellPath() {
  const mirror = document.querySelector('[data-spw-cauldron-mirror]');
  if (!mirror) return '';

  const lastGesture = mirror.querySelector('[data-spw-mirror-label="last-gesture"]')?.textContent?.trim();
  const trace = mirror.querySelector('[data-spw-mirror-label="trace"]')?.textContent?.trim();
  const trail = mirror.querySelector('[data-spw-mirror-label="trail"]')?.textContent?.trim();

  const hasGarden = !!(lastGesture || trace || trail);
  if (!hasGarden) return '';

  const display = (lastGesture || trace || trail || '').replace(/^trace:\s*/i, '').slice(0, 48);
  const trailSig = trail ? trail.replace(/^trail:\s*/i, '') : display;

  return `
    <div class="spw-spell-path__garden-trace spell-provenance" data-spw-garden-on-path aria-live="polite">
      <span class="spell-provenance__label">pocket</span>
      <span class="spell-provenance__trace">${escapeHtml(display)}</span>
      <button type="button" class="garden-action spell-action" data-spw-spell-action="re-gather" data-spw-spell-trail="${escapeHtml(trailSig)}">bring back</button>
    </div>
  `;
}

function renderBreadcrumbLink({ kind, href, token, label, current = false }) {
  const semanticExpression = `trail[${kind}]{${String(href).includes('#') ? 'hash' : 'route'}}`;
  return `
    <li class="spw-spell-crumb" data-spw-crumb-kind="${escapeAttribute(kind)}" data-spw-deep-link="${escapeAttribute(href)}" data-spw-semantic-expression="${escapeAttribute(semanticExpression)}" ${current ? 'data-spw-current="true"' : ''}>
      <a class="spw-spell-link" href="${escapeAttribute(href)}" data-spw-deep-link="${escapeAttribute(href)}" data-spw-deep-link-label="${escapeAttribute(label)}" data-spw-semantic-expression="${escapeAttribute(semanticExpression)}">
        <span class="spw-spell-token">${escapeHtml(token)}</span>
        <span class="spw-spell-label">${escapeHtml(label)}</span>
      </a>
    </li>
  `;
}

function renderBreadcrumbButton({
  kind,
  action,
  token,
  label,
  current = false,
  selector = '',
  pressed = false,
}) {
  return `
    <li class="spw-spell-crumb" data-spw-crumb-kind="${escapeAttribute(kind)}" ${current ? 'data-spw-current="true"' : ''}>
      <button
        class="spw-spell-button"
        type="button"
        data-spw-breadcrumb-action="${escapeAttribute(action)}"
        aria-pressed="${pressed ? 'true' : 'false'}"
        ${selector ? `data-spw-breadcrumb-selector="${escapeAttribute(selector)}"` : ''}>
        <span class="spw-spell-token">${escapeHtml(token)}</span>
        <span class="spw-spell-label">${escapeHtml(label)}</span>
      </button>
    </li>
  `;
}

function renderRouteSorterChip({
  pathname = '',
  pageResponsibility = '',
  compact = false,
} = {}) {
  if (pathname !== '/' || pageResponsibility !== 'route sorter') return '';

  const touchCue = compact && isTouchPrimary()
    ? 'Tap to jump to entrance roles.'
    : 'Jump to entrance roles.';

  return `
    <a
      class="spw-spell-sorter-chip"
      href="#choose-your-entrance"
      data-spw-breadcrumb-action="focus-sorter"
      title="${escapeAttribute(touchCue)}"
      aria-label="Pick an entrance">
      <span class="spw-spell-sorter-chip__token">@</span>
      <span class="spw-spell-sorter-chip__label">
        <span class="spw-spell-sorter-chip__label-full">pick entrance</span>
        <span class="spw-spell-sorter-chip__label-short" aria-hidden="true">entrance</span>
      </span>
    </a>
  `;
}

function renderSpellPathInteractionHint({
  compact = false,
  pageResponsibility = '',
  pathState = 'closed',
  activeFrameSigil = null,
  deepLinkState = null,
} = {}) {
  const hint = describeSpellPathInteractionHint({
    compact,
    pageResponsibility,
    pathState,
    activeFrameSigil,
    deepLinkState,
  });
  if (!hint) return '';

  return `<p class="spw-spell-path__hint" aria-live="polite">${escapeHtml(hint)}</p>`;
}

function renderShellControl(shellSnapshot) {
  const action = shellSnapshot.mode === 'toggle' ? 'toggle-menu' : 'focus-nav';
  const label = humanizePathPart(shellSnapshot.topology);
  const pressed = shellSnapshot.mode === 'toggle' && shellSnapshot.state === 'open';

  return `
    <button
      class="spw-spell-shell"
      type="button"
      data-spw-breadcrumb-action="${escapeAttribute(action)}"
      aria-pressed="${pressed ? 'true' : 'false'}"
      aria-label="${escapeAttribute(`Menu extension controls. ${shellSnapshot.returnHint}.`)}">
      <span class="spw-spell-shell-token">menu</span>
      <span class="spw-spell-shell-state">${escapeHtml(label)}</span>
    </button>
  `;
}

function renderBreadcrumbNearbyRoutes(routes) {
  if (!routes.length) return '';

  return `
    <div class="spw-spell-neighborhood" aria-label="Nearby routes">
      <span class="spw-spell-neighborhood__label">linked routes</span>
      <ul class="spw-spell-neighborhood__list">
        ${routes.slice(0, MAX_BREADCRUMB_NEIGHBORS).map((route) => `
          <li class="spw-spell-neighborhood__item">
            <a class="spw-spell-neighborhood__link" href="${escapeAttribute(route.href)}" title="${escapeAttribute(route.note)}">
              <span class="spw-spell-neighborhood__name">${escapeHtml(route.label)}</span>
              <span class="spw-spell-neighborhood__note">${escapeHtml(route.note)}</span>
            </a>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

function syncSpellPathSurfaceDatasets({
  pathState,
  compact,
  depth,
  cognitiveState,
  surface,
}) {
  const entries = {
    spwSpellPathState: pathState,
    spwSpellPathViewport: compact ? 'compact' : 'roomy',
    spwSpellPathDepth: String(depth),
    spwPageRegionAffinity: cognitiveState?.gradient || '',
    spwPageRegionFamiliarity: cognitiveState?.familiarity || '',
    spwPageRegionLiminality: cognitiveState?.liminality || '',
    spwPageRegionSurface: surface || '',
  };

  [document.documentElement, document.body].forEach((node) => {
    Object.entries(entries).forEach(([key, value]) => {
      const attr = key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
      if (value) {
        node.setAttribute(`data-${attr}`, value);
      } else {
        node.removeAttribute(`data-${attr}`);
      }
    });
  });
}

export function renderBreadcrumbSpell() {
  const pathBar = state.pathBar;
  if (!pathBar) return;

  const url = new URL(window.location.href);
  const surface = document.body?.dataset.spwSurface || 'root';
  const routeParts = url.pathname.split('/').filter(Boolean);
  const shellSnapshot = readShellSnapshot();
  state.shellSnapshot = shellSnapshot;
  syncBreadcrumbViewportPreference();

  const pageRole = document.body?.dataset.spwPageRole || '';
  const pageResponsibility = document.body?.dataset.spwPageResponsibility || '';
  const pagePrimaryAction = document.body?.dataset.spwPagePrimaryAction || '';
  const relatedRoutes = collectRelatedBreadcrumbRoutes(url.pathname);
  const activeFrame =
    document.querySelector('.spw-frame[data-state~="active"], .site-frame[data-state~="active"]')
    || (url.hash ? document.querySelector(url.hash) : null);

  const activeFrameSigil =
    activeFrame?.querySelector('.frame-sigil')?.textContent?.trim()
    || activeFrame?.id
    || null;
  const deepLinkState = resolveBreadcrumbDeepLinkState({ url, activeFrame, activeFrameSigil });

  const activeModeButton = document.querySelector('[data-mode-group][data-set-mode][aria-pressed="true"]');
  const activeMode = activeModeButton?.dataset.setMode || null;
  const activeModeSelector = ensureStableId(activeModeButton, 'spw-mode');
  const narrationMode = document.documentElement.dataset.spwMeaningMode || 'readable';
  const items = [];

  items.push(renderBreadcrumbLink({
    kind: 'home',
    href: '/',
    token: '#>',
    label: 'spwashi',
    current: url.pathname === '/' && !activeFrameSigil,
  }));

  items.push(renderBreadcrumbLink({
    kind: 'surface',
    href: url.pathname,
    token: '#:surface',
    label: humanizePathPart(surface),
    current: routeParts.length === 0 && !activeFrameSigil && !activeMode,
  }));

  let cumulativePath = '';
  routeParts.forEach((part, index) => {
    cumulativePath += `/${part}`;
    const isLast = index === routeParts.length - 1 && !activeFrameSigil && !activeMode;
    items.push(renderBreadcrumbLink({
      kind: 'route',
      href: `${cumulativePath}/`,
      token: '~',
      label: humanizePathPart(part),
      current: isLast,
    }));
  });

  if (activeFrameSigil && url.hash) {
    items.push(renderBreadcrumbLink({
      kind: 'frame',
      href: `${url.pathname}${url.hash}`,
      token: '#>',
      label: activeFrameSigil,
      current: !activeMode,
    }));
  }

  if (activeMode && activeModeSelector) {
    items.push(renderBreadcrumbButton({
      kind: 'mode',
      action: 'focus-mode',
      token: '[]',
      label: humanizePathPart(activeMode),
      current: true,
      selector: activeModeSelector,
    }));
  }

  if (activeFrame && activeFrameSigil) {
    const regionMenuOpen = isRegionMenuOpen();
    items.push(renderBreadcrumbButton({
      kind: 'region',
      action: 'inspect-region',
      token: '?',
      label: regionMenuOpen ? 'region open' : 'inspect region',
      current: regionMenuOpen,
      pressed: regionMenuOpen,
    }));
  }

  const cognitiveState = describeCognitiveState({
    signalCount: items.length + (activeFrameSigil ? 1 : 0) + (activeMode ? 1 : 0),
    recentPath: getActiveRecentPathMemory(),
    currentPath: url.pathname,
    currentSurface: surface,
    pageArrival: document.documentElement.dataset.spwPageArrival || '',
    pageTransitionPhase: document.documentElement.dataset.spwPageTransitionPhase || '',
    pageLiminality: document.body?.dataset.spwLiminality || '',
  });
  const meaning = describeBreadcrumbMeaning({
    surface,
    pageRole,
    pageResponsibility,
    pagePrimaryAction,
    activeFrameSigil,
    activeMode,
    shellSnapshot,
    cognitiveState,
    narrationMode,
    deepLinkState,
  });
  const compactSummary = describeBreadcrumbSummary({
    surface,
    routeParts,
    pageResponsibility,
    pagePrimaryAction,
    activeFrameSigil,
    activeMode,
  });
  const compact = state.pathCompact === true;
  const pathState = state.pathExpanded ? 'open' : 'closed';
  const guide = describeBreadcrumbGuide({
    surface,
    pageRole,
    pageResponsibility,
    pagePrimaryAction,
    activeFrameSigil,
    activeMode,
    relatedRoutes,
    compact,
    pathState,
    deepLinkState,
  });

  pathBar.dataset.spwBreadcrumbSurface = surface;
  pathBar.dataset.spwBreadcrumbDepth = String(items.length);
  pathBar.dataset.spwBreadcrumbFrame = activeFrameSigil ? 'active' : 'route';
  pathBar.dataset.spwBreadcrumbMode = activeMode ? 'active' : 'ambient';
  pathBar.dataset.spwBreadcrumbMenuState = shellSnapshot.state;
  pathBar.dataset.spwBreadcrumbMenuMode = shellSnapshot.mode;
  pathBar.dataset.spwBreadcrumbMenuChanged = shellSnapshot.changedAxes.join(' ') || 'none';
  pathBar.dataset.spwBreadcrumbMenuClarity = shellSnapshot.clarity;
  pathBar.dataset.spwBreadcrumbMenuPhase = shellSnapshot.phase;
  pathBar.dataset.spwBreadcrumbMenuTopology = shellSnapshot.topology;
  pathBar.dataset.spwBreadcrumbMenuPressure = shellSnapshot.pressure;
  pathBar.dataset.spwBreadcrumbMenuIntent = shellSnapshot.intent;
  pathBar.dataset.spwBreadcrumbReversible = shellSnapshot.reversible ? 'true' : 'false';
  pathBar.dataset.spwBreadcrumbFamiliarity = cognitiveState.familiarity;
  pathBar.dataset.spwBreadcrumbLiminality = cognitiveState.liminality;
  pathBar.dataset.spwBreadcrumbCognitive = cognitiveState.gradient;
  pathBar.dataset.spwBreadcrumbMeaningMode = narrationMode;
  pathBar.dataset.spwBreadcrumbState = pathState;
  pathBar.dataset.spwBreadcrumbViewport = compact ? 'compact' : 'roomy';
  pathBar.dataset.spwBreadcrumbRelatedCount = String(relatedRoutes.length);
  pathBar.dataset.spwBreadcrumbPageRole = pageRole || 'none';
  pathBar.dataset.spwBreadcrumbPageResponsibility = pageResponsibility || 'none';
  pathBar.dataset.spwBreadcrumbRegionMenu = isRegionMenuOpen() ? 'open' : 'closed';
  pathBar.dataset.spwDeepLink = deepLinkState.href;
  pathBar.dataset.spwDeepLinkLabel = deepLinkState.label;
  pathBar.dataset.spwDeepLinkState = deepLinkState.hash ? 'hash-anchor' : 'route-anchor';
  pathBar.dataset.spwSemanticExpression = deepLinkState.semanticExpression;
  pathBar.dataset.spwHypermediaExtension = 'trail routes regions deep-link';
  if (document.documentElement.dataset.spwDimensionalBreadcrumbs === 'on') {
    pathBar.setAttribute('data-dimensional-breadcrumb', 'spell-path');
  } else {
    pathBar.removeAttribute('data-dimensional-breadcrumb');
  }

  syncSpellPathSurfaceDatasets({
    pathState,
    compact,
    depth: items.length,
    cognitiveState,
    surface,
  });

  const trailId = 'spw-spell-trail';
  const showTrail = pathState === 'open';
  pathBar.innerHTML = `
    <div class="spw-spell-path__header">
      <button
        class="spw-spell-path-toggle"
        type="button"
        data-spw-breadcrumb-action="toggle-path"
        aria-expanded="${pathState === 'open' ? 'true' : 'false'}"
        aria-controls="${trailId}"
        aria-label="${escapeAttribute(`${pathState === 'open' ? 'Collapse' : 'Expand'} link trail. ${compactSummary}.`)}">
        <span class="spw-spell-path__title">link trail</span>
        <span class="spw-spell-path__summary">${escapeHtml(compactSummary)}</span>
      </button>
      ${compact ? '' : renderShellControl(shellSnapshot)}
      ${renderRouteSorterChip({ pathname: url.pathname, pageResponsibility, compact })}
    </div>
    ${renderSpellPathInteractionHint({
      compact,
      pageResponsibility,
      pathState,
      activeFrameSigil,
      deepLinkState,
    })}
    ${showTrail && guide ? `<p class="spw-spell-path__guide">${guide}</p>` : ''}
    <ol class="spw-spell-trail" id="${trailId}" aria-label="Current link trail"${showTrail ? '' : ' hidden'}>
      ${items.join('')}
    </ol>
    ${showTrail && !compact && relatedRoutes.length ? renderBreadcrumbNearbyRoutes(relatedRoutes) : ''}
    ${showTrail ? `
    <details class="spw-spell-path__inspect">
      <summary>Inspect extension</summary>
      <p class="spw-spell-meaning">${escapeHtml(meaning)}</p>
    </details>` : ''}
    ${showTrail ? renderGardenTraceOnSpellPath() : ''}
  `;

  const traceSignature = [
    pathState,
    compact ? 'compact' : 'roomy',
    String(items.length),
    shellSnapshot.state,
    shellSnapshot.mode,
    shellSnapshot.phase,
    shellSnapshot.pressure,
  ].join('|');

  if (state.lastTraceSignature === traceSignature) return;
  state.lastTraceSignature = traceSignature;

  document.dispatchEvent(new CustomEvent(HEADER_TRACE_CHANGE_EVENT, {
    detail: {
      state: pathState,
      compact,
      depth: items.length,
    },
  }));
}

/* ── Gesture / Action Event Handlers ────────────────────────────────────── */

function onBreadcrumbKeydown(event) {
  if (event.key !== 'Escape') return;
  if (!state.pathExpanded) return;
  event.preventDefault();
  state.pathExpanded = false;
  renderBreadcrumbSpell();
}

function onBreadcrumbAction(event) {
  const control = event.target instanceof Element
    ? event.target.closest('[data-spw-breadcrumb-action]')
    : null;

  if (!(control instanceof HTMLElement)) return;

  switch (control.dataset.spwBreadcrumbAction) {
    case 'toggle-path':
      state.pathExpanded = !state.pathExpanded;
      state.pathExpandedManual = true;
      renderBreadcrumbSpell();
      break;
    case 'focus-mode': {
      const selector = control.dataset.spwBreadcrumbSelector;
      if (!selector) return;
      const modeControl = document.querySelector(selector);
      if (modeControl instanceof HTMLElement) {
        modeControl.focus();
        modeControl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
      break;
    }
    case 'toggle-menu':
      document.dispatchEvent(new CustomEvent(SHELL_MENU_INTENT_EVENT, {
        detail: {
          intent: 'toggle',
          source: 'breadcrumb',
          focusToggle: true,
        },
      }));
      break;
    case 'focus-nav':
      document.dispatchEvent(new CustomEvent(SHELL_MENU_INTENT_EVENT, {
        detail: {
          intent: 'focus',
          source: 'breadcrumb',
          open: false,
        },
      }));
      break;
    case 'inspect-region': {
      const target = resolveRegionInspectTarget();
      if (!target) return;
      if (isRegionMenuOpen()) {
        closeRegionMenu();
      } else {
        openRegionMenuForElement(target, { source: 'breadcrumb' });
      }
      renderBreadcrumbSpell();
      break;
    }
    case 'focus-sorter': {
      event.preventDefault();
      navigateSpellPathTarget('choose-your-entrance', { source: 'breadcrumb' });
      renderBreadcrumbSpell();
      break;
    }
    default:
      break;
  }
}

/* ── Public Mount API ───────────────────────────────────────────────────── */

/**
 * Initialize the breadcrumb spell. Called once by the experiential orchestrator.
 * @param {{ onUpdate?: () => void, ensureHeaderTraceHost?: (header: HTMLElement) => HTMLElement }} [options]
 */
export function initSpellBreadcrumbs(options = {}) {
  if (typeof options.onUpdate === 'function') {
    _onUpdate = options.onUpdate;
  }

  const header = document.querySelector('header');
  if (!header) return;

  const traceHost = typeof options.ensureHeaderTraceHost === 'function'
    ? options.ensureHeaderTraceHost(header)
    : ensureHeaderTraceHost(header);

  let pathBar = traceHost.querySelector('.spw-spell-path');
  if (!pathBar) {
    pathBar = document.createElement('nav');
    pathBar.className = 'spw-spell-path';
    pathBar.setAttribute('aria-label', 'Navigation trail');
    traceHost.appendChild(pathBar);
  }

  if (pathBar.dataset.spwBreadcrumbBound !== 'true') {
    pathBar.addEventListener('click', onBreadcrumbAction);
    pathBar.addEventListener('keydown', onBreadcrumbKeydown);
    pathBar.dataset.spwBreadcrumbBound = 'true';
  }

  state.pathBar = pathBar;

  const update = () => {
    renderBreadcrumbSpell();
    _onUpdate();
  };

  const resetPathPreference = () => {
    state.pathExpandedManual = false;
    state.pathExpanded = resolveSpellPathExpandedDefault();
  };

  window.addEventListener('popstate', () => {
    resetPathPreference();
    update();
  });
  window.addEventListener('hashchange', () => {
    resetPathPreference();
    update();
  });
  window.addEventListener('resize', update);
  document.addEventListener('spw:memory:recent-path', update);
  document.addEventListener('spw:page-attention-state', update);
  document.addEventListener('spw:page-transition-state', update);
  document.addEventListener('spw:section-locomotion-state', update);
  document.addEventListener('spw:navigation-locomotion', update);
  document.addEventListener('spw:settings:changed', () => {
    if (!state.pathExpandedManual) {
      state.pathExpanded = resolveSpellPathExpandedDefault();
    }
    update();
  });
  document.addEventListener('spw:frame-change', update);
  document.addEventListener('spw:mode-change', update);
  document.addEventListener('brace:committed', update);
  document.addEventListener('brace:swapped', update);
  document.addEventListener(SHELL_MENU_STATE_EVENT, update);
  bus.on('region-menu:opened', update);
  bus.on('region-menu:closed', update);
  bus.on('region-menu:marked', update);

  renderBreadcrumbSpell();
}

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'breadcrumb-spell',
  contract: SPW_BREADCRUMB_SPELL_CONTRACT,
  mount: (ctx, root) => initSpellBreadcrumbs(ctx),
  refresh: () => renderBreadcrumbSpell(),
});

export const spwModule = SPW_MODULE_EXPORT;

export default initSpellBreadcrumbs;
