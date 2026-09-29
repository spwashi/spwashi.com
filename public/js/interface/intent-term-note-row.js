/**
 * The carried intent's row in a living term's note (semantic/term-note-rows.js).
 *
 * Registered with the promo owner (interface/discovery-notices.js), which
 * already meets the reader along the same intent. The source is only the
 * carried intent (kernel/visit-intent.js readCarriedIntent: a lens seat the
 * reader held and took across pages). A page's default seat is not a primed
 * intent, and the lens row already names it. No carried intent, no row.
 * Said the way the site says an intent aloud (describeIntent), with the
 * seat's own word.
 */
import { registerTermNoteRow } from '/public/js/semantic/term-note-rows.js';
import { describeIntent } from '/public/js/kernel/visit-intent.js';

export const INTENT_TERM_NOTE_ROW = Object.freeze({
  id: 'intent',
  when: (ctx) => Boolean(ctx?.primedContext?.operator) && ctx.primedContext.from !== 'page',
  render: (ctx) => {
    const said = describeIntent(ctx.primedContext);
    const word = String(ctx.primedContext.word || '').trim();
    return { label: 'intent', value: word && !said.includes(word) ? `${said} · ${word}` : said };
  },
});

registerTermNoteRow(INTENT_TERM_NOTE_ROW);
