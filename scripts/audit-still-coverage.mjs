#!/usr/bin/env node
/**
 * Cheap still/module probe. No Chrome.
 * Named stills must cover visitor overlays, behavior modules, and
 * environmental express modules.
 */

import { fileURLToPath } from 'node:url';

import { COMPONENT_FIXTURES } from '../public/js/kernel/component-fixtures.js';
import { REGION_ECOLOGY_FIXTURES } from '../public/js/kernel/region-ecology-fixtures.js';
import { MODULE_DEFS } from '../public/js/runtime/catalog/index.js';
import {
  accountStillCoverage,
  formatStillCoverage,
} from './lib/still-module-coverage.mjs';
import { VIEWPORT_STILL_CHECKS, VIEWPORT_STILL_RECIPES } from './lib/viewport-still-recipes.mjs';

export function collectStillCoverageReport() {
  return accountStillCoverage({
    modules: MODULE_DEFS,
    recipes: VIEWPORT_STILL_RECIPES,
    checks: VIEWPORT_STILL_CHECKS,
    ecologyFixtures: REGION_ECOLOGY_FIXTURES,
    componentFixtures: COMPONENT_FIXTURES,
  });
}

export function main() {
  const report = collectStillCoverageReport();
  process.stdout.write(`${formatStillCoverage(report)}\n`);
  const misses = [
    ...report.visitorMiss.map((id) => `visitor ${id}`),
    ...report.behaviorMiss.map((id) => `behavior ${id}`),
    ...report.environmentMiss.map((id) => `environment ${id}`),
    ...report.danglingFixtureIds.map((miss) => `${miss.id} fixture ${miss.fixtureId}`),
  ];
  if (misses.length) {
    misses.forEach((line) => console.error(`[audit:stills] miss ${line}`));
    process.exitCode = 1;
    return;
  }
  console.log(`[audit:stills] ${VIEWPORT_STILL_RECIPES.length} recipes + ${VIEWPORT_STILL_CHECKS.length} checks covered visitor/behavior/environment`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
