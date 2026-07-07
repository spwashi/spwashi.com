#!/usr/bin/env node
/**
 * Generate or refresh index.spw dispatch files for plan directories.
 * Optionally normalize minimal wip.spw headers.
 *
 * Usage:
 *   node scripts/maintain-plan-directory-indexes.mjs
 *   node scripts/maintain-plan-directory-indexes.mjs --check
 *   node scripts/maintain-plan-directory-indexes.mjs --normalize-wip
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const PLANS_ROOT = path.join(REPO_ROOT, '.agents', 'plans');
const CHECK = process.argv.includes('--check');
const NORMALIZE_WIP = process.argv.includes('--normalize-wip');

const ARTIFACT_NAMES = new Set(['PLAN.md', 'FIX.md', 'wip.spw', 'index.spw']);
const SKIP_DIR_NAMES = new Set(['templates', 'recent-plan-templates']);

function slugToAnchor(slug) {
  return slug.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').toLowerCase();
}

function listPlanDirectories(dir, relative = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const dirs = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (SKIP_DIR_NAMES.has(entry.name)) continue;

    const rel = relative ? `${relative}/${entry.name}` : entry.name;
    const abs = path.join(dir, entry.name);
    const children = listPlanDirectories(abs, rel);
    if (children.length) {
      dirs.push(...children);
      continue;
    }

    const files = fs.readdirSync(abs);
    const hasArtifact = files.some((name) => {
      if (ARTIFACT_NAMES.has(name)) return name !== 'index.spw';
      return name.endsWith('.spw') && name !== 'index.spw';
    });
    if (hasArtifact) dirs.push(rel);
  }

  return dirs;
}

function listNamedSpwFiles(dir) {
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.spw') && name !== 'wip.spw' && name !== 'index.spw')
    .sort();
}

function conventionRef(relDir) {
  const depth = relDir.split('/').length + 2; // .agents/plans/<...>
  return `${'../'.repeat(depth)}.spw/conventions/wip-notebook.spw`;
}

function buildIndexContent(slug, relDir, files) {
  const anchor = `plan_${slugToAnchor(slug)}_index`;
  const lines = [
    `# Plan Directory Index — ${slug}`,
    '#',
    '# Dispatch surface for this plan folder.',
    '',
    `#>${anchor}`,
    '#:index #!plan',
    '#:layer #!pragmatics',
    '',
    `@wip_notebook: ~"${conventionRef(relDir)}"`,
  ];

  const dispatch = [];
  const invariants = [
    'PLAN.md sequences work when present.',
    'wip.spw holds hot tending memory when present; see wip-notebook.spw.',
    'Promote durable meaning to named .spw artifacts, .spw/slices/, or .spw/conventions/.',
  ];

  if (files.includes('PLAN.md')) {
    lines.push('@plan: ~"./PLAN.md"');
    dispatch.push(' plan = @plan');
  }
  if (files.includes('FIX.md')) {
    lines.push('@fix: ~"./FIX.md"');
    dispatch.push(' fix = @fix');
  }
  if (files.includes('wip.spw')) {
    lines.push('@wip: ~"./wip.spw"');
    dispatch.push(' wip = @wip');
  }

  const namedSpw = listNamedSpwFiles(path.join(PLANS_ROOT, relDir));
  for (const name of namedSpw) {
    const key = slugToAnchor(path.basename(name, '.spw'));
    const ref = `@${key}`;
    lines.push(`${ref}: ~"./${name}"`);
    dispatch.push(` ${key} = ${ref}`);
  }

  lines.push('', 'dispatch: .{', ...dispatch, '}[reg=facet]', '', 'invariants: #[', ...invariants.map((item) => ` \`${item}\`,`), '][reg=set]', '');

  return `${lines.join('\n')}\n`;
}

function hasModernWipHeader(content, slug) {
  const anchor = `plan_${slugToAnchor(slug)}_wip`;
  return content.includes(`#>${anchor}`) || /#:operation\s+#!/.test(content);
}

function normalizeWipHeader(slug, relDir, content) {
  if (hasModernWipHeader(content, slug)) return content;

  const anchor = `plan_${slugToAnchor(slug)}_wip`;
  const header = [
    `# wip — ${slug}`,
    '#',
    `#>${anchor}`,
    '#:operation #!cache',
    '#:fixity #!tending',
    '#:layer #!pragmatics',
    '',
    '@plan: ~"./PLAN.md"',
    '@index: ~"./index.spw"',
    `@wip_notebook: ~"${conventionRef(relDir)}"`,
    '',
    'operation = "cache"',
    'fixity = "tending"',
    '',
  ].join('\n');

  const trimmed = content.replace(/^\uFEFF?/, '').trimStart();
  let body = trimmed;
  if (/^#\s*wip\b/i.test(trimmed)) {
    body = trimmed.replace(/^#[^\n]*\n(?:#[^\n]*\n)*/, '');
  }
  body = body.replace(/^(?:#:layer[^\n]*\n)+/m, '');
  body = body.trimEnd();
  return body ? `${header}${body}\n` : `${header.trimEnd()}\n`;
}

function main() {
  const planDirs = listPlanDirectories(PLANS_ROOT).sort();
  let changed = 0;
  let checkedMismatch = 0;

  for (const relDir of planDirs) {
    const absDir = path.join(PLANS_ROOT, relDir);
    const slug = path.basename(relDir);
    const files = fs.readdirSync(absDir);
    const indexPath = path.join(absDir, 'index.spw');
    const nextIndex = buildIndexContent(slug, relDir, files);

    if (CHECK) {
      const current = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : '';
      if (current !== nextIndex) checkedMismatch += 1;
      continue;
    }

    const current = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : null;
    if (current !== nextIndex) {
      fs.writeFileSync(indexPath, nextIndex);
      changed += 1;
    }

    if (NORMALIZE_WIP && files.includes('wip.spw')) {
      const wipPath = path.join(absDir, 'wip.spw');
      const wipContent = fs.readFileSync(wipPath, 'utf8');
      const normalized = normalizeWipHeader(slug, relDir, wipContent);
      if (normalized !== wipContent) {
        fs.writeFileSync(wipPath, normalized.endsWith('\n') ? normalized : `${normalized}\n`);
        changed += 1;
      }
    }
  }

  if (CHECK) {
    if (checkedMismatch) {
      console.error(`Plan directory index drift: ${checkedMismatch} folder(s) need refresh.`);
      process.exit(1);
    }
    console.log(`Plan directory indexes OK (${planDirs.length} folders).`);
    return;
  }

  console.log(`Updated ${changed} file(s) across ${planDirs.length} plan directories.`);
}

main();