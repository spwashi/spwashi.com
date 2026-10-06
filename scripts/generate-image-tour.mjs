#!/usr/bin/env node
/**
 * generate-image-tour.mjs — every picture the public pages show, with where it lives.
 *
 * Reads the img elements on tracked route pages and records, for each image,
 * the page (and section) where it lives, a label, its kind, and the date git
 * first saw the file. modules/design/image-tour.js reads the result: the
 * newest pieces lead the tour while they are recent, and older ones rotate by
 * day after that.
 *
 *   npm run image:tour            write public/data/image-tour.json
 *   npm run image:tour -- --check fail if the file is stale; write nothing
 *
 * A picture that appears on several pages links to the page that keeps it,
 * not to home or now, which only show the tour; a picture only they show is
 * left out, since the tour would link back to itself.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = 'public/data/image-tour.json';
const RECENT_DAYS = 21;
const SKIP_ROUTES = [/^design\/catalog\//, /^design\/experiments\//, /^_partials\//, /^dist/, /^node_modules\//, /^offline\//];
const SKIP_IMAGES = [/\/logo\//, /\/icon/, /favicon/, /app-icon/, /\.svg$/i];
const SHOWCASE_ROUTES = new Set(['/', '/now/']);

const git = (args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

function routeFor(file) {
  const dir = path.posix.dirname(file);
  return dir === '.' ? '/' : `/${dir}/`;
}

function attr(tag, name) {
  return new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1] ?? '';
}

function kindFor(src) {
  if (/\/assets\/(folios|panels)\//.test(src)) return 'scan';
  if (/\/assets\/rpg-wednesday\/|\/ink-\d{4}-\d{2}-\d{2}/.test(src)) return 'drawing';
  if (/\/(renders|illustrations|routes|home)\//.test(src)) return 'render';
  return 'image';
}

const baseOf = (src) => src.replace(/-(thumb|display|hero|full)(?=\.)/, '').replace(/\.(webp|avif|png|jpe?g)$/i, '');

function thumbFor(src) {
  const candidate = src.replace(/-(display|hero|full)(?=\.)/, '-thumb').replace(/\.(avif|png|jpe?g)$/i, '.webp');
  return candidate !== src && existsSync(path.join(ROOT, candidate)) ? candidate : src;
}

function labelFor(src, alt) {
  const text = alt.replace(/\s+/g, ' ').trim();
  if (text) return text.length > 72 ? `${text.slice(0, 71).trimEnd()}…` : text;
  const stem = path.posix.basename(baseOf(src)).replace(/^(folio|panel)-/, '');
  return stem.replace(/[-_]+/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

/** id of the nearest element before `at` that names one, so a link lands on the section. */
function sectionBefore(html, at) {
  const ids = [...html.slice(0, at).matchAll(/\bid="([A-Za-z][\w-]*)"/g)];
  return ids.at(-1)?.[1] ?? '';
}

/** href of an internal link that wraps the image, if one is still open at `at`. */
function wrappingHref(html, at) {
  const before = html.slice(0, at);
  const open = before.lastIndexOf('<a ');
  if (open < 0 || before.lastIndexOf('</a>') > open) return '';
  const href = attr(before.slice(open, before.indexOf('>', open) + 1), 'href');
  // A link to the image file is a lightbox, not the page that keeps the picture.
  return href.startsWith('/') && !href.startsWith('/public/') ? href : '';
}

function addedDates() {
  const dates = new Map();
  const log = git(['log', '--diff-filter=A', '--format=%x00%as', '--name-only', '--', 'public/images']);
  for (const block of log.split('\0').filter(Boolean)) {
    const [date, ...files] = block.split('\n').map((line) => line.trim()).filter(Boolean);
    for (const file of files) dates.set(`/${file}`, date); // log runs newest first; the last write is the first add
  }
  return dates;
}

export function buildTour() {
  const dates = addedDates();
  const routes = git(['ls-files', '*index.html']).split('\n').filter((file) => file && !SKIP_ROUTES.some((re) => re.test(file)));
  const byBase = new Map();
  for (const file of routes.sort()) {
    const html = readFileSync(path.join(ROOT, file), 'utf8');
    const route = routeFor(file);
    for (const match of html.matchAll(/<img\b[^>]*>/g)) {
      const tag = match[0];
      const src = attr(tag, 'src');
      if (!src.startsWith('/public/images/') || SKIP_IMAGES.some((re) => re.test(src))) continue;
      const width = Number(attr(tag, 'width'));
      const height = Number(attr(tag, 'height'));
      if (!width || !height || Math.max(width, height) < 96) continue;
      const base = baseOf(src);
      const known = byBase.get(base);
      if (known && !SHOWCASE_ROUTES.has(known.route)) continue;
      if (known && SHOWCASE_ROUTES.has(route)) continue;
      const section = sectionBefore(html, match.index);
      const href = wrappingHref(html, match.index) || `${route}${section ? `#${section}` : ''}`;
      byBase.set(base, {
        route,
        src: thumbFor(src),
        width,
        height,
        label: labelFor(src, attr(tag, 'alt')),
        kind: kindFor(src),
        href,
        added: dates.get(src) || dates.get(thumbFor(src)) || '',
      });
    }
  }
  // A picture only home or now shows has no page that keeps it; the tour would link back to itself.
  const pieces = [...byBase.values()]
    .filter((piece) => piece.added && !SHOWCASE_ROUTES.has(piece.route))
    .sort((a, b) => b.added.localeCompare(a.added) || a.src.localeCompare(b.src))
    .map(({ route, ...piece }) => piece);
  return {
    about: 'Pictures the public pages show, newest first, each with the page that keeps it. Written by scripts/generate-image-tour.mjs.',
    recentDays: RECENT_DAYS,
    count: pieces.length,
    pieces,
  };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const next = `${JSON.stringify(buildTour(), null, 1)}\n`;
  const target = path.join(ROOT, OUT);
  const current = existsSync(target) ? readFileSync(target, 'utf8') : '';
  if (process.argv.includes('--check')) {
    if (current !== next) {
      console.error(`[image-tour] ${OUT} is stale; run npm run image:tour`);
      process.exit(1);
    }
    console.log(`[image-tour] ${OUT} is current`);
  } else {
    writeFileSync(target, next);
    const tour = JSON.parse(next);
    console.log(`[image-tour] ${tour.count} pictures; newest ${tour.pieces[0]?.added ?? 'none'}`);
  }
}
