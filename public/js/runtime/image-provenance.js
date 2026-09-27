/**
 * image-provenance.js — every picture says where it came from.
 *
 * Original work carries * (value: a made thing, the sigil the site already
 * gives its art and folios); generated renders carry ~ (potential: a
 * projection of a prompt, the sigil of the depiction bench). Provenance is
 * read, never guessed: renders live under /public/images/renders/, folio scans
 * under /public/images/assets/folios/, and anywhere else a picture's .spw
 * sidecar decides (generated/image-provenance.js, written from the sidecars by
 * scripts/image-provenance-index.mjs). No record, no mark: a picture stays
 * unmarked rather than mislabeled.
 *
 * The visible mark follows html[data-spw-image-provenance] (Settings → Image
 * provenance: mark, named, off); the words reach assistive tech in every
 * tone. Each mark is anchored to its picture with CSS anchor positioning and
 * sits out of flow, so no image or wrapper changes its layout.
 * Contract: .spw/conventions/site-semantics.spw #image_provenance.
 */

import { IMAGE_PROVENANCE_RECORDS } from '../generated/image-provenance.js';

const RULES = Object.freeze([
  Object.freeze({ match: '/public/images/renders/', kind: 'generated', sigil: '~', word: 'generated', description: 'Generated image.' }),
  Object.freeze({ match: '/public/images/assets/folios/', kind: 'original', sigil: '*', word: 'original', description: 'Original artwork, scanned.' }),
]);

const RECORDED = Object.freeze({
  generated: Object.freeze({ kind: 'generated', sigil: '~', word: 'generated', description: 'Generated image.' }),
});

let mounted = null;
let counter = 0;

/** The longest recorded stem that names this file (<stem>.<ext> or <stem>-<tier>.<ext>). */
function recordFor(path) {
  let best = null;
  for (const record of IMAGE_PROVENANCE_RECORDS) {
    const { stem } = record;
    if ((path.startsWith(`${stem}.`) || path.startsWith(`${stem}-`)) && (!best || stem.length > best.stem.length)) best = record;
  }
  return best;
}

export function classifyImageSource(src = '') {
  const at = src.indexOf('/public/images/');
  const path = (at >= 0 ? src.slice(at) : src).split(/[?#]/)[0];
  const ruled = RULES.find((rule) => path.includes(rule.match));
  if (ruled) return ruled;
  return RECORDED[recordFor(path)?.kind] || null;
}

function markImage(img, marks) {
  if (marks.has(img)) return;
  const rule = classifyImageSource(img.getAttribute('src') || '');
  if (!rule) return;
  const anchor = `--spw-provenance-${++counter}`;
  img.style.setProperty('anchor-name', anchor);
  if (!img.hasAttribute('aria-description')) img.setAttribute('aria-description', rule.description);

  const mark = document.createElement('span');
  mark.className = `spw-provenance-mark spw-provenance-mark--${rule.kind}`;
  mark.setAttribute('aria-hidden', 'true');
  mark.style.setProperty('position-anchor', anchor);
  const sigil = document.createElement('span');
  sigil.className = 'spw-provenance-mark__sigil';
  sigil.textContent = rule.sigil;
  const word = document.createElement('span');
  word.className = 'spw-provenance-mark__word';
  word.textContent = rule.word;
  mark.append(sigil, word);

  // A span is not allowed inside <picture>; sit beside it instead.
  const host = img.parentElement?.tagName === 'PICTURE' ? img.parentElement : img;
  host.after(mark);
  marks.set(img, mark);
}

export function initImageProvenance() {
  if (mounted) return;
  const marks = new Map();
  for (const img of document.querySelectorAll('img[src]')) markImage(img, marks);
  mounted = { marks };
}

export function unmountImageProvenance() {
  if (!mounted) return;
  for (const [img, mark] of mounted.marks) {
    mark.remove();
    img.style.removeProperty('anchor-name');
  }
  mounted = null;
}

export { unmountImageProvenance as unmount };
