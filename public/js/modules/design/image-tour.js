/**
 * image-tour.js — a day's tour of the pictures the site shows.
 *
 * Reads public/data/image-tour.json (scripts/generate-image-tour.mjs) and
 * redraws a strip of pictures for today, each linking to the page that keeps
 * it. While the newest pieces are recent they lead the tour, rotating by day
 * among themselves; on quieter weeks the tour walks older work instead. The
 * strip's static items stay the reading with scripts off.
 *
 * A host may name its salt (data-image-tour-salt) so two pages tour
 * differently on the same day, and its length (data-image-tour-count).
 */

import { dayNumber, dayWindow } from '../../kernel/day-seed.js';

const HOST_SELECTOR = '[data-image-tour]';
const SOURCE = '/public/data/image-tour.json';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

let mounted = null;

const dateWords = (iso) => {
  const [, month, day] = iso.split('-').map(Number);
  return `${MONTHS[month - 1]} ${day}`;
};

const daysSince = (iso, today) => {
  const [year, month, day] = iso.split('-').map(Number);
  return dayNumber(today) - dayNumber(new Date(year, month - 1, day));
};

const distinct = (list, count) => {
  const seen = new Set();
  return list.filter((piece) => (seen.has(piece.src) ? false : (seen.add(piece.src), true))).slice(0, count);
};

/** Today's pieces: the newest batch while it is recent, rotating by day; older work otherwise. */
export function tourForDay(feed, today = new Date(), { salt = 'image-tour', count = 5 } = {}) {
  const pieces = Array.isArray(feed?.pieces) ? feed.pieces.filter((piece) => piece.added) : [];
  if (!pieces.length) return { mode: 'empty', pieces: [] };
  const recentDays = Number(feed.recentDays) || 21;
  const recent = pieces.filter((piece) => daysSince(piece.added, today) <= recentDays);
  const older = pieces.filter((piece) => daysSince(piece.added, today) > recentDays);
  const rotate = (pool) => dayWindow(pool, today, Math.min(pool.length, count * 2), salt).map(({ item }) => item);
  if (recent.length) {
    const newest = recent[0].added;
    const lead = recent.filter((piece) => piece.added === newest);
    const rest = recent.filter((piece) => piece.added !== newest).concat(older);
    return { mode: 'recent', since: newest, pieces: distinct([...rotate(lead), ...rotate(rest)], count) };
  }
  return { mode: 'tour', pieces: distinct(rotate(pieces), count) };
}

function item(piece) {
  const li = document.createElement('li');
  const link = document.createElement('a');
  link.href = piece.href;
  const img = document.createElement('img');
  Object.assign(img, { src: piece.src, alt: '', loading: 'lazy', decoding: 'async' });
  img.width = piece.width;
  img.height = piece.height;
  const label = document.createElement('span');
  const meta = document.createElement('span');
  meta.className = 'folio-strip__no';
  meta.textContent = `${piece.kind} · ${dateWords(piece.added)}`;
  label.append(meta, ` ${piece.label}`);
  link.append(img, label);
  li.append(link);
  return li;
}

export async function initImageTour() {
  const host = document.querySelector(HOST_SELECTOR);
  if (!host || mounted) return () => {};
  const authored = [...host.children];
  const authoredLabel = host.getAttribute('aria-label');
  mounted = { host };
  try {
    const response = await fetch(host.dataset.imageTourSrc || SOURCE);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const tour = tourForDay(await response.json(), new Date(), {
      salt: host.dataset.imageTourSalt || 'image-tour',
      count: Number(host.dataset.imageTourCount) || 5,
    });
    if (tour.pieces.length) {
      host.replaceChildren(...tour.pieces.map(item));
      host.setAttribute('aria-label', tour.mode === 'recent'
        ? `Today's tour, led by pieces from ${dateWords(tour.since)}`
        : "Today's tour of older pieces");
      host.dataset.imageTourState = tour.mode;
    }
  } catch {
    host.dataset.imageTourState = 'failed';
  }
  return () => {
    host.replaceChildren(...authored);
    if (authoredLabel) host.setAttribute('aria-label', authoredLabel);
    delete host.dataset.imageTourState;
    mounted = null;
  };
}

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'image-tour',
  mount: () => initImageTour(),
  describes: 'tour[image]{recent.rotate}<source> a day of pictures from across the site, newest first while recent, each linking where it lives',
});
