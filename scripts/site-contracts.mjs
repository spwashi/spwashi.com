import path from 'node:path';
import { fileURLToPath } from 'node:url';

export * from './typed/site-contracts/index.mjs';

const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const { main } = await import('./typed/site-contracts/index.mjs');
  await main();
}
