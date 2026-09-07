#!/usr/bin/env node
/**
 * `check:agents` — verify model adapters exist, stay tracked, and emphasize
 * a focus without pretending one model owns the whole operating contract.
 *
 * AGENTS.md is the gate. Adapters are short relative-strength reminders.
 *
 * Word budgets are the block. Written rules in markdown are suggestions;
 * a failing check is not. Always-on context is I/O, not thinking.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '..');

export const SHARED_EMPHASIS = 'This adapter emphasizes one focus. AGENTS.md is the gate. Any model still follows Open first.';
export const SHARED_WRITE_DENY = 'Explore/plan do not write';

/** Do not Read a PLAN.md over this many lines unless Open first named that file. */
export const SHUNT_MIN_LINES = 200;

export const FOCUSES = Object.freeze({
  'anti-bloat': {
    label: 'Anti-Bloat & Signal',
    tools: [
      'npm run wonder',
      'npm run spw:lattice',
      'npm run audit:copy:accessor',
      'declare cache|audit|align|prime|contract|archive',
      'stop at the named slice',
    ],
  },
  constitutional: {
    label: 'Constitutional Rigor',
    tools: [
      'npm run spw:integrity',
      'npm run audit:copy:accessor',
      'semantic HTML',
      'WCAG AA',
      'no new data-spw-* family',
      'smallest honest surface',
    ],
  },
  exactness: {
    label: 'Contract Exactness',
    tools: [
      'npm run audit:module-selectors',
      'npm run visual:checks -- --ids=',
      'npm run check:runtime',
      'npm run check:css',
      'explicit .js imports',
      'CSS layer order',
    ],
  },
  'tool-mastery': {
    label: 'Progressive Mastery',
    tools: [
      'npm run visual:checks',
      'npm run wonder',
      'npm run spw:lattice',
      'npm run reasons',
      'npm run check:agents -- --spend',
      'no background-task polling',
    ],
  },
  'computer-use': {
    label: 'Computer-use verify-first',
    tools: ['npm run audit:module-selectors', 'npm run visual:checks -- --ids=', 'one named patch', 'stop'],
  },
});

export const ADAPTER_MAX_WORDS = 280;

export const MODEL_SPECS = Object.freeze([
  {
    name: 'Claude',
    file: 'CLAUDE.md',
    emphasize: 'constitutional',
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
    emphasize: 'anti-bloat',
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
    emphasize: 'tool-mastery',
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
    emphasize: 'exactness',
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
    requiredPhrases: ['^"harness"', SHARED_WRITE_DENY, 'visual:checks -- --ids', 'Do not add ASTRA.md'],
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
    requiredPhrases: ['Sense first', SHARED_WRITE_DENY, 'visual:checks -- --ids'],
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

function formatSpendLine(reports) {
  return reports
    .map((report) => {
      const cap = report.spec.maxWords;
      return `${path.basename(report.spec.file)} ${report.words}/${cap}w`;
    })
    .join(' ');
}

function printSpendTable(adapterReports, alwaysOnReports) {
  const rows = [...alwaysOnReports, ...adapterReports];
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
  const spend = process.argv.includes('--spend');
  const adapterReports = inspectAgentAdapters();
  const alwaysOnReports = inspectAlwaysOnFiles();
  const harnessReports = inspectHarnessFiles();
  const reports = [...adapterReports, ...alwaysOnReports, ...harnessReports];
  let failed = false;
  for (const report of reports) {
    if (report.ok) continue;
    failed = true;
    for (const issue of report.issues) {
      process.stderr.write(`[check:agents] ${report.spec.file}: ${issue}\n`);
    }
  }
  if (spend) {
    printSpendTable(adapterReports, alwaysOnReports);
  }
  if (failed) {
    process.stderr.write('[check:agents] FAILED\n');
    process.exit(1);
  }
  process.stdout.write(
    `[check:agents] PASSED (${MODEL_SPECS.length} adapters; ${HARNESS_SPECS.length} harness; always-on ${formatSpendLine(alwaysOnReports)})\n`,
  );
}

const isMain = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) main();
