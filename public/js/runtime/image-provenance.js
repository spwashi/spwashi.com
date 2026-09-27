/**
 * image-provenance.js — every picture says where it came from.
 *
 * Original work carries * (value: a made thing, the sigil the site already
 * gives its art and folios); generated renders carry ~ (potential: a
 * projection of a prompt, the sigil of the depiction bench). Provenance is
 * read from where a picture is kept, never guessed: renders live under
 * /public/images/renders/, folio scans under /public/images/assets/folios/,
 * and anything else stays unmarked rather than mislabeled.
 *
 * The visible mark follows html[data-spw-image-provenance] (Settings → Image
 * provenance: mark, named, off); the words reach assistive tech in every
 * tone. Each mark is anchored to its picture with CSS anchor positioning and
 * sits out of flow, so no image or wrapper changes its layout.
 * Contract: .spw/conventions/site-semantics.spw #image_provenance.
 */

const RULES = Object.freeze([
  Object.freeze({ match: '/public/images/renders/', kind: 'generated', sigil: '~', word: 'generated', description: 'Generated image.' }),
  Object.freeze({ match: '/public/images/assets/folios/', kind: 'original', sigil: '*', word: 'original', description: 'Original artwork, scanned.' }),
]);

let mounted = null;
let counter = 0;

export function classifyImageSource(src = '') {
  return RULES.find((rule) => src.includes(rule.match)) || null;
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
