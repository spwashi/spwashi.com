/**
 * Build the authored-expression manifest.
 *
 * 441 `data-spw-semantic-expression` values are declared across the routes and
 * the runtime has never known anything about them beyond the string. They are
 * valid Spw — `npm run spw:integrity` confirms all 441 parse into a container
 * sequence — but valid and inert, because the parser lives in the workbench and
 * the workbench parser is not on the critical path.
 *
 * So the parse for kinship happens here, at build time, and the browser
 * receives the result. The page works with none of this. A runtime parser is
 * still available on demand (`__SPW_SITE__.parser.parse`) so rival readings
 * can be checked against the kernel without making every page wait for it.
 *
 * What a parse yields, and why it is more than the string:
 *
 *   subject     the leading identifier — `settings` in settings[tune]{…}
 *   mode        the frame parameter — what the subject is being read as
 *   parts       the body terms — what it is composed of
 *   projection  the modifier chain — `<publish>`, `<bridge>`, where it goes
 *
 * The first version of this also emitted a `rank` — a count of distinct
 * container kinds in the parse tree, meant as a hypergeometric dimension. It
 * was measured and dropped: 425 of 441 expressions scored identically, and max
 * tree depth was 7 for 438 of them. The grammar builds the same containers for
 * every authored expression, so nothing about the *tree* discriminates. A
 * constant presented as a dimension is worse than no dimension.
 *
 * What varies is the content, and it varies a lot: 205 distinct subjects, 292
 * modes, 501 parts, and 423 of 441 expressions share at least one of those with
 * another expression. That sharing is the real higher-order structure — and it
 * is already named in the site's physics. @electrostatic_affordances calls it
 * inductance: "Cluster + :has([data-spw-operator=X]). Kin of the same terminal
 * share momentum." Two expressions that share a subject, a mode, or a body part
 * are kin, and the graph of that kinship is what the runtime can spend.
 *
 * The kin index is deliberately *not* shipped. It is derivable from data already
 * in this file, so emitting it alongside would be duplication that can drift
 * from its source; the runtime builds it on mount instead. Both that build and
 * the 47KB it would have added land off the critical path — expression-resonance
 * mounts at IDLE and imports this manifest dynamically — so the choice is about
 * having one source of truth, not about speed.
 *
 * Route lists are dropped for the same reason: resonance needs the shape, not
 * the provenance. `npm run reasons` already answers which routes carry what.
 *
 * Uses parse(), never parseExpression() — see .spw/README.md#known-workbench-gaps
 * for why the two disagree and why the standalone one truncates silently.
 *
 * Usage:
 *   npm run manifest:expressions
 */

import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readBodyJoins, readJoinChain } from '../public/js/semantic/expression-query.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public/js/generated/spw-expressions.js');

const SKIP = new Set([
  'node_modules', 'dist', 'dist-vite', '.git', '.spw', '.agents', '.references', '.tmp',
  'coverage', 'tmp', 'scripts', 'src',
]);


async function collectRoutes(dir = ROOT, out = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP.has(entry.name)) continue;
      await collectRoutes(full, out);
    } else if (entry.name === 'index.html') {
      out.push(full);
    }
  }
  return out;
}

/**
 * Pull subject / mode / parts / projection out of the authored form without
 * re-deriving them from the tree. The parse is what proves the expression is
 * well-formed; these are the fields the runtime actually wants, and reading
 * them off the source keeps the manifest small enough to ship.
 */
function readShape(expression) {
  const chain = readJoinChain(expression);
  const match = expression.match(/^([^[{<]+)(?:\[([^\]]*)\])?(?:\{([^}]*)\})?(?:<([^>]*)>)?/);
  if (!match) {
    return { subject: expression, mode: '', parts: chain.parts, projection: '', join: chain.kind };
  }
  const body = readBodyJoins(match[3] || '');
  const parts = chain.kind === 'crawl' || chain.kind === 'project' ? chain.parts : body.parts;
  return {
    subject: (match[1] || '').trim(),
    mode: (match[2] || '').trim(),
    parts,
    projection: (match[4] || '').trim(),
    join: chain.kind === 'none' ? body.kind : chain.kind,
  };
}

async function collectSpwProjections(dir = path.join(ROOT, '.spw'), results = { handles: {}, perspectives: {} }) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === '_workbench' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectSpwProjections(full, results);
    } else if (entry.name.endsWith('.spw')) {
      const relPath = path.relative(ROOT, full).split(path.sep).join('/');
      const content = await readFile(full, 'utf8');

      // Extract perspectives: @name: ~"path"
      for (const match of content.matchAll(/^@([a-zA-Z0-9_\-]+):\s*~"([^"]+)"/gm)) {
        results.perspectives[match[1]] = match[2];
      }

      // Extract frames / handles: #>name
      const handleMatches = [...content.matchAll(/^#>([a-zA-Z0-9_\-]+)/gm)];
      for (const match of handleMatches) {
        const handle = match[1];
        if (!results.handles[handle]) {
          results.handles[handle] = {
            source: relPath,
            claims: {},
          };
        }
      }

      // Extract claims: #:key #!val
      for (const match of content.matchAll(/^#:([a-zA-Z0-9_\-]+)\s+#!([^\n]+)/gm)) {
        const key = match[1];
        const val = match[2].trim();
        for (const h of handleMatches) {
          const handle = h[1];
          if (results.handles[handle]) {
            results.handles[handle].claims[key] = val;
          }
        }
      }
    }
  }
  return results;
}

async function main() {
  let seed;
  try {
    seed = await import('../.spw/_workbench/packages/spw-seed/src/index.ts');
  } catch (error) {
    console.error('[expressions] parser unavailable — run under the workbench tsx loader');
    process.exitCode = 1;
    return;
  }

  const files = await collectRoutes();
  const seen = new Map();
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    for (const match of source.matchAll(/data-spw-semantic-expression="([^"]+)"/g)) {
      const expression = match[1];
      if (!seen.has(expression)) seen.set(expression, new Set());
      seen.get(expression).add(`/${path.relative(ROOT, file).replace(/index\.html$/, '')}`);
    }
  }

  const manifest = {};
  const skipped = [];
  for (const expression of seen.keys()) {
    const result = seed.parse(`expression = ${expression}\n`);
    if (!result.success || (result.errors || []).length) {
      skipped.push(expression);
      continue;
    }

    const kinds = new Set();
    if (result.ast) seed.walkAST(result.ast, (node) => kinds.add(node.type));
    if (!kinds.has('Capsule') && !kinds.has('Operation')) {
      skipped.push(expression);
      continue;
    }

    // Shape only — see the header on why routes and the kin index are omitted.
    manifest[expression] = readShape(expression);
  }

  const projections = await collectSpwProjections();

  await mkdir(path.dirname(OUT), { recursive: true });
  const body = `/**
 * GENERATED by scripts/build-expression-manifest.mjs — do not edit.
 *
 * Parsed shape of every data-spw-semantic-expression authored in the routes,
 * alongside .spw projection seeds harvested across the .spw canon.
 * The parse happened at build time in the workbench; the browser only reads.
 * See .spw/conventions/arrival-electrostatics.spw and runtime/expression-hypergeometry.js.
 */

export const SPW_EXPRESSION_MANIFEST = Object.freeze(${JSON.stringify(manifest, null, 0)});

export const SPW_PROJECTION_SEEDS = Object.freeze(${JSON.stringify(projections, null, 0)});

export const SPW_EXPRESSION_MANIFEST_META = Object.freeze({
  expressions: ${Object.keys(manifest).length},
  handles: ${Object.keys(projections.handles).length},
  perspectives: ${Object.keys(projections.perspectives).length},
  builtBy: 'scripts/build-expression-manifest.mjs',
  parser: 'spw-seed parse() — not parseExpression(), which truncates',
});
`;
  await writeFile(OUT, body, 'utf8');

  console.log(`[expressions] ${Object.keys(manifest).length} parsed expressions + ${Object.keys(projections.handles).length} .spw handles → ${path.relative(ROOT, OUT)}`);
  if (skipped.length) {
    console.log(`[expressions] ${skipped.length} skipped (did not structure):`);
    for (const expression of skipped.slice(0, 5)) console.log(`  ${expression}`);
  }
}

main().catch((error) => {
  console.error('[expressions]', error);
  process.exitCode = 1;
});
