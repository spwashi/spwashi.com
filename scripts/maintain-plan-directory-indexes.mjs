#!/usr/bin/env node
/**
 * Generate plan-specific .spw artifacts with strong Spw indexing features.
 *
 * Usage:
 *   node scripts/maintain-plan-directory-indexes.mjs --check
 *   node scripts/maintain-plan-directory-indexes.mjs --force-generated
 *
 * Reviewed plan trees are authored surfaces. The default write path refuses to
 * replace file-local review decisions; --force-generated is intentionally
 * destructive and exists only for an explicit, human-reviewed rebuild.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PLAN_REFINEMENTS } from './plan-refinements-data.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const PLANS_ROOT = path.join(REPO_ROOT, '.agents', 'plans');
const PLANS_INDEX = path.join(PLANS_ROOT, 'index.spw');
const CHECK = process.argv.includes('--check');
const FORCE_GENERATED = process.argv.includes('--force-generated');
const REVIEW_MARKER = /^# Review \d{4}-\d{2}-\d{2} — /;

const ARTIFACT_NAMES = new Set(['PLAN.md', 'FIX.md', 'wip.spw', 'index.spw']);
const SKIP_DIR_NAMES = new Set(['templates', 'recent-plan-templates']);

const CONTRACT_RAILS = new Set([
  'model-guided-refinement',
  'modular-experience-slices',
  'spw-surface-normalization',
  'spw-architecture-ecology',
  'daily-kernel-development',
  'agent-optimization',
  'agentic-dev-contracts',
  'planning-ecology',
  'semantic-capacity',
  'plan-wip-index-conventions',
  'component-region-personality',
  'spw-language-v04',
  'module-export-uniformity',
  'language-reclustering',
  'relational-attention-media',
  'semantic-copy-depth',
]);

const COMPLETED_REFERENCE = new Map([
  ['state-satchel-card-gesture-fixes', { superseded_by: 'card-anatomy-interactions', research: 'component-philosophy-harmony-2026-07', kind: 'plan' }],
  ['card-anatomy-interactions', { superseded_by: 'rpg-portal-fantasy', research: 'page-component-census-2026-07', kind: 'plan' }],
  ['overlay-layer-ownership', { superseded_by: null, research: 'css-module-attribute-impact-2026-07', kind: 'fix' }],
  ['menu-containment-navigation', { superseded_by: null, research: 'chrome-navigation-wonder', kind: 'fix' }],
  ['mobile-image-effects', { superseded_by: null, research: 'image-metaphysics-aesthetic-pass', kind: 'fix' }],
  ['runtime-route-css-regressions', { superseded_by: null, research: 'build-runtime-performance-2026-07', kind: 'fix' }],
]);

const RESEARCH_BRIDGE_BY_BUCKET = {
  semantic_rails: [
    { label: 'plan_ecology_semantics', path: '.spw/audits/plan-ecology-semantics-2026-07.spw' },
    { label: 'commit_skill_induction', path: '.spw/audits/commit-skill-induction-2026-07/index.spw' },
    { label: 'spw_architecture_ecology', path: '.spw/conventions/spw-architecture-ecology.spw' },
  ],
  css_layout_interaction: [
    { label: 'page_spacing_runtime', path: '.spw/audits/page-spacing-runtime-synthesis-2026-07.spw' },
    { label: 'vocabulary_metaphor', path: '.spw/audits/vocabulary-metaphor-growth-synthesis-2026-07.spw' },
  ],
  runtime_js_validation: [
    { label: 'javascript_module_census', path: '.spw/audits/javascript-module-census-2026-07.spw' },
    { label: 'module_export_audit', path: '.spw/audits/module-export-standalone-2026-07.spw' },
  ],
  media_image_sensory: [
    { label: 'vocabulary_metaphor', path: '.spw/audits/vocabulary-metaphor-growth-synthesis-2026-07.spw' },
    { label: 'metaphor_primitive_research', path: '.spw/audits/metaphor-primitive-research-branching-2026-07.spw' },
  ],
  public_route_proof_genre: [
    { label: 'appendices_index', path: '.spw/audits/appendices/index.spw' },
    { label: 'metaphor_primitive_research', path: '.spw/audits/metaphor-primitive-research-branching-2026-07.spw' },
  ],
  completed_reference: [
    { label: 'archive_sweep', path: '.agents/plans/archive/2026-07-12-plan-ecology-semantics-architecture.md' },
    { label: 'commit_history_deep', path: '.spw/audits/commit-history-deep-2026-07/index.spw' },
  ],
  archive: [
    { label: 'archive_readme', path: '.agents/plans/archive/README.md' },
    { label: 'commit_history_deep', path: '.spw/audits/commit-history-deep-2026-07/index.spw' },
  ],
};

const RESEARCH_BRIDGE_BY_SLUG = {
  'model-guided-refinement': [{ label: 'vocabulary_metaphor', path: '.spw/audits/vocabulary-metaphor-growth-synthesis-2026-07.spw' }],
  'spw-architecture-ecology': [{ label: 'plan_ecology_semantics', path: '.spw/audits/plan-ecology-semantics-2026-07.spw' }],
  'agent-optimization': [{ label: 'commit_skill_induction', path: '.spw/audits/commit-skill-induction-2026-07/index.spw' }],
  'language-reclustering': [{ label: 'language_census', path: '.spw/audits/language-census.spw' }],
  'copy-localization': [{ label: 'vocabulary_metaphor', path: '.spw/audits/vocabulary-metaphor-growth-synthesis-2026-07.spw' }],
  'module-export-uniformity': [{ label: 'module_export_audit', path: '.spw/audits/module-export-standalone-2026-07.spw' }],
};

const CANONICAL_TRACKS = new Set([
  'css-architecture-readability',
  'color-motion',
  'midjourney-design-concepts',
  'reference-assignment-template',
]);

const BUCKETS = {
  semantic_rails: new Set([
    'model-guided-refinement',
    'daily-kernel-development',
    'modular-experience-slices',
    'spw-surface-normalization',
    'spw-architecture-ecology',
    'agent-optimization',
    'agentic-dev-contracts',
    'relational-attention-media',
    'semantic-copy-depth',
    'discovery-powerups',
    'plan-wip-index-conventions',
    'component-region-personality',
    'spw-language-v04',
    'module-export-uniformity',
    'language-reclustering',
    'spw-metaphysical-language',
    'homonym-renaming',
  ]),
  css_layout_interaction: new Set([
    'css-maintainability-refactor',
    'css-state-legibility',
    'component-box-model-responsive-audit',
    'card-grid-density-audit',
    'floating-chrome-stack',
    'gesture-aria-hygiene',
    'attention-shell-contrast',
    'chrome-navigation-wonder',
    'page-region-discoverability',
    'shell-model-vocabulary-consolidation',
    'vertical-rhythm-container-audit',
    'card-anatomy-interactions',
    'overlay-layer-ownership',
    'menu-containment-navigation',
    'navigation-header-disclosure',
    'gesture-state-refinement',
    'interaction-loop-contract',
    'hook-region-anatomy',
    'space-menu-arcs-electrical',
  ]),
  runtime_js_validation: new Set([
    'runtime-bootstrap-performance',
    'runtime-load-instrumentation',
    'runtime-module-fluency',
    'js-surface-ecology',
    'js-taxonomy-cleanup',
    'site-source-layout',
    'typescript-integration',
    'runtime-settings',
    'runtime-route-css-regressions',
    'curricularize-codebase-typescript',
    'javascript-standalone-utility',
  ]),
  media_image_sensory: new Set([
    'style-image-cohesion',
    'midjourney-design-concepts',
    'relational-attention-media',
    'site-color-tuning',
    'theme-palette-marketability',
    'image-metaphysics-aesthetic-pass',
    'image-visit-metaphysics',
    'mobile-image-effects',
    'unsorted-image-rollout',
    'palette-semantics-improvements',
    'palette-theme-composability-instrumentability',
  ]),
  public_route_proof_genre: new Set([
    'design-hub',
    'webpage-trope-vocabulary',
    'professional-skill-development-worldbuilding',
    'rpg-portal-fantasy',
    'expressive-layout-tropes-fidget-manuscript',
    'literacy-precipitation-press',
    'rpg-wednesday-learning-library',
    'rpg-local-gameplay',
    'town-atlas-story-kit',
    'spellcraft-authoring',
    'care-interface-atlas',
    'services-ladder-and-topic-ctas',
  ]),
  templates_tooling: new Set(['recent-plan-templates', 'reference-assignment-template']),
  fix_queue: new Set(),
};

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

function relUp(relDir, targetFromRepoRoot) {
  const depth = relDir.split('/').filter(Boolean).length + 2;
  return `${'../'.repeat(depth)}${targetFromRepoRoot.replace(/^\.\//, '')}`;
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

function readText(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function listPlanSpwFiles(dir = PLANS_ROOT) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const absPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...listPlanSpwFiles(absPath));
    else if (entry.isFile() && entry.name.endsWith('.spw')) files.push(absPath);
  }
  return files;
}

function findMissingLocalIndexRefs(files) {
  const missing = [];

  for (const filePath of files.filter((candidate) => path.basename(candidate) === 'index.spw').sort()) {
    const content = readText(filePath);
    for (const match of content.matchAll(/~"((?:\.\/|\.\.\/)[^"]+)"/g)) {
      const ref = match[1];
      const targetRef = ref.split(/[?#]/, 1)[0];
      if (!targetRef) continue;

      const targetPath = path.resolve(path.dirname(filePath), targetRef);
      if (fs.existsSync(targetPath)) continue;

      missing.push({
        file: path.relative(REPO_ROOT, filePath),
        line: content.slice(0, match.index).split('\n').length,
        ref,
        target: path.relative(REPO_ROOT, targetPath),
      });
    }
  }

  return missing.sort(
    (a, b) =>
      a.file.localeCompare(b.file) ||
      a.line - b.line ||
      a.ref.localeCompare(b.ref) ||
      a.target.localeCompare(b.target),
  );
}

function guardReviewedPlanTree() {
  const files = listPlanSpwFiles();
  const reviewed = files.filter((filePath) => REVIEW_MARKER.test(readText(filePath)));
  if (!reviewed.length) return false;

  const unreviewed = files.filter((filePath) => !REVIEW_MARKER.test(readText(filePath)));
  if (CHECK) {
    if (unreviewed.length) {
      console.error(`Reviewed plan tree is incomplete: ${unreviewed.length} .spw file(s) lack a first-line review decision.`);
      process.exit(1);
    }

    const missingRefs = findMissingLocalIndexRefs(reviewed);
    if (missingRefs.length) {
      console.error(`Reviewed plan index references are broken: ${missingRefs.length} local target(s) are missing.`);
      for (const missing of missingRefs) {
        console.error(`- ${missing.file}:${missing.line} -> ${missing.ref} (missing ${missing.target})`);
      }
      process.exit(1);
    }

    console.log(
      `Reviewed plan .spw artifacts OK (${reviewed.length} authored decisions; local index refs resolved; generation skipped).`,
    );
    return true;
  }

  if (!FORCE_GENERATED) {
    console.error(
      `Refusing to overwrite ${reviewed.length} reviewed plan .spw file(s). ` +
      'Read and edit the affected files individually, or pass --force-generated only for an explicit destructive rebuild.',
    );
    process.exit(1);
  }
  return false;
}

function sectionText(markdown, heading) {
  const pattern = new RegExp(`^##\\s+${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'im');
  const match = pattern.exec(markdown);
  if (!match) return '';
  const start = match.index + match[0].length;
  const rest = markdown.slice(start);
  const next = rest.search(/^##\s+/m);
  return (next === -1 ? rest : rest.slice(0, next)).trim();
}

function firstParagraph(markdown) {
  for (const line of markdown.split('\n')) {
    if (/^#/.test(line)) continue;
    if (!line.trim()) continue;
    return line.trim();
  }
  return '';
}

function bulletLines(text, limit = 4) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^[-*]/.test(line) || /^\d+\./.test(line))
    .map((line) => line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '').replace(/\*\*/g, '').trim())
    .filter(Boolean)
    .slice(0, limit);
}

function extractPathRefs(markdown) {
  const refs = new Set();
  const patterns = [
    /`((?:\.spw|public|topics|scripts|design|settings|about|play|contact|types)[^`]+)`/g,
    /`(\.agents\/[^`]+)`/g,
    /`((?:index|topics|design|settings|about|play|contact)[^`]*index\.html[^`]*)`/g,
    /`((?:runtime|interface|kernel|semantic|modules)\/[^`]+)`/g,
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

function extractRelatedPlans(markdown, selfSlug) {
  const related = new Set();
  for (const match of markdown.matchAll(/`([^`]*\.agents\/plans\/([a-z0-9-]+)\/(?:PLAN|FIX)\.md)`/gi)) {
    if (match[2] !== selfSlug) related.add(match[2]);
  }
  for (const match of markdown.matchAll(/`([a-z0-9-]+)\/(?:PLAN|FIX)\.md`/gi)) {
    if (match[1] !== selfSlug && !match[1].includes('/')) related.add(match[1]);
  }
  for (const match of markdown.matchAll(/([\w-]+)\/\s*-\s/g)) {
    if (match[1] !== selfSlug && match[1].length > 3) related.add(match[1]);
  }
  return [...related].slice(0, 6);
}

function resolveRepoPath(ref) {
  const cleaned = ref.replace(/\?v=[^/]+$/i, '');
  const candidates = [cleaned];
  if (/^(runtime|interface|kernel|semantic|modules)\//.test(cleaned)) {
    candidates.push(path.posix.join('public/js', cleaned));
  }
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(REPO_ROOT, candidate))) return candidate;
  }
  return null;
}

function classifyBucket(slug, relDir, files, kind) {
  if (relDir.startsWith('archive/')) return 'archive';
  if (COMPLETED_REFERENCE.has(slug)) return 'completed_reference';
  if (kind === 'fix' || (files.includes('FIX.md') && !files.includes('PLAN.md'))) return 'fix_queue';
  if (CANONICAL_TRACKS.has(slug)) return 'canonical_tracks';
  for (const [bucket, slugs] of Object.entries(BUCKETS)) {
    if (slugs.has(slug)) return bucket;
  }
  return 'active_backlog';
}

function buildDimensions(meta, bucket) {
  const practice =
    meta.kind === 'fix' ? 'observation | gesture' : meta.refs.length ? 'reading | observation | tending' : 'reading | tending';
  const semantic = CONTRACT_RAILS.has(meta.slug) ? 'semantics | pragmatics' : 'pragmatics';
  const phase =
    meta.kind === 'fix' ? 'exchange' : bucket === 'archive' || bucket === 'completed_reference' ? 'return' : 'tending';
  const memory =
    bucket === 'archive' || bucket === 'completed_reference'
      ? 'cold'
      : CONTRACT_RAILS.has(meta.slug)
        ? 'warm'
        : 'hot';
  return { practice_depth: practice, semantic_layer: semantic, collaboration_phase: phase, memory_tier: memory };
}

function extractConcepts(goal, title, limit = 5) {
  const text = `${title} ${goal}`.toLowerCase();
  const stop = new Set(['the', 'and', 'for', 'with', 'this', 'that', 'from', 'into', 'site', 'plan', 'work', 'keep', 'make', 'use', 'when', 'should', 'without', 'through', 'before', 'after', 'more', 'less', 'not', 'are', 'was', 'has', 'have', 'been', 'being', 'will', 'can', 'may', 'also', 'only', 'first', 'next', 'still', 'current', 'active', 'public', 'local', 'shared', 'route', 'routes', 'file', 'files']);
  const words = text.match(/[a-z][a-z0-9-]{2,}/g) || [];
  const freq = new Map();
  for (const word of words) {
    if (stop.has(word)) continue;
    freq.set(word, (freq.get(word) || 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

function buildConceptualModel(meta, slug) {
  const hand = PLAN_REFINEMENTS[slug]?.conceptual;
  const thesis = hand?.thesis || summarizeGoal(meta.goal || meta.title, 120);
  const concepts = hand?.concepts?.length ? hand.concepts : extractConcepts(meta.goal, meta.title);
  const surfaces = hand?.surfaces?.length
    ? hand.surfaces
    : meta.refs.slice(0, 4).map((r) => r.replace(/^public\//, ''));
  const fixityTier = meta.fixity === 'cold' ? 'cold' : CONTRACT_RAILS.has(meta.slug) ? 'stable' : meta.fixity;
  const lines = [
    '^"conceptual_model"{',
    ` thesis = \`${escapeSpwString(thesis)}\``,
  ];
  if (concepts.length) {
    lines.push(' concepts = #[', ...concepts.map((c) => `  \`${c}\`,`), ' ][reg=set]');
  }
  if (surfaces.length) {
    lines.push(' surfaces = #[', ...surfaces.map((s) => `  \`${escapeSpwString(s)}\`,`), ' ][reg=set]');
  }
  lines.push(` fixity_tier = \`${fixityTier}\``, '}[reg=facet]', '');
  return lines.join('\n');
}

function buildPlanRefinement(slug) {
  const ref = PLAN_REFINEMENTS[slug]?.refinement;
  if (!ref) return '';
  return [
    '^"plan_refinement"{',
    ` tone = \`${escapeSpwString(ref.tone)}\``,
    ` accuracy = \`${escapeSpwString(ref.accuracy)}\``,
    ` direction = \`${escapeSpwString(ref.direction)}\``,
    ` inspiration = \`${escapeSpwString(ref.inspiration)}\``,
    ` alignment = \`${escapeSpwString(ref.alignment)}\``,
    '}[reg=facet]',
    '',
  ].join('\n');
}

function buildResearchBridge(slug, bucket) {
  const rows = [...(RESEARCH_BRIDGE_BY_SLUG[slug] || []), ...(RESEARCH_BRIDGE_BY_BUCKET[bucket] || [])];
  const seen = new Set();
  const unique = rows.filter((row) => {
    if (seen.has(row.path)) return false;
    seen.add(row.path);
    return true;
  });
  if (!unique.length) return '';
  return [
    '^"research_bridge"{',
    ' local_research = #[',
    ...unique.slice(0, 5).map((row) => `  .{ label = \`${row.label}\` ; path = \`${row.path}\` }[reg=facet],`),
    ' ][reg=set]',
    ' rule = `Repo-local audits/appendices/conventions — not external web.`',
    '}[reg=facet]',
    '',
  ].join('\n');
}

function buildConnectionPoints(meta, slug) {
  const lines = ['^"connection_points"{'];
  if (meta.bucket === 'semantic_rails') {
    lines.push(' owner_rail = `self`');
  } else if (meta.bucket === 'active_backlog' || meta.bucket === 'css_layout_interaction') {
    const rail =
      meta.slug.includes('language') || meta.slug.includes('spw')
        ? 'spw-architecture-ecology'
        : meta.slug.includes('css') || meta.slug.includes('shell')
          ? 'css-architecture-readability'
          : meta.slug.includes('runtime') || meta.slug.includes('js')
            ? 'runtime-bootstrap-performance'
            : 'model-guided-refinement';
    lines.push(` owner_rail = \`${rail}\``);
  }
  if (meta.relatedPlans.length) {
    lines.push(' related_plans = #[', ...meta.relatedPlans.map((p) => `  \`${p}\`,`), ' ][reg=set]');
  }
  const completed = COMPLETED_REFERENCE.get(slug);
  if (completed?.superseded_by) {
    lines.push(` superseded_by = \`${completed.superseded_by}\``);
  }
  lines.push('}[reg=facet]', '');
  return lines.join('\n');
}

function buildArchiveStatus(slug, bucket, meta) {
  if (bucket !== 'completed_reference' && bucket !== 'archive') return '';
  const completed = COMPLETED_REFERENCE.get(slug);
  const status = bucket === 'archive' ? 'archived' : 'completed_reference';
  const lines = [
    '^"archive_status"{',
    ` status = \`${status}\``,
    ` archive_note = \`.agents/plans/archive/2026-07-12-plan-ecology-semantics-architecture.md\``,
    ` retain_reason = \`Direct citations preserved — virtual bucket not physical move.\``,
  ];
  if (completed?.research) {
    lines.push(` research_pointer = \`${completed.research}\``);
  } else if (bucket === 'archive') {
    lines.push(' research_pointer = `commit-history-deep-2026-07`');
  }
  if (meta.kind === 'fix') lines.push(' kind = `fix`');
  lines.push('}[reg=facet]', '');
  return lines.join('\n');
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
  goal = goal.replace(/\s+/g, ' ').trim().replace(/^[-*]\s+/, '');

  const scopeSection = sectionText(source, 'Scope');
  const scopeIn = bulletLines(scopeSection.split(/out of scope/i)[0] || scopeSection, 4);
  const scopeOut = bulletLines((scopeSection.match(/out of scope([\s\S]*)/i) || [])[1] || '', 3);

  const validation = bulletLines(
    sectionText(source, 'Validation') || sectionText(source, 'Validation Loop'),
    6,
  );

  const nextAction = bulletLines(
    sectionText(source, 'First Concrete Steps') ||
      sectionText(source, 'Phases And Gates') ||
      sectionText(source, 'Phases') ||
      sectionText(source, 'Planned Fix'),
    1,
  )[0];

  const openQuestions = bulletLines(sectionText(source, 'Open Questions'), 3);

  const refs = extractPathRefs(source)
    .map((ref) => resolveRepoPath(ref))
    .filter(Boolean)
    .slice(0, 8);

  const relatedPlans = extractRelatedPlans(source, slug);

  let operation = 'prime';
  if (COMPLETED_REFERENCE.has(slug)) operation = 'archive';
  else if (kind === 'fix') operation = 'audit';
  else if (CONTRACT_RAILS.has(slug)) operation = 'contract';
  else if (/cache|insight/i.test(slug)) operation = 'cache';

  let fixity = 'tending';
  if (CONTRACT_RAILS.has(slug)) fixity = 'stable';
  if (relDir.startsWith('archive/') || COMPLETED_REFERENCE.has(slug)) fixity = 'cold';

  const bucket = classifyBucket(slug, relDir, files, kind);
  const dimensions = buildDimensions({ kind, slug, refs }, bucket);

  return {
    slug,
    kind,
    title,
    goal,
    scopeIn,
    scopeOut,
    validation,
    nextAction,
    openQuestions,
    refs,
    relatedPlans,
    operation,
    fixity,
    bucket,
    dimensions,
    hasPlan,
    hasFix,
  };
}

function artifactShape(files) {
  const parts = [];
  if (files.includes('PLAN.md')) parts.push('PLAN.md');
  if (files.includes('FIX.md')) parts.push('FIX.md');
  if (files.includes('wip.spw')) parts.push('wip.spw');
  const named = files.filter((f) => f.endsWith('.spw') && f !== 'wip.spw' && f !== 'index.spw');
  return [...parts, ...named.sort(), 'index.spw'];
}

function buildOwnerClaim(meta, relDir) {
  const claimId = `plan-${slugToAnchor(meta.slug)}-001`;
  const implRef = meta.refs[0]
    ? relUp(relDir, meta.refs[0])
    : meta.hasPlan
      ? './PLAN.md'
      : './FIX.md';
  const probeRef = meta.validation[0] || `rg '${meta.slug}' .agents/plans/${meta.slug}`;
  const falsification = meta.kind === 'fix'
    ? `The listed failure mode returns after the planned fix lands.`
    : `A patch cannot satisfy the public goal while leaving ${implRef} unchanged or untested.`;

  const status =
    meta.bucket === 'completed_reference' ? 'superseded' : meta.bucket === 'archive' ? 'superseded' : 'active';

  return [
    '^"owner_claim"{',
    ` claim_id = "${claimId}"`,
    ` layer = "pragmatic"`,
    ` hypothesis = \`${escapeSpwString(meta.goal)}\``,
    ` spec_ref = ${meta.hasPlan ? '~"./PLAN.md"' : '~"./FIX.md"'}`,
    ` impl_ref = ~"${implRef}"`,
    ` probe_ref = \`${escapeSpwString(probeRef)}\``,
    ` falsification = \`${escapeSpwString(falsification)}\``,
    ` status = "${status}"`,
    '}[reg=facet]',
  ];
}

function buildEditorPrompts(meta) {
  const docRef = meta.hasPlan ? '@plan' : '@fix';
  const lines = [
    'editor_prompts: #[',
    ` .{ ask = \`What does ${meta.slug} own, and what should stay out of scope?\`, see = ${docRef} }[reg=facet],`,
    ` .{ ask = \`Which file should I open first to implement the next slice of ${meta.slug}?\`, see = @index }[reg=facet],`,
  ];
  if (PLAN_REFINEMENTS[meta.slug]) {
    lines.push(
      ` .{ ask = \`What is the tone, direction, and alignment for ${meta.slug}?\`, see = @index#plan_refinement }[reg=facet],`,
    );
  }
  if (meta.validation.length) {
    lines.push(
      ` .{ ask = \`What command or check falsifies whether ${meta.slug} still holds?\`, see = ${docRef} }[reg=facet],`,
    );
  }
  lines.push('][reg=set]');
  return lines;
}

function buildDimensionsBlock(meta) {
  const d = meta.dimensions;
  return [
    '^"dimensions"{',
    ` practice_depth = "${d.practice_depth}"`,
    ` semantic_layer = "${d.semantic_layer}"`,
    ` collaboration_phase = "${d.collaboration_phase}"`,
    ` memory_tier = "${d.memory_tier}"`,
    ` bucket = "${meta.bucket}"`,
    '}[reg=facet]',
  ];
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
    ` bucket = \`${meta.bucket}\``,
    ` artifact_shape = \`${artifactShape(files).join(' | ')}\``,
    '}[reg=facet]',
    '',
    ...buildDimensionsBlock(meta),
    '',
    buildConceptualModel(meta, slug),
    buildPlanRefinement(slug),
    `@plans_root: ~"${relUp(relDir, '.agents/plans/index.spw')}"`,
    `@plan_index_convention: ~"${relUp(relDir, '.spw/conventions/plan-index.spw')}"`,
    `@wip_notebook: ~"${relUp(relDir, '.spw/conventions/wip-notebook.spw')}"`,
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

  for (const name of listNamedSpwFiles(path.join(PLANS_ROOT, relDir))) {
    const key = slugToAnchor(path.basename(name, '.spw'));
    lines.push(`@${key}: ~"./${name}"`);
    dispatch.push(` ${key} = @${key}`);
  }

  for (const related of meta.relatedPlans) {
    const key = `plan_${slugToAnchor(related)}`;
    const relatedRel = relDir.includes('/')
      ? `${path.posix.dirname(relDir)}/${related}`
      : related;
    const relatedPath = path.join(PLANS_ROOT, relatedRel, 'index.spw');
    if (!fs.existsSync(relatedPath)) continue;
    const relPath = `../${related}/index.spw`;
    lines.push(`@${key}: ~"${relPath}"`);
    dispatch.push(` ${key} = @${key}`);
  }

  for (const refPath of meta.refs) {
    const key = slugToAnchor(path.basename(refPath, path.extname(refPath)));
    const uniqueKey =
      meta.refs.filter((r) => slugToAnchor(path.basename(r, path.extname(r))) === key).length > 1
        ? slugToAnchor(refPath.replace(/[/.]/g, '_'))
        : key;
    const alias = `@${uniqueKey}`;
    if (lines.some((line) => line.startsWith(`${alias}:`))) continue;
    lines.push(`${alias}: ~"${relUp(relDir, refPath)}"`);
    dispatch.push(` ${uniqueKey} = ${alias}`);
  }

  lines.push('', 'dispatch: .{', ...dispatch, '}[reg=facet]', '');

  const researchBridge = buildResearchBridge(slug, meta.bucket);
  if (researchBridge) lines.push(researchBridge);

  const connectionPoints = buildConnectionPoints(meta, slug);
  if (connectionPoints && !connectionPoints.match(/\^"connection_points"\{\s*\}\[reg=facet\]/)) {
    lines.push(connectionPoints);
  }

  const archiveStatus = buildArchiveStatus(slug, meta.bucket, meta);
  if (archiveStatus) lines.push(archiveStatus);

  lines.push(...buildOwnerClaim(meta, relDir), '');

  if (meta.nextAction) {
    lines.push('next_action: .{', ` step = \`${escapeSpwString(meta.nextAction)}\``, '}[reg=facet]', '');
  }

  if (meta.scopeIn.length || meta.scopeOut.length) {
    lines.push('scope: .{');
    if (meta.scopeIn.length) {
      lines.push(' in = #[', ...meta.scopeIn.map((item) => `  \`${escapeSpwString(item)}\`,`), ' ][reg=set]');
    }
    if (meta.scopeOut.length) {
      lines.push(' out = #[', ...meta.scopeOut.map((item) => `  \`${escapeSpwString(item)}\`,`), ' ][reg=set]');
    }
    lines.push('}[reg=facet]', '');
  }

  if (meta.validation.length) {
    lines.push('validation: #[', ...meta.validation.map((item) => ` \`${escapeSpwString(item)}\`,`), '][reg=set]', '');
  }

  if (meta.openQuestions.length) {
    lines.push(
      'open_questions: #[',
      ...meta.openQuestions.map((q) => ` .{ ask = \`${escapeSpwString(q)}\` }[reg=facet],`),
      '][reg=set]',
      '',
    );
  }

  lines.push(
    ...buildEditorPrompts(meta),
    '',
    'invariants: #[',
    ` \`Owner intent: ${summarizeGoal(meta.goal, 140)}\`,`,
    " `PLAN.md or FIX.md sequences; index.spw routes inspection and selection.`,",
    " `Promote durable owner_claim patterns to .spw/slices/ or .spw/conventions/.`,",
    '][reg=set]',
    '',
  );

  return `${lines.join('\n')}\n`;
}

function buildSelectionProbes(meta) {
  const probes = [
    `rg '${meta.slug}' ${meta.refs[0] || 'public'}`,
    meta.validation[0] ? escapeSpwString(meta.validation[0]) : `rg '${meta.slug}' .agents/plans`,
  ];
  if (meta.refs[0]) probes.push(`test -f ${meta.refs[0]}`);
  return [...new Set(probes)].slice(0, 4);
}

function normalizeBlockSpacing(content) {
  return content.replace(/\}\[reg=facet\]\n(\^")/g, '}[reg=facet]\n\n$1');
}

function upsertBlock(content, blockName, block) {
  const pattern = new RegExp(`^\\^"${blockName}"\\{[\\s\\S]*?\\}\\[reg=facet\\]\\n*`, 'm');
  const next = pattern.test(content) ? content.replace(pattern, block) : (() => {
    const insertAfter = content.match(/^(operation = "[^"]+"\nfixity = "[^"]+"\n\n)/m);
    if (insertAfter) return content.replace(insertAfter[0], `${insertAfter[0]}${block}`);
    return `${block}${content}`;
  })();
  return normalizeBlockSpacing(next);
}

function ensureWipLinkage(content, relDir) {
  const plansRoot = `@plans_root: ~"${relUp(relDir, '.agents/plans/index.spw')}"`;
  if (content.includes('@plans_root:')) return content;
  return content.replace(/@index: ~"\.\/index\.spw"\n/, `$&${plansRoot}\n`);
}

function buildPlanContextBlock(meta, slug) {
  const lines = [
    '^"plan_context"{',
    ` goal = \`${escapeSpwString(meta.goal)}\``,
    ` owner = \`${slug}\``,
    ` operation = "${meta.operation}"`,
    ` bucket = "${meta.bucket}"`,
  ];
  if (meta.nextAction) lines.push(` next_action = \`${escapeSpwString(meta.nextAction)}\``);
  if (meta.validation.length) {
    lines.push(` validation = #[${meta.validation.map((item) => ` \`${escapeSpwString(item)}\`,`).join('')} ][reg=set]`);
  }
  if (meta.refs.length) {
    lines.push(` hot_files = #[${meta.refs.slice(0, 6).map((item) => ` \`${item}\`,`).join('')} ][reg=set]`);
  }
  lines.push('}[reg=facet]', '');
  return lines.join('\n');
}

function buildSelectionProbesBlock(meta) {
  const probes = buildSelectionProbes(meta);
  return [
    '^"selection_probes"{',
    ` probes = #[${probes.map((p) => ` \`${p}\`,`).join('')} ][reg=set]`,
    ` rule = "Run probes before trusting cached plan_context."`,
    '}[reg=facet]',
    '',
  ].join('\n');
}

function customizeWip(content, slug, relDir, meta) {
  const anchor = `plan_${slugToAnchor(slug)}_wip`;
  let next = content;

  if (!content.includes(`#>${anchor}`) && !/#:operation\s+#!/.test(content)) {
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
      `@plans_root: ~"${relUp(relDir, '.agents/plans/index.spw')}"`,
      `@wip_notebook: ~"${relUp(relDir, '.spw/conventions/wip-notebook.spw')}"`,
      '',
      `operation = "${meta.operation}"`,
      'fixity = "tending"',
      '',
    ].join('\n');
    let body = content.replace(/^\uFEFF?/, '').trimStart();
    if (/^#\s*wip\b/i.test(body)) body = body.replace(/^#[^\n]*\n(?:#[^\n]*\n)*/, '');
    body = body.replace(/^(?:#:layer[^\n]*\n)+/m, '').trimEnd();
    next = body ? `${header}${body}\n` : `${header.trimEnd()}\n`;
  }

  next = upsertBlock(next, 'plan_context', buildPlanContextBlock(meta, slug));
  next = upsertBlock(next, 'selection_probes', buildSelectionProbesBlock(meta));
  return ensureWipLinkage(next, relDir);
}

function buildOperationalHooks(meta) {
  if (!meta.refs.length && !meta.validation.length) return '';
  return [
    '^"operational_hooks"{',
    ` selectors = #[${meta.refs.slice(0, 4).map((r) => ` \`${r}\`,`).join('')} ][reg=set]`,
    meta.validation[0] ? ` probe_ref = \`${escapeSpwString(meta.validation[0])}\`` : '',
    ` owner_claim = ~"./index.spw#owner_claim"`,
    '}[reg=facet]',
    '',
  ]
    .filter(Boolean)
    .join('\n');
}

function customizeNamedSpw(content, meta, slug) {
  const planRef = meta.hasPlan ? ' plan = ~"./PLAN.md"' : ' fix = ~"./FIX.md"';
  const linkage = [
    '^"plan_linkage"{',
    planRef,
    ' index = ~"./index.spw"',
    ` goal = \`${escapeSpwString(meta.goal)}\``,
    ` owner = \`${slug}\``,
    ` bucket = "${meta.bucket}"`,
    '}[reg=facet]',
    '',
  ].join('\n');

  let next = upsertBlock(content, 'plan_linkage', linkage);
  const hooks = buildOperationalHooks(meta);
  if (hooks) next = upsertBlock(next, 'operational_hooks', hooks);
  return next;
}

function customizeInsightCache(content, filename, parentMeta) {
  const label = filename.replace(/\.spw$/, '').replace(/-cache$/, '').replace(/_/g, ' ');
  const linkage = [
    '^"plan_linkage"{',
    ' plan = ~"../PLAN.md"',
    ' index = ~"../index.spw"',
    ` goal = \`${escapeSpwString(parentMeta.goal)}\``,
    ` cache_topic = \`${escapeSpwString(label)}\``,
    ` operation = "cache"`,
    '}[reg=facet]',
    '',
  ].join('\n');
  return upsertBlock(content, 'plan_linkage', linkage);
}

function buildPlansRootIndex(planEntries) {
  const bucketOrder = [
    'canonical_tracks',
    'semantic_rails',
    'css_layout_interaction',
    'runtime_js_validation',
    'media_image_sensory',
    'public_route_proof_genre',
    'fix_queue',
    'active_backlog',
    'completed_reference',
    'archive',
    'templates_tooling',
  ];

  const grouped = Object.fromEntries(bucketOrder.map((b) => [b, []]));
  for (const entry of planEntries) {
    const bucket = grouped[entry.meta.bucket] ? entry.meta.bucket : 'active_backlog';
    grouped[bucket].push(entry);
  }

  const lines = [
    '# Plans Root Index',
    '#',
    '# Virtual-bucket dispatch across .agents/plans/.',
    '',
    '#>plans_root_index',
    '#:index #!plans #!agents',
    '#:operation #!align',
    '#:layer #!editor_inspectability',
    '',
    'operation = "align"',
    'fixity = "stable"',
    '',
    'intent: .{',
    ' goal = `Route agents and editors through plan folders by virtual bucket, operation, and owner_claim instead of directory name alone.`',
    ' scope = `Active plan ecology under .agents/plans/; excludes recent-plan-templates tooling.`',
    '}[reg=facet]',
    '',
    '^"dimensions"{',
    ' practice_depth = "reading | observation"',
    ' semantic_layer = "pragmatics | semantics"',
    ' collaboration_phase = "exchange | tending"',
    ' memory_tier = "hot | warm"',
    '}[reg=facet]',
    '',
    '@readme: ~"./README.md"',
    '@planning_ecology: ~"../../.spw/conventions/planning-ecology.spw"',
    '@plan_index_convention: ~"../../.spw/conventions/plan-index.spw"',
    '@wip_notebook: ~"../../.spw/conventions/wip-notebook.spw"',
    '@maintain_script: ~"../../scripts/maintain-plan-directory-indexes.mjs"',
    '@plan_ecology_semantics: ~"../../.spw/audits/plan-ecology-semantics-2026-07.spw"',
    '@planning_ecology_convention: ~"../../.spw/conventions/planning-ecology.spw#research_bridge_map"',
    '',
    'reading_order: .{',
    ' sequence = ?< @planning_ecology, @plan_index_convention, @readme >[reg=stream]',
    ' rule = `Read ecology + convention, then bucket dispatch, then a plan index.spw.`',
    '}[reg=facet]',
    '',
  ];

  const dispatch = ['readme', 'planning_ecology', 'plan_index_convention', 'wip_notebook', 'maintain_script', 'plan_ecology_semantics'];
  const dispatchLines = [
    ' readme = @readme',
    ' planning_ecology = @planning_ecology',
    ' plan_index_convention = @plan_index_convention',
    ' wip_notebook = @wip_notebook',
    ' maintain_script = @maintain_script',
    ' plan_ecology_semantics = @plan_ecology_semantics',
  ];

  for (const bucket of bucketOrder) {
    const entries = grouped[bucket].sort((a, b) => a.slug.localeCompare(b.slug));
    if (!entries.length) continue;
    const bucketAnchor = slugToAnchor(bucket);
    lines.push(`^"${bucket}"{`);
    lines.push(` label = "${bucket.replace(/_/g, ' ')}"`);
    lines.push(` count = ${entries.length}`);
    lines.push(' members = #[', ...entries.map((e) => `  \`${e.slug}\`,`), ' ][reg=set]');
    lines.push('}[reg=facet]', '');

    for (const entry of entries) {
      const key = `plan_${slugToAnchor(entry.slug)}`;
      const relPath = `./${entry.relDir}/index.spw`;
      lines.push(`@${key}: ~"${relPath}"`);
      dispatch.push(key);
      dispatchLines.push(` ${key} = @${key}`);
    }
  }

  lines.push(
    'dispatch: .{',
    ...dispatchLines,
    '}[reg=facet]',
    '',
    'editor_prompts: #[',
    ' .{ ask = `Which virtual bucket owns this class of work?`, see = @readme }[reg=facet],',
    ' .{ ask = `What is the smallest plan index to open for a bounded patch?`, see = @plan_index_convention }[reg=facet],',
    ' .{ ask = `Where is local research for this bucket?`, see = @planning_ecology_convention }[reg=facet],',
    ' .{ ask = `What landed work is completed_reference?`, see = @plan_ecology_semantics }[reg=facet],',
    ' .{ ask = `What are tone, direction, and alignment for this plan?`, see = @plan_index_convention#plan_refinement_template }[reg=facet],',
    '][reg=set]',
    '',
    'invariants: #[',
    ' `Every listed plan folder exposes ./<slug>/index.spw.`',
    ' `Virtual buckets mirror .agents/plans/README.md before physical folder moves.`',
    ' `Regenerate this root index with scripts/maintain-plan-directory-indexes.mjs.`',
    '][reg=set]',
    '',
  );

  return `${lines.join('\n')}\n`;
}

function main() {
  if (guardReviewedPlanTree()) return;

  const planDirs = listPlanDirectories(PLANS_ROOT).sort();
  const planEntries = [];
  let changed = 0;
  let checkedMismatch = 0;

  for (const relDir of planDirs) {
    const absDir = path.join(PLANS_ROOT, relDir);
    const slug = path.basename(relDir);
    const files = fs.readdirSync(absDir);
    const meta = parsePlanArtifact(absDir, slug, files, relDir);
    planEntries.push({ relDir, slug, meta, files });

    const targets = [{ path: path.join(absDir, 'index.spw'), next: buildIndexContent(slug, relDir, files, meta) }];

    if (files.includes('wip.spw')) {
      targets.push({
        path: path.join(absDir, 'wip.spw'),
        next: customizeWip(readText(path.join(absDir, 'wip.spw')), slug, relDir, meta),
      });
    }

    for (const name of listNamedSpwFiles(absDir)) {
      if (name.endsWith('.template.spw') || name === 'semantic-insight-cache.spw') continue;
      const spwPath = path.join(absDir, name);
      const parentDir = path.dirname(absDir);
      const parentFiles = fs.existsSync(parentDir) ? fs.readdirSync(parentDir) : files;
      const parentMeta = readText(path.join(parentDir, 'PLAN.md'))
        ? parsePlanArtifact(parentDir, path.basename(parentDir), parentFiles, path.basename(parentDir))
        : meta;
      const nextSpw = name.includes('cache')
        ? customizeInsightCache(readText(spwPath), name, parentMeta)
        : customizeNamedSpw(readText(spwPath), meta, slug);
      targets.push({ path: spwPath, next: nextSpw });
    }

    for (const { path: filePath, next } of targets) {
      const current = readText(filePath);
      if (current === next) continue;
      if (CHECK) {
        checkedMismatch += 1;
        continue;
      }
      fs.writeFileSync(filePath, next.endsWith('\n') ? next : `${next}\n`);
      changed += 1;
    }
  }

  const rootIndex = buildPlansRootIndex(planEntries);
  const currentRoot = readText(PLANS_INDEX);
  if (currentRoot !== rootIndex) {
    if (CHECK) checkedMismatch += 1;
    else {
      fs.writeFileSync(PLANS_INDEX, rootIndex);
      changed += 1;
    }
  }

  if (CHECK) {
    if (checkedMismatch) {
      console.error(`Plan .spw drift: ${checkedMismatch} file(s) need refresh.`);
      process.exit(1);
    }
    console.log(`Plan .spw artifacts OK (${planDirs.length} directories + root index).`);
    return;
  }

  console.log(`Updated ${changed} plan .spw file(s) across ${planDirs.length} directories + root index.`);
}

main();
