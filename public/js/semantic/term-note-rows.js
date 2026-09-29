/**
 * term-note-rows.js — rows a living term's note borrows from what is mounted.
 *
 * The note (interface/haptics.js, buildConceptPopover) reads the term's own
 * attributes. These rows add what the rest of the runtime knows at the moment
 * the note opens: where else the word is practiced (search), what the
 * cauldron holds, which lens the reader is sitting, the intent they carry.
 *
 * Owners register a row when they load, so a row can only appear where its
 * owner is present; `when(ctx)` gates it on the live context as well.
 *
 *   registerTermNoteRow({ id, when(ctx), render(ctx) })
 *   readTermNoteRows(ctx) → [{ id, label, value, href? }]
 *
 * render returns { label, value, href? } (href makes the value a plain link)
 * or null. Nothing here runs until a note opens: building the context reads a
 * few root attributes and the module registry once, off every hot path.
 */

import { readCarriedIntent } from '/public/js/kernel/visit-intent.js';

const rows = new Map();

/*
 * Owners mount at different times (search at init, the cauldron at idle), so
 * registration order is not stable across visits. Rows read in this fixed
 * order instead; an id not named here follows, in registration order.
 */
const ROW_ORDER = Object.freeze(['search', 'lens', 'intent', 'cauldron']);
const rank = (id) => {
  const at = ROW_ORDER.indexOf(id);
  return at === -1 ? ROW_ORDER.length : at;
};

/** Register (or replace, by id) a note row. Returns an unregister function. */
export function registerTermNoteRow(row) {
  if (!row || typeof row.id !== 'string' || typeof row.render !== 'function') return () => {};
  rows.set(row.id, row);
  return () => {
    if (rows.get(row.id) === row) rows.delete(row.id);
  };
}

/** Rows in ROW_ORDER; a row that throws or declines is skipped. */
export function readTermNoteRows(ctx) {
  const out = [];
  const ordered = [...rows.values()].sort((a, b) => rank(a.id) - rank(b.id));
  for (const row of ordered) {
    try {
      if (typeof row.when === 'function' && !row.when(ctx)) continue;
      const rendered = row.render(ctx);
      if (!rendered || typeof rendered.value !== 'string' || !rendered.value.trim()) continue;
      out.push({ id: row.id, label: String(rendered.label || ''), value: rendered.value, href: rendered.href || '' });
    } catch (error) {
      console.warn(`[term-note-rows] ${row.id} failed`, error);
    }
  }
  return out;
}

export function listTermNoteRowIds() {
  return [...rows.keys()].sort((a, b) => rank(a) - rank(b));
}

/** Base ids of the modules that have mounted (not merely scheduled or loading). */
function readMountedModules(win) {
  const mounted = new Set();
  try {
    const registry = win?.__SPW_SITE__?.getContext?.()?.registry;
    for (const record of registry?.values?.() || []) {
      if (record?.status !== 'mounted') continue;
      if (record?.baseId) mounted.add(record.baseId);
      else if (record?.id) mounted.add(record.id);
    }
  } catch {
    /* no runtime context: nothing counts as mounted */
  }
  return mounted;
}

/**
 * The context every row reads. Built once per note open.
 * activeLens is the root's last-written lens (data-spw-active-lens-*), or
 * null on a page with no mode switch. The runtime writes it at boot for each
 * group's default seat, so it does not mean the reader chose it; rows that
 * need a chosen seat check for themselves (runtime/page/lens-term-note-row.js).
 * primedContext is only the intent carried from a held seat
 * (kernel/visit-intent.js readCarriedIntent), or null: a page's own default
 * seat is not a primed intent. mounted holds the base ids of modules whose
 * registry status is 'mounted'.
 */
export function buildTermNoteContext(term, { doc = globalThis.document, win = globalThis.window } = {}) {
  const root = doc?.documentElement?.dataset || {};
  const mode = root.spwActiveLensMode || '';
  let primedContext = null;
  try {
    primedContext = readCarriedIntent();
  } catch {
    primedContext = null;
  }
  return {
    term,
    concept: term?.dataset?.spwConcept || '',
    route: win?.location?.pathname || '/',
    activeLens: mode
      ? {
          mode,
          group: root.spwActiveLensGroup || '',
          impact: root.spwActiveLensImpact || '',
          feedback: root.spwActiveLensFeedback || '',
        }
      : null,
    primedContext,
    mounted: readMountedModules(win),
  };
}

/** Test seam: forget every registered row. */
export function resetTermNoteRows() {
  rows.clear();
}
