import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  extractObjectLiterals,
  extractRuntimeArrayLiteral,
} from './site-contracts/helpers.mjs';
import { toPosixPath } from './shared/build-topology.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const PUBLIC_JS_DIR = path.join(ROOT_DIR, 'public/js');
const PUBLIC_TS_DIR = path.join(ROOT_DIR, 'public/ts');
const SITE_RUNTIME_PATH = path.join(PUBLIC_JS_DIR, 'site.js');

const RUNTIME_FAMILIES = ['CORE_DEFS', 'FEATURE_DEFS', 'REGION_DEFS', 'ENHANCEMENT_DEFS'] as const;
const VALID_LAYERS = new Set(['core', 'feature', 'region', 'enhancement']);
const VALID_MOUNT_TIMINGS = new Set(['immediate', 'visible', 'idle', 'interaction', 'region']);
const VALID_ROOT_MODES = new Set(['single', 'each']);
const ALLOWED_ROOT_JS_FILES = new Set(['compose.js', 'site.js']);
const ALLOWED_JS_OWNER_DIRECTORIES = new Set([
  'interface',
  'kernel',
  'media',
  'modules',
  'runtime',
  'semantic',
  'typed',
]);

type RuntimeFamily = (typeof RUNTIME_FAMILIES)[number];

type RuntimeContractModule = {
  debugOnly: boolean;
  describes: string | null;
  evaluates: string | null;
  family: RuntimeFamily;
  id: string;
  importPath: string | null;
  index: number;
  layer: string;
  objectLiteral: string;
  rootMode: string | null;
  selectorContract: boolean;
  selector: string | null;
  updates: string[];
  when: string;
};

type RuntimeContractReport = {
  errors: string[];
  modules: RuntimeContractModule[];
  recommendations: string[];
  ownerDirectories: string[];
  rootEntrypoints: string[];
  typedOutputs: string[];
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

function parseRuntimeModule(objectLiteral: string, family: RuntimeFamily, index: number): RuntimeContractModule {
  return {
    debugOnly: /\bdebugOnly:\s*true\b/.test(objectLiteral),
    describes: parseQuotedProperty(objectLiteral, 'describes'),
    evaluates: parseQuotedProperty(objectLiteral, 'evaluates'),
    family,
    id: parseQuotedProperty(objectLiteral, 'id') || '',
    importPath: objectLiteral.match(/import\(\s*['"]([^'"]+)['"]\s*\)/)?.[1] || null,
    index,
    layer: parseConstantProperty(objectLiteral, 'layer', 'MODULE_LAYERS') || family.replace(/_DEFS$/, '').toLowerCase(),
    objectLiteral,
    rootMode: parseQuotedProperty(objectLiteral, 'rootMode'),
    selectorContract: /\bselector\s*:/.test(objectLiteral),
    selector: parseQuotedProperty(objectLiteral, 'selector'),
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

async function collectTypedOutputs(): Promise<string[]> {
  const typedDir = path.join(PUBLIC_JS_DIR, 'typed');
  if (!(await pathExists(typedDir))) return [];
  const entries = await fs.readdir(typedDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
    .map((entry) => `public/js/typed/${entry.name}`)
    .sort();
}

function importPathToAbsolute(importPath: string): string {
  return path.resolve(path.dirname(SITE_RUNTIME_PATH), importPath);
}

function getImportOwnerDirectory(importPath: string): string | null {
  if (!importPath.startsWith('./')) return null;
  const normalized = importPath.slice(2).split(/[\\/]/).filter(Boolean);
  return normalized[0] || null;
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

  if (module.rootMode === 'each' && !module.selectorContract) {
    errors.push(`${label} uses rootMode="each" without a selector.`);
  }

  if (!/\bload:\s*(?:async\s*)?\(/.test(module.objectLiteral)) {
    errors.push(`${label} is missing a load() contract.`);
  }

  if (!/\bmount:\s*\(/.test(module.objectLiteral)) {
    errors.push(`${label} is missing a mount() contract.`);
  }

  if (module.importPath) {
    if (!module.importPath.startsWith('./') || module.importPath.includes('..')) {
      errors.push(`${label} import path must stay inside public/js with a ./ relative path.`);
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

  if (module.layer !== 'core' && !module.selectorContract && !module.debugOnly) {
    warnings.push(`${label} is ungated by selector; confirm it is intentionally document-wide.`);
  }

  if (module.layer !== 'core' && !module.describes) {
    recommendations.push(`${label} is missing describes; runtime audits cannot explain its semantic role.`);
  }

  if (module.layer !== 'core' && module.describes && !module.updates.length && !module.evaluates) {
    recommendations.push(`${label} describes behavior but names neither updates nor evaluates.`);
  }
}

export async function collectRuntimeContractReport(): Promise<RuntimeContractReport> {
  const errors: string[] = [];
  const recommendations: string[] = [];
  const warnings: string[] = [];
  const siteRuntime = await fs.readFile(SITE_RUNTIME_PATH, 'utf8');
  const modules: RuntimeContractModule[] = [];

  for (const family of RUNTIME_FAMILIES) {
    const arrayLiteral = extractRuntimeArrayLiteral(siteRuntime, family);
    if (!arrayLiteral) {
      errors.push(`public/js/site.js is missing ${family}.`);
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

  const typedOutputs = await collectTypedOutputs();
  for (const output of typedOutputs) {
    const basename = path.basename(output, '.js');
    const source = path.join(PUBLIC_TS_DIR, `${basename}.ts`);
    if (!(await pathExists(source))) {
      errors.push(`${output} has no matching public/ts/${basename}.ts source.`);
    }
  }

  return {
    errors,
    modules,
    ownerDirectories,
    recommendations,
    rootEntrypoints,
    typedOutputs,
    warnings,
  };
}

export async function main(): Promise<void> {
  const report = await collectRuntimeContractReport();

  console.log(`[runtime] modules=${report.modules.length} ownerDirs=${report.ownerDirectories.length} rootEntrypoints=${report.rootEntrypoints.length} typedOutputs=${report.typedOutputs.length}`);

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
