/**
 * Page reasons — what does this page hold that no other page holds?
 *
 * A route's reason to exist is not its copy and not its declared feature list.
 * It is the anatomy it hosts that is rare sitewide: the shells a reader can
 * only fill here. This script measures that, because
 * .spw/caches/arrival-perceptibility-2026-08.spw#debut_placement asked for it
 * ("compare data-spw-features per route against the anatomy each feature's
 * modules actually select for") and because a claim about why a page exists
 * should be falsifiable before it is written into a convention.
 *
 * Four measurements per route, one per term in the electrostatic model:
 *
 *   charge      declared data-spw-features, and whether the page actually hosts
 *               anatomy the catalog modules behind each feature select for.
 *               A feature declared without anatomy is a phantom claim - it
 *               costs a bundle and lands on nothing.
 *   shells      distinct data-spw-liminality bands (entry/threshold/deep/
 *               projected/settled). A page with one band has no interior; a
 *               reader crosses nothing by reading it.
 *   walls       brace forms and region seats - the boundaries between fields.
 *               Potential can only exist across a wall.
 *   dielectric  image-bearing anatomy. Images hold attention without spending
 *               it, which is what raises a page's capacity to mean something.
 *
 * Selector matching is deliberately approximate and says so: it tests the
 * rightmost compound of each selector against the page's static HTML tags.
 * That over-reports rather than under-reports, which is the safe direction -
 * the cache records a false negative on exactly this kind of check ("First grep
 * for this returned a false negative on the promo element"), so this errs
 * toward calling a feature hosted and leaving the human to disagree.
 *
 * Usage:
 *   node scripts/page-reasons.mjs            # ranked report
 *   node scripts/page-reasons.mjs --json     # machine-readable
 *   node scripts/page-reasons.mjs --route home
 */

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Directories that are not this site's published routes. */
const SKIP_DIRS = new Set([
  'node_modules', 'dist', 'dist-vite', '.git', '.spw', '.agents', '_workbench',
  'coverage', 'tmp', 'scripts', 'src',
]);

const LIMINALITY_BANDS = ['entry', 'threshold', 'deep', 'projected', 'settled'];

async function collectRoutes(dir = ROOT, out = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      await collectRoutes(full, out);
    } else if (entry.name === 'index.html') {
      out.push(full);
    }
  }
  return out;
}

function attr(html, name) {
  const match = html.match(new RegExp(`${name}="([^"]*)"`));
  return match ? match[1] : '';
}

function tokens(value) {
  return String(value || '').split(/\s+/).filter(Boolean);
}

/** Body tag only — page-level declarations live there, not on arbitrary nodes. */
function readBodyAttrs(html) {
  const body = html.match(/<body[^>]*>/i)?.[0] || '';
  return {
    surface: attr(body, 'data-spw-surface'),
    features: tokens(attr(body, 'data-spw-features')),
    role: attr(body, 'data-spw-page-role'),
    family: attr(body, 'data-spw-page-family'),
    modes: tokens(attr(body, 'data-spw-page-modes')),
    layout: attr(body, 'data-spw-layout'),
  };
}

/** Every open tag as a raw string; the unit a compound selector is tested against. */
function readTags(html) {
  return html.match(/<[a-zA-Z][^>]*>/g) || [];
}

/**
 * Test one compound selector (no combinators) against a raw tag string.
 * Supports tag, .class, #id, [attr], [attr="v"], [attr*="v"], [attr~="v"].
 */
function compoundMatchesTag(compound, tag) {
  const parts = compound.match(/^[a-zA-Z][\w-]*|\.[\w-]+|#[\w-]+|\[[^\]]+\]|:[\w-]+(\([^)]*\))?/g);
  if (!parts) return false;

  for (const part of parts) {
    if (part.startsWith(':')) continue; // pseudo-classes are not statically decidable
    if (part.startsWith('.')) {
      const cls = part.slice(1);
      const classAttr = tag.match(/class="([^"]*)"/)?.[1] || '';
      if (!tokens(classAttr).includes(cls)) return false;
    } else if (part.startsWith('#')) {
      if (tag.match(/id="([^"]*)"/)?.[1] !== part.slice(1)) return false;
    } else if (part.startsWith('[')) {
      const inner = part.slice(1, -1);
      const [, name, op, value] = inner.match(/^([\w-]+)(?:([~^$*|]?=)"?([^"\]]*)"?)?$/) || [];
      if (!name) return false;
      const found = tag.match(new RegExp(`\\b${name}="([^"]*)"`));
      const bare = new RegExp(`\\b${name}(?=[\\s=>/])`).test(tag);
      if (!found && !bare) return false;
      if (op) {
        const actual = found?.[1] ?? '';
        if (op === '=' && actual !== value) return false;
        if (op === '*=' && !actual.includes(value)) return false;
        if (op === '~=' && !tokens(actual).includes(value)) return false;
        if (op === '^=' && !actual.startsWith(value)) return false;
      }
    } else {
      // Bare tag name, always the leading part of a compound.
      if (!new RegExp(`^<${part}(?=[\\s>/])`, 'i').test(tag)) return false;
    }
  }
  return true;
}

/**
 * Does the page host anatomy this selector would find? Combinators are reduced
 * to their rightmost compound: a descendant selector that matches the right
 * side but not the ancestor is reported as hosted. Over-reporting is the safe
 * direction here — see the header note on the recorded false negative.
 */
function selectorHosted(selector, tags) {
  if (!selector) return true; // body-rooted module: always has a root
  for (const branch of String(selector).split(',')) {
    const trimmed = branch.trim();
    if (!trimmed) continue;
    const rightmost = trimmed.split(/[\s>+~]+/).filter(Boolean).pop();
    if (!rightmost) continue;
    if (tags.some((tag) => compoundMatchesTag(rightmost, tag))) return true;
  }
  return false;
}

async function loadCatalog() {
  const catalog = await import('../public/js/runtime/module-catalog.js');
  return [
    ...(catalog.CORE_DEFS || []),
    ...(catalog.FEATURE_DEFS || []),
    ...(catalog.REGION_DEFS || []),
    ...(catalog.ENHANCEMENT_DEFS || []),
  ];
}

function modulesForFeature(defs, feature) {
  return defs.filter((def) => {
    const required = def.features;
    if (!required) return false;
    const list = Array.isArray(required) ? required : (required.all || required.any || []);
    return list.includes(feature);
  });
}

function moduleRunsOnSurface(def, surface) {
  if (!def.route) return true;
  return Array.isArray(def.route) ? def.route.includes(surface) : def.route === surface;
}

function measureRoute(file, html, defs) {
  const rel = path.relative(ROOT, file);
  const route = `/${rel.replace(/index\.html$/, '')}`;
  const body = readBodyAttrs(html);
  const tags = readTags(html);

  // charge — declared features against hosted anatomy.
  const charge = body.features.map((feature) => {
    const mods = modulesForFeature(defs, feature);
    const reachable = mods.filter((def) => moduleRunsOnSurface(def, body.surface));
    const hosted = reachable.filter((def) => selectorHosted(def.selector, tags));
    // Two failures wear the same face and must not be conflated:
    //   unbacked — no catalog module anywhere names this feature. The token is
    //              pure vocabulary; declaring it schedules nothing, so it is
    //              free but also means nothing.
    //   unhosted — modules exist and would run on this surface, but nothing
    //              here matches their selectors. That claim costs a gate
    //              evaluation and lands on nothing.
    const unbacked = mods.length === 0;
    const unhosted = !unbacked && hosted.length === 0;
    return {
      feature,
      declared: true,
      catalogModules: mods.length,
      reachableHere: reachable.length,
      hostedHere: hosted.map((def) => def.id),
      unbacked,
      unhosted,
      phantom: unbacked || unhosted,
    };
  });

  // shells — how many liminality bands the page actually builds.
  const bandCounts = {};
  for (const band of LIMINALITY_BANDS) {
    const count = (html.match(new RegExp(`data-spw-liminality="${band}"`, 'g')) || []).length;
    if (count) bandCounts[band] = count;
  }

  // walls — boundaries a reader can cross.
  const walls = {
    braces: (html.match(/data-spw-form="brace"/g) || []).length,
    regions: (html.match(/data-spw-region="/g) || []).length,
    regionPurposes: (html.match(/data-spw-region-purpose="/g) || []).length,
    slots: (html.match(/data-spw-slot="/g) || []).length,
  };

  // dielectric — image anatomy, which holds attention without spending it.
  const dielectric = {
    figures: (html.match(/<figure[\s>]/g) || []).length,
    images: (html.match(/<img[\s>]/g) || []).length,
    imageSurfaces: (html.match(/data-spw-image-(?:reward|discovery|surface|prominence)="/g) || []).length,
  };

  return {
    route,
    file: rel,
    surface: body.surface,
    role: body.role,
    family: body.family,
    modes: body.modes,
    charge,
    declaredFeatures: body.features.length,
    phantomFeatures: charge.filter((c) => c.phantom).map((c) => c.feature),
    shells: bandCounts,
    shellBands: Object.keys(bandCounts).length,
    walls,
    wallTotal: walls.braces + walls.regionPurposes,
    dielectric,
    dielectricTotal: dielectric.figures + dielectric.imageSurfaces,
    unbackedFeatures: charge.filter((c) => c.unbacked).map((c) => c.feature),
    unhostedFeatures: charge.filter((c) => c.unhosted).map((c) => c.feature),
  };
}

/**
 * A page's reason is what it hosts that few other pages host. Rarity is counted
 * over hosted anatomy, not declared features — a claim nobody honors is not a
 * reason to exist.
 */
function attributeReasons(routes) {
  const hostCount = new Map();
  for (const route of routes) {
    for (const entry of route.charge) {
      if (entry.phantom) continue;
      hostCount.set(entry.feature, (hostCount.get(entry.feature) || 0) + 1);
    }
  }

  for (const route of routes) {
    const hosted = route.charge.filter((c) => !c.phantom);
    route.reason = hosted
      .map((c) => ({ feature: c.feature, hostedOnRoutes: hostCount.get(c.feature) || 0 }))
      .sort((a, b) => a.hostedOnRoutes - b.hostedOnRoutes);
    route.exclusive = route.reason.filter((r) => r.hostedOnRoutes === 1).map((r) => r.feature);
    // Debut candidacy: a feature this page hosts and (almost) nowhere else does
    // is the one that should get a moment here rather than on whichever page
    // happens to load first.
    route.debutCandidates = route.reason.filter((r) => r.hostedOnRoutes <= 2).map((r) => r.feature);
  }
  return hostCount;
}

function report(routes, hostCount) {
  const lines = [];
  const declaring = routes.filter((r) => r.declaredFeatures > 0);

  lines.push('page reasons — what each route holds that others do not');
  lines.push('='.repeat(64));
  lines.push(`routes scanned: ${routes.length}   declaring features: ${declaring.length}`);
  lines.push('');

  // Vocabulary that schedules nothing. Counted sitewide because the question
  // is whether the token means anything at all, not whether one page misuses it.
  const unbackedSpread = new Map();
  for (const route of declaring) {
    for (const feature of route.unbackedFeatures) {
      unbackedSpread.set(feature, (unbackedSpread.get(feature) || 0) + 1);
    }
  }
  lines.push(`unbacked vocabulary — declared features no catalog module names (${unbackedSpread.size} tokens)`);
  for (const [feature, count] of [...unbackedSpread.entries()].sort((a, b) => b[1] - a[1])) {
    lines.push(`  ${feature.padEnd(24)} declared on ${count} routes, scheduling nothing`);
  }
  lines.push('');

  const unhosted = declaring
    .filter((r) => r.unhostedFeatures.length)
    .sort((a, b) => b.unhostedFeatures.length - a.unhostedFeatures.length);
  lines.push(`unhosted claims — modules exist and would run here, but select nothing (${unhosted.length} routes)`);
  for (const route of unhosted.slice(0, 20)) {
    lines.push(`  ${route.route.padEnd(38)} ${route.unhostedFeatures.join(' ')}`);
  }
  if (unhosted.length > 20) lines.push(`  … ${unhosted.length - 20} more`);
  lines.push('');

  const flat = declaring
    .filter((r) => r.shellBands <= 1)
    .sort((a, b) => b.declaredFeatures - a.declaredFeatures);
  lines.push(`flat pages — one liminality band or none, so nothing is crossed (${flat.length} routes)`);
  for (const route of flat.slice(0, 15)) {
    lines.push(`  ${route.route.padEnd(38)} bands:${route.shellBands} walls:${route.wallTotal} features:${route.declaredFeatures}`);
  }
  if (flat.length > 15) lines.push(`  … ${flat.length - 15} more`);
  lines.push('');

  lines.push('exclusive holdings — the page is the only host of this anatomy');
  const exclusive = declaring.filter((r) => r.exclusive.length).sort((a, b) => b.exclusive.length - a.exclusive.length);
  for (const route of exclusive.slice(0, 20)) {
    lines.push(`  ${route.route.padEnd(38)} ${route.exclusive.join(' ')}`);
  }
  lines.push('');

  lines.push('feature spread — how many routes host each feature');
  const spread = [...hostCount.entries()].sort((a, b) => b[1] - a[1]);
  for (const [feature, count] of spread) {
    const bar = '#'.repeat(Math.min(40, count));
    lines.push(`  ${feature.padEnd(24)} ${String(count).padStart(3)} ${bar}`);
  }
  lines.push('');

  const noReason = declaring.filter((r) => r.reason.length === 0);
  lines.push(`routes declaring features but hosting none: ${noReason.length}`);
  for (const route of noReason.slice(0, 15)) {
    lines.push(`  ${route.route}`);
  }

  return lines.join('\n');
}

async function main() {
  const args = process.argv.slice(2);
  const asJson = args.includes('--json');
  const routeFilter = args.includes('--route') ? args[args.indexOf('--route') + 1] : null;

  const defs = await loadCatalog();
  const files = await collectRoutes();
  const routes = [];
  for (const file of files) {
    const html = await readFile(file, 'utf8');
    if (!/<body/i.test(html)) continue;
    routes.push(measureRoute(file, html, defs));
  }

  const hostCount = attributeReasons(routes);

  if (routeFilter) {
    const found = routes.filter((r) => r.surface === routeFilter || r.route === routeFilter);
    console.log(JSON.stringify(found, null, 2));
    return;
  }
  if (asJson) {
    console.log(JSON.stringify({
      generatedAt: new Date().toISOString(),
      routes,
      featureSpread: Object.fromEntries(hostCount),
    }, null, 2));
    return;
  }
  console.log(report(routes, hostCount));
}

main().catch((error) => {
  console.error('[page-reasons]', error);
  process.exitCode = 1;
});
