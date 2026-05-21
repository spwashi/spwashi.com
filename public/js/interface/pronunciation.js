/**
 * Spw Pronunciation & Mnemonics
 *
 * Purpose
 * - Surface pronunciation hints and mnemonics for Spw operators and key terms.
 * - Encourage imagination and memory through subtle tooltips on hover/charge.
 * - Make the language feel more approachable and fun to "say".
 */

import { bus } from '/public/js/kernel/bus.js';
import { annotateFloatingChromeElement } from '/public/js/kernel/dom-contracts.js';
import { getOperatorDefinition, normalizeText } from '/public/js/kernel/shared.js';

const HINT_CLASS = 'spw-pronunciation-hint';
let initialized = false;
let hintEl = null;

export function initPronunciationHints() {
  if (initialized) return;
  initialized = true;

  bus.on('brace:charged', onBraceCharged);
  bus.on('brace:discharged', onBraceDischarged);
}

function onBraceCharged(event) {
  const { element, operator, targetKind } = event.detail;
  if (!element) return;

  const definition = getOperatorDefinition(operator);
  if (!definition || !definition.pronunciation) return;

  showHint(element, definition);
}

function onBraceDischarged() {
  hideHint();
}

function showHint(element, definition) {
  hideHint();

  hintEl = document.createElement('div');
  hintEl.className = HINT_CLASS;
  annotateFloatingChromeElement(hintEl, {
    role: 'pronunciation-hint',
    tier: 'popover',
    mutator: 'pronunciation',
    reason: 'operator-pronunciation',
    stylingAxis: 'language-hint',
  });
  hintEl.setAttribute('role', 'status');

  const content = `
    <div class="spw-pronunciation-hint__inner">
      <span class="spw-pronunciation-hint__pronunciation">say: "${definition.pronunciation}"</span>
      <span class="spw-pronunciation-hint__mnemonic">${definition.mnemonic}</span>
    </div>
  `;

  hintEl.innerHTML = content;
  document.body.appendChild(hintEl);

  const rect = element.getBoundingClientRect();
  const hintRect = hintEl.getBoundingClientRect();

  let top = rect.top - hintRect.height - 8;
  let left = rect.left + (rect.width / 2) - (hintRect.width / 2);

  // Bounds check
  if (top < 8) top = rect.bottom + 8;
  left = Math.max(8, Math.min(left, window.innerWidth - hintRect.width - 8));

  hintEl.style.top = `${top + window.scrollY}px`;
  hintEl.style.left = `${left}px`;

  requestAnimationFrame(() => {
    hintEl?.classList.add('is-visible');
  });
}

function hideHint() {
  if (hintEl) {
    hintEl.classList.remove('is-visible');
    const el = hintEl;
    setTimeout(() => el.remove(), 200);
    hintEl = null;
  }
}
