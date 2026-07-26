#!/usr/bin/env node
/**
 * Migrate authored route index.html files to the spw-page + spw-site-head pattern.
 *
 * Keeps body chrome (spw-site-header/footer, main content) and body data-spw-*.
 * Replaces manual <head> meta/og/json-ld blocks with <spw-site-head>.
 *
 * Usage:
 *   node scripts/migrate-route-to-template.mjs about/index.html contact/index.html
 *   node scripts/migrate-route-to-template.mjs --hubs
 *   node scripts/migrate-route-to-template.mjs --hubs --dry-run
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Primary public hubs (top-level category registers). */
const HUB_ROUTES = Object.freeze([
  'index.html',
  'about/index.html',
  'contact/index.html',
  'topics/index.html',
  'tools/index.html',
  'play/index.html',
  'services/index.html',
  'care/index.html',
  'curriculum/index.html',
  'blog/index.html',
  'research/index.html',
  'now/index.html',
  'membership/index.html',
  'cards/index.html',
  'recipes/index.html',
  'offline/index.html',
  'town/index.html',
  'coordination/index.html',
  'newyear/index.html',
  'rpg/index.html',
  'design/index.html',
  'settings/index.html',
  'privacy/index.html',
]);

/**
 * High-traffic category leaves — migrate after hubs for family voice + dry heads.
 * Keep surgical: not every topic/design experiment leaf.
 */
const TIER1_ROUTES = Object.freeze([
  ...HUB_ROUTES,
  'topics/software/index.html',
  'topics/math/index.html',
  'topics/craft/index.html',
  'topics/search/index.html',
  'topics/architecture/index.html',
  'topics/pedagogy/index.html',
  'about/website/index.html',
  'about/plans/index.html',
  'design/components/index.html',
  'design/materials/index.html',
  'design/palettes/index.html',
  'design/affordance/index.html',
  'design/density/index.html',
  'design/slots/index.html',
  'tools/spw-parser/index.html',
  'tools/profile/index.html',
  'tools/character-sheet/index.html',
  'tools/budgeting/index.html',
  'tools/midjourney/index.html',
  'services/systems/index.html',
  'services/care/index.html',
  'services/creator/index.html',
  'play/rpg-wednesday/index.html',
  'recipes/fermentation/index.html',
  'recipes/reduction/index.html',
  'recipes/mise-en-place/index.html',
]);

/** Path prefix → page-family when body omits data-spw-page-family. */
const PATH_FAMILY_HINTS = Object.freeze([
  [/^topics\/software\//, 'operator-atlas'],
  [/^topics\//, 'topic'],
  [/^design\/experiments\//, 'experiment-lab'],
  [/^design\//, 'design'],
  [/^tools\//, 'toolbench'],
  [/^services\/care/, 'care-interface'],
  [/^services\//, 'switchboard'],
  [/^play\//, 'playfield'],
  [/^recipes\//, 'recipe-book'],
  [/^about\/website/, 'field-guide'],
  [/^about\/plans/, 'register'],
  [/^about\/domains\//, 'constellation'],
  [/^about\//, 'kernel-portrait'],
  [/^curriculum\//, 'curriculum'],
  [/^blog\//, 'laboratory'],
  [/^research\//, 'research'],
  [/^care\//, 'care-interface'],
  [/^coordination\//, 'coordination'],
  [/^membership\//, 'membership'],
  [/^cards\//, 'proof-cards'],
  [/^settings\//, 'runtime-observatory'],
  [/^privacy\//, 'policy'],
  [/^offline\//, 'fallback'],
  [/^newyear\//, 'seasonal'],
  [/^rpg\//, 'campaign'],
  [/^town\//, 'constellation'],
  [/^$/, 'kernel-atlas'], // site root
]);

function decodeHtmlEntities(value = '') {
  const decodeOnce = (input) => input.replace(
    /&(?:amp|lt|gt|quot|#39|#x27|#(\d+)|#x([0-9a-f]+));/gi,
    (entity, decimal, hex) => {
      if (decimal) return String.fromCodePoint(Number(decimal));
      if (hex) return String.fromCodePoint(Number.parseInt(hex, 16));
      const named = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&#x27;': "'",
      };
      return named[entity.toLowerCase()] ?? entity;
    },
  );
  let decoded = String(value);
  for (let depth = 0; depth < 4; depth += 1) {
    const next = decodeOnce(decoded);
    if (next === decoded) break;
    decoded = next;
  }
  return decoded;
}

/**
 * Read a meta content value by name/property.
 * Prefer double-quoted content so apostrophes in copy (I'm, don't) survive;
 * fall back to single-quoted content that cannot contain `'`.
 */
function attr(html, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    // name/property first, double-quoted content
    new RegExp(
      `<meta\\b[^>]*\\b(?:name|property)=["']${escaped}["'][^>]*\\bcontent="([^"]*)"`,
      'i',
    ),
    // content first (double-quoted), then name/property
    new RegExp(
      `<meta\\b[^>]*\\bcontent="([^"]*)"[^>]*\\b(?:name|property)=["']${escaped}["']`,
      'i',
    ),
    // single-quoted content fallbacks
    new RegExp(
      `<meta\\b[^>]*\\b(?:name|property)=["']${escaped}["'][^>]*\\bcontent='([^']*)'`,
      'i',
    ),
    new RegExp(
      `<meta\\b[^>]*\\bcontent='([^']*)'[^>]*\\b(?:name|property)=["']${escaped}["']`,
      'i',
    ),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decodeHtmlEntities(m[1].trim());
  }
  return '';
}

function linkHref(html, rel) {
  const re = new RegExp(
    `<link\\b[^>]*\\brel=["']${rel}["'][^>]*\\bhref=["']([^"']+)["']`
    + `|<link\\b[^>]*\\bhref=["']([^"']+)["'][^>]*\\brel=["']${rel}["']`,
    'i',
  );
  const m = html.match(re);
  return (m?.[1] || m?.[2] || '').trim();
}

function extraScriptSrcs(html) {
  return [...html.matchAll(/<script\b([^>]*)\bsrc=["']([^"']+)["'][^>]*>\s*<\/script>/gi)]
    .filter((match) => !/\btype=["']application\/ld\+json["']/i.test(match[1]))
    .map((match) => match[2].trim())
    .filter((src) => src && !/^\/public\/js\/site\.js(?:[?#].*)?$/i.test(src));
}

function extraStylesheetHrefs(html) {
  return [...html.matchAll(/<link\b([^>]*)>/gi)]
    .filter((match) => /\brel=["']stylesheet["']/i.test(match[1]))
    .map((match) => match[1].match(/\bhref=["']([^"']+)["']/i)?.[1]?.trim())
    .filter((href) => href && !/^\/public\/css\/style\.css(?:[?#].*)?$/i.test(href));
}

function titleText(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeHtmlEntities(m[1].replace(/\s+/g, ' ').trim()) : '';
}

function escapeAttr(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function bodyAttrs(html) {
  const m = html.match(/<body\b([^>]*)>/i);
  return m?.[1] || '';
}

function pickBodyAttr(bodyAttrString, name) {
  const re = new RegExp(`${name}=["']([^"']*)["']`, 'i');
  const m = bodyAttrString.match(re);
  return m?.[1]?.trim() || '';
}

function inferBreadcrumbLabel(title, pathname) {
  if (title) {
    return title.replace(/^Spwashi\s*[•\-–—]\s*/i, '').trim() || title;
  }
  const seg = pathname.replace(/\/+$/, '').split('/').filter(Boolean).pop() || 'Home';
  return seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function inferPageFamilyFromPath(relPath) {
  const normalized = String(relPath || '')
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/\/index\.html$/i, '/')
    .replace(/^index\.html$/i, '');
  for (const [pattern, family] of PATH_FAMILY_HINTS) {
    if (pattern.test(normalized)) return family;
  }
  return '';
}

function buildSpwPage(meta) {
  const lines = ['<spw-page'];
  const pairs = [
    ['title', meta.title],
    ['description', meta.description],
    ['canonical', meta.canonical],
    ['og_title', meta.ogTitle],
    ['og_description', meta.ogDescription],
    ['og_image', meta.ogImage],
    ['og_image_alt', meta.ogImageAlt],
    ['keywords', meta.keywords],
    ['robots', meta.robots],
    ['breadcrumb_label', meta.breadcrumbLabel],
    ['header_current', meta.headerCurrent],
    ['header_current_href', meta.headerCurrentHref],
    ['header_indicator', meta.headerIndicator],
    ['surface', meta.surface],
    ['page_family', meta.pageFamily],
    ['page_role', meta.pageRole],
    ['page_modes', meta.pageModes],
    ['wonder', meta.wonder],
    ['route_family', meta.routeFamily],
    ['layout', meta.layout],
    ['features', meta.features],
    ['related_routes', meta.relatedRoutes],
    ['stylesheet_mode', meta.stylesheetMode || 'scoped'],
    ['extra_styles', meta.extraStyles],
    ['extra_scripts', meta.extraScripts],
  ];
  for (const [key, value] of pairs) {
    if (!value) continue;
    lines.push(`    ${key}="${escapeAttr(value)}"`);
  }
  lines.push('></spw-page>');
  return lines.join('\n');
}

function migrateSource(html, filePath) {
  if (/<spw-page\b/i.test(html) && /<spw-site-head\b/i.test(html)) {
    return { skipped: true, reason: 'already templated' };
  }

  const bodyAttrString = bodyAttrs(html);
  const title = titleText(html);
  const description = attr(html, 'description');
  const canonical = linkHref(html, 'canonical')
    || `https://spwashi.com/${path.dirname(filePath).replace(/\\/g, '/').replace(/^\.$/, '')}/`
      .replace(/\/\/+/g, '/')
      .replace('https:/', 'https://');
  const ogTitle = attr(html, 'og:title') || title;
  const ogDescription = attr(html, 'og:description') || description;
  const ogImage = attr(html, 'og:image');
  const ogImageAlt = attr(html, 'og:image:alt');
  const keywords = attr(html, 'keywords');
  const robots = attr(html, 'robots');

  let pathname = '/';
  try {
    pathname = new URL(canonical).pathname;
  } catch {
    pathname = `/${path.dirname(filePath).replace(/\\/g, '/')}/`.replace(/\/+/g, '/');
  }

  const surface = pickBodyAttr(bodyAttrString, 'data-spw-surface');
  const pageFamily = pickBodyAttr(bodyAttrString, 'data-spw-page-family')
    || inferPageFamilyFromPath(filePath);
  const pageRole = pickBodyAttr(bodyAttrString, 'data-spw-page-role');
  const pageModes = pickBodyAttr(bodyAttrString, 'data-spw-page-modes');
  const wonder = pickBodyAttr(bodyAttrString, 'data-spw-wonder');
  const routeFamily = pickBodyAttr(bodyAttrString, 'data-spw-route-family');
  const layout = pickBodyAttr(bodyAttrString, 'data-spw-layout');
  const features = pickBodyAttr(bodyAttrString, 'data-spw-features');
  const relatedRoutes = pickBodyAttr(bodyAttrString, 'data-spw-related-routes');
  const stylesheetMode = pickBodyAttr(bodyAttrString, 'data-spw-stylesheet-mode') || 'scoped';
  const extraStyles = extraStylesheetHrefs(html).join('|');
  const extraScripts = extraScriptSrcs(html).join('|');

  // When family is inferred (not on body), stamp it onto body so render + CSS see category voice.
  let htmlForBody = html;
  if (pageFamily && !pickBodyAttr(bodyAttrString, 'data-spw-page-family')) {
    htmlForBody = htmlForBody.replace(
      /<body\b([^>]*)>/i,
      (_m, attrs) => `<body${attrs} data-spw-page-family="${escapeAttr(pageFamily)}">`,
    );
  }

  const breadcrumbLabel = inferBreadcrumbLabel(title, pathname);
  const headerCurrent = breadcrumbLabel;
  const headerCurrentHref = pathname.endsWith('/') ? pathname : `${pathname}/`;
  const headerIndicator = surface || breadcrumbLabel.toLowerCase().replace(/\s+/g, '-');

  const spwPage = buildSpwPage({
    title,
    description,
    canonical,
    ogTitle,
    ogDescription,
    ogImage,
    ogImageAlt,
    keywords,
    robots,
    breadcrumbLabel,
    headerCurrent,
    headerCurrentHref,
    headerIndicator,
    surface,
    pageFamily,
    pageRole,
    pageModes,
    wonder,
    routeFamily,
    layout,
    features,
    relatedRoutes,
    stylesheetMode,
    extraStyles,
    extraScripts,
  });

  // Strip manual head content → single spw-site-head
  let body = htmlForBody;
  const headMatch = body.match(/<head\b[^>]*>[\s\S]*?<\/head>/i);
  if (!headMatch) {
    return { skipped: true, reason: 'no <head>' };
  }

  const newHead = '<head>\n    <spw-site-head></spw-site-head>\n</head>';
  body = body.replace(headMatch[0], newHead);

  // Remove any pre-existing spw-page to avoid duplicates when re-running
  body = body.replace(/<spw-page\b[\s\S]*?<\/spw-page>\s*/i, '');
  body = body.replace(/<spw-page\b[^>]*\/>\s*/i, '');

  // Prefer settings shape: spw-page, then doctype + html
  body = body.replace(/^\uFEFF?\s*<!DOCTYPE html>\s*/i, '');
  body = body.replace(/^\s*<html\b/i, '<!DOCTYPE html>\n<html');

  const output = `${spwPage}\n${body.replace(/^\s+/, '')}`;
  return { skipped: false, output, meta: { title, canonical, surface, pageFamily } };
}

function parseArgs(argv) {
  const options = { dryRun: false, hubs: false, tier1: false, paths: [] };
  for (const arg of argv) {
    if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--hubs') options.hubs = true;
    else if (arg === '--tier1') options.tier1 = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (!arg.startsWith('-')) options.paths.push(arg);
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(`migrate-route-to-template — convert manual <head> routes to spw-page + spw-site-head

Usage:
  node scripts/migrate-route-to-template.mjs about/index.html contact/index.html
  node scripts/migrate-route-to-template.mjs --hubs
  node scripts/migrate-route-to-template.mjs --tier1
  node scripts/migrate-route-to-template.mjs --hubs --dry-run

Notes:
  Body data-spw-* is preserved. Missing page-family is inferred from path
  (see PATH_FAMILY_HINTS) and stamped on body + spw-page.
  Template render fills layout/wonder/modes from PAGE_FAMILY_PERSONALITY only when missing.
`);
    process.exit(0);
  }

  const targets = options.tier1
    ? [...TIER1_ROUTES]
    : options.hubs
      ? [...HUB_ROUTES]
      : options.paths;
  if (!targets.length) {
    console.error('[migrate] no paths; pass files, --hubs, or --tier1');
    process.exit(2);
  }

  let migrated = 0;
  let skipped = 0;
  for (const rel of targets) {
    const abs = path.resolve(ROOT, rel);
    let source;
    try {
      source = await readFile(abs, 'utf8');
    } catch (error) {
      console.error(`[migrate] skip missing ${rel}: ${error.message}`);
      skipped += 1;
      continue;
    }
    const result = migrateSource(source, rel);
    if (result.skipped) {
      process.stderr.write(`[migrate] skip ${rel} (${result.reason})\n`);
      skipped += 1;
      continue;
    }
    if (options.dryRun) {
      process.stderr.write(`[migrate] would write ${rel} — ${result.meta.title}\n`);
      migrated += 1;
      continue;
    }
    await writeFile(abs, result.output.endsWith('\n') ? result.output : `${result.output}\n`, 'utf8');
    process.stderr.write(`[migrate] wrote ${rel} — ${result.meta.title} (${result.meta.pageFamily || result.meta.surface || '?'})\n`);
    migrated += 1;
  }

  process.stderr.write(`[migrate] done migrated=${migrated} skipped=${skipped}\n`);
  process.exit(0);
}

main().catch((error) => {
  console.error('[migrate] fatal', error);
  process.exit(1);
});
