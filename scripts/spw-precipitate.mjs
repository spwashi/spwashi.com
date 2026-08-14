/**
 * Precipitate — lift probe output into corpus.
 *
 * The site measures itself constantly and remembers none of it. `npm run
 * reasons`, `wonder`, `css:payload`, `spw:dimensions` all produce findings that
 * live in terminal scrollback and die there. Three separate measurements have
 * converged on the same absence: zero of 461 authored expressions use `^` lift,
 * philosophy sits 126 days stale while caches are one day old, and the attention
 * field model has sources and gradients and no sink. All three are one missing
 * return — practice produces residue that never becomes knowledge.
 *
 * This is that return, for the half that is reachable from a script. A probe's
 * output becomes a `.spw` cache: citable from a surface, walkable by
 * spw:integrity, comparable against the last one. `^` made operational.
 *
 * Deltas are the point. A single measurement is a number; two are a direction.
 * Each run reads the previous precipitate and records what moved, so the next
 * session inherits a trend rather than re-deriving a snapshot.
 *
 * Probes are independent and failure-tolerant — a probe that cannot run is
 * recorded as unavailable rather than aborting the precipitate, because a
 * partial return is still a return.
 *
 * Usage:
 *   node scripts/spw-precipitate.mjs            # report, no write
 *   node scripts/spw-precipitate.mjs --write
 */

import { readFile, readdir, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHES = path.join(ROOT, '.spw/caches');

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Each probe returns flat named numbers. Flat because a delta between two
 * nested shapes is a diff, and a delta between two numbers is a direction.
 */
const PROBES = {
  async wonders() {
    const { stdout } = await run('node', ['scripts/wonder.mjs', '--json'], { cwd: ROOT, maxBuffer: 32e6 });
    const { wonders } = JSON.parse(stdout);
    return {
      total: wonders.length,
      probeable: wonders.filter((w) => w.probes.length).length,
      anchored: wonders.filter((w) => !w.id.startsWith('wonder@')).length,
      substrates: wonders.reduce((n, w) => n + w.measures.length, 0),
    };
  },

  async routes() {
    const { stdout } = await run('node', [
      '--import', './scripts/lib/register-public-imports.mjs',
      'scripts/page-reasons.mjs', '--json',
    ], { cwd: ROOT, maxBuffer: 64e6 });
    const { routes } = JSON.parse(stdout);
    const conductive = routes.filter((r) => r.shellBands > 1 && r.wallTotal > 0);
    return {
      total: routes.length,
      conductive: conductive.length,
      flat: routes.filter((r) => r.shellBands <= 1).length,
      solely_hosting: routes.filter((r) => r.exclusive?.length).length,
    };
  },

  async expressions() {
    const manifest = await import(path.join(ROOT, 'public/js/generated/spw-expressions.js'));
    const entries = Object.entries(manifest.SPW_EXPRESSION_MANIFEST);
    const subjects = new Set(entries.map(([, s]) => s.subject));
    return {
      authored: entries.length,
      distinct_subjects: subjects.size,
      with_projection: entries.filter(([e]) => /<[^>]+>/.test(e)).length,
      compound: entries.filter(([e]) => /\}\s*[~&^]\s*\w/.test(e)).length,
    };
  },

  async corpus() {
    const surfaces = [];
    const walk = async (dir) => {
      for (const entry of await readdir(dir, { withFileTypes: true })) {
        if (['_workbench', 'gen', 'node_modules'].includes(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) await walk(full);
        else if (entry.name.endsWith('.spw')) surfaces.push(full);
      }
    };
    await walk(path.join(ROOT, '.spw'));

    let expressions = 0;
    let appositions = 0;
    let lifts = 0;
    for (const file of surfaces) {
      const source = await readFile(file, 'utf8');
      if (/^expression = /m.test(source)) expressions += 1;
      appositions += (source.match(/~#\w+\(/g) || []).length;
      lifts += (source.match(/\^\s\w+\[/g) || []).length;
    }
    return { surfaces: surfaces.length, with_expression: expressions, apposition_cells: appositions, lift_uses: lifts };
  },
};

/** The most recent precipitate, for deltas. */
async function previous() {
  let files = [];
  try {
    files = (await readdir(CACHES)).filter((f) => f.startsWith('precipitate-')).sort();
  } catch {
    return null;
  }
  if (!files.length) return null;
  const source = await readFile(path.join(CACHES, files[files.length - 1]), 'utf8');
  const found = {};
  for (const match of source.matchAll(/^\s{4}(\w+) = (-?[\d.]+)$/gm)) {
    found[match[1]] = Number(match[2]);
  }
  return { file: files[files.length - 1], values: found };
}

async function main() {
  const write = process.argv.includes('--write');
  const results = {};
  const unavailable = [];

  for (const [name, probe] of Object.entries(PROBES)) {
    try {
      results[name] = await probe();
    } catch (error) {
      unavailable.push({ name, why: (error.message || String(error)).split('\n')[0].slice(0, 90) });
    }
  }

  const prior = await previous();
  const lines = [];
  lines.push(`# Precipitate ${today()}`);
  lines.push('#');
  lines.push('# GENERATED by scripts/spw-precipitate.mjs — probe output lifted into corpus.');
  lines.push('# A single measurement is a number; two are a direction.');
  lines.push('');
  lines.push(`#>precipitate_${today().replace(/-/g, '_')}`);
  lines.push('#:cache #!precipitate');
  lines.push('#:operation #!cache');
  lines.push('#:fixity #!tending');
  lines.push('#:layer #!pragmatics');
  lines.push('');
  lines.push('@caches: ~"./index.spw"');
  lines.push('@dimensions: ~"../dimensions.spw"');
  lines.push('');
  lines.push('operation = "cache"');
  lines.push('fixity = "tending"');
  lines.push('');
  lines.push('expression = probe[output]{measure.delta.trend}<lift>');
  lines.push('');

  for (const [group, values] of Object.entries(results)) {
    lines.push(`^"${group}"{`);
    for (const [key, value] of Object.entries(values)) {
      lines.push(`    ${key} = ${value}`);
      const before = prior?.values?.[key];
      if (before !== undefined && before !== value) {
        const delta = value - before;
        lines.push(`    ~#delta(${key}): "${delta > 0 ? '+' : ''}${delta} since ${prior.file.replace('precipitate-', '').replace('.spw', '')}"`);
      }
    }
    lines.push('}');
    lines.push('');
  }

  if (unavailable.length) {
    lines.push('^"unavailable"{');
    lines.push('  ~#note: "a probe that could not run is recorded rather than aborting the precipitate"');
    for (const entry of unavailable) lines.push(`  ${entry.name}: \`${entry.why}\``);
    lines.push('}');
    lines.push('');
  }

  lines.push('^"validation"{');
  lines.push('  probe: `node scripts/spw-precipitate.mjs`');
  lines.push('  falsification: `a recorded value does not reproduce from its own probe`');
  lines.push('}');
  lines.push('');

  for (const [group, values] of Object.entries(results)) {
    console.log(`${group}:`);
    for (const [key, value] of Object.entries(values)) {
      const before = prior?.values?.[key];
      const delta = before !== undefined && before !== value ? `  (${value - before > 0 ? '+' : ''}${value - before})` : '';
      console.log(`  ${key.padEnd(20)} ${String(value).padStart(6)}${delta}`);
    }
  }
  for (const entry of unavailable) console.log(`unavailable: ${entry.name} — ${entry.why}`);

  if (write) {
    const out = path.join(CACHES, `precipitate-${today()}.spw`);
    await writeFile(out, lines.join('\n'), 'utf8');
    console.log(`\nwrote ${path.relative(ROOT, out)}`);
  } else {
    console.log(`\n${prior ? `prior: ${prior.file}` : 'no prior precipitate'} — re-run with --write`);
  }
}

main().catch((error) => {
  console.error('[precipitate]', error);
  process.exitCode = 1;
});
