function createEventTarget() {
  const registry = new Map();
  return {
    addEventListener(type, fn) {
      if (typeof fn !== 'function') return;
      if (!registry.has(type)) registry.set(type, new Set());
      registry.get(type).add(fn);
    },
    removeEventListener(type, fn) {
      registry.get(type)?.delete(fn);
    },
    dispatchEvent(event) {
      const type = event?.type;
      const set = registry.get(type);
      if (set) {
        for (const fn of set) {
          try {
            fn(event);
          } catch {
            // keep dispatcher resilient in tests
          }
        }
      }
      return true;
    },
  };
}

const documentEventTarget = createEventTarget();

if (!globalThis.document) {
  globalThis.document = {
    ...documentEventTarget,
    body: { dataset: {}, style: { setProperty() {}, getPropertyValue() { return ''; }, removeProperty() {} } },
    documentElement: { dataset: {}, style: { setProperty() {}, getPropertyValue() { return ''; }, removeProperty() {} } },
    head: {
      append() {},
      appendChild() {},
      querySelector() { return null; },
      querySelectorAll() { return []; },
    },
    querySelectorAll() {
      return [];
    },
    querySelector() {
      return null;
    },
    getElementById() {
      return null;
    },
    createElement(tag) {
      return {
        tagName: String(tag || '').toUpperCase(),
        className: '',
        dataset: {},
        style: { setProperty() {}, getPropertyValue() { return ''; }, removeProperty() {} },
        append() {},
        appendChild() {},
        replaceChildren() {},
        setAttribute() {},
        getAttribute() { return null; },
        addEventListener() {},
        removeEventListener() {},
        textContent: '',
        innerHTML: '',
      };
    },
    createTextNode(value) {
      return { textContent: String(value ?? '') };
    },
    createDocumentFragment() {
      return { appendChild() {} };
    },
  };
}

if (!globalThis.location) {
  globalThis.location = {
    pathname: '/',
    search: '',
    hash: '',
    origin: 'https://spwashi.com',
    hostname: 'spwashi.com',
    host: 'spwashi.com',
    href: 'https://spwashi.com/',
  };
}

if (!globalThis.window) {
  globalThis.window = globalThis;
}

if (!globalThis.window.location) {
  globalThis.window.location = globalThis.location;
}

const windowEventTarget = createEventTarget();

if (!globalThis.window.addEventListener) {
  globalThis.window.addEventListener = windowEventTarget.addEventListener;
  globalThis.window.removeEventListener = windowEventTarget.removeEventListener;
  globalThis.window.dispatchEvent = windowEventTarget.dispatchEvent;
}

if (!globalThis.addEventListener) {
  globalThis.addEventListener = globalThis.window.addEventListener;
  globalThis.removeEventListener = globalThis.window.removeEventListener;
  globalThis.dispatchEvent = globalThis.window.dispatchEvent;
}

if (!globalThis.CSS) {
  globalThis.CSS = {
    escape(val) {
      return String(val ?? '').replace(/([^\w-])/g, '\\$1');
    },
  };
}

if (!globalThis.Element) {
  globalThis.Element = class Element {};
}

if (!globalThis.Document) {
  globalThis.Document = class Document {};
}

if (!globalThis.HTMLElement) {
  globalThis.HTMLElement = class HTMLElement extends globalThis.Element {};
}

if (!globalThis.SVGElement) {
  globalThis.SVGElement = class SVGElement extends globalThis.Element {};
}