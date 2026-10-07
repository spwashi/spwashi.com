import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MODULE_EFFECTS_CONTRACT,
  SPW_MODULE_EXPORT,
} from '../../public/js/runtime/arrival/module-effects.js';

// Dataset and inline style that count each write, like a browser's mutation records.
class CountingElement extends globalThis.HTMLElement {
  constructor() {
    super();
    this.writes = 0;
    const props = new Map();
    this.dataset = new Proxy({}, {
      set: (target, key, value) => { this.writes += 1; target[key] = String(value); return true; },
      deleteProperty: (target, key) => { if (key in target) this.writes += 1; delete target[key]; return true; },
    });
    this.style = {
      getPropertyValue: (name) => props.get(name) ?? '',
      setProperty: (name, value) => { this.writes += 1; props.set(name, String(value)); },
      removeProperty: (name) => { if (props.has(name)) this.writes += 1; props.delete(name); },
    };
  }
}

function createBus() {
  const handlers = new Set();
  return {
    on(name, fn) {
      assert.equal(name, 'spw:module-mounted');
      handlers.add(fn);
      return () => handlers.delete(fn);
    },
    mounted(detail) { handlers.forEach((fn) => fn(detail)); },
    get listeners() { return handlers.size; },
  };
}

function setup(spool = new CountingElement()) {
  const html = new CountingElement();
  const doc = { nodeType: 9, documentElement: html, querySelector: () => spool };
  const bus = createBus();
  const ctx = {
    bus,
    registry: { values: () => [
      { status: 'mounted', effectScope: ['listeners', 'root-state'] },
      { status: 'failed', effectScope: ['network'] },
    ] },
  };
  return { html, spool, doc, bus, ctx };
}

test('module-effects mounts through the loader signature and hears the bus', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { html, spool, doc, bus, ctx } = setup();
  const cleanup = SPW_MODULE_EXPORT.mount(ctx, doc);
  try {
    assert.equal(bus.listeners, 1, 'the context arrives as the context, so the bus is heard');
    assert.equal(html.dataset.spwModuleEffectsActive, 'listeners root-state', 'modules mounted earlier seed the ledger');

    const before = spool.writes;
    bus.mounted({ effectScope: ['bus'] });
    bus.mounted({ effectScope: ['bus'] });
    bus.mounted({ effectScope: ['local-dom'] });
    assert.equal(spool.writes, before, 'nothing is drawn until the frame');
    t.mock.timers.tick(16);
    assert.equal(spool.dataset.spwModuleEffectPulse, 'waking');
    assert.equal(spool.style.getPropertyValue('--spw-module-effect-stitches'), '3');
    assert.equal(spool.style.getPropertyValue('--spw-module-effect-turn'), `${3 * MODULE_EFFECTS_CONTRACT.notchDeg}deg`);
    assert.equal(spool.writes - before, 3, 'a burst in one frame is one stitch count, one turn and one state');
    assert.equal(html.dataset.spwModuleEffectsActive, 'bus listeners local-dom root-state');

    t.mock.timers.tick(MODULE_EFFECTS_CONTRACT.quietMs);
    assert.equal(spool.dataset.spwModuleEffectPulse, 'settled');
    assert.equal(spool.style.getPropertyValue('--spw-module-effect-turn'), '360deg', 'the mark finishes its turn upright');

    bus.mounted({ effectScope: ['bus'] });
    t.mock.timers.tick(16);
    assert.equal(spool.style.getPropertyValue('--spw-module-effect-stitches'), '1', 'a new wake pays out a fresh thread');
    assert.equal(spool.style.getPropertyValue('--spw-module-effect-turn'), '375deg', 'the mark keeps turning forward');
  } finally {
    cleanup();
  }
  assert.equal(bus.listeners, 0);
  assert.equal(html.dataset.spwModuleEffectsActive, undefined);
  assert.equal(spool.dataset.spwModuleEffectPulse, undefined);
  assert.equal(spool.style.getPropertyValue('--spw-module-effect-stitches'), '');
  assert.equal(spool.style.getPropertyValue('--spw-module-effect-turn'), '720deg', 'unmount leaves a whole turn, not a backwards spin');
});

test('without a shell mark, module-effects keeps the ledger and draws nothing', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { html, doc, bus, ctx } = setup(null);
  doc.querySelector = () => null;
  const cleanup = SPW_MODULE_EXPORT.mount(ctx, doc);
  try {
    bus.mounted({ effectScope: ['storage'] });
    t.mock.timers.tick(MODULE_EFFECTS_CONTRACT.quietMs + 16);
    assert.equal(html.dataset.spwModuleEffectsActive, 'listeners root-state storage');
  } finally {
    cleanup();
  }
});
