/**
 * Register the /public/* → repo-file resolve hook for Node.
 *
 *   node --import ./scripts/lib/register-public-imports.mjs -e \
 *     "import { MODULE_DEFS } from './public/js/runtime/module-catalog.js'; console.log(MODULE_DEFS.length)"
 */

import { register } from 'node:module';

register('./public-import-hooks.mjs', import.meta.url);
