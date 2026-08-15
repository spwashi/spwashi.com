/**
 * Fail the build if anything that observes a reader can also transmit.
 *
 * The site watches its reader in several places, and increasingly visibly: it
 * records which tokens were travelled, how long since a construct was last met,
 * which operators have been encountered, and what sits in the cauldron. That
 * observation is what makes the rehearsal and fluency work possible, and it is
 * also exactly the shape a reader has learned to be suspicious of.
 *
 * A promise in a privacy page is not an answer to that. A promise is a claim
 * about intent, and intent is not what a reader is worried about — they are
 * worried about what the code can do, including after someone else edits it.
 *
 * So the property is enforced instead of stated. Any module that reads reader
 * observation state may not reference a transmission primitive. If a future
 * change adds one, this fails, and the failure names the module and the call.
 * That converts "we would not do that" into "that does not build", which is the
 * only version of the guarantee that survives new contributors, new agents, and
 * the author's own future convenience.
 *
 * Scope note: this checks the observing modules, not the whole site. A contact
 * form should be able to send a form. The invariant is narrower and stronger —
 * the things that watch you are not the things that talk.
 *
 * Usage:
 *   node scripts/check-observation-locality.mjs
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Modules that read or persist observation of a reader's behaviour.
 * Adding a module that does this without adding it here is itself a defect,
 * so the list is stated rather than inferred — an inferred list would quietly
 * shrink the invariant every time someone named a file differently.
 */
const OBSERVING_MODULES = Object.freeze([
  'public/js/interface/cauldron/rehearsal.js',
  'public/js/interface/cauldron/registers.js',
  'public/js/interface/cauldron/fluency.js',
  'public/js/interface/cauldron/storage.js',
  'public/js/runtime/cauldron-fluency.js',
  'public/js/runtime/expression-resonance.js',
  'public/js/runtime/dom-probes.js',
]);

/** Anything that can move bytes off the machine. */
const TRANSMISSION = Object.freeze([
  [/\bfetch\s*\(/, 'fetch()'],
  [/XMLHttpRequest/, 'XMLHttpRequest'],
  [/navigator\s*\.\s*sendBeacon/, 'navigator.sendBeacon'],
  [/new\s+WebSocket/, 'WebSocket'],
  [/new\s+EventSource/, 'EventSource'],
  [/new\s+Image\s*\(/, 'new Image() — a classic tracking pixel'],
  [/import\s*\(\s*['"`]https?:/, 'remote dynamic import'],
  [/navigator\s*\.\s*clipboard\s*\.\s*read/, 'clipboard read'],
  [/document\s*\.\s*cookie/, 'document.cookie'],
]);

/** Comments describe transmission; they do not perform it. */
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

async function main() {
  const failures = [];
  let checked = 0;

  for (const rel of OBSERVING_MODULES) {
    const full = path.join(ROOT, rel);
    let source;
    try {
      source = await readFile(full, 'utf8');
    } catch {
      failures.push({ rel, call: 'module is listed as observing but does not exist' });
      continue;
    }
    checked += 1;
    const code = stripComments(source);
    for (const [pattern, label] of TRANSMISSION) {
      if (pattern.test(code)) failures.push({ rel, call: label });
    }
  }

  if (failures.length) {
    console.error(`[observation-locality] ${failures.length} violation(s) — modules that observe a reader must not transmit\n`);
    for (const f of failures) console.error(`  ${f.rel}\n    ${f.call}`);
    console.error('\nIf the capability is genuinely needed, it belongs in a module that does not read observation state.');
    process.exitCode = 1;
    return;
  }

  console.log(`[observation-locality] ${checked} observing modules, 0 transmission primitives`);
  console.log('  what watches the reader stays on the reader\'s machine, by construction');
}

main().catch((error) => {
  console.error('[observation-locality]', error);
  process.exitCode = 1;
});
