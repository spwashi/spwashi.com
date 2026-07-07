#!/usr/bin/env node
/**
 * Generate plan-specific .spw artifacts for each plan directory.
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
const NORMALIZE_WIP = process.argv.includes('--normalize-wip') || !CHECK;

const ARTIFACT_NAMES = new Set(['PLAN.md', 'FIX.md', 'wip.spw', 'index.spw']);
const SKIP_DIR_NAMES = new Set(['templates', 'recent-plan-templates']);
const CONTRACT_RAILS = new Set([
  'model-guided-refinement',
  'modular-experience-slices',
  'spw-surface-normalization',
  'daily-kernel-development',
  'agent-optimization',
  'agentic-dev-contracts',
  'planning-ecology',
  'semantic-capacity',
]);

function slugToAnchor(slug) {
  return slug.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').toLowerCase();
}

function escapeSpwString(value) {
  return String(value || '')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\s+/g, ' ')
    .trim();
}

function summarizeGoal(value, limit = 160) {
  const clean = escapeSpwString(value);
  if (clean.length <= limit) return clean;
  const slice = clean.slice(0, limit);
  const lastSpace = slice.lastIndexOf(' ');
  return `${(lastSpace > 80 ? slice.slice(0, lastSpace) : slice).trim()}…`;
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
  const depth = relDir.split('/').length + 2;
  return `${'../'.repeat(depth)}.spw/conventions/wip-notebook.spw`;
}

function planRelativeRef(relDir, target) {
  const depth = relDir.split('/').length + 2;
  const prefix = `${'../'.repeat(depth)}`;
  return target.startsWith('.') ? `${prefix}${target.replace(/^\.\//, '')}` : `${prefix}${target}`;
}

function readText(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function sectionText(markdown, heading) {
  const pattern = new RegExp(`^##\\s+${heading}\\s*$`, 'im');
  const match = pattern.exec(markdown);
  if (!match) return '';
  const start = match.index + match[0].length;
  const rest = markdown.slice(start);
  const next = rest.search(/^##\s+/m);
  return (next === -1 ? rest : rest.slice(0, next)).trim();
}

function firstParagraph(markdown) {
  const lines = markdown.split('\n');
  const parts = [];
  for (const line of lines) {
    if (/^#/.test(line)) continue;
    if (!line.trim()) {
      if (parts.length) break;
      continue;
    }
    parts.push(line.trim());
    if (line.trim()) break;
  }
  return parts.join(' ').trim();
}

function bulletLines(text, limit = 4) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^[-*]/.test(line))
    .map((line) => line.replace(/^[-*]\s+/, '').replace(/\*\*/g, '').trim())
    .filter(Boolean)
    .slice(0, limit);
}

function extractPathRefs(markdown) {
  const refs = new Set();
  const patterns = [
    /`((?:\.spw|public|topics|scripts|design|index\.html|settings|about|play|contact)[^`]+)`/g,
    /`(\.agents\/[^`]+)`/g,
  ];
  for (const pattern of patterns) {
    for (const match of markdown.matchAll(pattern)) {
      const candidate = match[1].split('#')[0].trim();
      if (candidate.length < 4) continue;
      refs.add(candidate);
    }
  }
  return [...refs];
}

function resolveRepoPath(ref) {
  const cleaned = ref.replace(/\?v=[^/]+$/i, '');
  const abs = path.join(REPO_ROOT, cleaned);
  return fs.existsSync(abs) ? cleaned : null;
}

function parsePlanArtifact(absDir, slug, files, relDir = '') {
  const hasPlan = files.includes('PLAN.md');
  const hasFix = files.includes('FIX.md');
  const planMd = hasPlan ? readText(path.join(absDir, 'PLAN.md')) : '';
  const fixMd = hasFix ? readText(path.join(absDir, 'FIX.md')) : '';
  const source = hasPlan ? planMd : fixMd;
  const kind = hasPlan ? 'plan' : 'fix';

  const titleMatch = source.match(/^#\s+(?:Plan|Fix):\s*(.+)$/im) || source.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : slug;

  let goal = '';
  if (kind === 'fix') {
    const planned = sectionText(source, 'Planned Fix');
    const diagnosis = sectionText(source, 'Diagnosis');
    goal =
      bulletLines(planned, 1)[0] ||
      firstParagraph(planned) ||
      firstParagraph(diagnosis) ||
      bulletLines(sectionText(source, 'Failures'), 1)[0] ||
      firstParagraph(source);
  } else {
    goal = sectionText(source, 'Public Goal') || sectionText(source, 'Goal') || firstParagraph(source);
  }
  goal = goal.replace(/\s+/g, ' ').trim();
  if (kind === 'fix') {
    goal = goal.replace(/^[-*]\s+/, '');
  }

  const scopeSection = sectionText(source, 'Scope');
  const scopeIn = bulletLines(
    scopeSection.split(/out of scope/i)[0] || scopeSection,
    4,
  );
  const scopeOut = bulletLines(
    (scopeSection.match(/out of scope([\s\S]*)/i) || [])[1] || '',
    3,
  );

  const validation = bulletLines(
    sectionText(source, 'Validation') || sectionText(source, 'Validation Loop'),
    6,
  );

  const refs = extractPathRefs(source)
    .map((ref) => resolveRepoPath(ref))
    .filter(Boolean)
    .slice(0, 8);

  let operation = 'prime';
  if (kind === 'fix') operation = 'audit';
  else if (CONTRACT_RAILS.has(slug)) operation = 'contract';
  else if (/cache|insight/i.test(slug)) operation = 'cache';

  let fixity = kind === 'fix' ? 'tending' : 'tending';
  if (CONTRACT_RAILS.has(slug)) fixity = 'stable';
  if (relDir.startsWith('archive/') || relDirIncludesArchive(absDir)) fixity = 'cold';

  return {
    kind,
    title,
    goal,
    scopeIn,
    scopeOut,
    validation,
    refs,
    operation,
    fixity,
    hasPlan,
    hasFix,
  };
}

function relDirIncludesArchive(absDir) {
  return absDir.includes(`${path.sep}archive${path.sep}`);
}

function buildIndexContent(slug, relDir, files, meta) {
  const anchor = `plan_${slugToAnchor(slug)}_index`;
  const goalLine = meta.goal ? summarizeGoal(meta.goal, 180) : `Owner surface for ${slug}.`;
  const lines = [
    `# Plan Index — ${meta.title}`,
    '#',
    `# ${goalLine}`,
    '',
    `#>${anchor}`,
    '#:index #!plan',
    `#:operation #!${meta.operation}`,
    '#:layer #!pragmatics',
    '',
    `operation = "${meta.operation}"`,
    `fixity = "${meta.fixity}"`,
    '',
    'intent: .{',
    ` goal = \`${escapeSpwString(meta.goal || goalLine)}\``,
    ` owner = \`${slug}\``,
    ` kind = \`${meta.kind}\``,
    '}[reg=facet]',
    '',
    `@wip_notebook: ~"${conventionRef(relDir)}"`,
  ];

  const dispatch = [];

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

  for (const refPath of meta.refs) {
    const key = slugToAnchor(path.basename(refPath, path.extname(refPath)));
    const uniqueKey = meta.refs.filter((r) => slugToAnchor(path.basename(r, path.extname(r))) === key).length > 1
      ? slugToAnchor(refPath.replace(/[/.]/g, '_'))
      : key;
    const alias = `@${uniqueKey}`;
    if (lines.some((line) => line.startsWith(`${alias}:`))) continue;
    lines.push(`${alias}: ~"${planRelativeRef(relDir, refPath)}"`);
    dispatch.push(` ${uniqueKey} = ${alias}`);
  }

  lines.push('', 'dispatch: .{', ...dispatch, '}[reg=facet]');

  if (meta.scopeIn.length || meta.scopeOut.length) {
    lines.push('', 'scope: .{');
    if (meta.scopeIn.length) {
      lines.push(' in = #[', ...meta.scopeIn.map((item) => `  \`${escapeSpwString(item)}\`,`), ' ][reg=set]');
    }
    if (meta.scopeOut.length) {
      lines.push(' out = #[', ...meta.scopeOut.map((item) => `  \`${escapeSpwString(item)}\`,`), ' ][reg=set]');
    }
    lines.push('}[reg=facet]');
  }

  if (meta.validation.length) {
    lines.push('', 'validation: #[', ...meta.validation.map((item) => ` \`${escapeSpwString(item)}\`,`), '][reg=set]');
  }

  const invariants = [
    meta.goal ? `Owner intent: ${summarizeGoal(meta.goal, 140)}` : `This folder owns ${slug}.`,
    'PLAN.md or FIX.md remains the sequencing source; this index routes inspection.',
    'Promote durable claims to named .spw artifacts, .spw/slices/, or .spw/conventions/.',
  ];

  lines.push('', 'invariants: #[', ...invariants.map((item) => ` \`${item}\`,`), '][reg=set]', '');
  return `${lines.join('\n')}\n`;
}

function hasModernWipHeader(content, slug) {
  const anchor = `plan_${slugToAnchor(slug)}_wip`;
  return content.includes(`#>${anchor}`) || /#:operation\s+#!/.test(content);
}

function upsertPlanContextBlock(content, meta, slug) {
  const lines = [
    '^"plan_context"{',
    ` goal = \`${escapeSpwString(meta.goal)}\``,
    ` owner = \`${slug}\``,
    ` operation = "${meta.operation}"`,
  ];
  if (meta.validation.length) {
    lines.push(
      ` validation = #[${meta.validation.map((item) => ` \`${escapeSpwString(item)}\`,`).join('')} ][reg=set]`,
    );
  }
  if (meta.refs.length) {
    lines.push(` hot_files = #[${meta.refs.slice(0, 6).map((item) => ` \`${item}\`,`).join('')} ][reg=set]`);
  }
  lines.push('}[reg=facet]', '');
  const block = `${lines.join('\n')}\n`;

  if (/^\^"plan_context"\{[\s\S]*?\}\[reg=facet\]\n*/m.test(content)) {
    return content.replace(/^\^"plan_context"\{[\s\S]*?\}\[reg=facet\]\n*/m, `${block}`);
  }
  const anchor = `plan_${slugToAnchor(slug)}_wip`;
  const marker = content.includes(`#>${anchor}`) ? /(#>plan_[^\n]+\n(?:#:[^\n]+\n)*\n(?:@[^\n]+\n)*\noperation = "[^"]+"\nfixity = "[^"]+"\n\n)/ : null;
  if (marker && marker.test(content)) {
    return content.replace(marker, `$1${block}`);
  }
  return `${block}${content}`;
}

function normalizeWipHeader(slug, relDir, content, meta) {
  const anchor = `plan_${slugToAnchor(slug)}_wip`;
  let next = content;

  if (!hasModernWipHeader(content, slug)) {
    const header = [
      `# wip — ${meta.title}`,
      '#',
      `# ${summarizeGoal(meta.goal, 160)}`,
      '',
      `#>${anchor}`,
      `#:operation #!${meta.operation}`,
      '#:fixity #!tending',
      '#:layer #!pragmatics',
      '',
      meta.hasPlan ? '@plan: ~"./PLAN.md"' : '@fix: ~"./FIX.md"',
      '@index: ~"./index.spw"',
      `@wip_notebook: ~"${conventionRef(relDir)}"`,
      '',
      `operation = "${meta.operation}"`,
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
    next = body ? `${header}${body}\n` : `${header.trimEnd()}\n`;
  }

  return upsertPlanContextBlock(next, meta, slug);
}

function customizeNamedSpw(content, meta, slug) {
  const alreadyLinked =
    content.includes('~"./PLAN.md"') || content.includes('~"./FIX.md"') || /^\^"plan_linkage"\{/m.test(content);
  return upsertPlanLinkage(content, meta, slug, alreadyLinked);
}

function upsertPlanLinkage(content, meta, slug, alreadyLinked) {
  const planRef = meta.hasPlan ? ' plan = ~"./PLAN.md"' : ' fix = ~"./FIX.md"';
  const block = [
    '^"plan_linkage"{',
    planRef,
    ' index = ~"./index.spw"',
    ` goal = \`${escapeSpwString(meta.goal)}\``,
    ` owner = \`${slug}\``,
    '}[reg=facet]',
    '',
  ].join('\n');

  if (/^\^"plan_linkage"\{[\s\S]*?\}\[reg=facet\]\n*/m.test(content)) {
    return content.replace(/^\^"plan_linkage"\{[\s\S]*?\}\[reg=facet\]\n*/m, block);
  }

  if (alreadyLinked) {
    const lines = content.split('\n');
    const insertAt = lines.findIndex((line) => /^#\>/.test(line));
    if (insertAt === -1) return `${block}${content}`;
    let end = insertAt + 1;
    while (end < lines.length && /^#:/.test(lines[end])) end += 1;
    lines.splice(end, 0, '', ...block.trimEnd().split('\n'), '');
    return `${lines.join('\n')}\n`;
  }

  const headerEnd = content.search(/^(\^|\@|dispatch:|operation\s*=)/m);
  if (headerEnd === -1) return `${block}${content}`;
  return `${content.slice(0, headerEnd)}${block}${content.slice(headerEnd)}`;
}

function parseInsightCacheName(filename) {
  return filename
    .replace(/\.spw$/, '')
    .replace(/-cache$/, '')
    .replace(/_/g, ' ');
}

function customizeInsightCache(content, filename, parentMeta) {
  const label = parseInsightCacheName(filename);
  const block = [
    '^"plan_linkage"{',
    ' plan = ~"../PLAN.md"',
    ' index = ~"../index.spw"',
    ` goal = \`${escapeSpwString(parentMeta.goal)}\``,
    ` cache_topic = \`${escapeSpwString(label)}\``,
    '}[reg=facet]',
    '',
  ].join('\n');

  if (/^\^"plan_linkage"\{[\s\S]*?\}\[reg=facet\]\n*/m.test(content)) {
    return content.replace(/^\^"plan_linkage"\{[\s\S]*?\}\[reg=facet\]\n*/m, block);
  }
  const insertAt = content.indexOf('^"insight"');
  if (insertAt === -1) return content;
  return `${content.slice(0, insertAt)}${block}${content.slice(insertAt)}`;
}

function main() {
  const planDirs = listPlanDirectories(PLANS_ROOT).sort();
  let changed = 0;
  let checkedMismatch = 0;

  for (const relDir of planDirs) {
    const absDir = path.join(PLANS_ROOT, relDir);
    const slug = path.basename(relDir);
    const files = fs.readdirSync(absDir);
    const meta = parsePlanArtifact(absDir, slug, files, relDir);
    const indexPath = path.join(absDir, 'index.spw');
    const nextIndex = buildIndexContent(slug, relDir, files, meta);

    const targets = [{ path: indexPath, next: nextIndex }];

    if (NORMALIZE_WIP && files.includes('wip.spw')) {
      const wipPath = path.join(absDir, 'wip.spw');
      const wipContent = readText(wipPath);
      targets.push({
        path: wipPath,
        next: normalizeWipHeader(slug, relDir, wipContent, meta),
      });
    }

    for (const name of listNamedSpwFiles(absDir)) {
      if (name.endsWith('.template.spw') || name === 'semantic-insight-cache.spw') continue;
      const spwPath = path.join(absDir, name);
      const spwContent = readText(spwPath);
      const parentDir = path.dirname(absDir);
      const parentPlan = readText(path.join(parentDir, 'PLAN.md'));
      const parentMeta = parentPlan
        ? parsePlanArtifact(parentDir, path.basename(parentDir), fs.readdirSync(parentDir))
        : meta;
      const nextSpw = name.includes('cache')
        ? customizeInsightCache(spwContent, name, parentMeta)
        : customizeNamedSpw(spwContent, meta, slug);
      targets.push({ path: spwPath, next: nextSpw });
    }

    for (const { path: filePath, next } of targets) {
      const current = fs.existsSync(filePath) ? readText(filePath) : '';
      if (current === next) continue;
      if (CHECK) {
        checkedMismatch += 1;
        continue;
      }
      fs.writeFileSync(filePath, next.endsWith('\n') ? next : `${next}\n`);
      changed += 1;
    }
  }

  if (CHECK) {
    if (checkedMismatch) {
      console.error(`Plan .spw drift: ${checkedMismatch} file(s) need refresh.`);
      process.exit(1);
    }
    console.log(`Plan .spw artifacts OK (${planDirs.length} directories).`);
    return;
  }

  console.log(`Updated ${changed} plan .spw file(s) across ${planDirs.length} directories.`);
}

main();