/**
 * Capture pins — query/hash authored attention that must survive in a still.
 * Uses existing attributes. Does not invent a parallel family.
 */

import {
  PAGE_SECTION_CURRENT_ATTR,
  PROBE_ATTR,
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
