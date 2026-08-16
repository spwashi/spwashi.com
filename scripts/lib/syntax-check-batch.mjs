/**
 * Batch syntax checker. Parses many files in one process instead of paying a
 * `node --check` process spawn per file (~240ms CPU each).
 *
 * Reads NUL-delimited absolute paths on stdin, writes one JSON report on stdout:
 *   { "failures": [{ "file": "<abs path>", "output": "<message>" }] }
 *
 * Parsing uses the same V8 parsers `node --check` does — `vm.SourceTextModule`
 * for ESM, `vm.Script` for CommonJS — so a file passes here exactly when it
 * passes there. Requires `--experimental-vm-modules`; run via `spawnBatch()` in
 * site-contracts, which passes the flag and falls back to per-file spawns if
 * this process cannot start.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import vm from 'node:vm';

/** Node's CommonJS wrapper, so top-level `return` parses as it does under `node --check`. */
const CJS_WRAPPER_HEAD = '(function (exports, require, module, __filename, __dirname) {';
const CJS_WRAPPER_TAIL = '\n});';

/** Nearest-package.json `type` lookups, cached per directory across the batch. */
const packageTypeCache = new Map();

async function readPackageType(directoryPath) {
  if (packageTypeCache.has(directoryPath)) return packageTypeCache.get(directoryPath);

  let resolved = null;
  try {
    const source = await fs.readFile(path.join(directoryPath, 'package.json'), 'utf8');
    resolved = JSON.parse(source).type === 'module' ? 'module' : 'commonjs';
  } catch {
    const parent = path.dirname(directoryPath);
    // Walk up until the filesystem root; no package.json anywhere means CommonJS.
    resolved = parent === directoryPath ? 'commonjs' : await readPackageType(parent);
  }

  packageTypeCache.set(directoryPath, resolved);
  return resolved;
}

async function resolveModuleFormat(absolutePath) {
  const extension = path.extname(absolutePath).toLowerCase();
  if (extension === '.mjs') return 'module';
  if (extension === '.cjs') return 'commonjs';
  return readPackageType(path.dirname(absolutePath));
}

/** Blank a leading hashbang while preserving line numbers, matching Node's strip. */
function stripShebang(source) {
  if (!source.startsWith('#!')) return source;
  const lineEnd = source.indexOf('\n');
  return lineEnd === -1 ? '' : source.slice(lineEnd);
}

async function checkFile(absolutePath) {
  let source;
  try {
    source = await fs.readFile(absolutePath, 'utf8');
  } catch (error) {
    return { file: absolutePath, output: `unreadable: ${String(error)}` };
  }

  const format = await resolveModuleFormat(absolutePath);
  const body = stripShebang(source);

  try {
    if (format === 'module') {
      new vm.SourceTextModule(body, { identifier: absolutePath });
    } else {
      new vm.Script(`${CJS_WRAPPER_HEAD}${body}${CJS_WRAPPER_TAIL}`, { filename: absolutePath });
    }
    return null;
  } catch (error) {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    return { file: absolutePath, output: message };
  }
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

async function main() {
  if (typeof vm.SourceTextModule !== 'function') {
    process.stderr.write('syntax-check-batch requires --experimental-vm-modules\n');
    process.exit(2);
  }

  const targets = (await readStdin()).split('\0').filter(Boolean);
  const failures = [];
  for (const target of targets) {
    const failure = await checkFile(target);
    if (failure) failures.push(failure);
  }

  process.stdout.write(JSON.stringify({ failures }));
}

await main();
