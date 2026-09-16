import assert from 'node:assert/strict';
import test from 'node:test';

import { initSpwSpells } from '../../public/js/runtime/spells.js';

function eventTarget() {
  const listeners = new Map();
  return {
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
    },
    removeEventListener(type, fn) { listeners.get(type)?.delete(fn); },
    dispatchEvent(event) {
      for (const fn of [...(listeners.get(event.type) || [])]) fn(event);
      return true;
    },
    listenerCount(type) { return listeners.get(type)?.size || 0; },
  };
}

const decodeHtml = (value) => String(value).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const datasetKey = (name) => name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

// Only the renderer's controls need DOM identity. Replacing a board detaches
// those controls and releases their focus, just as an innerHTML write does.
class SpellElement extends HTMLElement {
  constructor(doc) {
    super();
    Object.assign(this, eventTarget());
    this.ownerDocument = doc;
    this.dataset = {};
    this.attributes = new Map();
    this.selectors = new Map();
    this.children = [];
    this.className = '';
    this.textContent = '';
    this.renderCount = 0;
  }
  set innerHTML(value) {
    for (const child of this.children) {
      if (this.ownerDocument.activeElement === child) this.ownerDocument.activeElement = this.ownerDocument.body;
      child.parentElement = null;
    }
    this.children = [];
    this.html = value;
    this.renderCount += 1;
    for (const [, tag, attrs, text] of value.matchAll(/<(button|a)\b([^>]*)>([\s\S]*?)<\/\1>/g)) {
      const child = new SpellElement(this.ownerDocument);
      child.tagName = tag.toUpperCase();
      child.parentElement = this;
      child.textContent = decodeHtml(text.replace(/<[^>]*>/g, '').trim());
      for (const [, name, content] of attrs.matchAll(/([\w-]+)="([^"]*)"/g)) child.setAttribute(name, decodeHtml(content));
      this.children.push(child);
    }
  }
  get innerHTML() { return this.html || ''; }
  setAttribute(name, value) {
    this.attributes.set(name, String(value));
    if (name.startsWith('data-')) this.dataset[datasetKey(name)] = String(value);
    if (name === 'class') this.className = value;
  }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  matches(selector) {
    return selector.split(',').some((part) => {
      const match = part.trim().match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
      return match && this.attributes.has(match[1]) && (match[2] === undefined || this.getAttribute(match[1]) === match[2]);
    });
  }
  closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector) || null; }
  querySelectorAll(selector) { return this.children.filter((child) => child.matches(selector)); }
  querySelector(selector) { return this.selectors.get(selector) || this.querySelectorAll(selector)[0] || null; }
  focus() { this.ownerDocument.activeElement = this; }
  click() {
    const event = { type: 'click', target: this, preventDefault() {}, stopPropagation() {} };
    for (let node = this; node; node = node.parentElement) node.dispatchEvent(event);
  }
}

class MemoryStorage {
  getItem(key) { return Object.hasOwn(this, key) ? this[key] : null; }
  setItem(key, value) { this[key] = String(value); }
  removeItem(key) { delete this[key]; }
}

function installSpells(t, { entries = [], saved = true, couplings = null } = {}) {
  const doc = { ...eventTarget() };
  const html = new SpellElement(doc);
  const body = new SpellElement(doc);
  const board = new SpellElement(doc);
  const header = new SpellElement(doc);
  const host = new SpellElement(doc);
  const dock = new SpellElement(doc);
  const dockBody = new SpellElement(doc);
  body.dataset = { spwFeatures: 'spells shell-trace', spwSurface: 'design' };
  html.dataset.spwWonderMemory = 'off';
  header.selectors.set('.spw-header-trace', host);
  host.selectors.set('.spw-spell-dock', dock);
  for (const part of ['count', 'label']) dock.selectors.set(`.spw-spell-dock-${part}`, new SpellElement(doc));
  dock.selectors.set('.spw-spell-dock-body', dockBody);
  Object.assign(doc, {
    documentElement: html, body, activeElement: body,
    getElementById: () => null,
    querySelector: (selector) => selector === 'body > header, .site-header' ? header : null,
    querySelectorAll: (selector) => selector.includes('.spell-board-content') ? [board] : [],
  });
  const storage = new MemoryStorage();
  storage.setItem('spw-grounded-registry', JSON.stringify(entries));
  if (couplings) storage.setItem('spw-coupling:global', JSON.stringify(couplings));
  if (saved) storage.setItem('spw-checkpoint:Study trail', JSON.stringify({
    registry: ['global:~design'], path: '/design/', savedAt: 1000,
  }));
  const frames = new Map();
  let frameId = 0;
  const media = { ...eventTarget(), matches: false, media: '(max-width: 720px)' };
  const view = {
    ...eventTarget(), location: { href: 'https://spwashi.com/design/', pathname: '/design/', search: '', hash: '' },
    matchMedia: () => media,
    spwSettings: { get: () => ({ semanticDensity: 'medium', physicsReason: 'playful' }) },
    requestAnimationFrame: (fn) => { frames.set(++frameId, fn); return frameId; },
    cancelAnimationFrame: (id) => frames.delete(id),
  };
  const NativeDate = Date;
  let now = Date.UTC(2026, 8, 16, 12);
  const replacements = {
    document: doc, window: view, localStorage: storage,
    requestAnimationFrame: view.requestAnimationFrame, cancelAnimationFrame: view.cancelAnimationFrame,
    Date: class extends NativeDate {
      constructor(...args) { super(...(args.length ? args : [now])); }
      static now() { return now; }
    },
  };
  const originals = Object.fromEntries(Object.keys(replacements).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(replacements)) globalThis[key] = value;
  let controller;
  t.after(() => {
    try { controller?.cleanup(); } finally {
      for (const [key, descriptor] of Object.entries(originals)) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
      }
    }
  });
  controller = initSpwSpells();
  return {
    doc, html, body, board, dock, dockBody, storage, view, media, frames, controller,
    emit: (name) => doc.dispatchEvent({ type: `spw:${name}`, detail: {} }),
    advanceTime: () => { now += 5000; },
    flush() {
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach((fn) => fn(now));
    },
  };
}

test('saved trails remain actionable when the current trail is empty', (t) => {
  const surface = installSpells(t);
  const restore = surface.board.querySelector('[data-spw-spell-restore="Study trail"]');
  const decompose = surface.board.querySelector('[data-spw-spell-decompose="Study trail"]');
  assert.ok(restore, 'the empty trail must still offer its saved checkpoint');
  assert.ok(decompose, 'saved fragments can be reopened without first gathering something else');
  for (const button of [restore, decompose]) {
    assert.ok(button.className.split(/\s+/).includes('spw-chip'));
    assert.equal(button.dataset.spwGroundable, 'false', 'a trail action must not ground itself');
  }
  const captured = [];
  surface.doc.addEventListener('spw:spell:capture', (event) => captured.push(event.detail));
  decompose.click();
  assert.equal(captured.length, 1);
  assert.equal(captured[0].expression, '~design');
  restore.click();
  assert.deepEqual(JSON.parse(surface.storage.getItem('spw-grounded-registry')), ['global:~design']);
  surface.flush();
  assert.ok(surface.board.querySelector('[data-spw-spell-action="checkpoint"]'), 'restore brings back the working trail actions');
});

test('unchanged refresh keeps action nodes and keyboard focus across clock ticks', (t) => {
  const surface = installSpells(t, { entries: ['global:~design'] });
  const button = surface.board.querySelector('[data-spw-spell-action="checkpoint"]');
  assert.ok(button);
  button.focus();
  const renders = surface.board.renderCount;
  const dockRenders = surface.dockBody.renderCount;
  surface.advanceTime();
  surface.controller.refresh();
  surface.flush();
  assert.ok(surface.board.querySelector('[data-spw-spell-action="checkpoint"]') === button, 'an unchanged trail retains its original action control');
  assert.ok(surface.doc.activeElement === button, 'focus remains on that retained control');
  assert.equal(surface.board.renderCount, renders);
  assert.equal(surface.dockBody.renderCount, dockRenders);
});

test('a checkpoint saved in another tab appears without changing the current trail', (t) => {
  const surface = installSpells(t, { saved: false });
  assert.equal(surface.board.querySelector('[data-spw-spell-restore]'), null);
  surface.storage.setItem('spw-checkpoint:Another tab', JSON.stringify({
    registry: ['global:~design'], path: '/design/', savedAt: 2000,
  }));
  surface.view.dispatchEvent({ type: 'storage', key: 'spw-checkpoint:Another tab' });
  surface.flush();
  assert.ok(surface.board.querySelector('[data-spw-spell-restore="Another tab"]'));
  assert.deepEqual(JSON.parse(surface.storage.getItem('spw-grounded-registry')), []);
});

test('attention and settings event bursts render the latest state once per frame', (t) => {
  const surface = installSpells(t, { entries: ['global:~design'] });
  const renders = surface.board.renderCount;
  surface.html.dataset.spwMeaningMode = 'inspect';
  surface.emit('page-attention-state');
  surface.emit('page-transition-state');
  surface.emit('settings:changed');
  assert.equal(surface.frames.size, 1);
  assert.equal(surface.board.renderCount, renders);
  surface.flush();
  assert.equal(surface.board.dataset.spwSpellMeaningMode, 'inspect');
  assert.equal(surface.board.renderCount, renders + 1);
});

test('viewport changes only refresh the dock when crossing its layout breakpoint', (t) => {
  const surface = installSpells(t, { entries: ['global:~design'] });
  const boardRenders = surface.board.renderCount;
  surface.view.dispatchEvent({ type: 'resize' });
  surface.view.dispatchEvent({ type: 'resize' });
  assert.equal(surface.frames.size, 0);
  surface.media.matches = true;
  surface.media.dispatchEvent({ type: 'change', matches: true });
  assert.equal(surface.frames.size, 1);
  surface.flush();
  assert.equal(surface.dock.dataset.spwViewport, 'compact');
  assert.equal(surface.board.renderCount, boardRenders, 'board content does not depend on viewport width');
});

test('same-origin trail items become links; tokens and foreign URLs stay notation', (t) => {
  const surface = installSpells(t, {
    entries: ['global:~design', 'global:~foreign', 'global:~script', 'global:~token'],
    couplings: {
      'global:~design': { expression: '~design', href: '/design/#memory-garden-cauldron' },
      'global:~foreign': { expression: '~foreign', href: 'https://example.com/x' },
      'global:~script': { expression: '~script', href: 'javascript:alert(1)' },
      'global:~token': { expression: '~token', href: '~token' },
    },
  });
  const link = surface.board.querySelector('[href="/design/#memory-garden-cauldron"]');
  assert.ok(link, 'a remembered same-origin path should be a real return link');
  assert.equal(link.tagName, 'A');
  assert.equal(link.dataset.spwGroundable, 'false');
  assert.equal(link.getAttribute('aria-label'), null, 'visible operator text remains the accessible name');
  assert.match(surface.board.innerHTML, /<span class="spell-ingredient"[^>]*data-spw-deep-link="https:\/\/example.com\/x"/);
  assert.doesNotMatch(surface.board.innerHTML, /href="javascript:/);
  assert.doesNotMatch(surface.board.innerHTML, /href="https:\/\/example.com/);
  assert.doesNotMatch(surface.board.innerHTML, /href="[^"]*~token/);
});

test('reopening a saved trail forwards its deep link into the cauldron capture', (t) => {
  const surface = installSpells(t, { saved: false });
  surface.storage.setItem('spw-checkpoint:Study trail', JSON.stringify({
    registry: ['global:~design'],
    path: '/design/',
    savedAt: 1000,
    couplings: {
      global: {
        'global:~design': {
          expression: '~design',
          deepLink: '/design/#memory-garden-cauldron',
          deepLinkLabel: 'cauldron',
        },
      },
      path: {},
    },
  }));
  surface.view.dispatchEvent({ type: 'storage', key: 'spw-checkpoint:Study trail' });
  surface.flush();
  const captured = [];
  surface.doc.addEventListener('spw:spell:capture', (event) => captured.push(event.detail));
  surface.board.querySelector('[data-spw-spell-decompose="Study trail"]').click();
  assert.equal(captured.length, 1);
  assert.equal(captured[0].expression, '~design');
  assert.equal(captured[0].deepLink, '/design/#memory-garden-cauldron');
  assert.equal(captured[0].deepLinkLabel, 'cauldron');
});

test('cleanup cancels pending work and unregisters external render triggers', (t) => {
  const surface = installSpells(t);
  surface.emit('page-attention-state');
  assert.equal(surface.frames.size, 1);
  surface.controller.cleanup();
  assert.equal(surface.frames.size, 0);
  assert.equal(surface.doc.listenerCount('spw:page-attention-state'), 0);
  assert.equal(surface.doc.listenerCount('spw:settings:changed'), 0);
  assert.equal(surface.media.listenerCount('change'), 0);
  assert.equal(surface.view.listenerCount('storage'), 0);
  surface.emit('settings:changed');
  surface.media.dispatchEvent({ type: 'change' });
  surface.view.dispatchEvent({ type: 'storage', key: 'spw-checkpoint:Study trail' });
  assert.equal(surface.frames.size, 0);
});
