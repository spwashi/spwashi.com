import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { SPACING_TUNER_PROFILE } from '../../public/js/kernel/site-settings-profiles.js';
import {
  queryParamsToSettingsPartial,
  resolvePackingFromDensity,
  settingsToQueryParams,
} from '../../public/js/kernel/settings-query-parity.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CORE_CSS = readFileSync(path.join(ROOT, 'public/css/tokens/core.css'), 'utf8');
const PACKING_CSS = readFileSync(path.join(ROOT, 'public/css/components/typography-packing.css'), 'utf8');

function blockAfter(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.ok(start >= 0, `missing ${startNeedle}`);
  const from = source.slice(start);
  const end = endNeedle ? from.indexOf(endNeedle, startNeedle.length) : from.length;
  assert.ok(end > 0, `missing terminator after ${startNeedle}`);
  return from.slice(0, end);
}

test('rhythm-unit is four quantum factors, not a density multiplier', () => {
  const rhythm = blockAfter(CORE_CSS, '--spw-rhythm-unit: calc(', ');');
  assert.match(rhythm, /--spw-spacing-scale/);
  assert.match(rhythm, /--spw-type-space-scale/);
  assert.match(rhythm, /--spw-device-space-scale/);
  assert.match(rhythm, /--spw-container-space-scale/);
  assert.doesNotMatch(rhythm, /density-space-scale/);
});

test('spacing tuner CSS scale matches SPACING_TUNER_PROFILE', () => {
  for (const [tuner, profile] of Object.entries(SPACING_TUNER_PROFILE)) {
    const selector = `html[data-spw-spacing-tuner="${tuner}"]`;
    assert.match(CORE_CSS, new RegExp(selector.replace(/[[\]]/g, '\\$&')));
    const scale = String(profile.scale);
    const nearby = blockAfter(CORE_CSS, selector, '\n}');
    assert.match(nearby, new RegExp(`--spw-spacing-scale:\\s*${scale}`));
  }
});

test('quantum factor selectors do not restate pad, gap, or flow', () => {
  const restated = /--spw-component-pad:|--spw-component-gap:|--spw-flow-space:/;
  const tuner = blockAfter(CORE_CSS, 'html[data-spw-spacing-tuner="compact"]', 'html[data-spw-font-size-scale="70"]');
  const type = blockAfter(CORE_CSS, 'html[data-spw-font-size-scale="70"]', 'html[data-spw-line-spacing="compact"]');
  const leading = blockAfter(CORE_CSS, 'html[data-spw-line-spacing="compact"]', '/* Color-scheme');
  assert.doesNotMatch(tuner, restated);
  assert.doesNotMatch(type, restated);
  assert.doesNotMatch(leading, restated);
  assert.doesNotMatch(CORE_CSS, /html\[data-spw-component-density="dense"\]\s*\{[^}]*--spw-component-pad:/s);
  assert.doesNotMatch(PACKING_CSS, /html\[data-spw-line-spacing="compact"\][\s\S]*?--component-pad:/);
});

test('packing rung comes from density, not the spacing tuner', () => {
  assert.equal(resolvePackingFromDensity('dense'), 'compact');
  assert.equal(resolvePackingFromDensity('soft'), 'balanced');
  assert.equal(resolvePackingFromDensity('roomy'), 'roomy');
  assert.equal(resolvePackingFromDensity('soft', 'compact'), 'balanced');
  assert.equal(resolvePackingFromDensity('dense', 'roomy'), 'compact');
});

test('pack query sets density without implying a spacing tuner', () => {
  const fromPack = queryParamsToSettingsPartial({ pack: 'compact' });
  assert.equal(fromPack.componentDensity, 'dense');
  assert.equal(fromPack.spacingTuner, undefined);

  const fromSpacing = queryParamsToSettingsPartial({ spacing: 'roomy' });
  assert.equal(fromSpacing.spacingTuner, 'roomy');
  assert.equal(fromSpacing.componentDensity, undefined);

  const composed = settingsToQueryParams({
    componentDensity: 'dense',
    spacingTuner: 'roomy',
  }, { omitDefaults: false });
  assert.equal(composed.pack, 'compact');
  assert.equal(composed.spacing, 'roomy');
});
