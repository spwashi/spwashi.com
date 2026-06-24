import { promises as fs } from 'node:fs';
import path from 'node:path';

import {
  shouldIgnoreValidationPath,
  toPosixPath,
} from './shared/build-topology.mjs';

const ROOT_DIR = path.resolve(import.meta.dirname, '..', '..');
const CSS_DIR = path.join(ROOT_DIR, 'public/css');
const PUBLIC_JS_DIR = path.join(ROOT_DIR, 'public/js');
const PUBLIC_TS_DIR = path.join(ROOT_DIR, 'public/ts');

const CSS_CUSTOM_PROPERTY_RE = /--[A-Za-z0-9_-]+/g;
const SET_PROPERTY_CALL_RE = /\.style\.setProperty\(\s*([^,\n]+)/g;
const QUOTED_CUSTOM_PROPERTY_RE = /^(['"`])(--[A-Za-z0-9_-]+)\1$/;
const TEMPLATE_CUSTOM_PROPERTY_PREFIX_RE = /^`(--[A-Za-z0-9_-]+)\$\{/;

const GENERATED_CSS_SEGMENTS = new Set(['bundles']);
const GENERATED_JS_SEGMENTS = new Set(['typed']);

export type StylePropertyWrite = {
  file: string;
  line: number;
  property: string | null;
  prefix: string | null;
  expression: string;
};

export type StylePropertyContractReport = {
  cssCustomProperties: string[];
  dynamicStyleWrites: StylePropertyWrite[];
  runtimeStyleWrites: StylePropertyWrite[];
  unknownDynamicStyleWrites: StylePropertyWrite[];
  unknownStyleWrites: StylePropertyWrite[];
};

type RuntimePropertyAllowance = {
  owner: string;
  test: (property: string) => boolean;
};

const RUNTIME_PROPERTY_ALLOWANCES: RuntimePropertyAllowance[] = [
  { owner: 'runtime telemetry', test: (property) => property.startsWith('--spw-runtime-') },
  { owner: 'generated pretext presets', test: (property) => property.startsWith('--spw-preset-') },
  { owner: 'pretext measurement/rhythm', test: (property) => property.startsWith('--pretext-') },
  { owner: 'lens-mode measurements', test: (property) => property.startsWith('--spw-lens-') },
  { owner: 'section attention measurements', test: (property) => property.startsWith('--spw-section-') },
  { owner: 'design ecology demo measurements', test: (property) => property.startsWith('--design-ecology-') },
  { owner: 'root prepaint typography', test: (property) => property === '--font-size-scale' },
  { owner: 'line-local pretext physics', test: (property) => property === '--line-index' },
  { owner: 'region profiler readout', test: (property) => property === '--region-harmonic-weight' },
  { owner: 'developmental climate readout', test: (property) => property === '--spw-developmental-index' },
  { owner: 'page anatomy trace readout', test: (property) => property === '--spw-palette-trace-count' },
  { owner: 'wonder memory alternate color', test: (property) => property === '--spw-wonder-memory-alt-color' },
];

const DYNAMIC_STYLE_WRITE_FILES = new Map<string, string>([
  ['public/js/interface/canvas-accents.js', 'accent palette token map'],
  ['public/js/kernel/dom-contracts.js', 'query disposition helpers'],
  ['public/js/kernel/instrumentation.js', 'debug instrumentation helper'],
  ['public/js/kernel/shared.js', 'operator token assignment helper'],
  ['public/js/kernel/site-settings-engine.js', 'settings token projection'],
  ['public/js/modules/design/experiments.js', 'design experiment token controls'],
  ['public/js/runtime/region-menu.js', 'region menu variable tuner'],
]);

function relativeRepoPath(absolutePath: string): string {
  return toPosixPath(path.relative(ROOT_DIR, absolutePath));
}

function rootPathSegments(relativePath: string): string[] {
  return toPosixPath(relativePath).replace(/^\/+/, '').split('/').filter(Boolean);
}

async function walk(directoryPath: string, predicate: (absolutePath: string) => boolean, results: string[] = []): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(directoryPath, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    const absolutePath = path.join(directoryPath, entry.name);
    const relativePath = relativeRepoPath(absolutePath);
    if (shouldIgnoreValidationPath(relativePath)) continue;

    if (entry.isDirectory()) {
      await walk(absolutePath, predicate, results);
      continue;
    }

    if (entry.isFile() && predicate(absolutePath)) {
      results.push(absolutePath);
    }
  }

  return results;
}

function isGeneratedCssFile(absolutePath: string): boolean {
  const [, , owner] = rootPathSegments(relativeRepoPath(absolutePath));
  return Boolean(owner && GENERATED_CSS_SEGMENTS.has(owner));
}

function isGeneratedJsFile(absolutePath: string): boolean {
  const [, , owner] = rootPathSegments(relativeRepoPath(absolutePath));
  return Boolean(owner && GENERATED_JS_SEGMENTS.has(owner));
}

function lineNumberForIndex(source: string, index: number): number {
  return source.slice(0, index).split('\n').length;
}

function normalizeExpression(expression: string): string {
  return expression.trim().replace(/\s+/g, ' ');
}

function parseStyleWrite(source: string, match: RegExpMatchArray): StylePropertyWrite {
  const expression = normalizeExpression(match[1] || '');
  const quoted = expression.match(QUOTED_CUSTOM_PROPERTY_RE);
  const templated = expression.match(TEMPLATE_CUSTOM_PROPERTY_PREFIX_RE);

  return {
    file: '',
    line: lineNumberForIndex(source, match.index || 0),
    property: quoted?.[2] || null,
    prefix: templated?.[1] || null,
    expression,
  };
}

export async function collectCssCustomProperties(): Promise<string[]> {
  const cssFiles = await walk(CSS_DIR, (absolutePath) => absolutePath.endsWith('.css') && !isGeneratedCssFile(absolutePath));
  const properties = new Set<string>();

  for (const file of cssFiles) {
    const source = await fs.readFile(file, 'utf8');
    for (const match of source.matchAll(CSS_CUSTOM_PROPERTY_RE)) {
      properties.add(match[0]);
    }
  }

  return [...properties].sort();
}

export async function collectRuntimeStyleWrites(): Promise<StylePropertyWrite[]> {
  const jsFiles = await walk(PUBLIC_JS_DIR, (absolutePath) => absolutePath.endsWith('.js') && !isGeneratedJsFile(absolutePath));
  const tsFiles = await walk(PUBLIC_TS_DIR, (absolutePath) => absolutePath.endsWith('.ts'));
  const writes: StylePropertyWrite[] = [];

  for (const file of [...jsFiles, ...tsFiles].sort()) {
    const source = await fs.readFile(file, 'utf8');
    for (const match of source.matchAll(SET_PROPERTY_CALL_RE)) {
      const write = parseStyleWrite(source, match);
      write.file = relativeRepoPath(file);
      writes.push(write);
    }
  }

  return writes.sort((left, right) => left.file.localeCompare(right.file) || left.line - right.line);
}

export function isAllowedRuntimeStyleProperty(property: string): boolean {
  return RUNTIME_PROPERTY_ALLOWANCES.some((allowance) => allowance.test(property));
}

export function isAllowedDynamicStyleWrite(write: StylePropertyWrite): boolean {
  return DYNAMIC_STYLE_WRITE_FILES.has(write.file);
}

export async function collectStylePropertyContractReport(): Promise<StylePropertyContractReport> {
  const cssCustomProperties = await collectCssCustomProperties();
  const cssPropertySet = new Set(cssCustomProperties);
  const runtimeStyleWrites = await collectRuntimeStyleWrites();
  const dynamicStyleWrites = runtimeStyleWrites.filter((write) => !write.property && !write.prefix);
  const unknownStyleWrites = runtimeStyleWrites.filter((write) => {
    if (!write.property && !write.prefix) return false;
    if (write.property && (cssPropertySet.has(write.property) || isAllowedRuntimeStyleProperty(write.property))) return false;
    const prefix = write.prefix;
    if (prefix && [...cssPropertySet].some((property) => property.startsWith(prefix))) return false;
    if (prefix && isAllowedRuntimeStyleProperty(`${prefix}runtime-placeholder`)) return false;
    return true;
  });
  const unknownDynamicStyleWrites = dynamicStyleWrites.filter((write) => !isAllowedDynamicStyleWrite(write));

  return {
    cssCustomProperties,
    dynamicStyleWrites,
    runtimeStyleWrites,
    unknownDynamicStyleWrites,
    unknownStyleWrites,
  };
}
