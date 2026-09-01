/**
 * spw-hero-kinetic-stage.js
 * --------------------------------------------------------------------------
 * Interactive runtime driver for the kinetic Spw hero stage: slide navigation,
 * node physics animations, payload scrubbing, and cauldron drop triggers.
 * ========================================================================== */

import { writeDatasetValue } from '../kernel/dom-contracts.js';

export const SPW_HERO_KINETIC_STAGE_CONTRACT = Object.freeze({
  featureId: 'spw-hero-kinetic-stage',
  selector: '[data-spw-feature="spw-hero-kinetic-stage"], .spw-hero-stage',
  attributes: Object.freeze({
    bound: 'data-spw-hero-stage-bound',
    charge: 'data-spw-charge',
    dropped: 'data-spw-dropped',
  }),
  events: Object.freeze({
    ingredientGathered: 'spw:cauldron-ingredient-gathered',
  }),
  portableUse:
    'Interactive kinetic hero stage driver supporting slide carousel, membrane kinetics, and cauldron gather feedback.',
});

export function initSpwHeroKineticStage(root = document) {
  const stages = root.querySelectorAll?.(SPW_HERO_KINETIC_STAGE_CONTRACT.selector);
  if (!stages || !stages.length) return () => {};

  const controller = new AbortController();
  const { signal } = controller;
  const boundStages = [];

  stages.forEach((stage) => {
    if (stage.dataset.spwHeroStageBound) return;
    stage.dataset.spwHeroStageBound = 'true';
    boundStages.push(stage);

    const slideButtons = stage.querySelectorAll('.spw-hero-slide-btn[data-hero-slide]');
    const slides = stage.querySelectorAll('.spw-hero-slide');
    const prevBtn = stage.querySelector('[data-action="prev-slide"]');
    const nextBtn = stage.querySelector('[data-action="next-slide"]');
    let activeIndex = 0;

    function goToSlide(index) {
      if (index < 0) index = slides.length - 1;
      if (index >= slides.length) index = 0;
      activeIndex = index;

      slides.forEach((slide, i) => {
        const isActive = i === activeIndex;
        slide.classList.toggle('is-active', isActive);
        if (isActive) {
          slide.setAttribute('tabindex', '0');
        } else {
          slide.removeAttribute('tabindex');
        }
      });

      slideButtons.forEach((btn, i) => {
        const isActive = i === activeIndex;
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });

      writeDatasetValue(stage, 'spwCharge', 'armed');
    }

    slideButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-hero-slide'), 10);
        if (Number.isFinite(idx)) goToSlide(idx);
      }, { signal });
    });

    if (prevBtn) {
      prevBtn.addEventListener('click', () => goToSlide(activeIndex - 1), { signal });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => goToSlide(activeIndex + 1), { signal });
    }

    // Node interaction & Cauldron drop triggers
    stage.querySelectorAll('.spw-kinetic-node').forEach((node) => {
      node.addEventListener('click', () => {
        node.style.transform = 'translateY(-6px) scale(1.1)';
        const timer = setTimeout(() => {
          node.style.transform = '';
        }, 220);
        signal.addEventListener('abort', () => clearTimeout(timer), { once: true });

        const isCauldronDrop = node.getAttribute('data-action') === 'drop-cauldron';
        const payloadText = node.textContent.trim().replace(/[▾▾\s]+/g, ' ');

        if (isCauldronDrop) {
          window.dispatchEvent(new CustomEvent('spw:cauldron-ingredient-gathered', {
            bubbles: true,
            detail: {
              token: payloadText,
              source: 'hero-kinetic-stage',
              category: 'payload',
            },
          }));

          writeDatasetValue(node, 'spwDropped', 'true');
          const resetTimer = setTimeout(() => {
            delete node.dataset.spwDropped;
          }, 1400);
          signal.addEventListener('abort', () => clearTimeout(resetTimer), { once: true });
        }
      }, { signal });
    });
  });

  return () => {
    controller.abort();
    boundStages.forEach((stage) => {
      delete stage.dataset.spwHeroStageBound;
      delete stage.dataset.spwCharge;
    });
  };
}

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'spw-hero-kinetic-stage',
  mount: (ctx, root) => initSpwHeroKineticStage(root instanceof Node ? root : document),
  describes: 'hero[kinetic-stage]{boundaries|electrostatics|cauldron} interactive motion and payload lab',
  timingArc: 'visible-hero-stage',
  effectScope: 'element-state local-dom bus cauldron',
  updates: [
    'structural:data-spw-hero-stage-bound',
    'flourish:data-spw-charge',
    'flourish:data-spw-dropped',
  ],
});

export const spwModule = SPW_MODULE_EXPORT;
