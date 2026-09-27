import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { classifyImageSource } from '../../public/js/runtime/image-provenance.js';
import {
  PROVENANCE_MODULE,
  collectProvenanceRecords,
  readProvenance,
  renderProvenanceModule,
} from '../lib/image-provenance-records.mjs';

test('path rules mark renders generated and folio scans original', () => {
  assert.equal(classifyImageSource('/public/images/renders/papergami/papergami-kinetic.webp')?.kind, 'generated');
  assert.equal(classifyImageSource('/public/images/assets/folios/folio-bone-box-launch-display.webp')?.kind, 'original');
});

test('a sidecar record marks a picture kept outside the path-ruled folders', () => {
  assert.equal(classifyImageSource('/public/images/assets/illustrations/garden-bed-atlas-display.webp')?.kind, 'generated');
  assert.equal(classifyImageSource('/public/images/assets/motifs/ornament-scaffold-lattice-display.webp')?.kind, 'generated');
  assert.equal(classifyImageSource('/public/images/assets/motifs/texture-cream-ochre-wash-display.webp')?.kind, 'generated');
  assert.equal(classifyImageSource('https://spwashi.com/public/images/assets/rpg-wednesday/rpg-scene-library-provisional-drawer-display.webp?v=2')?.kind, 'generated');
});

test('a picture with no record stays unmarked', () => {
  assert.equal(classifyImageSource('/public/images/assets/illustrations/pretext-physics.png'), null);
  assert.equal(classifyImageSource('/public/images/assets/motifs/spwashi-alchemy-token-display.png'), null);
  assert.equal(classifyImageSource('/public/images/assets/home/boon.png'), null);
});

test('sidecar reading names the tool only when the record does', () => {
  assert.deepEqual(readProvenance('^"provenance"{\n  generator: "Grok Imagine"\n}'), { kind: 'generated', tool: 'Grok Imagine' });
  assert.deepEqual(readProvenance('    model: "xAI Imagine"'), { kind: 'generated', tool: 'xAI Imagine' });
  assert.deepEqual(readProvenance('  source_render: ~"../../renders/2026-08-13-charge-wall-study/charge-wall-1.avif"'), { kind: 'generated', tool: null });
  assert.equal(readProvenance('^"usage"{\n  surface: "home"\n}'), null);
});

test('the generated index matches the sidecars', () => {
  const expected = renderProvenanceModule(collectProvenanceRecords());
  assert.equal(readFileSync(PROVENANCE_MODULE, 'utf8'), expected, 'run npm run images:provenance');
});
