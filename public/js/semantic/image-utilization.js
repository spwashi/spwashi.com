/**
 * image-utilization.js
 * ---------------------------------------------------------------------------
 * Progressive image distribution: lazy loading, decode hints, hero priority,
 * and utilization metadata for CSS performance surfaces.
 */

import { observeAddedMatches } from '/public/js/kernel/dom-contracts.js';
import { resolveOwnerDocument } from '/public/js/kernel/browser-primitives.js';

const MAIN_IMAGE_SELECTOR = 'main img, main picture img, [data-spw-image-surface] img, [data-spw-image-reward] img, [data-spw-image-discovery] img';
const HERO_SELECTOR = '[data-spw-frame="hero"] img, main > .spw-frame:first-of-type img, main > article > .spw-frame:first-of-type img';

let initialized = false;

function annotateImage(img, index = 0, isHero = false) {
  if (!(img instanceof HTMLImageElement)) return;

  if (!img.getAttribute('loading')) {
    img.loading = isHero || index === 0 ? 'eager' : 'lazy';
  }
  if (!img.getAttribute('decoding')) {
    img.decoding = isHero ? 'sync' : 'async';
  }
  if (isHero && !img.getAttribute('fetchpriority')) {
    img.setAttribute('fetchpriority', 'high');
  }

  img.dataset.spwImageUtilization = img.dataset.spwImageUtilization
    || (isHero ? 'hero' : index < 2 ? 'above-fold' : 'distributed');
  if (!img.dataset.spwImageDistribution) {
    img.dataset.spwImageDistribution = isHero ? 'anchor' : 'cascade';
  }
}

function initImageUtilizationInternal(root = document) {
  if (initialized) return () => {};
  initialized = true;

  const heroImages = new Set(root.querySelectorAll(HERO_SELECTOR));
  const images = [...root.querySelectorAll(MAIN_IMAGE_SELECTOR)];

  images.forEach((img, index) => {
    annotateImage(img, index, heroImages.has(img));
  });

  const disconnect = observeAddedMatches('img', () => {
    root.querySelectorAll(MAIN_IMAGE_SELECTOR).forEach((img, index) => {
      if (!img.dataset.spwImageUtilization) {
        annotateImage(img, index, heroImages.has(img));
      }
    });
  }, { root: root.body || root.documentElement });

  return () => {
    disconnect();
    initialized = false;
  };
}

let activeImageUtilizationCleanup = null;

export function initImageUtilization(root = document) {
  unmountImageUtilization();
  activeImageUtilizationCleanup = initImageUtilizationInternal(root);
  return activeImageUtilizationCleanup;
}

export function unmountImageUtilization() {
  if (activeImageUtilizationCleanup) {
    try { activeImageUtilizationCleanup(); } catch (_) {}
    activeImageUtilizationCleanup = null;
  }
}

export { unmountImageUtilization as unmount };

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'image-utilization',
  mount: (ctx, root) => initImageUtilization(resolveOwnerDocument(ctx, root)),
  describes: 'image[distribution|utilization] performance lazy-priority',
  updates: [
    'measure:data-spw-image-utilization',
    'measure:data-spw-image-distribution',
  ],
  evaluates: ['visual', 'visual-model', 'spacing-semantics'],
  timingArc: 'visible-media',
  effectScope: ['local-dom', 'element-state'],
  contract: Object.freeze({
    story: 'Distinguishes hero anchor images from below-the-fold figures, setting fetchpriority, decoding, lazy hints, and readable distribution attributes.',
    wonder: ['orientation', 'constraint'],
    host: 'main img, [data-spw-image-surface], [data-spw-image-reward], [data-spw-image-discovery]',
    css: ['public/css/systems/image-utilization.css'],
    value: 'Makes image loading posture inspectable in HTML attributes rather than buried in ad-hoc markup attrs.',
  }),
});

export const spwModule = SPW_MODULE_EXPORT;