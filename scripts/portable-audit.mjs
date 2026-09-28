#!/usr/bin/env node
/**
 * Portable audit — the import-graph half of "can another site use this?"
 *
 * describeModuleHost() (catalog/normalize.js) reads a module's declared reach.
 * This reads what its code actually pulls in, across its static import
 * closure under public/js/:
 *   site-coupled imports   files that only make sense on spwashi.com
 *   document-relative URLs strings that resolve against the host page, not
 *                          against spwashi.com (root-relative assets, fetches,
 *                          location.origin), so they break on another origin
 *   context reads          ctx fields beyond what runtime/orchestration/host.js
 *                          provides
 * and says which stylesheets must travel with it (the ones that read what it
 * writes) and how many bytes its closure weighs.
 *
 * A module is portable when both halves agree; otherwise the report names each
 * blocker, so the fix is a list, not a guess.
 *
 * Usage:
 *   npm run audit:portable                 summary by verdict
 *   npm run audit:portable -- --json       every module, machine form
 *   npm run audit:portable -- --module=id  one module in full
 *   npm run audit:portable -- --out=FILE   write the manifest other sites read
 */

import './lib/register-public-imports.mjs';
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildCssReaderIndex } from './lib/css-readers.mjs';
import { parseBrowserModuleImports } from './typed/runtime-contracts/imports.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG_DIR = 'public/js/runtime/catalog';
const args = process.argv.slice(2);
const flag = (name) => args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3) || null;

const { MODULE_DEFS } = await import(path.join(ROOT, 'public/js/runtime/catalog/index.js'));
const { describeModuleHost } = await import(path.join(ROOT, 'public/js/runtime/catalog/normalize.js'));
const { formatModuleContractSpwLines, groupModuleUpdates } = await import(path.join(ROOT, 'public/js/runtime/catalog/contract-spw.js'));

/** Files whose presence in a closure ties a module to this site, and why. */
const SITE_COUPLED = Object.freeze([
  [/^public\/js\/kernel\/site-settings/, 'this site\'s settings profile'],
  [/^public\/js\/kernel\/grounded-registry\.js$/, 'this site\'s grounded memory'],
  [/^public\/js\/runtime\/shell\//, 'this site\'s chrome'],
  [/^public\/js\/runtime\/orchestration\/(?:loader|scheduler)\.js$/, 'the site loader'],
  [/^public\/js\/interface\//, 'this site\'s interface layer'],
]);

/** Strings that resolve against the host document instead of this module's URL. */
const DOCUMENT_URLS = Object.freeze([
  [/fetch\(\s*['"`]\/(?!\/)/, 'fetch of a root-relative URL'],
  [/['"`]\/public\/(?:data|images|css)\/[^'"`]*['"`]/, 'a root-relative asset path'],
  [/\blocation\.origin\b/, 'location.origin'],
]);

/** Files whose root-relative strings never reach the page as the host's URL, and why. */
const URL_SAFE = new Map([
  ['public/js/kernel/deferred-styles.js', 'resolves each href against its own module URL'],
  ['public/js/generated/image-provenance.js', 'stems matched against image sources, never requested'],
  ['public/js/runtime/orchestration/behavior-scopes.js', 'bundle hrefs reach the page only through the settings UI, which is site-coupled on its own'],
]);

/** What runtime/orchestration/host.js createHostContext() provides. */
const HOST_CONTEXT = new Set([
  'version', 'host', 'bus', 'html', 'body', 'main', 'route', 'features', 'regions',
  'runtimePolicy', 'now', 'timers', 'observers', 'addCleanup', 'addTimer', 'addObserver', 'cleanup',
]);

/**
 * What site.js puts on ctx. A read outside this set is some other `ctx` (a
 * canvas or audio context), not the module context, and is not a blocker.
 */
const SITE_CONTEXT = new Set([
  ...HOST_CONTEXT, 'registry', 'featureLab', 'routeFamily', 'pageCategory', 'debug', 'moduleAudit',
  'moduleSkipAuditKeys', 'resourceHints', 'resourceReadiness', 'pageAttentionTimers', 'cleanupStack',
  'clearTimers', 'destroy', 'disconnectObservers', 'runtimeTokensCleanup', 'pageSettleWatch', 'layoutShiftAudit',
]);

const read = (file) => readFileSync(path.join(ROOT, file), 'utf8');

function loadTarget(def) {
  const spec = String(def.load).match(/import\(\s*['"]([^'"]+)['"]\s*\)/)?.[1];
  return spec ? path.posix.normalize(path.posix.join(CATALOG_DIR, spec)) : null;
}

function resolveImport(from, specifier) {
  if (!specifier || /^(?:https?:)?\/\//.test(specifier)) return null;
  if (specifier.startsWith('/public/js/')) return specifier.slice(1).split(/[?#]/)[0];
  if (specifier.startsWith('.')) return path.posix.normalize(path.posix.join(path.posix.dirname(from), specifier)).split(/[?#]/)[0];
  return null;
}

const closures = new Map();
function staticClosure(entry) {
  if (closures.has(entry)) return closures.get(entry);
  const seen = new Set();
  const lazy = new Set();
  const visit = (file) => {
    if (seen.has(file)) return;
    let source;
    try { source = read(file); } catch { return; }
    seen.add(file);
    for (const item of parseBrowserModuleImports(source, file)) {
      const target = resolveImport(file, item.specifier);
      if (!target) continue;
      if (item.kind === 'dynamic') lazy.add(target);
      else visit(target);
    }
  };
  visit(entry);
  const result = { files: [...seen].sort(), lazy: [...lazy].filter((file) => !seen.has(file)).sort() };
  closures.set(entry, result);
  return result;
}

function documentUrls(files) {
  const found = [];
  for (const file of files) {
    if (URL_SAFE.has(file)) continue;
    const lines = read(file).split('\n');
    lines.forEach((line, index) => {
      if (/^\s*(?:\/\/|\*|\/\*)/.test(line)) return;
      for (const [pattern, reason] of DOCUMENT_URLS) {
        if (pattern.test(line)) found.push({ file, line: index + 1, reason });
      }
    });
  }
  return found;
}

function exportShape(entry) {
  const text = read(entry);
  if (/export\s+const\s+SPW_MODULE_EXPORT\b/.test(text)) return 'SPW_MODULE_EXPORT';
  if (/export\s+const\s+spwModule\b/.test(text)) return 'spwModule';
  const init = text.match(/export\s+(?:async\s+)?function\s+(init[A-Z]\w*)/)?.[1];
  return init || 'none';
}

const readersByToken = buildCssReaderIndex(ROOT);

const report = MODULE_DEFS.map((def) => {
  const entry = loadTarget(def);
  const host = describeModuleHost(def);
  if (!entry) return { id: def.id, verdict: 'site-only', blockers: ['no load path'] };
  const closure = staticClosure(entry);
  const coupled = [];
  for (const file of closure.files) {
    for (const [pattern, reason] of SITE_COUPLED) if (pattern.test(file)) coupled.push({ file, reason });
  }
  const urls = documentUrls(closure.files);
  const ctxReads = [...new Set([...read(entry).matchAll(/\bctx\??\.([A-Za-z_$][\w$]*)/g)].map((match) => match[1]))].sort();
  const extraCtx = ctxReads.filter((field) => SITE_CONTEXT.has(field) && !HOST_CONTEXT.has(field));
  const written = groupModuleUpdates(def.updates).flatMap(({ names }) => names);
  // Coverage splits the stylesheets that style this module from the ones that
  // merely react to a shared attribute it also writes.
  const coverage = new Map();
  for (const name of written) for (const file of readersByToken.get(name) || []) coverage.set(file, (coverage.get(file) || 0) + 1);
  const primary = [...coverage].filter(([, count]) => count * 2 >= written.length).map(([file]) => `/${file}`).sort();
  const alsoRead = [...coverage].filter(([, count]) => count * 2 < written.length).map(([file]) => `/${file}`).sort();
  const bytes = closure.files.reduce((sum, file) => sum + statSync(path.join(ROOT, file)).size, 0);
  const blockers = [
    ...coupled.map(({ file, reason }) => `imports ${file.replace('public/js/', '')} (${reason})`),
    ...urls.map(({ file, line, reason }) => `${reason} at ${file.replace('public/js/', '')}:${line}`),
    ...extraCtx.map((field) => `reads ctx.${field}, which a host context does not provide`),
  ];
  const verdict = blockers.length ? 'site-only' : host.portability;
  return {
    id: def.id,
    verdict,
    declared: host.portability,
    needs: host.needs,
    entry: `/${entry}`,
    export: exportShape(entry),
    selector: def.selector || null,
    rootMode: def.rootMode || 'single',
    closure: closure.files.length,
    lazy: closure.lazy.length,
    bytes,
    css: { primary, alsoRead },
    blockers,
    describes: def.describes || null,
    spw: formatModuleContractSpwLines(def),
  };
}).sort((a, b) => a.id.localeCompare(b.id));

const byVerdict = (verdict) => report.filter((row) => row.verdict === verdict);

if (flag('module')) {
  console.log(JSON.stringify(report.find((row) => row.id === flag('module')) || null, null, 2));
} else if (args.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else if (flag('out')) {
  const manifest = {
    about: 'Modules another origin can mount with runtime/orchestration/host.js. portable: markup and css.primary suffice; host-policy: the page must also accept the listed needs. css.alsoRead lists stylesheets that react to a shared attribute the module writes. Built by scripts/portable-audit.mjs.',
    host: '/public/js/runtime/orchestration/host.js',
    modules: report.filter((row) => row.verdict !== 'site-only' && row.export !== 'none')
      .map(({ blockers, declared, ...row }) => row),
  };
  writeFileSync(path.resolve(ROOT, flag('out')), `${JSON.stringify(manifest)}\n`);
  console.log(`[portable] wrote ${flag('out')}: ${manifest.modules.length} mountable modules`);
} else {
  const blocked = report.filter((row) => row.verdict === 'site-only' && row.declared !== 'site-only');
  console.log(`[portable] ${report.length} modules: ${byVerdict('portable').length} portable, ${byVerdict('host-policy').length} host-policy, ${byVerdict('site-only').length} site-only`);
  console.log(`[portable] declared portable or host-policy but blocked by their code: ${blocked.length}`);
  const reasons = new Map();
  for (const row of blocked) for (const blocker of row.blockers) {
    const key = blocker.replace(/ at .*$/, '').replace(/^imports \S+ /, 'imports ');
    reasons.set(key, (reasons.get(key) || 0) + 1);
  }
  for (const [reason, count] of [...reasons].sort((a, b) => b[1] - a[1])) console.log(`  ${String(count).padStart(3)}× ${reason}`);
  console.log('[portable] portable now:');
  for (const row of byVerdict('portable')) console.log(`  ${row.id.padEnd(30)} ${String(Math.round(row.bytes / 1024)).padStart(4)} KiB  ${row.closure} files  css ${row.css.primary.join(' ') || '—'}`);
}
