import assert from 'node:assert/strict';
import test from 'node:test';
import { initChargeField, unmountChargeField } from '/public/js/runtime/charge-field.js';
import { PHASE_INTENSITY, decayCharge } from '/public/js/kernel/charge-field-contract.js';

test('every charge phase reaches quiet in a bounded number of steps', () => {
  for (const initial of [...Object.values(PHASE_INTENSITY), NaN, Infinity, -1, 10]) {
    let state = { intensity: initial };
    for (let step = 0; step < 6; step += 1) state = decayCharge(state.intensity);
    assert.deepEqual(state, { field: 'quiet', intensity: 0 });
  }
});

test('charge settles, repeated discharge owns its timer, and unmount cancels work', () => {
  const originalSet = window.setTimeout;
  const originalClear = window.clearTimeout;
  const originalStyle = document.documentElement.style;
  const timers = new Map();
  const styles = new Map();
  let nextId = 0;
  let now = 0;
  let writes = 0;
  window.setTimeout = (fn, ms) => {
    timers.set(++nextId, { fn, at: now + ms });
    return nextId;
  };
  window.clearTimeout = (id) => timers.delete(id);
  document.documentElement.style = {
    setProperty: (key, value) => { writes += 1; styles.set(key, value); },
    getPropertyValue: (key) => styles.get(key) || '',
    removeProperty: (key) => styles.delete(key),
  };
  const advance = (ms) => {
    const end = now + ms;
    while (true) {
      const next = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
      if (!next || next[1].at > end) break;
      now = next[1].at;
      timers.delete(next[0]);
      next[1].fn();
    }
    now = end;
  };
  const frame = Object.assign(new HTMLElement(), { dataset: {}, closest: () => frame });
  const emit = (name) => document.dispatchEvent(new CustomEvent(`spw:${name}`, {
    detail: { element: frame },
  }));
  try {
    initChargeField();
    emit('charge:charged');
    assert.equal(document.documentElement.dataset.spwChargeIntensity, '0.82');
    const firstWrites = writes;
    emit('charge:charged');
    assert.equal(writes, firstWrites, 'identical charge avoids root custom-property writes');
    advance(14000);
    assert.equal(document.documentElement.dataset.spwChargeField, 'quiet');
    assert.equal(document.documentElement.dataset.spwChargeIntensity, '0.00');
    assert.equal(frame.dataset.spwChargePhase, undefined);
    assert.equal(timers.size, 0, 'quiet field has no pending decay');

    emit('brace:discharged');
    advance(1000);
    emit('brace:discharged');
    advance(400);
    assert.equal(frame.dataset.spwDischargeKind, 'release', 'older timer cannot clear new discharge');
    advance(1000);
    assert.equal(frame.dataset.spwDischargeKind, undefined);
    assert.equal(frame.dataset.spwConsequenceLive, undefined);

    emit('charge:charged');
    emit('charge:settled');
    assert.equal(timers.size, 0, 'settle cancels decay immediately');
    emit('brace:discharged');
    unmountChargeField();
    assert.equal(timers.size, 0, 'unmount cancels decay and frame discharge');
    assert.equal(frame.dataset.spwChargePhase, undefined);
    assert.equal(styles.size, 0);
    advance(14000);
    assert.equal(document.documentElement.dataset.spwChargeField, undefined);
  } finally {
    unmountChargeField();
    window.setTimeout = originalSet;
    window.clearTimeout = originalClear;
    document.documentElement.style = originalStyle;
  }
});

test('the charged field paints with its carrier operator colour and lets go at quiet', () => {
  const originalSet = window.setTimeout;
  const originalClear = window.clearTimeout;
  const originalStyle = document.documentElement.style;
  const styles = new Map();
  window.setTimeout = () => 1;
  window.clearTimeout = () => {};
  document.documentElement.style = {
    setProperty: (key, value) => { styles.set(key, value); },
    getPropertyValue: (key) => styles.get(key) || '',
    removeProperty: (key) => styles.delete(key),
  };
  const frame = Object.assign(new HTMLElement(), { dataset: { spwOperator: 'probe' }, closest: () => frame });
  const emit = (name) => document.dispatchEvent(new CustomEvent(`spw:${name}`, {
    detail: { element: frame },
  }));
  try {
    initChargeField();
    assert.equal(styles.get('--spw-charge-field-color'), undefined, 'quiet field has no colour of its own');
    emit('charge:charged');
    assert.equal(
      styles.get('--spw-charge-field-color'),
      'var(--op-probe-color, var(--op-wonder-color, var(--active-op-color, #008080)))',
      'a probe carrier paints the field with the probe token, then the wonder alias',
    );
    emit('charge:settled');
    assert.equal(styles.get('--spw-charge-field-color'), undefined, 'settling releases the colour');
    unmountChargeField();
    assert.equal(styles.size, 0);
  } finally {
    unmountChargeField();
    window.setTimeout = originalSet;
    window.clearTimeout = originalClear;
    document.documentElement.style = originalStyle;
  }
});

test('an integrate alias paints, projects, and relates as integration', () => {
  const originalSet = window.setTimeout;
  const originalClear = window.clearTimeout;
  const originalStyle = document.documentElement.style;
  const styles = new Map();
  window.setTimeout = () => 1;
  window.clearTimeout = () => {};
  document.documentElement.style = {
    setProperty: (key, value) => { styles.set(key, value); },
    getPropertyValue: (key) => styles.get(key) || '',
    removeProperty: (key) => styles.delete(key),
  };
  const frame = Object.assign(new HTMLElement(), {
    dataset: { spwOperator: 'integrate' },
    closest: () => frame,
  });
  const emit = (name) => document.dispatchEvent(new CustomEvent(`spw:${name}`, {
    detail: { element: frame },
  }));
  try {
    initChargeField();
    emit('charge:charged');
    assert.equal(
      styles.get('--spw-charge-field-color'),
      'var(--op-integrate-color, var(--op-integration-color, var(--active-op-color, #008080)))',
      'an integrate carrier reaches the integration token',
    );
    assert.equal(
      document.documentElement.dataset.spwConceptRelation,
      'architecture',
      'integrate charges as architecture, not curiosity',
    );
    emit('brace:discharged');
    assert.equal(
      document.documentElement.dataset.spwLastDischarge,
      'project',
      'integrate discharges as project, not release',
    );
    unmountChargeField();
  } finally {
    unmountChargeField();
    window.setTimeout = originalSet;
    window.clearTimeout = originalClear;
    document.documentElement.style = originalStyle;
  }
});
