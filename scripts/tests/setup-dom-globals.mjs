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
    querySelectorAll() {
      return [];
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

if (!globalThis.window) {
  globalThis.window = globalThis;
}

if (!globalThis.HTMLElement) {
  globalThis.HTMLElement = class HTMLElement {};
}

if (!globalThis.SVGElement) {
  globalThis.SVGElement = class SVGElement {};
}