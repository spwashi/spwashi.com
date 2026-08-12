/**
 * Bookmark registry UI component for viewing and managing pinned Spw frames.
 */

import {
  clearPins,
  getPinStorageKey,
  readPins,
} from '/public/js/runtime/pin-registry.js';
import { escapeAttr as escapeAttribute, escapeHtml } from '/public/js/kernel/dom-render.js';

function safeDate(timestamp) {
  try {
    return new Date(timestamp).toLocaleDateString();
  } catch {
    return 'unknown-date';
  }
}

function groupPins(pins) {
  return pins.reduce((acc, pin) => {
    const key = pin.wonder || 'memory';
    if (!acc[key]) acc[key] = [];
    acc[key].push(pin);
    return acc;
  }, {});
}

export function initBookmarkRegistry() {
  const root = document.querySelector('[data-spw-bookmarks-root]');
  if (!root) return;
  const storageKey = getPinStorageKey();

  const render = () => {
    const pins = readPins();
    const values = Object.values(pins);

    if (!values.length) {
      root.innerHTML = '<p class="inline-note">No pinned frames yet. Hold a roomy frame or sigil long enough to arm a pin, then release.</p>';
      return;
    }

    const grouped = groupPins(values);
    const parts = [
      '<pre><code>',
      '<span class="spell-op">^[</span><span class="spell-node">pinned_frames</span><span class="spell-op">]</span><span class="spell-sep">{</span>\n',
    ];

    Object.entries(grouped).forEach(([group, pinsInGroup]) => {
      parts.push(`  <span class="spell-op">${escapeHtml(group)}</span><span class="spell-sep">:</span>\n`);
      pinsInGroup.forEach((pin) => {
        const date = safeDate(pin.timestamp);
        parts.push(
          `    <span class="spell-node">${escapeHtml(pin.id)}</span> `,
          `<span class="spell-op">~</span>`,
          `<a href="${escapeAttribute(pin.page)}#${escapeAttribute(pin.id)}" class="spell-node">"${escapeHtml(pin.page)}"</a> `,
          `<span class="spell-meta">(${escapeHtml(date)} · ${escapeHtml(pin.operator || 'frame')} · ${escapeHtml(pin.wonder || 'memory')})</span>\n`
        );
      });
    });

    parts.push('<span class="spell-sep">}</span></code></pre>');
    root.innerHTML = parts.join('');

    const clearBtn = document.createElement('button');
    clearBtn.className = 'operator-chip';
    clearBtn.style.marginTop = '1rem';
    clearBtn.innerHTML = '<span class="spell-op">!</span> reset_pins';
    clearBtn.addEventListener('click', () => {
      clearPins();
      document.querySelectorAll('[data-spw-pinned]').forEach((el) => {
        delete el.dataset.spwPinned;
        delete el.dataset.spwLatched;
      });
      render();
    });

    root.appendChild(clearBtn);
  };

  render();

  window.addEventListener('storage', (e) => {
    if (e.key === storageKey) render();
  });

  document.addEventListener('brace:pinned', render);
}
