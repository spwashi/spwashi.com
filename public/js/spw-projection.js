/**
 * Spw Sequence Projection
 *
 * Implements interactive 'nuanced selection' of braced copy.
 * By selecting a sequence of Spw delimiters, users can project
 * conceptual paths based on their active persona.
 *
 * Interactivity:
 * - Click Delimiter → Add to Sequence
 * - Sequence >= 3 → Trigger Projection
 * - Timeout (5s) → Clear Sequence
 */

import { bus } from './spw-bus.js';

let currentSequence = [];
let lastTimestamp = 0;
const TIMEOUT = 5000;

export function initSpwProjection() {
    document.addEventListener('click', (e) => {
        const delimiter = e.target.closest('.spw-delimiter');
        if (!delimiter) return;

        handleSelection(delimiter);
    });

    // Cleanup stale sequences periodically
    setInterval(() => {
        if (currentSequence.length > 0 && Date.now() - lastTimestamp > TIMEOUT) {
            clearSequence('timeout');
        }
    }, 1000);
}

function handleSelection(el) {
    const now = Date.now();
    
    // Reset if it's been too long
    if (now - lastTimestamp > TIMEOUT) {
        clearSequence('reset');
    }

    lastTimestamp = now;

    if (el.dataset.spwSelection === 'selected') {
        // Toggle off if already selected
        el.removeAttribute('data-spw-selection');
        currentSequence = currentSequence.filter(item => item !== el);
        return;
    }

    el.setAttribute('data-spw-selection', 'selected');
    currentSequence.push(el);

    bus.emit('sequence:selected', { 
        length: currentSequence.length, 
        el,
        content: el.textContent.trim() 
    });

    if (currentSequence.length >= 3) {
        triggerProjection();
    }
}

function triggerProjection() {
    const persona = document.body.dataset.spwPersona || 'baseline';
    const fragments = currentSequence.map(el => el.textContent.trim()).join(' → ');
    
    bus.emit('persona:projected', {
        persona,
        sequence: fragments,
        elements: [...currentSequence]
    });

    // Visual reward for projection
    currentSequence.forEach(el => {
        el.classList.add('spw-delight');
    });

    // Log to console surface
    const consoleSurface = document.querySelector('.spw-console');
    if (consoleSurface) {
        const msg = document.createElement('div');
        msg.className = 'console-log console-log--projection';
        msg.innerHTML = `<span class="log-op">^</span> [projection] `
            + `<span class="log-meta">${persona}</span> :: `
            + `<span class="log-node">${fragments}</span>`;
        consoleSurface.appendChild(msg);
        consoleSurface.scrollTop = consoleSurface.scrollHeight;
    }

    setTimeout(() => clearSequence('complete'), 1000);
}

function clearSequence(reason) {
    currentSequence.forEach(el => {
        el.removeAttribute('data-spw-selection');
        el.classList.remove('spw-delight');
    });
    currentSequence = [];
}
