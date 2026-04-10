/**
 * Brace Gesture Physics
 *
 * Extends the CSS brace-form system with semantic gesture states:
 *   hover   → charge (glow builds)
 *   click   → activate (snap open / discharge pulse)
 *   hold    → sustain (deep charge accumulation, triggers pinning)
 *   drag    → project (element lifts and follows, shadow elongates)
 *
 * Registered states:
 *   data-spw-pinned="true" (bookmarked/persisted)
 *
 * Swappable Operators:
 *   data-spw-swappable="^,?,*,@" (cycles through these on click)
 *
 * Gesture states are expressed as data attributes so CSS can respond:
 *   data-spw-gesture="charging"
 *   data-spw-gesture="active"
 *   data-spw-gesture="sustained"
 *   data-spw-gesture="projecting"
 *
 * These attributes are set on any element matching [data-spw-form].
 */

const HOLD_THRESHOLD_MS = 420;
const DRAG_THRESHOLD_PX = 8;

/** @type {WeakMap<Element, {timer:number, startX:number, startY:number, dragging:boolean}>} */
const gestureState = new WeakMap();

/**
 * Initialize brace gesture physics on all [data-spw-form] elements.
 * Safe to call multiple times; uses event delegation on <body>.
 */
export function initBraceGestures() {
    const body = document.body;
    if (body.dataset.braceGesturesInit) return;
    body.dataset.braceGesturesInit = '1';

    restorePins();

    // ── Hover: charge / discharge ──────────────────────────────────
    body.addEventListener('pointerenter', onPointerEnter, true);
    body.addEventListener('pointerleave', onPointerLeave, true);

    // ── Click / Hold / Drag ─────────────────────────────────────────
    body.addEventListener('pointerdown', onPointerDown, true);
    body.addEventListener('pointermove', onPointerMove, true);
    body.addEventListener('pointerup', onPointerUp, true);
    body.addEventListener('pointercancel', onPointerUp, true);

    // ── Keyboard support ────────────────────────────────────────────
    body.addEventListener('keydown', onKeyDown, true);
    body.addEventListener('keyup', onKeyUp, true);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function braceTarget(el) {
    return el?.closest?.('[data-spw-form]');
}

function setGesture(el, gesture) {
    if (!el) return;
    if (gesture) {
        el.dataset.spwGesture = gesture;
    } else {
        delete el.dataset.spwGesture;
    }
}

function handleOperatorSwap(el) {
    const swappable = el.dataset.spwSwappable;
    if (!swappable) return;

    const operators = swappable.split(',');
    const current = el.dataset.spwOperator || operators[0];
    const currentIndex = operators.indexOf(current);
    const nextIndex = (currentIndex + 1) % operators.length;
    const nextOp = operators[nextIndex];

    el.dataset.spwOperator = nextOp;
    
    // Also update sigil text if it exists
    const sigil = el.querySelector('.frame-sigil, .frame-card-sigil, .frame-panel-sigil');
    if (sigil) {
        // Many sigils include the operator in their text, we try to preserve the label
        const regex = /^[#>^?~!@*&=%$%]+/;
        if (regex.test(sigil.textContent)) {
            sigil.textContent = sigil.textContent.replace(regex, nextOp);
        } else {
            // If it's just a text labe, we might not want to overwrite it without care
            // but for now, let's assume if it's swappable, we want to see the op.
        }
    }

    emitBraceEvent(el, 'swap', { from: current, to: nextOp });
}

function togglePin(el) {
    const isPinned = el.dataset.spwPinned === 'true';
    const nextPinned = !isPinned;
    el.dataset.spwPinned = nextPinned;
    
    // Save to localStorage
    const page = window.location.pathname;
    const id = el.id || el.dataset.spwSigil || el.querySelector('.frame-sigil')?.textContent;
    if (id) {
        const pins = JSON.parse(localStorage.getItem('spw-pins') || '{}');
        const key = `${page}#${id}`;
        if (nextPinned) {
            pins[key] = { page, id, timestamp: Date.now(), title: document.title };
        } else {
            delete pins[key];
        }
        localStorage.setItem('spw-pins', JSON.stringify(pins));
    }

    emitBraceEvent(el, 'pin-toggle', { pinned: nextPinned });
}

function restorePins() {
    const pins = JSON.parse(localStorage.getItem('spw-pins') || '{}');
    Object.keys(pins).forEach(key => {
        const [page, id] = key.split('#');
        if (page === window.location.pathname) {
            const el = document.getElementById(id) || document.querySelector(`[data-spw-sigil="${id}"]`);
            if (el && el.hasAttribute('data-spw-form')) {
                el.dataset.spwPinned = 'true';
            }
        }
    });
}

function emitBraceEvent(el, name, detail = {}) {
    if (!el) return;
    el.dispatchEvent(new CustomEvent(`spw:brace:${name}`, {
        bubbles: true,
        detail: { form: el.dataset.spwForm, ...detail }
    }));
}

// ── Hover ────────────────────────────────────────────────────────────────────

function onPointerEnter(e) {
    const target = braceTarget(e.target);
    if (!target) return;
    // Only transition to charging if not already in a deeper state
    const current = target.dataset.spwGesture;
    if (!current) {
        setGesture(target, 'charging');
        emitBraceEvent(target, 'charge-start');
    }
}

function onPointerLeave(e) {
    const target = braceTarget(e.target);
    if (!target) return;
    const state = gestureState.get(target);
    // If we're dragging, don't discharge on leave
    if (state?.dragging) return;
    clearHoldTimer(target);
    setGesture(target, null);
    emitBraceEvent(target, 'discharge');
}

// ── Pointer Down / Hold / Drag ──────────────────────────────────────────────

function onPointerDown(e) {
    const target = braceTarget(e.target);
    if (!target) return;

    setGesture(target, 'active');
    handleOperatorSwap(target);
    emitBraceEvent(target, 'activate');

    const timer = window.setTimeout(() => {
        const s = gestureState.get(target);
        if (s && !s.dragging) {
            setGesture(target, 'sustained');
            togglePin(target);
            emitBraceEvent(target, 'sustain');
        }
    }, HOLD_THRESHOLD_MS);

    gestureState.set(target, {
        timer,
        startX: e.clientX,
        startY: e.clientY,
        dragging: false
    });
}

function onPointerMove(e) {
    const target = braceTarget(e.target);
    if (!target) return;
    const state = gestureState.get(target);
    if (!state) return;

    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (!state.dragging && distance > DRAG_THRESHOLD_PX) {
        state.dragging = true;
        clearTimeout(state.timer);
        setGesture(target, 'projecting');
        emitBraceEvent(target, 'project-start');
    }

    if (state.dragging) {
        // Expose drag vector as CSS custom properties for cinematic response
        target.style.setProperty('--drag-dx', `${dx}px`);
        target.style.setProperty('--drag-dy', `${dy}px`);
        target.style.setProperty('--drag-distance', `${distance}px`);
        emitBraceEvent(target, 'project-move', { dx, dy, distance });
    }
}

function onPointerUp(e) {
    const target = braceTarget(e.target);
    if (!target) return;
    const state = gestureState.get(target);

    if (state) {
        clearTimeout(state.timer);
        if (state.dragging) {
            emitBraceEvent(target, 'project-end');
            // Clean up drag properties
            target.style.removeProperty('--drag-dx');
            target.style.removeProperty('--drag-dy');
            target.style.removeProperty('--drag-distance');
        }
    }

    gestureState.delete(target);

    // Return to charging if pointer is still over the element
    const rect = target.getBoundingClientRect();
    const inside = (
        e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom
    );
    setGesture(target, inside ? 'charging' : null);
    emitBraceEvent(target, inside ? 'charge-start' : 'discharge');
}

function clearHoldTimer(el) {
    const state = gestureState.get(el);
    if (state) {
        clearTimeout(state.timer);
        gestureState.delete(el);
    }
}

// ── Keyboard ────────────────────────────────────────────────────────────────

function onKeyDown(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const target = braceTarget(e.target);
    if (!target) return;
    e.preventDefault();
    setGesture(target, 'active');
    emitBraceEvent(target, 'activate');
}

function onKeyUp(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const target = braceTarget(e.target);
    if (!target) return;
    setGesture(target, 'charging');
    emitBraceEvent(target, 'discharge');
}
