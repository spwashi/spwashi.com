/** Pure decay edge; DOM listeners and timer ownership stay in charge-field.js. */
export const PHASE_INTENSITY = Object.freeze({
    armed: 0.22,
    preview: 0.48,
    charged: 0.82,
    discharging: 0.34,
    settled: 0,
    grounded: 0.55,
    transferring: 0.65,
});
export const CHARGE_TIMING = Object.freeze({ decayMs: 2800, dischargeMs: 1400 });
/** One bounded step, rounded so floating-point residue cannot keep a timer alive. */
export function decayCharge(intensity) {
    const bounded = Number.isFinite(intensity) ? Math.max(0, Math.min(1, intensity)) : 0;
    const next = Math.round(Math.max(0, bounded - 0.18) * 100) / 100;
    return next < 0.08
        ? { field: 'quiet', intensity: 0 }
        : { field: 'bleeding', intensity: next };
}
