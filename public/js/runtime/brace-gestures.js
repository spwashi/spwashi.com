/**
 * Brace Gesture Physics
 * ---------------------------------------------------------------------------
 * Purpose
 * - Translate pointer and keyboard interactions on [data-spw-form] and
 *   .spw-delimiter elements into semantic gesture states.
 * - Add a semantic interpretation layer before committing actions.
 * - Emit richer payloads through SpwBus while preserving legacy event names.
 *
 * Core shift
 * - pointerdown no longer swaps operators immediately
 * - hold no longer pins immediately
 * - hold first enters an "armed" phase
 * - release commits the relevant affordance only when appropriate
 * - double-click on semantic brace targets inspects and primes without waiting
 *
 * Optional implementation mutation
 * - Enabled by:
 *     html[data-spw-implementation-mutations="on"]
 *     body[data-spw-implementation-mutations="on"]
 *     or nearest ancestor [data-spw-material-context~="mutable"]
 * - Resolved hints are written to data-spw-resolved-* attributes by default.
 *   Author-owned CSS routing attributes such as data-spw-context and
 *   data-spw-wonder are only committed when explicitly opted in.
 *
 * When enabled, resolved semantic hints are written back into markup:
 * - data-spw-handle-kind
 * - data-spw-resolved-affordance
 * - data-spw-resolved-operator
 * - data-spw-resolved-wonder
 * - data-spw-last-gesture
 * - data-spw-resolved-context
 * - data-spw-semantic-expression / family / key / root / variant / behavior
 *
 * Local field hormones
 * - Updates nearest .site-frame / [data-spw-field-root] with lightweight
 *   contextual variables such as:
 *     --spw-field-inquiry
 *     --spw-field-memory
 *     --spw-field-projection
 * - These are intended for subtle environmental responses in CSS.
 */

import { bus } from '/public/js/kernel/bus.js';
import {
  isNativeControl,
  isOwnAffordanceTarget,
  writeDatasetValue,
  writeStyleValue,
} from '/public/js/kernel/dom-contracts.js';
import {
  buildPinRecord,
  pinRecordKey,
  readPins,
  writePins,
} from '/public/js/runtime/pin-registry.js';
import {
  collectSemanticBraceMatches,
  deriveSemanticBraceExpression,
} from '/public/js/semantic/semantic-braces.js';

const HOLD_THRESHOLD_MS = 420;
const DRAG_THRESHOLD_PX = 8;
const COARSE_POINTER_TYPES = new Set(['touch']);

const CHARGE_BY_GESTURE = Object.freeze({
  charging: 0.25,
  active: 0.65,
  armed: 0.9,
  projecting: 0.5,
  committed: 0.72,
  neutral: 0,
});

const GESTURE_TO_CHARGE_BUCKET = Object.freeze({
  charging: 'charging',
  active: 'active',
  armed: 'sustained',
  projecting: 'active',
  committed: 'active',
});

/* ARIA hygiene for transient gesture states (see gesture-aria-hygiene/FIX.md).
   Only applied to non-link/non-button interactive elements so we do not
   interfere with native semantics. Cleared on neutral/discharge. */
const GESTURE_ARIA_DESCRIPTIONS = Object.freeze({
  charging: 'hover active',
  active: 'pressing',
  armed: 'hold ready',
  committed: 'activated',
});

const FIELD_WONDERS = Object.freeze([
  'orientation',
  'inquiry',
  'comparison',
  'memory',
  'projection',
  'constraint',
  'resonance',
]);

const PREFIX_TO_TYPE = Object.freeze({
  '#>': 'frame',
  '#:': 'layer',
  '.': 'baseline',
  '^': 'object',
  '~': 'ref',
  '?': 'probe',
  '@': 'action',
  '*': 'stream',
  '&': 'merge',
  '=': 'binding',
  '$': 'meta',
  '%': 'normalize',
  '!': 'pragma',
  '>': 'surface',
});

const LEADING_OPERATOR_RE = /^(#>|#:|\.|\^|~|\?|@|\*|&|=|\$|%|!|>)/;

const CSS_OBSERVED_SEMANTIC_DATA_KEYS = Object.freeze([
  'spwContext',
  'spwOperator',
  'spwWonder',
]);

const DISCOVERED_META_DATA_KEYS = Object.freeze({
  targetKind: 'spwHandleKind',
  operator: 'spwResolvedOperator',
  wonder: 'spwResolvedWonder',
  context: 'spwResolvedContext',
  affordance: 'spwResolvedAffordance',
});

/**
 * @type {WeakMap<Element, {
 *   timer: number | null,
 *   startX: number,
 *   startY: number,
 *   dragging: boolean,
 *   armed: boolean,
 *   pointerId: number | null,
 *   meta: ReturnType<typeof classifyTarget>
 * }>}
 */
const gestureState = new WeakMap();

export function initBraceGestures() {
  const body = document.body;
  if (!body || body.dataset.braceGesturesInit === '1') return;

  body.dataset.braceGesturesInit = '1';
  restorePins();

  body.addEventListener('pointerenter', onPointerEnter, true);
  body.addEventListener('pointerleave', onPointerLeave, true);
  body.addEventListener('pointerdown', onPointerDown, true);
  body.addEventListener('pointermove', onPointerMove, true);
  body.addEventListener('pointerup', onPointerUp, true);
  body.addEventListener('pointercancel', onPointerCancel, true);
  body.addEventListener('dblclick', onDoubleClick, true);

  body.addEventListener('keydown', onKeyDown, true);
  body.addEventListener('keyup', onKeyUp, true);
}

/* ==========================================================================
   Target resolution + semantic classification
   ========================================================================== */

// [data-spw-kind="hook"] / [data-spw-component-kind="hook"] added 2026-09-03:
// frames.css has carried a dashed-border "gesture-ready" rule for
// [data-spw-kind="hook"][data-spw-gesture="armed"] since before this file
// recognized hooks at all — the CSS side of the pairing existed, waiting.
// 13 hero sections site-wide author data-spw-gesture-contract="tap:prime
// hold:inspect" on this exact class of element and nothing made the promise
// real: a hook was never a brace target, so tapping or holding one did
// nothing. See .spw/conventions/interaction-microstates.spw#reward_contract.
const BRACE_TARGET_SELECTOR = '[data-spw-form], [data-spw-kind="hook"], [data-spw-component-kind="hook"], .spw-delimiter, .frame-sigil, .frame-card-sigil, .frame-panel-sigil, [data-spw-semantic-expression], .spw-card, .frame-card, .plan-card, .ref-card, .media-card, .math-lens-card, .topic-reference-card, .spw-principle-card, .gratitude-card, .returner-card, [data-spw-card]';

// Living terms (.spw-living-term / [data-spw-living-term]) and cauldron
// candidates ([data-spw-cauldron-candidate="true"]) are excluded here on
// purpose, added 2026-09-03 — but only when the matched element is a BARE
// term/candidate with no brace-target markup of its own (137 of 140 site-
// wide). Those are interface/haptics.js's own gesture system
// (CAULDRON_CANDIDATE_SELECTORS, onPrimePointerDown), which resolves the
// specific term via the same closest() pattern and correctly reads its
// data-spw-concept. Neither file's listener stops propagation, so both fire
// on the same hold; this engine's own selector list never named a living
// term directly, so a hold anywhere inside prose used to resolve target to
// the nearest [data-spw-semantic-expression] or [data-spw-form] ancestor —
// often the whole surrounding paragraph or section, not the term. That
// mismatch meant a second, wrong armed state (dashed border, userSelect
// suppressed) rode along on the actual, correct cauldron-prime feedback
// from haptics.js. This engine's own capturePrimedContainment also requires
// meta.semantic.expression, which a living term's data-spw-concept never
// populates, so it was never doing anything useful for a bare term besides
// that stray side effect.
//
// The other 3 (the footer's garden/media cauldron vessels) carry
// data-spw-cauldron-candidate="true" AND data-spw-form="brace" on the same
// element — a re-primeable vessel that is also its own legitimate brace
// target (expand, swap, pin). For those, cauldronMatch === the brace target
// itself, so the exclusion below is a no-op and normal resolution proceeds.
// See .spw/conventions/interaction-microstates.spw#reward_contract.
function braceTarget(node) {
  const cauldronMatch = node?.closest?.('.spw-living-term, [data-spw-living-term], [data-spw-cauldron-candidate="true"]');
  if (cauldronMatch && !cauldronMatch.matches(BRACE_TARGET_SELECTOR)) {
    return null;
  }
  return node?.closest?.(BRACE_TARGET_SELECTOR) || null;
}

function classifyTarget(el) {
  const targetKind = resolveTargetKind(el);
  const operator = resolveOperator(el);
  const affordances = resolveAffordances(el, targetKind);
  const wonder = resolveWonder(el, operator, targetKind, affordances);
  const context = resolveContext(el);

  // Topology enhancement: surface explicit brace nesting / containment for
  // better CSS gestalts, queryability, and phase coordination with operators
  // and measurements. This makes brace/operator topology first-class data.
  if (el && el.matches && el.matches('[data-spw-form]')) {
    const parentBrace = el.closest('[data-spw-form="brace"]');
    if (parentBrace && parentBrace !== el) {
      el.dataset.spwBraceNesting = 'nested';
      el.dataset.spwBraceParentForm = parentBrace.dataset.spwForm || 'brace';
    } else {
      el.dataset.spwBraceNesting = 'root';
    }
    // Simple topology signal for operators inside this brace
    if (operator) {
      el.dataset.spwBraceContainsOperator = operator;
    }
  }
  const semantic = deriveSemanticBraceExpression(el);
  const fieldRoot =
    el.closest?.('[data-spw-field-root], .site-frame, main, body') || document.body;

  const meta = {
    form: el.dataset.spwForm || (el.classList.contains('spw-delimiter') ? 'delimiter' : 'unknown'),
    targetKind,
    operator,
    affordances,
    wonder,
    context,
    fieldRoot,
    swappable: el.hasAttribute('data-spw-swappable'),
    pinnable: affordances.includes('pin'),
    id: resolveStableId(el),
    semantic,
  };

  syncDiscoveredMarkup(el, meta);
  return meta;
}

function resolveTargetKind(el) {
  if (el.matches('.frame-sigil')) return 'frame-sigil';
  if (el.matches('.frame-card-sigil')) return 'frame-card-sigil';
  if (el.matches('.operator-chip')) return 'operator-chip';
  if (el.matches('.syntax-token')) return 'syntax-token';
  if (el.matches('.spec-pill, .badge, .tag, .pill')) return 'inline-pill';
  if (el.matches('.spw-delimiter')) return 'delimiter';
  if (el.matches('.site-frame')) return 'frame';
  if (el.matches('.frame-card, .frame-panel, .mode-panel, .software-card, .math-lens-card, .topic-reference-card, .spw-principle-card, .gratitude-card, .returner-card')) return 'card';
  return 'form';
}

function resolveOperator(el) {
  if (el.dataset.spwOperator) return el.dataset.spwOperator;

  const explicitText = (
    el.dataset.spwSigil
    || el.textContent
    || el.querySelector?.('.frame-sigil, .frame-card-sigil, .frame-panel-sigil')?.textContent
    || ''
  ).trim();

  const prefix = explicitText.match(LEADING_OPERATOR_RE)?.[0];
  if (prefix && PREFIX_TO_TYPE[prefix]) return PREFIX_TO_TYPE[prefix];

  if (el.dataset.spwSwappable) {
    const first = el.dataset.spwSwappable.split(',')[0]?.trim();
    if (PREFIX_TO_TYPE[first]) return PREFIX_TO_TYPE[first];
  }

  return 'frame';
}

function resolveAffordances(el, targetKind) {
  const explicit = el.dataset.spwAffordance?.trim();
  if (explicit) {
    return explicit.split(/\s+/).filter(Boolean);
  }

  const affordances = new Set();

  const isLink =
    el.tagName === 'A'
    || (el instanceof HTMLElement && typeof el.href === 'string' && el.hasAttribute('href'));

  if (isLink) affordances.add('navigate');
  if (el.hasAttribute('data-spw-swappable') && /sigil|frame/.test(targetKind)) affordances.add('swap');
  if (isPinnable(el, targetKind)) affordances.add('pin');
  if (targetKind === 'delimiter' || targetKind === 'syntax-token') affordances.add('hint');
  if (el.matches('[data-mode-group][data-set-mode], .mode-switch button')) affordances.add('toggle');

  if (!affordances.size) {
    affordances.add('hint');
  }

  return [...affordances];
}

function isPinnable(el, targetKind) {
  if (el.dataset.spwPinnable === 'true') return true;
  return (
    targetKind === 'frame'
    || targetKind === 'card'
    || targetKind === 'frame-sigil'
    || targetKind === 'frame-card-sigil'
  );
}

function resolveWonder(el, operator, targetKind, affordances) {
  if (el.dataset.spwWonder) return el.dataset.spwWonder;

  if (affordances.includes('pin')) return 'memory';
  if (affordances.includes('swap')) return 'comparison';
  if (targetKind === 'delimiter') return 'orientation';

  switch (operator) {
    case 'frame':
    case 'layer':
      return 'orientation';
    case 'probe':
      return 'inquiry';
    case 'ref':
    case 'stream':
      return 'resonance';
    case 'action':
    case 'surface':
      return 'projection';
    case 'binding':
    case 'pragma':
    case 'normalize':
      return 'constraint';
    case 'merge':
    case 'meta':
      return 'comparison';
    case 'object':
    case 'baseline':
      return 'memory';
    default:
      return 'orientation';
  }
}

function resolveContext(el) {
  return (
    el.dataset.spwContext
    || el.closest?.('[data-spw-context]')?.dataset.spwContext
    || el.closest?.('.site-frame')?.dataset.spwRole
    || document.body?.dataset.spwSurface
    || 'surface'
  );
}

function resolveStableId(el) {
  return (
    el.id
    || el.dataset.spwSigil
    || el.querySelector?.('.frame-sigil, .frame-card-sigil, .frame-panel-sigil')?.textContent?.trim()
    || null
  );
}

/* ==========================================================================
   Gesture state + semantic field output
   ========================================================================== */

function setGesture(el, meta, gesture, options = {}) {
  if (!el) return;

  const { source, button } = options;

  if (!gesture || gesture === 'neutral') {
    writeDatasetValue(el, 'spwGesture', null);
    writeDatasetValue(el, 'spwCharge', null);
    writeDatasetValue(el, 'spwArmed', null);
    writeDatasetValue(el, 'spwLastGesture', null);
    writeDatasetValue(el, 'spwGestureSource', null);
    writeDatasetValue(el, 'spwGestureButton', null);
    writeStyleValue(el, '--charge', null);
    writeStyleValue(el, '--drag-dx', null);
    writeStyleValue(el, '--drag-dy', null);
    writeStyleValue(el, '--drag-distance', null);
    updateFieldHormones(meta, 'neutral');
    syncDiscoveredMarkup(el, meta, { spwLastGesture: null, spwArmed: null });
    // ARIA hygiene: clear transient gesture description on neutral
    if (el.hasAttribute && el.hasAttribute('aria-description')) {
      el.removeAttribute('aria-description');
    }
    return;
  }

  writeDatasetValue(el, 'spwGesture', gesture);
  writeDatasetValue(el, 'spwCharge', GESTURE_TO_CHARGE_BUCKET[gesture] || 'active');
  writeStyleValue(el, '--charge', `${CHARGE_BY_GESTURE[gesture] ?? 0}`);

  if (source) writeDatasetValue(el, 'spwGestureSource', source);
  if (button != null) writeDatasetValue(el, 'spwGestureButton', String(button));

  if (gesture === 'armed') {
    writeDatasetValue(el, 'spwArmed', 'true');
  } else {
    writeDatasetValue(el, 'spwArmed', null);
  }

  syncDiscoveredMarkup(el, meta, {
    spwLastGesture: gesture,
    spwArmed: gesture === 'armed' ? 'true' : null,
  });

  /* ARIA hygiene pass (gesture-aria-hygiene/FIX.md).
     Only on non-native interactive elements. Lower noise than aria-live for transient phases. */
  const isNativeControl = el.matches?.('a[href], button, input, select, textarea, [role="button"], [role="link"]');
  if (!isNativeControl) {
    let desc = GESTURE_ARIA_DESCRIPTIONS[gesture] || '';
    if (gesture === 'armed') {
      const aff = (meta && meta.affordances) || [];
      if (aff.includes('swap') || el.hasAttribute('data-spw-swappable')) {
        desc = 'Hold: will swap operator. Release now to confirm.';
      } else if (aff.includes('pin') || meta?.pinnable) {
        desc = 'Hold: will pin this frame.';
      }
    }
    if (desc) {
      el.setAttribute('aria-description', desc);
    } else {
      el.removeAttribute('aria-description');
    }
  }

  updateFieldHormones(meta, gesture);
}

function updateFieldHormones(meta, gesture) {
  const root = meta?.fieldRoot;
  if (!(root instanceof HTMLElement)) return;

  const intensity = CHARGE_BY_GESTURE[gesture] ?? 0;

  FIELD_WONDERS.forEach((name) => {
    writeStyleValue(root, `--spw-field-${name}`, name === meta.wonder ? `${intensity}` : '0');
  });

  writeStyleValue(root, '--spw-field-charge', `${intensity}`);

  if (intensity > 0) {
    writeDatasetValue(root, 'spwFieldWonder', meta.wonder);
    writeDatasetValue(root, 'spwFieldGesture', gesture);
    syncDiscoveredMarkup(root, meta, {
      spwFieldWonder: meta.wonder,
      spwFieldGesture: gesture,
      spwFieldContext: meta.context,
    });
  } else {
    writeDatasetValue(root, 'spwFieldWonder', null);
    writeDatasetValue(root, 'spwFieldGesture', null);
    writeDatasetValue(root, 'spwFieldContext', null);
  }
}

/* ==========================================================================
   Implementation mutation setting
   ========================================================================== */

function isMarkupMutationEnabled(el) {
  const html = document.documentElement;
  const body = document.body;

  if (html?.dataset.spwImplementationMutations === 'on') return true;
  if (body?.dataset.spwImplementationMutations === 'on') return true;

  return Boolean(
    el?.closest?.('[data-spw-material-context~="mutable"], [data-spw-context-features~="mutable-markup"]')
  );
}

function isCssObservedMutationEnabled(el) {
  const html = document.documentElement;
  const body = document.body;

  if (html?.dataset.spwCssObservedMutations === 'on') return true;
  if (body?.dataset.spwCssObservedMutations === 'on') return true;

  return Boolean(
    el?.closest?.('[data-spw-material-context~="css-mutable"], [data-spw-context-features~="css-observed-mutable"]')
  );
}

function syncDiscoveredMarkup(el, meta, extra = {}) {
  if (!el || !isMarkupMutationEnabled(el)) return;

  const commitCssObserved = isCssObservedMutationEnabled(el);

  if (meta?.targetKind) writeDatasetValue(el, DISCOVERED_META_DATA_KEYS.targetKind, meta.targetKind);
  if (meta?.operator) writeDatasetValue(el, DISCOVERED_META_DATA_KEYS.operator, meta.operator);
  if (meta?.wonder) writeDatasetValue(el, DISCOVERED_META_DATA_KEYS.wonder, meta.wonder);
  if (meta?.context) writeDatasetValue(el, DISCOVERED_META_DATA_KEYS.context, meta.context);
  if (meta?.affordances?.length) {
    writeDatasetValue(el, DISCOVERED_META_DATA_KEYS.affordance, meta.affordances.join(' '));
  }
  if (meta?.semantic?.expression) writeDatasetValue(el, 'spwSemanticExpression', meta.semantic.expression);
  if (meta?.semantic?.key) writeDatasetValue(el, 'spwSemanticKey', meta.semantic.key);
  if (meta?.semantic?.family) writeDatasetValue(el, 'spwSemanticFamily', meta.semantic.family);
  if (meta?.semantic?.root) writeDatasetValue(el, 'spwSemanticRoot', meta.semantic.root);
  if (meta?.semantic?.rootLabel) writeDatasetValue(el, 'spwSemanticRootLabel', meta.semantic.rootLabel);
  if (meta?.semantic?.variant) writeDatasetValue(el, 'spwSemanticVariant', meta.semantic.variant);
  if (meta?.semantic?.variantLabel) writeDatasetValue(el, 'spwSemanticVariantLabel', meta.semantic.variantLabel);
  if (meta?.semantic?.behavior) writeDatasetValue(el, 'spwSemanticBehavior', meta.semantic.behavior);
  if (meta?.semantic?.behaviorLabel) writeDatasetValue(el, 'spwSemanticBehaviorLabel', meta.semantic.behaviorLabel);
  if (meta?.semantic?.lens) writeDatasetValue(el, 'spwSemanticLens', meta.semantic.lens);
  if (meta?.semantic?.lensLabel) writeDatasetValue(el, 'spwSemanticLensLabel', meta.semantic.lensLabel);

  Object.entries(extra).forEach(([key, value]) => {
    if (CSS_OBSERVED_SEMANTIC_DATA_KEYS.includes(key) && !commitCssObserved) {
      return;
    }
    writeDatasetValue(el, key, value);
  });
}

/* ==========================================================================
   Operator swap + pin system
   ========================================================================== */

function clearSemanticExpansion(root = document) {
  const scope = root instanceof Element ? root : document;
  const selector = [
    '[data-spw-inspect-semantic-focused="true"]',
    '[data-spw-inspect-semantic-match="true"]',
    '[data-spw-inspect-semantic-expanded="true"]',
  ].join(', ');
  const nodes = [];
  if (scope instanceof Element && scope.matches?.(selector)) {
    nodes.push(scope);
  }
  scope.querySelectorAll?.(selector).forEach((node) => {
    nodes.push(node);
  });
  nodes.forEach((node) => {
    writeDatasetValue(node, 'spwInspectSemanticFocused', null);
    writeDatasetValue(node, 'spwInspectSemanticMatch', null);
    writeDatasetValue(node, 'spwInspectSemanticExpanded', null);
  });

  const host = scope instanceof HTMLElement ? scope : document.documentElement;
  if (host) {
    writeDatasetValue(host, 'spwInspectSemanticFocusRoot', null);
    writeDatasetValue(host, 'spwInspectSemanticFocusKey', null);
  }
}

function applySemanticExpansion(target, meta, nextExpanded) {
  const semantic = meta?.semantic;
  const family = semantic?.family;
  if (!family) return false;

  const scope = meta?.fieldRoot instanceof Element ? meta.fieldRoot : document;
  const matches = collectSemanticBraceMatches(scope, family);
  if (!matches.length) return false;

  clearSemanticExpansion(scope);

  const activeMatch = target instanceof Element && matches.includes(target) ? target : matches[0];

  matches.forEach((node) => {
    writeDatasetValue(node, 'spwInspectSemanticExpanded', nextExpanded ? 'true' : null);
    writeDatasetValue(node, 'spwSemanticFamily', family);
    writeDatasetValue(node, 'spwSemanticRoot', semantic.root || family);
    if (semantic.rootLabel) writeDatasetValue(node, 'spwSemanticRootLabel', semantic.rootLabel);
    if (semantic.variant) writeDatasetValue(node, 'spwSemanticVariant', semantic.variant);
    if (semantic.variantLabel) writeDatasetValue(node, 'spwSemanticVariantLabel', semantic.variantLabel);
    if (semantic.behavior) writeDatasetValue(node, 'spwSemanticBehavior', semantic.behavior);
    if (semantic.behaviorLabel) writeDatasetValue(node, 'spwSemanticBehaviorLabel', semantic.behaviorLabel);
    if (semantic.lens) writeDatasetValue(node, 'spwSemanticLens', semantic.lens);
    if (semantic.lensLabel) writeDatasetValue(node, 'spwSemanticLensLabel', semantic.lensLabel);
  });

  if (nextExpanded) {
    matches.forEach((node) => {
      writeDatasetValue(node, 'spwInspectSemanticMatch', node === activeMatch ? null : 'true');
      writeDatasetValue(node, 'spwInspectSemanticFocused', node === activeMatch ? 'true' : null);
    });

    const host = scope instanceof HTMLElement ? scope : document.documentElement;
    writeDatasetValue(host, 'spwInspectSemanticFocusRoot', family);
    writeDatasetValue(host, 'spwInspectSemanticFocusKey', semantic.key || family);
  }

  emitBraceEvents(
    [nextExpanded ? 'brace:expanded' : 'brace:collapsed'],
    buildDetail(meta, {
      committed: true,
      expanded: nextExpanded,
      semanticFamily: family,
      semanticKey: semantic.key || family,
      matchCount: matches.length,
    }),
    target
  );

  return true;
}

function handleOperatorSwap(el, meta) {
  const swappable = el.dataset.spwSwappable;
  if (!swappable) return false;

  const operators = swappable.split(',').map((s) => s.trim()).filter(Boolean);
  if (operators.length < 2) return false;

  const currentType = meta.operator || operators[0];
  const currentPrefix =
    Object.keys(PREFIX_TO_TYPE).find((prefix) => PREFIX_TO_TYPE[prefix] === currentType)
    || operators[0];

  const currentIndex = Math.max(operators.indexOf(currentPrefix), 0);
  const nextPrefix = operators[(currentIndex + 1) % operators.length];
  const nextType = PREFIX_TO_TYPE[nextPrefix] || nextPrefix;

  writeDatasetValue(el, 'spwOperator', nextType);
  syncDiscoveredMarkup(el, { ...meta, operator: nextType }, { spwResolvedOperator: nextType });

  const sigil = el.querySelector?.('.frame-sigil, .frame-card-sigil, .frame-panel-sigil');
  if (sigil) {
    const currentText = sigil.textContent || '';
    const matched = currentText.match(LEADING_OPERATOR_RE)?.[0];
    if (matched) {
      sigil.textContent = currentText.replace(LEADING_OPERATOR_RE, nextPrefix);
    }
  }

  emitBraceEvents(
    ['brace:swapped'],
    buildDetail(meta, {
      from: currentType,
      to: nextType,
      affordance: 'swap',
      committed: true,
    }),
    el
  );

  pulseLatch(el);
  return true;
}

function togglePin(el, meta) {
  const nextPinned = el.dataset.spwPinned !== 'true';

  if (nextPinned) {
    writeDatasetValue(el, 'spwPinned', 'true');
    writeDatasetValue(el, 'spwLatched', 'true');
  } else {
    writeDatasetValue(el, 'spwPinned', null);
    writeDatasetValue(el, 'spwLatched', null);
  }

  const id = meta.id;
  if (id) {
    const page = window.location.pathname;
    const pins = readPins();
    const key = pinRecordKey(page, id);

    if (nextPinned) {
      pins[key] = buildPinRecord(meta, page);
    } else {
      delete pins[key];
    }

    writePins(pins);
  }

  emitBraceEvents(
    ['brace:pinned'],
    buildDetail(meta, {
      pinned: nextPinned,
      affordance: 'pin',
      committed: true,
    }),
    el
  );

  return nextPinned;
}

function restorePins() {
  const pins = readPins();

  Object.keys(pins).forEach((key) => {
    const [page, id] = key.split('#');
    if (page !== window.location.pathname) return;

    const el =
      document.getElementById(id)
      || document.querySelector(`[data-spw-sigil="${CSS.escape(id)}"]`);

    if (el?.matches?.('[data-spw-form], .frame-sigil, .frame-card-sigil, .frame-panel-sigil')) {
      writeDatasetValue(el, 'spwPinned', 'true');
      writeDatasetValue(el, 'spwLatched', 'true');
    }
  });
}

function pulseLatch(el) {
  writeDatasetValue(el, 'spwLatched', 'true');
  window.setTimeout(() => {
    if (el.dataset.spwPinned !== 'true') {
      writeDatasetValue(el, 'spwLatched', null);
    }
  }, 320);
}

/* ==========================================================================
   Event emission
   ========================================================================== */

function buildDetail(meta, extra = {}) {
  return {
    form: meta.form,
    targetKind: meta.targetKind,
    operator: meta.operator,
    wonder: meta.wonder,
    context: meta.context,
    affordances: meta.affordances,
    semanticFamily: meta.semantic?.family || '',
    semanticKey: meta.semantic?.key || '',
    semanticRoot: meta.semantic?.root || '',
    ...extra,
  };
}

function emitBraceEvents(names, detail, el) {
  names.forEach((name) => {
    bus.emit(name, detail, { element: el });
  });
}

function capturePrimedContainment(meta, chargeContext = 'committed') {
  if (!meta?.semantic?.expression) return false;

  bus.emit('spell:capture', {
    expression: meta.semantic.expression,
    label: meta.semantic.rootLabel || meta.semantic.expression,
    origin: 'brace-primed-containment',
    originLabel: 'charged brace',
    wonder: meta.wonder || 'containment',
    operator: meta.operator,
    context: meta.context,
    primedBy: 'brace-containment-charge',
    chargeContext,
    semantic: meta.semantic,
  });

  return true;
}

/* ==========================================================================
   Pointer lifecycle
   ========================================================================== */

function onPointerEnter(event) {
  if (isCoarsePointerEvent(event)) return;
  const target = braceTarget(event.target);
  if (!target || !isOwnAffordanceTarget(target, event.target)) return;
  if (event.relatedTarget instanceof Node && target.contains(event.relatedTarget)) return;
  if (target.dataset.spwGesture) return;

  const meta = classifyTarget(target);
  setGesture(target, meta, 'charging');

  emitBraceEvents(
    ['brace:charged', 'brace:charge-start'],
    buildDetail(meta),
    target
  );
}

function updateCardPointerHyperphysics(el, event) {
  if (!(el instanceof HTMLElement)) return;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const px = Math.max(0, Math.min(1, x / rect.width));
  const py = Math.max(0, Math.min(1, y / rect.height));

  const tiltX = ((px - 0.5) * 8).toFixed(2);
  const tiltY = ((0.5 - py) * 8).toFixed(2);

  writeStyleValue(el, '--card-pointer-x', `${(px * 100).toFixed(1)}%`);
  writeStyleValue(el, '--card-pointer-y', `${(py * 100).toFixed(1)}%`);
  writeStyleValue(el, '--card-tilt-x', `${tiltX}deg`);
  writeStyleValue(el, '--card-tilt-y', `${tiltY}deg`);
}

function clearCardPointerHyperphysics(el) {
  if (!(el instanceof HTMLElement)) return;
  writeStyleValue(el, '--card-pointer-x', null);
  writeStyleValue(el, '--card-pointer-y', null);
  writeStyleValue(el, '--card-tilt-x', null);
  writeStyleValue(el, '--card-tilt-y', null);
}

function onPointerLeave(event) {
  const target = braceTarget(event.target);
  if (!target) return;
  if (event.relatedTarget instanceof Node && target.contains(event.relatedTarget)) return;

  clearCardPointerHyperphysics(target);

  const state = gestureState.get(target);
  if (state?.dragging) return;

  clearHoldTimer(target);
  const meta = state?.meta || classifyTarget(target);

  // Restore normal text selection after gesture ends
  if (target instanceof HTMLElement) {
    delete target.dataset.spwGestureArmed;
    if (target.style.userSelect === 'none' && !target.hasAttribute('data-spw-keep-user-select-none')) {
      target.style.userSelect = '';
    }
  }

  setGesture(target, meta, 'neutral');

  emitBraceEvents(
    ['brace:discharged', 'brace:discharge'],
    buildDetail(meta),
    target
  );
}

function onPointerDown(event) {
  if (!event.isPrimary || event.button !== 0) return;
  const target = braceTarget(event.target);
  if (!target || !isOwnAffordanceTarget(target, event.target)) return;

  const meta = classifyTarget(target);
  setGesture(target, meta, 'active', { source: 'pointer', button: 0 });

  emitBraceEvents(
    ['brace:activated', 'brace:activate'],
    buildDetail(meta),
    target
  );

  const timer = window.setTimeout(() => {
    const current = gestureState.get(target);
    if (!current || current.dragging) return;

    current.armed = true;
    setGesture(target, current.meta, 'armed');

    // Suppress native text selection on recognizable gesture targets during hold.
    // This prioritizes coincidental discovery (tap/hold/drag on cards, living terms, operators, seams, etc.)
    // while still allowing text selection on plain prose outside gesture contexts.
    if (target instanceof HTMLElement) {
      target.dataset.spwGestureArmed = 'true';
      // Only force none if it wasn't explicitly text-friendly. A hook's job
      // is to carry the memorable line (frames.css's own words) — its hold
      // affordance should still show (dashed border), but should not fight
      // a reader trying to select and copy the sentence it exists to say.
      // data-spw-text-friendly/-gesture-priority are the general opt-in and
      // remain unauthored anywhere on the site; hooks get this by default
      // rather than needing 13 routes to each remember to add one.
      const textFriendly = target.closest(
        '[data-spw-text-friendly="true"], [data-spw-gesture-priority="text"], [data-spw-kind="hook"], [data-spw-component-kind="hook"]'
      );
      if (!textFriendly) {
        target.style.userSelect = 'none';
      }
    }

    emitBraceEvents(
      ['brace:armed', 'brace:sustained'],
      buildDetail(current.meta, {
        armed: true,
        sustained: true,
      }),
      target
    );
  }, HOLD_THRESHOLD_MS);

  gestureState.set(target, {
    timer,
    startX: event.clientX,
    startY: event.clientY,
    dragging: false,
    armed: false,
    pointerId: event.pointerId,
    meta,
  });

  if (!isCoarsePointerEvent(event) && target.setPointerCapture) {
    try {
      target.setPointerCapture(event.pointerId);
    } catch {
      /* no-op */
    }
  }
}

function onPointerMove(event) {
  const target = braceTarget(event.target);
  if (!target) return;

  if (!isCoarsePointerEvent(event)) {
    updateCardPointerHyperphysics(target, event);
  }

  const state = gestureState.get(target);
  if (!state) return;

  const dx = event.clientX - state.startX;
  const dy = event.clientY - state.startY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (!state.dragging && distance > DRAG_THRESHOLD_PX) {
    state.dragging = true;
    clearTimeout(state.timer);

    setGesture(target, state.meta, 'projecting');

    emitBraceEvents(
      ['brace:projected', 'brace:moved', 'brace:project-move'],
      buildDetail(state.meta, { dx, dy, distance }),
      target
    );
  }

  if (state.dragging) {
    writeStyleValue(target, '--drag-dx', `${dx}px`);
    writeStyleValue(target, '--drag-dy', `${dy}px`);
    writeStyleValue(target, '--drag-distance', `${distance}px`);

    emitBraceEvents(
      ['brace:moved', 'brace:project-move'],
      buildDetail(state.meta, { dx, dy, distance }),
      target
    );
  }
}

function onPointerUp(event) {
  if (!event.isPrimary) return;
  const target = braceTarget(event.target);
  if (!target) return;

  const state = gestureState.get(target);
  const meta = state?.meta || classifyTarget(target);

  if (state) {
    clearTimeout(state.timer);

    if (state.dragging) {
      emitBraceEvents(
        ['brace:released', 'brace:project-end'],
        buildDetail(meta),
        target
      );
    } else if (state.armed) {
      commitArmedInteraction(target, state);
    }
  }

  if (shouldToggleSemanticExpansionOnRelease(target, meta, state, event)) {
    applySemanticExpansion(target, meta, target.dataset.spwInspectSemanticExpanded !== 'true');
  }

  gestureState.delete(target);

  try {
    if (target.releasePointerCapture && state?.pointerId != null) {
      target.releasePointerCapture(state.pointerId);
    }
  } catch {
    /* no-op */
  }

  const rect = target.getBoundingClientRect();
  const inside =
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom;

  if (inside) {
    setGesture(target, meta, 'charging');
    emitBraceEvents(
      ['brace:charged', 'brace:charge-start'],
      buildDetail(meta),
      target
    );
  } else {
    setGesture(target, meta, 'neutral');
    emitBraceEvents(
      ['brace:discharged', 'brace:discharge'],
      buildDetail(meta),
      target
    );
  }
}

function onPointerCancel(event) {
  if (!event.isPrimary) return;
  const target = braceTarget(event.target);
  if (!target) return;

  const state = gestureState.get(target);
  const meta = state?.meta || classifyTarget(target);

  clearHoldTimer(target);
  setGesture(target, meta, 'neutral');

  emitBraceEvents(
    ['brace:discharged', 'brace:discharge'],
    buildDetail(meta, { canceled: true }),
    target
  );
}

function onDoubleClick(event) {
  const target = braceTarget(event.target);
  if (!target || !isOwnAffordanceTarget(target, event.target)) return;
  if (!isSemanticTapTarget(target)) return;

  const meta = classifyTarget(target);
  if (!meta.semantic?.family && !meta.semantic?.expression) return;

  event.preventDefault();
  clearHoldTimer(target);

  const expanded = meta.semantic?.family
    ? applySemanticExpansion(target, meta, true)
    : false;

  setGesture(target, meta, 'committed', { source: 'pointer', button: event.button ?? 0 });
  capturePrimedContainment(meta, 'double-click-inspect');

  emitBraceEvents(
    ['brace:double-clicked', 'brace:inspected'],
    buildDetail(meta, {
      committed: true,
      affordance: 'inspect-prime',
      expanded,
    }),
    target
  );

  window.setTimeout(() => {
    if (target.dataset.spwGesture === 'committed') {
      setGesture(target, meta, 'charging');
    }
  }, 260);
}

function commitArmedInteraction(target, state) {
  const { meta } = state;
  let committed = false;
  let action = null;

  if (meta.semantic?.family) {
    committed = applySemanticExpansion(target, meta, target.dataset.spwInspectSemanticExpanded !== 'true');
    action = committed ? 'semantic-expand' : null;
  } else if (meta.affordances.includes('swap')) {
    committed = handleOperatorSwap(target, meta);
    action = committed ? 'swap' : null;
  } else if (meta.affordances.includes('pin')) {
    togglePin(target, meta);
    committed = true;
    action = 'pin';
  } else if (meta.affordances.includes('toggle')) {
    committed = true;
    action = 'toggle';
  }

  if (committed) {
    setGesture(target, meta, 'committed');

    emitBraceEvents(
      ['brace:committed'],
      buildDetail(meta, {
        committed: true,
        affordance: action,
      }),
      target
    );

    // Emission is additive; cauldron owns dedupe, refresh, and display policy.
    capturePrimedContainment(meta, 'committed');
  }
}

function clearHoldTimer(el) {
  const state = gestureState.get(el);
  if (!state) return;

  clearTimeout(state.timer);
}

function isCoarsePointerEvent(event) {
  return COARSE_POINTER_TYPES.has(event?.pointerType || '');
}

function shouldToggleSemanticExpansionOnRelease(target, meta, state, event) {
  if (!meta?.semantic?.family) return false;
  if (state?.dragging || state?.armed) return false;
  if (isCoarsePointerEvent(event)) return false;
  return isSemanticTapTarget(target);
}

function isSemanticTapTarget(target) {
  // Generalizability note (Patch 008 audit): This selector is the primary extension point.
  // Any element matching here participates in the full gesture state machine (armed/charging/
  // sustained/committed/projected) and primed-containment emission to cauldron.
  // Authors can make new content gesture-aware by adding data-spw-living-term,
  // data-spw-concept, data-spw-semantic-expression, or matching one of the spw-* sigil classes.
  // See also data-spw-gesture-contract on disclosures for declarative affordance hints.
  return Boolean(
    target?.matches?.('.spw-delimiter, .frame-sigil, .frame-card-sigil, .frame-panel-sigil, [data-spw-semantic-expression], .spw-living-term, [data-spw-living-term]')
  );
}

/* ==========================================================================
   Keyboard lifecycle
   ========================================================================== */

// Native controls already own Enter/Space (and their modified variants).
// A button can itself be a .frame-sigil, so the nested-affordance guard alone
// does not protect its click. Keep both press and release out of this machine.
// Shared selector lives in dom-contracts so every route's lens/button/link
// is covered the same way.
function ownsNativeKeyboard(event) {
  return isNativeControl(event.target) || event.target?.isContentEditable;
}

function onKeyDown(event) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  if (event.repeat) return;

  const target = braceTarget(event.target);
  if (!target || !isOwnAffordanceTarget(target, event.target)) return;
  if (ownsNativeKeyboard(event)) return;

  event.preventDefault();

  const meta = classifyTarget(target);
  setGesture(target, meta, 'active');

  emitBraceEvents(
    ['brace:activated', 'brace:activate'],
    buildDetail(meta, { keyboard: true }),
    target
  );

  if (event.shiftKey && meta.affordances.includes('swap')) {
    handleOperatorSwap(target, meta);
    emitBraceEvents(
      ['brace:committed'],
      buildDetail(meta, {
        keyboard: true,
        committed: true,
        affordance: 'swap',
      }),
      target
    );
    return;
  }

  if ((event.altKey || event.metaKey) && meta.affordances.includes('pin')) {
    togglePin(target, meta);
    emitBraceEvents(
      ['brace:committed'],
      buildDetail(meta, {
        keyboard: true,
        committed: true,
        affordance: 'pin',
      }),
      target
    );
  }

  if (meta.semantic?.family && !event.shiftKey && !event.altKey && !event.metaKey && !event.ctrlKey) {
    capturePrimedContainment(meta, 'keyboard-commit');
  }
}

function onKeyUp(event) {
  if (event.key !== 'Enter' && event.key !== ' ') return;

  const target = braceTarget(event.target);
  if (!target || !isOwnAffordanceTarget(target, event.target)) return;
  if (ownsNativeKeyboard(event)) return;

  const meta = classifyTarget(target);
  setGesture(target, meta, 'charging', { source: 'keyboard' });

  emitBraceEvents(
    ['brace:discharged', 'brace:discharge'],
    buildDetail(meta, { keyboard: true }),
    target
  );

  if (meta.semantic?.family && !event.shiftKey && !event.altKey && !event.metaKey && !event.ctrlKey) {
    applySemanticExpansion(target, meta, target.dataset.spwInspectSemanticExpanded !== 'true');
  }
}
