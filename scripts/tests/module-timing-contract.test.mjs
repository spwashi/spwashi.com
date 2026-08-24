import assert from 'node:assert/strict';
import test from 'node:test';

import {
  collectSpwPerformanceTimings,
  isKnownTimingArc,
  isStandardIdleChunk,
  summarizeCatalogTiming,
  summarizeSpwPerformanceEntries,
  timingArcStem,
  TIMING_ARC_STEMS,
  STANDARD_IDLE_CHUNKS,
} from '../../public/js/kernel/module-timing-contract.js';
import { supportsPinchTextScaleInput } from '../../public/js/runtime/attention/pinch-scale.js';
import { ENHANCEMENT_DEFS } from '../../public/js/runtime/module-catalog-enhancement.js';
import { MOUNT_WHEN } from '../../public/js/runtime/module-catalog-constants.js';

test('timingArc stems and idle chunks are stable contracts', () => {
  assert.ok(TIMING_ARC_STEMS.includes('immediate'));
  assert.ok(TIMING_ARC_STEMS.includes('region'));
  assert.ok(STANDARD_IDLE_CHUNKS.includes('idle-residue'));
  assert.equal(isKnownTimingArc('immediate-attention'), true);
  assert.equal(isKnownTimingArc('after-all-settled'), false);
  assert.equal(timingArcStem('settled-layout-assumptions'), 'settled');
  assert.equal(timingArcStem(null), 'missing');
  assert.equal(isStandardIdleChunk('idle-lab'), true);
  assert.equal(isStandardIdleChunk('idle-weird'), false);
});

test('summarizeSpwPerformanceEntries picks layer + idle chunk measures', () => {
  const summary = summarizeSpwPerformanceEntries(
    [{ name: 'spw:boot-start', startTime: 0 }, { name: 'spw:site-ready', startTime: 100 }],
    [
      { name: 'spw:boot-to-ready', duration: 100 },
      { name: 'spw:immediate-layer:core:parallel', duration: 40 },
      { name: 'spw:idle-chunk:idle-residue', duration: 12 },
      { name: 'spw:module:site-settings', duration: 8 },
      { name: 'spw:module:site-settings:load', duration: 5 },
    ],
  );
  assert.equal(summary.bootToReady, 100);
  assert.equal(summary.immediateCore, 40);
  assert.equal(summary.idleChunkTotal, 12);
  assert.equal(summary.idleChunks[0].chunk, 'idle-residue');
  assert.equal(summary.moduleMeasures['site-settings'], 8);
  assert.ok(summary.layerMeasures['spw:boot-to-ready']);
});

test('collectSpwPerformanceTimings filters non-spw entries', () => {
  const fake = {
    getEntriesByType(type) {
      if (type === 'mark') return [{ name: 'other', startTime: 1 }, { name: 'spw:boot-start', startTime: 2 }];
      if (type === 'measure') return [{ name: 'spw:full-boot', duration: 9, startTime: 0 }];
      return [];
    },
  };
  const timings = collectSpwPerformanceTimings(fake);
  assert.equal(timings.marks.length, 1);
  assert.equal(timings.summary.fullBoot, 9);
});

test('summarizeCatalogTiming rolls when/arc/chunk hygiene', () => {
  const rollup = summarizeCatalogTiming([
    { id: 'a', when: 'immediate', timingArc: 'immediate-attention' },
    { id: 'b', when: 'idle', timingArc: 'idle-settings-momentum', timingChunk: 'idle-chrome' },
    { id: 'c', when: 'idle', timingArc: 'enhance-ledger' },
    { id: 'd', when: 'visible', timingArc: 'weird-arc' },
    { id: 'e', when: 'idle', timingChunk: 'idle-weird', timingArc: 'idle-lab-posture' },
  ]);
  assert.equal(rollup.byTimingStem.immediate, 1);
  assert.equal(rollup.byTimingStem.idle, 2);
  assert.equal(rollup.byTimingStem.other, 1);
  assert.equal(rollup.idleWithChunk, 2);
  assert.equal(rollup.idleWithoutChunk, 1);
  assert.ok(rollup.nonstandardIdleChunk.includes('e'));
});

test('attention children own independent progressive schedules', () => {
  const attention = Object.fromEntries(
    ENHANCEMENT_DEFS
      .filter((definition) => definition.id.startsWith('attention-'))
      .map((definition) => [definition.id, definition]),
  );

  assert.equal(attention['attention-section-handle'].when, MOUNT_WHEN.VISIBLE);
  assert.equal(attention['attention-resonance-probe'].when, MOUNT_WHEN.VISIBLE);
  assert.equal(attention['attention-reading-groove'].when, MOUNT_WHEN.IDLE);
  assert.equal(attention['attention-pinch-scale'].when, MOUNT_WHEN.INTERACTION);
  assert.equal(attention['attention-scroll-cadence'].when, MOUNT_WHEN.IDLE);
  assert.equal(ENHANCEMENT_DEFS.some((definition) => definition.id === 'attention-architecture'), false);

  Object.values(attention).forEach((definition) => {
    assert.match(String(definition.load), /\.\/attention\//);
  });
});

test('concept salience receives a document root instead of lifecycle context', () => {
  const definition = ENHANCEMENT_DEFS.find(({ id }) => id === 'concept-salience');
  const ownerDocument = { querySelectorAll() {} };
  let mountedRoot = null;
  let unmounted = false;
  const module = {
    initConceptSalience(root) {
      mountedRoot = root;
    },
    unmountConceptSalience() {
      unmounted = true;
    },
  };

  definition.mount(module, { document: 'lifecycle context' }, { ownerDocument });
  definition.unmount(module);

  assert.equal(mountedRoot, ownerDocument);
  assert.equal(unmounted, true);
});

test('visible image enhancers receive the matched document root', () => {
  const ownerDocument = { querySelectorAll() {} };
  const cases = [
    ['image-utilization', 'initImageUtilization', 'unmountImageUtilization'],
    ['image-interaction', 'initImageInteraction'],
    ['effect-interpretation', 'initEffectInterpretation'],
  ];

  cases.forEach(([id, initName, unmountName]) => {
    const definition = ENHANCEMENT_DEFS.find(({ id: definitionId }) => definitionId === id);
    let mountedRoot = null;
    let unmounted = false;
    const module = {
      [initName](root) {
        mountedRoot = root;
        return () => {};
      },
    };
    if (unmountName) {
      module[unmountName] = () => {
        unmounted = true;
      };
    }

    definition.mount(module, { document: 'lifecycle context' }, { ownerDocument });
    definition.unmount?.(module);

    assert.equal(mountedRoot, ownerDocument, id);
    if (unmountName) assert.equal(unmounted, true, id);
  });
});

test('pinch scaling does not retain listeners on pointer-only devices', () => {
  assert.equal(supportsPinchTextScaleInput({
    navigator: { maxTouchPoints: 0 },
    matchMedia: () => ({ matches: false }),
  }), false);
  assert.equal(supportsPinchTextScaleInput({
    navigator: { maxTouchPoints: 2 },
    matchMedia: () => ({ matches: false }),
  }), true);
  assert.equal(supportsPinchTextScaleInput({
    navigator: { maxTouchPoints: 0 },
    matchMedia: () => ({ matches: true }),
  }), true);
});
