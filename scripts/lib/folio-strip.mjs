/**
 * folio-strip.mjs — the week's high-res five, wherever a page shows them.
 *
 * A page marks a list with data-folio-highres-strip; this renders its items
 * from the folio page itself (each folio's tile gives the thumbnail, its
 * size, and its label), so a strip cannot disagree with the shelf.
 * scripts/folio-highres-rotate.mjs calls it after it moves the high-res
 * links; `--strips-only` redraws the strips from the latest recorded week.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export const FOLIO_PAGE = 'design/folios/index.html';
export const STRIP_PAGES = Object.freeze(['index.html', 'now/index.html']);

const STRIP_RE = /(<ol\b[^>]*\bdata-folio-highres-strip\b[^>]*>)([\s\S]*?)(\n([ \t]*)<\/ol>)/g;

/** slug → { no, anchor, thumb, width, height, title }, read from the folio page's tiles. */
export function readFolioTiles(pageHtml) {
  const tiles = new Map();
  for (const tile of pageHtml.matchAll(/<li class="folio-tile" id="(folio-(\d+))"[^>]*>([\s\S]*?)<\/li>/g)) {
    const [, anchor, no, body] = tile;
    const img = /<img src="\/public\/images\/assets\/folios\/folio-([a-z0-9-]+)-thumb\.webp"[^>]*?width="(\d+)" height="(\d+)"/.exec(body);
    const label = /<span class="folio-tile__label"><span class="folio-tile__no">No\. \d+<\/span>\s*([^<]+)<\/span>/.exec(body);
    if (!img || !label) continue;
    const [, slug, width, height] = img;
    tiles.set(slug, {
      no,
      anchor,
      thumb: `/public/images/assets/folios/folio-${slug}-thumb.webp`,
      width,
      height,
      title: label[1].trim(),
    });
  }
  return tiles;
}

function renderItems(five, tiles, indent) {
  return five.map(({ slug }) => {
    const tile = tiles.get(slug);
    if (!tile) throw new Error(`folio-strip: no tile on ${FOLIO_PAGE} for ${slug}`);
    return `${indent}<li><a href="/design/folios/#${tile.anchor}"><img src="${tile.thumb}" width="${tile.width}" height="${tile.height}" alt="" loading="lazy" decoding="async"><span><span class="folio-strip__no">No. ${tile.no}</span> ${tile.title}</span></a></li>`;
  }).join('\n');
}

/** Redraw every marked strip on STRIP_PAGES for the given five ({ slug }[]). */
export function rewriteFolioStrips({ root = process.cwd(), five, dryRun = false, say = console.log } = {}) {
  const tiles = readFolioTiles(readFileSync(path.join(root, FOLIO_PAGE), 'utf8'));
  for (const page of STRIP_PAGES) {
    const file = path.join(root, page);
    const html = readFileSync(file, 'utf8');
    let count = 0;
    const next = html.replace(STRIP_RE, (_, open, _items, close, closeIndent) => {
      count += 1;
      return `${open}\n${renderItems(five, tiles, `${closeIndent}    `)}${close}`;
    });
    if (!count) continue;
    say(`${page}: ${count} strip(s) → ${five.map(({ slug }) => tiles.get(slug)?.no).join(', ')}`);
    if (!dryRun && next !== html) writeFileSync(file, next);
  }
}
