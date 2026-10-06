/**
 * spw-paste.js — paste Spw, and the page offers what to do with it.
 *
 * The host is a GET form to the literal parser, so with scripts off a pasted
 * expression still opens there. This module reads the paste with the bundled
 * parser, shows it in the operator canon's colors (--op-<type>-color), and orders the
 * next move by what the text is:
 *
 *   seed        a copied seed card                open it as a card, fill its card at home
 *   document    frames, anchors, or many lines   open it as a room, read it, save it
 *   expression  one short form                    read its structure, open it as a room
 *   prose       no operators or brackets          say so; the parser can still look
 *
 * How it arrives decides the surface. Typing or pasting into the box answers
 * inline. Pasting anywhere on a page whose host says data-paste-open="page"
 * opens a dialog with the same reading. Dropping a .spw file goes straight to
 * the room, because a file is already a document.
 */

import { OPERATOR_INFO } from '../../runtime/experiential/operator-info.js';
import { PARSER_LINK_MAX_SOURCE, parserHref } from '../../kernel/parser-link.js';
import { MAX_DOCUMENT_BYTES, deliverDocumentLaunch, isSpwDocument } from '../../runtime/shell/spw-document-launch.js';
import { downloadSpwText } from '../../interface/seed-exits.js';
import { SEED_HOMES, SeedCard, deliverSeedHome, ensureSeedCardStyles, readSeedText } from '../cards/seed-card.js';

const HOST_SELECTOR = '[data-paste-open]';
const PASTE_NAME = 'pasted.spw';
const PASTED_CARD_ID = 'pasted-seed-card';
const MARKS = new Set(['OPERATOR', 'PARTICLE', 'CONTAINER_OPEN', 'CONTAINER_CLOSE', 'CAPSULE_OPEN', 'CAPSULE_CLOSE']);
const OPENER = Object.freeze({ '}': '{', ']': '[', ')': '(', '>': '<' });

export const PASTE_ACTIONS = Object.freeze({
  card: 'Open it as a card',
  home: 'Fill its card',
  room: 'Open it as a room',
  parser: 'Read its structure',
  save: 'Save as .spw.txt',
});

let loadParser = () => import('../../semantic/spw-workbench-parser.js').then((mod) => mod.parse);
let parserPromise = null;
let mounted = null;

// The parser bundle is the heavy part; it loads on the first paste, not at mount.
const parser = () => (parserPromise ||= loadParser());

function operatorFor(token) {
  const value = String(token.value ?? '');
  if (token.type === 'PARTICLE') {
    const prefix = ['#>', '#:', '#'].find((sigil) => value.startsWith(sigil)) || value[0];
    return OPERATOR_INFO[prefix]?.type ?? null;
  }
  if (token.type === 'OPERATOR') return OPERATOR_INFO[value]?.type ?? null;
  return OPERATOR_INFO[OPENER[value] || value]?.type ?? null;
}

/**
 * Lossless segments: every character of the source lands in exactly one
 * segment, and a segment that is an operator or a bracket names its type.
 */
export function spwSegments(source, tokens = []) {
  const text = String(source ?? '');
  const spans = tokens
    .filter((token) => token?.span && token.type !== 'EOF')
    .sort((a, b) => a.span.start.offset - b.span.start.offset);
  const segments = [];
  let at = 0;
  for (const token of spans) {
    const start = token.span.start.offset;
    const end = token.span.end.offset;
    if (start < at || end <= start) continue;
    if (start > at) segments.push({ text: text.slice(at, start), operator: null });
    segments.push({ text: text.slice(start, end), operator: MARKS.has(token.type) ? operatorFor(token) : null });
    at = end;
  }
  if (at < text.length) segments.push({ text: text.slice(at), operator: null });
  return segments;
}

function countFrames(tokens) {
  const solid = tokens.filter((token) => token.type !== 'WHITESPACE' && token.type !== 'COMMENT');
  let frames = 0;
  for (let i = 0; i + 2 < solid.length; i += 1) {
    if (solid[i].type === 'OPERATOR' && solid[i].value === '^'
      && solid[i + 1].type === 'STRING' && solid[i + 2].type === 'CONTAINER_OPEN') frames += 1;
  }
  return frames;
}

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

/** What the pasted text is, and the moves it earns, most fitting first. */
export function readPaste(source, parse) {
  const text = String(source ?? '');
  if (!text.trim()) {
    return { kind: 'empty', source: text, segments: [], actions: [], reading: '' };
  }
  let result = null;
  try { result = parse(text); } catch { result = null; }
  const tokens = Array.isArray(result?.tokens) ? result.tokens : [];
  const marks = tokens.filter((token) => MARKS.has(token.type)).length;
  const anchors = tokens.filter((token) => token.type === 'PARTICLE' && String(token.value).startsWith('#>')).length;
  const frames = countFrames(tokens);
  const lines = text.split('\n').filter((line) => line.trim()).length;
  const errors = Array.isArray(result?.errors) ? result.errors.length : 0;
  const bytes = new TextEncoder().encode(text).length;
  const fitsParser = text.length <= PARSER_LINK_MAX_SOURCE;
  const fitsRoom = bytes <= MAX_DOCUMENT_BYTES;

  const seed = readSeedText(text);
  const kind = seed ? 'seed' : marks === 0 ? 'prose' : (frames || anchors || lines > 3 ? 'document' : 'expression');
  const order = {
    seed: ['card', 'home', 'parser', 'save'],
    document: ['room', 'parser', 'save'],
    expression: ['parser', 'room', 'save'],
    prose: ['parser'],
  }[kind];
  const actions = order.filter((action) => (
    action === 'parser' ? fitsParser
      : action === 'room' ? fitsRoom
        : action === 'home' ? Boolean(SEED_HOMES[seed?.templateKey])
          : true));

  const notes = [];
  if (errors) notes.push(`The parser marks ${plural(errors, 'place')} to look at.`);
  if (!fitsParser && kind !== 'prose') notes.push('It is longer than a parser link carries, so the room is the way in.');
  const reading = {
    seed: seed ? `Reads as a ${seed.template.label} card: ${seed.filled} of ${plural(seed.template.fields.length, 'line')} filled.` : '',
    document: `Reads as a document: ${plural(frames, 'frame')}, ${plural(anchors, 'anchor')}, ${plural(lines, 'line')}.`,
    expression: lines === 1 ? 'Reads as one expression.' : `Reads as a short expression over ${plural(lines, 'line')}.`,
    prose: 'This does not read as Spw yet: no operators or brackets. The parser can still show what it sees.',
  }[kind];

  return {
    kind, source: text, segments: spwSegments(text, tokens), actions, seed,
    reading: [reading, ...notes].join(' '), frames, anchors, lines, errors, bytes,
  };
}

function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (key === 'class') el.className = value;
    else el.setAttribute(key, String(value));
  }
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

/** A button names where it goes when it can. */
export function actionLabel(action, reading) {
  if (action === 'home') {
    const home = SEED_HOMES[reading?.seed?.templateKey];
    return home ? `Fill its card on ${home.place}` : PASTE_ACTIONS.home;
  }
  return PASTE_ACTIONS[action];
}

function renderReading(out, reading, hint = '') {
  if (reading.kind === 'empty') {
    out.replaceChildren(...(hint ? [h('p', { class: 'spw-paste__reading' }, hint)] : []));
    return;
  }
  out.replaceChildren(
    h('p', { class: 'spw-paste__reading' }, reading.reading),
    h('pre', { class: 'spw-paste__source', tabindex: '0', 'aria-label': 'The pasted Spw, highlighted' },
      h('code', {}, reading.segments.map((segment) => (segment.operator
        ? h('span', { class: 'spw-paste__op', 'data-op': segment.operator, style: `--paste-op: var(--op-${segment.operator}-color)` }, segment.text)
        : segment.text)))),
    reading.actions.length
      ? h('div', { class: 'spw-paste__actions frame-operators', role: 'group', 'aria-label': 'What to do with it' },
        reading.actions.map((action, index) => h('button', {
          type: 'button',
          class: 'spw-chip',
          'data-paste-action': action,
          'data-paste-primary': index === 0 ? 'true' : null,
        }, actionLabel(action, reading))))
      : null,
  );
}

/** Hydrate the pasted seed into a live card beside the reading; its sheet loads the first time one opens. */
function openCard(reading, into) {
  into.querySelector(`#${PASTED_CARD_ID}`)?.remove();
  try {
    for (const key of Object.keys(localStorage)) if (key.startsWith(`seed-card:${PASTED_CARD_ID}`)) localStorage.removeItem(key);
  } catch { /* storage may be unavailable; the card still opens */ }
  const key = reading.seed.templateKey;
  const el = h('div', {
    class: 'seed-card spw-paste__card',
    id: PASTED_CARD_ID,
    'data-seed-card': '',
    'data-template': key,
    'data-templates': key,
    'data-spw-role': 'vessel',
    'data-spw-form': 'brace',
    'data-spw-meaning': 'a pasted seed, opened as its card',
  });
  into.append(el);
  ensureSeedCardStyles(el);
  const card = new SeedCard(el);
  el._seedCardInstance = card;
  card.hydrate(reading.seed);
  el.querySelector('.seed-field-value')?.focus();
  return card;
}

function act(action, reading, button, into) {
  const source = reading.source;
  if (action === 'card' && reading.seed && into) openCard(reading, into);
  else if (action === 'home' && reading.seed) deliverSeedHome(reading.seed);
  else if (action === 'room') deliverDocumentLaunch({ name: PASTE_NAME, source });
  else if (action === 'parser') {
    const href = parserHref(source, PASTE_NAME);
    if (href) globalThis.location?.assign(href);
  } else if (action === 'save') downloadSpwText(source, 'pasted', button);
}

const isEditable = (node) => Boolean(node?.closest?.('input, textarea, select, [contenteditable=""], [contenteditable="true"]'));

export async function initSpwPaste() {
  const host = document.querySelector(HOST_SELECTOR);
  if (!host || mounted) return () => {};
  const field = host.querySelector('textarea');
  const out = host.querySelector('[data-paste-out]');
  if (!field || !out) return () => {};

  const listeners = [];
  const on = (target, type, fn, options) => {
    target.addEventListener(type, fn, options);
    listeners.push(() => target.removeEventListener(type, fn, options));
  };
  let current = { kind: 'empty', source: '', segments: [], actions: [], reading: '' };
  let timer = null;
  let dialog = null;

  const hint = host.dataset.pasteOpen === 'page' ? 'Pasting anywhere on this page works too.' : '';
  const show = (reading, into = out) => {
    current = reading;
    renderReading(into, reading, hint);
    host.dataset.pasteOpenState = reading.kind;
  };
  show(current);
  if (field.value.trim()) parser().then((parse) => show(readPaste(field.value, parse)));

  on(field, 'input', () => {
    clearTimeout(timer);
    timer = setTimeout(async () => show(readPaste(field.value, await parser())), 180);
  });

  on(host, 'click', (event) => {
    const button = event.target.closest?.('[data-paste-action]');
    if (button && host.contains(button)) act(button.dataset.pasteAction, current, button, out);
  });

  // With scripts on, a source too long for a link would make a broken URL; the room takes it instead.
  on(host, 'submit', async (event) => {
    if (!field.value.trim() || field.value.length <= PARSER_LINK_MAX_SOURCE) return;
    event.preventDefault();
    show(readPaste(field.value, await parser()));
  });

  on(host, 'dragover', (event) => {
    if (event.dataTransfer?.types?.includes('Files') || event.dataTransfer?.types?.includes('text/plain')) event.preventDefault();
  });
  on(host, 'drop', async (event) => {
    const file = event.dataTransfer?.files?.[0];
    if (file && isSpwDocument(file)) {
      event.preventDefault();
      if (file.size > MAX_DOCUMENT_BYTES) return;
      deliverDocumentLaunch({ name: file.name, source: await file.text() });
      return;
    }
    const text = event.dataTransfer?.getData('text/plain');
    if (text) {
      event.preventDefault();
      field.value = text;
      show(readPaste(text, await parser()));
    }
  });

  if (host.dataset.pasteOpen === 'page') {
    on(document, 'paste', async (event) => {
      if (isEditable(event.target) || isEditable(document.activeElement)) return;
      const text = event.clipboardData?.getData('text/plain');
      if (!text?.trim()) return;
      const reading = readPaste(text, await parser());
      if (!['seed', 'document', 'expression'].includes(reading.kind)) return;
      dialog ||= buildDialog();
      const body = dialog.querySelector('[data-paste-out]');
      renderReading(body, reading);
      current = reading;
      if (!dialog.open) dialog.showModal();
      body.querySelector('[data-paste-primary]')?.focus();
    });
  }

  function buildDialog() {
    const node = h('dialog', { class: 'spw-paste__dialog', 'aria-labelledby': 'spw-paste-dialog-title' },
      h('header', { class: 'spw-paste__dialog-header' },
        h('h2', { id: 'spw-paste-dialog-title' }, 'You pasted Spw'),
        h('button', { type: 'button', class: 'spw-chip', 'data-paste-close': '' }, 'Close')),
      h('div', { 'data-paste-out': '' }),
      h('p', { class: 'spw-paste__keep' },
        h('button', { type: 'button', class: 'spw-chip', 'data-paste-keep': '' }, 'Keep it in the paste box')));
    node.addEventListener('click', (event) => {
      const button = event.target.closest?.('button');
      if (!button) return;
      if (button.hasAttribute('data-paste-close')) node.close();
      else if (button.hasAttribute('data-paste-keep')) {
        field.value = current.source;
        parser().then((parse) => show(readPaste(field.value, parse)));
        node.close();
        field.focus();
      } else if (button.dataset.pasteAction) act(button.dataset.pasteAction, current, button, node.querySelector('[data-paste-out]'));
    });
    document.body.append(node);
    return node;
  }

  mounted = { host };
  return () => {
    clearTimeout(timer);
    for (const off of listeners) off();
    dialog?.remove();
    out.replaceChildren();
    delete host.dataset.pasteOpenState;
    mounted = null;
  };
}

/** Test seam: swap the parser loader. */
export function setParserLoader(loader) {
  loadParser = loader;
  parserPromise = null;
}

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'spw-paste',
  mount: () => initSpwPaste(),
  describes: 'paste[spw]{read.highlight.act}<room> reads pasted Spw, highlights it in the operator canon, and orders the next move by what the text is',
});
