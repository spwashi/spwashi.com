/**
 * Brace Gesture Physics
 *
 * Translates pointer and keyboard interactions on [data-spw-form] elements
 * into semantic gesture states, then routes all events through SpwBus so
 * every listener in the system — CSS, JS, console — sees the same signal.
 *
 * Gesture lifecycle (also expressed as CSS data-spw-gesture attributes):
 *   neutral   → (pointerenter) → charging
 *   charging  → (pointerdown)  → active
 *   active    → (hold 420ms)   → sustained    (triggers pin)
 *   active    → (drag 8px)     → projecting
 *   any state → (pointerleave) → neutral
 *
 * Charge levels written to --charge by the bus:
 *   charging=0.25  active=0.65  sustained=0.90  projecting=0.50  neutral=0
 *
 * CSS contract:
 *   data-spw-gesture  — current gesture state label
 *   data-spw-charge   — charge bucket: 'charging'|'active'|'sustained'
 *   data-spw-pinned   — persisted bookmark
 *   --drag-dx, --drag-dy, --drag-distance — live drag vector (projecting only)
 */

import { bus } from './spw-bus.js';

const HOLD_THRESHOLD_MS = 420;
const DRAG_THRESHOLD_PX = 8;

// Maps operator prefix strings (from data-spw-swappable) to CSS type names.
const PREFIX_TO_TYPE = Object.freeze({
    '#>': 'frame',   '#:': 'layer',    '.': 'baseline',
    '^':  'object',  '~':  'ref',      '?': 'probe',
    '@':  'action',  '*':  'stream',   '&': 'merge',
    '=':  'binding', '$':  'meta',     '%': 'normalize',
    '!':  'pragma',  '>':  'surface',
});

/** @type {WeakMap<Element, {timer:number, startX:number, startY:number, dragging:boolean}>} */
const gestureState = new WeakMap();

/**
 * Initialize brace gesture physics on all [data-spw-form] and .spw-delimiter
 * elements. Safe to call multiple times; uses event delegation on <body>.
 */
export function initBraceGestures() {
    const body = document.body;
    if (body.dataset.braceGesturesInit) return;
    body.dataset.braceGesturesInit = '1';

    restorePins();

    body.addEventListener('pointerenter', onPointerEnter, true);
    body.addEventListener('pointerleave', onPointerLeave, true);
    body.addEventListener('pointerdown',  onPointerDown,  true);
    body.addEventListener('pointermove',  onPointerMove,  true);
    body.addEventListener('pointerup',    onPointerUp,    true);
    body.addEventListener('pointercancel',onPointerUp,    true);
    body.addEventListener('keydown',      onKeyDown,      true);
    body.addEventListener('keyup',        onKeyUp,        true);
}

// ── Target resolution ────────────────────────────────────────────────────────

/** Returns the nearest [data-spw-form] or .spw-delimiter ancestor. */
function braceTarget(el) {
    return el?.closest?.('[data-spw-form], .spw-delimiter');
}

// ── Gesture state ────────────────────────────────────────────────────────────

function setGesture(el, gesture) {
    if (!el) return;
    if (gesture) {
        el.dataset.spwGesture = gesture;
    } else {
        delete el.dataset.spwGesture;
        delete el.dataset.spwCharge;
        el.style.removeProperty('--charge');
    }
}

// ── Operator swap ────────────────────────────────────────────────────────────

function handleOperatorSwap(el) {
    const swappable = el.dataset.spwSwappable;
    if (!swappable) return;

    const operators    = swappable.split(',');
    const currentRaw   = el.dataset.spwOperator || operators[0];
    // Reverse-map type name back to prefix for indexOf
    const currentPrefix = Object.keys(PREFIX_TO_TYPE).find(k => PREFIX_TO_TYPE[k] === currentRaw) || currentRaw;
    const currentIndex  = operators.indexOf(currentPrefix);
    const nextOp        = operators[(currentIndex + 1) % operators.length];

    // Normalize to type name so CSS [data-spw-operator="frame"] selectors match
    const nextType = PREFIX_TO_TYPE[nextOp] || nextOp;
    el.dataset.spwOperator = nextType;

    // Update any visible sigil text
    const sigil = el.querySelector('.frame-sigil, .frame-card-sigil, .frame-panel-sigil');
    if (sigil) {
        const regex = /^[#>^?~!@*&=%$%]+/;
        if (regex.test(sigil.textContent)) {
            sigil.textContent = sigil.textContent.replace(regex, nextOp);
        }
    }

    bus.emit('brace:swapped', { form: el.dataset.spwForm, from: currentRaw, to: nextType }, { element: el });
}

// ── Pin system ───────────────────────────────────────────────────────────────

function togglePin(el) {
    const nextPinned = el.dataset.spwPinned !== 'true';
    el.dataset.spwPinned = nextPinned;

    const page = window.location.pathname;
    const id   = el.id || el.dataset.spwSigil || el.querySelector('.frame-sigil')?.textContent;
    if (id) {
        const pins = JSON.parse(localStorage.getItem('spw-pins') || '{}');
        const key  = `${page}#${id}`;
        if (nextPinned) {
            pins[key] = { page, id, timestamp: Date.now(), title: document.title };
        } else {
            delete pins[key];
        }
        localStorage.setItem('spw-pins', JSON.stringify(pins));
    }

    bus.emit('brace:pinned', { form: el.dataset.spwForm, pinned: nextPinned }, { element: el });
}

function restorePins() {
    const pins = JSON.parse(localStorage.getItem('spw-pins') || '{}');
    Object.keys(pins).forEach(key => {
        const [page, id] = key.split('#');
        if (page === window.location.pathname) {
            const el = document.getElementById(id)
                ?? document.querySelector(`[data-spw-sigil="${id}"]`);
            if (el?.hasAttribute('data-spw-form')) {
                el.dataset.spwPinned = 'true';
            }
        }
    });
}

// ── Hover ────────────────────────────────────────────────────────────────────

function onPointerEnter(e) {
    const target = braceTarget(e.target);
    if (!target || target.dataset.spwGesture) return;

    setGesture(target, 'charging');
    bus.emit('brace:charged', { form: target.dataset.spwForm }, { element: target });
}

function onPointerLeave(e) {
    const target = braceTarget(e.target);
    if (!target) return;

    const state = gestureState.get(target);
    if (state?.dragging) return; // don't discharge mid-drag

    clearHoldTimer(target);
    setGesture(target, null);
    bus.emit('brace:discharged', { form: target.dataset.spwForm }, { element: target });
}

// ── Down / Hold / Drag ───────────────────────────────────────────────────────

function onPointerDown(e) {
    const target = braceTarget(e.target);
    if (!target) return;

    setGesture(target, 'active');
    handleOperatorSwap(target);
    bus.emit('brace:activated', { form: target.dataset.spwForm }, { element: target });

    const timer = window.setTimeout(() => {
        const s = gestureState.get(target);
        if (s && !s.dragging) {
            setGesture(target, 'sustained');
            togglePin(target);
            bus.emit('brace:sustained', { form: target.dataset.spwForm }, { element: target });
        }
    }, HOLD_THRESHOLD_MS);

    gestureState.set(target, { timer, startX: e.clientX, startY: e.clientY, dragging: false });
}

function onPointerMove(e) {
    const target = braceTarget(e.target);
    if (!target) return;

    const state = gestureState.get(target);
    if (!state) return;

    const dx       = e.clientX - state.startX;
    const dy       = e.clientY - state.startY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (!state.dragging && distance > DRAG_THRESHOLD_PX) {
        state.dragging = true;
        clearTimeout(state.timer);
        setGesture(target, 'projecting');
        bus.emit('brace:projected', { form: target.dataset.spwForm, dx, dy, distance }, { element: target });
    }

    if (state.dragging) {
        target.style.setProperty('--drag-dx',       `${dx}px`);
        target.style.setProperty('--drag-dy',       `${dy}px`);
        target.style.setProperty('--drag-distance', `${distance}px`);
        bus.emit('brace:moved', { form: target.dataset.spwForm, dx, dy, distance }, { element: target });
    }
}

function onPointerUp(e) {
    const target = braceTarget(e.target);
    if (!target) return;

    const state = gestureState.get(target);
    if (state) {
        clearTimeout(state.timer);
        if (state.dragging) {
            target.style.removeProperty('--drag-dx');
            target.style.removeProperty('--drag-dy');
            target.style.removeProperty('--drag-distance');
            bus.emit('brace:released', { form: target.dataset.spwForm }, { element: target });
        }
    }
    gestureState.delete(target);

    const rect   = target.getBoundingClientRect();
    const inside = (
        e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top  && e.clientY <= rect.bottom
    );

    if (inside) {
        setGesture(target, 'charging');
        bus.emit('brace:charged', { form: target.dataset.spwForm }, { element: target });
    } else {
        setGesture(target, null);
        bus.emit('brace:discharged', { form: target.dataset.spwForm }, { element: target });
    }
}

function clearHoldTimer(el) {
    const state = gestureState.get(el);
    if (state) {
        clearTimeout(state.timer);
        gestureState.delete(el);
    }
}

// ── Keyboard ─────────────────────────────────────────────────────────────────

function onKeyDown(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const target = braceTarget(e.target);
    if (!target) return;
    e.preventDefault();
    setGesture(target, 'active');
    bus.emit('brace:activated', { form: target.dataset.spwForm }, { element: target });
}

function onKeyUp(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const target = braceTarget(e.target);
    if (!target) return;
    setGesture(target, 'charging');
    bus.emit('brace:discharged', { form: target.dataset.spwForm }, { element: target });
}
