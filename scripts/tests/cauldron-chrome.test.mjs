import assert from 'node:assert/strict';
import test from 'node:test';
import { openCauldronDialog, closeCauldronDialog, syncCauldronPanelCollapse } from '../../public/js/interface/cauldron/chrome.js';

// Exercise node ownership and restoration; the browser owns native focus trapping.
class PaletteNode extends HTMLElement {
  constructor() {
    super();
    this.dataset = {};
    this.attributes = new Map();
    this.listeners = new Map();
    this.children = [];
    this.isConnected = true;
    this.style = { setProperty() {}, getPropertyValue() { return ''; } };
    this.classList = { contains() { return false; } };
  }
  setAttribute(key, value) { this.attributes.set(key, value); }
  getAttribute(key) { return this.attributes.get(key) ?? null; }
  removeAttribute(key) { this.attributes.delete(key); }
  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(fn);
  }
  emit(type, extra = {}) { for (const fn of this.listeners.get(type) || []) fn({ type, target: this, ...extra }); }
  append(node) {
    node.parent?.children.splice(node.parent.children.indexOf(node), 1);
    this.children.push(node);
    node.parent = this;
  }
  before(node) {
    this.parent.children.splice(this.parent.children.indexOf(this), 0, node);
    node.parent = this.parent;
  }
  replaceWith(node) {
    node.parent?.children.splice(node.parent.children.indexOf(node), 1);
    this.parent.children.splice(this.parent.children.indexOf(this), 1, node);
    node.parent = this.parent;
  }
  querySelector(selector) { return selector === 'button' ? this.closeButton : null; }
  closest(selector) { return selector === 'dialog[open]' && this.parent?.open ? this.parent : null; }
  getBoundingClientRect() { return { top: 1000, bottom: 1100, left: 10, right: 400 }; }
  focus() { document.activeElement = this; }
  showModal() { this.open = true; }
  close() { this.open = false; /* native close is queued */ }
}

test('modal preserves the live vessel, holds open through updates, and restores its seat and opener', () => {
  const original = { document: globalThis.document, HTMLButtonElement: globalThis.HTMLButtonElement };
  const home = new PaletteNode();
  const host = new PaletteNode();
  const trigger = new PaletteNode();
  const chip = new PaletteNode();
  const dialog = new PaletteNode();
  dialog.closeButton = new PaletteNode();
  host.dataset.spwCauldronPanel = 'compact';
  const liveInput = new PaletteNode();
  liveInput.value = 'compare';
  host.append(liveInput);
  home.append(host);
  globalThis.HTMLButtonElement = PaletteNode;
  globalThis.document = {
    body: new PaletteNode(), documentElement: new PaletteNode(),
    createElement: () => dialog,
    createComment: () => new PaletteNode(),
    querySelector: (selector) => selector === '.spw-cauldron-chip' ? chip : host,
    querySelectorAll: () => [host],
  };
  try {
    openCauldronDialog(trigger);
    assert.equal(dialog.open, true);
    assert.equal(host.parent, dialog);
    assert.equal(host.dataset.spwCauldronPanel, 'open');
    syncCauldronPanelCollapse(0);
    assert.equal(host.dataset.spwCauldronPanel, 'open', 'clearing must not collapse an open modal');
    openCauldronDialog(trigger);
    assert.equal(dialog.children.filter(node => node === host).length, 1);
    closeCauldronDialog();
    assert.equal(host.parent, home);
    assert.deepEqual(home.children, [host]);
    assert.equal(host.children[0], liveInput);
    assert.equal(liveInput.value, 'compare');
    assert.equal(host.dataset.spwCauldronPanel, 'compact');
    assert.equal(document.activeElement, trigger);
    openCauldronDialog(chip);
    chip.hidden = true;
    closeCauldronDialog();
    assert.equal(chip.hidden, false, 'an emptied chip remains available for focus restoration');
    assert.equal(document.activeElement, chip);
    dialog.emit('close');
    assert.deepEqual(home.children, [host], 'queued close must not restore twice');
    openCauldronDialog(trigger);
    dialog.close();
    openCauldronDialog(trigger);
    dialog.emit('close');
    assert.equal(host.parent, dialog, 'a queued close cannot dismantle a reopened palette');
    dialog.close();
    dialog.emit('close');
    assert.equal(host.parent, home, 'native Escape/close restores the vessel');
    assert.equal(document.activeElement, trigger);
  } finally {
    Object.assign(globalThis, original);
  }
});
