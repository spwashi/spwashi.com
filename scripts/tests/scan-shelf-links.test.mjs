/**
 * scan-shelf-links.test.mjs — a scan shown off the shelf links to the tile that holds it.
 *
 * Pages around the site show folio and prime scans, and a scan's caption title
 * links to the scan's place on the shelf (/design/folios/…#folio-1018-00). The
 * shelf's ids are positional, so an intake that renumbers a shelf can leave such
 * a link pointing at a tile that now holds a different scan. audit:route-links
 * sees only that the id exists; this checks that the tile holds the same scan.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const SHELF_LINK = /href="(\/design\/(?:folios|experiments\/folios)\/[^"#]*)#([^"]+)"/g;
const SCAN = /\/public\/images\/assets\/(?:folios|primes)\/([a-z0-9-]+?)-(?:thumb|display|hero|full)\.(?:webp|avif)/;

const pageOf = (route) => `${route.replace(/^\//, '')}index.html`;

/** The block an id opens on a shelf page, as far as its closing tag. */
function blockOf(html, id) {
  const open = new RegExp(`<(li|figure|article|section|div)\\b[^>]*\\sid="${id}"[^>]*>`).exec(html);
  if (!open) return null;
  const tag = open[1];
  let depth = 0;
  const re = new RegExp(`<${tag}\\b|</${tag}>`, 'g');
  re.lastIndex = open.index;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    depth += m[0].startsWith('</') ? -1 : 1;
    if (depth === 0) return html.slice(open.index, m.index);
  }
  return null;
}

test('a scan figure that links to the shelf lands on the tile holding that scan', () => {
  const files = execSync("git ls-files '*.html'", { encoding: 'utf8' }).trim().split('\n')
    .filter((f) => !f.startsWith('workers/') && !f.startsWith('_partials/'));
  const shelves = new Map();
  const wrong = [];
  let checked = 0;
  for (const file of files) {
    const html = readFileSync(file, 'utf8');
    for (const [figure] of html.matchAll(/<figure\b[\s\S]*?<\/figure>/g)) {
      const slug = (figure.match(SCAN) || [])[1];
      if (!slug) continue;
      for (const [, route, id] of figure.matchAll(SHELF_LINK)) {
        if (!shelves.has(route)) shelves.set(route, readFileSync(pageOf(route), 'utf8'));
        const block = blockOf(shelves.get(route), id);
        checked++;
        if (!block) wrong.push(`${file}: ${slug} links to ${route}#${id}, which is not on that page`);
        else if (!block.includes(`/${slug}-`)) wrong.push(`${file}: ${slug} links to ${route}#${id}, which holds a different scan`);
      }
    }
  }
  assert.ok(checked >= 40, `expected the scan figures' shelf links to be found (found ${checked})`);
  assert.deepEqual(wrong, [], `shelf links that miss their scan:\n${wrong.join('\n')}`);
});
