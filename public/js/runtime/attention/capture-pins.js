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

export function applyAttentionCapturePins(
  root = document,
  pins = readCapturePinQuery(
    root.defaultView?.location?.search,
    root.defaultView?.location?.hash,
  ),
) {
  const html = root.documentElement;
  if (!html) return { section: '', probe: '', node: null };

  const section = String(pins?.section || '').trim();
  const probe = String(pins?.probe || '').trim();
  let node = null;

  if (section) {
    node = typeof root.getElementById === 'function'
      ? root.getElementById(section)
      : root.querySelector?.(`#${section}`);
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

export function readPinnedProbe(root = document) {
  return readCapturePinQuery(root.defaultView?.location?.search).probe;
}
