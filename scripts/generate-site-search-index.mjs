/**
 * Build a public, client-loadable route search index from the live route
 * runtime contract (same census as npm run manifest).
 *
 * Output: public/data/site-search-index.json
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { buildRouteRuntimeManifest } from './typed/site-contracts/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'public/data/site-search-index.json');

function asList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value.split(/[\s|,]+/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function buildSearchEntry(routeRecord) {
  const route = String(routeRecord.route || '').trim();
  if (!route) return null;

  const title = String(routeRecord.title || route).trim();
  const surface = String(routeRecord.surface || '').trim();
  const context = String(routeRecord.context || '').trim();
  const wonder = String(routeRecord.wonder || '').trim();
  const pageFamily = String(routeRecord.pageFamily || '').trim();
  const pageRole = String(routeRecord.pageRole || '').trim();
  const routeFamily = String(routeRecord.routeFamily || '').trim();
  const features = asList(routeRecord.features);
  const relatedRoutes = asList(routeRecord.relatedRoutes);
  const layout = String(routeRecord.layout || '').trim();

  const haystack = [
    title,
    route,
    surface,
    context,
    wonder,
    pageFamily,
    pageRole,
    routeFamily,
    layout,
    features.join(' '),
    relatedRoutes.join(' '),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return {
    route,
    title,
    surface: surface || null,
    context: context || null,
    wonder: wonder || null,
    pageFamily: pageFamily || null,
    pageRole: pageRole || null,
    routeFamily: routeFamily || null,
    layout: layout || null,
    features,
    relatedRoutes,
    haystack,
  };
}

export async function generateSiteSearchIndex() {
  const manifest = await buildRouteRuntimeManifest();
  const routes = (manifest.routes || [])
    .map(buildSearchEntry)
    .filter(Boolean)
    .sort((a, b) => a.route.localeCompare(b.route));

  const payload = {
    generatedAt: new Date().toISOString(),
    version: 1,
    routeCount: routes.length,
    routes,
  };

  await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
  // Compact JSON keeps the browser payload small; regenerate with pretty
  // print only when debugging the index by hand.
  await fs.writeFile(OUTPUT, `${JSON.stringify(payload)}\n`, 'utf8');
  return payload;
}

export async function main() {
  const payload = await generateSiteSearchIndex();
  console.log(`[search-index] wrote ${path.relative(ROOT, OUTPUT)}`);
  console.log(`[search-index] routes=${payload.routeCount}`);
}

const isMain = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
