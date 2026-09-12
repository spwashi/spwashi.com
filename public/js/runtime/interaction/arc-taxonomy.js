/** Ordered arcs share traversal, while each consumer keeps its own boundaries. */
export const PHASE_ARC = Object.freeze({
  states: Object.freeze(['idle', 'approach', 'prime', 'charge', 'inspect', 'discover', 'settle']),
  entry: 'idle',
  rest: 'settle',
  resting: Object.freeze(['idle', 'settle']),
});

export const LOOP_STATES = Object.freeze({
  IDLE: 'idle', PREVIEW: 'preview', ACTIVATED: 'activated', RESOLVED: 'resolved',
});

export const LOOP_ARC = Object.freeze({
  states: Object.freeze(Object.values(LOOP_STATES)),
  entry: LOOP_STATES.IDLE,
  rest: LOOP_STATES.IDLE,
  resting: Object.freeze([LOOP_STATES.IDLE]),
});

// Section states are supplied from the live landmark list, never cached here.
export function arcNeighborIndex(states, currentIndex, direction, { wrap = false } = {}) {
  if (!states.length || (direction !== 1 && direction !== -1)) return -1;
  const from = currentIndex >= 0 && currentIndex < states.length ? currentIndex : 0;
  const next = from + direction;
  return wrap
    ? (next + states.length) % states.length
    : Math.max(0, Math.min(states.length - 1, next));
}
