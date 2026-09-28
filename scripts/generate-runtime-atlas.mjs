#!/usr/bin/env node
/**
 * Runtime atlas — the site's data structures as one reviewable file.
 *
 * public/data/runtime-atlas.json answers, for a reader or the /design/runtime/
 * explorer: which families the runtime lives in, what each module's contract
 * says (and its Spw sentence), which stylesheets key on what a module writes,
 * which bus events it emits or hears, how the tree has moved, how readable it
 * is by the ratchets the checks already count, and which folios share a
 * handle. The file is committed and deterministic (sorted, no clock), so its
 * git history is the version axis: `git log -p public/data/runtime-atlas.json`
 * reads as the structure changing.
 *
 * Usage:
 *   node --import ./scripts/lib/register-public-imports.mjs scripts/generate-runtime-atlas.mjs
 *   … --check    exit 1 when the committed atlas is stale
 *   … --stdout   print instead of writing
 *   … --out=FILE write the JSON there and leave the page alone (the deploy
 *                build's fresh copy; a shallow clone keeps the committed moves)
 */

// The catalog imports /public/js/ specifiers; the hook resolves them under Node,
// so the script also runs when the build spawns it without --import.
import './lib/register-public-imports.mjs';
import { execFileSync } from 'node:child_process';
import { buildCssReaderIndex } from './lib/css-readers.mjs';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = 'public/data/runtime-atlas.json';
const CATALOG_DIR = 'public/js/runtime/catalog';
const args = new Set(process.argv.slice(2));

const { MODULE_DEFS, EFFECT_SCOPE_TIER, CATALOG_DEF_FIELDS } = await import(path.join(ROOT, 'public/js/runtime/catalog/index.js'));
const { formatModuleContractSpwLines, groupModuleUpdates } = await import(path.join(ROOT, 'public/js/runtime/catalog/contract-spw.js'));
const { describeModuleHost } = await import(path.join(ROOT, 'public/js/runtime/catalog/normalize.js'));

const read = (file) => readFileSync(path.join(ROOT, file), 'utf8');
const sorted = (list) => [...new Set(list)].sort();

function walk(dir, test, out = []) {
  for (const entry of readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const child = `${dir}/${entry.name}`;
    if (entry.isDirectory()) walk(child, test, out);
    else if (test(child)) out.push(child);
  }
  return out;
}

function loadTarget(def) {
  const spec = String(def.load).match(/import\(\s*['"]([^'"]+)['"]\s*\)/)?.[1];
  return spec ? path.posix.normalize(path.posix.join(CATALOG_DIR, spec)) : null;
}

// ── Families ────────────────────────────────────────────────────────────────
const idsByFile = new Map();
for (const def of MODULE_DEFS) {
  const file = loadTarget(def);
  if (file) idsByFile.set(file, [...(idsByFile.get(file) || []), def.id]);
}
const runtimeFiles = walk('public/js/runtime', (file) => file.endsWith('.js'));
const families = sorted(runtimeFiles.map((file) => file.split('/')[3])).map((name) => {
  const files = runtimeFiles.filter((file) => file.split('/')[3] === name).sort();
  return {
    name,
    files: files.map((file) => ({
      path: file,
      lines: read(file).split('\n').length,
      modules: (idsByFile.get(file) || []).sort(),
    })),
  };
});

// ── CSS readers: which stylesheets key on a written attribute or property ───
const readersByToken = buildCssReaderIndex(ROOT);

// ── Bus edges from each module's entry file ─────────────────────────────────
function busEdges(file) {
  if (!file) return { emits: [], hears: [] };
  let text = '';
  try { text = read(file); } catch { return { emits: [], hears: [] }; }
  const emits = [...text.matchAll(/\.emit\(\s*['"`]([a-z][\w:.-]+)['"`]/g)].map((match) => match[1]);
  const hears = [...text.matchAll(/\.on\(\s*['"`]([a-z][\w:.-]+)['"`]/g)].map((match) => match[1]);
  return { emits: sorted(emits), hears: sorted(hears) };
}

// ── Modules ─────────────────────────────────────────────────────────────────
const writtenTokens = new Set();
const modules = MODULE_DEFS.map((def) => {
  const file = loadTarget(def);
  const writes = groupModuleUpdates(def.updates);
  for (const { names } of writes) for (const name of names) writtenTokens.add(name);
  const host = describeModuleHost(def);
  return {
    id: def.id,
    layer: def.layer,
    when: def.when,
    family: file?.startsWith('public/js/runtime/') ? file.split('/')[3] : file?.split('/')[2] || null,
    file,
    selector: def.selector || null,
    rootMode: def.rootMode || 'single',
    features: [].concat(def.features || []),
    route: [].concat(def.route || []),
    describes: def.describes || null,
    effectScope: def.effectScope || [],
    tiers: host.tiers,
    portability: host.portability,
    evaluates: def.evaluates || [],
    writes,
    cost: def.costLabel || null,
    timingArc: def.timingArc || null,
    visual: def.visual || null,
    bus: busEdges(file),
    spw: formatModuleContractSpwLines(def),
  };
}).sort((a, b) => a.id.localeCompare(b.id));

// ── Moves: the tree changing, from git's own rename detection ───────────────
function gitMoves() {
  let text = '';
  try {
    text = execFileSync('git', ['log', '-M', '--diff-filter=R', '--name-status', '--format=@%h|%ad|%s', '--date=short', '--', 'public/js'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch {
    return [];
  }
  const commits = [];
  let current = null;
  for (const line of text.split('\n')) {
    if (line.startsWith('@')) {
      const [hash, date, ...subject] = line.slice(1).split('|');
      current = { hash, date, subject: subject.join('|'), moves: [] };
      commits.push(current);
    } else if (current && line.startsWith('R')) {
      const [, from, to] = line.split('\t');
      if (from && to) current.moves.push({ from, to });
    }
  }
  return commits.filter((commit) => commit.moves.length).slice(0, 24);
}

// ── Readability ratchets: counts the checks already keep ────────────────────
function ratchets() {
  const baseline = JSON.parse(read('scripts/module-writer-baseline.json'));
  const count = (section) => Object.values(baseline[section] || {}).reduce((sum, list) => sum + (Array.isArray(list) ? list.length : 1), 0);
  let tree = {};
  try {
    tree = JSON.parse(execFileSync(process.execPath, ['scripts/js-tree-value.mjs', '--json'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
  } catch {
    tree = {};
  }
  return {
    runtimeFamilies: families.length,
    looseRuntimeFiles: runtimeFiles.filter((file) => file.split('/').length === 4).length,
    catalogModules: modules.length,
    catalogFields: Object.keys(CATALOG_DEF_FIELDS).length,
    effectScopeTokens: Object.keys(EFFECT_SCOPE_TIER).length,
    undeclaredRootWrites: count('undeclared'),
    sharedFileRootWrites: count('sharedWriters'),
    // multiWriter maps a token to its owners: the ratchet counts tokens.
    multiOwnerRootTokens: Object.keys(baseline.multiWriter || {}).length,
    jsFiles: tree.files ?? null,
    jsLines: tree.lines ?? null,
    orphans: Array.isArray(tree.orphans) ? tree.orphans.length : null,
    portable: modules.filter((module) => module.portability === 'portable').length,
    hostPolicy: modules.filter((module) => module.portability === 'host-policy').length,
    siteOnly: modules.filter((module) => module.portability === 'site-only').length,
  };
}

// ── Folio handles: the content graph the sidecars index ─────────────────────
function folioHandles() {
  const handles = new Map();
  const pieces = [];
  for (const dir of ['public/images/assets/folios', 'public/images/assets/panels', 'public/images/assets/worktable']) {
    let names = [];
    try { names = readdirSync(path.join(ROOT, dir)).filter((name) => name.endsWith('.spw')); } catch { continue; }
    for (const name of names.sort()) {
      const text = read(`${dir}/${name}`);
      const list = text.match(/^\s*handles:\s*\[([^\]]*)\]/m)?.[1];
      if (!list) continue;
      const stem = name.slice(0, -4);
      const title = text.match(/^\s*title:\s*"([^"]*)"/m)?.[1] || stem;
      const id = text.match(/^\s*id:\s*"([^"]*)"/m)?.[1] || null;
      const opens = text.match(/^\s*opens:\s*`([^`]*)`/m)?.[1] || null;
      const found = [...list.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
      pieces.push({ stem, id, title, dir, handles: found, opens });
      for (const handle of found) handles.set(handle, [...(handles.get(handle) || []), stem]);
    }
  }
  return {
    pieces,
    handles: [...handles].map(([handle, stems]) => ({ handle, pieces: stems.sort() }))
      .sort((a, b) => b.pieces.length - a.pieces.length || a.handle.localeCompare(b.handle)),
  };
}

// One reader index for every name a module writes: the JS→CSS edge, stored once.
const readers = Object.fromEntries([...writtenTokens].sort()
  .map((token) => [token, sorted(readersByToken.get(token) || [])])
  .filter(([, files]) => files.length));

const outFlag = process.argv.slice(2).find((arg) => arg.startsWith('--out='))?.slice('--out='.length) || null;
let moves = gitMoves();
if (!moves.length) {
  // A shallow checkout has no rename history; the committed ledger still does.
  try { moves = JSON.parse(read(OUT)).moves || []; } catch { moves = []; }
}

const atlas = {
  about: 'Runtime atlas: families, module contracts, JS→CSS and bus edges, moves, ratchets, and folio handles. Generated by scripts/generate-runtime-atlas.mjs; its git history is the version axis.',
  families,
  modules,
  readers,
  moves,
  ratchets: ratchets(),
  folios: folioHandles(),
};

// ── The static reading on /design/runtime/, for a page with no JS ──────────
const PAGE = 'design/runtime/index.html';
const esc = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function renderStatic() {
  const pad = ' '.repeat(16);
  const r = atlas.ratchets;
  const facts = [
    ['families', r.runtimeFamilies], ['modules', r.catalogModules], ['portable', r.portable],
    ['host-policy', r.hostPolicy], ['site-only', r.siteOnly], ['loose runtime files', r.looseRuntimeFiles],
    ['undeclared root writes', r.undeclaredRootWrites], ['multi-owner root tokens', r.multiOwnerRootTokens],
  ];
  const lines = [
    `${pad}<div class="runtime-atlas__static">`,
    `${pad}    <dl class="runtime-atlas__ratchets">`,
    ...facts.map(([label, value]) => `${pad}        <div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`),
    `${pad}    </dl>`,
    `${pad}    <ol class="runtime-atlas__families">`,
    ...families.map((family) => {
      const ids = family.files.flatMap((file) => file.modules);
      return `${pad}        <li><h3>${esc(family.name)}</h3><p>${family.files.length} file${family.files.length === 1 ? '' : 's'}${ids.length ? ` · ${esc(ids.join(', '))}` : ''}</p></li>`;
    }),
    `${pad}    </ol>`,
    `${pad}</div>`,
  ];
  return lines.join('\n');
}
function withStatic(html) {
  return html.replace(/(<!-- runtime-atlas:static -->)[\s\S]*?(\n[ \t]*<!-- \/runtime-atlas:static -->)/, `$1\n${renderStatic()}$2`);
}

// One module, family, or reader per line: diffs read as structure changing.
const text = `${JSON.stringify(atlas, (key, value) => value, 0)
  .replace(/,"(families|modules|readers|moves|ratchets|folios)":/g, ',\n"$1":')
  .replace(/\},\{"(id|name|hash|stem|handle)":/g, '},\n{"$1":')}\n`;
if (args.has('--stdout')) {
  process.stdout.write(text);
} else if (outFlag) {
  writeFileSync(path.resolve(ROOT, outFlag), text);
  console.log(`[atlas] wrote ${outFlag}: ${families.length} families, ${modules.length} modules, ${moves.length} move commits`);
} else if (args.has('--check')) {
  let committed = '';
  try { committed = read(OUT); } catch { committed = ''; }
  const page = read(PAGE);
  if (committed !== text || page !== withStatic(page)) {
    console.error(`[atlas] ${committed !== text ? OUT : PAGE} is stale; run npm run atlas`);
    process.exit(1);
  }
  console.log('[atlas] current');
} else {
  writeFileSync(path.join(ROOT, OUT), text);
  writeFileSync(path.join(ROOT, PAGE), withStatic(read(PAGE)));
  const r = atlas.ratchets;
  console.log(`[atlas] ${OUT}: ${families.length} families, ${modules.length} modules, ${atlas.moves.length} move commits, ${atlas.folios.pieces.length} pieces, ${atlas.folios.handles.length} handles; ${Math.round(statSync(path.join(ROOT, OUT)).size / 1024)} KiB; loose=${r.looseRuntimeFiles} undeclared=${r.undeclaredRootWrites} portable=${r.portable}`);
}
