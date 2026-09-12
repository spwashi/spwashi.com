/**
 * Fail the build when a runtime module reads a name that has no binding.
 *
 * The browser runtime is hand-authored ES modules with no bundler between the
 * source and the page. Nothing resolves an import until a browser evaluates the
 * module, so a name that was never imported and never declared is not a build
 * error here — it is a ReferenceError on whichever interaction happens to reach
 * that line, in whichever module the schedule mounts. Two such names were live
 * in this tree when this check was written, and both had survived because the
 * code around them was only reachable behind a click or a feature pack.
 *
 * This is also the failure mode that regrouping modules into folders produces:
 * a moved file, an import path that still points at the old one, a named import
 * of an export that no longer exists there. That class of mistake should cost a
 * failed check, not a bug report from a reader.
 *
 * So the property is enforced. Every name a module under public/js reads must
 * resolve to a declaration, an import, or a DOM/ES global. TypeScript already
 * answers that question exactly, so it does the work through
 * tsconfig.public.json, and this script reads only the two diagnostics that mean
 * "this name resolves to nothing":
 *
 *   TS2304  Cannot find name 'x'
 *   TS2305  Module '...' has no exported member 'x'
 *
 * Inference and strictness diagnostics are deliberately ignored. The tree has
 * about 1200 of those and they are a separate, optional project; mixing them in
 * would make this output unreadable and the check unenforceable.
 *
 * The baseline below records findings that were already in the tree and are
 * owned by files another patch is holding. It is a list to empty, not a place
 * to add. A new unresolved name fails the check.
 *
 * Usage:
 *   node scripts/check-runtime-bindings.mjs
 *   node scripts/check-runtime-bindings.mjs --list   # print every finding
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROJECT = 'tsconfig.public.json';
const TSC = path.join(ROOT_DIR, 'node_modules/typescript/bin/tsc');

/** Diagnostics that mean "this name resolves to nothing". */
const BINDING_CODES = new Set(['2304', '2305']);

/**
 * Findings that predate this check, kept so it can be enforced today rather
 * than after someone else's patch lands. Each entry names the file and the
 * unresolved identifier. Delete an entry once the name is bound; the check
 * fails if a listed finding is already gone, so the list cannot go stale.
 */
const BASELINE = Object.freeze([
  { file: 'public/js/media/image-metaphysics.js', name: 'lastPathPointTime' },
  { file: 'public/js/runtime/shell-disclosure.js', name: 'syncRouteMenuMode' },
  { file: 'public/js/runtime/shell-disclosure.js', name: 'MENU_DATASET_KEYS' },
]);

const DIAGNOSTIC_RE = /^(.+?)\((\d+),(\d+)\): error TS(\d+): (.+)$/;
const NAME_RE = /Cannot find name '([^']+)'|has no exported member '([^']+)'/;

function runTsc() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [TSC, '-p', PROJECT, '--noEmit'], {
      cwd: ROOT_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    let err = '';
    child.stdout.on('data', (chunk) => { out += chunk; });
    child.stderr.on('data', (chunk) => { err += chunk; });
    child.on('error', reject);
    // tsc exits non-zero whenever it reports anything, including the inference
    // diagnostics this check ignores, so the exit code is not the signal.
    child.on('close', () => resolve({ out, err }));
  });
}

function parseFindings(output) {
  const findings = [];
  for (const line of output.split('\n')) {
    const match = DIAGNOSTIC_RE.exec(line.trim());
    if (!match) continue;
    const [, file, lineNo, column, code, message] = match;
    if (!BINDING_CODES.has(code)) continue;
    const nameMatch = NAME_RE.exec(message);
    findings.push({
      file: file.split(path.sep).join('/'),
      line: Number(lineNo),
      column: Number(column),
      code,
      name: nameMatch ? (nameMatch[1] || nameMatch[2]) : '(unknown)',
      message,
    });
  }
  return findings;
}

const key = (finding) => `${finding.file}::${finding.name}`;

async function main() {
  const listAll = process.argv.includes('--list');
  const { out, err } = await runTsc();
  if (err.trim() && !out.trim()) {
    console.error('[check:runtime-bindings] tsc did not run:');
    console.error(err.trim());
    process.exit(2);
  }

  const findings = parseFindings(`${out}\n${err}`);
  const baselineKeys = new Set(BASELINE.map(key));
  const seenKeys = new Set(findings.map(key));

  const fresh = findings.filter((finding) => !baselineKeys.has(key(finding)));
  const cleared = BASELINE.filter((entry) => !seenKeys.has(key(entry)));

  if (listAll) {
    for (const finding of findings) {
      const mark = baselineKeys.has(key(finding)) ? 'known' : 'NEW  ';
      console.log(`  ${mark} ${finding.file}:${finding.line}:${finding.column}  ${finding.name}`);
    }
  }

  if (cleared.length) {
    console.log('[check:runtime-bindings] these baseline entries are fixed — delete them from BASELINE:');
    for (const entry of cleared) console.log(`  ${entry.file}  ${entry.name}`);
  }

  if (fresh.length) {
    console.error(`[check:runtime-bindings] ${fresh.length} unresolved name(s):`);
    for (const finding of fresh) {
      console.error(`  ${finding.file}:${finding.line}:${finding.column}  ${finding.message}`);
    }
    console.error('');
    console.error('  Each of these throws a ReferenceError when the line runs.');
    console.error('  Import the name, declare it, or delete the code that reads it.');
    process.exit(1);
  }

  if (cleared.length) process.exit(1);

  const known = findings.length;
  console.log(`[check:runtime-bindings] ok — no unresolved names (${known} known finding${known === 1 ? '' : 's'} held in baseline)`);
}

await main();
