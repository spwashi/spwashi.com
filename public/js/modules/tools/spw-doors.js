/**
 * spw-doors.js — the row of links a whole .spw document leaves by.
 *
 * The room and the literal parser hold a document; each peer reads one from
 * its own address (kernel/ecosystem-links.js). Plain links, so a door can be
 * copied or opened elsewhere, and a source too long to carry offers none.
 */
import { ecosystemLinks } from '../../kernel/ecosystem-links.js';

export function renderSpwDoors(host, source, name = '') {
  if (!(host instanceof HTMLElement)) return;
  const text = String(source ?? '').trim();
  const doors = text ? ecosystemLinks(text, { jobs: ['pivot', 'build', 'canvas'], name: String(name).replace(/\.spw$/, '') }) : [];
  host.replaceChildren(...doors.map((door) => {
    const link = document.createElement('a');
    link.className = door.job === 'canvas' ? 'spw-card-door-canvas' : 'spw-card-door-pivot';
    link.href = door.href;
    link.title = door.title;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = `${door.label} ↗`;
    return link;
  }));
  host.hidden = doors.length === 0;
}
