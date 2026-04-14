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
 *
 * Optional implementation mutation
 * - Enabled by:
 *     html[data-spw-implementation-mutations="on"]
 *     body[data-spw-implementation-mutations="on"]
 *     or nearest ancestor [data-spw-material-context~="mutable"]
 *
 * When enabled, resolved semantic hints are written back into markup:
 * - data-spw-handle-kind
 * - data-spw-resolved-affordance
 * - data-spw-resolved-operator
 * - data-spw-wonder
 * - data-spw-last-gesture
 * - data-spw-context
 *
 * Local field hormones
 * - Updates nearest .site-frame / [data-spw-field-root] with lightweight
 *   contextual variables such as:
 *     --spw-field-inquiry
 *     --spw-field-memory
 *     --spw-field-projection
 * - These are intended for subtle environmental responses in CSS.
 */

import { bus } from '../refactor/spw-bus.js';

const HOLD_THRESHOLD_MS = 420;
const DRAG_THRESHOLD_PX = 8;

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

  body.addEventListener('keydown', onKeyDown, true);
  body.addEventListener('keyup', onKeyUp, true);
}

/* ==========================================================================
   Target resolution + semantic classification
   ========================================================================== */

function braceTarget(node) {
  return node?.closest?.('[data-spw-form], .spw-delimiter') || null;
}

function classifyTarget(el) {
  const targetKind = resolveTargetKind(el);
  const operator = resolveOperator(el);
  const affordances = resolveAffordances(el, targetKind);
  const wonder = resolveWonder(el, operator, targetKind, affordances);
  const context = resolveContext(el);
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
  if (el.matches('.frame-card, .frame-panel, .mode-panel, .software-card')) return 'card';
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

function setGesture(el, meta, gesture) {
  if (!el) return;

  if (!gesture || gesture === 'neutral') {
    delete el.dataset.spwGesture;
    delete el.dataset.spwCharge;
    delete el.dataset.spwArmed;
    delete el.dataset.spwLastGesture;
    el.style.removeProperty('--charge');
    el.style.removeProperty('--drag-dx');
    el.style.removeProperty('--drag-dy');
    el.style.removeProperty('--drag-distance');
    updateFieldHormones(meta, 'neutral');
    syncDiscoveredMarkup(el, meta, { spwLastGesture: null, spwArmed: null });
    return;
  }

  el.dataset.spwGesture = gesture;
  el.dataset.spwCharge = GESTURE_TO_CHARGE_BUCKET[gesture] || 'active';
  el.style.setProperty('--charge', `${CHARGE_BY_GESTURE[gesture] ?? 0}`);

  if (gesture === 'armed') {
    el.dataset.spwArmed = 'true';
  } else {
    delete el.dataset.spwArmed;
  }

  syncDiscoveredMarkup(el, meta, {
    spwLastGesture: gesture,
    spwArmed: gesture === 'armed' ? 'true' : null,
  });

  updateFieldHormones(meta, gesture);
}

function updateFieldHormones(meta, gesture) {
  const root = meta?.fieldRoot;
  if (!(root instanceof HTMLElement)) return;

  const intensity = CHARGE_BY_GESTURE[gesture] ?? 0;

  FIELD_WONDERS.forEach((name) => {
    root.style.setProperty(`--spw-field-${name}`, name === meta.wonder ? `${intensity}` : '0');
  });

  root.style.setProperty('--spw-field-charge', `${intensity}`);

  if (intensity > 0) {
    root.dataset.spwFieldWonder = meta.wonder;
    root.dataset.spwFieldGesture = gesture;
    syncDiscoveredMarkup(root, meta, {
      spwFieldWonder: meta.wonder,
      spwFieldGesture: gesture,
      spwFieldContext: meta.context,
    });
  } else {
    delete root.dataset.spwFieldWonder;
    delete root.dataset.spwFieldGesture;
    delete root.dataset.spwFieldContext;
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

function syncDiscoveredMarkup(el, meta, extra = {}) {
  if (!el || !isMarkupMutationEnabled(el)) return;

  if (meta?.targetKind) el.dataset.spwHandleKind = meta.targetKind;
  if (meta?.operator) el.dataset.spwResolvedOperator = meta.operator;
  if (meta?.wonder) el.dataset.spwWonder = meta.wonder;
  if (meta?.context) el.dataset.spwContext = meta.context;
  if (meta?.affordances?.length) {
    el.dataset.spwResolvedAffordance = meta.affordances.join(' ');
  }

  Object.entries(extra).forEach(([key, value]) => {
    if (value == null) {
      delete el.dataset[key];
    } else {
      el.dataset[key] = String(value);
    }
  });
}

/* ==========================================================================
   Operator swap + pin system
   ========================================================================== */

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

  el.dataset.spwOperator = nextType;
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
    el.dataset.spwPinned = 'true';
    el.dataset.spwLatched = 'true';
  } else {
    delete el.dataset.spwPinned;
    delete el.dataset.spwLatched;
  }

  const id = meta.id;
  if (id) {
    const page = window.location.pathname;
    const pins = JSON.parse(localStorage.getItem('spw-pins') || '{}');
    const key = `${page}#${id}`;

    if (nextPinned) {
      pins[key] = {
        page,
        id,
        timestamp: Date.now(),
        title: document.title,
        wonder: meta.wonder,
        operator: meta.operator,
        context: meta.context,
      };
    } else {
      delete pins[key];
    }

    localStorage.setItem('spw-pins', JSON.stringify(pins));
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
  const pins = JSON.parse(localStorage.getItem('spw-pins') || '{}');

  Object.keys(pins).forEach((key) => {
    const [page, id] = key.split('#');
    if (page !== window.location.pathname) return;

    const el =
      document.getElementById(id)
      || document.querySelector(`[data-spw-sigil="${CSS.escape(id)}"]`);

    if (el?.matches?.('[data-spw-form], .frame-sigil, .frame-card-sigil, .frame-panel-sigil')) {
      el.dataset.spwPinned = 'true';
      el.dataset.spwLatched = 'true';
    }
  });
}

function pulseLatch(el) {
  el.dataset.spwLatched = 'true';
  window.setTimeout(() => {
    if (el.dataset.spwPinned !== 'true') {
      delete el.dataset.spwLatched;
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
    ...extra,
  };
}

function emitBraceEvents(names, detail, el) {
  names.forEach((name) => {
    bus.emit(name, detail, { element: el });
  });
}

/* ==========================================================================
   Pointer lifecycle
   ========================================================================== */

function onPointerEnter(event) {
  const target = braceTarget(event.target);
  if (!target) return;
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

function onPointerLeave(event) {
  const target = braceTarget(event.target);
  if (!target) return;
  if (event.relatedTarget instanceof Node && target.contains(event.relatedTarget)) return;

  const state = gestureState.get(target);
  if (state?.dragging) return;

  clearHoldTimer(target);
  const meta = state?.meta || classifyTarget(target);

  setGesture(target, meta, 'neutral');

  emitBraceEvents(
    ['brace:discharged', 'brace:discharge'],
    buildDetail(meta),
    target
  );
}

function onPointerDown(event) {
  const target = braceTarget(event.target);
  if (!target) return;

  const meta = classifyTarget(target);
  setGesture(target, meta, 'active');

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

  if (target.setPointerCapture) {
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
    target.style.setProperty('--drag-dx', `${dx}px`);
    target.style.setProperty('--drag-dy', `${dy}px`);
    target.style.setProperty('--drag-distance', `${distance}px`);

    emitBraceEvents(
      ['brace:moved', 'brace:project-move'],
      buildDetail(state.meta, { dx, dy, distance }),
      target
    );
  }
}

function onPointerUp(event) {
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

function commitArmedInteraction(target, state) {
  const { meta } = state;
  let committed = false;
  let action = null;

  if (meta.affordances.includes('swap')) {
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
  }
}

function clearHoldTimer(el) {
  const state = gestureState.get(el);
  if (!state) return;

  clearTimeout(state.timer);
}

/* ==========================================================================
   Keyboard lifecycle
   ========================================================================== */

function onKeyDown(event) {
  if (event.key !== 'Enter' && event.key !== ' ') return;

  const target = braceTarget(event.target);
  if (!target) return;

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
}

function onKeyUp(event) {
  if (event.key !== 'Enter' && event.key !== ' ') return;

  const target = braceTarget(event.target);
  if (!target) return;

  const meta = classifyTarget(target);
  setGesture(target, meta, 'charging');

  emitBraceEvents(
    ['brace:discharged', 'brace:discharge'],
    buildDetail(meta, { keyboard: true }),
    target
  );
}