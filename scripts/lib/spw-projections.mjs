/**
 * The projection registry the language server reads, .spw/gen/index.spw: one
 * ^projection block per generator. A .spw file under a registered root offers
 * its source, its rebuild command and its spec as lenses, and the editor warns
 * before a first edit, so a generated file is not mistaken for a hand-written one.
 *
 * The server matches a file when its path starts with a root, so a root may be
 * a folder, one file, or the stem of dated files. .spw/gen/ is gitignored, so
 * every generator below rewrites the whole registry when it runs, and
 *   npm run spw:projections
 * writes it on a fresh clone. Files that mix a generated region with
 * hand-written facets (the .agents/skills/ surfaces) stay out on purpose.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const PROJECTION_INDEX = path.join(ROOT, '.spw/gen/index.spw');

export const PROJECTIONS = Object.freeze([
  {
    name: 'routes',
    root: '.spw/gen/routes',
    source: 'every route index.html that carries a <spw-page> block',
    spec_owner: '.spw/surfaces.spw',
    generator_owner: 'scripts/spw-routes.mjs',
    status: 'rebuilt by npm run spw:routes -- --write',
  },
  {
    name: 'snippets',
    root: '.spw/snippets.spw',
    source: 'every probe in the .spw canon, with the surface and anchor that own it',
    spec_owner: '.spw/index.spw',
    generator_owner: 'scripts/spw-snippets.mjs',
    status: 'rebuilt by npm run spw:snippets',
  },
  {
    name: 'dimensions',
    root: '.spw/dimensions.spw',
    source: 'the axes every .spw surface declares, and when each last changed',
    spec_owner: '.spw/conventions/dimensional-ascent-script-patterns.spw',
    generator_owner: 'scripts/spw-dimensional-index.mjs',
    status: 'rebuilt by npm run spw:dimensions -- --write',
  },
  {
    name: 'language_census',
    root: '.spw/audits/language-census.spw',
    source: 'every attribute family across the HTML, CSS, JS and .spw',
    spec_owner: '.spw/conventions/data-spw-attribute-governance.spw',
    generator_owner: 'scripts/language-census.mjs',
    status: 'rebuilt by npm run census',
  },
  {
    name: 'precipitate',
    root: '.spw/caches/precipitate-',
    source: 'probe output across the .spw canon, lifted into a dated cache',
    spec_owner: '.spw/language/v04/pillars/precipitate-projections.spw',
    generator_owner: 'scripts/spw-precipitate.mjs',
    status: 'rebuilt by npm run spw:precipitate -- --write',
  },
  {
    name: 'wonder_runs',
    root: '.spw/gen/wonder-runs.spw',
    source: 'each runnable wonder probe, run read-only, with its exit and the last lines it printed',
    spec_owner: '.spw/reviews/upstream-workbench-recommendations/capabilities.spw',
    generator_owner: 'scripts/wonder.mjs',
    status: 'rebuilt by npm run wonder -- --run --write',
  },
]);

const FIELDS = ['root', 'source', 'spec_owner', 'generator_owner', 'status'];

export function projectionBlock(projection) {
  return [
    `^projection[${projection.name}]{`,
    ...FIELDS.map((field) => `  ${field}: "${projection[field]}"`),
    '}',
    '',
  ].join('\n');
}

const HEADER = [
  '# .spw/gen — generated projections, one ^projection block per generator.',
  '# The language server reads these blocks for its generated-from and projects lenses.',
  '# Written by scripts/lib/spw-projections.mjs; every generator it names rewrites it.',
  '',
  '#>gen_index',
  '#:index #!gen',
  '',
].join('\n');

/** The registry with every block current; a block the list does not name is kept as found. */
export function projectionIndexText(existing = '') {
  let text = existing.trim() ? existing.replace(/\s*$/, '\n') : `${HEADER}\n`;
  for (const projection of PROJECTIONS) {
    const block = projectionBlock(projection);
    const found = new RegExp(`^\\^projection\\[${projection.name}\\]\\{[\\s\\S]*?^\\}\\n?`, 'm');
    text = found.test(text) ? text.replace(found, block) : `${text.replace(/\s*$/, '\n\n')}${block}`;
  }
  return text;
}

export async function writeProjectionIndex() {
  const existing = await readFile(PROJECTION_INDEX, 'utf8').catch(() => '');
  const next = projectionIndexText(existing);
  if (next === existing) return false;
  await mkdir(path.dirname(PROJECTION_INDEX), { recursive: true });
  await writeFile(PROJECTION_INDEX, next, 'utf8');
  return true;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const wrote = await writeProjectionIndex();
  console.log(`[spw:projections] ${wrote ? 'wrote' : 'current:'} ${path.relative(ROOT, PROJECTION_INDEX)} (${PROJECTIONS.length} projections)`);
}
