import { readFileSync } from 'node:fs';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  BEHAVIOR_SCOPE_MODULE_HREF,
  BEHAVIOR_SCOPES,
  listBehaviorScopeBundles,
  listBehaviorScopeKeys,
} from './css-manifest.mjs';
import {
  extractObjectLiterals,
  extractRuntimeArrayLiteral,
} from './site-contracts/helpers.mjs';
import {
  STANDARD_IDLE_CHUNKS,
  TIMING_ARC_STEMS,
  VALID_MODULE_LAYERS,
  VALID_MOUNT_WHEN,
} from './site-contracts/types.mjs';
import { toPosixPath } from './shared/build-topology.mjs';
import {
  collectStylePropertyContractReport,
  type StylePropertyWrite,
} from './style-property-contract.mjs';

const BEHAVIOR_SCOPE_KEYS = new Set(Object.keys(BEHAVIOR_SCOPES));

/**
 * Body feature tokens that gate JS catalog mounts without a CSS behavior bundle.
 * Matches common baseline packs (operators / navigator) and route chrome tokens.
 * Runtime matchesFeatures() already accepts any body token; this set only widens
 * the catalog contract so presence-only gates are not forced into BEHAVIOR_SCOPES.
 */
const PRESENCE_FEATURE_KEYS = new Set([
  'operators',
  'navigator',
  'route-discovery',
  'inspectability',
  'themes',
  'field-guide',
  'promptability',
  'topic-discovery',
  'prompt-utils',
  'collectability',
]);

const ALLOWED_FEATURE_KEYS = new Set([...BEHAVIOR_SCOPE_KEYS, ...PRESENCE_FEATURE_KEYS]);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const PUBLIC_JS_DIR = path.join(ROOT_DIR, 'public/js');
const MODULES_DIR = path.join(PUBLIC_JS_DIR, 'modules');
const PUBLIC_TS_DIR = path.join(ROOT_DIR, 'public/ts');
const MODULE_CATALOG_DIR = path.join(PUBLIC_JS_DIR, 'runtime');
/** Barrel path — dynamic import() resolution is relative to this directory. */
const MODULE_CATALOG_PATH = path.join(MODULE_CATALOG_DIR, 'module-catalog.js');
const MODULE_CATALOG_FAMILY_FILES = Object.freeze({
  CORE_DEFS: 'module-catalog-core.js',
  FEATURE_DEFS: 'module-catalog-feature.js',
  REGION_DEFS: 'module-catalog-region.js',
  ENHANCEMENT_DEFS: 'module-catalog-enhancement.js',
} as const);
const MODULE_UPDATES_CONTRACT_PATH = path.join(PUBLIC_JS_DIR, 'runtime/module-updates-contract.js');
const SITE_RUNTIME_PATH = path.join(PUBLIC_JS_DIR, 'site.js');

const RUNTIME_FAMILIES = ['CORE_DEFS', 'FEATURE_DEFS', 'REGION_DEFS', 'ENHANCEMENT_DEFS'] as const;
const VALID_LAYERS = new Set<string>(VALID_MODULE_LAYERS);
const VALID_MOUNT_TIMINGS = new Set<string>(VALID_MOUNT_WHEN);
const VALID_ROOT_MODES = new Set(['single', 'each']);
const CONTRACT_TOKEN_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ALLOWED_ROOT_JS_FILES = new Set(['compose.js', 'site.js']);
const ALLOWED_JS_OWNER_DIRECTORIES = new Set([
  // Build output, never hand-edited: parsed artifacts the browser reads so it
  // does not have to compute them. Kept as its own family precisely so the
  // authored/generated boundary stays visible in the import path — see
  // scripts/build-expression-manifest.mjs.
  'generated',
  'interface',
  'kernel',
  'media',
  'modules',
  'runtime',
  'semantic',
  'typed',
]);
const ALLOWED_TYPED_IMPORT_DIRECTORIES = new Set(['kernel', 'typed']);
const ALLOWED_TYPED_IMPORT_ROOT_FILES = new Set(['site.js']);
const KERNEL_TYPED_SHIMS = new Map([
  ['bus', 'kernel/bus.js'],
  ['feed-utils', 'kernel/feed-utils.js'],
  ['runtime-environment', 'kernel/runtime-environment.js'],
  ['module-timing-contract', 'kernel/module-timing-contract.js'],
]);
const TYPED_IMPORT_RE = /(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]*typed\/[^'"]+)['"]/g;
const TYPED_SHIM_RE = /export\s+\*\s+from\s+['"]([^'"]+)['"]/;

type RuntimeFamily = (typeof RUNTIME_FAMILIES)[number];

const VALID_COST_CLASSES = new Set([
  'working_memory_pressure',
  'premature_commitment',
  'interference',
  'demand_coupled',
  'authored_prior_safe',
  'paint_composite',
]);

/** timingArc stems from site-contracts (aligned with public/ts/module-timing-contract). */
const TIMING_ARC_STEM_RE = new RegExp(
  `^(?:${TIMING_ARC_STEMS.join('|')})-[a-z0-9]+(?:-[a-z0-9]+)*$`,
);

type RuntimeContractModule = {
  /** Explicit costClass from catalog when present (optimization coordinate). */
  costClass: string | null;
  debugOnly: boolean;
  describes: string | null;
  effectScope: string | null;
  evaluates: string | null;
  family: RuntimeFamily;
  features: string[];
  id: string;
  importPath: string | null;
  index: number;
  layer: string;
  objectLiteral: string;
  /** True when a route: field is present (route-gated feature modules). */
  routeContract: boolean;
  rootMode: string | null;
  selectorContract: boolean;
  selector: string | null;
  timingArc: string | null;
  timingChunk: string | null;
  updates: string[];
  when: string;
};

type RuntimeContractReport = {
  behaviorScopes: string[];
  cssCustomProperties: string[];
  dynamicStyleWrites: StylePropertyWrite[];
  errors: string[];
  kernelTypedShims: string[];
  modules: RuntimeContractModule[];
  recommendations: string[];
  ownerDirectories: string[];
  rootEntrypoints: string[];
  stylePropertyWrites: StylePropertyWrite[];
  topLevelModuleFiles: string[];
  typedImportViolations: string[];
  typedOutputs: string[];
  unknownDynamicStyleWrites: StylePropertyWrite[];
  unknownStylePropertyWrites: StylePropertyWrite[];
  warnings: string[];
};

function relativeRepoPath(absolutePath: string): string {
  return toPosixPath(path.relative(ROOT_DIR, absolutePath));
}

async function pathExists(absolutePath: string): Promise<boolean> {
  try {
    await fs.access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

function parseQuotedProperty(source: string, name: string): string | null {
  const match = source.match(new RegExp(`${name}:\\s*(['"\`])([\\s\\S]*?)\\1`));
  return match?.[2] || null;
}

function parseConstantProperty(source: string, name: string, namespace: string): string | null {
  const match = source.match(new RegExp(`${name}:\\s*${namespace}\\.([A-Z_]+)`));
  return match?.[1]?.toLowerCase().replace(/_/g, '-') || null;
}

function parseUpdates(source: string): string[] {
  const match = source.match(/updates:\s*\[([\s\S]*?)\]/);
  if (!match) return [];
  return [...match[1].matchAll(/(['"`])([^'"`]+)\1/g)].map((item) => item[2]);
}

const MODULE_UPDATE_SCOPES = new Set(['html', 'root', 'body', 'document', 'frame']);
const MODULE_UPDATE_KINDS = new Set(['attr', 'css-var', 'aria', 'class', 'event', 'selector', 'property']);
const MODULE_UPDATE_ROLES = new Set(['structural', 'flourish', 'inspect', 'residue', 'measure', 'diagnostic']);
const MODULE_UPDATE_KIND_ALIASES = new Map([
  ['attribute', 'attr'],
  ['attributes', 'attr'],
  ['dataset', 'attr'],
  ['var', 'css-var'],
  ['css-var', 'css-var'],
  ['css', 'css-var'],
  ['style', 'property'],
  ['property', 'property'],
  ['class', 'class'],
  ['aria', 'aria'],
  ['event', 'event'],
  ['selector', 'selector'],
]);
const MODULE_UPDATE_ROLE_ALIASES = new Map([
  ['structure', 'structural'],
  ['flourishes', 'flourish'],
  ['ornament', 'flourish'],
  ['pulse', 'flourish'],
  ['inspection', 'inspect'],
  ['memory', 'residue'],
  ['metric', 'measure'],
  ['diagnostics', 'diagnostic'],
  ['debug', 'diagnostic'],
]);

function isKnownModuleUpdateKind(token: string): boolean {
  const normalized = token.toLowerCase();
  return MODULE_UPDATE_KINDS.has(normalized) || MODULE_UPDATE_KIND_ALIASES.has(normalized);
}

function normalizeModuleUpdateKind(token: string): string {
  const normalized = token.toLowerCase();
  return MODULE_UPDATE_KIND_ALIASES.get(normalized) || (MODULE_UPDATE_KINDS.has(normalized) ? normalized : 'attr');
}

function normalizeModuleUpdateRole(token: string): string | null {
  const normalized = token.toLowerCase();
  if (MODULE_UPDATE_ROLES.has(normalized)) return normalized;
  return MODULE_UPDATE_ROLE_ALIASES.get(normalized) || null;
}

function classifyModuleUpdateToken(
  token: string,
  options: { allowScope?: boolean; allowRole?: boolean } = {},
): { kind: string; name: string; scope?: string; role?: string } | null {
  const allowScope = options.allowScope !== false;
  const allowRole = options.allowRole !== false;
  const raw = token.trim();
  if (!raw) return null;

  if (allowScope) {
    const scopeMatch = raw.match(/^([a-z]+):(.+)$/i);
    if (scopeMatch && MODULE_UPDATE_SCOPES.has(scopeMatch[1].toLowerCase())) {
      const inner = classifyModuleUpdateToken(scopeMatch[2], { allowScope: false, allowRole });
      return inner ? { ...inner, scope: scopeMatch[1].toLowerCase() } : null;
    }
  }

  if (allowRole) {
    const roleMatch = raw.match(/^([a-z]+):(.+)$/i);
    if (roleMatch) {
      const role = normalizeModuleUpdateRole(roleMatch[1]);
      if (role) {
        const inner = classifyModuleUpdateToken(roleMatch[2], { allowScope: false, allowRole: false });
        return inner ? { ...inner, role } : null;
      }
    }
  }

  const explicit = raw.match(/^([a-z-]+):(.+)$/i);
  if (explicit && isKnownModuleUpdateKind(explicit[1])) {
    const kind = normalizeModuleUpdateKind(explicit[1]);
    const name = explicit[2].trim();
    return name ? { kind, name } : null;
  }

  if (raw.startsWith('--')) return { kind: 'css-var', name: raw };
  if (raw.startsWith('aria-')) return { kind: 'aria', name: raw };
  if (raw.startsWith('.')) return { kind: 'class', name: raw };
  if (raw.startsWith('spw:') || /^[a-z][a-z0-9-]*:[a-z0-9-]+$/.test(raw)) return { kind: 'event', name: raw };
  if (/^[#.[]/.test(raw) || raw.includes(' ')) return { kind: 'selector', name: raw };
  return { kind: 'attr', name: raw };
}

function validateModuleUpdateToken(token: string): string | null {
  const parsed = classifyModuleUpdateToken(token);
  if (!parsed) return 'empty-token';

  const { kind, name } = parsed;
  if (kind === 'css-var' && !/^--[a-z0-9-]+$/.test(name)) return 'css-var-shape';
  if (kind === 'aria' && !/^aria-[a-z0-9-]+$/.test(name)) return 'aria-shape';
  if (kind === 'class' && !/^\.[a-z0-9_-]+$/.test(name)) return 'class-shape';
  if (kind === 'event' && !/^[a-z][a-z0-9-]*:[a-z0-9-]+$/.test(name)) return 'event-shape';
  if (kind === 'attr' && !/^(data-[a-z0-9-]+|aria-[a-z0-9-]+|[a-z][a-z0-9-]*)$/.test(name)) return 'attr-shape';
  return null;
}

function sameStringList(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

function sortedStrings(values: Iterable<string>): string[] {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function parseFrozenStringArray(source: string, name: string): string[] | null {
  const match = source.match(new RegExp(`export const ${name} = Object\\.freeze\\(\\[([\\s\\S]*?)\\]\\);`));
  if (!match) return null;
  return [...match[1].matchAll(/(['"`])([^'"`]+)\1/g)].map((item) => item[2]);
}

function parseFrozenAliasObject(source: string, name: string): Map<string, string> | null {
  const match = source.match(new RegExp(`const ${name} = Object\\.freeze\\(\\{([\\s\\S]*?)\\}\\);`));
  if (!match) return null;

  const aliases = new Map<string, string>();
  const aliasRe = /(?:(['"`])([^'"`]+)\1|([a-zA-Z0-9_-]+))\s*:\s*(['"`])([^'"`]+)\4/g;
  for (const item of match[1].matchAll(aliasRe)) {
    aliases.set(item[2] || item[3], item[5]);
  }
  return aliases;
}

async function collectModuleUpdateGrammarIssues(): Promise<string[]> {
  const errors: string[] = [];
  const source = await fs.readFile(MODULE_UPDATES_CONTRACT_PATH, 'utf8');
  const runtimeKinds = parseFrozenStringArray(source, 'MODULE_UPDATE_KINDS');
  const runtimeScopes = parseFrozenStringArray(source, 'MODULE_UPDATE_SCOPES');
  const runtimeRoles = parseFrozenStringArray(source, 'MODULE_UPDATE_ROLES');
  const runtimeAliases = parseFrozenAliasObject(source, 'KIND_ALIASES');

  if (!runtimeKinds) {
    errors.push(`${relativeRepoPath(MODULE_UPDATES_CONTRACT_PATH)} does not expose parseable MODULE_UPDATE_KINDS.`);
  } else if (!sameStringList(sortedStrings(MODULE_UPDATE_KINDS), sortedStrings(runtimeKinds))) {
    errors.push(`module update kind grammar drifted: TS=${sortedStrings(MODULE_UPDATE_KINDS).join(',')} runtime=${sortedStrings(runtimeKinds).join(',')}.`);
  }

  if (!runtimeScopes) {
    errors.push(`${relativeRepoPath(MODULE_UPDATES_CONTRACT_PATH)} does not expose parseable MODULE_UPDATE_SCOPES.`);
  } else if (!sameStringList(sortedStrings(MODULE_UPDATE_SCOPES), sortedStrings(runtimeScopes))) {
    errors.push(`module update scope grammar drifted: TS=${sortedStrings(MODULE_UPDATE_SCOPES).join(',')} runtime=${sortedStrings(runtimeScopes).join(',')}.`);
  }

  if (!runtimeRoles) {
    errors.push(`${relativeRepoPath(MODULE_UPDATES_CONTRACT_PATH)} does not expose parseable MODULE_UPDATE_ROLES.`);
  } else if (!sameStringList(sortedStrings(MODULE_UPDATE_ROLES), sortedStrings(runtimeRoles))) {
    errors.push(`module update role grammar drifted: TS=${sortedStrings(MODULE_UPDATE_ROLES).join(',')} runtime=${sortedStrings(runtimeRoles).join(',')}.`);
  }

  if (!runtimeAliases) {
    errors.push(`${relativeRepoPath(MODULE_UPDATES_CONTRACT_PATH)} does not expose parseable KIND_ALIASES.`);
    return errors;
  }

  const localAliasKeys = sortedStrings(MODULE_UPDATE_KIND_ALIASES.keys());
  const runtimeAliasKeys = sortedStrings(runtimeAliases.keys());
  if (!sameStringList(localAliasKeys, runtimeAliasKeys)) {
    errors.push(`module update alias grammar drifted: TS=${localAliasKeys.join(',')} runtime=${runtimeAliasKeys.join(',')}.`);
  }

  for (const key of runtimeAliasKeys) {
    const local = MODULE_UPDATE_KIND_ALIASES.get(key);
    const runtime = runtimeAliases.get(key);
    if (local !== runtime) {
      errors.push(`module update alias "${key}" maps to "${local}" in TS but "${runtime}" at runtime.`);
    }
  }

  return errors;
}

function parseFeatures(source: string): string[] {
  const stringMatch = source.match(/\bfeatures:\s*(['"`])([^'"`]+)\1/);
  if (stringMatch) return [stringMatch[2]];

  const arrayMatch = source.match(/\bfeatures:\s*\[([\s\S]*?)\]/);
  if (!arrayMatch) return [];

  return [...arrayMatch[1].matchAll(/(['"`])([^'"`]+)\1/g)].map((item) => item[2]);
}

function splitContractTokens(value: string | null): string[] {
  if (!value) return [];
  return value.split(/[\s,]+/).map((token) => token.trim()).filter(Boolean);
}

function parseExportedStringArray(source: string, name: string): string[] {
  const pattern = new RegExp(`export\\s+const\\s+${name}\\s*=\\s*Object\\.freeze\\(\\s*\\[([\\s\\S]*?)\\]\\s*\\)`);
  const match = source.match(pattern);
  if (!match) return [];
  return [...match[1].matchAll(/(['"`])([^'"`]+)\1/g)].map((item) => item[2]);
}

function parseExportedStringMap(source: string, name: string): Record<string, string> {
  const pattern = new RegExp(`export\\s+const\\s+${name}\\s*=\\s*Object\\.freeze\\(\\s*\\{([\\s\\S]*?)\\}\\s*\\)`);
  const match = source.match(pattern);
  const entries: Record<string, string> = {};
  if (!match) return entries;

  for (const item of match[1].matchAll(/(['"`])([^'"`]+)\1\s*:\s*(['"`])([^'"`]+)\3/g)) {
    entries[item[2]] = item[4];
  }

  return entries;
}

function sameList(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((item, index) => item === right[index]);
}

function sameMap(left: Record<string, string>, right: Readonly<Record<string, string>>): boolean {
  return JSON.stringify(Object.entries(left).sort()) === JSON.stringify(Object.entries(right).sort());
}

function parseCostClassProperty(objectLiteral: string): string | null {
  // COST_CLASS.WORKING_MEMORY_PRESSURE → working_memory_pressure (ids use underscores).
  const fromConst = parseConstantProperty(objectLiteral, 'costClass', 'COST_CLASS');
  if (fromConst) return fromConst.replace(/-/g, '_');
  return parseQuotedProperty(objectLiteral, 'costClass');
}

function parseRuntimeModule(objectLiteral: string, family: RuntimeFamily, index: number): RuntimeContractModule {
  return {
    costClass: parseCostClassProperty(objectLiteral),
    debugOnly: /\bdebugOnly:\s*true\b/.test(objectLiteral),
    describes: parseQuotedProperty(objectLiteral, 'describes'),
    effectScope: parseQuotedProperty(objectLiteral, 'effectScope'),
    evaluates: parseQuotedProperty(objectLiteral, 'evaluates'),
    family,
    features: parseFeatures(objectLiteral),
    id: parseQuotedProperty(objectLiteral, 'id') || '',
    importPath: objectLiteral.match(/import\(\s*['"]([^'"]+)['"]\s*\)/)?.[1] || null,
    index,
    layer: parseConstantProperty(objectLiteral, 'layer', 'MODULE_LAYERS') || family.replace(/_DEFS$/, '').toLowerCase(),
    objectLiteral,
    // route: '…' | "…" | [ … ] | Identifier — avoid bare "route:" inside describes.
    routeContract: /\broute\s*:\s*(?:[\[\`'"]|[A-Za-z_$])/.test(objectLiteral),
    rootMode: parseQuotedProperty(objectLiteral, 'rootMode'),
    // Constant selectors (REGION_SELECTOR, PRETEXT_LIVE_SELECTOR) are still
    // real demand gates even when this lightweight parser cannot resolve their
    // literal value for reporting.
    selectorContract: /\bselector\s*:\s*(?:[\`'"]|[A-Za-z_$])/.test(objectLiteral),
    selector: parseQuotedProperty(objectLiteral, 'selector'),
    timingArc: parseQuotedProperty(objectLiteral, 'timingArc'),
    timingChunk: parseQuotedProperty(objectLiteral, 'timingChunk'),
    updates: parseUpdates(objectLiteral),
    when: parseConstantProperty(objectLiteral, 'when', 'MOUNT_WHEN') || 'immediate',
  };
}

function normalizeModuleLabel(module: RuntimeContractModule): string {
  return module.id || `${module.family}[${module.index}]`;
}

async function collectRootJsEntrypoints(): Promise<string[]> {
  const entries = await fs.readdir(PUBLIC_JS_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
    .map((entry) => entry.name)
    .sort();
}

async function collectTopLevelJsDirectories(): Promise<string[]> {
  const entries = await fs.readdir(PUBLIC_JS_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function collectTopLevelModuleJsFiles(): Promise<string[]> {
  if (!(await pathExists(MODULES_DIR))) return [];
  const entries = await fs.readdir(MODULES_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
    .map((entry) => `public/js/modules/${entry.name}`)
    .sort();
}

async function collectTypedOutputs(): Promise<string[]> {
  const typedDir = path.join(PUBLIC_JS_DIR, 'typed');
  if (!(await pathExists(typedDir))) return [];
  const entries = await fs.readdir(typedDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
    .map((entry) => `public/js/typed/${entry.name}`)
    .sort();
}

async function collectJsFilesUnder(directory: string, prefix = ''): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await collectJsFilesUnder(absolutePath, relativePath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(relativePath);
    }
  }

  return files.sort();
}

function canImportTypedModule(relativeFilePath: string): boolean {
  if (ALLOWED_TYPED_IMPORT_ROOT_FILES.has(relativeFilePath)) {
    return true;
  }

  const [ownerDirectory] = relativeFilePath.split('/');
  return Boolean(ownerDirectory && ALLOWED_TYPED_IMPORT_DIRECTORIES.has(ownerDirectory));
}

async function collectTypedImportViolations(): Promise<string[]> {
  const errors: string[] = [];
  const files = await collectJsFilesUnder(PUBLIC_JS_DIR);

  for (const relativeFilePath of files) {
    if (relativeFilePath.startsWith('typed/')) continue;

    const absolutePath = path.join(PUBLIC_JS_DIR, relativeFilePath);
    const source = await fs.readFile(absolutePath, 'utf8');
    const matches = [...source.matchAll(TYPED_IMPORT_RE)];

    if (!matches.length) continue;

    if (!canImportTypedModule(relativeFilePath)) {
      const importTargets = [...new Set(matches.map((match) => match[1]))].join(', ');
      errors.push(`${relativeRepoPath(absolutePath)} imports generated typed output (${importTargets}); route through kernel/ shims or site.js dynamic imports.`);
    }
  }

  return errors;
}

async function collectKernelTypedShimIssues(): Promise<{ errors: string[]; shims: string[] }> {
  const errors: string[] = [];
  const shims: string[] = [];

  for (const [basename, shimPath] of KERNEL_TYPED_SHIMS) {
    const absoluteShimPath = path.join(PUBLIC_JS_DIR, shimPath);
    shims.push(shimPath);

    if (!(await pathExists(absoluteShimPath))) {
      errors.push(`missing kernel typed shim public/js/${shimPath} for public/ts/${basename}.ts.`);
      continue;
    }

    const source = await fs.readFile(absoluteShimPath, 'utf8');
    const exportMatch = source.match(TYPED_SHIM_RE);

    if (!exportMatch) {
      errors.push(`public/js/${shimPath} must re-export from ../typed/${basename}.js.`);
      continue;
    }

    const exportTarget = exportMatch[1].replace(/\\/g, '/');
    const expectedTarget = `../typed/${basename}.js`;

    if (exportTarget !== expectedTarget) {
      errors.push(`public/js/${shimPath} must re-export from ${expectedTarget}, not ${exportTarget}.`);
    }

    if (exportTarget.startsWith('/public/js/typed/')) {
      errors.push(`public/js/${shimPath} must use a relative typed re-export (${expectedTarget}), not an absolute path.`);
    }
  }

  return { errors, shims };
}

async function collectBehaviorScopeModuleIssues(): Promise<{ errors: string[]; scopes: string[] }> {
  const errors: string[] = [];
  const expectedKeys = listBehaviorScopeKeys();
  const expectedBundles = listBehaviorScopeBundles();
  const absolutePath = path.join(ROOT_DIR, BEHAVIOR_SCOPE_MODULE_HREF.replace(/^\/+/, ''));

  if (!(await pathExists(absolutePath))) {
    errors.push(`${BEHAVIOR_SCOPE_MODULE_HREF.replace(/^\/+/, '')} is missing; run npm run build:css to regenerate behavior scope exports.`);
    return { errors, scopes: expectedKeys };
  }

  const source = await fs.readFile(absolutePath, 'utf8');
  const actualKeys = parseExportedStringArray(source, 'BEHAVIOR_SCOPE_KEYS').sort();
  const actualBundles = parseExportedStringMap(source, 'BEHAVIOR_SCOPE_BUNDLES');

  if (!sameList(actualKeys, expectedKeys)) {
    errors.push(`${BEHAVIOR_SCOPE_MODULE_HREF.replace(/^\/+/, '')} BEHAVIOR_SCOPE_KEYS is stale; expected ${expectedKeys.join(', ')}.`);
  }

  if (!sameMap(actualBundles, expectedBundles)) {
    errors.push(`${BEHAVIOR_SCOPE_MODULE_HREF.replace(/^\/+/, '')} BEHAVIOR_SCOPE_BUNDLES is stale; run npm run build:css.`);
  }

  return { errors, scopes: actualKeys.length ? actualKeys : expectedKeys };
}

function importPathToAbsolute(importPath: string): string {
  return path.resolve(path.dirname(MODULE_CATALOG_PATH), importPath);
}

const INIT_EXPORT_SOURCE_RE = /\bexport\s+(?:async\s+)?function\s+init[A-Z]\w*|\bexport\s+const\s+init[A-Z]\w*\s*=|\bexport\s+\{[^}]*\binit[A-Z]\w*|\bSPW_MODULE_EXPORT\b|\bspwModule\b|\bexport\s+default\s*\{[^}]*\bmount\b/;
const NAMED_INIT_ADAPTER_RE = /\bmod\??\.(init[A-Z][A-Za-z0-9]*)\b/g;

export function listNamedInitAdapterExports(objectLiteral = ''): string[] {
  return [...new Set(
    [...String(objectLiteral).matchAll(NAMED_INIT_ADAPTER_RE)].map((match) => match[1]),
  )];
}

export function moduleSourceExportsName(
  moduleSource: string,
  name: string,
  absolutePath = '',
  depth = 0,
): boolean {
  if (!name) return false;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (new RegExp(`\\bexport\\s+(?:async\\s+)?function\\s+\\*?\\s*${escaped}\\b`).test(moduleSource)) {
    return true;
  }
  if (new RegExp(`\\bexport\\s+(?:const|let|var)\\s+${escaped}\\b`).test(moduleSource)) {
    return true;
  }

  for (const block of moduleSource.matchAll(/export\s+\{([^}]+)\}/g)) {
    for (const part of block[1].split(',')) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const aliased = trimmed.match(/^(\S+)\s+as\s+(\S+)$/);
      if (aliased) {
        if (aliased[2] === name) return true;
        continue;
      }
      if (trimmed === name) return true;
    }
  }

  if (depth >= 2 || !absolutePath) return false;
  const starExports = [...moduleSource.matchAll(/\bexport\s+\*\s+from\s+['"]([^'"]+)['"]/g)];
  for (const match of starExports) {
    const spec = match[1];
    if (!spec) continue;
    const resolved = path.resolve(path.dirname(absolutePath), spec);
    const candidates = [resolved, `${resolved}.js`, path.join(resolved, 'index.js')];
    for (const candidate of candidates) {
      try {
        const nested = readFileSync(candidate, 'utf8');
        if (moduleSourceExportsName(nested, name, candidate, depth + 1)) return true;
      } catch {
        // try next candidate
      }
    }
  }
  return false;
}

/**
 * True when resolveModuleMount can find a mount on this module source, or on a
 * same-directory `export * from` re-export (site-settings barrel pattern).
 */
function moduleSourceHasResolvableMount(moduleSource: string, absolutePath: string, depth = 0): boolean {
  if (INIT_EXPORT_SOURCE_RE.test(moduleSource)) return true;
  if (depth >= 2) return false;

  const starExports = [...moduleSource.matchAll(/\bexport\s+\*\s+from\s+['"]([^'"]+)['"]/g)];
  for (const match of starExports) {
    const spec = match[1];
    if (!spec) continue;
    const resolved = path.resolve(path.dirname(absolutePath), spec);
    const candidates = [resolved, `${resolved}.js`, path.join(resolved, 'index.js')];
    for (const candidate of candidates) {
      try {
        const nested = readFileSync(candidate, 'utf8');
        if (moduleSourceHasResolvableMount(nested, candidate, depth + 1)) return true;
      } catch {
        // try next candidate
      }
    }
  }
  return false;
}

function getImportOwnerDirectory(importPath: string): string | null {
  if (!importPath.startsWith('./') && !importPath.startsWith('../')) return null;
  const absoluteImport = importPathToAbsolute(importPath);
  const relative = toPosixPath(path.relative(PUBLIC_JS_DIR, absoluteImport));
  const [ownerDirectory] = relative.split('/').filter(Boolean);
  return ownerDirectory || null;
}

function validateModule(
  module: RuntimeContractModule,
  errors: string[],
  warnings: string[],
  recommendations: string[],
): void {
  const label = normalizeModuleLabel(module);

  if (!module.id) {
    errors.push(`${module.family}[${module.index}] is missing an id.`);
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(module.id)) {
    errors.push(`${label} id must be lowercase kebab-case.`);
  }

  if (!VALID_LAYERS.has(module.layer)) {
    errors.push(`${label} has invalid layer "${module.layer}".`);
  }

  if (!VALID_MOUNT_TIMINGS.has(module.when)) {
    errors.push(`${label} has invalid mount timing "${module.when}".`);
  }

  if (module.rootMode && !VALID_ROOT_MODES.has(module.rootMode)) {
    errors.push(`${label} has invalid rootMode "${module.rootMode}".`);
  }

  if (module.timingArc) {
    const timingTokens = splitContractTokens(module.timingArc);
    if (timingTokens.length !== 1 || !CONTRACT_TOKEN_RE.test(timingTokens[0])) {
      errors.push(`${label} timingArc must be a single lowercase kebab-case token.`);
    } else if (!TIMING_ARC_STEM_RE.test(timingTokens[0])) {
      recommendations.push(
        `${label} timingArc "${timingTokens[0]}" should use a known stem `
        + `(${TIMING_ARC_STEMS.join('|')}-*) so schedule family and CSS coordinate_parity stay aligned.`,
      );
    }
  } else if (module.layer !== 'core' && !module.debugOnly) {
    recommendations.push(
      `${label} is missing timingArc; stamp boot-|immediate-|feature-|visible-|enhance-|idle-|settled-* for mount hygiene.`,
    );
  }

  if (module.timingChunk) {
    const chunkTokens = splitContractTokens(module.timingChunk);
    if (chunkTokens.length !== 1 || !CONTRACT_TOKEN_RE.test(chunkTokens[0])) {
      errors.push(`${label} timingChunk must be a single lowercase kebab-case token.`);
    } else if (
      module.when === 'idle'
      && !(STANDARD_IDLE_CHUNKS as readonly string[]).includes(chunkTokens[0])
    ) {
      recommendations.push(
        `${label} timingChunk "${chunkTokens[0]}" is nonstandard; prefer ${STANDARD_IDLE_CHUNKS.join('|')}.`,
      );
    } else if (module.when !== 'idle' && module.timingChunk) {
      recommendations.push(
        `${label} declares timingChunk but when=${module.when}; idle chunks only order IDLE residue-before-flourish mounts.`,
      );
    }
  } else if (module.when === 'idle' && module.layer !== 'core') {
    recommendations.push(
      `${label} is IDLE without timingChunk; loader will infer from timingArc, but explicit chunk documents residue-before-flourish order.`,
    );
  }

  // Coordinate parity: paint_composite + IMMEDIATE should declare roleful flourishes so CSS
  // can keep structural chrome vs deferred ornament distinct (progressive-css table).
  if (
    module.costClass === 'paint_composite'
    && module.when === 'immediate'
    && module.layer === 'enhancement'
    && module.updates.length >= 3
  ) {
    const roleful = module.updates.filter((token) => (
      /(?:^|:)(?:structural|flourish|inspect|residue|measure|diagnostic):/.test(token)
      || /^(?:structural|flourish|inspect|residue|measure|diagnostic):/.test(token)
    ));
    if (roleful.length === 0) {
      recommendations.push(
        `${label} is paint_composite+IMMEDIATE without role: updates; prefix structural/flourish/measure so CSS owners stay aligned.`,
      );
    }
  }

  for (const token of splitContractTokens(module.effectScope)) {
    if (!CONTRACT_TOKEN_RE.test(token)) {
      errors.push(`${label} effectScope token "${token}" must be lowercase kebab-case.`);
    }
  }

  if (module.rootMode === 'each' && !module.selectorContract) {
    errors.push(`${label} uses rootMode="each" without a selector.`);
  }

  if (!/\bload:\s*(?:async\s*)?\(/.test(module.objectLiteral)) {
    errors.push(`${label} is missing a load() contract.`);
  }

  // Catalog mount adapters are optional when resolveModuleMount can find
  // SPW_MODULE_EXPORT / spwModule / default.mount / init* on the loaded module.
  // Named `mod?.initFoo` adapters must name an export that exists; a missing
  // name is a silent no-op at boot.
  let loadedSource = '';
  let loadedPath = '';
  if (module.importPath) {
    loadedPath = importPathToAbsolute(module.importPath);
    try {
      loadedSource = readFileSync(loadedPath, 'utf8');
    } catch {
      loadedSource = '';
    }
  }

  if (!/\bmount:\s*\(/.test(module.objectLiteral)) {
    if (!module.importPath) {
      errors.push(`${label} is missing a mount() contract.`);
    } else if (!loadedSource) {
      errors.push(`${label} is missing a mount() adapter and its load path is unreadable.`);
    } else if (!moduleSourceHasResolvableMount(loadedSource, loadedPath)) {
      errors.push(
        `${label} is missing a mount() adapter and ${module.importPath} has no init*/SPW_MODULE_EXPORT mount for resolveModuleMount.`,
      );
    }
  } else {
    const namedInits = listNamedInitAdapterExports(module.objectLiteral);
    if (namedInits.length) {
      if (!loadedSource) {
        errors.push(
          `${label} mount adapter calls ${namedInits.join(' / ')} but ${module.importPath || 'its load path'} is unreadable.`,
        );
      } else if (!namedInits.some((name) => moduleSourceExportsName(loadedSource, name, loadedPath))) {
        errors.push(
          `${label} mount adapter calls ${namedInits.join(' / ')} but ${module.importPath} does not export that init.`,
        );
      }
    }
  }

  if (module.importPath) {
    if (
      (!module.importPath.startsWith('./') && !module.importPath.startsWith('../'))
      || module.importPath.startsWith('/')
    ) {
      errors.push(`${label} import path must stay inside public/js with a relative path.`);
    }

    const ownerDirectory = getImportOwnerDirectory(module.importPath);
    if (!ownerDirectory || !ALLOWED_JS_OWNER_DIRECTORIES.has(ownerDirectory)) {
      errors.push(`${label} imports ${module.importPath}; site runtime modules must load from an owned public/js directory (${[...ALLOWED_JS_OWNER_DIRECTORIES].join(', ')}).`);
    }

    const absoluteImport = importPathToAbsolute(module.importPath);
    if (!absoluteImport.startsWith(PUBLIC_JS_DIR)) {
      errors.push(`${label} import path escapes public/js.`);
    }
  } else if (!/\bload:\s*async\s*\(\)\s*=>\s*\(\s*\{/.test(module.objectLiteral)) {
    warnings.push(`${label} has no static import() path; resource hints and generated manifests cannot name its file.`);
  }

  if (module.layer !== 'core' && !module.selectorContract && !module.debugOnly && !module.features.length) {
    warnings.push(`${label} is ungated by selector; confirm it is intentionally document-wide.`);
  }

  for (const feature of module.features) {
    if (!ALLOWED_FEATURE_KEYS.has(feature)) {
      errors.push(
        `${label} features "${feature}" is not a recognized body feature gate `
        + `(CSS BEHAVIOR_SCOPES: ${[...BEHAVIOR_SCOPE_KEYS].join(', ')}; `
        + `presence-only: ${[...PRESENCE_FEATURE_KEYS].join(', ')}).`,
      );
    }
  }

  if (module.features.length && module.selector?.includes('data-spw-features~=')) {
    recommendations.push(`${label} declares features and encodes data-spw-features in selector; prefer features-only gating.`);
  }

  if (module.layer !== 'core' && !module.describes) {
    recommendations.push(`${label} is missing describes; runtime audits cannot explain its semantic role.`);
  }

  if (module.describes && !/\[[^\]]+\]|\{[^}]+\}|<[^>]+>/.test(module.describes)) {
    recommendations.push(
      `${label} describes is prose; prefer subject[mode]{direction} catalog dialect so inspectors can group by subject.`,
    );
  }

  if (module.layer !== 'core' && module.describes && !module.updates.length && !module.evaluates) {
    recommendations.push(`${label} describes behavior but names neither updates nor evaluates.`);
  }

  // Feature / mount hygiene (agentic-development + BRP): prefer demand-coupled activation.
  if (module.when === 'immediate' && module.layer === 'enhancement' && !module.debugOnly) {
    if (!module.features.length && !module.selectorContract) {
      warnings.push(
        `${label} is ENHANCEMENT+IMMEDIATE with no features gate and no selector contract; confirm it must run on every page at boot.`,
      );
    }
    if (!module.costClass) {
      recommendations.push(
        `${label} is ENHANCEMENT+IMMEDIATE without explicit costClass; stamp COST_CLASS.* or rely on module-catalog-normalize infer (prefer explicit for budget reviews).`,
      );
    }
  }

  if (module.costClass && !VALID_COST_CLASSES.has(module.costClass)) {
    errors.push(
      `${label} costClass "${module.costClass}" is unknown; use COST_CLASS values (premature_commitment|working_memory_pressure|interference|demand_coupled|authored_prior_safe|paint_composite).`,
    );
  }

  if (module.when === 'immediate' && module.layer === 'feature' && !module.routeContract && !module.selectorContract && !module.features.length) {
    warnings.push(
      `${label} is FEATURE+IMMEDIATE without route, selector, or features gate; feature modules should be demand-coupled.`,
    );
  }

  if (module.layer === 'enhancement' && module.when === 'immediate' && module.effectScope && /observer|document-wide|root-state/.test(module.effectScope) && !module.timingArc) {
    recommendations.push(
      `${label} effectScope suggests broad side effects (${module.effectScope}); pair IMMEDIATE with timingArc or lower mount when.`,
    );
  }

  const seenUpdates = new Set<string>();
  let rolefulCount = 0;
  for (const token of module.updates) {
    const issue = validateModuleUpdateToken(token);
    if (issue) {
      warnings.push(
        `${label} updates token "${token}" has ${issue}; use scope:, role: (flourish|residue|…), and kind: prefixes when inference is ambiguous.`,
      );
    }
    const parsed = classifyModuleUpdateToken(token);
    if (!parsed) continue;
    if (parsed.role) rolefulCount += 1;
    // Collision key is DOM identity (scope+kind+name), not topology role.
    const key = `${parsed.scope ? `${parsed.scope}:` : ''}${parsed.kind}:${parsed.name}`;
    if (seenUpdates.has(key)) {
      warnings.push(`${label} repeats update ${key}.`);
      continue;
    }
    seenUpdates.add(key);
  }

  if (module.layer !== 'core' && !module.updates.length) {
    recommendations.push(`${label} has no updates[]; declare surface writes (or explicit empty intent) for inspect/flourish topology.`);
  }

  if (module.layer !== 'core' && !module.evaluates) {
    recommendations.push(`${label} is missing evaluates; name dimensions or outcomes the module changes.`);
  }

  if (
    module.layer === 'enhancement'
    && module.updates.length >= 3
    && rolefulCount === 0
    && /flourish|ornament|reward|residue|collect|pulse|chrome/.test(`${module.effectScope || ''} ${module.timingArc || ''} ${module.id}`)
  ) {
    recommendations.push(
      `${label} looks flourish/residue-shaped but updates lack role: prefixes; prefer flourish: / residue: / structural: topology.`,
    );
  }

  const hasRoleOrKindPrefix = module.updates.every((token) => (
    /^(?:attr|css-var|aria|class|event|selector|property|html|root|body|document|frame|structural|flourish|inspect|residue|measure|diagnostic):/.test(token)
    || token.startsWith('--')
  ));
  if (module.updates.length > 12 && !hasRoleOrKindPrefix) {
    recommendations.push(`${label} lists ${module.updates.length} updates; add role/kind prefixes or split when the contract becomes hard to scan.`);
  }
}

async function readModuleCatalogFamilies(): Promise<{ family: RuntimeFamily; source: string }[]> {
  return Promise.all(
    RUNTIME_FAMILIES.map(async (family) => {
      const file = MODULE_CATALOG_FAMILY_FILES[family];
      const source = await fs.readFile(path.join(MODULE_CATALOG_DIR, file), 'utf8');
      return { family, source };
    }),
  );
}

export async function collectRuntimeContractReport(): Promise<RuntimeContractReport> {
  const errors: string[] = [];
  const recommendations: string[] = [];
  const warnings: string[] = [];
  const modules: RuntimeContractModule[] = [];

  errors.push(...await collectModuleUpdateGrammarIssues());

  for (const { family, source } of await readModuleCatalogFamilies()) {
    const arrayLiteral = extractRuntimeArrayLiteral(source, family);
    if (!arrayLiteral) {
      errors.push(`public/js/runtime/${MODULE_CATALOG_FAMILY_FILES[family]} is missing ${family}.`);
      continue;
    }

    extractObjectLiterals(arrayLiteral).forEach((objectLiteral, index) => {
      modules.push(parseRuntimeModule(objectLiteral, family, index));
    });
  }

  const seen = new Map<string, RuntimeContractModule>();
  for (const module of modules) {
    validateModule(module, errors, warnings, recommendations);

    if (!module.id) continue;
    const prior = seen.get(module.id);
    if (prior) {
      errors.push(`${module.id} is defined twice (${prior.family}[${prior.index}] and ${module.family}[${module.index}]).`);
    } else {
      seen.set(module.id, module);
    }
  }

  const siteRuntime = await fs.readFile(SITE_RUNTIME_PATH, 'utf8');
  const nonCoreModules = modules.filter((module) => module.layer !== 'core' && module.layer !== 'region');
  const schedulerRequirements = [
    { timings: ['visible'], call: 'mountVisibleFeatures(NON_CORE_DEFS' },
    { timings: ['interaction'], call: 'mountInteractionFeatures(NON_CORE_DEFS' },
    { timings: ['invited'], call: 'mountInvitedFeatures(NON_CORE_DEFS' },
    { timings: ['idle', 'settled'], call: 'queueIdleEnhancements(NON_CORE_DEFS' },
  ];
  for (const requirement of schedulerRequirements) {
    const used = nonCoreModules.some((module) => requirement.timings.includes(module.when));
    if (used && !siteRuntime.includes(requirement.call)) {
      errors.push(`public/js/site.js does not schedule ${requirement.timings.join('/')} non-core definitions through NON_CORE_DEFS.`);
    }
  }

  for (const module of modules) {
    if (!module.importPath) continue;
    const absoluteImport = importPathToAbsolute(module.importPath);
    if (!(await pathExists(absoluteImport))) {
      errors.push(`${normalizeModuleLabel(module)} imports missing file ${module.importPath}.`);
    }
  }

  const rootEntrypoints = await collectRootJsEntrypoints();
  for (const entrypoint of rootEntrypoints) {
    if (!ALLOWED_ROOT_JS_FILES.has(entrypoint)) {
      errors.push(`public/js/${entrypoint} is a root-level JS file; add owned modules under kernel/, runtime/, interface/, semantic/, modules/, media/, or typed/.`);
    }
  }

  const ownerDirectories = await collectTopLevelJsDirectories();
  for (const directory of ownerDirectories) {
    if (!ALLOWED_JS_OWNER_DIRECTORIES.has(directory)) {
      errors.push(`public/js/${directory}/ is not a recognized JS ownership directory; update the runtime contract before adding a new top-level module family.`);
    }
  }

  const topLevelModuleFiles = await collectTopLevelModuleJsFiles();
  for (const file of topLevelModuleFiles) {
    errors.push(`${file} should move into a public/js/modules/<family>/ subdirectory.`);
  }

  const typedOutputs = await collectTypedOutputs();
  for (const output of typedOutputs) {
    const basename = path.basename(output, '.js');
    const source = path.join(PUBLIC_TS_DIR, `${basename}.ts`);
    if (!(await pathExists(source))) {
      errors.push(`${output} has no matching public/ts/${basename}.ts source.`);
    }
  }

  const typedImportViolations = await collectTypedImportViolations();
  errors.push(...typedImportViolations);

  const kernelTypedShimReport = await collectKernelTypedShimIssues();
  errors.push(...kernelTypedShimReport.errors);

  const behaviorScopeReport = await collectBehaviorScopeModuleIssues();
  errors.push(...behaviorScopeReport.errors);

  const stylePropertyReport = await collectStylePropertyContractReport();
  for (const write of stylePropertyReport.unknownStyleWrites) {
    const label = write.property || `${write.prefix || write.expression}*`;
    errors.push(`${write.file}:${write.line} writes ${label}, but that custom property is not referenced by public/css and is not in the runtime property registry.`);
  }
  for (const write of stylePropertyReport.unknownDynamicStyleWrites) {
    warnings.push(`${write.file}:${write.line} writes a dynamic style property (${write.expression}); add a static property, CSS reference, or registry allowance if this is intentional.`);
  }

  return {
    behaviorScopes: behaviorScopeReport.scopes,
    cssCustomProperties: stylePropertyReport.cssCustomProperties,
    dynamicStyleWrites: stylePropertyReport.dynamicStyleWrites,
    errors,
    kernelTypedShims: kernelTypedShimReport.shims,
    modules,
    ownerDirectories,
    recommendations,
    rootEntrypoints,
    stylePropertyWrites: stylePropertyReport.runtimeStyleWrites,
    topLevelModuleFiles,
    typedImportViolations,
    typedOutputs,
    unknownDynamicStyleWrites: stylePropertyReport.unknownDynamicStyleWrites,
    unknownStylePropertyWrites: stylePropertyReport.unknownStyleWrites,
    warnings,
  };
}

export async function main(): Promise<void> {
  const report = await collectRuntimeContractReport();
  const enhancementModules = report.modules.filter((module) => module.layer === 'enhancement' && !module.debugOnly);
  const enhancementImmediate = enhancementModules.filter((module) => module.when === 'immediate');
  const demandGatedImmediate = enhancementImmediate.filter((module) => (
    module.routeContract || module.selectorContract || module.features.length > 0
  ));

  const idleModules = report.modules.filter((module) => module.when === 'idle' && !module.debugOnly);
  const idleChunked = idleModules.filter((module) => Boolean(module.timingChunk));
  const rolefulModules = report.modules.filter((module) => (
    module.updates.some((token) => /(?:^|:)(?:structural|flourish|inspect|residue|measure|diagnostic):/.test(token)
      || /^(?:structural|flourish|inspect|residue|measure|diagnostic):/.test(token))
  ));

  const costClassTagged = report.modules.filter((module) => Boolean(module.costClass));
  const byWhen = report.modules.reduce<Record<string, number>>((acc, module) => {
    acc[module.when] = (acc[module.when] || 0) + 1;
    return acc;
  }, {});
  const byTimingStem = report.modules.reduce<Record<string, number>>((acc, module) => {
    if (!module.timingArc) {
      acc.missing = (acc.missing || 0) + 1;
      return acc;
    }
    const stem = TIMING_ARC_STEMS.find((candidate) => module.timingArc?.startsWith(`${candidate}-`)) || 'other';
    acc[stem] = (acc[stem] || 0) + 1;
    return acc;
  }, {});
  const byIdleChunk = idleModules.reduce<Record<string, number>>((acc, module) => {
    const chunk = module.timingChunk || 'inferred';
    acc[chunk] = (acc[chunk] || 0) + 1;
    return acc;
  }, {});
  const paintCompositeImmediate = enhancementImmediate.filter((module) => module.costClass === 'paint_composite');

  console.log(`[runtime] modules=${report.modules.length} ownerDirs=${report.ownerDirectories.length} rootEntrypoints=${report.rootEntrypoints.length} topLevelModuleFiles=${report.topLevelModuleFiles.length} styleWrites=${report.stylePropertyWrites.length} cssCustomProperties=${report.cssCustomProperties.length} typedOutputs=${report.typedOutputs.length} kernelShims=${report.kernelTypedShims.length} behaviorScopes=${report.behaviorScopes.length}`);
  console.log(`[runtime] mountHygiene enhancementImmediate=${enhancementImmediate.length}/${enhancementModules.length} demandGated=${demandGatedImmediate.length}/${enhancementImmediate.length} timingArc=${enhancementImmediate.filter((module) => Boolean(module.timingArc)).length}/${enhancementImmediate.length} idleChunk=${idleChunked.length}/${idleModules.length} rolefulUpdates=${rolefulModules.length}/${report.modules.length} costClass=${costClassTagged.length}/${report.modules.length} paintCompositeImmediate=${paintCompositeImmediate.length}`);
  console.log(`[runtime] schedule byWhen=${Object.entries(byWhen).map(([k, v]) => `${k}:${v}`).join(' ')}`);
  console.log(`[runtime] timingArc stems=${Object.entries(byTimingStem).map(([k, v]) => `${k}:${v}`).join(' ')}`);
  if (idleModules.length) {
    console.log(`[runtime] idleChunks ${Object.entries(byIdleChunk).map(([k, v]) => `${k}:${v}`).join(' ')}`);
  }

  if (report.warnings.length) {
    console.log(`[runtime] warnings=${report.warnings.length}`);
    for (const warning of report.warnings.slice(0, 12)) {
      console.log(`  warn: ${warning}`);
    }
    if (report.warnings.length > 12) {
      console.log(`  ... ${report.warnings.length - 12} more warnings`);
    }
  }

  if (report.recommendations.length) {
    console.log(`[runtime] recommendations=${report.recommendations.length}`);
    for (const recommendation of report.recommendations.slice(0, 12)) {
      console.log(`  note: ${recommendation}`);
    }
    if (report.recommendations.length > 12) {
      console.log(`  ... ${report.recommendations.length - 12} more recommendation(s)`);
    }
  }

  if (report.errors.length) {
    console.log(`[runtime] errors=${report.errors.length}`);
    for (const error of report.errors.slice(0, 12)) {
      console.log(`  error: ${error}`);
    }
    if (report.errors.length > 12) {
      console.log(`  ... ${report.errors.length - 12} more errors`);
    }
    process.exit(1);
  }

  console.log('[runtime] passed');
}
