#!/usr/bin/env node
/**
 * Rewrite class nouns onto spw-frame / spw-chip and project meaning onto
 * existing data-spw-* attributes. Operates on class="..." only so '>' inside
 * Spw expressions cannot split tags.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['node_modules', 'dist', 'dist-vite', '.git', '_workbench', 'catalog', 'experiments', 'load-symphony']);

function shouldSkip(filePath) {
  return filePath.split(path.sep).some((part) => SKIP.has(part));
}

async function walk(dir, accept, found = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (shouldSkip(full)) continue;
    if (entry.isDirectory()) {
      await walk(full, accept, found);
      continue;
    }
    if (accept(full)) found.push(full);
  }
  return found;
}

function rewriteClassToken(token) {
  if (token === 'site-frame') return 'spw-frame';
  if (token === 'site-hero' || token === 'spw-hero') return '';
  if (token === 'site-hero--split-figure' || token === 'spw-hero--split-figure') return '';
  if (token === 'page-lede' || token === 'site-lede' || token === 'hero-lede' || token === 'frame-lede') return '';
  if (token === 'frame-note' || token === 'inline-note') return '';
  if (token === 'page-kicker') return '';
  if (token === 'operator-chip') return 'spw-chip';
  return token;
}

function extrasFor(classes) {
  const extras = [];
  const hadFrame = classes.includes('site-frame') || classes.includes('spw-frame');
  const hadHero = classes.some((token) => token === 'site-hero' || token === 'spw-hero' || token.startsWith('site-hero--') || token.startsWith('spw-hero--'));
  const hadSplit = classes.includes('site-hero--split-figure') || classes.includes('spw-hero--split-figure');
  const hadLede = classes.some((token) => ['page-lede', 'site-lede', 'hero-lede', 'frame-lede'].includes(token));
  const hadNote = classes.includes('frame-note') || classes.includes('inline-note');
  const hadKicker = classes.includes('page-kicker');
  const hadTopline = classes.includes('frame-topline') || classes.includes('frame-heading');
  const hadChip = classes.includes('operator-chip');
  if (hadFrame) extras.push(['data-spw-kind', 'frame']);
  if (hadHero) extras.push(['data-spw-region-role', 'entry-spine']);
  if (hadSplit) extras.push(['data-spw-anatomy', 'hero-split']);
  if (hadLede) extras.push(['data-spw-textual-role', 'lede']);
  else if (hadNote) extras.push(['data-spw-textual-role', 'note']);
  if (hadKicker) extras.push(['data-spw-textual-role', 'kicker']);
  if (hadTopline) extras.push(['data-spw-slot', 'header']);
  if (hadChip) extras.push(['data-spw-handle', 'true']);
  return extras;
}

function rewriteHtml(source) {
  return source.replace(/(\sclass=")([^"]*)(")/g, (full, prefix, classStr, suffix, offset) => {
    const classes = classStr.split(/\s+/).filter(Boolean);
    if (!classes.some((token) => /^(site-frame|spw-frame|site-hero|spw-hero|page-lede|site-lede|frame-note|inline-note|page-kicker|frame-topline|frame-heading|operator-chip)/.test(token))) {
      return full;
    }
    const rewritten = [...new Set(classes.map(rewriteClassToken).filter(Boolean))];
    const windowStart = Math.max(0, offset - 40);
    const windowEnd = Math.min(source.length, offset + full.length + 500);
    const around = source.slice(windowStart, windowEnd);
    const extras = extrasFor(classes)
      .filter(([name]) => !new RegExp(`\\s${name}="`).test(around))
      .map(([name, value]) => ` ${name}="${value}"`)
      .join('');
    return `${prefix}${rewritten.join(' ')}${suffix}${extras}`;
  });
}

function rewriteCss(source) {
  let next = source;
  next = next.replace(/\.site-hero--split-figure/g, '[data-spw-anatomy="hero-split"]');
  next = next.replace(/\.spw-hero--split-figure/g, '[data-spw-anatomy="hero-split"]');
  next = next.replace(/\.site-hero\b/g, '[data-spw-region-role="entry-spine"]');
  next = next.replace(/\.spw-hero\b/g, '[data-spw-region-role="entry-spine"]');
  next = next.replace(/\.site-frame\b/g, '.spw-frame');
  next = next.replace(/\.page-lede\b/g, '[data-spw-textual-role="lede"]');
  next = next.replace(/\.site-lede\b/g, '[data-spw-textual-role="lede"]');
  next = next.replace(/\.hero-lede\b/g, '[data-spw-textual-role="lede"]');
  next = next.replace(/\.frame-lede\b/g, '[data-spw-textual-role="lede"]');
  next = next.replace(/\.frame-note\b/g, '[data-spw-textual-role="note"]');
  next = next.replace(/\.page-kicker\b/g, '[data-spw-textual-role="kicker"]');
  next = next.replace(/\.operator-chip\b/g, '.spw-chip');
  return next;
}

const changed = [];
const htmlFiles = await walk(ROOT, (file) => file.endsWith('index.html'));
for (const file of htmlFiles) {
  const source = await fs.readFile(file, 'utf8');
  const next = rewriteHtml(source);
  if (next !== source) {
    await fs.writeFile(file, next);
    changed.push(path.relative(ROOT, file));
  }
}

const cssFiles = await walk(path.join(ROOT, 'public/css'), (file) => file.endsWith('.css') && !file.includes(`${path.sep}bundles${path.sep}`));
for (const file of cssFiles) {
  const source = await fs.readFile(file, 'utf8');
  const next = rewriteCss(source);
  if (next !== source) {
    await fs.writeFile(file, next);
    changed.push(path.relative(ROOT, file));
  }
}

console.log(`rewrote ${changed.length} files`);
