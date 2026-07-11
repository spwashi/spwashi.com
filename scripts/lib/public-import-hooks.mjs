/**
 * Node ESM resolve hook: map browser absolute imports `/public/...`
 * onto the repository filesystem so catalog/runtime modules can be
 * imported under Node for inventory and diagnostics.
 *
 * Register via:
 *   node --import ./scripts/lib/register-public-imports.mjs …
 */

import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from './spw-inventory-core.mjs';

/**
 * @param {string} specifier
 * @param {{ parentURL?: string }} context
 * @param {(specifier: string, context: object) => Promise<object>} nextResolve
 */
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('/public/')) {
    const filePath = path.join(ROOT, specifier.slice(1));
    return {
      shortCircuit: true,
      url: pathToFileURL(filePath).href,
    };
  }
  return nextResolve(specifier, context);
}
