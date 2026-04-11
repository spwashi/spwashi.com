/**
 * Spw Interaction Loop Contract
 *
 * Shared process vocabulary for reversible UI actions that move through a
 * visible loop: preview -> activated -> resolved -> idle.
 *
 * This module stays intentionally small and pure. It owns canonical state and
 * reason names, timing reads from CSS tokens, and formatting helpers that let
 * runtimes expose the same interaction semantics without duplicating strings.
 */

export const LOOP_STATES = Object.freeze({
    IDLE: 'idle',
    PREVIEW: 'preview',
    ACTIVATED: 'activated',
    RESOLVED: 'resolved'
});

export const LOOP_TOKENS = Object.freeze({
    SURFACE: 'surface',
    HOLD: 'hold',
    EFFECT: 'effect',
    MODE: 'mode',
    OPERATOR: 'operator',
    BRACE: 'brace'
});

export const IMAGE_REFRESH_EVENT = 'spw:image:refresh';

export const IMAGE_REFRESH_REASONS = Object.freeze({
    SYNC: 'sync',
    EFFECT: 'effect',
    ARMING: 'arming',
    VISITED: 'visited',
    SETTLED: 'settled',
    RELEASED: 'released'
});

export const readDurationMs = (name, fallback) => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (!raw) return fallback;

    if (raw.endsWith('ms')) {
        const value = Number.parseFloat(raw);
        return Number.isFinite(value) ? value : fallback;
    }

    if (raw.endsWith('s')) {
        const value = Number.parseFloat(raw);
        return Number.isFinite(value) ? value * 1000 : fallback;
    }

    const value = Number.parseFloat(raw);
    return Number.isFinite(value) ? value : fallback;
};

export const getLoopTiming = () => ({
    previewReleaseMs: readDurationMs('--duration-fast', 180),
    resolveMs: readDurationMs('--duration-slow', 480) * 2
});

export const formatLoopLabel = (state, token = '') => {
    if (state === LOOP_STATES.IDLE) return 'ready';
    if (!token) return state;
    return `${state} · ${token}`;
};

export const createLoopRecord = (state = LOOP_STATES.IDLE, token = '') => ({
    state,
    token: state === LOOP_STATES.IDLE ? '' : token,
    label: formatLoopLabel(state, token)
});

export const formatLoopFieldValue = (record, fallbackToken = LOOP_TOKENS.SURFACE) => (
    record.state === LOOP_STATES.IDLE
        ? 'ready'
        : `${record.state}(${record.token || fallbackToken})`
);

export const getImageRefreshTransition = (reason) => {
    switch (reason) {
    case IMAGE_REFRESH_REASONS.EFFECT:
        return createLoopRecord(LOOP_STATES.RESOLVED, LOOP_TOKENS.EFFECT);
    case IMAGE_REFRESH_REASONS.ARMING:
        return createLoopRecord(LOOP_STATES.ACTIVATED, LOOP_TOKENS.HOLD);
    case IMAGE_REFRESH_REASONS.VISITED:
    case IMAGE_REFRESH_REASONS.SETTLED:
        return createLoopRecord(LOOP_STATES.RESOLVED, LOOP_TOKENS.HOLD);
    case IMAGE_REFRESH_REASONS.RELEASED:
        return createLoopRecord(LOOP_STATES.IDLE);
    default:
        return null;
    }
};

export const dispatchImageRefresh = (target, reason = IMAGE_REFRESH_REASONS.SYNC) => {
    target.dispatchEvent(new CustomEvent(IMAGE_REFRESH_EVENT, {
        bubbles: true,
        detail: { reason }
    }));
};
