/**
 * Portable gesture vocabulary and inspection helpers for runtime spells.
 */

import {
  describeElementContext,
  describeFeatureClusterElement,
  FEATURE_CLUSTER_CONTRACT,
  inferTopographyKind,
} from '../kernel/dom-contracts.js';
import { normalizeRoutePath } from '/public/js/kernel/route-utils.js';
import { safeQueryAll } from './runtime-helpers.js';

export { normalizeRoutePath };

export const GESTURE_TARGET_SELECTOR = [
  '.spw-delimiter',
  '.frame-sigil',
  '.frame-card-sigil',
  '.frame-panel-sigil',
  '.operator-chip',
  '.spw-route-menu-link',
  '.spw-link-expression',
  '.syntax-token',
  '[data-spw-feature]',
  '[data-spw-semantic-expression]',
  '[data-spw-interaction-contract]',
].join(', ');

export const GESTURE_VOCABULARY = Object.freeze({
  ground: Object.freeze({
    label: 'Ground',
    summary: 'Commit to the current target.',
    inputs: 'tap, click, Enter',
  }),
  charge: Object.freeze({
    label: 'Charge',
    summary: 'Preview a semantic handle before committing.',
    inputs: 'focus, hover, deliberate hold',
  }),
  flow: Object.freeze({
    label: 'Flow',
    summary: 'Move through a nearby sequence or rail.',
    inputs: 'arrow keys, prev/next controls, contextual swipe rails',
  }),
  rotate: Object.freeze({
    label: 'Rotate',
    summary: 'Open a mode seat and sit in a variant without leaving the room.',
    inputs: '[ opens the option-set, ] sits, mode chips, digits while the seat is open',
  }),
  travel: Object.freeze({
    label: 'Travel',
    summary: 'Move to another frame while keeping direction bounded.',
    inputs: '{ previous frame, } next frame',
  }),
  stage: Object.freeze({
    label: 'Stage',
    summary: 'Enter or leave a scene host in the current frame.',
    inputs: '( enter, ) leave',
  }),
  project: Object.freeze({
    label: 'Project',
    summary: 'Open a secondary tray, menu, or inspect surface.',
    inputs: 'question mark, Alt+Enter, context click, deliberate long press',
  }),
  settle: Object.freeze({
    label: 'Settle',
    summary: 'Close a preview or projected layer and return.',
    inputs: 'Escape, dismiss button, close-on-return controls',
  }),
});

export const GESTURE_SPELL_SEEDS = Object.freeze([
  Object.freeze({
    id: 'charge-preview',
    label: 'Charge preview',
    note: 'Preview a sigil, brace, or semantic handle without changing the route.',
    seed: '?gesture_charge { input: "hover | focus | hold" return: "semantic preview" }',
  }),
  Object.freeze({
    id: 'project-region-menu',
    label: 'Project region menu',
    note: 'Open the brace / region menu on purpose, then return without losing your place.',
    seed: '#>gesture_project { cue: "? | Alt+Enter | long hold" return: "region menu" }',
  }),
  Object.freeze({
    id: 'settle-return',
    label: 'Settle return',
    note: 'Dismiss chrome and recover the reading surface after inspection.',
    seed: '@gesture_settle { cue: "Escape" return: "focused prose" }',
  }),
]);

export const SPW_GESTURE_CONTRACT = Object.freeze({
  selector: GESTURE_TARGET_SELECTOR,
  vocabulary: GESTURE_VOCABULARY,
  seeds: GESTURE_SPELL_SEEDS,
});

function titleFromPath(pathname = '') {
  return String(pathname || '/')
    .split('/')
    .filter(Boolean)
    .at(-1)
    ?.replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || 'Home';
}

function parseRouteList(value = '') {
  return Array.from(new Set(
    String(value || '')
      .split(/[|,]/)
      .map((part) => normalizeRoutePath(part))
      .filter(Boolean)
  ));
}

function describeRouteSample(pathname = '') {
  const href = normalizeRoutePath(pathname);
  if (!href) return null;
  return {
    href,
    label: titleFromPath(href),
    note: href === '/' ? 'Start or re-enter the site.' : 'Related route from this page.',
  };
}

export function collectRelatedRouteSamples(root = document) {
  const related = [
    root?.body?.dataset?.spwRelatedRoutes,
    root?.querySelector?.('header')?.dataset?.spwRelatedRoutes,
  ]
    .filter(Boolean)
    .join('|');

  return parseRouteList(related)
    .map(describeRouteSample)
    .filter(Boolean)
    .slice(0, 8);
}

export function snapshotFeatureClusters(root = document) {
  return Array.from(root?.querySelectorAll?.(FEATURE_CLUSTER_CONTRACT.selector) || [])
    .map(describeFeatureClusterElement)
    .filter(Boolean);
}

export function describePageElementalContext(root = document, body = document.body) {
  const header = root?.querySelector?.('header') || null;
  const main = root?.querySelector?.('main') || null;

  return {
    header: header ? describeElementContext(header) : null,
    main: main ? describeElementContext(main) : null,
    featureClusters: snapshotFeatureClusters(root).slice(0, 6),
  };
}

export function describeCurrentPageSample(root = document, siteSurface = '') {
  const body = root?.body || document.body;
  const relatedRoutes = collectRelatedRouteSamples(root);

  return {
    route: window.location.pathname,
    surface: body?.dataset?.spwSurface || siteSurface,
    routeFamily: body?.dataset?.spwRouteFamily || '',
    family: body?.dataset?.spwPageFamily || '',
    role: body?.dataset?.spwPageRole || '',
    zone: body?.dataset?.spwPageZone || '',
    status: body?.dataset?.spwPageStatus || '',
    responsibility: body?.dataset?.spwPageResponsibility || '',
    primaryAction: body?.dataset?.spwPagePrimaryAction || '',
    pageModes: body?.dataset?.spwPageModes || '',
    context: body?.dataset?.spwContext || '',
    wonder: body?.dataset?.spwWonder || '',
    relatedRoutes,
    elementalContext: describePageElementalContext(root, body),
  };
}

export function inferGestureIntents(element) {
  if (!(element instanceof HTMLElement)) return [];

  const gestures = new Set();
  if (element.matches('.spw-delimiter, .frame-sigil, .frame-card-sigil, .frame-panel-sigil, [data-spw-semantic-expression]')) {
    gestures.add('charge');
    gestures.add('project');
    gestures.add('settle');
  }
  if (element.matches('.operator-chip, .spw-route-menu-link, .spw-link-expression, a[href], button, [data-set-mode], [data-site-setting-set]')) {
    gestures.add('ground');
  }
  if (element.matches('.spw-route-menu-link, [data-spw-interaction-contract]')) {
    gestures.add('project');
    gestures.add('settle');
  }
  if (element.matches('[data-mode-group], [data-set-mode], .mode-switch button')) {
    gestures.add('rotate');
  }
  if (element.matches('.spw-section-handle, [data-spw-section-handle], [data-spw-feature="settings-section-index"] *')) {
    gestures.add('flow');
  }
  return [...gestures];
}

export function resolveGestureTarget(target) {
  if (target instanceof HTMLElement) return target;
  if (typeof target === 'string') {
    return document.querySelector(target);
  }
  return null;
}

export function describeGestureTarget(target) {
  const element = resolveGestureTarget(target);
  if (!(element instanceof HTMLElement)) return null;
  const context = describeElementContext(element);
  return {
    target: context?.target || '',
    label: context?.label || '',
    kind: context?.kind || '',
    role: context?.role || '',
    feature: context?.feature || '',
    inspect: context?.inspect || '',
    gestures: inferGestureIntents(element),
    semanticExpression: element.dataset.spwSemanticExpression || '',
    semanticKey: element.dataset.spwSemanticKey || '',
    operator: element.dataset.spwOperator || '',
  };
}

export function snapshotGestureTargets(root = document) {
  return safeQueryAll(GESTURE_TARGET_SELECTOR, root)
    .slice(0, 24)
    .map((element) => describeGestureTarget(element))
    .filter(Boolean);
}

export function describeGestureContract() {
  return {
    vocabulary: GESTURE_VOCABULARY,
    seeds: GESTURE_SPELL_SEEDS,
    notes: [
      'Ground commits to the current target.',
      'Charge previews without navigation.',
      'Project opens a tray or semantic menu on purpose.',
      'Settle closes the nearest charged or projected layer.',
    ],
  };
}

export function describeComponentSample(target, siteSurface = '') {
  if (!(target instanceof HTMLElement)) return null;

  const frame = target.closest('.site-frame, [data-spw-kind], [data-spw-feature]');
  const elementalContext = describeElementContext(target);
  const body = document.body;

  return {
    target: elementalContext?.target || '',
    label: elementalContext?.label || '',
    kind: elementalContext?.kind || inferTopographyKind(target, 'component'),
    role: elementalContext?.role || '',
    feature: elementalContext?.feature || '',
    context: elementalContext?.context || target.closest('[data-spw-context]')?.dataset?.spwContext || body?.dataset?.spwContext || '',
    surface: elementalContext?.surface || body?.dataset?.spwSurface || siteSurface,
    slot: elementalContext?.slot || '',
    inspect: elementalContext?.inspect || '',
    boxModel: elementalContext?.boxModel || '',
    compositionFlow: elementalContext?.compositionFlow || '',
    owner: elementalContext?.owner || null,
    ancestry: elementalContext?.ancestry || [],
    page: describeCurrentPageSample(document, siteSurface),
    elementalContext,
    frame: frame?.id || frame?.dataset?.spwKind || '',
  };
}