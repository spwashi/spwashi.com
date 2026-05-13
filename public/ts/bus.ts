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

type SpwEventDetail = Record<string, unknown>;
type SpwEventName = string;
type Unsubscribe = () => void;
type SpwDomTarget = EventTarget;
type ChargeElement = HTMLElement | SVGElement;

type SpwEmitOptions = {
    target?: SpwDomTarget;
    bubbles?: boolean;
    composed?: boolean;
    cancelable?: boolean;
    element?: ChargeElement | null;
    legacy?: boolean;
    record?: boolean;
};

type SpwListenerOptions = {
    target?: SpwDomTarget;
    once?: boolean;
    passive?: boolean;
    signal?: AbortSignal;
};

type SpwAnyPacket = Readonly<{
    name: string;
    eventName: string;
    detail: SpwEnrichedDetail;
    ts: number;
    target: SpwDomTarget;
}>;

type SpwAnyHandler = (packet: SpwAnyPacket) => void;
type SpwEventHandler = EventListener;

type SpwEnrichedDetail = Readonly<SpwEventDetail & {
    _name: string;
    _event: string;
    _ts: number;
    _source: string;
}>;

type SpwHistoryRecord = Readonly<{
    name: string;
    eventName: string;
    source: string;
    detail: SpwEnrichedDetail;
    ts: number;
}>;

type SpwEmitResult = {
    name: string;
    eventName: string;
    detail: SpwEnrichedDetail;
    ts: number;
};

type ChargeEventName = keyof typeof CHARGE_BY_EVENT;
type LegacyEventName = keyof typeof LEGACY;

const isDomTarget = (value: unknown): value is SpwDomTarget => (
  Boolean(value)
  && typeof (value as Partial<EventTarget>).addEventListener === 'function'
  && typeof (value as Partial<EventTarget>).removeEventListener === 'function'
  && typeof (value as Partial<EventTarget>).dispatchEvent === 'function'
);

const isChargeElement = (value: unknown): value is ChargeElement => (
  (
    typeof HTMLElement !== 'undefined'
    && value instanceof HTMLElement
  )
  || (
    typeof SVGElement !== 'undefined'
    && value instanceof SVGElement
  )
);

const clampHistoryLimit = (value: unknown, fallback = DEFAULT_HISTORY_LIMIT): number => {
    const next = Number.parseInt(String(value), 10);

    if (!Number.isFinite(next)) return fallback;

    return Math.min(MAX_HISTORY_LIMIT, Math.max(MIN_HISTORY_LIMIT, next));
};

const now = () => Date.now();

const normalizeEventName = (name: SpwEventName = ''): string => (
  String(name)
    .trim()
    .replace(/^spw:/, '')
);

const resolveSource = (name: SpwEventName): string => {
    const normalized = normalizeEventName(name);
    return normalized.includes(':') ? normalized.split(':')[0] : 'spw';
};

const getChargeState = (level: unknown): string | null => {
    const numeric = Number(level) || 0;
    return CHARGE_STATE.find((entry) => numeric <= entry.max)?.label ?? null;
};

const normalizeDetail = (detail: unknown): SpwEventDetail => {
    if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
        return detail as SpwEventDetail;
    }

    return { value: detail };
};

class SpwBus {
    #history: SpwHistoryRecord[] = [];
    #maxHistory = DEFAULT_HISTORY_LIMIT;
    #chargeMap = new WeakMap<ChargeElement, number>();
    #mirrorToConsole = false;
    #anyListeners = new Set<SpwAnyHandler>();

    constructor() {
        this.on('settings:changed', (event: Event) => {
            const settings = (event as CustomEvent<SpwEventDetail>).detail || {};

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
    emit(name: SpwEventName, detail: unknown = {}, options: SpwEmitOptions = {}): SpwEmitResult {
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
        }) as SpwEnrichedDetail;

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
    on(name: SpwEventName, handler: SpwEventHandler, options: SpwListenerOptions = {}): Unsubscribe {
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
        const listenerOptions: AddEventListenerOptions = { once, passive };

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
    onLegacy(legacyName: string, handler: SpwEventHandler, options: SpwListenerOptions = {}): Unsubscribe {
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

        const listenerOptions: AddEventListenerOptions = { once, passive };

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
    onAny(handler: SpwAnyHandler): Unsubscribe {
        if (typeof handler !== 'function') return () => {};

        this.#anyListeners.add(handler);

        return () => {
            this.#anyListeners.delete(handler);
        };
    }

    recent(filter: string | null = null): SpwHistoryRecord[] {
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

    getCharge(element: unknown): number {
        if (!isChargeElement(element)) return 0;
        return this.#chargeMap.get(element) ?? 0;
    }

    setCharge(element: unknown, level: unknown, options: { emit?: boolean } = {}): number {
        if (!isChargeElement(element)) return 0;

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

    releaseCharge(element: unknown, options: { emit?: boolean } = {}): number {
        return this.setCharge(element, 0, options);
    }

    setHistoryLimit(limit: unknown): number {
        const next = clampHistoryLimit(limit, this.#maxHistory);

        this.#maxHistory = next;

        if (this.#history.length > this.#maxHistory) {
            this.#history = this.#history.slice(-this.#maxHistory);
        }

        return this.#maxHistory;
    }

    getHistoryLimit(): number {
        return this.#maxHistory;
    }

    setMirrorToConsole(value: unknown): boolean {
        this.#mirrorToConsole = Boolean(value);
        return this.#mirrorToConsole;
    }

    getMirrorToConsole(): boolean {
        return this.#mirrorToConsole;
    }

    getDiagnostics() {
        const families: Record<string, number> = {};

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

    #record(name: string, detail: SpwEnrichedDetail, ts: number): void {
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

    #notifyAny(name: string, detail: SpwEnrichedDetail, ts: number, target: SpwDomTarget): void {
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

    #dispatchLegacy(name: string, detail: SpwEnrichedDetail, options: Required<Pick<SpwEmitOptions, 'target' | 'bubbles' | 'composed' | 'cancelable'>>): void {
        const legacyName = LEGACY[name as LegacyEventName];
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

    #resolveElement(detail: SpwEventDetail, explicitElement: unknown): ChargeElement | null {
        if (isChargeElement(explicitElement)) return explicitElement;
        if (isChargeElement(detail?.element)) return detail.element;
        if (isChargeElement(detail?.targetElement)) return detail.targetElement;
        if (isChargeElement(detail?.node)) return detail.node;

        return null;
    }

    #applyCharge(element: ChargeElement, eventName: string): void {
        const level = CHARGE_BY_EVENT[eventName as ChargeEventName];
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
