import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
  describeModuleExport,
  normalizeModuleExportContract,
} from '../../public/js/runtime/catalog/export-contract.js';
import { MODULE_DEFS } from '../../public/js/runtime/catalog/index.js';
import { analyzePortableModules, extractModuleExportContract } from '../lib/portable-audit.mjs';

const ROOT = process.cwd();

const UPGRADED_MODULES = [
  ['spw-code', 'public/js/modules/tools/spw-code.js'],
  ['operator-symmetry', 'public/js/modules/tools/operator-symmetry.js'],
  ['care-handle', 'public/js/modules/services/care-handle.js'],
  ['texture-slice', 'public/js/media/texture-slice.js'],
  ['image-utilization', 'public/js/semantic/image-utilization.js'],
  ['pretext-physics', 'public/js/semantic/pretext-physics.js'],
  ['fit-report', 'public/js/runtime/diagnostics/fit-report.js'],
  ['module-effects', 'public/js/runtime/arrival/module-effects.js'],
];

test('normalizeModuleExportContract trims strings and filters wonder/css lists', () => {
  assert.equal(normalizeModuleExportContract(null), null);
  assert.equal(normalizeModuleExportContract({ story: '   ' }), null);

  const normalized = normalizeModuleExportContract({
    story: '  Wakes a surface.  ',
    wonder: ['comparison', '', ' constraint '],
    host: '  [data-demo] ',
    css: ['public/css/demo.css', ''],
    value: ' Zero dependencies. ',
  });

  assert.deepEqual(normalized, {
    story: 'Wakes a surface.',
    wonder: ['comparison', 'constraint'],
    host: '[data-demo]',
    css: ['public/css/demo.css'],
    value: 'Zero dependencies.',
  });
});

test('extractModuleExportContract reads static SPW_MODULE_EXPORT.contract without evaluation', () => {
  const sample = `
    export const SPW_MODULE_EXPORT = Object.freeze({
      id: 'demo',
      contract: Object.freeze({
        story: 'Reads host prose safely.',
        wonder: ['inquiry'],
        host: 'article',
        css: ['public/css/demo.css'],
        value: 'Standalone reader helper.',
      }),
    });
  `;
  assert.deepEqual(extractModuleExportContract(sample, 'demo.js'), {
    story: 'Reads host prose safely.',
    wonder: ['inquiry'],
    host: 'article',
    css: ['public/css/demo.css'],
    value: 'Standalone reader helper.',
  });
  assert.equal(extractModuleExportContract('export function initDemo() {}', 'plain.js'), null);
});

test('upgraded runtime modules have zero catalog drift and complete per-file contracts', async () => {
  for (const [id, relPath] of UPGRADED_MODULES) {
    const def = MODULE_DEFS.find((entry) => entry.id === id);
    assert.ok(def, `Missing MODULE_DEFS entry for ${id}`);

    const mod = await import(`/${relPath.replace(/^public\/js\//, 'public/js/')}`);
    const desc = describeModuleExport(mod, def);
    assert.equal(desc.mount, true, `${id}: expected mountable SPW_MODULE_EXPORT`);
    assert.equal(desc.orchestration.status, 'aligned', `${id}: expected catalog alignment`);
    assert.deepEqual(desc.orchestration.drift, [], `${id}: expected zero catalog drift`);
    assert.equal(desc.hasContract, true, `${id}: expected rich per-file contract`);
    assert.ok(desc.contract?.story, `${id}: contract.story required`);
    assert.ok(desc.contract?.host, `${id}: contract.host required`);
    assert.ok(desc.contract?.value, `${id}: contract.value required`);
    assert.ok(desc.contract?.wonder?.length, `${id}: contract.wonder required`);

    const astContract = extractModuleExportContract(readFileSync(path.join(ROOT, relPath), 'utf8'), relPath);
    assert.deepEqual(astContract, mod.SPW_MODULE_EXPORT.contract, `${id}: AST extraction must match runtime contract`);
  }
});

test('standalone inoculant modules remain free of site-only portability blockers', async () => {
  const inoculants = new Set([
    'operator-symmetry',
    'care-handle',
    'texture-slice',
    'fit-report',
    'spw-code',
    'image-utilization',
    'pretext-physics',
  ]);
  const report = await analyzePortableModules({
    root: ROOT,
    defs: MODULE_DEFS.filter((def) => inoculants.has(def.id)),
  });
  for (const item of report) {
    assert.deepEqual(item.blockers, [], `${item.id}: unexpected portability blockers`);
    assert.ok(item.contract?.story, `${item.id}: missing story in portable report`);
  }
});
