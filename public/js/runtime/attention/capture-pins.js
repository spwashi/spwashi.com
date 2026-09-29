/**
 * Capture pins — query/hash authored attention that must survive in a still.
 * Uses existing attributes. Does not invent a parallel family.
 */

import {
  PAGE_SECTION_CURRENT_ATTR,
  PROBE_ATTR,
  READING_GROOVE_ATTR,
} from './shared.js';

export const CAPTURE_PIN_MARK = 'capture';

export function readCapturePinQuery(search = '', hash = '') {
  const params = new URLSearchParams(String(search || '').replace(/^\?/, ''));
  const fromQuery = String(params.get('pin') || params.get('section') || '')
    .replace(/^#/, '')
    .trim();
  const fromHash = String(hash || '').replace(/^#/, '').trim();
  return {
    section: fromQuery || fromHash || '',
    probe: String(params.get('probe') || '').trim(),
  };
}

function resolveCaptureDocument(root) {
  if (root?.nodeType === 9) return root;
  return root?.ownerDocument || (typeof document !== 'undefined' ? document : null);
}

function escapeIdent(value) {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(value);
  return String(value).replace(/([^a-zA-Z0-9_-])/g, '\\$1');
}

export function applyAttentionCapturePins(
  root = typeof document !== 'undefined' ? document : null,
  pins,
) {
  const doc = resolveCaptureDocument(root);
  const view = doc?.defaultView;
  const resolvedPins = pins || readCapturePinQuery(view?.location?.search, view?.location?.hash);
  const html = doc?.documentElement;
  if (!html) return { section: '', probe: '', node: null };

  const section = String(resolvedPins?.section || '').trim();
  const probe = String(resolvedPins?.probe || '').trim();
  let node = null;

  if (section) {
    node = typeof doc.getElementById === 'function'
      ? doc.getElementById(section)
      : doc.querySelector?.(`#${escapeIdent(section)}`);
    if (node) {
      node.setAttribute('data-spw-region-mark', CAPTURE_PIN_MARK);
      html.setAttribute(PAGE_SECTION_CURRENT_ATTR, section);
    }
  }

  if (probe) {
    html.setAttribute(PROBE_ATTR, probe);
  }

  return { section, probe, node };
}

export function readPinnedProbe(root = typeof document !== 'undefined' ? document : null) {
  const doc = resolveCaptureDocument(root);
  const view = doc?.defaultView;
  return readCapturePinQuery(view?.location?.search, view?.location?.hash).probe;
}

/**
 * Which prepare a still asked for. Pin and probe outrank a gesture.
 * Keys outrank the focus that only starts them.
 */
export function attentionStepKind(request = {}) {
  if (request.section) return 'pin';
  if (request.probe) return 'probe';
  if (Array.isArray(request.keys) && request.keys.length) return 'keys';
  if (request.focus) return 'focus';
  if (Array.isArray(request.hover) && request.hover.length) return 'hover';
  if (
    (Array.isArray(request.click) && request.click.length)
    || (Array.isArray(request.check) && request.check.length)
  ) return 'press';
  return 'rest';
}

function findNode(doc, host, selector) {
  const sel = String(selector || '').trim();
  if (!sel) return null;
  const from = (root) => {
    if (!root || typeof root.querySelector !== 'function') return null;
    try { return root.querySelector(sel); } catch { return null; }
  };
  return from(doc) || (host && host !== doc ? from(host) : null);
}

function holds(node, active) {
  if (!node || !active) return false;
  return node === active || (typeof node.contains === 'function' && node.contains(active));
}

function controlSettled(el) {
  if (!el) return false;
  const pressed = el.getAttribute?.('aria-pressed');
  if (pressed != null) return pressed === 'true';
  const type = el.type || el.getAttribute?.('type');
  if (type === 'checkbox' || type === 'radio') return el.checked === true;
  return true;
}

/**
 * Whether the prepare landed, read from attributes and focus the page already has.
 * Hover trusts the runner's hit list: :hover after a synthetic move is not the contract.
 */
export function readAttentionStep(root, request = {}) {
  const doc = resolveCaptureDocument(root);
  const html = doc?.documentElement || null;
  const kind = attentionStepKind(request);
  const section = String(request.section || '').trim();
  const probe = String(request.probe || '').trim();
  const host = findNode(doc, null, request.selector);
  const active = doc?.activeElement || null;
  const idle = !active || active === doc?.body || active === html;
  const focusWithin = Boolean(host && !idle && holds(host, active));
  let landed = true;

  if (kind === 'pin') {
    const node = section && typeof doc?.getElementById === 'function' ? doc.getElementById(section) : null;
    landed = node?.getAttribute?.('data-spw-region-mark') === CAPTURE_PIN_MARK;
  } else if (kind === 'probe') {
    landed = Boolean(probe) && html?.getAttribute?.(PROBE_ATTR) === probe;
  } else if (kind === 'keys') {
    const lands = String(request.lands || '').trim();
    landed = lands
      ? holds(findNode(doc, host, lands), active)
      : focusWithin || holds(findNode(doc, host, request.focus), active);
  } else if (kind === 'focus') {
    landed = request.focus === true
      ? focusWithin
      : holds(findNode(doc, host, request.focus), active);
  } else if (kind === 'hover') {
    const selectors = request.hover;
    const found = selectors.every((sel) => Boolean(findNode(doc, host, sel)));
    landed = found && request.hoverMissed !== true;
  } else if (kind === 'press') {
    const selectors = [...(request.click || []), ...(request.check || [])];
    landed = selectors.every((sel) => controlSettled(findNode(doc, host, sel)));
  }

  return {
    step: kind,
    landed,
    section: section || html?.getAttribute?.(PAGE_SECTION_CURRENT_ATTR) || '',
    probe: probe || html?.getAttribute?.(PROBE_ATTR) || '',
    focusWithin,
    groove: html?.getAttribute?.(READING_GROOVE_ATTR) || '',
  };
}
