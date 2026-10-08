#!/usr/bin/env node
/**
 * audit-route-links.mjs — does every internal link still land?
 *
 * Old copy keeps pointing where a page used to be. This walks every route,
 * reads each internal href, and reports the ones whose route no longer exists
 * or whose anchor no longer appears on the page it names. Partials pulled in
 * with <spw-include src="…"> count toward a page's anchors, and commented-out
 * examples are not links. Anchors a runtime module creates on mount cannot be
 * seen here; name them in RUNTIME_ANCHORS (lib/page-anchors.mjs) with the
 * module that makes them.
 *
 * Reports only; it does not gate check:local. Record: .spw/audits/route-link-integrity-2026-09.spw
 *
 * Usage: npm run audit:route-links [-- --json]
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { anchorsOfPage, stripComments } from './lib/page-anchors.mjs';

const ROOT = process.cwd();
const SKIP = new Set(['node_modules', 'dist', 'dist-vite', '.git', '.references', 'captures', '.claude', '.spw', '.agents', 'public', 'scripts', 'workers', '_partials', 'types', 'coverage', 'tmp', '.tmp']);

function routes(dir = ROOT, out = new Map()) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || SKIP.has(entry.name) || (dir === ROOT && entry.name.startsWith('.'))) continue;
    routes(path.join(dir, entry.name), out);
  }
  const file = path.join(dir, 'index.html');
  if (existsSync(file)) {
    const rel = path.relative(ROOT, dir).split(path.sep).join('/');
    out.set(rel ? `/${rel}/` : '/', readFileSync(file, 'utf8'));
  }
  return out;
}

export function auditRouteLinks() {
  const pages = routes();
  const anchors = new Map();
  for (const [route, html] of pages) anchors.set(route, anchorsOfPage(html, route, ROOT));
  const missingRoutes = new Map();
  const missingAnchors = new Map();
  for (const [from, html] of pages) {
    for (const m of stripComments(html).matchAll(/href="(\/[^"#?]*)(?:\?[^"#]*)?(#[^"]*)?"/g)) {
      const [, href, hash = ''] = m;
      if (href.startsWith('/public/') || /\.[a-z0-9]{2,5}$/i.test(href)) continue;
      const route = href.endsWith('/') ? href : `${href}/`;
      const add = (map, key) => map.set(key, [...(map.get(key) || []), from]);
      if (!pages.has(route)) { add(missingRoutes, route); continue; }
      const anchor = hash.slice(1);
      if (anchor && !anchors.get(route).has(anchor)) add(missingAnchors, `${route}#${anchor}`);
    }
  }
  return { routes: pages.size, missingRoutes, missingAnchors };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { routes: count, missingRoutes, missingAnchors } = auditRouteLinks();
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ routes: count, missingRoutes: Object.fromEntries(missingRoutes), missingAnchors: Object.fromEntries(missingAnchors) }, null, 2));
  } else {
    console.log(`[route-links] ${count} routes; ${missingRoutes.size} missing routes, ${missingAnchors.size} missing anchors`);
    for (const [target, from] of missingRoutes) console.log(`  route  ${target} ← ${[...new Set(from)].join(', ')}`);
    for (const [target, from] of missingAnchors) console.log(`  anchor ${target} ← ${[...new Set(from)].join(', ')}`);
  }
}
