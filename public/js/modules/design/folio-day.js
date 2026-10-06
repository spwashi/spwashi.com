/**
 * folio-day.js — one piece a day, and the question it asks.
 *
 * Reads public/data/folio-days.json (generated from the folio and panel
 * sidecars) and picks with kernel/day-seed.js, so every reader sees the same
 * piece on the same local day, the rotation never lines up with the week, and
 * nobody edits the page for it to change. The host's own copy explains the
 * rotation and links the shelf when this does not run.
 *
 * A host may name its own salt (data-folio-day-salt="home") so two pages show
 * two different pieces on the same day, and may ask to be compact
 * (data-folio-day-compact): today's piece and its question, without the week.
 */

import { dayKey, dayWindow, pickForDay } from '../../kernel/day-seed.js';

const HOST_SELECTOR = '[data-folio-day]';
const SOURCE = '/public/data/folio-days.json';
const SALT = 'folio-day';

let mounted = null;

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

const dateWords = (date) => date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

function card(piece, date, titleId) {
  return h('article', { class: 'folio-day__today', 'aria-labelledby': titleId },
    h('p', { class: 'folio-day__date' }, h('time', { datetime: dayKey(date) }, dateWords(date))),
    h('a', { class: 'folio-day__piece', href: piece.href },
      h('img', { src: piece.thumb, width: piece.width, height: piece.height, alt: piece.alt, decoding: 'async' }),
      h('span', { id: titleId, class: 'folio-day__title' }, piece.title)),
    piece.opens ? h('p', { class: 'folio-day__question' }, `?${piece.opens}`) : null,
    h('p', {}, h('a', { href: piece.href }, 'Open it on the shelf')));
}

export async function initFolioDay() {
  const host = document.querySelector(HOST_SELECTOR);
  if (!host || mounted) return () => {};
  mounted = { host, nodes: [] };
  host.dataset.folioDayState = 'loading';
  try {
    const response = await fetch(host.dataset.folioDaySrc || SOURCE);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const feed = await response.json();
    // A day's piece always arrives with a question; pieces without one wait for their sidecars.
    const asking = feed.pieces.filter((piece) => piece.opens);
    const today = new Date();
    const salt = host.dataset.folioDaySalt || SALT;
    const suffix = salt === SALT ? '' : `-${salt.replace(/[^a-z0-9-]/gi, '')}`;
    const piece = pickForDay(asking, today, salt);
    const week = dayWindow(asking, today, 7, salt).slice(1);
    const compact = 'folioDayCompact' in host.dataset;
    const nodes = compact ? [card(piece, today, `folio-day-title${suffix}`)] : [
      card(piece, today, `folio-day-title${suffix}`),
      h('section', { class: 'folio-day__week', 'aria-labelledby': `folio-day-week${suffix}` },
        h('h2', { id: `folio-day-week${suffix}` }, 'The week ahead'),
        h('ol', {}, week.map(({ date, item }) => h('li', {},
          h('time', { datetime: dayKey(date) }, date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })),
          ' ', h('a', { href: item.href }, item.title))))),
      h('p', { class: 'folio-day__count' }, `${asking.length} pieces rotate here, each once before any returns; ${feed.count - asking.length} more join when their sidecars learn a question.`),
    ];
    host.append(...nodes);
    mounted.nodes = nodes;
    host.dataset.folioDayState = 'ready';
    host.dataset.folioDayKey = dayKey(today);
  } catch (error) {
    host.dataset.folioDayState = 'failed';
  }
  return () => {
    for (const node of mounted?.nodes || []) node.remove();
    delete host.dataset.folioDayState;
    delete host.dataset.folioDayKey;
    mounted = null;
  };
}

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'folio-day',
  mount: () => initFolioDay(),
  describes: 'folio[day]{date.pick}<question> one piece and its question each day, drawn from the sidecars',
});
