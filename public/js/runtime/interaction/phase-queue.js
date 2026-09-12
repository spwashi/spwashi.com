import { PHASE_ARC } from './arc-taxonomy.js';
import { strongestPhase } from './vocabulary.js';

/** One commit per microtask batch. Direct writes reset; bumps accumulate. */
export function createPhaseQueue(readPhase, commit) {
  let pending = null;

  const write = (html, phase, detail = {}) => {
    if (!html || !PHASE_ARC.states.includes(phase)) return;
    if (pending) {
      Object.assign(pending, { html, phase, detail });
      return;
    }
    const batch = { html, phase, detail };
    pending = batch;
    // Let MutationObserver delivery from this event join before committing.
    queueMicrotask(() => queueMicrotask(() => {
      if (pending !== batch) return;
      pending = null;
      commit(batch.html, batch.phase, batch.detail);
    }));
  };

  const bump = (html, candidate, detail = {}) => {
    if (!PHASE_ARC.states.includes(candidate)) return;
    const current = pending?.phase || readPhase();
    // A committed rest starts a new arc. A pending rest belongs to this batch.
    const baseline = !pending && PHASE_ARC.resting.includes(current) ? PHASE_ARC.entry : current;
    const phase = strongestPhase(baseline, candidate);
    const nextDetail = pending && phase === pending.phase
      ? { ...pending.detail, force: Boolean(pending.detail.force || detail.force) }
      : detail;
    write(html, phase, nextDetail);
  };

  return { write, bump, clear: () => { pending = null; } };
}
