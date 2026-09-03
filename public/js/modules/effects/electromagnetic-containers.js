/**
 * Charged paper containers.
 * CSS owns the field (crease, wash, room electrode). JS owns discrete
 * charge steps on authored [data-container-type] only — not every card.
 */

import { bus } from '/public/js/kernel/bus.js';
import { getSiteSettings } from '/public/js/kernel/site-settings.js';
import { ensureElectromagneticContainerStyles } from '/public/js/kernel/deferred-styles.js';

const CHARGE_STATES = Object.freeze(['conception', 'potential', 'kinetic', 'manifest']);
const CHARGE_INDEX = Object.freeze(Object.fromEntries(CHARGE_STATES.map((name, index) => [name, index])));

function normalizeCharge(value = '') {
  const key = String(value || '').trim();
  return CHARGE_STATES.includes(key) ? key : 'potential';
}

function writeCharge(element, charge, { emit = true } = {}) {
  const next = normalizeCharge(charge);
  const previous = element.dataset.charge || 'potential';
  element.dataset.charge = next;
  element.dataset.chargeIndex = String(CHARGE_INDEX[next]);
  element.dataset.chargeLabel = `#{${next}}`;
  const density = getSiteSettings()?.semanticDensity || 'normal';
  const densityWeight = density === 'minimal' ? 0.86 : density === 'rich' ? 1.12 : 1;
  element.style.setProperty('--spw-container-density', String(densityWeight));

  if (previous !== next) {
    element.dataset.chargeTransitioning = 'true';
    window.setTimeout(() => {
      if (element.dataset.chargeTransitioning === 'true') delete element.dataset.chargeTransitioning;
    }, 800);
  }

  if (emit) {
    bus.emit?.('field:charged', {
      element,
      oldCharge: previous,
      newCharge: next,
      chargeIndex: CHARGE_INDEX[next],
    });
  }
}

function stepCharge(element, delta) {
  const current = CHARGE_INDEX[normalizeCharge(element.dataset.charge)] ?? 1;
  const next = CHARGE_STATES[Math.max(0, Math.min(CHARGE_STATES.length - 1, current + delta))];
  if (next) writeCharge(element, next);
}

function bindContainer(element) {
  if (!(element instanceof HTMLElement)) return () => {};
  if (!element.dataset.charge) writeCharge(element, 'potential', { emit: false });
  else writeCharge(element, element.dataset.charge, { emit: false });

  const onClick = () => stepCharge(element, 1);
  element.addEventListener('click', onClick);
  return () => element.removeEventListener('click', onClick);
}

export function initElectromagneticContainers(root = document) {
  ensureElectromagneticContainerStyles();
  const scope = root?.querySelectorAll ? root : document;
  const nodes = [...scope.querySelectorAll('[data-container-type]')];
  if (!nodes.length) return () => {};

  const unbind = nodes.map(bindContainer);
  const onKey = (event) => {
    const target = event.target instanceof Element
      ? event.target.closest('[data-container-type]')
      : null;
    if (!target) return;
    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      stepCharge(target, 1);
    } else if (event.key === '-') {
      event.preventDefault();
      stepCharge(target, -1);
    }
  };
  const onSettings = () => {
    nodes.forEach((node) => writeCharge(node, node.dataset.charge || 'potential', { emit: false }));
  };

  document.addEventListener('keydown', onKey);
  const offSettings = typeof bus?.on === 'function'
    ? bus.on('settings:changed', onSettings)
    : null;

  return () => {
    document.removeEventListener('keydown', onKey);
    if (typeof offSettings === 'function') offSettings();
    unbind.forEach((off) => off());
  };
}

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'electromagnetic-containers',
  mount: (_ctx, root) => initElectromagneticContainers(root),
  describes: 'container[charge]{conception.potential.kinetic.manifest}',
  timingArc: 'visible-visual',
  effectScope: 'local-dom css-vars',
});

export const spwModule = SPW_MODULE_EXPORT;
