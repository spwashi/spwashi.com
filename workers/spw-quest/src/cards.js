// One card shape for spw.quest's constructs and pivots: a head with the glyph,
// the name and its badges, then the card's facts, then a row of links. Learn
// one card and every other reads the same way. Plain elements on purpose: the
// shell styles header, footer and .card for the page, not for a card.
import { escapeHtml } from "../../lib/shell.js";

/** A link for a card's row, escaped once here. */
export const cardLink = (href, label) => `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;

/** Rows of a card's facts: [term, html] pairs; an empty value leaves its row out. */
export function cardFacts(rows) {
  const kept = rows.filter(([, value]) => value);
  return kept.length
    ? `<dl class="qc-facts">${kept.map(([term, value]) => `<div><dt>${escapeHtml(term)}</dt><dd>${value}</dd></div>`).join("")}</dl>`
    : "";
}

/**
 * One card. `glyph` and `body` are HTML the caller built (paint is escaped by
 * the reader); `name`, `badges` and `id` are text.
 */
export function questCard({ id = "", tag = "article", level = 3, glyph = "", name = "", badges = [], body = "", links = [], className = "" }) {
  const kept = links.filter(Boolean);
  return `<${tag} class="qc${className ? ` ${className}` : ""}"${id ? ` id="${escapeHtml(id)}"` : ""}>
      <div class="qc-head">${glyph ? `<code class="qc-glyph">${glyph}</code>` : ""}<h${level} class="qc-name">${escapeHtml(name)}</h${level}>${badges.length ? `<ul class="qc-badges">${badges.filter(Boolean).map((badge) => `<li>${escapeHtml(badge)}</li>`).join("")}</ul>` : ""}</div>
      ${body}${kept.length ? `
      <p class="qc-links">${kept.join('<span aria-hidden="true"> · </span>')}</p>` : ""}
    </${tag}>`;
}

export const CARD_CSS = `.qc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 19rem), 1fr)); gap: .6rem; margin: .8rem 0 0; padding: 0; list-style: none; }
    .qc { display: grid; align-content: start; gap: .45rem; min-width: 0; margin: 0; padding: .75rem .85rem .7rem; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); }
    .qc:target { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
    .qc p { margin: 0; }
    .qc-head { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: baseline; gap: .15rem .6rem; }
    .qc-glyph { grid-column: 1 / -1; font: 600 1.02rem/1.4 var(--mono); overflow-wrap: anywhere; }
    .qc-name { margin: 0; font: 600 1rem/1.25 var(--font); }
    .qc-badges { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: .2rem; margin: 0; padding: 0; list-style: none; }
    .qc-badges li { padding: .1rem .45rem; border: 1px solid var(--line); border-radius: var(--pill); color: var(--muted); font: 500 .72rem/1.3 var(--mono); }
    .qc-facts { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: .2rem .7rem; margin: 0; font-size: .88rem; line-height: 1.45; }
    .qc-facts div { display: contents; }
    .qc-facts dt { color: var(--muted); font: .76rem/1.75 var(--mono); }
    .qc-facts dd { margin: 0; overflow-wrap: anywhere; }
    .qc-facts code { font-size: .92em; }
    .qc-chips { display: flex; flex-wrap: wrap; gap: .15rem .55rem; }
    .qc-chips a { display: inline-flex; align-items: center; min-height: 28px; }
    .qc-links { display: flex; flex-wrap: wrap; align-items: center; gap: 0 .2rem; font-size: .86rem; }
    .qc-links a { display: inline-flex; align-items: center; min-height: 32px; }
    @media (pointer: coarse) { .qc-links a, .qc-chips a { min-height: 44px; } }`;
