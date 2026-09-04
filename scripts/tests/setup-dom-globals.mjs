const eventTarget = {
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent() {
    return true;
  },
};

if (!globalThis.document) {
  globalThis.document = {
    ...eventTarget,
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

if (!globalThis.HTMLElement) {
  globalThis.HTMLElement = class HTMLElement {};
}

if (!globalThis.SVGElement) {
  globalThis.SVGElement = class SVGElement {};
}