import { promises as fs } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

import { isErrnoCode } from '../shared/build-topology.mjs';

export const ALLOWED_JS_OWNER_DIRECTORIES = new Set([
  'generated', 'interface', 'kernel', 'media', 'modules', 'runtime', 'semantic', 'typed',
]);
const ROOT_ENTRYPOINTS = new Set(['compose.js', 'site.js']);
const CATALOG_FAMILIES = new Set([
  'runtime/catalog/core.js', 'runtime/catalog/feature.js',
  'runtime/catalog/region.js', 'runtime/catalog/enhancement.js',
]);

// These two existing APIs intentionally choose a module at runtime. The
// allowance names the expression as well as its owner, so another computed
// import in the same file still requires an explicit contract decision.
const COMPUTED_IMPORTS = new Map([
  ['kernel/shared.js', 'specifier'],
  ['semantic/pretext-utils.js', 'CDN_URL'],
]);

export type BrowserModuleImport = {
  kind: 'import' | 'export' | 'dynamic';
  specifier: string | null;
  expression: string;
  line: number;
};

export function parseBrowserModuleImports(source: string, filename = 'module.js'): BrowserModuleImport[] {
  const syntax = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const imports: BrowserModuleImport[] = [];
  const record = (expression: ts.Expression, kind: BrowserModuleImport['kind']) => {
    imports.push({
      kind,
      specifier: ts.isStringLiteralLike(expression) ? expression.text : null,
      expression: expression.getText(syntax),
      line: syntax.getLineAndCharacterOfPosition(expression.getStart(syntax)).line + 1,
    });
  };
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node)) record(node.moduleSpecifier, 'import');
    if (ts.isExportDeclaration(node) && node.moduleSpecifier) record(node.moduleSpecifier, 'export');
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments[0]) {
      record(node.arguments[0], 'dynamic');
    }
    ts.forEachChild(node, visit);
  };
  visit(syntax);
  return imports;
}

async function filesUnder(directory: string, extension: string, prefix = ''): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (isErrnoCode(error, 'ENOENT')) return [];
    throw error;
  }
  const files: string[] = [];
  for (const entry of entries) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...await filesUnder(path.join(directory, entry.name), extension, relative));
    } else if (entry.isFile() && entry.name.endsWith(extension)) {
      files.push(relative);
    }
  }
  return files.sort();
}

export function collectJsFilesUnder(directory: string): Promise<string[]> {
  return filesUnder(directory, '.js');
}

function canImportTypedModule(file: string, kind: BrowserModuleImport['kind']): boolean {
  if (file.startsWith('kernel/') || file.startsWith('typed/')) return true;
  // Catalog families and bootstrap are scheduling boundaries, so a static
  // dependency on an emitted implementation would silently make it eager.
  return kind === 'dynamic' && (file === 'site.js' || CATALOG_FAMILIES.has(file));
}

type ImportTarget = { file: string } | { external: true } | { error: string };

function resolveBrowserImport(file: string, specifier: string): ImportTarget {
  if (/^(?:https?:)?\/\//.test(specifier)) return { external: true };
  if (!specifier.startsWith('./') && !specifier.startsWith('../') && !specifier.startsWith('/')) {
    return { error: 'must use a browser-relative path, /public/js/ path, or HTTP(S) URL' };
  }
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(specifier, `https://spw-runtime.invalid/public/js/${file}`).pathname);
  } catch {
    return { error: 'is not a valid browser module URL' };
  }
  // Normalize again after decoding so encoded traversal cannot bypass ownership.
  pathname = path.posix.normalize(pathname);
  if (!pathname.startsWith('/public/js/')) return { error: 'escapes public/js/' };
  if (!pathname.endsWith('.js')) return { error: 'must name an explicit .js module' };
  return { file: pathname.slice('/public/js/'.length) };
}

export type RuntimeImportReport = {
  errors: string[];
  kernelTypedShims: string[];
  ownerDirectories: string[];
  rootEntrypoints: string[];
  topLevelModuleFiles: string[];
  typedImportViolations: string[];
  typedOutputs: string[];
};

/** Read-only import and folder ownership checks; never import browser modules. */
export async function collectRuntimeImportReport(rootDir: string): Promise<RuntimeImportReport> {
  const jsDir = path.join(rootDir, 'public/js');
  const files = await collectJsFilesUnder(jsDir);
  const fileSet = new Set(files);
  const sourceFiles = (await filesUnder(path.join(rootDir, 'public/ts'), '.ts'))
    .filter((file) => !file.endsWith('.d.ts'));
  const sourceSet = new Set(sourceFiles);
  const errors: string[] = [];
  const typedImportViolations: string[] = [];
  const kernelTypedShims: string[] = [];
  const entries = await fs.readdir(jsDir, { withFileTypes: true });
  const ownerDirectories = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  const rootEntrypoints = files.filter((file) => !file.includes('/'));
  const topLevelModuleFiles = files.filter((file) => /^modules\/[^/]+$/.test(file)).map((file) => `public/js/${file}`);
  const typedFiles = files.filter((file) => file.startsWith('typed/'));

  for (const file of rootEntrypoints) {
    if (!ROOT_ENTRYPOINTS.has(file)) errors.push(`public/js/${file} is a root-level JS file; use a recognized ownership directory.`);
  }
  for (const directory of ownerDirectories) {
    if (!ALLOWED_JS_OWNER_DIRECTORIES.has(directory)) {
      errors.push(`public/js/${directory}/ is not a recognized JS ownership directory; update the runtime contract before adding a new top-level module family.`);
    }
  }
  for (const file of topLevelModuleFiles) errors.push(`${file} should move into a public/js/modules/<family>/ subdirectory.`);

  for (const file of typedFiles) {
    const source = file.slice('typed/'.length).replace(/\.js$/, '.ts');
    if (!sourceSet.has(source)) errors.push(`public/js/${file} has no matching public/ts/${source} source.`);
  }
  for (const source of sourceFiles) {
    const output = `typed/${source.replace(/\.ts$/, '.js')}`;
    if (!fileSet.has(output)) errors.push(`public/ts/${source} has no matching public/js/${output} output; run npm run build:runtime.`);
  }

  for (const file of files) {
    const source = await fs.readFile(path.join(jsDir, file), 'utf8');
    const imports = parseBrowserModuleImports(source, file);
    for (const entry of imports) {
      const label = `public/js/${file}:${entry.line}`;
      if (entry.specifier === null) {
        if (COMPUTED_IMPORTS.get(file) !== entry.expression) {
          errors.push(`${label} computes import(${entry.expression}); add an explicit, owned loader allowance or use a literal module path.`);
        }
        continue;
      }
      const resolved = resolveBrowserImport(file, entry.specifier);
      if ('external' in resolved) {
        if (file === 'typed/module-registry.js') {
          errors.push(`${label} gives the portable registry an external runtime dependency (${entry.specifier}).`);
        }
        continue;
      }
      if ('error' in resolved) {
        errors.push(`${label} imports ${entry.specifier}, which ${resolved.error}.`);
        continue;
      }
      const target = resolved.file;
      if (!fileSet.has(target)) errors.push(`${label} imports missing file ${entry.specifier}.`);
      if (file === 'runtime/browser-primitives.js' && !target.startsWith('kernel/')) {
        errors.push(`${label} makes browser primitives depend on ${target}; keep catalog, policy, and feature ownership outside browser primitives.`);
      }
      if (file.startsWith('runtime/catalog/') && entry.kind !== 'dynamic' && target.startsWith('runtime/orchestration/')) {
        errors.push(`${label} makes catalog vocabulary depend on orchestration; the loader consumes catalog contracts, not the reverse.`);
      }
      if (['runtime/orchestration/policy.js', 'runtime/orchestration/features.js'].includes(file)
        && target.startsWith('runtime/orchestration/') && target !== 'runtime/orchestration/policy.js') {
        errors.push(`${label} makes policy or feature gates depend on an active orchestration process (${target}).`);
      }
      if (file === 'typed/module-registry.js') {
        errors.push(`${label} gives the portable registry a runtime dependency (${target}); instance ownership stays DOM- and catalog-independent.`);
      }
      if (!target.startsWith('typed/')) continue;
      if (!canImportTypedModule(file, entry.kind)) {
        const violation = `${label} imports generated typed output (${entry.specifier}); use kernel/ shims or a dynamic import in site.js or a catalog family.`;
        typedImportViolations.push(violation);
        errors.push(violation);
      }
      if (file.startsWith('kernel/') && entry.kind === 'export') {
        if (!kernelTypedShims.includes(file)) kernelTypedShims.push(file);
        const source = file.slice('kernel/'.length).replace(/\.js$/, '.ts');
        const expected = `typed/${file.slice('kernel/'.length)}`;
        if (!sourceSet.has(source)) errors.push(`public/js/${file} re-exports typed output but public/ts/${source} is missing.`);
        if (target !== expected) errors.push(`public/js/${file} must re-export public/js/${expected}, not ${entry.specifier}.`);
      }
    }
  }

  return {
    errors,
    kernelTypedShims: kernelTypedShims.sort(),
    ownerDirectories,
    rootEntrypoints,
    topLevelModuleFiles,
    typedImportViolations,
    typedOutputs: typedFiles.map((file) => `public/js/${file}`),
  };
}
