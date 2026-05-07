import {
  SPW_LOG_RELATIONSHIPS,
  createSpwLogger,
  markInstrumented,
} from '/public/js/kernel/spw-instrumentation.js';

const ROOT = document.documentElement;
const HANDLE_SELECTOR = '[data-spw-annotation-handle], [data-spw-header-annotation]';
const REGION_SELECTOR = [
  'main [data-spw-kind]',
  'main [data-spw-role]',
  'main [data-spw-context]',
  'main [data-spw-feature]',
  'main section[id]',
  'main article[id]',
].join(', ');
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

function normalizeToken(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function humanizeToken(value = '') {
  return String(value)
    .trim()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ');
}

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

function collectRegions(root = document) {
  const regions = new Set();
  root.querySelectorAll?.(REGION_SELECTOR).forEach((region) => {
    if (region instanceof HTMLElement && region.closest('main')) regions.add(region);
  });
  return [...regions];
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

  [ROOT, document.body].forEach((node) => {
    if (!node) return;
    Object.entries(entries).forEach(([key, value]) => {
      if (value) node.dataset[key] = value;
      else delete node.dataset[key];
    });
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
    handle.setAttribute('aria-pressed', isActive && snapshot.state === 'pinned' ? 'true' : 'false');
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
      return;
    }
    delete region.dataset.spwAnnotationMatch;
    delete region.dataset.spwAnnotation;
    delete region.dataset.spwAnnotationState;
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

  let regions = collectRegions(root);
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
      handle.setAttribute('aria-pressed', 'false');
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
    event.preventDefault();
    const handle = event.currentTarget;
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
    handle.setAttribute('aria-pressed', 'false');
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
      regions = collectRegions(root);
      if (activeHandle) apply(activeHandle, currentSnapshot?.state || 'preview', 'refresh');
    },
  };
}
