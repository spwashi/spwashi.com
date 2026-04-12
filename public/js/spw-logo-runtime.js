/**
 * spw-logo-runtime.js
 *
 * The logo is the smallest unit of the site's physics.
 * State contract: settled → preview → charged → emitting → settled
 *
 * HTML says what the logo is.
 * CSS says how each state manifests materially.
 * This script says when and why state changes.
 */

import { bus } from './spw-bus.js';

const SCROLL_CHARGE_DEPTH = 320; // px of scroll over which charge builds

/**
 * Set logo state + optional charge level.
 * @param {HTMLElement} logo
 * @param {string} state — settled | preview | charged | emitting
 * @param {number} [charge] — 0–1, writes --logo-charge CSS variable
 */
export function setLogoState(logo, state, charge) {
  logo.dataset.logoState = state;
  if (charge !== undefined) {
    logo.style.setProperty('--logo-charge', charge.toFixed(3));
  }
}

/**
 * Bind pointer and scroll behavior to a logo element.
 * @param {HTMLElement} logo
 */
function bindLogo(logo) {
  // Pointer: preview on enter, charged on press, emitting on copy/export, settled on leave
  logo.addEventListener('pointerenter', () => {
    setLogoState(logo, 'preview', 0.3);
  });

  logo.addEventListener('pointerleave', () => {
    setLogoState(logo, 'settled', 0);
  });

  logo.addEventListener('pointerdown', () => {
    setLogoState(logo, 'charged', 0.7);
  });

  logo.addEventListener('pointerup', () => {
    // Brief emitting flash, then settle
    setLogoState(logo, 'emitting', 1);
    setTimeout(() => {
      setLogoState(logo, 'settled', 0);
    }, 520);
  });

  logo.addEventListener('pointercancel', () => {
    setLogoState(logo, 'settled', 0);
  });

  // Keyboard: respond to Enter/Space like a button
  logo.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      setLogoState(logo, 'charged', 0.7);
    }
  });

  logo.addEventListener('keyup', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      setLogoState(logo, 'emitting', 1);
      setTimeout(() => setLogoState(logo, 'settled', 0), 520);
    }
  });

  // Scroll: charge arc opacity as page scrolls (scroll down = more structure visible)
  if (logo.dataset.logoScroll !== undefined || logo.closest('header')) {
    logo.dataset.logoScroll = '';

    const onScroll = () => {
      const raw = window.scrollY / SCROLL_CHARGE_DEPTH;
      const charge = Math.min(raw, 1);
      logo.style.setProperty('--logo-charge', charge.toFixed(3));
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // initialize immediately
  }

  // Bus: emit when relevant site events fire
  bus.on('copy:succeeded', () => {
    setLogoState(logo, 'emitting', 1);
    setTimeout(() => setLogoState(logo, 'settled', 0), 520);
  });

  bus.on('spell:grounded', () => {
    setLogoState(logo, 'emitting', 1);
    setTimeout(() => setLogoState(logo, 'settled', 0), 520);
  });
}

/**
 * Initialize all .spw-logo elements on the page.
 */
export function initLogoRuntime() {
  document.querySelectorAll('.spw-logo').forEach(logo => {
    bindLogo(logo);
  });
}

/**
 * Build the logo HTML component and insert it.
 * Replaces the first element matching `selector` with a proper .spw-logo.
 * @param {string} selector
 * @param {{ href?: string, wordmark?: string }} opts
 */
export function mountLogo(selector, opts = {}) {
  const target = document.querySelector(selector);
  if (!target) return;

  const { href = '/', wordmark = 'Spwashi' } = opts;
  const isLink = !!href;
  const tag = isLink ? 'a' : 'span';

  const logo = document.createElement(tag);
  logo.className = 'spw-logo';
  logo.setAttribute('data-logo-state', 'settled');
  logo.setAttribute('data-spw-kind', 'island');
  logo.setAttribute('data-spw-touch', 'tap');
  if (isLink) {
    logo.href = href;
    logo.setAttribute('aria-label', `${wordmark} — home`);
  }

  // Inline the SVG mark so CSS can reach into it
  logo.innerHTML = `
    <svg class="spw-logo-mark" viewBox="0 0 48 56" fill="none" aria-hidden="true" focusable="false">
      <path
        id="mark-arc-${Math.random().toString(36).slice(2,6)}"
        class="mark-layer mark-layer--arc"
        d="M 10 30 C 6 14 16 3 29 3 C 42 3 48 14 46 26 C 44 36 36 40 26 36"
        stroke="currentColor" stroke-width="2.4" stroke-linecap="round" fill="none"
      />
      <path
        id="mark-w-${Math.random().toString(36).slice(2,6)}"
        class="mark-layer mark-layer--w"
        d="M 12 34 L 19 52 L 27 40 L 35 52 L 42 34"
        stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"
      />
    </svg>
    <span class="spw-logo-wordmark" aria-hidden="${isLink}">${wordmark}</span>
  `;

  target.replaceWith(logo);
  bindLogo(logo);
  return logo;
}
