/**
 * spw-hero-kinetic-stage.js
 * --------------------------------------------------------------------------
 * Interactive runtime driver for the kinetic Spw hero stage: slide navigation,
 * node physics animations, payload scrubbing, and cauldron drop triggers.
 * ========================================================================== */

import { writeDatasetValue } from '/public/js/kernel/dom-contracts.js';

export function initSpwHeroKineticStage(root = document) {
  const stages = root.querySelectorAll?.('[data-spw-feature="spw-hero-kinetic-stage"], .spw-hero-stage');
  if (!stages || !stages.length) return;

  stages.forEach((stage) => {
    if (stage.dataset.spwHeroStageBound) return;
    stage.dataset.spwHeroStageBound = 'true';

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
      });
    });

    if (prevBtn) {
      prevBtn.addEventListener('click', () => goToSlide(activeIndex - 1));
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => goToSlide(activeIndex + 1));
    }

    // Node interaction & Cauldron drop triggers
    stage.querySelectorAll('.spw-kinetic-node').forEach((node) => {
      node.addEventListener('click', () => {
        node.style.transform = 'translateY(-6px) scale(1.1)';
        setTimeout(() => {
          node.style.transform = '';
        }, 220);

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

          const originalText = node.textContent;
          node.textContent = '✓ Dropped into Cauldron!';
          setTimeout(() => {
            node.textContent = originalText;
          }, 1400);
        }
      });
    });
  });
}
