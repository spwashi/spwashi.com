/**
 * SpwBus — unified event coordination for all Spw systems.
 *
 * Design principles:
 * 1. Single emit path: every custom event passes through here
 * 2. Consistent payload: every event includes { _name, _ts, _source, ...detail }
 * 3. Backward compat: also dispatches legacy DOM event names so CSS/HTML stays stable
 * 4. Charge model: automatically tracks and writes --charge (0→1) onto elements
 * 5. Introspection: bus.recent() exposes event history for the console and debugging
 *
 * Canonical event families:
 * brace:* gesture / projection / activation
 * frame:* frame activation / mode changes
 * operator:* operator / phase state
 * spirit:* higher-order phase shifts
 * field:* field energy / charge
 * spell:* haptics / checkpoints / cast state
 * lattice:* lattice cycles
 * rhythm:* tempo / pulse / phase / measure / transport
 * stream:* compatibility channel for time-based consumers
 */

const CHARGE_BY_EVENT = Object.freeze({
    'brace:charged':    0.25,
    'brace:activated':  0.65,
    'brace:sustained':  0.90,
    'brace:projected':  0.50,
    'brace:moved':      0.50,
    'brace:discharged': 0,
    'brace:released':   0,
    'brace:pinned':     0.30,

    'rhythm:start':     0.20,
    'rhythm:pulse':     0.35,
    'rhythm:phase':     0.45,
    'rhythm:measure':   0.55,
    'rhythm:stop':      0,
    'rhythm:reset':     0,
});

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

    // Temporal compatibility for modules already listening on stream names.
    'rhythm:pulse':       'stream:pulse',
    'rhythm:phase':       'stream:phase',
});

class SpwBus {
    #history = [];
    #maxHistory = 100;
    #chargeMap = new WeakMap();
    #mirrorToConsole = false;

    constructor() {
        // Moved the standalone listener into the constructor so it binds properly
        // without risking execution before the class is initialized.
        this.on('settings:changed', (event) => {
            const settings = event.detail || {};
            this.setHistoryLimit(Number(settings.busHistorySize || 100));
            this.setMirrorToConsole(settings.busMirrorToConsole === 'on');
        });
    }

    emit(name, detail = {}, { target = document, bubbles = true, element = null } = {}) {
        const ts = Date.now();
        const src = name.split(':')[0];
        const enriched = { ...detail, _name: `spw:${name}`, _ts: ts, _source: src };

        this.#record(name, enriched, ts);

        if (this.#mirrorToConsole) {
            console.debug('[SpwBus]', name, enriched);
        }

        target.dispatchEvent(new CustomEvent(`spw:${name}`, {
            detail: enriched,
            bubbles,
            composed: true,
        }));

        const legacyName = LEGACY[name];
        if (legacyName) {
            target.dispatchEvent(new CustomEvent(legacyName, {
                detail: enriched,
                bubbles,
                composed: true,
            }));
        }

        const el = element ?? (detail.element instanceof Element ? detail.element : null);
        if (el) this.#applyCharge(el, name);

        return { name, detail: enriched, ts };
    }

    on(name, handler, { target = document, once = false, signal } = {}) {
        const canonical = `spw:${name}`;
        const options = { once };
        if (signal) options.signal = signal;
        target.addEventListener(canonical, handler, options);
        return () => target.removeEventListener(canonical, handler);
    }

    recent(filter = null) {
        return filter
            ? this.#history.filter((r) => r.name.includes(filter))
            : [...this.#history];
    }

    getCharge(element) {
        return this.#chargeMap.get(element) ?? 0;
    }

    setHistoryLimit(limit) {
        const next = Number(limit);
        if (!Number.isFinite(next) || next < 10) return;
        this.#maxHistory = next;
        if (this.#history.length > this.#maxHistory) {
            this.#history = this.#history.slice(-this.#maxHistory);
        }
    }

    getHistoryLimit() {
        return this.#maxHistory;
    }

    setMirrorToConsole(value) {
        this.#mirrorToConsole = Boolean(value);
    }

    getDiagnostics() {
        return {
            historySize: this.#history.length,
            historyLimit: this.#maxHistory,
            mirrorToConsole: this.#mirrorToConsole,
        };
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