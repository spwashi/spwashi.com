/**
 * Sigil Anatomy — hydration pass that separates sigils from operands.
 *
 * Raw authored HTML keeps the fused, readable form ("$ now"); hydration
 * wraps the sigil and operand in distinct elements so CSS, capture, and
 * gesture code can address them separately:
 *   <a class="spw-chip">$ now</a>
 *     -> <a class="spw-chip" data-spw-sigil-anatomy="hydrated"
 *           data-spw-op="operator:substrate operand:now position:prefix dispatch:forward">
 *          <span class="spw-sigil">$</span><span class="spw-operand"> now</span></a>
 * The no-JS reading is the fused text — that IS the graceful degradation
 * (Spwashi direction, 2026-07-03). Spacing is preserved exactly so
 * hydration causes zero layout shift.
 */

import { composeOpBundle, splitOperatorExpression } from '/public/js/kernel/shared.js';

const HOST_SELECTOR = '.spw-chip:not([data-spw-sigil-anatomy])';

function hydrateHost(host) {
  /* Only anatomize simple hosts: a single fused text node. Nested markup
     means an author already chose an anatomy; leave it alone. */
  if (host.childNodes.length !== 1 || host.firstChild.nodeType !== Node.TEXT_NODE) {
    host.dataset.spwSigilAnatomy = 'authored';
    return;
  }
  const raw = host.firstChild.nodeValue || '';
  const split = splitOperatorExpression(raw);
  if (!split.prefix || !split.operand) {
    host.dataset.spwSigilAnatomy = 'bare';
    return;
  }

  const sigil = document.createElement('span');
  sigil.className = 'spw-sigil';
  const operand = document.createElement('span');
  operand.className = 'spw-operand';

  if (split.position === 'postfix') {
    operand.textContent = raw.slice(0, raw.length - split.prefix.length);
    sigil.textContent = raw.slice(raw.length - split.prefix.length);
    host.replaceChildren(operand, sigil);
  } else {
    sigil.textContent = raw.slice(0, split.prefix.length);
    operand.textContent = raw.slice(split.prefix.length);
    host.replaceChildren(sigil, operand);
  }

  /* Merge bundles: authored axes (e.g. flavor:stream) win; hydration adds
     the grammar axes (operator/operand/position/dispatch) they lack. */
  const authored = (host.dataset.spwOp || '').split(/\s+/).filter(Boolean);
  const authoredAxes = new Set(authored.map((t) => t.split(':')[0]));
  const derived = composeOpBundle(raw).split(/\s+/).filter((t) => !authoredAxes.has(t.split(':')[0]));
  host.dataset.spwOp = [...authored, ...derived].join(' ');
  host.dataset.spwSigilAnatomy = 'hydrated';
}

export function initSigilAnatomy() {
  const hydrateAll = (root = document) => {
    root.querySelectorAll(HOST_SELECTOR).forEach(hydrateHost);
  };
  hydrateAll();

  /* Late-rendered surfaces (spell dock, cauldron panels) re-run cheaply:
     the :not() selector keeps the pass idempotent. */
  const onRefresh = () => hydrateAll();
  document.addEventListener('spw:page-extended', onRefresh, { passive: true });
  const timer = window.setTimeout(onRefresh, 1200);

  return () => {
    document.removeEventListener('spw:page-extended', onRefresh);
    window.clearTimeout(timer);
  };
}
