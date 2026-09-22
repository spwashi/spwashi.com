/**
 * Topic wiring: a leaf under /topics/ teaches only if a reader can reach it and
 * leave it somewhere useful. Two rules, over source HTML:
 *
 *   listed    — the nearest ancestor route with a page links to the leaf, so the
 *               hub a reader arrives from shows it (the header partial's
 *               nav_items do not count; they point up, not down).
 *   neighbors — the leaf links at least one other topic that is not itself, an
 *               ancestor, or /topics/, so reading does not dead-end at the hub.
 */
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

async function topicPages() {
  const entries = await readdir(path.join(ROOT, 'topics'), { recursive: true, withFileTypes: true });
  const pages = new Map();
  for (const entry of entries) {
    if (!entry.isFile() || entry.name !== 'index.html') continue;
    const dir = path.relative(ROOT, entry.parentPath);
    const route = `/${dir.split(path.sep).join('/')}/`;
    pages.set(route, await readFile(path.join(entry.parentPath, entry.name), 'utf8'));
  }
  return pages;
}

function hrefs(html) {
  return new Set([...html.matchAll(/href="(\/[^"#?]*)/g)].map((match) => match[1]));
}

function ancestors(route) {
  const parts = route.split('/').filter(Boolean);
  return parts.slice(0, -1).map((_, index) => `/${parts.slice(0, index + 1).join('/')}/`).reverse();
}

describe('topic wiring', () => {
  it('lists every leaf on its nearest hub and gives it a neighbor', async () => {
    const pages = await topicPages();
    const unlisted = [];
    const deadEnds = [];

    for (const [route, html] of pages) {
      const up = ancestors(route);
      if (up.length < 2) continue; // /topics/<area>/ hubs are the index's job
      const hub = up.find((candidate) => pages.has(candidate));
      if (hub && !hrefs(pages.get(hub)).has(route)) unlisted.push(`${route} (hub ${hub})`);

      const neighbors = [...hrefs(html)].filter((href) => href.startsWith('/topics/')
        && href !== route && href !== '/topics/' && !up.includes(href));
      if (!neighbors.length) deadEnds.push(route);
    }

    assert.deepEqual(unlisted, [], 'link each leaf from the hub a reader reaches it through');
    assert.deepEqual(deadEnds, [], 'give each leaf at least one neighboring topic to read next');
  });
});
