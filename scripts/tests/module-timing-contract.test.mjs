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
import {
  getRootPreference,
  getScrollBehavior,
  resolveAttentionDocument,
  resolveAttentionHost,
  resolveAttentionMain,
  restoreAttribute,
} from '../../public/js/runtime/attention/shared.js';
import { ENHANCEMENT_DEFS } from '../../public/js/runtime/module-catalog-enhancement.js';
import { FEATURE_DEFS } from '../../public/js/runtime/module-catalog-feature.js';
import { MOUNT_WHEN } from '../../public/js/runtime/module-catalog-constants.js';
import { resolveOwnerDocument } from '../../public/js/runtime/runtime-helpers.js';

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

  assert.equal(attention['attention-section-handle'].when, MOUNT_WHEN.IDLE);
  assert.equal(attention['attention-resonance-probe'].when, MOUNT_WHEN.VISIBLE);
  assert.equal(attention['attention-reading-groove'].when, MOUNT_WHEN.IDLE);
  assert.equal(attention['attention-pinch-scale'].when, MOUNT_WHEN.INTERACTION);
  assert.equal(attention['attention-scroll-cadence'].when, MOUNT_WHEN.IDLE);
  assert.equal(ENHANCEMENT_DEFS.some((definition) => definition.id === 'attention-architecture'), false);

  Object.values(attention).forEach((definition) => {
    assert.match(String(definition.load), /\.\/attention\//);
    assert.equal(typeof definition.mount, 'undefined', `${definition.id} should use portable mount`);
  });
});

test('attention host resolvers prefer the matched root over loader context', () => {
  const doc = { nodeType: 9, querySelector: (sel) => (sel === 'main' ? main : null) };
  const main = {
    nodeType: 1,
    matches: (sel) => sel === 'main',
    closest: () => null,
    querySelector: () => null,
    ownerDocument: doc,
  };
  const paragraph = {
    nodeType: 1,
    matches: () => false,
    closest: (sel) => (sel === 'main' ? main : null),
    querySelector: () => null,
    ownerDocument: doc,
  };
  const ctx = { root: doc };

  assert.equal(resolveAttentionHost(ctx, paragraph), paragraph);
  assert.equal(resolveAttentionDocument(ctx, paragraph), doc);
  assert.equal(resolveAttentionMain(ctx, paragraph), main);
  assert.equal(resolveAttentionMain(ctx, main), main);
  assert.equal(resolveAttentionHost(ctx, null), doc);
});

test('attention preferences and restore helpers stay document-scoped', () => {
  const html = {
    dataset: { spwReduceMotion: 'on', spwScrollCadence: 'off' },
  };
  const body = { dataset: {} };
  const doc = {
    documentElement: html,
    body,
    defaultView: { matchMedia: () => ({ matches: false }) },
  };
  assert.equal(getScrollBehavior(doc), 'auto');
  assert.equal(getRootPreference('spwScrollCadence', 'on', doc), 'off');

  const stored = {};
  const node = {
    nodeType: 1,
    getAttribute(name) { return Object.prototype.hasOwnProperty.call(stored, name) ? stored[name] : null; },
    setAttribute(name, value) { stored[name] = String(value); },
    removeAttribute(name) { delete stored[name]; },
    hasAttribute(name) { return Object.prototype.hasOwnProperty.call(stored, name); },
  };
  Object.setPrototypeOf(node, HTMLElement.prototype);
  restoreAttribute(node, 'data-spw-scroll-cadence', 'on');
  assert.equal(stored['data-spw-scroll-cadence'], 'on');
  restoreAttribute(node, 'data-spw-scroll-cadence', null);
  assert.equal(Object.prototype.hasOwnProperty.call(stored, 'data-spw-scroll-cadence'), false);
});

test('semantic image and concept modules mount through portable owner-document resolution', () => {
  const ownerDocument = { nodeType: 9, querySelectorAll() {} };
  const matched = { nodeType: 1, ownerDocument };
  const ctx = { document: 'lifecycle context' };

  assert.equal(resolveOwnerDocument(ctx, matched), ownerDocument);
  assert.equal(resolveOwnerDocument(ctx, ownerDocument), ownerDocument);

  for (const id of [
    'concept-salience',
    'image-utilization',
    'image-interaction',
    'effect-interpretation',
    'topic-discovery',
    'console',
    'spw-block-association',
    'brace-pivots',
    'region-menu',
  ]) {
    const definition = ENHANCEMENT_DEFS.find((entry) => entry.id === id)
      || FEATURE_DEFS.find((entry) => entry.id === id);
    assert.ok(definition, id);
    assert.equal(typeof definition.mount, 'undefined', `${id} should use portable mount`);
  }
});

test('runtime workshop modules mount through portable exports on the matched root', () => {
  for (const id of [
    'frame-navigator',
    'query-link-composer',
    'cauldron-fluency',
    'brace-actions',
    'reactive-spine',
    'toolmaker-submissions',
    'interactive-expression-lab',
    'spw-hero-kinetic-stage',
  ]) {
    const definition = ENHANCEMENT_DEFS.find((entry) => entry.id === id);
    assert.ok(definition, id);
    assert.equal(typeof definition.mount, 'undefined', `${id} should use portable mount`);
  }
});

test('feature catalog modules mount through portable exports', () => {
  for (const id of [
    'blog-interpreter',
    'payment-cards',
    'settings-page',
    'payment-settings',
    'cauldron',
    'pretext-lab',
    'pretext-physics',
  ]) {
    const definition = FEATURE_DEFS.find((entry) => entry.id === id);
    assert.ok(definition, id);
    assert.equal(typeof definition.mount, 'undefined', `${id} should use portable mount`);
    assert.equal(typeof definition.unmount, 'undefined', `${id} should not keep a catalog unmount adapter`);
  }

  assert.equal(FEATURE_DEFS.find((entry) => entry.id === 'payment-cards')?.rootMode, 'each');
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
