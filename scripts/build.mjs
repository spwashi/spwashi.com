export * from './typed/build/index.mjs';

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const { main } = await import('./typed/build/index.mjs');
  await main();
}
