import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const IMAGE_ROOT = path.join(ROOT, 'public/images');
const OUT_PATH = path.join(ROOT, 'public/data/image-resources.json');
const EXTENSIONS = new Set(['.avif', '.webp', '.png', '.jpg', '.jpeg', '.svg']);
const DERIVATIVE_RE = /-(thumb|display|hero|icon|large|square|og)$/;

const ROUTE_HINTS = [
  'home',
  'about',
  'blog',
  'care',
  'craft',
  'design',
  'nutrition',
  'play',
  'rpg',
  'rpg-wednesday',
  'search',
  'software',
  'tools',
  'town',
  'website',
];

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function wordsFrom(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[_/]+/g, '-')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function titleFromSlug(slug = '') {
  return wordsFrom(slug)
    .filter((word) => !['source', 'spwashi', 'public', 'images'].includes(word))
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function semanticConcepts(relativePath = '') {
  const words = new Set(wordsFrom(relativePath));
  const concepts = [];

  if (words.has('rpg') || words.has('wednesday') || words.has('paladin') || words.has('woodfrog')) {
    concepts.push('rpg-wednesday', 'session-memory', 'character');
  }
  if (words.has('algorithm') || words.has('lattice') || words.has('scheduler')) {
    concepts.push('software', 'algorithm', 'architecture');
  }
  if (words.has('care') || words.has('mental') || words.has('shelter')) {
    concepts.push('care', 'support');
  }
  if (words.has('nutrition') || words.has('fermentation') || words.has('dough') || words.has('knife')) {
    concepts.push('food', 'material-practice');
  }
  if (words.has('website') || words.has('atlas') || words.has('threshold')) {
    concepts.push('site-design', 'route-architecture');
  }
  if (words.has('library') || words.has('lore') || words.has('town')) {
    concepts.push('library', 'worldbuilding');
  }
  if (words.has('papergami') || words.has('wash') || words.has('abstract')) {
    concepts.push('style-reference', 'surface');
  }

  ROUTE_HINTS.forEach((hint) => {
    if (words.has(hint)) concepts.push(hint);
  });

  return [...new Set(concepts)];
}

function roleFor(relativePath = '', extension = '') {
  const words = new Set(wordsFrom(relativePath));
  if (words.has('og')) return 'social-card';
  if (words.has('hero')) return 'hero';
  if (words.has('thumb') || words.has('icon')) return 'thumbnail';
  if (words.has('display') || words.has('large')) return 'display';
  if (extension === '.svg') return 'vector';
  if (relativePath.includes('/renders/')) return 'render';
  return 'image';
}

async function collectImages(dir = IMAGE_ROOT) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const images = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      images.push(...await collectImages(fullPath));
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (!EXTENSIONS.has(extension)) continue;

    const stat = await fs.stat(fullPath);
    const relativePath = toPosix(path.relative(ROOT, fullPath));
    const publicPath = `/${relativePath}`;
    const base = path.basename(entry.name, extension);
    const family = base.replace(DERIVATIVE_RE, '');

    images.push({
      id: family,
      title: titleFromSlug(family),
      path: publicPath,
      directory: toPosix(path.dirname(relativePath)),
      format: extension.slice(1),
      bytes: stat.size,
      role: roleFor(relativePath, extension),
      concepts: semanticConcepts(relativePath),
      swapHint: `Use ${publicPath} when a ${semanticConcepts(relativePath).join(' / ') || roleFor(relativePath, extension)} visual needs a stable tracked asset.`,
    });
  }

  return images.sort((a, b) => a.path.localeCompare(b.path));
}

function parseArgs(argv = []) {
  const args = { concept: '', format: '', role: '', list: false };
  argv.forEach((arg) => {
    if (arg === '--list') args.list = true;
    if (arg.startsWith('--concept=')) args.concept = arg.slice('--concept='.length).toLowerCase();
    if (arg.startsWith('--format=')) args.format = arg.slice('--format='.length).toLowerCase();
    if (arg.startsWith('--role=')) args.role = arg.slice('--role='.length).toLowerCase();
  });
  return args;
}

function filterImages(images, args) {
  return images.filter((image) => {
    if (args.concept && !image.concepts.includes(args.concept)) return false;
    if (args.format && image.format !== args.format) return false;
    if (args.role && image.role !== args.role) return false;
    return true;
  });
}

const args = parseArgs(process.argv.slice(2));
const images = await collectImages();
const filtered = filterImages(images, args);

const manifest = {
  generatedAt: new Date().toISOString(),
  sourceRoot: '/public/images/',
  count: images.length,
  concepts: [...new Set(images.flatMap((image) => image.concepts))].sort(),
  images,
};

await fs.mkdir(path.dirname(OUT_PATH), { recursive: true });
await fs.writeFile(OUT_PATH, `${JSON.stringify(manifest, null, 2)}\n`);

if (args.list) {
  filtered.forEach((image) => {
    console.log(`${image.path} :: ${image.role} :: ${image.concepts.join(', ') || 'unclassified'}`);
  });
} else {
  console.log(`[images] wrote ${path.relative(ROOT, OUT_PATH)} (${images.length} resources)`);
}
