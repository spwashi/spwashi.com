/**
 * Rewrite relative kernel imports in public/js/typed to browser-absolute
 * `/public/js/kernel/` specifiers. Prefer writing that specifier in public/ts
 * (tsconfig.runtime.json paths); this pass is the safety net for leftovers.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TYPED_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public/js/typed');
const KERNEL_IMPORT_RE = /(['"])\.\.\/(?:js\/)?kernel\//g;
const KERNEL_REPLACEMENT = '$1/public/js/kernel/';

function isEnoent(error) {
  return Boolean(error) && typeof error === 'object' && error.code === 'ENOENT';
}

async function main() {
  let entries;
  try {
    entries = await fs.readdir(TYPED_DIR, { recursive: true, withFileTypes: true });
  } catch (error) {
    if (isEnoent(error)) return;
    throw error;
  }

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.js')) continue;
    const filePath = path.join(entry.parentPath || TYPED_DIR, entry.name);
    const source = await fs.readFile(filePath, 'utf8');
    const output = source.replace(KERNEL_IMPORT_RE, KERNEL_REPLACEMENT);
    if (output !== source) {
      await fs.writeFile(filePath, output, 'utf8');
    }
  }
}

await main();
