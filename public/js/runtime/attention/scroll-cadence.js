import { SCROLL_CADENCE_ATTR, getRootPreference, writeAttributes } from './shared.js';

export function initScrollCadenceState() {
  const nodes = [document.documentElement, document.body].filter((node) => node instanceof HTMLElement);
  const previous = nodes.map((node) => [node, node.getAttribute(SCROLL_CADENCE_ATTR)]);
  const enabled = getRootPreference('spwScrollCadence', 'on') !== 'off';

  nodes.forEach((node) => {
    writeAttributes(node, {
      [SCROLL_CADENCE_ATTR]: enabled ? 'on' : 'off',
    });
  });

  return () => {
    previous.forEach(([node, value]) => {
      if (!(node instanceof HTMLElement)) return;
      if (value == null) {
        node.removeAttribute(SCROLL_CADENCE_ATTR);
      } else {
        node.setAttribute(SCROLL_CADENCE_ATTR, value);
      }
    });
  };
}