import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { BEHAVIOR_SCOPE_MODULE_HREF, BEHAVIOR_SCOPES, listBehaviorScopeBundles, listBehaviorScopeKeys, } from './css-manifest.mjs';
import { extractObjectLiterals, extractRuntimeArrayLiteral, } from './site-contracts/helpers.mjs';
import { toPosixPath } from './shared/build-topology.mjs';
import { collectStylePropertyContractReport, } from './style-property-contract.mjs';
const BEHAVIOR_SCOPE_KEYS = new Set(Object.keys(BEHAVIOR_SCOPES));
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const PUBLIC_JS_DIR = path.join(ROOT_DIR, 'public/js');
const MODULES_DIR = path.join(PUBLIC_JS_DIR, 'modules');
const PUBLIC_TS_DIR = path.join(ROOT_DIR, 'public/ts');
const MODULE_CATALOG_PATH = path.join(PUBLIC_JS_DIR, 'runtime/module-catalog.js');
const MODULE_UPDATES_CONTRACT_PATH = path.join(PUBLIC_JS_DIR, 'runtime/module-updates-contract.js');
const RUNTIME_FAMILIES = ['CORE_DEFS', 'FEATURE_DEFS', 'REGION_DEFS', 'ENHANCEMENT_DEFS'];
const VALID_LAYERS = new Set(['core', 'feature', 'region', 'enhancement']);
const VALID_MOUNT_TIMINGS = new Set(['immediate', 'visible', 'idle', 'interaction', 'region', 'settled']);
const VALID_ROOT_MODES = new Set(['single', 'each']);
const CONTRACT_TOKEN_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
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
const ALLOWED_TYPED_IMPORT_DIRECTORIES = new Set(['kernel', 'typed']);
const ALLOWED_TYPED_IMPORT_ROOT_FILES = new Set(['site.js']);
const KERNEL_TYPED_SHIMS = new Map([
    ['bus', 'kernel/bus.js'],
    ['feed-utils', 'kernel/feed-utils.js'],
    ['runtime-environment', 'kernel/runtime-environment.js'],
]);
const TYPED_IMPORT_RE = /(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]*typed\/[^'"]+)['"]/g;
const TYPED_SHIM_RE = /export\s+\*\s+from\s+['"]([^'"]+)['"]/;
function relativeRepoPath(absolutePath) {
    return toPosixPath(path.relative(ROOT_DIR, absolutePath));
}
async function pathExists(absolutePath) {
    try {
        await fs.access(absolutePath);
        return true;
    }
    catch {
        return false;
    }
}
function parseQuotedProperty(source, name) {
    const match = source.match(new RegExp(`${name}:\\s*(['"\`])([\\s\\S]*?)\\1`));
    return match?.[2] || null;
}
function parseConstantProperty(source, name, namespace) {
    const match = source.match(new RegExp(`${name}:\\s*${namespace}\\.([A-Z_]+)`));
    return match?.[1]?.toLowerCase().replace(/_/g, '-') || null;
}
function parseUpdates(source) {
    const match = source.match(/updates:\s*\[([\s\S]*?)\]/);
    if (!match)
        return [];
    return [...match[1].matchAll(/(['"`])([^'"`]+)\1/g)].map((item) => item[2]);
}
const MODULE_UPDATE_SCOPES = new Set(['html', 'root', 'body', 'document', 'frame']);
const MODULE_UPDATE_KINDS = new Set(['attr', 'css-var', 'aria', 'class', 'event', 'selector', 'property']);
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
function isKnownModuleUpdateKind(token) {
    const normalized = token.toLowerCase();
    return MODULE_UPDATE_KINDS.has(normalized) || MODULE_UPDATE_KIND_ALIASES.has(normalized);
}
function normalizeModuleUpdateKind(token) {
    const normalized = token.toLowerCase();
    return MODULE_UPDATE_KIND_ALIASES.get(normalized) || (MODULE_UPDATE_KINDS.has(normalized) ? normalized : 'attr');
}
function classifyModuleUpdateToken(token, allowScope = true) {
    const raw = token.trim();
    if (!raw)
        return null;
    if (allowScope) {
        const scopeMatch = raw.match(/^([a-z]+):(.+)$/i);
        if (scopeMatch && MODULE_UPDATE_SCOPES.has(scopeMatch[1].toLowerCase())) {
            const inner = classifyModuleUpdateToken(scopeMatch[2], false);
            return inner ? { ...inner, scope: scopeMatch[1].toLowerCase() } : null;
        }
    }
    const explicit = raw.match(/^([a-z-]+):(.+)$/i);
    if (explicit && isKnownModuleUpdateKind(explicit[1])) {
        const kind = normalizeModuleUpdateKind(explicit[1]);
        const name = explicit[2].trim();
        return name ? { kind, name } : null;
    }
    if (raw.startsWith('--'))
        return { kind: 'css-var', name: raw };
    if (raw.startsWith('aria-'))
        return { kind: 'aria', name: raw };
    if (raw.startsWith('.'))
        return { kind: 'class', name: raw };
    if (raw.startsWith('spw:') || /^[a-z][a-z0-9-]*:[a-z0-9-]+$/.test(raw))
        return { kind: 'event', name: raw };
    if (/^[#.[]/.test(raw) || raw.includes(' '))
        return { kind: 'selector', name: raw };
    return { kind: 'attr', name: raw };
}
function validateModuleUpdateToken(token) {
    const parsed = classifyModuleUpdateToken(token);
    if (!parsed)
        return 'empty-token';
    const { kind, name } = parsed;
    if (kind === 'css-var' && !/^--[a-z0-9-]+$/.test(name))
        return 'css-var-shape';
    if (kind === 'aria' && !/^aria-[a-z0-9-]+$/.test(name))
        return 'aria-shape';
    if (kind === 'class' && !/^\.[a-z0-9_-]+$/.test(name))
        return 'class-shape';
    if (kind === 'event' && !/^[a-z][a-z0-9-]*:[a-z0-9-]+$/.test(name))
        return 'event-shape';
    if (kind === 'attr' && !/^(data-[a-z0-9-]+|aria-[a-z0-9-]+|[a-z][a-z0-9-]*)$/.test(name))
        return 'attr-shape';
    return null;
}
function sameStringList(a, b) {
    if (a.length !== b.length)
        return false;
    return a.every((value, index) => value === b[index]);
}
function sortedStrings(values) {
    return [...values].sort((a, b) => a.localeCompare(b));
}
function parseFrozenStringArray(source, name) {
    const match = source.match(new RegExp(`export const ${name} = Object\\.freeze\\(\\[([\\s\\S]*?)\\]\\);`));
    if (!match)
        return null;
    return [...match[1].matchAll(/(['"`])([^'"`]+)\1/g)].map((item) => item[2]);
}
function parseFrozenAliasObject(source, name) {
    const match = source.match(new RegExp(`const ${name} = Object\\.freeze\\(\\{([\\s\\S]*?)\\}\\);`));
    if (!match)
        return null;
    const aliases = new Map();
    const aliasRe = /(?:(['"`])([^'"`]+)\1|([a-zA-Z0-9_-]+))\s*:\s*(['"`])([^'"`]+)\4/g;
    for (const item of match[1].matchAll(aliasRe)) {
        aliases.set(item[2] || item[3], item[5]);
    }
    return aliases;
}
async function collectModuleUpdateGrammarIssues() {
    const errors = [];
    const source = await fs.readFile(MODULE_UPDATES_CONTRACT_PATH, 'utf8');
    const runtimeKinds = parseFrozenStringArray(source, 'MODULE_UPDATE_KINDS');
    const runtimeScopes = parseFrozenStringArray(source, 'MODULE_UPDATE_SCOPES');
    const runtimeAliases = parseFrozenAliasObject(source, 'KIND_ALIASES');
    if (!runtimeKinds) {
        errors.push(`${relativeRepoPath(MODULE_UPDATES_CONTRACT_PATH)} does not expose parseable MODULE_UPDATE_KINDS.`);
    }
    else if (!sameStringList(sortedStrings(MODULE_UPDATE_KINDS), sortedStrings(runtimeKinds))) {
        errors.push(`module update kind grammar drifted: TS=${sortedStrings(MODULE_UPDATE_KINDS).join(',')} runtime=${sortedStrings(runtimeKinds).join(',')}.`);
    }
    if (!runtimeScopes) {
        errors.push(`${relativeRepoPath(MODULE_UPDATES_CONTRACT_PATH)} does not expose parseable MODULE_UPDATE_SCOPES.`);
    }
    else if (!sameStringList(sortedStrings(MODULE_UPDATE_SCOPES), sortedStrings(runtimeScopes))) {
        errors.push(`module update scope grammar drifted: TS=${sortedStrings(MODULE_UPDATE_SCOPES).join(',')} runtime=${sortedStrings(runtimeScopes).join(',')}.`);
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
function parseFeatures(source) {
    const stringMatch = source.match(/features:\s*(['"`])([^'"`]+)\1/);
    if (stringMatch)
        return [stringMatch[2]];
    const arrayMatch = source.match(/features:\s*\[([\s\S]*?)\]/);
    if (!arrayMatch)
        return [];
    return [...arrayMatch[1].matchAll(/(['"`])([^'"`]+)\1/g)].map((item) => item[2]);
}
function splitContractTokens(value) {
    if (!value)
        return [];
    return value.split(/[\s,]+/).map((token) => token.trim()).filter(Boolean);
}
function parseExportedStringArray(source, name) {
    const pattern = new RegExp(`export\\s+const\\s+${name}\\s*=\\s*Object\\.freeze\\(\\s*\\[([\\s\\S]*?)\\]\\s*\\)`);
    const match = source.match(pattern);
    if (!match)
        return [];
    return [...match[1].matchAll(/(['"`])([^'"`]+)\1/g)].map((item) => item[2]);
}
function parseExportedStringMap(source, name) {
    const pattern = new RegExp(`export\\s+const\\s+${name}\\s*=\\s*Object\\.freeze\\(\\s*\\{([\\s\\S]*?)\\}\\s*\\)`);
    const match = source.match(pattern);
    const entries = {};
    if (!match)
        return entries;
    for (const item of match[1].matchAll(/(['"`])([^'"`]+)\1\s*:\s*(['"`])([^'"`]+)\3/g)) {
        entries[item[2]] = item[4];
    }
    return entries;
}
function sameList(left, right) {
    if (left.length !== right.length)
        return false;
    return left.every((item, index) => item === right[index]);
}
function sameMap(left, right) {
    return JSON.stringify(Object.entries(left).sort()) === JSON.stringify(Object.entries(right).sort());
}
function parseRuntimeModule(objectLiteral, family, index) {
    return {
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
        rootMode: parseQuotedProperty(objectLiteral, 'rootMode'),
        selectorContract: /\bselector\s*:/.test(objectLiteral),
        selector: parseQuotedProperty(objectLiteral, 'selector'),
        timingArc: parseQuotedProperty(objectLiteral, 'timingArc'),
        updates: parseUpdates(objectLiteral),
        when: parseConstantProperty(objectLiteral, 'when', 'MOUNT_WHEN') || 'immediate',
    };
}
function normalizeModuleLabel(module) {
    return module.id || `${module.family}[${module.index}]`;
}
async function collectRootJsEntrypoints() {
    const entries = await fs.readdir(PUBLIC_JS_DIR, { withFileTypes: true });
    return entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
        .map((entry) => entry.name)
        .sort();
}
async function collectTopLevelJsDirectories() {
    const entries = await fs.readdir(PUBLIC_JS_DIR, { withFileTypes: true });
    return entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();
}
async function collectTopLevelModuleJsFiles() {
    if (!(await pathExists(MODULES_DIR)))
        return [];
    const entries = await fs.readdir(MODULES_DIR, { withFileTypes: true });
    return entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
        .map((entry) => `public/js/modules/${entry.name}`)
        .sort();
}
async function collectTypedOutputs() {
    const typedDir = path.join(PUBLIC_JS_DIR, 'typed');
    if (!(await pathExists(typedDir)))
        return [];
    const entries = await fs.readdir(typedDir, { withFileTypes: true });
    return entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
        .map((entry) => `public/js/typed/${entry.name}`)
        .sort();
}
async function collectJsFilesUnder(directory, prefix = '') {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const files = [];
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
function canImportTypedModule(relativeFilePath) {
    if (ALLOWED_TYPED_IMPORT_ROOT_FILES.has(relativeFilePath)) {
        return true;
    }
    const [ownerDirectory] = relativeFilePath.split('/');
    return Boolean(ownerDirectory && ALLOWED_TYPED_IMPORT_DIRECTORIES.has(ownerDirectory));
}
async function collectTypedImportViolations() {
    const errors = [];
    const files = await collectJsFilesUnder(PUBLIC_JS_DIR);
    for (const relativeFilePath of files) {
        if (relativeFilePath.startsWith('typed/'))
            continue;
        const absolutePath = path.join(PUBLIC_JS_DIR, relativeFilePath);
        const source = await fs.readFile(absolutePath, 'utf8');
        const matches = [...source.matchAll(TYPED_IMPORT_RE)];
        if (!matches.length)
            continue;
        if (!canImportTypedModule(relativeFilePath)) {
            const importTargets = [...new Set(matches.map((match) => match[1]))].join(', ');
            errors.push(`${relativeRepoPath(absolutePath)} imports generated typed output (${importTargets}); route through kernel/ shims or site.js dynamic imports.`);
        }
    }
    return errors;
}
async function collectKernelTypedShimIssues() {
    const errors = [];
    const shims = [];
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
async function collectBehaviorScopeModuleIssues() {
    const errors = [];
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
function importPathToAbsolute(importPath) {
    return path.resolve(path.dirname(MODULE_CATALOG_PATH), importPath);
}
function getImportOwnerDirectory(importPath) {
    if (!importPath.startsWith('./') && !importPath.startsWith('../'))
        return null;
    const absoluteImport = importPathToAbsolute(importPath);
    const relative = toPosixPath(path.relative(PUBLIC_JS_DIR, absoluteImport));
    const [ownerDirectory] = relative.split('/').filter(Boolean);
    return ownerDirectory || null;
}
function validateModule(module, errors, warnings, recommendations) {
    const label = normalizeModuleLabel(module);
    if (!module.id) {
        errors.push(`${module.family}[${module.index}] is missing an id.`);
    }
    else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(module.id)) {
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
    if (!/\bmount:\s*\(/.test(module.objectLiteral)) {
        errors.push(`${label} is missing a mount() contract.`);
    }
    if (module.importPath) {
        if ((!module.importPath.startsWith('./') && !module.importPath.startsWith('../'))
            || module.importPath.startsWith('/')) {
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
    }
    else if (!/\bload:\s*async\s*\(\)\s*=>\s*\(\s*\{/.test(module.objectLiteral)) {
        warnings.push(`${label} has no static import() path; resource hints and generated manifests cannot name its file.`);
    }
    if (module.layer !== 'core' && !module.selectorContract && !module.debugOnly && !module.features.length) {
        warnings.push(`${label} is ungated by selector; confirm it is intentionally document-wide.`);
    }
    for (const feature of module.features) {
        if (!BEHAVIOR_SCOPE_KEYS.has(feature)) {
            errors.push(`${label} features "${feature}" is not a recognized CSS behavior scope (${[...BEHAVIOR_SCOPE_KEYS].join(', ')}).`);
        }
    }
    if (module.features.length && module.selector?.includes('data-spw-features~=')) {
        recommendations.push(`${label} declares features and encodes data-spw-features in selector; prefer features-only gating.`);
    }
    if (module.layer !== 'core' && !module.describes) {
        recommendations.push(`${label} is missing describes; runtime audits cannot explain its semantic role.`);
    }
    if (module.layer !== 'core' && module.describes && !module.updates.length && !module.evaluates) {
        recommendations.push(`${label} describes behavior but names neither updates nor evaluates.`);
    }
    const seenUpdates = new Set();
    for (const token of module.updates) {
        const issue = validateModuleUpdateToken(token);
        if (issue) {
            warnings.push(`${label} updates token "${token}" has ${issue}; use attr:, css-var:, aria:, class:, event:, selector:, or property: prefixes when inference is ambiguous.`);
        }
        const parsed = classifyModuleUpdateToken(token);
        if (!parsed)
            continue;
        const key = `${parsed.scope ? `${parsed.scope}:` : ''}${parsed.kind}:${parsed.name}`;
        if (seenUpdates.has(key)) {
            warnings.push(`${label} repeats update ${key}.`);
            continue;
        }
        seenUpdates.add(key);
    }
    if (module.updates.length > 12) {
        recommendations.push(`${label} lists ${module.updates.length} updates; group by kind in catalog comments or split into focused modules when the contract becomes hard to scan.`);
    }
}
export async function collectRuntimeContractReport() {
    const errors = [];
    const recommendations = [];
    const warnings = [];
    const moduleCatalog = await fs.readFile(MODULE_CATALOG_PATH, 'utf8');
    const modules = [];
    errors.push(...await collectModuleUpdateGrammarIssues());
    for (const family of RUNTIME_FAMILIES) {
        const arrayLiteral = extractRuntimeArrayLiteral(moduleCatalog, family);
        if (!arrayLiteral) {
            errors.push(`public/js/runtime/module-catalog.js is missing ${family}.`);
            continue;
        }
        extractObjectLiterals(arrayLiteral).forEach((objectLiteral, index) => {
            modules.push(parseRuntimeModule(objectLiteral, family, index));
        });
    }
    const seen = new Map();
    for (const module of modules) {
        validateModule(module, errors, warnings, recommendations);
        if (!module.id)
            continue;
        const prior = seen.get(module.id);
        if (prior) {
            errors.push(`${module.id} is defined twice (${prior.family}[${prior.index}] and ${module.family}[${module.index}]).`);
        }
        else {
            seen.set(module.id, module);
        }
    }
    for (const module of modules) {
        if (!module.importPath)
            continue;
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
export async function main() {
    const report = await collectRuntimeContractReport();
    console.log(`[runtime] modules=${report.modules.length} ownerDirs=${report.ownerDirectories.length} rootEntrypoints=${report.rootEntrypoints.length} topLevelModuleFiles=${report.topLevelModuleFiles.length} styleWrites=${report.stylePropertyWrites.length} cssCustomProperties=${report.cssCustomProperties.length} typedOutputs=${report.typedOutputs.length} kernelShims=${report.kernelTypedShims.length} behaviorScopes=${report.behaviorScopes.length}`);
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
