import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatSettingsSpwExpression,
  parseSettingsSpwExpression,
  describeMachineEmpathy,
  precipitateWonderReason,
} from '../../public/js/kernel/spw-config-expression.js';
import { DEFAULT_SITE_SETTINGS } from '../../public/js/kernel/site-settings-profiles.js';
import {
  parseSettingsFromSearch,
  validateSetting,
} from '../../public/js/kernel/site-settings-engine.js';
import { describeModuleExport } from '../../public/js/runtime/catalog/export-contract.js';
import { MODULE_DEFS } from '../../public/js/runtime/catalog/index.js';
import * as spatialGravityMod from '../../public/js/runtime/physics/spatial-gravity.js';

test('formatSettingsSpwExpression & parseSettingsSpwExpression round-trip combinatoric state', () => {
  const sample = {
    ...DEFAULT_SITE_SETTINGS,
    metacognitiveStance: 'composer',
    processAttention: 'trace',
    themePack: 'oxide-ledger',
    colorMode: 'dark',
    authorMode: 'revise',
    currentDevelopmentalClimate: 'weave',
    layoutTuner: 'wide',
    componentDensity: 'dense',
    wonderMemory: 'sitewide',
    fieldResonance: 'choral',
  };

  const full = formatSettingsSpwExpression(sample);
  assert.equal(full, '@composer(trace)[oxide-ledger.dark]{revise+weave|wide.dense}<sitewide.choral>');

  const parsed = parseSettingsSpwExpression(full, { validateSetting });
  assert.deepEqual(parsed.rejected, []);
  for (const key of [
    'metacognitiveStance',
    'processAttention',
    'themePack',
    'colorMode',
    'authorMode',
    'currentDevelopmentalClimate',
    'layoutTuner',
    'componentDensity',
    'wonderMemory',
    'fieldResonance',
  ]) {
    assert.equal(parsed.partial[key], sample[key], `mismatch for ${key}`);
  }

  const compact = formatSettingsSpwExpression(
    { ...DEFAULT_SITE_SETTINGS, metacognitiveStance: 'explorer', processAttention: 'scan' },
    { defaults: DEFAULT_SITE_SETTINGS, compact: true },
  );
  assert.equal(compact, '@explorer(scan)');
});

test('parseSettingsSpwExpression safely ignores invalid tokens while keeping valid ones', () => {
  const { partial, rejected } = parseSettingsSpwExpression(
    '@composer(scan)[madeup-theme.dark]{bogus+weave}',
    { validateSetting },
  );
  assert.equal(partial.metacognitiveStance, 'composer');
  assert.equal(partial.processAttention, 'scan');
  assert.equal(partial.colorMode, 'dark');
  assert.equal(partial.currentDevelopmentalClimate, 'weave');
  assert.ok(rejected.includes('madeup-theme'));
  assert.ok(rejected.includes('bogus'));
});

test('parseSettingsFromSearch hydrates ?spw= disposition expressions', () => {
  const parsed = parseSettingsFromSearch('?spw=%40integrator(compose)%5Bbanked-ember.dark%5D%7Bpolish%2Banchor%7D');
  assert.equal(parsed.metacognitiveStance, 'integrator');
  assert.equal(parsed.processAttention, 'compose');
  assert.equal(parsed.themePack, 'banked-ember');
  assert.equal(parsed.colorMode, 'dark');
  assert.equal(parsed.authorMode, 'polish');
  assert.equal(parsed.currentDevelopmentalClimate, 'anchor');
});

test('describeMachineEmpathy & precipitateWonderReason generate readable Spw exchange strings', () => {
  const empathy = describeMachineEmpathy({
    ...DEFAULT_SITE_SETTINGS,
    metacognitiveStance: 'witness',
    processAttention: 'breath',
    interactionTuner: 'calm',
  });
  assert.equal(empathy.title, '@witness(breath) · calm');
  assert.match(empathy.summary, /28% extra hover\/dwell grace/);

  const wonder = precipitateWonderReason(
    { ...DEFAULT_SITE_SETTINGS, metacognitiveStance: 'explorer', processAttention: 'trace', wonderMemory: 'sitewide' },
    { route: '/topics/software/', wonder: 'inquiry comparison' },
  );
  assert.equal(wonder, '?[inquiry+comparison]{/topics/software/|draft+orient}<@explorer(trace){sitewide}>');
});

function createMockDom() {
  class MockNode {}
  const toDatasetKey = (attr) => attr.slice(5).replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());

  class MockElement extends MockNode {
    constructor(tagName) {
      super();
      this.nodeType = 1;
      this.tagName = String(tagName || 'div').toUpperCase();
      this.isConnected = true;
      this.children = [];
      this.attributes = new Map();
      this.dataset = {};
      const styles = new Map();
      this.style = {
        setProperty(prop, val) { styles.set(prop, String(val)); },
        getPropertyValue(prop) { return styles.get(prop) || ''; },
        removeProperty(prop) { styles.delete(prop); },
      };
    }

    setAttribute(name, value = '') {
      const str = String(value);
      this.attributes.set(name, str);
      if (name.startsWith('data-')) this.dataset[toDatasetKey(name)] = str;
    }

    getAttribute(name) {
      return this.attributes.has(name) ? this.attributes.get(name) : null;
    }

    hasAttribute(name) {
      if (name.startsWith('data-')) {
        const key = toDatasetKey(name);
        if (Object.prototype.hasOwnProperty.call(this.dataset, key)) return true;
      }
      return this.attributes.has(name);
    }

    append(...nodes) {
      this.children.push(...nodes);
    }

    remove() {
      this.isConnected = false;
    }

    matches(selector) {
      if (selector === '[data-spw-gravity]') return this.hasAttribute('data-spw-gravity');
      return false;
    }

    closest() {
      return null;
    }

    querySelectorAll(selector) {
      if (selector === '[data-spw-gravity]') {
        return this.children.filter((child) => child.hasAttribute?.('data-spw-gravity'));
      }
      return [];
    }

    getBoundingClientRect() {
      return { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 };
    }
  }

  return { MockNode, MockElement };
}

test('spatial-gravity SPW_MODULE_EXPORT matches catalog and computes inter-component magnetic vectors', () => {
  const def = MODULE_DEFS.find((entry) => entry.id === 'spatial-gravity');
  assert.ok(def);
  const desc = describeModuleExport(spatialGravityMod, def);
  assert.equal(desc.mount, true);
  assert.equal(desc.orchestration.status, 'aligned');
  assert.deepEqual(desc.orchestration.drift, []);
  assert.equal(desc.hasContract, true);

  const { MockNode, MockElement } = createMockDom();
  const prevNode = globalThis.Node;
  const prevInnerWidth = globalThis.window.innerWidth;
  const prevInnerHeight = globalThis.window.innerHeight;
  globalThis.Node = MockNode;
  globalThis.window.innerWidth = 1280;
  globalThis.window.innerHeight = 800;

  try {
    const a = new MockElement('div');
    a.setAttribute('data-spw-gravity', '');
    a.setAttribute('data-spw-active', 'true');
    a.setAttribute('data-spw-operator', 'probe');
    a.getBoundingClientRect = () => ({ left: 400, top: 200, width: 120, height: 80, right: 520, bottom: 280 });

    const b = new MockElement('div');
    b.setAttribute('data-spw-gravity', '');
    b.setAttribute('data-spw-operator', 'probe');
    b.getBoundingClientRect = () => ({ left: 100, top: 200, width: 120, height: 80, right: 220, bottom: 280 });

    const host = new MockElement('section');
    host.append(a, b);

    const handle = spatialGravityMod.initSpwSpatialGravity({}, host);
    spatialGravityMod.measureSpatialGravity(a);
    spatialGravityMod.measureSpatialGravity(b);

    assert.equal(a.dataset.spwMagnetKin, 'attractor');
    assert.equal(b.dataset.spwMagnetKin, 'attracted');
    assert.ok(Number.parseFloat(b.style.getPropertyValue('--spw-magnet-x')) > 0.9);
    assert.ok(Number.parseFloat(b.style.getPropertyValue('--spw-magnet-pull')) > 0.3);

    handle.cleanup();
    assert.equal(b.dataset.spwMagnetKin, undefined);
    assert.equal(b.style.getPropertyValue('--spw-magnet-pull'), '');
    host.remove();
  } finally {
    if (prevNode === undefined) delete globalThis.Node;
    else globalThis.Node = prevNode;
    globalThis.window.innerWidth = prevInnerWidth;
    globalThis.window.innerHeight = prevInnerHeight;
  }
});
