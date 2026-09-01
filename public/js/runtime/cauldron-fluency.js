/**
 * Publish what the cauldron knows about a reader's Spw, as registers.
 *
 * The fluency and saturation models compute real things — which operators have
 * been met, which slots, whether a construct still dissolves — and nothing
 * could reach them. Two modules with no consumer are two modules that do not
 * exist, which is the failure this file closes.
 *
 * What it does is narrow on purpose: it reads the cauldron, computes, and
 * writes the results to the document root as registers. It renders no UI. That
 * boundary matters — once fluency is a register, any stylesheet can respond to
 * it and any probe can report it, and none of them have to import a model or
 * agree with each other about how to draw it.
 *
 * Registers written:
 *
 *   data-spw-fluency-operators   how many canonical operators have been met
 *   data-spw-fluency-slots       0..3 — grammar met, as opposed to nouns
 *   data-spw-solution-state      dissolving | saturated | supersaturated
 *   data-spw-rehearsal-due       count of constructs rested long enough
 *
 * `solution-state` is the one worth styling. It says whether collecting is
 * still teaching, and a surface that reads it can get out of the way while
 * someone is still learning by gathering.
 *
 * Recomputes on cauldron change only. Nothing here polls, and nothing here runs
 * on a scroll.
 */

import { measureFluency } from '/public/js/interface/cauldron/fluency.js';
import { measureSaturation, dueForRehearsal, recordEncounter } from '/public/js/interface/cauldron/rehearsal.js';

const ATTR = Object.freeze({
  operators: 'data-spw-fluency-operators',
  slots: 'data-spw-fluency-slots',
  solution: 'data-spw-solution-state',
  due: 'data-spw-rehearsal-due',
});

function readCauldron() {
  try {
    const raw = JSON.parse(globalThis.localStorage?.getItem('spw-cauldron') || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

/** Write only on change — a register rewritten with its own value is a wasted style recalc. */
function put(root, attr, value) {
  const next = String(value);
  if (root.getAttribute(attr) === next) return false;
  root.setAttribute(attr, next);
  return true;
}

export function publishFluency(doc = document) {
  const root = doc.documentElement;
  if (!root) return null;

  const items = readCauldron();
  const fluency = measureFluency(items);
  const saturation = measureSaturation(items);
  const due = dueForRehearsal();

  const state = saturation.supersaturated.length
    ? 'supersaturated'
    : saturation.saturated.length
      ? 'saturated'
      : 'dissolving';

  put(root, ATTR.operators, fluency.operators.met.length);
  put(root, ATTR.slots, fluency.slots.met.length);
  put(root, ATTR.solution, state);
  put(root, ATTR.due, due.length);

  return { fluency, saturation, due, state };
}

export function initCauldronFluency(ctx = {}) {
  const doc = ctx.root?.nodeType === 9
    ? ctx.root
    : ctx.root?.ownerDocument || (typeof document !== 'undefined' ? document : null);
  if (!doc) return () => {};

  const abort = new AbortController();
  const { signal } = abort;
  const publish = () => publishFluency(doc);
  publish();

  /**
   * A gather is an encounter with that construct. Recording it here rather than
   * in the cauldron's own capture path keeps the ledger out of the storage
   * layer, which has no business knowing about spacing.
   */
  const onUpdate = (event) => {
    const gathered = event?.detail?.ingredients;
    const latest = Array.isArray(gathered) ? gathered[gathered.length - 1] : null;
    if (latest?.operator) recordEncounter(latest.operator);
    publish();
  };

  doc.addEventListener('cauldron:updated', onUpdate, { signal });
  doc.addEventListener('cauldron:gardened', publish, { signal });

  const bus = ctx.bus || globalThis.__SPW_SITE__?.bus;
  const off = bus?.on?.('spw:runtime-refresh', publish) || null;

  return () => {
    abort.abort();
    off?.();
    for (const attr of Object.values(ATTR)) doc.documentElement?.removeAttribute(attr);
  };
}

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'cauldron-fluency',
  mount: (ctx, root) => initCauldronFluency({ ...ctx, root }),
  describes: 'fluency[cauldron]{operators.slots.solution}<registers>',
  updates: [
    'residue:data-spw-fluency-operators',
    'residue:data-spw-fluency-slots',
    'residue:data-spw-solution-state',
    'measure:data-spw-rehearsal-due',
  ],
  timingArc: 'idle-inspection',
  effectScope: 'root-state bus',
});

export const spwModule = SPW_MODULE_EXPORT;
