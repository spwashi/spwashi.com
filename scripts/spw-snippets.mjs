/**
 * Harvest the corpus's snippets and make them indexable, actionable, collectable.
 *
 * 287 probe strings sit across the .spw surfaces — `probe:`, `probe_<name>:` and
 * `!probe{ … }` — every one of them a backtick a reader has to notice, copy and
 * paste. They are the corpus's executable half and nothing has ever run them,
 * counted them, or told you which ones are even runnable.
 *
 * Three kinds fall out, and the distinction matters more than the count:
 *
 *   shell        starts with a command this repo actually has. Runnable now.
 *   spw          a workbench CLI invocation. Runnable where the submodule is.
 *   instruction  prose telling a reader what to do. Not runnable, and correct
 *                not to be — a probe that needs a person is still a probe.
 *
 * `--run` executes the shell kind and reports which surfaces still hold. A
 * probe that no longer runs is a claim whose evidence has expired, which is the
 * cheapest possible corpus rot to detect.
 *
 * The emitted index carries a semantic expression per snippet so the cauldron
 * can gather one: a probe becomes an ingredient, and a gathering of probes is a
 * verification pass someone assembled by hand.
 *
 * Usage:
 *   node scripts/spw-snippets.mjs              # report
 *   node scripts/spw-snippets.mjs --write      # emit .spw/snippets.spw
 *   node scripts/spw-snippets.mjs --run        # execute the shell kind
 */

import { readFile, readdir, writeFile } from 'node:fs/promises';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(exec);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SPW = path.join(ROOT, '.spw');
const OUT = path.join(SPW, 'snippets.spw');
const SKIP = new Set(['_workbench', 'gen', 'node_modules']);

/** Commands this repo actually carries. Anything else reads as prose. */
const SHELL_HEADS = /^(npm|node|git|grep|find|for|test|rg|sed|awk|cat|ls|wc|echo)\b/;
const SPW_HEAD = /^(npm run spw|spw)\b/;

async function collect(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await collect(full, out);
    else if (entry.name.endsWith('.spw')) out.push(full);
  }
  return out;
}

function classify(body) {
  if (SPW_HEAD.test(body)) return 'spw';
  if (SHELL_HEADS.test(body)) return 'shell';
  return 'instruction';
}

/** Snippets, with the surface and nearest anchor that own them. */
function harvest(source, file) {
  const found = [];
  const lines = source.split('\n');
  let anchor = '';

  lines.forEach((line, index) => {
    const anchorMatch = line.match(/^#>([\w-]+)/) || line.match(/^\^"([^"]+)"/);
    if (anchorMatch) anchor = anchorMatch[1];

    // probe: `…`  /  probe_name: `…`
    const backtick = line.match(/^\s*(probe[\w-]*)\s*:\s*`(.+?)`\s*$/);
    if (backtick) {
      found.push({ file, anchor, key: backtick[1], body: backtick[2], line: index + 1 });
      return;
    }
    // !probe{ "…" }
    const bang = line.match(/!probe\{\s*["`](.+?)["`]\s*\}/);
    if (bang) {
      found.push({ file, anchor, key: 'probe', body: bang[1], line: index + 1 });
    }
  });

  return found;
}

const esc = (s) => String(s).replace(/`/g, "'");

async function main() {
  const write = process.argv.includes('--write');
  const execute = process.argv.includes('--run');

  const files = await collect(SPW);
  const snippets = [];
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    for (const snippet of harvest(source, path.relative(SPW, file))) {
      snippets.push({ ...snippet, kind: classify(snippet.body) });
    }
  }

  const byKind = snippets.reduce((acc, s) => {
    (acc[s.kind] = acc[s.kind] || []).push(s);
    return acc;
  }, {});

  console.log(`${snippets.length} snippets across ${new Set(snippets.map((s) => s.file)).size} surfaces`);
  for (const [kind, list] of Object.entries(byKind)) {
    console.log(`  ${kind.padEnd(12)} ${String(list.length).padStart(4)}`);
  }

  let results = [];
  if (execute) {
    const runnable = [...(byKind.shell || []), ...(byKind.spw || [])];
    console.log(`\nrunning ${runnable.length} runnable snippets…`);
    for (const snippet of runnable) {
      try {
        await run(snippet.body, { cwd: ROOT, timeout: 45000, maxBuffer: 32e6 });
        results.push({ ...snippet, ok: true });
      } catch (error) {
        results.push({ ...snippet, ok: false, why: (error.message || '').split('\n')[0].slice(0, 80) });
      }
    }
    const failed = results.filter((r) => !r.ok);
    console.log(`  ${results.length - failed.length} hold, ${failed.length} do not`);
    for (const f of failed.slice(0, 12)) console.log(`    ${f.file}#${f.anchor} — ${f.why}`);
  }

  if (!write) {
    console.log('\nre-run with --write to emit .spw/snippets.spw, --run to execute');
    return;
  }

  const lines = [];
  lines.push('# Snippets');
  lines.push('#');
  lines.push('# GENERATED by scripts/spw-snippets.mjs — the corpus\'s executable half.');
  lines.push('# Each snippet carries the surface and anchor that own it, so a probe can');
  lines.push('# be gathered as an ingredient and a gathering of probes is a pass.');
  lines.push('');
  lines.push('#>spw_snippets');
  lines.push('#:index #!snippets #!executable');
  lines.push('#:operation #!align');
  lines.push('#:fixity #!stable');
  lines.push('#:layer #!pragmatics');
  lines.push('');
  lines.push('@dimensions: ~"./dimensions.spw"');
  lines.push('@caches: ~"./caches/index.spw"');
  lines.push('');
  lines.push('operation = "align"');
  lines.push('fixity = "stable"');
  lines.push('');
  lines.push('expression = corpus[snippets]{shell.spw.instruction}<runnable>');
  lines.push('');
  lines.push('^"census"{');
  lines.push(`  total = ${snippets.length}`);
  for (const [kind, list] of Object.entries(byKind)) lines.push(`  ${kind} = ${list.length}`);
  lines.push(`  surfaces = ${new Set(snippets.map((s) => s.file)).size}`);
  lines.push('}');
  lines.push('');

  for (const [kind, list] of Object.entries(byKind)) {
    lines.push(`^"${kind}"{`);
    if (kind === 'instruction') {
      lines.push('  ~#note: "needs a person. A probe that cannot be scripted is still a probe."');
    }
    for (const s of list) {
      const expr = `probe[${kind}]{${s.anchor || 'unanchored'}}`;
      lines.push(`  "${s.file}#${s.anchor || 'unanchored'}": .{`);
      lines.push(`    expression = \`${esc(expr)}\``);
      lines.push(`    body = \`${esc(s.body)}\``);
      lines.push(`    source = ~"./${s.file}"`);
      lines.push(`  }[reg=facet]`);
    }
    lines.push('}[reg=facet]');
    lines.push('');
  }

  if (results.length) {
    const failed = results.filter((r) => !r.ok);
    lines.push('^"last_run"{');
    lines.push(`  ran = ${results.length}`);
    lines.push(`  held = ${results.length - failed.length}`);
    lines.push(`  expired = ${failed.length}`);
    for (const f of failed) lines.push(`  "${f.file}#${f.anchor}": \`${esc(f.why)}\``);
    lines.push('}[reg=facet]');
    lines.push('');
  }

  lines.push('^"validation"{');
  lines.push('  probe: `node scripts/spw-snippets.mjs --run`');
  lines.push('  falsification: `a snippet classified shell does not execute`');
  lines.push('}');
  lines.push('');

  await writeFile(OUT, lines.join('\n'), 'utf8');
  console.log(`\nwrote ${path.relative(ROOT, OUT)}`);
}

main().catch((error) => {
  console.error('[spw-snippets]', error);
  process.exitCode = 1;
});
