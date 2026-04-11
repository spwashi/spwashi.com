/**
 * Spw Haptics
 * 
 * Implements 'bubble wrap' interaction semantics for concepts and curriculum tokens.
 * Provides synthetic audio 'pops' and tactile visual snapping.
 */

let audioCtx = null;

export function initSpwHaptics() {
    // Add pop effect to common interactive elements
    const popSelectors = '.operator-chip, .syntax-token, .frame-sigil, .spec-pill, .frame-card';
    
    document.addEventListener('click', (e) => {
        const target = e.target.closest(popSelectors);
        if (target) {
            playPopSound();
            animatePop(target);
            togglePoppedState(target);
        }
    });
}

function playPopSound() {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        // High frequency "pop" profile
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
    } catch (e) {
        // Silent fail if AudioContext is blocked
    }
}

function animatePop(el) {
    el.classList.add('spw-pop-snap');
    setTimeout(() => el.classList.remove('spw-pop-snap'), 200);
}

function togglePoppedState(el) {
    // Reversible 'bubble wrap' state
    if (el.dataset.spwPopped === 'true') {
        el.dataset.spwPopped = 'false';
        el.style.setProperty('--pop-intensity', '0');
    } else {
        el.dataset.spwPopped = 'true';
        el.style.setProperty('--pop-intensity', '1');
    }
}
