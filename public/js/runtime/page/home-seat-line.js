/**
 * Home's seat lines.
 *
 * Each seat panel on Home carries one Spw line whose slots say what they do:
 * home[mode]{body}<projection>. The mode is the seat, the body what it holds,
 * and the projection a link to where it leads. With scripts off that line is
 * the authored one, and it already reads.
 *
 * The braces are a container, so they can hold more than the page wrote. This
 * module adds the words a reader is holding from other pages: the cauldron's
 * words whose operator is the seat's (reading `.`, systems `^`, play `~`,
 * studio `@`), newest first, each a link back to where it was held. A word held
 * on /topics/ with `~` shows up in Play's line on Home, and one tap returns to
 * the place it came from: the line carries wonder across pages without a store
 * of its own.
 *
 * It reads the cauldron (semantic/cauldron/storage.js) and writes no storage
 * and no expression attribute: the authored data-spw-semantic-expression stays
 * the page's, and only the visible tokens change.
 */
import { getOperatorDefinition } from '/public/js/kernel/operator-detection.js';
import { deriveProvenance, getCauldron } from '/public/js/semantic/cauldron/storage.js';

const LINE_SELECTOR = '.home-seat-line[data-spw-operator]';
const BODY_SELECTOR = '.home-seat-line__body';
const CARRIED_CLASS = 'home-seat-line__carried';
const HELD_LIMIT = 3;

let mounted = null;

const typeOf = (value) => getOperatorDefinition(value)?.type || '';

/**
 * The cauldron's words for one operator type, newest first, one per word.
 * A word the seat already names (its authored body) is not repeated.
 */
export function heldWordsFor(ingredients, operatorType, { limit = HELD_LIMIT, already = [] } = {}) {
  if (!operatorType) return [];
  const seen = new Set(already.map((word) => String(word).trim()).filter(Boolean));
  return [...(ingredients || [])]
    .filter((item) => item && typeOf(item.operator) === operatorType)
    .sort((a, b) => (b.capturedAt || 0) - (a.capturedAt || 0))
    .map((item) => {
      const word = String(item.operand || item.label || item.expression || '').trim();
      const provenance = deriveProvenance(item);
      return { word, sigil: item.operator, href: provenance?.href || '', route: provenance?.route || '' };
    })
    .filter((entry) => entry.word && !seen.has(entry.word) && seen.add(entry.word))
    .slice(0, limit);
}

function renderLine(line, ingredients) {
  const body = line.querySelector(BODY_SELECTOR);
  if (!body) return;
  body.querySelectorAll(`.${CARRIED_CLASS}, .home-seat-line__join`).forEach((node) => node.remove());
  const authored = body.querySelector('.home-seat-line__held')?.textContent || '';
  const words = heldWordsFor(ingredients, typeOf(line.dataset.spwOperator), { already: [authored] });
  const close = body.lastChild;
  for (const entry of words) {
    const join = document.createElement('span');
    join.className = 'home-seat-line__join';
    join.textContent = ', ';
    const token = document.createElement(entry.href ? 'a' : 'span');
    token.className = CARRIED_CLASS;
    token.textContent = `${entry.sigil}${entry.word}`;
    if (entry.href) {
      token.href = entry.href;
      token.title = `held on ${entry.route}; back to where you held it`;
    }
    body.insertBefore(join, close);
    body.insertBefore(token, close);
  }
}

function renderAll() {
  if (!mounted) return;
  const ingredients = getCauldron();
  mounted.lines.forEach((line) => renderLine(line, ingredients));
}

export function initHomeSeatLine() {
  if (mounted) return;
  const lines = [...document.querySelectorAll(LINE_SELECTOR)];
  if (!lines.length) return;
  mounted = { lines };
  renderAll();
  document.addEventListener('cauldron:updated', renderAll);
  window.addEventListener('storage', onStorage);
}

function onStorage(event) {
  if (event.key === null || event.key === 'spw-cauldron') renderAll();
}

export function unmountHomeSeatLine() {
  if (!mounted) return;
  document.removeEventListener('cauldron:updated', renderAll);
  window.removeEventListener('storage', onStorage);
  mounted = null;
}
