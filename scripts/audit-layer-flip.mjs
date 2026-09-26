#!/usr/bin/env node
/**
 * audit-layer-flip.mjs
 *
 * The built bundles ship routes last, above handles, effects, and ornament;
 * style-core.css declares routes below them. This lists, per route bundle,
 * the route-layer rules that win today and would lose if the bundles carried
 * the declared order: a route rule and a handles/effects/ornament rule that
 * name the same class or attribute and set the same property.
 *
 * It is a review list, not a verdict. It reads selectors, not the DOM, so a
 * shared token is a reason to look, not proof that one element meets both.
 * Look with ?spw-layer-order=declared on the listed pages
 * (.agents/plans/css-cascade-stratification/PLAN.md, Phase 1).
 *
 *   node scripts/audit-layer-flip.mjs [--bundle=play] [--limit=8] [--json=out.json]
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { walkStyleRules } from './lib/css-layer-blocks.mjs';
import { ROUTE_SCOPES, resolveCanonicalRouteSurface, routeBundleHref } from './typed/css-manifest.mjs';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = args.find((arg) => arg.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const onlyBundle = flag('bundle', '');
const limit = Number(flag('limit', '8'));
const jsonOut = flag('json', '');

const OUTRANKED = new Set(['handles', 'effects', 'ornament']);
// Page-scope attributes say which page a rule is for, not which element it paints.
const SCOPE_TOKENS = new Set([
  'data-spw-surface', 'data-spw-page-seed', 'data-spw-page-family', 'data-spw-route-family',
  'data-spw-page-role', 'data-spw-layout', 'data-spw-features', 'data-spw-stylesheet-mode',
  'data-spw-phase', 'data-spw-playing', 'data-spw-color-mode', 'data-spw-reduce-motion',
  'data-spw-context', 'data-spw-wonder', 'data-spw-page-modes',
]);

/** Index of the paren closing the one at `open`. */
function closeParen(text, open) {
  let depth = 0;
  for (let i = open; i < text.length; i += 1) {
    if (text[i] === '(') depth += 1;
    else if (text[i] === ')' && --depth === 0) return i;
  }
  return text.length - 1;
}

/** Split on commas that sit outside parentheses and brackets. */
function splitTop(text) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '(' || ch === '[') depth += 1;
    else if (ch === ')' || ch === ']') depth -= 1;
    else if (ch === ',' && depth === 0) { parts.push(text.slice(start, i)); start = i + 1; }
  }
  parts.push(text.slice(start));
  return parts.map((part) => part.trim()).filter(Boolean);
}

/** Expand :is()/:where() alternatives and drop :not()/:has() and pseudo-elements. */
function expand(selector, budget = { left: 64 }) {
  const drop = /:(?:not|has)\(/.exec(selector);
  if (drop) return expand(selector.slice(0, drop.index) + selector.slice(closeParen(selector, drop.index + drop[0].length - 1) + 1), budget);
  const wrap = /:(?:is|where)\(/.exec(selector);
  if (!wrap) return [selector.replace(/::[\w-]+(\([^)]*\))?/g, '').replace(/&/g, ' ')];
  const open = wrap.index + wrap[0].length - 1;
  const close = closeParen(selector, open);
  const out = [];
  for (const alt of splitTop(selector.slice(open + 1, close))) {
    if (budget.left-- <= 0) break;
    out.push(...expand(selector.slice(0, wrap.index) + alt + selector.slice(close + 1), budget));
  }
  return out;
}

/** The subject compound's class and attribute tokens, one set per alternative. */
function subjects(selector) {
  return splitTop(selector).flatMap((part) => expand(part)).map((alt) => {
    const compounds = alt.split(/\s*[>+~]\s*|\s+(?![^[]*\])/).filter(Boolean);
    const subject = compounds.at(-1) || '';
    const tokens = new Set();
    for (const m of subject.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) tokens.add(`.${m[1]}`);
    for (const m of subject.matchAll(/\[([\w-]+)/g)) if (!SCOPE_TOKENS.has(m[1])) tokens.add(`[${m[1]}]`);
    return tokens;
  }).filter((tokens) => tokens.size);
}

/** A route subject meets an owner subject when they share a class, or share an attribute and neither names a class. */
function meets(routeTokens, ownerTokens) {
  const classes = (set) => [...set].filter((t) => t.startsWith('.'));
  const shared = [...routeTokens].filter((t) => ownerTokens.has(t));
  if (!shared.length) return null;
  const sharedClass = shared.find((t) => t.startsWith('.'));
  if (sharedClass) return sharedClass;
  return classes(routeTokens).length || classes(ownerTokens).length ? null : shared[0];
}

// What handles, effects, and ornament paint: subject tokens, properties, and where.
const owners = [];
const ownerByToken = new Map();
walkStyleRules(readFileSync(path.join(ROOT, 'public/css/bundles/core.css'), 'utf8'), ({ layer, selector, props }) => {
  if (!OUTRANKED.has(layer) || !props.length) return;
  for (const tokens of subjects(selector)) {
    const entry = { tokens, props: new Set(props), where: `${layer}: ${selector.replace(/\s+/g, ' ').slice(0, 90)}` };
    owners.push(entry);
    for (const token of tokens) {
      if (!ownerByToken.has(token)) ownerByToken.set(token, []);
      ownerByToken.get(token).push(entry);
    }
  }
});

// Which pages load which route bundle.
function listPages(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.') || ['node_modules', 'dist', 'dist-vite', 'public', 'scripts', 'workers', 'src', '00.unsorted'].includes(name)) continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) listPages(full, out);
    else if (name === 'index.html') out.push(full);
  }
  return out;
}
const pagesByBundle = new Map();
for (const file of listPages(ROOT)) {
  const surface = /<body[^>]*\bdata-spw-surface="([^"]+)"/.exec(readFileSync(file, 'utf8'))?.[1];
  const href = surface && routeBundleHref(surface);
  if (!href) continue;
  const route = `/${path.relative(ROOT, path.dirname(file))}/`.replace(/^\/\.\/$|^\/\/$/, '/');
  if (!pagesByBundle.has(href)) pagesByBundle.set(href, []);
  pagesByBundle.get(href).push(route === '//' ? '/' : route);
}

const report = [];
for (const surface of Object.keys(ROUTE_SCOPES)) {
  const href = routeBundleHref(surface);
  if (!href || resolveCanonicalRouteSurface(surface) !== surface) continue;
  const slug = path.basename(href, '.css');
  if (onlyBundle && slug !== onlyBundle) continue;
  const findings = [];
  walkStyleRules(readFileSync(path.join(ROOT, href.slice(1)), 'utf8'), ({ layer, selector, props }) => {
    if (layer !== 'routes' || !props.length) return;
    const hit = { token: null, props: new Set(), owners: new Set() };
    for (const routeTokens of subjects(selector)) {
      for (const token of routeTokens) {
        for (const entry of ownerByToken.get(token) || []) {
          const via = meets(routeTokens, entry.tokens);
          if (!via) continue;
          const shared = props.filter((prop) => entry.props.has(prop));
          if (!shared.length) continue;
          hit.token ||= via;
          shared.forEach((prop) => hit.props.add(prop));
          hit.owners.add(entry.where);
        }
      }
    }
    if (hit.token) {
      findings.push({ token: hit.token, props: [...hit.props], route: selector.replace(/\s+/g, ' '), owner: [...hit.owners][0], owners: hit.owners.size });
    }
  });
  const pages = pagesByBundle.get(href) || [];
  report.push({ bundle: slug, pages, findings });
}

report.sort((a, b) => b.findings.length - a.findings.length);
let total = 0;
for (const { bundle, pages, findings } of report) {
  total += findings.length;
  if (!findings.length) continue;
  const tokens = [...findings.reduce((m, f) => m.set(f.token, (m.get(f.token) || 0) + 1), new Map())]
    .sort((a, b) => b[1] - a[1]).slice(0, 6).map(([t, n]) => `${t}×${n}`).join(' ');
  console.log(`\n${bundle}: ${findings.length} route rule(s) would yield · ${pages.length} page(s): ${pages.slice(0, 4).join(' ')}${pages.length > 4 ? ' …' : ''}`);
  console.log(`  tokens: ${tokens}`);
  for (const f of findings.slice(0, limit)) {
    console.log(`  - ${f.token} {${f.props.join(', ')}}\n      route: ${f.route.slice(0, 120)}\n      beats: ${f.owner}${f.owners > 1 ? ` (+${f.owners - 1} more)` : ''}`);
  }
}
console.log(`\n[layer-flip] ${total} route rules across ${report.filter((r) => r.findings.length).length} bundle(s) would change winner under the declared order. Review with ?spw-layer-order=declared.`);
if (jsonOut) await writeFile(jsonOut, `${JSON.stringify(report, null, 2)}\n`);
