/**
 * logo-runtime.js
 *
 * The logo is the smallest unit of the site's physics.
 * State contract: settled → preview → charged → emitting → settled
 *
 * HTML says what the logo is.
 * CSS says how each state manifests materially.
 * This script says when and why state changes.
 */

import { bus } from '/public/js/kernel/bus.js';
import { createMeasuredLane } from '/public/js/kernel/measured-frame.js';

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

let activeUnsubscribes = [];

function bindLogo(logo) {
  const controller = new AbortController();
  const { signal } = controller;

  // Pointer: preview on enter, charged on press, emitting on copy/export, settled on leave
  logo.addEventListener('pointerenter', () => {
    setLogoState(logo, 'preview', 0.3);
  }, { signal });

  logo.addEventListener('pointerleave', () => {
    setLogoState(logo, 'settled', 0);
  }, { signal });

  logo.addEventListener('pointerdown', () => {
    setLogoState(logo, 'charged', 0.7);
  }, { signal });

  logo.addEventListener('pointerup', () => {
    setLogoState(logo, 'emitting', 1);
    setTimeout(() => {
      setLogoState(logo, 'settled', 0);
    }, 420);
  }, { signal });

  // Scroll charge: one scrollY read per frame after the frame's style pass
  // (kernel/measured-frame.js), and a write only when the state or the charge
  // (in hundredths) moves. Writing on every scroll event dirtied style between
  // the frame and the lanes that measure after it, so each of them paid a
  // full pass.
  const scrollLane = createMeasuredLane({
    name: 'logo-scroll',
    measure: () => window.scrollY || 0,
    apply: (scrollY) => {
      if (logo.dataset.logoState === 'charged' || logo.dataset.logoState === 'emitting') return;
      const charge = Math.min(1, scrollY / SCROLL_CHARGE_DEPTH);
      const state = charge > 0.05 ? 'preview' : 'settled';
      const level = state === 'preview' ? Math.round(charge * 40) / 100 : 0;
      if (logo.dataset.logoState === state && logo.style.getPropertyValue('--logo-charge') === level.toFixed(3)) return;
      setLogoState(logo, state, level);
    },
  });
  const onScroll = () => {
    scrollLane.schedule();
  };
  window.addEventListener('scroll', onScroll, { passive: true, signal });

  const u1 = bus.on('wonder:memorized', () => {
    setLogoState(logo, 'emitting', 1);
    setTimeout(() => setLogoState(logo, 'settled', 0), 520);
  });

  const u2 = bus.on('spell:grounded', () => {
    setLogoState(logo, 'emitting', 1);
    setTimeout(() => setLogoState(logo, 'settled', 0), 520);
  });

  activeUnsubscribes.push(() => {
    controller.abort();
    scrollLane.cancel();
    if (typeof u1 === 'function') u1();
    if (typeof u2 === 'function') u2();
  });
}

/**
 * Initialize all .spw-logo elements on the page.
 */
export function initLogoRuntime() {
  unmountLogoRuntime();
  document.querySelectorAll('.spw-logo').forEach(logo => {
    bindLogo(logo);
  });
  return unmountLogoRuntime;
}

export function unmountLogoRuntime() {
  for (const un of activeUnsubscribes) {
    try { un(); } catch (_) {}
  }
  activeUnsubscribes = [];
}

export { unmountLogoRuntime as unmount };

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
    <svg class="spw-logo-mark" viewBox="0 0 48 52" fill="none" aria-hidden="true" focusable="false">
      <path
        id="mark-arc-${Math.random().toString(36).slice(2,6)}"
        class="mark-layer mark-layer--arc"
        d="M 9 18 C 14 6 28 4 37 10 C 44 14 44 23 38 28 C 32 32 23 32 18 26"
        stroke="currentColor" stroke-width="2.4" stroke-linecap="round" fill="none"
      />
      <path
        id="mark-w-${Math.random().toString(36).slice(2,6)}"
        class="mark-layer mark-layer--w"
        d="M 8 26 L 16 45 L 24 27 L 32 45 L 40 26"
        stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"
      />
    </svg>
    <span class="spw-logo-wordmark" aria-hidden="${isLink}">${wordmark}</span>
  `;

  target.replaceWith(logo);
  bindLogo(logo);
  return logo;
}
