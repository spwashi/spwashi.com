import assert from 'node:assert/strict';
import test from 'node:test';

import { readCadenceAnnotation } from '../../public/js/runtime/attention/shared.js';

// storage.js opens a real browser BroadcastChannel when one exists. The test
// only needs the pure payload reader, so suppress that side effect during the
// dynamic import and restore the test environment immediately afterwards.
const NativeBroadcastChannel = globalThis.BroadcastChannel;
globalThis.BroadcastChannel = undefined;
const { readSigilPayload } = await import('../../public/js/interface/cauldron/storage.js');
globalThis.BroadcastChannel = NativeBroadcastChannel;

test('attention reads authored cadence without deriving a schedule', () => {
  const values = new Map([
    ['data-spw-cadence', 'cycle'],
    ['data-spw-cadence-motion', 'ink.write.release.coda'],
  ]);
  const section = { getAttribute: (name) => values.get(name) || '' };

  assert.deepEqual(readCadenceAnnotation(section), {
    cadence: 'cycle',
    motion: 'ink.write.release.coda',
  });
  assert.deepEqual(readCadenceAnnotation(null), { cadence: '', motion: '' });
});

test('cauldron payload keeps nearest authored cadence and motion', () => {
  const host = {
    dataset: {
      spwRole: 'recipe',
      spwRegion: 'garden',
      spwLiminality: 'threshold',
      spwCadence: 'cycle',
      spwCadenceMotion: 'mise.gather.cast',
    },
  };
  const ingredient = {
    textContent: '^winter-squash',
    closest: () => host,
  };

  const payload = readSigilPayload(ingredient);
  assert.equal(payload.cadence, 'cycle');
  assert.equal(payload.cadenceMotion, 'mise.gather.cast');
  assert.equal(payload.role, 'recipe');
  assert.equal(payload.region, 'garden');
});
