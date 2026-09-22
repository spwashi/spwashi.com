/**
 * CLI and stable import for the compiled manifest stamp.
 * Implementation: scripts/ts/manifest-stamp.mts
 */
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

export {
  MANIFEST_CACHE_WINDOW_MS,
  MANIFEST_STAMP_PATH,
  ROUTE_MANIFEST_CACHE,
  SEARCH_INDEX_PATH,
  SEARCH_INDEX_RELATIVE,
  checkStagedManifestStamp,
  computeManifestSourceStamp,
  evaluateManifestFreshness,
  inspectManifestStamp,
  listManifestStampInputs,
  sourceStampFromIndexText,
  stampFromEntries,
  writeManifestCacheStamp,
} from '../typed/manifest-stamp.mjs';

import { checkStagedManifestStamp, inspectManifestStamp } from '../typed/manifest-stamp.mjs';

async function main() {
  const staged = process.argv.includes('--staged');
  if (staged) {
    const result = await checkStagedManifestStamp();
    if (!result.ok) {
      console.error(`[manifest-stamp] ${result.reason}`);
      process.exit(1);
    }
    console.log(`[manifest-stamp] ${result.reason}`);
    return;
  }

  const report = await inspectManifestStamp();
  const age = report.ageMs == null ? 'none' : `${Math.round(report.ageMs / 60000)}m`;
  console.log(`[manifest-stamp] index=${report.indexStatus} cache=${report.withinWindow ? 'reused' : 'rebuild'} age=${age} stamp=${report.liveStamp.slice(0, 12)}`);
  if (report.indexStatus !== 'fresh') process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error('[manifest-stamp]', error);
    process.exit(1);
  });
}
