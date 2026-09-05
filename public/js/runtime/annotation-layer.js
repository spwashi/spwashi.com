import {
  SPW_LOG_RELATIONSHIPS,
  createSpwLogger,
  markInstrumented,
} from '/public/js/kernel/instrumentation.js';
import { humanizeToken, semanticToken as normalizeToken } from '/public/js/kernel/text-normalization.js';
import { collectAnnotationRegions } from '/public/js/semantic/role-inference.js';

const ROOT = document.documentElement;
const HANDLE_SELECTOR = '[data-spw-annotation-handle], [data-spw-header-annotation]';

/* Cognitive container awareness: when annotating, also mark the nearest rich
   container (.site-frame, .frame-card, etc.) so memory + annotation create
   observable resonance across the container topology. This turns passive
   reading surfaces into active wonder participants. */
const COGNITIVE_CONTAINER_SELECTOR = '.spw-frame, [data-spw-kind="frame"], .spw-card, .frame-card, .spw-panel, .mode-panel, [data-spw-form="brace"]';
const ACTIVE_SECTION_EVENT = 'spw:section-locomotion-state';
const ANNOTATION_EVENT = 'spw:annotation-layer-state';
const HOLD_MS = 420;
const logger = createSpwLogger('annotation-layer', {
  role: 'runtime',
  metaphor: 'gesture-layer',
  owns: 'annotation handles, annotation region matches, annotation console snapshot',
  listensFor: ACTIVE_SECTION_EVENT,
  writes: 'data-spw-annotation*, data-spw-annotation-match',
});

const DATASET_KEYS = Object.freeze([
  'spwAnnotation',
  'spwAnnotationScope',
  'spwAnnotationState',
  'spwAnnotationSource',
]);

function readTokenList(value = '') {
  return String(value)
    .split(/[\s,|]+/)
    .map(normalizeToken)
    .filter(Boolean);
}

function readRegionTokens(region) {
  if (!(region instanceof HTMLElement)) return [];
  const tokens = [
    region.id,
    region.dataset.spwKind,
    region.dataset.spwRole,
    region.dataset.spwContext,
    region.dataset.spwFeature,
    region.dataset.spwPageFamily,
    region.dataset.spwRoleCluster,
    region.dataset.spwCategoryFamily,
    region.dataset.spwMeaning,
    region.dataset.spwWonder,
  ];
  return [...new Set(tokens.flatMap(readTokenList))];
}

function annotationForHandle(handle) {
  if (!(handle instanceof HTMLElement)) return '';
  return normalizeToken(
    handle.dataset.spwAnnotationKind
    || handle.dataset.spwHeaderAnnotation
    || handle.dataset.spwAnnotation
    || handle.textContent
  );
}

function labelForHandle(handle) {
  return humanizeToken(
    handle?.dataset?.spwAnnotationKind
    || handle?.dataset?.spwHeaderAnnotation
    || handle?.dataset?.spwAnnotation
    || handle?.textContent
    || 'annotation'
  );
}

function getRegionLabel(region) {
  if (!(region instanceof HTMLElement)) return '';
  const heading = region.querySelector?.(':scope > h1, :scope > h2, :scope > h3, :scope > .frame-heading :is(h1, h2, h3), :scope > .frame-topline .frame-sigil');
  return humanizeToken(
    heading?.textContent
    || region.getAttribute('aria-label')
    || region.id
    || region.dataset.spwSeed
    || region.dataset.spwRole
    || region.dataset.spwKind
    || 'region'
  );
}

function collectHandles(root = document) {
  const handles = new Set();
  root.querySelectorAll?.(HANDLE_SELECTOR).forEach((handle) => {
    if (handle instanceof HTMLElement && annotationForHandle(handle)) handles.add(handle);
  });
  return [...handles];
}

/* A handle can be a whole landmark (header[data-spw-header-annotation]), not
   just a dedicated button. pointerdown/click bubble, so a press or click on
   any real control nested inside that landmark — a nav link, the menu
   toggle — reaches this handler too, with currentTarget the landmark and
   target the nested control. Only the landmark's own surface (or a handle
   that IS the clicked element, e.g. button.header-annotation) is this
   feature's business; a distinct interactive descendant is not, and must be
   left alone so its own default action (navigation, its own click handler)
   still runs. Without this guard every click bubbling up through an
   annotated header called preventDefault() and ate the nav. */
function isOwnAffordanceTarget(handle, target) {
  if (!(target instanceof Element) || target === handle) return true;
  const interactive = target.closest('a[href], button, input, select, textarea, [role="button"], [contenteditable="true"]');
  return !interactive || interactive === handle;
}

/* A handle can be a whole landmark (header[data-spw-header-annotation]) or a
   dedicated control (button.header-annotation). aria-pressed asserts a
   toggle-button affordance; asserting it on a non-interactive, unfocusable
   landmark tells assistive tech the header can be "pressed" when it cannot
   be reached by keyboard at all — only real buttons/[role="button"] handles
   get the attribute. */
function isPressableHandle(handle) {
  return handle instanceof HTMLElement
    && (handle.tagName === 'BUTTON' || handle.getAttribute('role') === 'button');
}

function scoreRegion(region, annotation, activeSectionId = '') {
  const tokens = readRegionTokens(region);
  let score = tokens.includes(annotation) ? 4 : 0;
  if (activeSectionId && region.id === activeSectionId) score += 2;
  if (tokens.some((token) => annotation.includes(token) || token.includes(annotation))) score += 1;
  return score;
}

function clearRootState() {
  DATASET_KEYS.forEach((key) => {
    delete ROOT.dataset[key];
    delete document.body?.dataset?.[key];
  });
}

function writeRootState(snapshot) {
  const entries = {
    spwAnnotation: snapshot.annotation,
    spwAnnotationScope: snapshot.scope,
    spwAnnotationState: snapshot.state,
    spwAnnotationSource: snapshot.source,
  };

  /* Keep annotation state on html only so broad body-level semantic selectors
     do not accidentally treat the whole page as the active annotation target. */
  Object.entries(entries).forEach(([key, value]) => {
    if (value) ROOT.dataset[key] = value;
    else delete ROOT.dataset[key];
  });
}

function writeHandleState(handles, activeHandle, snapshot) {
  handles.forEach((handle) => {
    const isActive = handle === activeHandle;
    handle.dataset.spwAnnotationState = isActive ? snapshot.state : 'idle';
    handle.dataset.spwAnnotationScope = isActive ? snapshot.scope : 'route';
    handle.dataset.spwInteractionContext = isActive
      ? (snapshot.state === 'pinned' ? 'inspecting' : 'browsing')
      : 'reading';
    if (isPressableHandle(handle)) {
      handle.setAttribute('aria-pressed', isActive && snapshot.state === 'pinned' ? 'true' : 'false');
    }
    markInstrumented(handle, 'annotation-layer', { tags: ['annotation', 'gesture'] });
  });
}

function writeRegionState(regions, matches, snapshot) {
  const matchSet = new Set(matches.map((entry) => entry.region));
  regions.forEach((region) => {
    if (matchSet.has(region)) {
      region.dataset.spwAnnotationMatch = 'true';
      region.dataset.spwAnnotation = snapshot.annotation;
      region.dataset.spwAnnotationState = snapshot.state;
      markInstrumented(region, 'annotation-layer', { tags: ['annotation', 'region'] });

      /* Propagate to nearest cognitive container for observational resonance.
         This makes containers (frames, cards, braces) active participants in
         memory + annotation, encouraging engagement and creating visible
         "resonance fields" for visitors. Cathartic and non-mundane. */
      const container = region.closest(COGNITIVE_CONTAINER_SELECTOR);
      if (container) {
        container.dataset.spwAnnotationScope = snapshot.scope || 'local';
        container.dataset.spwAnnotationState = snapshot.state;
        markInstrumented(container, 'annotation-layer', { tags: ['annotation', 'cognitive-container'] });
      }
      return;
    }
    delete region.dataset.spwAnnotationMatch;
    delete region.dataset.spwAnnotation;
    delete region.dataset.spwAnnotationState;

    const container = region.closest(COGNITIVE_CONTAINER_SELECTOR);
    if (container) {
      delete container.dataset.spwAnnotationScope;
      delete container.dataset.spwAnnotationState;
    }
  });
}

function emitSnapshot(ctx, snapshot) {
  document.dispatchEvent(new CustomEvent(ANNOTATION_EVENT, { detail: snapshot }));
  ctx?.bus?.emit?.(ANNOTATION_EVENT, snapshot);
  logger.info(
    `annotation ${snapshot.state}: ${snapshot.label}`,
    snapshot,
    SPW_LOG_RELATIONSHIPS.GESTURE
  );
}

function scoreRegions(regions, annotation, activeSectionId = '') {
  return regions
    .map((region) => ({ region, score: scoreRegion(region, annotation, activeSectionId) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 8);
}

function buildSnapshot({ annotation, label, state, source, activeSectionId, scored }) {
  return {
    annotation,
    label,
    state,
    source,
    scope: scored.length ? 'region' : 'route',
    activeSectionId,
    matches: scored.map(({ region, score }) => ({
      id: region.id || '',
      label: getRegionLabel(region),
      score,
      kind: region.dataset.spwKind || '',
      role: region.dataset.spwRole || '',
      context: region.dataset.spwContext || '',
    })),
  };
}

export function initSpwAnnotationLayer(ctx = {}) {
  const root = ctx.root || document;
  const handles = collectHandles(root);
  if (!handles.length) return { cleanup() {}, refresh() {} };

  let regions = collectAnnotationRegions(root);
  let activeHandle = null;
  let activeSectionId = ROOT.dataset.spwPageSectionCurrent || '';
  let currentSnapshot = null;
  let holdTimer = 0;

  const apply = (handle, state = 'preview', source = 'gesture') => {
    const annotation = annotationForHandle(handle);
    if (!annotation) return null;

    activeHandle = handle;
    const scored = scoreRegions(regions, annotation, activeSectionId);
    const snapshot = buildSnapshot({
      annotation,
      label: labelForHandle(handle),
      state,
      source,
      activeSectionId,
      scored,
    });

    currentSnapshot = snapshot;
    writeRootState(snapshot);
    writeHandleState(handles, handle, snapshot);
    writeRegionState(regions, scored, snapshot);
    emitSnapshot(ctx, snapshot);
    return snapshot;
  };

  const release = (source = 'release') => {
    activeHandle = null;
    currentSnapshot = null;
    clearRootState();
    handles.forEach((handle) => {
      handle.dataset.spwAnnotationState = 'idle';
      handle.dataset.spwInteractionContext = 'reading';
      if (isPressableHandle(handle)) handle.setAttribute('aria-pressed', 'false');
    });
    regions.forEach((region) => {
      delete region.dataset.spwAnnotationMatch;
      delete region.dataset.spwAnnotation;
      delete region.dataset.spwAnnotationState;
    });
    document.dispatchEvent(new CustomEvent(ANNOTATION_EVENT, {
      detail: { annotation: '', state: 'released', source },
    }));
  };

  const clearHoldTimer = () => {
    if (!holdTimer) return;
    window.clearTimeout(holdTimer);
    holdTimer = 0;
  };

  const onPointerEnter = (event) => {
    const handle = event.currentTarget;
    if (activeHandle && currentSnapshot?.state === 'pinned') return;
    apply(handle, 'preview', 'pointer');
  };

  const onPointerLeave = () => {
    if (currentSnapshot?.state === 'pinned') return;
    release('pointer-leave');
  };

  const onFocus = (event) => {
    if (activeHandle && currentSnapshot?.state === 'pinned') return;
    apply(event.currentTarget, 'preview', 'focus');
  };

  const onBlur = () => {
    if (currentSnapshot?.state === 'pinned') return;
    release('blur');
  };

  const onPointerDown = (event) => {
    const handle = event.currentTarget;
    if (!isOwnAffordanceTarget(handle, event.target)) return;
    clearHoldTimer();
    holdTimer = window.setTimeout(() => {
      apply(handle, 'pinned', 'hold');
      holdTimer = 0;
    }, HOLD_MS);
  };

  const onPointerUp = () => {
    clearHoldTimer();
  };

  const onClick = (event) => {
    const handle = event.currentTarget;
    if (!isOwnAffordanceTarget(handle, event.target)) return;
    event.preventDefault();
    if (activeHandle === handle && currentSnapshot?.state === 'pinned') {
      release('click-release');
      return;
    }
    apply(handle, 'pinned', 'click');
  };

  const onKeydown = (event) => {
    if (event.key === 'Escape') {
      release('escape');
      event.currentTarget.blur?.();
      return;
    }
    if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
      if (!isOwnAffordanceTarget(event.currentTarget, event.target)) return;
      event.preventDefault();
      onClick(event);
    }
  };

  const onSectionState = (event) => {
    activeSectionId = event.detail?.currentId || ROOT.dataset.spwPageSectionCurrent || '';
    if (activeHandle) {
      apply(activeHandle, currentSnapshot?.state || 'preview', 'section-sync');
    }
  };

  handles.forEach((handle) => {
    handle.dataset.spwAnnotationState ||= 'idle';
    if (isPressableHandle(handle)) handle.setAttribute('aria-pressed', 'false');
    handle.addEventListener('pointerenter', onPointerEnter);
    handle.addEventListener('pointerleave', onPointerLeave);
    handle.addEventListener('focus', onFocus);
    handle.addEventListener('blur', onBlur);
    handle.addEventListener('pointerdown', onPointerDown);
    handle.addEventListener('pointerup', onPointerUp);
    handle.addEventListener('pointercancel', onPointerUp);
    handle.addEventListener('click', onClick);
    handle.addEventListener('keydown', onKeydown);
  });

  document.addEventListener(ACTIVE_SECTION_EVENT, onSectionState);

  const api = {
    snapshot: () => currentSnapshot,
    handles: () => handles.map((handle) => ({
      annotation: annotationForHandle(handle),
      label: labelForHandle(handle),
      state: handle.dataset.spwAnnotationState || 'idle',
    })),
    regions: () => regions.map((region) => ({
      id: region.id || '',
      label: getRegionLabel(region),
      tokens: readRegionTokens(region),
      matched: region.dataset.spwAnnotationMatch === 'true',
    })),
    release,
  };
  window.spwAnnotations = api;

  return {
    cleanup() {
      clearHoldTimer();
      release('cleanup');
      handles.forEach((handle) => {
        handle.removeEventListener('pointerenter', onPointerEnter);
        handle.removeEventListener('pointerleave', onPointerLeave);
        handle.removeEventListener('focus', onFocus);
        handle.removeEventListener('blur', onBlur);
        handle.removeEventListener('pointerdown', onPointerDown);
        handle.removeEventListener('pointerup', onPointerUp);
        handle.removeEventListener('pointercancel', onPointerUp);
        handle.removeEventListener('click', onClick);
        handle.removeEventListener('keydown', onKeydown);
      });
      document.removeEventListener(ACTIVE_SECTION_EVENT, onSectionState);
      if (window.spwAnnotations === api) {
        delete window.spwAnnotations;
      }
    },
    refresh() {
      regions = collectAnnotationRegions(root);
      if (activeHandle) apply(activeHandle, currentSnapshot?.state || 'preview', 'refresh');
    },
  };
}
