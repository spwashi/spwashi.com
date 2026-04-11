/**
 * SpwBus — unified event coordination for all Spw systems.
 *
 * Design principles:
 *  1. Single emit path: every custom event passes through here
 *  2. Consistent payload: every event includes { _name, _ts, _source, ...detail }
 *  3. Backward compat: also dispatches legacy DOM event names so CSS/HTML stays stable
 *  4. Charge model: automatically tracks and writes --charge (0→1) onto elements
 *  5. Introspection: bus.recent() exposes event history for the console and debugging
 *
 * Canonical event names use colon-separated "noun:verb-past" form:
 *
 *   Gesture       brace:charged | brace:discharged | brace:activated | brace:sustained
 *                 brace:projected | brace:moved | brace:released | brace:swapped | brace:pinned
 *
 *   Frame         frame:activated | frame:mode
 *
 *   Operator      operator:phased | operator:activated
 *
 *   Spirit        spirit:shifted
 *
 *   Field         field:charged | field:sliced
 *
 *   Spell         spell:popped | spell:reset | spell:checkpoint | spell:cast
 *
 *   Settings      settings:changed
 *
 *   Lattice       lattice:cycled
 *
 * Usage:
 *   import { bus } from './spw-bus.js';
 *
 *   bus.emit('brace:charged', { form }, { element: el });
 *   const off = bus.on('brace:activated', handler);
 *   off(); // unsubscribe
 *   bus.getCharge(el); // → 0..1
 */

// ── Charge table ───────────────────────────────────────────────────────────
// Each event maps to a normalized charge level (0 = neutral, 1 = manifest).
// The bus writes this value to `--charge` on the element, enabling CSS to
// drive all cinematic effects from a single source of truth.

const CHARGE_BY_EVENT = Object.freeze({
    'brace:charged':    0.25,
    'brace:activated':  0.65,
    'brace:sustained':  0.90,
    'brace:projected':  0.50,
    'brace:moved':      0.50,
    'brace:discharged': 0,
    'brace:released':   0,
    // Pinned elements hold a residual charge even after the gesture ends
    'brace:pinned':     0.30,
});

// ── Legacy event name map ──────────────────────────────────────────────────
// New canonical names → old DOM event names.
// Both are dispatched so existing code requires no changes.

const LEGACY = Object.freeze({
    'brace:charged':      'spw:brace:charge-start',
    'brace:discharged':   'spw:brace:discharge',
    'brace:activated':    'spw:brace:activate',
    'brace:sustained':    'spw:brace:sustain',
    'brace:projected':    'spw:brace:project-start',
    'brace:moved':        'spw:brace:project-move',
    'brace:released':     'spw:brace:project-end',
    'brace:swapped':      'spw:brace:swap',
    'brace:pinned':       'spw:brace:pin-toggle',
    'frame:activated':    'spw:frame-change',
    'frame:mode':         'spw:mode-change',
    'operator:phased':    'spw:phase:change',
    'operator:activated': 'spw:operator-activated',
    'spirit:shifted':     'spw:phase-change',
    'settings:changed':   'spw:settings-change',
    'spell:reset':        'spw:haptics:reset',
    'spell:checkpoint':   'spw:haptics:checkpoint',
    'field:charged':      'electromagnetic:charge-change',
    'lattice:cycled':     'spw:phase:cycle',
});

// ── SpwBus ─────────────────────────────────────────────────────────────────

class SpwBus {
    #history    = [];
    #maxHistory = 100;
    #chargeMap  = new WeakMap(); // element → current 0..1 charge

    /**
     * Emit a canonical Spw event.
     *
     * @param {string}  name              Canonical name, e.g. 'brace:charged'
     * @param {object}  detail            Event payload (merged with metadata)
     * @param {object}  [opts]
     * @param {EventTarget} [opts.target=document]
     * @param {boolean}     [opts.bubbles=true]
     * @param {Element}     [opts.element]  Enables charge tracking on this element
     */
    emit(name, detail = {}, { target = document, bubbles = true, element = null } = {}) {
        const ts  = Date.now();
        const src = name.split(':')[0];

        const enriched = { ...detail, _name: `spw:${name}`, _ts: ts, _source: src };

        this.#record(name, enriched, ts);

        // Canonical event (e.g. "spw:brace:charged")
        target.dispatchEvent(new CustomEvent(`spw:${name}`, {
            detail:   enriched,
            bubbles,
            composed: true,
        }));

        // Legacy event for backward compat (e.g. "spw:brace:charge-start")
        const legacyName = LEGACY[name];
        if (legacyName) {
            target.dispatchEvent(new CustomEvent(legacyName, {
                detail:   enriched,
                bubbles,
                composed: true,
            }));
        }

        // Update charge on element if provided (or detected in detail)
        const el = element ?? (detail.element instanceof Element ? detail.element : null);
        if (el) this.#applyCharge(el, name);

        return { name, detail: enriched, ts };
    }

    /**
     * Listen for a canonical Spw event.
     * Returns an unsubscribe function.
     *
     * @param {string}      name
     * @param {Function}    handler
     * @param {object}      [opts]
     * @param {EventTarget} [opts.target=document]
     * @param {boolean}     [opts.once=false]
     * @param {AbortSignal} [opts.signal]
     */
    on(name, handler, { target = document, once = false, signal } = {}) {
        const canonical = `spw:${name}`;
        const options   = { once };
        if (signal) options.signal = signal;
        target.addEventListener(canonical, handler, options);
        return () => target.removeEventListener(canonical, handler);
    }

    /**
     * Read recent event history. Optional string filter matches against event name.
     * Useful for the console: window.spw.bus.recent('brace')
     */
    recent(filter = null) {
        return filter
            ? this.#history.filter(r => r.name.includes(filter))
            : [...this.#history];
    }

    /** Read the current charge level (0→1) for an element. */
    getCharge(element) {
        return this.#chargeMap.get(element) ?? 0;
    }

    #record(name, detail, ts) {
        this.#history.push({ name, detail, ts });
        if (this.#history.length > this.#maxHistory) this.#history.shift();
    }

    #applyCharge(element, eventName) {
        const level = CHARGE_BY_EVENT[eventName];
        if (level === undefined) return;

        this.#chargeMap.set(element, level);
        element.style.setProperty('--charge', level);

        // data-spw-charge carries a human-readable label for CSS selectors
        if (level === 0) {
            delete element.dataset.spwCharge;
        } else {
            element.dataset.spwCharge = (
                level <= 0.30 ? 'charging'
                : level <= 0.70 ? 'active'
                : level <= 0.94 ? 'sustained'
                : 'manifest'
            );
        }
    }
}

export const bus = new SpwBus();
export { CHARGE_BY_EVENT, LEGACY };
