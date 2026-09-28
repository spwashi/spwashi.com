import assert from 'node:assert/strict';
import test from 'node:test';
import { armEngagement } from '../../public/js/kernel/engagement.js';

// A fake page: elements know their host by selector, the root dispatches to its listeners.
function page() {
  const listeners = new Map();
  const root = {
    addEventListener(type, fn) { listeners.set(type, [...(listeners.get(type) || []), fn]); },
    removeEventListener(type, fn) { listeners.set(type, (listeners.get(type) || []).filter((f) => f !== fn)); },
    fire(type, props = {}) { for (const fn of listeners.get(type) || []) fn({ type, ...props }); },
    count() { return [...listeners.values()].reduce((n, list) => n + list.length, 0); },
  };
  const el = (name, hosts = {}) => ({
    name,
    closest: (selector) => hosts[selector] || null,
    contains(other) { return other === this || other?.parent === this; },
  });
  const timers = new Map();
  let nextTimer = 1;
  const clock = {
    setTimer: (fn) => { const id = nextTimer++; timers.set(id, fn); return id; },
    clearTimer: (id) => timers.delete(id),
    runAll: () => { for (const [id, fn] of [...timers]) { timers.delete(id); fn(); } },
    pending: () => timers.size,
  };
  return { root, el, clock };
}

test('focus and key engage at once and hand the engagement over', () => {
  const { root, el, clock } = page();
  const field = el('field');
  field.closest = (s) => (s === 'textarea' ? field : null);
  const seen = [];
  armEngagement({ root, ...clock, entries: [{ key: 'fields', selector: 'textarea', kinds: ['focus'] }], onEngage: (entry, detail) => seen.push([entry.key, detail.kind, detail.host.name]) });
  root.fire('focusin', { target: field });
  assert.deepEqual(seen, [['fields', 'focus', 'field']]);
});

test('each host engages once, and a done entry takes its listeners with it', () => {
  const { root, el, clock } = page();
  const host = el('chip');
  host.closest = () => host;
  let calls = 0;
  const armed = armEngagement({ root, ...clock, entries: [{ key: 'menu', selector: '.chip', kinds: ['focus', 'menu'] }], onEngage: () => { calls += 1; return 'done'; } });
  root.fire('focusin', { target: host });
  root.fire('contextmenu', { target: host });
  assert.equal(calls, 1);
  assert.equal(armed.armed, false);
  assert.equal(root.count(), 0);
});

test('a mouse press engages at once; a touch engages on lift, not on landing', () => {
  const { root, el, clock } = page();
  const host = el('chip');
  host.closest = () => host;
  const seen = [];
  armEngagement({ root, ...clock, entries: [{ key: 'x', selector: '.chip', kinds: ['press'] }], onEngage: (_, d) => { seen.push(d.resolution); } });
  root.fire('pointerdown', { target: host, pointerType: 'touch', pointerId: 1, clientX: 0, clientY: 0 });
  assert.deepEqual(seen, []);
  root.fire('pointerup', { target: host, pointerType: 'touch', pointerId: 1 });
  assert.deepEqual(seen, ['tap']);
});

test('a touch the browser takes for a scroll, or one that slides, is not an engagement', () => {
  const { root, el, clock } = page();
  const host = el('chip');
  host.closest = () => host;
  const seen = [];
  armEngagement({ root, ...clock, entries: [{ key: 'x', selector: '.chip', kinds: ['press'] }], onEngage: (_, d) => { seen.push(d.resolution); } });
  root.fire('pointerdown', { target: host, pointerType: 'touch', pointerId: 1, clientX: 0, clientY: 0 });
  root.fire('pointercancel', { pointerId: 1 });
  root.fire('pointerdown', { target: host, pointerType: 'touch', pointerId: 2, clientX: 0, clientY: 0 });
  root.fire('pointermove', { pointerId: 2, clientX: 0, clientY: 40 });
  root.fire('pointerup', { target: host, pointerType: 'touch', pointerId: 2 });
  clock.runAll();
  assert.deepEqual(seen, []);
});

test('a held touch engages at the hold, with the landing event in hand', () => {
  const { root, el, clock } = page();
  const host = el('region');
  host.closest = () => host;
  const seen = [];
  armEngagement({ root, ...clock, entries: [{ key: 'menu', selector: '.region', kinds: ['press'] }], onEngage: (_, d) => { seen.push([d.resolution, d.event.pointerId]); } });
  root.fire('pointerdown', { target: host, pointerType: 'touch', pointerId: 7, clientX: 5, clientY: 5 });
  clock.runAll();
  assert.deepEqual(seen, [['hold', 7]]);
});

test('a hover engages after a dwell; a pointer passing through does not', () => {
  const { root, el, clock } = page();
  const host = el('chip');
  host.closest = () => host;
  const outside = el('page');
  const seen = [];
  armEngagement({ root, ...clock, entries: [{ key: 'x', selector: '.chip', kinds: ['hover'] }], onEngage: (_, d) => { seen.push(d.resolution); } });
  root.fire('pointerover', { target: host, pointerType: 'mouse' });
  root.fire('pointerout', { target: host, relatedTarget: outside });
  clock.runAll();
  assert.deepEqual(seen, []);
  root.fire('pointerover', { target: host, pointerType: 'mouse' });
  clock.runAll();
  assert.deepEqual(seen, ['dwell']);
});

test('touch-generated pointerover is not a hover, and unknown kinds arm nothing', () => {
  const { root, el, clock } = page();
  const host = el('chip');
  host.closest = () => host;
  const seen = [];
  const armed = armEngagement({ root, ...clock, entries: [{ key: 'x', selector: '.chip', kinds: ['hover'] }, { key: 'y', selector: '.chip', kinds: ['wink'] }], onEngage: () => seen.push(1) });
  root.fire('pointerover', { target: host, pointerType: 'touch' });
  clock.runAll();
  assert.deepEqual(seen, []);
  assert.deepEqual(armed.pending(), ['x']);
});

test('an approach is heard before intent resolves, once per host, even when the touch becomes a scroll', () => {
  const { root, el, clock } = page();
  const host = el('chip');
  host.closest = () => host;
  const heard = [];
  const engaged = [];
  armEngagement({ root, ...clock, entries: [{ key: 'x', selector: '.chip', kinds: ['press', 'focus'] }], onApproach: (_, d) => heard.push(d.kind), onEngage: (_, d) => engaged.push(d.resolution) });
  root.fire('pointerdown', { target: host, pointerType: 'touch', pointerId: 1, clientX: 0, clientY: 0 });
  assert.deepEqual(heard, ['press']);
  root.fire('pointercancel', { pointerId: 1 });
  root.fire('focusin', { target: host });
  assert.deepEqual(heard, ['press']);
  assert.deepEqual(engaged, ['focus']);
});

test('focus already inside a host when arming is an engagement (autofocus sends no focusin)', () => {
  const { root, el, clock } = page();
  const field = el('field');
  field.closest = (s) => (s === 'textarea' ? field : null);
  root.activeElement = field;
  const seen = [];
  armEngagement({ root, ...clock, entries: [{ key: 'fields', selector: 'textarea', kinds: ['focus'] }], onEngage: (_, d) => { seen.push(d.type); return 'done'; } });
  assert.deepEqual(seen, ['arm']);
  assert.equal(root.count(), 0);
});

test('focus in a field engages the field, not the region around it', () => {
  const { root, el, clock } = page();
  const region = el('region');
  const field = el('field');
  field.matches = (s) => s.includes('textarea');
  field.closest = (s) => (s === 'textarea' ? field : s === '.region' ? region : null);
  const seen = [];
  armEngagement({ root, ...clock, entries: [{ key: 'menu', selector: '.region', kinds: ['focus'] }, { key: 'fields', selector: 'textarea', kinds: ['focus'] }], onEngage: (entry) => { seen.push(entry.key); } });
  root.fire('focusin', { target: field });
  assert.deepEqual(seen, ['fields']);
});
