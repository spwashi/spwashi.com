/**
 * The cauldron's row in a living term's note (semantic/term-note-rows.js).
 *
 * Registered when the cauldron owner (interface/composition.js) loads, and
 * shown only while the `cauldron` module is mounted and holds something: it
 * repeats the cauldron's own status line, so the reader knows what gathering
 * this word would join before they gather it. Read at note open only.
 */
import { registerTermNoteRow } from '/public/js/semantic/term-note-rows.js';
import { computeCauldronPhase, getCauldronStatusCopy } from '/public/js/semantic/cauldron/contract.js';
import { getCauldron } from '/public/js/semantic/cauldron/storage.js';

export const CAULDRON_TERM_NOTE_ROW = Object.freeze({
  id: 'cauldron',
  when: (ctx) => Boolean(ctx?.mounted?.has?.('cauldron')),
  render: () => {
    const ingredients = getCauldron();
    if (!ingredients.length) return null;
    return { label: 'cauldron', value: getCauldronStatusCopy(ingredients.length, computeCauldronPhase(ingredients)) };
  },
});

registerTermNoteRow(CAULDRON_TERM_NOTE_ROW);
