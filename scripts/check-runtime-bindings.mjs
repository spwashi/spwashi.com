/**
 * Check source bindings through compiler diagnostics, independent of the broad
 * JS inference audit. Configuration, syntax, and module resolution errors fail
 * the gate too; diagnostic text and the compiler process exit are not a schema.
 *
 * Unchanged public JS is skipped by the same input stamp used for compile.
 * tsconfig.public.json is incremental; the collector writes that buildinfo.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { fingerprintInputs } from './build-compile.mjs';
import { collectRuntimeBindingFindings } from './typed/runtime-contracts/bindings.mjs';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STAMP_PATH = path.join(ROOT_DIR, '.tmp', 'tsc', 'runtime-bindings.stamp');
const PROJECT = path.join(ROOT_DIR, 'tsconfig.public.json');
const INPUTS = [
  'tsconfig.json',
  'tsconfig.public.json',
  'public/js',
  'public/ts',
  'types',
];

async function main() {
  const force = process.argv.includes('--force') || process.env.SPW_TSC_FORCE === '1';
  const { hash } = await fingerprintInputs(INPUTS, 'name:runtime-bindings\n');
  if (!force) {
    try {
      const previous = (await fs.readFile(STAMP_PATH, 'utf8')).trim();
      if (previous === hash) {
        console.log('[check:runtime-bindings] ok — cache');
        return;
      }
    } catch {
      // first run or missing stamp
    }
  }

  const findings = collectRuntimeBindingFindings(PROJECT);
  if (findings.length) {
    console.error(`[check:runtime-bindings] ${findings.length} binding/compiler error(s):`);
    for (const finding of findings) {
      console.error(`  ${finding.file}:${finding.line}:${finding.column} TS${finding.code} ${finding.message}`);
    }
    process.exitCode = 1;
    return;
  }

  await fs.mkdir(path.dirname(STAMP_PATH), { recursive: true });
  await fs.writeFile(STAMP_PATH, `${hash}\n`);
  console.log('[check:runtime-bindings] ok — no unresolved bindings or compiler errors');
}

await main();
