import {
  SCROLL_CADENCE_ATTR,
  getRootPreference,
  resolveAttentionDocument,
  restoreAttribute,
  writeAttributes,
} from './shared.js';

export function initScrollCadenceState(root) {
  const doc = root?.nodeType === 9 ? root : root?.ownerDocument || document;
  if (!doc?.documentElement) return () => {};
  const nodes = [doc.documentElement, doc.body].filter((node) => node instanceof HTMLElement);
  const previous = nodes.map((node) => [node, node.getAttribute(SCROLL_CADENCE_ATTR)]);
  const enabled = getRootPreference('spwScrollCadence', 'on', doc) !== 'off';

  nodes.forEach((node) => {
    writeAttributes(node, {
      [SCROLL_CADENCE_ATTR]: enabled ? 'on' : 'off',
    });
  });

  return () => {
    previous.forEach(([node, value]) => {
      restoreAttribute(node, SCROLL_CADENCE_ATTR, value);
    });
  };
}

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'attention-scroll-cadence',
  mount: (ctx, root) => initScrollCadenceState(resolveAttentionDocument(ctx, root)),
  describes: 'attention[scroll-cadence] section-state ornament preference projection',
  timingArc: 'idle-attention',
  effectScope: 'root-state preference-projection',
});

export const spwModule = SPW_MODULE_EXPORT;