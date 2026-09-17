/**
 * measured-frame.js
 * ---------------------------------------------------------------------------
 * Measure after the frame's own style pass, all lanes together.
 *
 * A requestAnimationFrame callback runs before the browser recalculates style
 * and layout for that frame. A geometry read inside it — getComputedStyle, a
 * rect, scrollY, innerWidth — pays the whole pending recalculation in script,
 * against the full stylesheet, and the writes that follow dirty it again, so
 * the frame's own pass pays it a second time. A task queued from the frame
 * callback runs after that pass, where the same read finds style clean.
 *
 * One task, not one per lane: every lane scheduled in the same frame runs in
 * the same pass, in two phases. Lanes that declare `measure()` and `apply()`
 * all read first, against one clean style, and write afterwards; lanes that
 * only give `run()` read and write as they always did, and go between the two
 * phases so their first reads still land before anything here has written.
 * A lane scheduled while a pass runs joins the next one.
 *
 * Callers that must read synchronously — they return the snapshot — stay
 * synchronous and pay the recalculation knowingly.
 */

/* Lanes are created at module scope, before a test or a portable host installs
   its window, so the scheduling surface resolves per call rather than once. */
const resolveView = () => (typeof globalThis.window === 'object' && globalThis.window ? globalThis.window : globalThis);

const pendingLanes = new Set();
let armedView = null;
let frame = 0;
let task = 0;

function report(lane, phase, error) {
  const log = globalThis.console;
  if (log && typeof log.error === 'function') log.error(`[measured-frame] ${lane.name} ${phase} failed`, error);
}

function runPass() {
  task = 0;
  armedView = null;
  const lanes = [...pendingLanes];
  pendingLanes.clear();
  const split = lanes.filter((lane) => typeof lane.measure === 'function');
  const whole = lanes.filter((lane) => typeof lane.measure !== 'function');

  const measured = split.map((lane) => {
    try {
      return { ok: true, value: lane.measure() };
    } catch (error) {
      report(lane, 'measure', error);
      return { ok: false, value: undefined };
    }
  });

  whole.forEach((lane) => {
    try {
      lane.run();
    } catch (error) {
      report(lane, 'run', error);
    }
  });

  split.forEach((lane, index) => {
    if (!measured[index].ok) return;
    try {
      lane.apply(measured[index].value);
    } catch (error) {
      report(lane, 'apply', error);
    }
  });
}

function armPass() {
  if (frame || task) return;
  const view = resolveView();
  armedView = view;
  if (typeof view.requestAnimationFrame !== 'function') {
    task = view.setTimeout(runPass, 0);
    return;
  }
  frame = view.requestAnimationFrame(() => {
    frame = 0;
    task = view.setTimeout(runPass, 0);
  });
}

function disarmPass() {
  const view = armedView || resolveView();
  if (frame && typeof view.cancelAnimationFrame === 'function') view.cancelAnimationFrame(frame);
  if (task) view.clearTimeout(task);
  frame = 0;
  task = 0;
  armedView = null;
}

/**
 * @typedef {object} MeasuredLaneDefinition
 * @property {string} [name] shown when a phase throws
 * @property {() => any} [measure] read phase; its return value reaches apply()
 * @property {(measured: any) => void} [apply] write phase
 * @property {() => void} [run] undivided lane, used when there is no measure()
 */

/**
 * Coalescing lane: `schedule()` while the lane is pending is a no-op, so many
 * writers in one frame buy one measured pass. A lane that batches inputs keeps
 * its own pending set beside it.
 *
 * @param {(() => void) | MeasuredLaneDefinition} definition
 * @returns {{ schedule: () => boolean, cancel: () => void, readonly pending: boolean }}
 */
export function createMeasuredLane(definition) {
  const lane = typeof definition === 'function'
    ? { name: definition.name || 'lane', run: definition }
    : {
      name: definition?.name || 'lane',
      measure: definition?.measure,
      apply: definition?.apply,
      run: definition?.run,
    };
  if (typeof lane.measure === 'function' && typeof lane.apply !== 'function') {
    throw new TypeError('[measured-frame] a lane with measure() needs apply()');
  }
  if (typeof lane.measure !== 'function' && typeof lane.run !== 'function') {
    throw new TypeError('[measured-frame] a lane needs run() or measure() + apply()');
  }

  return {
    get pending() {
      return pendingLanes.has(lane);
    },
    schedule() {
      if (pendingLanes.has(lane)) return false;
      pendingLanes.add(lane);
      armPass();
      return true;
    },
    cancel() {
      pendingLanes.delete(lane);
      if (!pendingLanes.size) disarmPass();
    },
  };
}

/**
 * One-shot form for a measure that is not a lane.
 *
 * @param {(() => void) | MeasuredLaneDefinition} definition
 * @returns {() => void} cancel
 */
export function requestMeasuredFrame(definition) {
  const lane = createMeasuredLane(definition);
  lane.schedule();
  return () => lane.cancel();
}
