import process from 'node:process';

import {
  ROUTE_MANIFEST_OUTPUT,
  collectManifestIssues,
  writeRouteRuntimeManifest,
} from './site-contracts.mjs';

const strictMode = process.argv.includes('--check');

const manifest = await writeRouteRuntimeManifest();
const { errors, warnings } = collectManifestIssues(manifest);

console.log(`[manifest] wrote ${ROUTE_MANIFEST_OUTPUT}`);
console.log(`[manifest] routes=${manifest.routeCount} surfaces=${Object.keys(manifest.surfaces).length} svgAssets=${manifest.maps.svgAssets.length}`);
console.log(`[manifest] svgRoutes=${manifest.maps.svgRoutes.length} specRoutes=${manifest.maps.specRoutes.length}`);

if (warnings.length) {
  console.log(`[manifest] warnings=${warnings.length}`);
  for (const warning of warnings.slice(0, 12)) {
    console.log(`  warn: ${warning}`);
  }
  if (warnings.length > 12) {
    console.log(`  ... ${warnings.length - 12} more warnings`);
  }
}

if (errors.length) {
  console.log(`[manifest] errors=${errors.length}`);
  for (const error of errors.slice(0, 12)) {
    console.log(`  error: ${error}`);
  }
  if (errors.length > 12) {
    console.log(`  ... ${errors.length - 12} more errors`);
  }
}

if (strictMode && errors.length) {
  process.exit(1);
}
