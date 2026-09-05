import {
  annotateFloatingChromeElement,
  positionFloatingChromePopover,
  syncFloatingChromeState,
  writeDatasetValue,
} from '/public/js/kernel/dom-contracts.js';
import { measureSpatialGravity } from '/public/js/runtime/spatial-gravity.js';
import { bus } from '/public/js/kernel/bus.js';
import {
  collectSemanticBraceMatches,
  composeSemanticBraceExpression,
  deriveSemanticBraceExpression,
  parseSemanticBraceExpression,
} from '/public/js/semantic/semantic-braces.js';
import { normalizeText, normalizeToken } from '/public/js/semantic/semantic-utils.js';
import { detectOperatorFromElement, getOperatorGeometry } from '/public/js/kernel/operator-detection.js';

const TARGET_SELECTOR = [
  '.spw-delimiter',
  '.frame-sigil',
  '.frame-card-sigil',
  '.frame-panel-sigil',
  '.spw-chip',
  '[data-spw-feature]',
  '[data-spw-semantic-expression]',
  '[data-spw-semantic-root]',
  '[data-spw-concept]',
  '[data-spw-grounding]',
  '[data-spw-assignment]',
  '[data-spw-reference-seed]',
  '[data-spw-vocab]',
  '[data-spw-topic]',
].join(', ');

const MENU_ID = 'spw-region-menu';
const PREVIEW_DELAY_MS = Object.freeze({
  calm: 780,
  responsive: 520,
  expressive: 360,
});
const HOLD_OPEN_MS = Object.freeze({
  calm: 560,
  responsive: 460,
  expressive: 360,
});
const MOVE_CANCEL_PX = 10;
const DOUBLE_TAP_OPEN_MS = Object.freeze({
  calm: 380,
  responsive: 340,
  expressive: 300,
});

let activeTarget = null;
let activeMatches = [];
let activeIndex = 0;
let previewTimer = null;
let previewTarget = null;
let holdState = null;
let coarseTapState = null;
let menuOpenGraceUntil = 0;
let repositionFrame = 0;

export function isRegionMenuOpen() {
  return document.documentElement.dataset.spwRegionMenu === 'open';
}

export function openRegionMenuForElement(element, options = {}) {
  if (!(element instanceof Element)) return false;

  const target = resolveTarget(element)
    || (element.matches(TARGET_SELECTOR) ? element : null);
  if (!target) return false;

  if (options.source) {
    const graceMs = Number.isFinite(options.graceMs) ? options.graceMs : 900;
    menuOpenGraceUntil = Date.now() + graceMs;
  }

  openMenu(target);
  return true;
}

export function closeRegionMenu() {
  if (!isRegionMenuOpen()) return false;
  closeMenu();
  return true;
}

export function toggleRegionMenuForElement(element) {
  if (isRegionMenuOpen()) return closeRegionMenu();
  return openRegionMenuForElement(element);
}

export function initSpwRegionMenu(ctx, root) {
  if (!(root instanceof Node)) {
    root = document;
  }
  const doc = root?.nodeType === Node.DOCUMENT_NODE ? root : document;
  const body = doc.body;
  if (!body) return () => {};
  if (body.dataset.spwRegionMenuInit === '1') return unmountSpwRegionMenu;

  body.dataset.spwRegionMenuInit = '1';
  body.addEventListener('click', onClick, true);
  body.addEventListener('contextmenu', onContextMenu, true);
  body.addEventListener('pointerenter', onPointerEnter, true);
  body.addEventListener('pointerleave', onPointerLeave, true);
  body.addEventListener('pointerdown', onPointerDown, true);
  body.addEventListener('pointermove', onPointerMove, true);
  body.addEventListener('pointerup', onPointerUp, true);
  body.addEventListener('pointercancel', onPointerCancel, true);
  body.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('scroll', onViewportChange, { passive: true });
  window.addEventListener('resize', onViewportChange);
  window.visualViewport?.addEventListener?.('resize', onViewportChange);
  window.visualViewport?.addEventListener?.('scroll', onViewportChange, { passive: true });
  return unmountSpwRegionMenu;
}

export function unmountSpwRegionMenu() {
  const body = document.body;
  if (!body || body.dataset.spwRegionMenuInit !== '1') return;
  body.dataset.spwRegionMenuInit = '0';
  body.removeEventListener('click', onClick, true);
  body.removeEventListener('contextmenu', onContextMenu, true);
  body.removeEventListener('pointerenter', onPointerEnter, true);
  body.removeEventListener('pointerleave', onPointerLeave, true);
  body.removeEventListener('pointerdown', onPointerDown, true);
  body.removeEventListener('pointermove', onPointerMove, true);
  body.removeEventListener('pointerup', onPointerUp, true);
  body.removeEventListener('pointercancel', onPointerCancel, true);
  body.removeEventListener('keydown', onKeyDown, true);
  window.removeEventListener('scroll', onViewportChange);
  window.removeEventListener('resize', onViewportChange);
  window.visualViewport?.removeEventListener?.('resize', onViewportChange);
  window.visualViewport?.removeEventListener?.('scroll', onViewportChange);
  closeMenu({ restoreFocus: false });
}

export { unmountSpwRegionMenu as unmount };

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'region-menu',
  mount: (ctx, root) => initSpwRegionMenu(ctx, root),
  describes: 'region-menu[inspect|mark|focus] semantic popover',
  timingArc: 'enhance-inspect',
  effectScope: 'popover listeners',
});

export const spwModule = SPW_MODULE_EXPORT;

function onClick(event) {
  const menu = document.getElementById(MENU_ID);
  if (menu?.contains(event.target)) return;

  const target = resolveTarget(event.target);
  if (!target) {
    if (isRegionMenuOpen()) closeMenu({ restoreFocus: false });
    return;
  }

  if (shouldHandleCoarseDoubleTap(target, event)) {
    if (consumeCoarseDoubleTap(target, event)) {
      return;
    }
  }

  if (event.altKey || event.metaKey || target.dataset.spwRegionPreview === 'true') {
    if (isNavigable(target) && !event.altKey && !event.metaKey) return;
    event.preventDefault();
    openMenu(target);
  }
}

function onContextMenu(event) {
  const target = resolveTarget(event.target);
  if (!target) return;

  event.preventDefault();
  openMenu(target);
}

function onPointerEnter(event) {
  if (isCoarsePointer(event)) return;
  const target = resolveTarget(event.target);
  if (!target) return;

  clearPreviewTimer();
  previewTimer = window.setTimeout(() => {
    previewTarget = target;
    writeDatasetValue(target, 'spwRegionPreview', 'true');
    writeDatasetValue(document.documentElement, 'spwRegionPreviewing', 'true');
  }, getPreviewDelay());
}

function onPointerLeave(event) {
  if (isCoarsePointer(event)) return;
  const target = resolveTarget(event.target);
  if (!target) return;

  clearPreviewTimer();
  if (previewTarget === target) {
    writeDatasetValue(target, 'spwRegionPreview', null);
    writeDatasetValue(document.documentElement, 'spwRegionPreviewing', null);
    previewTarget = null;
  }
}

function onPointerDown(event) {
  if (!event.isPrimary || event.button !== 0) return;
  const target = resolveTarget(event.target);
  if (!target || !shouldArmHoldOpen(target, event)) return;

  clearHoldState();
  holdState = {
    target,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    moved: false,
    opened: false,
    timer: window.setTimeout(() => {
      if (!holdState || holdState.target !== target || holdState.moved) return;
      holdState.opened = true;
      previewTarget = target;
      writeDatasetValue(target, 'spwRegionPreview', 'true');
      writeDatasetValue(document.documentElement, 'spwRegionPreviewing', 'true');
      openMenu(target);
    }, getHoldOpenDelay()),
  };
}

function onPointerMove(event) {
  const state = holdState;
  if (!state) return;
  if (event.pointerId != null && state.pointerId != null && event.pointerId !== state.pointerId) return;

  const dx = event.clientX - state.startX;
  const dy = event.clientY - state.startY;
  if (Math.abs(dx) > MOVE_CANCEL_PX || Math.abs(dy) > MOVE_CANCEL_PX) {
    state.moved = true;
    clearHoldState({ preservePreview: state.opened });
  }
}

function onPointerUp(event) {
  const state = holdState;
  if (!state) return;
  if (event.pointerId != null && state.pointerId != null && event.pointerId !== state.pointerId) return;
  clearHoldState({ preservePreview: state.opened });
}

function onPointerCancel() {
  clearHoldState();
}

function onKeyDown(event) {
  const menu = document.getElementById(MENU_ID);

  if (event.key === 'Escape') {
    closeMenu();
    return;
  }

  if (menu?.contains(event.target)) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      moveMenuFocus(menu, event.key === 'ArrowDown' ? 1 : -1);
    }
    return;
  }

  const target = resolveTarget(event.target);
  if (!target) return;

  if ((event.key === 'Enter' && event.altKey) || event.key === '?') {
    event.preventDefault();
    openMenu(target);
  }
}

function cancelReposition() {
  if (repositionFrame) {
    cancelAnimationFrame(repositionFrame);
    repositionFrame = 0;
  }
}

function scheduleReposition() {
  // scroll/resize can fire several times per frame, and positionMenu() reads
  // layout (getBoundingClientRect + getComputedStyle) on each call. Coalesce the
  // work into one frame so the popover tracks the target without thrashing.
  if (repositionFrame) return;
  repositionFrame = requestAnimationFrame(() => {
    repositionFrame = 0;
    if (document.documentElement.dataset.spwRegionMenu !== 'open') return;
    const menu = document.getElementById(MENU_ID);
    if (menu instanceof HTMLElement && activeTarget instanceof HTMLElement) {
      positionMenu(menu, activeTarget);
    }
  });
}

function onViewportChange() {
  clearHoldState();
  clearCoarseTapState();

  if (document.documentElement.dataset.spwRegionMenu === 'open') {
    const menu = document.getElementById(MENU_ID);
    if (menu instanceof HTMLElement && activeTarget instanceof HTMLElement) {
      scheduleReposition();
      return;
    }
  }

  if (Date.now() < menuOpenGraceUntil) return;
  if (document.documentElement.dataset.spwRegionMenu === 'open') {
    closeMenu({ restoreFocus: false });
  }
}

function resolveTarget(node) {
  return node?.closest?.(TARGET_SELECTOR) || null;
}

function isNavigable(target) {
  return target instanceof HTMLAnchorElement && target.hasAttribute('href');
}

function isLocalHashTarget(target) {
  if (!(target instanceof HTMLAnchorElement)) return false;
  const href = target.getAttribute('href') || '';
  return href.startsWith('#');
}

function shouldHandleCoarseDoubleTap(target, event) {
  if (!isCoarsePointer(event)) return false;
  if (!(target instanceof HTMLElement)) return false;
  return target.matches('.frame-sigil, .spw-delimiter, .frame-card-sigil, .frame-panel-sigil');
}

function consumeCoarseDoubleTap(target, event) {
  const now = Date.now();
  const sameTarget = coarseTapState?.target === target;
  const doubleTapWindow = getDoubleTapOpenDelay();
  const withinWindow = sameTarget && now - coarseTapState.timestamp <= doubleTapWindow;

  if (withinWindow) {
    clearCoarseTapState();
    event.preventDefault();
    openMenu(target);
    return true;
  }

  clearCoarseTapState();
  coarseTapState = {
    target,
    timestamp: now,
    timer: window.setTimeout(() => {
      if (previewTarget === target) {
        writeDatasetValue(target, 'spwRegionPreview', null);
        writeDatasetValue(document.documentElement, 'spwRegionPreviewing', null);
        previewTarget = null;
      }
      clearCoarseTapState();
    }, doubleTapWindow),
  };

  previewTarget = target;
  writeDatasetValue(target, 'spwRegionPreview', 'true');
  writeDatasetValue(document.documentElement, 'spwRegionPreviewing', 'true');

  if (isLocalHashTarget(target) || target.matches('.spw-delimiter')) {
    event.preventDefault();
  }

  return false;
}

function clearCoarseTapState() {
  if (!coarseTapState) return;
  if (coarseTapState.timer) {
    window.clearTimeout(coarseTapState.timer);
  }
  coarseTapState = null;
}

function openMenu(target) {
  activeTarget = target;
  previewTarget = target;
  writeDatasetValue(target, 'spwRegionPreview', 'true');
  writeDatasetValue(document.documentElement, 'spwRegionPreviewing', 'true');

  const semantic = resolveSemantic(target);
  const frame = target.closest('.spw-frame, [data-spw-kind], [data-spw-role]') || document.body;
  activeMatches = semantic.family ? collectRegionMatches(document, semantic.family) : [];
  activeIndex = Math.max(0, activeMatches.indexOf(target));

  setRegionFocus(target, semantic);
  const geometry = getOperatorGeometry(detectOperatorFromElement(target)?.type || target.dataset.spwOperator || '');
  writeDatasetValue(target, 'spwGeometryFlow', geometry?.flow || null);
  writeDatasetValue(target, 'spwGeometryLeft', geometry?.leftRole || null);
  writeDatasetValue(target, 'spwGeometryRight', geometry?.rightRole || null);

  const menu = ensureMenu();
  menu.dataset.spwPopupPosture = readPopupPosture();
  menu.replaceChildren(buildMenuContent(target, semantic, frame));
  positionMenu(menu, target);
  writeDatasetValue(menu, 'spwState', 'open');
  writeDatasetValue(target, 'spwRegionMenuTarget', 'true');
  document.documentElement.dataset.spwRegionMenu = 'open';
  syncFloatingChromeState(document, {
    source: 'region-menu',
    reason: 'region-menu-opened',
  });
  bus.emit?.('region-menu:opened', {
    target,
    semantic,
    matchCount: activeMatches.length,
    contract: Object.fromEntries(buildContract(target, semantic, frame)),
  });

  const firstButton = menu.querySelector('button');
  firstButton?.focus?.({ preventScroll: true });
}

function ensureMenu() {
  let menu = document.getElementById(MENU_ID);
  if (menu) return menu;

  menu = document.createElement('div');
  menu.id = MENU_ID;
  menu.className = 'spw-region-menu';
  menu.setAttribute('role', 'menu');
  menu.setAttribute('aria-label', 'Spw region menu');
  menu.dataset.spwMetamaterial = 'shell';
  menu.dataset.spwDismissible = 'true';
  menu.dataset.spwPopupPosture = readPopupPosture();
  menu.dataset.spwGravity = 'open';
  menu.dataset.spwSalience = 'focal';
  menu.dataset.spwSeating = 'flush-host';
  annotateFloatingChromeElement(menu, {
    role: 'region-menu-popover',
    island: 'region-menu-popover',
    tier: 'popover',
    mutator: 'region-menu',
    reason: 'semantic-region-actions',
    stylingAxis: 'region-menu',
  });
  document.body.appendChild(menu);
  return menu;
}

function buildMenuContent(target, semantic, frame) {
  const fragment = document.createDocumentFragment();
  const header = document.createElement('header');
  const dismiss = document.createElement('button');
  const title = document.createElement('p');
  const chromeMeta = document.createElement('p');
  const titleGroup = document.createElement('div');
  header.className = 'spw-region-menu__header';
  titleGroup.className = 'spw-region-menu__title-group';
  title.className = 'spw-region-menu__title';
  title.textContent = semantic.key || semantic.expression || readableTarget(target);
  chromeMeta.className = 'spw-region-menu__chrome-meta';
  chromeMeta.textContent = buildChromeMeta(target);
  dismiss.type = 'button';
  dismiss.className = 'spw-region-menu__dismiss';
  dismiss.dataset.spwRegionAction = 'dismiss';
  dismiss.textContent = 'close';
  dismiss.addEventListener('click', () => closeMenu({ restoreFocus: false }));
  titleGroup.append(title, chromeMeta);
  header.append(titleGroup, dismiss);
  fragment.appendChild(header);

  const summary = document.createElement('p');
  summary.className = 'spw-region-menu__summary';
  summary.dataset.spwPopupPosture = readPopupPosture();
  summary.textContent = buildSummary(semantic, target, frame);
  fragment.appendChild(summary);

  const contract = buildContract(target, semantic, frame);
  if (contract.length) {
    const list = document.createElement('dl');
    list.className = 'spw-region-menu__contract';
    contract.forEach(([label, value]) => {
      const term = document.createElement('dt');
      term.textContent = label;
      const desc = document.createElement('dd');
      desc.textContent = value;
      list.append(term, desc);
    });
    fragment.appendChild(list);
  }

  if (shouldShowTuningHandles()) {
    const handles = document.createElement('div');
    handles.className = 'spw-region-menu__handles';
    [
      ['salience', 'Salience', '--spw-salience'],
      ['attention', 'Attention', '--charge'],
    ].forEach(([id, label, variable]) => {
      const row = document.createElement('div');
      row.className = 'spw-region-menu__handle-row';
      const labelEl = document.createElement('label');
      labelEl.textContent = label;
      const input = document.createElement('input');
      input.type = 'range';
      input.min = '0';
      input.max = '1';
      input.step = '0.01';
      input.value = readUnitValue(getComputedStyle(target).getPropertyValue(variable));
      input.addEventListener('input', (event) => {
        target.style.setProperty(variable, event.target.value);
        writeDatasetValue(target, `spw${id.charAt(0).toUpperCase() + id.slice(1)}`, event.target.value);
        bus.emit?.('region-menu:tuned', {
          target,
          id,
          value: event.target.value,
          variable,
        });
      });
      row.append(labelEl, input);
      handles.appendChild(row);
    });
    fragment.appendChild(handles);
  }

  // Composition Suggestions
  const suggestions = buildSuggestions(semantic, target);
  if (suggestions.length) {
    const suggestTitle = document.createElement('p');
    suggestTitle.className = 'spw-region-menu__subtitle';
    suggestTitle.textContent = 'Reusable moves';
    fragment.appendChild(suggestTitle);

    const list = document.createElement('div');
    list.className = 'spw-region-menu__suggestions';
    suggestions.forEach(([label, spell]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'spw-suggestion-chip';
      button.textContent = label;
      button.title = spell;
      button.addEventListener('click', () => {
        copyToClipboard(spell, button);
      });
      list.appendChild(button);
    });
    fragment.appendChild(list);
  }

  const actionGroups = [
    [
      'inspect',
      'Inspect',
      [
        ['focus', 'Show related', () => focusMatches(target, semantic)],
        ['next', 'Next match', () => moveMatch(1)],
        ['prev', 'Previous match', () => moveMatch(-1)],
      ],
    ],
    [
      'collect',
      'Carry',
      [
        ['capture', 'Save move', () => captureSpell(target, semantic)],
        ['copy', 'Copy source', () => copySeed(target, semantic, frame)],
      ],
    ],
    [
      'mark',
      'Mark',
      [
        ['mark', 'Pin region', () => toggleRegionMark(target)],
      ],
    ],
    [
      'reset',
      'Settle',
      [
        ['clear', 'Clear highlight', () => clearRegionFocus()],
      ],
    ],
  ];

  actionGroups.forEach(([lane, label, actions]) => {
    const group = document.createElement('div');
    group.className = 'spw-region-menu__action-group';
    group.dataset.spwInteractionLane = lane;
    const groupLabel = document.createElement('p');
    groupLabel.className = 'spw-region-menu__action-label';
    groupLabel.textContent = label;
    group.appendChild(groupLabel);

    actions.forEach(([action, label, handler]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('role', 'menuitem');
      button.dataset.spwRegionAction = action;
      button.dataset.spwInteractionLane = lane;
      button.textContent = label;
      button.addEventListener('click', handler);
      group.appendChild(button);
    });

    fragment.appendChild(group);
  });

  return fragment;
}

function buildChromeMeta(target) {
  const role = target.dataset.spwChromeRole || target.dataset.spwKind || target.dataset.spwFeature || 'semantic region';
  const material = target.dataset.spwMetamaterial || 'shell';
  const detected = detectOperatorFromElement(target);
  const operator = detected
    ? `${detected.prefix} ${detected.type}`
    : (target.dataset.spwOperator ? `${target.dataset.spwOperator} operator` : 'region actions');
  const geometry = getOperatorGeometry(detected?.type || target.dataset.spwOperator || '');
  const flow = geometry?.flow ? ` · ${geometry.flow}` : '';
  return `${humanizeRegionToken(role)} · ${humanizeRegionToken(material)} · ${operator}${flow}`;
}

function humanizeRegionToken(value) {
  return String(value || '')
    .trim()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function captureSpell(target, semantic) {
  const expression = serializeSemanticForLens(target, semantic);
  bus.emit?.('spell:capture', {
    expression,
    label: semantic.rootLabel || readableTarget(target),
  });
  target.dataset.spwSerializedCopy = expression;
  writeDatasetValue(target, 'spwCaptured', 'true');
  setTimeout(() => writeDatasetValue(target, 'spwCaptured', null), 800);
}

function buildSuggestions(semantic, target) {
  const suggestions = [];
  const family = semantic.family;
  const operator = detectOperatorFromElement(target)?.type || target.dataset.spwOperator || 'frame';

  if (family) {
    const lens = getLensSerializationContext(target).mode;
    const lensSuffix = lens ? `<${lens}>` : '';
    suggestions.push([`?${family}`, `?{${family}}${lensSuffix}`]);
    suggestions.push([`!${family}`, `!action{${family}}${lensSuffix}`]);
    suggestions.push([`*${family}`, `*stream{${family}}${lensSuffix}`]);
  }

  if (semantic.behavior) {
    suggestions.push([`${semantic.root} -> ${semantic.behavior}`, `${operator}{${semantic.root}{${semantic.behavior}}}`]);
  }

  return suggestions;
}

async function copyToClipboard(text, element) {
  try {
    await navigator.clipboard?.writeText(text);
    const originalText = element.textContent;
    element.textContent = 'Copied!';
    setTimeout(() => element.textContent = originalText, 1000);
  } catch {
    window.prompt('Copy Spw spell', text);
  }
}

function resolveSemantic(target) {
  const explicit = deriveSemanticBraceExpression(target);
  if (explicit?.expression || explicit?.root) return explicit;

  const text = readableTarget(target);
  const inferred = inferExpressionFromText(text);
  return parseSemanticBraceExpression(inferred || text);
}

function inferExpressionFromText(text) {
  const cleaned = normalizeText(text).replace(/^(#>:|#:|#>|#|\^|~|\?|@|\*|>|<|\$|%|\.|!|&|=|\[|\{|\()/, '');
  if (!cleaned) return '';
  if (/[\[{<]/.test(cleaned)) return cleaned;
  return cleaned.replace(/^"+|"+$/g, '');
}

function readableTarget(target) {
  return normalizeText(
    target?.dataset?.spwSemanticExpression
    || target?.dataset?.spwConcept
    || target?.dataset?.spwAssignment
    || target?.dataset?.spwReferenceSeed
    || target?.dataset?.spwGrounding
    || target?.dataset?.spwTopic
    || target?.dataset?.spwMeaning
    || target?.dataset?.spwFeature
    || target?.dataset?.spwSigil
    || target?.textContent
    || 'region'
  );
}

function buildSummary(semantic, target, frame) {
  const parts = [];
  const operator = detectOperatorFromElement(target)?.type || target.dataset.spwOperator || 'region';
  const lensContext = getLensSerializationContext(target);
  const feature = target.dataset.spwFeature || frame?.dataset?.spwFeature || '';
  const frameName =
    frame?.querySelector?.(':scope > header h1, :scope > header h2, :scope > .frame-heading h2, :scope > .frame-topline .frame-sigil')
      ?.textContent
    || frame?.id
    || 'current frame';

  if (feature) parts.push(`feature ${feature}`);
  if (semantic.rootLabel) parts.push(`root ${semantic.rootLabel}`);
  if (semantic.variantLabel) parts.push(`variant ${semantic.variantLabel}`);
  if (semantic.behaviorLabel) parts.push(`behavior ${semantic.behaviorLabel}`);
  if (semantic.lensLabel || lensContext.mode) parts.push(`lens ${semantic.lensLabel || lensContext.mode}`);
  if (lensContext.impact) parts.push(lensContext.impact);

  const suffix = parts.length ? parts.join(' · ') : 'no parsed brace parts yet';
  return `${operator} in ${normalizeText(frameName)} · ${suffix}`;
}

function buildContract(target, semantic, frame) {
  const source = target.closest('[data-spw-reading-cue], [data-spw-input], [data-spw-operation], [data-spw-return]');
  const lensContext = getLensSerializationContext(target);
  const fields = [
    ['Feature', source?.dataset.spwFeature || target.dataset.spwFeature || frame?.dataset?.spwFeature],
    ['Concept', target.dataset.spwConcept],
    ['Domain', target.dataset.spwDomain],
    ['Grounding', target.dataset.spwGrounding],
    ['Assignment', target.dataset.spwAssignment],
    ['Reference seed', target.dataset.spwReferenceSeed],
    ['Vocabulary', target.dataset.spwVocab],
    ['Topic', target.dataset.spwTopic],
    ['Attention', target.dataset.spwAttention],
    ['Behavior', target.dataset.spwBehavior || semantic.behaviorLabel],
    ['Lens', semantic.lensLabel || lensContext.label || lensContext.mode],
    ['Lens impact', lensContext.impact],
    ['Recognition', target.dataset.spwRecognition],
    ['Operation', source?.dataset.spwOperation || target.dataset.spwOperation || semantic.behaviorLabel],
    ['Failure', target.dataset.spwFailureMode],
    ['Adjacent', target.dataset.spwAdjacent],
    ['Contrast', target.dataset.spwContrast],
    ['Practice', target.dataset.spwPractice],
    ['Proficiency', target.dataset.spwProficiency],
    ['Cue', source?.dataset.spwReadingCue || target.dataset.spwReadingCue],
    ['Input', source?.dataset.spwInput || target.dataset.spwInput || semantic.rootLabel],
    ['Return', source?.dataset.spwReturn || target.dataset.spwReturn || frame?.dataset?.spwConsequence],
    ['Tone', source?.dataset.spwTone || target.dataset.spwTone || frame?.dataset?.spwContext],
  ];

  return fields.filter(([, value]) => normalizeText(value));
}

function readRootPxVar(value, fallbackPx = 0) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return fallbackPx;
  const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  if (trimmed.endsWith('rem')) return parseFloat(trimmed) * rootSize;
  if (trimmed.endsWith('px')) return parseFloat(trimmed);
  const numeric = Number.parseFloat(trimmed);
  return Number.isFinite(numeric) ? numeric : fallbackPx;
}

function getRegionMenuBottomReserve() {
  const style = getComputedStyle(document.documentElement);
  const clearance = readRootPxVar(style.getPropertyValue('--spw-bottom-chrome-clearance'), 0);
  const handle = readRootPxVar(style.getPropertyValue('--touch-target-compact'), 34.4);
  const handleOffset = readRootPxVar(style.getPropertyValue('--attention-handle-offset'), 16);
  return Math.max(clearance, handle + handleOffset + 12);
}

function isCompactRegionViewport() {
  return window.matchMedia('(max-width: 720px), (pointer: coarse)').matches;
}

function positionMenu(menu, target) {
  if (!(menu instanceof HTMLElement)) return;

  const placement = positionFloatingChromePopover(menu, target, {
    compact: isCompactRegionViewport(),
    maxWidth: 304,
    maxHeight: 416,
    gutter: 12,
    offset: 8,
    bottomReserve: getRegionMenuBottomReserve(),
    source: 'region-menu',
  });

  if (!placement) return;
  measureSpatialGravity(menu);
  menu.dataset.spwRegionMenuPlacement = placement.placement;
  menu.dataset.spwRegionMenuVertical = placement.vertical;
  menu.dataset.spwRegionMenuHorizontal = placement.horizontal;
  if (placement.collision) {
    menu.dataset.spwRegionMenuCollision = placement.collision;
  }
}

function focusMatches(target, semantic) {
  if (!semantic.family) return;
  setRegionFocus(target, semantic, true);
}

function setRegionFocus(target, semantic, expanded = true) {
  if (!semantic.family) return;
  clearRegionFocus(false);

  activeMatches = collectRegionMatches(document, semantic.family);
  activeIndex = Math.max(0, activeMatches.indexOf(target));

  activeMatches.forEach((node, index) => {
    writeDatasetValue(node, 'spwInspectSemanticExpanded', expanded ? 'true' : null);
    writeDatasetValue(node, 'spwSemanticFamily', semantic.family);
    writeDatasetValue(node, 'spwSemanticRoot', semantic.root || semantic.family);
    writeDatasetValue(node, 'spwInspectSemanticMatch', expanded && node !== target ? 'true' : null);
    writeDatasetValue(node, 'spwInspectSemanticFocused', expanded && node === target ? 'true' : null);
    writeDatasetValue(node, 'spwSemanticOrdinal', String(index + 1));
  });

  document.documentElement.dataset.spwInspectSemanticFocusRoot = semantic.family;
  document.documentElement.dataset.spwInspectSemanticFocusCount = String(activeMatches.length);
}

function moveMatch(direction) {
  if (!activeMatches.length) return;

  activeIndex = (activeIndex + direction + activeMatches.length) % activeMatches.length;
  const next = activeMatches[activeIndex];
  if (!(next instanceof HTMLElement)) return;

  activeMatches.forEach((node) => {
    writeDatasetValue(node, 'spwInspectSemanticFocused', node === next ? 'true' : null);
    writeDatasetValue(node, 'spwInspectSemanticMatch', node === next ? null : 'true');
  });

  const scrollBehavior = isCompactRegionViewport() ? 'auto' : 'smooth';
  next.scrollIntoView({ block: 'center', inline: 'nearest', behavior: scrollBehavior });
  if (!next.hasAttribute('tabindex')) {
    next.setAttribute('tabindex', '-1');
  }
  next.focus?.({ preventScroll: true });

  const menu = document.getElementById(MENU_ID);
  if (menu instanceof HTMLElement) {
    positionMenu(menu, next);
  }
}

function toggleRegionMark(target) {
  const frame = target.closest('.spw-frame, [data-spw-kind], [data-spw-role]');
  if (!(frame instanceof HTMLElement)) return;
  const next = frame.dataset.spwRegionMark === 'active' ? null : 'active';
  writeDatasetValue(frame, 'spwRegionMark', next);
  bus.emit?.('region-menu:marked', {
    frame,
    active: next === 'active',
  });
}

async function copySeed(target, semantic, frame) {
  const seed = buildSeed(target, semantic, frame);

  try {
    await navigator.clipboard?.writeText(seed);
    writeDatasetValue(target, 'spwCopied', 'true');
    setTimeout(() => writeDatasetValue(target, 'spwCopied', null), 900);
  } catch {
    window.prompt?.('Copy seed', seed);
  }
}

function buildSeed(target, semantic, frame) {
  const route = document.body?.dataset.spwSurface || normalizeToken(location.pathname || 'site');
  const region = normalizeToken(
    target.dataset.spwFeature
    || target.dataset.spwConcept
    || target.dataset.spwAssignment
    || target.dataset.spwReferenceSeed
    || frame?.dataset?.spwFeature
    || frame?.id
    || frame?.dataset?.spwRole
    || 'region'
  );
  const operator = detectOperatorFromElement(target)?.type || target.dataset.spwOperator || 'frame';
  const expression = serializeSemanticForLens(target, semantic);
  const lensContext = getLensSerializationContext(target);
  const lensPrefix = lensContext.mode ? `<${lensContext.mode}> ` : '';
  return `${route}<${region}> ${lensPrefix}${operator}{${expression}}`;
}

function getLensSerializationContext(target) {
  const activeRootMode = document.documentElement.dataset.spwActiveLensMode || '';
  const escapedRootMode = activeRootMode && typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
    ? CSS.escape(activeRootMode)
    : '';
  const host = target?.closest?.('[data-spw-lens-mode], [data-spw-inspect-mode-group], [data-mode-group]')
    || (escapedRootMode ? document.querySelector?.(`[data-spw-lens-mode="${escapedRootMode}"]`) : null);
  const mode = normalizeText(
    target?.dataset?.spwSemanticLensLabel
    || target?.dataset?.spwSemanticLens
    || host?.dataset?.spwLensMode
    || document.documentElement?.dataset?.spwActiveLensMode
    || ''
  );
  const group = normalizeText(
    host?.dataset?.spwLensGroup
    || target?.closest?.('[data-mode-group]')?.dataset?.modeGroup
    || document.documentElement?.dataset?.spwActiveLensGroup
    || ''
  );
  const activeButton = group && mode
    ? document.querySelector(`[data-mode-group="${escapeCssToken(group)}"][data-set-mode="${escapeCssToken(mode)}"]`)
    : null;
  const label = normalizeText(activeButton?.textContent || mode);
  const impact = describeLensImpact(mode, group);
  return { group, mode, label, impact };
}

function escapeCssToken(value) {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(value);
  return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '\\$&');
}

function serializeSemanticForLens(target, semantic) {
  const lensContext = getLensSerializationContext(target);
  if (!semantic?.rootLabel && !semantic?.expression) return readableTarget(target);
  if (semantic?.lensLabel || !lensContext.mode) return semantic.key || semantic.expression || readableTarget(target);
  return composeSemanticBraceExpression({
    root: semantic.rootLabel || semantic.root || readableTarget(target),
    variant: semantic.variantLabel,
    behavior: semantic.behaviorLabel,
    lens: lensContext.mode,
  });
}

function describeLensImpact(mode, group) {
  const normalized = normalizeToken(mode);
  const groupName = normalizeToken(group);
  const impacts = {
    surface: 'foregrounds reader-facing orientation',
    syntax: 'foregrounds structure and operators',
    artifacts: 'foregrounds reusable outputs',
    website: 'foregrounds runtime and route contracts',
    systems: 'foregrounds system relationships',
    learning: 'foregrounds practice sequence',
    making: 'foregrounds buildable work',
    current: 'foregrounds active work',
    source: 'foregrounds source shape',
    library: 'foregrounds reusable API shape',
    memory: 'foregrounds retention and state',
    operators: 'foregrounds operator vocabulary',
    principles: 'foregrounds design rules',
    workbench: 'foregrounds implementation context',
  };
  return impacts[normalized] || (groupName ? `changes ${groupName} emphasis` : '');
}

function clearRegionFocus(close = true) {
  document
    .querySelectorAll('[data-spw-inspect-semantic-focused], [data-spw-inspect-semantic-match], [data-spw-inspect-semantic-expanded], [data-spw-region-menu-target]')
    .forEach((node) => {
      writeDatasetValue(node, 'spwInspectSemanticFocused', null);
      writeDatasetValue(node, 'spwInspectSemanticMatch', null);
      writeDatasetValue(node, 'spwInspectSemanticExpanded', null);
      writeDatasetValue(node, 'spwRegionMenuTarget', null);
    });

  document.documentElement.removeAttribute('data-spw-inspect-semantic-focus-root');
  document.documentElement.removeAttribute('data-spw-inspect-semantic-focus-count');

  if (close) closeMenu();
}

function collectRegionMatches(root, family) {
  const matches = collectSemanticBraceMatches(root, family);
  const seen = new Set(matches);
  const scope = root instanceof Element ? root : document;

  scope
    .querySelectorAll?.('[data-spw-semantic-expression], [data-spw-semantic-key], [data-spw-semantic-root]')
    .forEach((node) => {
      if (seen.has(node)) return;
      const semantic = deriveSemanticBraceExpression(node);
      if (semantic?.family !== family) return;
      seen.add(node);
      matches.push(node);
    });

  return matches;
}

function closeMenu(options = {}) {
  const { restoreFocus = true } = options;
  cancelReposition();
  const wasOpen = document.documentElement.dataset.spwRegionMenu === 'open';
  const previousTarget = activeTarget;
  const menu = document.getElementById(MENU_ID);
  if (menu) {
    writeDatasetValue(menu, 'spwState', 'closed');
  }
  if (activeTarget) {
    writeDatasetValue(activeTarget, 'spwRegionMenuTarget', null);
  }
  if (previewTarget) {
    writeDatasetValue(previewTarget, 'spwRegionPreview', null);
    previewTarget = null;
  }
  writeDatasetValue(document.documentElement, 'spwRegionPreviewing', null);
  document.documentElement.removeAttribute('data-spw-region-menu');
  if (restoreFocus) {
    activeTarget?.focus?.({ preventScroll: true });
  }
  activeTarget = null;

  if (wasOpen) {
    syncFloatingChromeState(document, {
      source: 'region-menu',
      reason: 'region-menu-closed',
    });
    bus.emit?.('region-menu:closed', {
      target: previousTarget,
    });
  }
}

function moveMenuFocus(menu, direction) {
  const items = [...menu.querySelectorAll('button')];
  if (!items.length) return;
  const index = Math.max(0, items.indexOf(document.activeElement));
  const next = (index + direction + items.length) % items.length;
  items[next].focus();
}

function clearPreviewTimer() {
  if (previewTimer) {
    window.clearTimeout(previewTimer);
    previewTimer = null;
  }
}

function getPreviewDelay() {
  const posture = readPopupPosture();
  return PREVIEW_DELAY_MS[posture] || PREVIEW_DELAY_MS.calm;
}

function getHoldOpenDelay() {
  const posture = readPopupPosture();
  return HOLD_OPEN_MS[posture] || HOLD_OPEN_MS.calm;
}

function getDoubleTapOpenDelay() {
  const posture = readPopupPosture();
  return DOUBLE_TAP_OPEN_MS[posture] || DOUBLE_TAP_OPEN_MS.calm;
}

function readPopupPosture() {
  return document.documentElement.dataset.spwPopupPosture
    || document.documentElement.dataset.spwInteractionTuner
    || 'calm';
}

function clearHoldState(options = {}) {
  const { preservePreview = false } = options;
  if (!holdState) return;
  window.clearTimeout(holdState.timer);
  if (!preservePreview && previewTarget === holdState.target) {
    writeDatasetValue(holdState.target, 'spwRegionPreview', null);
    writeDatasetValue(document.documentElement, 'spwRegionPreviewing', null);
    previewTarget = null;
  }
  holdState = null;
}

function shouldArmHoldOpen(target, event) {
  if (!isCoarsePointer(event)) return false;
  if (event.altKey || event.metaKey || event.ctrlKey || event.shiftKey) return false;
  if (isNavigable(target)) return false;
  return target.matches(
    '.spw-delimiter, .frame-sigil, .frame-card-sigil, .frame-panel-sigil, [data-spw-feature], [data-spw-semantic-expression], [data-spw-concept], [data-spw-grounding], [data-spw-assignment], [data-spw-reference-seed], [data-spw-vocab], [data-spw-topic]'
  );
}

function isCoarsePointer(event) {
  return event?.pointerType === 'touch';
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function shouldShowTuningHandles() {
  const html = document.documentElement.dataset;
  return (
    html.spwShowSemanticMetadata === 'on'
    || html.spwCognitiveHandles === 'on'
    || html.spwInteractionTuner === 'expressive'
    || html.spwPopupPosture === 'expressive'
    || html.spwSemanticDensity === 'rich'
  );
}

function readUnitValue(value = '') {
  const number = Number.parseFloat(String(value).trim());
  if (!Number.isFinite(number)) return '0';
  return String(Math.max(0, Math.min(1, number)));
}
