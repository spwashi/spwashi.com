/**
 * modules/projects/arc-bench.js
 *
 * The arc bench on /projects/#arc-bench: an opt-in practice surface reached
 * only by deep link. The writer names one part of a career, up to three
 * audiences, and up to four beats; then writes one line per beat for each
 * audience. The HTML form is the instrument (it reads with scripts off);
 * this module only serializes what is typed into Spw text and offers the
 * site's seed exits (copy, .spw.txt download).
 *
 *   arc[<audience_slug>]{"<line>"; "<line>"; …}<element_slug>   one per audience
 *   taste[arc]{element = "…"; beats = #[…]; audiences = #[…]}  the writer's words
 *
 * Beats join with ';' (ordinal). A '.' join would collapse into one ident.
 * Heads that would collide (an empty slug, a repeat) take their position.
 * The bench ships no beat names and no audience vocabulary; the taste line
 * records whatever the writer chose. Nothing is stored or sent anywhere.
 */

import { bindSeedExits } from '/public/js/interface/seed-exits.js';

export const ARC_BENCH_LIMITS = Object.freeze({ audiences: 3, beats: 4 });

/** A writer's phrase as a Spw identifier: lowercase ascii words joined by '_'.
    The workbench parser's identifiers are ascii, so a name in another script
    (or one that is all punctuation) falls back; callers that seat several
    names pass a positional fallback so arcs stay apart. */
export function arcSlug(value = '', fallback = 'unnamed') {
  const slug = String(value)
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (!slug) return fallback;
  return /^[0-9]/.test(slug) ? `n${slug}` : slug;
}

/** Slugs for a row of names, kept distinct: an empty slug takes
    `<stem>_<position>`, and a repeat takes its 1-based position as a suffix. */
export function arcSlugs(names = [], positions = [], stem = 'unnamed') {
  const used = new Set();
  return names.map((name, i) => {
    const position = (positions[i] ?? i) + 1;
    let slug = arcSlug(name, `${stem}_${position}`);
    if (used.has(slug)) slug = `${slug}_${position}`;
    while (used.has(slug)) slug = `${slug}_`;
    used.add(slug);
    return slug;
  });
}

/** A writer's line as a Spw string: one line, quotes and backslashes escaped. */
export function arcString(value = '') {
  const text = String(value).replace(/\s+/g, ' ').trim();
  return `"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

/**
 * state = { element, audiences: string[], beats: string[], lines: string[][] }
 * lines[a][b] is audience a's line for beat b. An audience or beat seat is
 * kept when it is named or when any line under it has text, so nothing the
 * writer typed is dropped; an unnamed seat shows as "" in the taste line and
 * as a positional slug (audience_2) in its arc head. An unwritten line stays
 * in its seat as "" so order holds.
 */
export function serializeArcBench(state = {}) {
  const element = clean(state.element);
  const row = (a) => state.lines?.[a] || [];
  const written = (a, b) => Boolean(clean(row(a)[b]));
  const seats = (names, limit) => (names || [])
    .slice(0, limit)
    .map((name, index) => ({ name: clean(name), index }));

  const beatSeats = seats(state.beats, ARC_BENCH_LIMITS.beats);
  const audienceSeats = seats(state.audiences, ARC_BENCH_LIMITS.audiences);
  const audiences = audienceSeats.filter((audience) =>
    audience.name || beatSeats.some((beat) => written(audience.index, beat.index)));
  const beats = beatSeats.filter((beat) =>
    beat.name || audiences.some((audience) => written(audience.index, beat.index)));

  const elementSlug = arcSlug(element, 'element');
  const heads = arcSlugs(audiences.map((a) => a.name), audiences.map((a) => a.index), 'audience');
  const arcs = audiences.map((audience, i) => {
    const body = beats.map((beat) => arcString(row(audience.index)[beat.index] || '')).join('; ');
    return `arc[${heads[i]}]{${body}}<${elementSlug}>`;
  });

  const list = (items) => `#[${items.map((item) => arcString(item.name)).join(', ')}]`;
  const taste = `taste[arc]{element = ${arcString(element)}; beats = ${list(beats)}; audiences = ${list(audiences)}}`;
  return [...arcs, taste].join('\n');
}

const field = (root, name) => {
  const el = root.querySelector(`[name="${name}"]`);
  return el && 'value' in el ? el.value : '';
};

/** Read the bench's named fields (see projects/index.html) into state. */
export function readArcBench(root) {
  const { audiences: A, beats: B } = ARC_BENCH_LIMITS;
  const range = (n) => Array.from({ length: n }, (_, i) => i + 1);
  return {
    element: field(root, 'arc-element'),
    audiences: range(A).map((a) => field(root, `arc-audience-${a}`)),
    beats: range(B).map((b) => field(root, `arc-beat-${b}`)),
    lines: range(A).map((a) => range(B).map((b) => field(root, `arc-line-${a}-${b}`))),
  };
}

/* Legends and line labels follow the names as they are typed, so a line
   field reads "Line for <beat>" once the writer has named it. The authored
   numbered labels are what scripts-off readers get. */
function relabel(root, state) {
  root.querySelectorAll('[data-arc-audience-label]').forEach((el) => {
    const index = Number(el.getAttribute('data-arc-audience-label')) - 1;
    const name = clean(state.audiences[index]);
    if (el.dataset.arcOriginal === undefined) el.dataset.arcOriginal = el.textContent;
    el.textContent = name ? `For ${name}` : el.dataset.arcOriginal;
  });
  root.querySelectorAll('[data-arc-beat-label]').forEach((el) => {
    const index = Number(el.getAttribute('data-arc-beat-label')) - 1;
    const name = clean(state.beats[index]);
    if (el.dataset.arcOriginal === undefined) el.dataset.arcOriginal = el.textContent;
    el.textContent = name ? `Line for ${name}` : el.dataset.arcOriginal;
  });
}

/** The catalog loader passes (ctx, root); a direct caller passes (root). */
export function mount(ctxOrRoot, rootArg) {
  const root = rootArg instanceof Element ? rootArg : (ctxOrRoot instanceof Element ? ctxOrRoot : null);
  if (!root) return () => {};
  const form = root.querySelector('form');
  const out = root.querySelector('[data-arc-output]');
  const exits = root.querySelector('[data-arc-exits]');
  if (!form || !out) return () => {};

  let text = '';
  const render = () => {
    const state = readArcBench(root);
    text = serializeArcBench(state);
    out.textContent = text;
    relabel(root, state);
  };
  const onSubmit = (event) => event.preventDefault();

  form.addEventListener('input', render);
  form.addEventListener('submit', onSubmit);
  const unbindExits = bindSeedExits(root, {
    seed: () => text,
    filename: () => `arc-${arcSlug(field(root, 'arc-element'), 'bench')}`,
  });
  render();
  if (exits) exits.hidden = false;

  return () => {
    form.removeEventListener('input', render);
    form.removeEventListener('submit', onSubmit);
    unbindExits();
    if (exits) exits.hidden = true;
  };
}

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'arc-bench',
  mount,
  describes: 'arc[audience]{line;line}<element> taste[arc]{beats|audiences} the writer names every word; copy or download, nothing stored',
  timingArc: 'visible-feature',
  effectScope: ['local-dom', 'listeners'],
});
