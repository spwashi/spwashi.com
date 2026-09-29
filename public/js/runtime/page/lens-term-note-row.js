/**
 * The lens's row in a living term's note (semantic/term-note-rows.js).
 *
 * Registered with the lens owner (runtime/page/lens-modes.js). Shown only
 * when the term sits inside what a lens touches, and that lens's seat is not
 * the one the page opened on:
 *   - a lens host around the term (data-spw-lens-impact, written by
 *     lens-modes with its group and mode), or
 *   - a lens-sensitive copy block (data-spw-copy-lens) naming the root's
 *     active mode.
 * The runtime writes every group's default seat at boot, so a default seat
 * says nothing the reader chose, and a term far from any switch is not in
 * that lens's reach. The row names the seat and what it foregrounds there,
 * in words the page already carries (data-spw-lens-feedback, or the copy
 * block's data-spw-copy-label).
 */
import { registerTermNoteRow } from '/public/js/semantic/term-note-rows.js';

const readable = (value = '') => String(value || '').trim().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ');

/*
 * The seat each group opens on, read once when this module evaluates, before
 * the lens owner's init moves aria-pressed. Same rule as site-core-minimal's
 * init: the authored aria-pressed seat, else the group's first. One query at
 * boot; nothing on a hot path.
 */
let openingSeats = new Map();

export function snapshotOpeningSeats(doc = globalThis.document) {
  const seats = new Map();
  try {
    for (const button of doc?.querySelectorAll?.('[data-mode-group][data-set-mode]') || []) {
      const group = button.getAttribute('data-mode-group');
      const mode = button.getAttribute('data-set-mode');
      if (!group || !mode) continue;
      const pressed = button.getAttribute('aria-pressed') === 'true';
      const seen = seats.get(group);
      if (!seen || (pressed && !seen.pressed)) seats.set(group, { mode, pressed });
    }
  } catch {
    /* no document: every seat counts as chosen */
  }
  openingSeats = new Map([...seats].map(([group, seat]) => [group, seat.mode]));
  return openingSeats;
}

snapshotOpeningSeats();

/** The seat around a term: { group, mode, foreground }, or null outside any lens's reach. */
export function lensSeatFor(term, activeLens) {
  const host = term?.closest?.('[data-spw-lens-impact]');
  if (host?.dataset?.spwLensMode) {
    return {
      group: host.dataset.spwLensGroup || '',
      mode: host.dataset.spwLensMode,
      foreground: host.dataset.spwLensFeedback || readable(host.dataset.spwLensImpact),
    };
  }
  const copy = term?.closest?.('[data-spw-copy-lens]');
  if (copy && activeLens?.mode && String(copy.dataset.spwCopyLens || '').split(/\s+/).includes(activeLens.mode)) {
    return { group: activeLens.group || '', mode: activeLens.mode, foreground: readable(copy.dataset.spwCopyLabel || '') };
  }
  return null;
}

const isOpeningSeat = (seat) => Boolean(seat.group) && openingSeats.get(seat.group) === seat.mode;

export const LENS_TERM_NOTE_ROW = Object.freeze({
  id: 'lens',
  when: (ctx) => {
    const seat = lensSeatFor(ctx?.term, ctx?.activeLens);
    return Boolean(seat && !isOpeningSeat(seat));
  },
  render: (ctx) => {
    const seat = lensSeatFor(ctx.term, ctx.activeLens);
    if (!seat) return null;
    const name = readable(seat.mode);
    return { label: 'lens', value: seat.foreground && seat.foreground !== name ? `${name} · ${seat.foreground}` : name };
  },
});

registerTermNoteRow(LENS_TERM_NOTE_ROW);
