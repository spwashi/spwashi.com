import assert from 'node:assert/strict';
import test from 'node:test';
import { bus } from '../../public/js/kernel/bus.js';
import { initSpwSemanticCrossrefs } from '../../public/js/semantic/semantic-crossrefs.js';
import { syncUtilityRow } from '../../public/js/runtime/shell/utility-row.js';

// Scroll and pointer paths repeat one state many times a second; a writer that
// rewrites an unchanged value still queues mutation records and dirties style.
class WriteCountingElement extends globalThis.HTMLElement {
  constructor(dataset = {}) {
    super();
    this.writes = 0;
    const props = new Map();
    this.dataset = new Proxy({ ...dataset }, {
      set: (target, key, value) => {
        this.writes += 1;
        target[key] = String(value);
        return true;
      },
      deleteProperty: (target, key) => {
        if (key in target) this.writes += 1;
        delete target[key];
        return true;
      },
    });
    this.style = {
      getPropertyValue: (name) => props.get(name) ?? '',
      setProperty: (name, value) => {
        this.writes += 1;
        props.set(name, String(value));
      },
      removeProperty: (name) => {
        this.writes += 1;
        props.delete(name);
      },
    };
    this.textContent = dataset.spwVocab || '';
  }

  closest(selector) { return String(selector).includes('data-spw-vocab') ? this : null; }
  matches() { return true; }
  getAttribute() { return null; }
  hasAttribute(name) {
    const key = String(name).replace(/^data-/, '').replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    return key in this.dataset;
  }
}

test('bus charge writes --charge and data-spw-charge only when they move', () => {
  const el = new WriteCountingElement();
  bus.setCharge(el, 0.5, { emit: false });
  assert.equal(el.style.getPropertyValue('--charge'), '0.5');
  assert.equal(el.dataset.spwCharge, 'active');

  el.writes = 0;
  bus.setCharge(el, 0.5, { emit: false });
  assert.equal(el.writes, 0);

  bus.setCharge(el, 0.6, { emit: false });
  assert.equal(el.writes, 1, 'a new level in the same state moves only the property');

  el.writes = 0;
  bus.releaseCharge(el, { emit: false });
  bus.releaseCharge(el, { emit: false });
  assert.equal(el.writes, 2, 'release writes the property and drops the state once');
  assert.equal(el.dataset.spwCharge, undefined);
});

test('crossref focus writes its difference, and a repeated pointerover writes nothing', () => {
  const a = new WriteCountingElement({ spwVocab: 'river' });
  const b = new WriteCountingElement({ spwVocab: 'river' });
  const c = new WriteCountingElement({ spwVocab: 'stone' });
  const cleanup = initSpwSemanticCrossrefs({ root: { querySelectorAll: () => [a, b, c] } });
  const over = (target) => document.dispatchEvent({ type: 'pointerover', target });
  const writes = () => a.writes + b.writes + c.writes;
  try {
    over(a);
    assert.equal(a.dataset.spwCrossref, 'source');
    assert.equal(a.dataset.spwCrossrefSource, 'true');
    assert.equal(b.dataset.spwCrossref, 'peer');
    assert.equal(c.dataset.spwCrossref, undefined);

    [a, b, c].forEach((el) => { el.writes = 0; });
    over(a);
    assert.equal(writes(), 0, 'the pointer crossing a child of the same source rewrites nothing');

    over(b);
    assert.equal(a.dataset.spwCrossref, 'peer');
    assert.equal(a.dataset.spwCrossrefSource, undefined);
    assert.equal(b.dataset.spwCrossref, 'source');
    assert.equal(b.dataset.spwCrossrefSource, 'true');
    assert.equal(writes(), 4, 'moving the source among peers swaps two pairs');
    assert.equal(c.writes, 0);
  } finally {
    cleanup?.();
  }
});

test('touch lights kin only through an open note, which holds them until it closes', async () => {
  const a = new WriteCountingElement({ spwVocab: 'river' });
  const b = new WriteCountingElement({ spwVocab: 'river' });
  const c = new WriteCountingElement({ spwVocab: 'stone' });
  const cleanup = initSpwSemanticCrossrefs({ root: { querySelectorAll: () => [a, b, c] } });
  const html = document.documentElement.dataset;
  const touch = (type, target) => document.dispatchEvent({ type, target, pointerType: 'touch' });
  const mouse = (type, target) => document.dispatchEvent({ type, target, pointerType: 'mouse' });
  const note = (type, target) => document.dispatchEvent({ type: `spw:concept:${type}`, target });
  try {
    touch('pointerover', a);
    touch('pointerout', a);
    touch('pointerup', a);
    assert.equal(a.writes + b.writes, 0, 'a touch alone, a scroll or a tap, writes nothing');

    note('inspected', a);
    assert.equal(html.spwSemanticCrossref, 'river');
    assert.equal(b.dataset.spwCrossref, 'peer');
    mouse('pointerover', c);
    mouse('pointerout', a);
    document.dispatchEvent({ type: 'focusout', target: a });
    await new Promise((resolve) => setTimeout(resolve, 120));
    assert.equal(html.spwSemanticCrossref, 'river', 'while the note is open, hover and focus leave its kin lit');
    assert.equal(c.dataset.spwCrossref, undefined);

    note('released', a);
    assert.equal(html.spwSemanticCrossref, undefined, 'closing the note lets go');
    mouse('pointerover', c);
    assert.equal(html.spwSemanticCrossref, 'stone', 'hover previews again once the note is closed');
  } finally {
    cleanup?.();
  }
});

// A utility-row button: attributes and its argument's text count each write.
class UtilityButton extends globalThis.HTMLElement {
  constructor(action) {
    super();
    this.action = action;
    this.writes = 0;
    this.attrs = new Map();
    const button = this;
    let text = '';
    this.argument = {
      get textContent() { return text; },
      set textContent(value) { button.writes += 1; text = String(value); },
    };
  }

  querySelector() { return this.argument; }
  get title() { return this.getAttribute('title') ?? ''; }
  set title(value) { this.setAttribute('title', value); }
  getAttribute(name) { return this.attrs.get(name) ?? null; }
  setAttribute(name, value) { this.writes += 1; this.attrs.set(name, String(value)); }
  toggleAttribute(name, force) {
    if (force === this.attrs.has(name)) return force;
    this.writes += 1;
    if (force) this.attrs.set(name, ''); else this.attrs.delete(name);
    return force;
  }
}

test('the utility row writes pressed state, titles and labels once, not on every measured pass', () => {
  const buttons = ['color-light', 'color-dark', 'font-down', 'font-up', 'path-toggle']
    .map((action) => new UtilityButton(action));
  const row = new WriteCountingElement();
  row.querySelectorAll = (selector) => buttons.filter((button) => selector.includes(`"${button.action}"`));
  row.closest = () => null;
  const writes = () => row.writes + buttons.reduce((sum, button) => sum + button.writes, 0);

  syncUtilityRow(row);
  assert.equal(buttons[0].getAttribute('aria-pressed'), 'false');
  assert.equal(buttons[4].getAttribute('title'), 'Open the link trail when the header trace finishes mounting');
  assert.equal(row.dataset.spwPathAvailable, 'false');
  assert.ok(writes() > 0);

  row.writes = 0;
  buttons.forEach((button) => { button.writes = 0; });
  syncUtilityRow(row);
  assert.equal(writes(), 0, 'a pass that finds the same settings rewrites nothing');

  document.documentElement.dataset.spwColorMode = 'dark';
  try {
    syncUtilityRow(row);
    assert.equal(buttons[1].getAttribute('aria-pressed'), 'true');
    assert.equal(buttons[1].getAttribute('title'), 'Dark mode active');
    assert.equal(buttons[0].writes, 0, 'auto to dark leaves the light button as it was');
    assert.equal(writes(), 3, 'auto to dark moves the row mode and the dark button\'s pressed state and title');
  } finally {
    delete document.documentElement.dataset.spwColorMode;
  }
});
