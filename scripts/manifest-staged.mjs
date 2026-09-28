#!/usr/bin/env node
/**
 * manifest-staged.mjs — build the committed manifests from what is staged.
 *
 * Several sessions share this working tree. `npm run manifest` reads every
 * route on disk, so a session committing its own pages would also bake another
 * session's unstaged pages into public/data/site-search-index.json and
 * public/js/generated/spw-expressions.js. This checks the staged tree out into
 * a scratch folder, runs the same generators there, then writes the two
 * outputs back and stages them, so the commit records an index built from the
 * routes it records and nothing else. The pre-commit check
 * (scripts/lib/manifest-stamp.mjs --staged) asks exactly that.
 *
 * Images are left out of the scratch checkout; the generators read routes,
 * .spw, and scripts, not pixels.
 *
 *   npm run manifest:staged             stage the rebuilt outputs
 *   npm run manifest:staged -- --check  compare with what is staged; write nothing
 *   npm run manifest:staged -- --keep   leave the scratch folder for inspection
 */

import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUTS = ['public/data/site-search-index.json', 'public/js/generated/spw-expressions.js'];
const SKIP = [/^public\/images\//, /\.zip$/, /^dist\//, /^dist-vite\//];
const keep = process.argv.includes('--keep');
const check = process.argv.includes('--check');
const say = (line) => console.log(`[manifest:staged] ${line}`);

const git = (args, options = {}) => execFileSync('git', args, { cwd: ROOT, maxBuffer: 256 * 1024 * 1024, ...options });

mkdirSync(path.join(ROOT, '.tmp'), { recursive: true });
const scratch = mkdtempSync(path.join(ROOT, '.tmp', 'manifest-staged-'));
try {
  const staged = git(['ls-files', '-z', '--cached'], { encoding: 'utf8' }).split('\0').filter(Boolean)
    .filter((file) => !SKIP.some((pattern) => pattern.test(file)));
  const checkout = spawnSync('git', ['checkout-index', '-z', '--stdin', `--prefix=${scratch}/`], {
    cwd: ROOT,
    input: staged.join('\0'),
    maxBuffer: 64 * 1024 * 1024,
  });
  if (checkout.status !== 0) throw new Error(`checkout-index failed: ${checkout.stderr}`);
  say(`checked out ${staged.length} staged files`);

  // Shared tooling the generators import; neither is part of the staged content.
  symlinkSync(path.join(ROOT, 'node_modules'), path.join(scratch, 'node_modules'));
  const workbench = path.join(scratch, '.spw', '_workbench');
  rmSync(workbench, { recursive: true, force: true });
  symlinkSync(path.join(ROOT, '.spw', '_workbench'), workbench);

  const run = (args) => {
    const result = spawnSync(process.execPath, args, { cwd: scratch, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
    if (result.status !== 0) throw new Error(`${args.join(' ')} failed:\n${result.stderr || result.stdout}`);
    const last = (result.stdout || '').trim().split('\n').pop();
    if (last) say(last.replace(/^\[[^\]]+\]\s*/, ''));
  };
  run(['scripts/generate-route-runtime-manifest.mjs']);
  run(['scripts/generate-site-search-index.mjs']);
  run(['--import', './.spw/_workbench/node_modules/tsx/dist/loader.mjs', 'scripts/build-expression-manifest.mjs']);

  if (check) {
    let stale = 0;
    for (const output of OUTPUTS) {
      const built = readFileSync(path.join(scratch, output));
      let recorded = null;
      try { recorded = git(['show', `:${output}`]); } catch { recorded = null; }
      const same = recorded && Buffer.compare(built, recorded) === 0;
      if (!same) stale += 1;
      say(`${output}: ${same ? 'matches what is staged' : 'differs from what is staged'}`);
    }
    process.exitCode = stale ? 1 : 0;
  } else {
    for (const output of OUTPUTS) {
      const from = path.join(scratch, output);
      if (!existsSync(from)) throw new Error(`${output} was not produced`);
      copyFileSync(from, path.join(ROOT, output));
    }
    git(['add', '--', ...OUTPUTS]);
    say(`staged ${OUTPUTS.join(' and ')}, built from the staged routes`);
  }
} finally {
  if (keep) say(`scratch kept at ${path.relative(ROOT, scratch)}`);
  else rmSync(scratch, { recursive: true, force: true });
}
