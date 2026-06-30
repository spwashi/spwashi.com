#!/usr/bin/env node
/**
 * Starter inventory - portable site and component entrypoint map.
 *
 * This is intentionally read-only by default. It helps a developer answer:
 * which files can travel to a new site, which pages document component design,
 * and which implementation surfaces are intentionally Spwashi-specific.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const COMPOSE_CSS = 'public/css/compose.css';
const COMPOSE_JS = 'public/js/compose.js';
const COMPONENT_DOCS = [
  'design/composition/index.html',
  'design/components/index.html',
  'design/index.html',
  'design/slots/index.html',
  'design/palettes/index.html',
  'design/runtime/index.html',
];

const SITE_BOUNDARY_FILES = [
  'public/css/style.css',
  'public/js/site.js',
  'public/css/routes/',
  'public/css/shell/',
  'public/css/ornament/',
  'public/js/modules/',
];

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function absPath(relativePath) {
  return path.join(ROOT_DIR, relativePath);
}

async function readText(relativePath) {
  return fs.readFile(absPath(relativePath), 'utf8');
}

async function pathExists(relativePath) {
  try {
    await fs.access(absPath(relativePath));
    return true;
  } catch {
    return false;
  }
}

function parseArgs(argv) {
  const options = {
    check: false,
    format: 'text',
    out: null,
    quiet: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--check') {
      options.check = true;
      continue;
    }

    if (arg === '--json') {
      options.format = 'json';
      continue;
    }

    if (arg === '--format' && argv[index + 1]) {
      options.format = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith('--format=')) {
      options.format = arg.slice('--format='.length);
      continue;
    }

    if (arg === '--out' && argv[index + 1]) {
      options.out = path.resolve(argv[index + 1]);
      index += 1;
      continue;
    }

    if (arg.startsWith('--out=')) {
      options.out = path.resolve(arg.slice('--out='.length));
      continue;
    }

    if (arg === '--quiet') {
      options.quiet = true;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    throw new Error(`[starter-inventory] unknown argument: ${arg}`);
  }

  if (!['json', 'text'].includes(options.format)) {
    throw new Error(`[starter-inventory] unsupported format: ${options.format}`);
  }

  return options;
}

function printHelp() {
  console.log(`Usage: node scripts/starter-inventory.mjs [options]

Options:
  --check         Validate starter entrypoints and imported files.
  --json          Print machine-readable JSON.
  --format <fmt>  Output format: text or json. Default: text.
  --out <file>    Write JSON inventory to a file.
  --quiet         Suppress normal stdout when writing with --out.
  -h, --help      Show this help.
`);
}

function parseCssImports(source) {
  const imports = [];
  const importRe = /@import\s+url\(['"]([^'"]+)['"]\)\s+layer\(([a-z0-9_-]+)\)/g;
  let match;

  while ((match = importRe.exec(source)) !== null) {
    const [, href, layer] = match;
    imports.push({
      href,
      layer,
      path: toPosix(path.normalize(path.join(path.dirname(COMPOSE_CSS), href))),
    });
  }

  return imports;
}

function parseJsExports(source) {
  const namedExports = new Set();
  const sourceModules = new Set();
  const constRe = /export\s+const\s+([A-Za-z0-9_]+)/g;
  const blockRe = /export\s*\{([\s\S]*?)\}\s*from\s*['"]([^'"]+)['"]/g;
  let match;

  while ((match = constRe.exec(source)) !== null) {
    namedExports.add(match[1]);
  }

  while ((match = blockRe.exec(source)) !== null) {
    const [, block, sourceModule] = match;
    sourceModules.add(toPosix(path.normalize(path.join(path.dirname(COMPOSE_JS), sourceModule))));

    block
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .forEach((entry) => {
        const withoutComments = entry.replace(/\/\*.*?\*\//g, '').trim();
        const exportName = withoutComments.split(/\s+as\s+/).pop()?.trim();
        if (exportName) namedExports.add(exportName);
      });
  }

  return {
    named: Array.from(namedExports).sort(),
    sources: Array.from(sourceModules).sort(),
  };
}

function countOccurrences(source, pattern) {
  return (source.match(pattern) ?? []).length;
}

async function inspectComponentDoc(relativePath) {
  const exists = await pathExists(relativePath);
  if (!exists) {
    return {
      path: relativePath,
      exists,
    };
  }

  const source = await readText(relativePath);
  const title = source.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
    ?.replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim() || path.dirname(relativePath);

  return {
    path: relativePath,
    exists,
    title,
    counts: {
      dataSpwKind: countOccurrences(source, /\bdata-spw-kind=/g),
      dataSpwSlot: countOccurrences(source, /\bdata-spw-slot=/g),
      dataSpwComponent: countOccurrences(source, /\bdata-spw-component/g),
      framePanels: countOccurrences(source, /\bframe-panel\b/g),
      siteFrames: countOccurrences(source, /\bsite-frame\b/g),
    },
  };
}

async function collectComponentCssFiles() {
  const componentRoot = absPath('public/css/components');
  const files = [];

  async function walk(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(entryPath);
        continue;
      }
      if (entry.isFile() && entry.name.endsWith('.css')) {
        files.push(toPosix(path.relative(ROOT_DIR, entryPath)));
      }
    }
  }

  await walk(componentRoot);
  return files.sort();
}

async function buildInventory() {
  const [cssSource, jsSource, componentCssFiles, componentDocs] = await Promise.all([
    readText(COMPOSE_CSS),
    readText(COMPOSE_JS),
    collectComponentCssFiles(),
    Promise.all(COMPONENT_DOCS.map(inspectComponentDoc)),
  ]);

  const cssImports = parseCssImports(cssSource);
  const jsExports = parseJsExports(jsSource);
  const missing = [];

  for (const requiredPath of [COMPOSE_CSS, COMPOSE_JS]) {
    if (!(await pathExists(requiredPath))) missing.push(requiredPath);
  }

  for (const entry of cssImports) {
    if (!(await pathExists(entry.path))) missing.push(entry.path);
  }

  for (const sourcePath of jsExports.sources) {
    if (!(await pathExists(sourcePath))) missing.push(sourcePath);
  }

  for (const doc of componentDocs) {
    if (!doc.exists) missing.push(doc.path);
  }

  return {
    generatedAt: new Date().toISOString(),
    purpose: 'Map portable Spwashi composition files for new-site starters and component design.',
    starterEntrypoints: [
      {
        path: COMPOSE_CSS,
        role: 'portable CSS bundle: tokens, typography, grammar, components, handles, light effects',
        imports: cssImports,
      },
      {
        path: COMPOSE_JS,
        role: 'portable JS bundle: DOM contracts, runtime helpers, palette/query/SVG/component inspection helpers',
        exportCount: jsExports.named.length,
        exports: jsExports.named,
        sources: jsExports.sources,
      },
    ],
    componentDesignSurfaces: componentDocs,
    componentCssFiles,
    siteSpecificBoundaries: SITE_BOUNDARY_FILES,
    extractionRules: [
      'Start with compose.css and compose.js, not style.css and site.js.',
      'Carry component CSS only from public/css/components unless a specimen explicitly needs a token, grammar, handle, or light effect import already in compose.css.',
      'Treat route surfaces, shell chrome, ornament, site copy, analytics, and Spwashi identity as host-site material, not starter-kit defaults.',
      'Promote a component only after it has slot anatomy, state attributes, CSS ownership, and a validation path.',
    ],
    missing: Array.from(new Set(missing)).sort(),
  };
}

function renderText(inventory) {
  const lines = [
    'Starter inventory',
    '',
    `Portable CSS imports: ${inventory.starterEntrypoints[0].imports.length}`,
    `Portable JS exports: ${inventory.starterEntrypoints[1].exportCount}`,
    `Component CSS files: ${inventory.componentCssFiles.length}`,
    `Component/design docs: ${inventory.componentDesignSurfaces.filter((doc) => doc.exists).length}`,
    '',
    'Entrypoints:',
    `- ${COMPOSE_CSS}`,
    `- ${COMPOSE_JS}`,
    '',
    'Design surfaces:',
    ...inventory.componentDesignSurfaces.map((doc) => `- ${doc.path}${doc.title ? ` - ${doc.title}` : ''}`),
    '',
    'Boundaries:',
    ...inventory.siteSpecificBoundaries.map((item) => `- ${item}`),
  ];

  if (inventory.missing.length > 0) {
    lines.push('', 'Missing:', ...inventory.missing.map((item) => `- ${item}`));
  }

  return `${lines.join('\n')}\n`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const inventory = await buildInventory();
  const json = `${JSON.stringify(inventory, null, 2)}\n`;

  if (options.out) {
    await fs.mkdir(path.dirname(options.out), { recursive: true });
    await fs.writeFile(options.out, json, 'utf8');
  }

  if (!options.quiet || !options.out) {
    process.stdout.write(options.format === 'json' ? json : renderText(inventory));
  }

  if (options.check && inventory.missing.length > 0) {
    console.error(`[starter-inventory] missing ${inventory.missing.length} referenced starter files.`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
