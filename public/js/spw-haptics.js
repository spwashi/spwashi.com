/**
 * Spw Haptics
 * 
 * Implements 'bubble wrap' interaction semantics for concepts and curriculum tokens.
 * Provides synthetic audio 'pops' and tactile visual snapping.
 */

export function initSpwHaptics() {
    // Add tactile effect to common interactive elements
    const popSelectors = '.operator-chip, .syntax-token, .frame-sigil, .spec-pill, .frame-card, .badge, .tag, .pill';
    
    document.addEventListener('click', (e) => {
        const target = e.target.closest(popSelectors);
        if (target) {
            animatePop(target);
            togglePoppedState(target);
        }
    });
}

function animatePop(el) {
    el.classList.add('spw-pop-snap');
    setTimeout(() => el.classList.remove('spw-pop-snap'), 200);
}

function togglePoppedState(el) {
    // Reversible 'bubble wrap' state: marks as 'interacted'
    if (el.dataset.spwPopped === 'true') {
        el.dataset.spwPopped = 'false';
    } else {
        el.dataset.spwPopped = 'true';
    }
}

