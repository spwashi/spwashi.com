import assert from 'node:assert/strict';
import test from 'node:test';

import { initSpwShellDisclosure } from '../../public/js/runtime/shell-disclosure.js';

// Dispatch synchronously so an exception inside a browser listener fails the
// regression instead of being swallowed by the shared DOM fallback.
function eventTarget() {
  const listeners = new Map();
  return {
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
    },
    removeEventListener(type, fn) { listeners.get(type)?.delete(fn); },
    dispatchEvent(event) {
      for (const fn of listeners.get(event.type) || []) fn(event);
      return true;
    },
    listenerCount(type) { return listeners.get(type)?.size || 0; },
  };
}

class ShellElement extends HTMLElement {
  constructor() {
    super();
    Object.assign(this, eventTarget());
    this.dataset = {};
    this.selectors = new Map();
    this.attributes = new Map();
    this.style = {
      setProperty(name, value) { this[name] = value; },
      getPropertyValue(name) { return this[name] || ''; },
      removeProperty(name) { delete this[name]; },
    };
    const classes = new Set();
    this.classList = {
      toggle: (name, active) => active ? classes.add(name) : classes.delete(name),
      remove: (name) => classes.delete(name),
    };
  }
  querySelector(selector) { return this.selectors.get(selector) || null; }
  querySelectorAll() { return []; }
  closest() { return null; }
  matches() { return false; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  getBoundingClientRect() { return { top: 0, bottom: 64, left: 0, width: 390, height: 64 }; }
}

function installShell(t) {
  const html = new ShellElement();
  const body = new ShellElement();
  const header = new ShellElement();
  const nav = new ShellElement();
  const navList = new ShellElement();
  const toggle = new ShellElement();
  const routeMenu = new ShellElement();
  const utility = new ShellElement();
  const doc = {
    ...eventTarget(), documentElement: html, body, readyState: 'complete',
    querySelector: (selector) => selector === 'body > header, .site-header' ? header : null,
    querySelectorAll: (selector) => selector === '.spw-route-menu[open]' && routeMenu.open ? [routeMenu] : [],
  };
  for (const node of [html, body, header, nav, navList, toggle, routeMenu, utility]) node.ownerDocument = doc;
  header.selectors.set('nav', nav);
  header.selectors.set('.spw-nav-toggle', toggle);
  header.selectors.set('.spw-shell-utility-row', utility);
  header.selectors.set('details.spw-shell-utility-disclosure', new ShellElement());
  nav.selectors.set('ul', navList);
  const frames = new Map();
  const timers = new Map();
  let id = 0;
  let disconnected = false;
  const view = {
    ...eventTarget(),
    innerWidth: 390, scrollY: 128, location: globalThis.location,
    matchMedia: () => ({ matches: false }),
    requestAnimationFrame: (fn) => { frames.set(++id, fn); return id; },
    cancelAnimationFrame: (frame) => frames.delete(frame),
    setTimeout: (fn, delay) => { timers.set(++id, { fn, delay }); return id; },
    clearTimeout: (timer) => timers.delete(timer),
    scrollTo: (_, y) => { view.scrollY = y; },
  };
  const replacements = {
    document: doc,
    window: view,
    innerWidth: view.innerWidth,
    scrollY: view.scrollY,
    matchMedia: view.matchMedia,
    HTMLButtonElement: ShellElement,
    HTMLDetailsElement: class extends ShellElement {},
    MutationObserver: class {
      observe() {}
      disconnect() { disconnected = true; }
    },
  };
  const originals = Object.fromEntries(Object.keys(replacements).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(replacements)) globalThis[key] = value;
  let controller;
  t.after(() => {
    try {
      controller?.cleanup();
    } finally {
      for (const [key, descriptor] of Object.entries(originals)) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
      }
    }
  });
  controller = initSpwShellDisclosure();
  return {
    html, body, header, nav, toggle, routeMenu, doc, view, frames, controller,
    disconnected: () => disconnected,
    intent: (intent) => doc.dispatchEvent({ type: 'spw:shell-menu-intent', detail: { intent } }),
    runNavigationTimer() {
      for (const [key, timer] of timers) {
        if (timer.delay !== 0) continue;
        timers.delete(key);
        timer.fn();
      }
    },
  };
}

test('shell closes an open route menu and drawer after navigation', (t) => {
  const shell = installShell(t);
  shell.intent('open');
  assert.equal(shell.header.dataset.spwMenu, 'open');
  assert.equal(shell.body.dataset.spwShellScrollLock, 'true', 'the open snapshot reaches the scroll lock');
  assert.equal(shell.body.style.top, '-128px');

  shell.routeMenu.open = true;
  const link = { getAttribute: () => '/art/', closest() { return this; } };
  shell.nav.dispatchEvent({ type: 'click', target: link, button: 0 });
  assert.equal(shell.routeMenu.open, false);
  shell.runNavigationTimer();
  assert.equal(shell.header.dataset.spwMenu, 'closed');
  assert.equal(shell.nav.hidden, true);
  assert.equal(shell.toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(shell.body.dataset.spwShellScrollLock, undefined);
});

test('shell cleanup removes its menu projection and releases an active scroll lock', (t) => {
  const shell = installShell(t);
  shell.intent('open');
  shell.header.dataset.spwUnrelated = 'preserved';
  shell.view.scrollY = 0;
  shell.controller.cleanup();

  for (const node of [shell.header, shell.nav, shell.toggle]) {
    assert.deepEqual(Object.keys(node.dataset).filter((key) => key.startsWith('spwMenu')), []);
  }
  assert.equal(shell.header.dataset.spwUnrelated, 'preserved');
  assert.equal(shell.header.dataset.spwShellDisclosureInit, undefined);
  assert.equal(shell.body.dataset.spwShellScrollLock, undefined);
  assert.equal(shell.html.dataset.spwShellScrollLock, undefined);
  assert.equal(shell.body.style.top, undefined);
  assert.equal(shell.view.scrollY, 128, 'teardown restores the pre-lock position');
  assert.equal(shell.view.listenerCount('touchmove'), 0);
  assert.equal(shell.nav.listenerCount('click'), 0);
  assert.equal(shell.disconnected(), true);
  assert.equal(shell.doc.documentElement.style.getPropertyValue('--spw-shell-menu-offset'), '');
});
