/**
 * SpwBus — unified event coordination for all Spw systems.
 *
 * Design principles:
 * 1. Single emit path: every custom event passes through here.
 * 2. Consistent payload: every event includes { _name, _ts, _source, ...detail }.
 * 3. Backward compat: dispatches selected legacy DOM event names.
 * 4. Charge model: automatically tracks and writes --charge onto elements.
 * 5. Introspection: bus.recent() exposes event history for console/debugging.
 * 6. Low coupling: callers can use DOM events, bus.on(), or bus.onAny().
 *
 * Canonical event families:
 * brace:*       gesture / projection / activation
 * frame:*       frame activation / mode changes
 * operator:*    operator / phase state
 * development:* developmental climate / learning posture
 * spirit:*      backward-compatible higher-order phase shifts
 * settings:*    site settings / runtime controls
 * field:*       field energy / charge
 * spell:*       haptics / checkpoints / cast state
 * lattice:*     lattice cycles
 * rhythm:*      tempo / pulse / phase / measure / transport
 * stream:*      compatibility channel for time-based consumers
 */

const DEFAULT_HISTORY_LIMIT = 100;
const MIN_HISTORY_LIMIT = 10;
const MAX_HISTORY_LIMIT = 1000;

const CHARGE_BY_EVENT = Object.freeze({
    'brace:charged': 0.25,
    'brace:activated': 0.65,
    'brace:sustained': 0.90,
    'brace:projected': 0.50,
    'brace:moved': 0.50,
    'brace:discharged': 0,
    'brace:released': 0,
    'brace:pinned': 0.30,

    'field:charged': 0.45,
    'field:focused': 0.55,
    'field:released': 0,

    'rhythm:start': 0.20,
    'rhythm:pulse': 0.35,
    'rhythm:phase': 0.45,
    'rhythm:measure': 0.55,
    'rhythm:stop': 0,
    'rhythm:reset': 0,
});

const LEGACY = Object.freeze({
    'brace:charged': 'spw:brace:charge-start',
    'brace:discharged': 'spw:brace:discharge',
    'brace:activated': 'spw:brace:activate',
    'brace:sustained': 'spw:brace:sustain',
    'brace:projected': 'spw:brace:project-start',
    'brace:moved': 'spw:brace:project-move',
    'brace:released': 'spw:brace:project-end',
    'brace:swapped': 'spw:brace:swap',
    'brace:pinned': 'spw:brace:pin-toggle',

    'frame:activated': 'spw:frame-change',
    'frame:mode': 'spw:mode-change',

    'operator:phased': 'spw:phase:change',
    'operator:activated': 'spw:operator-activated',

    'development:shifted': 'spw:development-shifted',
    'spirit:shifted': 'spw:phase-change',

    'settings:changed': 'spw:settings-change',

    'spell:reset': 'spw:haptics:reset',
    'spell:checkpoint': 'spw:haptics:checkpoint',

    'field:charged': 'electromagnetic:charge-change',

    'lattice:cycled': 'spw:phase:cycle',

    // Temporal compatibility for modules already listening on stream names.
    'rhythm:pulse': 'stream:pulse',
    'rhythm:phase': 'stream:phase',
});

const CHARGE_STATE = Object.freeze([
    { max: 0, label: null },
    { max: 0.30, label: 'charging' },
    { max: 0.70, label: 'active' },
    { max: 0.94, label: 'sustained' },
    { max: Infinity, label: 'manifest' },
]);

const isDomTarget = (value) => (
  value
  && typeof value.addEventListener === 'function'
  && typeof value.removeEventListener === 'function'
  && typeof value.dispatchEvent === 'function'
);

const isElement = (value) => (
  typeof Element !== 'undefined'
  && value instanceof Element
);

const clampHistoryLimit = (value, fallback = DEFAULT_HISTORY_LIMIT) => {
    const next = Number.parseInt(String(value), 10);

    if (!Number.isFinite(next)) return fallback;

    return Math.min(MAX_HISTORY_LIMIT, Math.max(MIN_HISTORY_LIMIT, next));
};

const now = () => Date.now();

const normalizeEventName = (name = '') => (
  String(name)
    .trim()
    .replace(/^spw:/, '')
);

const resolveSource = (name) => {
    const normalized = normalizeEventName(name);
    return normalized.includes(':') ? normalized.split(':')[0] : 'spw';
};

const getChargeState = (level) => {
    const numeric = Number(level) || 0;
    return CHARGE_STATE.find((entry) => numeric <= entry.max)?.label ?? null;
};

const normalizeDetail = (detail) => {
    if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
        return detail;
    }

    return { value: detail };
};

class SpwBus {
    #history = [];
    #maxHistory = DEFAULT_HISTORY_LIMIT;
    #chargeMap = new WeakMap();
    #mirrorToConsole = false;
    #anyListeners = new Set();

    constructor() {
        this.on('settings:changed', (event) => {
            const settings = event.detail || {};

            this.setHistoryLimit(settings.busHistorySize || DEFAULT_HISTORY_LIMIT);
            this.setMirrorToConsole(settings.busMirrorToConsole === 'on');
        });
    }

    /**
     * Emit a canonical Spw event.
     *
     * @param {string} name - Canonical event name without the spw: prefix.
     * @param {object} detail - Event detail payload.
     * @param {object} options - Dispatch options.
     * @returns {{ name: string, eventName: string, detail: object, ts: number }}
     */
    emit(name, detail = {}, options = {}) {
        const normalizedName = normalizeEventName(name);

        if (!normalizedName) {
            throw new Error('[SpwBus] emit() requires a non-empty event name');
        }

        const {
            target = document,
            bubbles = true,
            composed = true,
            cancelable = false,
            element = null,
            legacy = true,
            record = true,
        } = options;

        if (!isDomTarget(target)) {
            throw new Error(`[SpwBus] invalid event target for "${normalizedName}"`);
        }

        const ts = now();
        const source = resolveSource(normalizedName);
        const baseDetail = normalizeDetail(detail);
        const resolvedElement = this.#resolveElement(baseDetail, element);

        const enriched = Object.freeze({
            ...baseDetail,
            _name: `spw:${normalizedName}`,
            _event: normalizedName,
            _ts: ts,
            _source: source,
        });

        if (record) {
            this.#record(normalizedName, enriched, ts);
        }

        this.#notifyAny(normalizedName, enriched, ts, target);

        if (this.#mirrorToConsole) {
            console.debug('[SpwBus]', normalizedName, enriched);
        }

        const canonicalEventName = `spw:${normalizedName}`;
        target.dispatchEvent(new CustomEvent(canonicalEventName, {
            detail: enriched,
            bubbles,
            composed,
            cancelable,
        }));

        if (legacy) {
            this.#dispatchLegacy(normalizedName, enriched, {
                target,
                bubbles,
                composed,
                cancelable,
            });
        }

        if (resolvedElement) {
            this.#applyCharge(resolvedElement, normalizedName);
        }

        return {
            name: normalizedName,
            eventName: canonicalEventName,
            detail: enriched,
            ts,
        };
    }

    /**
     * Listen to a canonical Spw event.
     *
     * @param {string} name - Canonical event name without the spw: prefix.
     * @param {Function} handler - DOM event handler.
     * @param {object} options - Listener options.
     * @returns {Function} unsubscribe
     */
    on(name, handler, options = {}) {
        const normalizedName = normalizeEventName(name);
        const {
            target = document,
            once = false,
            passive = true,
            signal,
        } = options;

        if (!normalizedName || typeof handler !== 'function' || !isDomTarget(target)) {
            return () => {};
        }

        const eventName = `spw:${normalizedName}`;
        const listenerOptions = { once, passive };

        if (signal) {
            listenerOptions.signal = signal;
        }

        target.addEventListener(eventName, handler, listenerOptions);

        return () => target.removeEventListener(eventName, handler, listenerOptions);
    }

    /**
     * Listen to a legacy DOM event name.
     *
     * Useful while migrating older modules without changing their event names.
     */
    onLegacy(legacyName, handler, options = {}) {
        const eventName = String(legacyName || '').trim();
        const {
            target = document,
            once = false,
            passive = true,
            signal,
        } = options;

        if (!eventName || typeof handler !== 'function' || !isDomTarget(target)) {
            return () => {};
        }

        const listenerOptions = { once, passive };

        if (signal) {
            listenerOptions.signal = signal;
        }

        target.addEventListener(eventName, handler, listenerOptions);

        return () => target.removeEventListener(eventName, handler, listenerOptions);
    }

    /**
     * Listen to every bus emission before DOM dispatch.
     *
     * Handler receives:
     *   { name, eventName, detail, ts, target }
     */
    onAny(handler) {
        if (typeof handler !== 'function') return () => {};

        this.#anyListeners.add(handler);

        return () => {
            this.#anyListeners.delete(handler);
        };
    }

    recent(filter = null) {
        const records = filter
          ? this.#history.filter((record) => (
            record.name.includes(filter)
            || record.eventName.includes(filter)
            || record.source.includes(filter)
          ))
          : this.#history;

        return records.map((record) => ({ ...record }));
    }

    clearHistory() {
        this.#history = [];
    }

    getCharge(element) {
        if (!isElement(element)) return 0;
        return this.#chargeMap.get(element) ?? 0;
    }

    setCharge(element, level, options = {}) {
        if (!isElement(element)) return 0;

        const numeric = Math.max(0, Math.min(1, Number(level) || 0));

        this.#chargeMap.set(element, numeric);
        element.style.setProperty('--charge', String(numeric));

        const state = getChargeState(numeric);

        if (!state) {
            delete element.dataset.spwCharge;
        } else {
            element.dataset.spwCharge = state;
        }

        if (options.emit !== false) {
            this.emit('field:charged', {
                element,
                charge: numeric,
                chargeState: state || 'rest',
            }, {
                element,
                target: element,
            });
        }

        return numeric;
    }

    releaseCharge(element, options = {}) {
        return this.setCharge(element, 0, options);
    }

    setHistoryLimit(limit) {
        const next = clampHistoryLimit(limit, this.#maxHistory);

        this.#maxHistory = next;

        if (this.#history.length > this.#maxHistory) {
            this.#history = this.#history.slice(-this.#maxHistory);
        }

        return this.#maxHistory;
    }

    getHistoryLimit() {
        return this.#maxHistory;
    }

    setMirrorToConsole(value) {
        this.#mirrorToConsole = Boolean(value);
        return this.#mirrorToConsole;
    }

    getMirrorToConsole() {
        return this.#mirrorToConsole;
    }

    getDiagnostics() {
        const families = {};

        for (const record of this.#history) {
            families[record.source] = (families[record.source] || 0) + 1;
        }

        return {
            historySize: this.#history.length,
            historyLimit: this.#maxHistory,
            mirrorToConsole: this.#mirrorToConsole,
            anyListenerCount: this.#anyListeners.size,
            families,
            latest: this.#history.at(-1) || null,
        };
    }

    #record(name, detail, ts) {
        const record = Object.freeze({
            name,
            eventName: `spw:${name}`,
            source: resolveSource(name),
            detail,
            ts,
        });

        this.#history.push(record);

        if (this.#history.length > this.#maxHistory) {
            this.#history = this.#history.slice(-this.#maxHistory);
        }
    }

    #notifyAny(name, detail, ts, target) {
        if (!this.#anyListeners.size) return;

        const packet = Object.freeze({
            name,
            eventName: `spw:${name}`,
            detail,
            ts,
            target,
        });

        for (const handler of this.#anyListeners) {
            try {
                handler(packet);
            } catch (error) {
                console.error('[SpwBus] onAny listener failed', error);
            }
        }
    }

    #dispatchLegacy(name, detail, options) {
        const legacyName = LEGACY[name];
        if (!legacyName) return;

        const {
            target,
            bubbles,
            composed,
            cancelable,
        } = options;

        target.dispatchEvent(new CustomEvent(legacyName, {
            detail,
            bubbles,
            composed,
            cancelable,
        }));
    }

    #resolveElement(detail, explicitElement) {
        if (isElement(explicitElement)) return explicitElement;
        if (isElement(detail?.element)) return detail.element;
        if (isElement(detail?.targetElement)) return detail.targetElement;
        if (isElement(detail?.node)) return detail.node;

        return null;
    }

    #applyCharge(element, eventName) {
        const level = CHARGE_BY_EVENT[eventName];
        if (level === undefined) return;

        this.#chargeMap.set(element, level);
        element.style.setProperty('--charge', String(level));

        const state = getChargeState(level);

        if (!state) {
            delete element.dataset.spwCharge;
        } else {
            element.dataset.spwCharge = state;
        }
    }
}

const bus = new SpwBus();

export {
    CHARGE_BY_EVENT,
    DEFAULT_HISTORY_LIMIT,
    LEGACY,
    bus,
};

export default bus;