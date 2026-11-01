/**
 * folio-strip.mjs — the week's high-res five, wherever a page shows them.
 *
 * A page marks a list with data-folio-highres-strip; this renders its items
 * from the folio pages themselves (each folio's tile gives the thumbnail, its
 * size, its label, and the page it hangs on), so a strip cannot disagree with
 * the shelf.
 * scripts/folio-highres-rotate.mjs calls it after it moves the high-res
 * links; `--strips-only` redraws the strips from the latest recorded week.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

/** Every page that hangs folio tiles: the September shelf, then a page per later month. */
export const FOLIO_PAGES = Object.freeze([
  Object.freeze({ file: 'design/folios/index.html', href: '/design/folios/' }),
  Object.freeze({ file: 'design/folios/october-2026/index.html', href: '/design/folios/october-2026/' }),
]);
export const STRIP_PAGES = Object.freeze(['index.html', 'now/index.html']);

const STRIP_RE = /(<ol\b[^>]*\bdata-folio-highres-strip\b[^>]*>)([\s\S]*?)(\n([ \t]*)<\/ol>)/g;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * slug → { no, anchor, href, thumb, width, height, title }, read from one folio page's tiles.
 * A later scan set prefixes its tiles with MMDD (folio-0927-07); its number
 * carries the date, so two No. 07s on one strip stay distinct. The tile's own
 * number label may read No. 07 or Oct 20 · 03; the strip writes its own.
 */
export function readFolioTiles(pageHtml, href = FOLIO_PAGES[0].href) {
  const tiles = new Map();
  for (const tile of pageHtml.matchAll(/<li class="folio-tile" id="(folio-(?:(\d{2})(\d{2})-)?(\d+))"[^>]*>([\s\S]*?)<\/li>/g)) {
    const [, anchor, month, day, number, body] = tile;
    const no = month ? `${number}, ${MONTHS[Number(month) - 1]} ${Number(day)}` : number;
    const img = /<img src="\/public\/images\/assets\/folios\/folio-([a-z0-9-]+)-thumb\.webp"[^>]*?width="(\d+)" height="(\d+)"/.exec(body);
    const label = /<span class="folio-tile__label"><span class="folio-tile__no">[^<]*<\/span>\s*([^<]+)<\/span>/.exec(body);
    if (!img || !label) continue;
    const [, slug, width, height] = img;
    tiles.set(slug, {
      no,
      anchor,
      href,
      thumb: `/public/images/assets/folios/folio-${slug}-thumb.webp`,
      width,
      height,
      title: label[1].trim(),
    });
  }
  return tiles;
}

/** Tiles from every folio page, keyed by slug; a slug hangs on one page. */
export function readAllFolioTiles(root = process.cwd()) {
  const tiles = new Map();
  for (const { file, href } of FOLIO_PAGES) {
    for (const [slug, tile] of readFolioTiles(readFileSync(path.join(root, file), 'utf8'), href)) tiles.set(slug, tile);
  }
  return tiles;
}

function renderItems(five, tiles, indent) {
  return five.map(({ slug }) => {
    const tile = tiles.get(slug);
    if (!tile) throw new Error(`folio-strip: no tile on ${FOLIO_PAGES.map((page) => page.file).join(' or ')} for ${slug}`);
    return `${indent}<li><a href="${tile.href}#${tile.anchor}"><img src="${tile.thumb}" width="${tile.width}" height="${tile.height}" alt="" loading="lazy" decoding="async"><span><span class="folio-strip__no">No. ${tile.no}</span> ${tile.title}</span></a></li>`;
  }).join('\n');
}

/** Redraw every marked strip on STRIP_PAGES for the given five ({ slug }[]). */
export function rewriteFolioStrips({ root = process.cwd(), five, dryRun = false, say = console.log } = {}) {
  const tiles = readAllFolioTiles(root);
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
