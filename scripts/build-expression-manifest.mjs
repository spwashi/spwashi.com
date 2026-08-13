/**
 * Build the authored-expression manifest.
 *
 * 441 `data-spw-semantic-expression` values are declared across the routes and
 * the runtime has never known anything about them beyond the string. They are
 * valid Spw — `npm run spw:integrity` confirms all 441 parse into a container
 * sequence — but valid and inert, because the parser lives in the workbench and
 * the workbench is not shipped to the browser.
 *
 * So the parse happens here, at build time, and the browser receives the result.
 * That is the progressive-enhancement bargain: the page works with none of this,
 * the manifest arrives later and gives authored expressions consequences.
 * Nothing at runtime parses anything.
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
 * The kin index is deliberately *not* shipped. Inverting it at build time cost
 * 47KB on top of the manifest's 40KB, to save a single pass over 441 entries —
 * roughly a millisecond of work in exchange for doubling the transfer. The
 * runtime builds it on mount instead. Precomputation is only a win when the
 * computation is the expensive part, and here it is the cheapest part.
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

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public/js/generated/spw-expressions.js');

const SKIP = new Set([
  'node_modules', 'dist', 'dist-vite', '.git', '.spw', '.agents',
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
  const match = expression.match(/^([^[{<]+)(?:\[([^\]]*)\])?(?:\{([^}]*)\})?(?:<([^>]*)>)?/);
  if (!match) return { subject: expression, mode: '', parts: [], projection: '' };
  return {
    subject: (match[1] || '').trim(),
    mode: (match[2] || '').trim(),
    parts: (match[3] || '').split(/[.~]/).map((part) => part.trim()).filter(Boolean),
    projection: (match[4] || '').trim(),
  };
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

  await mkdir(path.dirname(OUT), { recursive: true });
  const body = `/**
 * GENERATED by scripts/build-expression-manifest.mjs — do not edit.
 *
 * Parsed shape of every data-spw-semantic-expression authored in the routes.
 * The parse happened at build time in the workbench; the browser only reads.
 * See .spw/conventions/arrival-electrostatics.spw and runtime/expression-hypergeometry.js.
 */

export const SPW_EXPRESSION_MANIFEST = Object.freeze(${JSON.stringify(manifest, null, 0)});


export const SPW_EXPRESSION_MANIFEST_META = Object.freeze({
  expressions: ${Object.keys(manifest).length},
  builtBy: 'scripts/build-expression-manifest.mjs',
  parser: 'spw-seed parse() — not parseExpression(), which truncates',
});
`;
  await writeFile(OUT, body, 'utf8');

  console.log(`[expressions] ${Object.keys(manifest).length} parsed → ${path.relative(ROOT, OUT)}`);
  if (skipped.length) {
    console.log(`[expressions] ${skipped.length} skipped (did not structure):`);
    for (const expression of skipped.slice(0, 5)) console.log(`  ${expression}`);
  }
}

main().catch((error) => {
  console.error('[expressions]', error);
  process.exitCode = 1;
});
