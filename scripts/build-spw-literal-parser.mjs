import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(import.meta.dirname, '..');
const WORKBENCH = path.join(ROOT, '.spw', '_workbench');
const PARSER_ENTRY = path.join(WORKBENCH, 'packages', 'spw-seed', 'src', 'parser.ts');
const READER_ENTRY = path.join(WORKBENCH, 'packages', 'spw-lsp', 'src', 'reader.ts');
const READER_SEED = path.join(WORKBENCH, 'packages', 'spw-seed', 'src', 'reader.ts');
const ESBUILD_ENTRY = path.join(WORKBENCH, 'node_modules', 'esbuild', 'lib', 'main.js');
const SEMANTIC = path.join(ROOT, 'public', 'js', 'semantic');

/**
 * Two bundles from one revision. The parser is parse and parseExpression. The
 * reader is what the editor reads from a file (roles, outline, anchors,
 * highlightHtml) with parse; it points seed at its browser-safe slice, as the
 * workbench's parser release does, so a page and the editor read a file alike.
 */
const BUNDLES = Object.freeze([
  {
    output: path.join(SEMANTIC, 'spw-workbench-parser.js'),
    source: 'packages/spw-seed/src/parser.ts',
    exports: `export { parse, parseExpression } from ${JSON.stringify(PARSER_ENTRY)};`,
    sourcefile: 'spw-parser-browser-entry.ts',
  },
  {
    output: path.join(SEMANTIC, 'spw-workbench-reader.js'),
    source: 'packages/spw-lsp/src/reader.ts',
    exports: `export * from ${JSON.stringify(READER_ENTRY)};`,
    sourcefile: 'spw-reader-browser-entry.ts',
    alias: { '@spwashi/spw-seed': READER_SEED },
  },
]);

async function readWorkbenchProvenance() {
  const manifest = JSON.parse(await fs.readFile(path.join(WORKBENCH, 'package.json'), 'utf8'));
  const { stdout } = await execFileAsync('git', ['rev-parse', '--short=12', 'HEAD'], {
    cwd: WORKBENCH,
  });

  return Object.freeze({
    package: manifest.name,
    version: manifest.version,
    commit: stdout.trim(),
  });
}

async function main() {
  const { build } = await import(ESBUILD_ENTRY);
  const revision = await readWorkbenchProvenance();

  await fs.mkdir(SEMANTIC, { recursive: true });
  for (const bundle of BUNDLES) {
    const provenance = Object.freeze({ ...revision, source: bundle.source });
    await build({
      stdin: {
        contents: [
          bundle.exports,
          `export const SPW_PARSER_BUILD = Object.freeze(${JSON.stringify(provenance)});`,
        ].join('\n'),
        loader: 'ts',
        resolveDir: ROOT,
        sourcefile: bundle.sourcefile,
      },
      outfile: bundle.output,
      bundle: true,
      format: 'esm',
      platform: 'browser',
      target: ['es2022'],
      minify: true,
      legalComments: 'none',
      sourcemap: false,
      ...(bundle.alias ? { alias: bundle.alias } : {}),
      banner: {
        js: `/* Generated from ${provenance.package} v${provenance.version} @ ${provenance.commit}. Run npm run build:spw-parser; do not edit. */`,
      },
      logLevel: 'silent',
    });

    const bytes = (await fs.stat(bundle.output)).size;
    console.log(`Built ${path.relative(ROOT, bundle.output)} (${(bytes / 1024).toFixed(1)} KiB) from ${provenance.package}@${provenance.commit}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
