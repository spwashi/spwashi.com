#!/usr/bin/env node
/**
 * `check:agents` — verify model adapters exist, stay tracked, and emphasize
 * a focus without pretending one model owns the whole operating contract.
 *
 * AGENTS.md is the gate. Adapters are short relative-strength reminders.
 *
 * Word budgets are the block. Written rules in markdown are suggestions;
 * a failing check is not. Always-on context is I/O, not thinking.
 * Spend prints by default; `--quiet` hides the table. `--spend` is kept as a no-op alias.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '..');

export const SHARED_EMPHASIS = 'This adapter emphasizes one focus. AGENTS.md is the gate. Any model still follows Open first.';
export const SHARED_WRITE_DENY = 'Explore/plan do not write';

/**
 * Do not Read a PLAN.md over this many lines unless Open first named that file.
 * Enforced here as the default line budget for every file the AGENTS.md
 * "Open first" tables route to: following Open first must never force an
 * over-budget read.
 */
export const SHUNT_MIN_LINES = 200;

/**
 * Open-first targets already measured above SHUNT_MIN_LINES. A ratchet, not
 * amnesty: each cap sits just above today's count, so growth fails. Reduce
 * toward SHUNT_MIN_LINES; delete the entry once the file fits.
 */
export const OPEN_FIRST_LINE_OVERRIDES = Object.freeze({
  '.agents/plans/css-architecture-readability/PLAN.md': 850,
  '.spw/conventions/attention-field.spw': 390,
  '.spw/language/feature-utilization.spw': 330,
  '.agents/plans/history-reflow/PLAN.md': 230,
});

export const ADAPTER_MAX_WORDS = 280;

export const MODEL_SPECS = Object.freeze([
  {
    name: 'Claude',
    file: 'CLAUDE.md',
    maxWords: ADAPTER_MAX_WORDS,
    requiredPhrases: [
      'AGENTS.md',
      'check:local',
      '#[episode]{',
      SHARED_EMPHASIS,
      SHARED_WRITE_DENY,
      'Constitutional Rigor',
      'spw:integrity',
    ],
  },
  {
    name: 'Grok',
    file: 'GROK.md',
    maxWords: ADAPTER_MAX_WORDS,
    requiredPhrases: [
      'AGENTS.md',
      'check:local',
      '#[episode]{',
      SHARED_EMPHASIS,
      SHARED_WRITE_DENY,
      'Anti-Bloat & Signal',
      'cache',
      'npm run wonder',
      'npm run spw:lattice',
    ],
  },
  {
    name: 'Gemini',
    file: 'GEMINI.md',
    maxWords: ADAPTER_MAX_WORDS,
    requiredPhrases: [
      'AGENTS.md',
      'check:local',
      '#[episode]{',
      SHARED_EMPHASIS,
      SHARED_WRITE_DENY,
      'Progressive Mastery',
      'visual:checks',
    ],
  },
  {
    name: 'GPT',
    file: 'GPT.md',
    maxWords: ADAPTER_MAX_WORDS,
    requiredPhrases: [
      'AGENTS.md',
      'check:local',
      '#[episode]{',
      SHARED_EMPHASIS,
      SHARED_WRITE_DENY,
      'Contract Exactness',
      'verify-first',
      'one named patch',
      'visual:checks -- --ids=',
    ],
  },
  {
    name: 'Cursor',
    file: '.cursorrules',
    maxWords: ADAPTER_MAX_WORDS,
    requiredPhrases: ['AGENTS.md', 'check:local', '#[episode]{', SHARED_EMPHASIS, SHARED_WRITE_DENY],
  },
  {
    name: 'GitHub Copilot',
    file: '.github/copilot-instructions.md',
    maxWords: ADAPTER_MAX_WORDS,
    requiredPhrases: ['AGENTS.md', 'check:local', '#[episode]{', SHARED_EMPHASIS, SHARED_WRITE_DENY],
  },
]);

export const HARNESS_SPECS = Object.freeze([
  {
    file: '.spw/conventions/agent-ecology.spw',
    requiredPhrases: ['^"harness"', SHARED_WRITE_DENY, 'visual:checks -- --ids', 'Do not add ASTRA.md', 'npm run sense'],
  },
  {
    file: '.claude/settings.json',
    requiredPhrases: ['Bash(git stash*)', 'harness-write-gate.mjs', 'Write|Edit'],
  },
  {
    file: 'scripts/harness-write-gate.mjs',
    requiredPhrases: [SHARED_WRITE_DENY],
  },
]);

export const ALWAYS_ON_SPECS = Object.freeze([
  {
    file: 'AGENTS.md',
    maxWords: 3200,
    kind: 'gate',
    requiredPhrases: ['Sense first', SHARED_WRITE_DENY, 'visual:checks -- --ids', 'npm run sense'],
  },
  { file: '.agents/MEMORY.md', maxWords: 1200, kind: 'memory' },
  {
    file: '.agents/plans/agent-optimization/PLAN.md',
    maxWords: 1500,
    maxLines: 120,
    kind: 'open-first-gate',
  },
]);

export function countWords(text) {
  return String(text).trim().split(/\s+/).filter(Boolean).length;
}

export function countLines(text) {
  if (text == null || text === '') return 0;
  return String(text).replace(/\n$/, '').split(/\n/).length;
}

export function inspectWordBudget(spec, content) {
  const issues = [];
  const words = countWords(content);
  const lines = countLines(content);
  if (spec.maxWords != null && words > spec.maxWords) {
    issues.push(`${words} words exceeds budget ${spec.maxWords}`);
  }
  if (spec.maxLines != null && lines > spec.maxLines) {
    issues.push(`${lines} lines exceeds budget ${spec.maxLines}`);
  }
  return { ok: issues.length === 0, issues, words, lines };
}

export function isGitTracked(relPath, root = REPO_ROOT) {
  try {
    const out = execFileSync('git', ['ls-files', '--', relPath], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return out.split('\n').map((line) => line.trim()).filter(Boolean).includes(relPath.replace(/\\/g, '/'));
  } catch {
    return false;
  }
}

function readSpecFile(spec, root) {
  const filePath = path.join(root, spec.file);
  if (!fs.existsSync(filePath)) {
    return { content: '', missing: true };
  }
  return { content: fs.readFileSync(filePath, 'utf8'), missing: false };
}

export function inspectAgentAdapter(spec, { root = REPO_ROOT, requireTracked = true } = {}) {
  const issues = [];
  const { content, missing } = readSpecFile(spec, root);
  if (missing) {
    issues.push(`missing file ${spec.file}`);
    return { ok: false, issues, content: '', words: 0, lines: 0 };
  }
  const haystack = content.toLowerCase();
  for (const phrase of spec.requiredPhrases || []) {
    if (!haystack.includes(String(phrase).toLowerCase())) {
      issues.push(`missing phrase "${phrase}"`);
    }
  }
  if (requireTracked && !isGitTracked(spec.file, root)) {
    issues.push(`untracked ${spec.file} — a green check on an untracked adapter is a lie`);
  }
  const budget = inspectWordBudget(spec, content);
  issues.push(...budget.issues);
  return { ok: issues.length === 0, issues, content, words: budget.words, lines: budget.lines };
}

export function inspectAgentAdapters(options = {}) {
  return MODEL_SPECS.map((spec) => ({ spec, ...inspectAgentAdapter(spec, options) }));
}

export function inspectAlwaysOnFile(spec, { root = REPO_ROOT, requireTracked = true } = {}) {
  const issues = [];
  const { content, missing } = readSpecFile(spec, root);
  if (missing) {
    issues.push(`missing file ${spec.file}`);
    return { ok: false, issues, content: '', words: 0, lines: 0 };
  }
  if (requireTracked && !isGitTracked(spec.file, root)) {
    issues.push(`untracked ${spec.file} — a green check on an untracked gate is a lie`);
  }
  const haystack = content.toLowerCase();
  for (const phrase of spec.requiredPhrases || []) {
    if (!haystack.includes(String(phrase).toLowerCase())) {
      issues.push(`missing phrase "${phrase}"`);
    }
  }
  const budget = inspectWordBudget(spec, content);
  issues.push(...budget.issues);
  return { ok: issues.length === 0, issues, content, words: budget.words, lines: budget.lines };
}

export function inspectAlwaysOnFiles(options = {}) {
  return ALWAYS_ON_SPECS.map((spec) => ({ spec, ...inspectAlwaysOnFile(spec, options) }));
}

export function inspectHarnessFile(spec, options = {}) {
  return inspectAgentAdapter(spec, options);
}

export function inspectHarnessFiles(options = {}) {
  return HARNESS_SPECS.map((spec) => ({ spec, ...inspectHarnessFile(spec, options) }));
}

/** A backticked cell token worth resolving: not a command, not a `<placeholder>`. */
function isPathLikeToken(token) {
  if (!token) return false;
  if (/^(npm|node|git|bash|rg)\b/.test(token)) return false;
  if (token.includes('<') || token.includes('>')) return false;
  const bare = token.replace(/[#?].*$/, '');
  return bare.includes('/') || /\.(md|spw)$/.test(bare);
}

/**
 * Resolve an Open-first token to a repo-relative file, or null when it does not
 * exist. Anchors are stripped, a bare `name.spw` is looked up under
 * `.spw/conventions/`, and a directory resolves to its PLAN.md.
 */
function resolveOpenFirstToken(token, root) {
  const bare = token.replace(/[#?].*$/, '').replace(/^\.\//, '').replace(/\/$/, '');
  if (!bare) return null;
  const candidates = bare.includes('/') ? [bare] : [bare, `.spw/conventions/${bare}`];
  for (const candidate of candidates) {
    const abs = path.join(root, candidate);
    if (!fs.existsSync(abs)) continue;
    if (!fs.statSync(abs).isDirectory()) return candidate;
    const plan = path.join(abs, 'PLAN.md');
    if (fs.existsSync(plan)) return `${candidate}/PLAN.md`;
  }
  return null;
}

/**
 * The files the AGENTS.md "Open first" tables route to. Derived from the gate,
 * not hand-listed, so a new routing row is budgeted the moment it lands.
 * Files already covered by MODEL_SPECS / ALWAYS_ON_SPECS / HARNESS_SPECS are
 * left to those groups. `unresolved` holds path-shaped tokens that no longer
 * exist — a stale citation in the gate itself.
 */
export function collectOpenFirstTargets({ root = REPO_ROOT, gate = 'AGENTS.md' } = {}) {
  const gatePath = path.join(root, gate);
  if (!fs.existsSync(gatePath)) return { targets: [], unresolved: [] };
  const text = fs.readFileSync(gatePath, 'utf8');
  const start = text.search(/^##\s+Open first\s*$/im);
  if (start < 0) return { targets: [], unresolved: [] };
  const rest = text.slice(start);
  const nextHeading = rest.slice(1).search(/^##\s+/m);
  const section = nextHeading < 0 ? rest : rest.slice(0, nextHeading + 1);

  const covered = new Set([
    ...MODEL_SPECS.map((spec) => spec.file),
    ...ALWAYS_ON_SPECS.map((spec) => spec.file),
    ...HARNESS_SPECS.map((spec) => spec.file),
  ]);

  const targets = [];
  const unresolved = [];
  const seen = new Set();
  for (const line of section.split('\n')) {
    if (!line.trim().startsWith('|')) continue;
    const cells = line.split('|').slice(1, -1);
    if (cells.length < 2) continue;
    for (const match of cells[1].matchAll(/`([^`]+)`/g)) {
      const token = match[1].trim();
      if (!isPathLikeToken(token)) continue;
      const resolved = resolveOpenFirstToken(token, root);
      if (!resolved) {
        if (!unresolved.includes(token)) unresolved.push(token);
        continue;
      }
      if (covered.has(resolved) || seen.has(resolved)) continue;
      seen.add(resolved);
      targets.push(resolved);
    }
  }
  return { targets, unresolved };
}

export function openFirstSpecs(options = {}) {
  const { targets, unresolved } = collectOpenFirstTargets(options);
  const specs = targets.map((file) => ({
    file,
    maxLines: OPEN_FIRST_LINE_OVERRIDES[file] ?? SHUNT_MIN_LINES,
    kind: 'open-first',
  }));
  return { specs, unresolved };
}

export function inspectOpenFirstFile(spec, { root = REPO_ROOT, requireTracked = true } = {}) {
  const issues = [];
  const { content, missing } = readSpecFile(spec, root);
  if (missing) {
    issues.push(`missing file ${spec.file}`);
    return { ok: false, issues, content: '', words: 0, lines: 0 };
  }
  if (requireTracked && !isGitTracked(spec.file, root)) {
    issues.push(`untracked ${spec.file} — Open first must not route to an untracked file`);
  }
  const budget = inspectWordBudget(spec, content);
  issues.push(...budget.issues);
  return { ok: issues.length === 0, issues, content, words: budget.words, lines: budget.lines };
}

export function inspectOpenFirstFiles(options = {}) {
  const { specs, unresolved } = openFirstSpecs(options);
  const reports = specs.map((spec) => ({ spec, ...inspectOpenFirstFile(spec, options) }));
  for (const token of unresolved) {
    reports.push({
      spec: { file: `AGENTS.md → ${token}`, kind: 'open-first' },
      ok: false,
      issues: [`Open first routes to \`${token}\`, which does not resolve`],
      content: '',
      words: 0,
      lines: 0,
    });
  }
  return reports;
}

function formatSpendLine(reports) {
  return reports
    .map((report) => {
      const cap = report.spec.maxWords;
      return `${path.basename(report.spec.file)} ${report.words}/${cap}w`;
    })
    .join(' ');
}

function printSpendTable(adapterReports, alwaysOnReports, harnessReports = [], openFirstReports = []) {
  const rows = [...alwaysOnReports, ...adapterReports, ...harnessReports, ...openFirstReports];
  process.stdout.write('[check:agents] spend\n');
  for (const report of rows) {
    const wordCap = report.spec.maxWords != null ? String(report.spec.maxWords) : '—';
    const lineCap = report.spec.maxLines != null ? String(report.spec.maxLines) : '—';
    process.stdout.write(
      `  ${report.spec.file}: ${report.words}/${wordCap}w ${report.lines}/${lineCap}L ${report.ok ? 'ok' : 'FAIL'}\n`,
    );
  }
}

function main() {
  const quiet = process.argv.includes('--quiet');
  const adapterReports = inspectAgentAdapters();
  const alwaysOnReports = inspectAlwaysOnFiles();
  const harnessReports = inspectHarnessFiles();
  const openFirstReports = inspectOpenFirstFiles();
  const reports = [...adapterReports, ...alwaysOnReports, ...harnessReports, ...openFirstReports];
  let failed = false;
  for (const report of reports) {
    if (report.ok) continue;
    failed = true;
    for (const issue of report.issues) {
      process.stderr.write(`[check:agents] ${report.spec.file}: ${issue}\n`);
    }
  }
  if (!quiet) {
    printSpendTable(adapterReports, alwaysOnReports, harnessReports, openFirstReports);
  }
  if (failed) {
    process.stderr.write('[check:agents] FAILED\n');
    process.exit(1);
  }
  process.stdout.write(
    `[check:agents] PASSED (${MODEL_SPECS.length} adapters; ${HARNESS_SPECS.length} harness; ${openFirstReports.length} open-first ≤${SHUNT_MIN_LINES}L; always-on ${formatSpendLine(alwaysOnReports)})\n`,
  );
}

const isMain = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) main();
