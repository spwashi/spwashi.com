/**
 * Single source of truth for the module test suite.
 * `check:local` and `test:modules:run` must both consume this list.
 */
export const MODULE_TEST_IMPORTS = Object.freeze([
  './scripts/tests/setup-dom-globals.mjs',
  './scripts/tests/register-public-imports.mjs',
]);

export const MODULE_TEST_FILES = Object.freeze([
  'scripts/tests/engagement-features.test.mjs',
  'scripts/tests/component-fixtures.test.mjs',
  'scripts/tests/visual-capture-plan.test.mjs',
  'scripts/tests/module-selector-audit.test.mjs',
  'scripts/tests/css-bundle-filter.test.mjs',
  'scripts/tests/infrastructure-contracts.test.mjs',
  'scripts/tests/chrome-headless-harness.test.mjs',
  'scripts/tests/page-copy-audit.test.mjs',
  'scripts/tests/region-kin.test.mjs',
  'scripts/tests/spw-expression-geometry.test.mjs',
  'scripts/tests/spw-literal-parser-tool.test.mjs',
  'scripts/tests/module-timing-contract.test.mjs',
  'scripts/tests/module-describes-contract.test.mjs',
  'scripts/tests/lens-modes.test.mjs',
  'scripts/tests/production-season-runtime.test.mjs',
  'scripts/tests/template-migration.test.mjs',
  'scripts/tests/template-personality.test.mjs',
  'scripts/tests/spw-key-wrap-physics.test.mjs',
  'scripts/tests/expression-query.test.mjs',
  'scripts/tests/physical-model.test.mjs',
  'scripts/tests/cauldron-clusters.test.mjs',
  'scripts/tests/cauldron-editorial.test.mjs',
  'scripts/tests/interaction-story.test.mjs',
  'scripts/tests/section-handle-swipe.test.mjs',
]);
