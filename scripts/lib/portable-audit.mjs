/**
 * Shared portability & per-file module contract analyzer.
 *
 * Consumed by scripts/portable-audit.mjs (CLI + machine manifest) and
 * scripts/generate-runtime-atlas.mjs (/design/runtime/ explorer + static ratchets).
 */

import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

import { buildCssReaderIndex } from './css-readers.mjs';
import { parseBrowserModuleImports } from '../typed/runtime-contracts/imports.mjs';

const CATALOG_DIR = 'public/js/runtime/catalog';

/** Files whose presence in a closure ties a module to this site, and why. */
export const SITE_COUPLED = Object.freeze([
  [/^public\/js\/kernel\/site-settings/, "this site's settings profile"],
  [/^public\/js\/kernel\/grounded-registry\.js$/, "this site's grounded memory"],
  [/^public\/js\/runtime\/shell\//, "this site's chrome"],
  [/^public\/js\/runtime\/orchestration\/(?:loader|scheduler)\.js$/, 'the site loader'],
  [/^public\/js\/interface\//, "this site's interface layer"],
]);

/** Strings that resolve against the host document instead of this module's URL. */
export const DOCUMENT_URLS = Object.freeze([
  [/fetch\(\s*['"`]\/(?!\/)/, 'fetch of a root-relative URL'],
  [/['"`]\/public\/(?:data|images|css)\/[^'"`]*['"`]/, 'a root-relative asset path'],
  [/\blocation\.origin\b/, 'location.origin'],
]);

/** Files whose root-relative strings never reach the page as the host's URL, and why. */
export const URL_SAFE = new Map([
  ['public/js/kernel/deferred-styles.js', 'resolves each href against its own module URL'],
  ['public/js/generated/image-provenance.js', 'stems matched against image sources, never requested'],
  ['public/js/runtime/orchestration/behavior-scopes.js', 'bundle hrefs reach the page only through the settings UI, which is site-coupled on its own'],
]);

/** What runtime/orchestration/host.js createHostContext() provides. */
export const HOST_CONTEXT = new Set([
  'version', 'host', 'bus', 'html', 'body', 'main', 'route', 'features', 'regions',
  'runtimePolicy', 'now', 'timers', 'observers', 'addCleanup', 'addTimer', 'addObserver', 'cleanup',
]);

/** What site.js puts on ctx beyond createHostContext(). */
export const SITE_CONTEXT = new Set([
  ...HOST_CONTEXT, 'registry', 'featureLab', 'routeFamily', 'pageCategory', 'debug', 'moduleAudit',
  'moduleSkipAuditKeys', 'resourceHints', 'resourceReadiness', 'pageAttentionTimers', 'cleanupStack',
  'clearTimers', 'destroy', 'disconnectObservers', 'runtimeTokensCleanup', 'pageSettleWatch', 'layoutShiftAudit',
]);

export function loadTargetFromDef(def) {
  const spec = String(def.load).match(/import\(\s*['"]([^'"]+)['"]\s*\)/)?.[1];
  return spec ? path.posix.normalize(path.posix.join(CATALOG_DIR, spec)) : null;
}

function resolveImport(from, specifier) {
  if (!specifier || /^(?:https?:)?\/\//.test(specifier)) return null;
  if (specifier.startsWith('/public/js/')) return specifier.slice(1).split(/[?#]/)[0];
  if (specifier.startsWith('.')) return path.posix.normalize(path.posix.join(path.posix.dirname(from), specifier)).split(/[?#]/)[0];
  return null;
}

function unwrapObjectLiteral(expr) {
  if (!expr) return null;
  if (ts.isObjectLiteralExpression(expr)) return expr;
  if (ts.isCallExpression(expr) && expr.arguments.length === 1) {
    return unwrapObjectLiteral(expr.arguments[0]);
  }
  if (ts.isParenthesizedExpression(expr)) return unwrapObjectLiteral(expr.expression);
  return null;
}

function readStaticValue(node) {
  if (!node) return null;
  if (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text.trim();
  }
  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.map(readStaticValue).filter(Boolean);
  }
  if (ts.isCallExpression(node) && node.arguments.length === 1) {
    return readStaticValue(node.arguments[0]);
  }
  return null;
}

/** Side-effect-free extraction of SPW_MODULE_EXPORT.contract from an ES module file. */
export function extractModuleExportContract(source = '', filename = 'module.js') {
  if (!source.includes('SPW_MODULE_EXPORT') && !source.includes('spwModule')) return null;
  const sf = ts.createSourceFile(filename, source, ts.ScriptTarget.ES2022, false, ts.ScriptKind.JS);
  for (const stmt of sf.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    const isExported = stmt.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.ExportKeyword);
    if (!isExported) continue;
    for (const decl of stmt.declarationList.declarations) {
      const name = decl.name?.getText?.(sf);
      if (name !== 'SPW_MODULE_EXPORT' && name !== 'spwModule') continue;
      const obj = unwrapObjectLiteral(decl.initializer);
      if (!obj) continue;
      for (const prop of obj.properties) {
        if (!ts.isPropertyAssignment(prop)) continue;
        const key = prop.name?.getText?.(sf)?.replace(/['"]/g, '');
        if (key !== 'contract') continue;
        const contractObj = unwrapObjectLiteral(prop.initializer);
        if (!contractObj) continue;
        const out = {};
        for (const field of contractObj.properties) {
          if (!ts.isPropertyAssignment(field)) continue;
          const fieldName = field.name?.getText?.(sf)?.replace(/['"]/g, '');
          if (!fieldName) continue;
          const value = readStaticValue(field.initializer);
          if (value != null) out[fieldName] = value;
        }
        return Object.keys(out).length ? out : null;
      }
    }
  }
  return null;
}

export async function analyzePortableModules({
  root,
  defs,
  readersByToken = buildCssReaderIndex(root),
} = {}) {
  const { describeModuleHost } = await import(path.join(root, 'public/js/runtime/catalog/normalize.js'));
  const { formatModuleContractSpwLines, groupModuleUpdates } = await import(path.join(root, 'public/js/runtime/catalog/contract-spw.js'));

  const fileCache = new Map();
  const read = (file) => {
    if (!fileCache.has(file)) fileCache.set(file, readFileSync(path.join(root, file), 'utf8'));
    return fileCache.get(file);
  };

  const closures = new Map();
  const staticClosure = (entry) => {
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
  };

  const documentUrls = (files) => {
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
  };

  const exportShape = (entry) => {
    const text = read(entry);
    if (/export\s+const\s+SPW_MODULE_EXPORT\b/.test(text)) return 'SPW_MODULE_EXPORT';
    if (/export\s+const\s+spwModule\b/.test(text)) return 'spwModule';
    const init = text.match(/export\s+(?:async\s+)?function\s+(init[A-Z]\w*)/)?.[1];
    return init || 'none';
  };

  const report = defs.map((def) => {
    const entry = loadTargetFromDef(def);
    const host = describeModuleHost(def);
    if (!entry) return { id: def.id, verdict: 'site-only', declared: host.portability, blockers: ['no load path'], contract: null };
    const entryText = read(entry);
    const closure = staticClosure(entry);
    const coupled = [];
    for (const file of closure.files) {
      for (const [pattern, reason] of SITE_COUPLED) if (pattern.test(file)) coupled.push({ file, reason });
    }
    const urls = documentUrls(closure.files);
    const ctxReads = [...new Set([...entryText.matchAll(/\bctx\??\.([A-Za-z_$][\w$]*)/g)].map((match) => match[1]))].sort();
    const extraCtx = ctxReads.filter((field) => SITE_CONTEXT.has(field) && !HOST_CONTEXT.has(field));
    const written = groupModuleUpdates(def.updates).flatMap(({ names }) => names);
    const coverage = new Map();
    for (const name of written) for (const file of readersByToken.get(name) || []) coverage.set(file, (coverage.get(file) || 0) + 1);
    const primary = [...coverage].filter(([, count]) => count * 2 >= written.length).map(([file]) => `/${file}`).sort();
    const alsoRead = [...coverage].filter(([, count]) => count * 2 < written.length).map(([file]) => `/${file}`).sort();
    const bytes = closure.files.reduce((sum, file) => sum + statSync(path.join(root, file)).size, 0);
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
      contract: extractModuleExportContract(entryText, entry),
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

  return report;
}
