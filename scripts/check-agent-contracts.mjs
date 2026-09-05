#!/usr/bin/env node
/**
 * `check:agents` — verify model adapters exist, stay tracked, and emphasize
 * a focus without pretending one model owns the whole operating contract.
 *
 * AGENTS.md is the gate. Adapters are short relative-strength reminders.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '..');

export const SHARED_EMPHASIS = 'This adapter emphasizes one focus. AGENTS.md is the gate. Any model still follows Open first.';

export const FOCUSES = Object.freeze({
  'anti-bloat': {
    label: 'Anti-Bloat & Signal',
    tools: ['npm run check:local', 'declare cache|audit|align|prime|contract|archive', 'stop at the named slice'],
  },
  constitutional: {
    label: 'Constitutional Rigor',
    tools: ['semantic HTML', 'WCAG AA', 'no new data-spw-* family', 'smallest honest surface'],
  },
  exactness: {
    label: 'Contract Exactness',
    tools: ['npm run check:runtime', 'npm run check:css', 'explicit .js imports', 'CSS layer order'],
  },
  'tool-mastery': {
    label: 'Progressive Mastery',
    tools: ['npm run visual:checks', 'npm run wonder', 'npm run spw:lattice', 'no background-task polling'],
  },
  'computer-use': {
    label: 'Computer-use verify-first',
    tools: ['npm run audit:module-selectors', 'npm run visual:checks', 'one named patch', 'stop'],
  },
});

export const MODEL_SPECS = Object.freeze([
  {
    name: 'Claude',
    file: 'CLAUDE.md',
    emphasize: 'constitutional',
    requiredPhrases: ['AGENTS.md', 'check:local', '#[episode]{', SHARED_EMPHASIS, 'Constitutional Rigor'],
  },
  {
    name: 'Grok',
    file: 'GROK.md',
    emphasize: 'anti-bloat',
    requiredPhrases: ['AGENTS.md', 'check:local', '#[episode]{', SHARED_EMPHASIS, 'Anti-Bloat & Signal', 'cache'],
  },
  {
    name: 'Gemini',
    file: 'GEMINI.md',
    emphasize: 'tool-mastery',
    requiredPhrases: ['AGENTS.md', 'check:local', '#[episode]{', SHARED_EMPHASIS, 'Progressive Mastery', 'visual:checks'],
  },
  {
    name: 'GPT',
    file: 'GPT.md',
    emphasize: 'exactness',
    requiredPhrases: [
      'AGENTS.md',
      'check:local',
      '#[episode]{',
      SHARED_EMPHASIS,
      'Contract Exactness',
      'verify-first',
      'one named patch',
    ],
  },
  {
    name: 'Cursor',
    file: '.cursorrules',
    requiredPhrases: ['AGENTS.md', 'check:local', '#[episode]{', SHARED_EMPHASIS],
  },
  {
    name: 'GitHub Copilot',
    file: '.github/copilot-instructions.md',
    requiredPhrases: ['AGENTS.md', 'check:local', '#[episode]{', SHARED_EMPHASIS],
  },
]);

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

export function inspectAgentAdapter(spec, { root = REPO_ROOT, requireTracked = true } = {}) {
  const filePath = path.join(root, spec.file);
  const issues = [];
  if (!fs.existsSync(filePath)) {
    issues.push(`missing file ${spec.file}`);
    return { ok: false, issues, content: '' };
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const haystack = content.toLowerCase();
  for (const phrase of spec.requiredPhrases || []) {
    if (!haystack.includes(String(phrase).toLowerCase())) {
      issues.push(`missing phrase "${phrase}"`);
    }
  }
  if (requireTracked && !isGitTracked(spec.file, root)) {
    issues.push(`untracked ${spec.file} — a green check on an untracked adapter is a lie`);
  }
  return { ok: issues.length === 0, issues, content };
}

export function inspectAgentAdapters(options = {}) {
  return MODEL_SPECS.map((spec) => ({ spec, ...inspectAgentAdapter(spec, options) }));
}

function main() {
  const reports = inspectAgentAdapters();
  let failed = false;
  for (const report of reports) {
    if (report.ok) continue;
    failed = true;
    for (const issue of report.issues) {
      process.stderr.write(`[check:agents] ${report.spec.file}: ${issue}\n`);
    }
  }
  if (failed) {
    process.stderr.write('[check:agents] FAILED\n');
    process.exit(1);
  }
  process.stdout.write(
    `[check:agents] PASSED (${MODEL_SPECS.length} adapters; focuses are emphases, not exclusive owners)\n`,
  );
}

const isMain = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) main();
