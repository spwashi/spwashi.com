/**
 * .spw integrity — can every citation still be followed?
 *
 * The `.spw` tree is becoming the upstream for site copy and component
 * architecture, which changes what a dangling reference costs. A broken
 * `~"./foo.spw#bar"` is not untidiness; it is a copy source that resolves to
 * nothing and a component spec with no definition behind it. The tree is
 * already in good shape — 2470 of 2480 path references resolve — so the point
 * of this script is to keep it that way as the tree starts feeding the site.
 *
 * .spw/caches/index.spw#cache_rules r4 states the known fragility by name:
 * "After a workbench submodule bump, re-check pathRefs that point into
 * ./_workbench/.spw (domains → surface-archetypes is the known rename family)."
 * That was a rule with no automation behind it. This is the automation.
 *
 * Four verdicts, kept separate because they need different repairs:
 *
 *   missing-file    the path does not exist. A rename happened and the citation
 *                   did not follow it.
 *   missing-anchor  the file exists but the `#fragment` names nothing in it.
 *                   The most dangerous class for copy: the source looks alive.
 *   malformed       the reference contains prose or a non-path separator, so it
 *                   was never resolvable and no tool ever said so.
 *   ok              resolves, anchor included.
 *
 * Resolution rules match how the surfaces actually cite things rather than an
 * idealized grammar — a checker that reports false positives gets ignored, and
 * an ignored checker is worse than none:
 *   - a leading `/` is a site route, resolved from the repo root, not the fs root
 *   - a trailing `/` is a directory citation and only needs the directory
 *   - anchors are matched against every declaration form in use: `#>name`,
 *     `^"name"{`, `^name[…]`, `frame #name`, and top-level `name:` / `name =`
 *
 * Extraction is delegated to the workbench rather than re-implemented here:
 * `spw query --selector pathRefs --json` returns AST-accurate references. The
 * first version of this script used a `~"([^"]+)"` regex instead and reported
 * 59 references the parser does not consider path refs at all — `~": "` inside
 * prose, `~", intent: "` inside a value. Every one was a false positive, and a
 * checker that cries wolf gets muted. The parser already knew; the regex did
 * not. So the boundary is: the workbench decides what a citation *is*, this
 * script decides whether it still *resolves*.
 *
 * That boundary is also the finding worth carrying back upstream. The workbench
 * emits citation targets as opaque strings — `./foo.spw#bar` arrives as one
 * value, unsplit and unclassified — so every consumer that wants to follow a
 * citation must re-derive path-vs-fragment, route-vs-file, and prose-vs-path
 * for itself, which is precisely where this script first went wrong. A resolved
 * citation (target split, kind classified, existence known) would be a more
 * meaningful intermediate form than a raw string, and `spw cite` / `spw follow`
 * do not provide it — they address content hashes, not references.
 *
 * The second dimension is the Spw embedded in HTML. `data-spw-semantic-expression`
 * declares an expression on 441 distinct copy elements and nothing had ever fed
 * one to the actual parser. The workbench ships one — @spwashi/spw-seed — so the
 * claim is checkable rather than assumed.
 *
 * The copy holds up: 440 of 441 parse and structure correctly through `parse()`,
 * the entry point that reads a surface. The authored noun form
 * `subject[mode]{parts}<projection>` becomes a real container sequence —
 * Capsule → Operation → ModifierChain → Frame → Parameter → Body — which is
 * also the form the site's own `expression = …` declarations use in
 * index/mount/domains/workspace/surfaces.spw.
 *
 * The divergence is between two entry points of the same parser, and it is
 * worth knowing before trusting either: `parseExpression()` truncates the same
 * text at its leading identifier, consuming 8 of 45 characters of
 * `surfaces[route]{path.role.archetype}<publish>` and leaving the frame, body
 * and modifier unread. Only 3 of the 441 survive it — the ones that happen to
 * lead with a sigil, since `&`, `~`, `^`, `$` and `?` do start an operation
 * there. So a consumer reaching for the obvious per-expression API gets a
 * silent truncation, while the file API is correct. This checks with `parse()`
 * and reports the gap rather than working around it.
 *
 * Runs under the workbench's tsx loader so the parser is importable; that is a
 * build-step dependency on mounted infrastructure, taken deliberately.
 *
 * Usage:
 *   npm run spw:integrity                    # report, exit 1 on missing-file/anchor
 *   npm run spw:integrity -- --json
 *   npm run spw:integrity -- --warn          # never exit non-zero
 */

import { readFile, stat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const CLI = [
  '--import',
  './.spw/_workbench/node_modules/tsx/dist/loader.mjs',
  '.spw/_workbench/packages/spw-cli/src/main.ts',
];

/**
 * Surfaces that are generated rather than authored. `spw cite --remember` and
 * the census/graph memo write here; their references are repo-root-relative and
 * belong to the tool, not to the tree.
 */
const GENERATED = ['.spw/gen/'];

/**
 * Roots to walk. `.spw` is the corpus; `.agents/skills` carries one `skill.spw`
 * per skill directory, cited from `.spw/skills/index.spw` but outside the corpus
 * walk. Adding it here is not tidiness — a schema rename left three stale refs
 * in those files that resolved from nowhere and were caught by hand. A citation
 * nothing checks is a citation that rots.
 */
const WALK_ROOTS = ['.spw', '.agents/skills'];

/** Ask the parser what the citations are. It knows; a regex does not. */
async function readPathRefs() {
  const { stdout } = await run('node', [...CLI, 'query', '--from', WALK_ROOTS.join(','),
    '--selector', 'pathRefs', '--json', '-n', '10000'], {
    cwd: ROOT,
    maxBuffer: 64 * 1024 * 1024,
  });
  const parsed = JSON.parse(stdout);
  return (parsed.rows || []).filter((row) => {
    if (GENERATED.some((dir) => row.file.startsWith(dir))) return false;
    // The submodule owns its own integrity; only citations *into* it are ours.
    return !row.file.includes('_workbench/');
  });
}

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

const anchorCache = new Map();

/**
 * Every form a surface uses to declare something citable. Collected from the
 * tree rather than from the spec, because the tree is what the citations point
 * at — `frame #loading-ecology-contract` is a real anchor in site-semantics.spw
 * and a checker that only knows `#>` reports it as broken.
 */
async function anchorsOf(file) {
  if (anchorCache.has(file)) return anchorCache.get(file);
  let source = '';
  try {
    source = await readFile(file, 'utf8');
  } catch {
    anchorCache.set(file, new Set());
    return anchorCache.get(file);
  }

  const anchors = new Set();
  const add = (re, group = 1) => {
    for (const match of source.matchAll(re)) anchors.add(match[group]);
  };
  add(/^#>([\w-]+)/gm);              // ground anchor
  add(/\^\["?([^"\]]+)"?\]\s*\{/g);  // ^["name"]{ projection
  add(/\^"([^"]+)"\s*\{/g);          // ^"name"{ projection
  add(/\^(\w+)\[/g);                 // ^factor[…] typed projection
  add(/^frame\s+#([\w-]+)/gm);       // frame #name
  add(/^\s{0,2}([\w-]+)\s*[:=]/gm);  // top-level key or bias

  anchorCache.set(file, anchors);
  return anchors;
}

function classifyTarget(raw) {
  const target = raw.trim();
  // Prose or an alternate separator smuggled into a path position. These were
  // never resolvable; nothing had ever told the author so.
  if (/\s\(|\s::\s|\s{2,}/.test(target)) return { kind: 'malformed', target };
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(target)) return { kind: 'external', target };
  return { kind: 'path', target };
}

async function checkRef(file, target) {
  const classified = classifyTarget(target);
  if (classified.kind !== 'path') {
    return classified.kind === 'external'
      ? { verdict: 'ok', external: true }
      : { verdict: 'malformed', detail: 'prose or non-path separator inside ~"…"' };
  }

  const [rawPath, fragment] = classified.target.split('#');
  // A leading slash is a site route, not a filesystem root.
  const resolved = rawPath.startsWith('/')
    ? path.join(ROOT, rawPath)
    : path.resolve(path.dirname(file), rawPath);

  if (!(await exists(resolved))) {
    return { verdict: 'missing-file', detail: rawPath, resolved: path.relative(ROOT, resolved) };
  }
  if (fragment && resolved.endsWith('.spw')) {
    const anchors = await anchorsOf(resolved);
    if (!anchors.has(fragment)) {
      return {
        verdict: 'missing-anchor',
        detail: `#${fragment}`,
        resolved: path.relative(ROOT, resolved),
      };
    }
  }
  return { verdict: 'ok' };
}

/**
 * Parse every `data-spw-semantic-expression` in the rendered routes.
 *
 * Uses `parse()` in a minimal file context rather than `parseExpression()`,
 * because the two disagree — see the header. Structure is confirmed by looking
 * for a Capsule or Operation in the tree: a bare Identifier means the frame and
 * body went unread, which is a truncation dressed as a success.
 */
async function checkExpressions() {
  let seed;
  try {
    seed = await import('../.spw/_workbench/packages/spw-seed/src/index.ts');
  } catch {
    return null; // Parser unavailable (no tsx loader); skip rather than fail.
  }

  const { stdout } = await run('find', [
    ROOT, '-name', 'index.html',
    '-not', '-path', '*/node_modules/*', '-not', '-path', '*/dist*',
    '-not', '-path', '*/.spw/*', '-not', '-path', '*/.git/*',
  ], { maxBuffer: 16 * 1024 * 1024 });

  const seen = new Map();
  for (const file of stdout.trim().split('\n').filter(Boolean)) {
    const source = await readFile(file, 'utf8');
    for (const match of source.matchAll(/data-spw-semantic-expression="([^"]+)"/g)) {
      if (!seen.has(match[1])) seen.set(match[1], path.relative(ROOT, file));
    }
  }

  const unstructured = [];
  let structured = 0;
  let standaloneOk = 0;
  for (const [expression, file] of seen) {
    const result = seed.parse(`expression = ${expression}\n`);
    const kinds = new Set();
    if (result.ast) seed.walkAST(result.ast, (node) => kinds.add(node.type));
    const ok = result.success && !(result.errors || []).length
      && (kinds.has('Capsule') || kinds.has('Operation'));
    if (ok) structured += 1;
    else unstructured.push({ expression, file });

    const span = seed.parseExpression(expression)?.ast?.span?.end?.offset ?? 0;
    if (span >= expression.length) standaloneOk += 1;
  }

  return { total: seen.size, structured, unstructured, standaloneOk };
}

async function main() {
  const args = process.argv.slice(2);
  const asJson = args.includes('--json');
  const warnOnly = args.includes('--warn');

  const rows = await readPathRefs();
  const findings = [];
  const total = rows.length;

  for (const row of rows) {
    const result = await checkRef(path.join(ROOT, row.file), row.target);
    if (result.verdict === 'ok') continue;
    findings.push({ file: row.file, line: row.line, target: row.target, ...result });
  }

  const files = new Set(rows.map((row) => row.file));

  const byVerdict = (verdict) => findings.filter((f) => f.verdict === verdict);
  const missingFile = byVerdict('missing-file');
  const missingAnchor = byVerdict('missing-anchor');
  const malformed = byVerdict('malformed');

  if (asJson) {
    console.log(JSON.stringify({
      generatedAt: new Date().toISOString(),
      scanned: files.size,
      pathRefs: total,
      findings,
    }, null, 2));
    return;
  }

  console.log('.spw integrity — can every citation still be followed?');
  console.log('='.repeat(66));
  console.log(`${files.size} surfaces, ${total} path references, ${total - findings.length} resolve`);
  console.log('');

  const section = (label, rows, note) => {
    console.log(`${label} (${rows.length})`);
    if (note && rows.length) console.log(`  ${note}`);
    for (const row of rows) {
      console.log(`  ${row.file}:${row.line}`);
      console.log(`    ~"${row.target}"  →  ${row.detail}`);
    }
    console.log('');
  };

  const expressions = await checkExpressions();
  if (expressions) {
    console.log(`semantic expressions — ${expressions.structured} of ${expressions.total} parse into a container sequence`);
    console.log(`  parseExpression() standalone consumes only ${expressions.standaloneOk} of them — use parse(), not parseExpression()`);
    for (const row of expressions.unstructured) {
      console.log(`  unstructured: ${row.file}`);
      console.log(`    ${row.expression}`);
    }
    console.log('');
  }

  section('missing-file — a rename the citation did not follow', missingFile);
  section('missing-anchor — file is alive, the section it names is not', missingAnchor,
    'most dangerous for copy: the source looks valid until you follow it');
  section('malformed — never resolvable, never reported', malformed);

  if (!findings.length) console.log('all citations resolve.');

  if (!warnOnly && (missingFile.length || missingAnchor.length)) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('[spw-integrity]', error);
  process.exitCode = 1;
});
