import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(import.meta.dirname, '..');
const WORKBENCH = path.join(ROOT, '.spw', '_workbench');
const PARSER_ENTRY = path.join(WORKBENCH, 'packages', 'spw-seed', 'src', 'parser.ts');
const ESBUILD_ENTRY = path.join(WORKBENCH, 'node_modules', 'esbuild', 'lib', 'main.js');
const OUTPUT = path.join(ROOT, 'public', 'js', 'semantic', 'spw-workbench-parser.js');

async function readWorkbenchProvenance() {
  const manifest = JSON.parse(await fs.readFile(path.join(WORKBENCH, 'package.json'), 'utf8'));
  const { stdout } = await execFileAsync('git', ['rev-parse', '--short=12', 'HEAD'], {
    cwd: WORKBENCH,
  });

  return Object.freeze({
    package: manifest.name,
    version: manifest.version,
    commit: stdout.trim(),
    source: 'packages/spw-seed/src/parser.ts',
  });
}

async function main() {
  const { build } = await import(ESBUILD_ENTRY);
  const provenance = await readWorkbenchProvenance();

  await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
  await build({
    stdin: {
      contents: [
        `export { parse, parseExpression } from ${JSON.stringify(PARSER_ENTRY)};`,
        `export const SPW_PARSER_BUILD = Object.freeze(${JSON.stringify(provenance)});`,
      ].join('\n'),
      loader: 'ts',
      resolveDir: ROOT,
      sourcefile: 'spw-parser-browser-entry.ts',
    },
    outfile: OUTPUT,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: ['es2022'],
    minify: true,
    legalComments: 'none',
    sourcemap: false,
    banner: {
      js: `/* Generated from ${provenance.package} v${provenance.version} @ ${provenance.commit}. Run npm run build:spw-parser; do not edit. */`,
    },
    logLevel: 'silent',
  });

  const bytes = (await fs.stat(OUTPUT)).size;
  console.log(`Built ${path.relative(ROOT, OUTPUT)} (${(bytes / 1024).toFixed(1)} KiB) from ${provenance.package}@${provenance.commit}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
