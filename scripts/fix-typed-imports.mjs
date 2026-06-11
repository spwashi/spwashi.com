import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TYPED_DIR = path.resolve(__dirname, '..', 'public/js/typed');
const KERNEL_IMPORT_RE = /(['"])\.\.\/(?:js\/)?kernel\//g;
const KERNEL_REPLACEMENT = "$1/public/js/kernel/";

async function main() {
  let entries;
  try {
    entries = await fs.readdir(TYPED_DIR);
  } catch (error) {
    if (error?.code === 'ENOENT') return;
    throw error;
  }

  for (const entry of entries) {
    if (!entry.endsWith('.js')) continue;
    const filePath = path.join(TYPED_DIR, entry);
    const source = await fs.readFile(filePath, 'utf8');
    const output = source.replace(KERNEL_IMPORT_RE, KERNEL_REPLACEMENT);
    if (output !== source) {
      await fs.writeFile(filePath, output, 'utf8');
    }
  }
}

await main();