/**
 * Check source bindings through compiler diagnostics, independent of the broad
 * JS inference audit. Configuration, syntax, and module resolution errors fail
 * the gate too; diagnostic text and the compiler process exit are not a schema.
 */
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { collectRuntimeBindingFindings } from './typed/runtime-contracts/bindings.mjs';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const findings = collectRuntimeBindingFindings(path.join(ROOT_DIR, 'tsconfig.public.json'));

if (findings.length) {
  console.error(`[check:runtime-bindings] ${findings.length} binding/compiler error(s):`);
  for (const finding of findings) {
    console.error(`  ${finding.file}:${finding.line}:${finding.column} TS${finding.code} ${finding.message}`);
  }
  process.exitCode = 1;
} else {
  console.log('[check:runtime-bindings] ok — no unresolved bindings or compiler errors');
}
