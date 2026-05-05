/**
 * Spw Interaction Gate
 *
 * Unlocks 'Premium Interaction Semantics' via a passcode-based hash check.
 * The passcode is typically found in blog posts related to hashing and weights.
 *
 * Unlocked features include:
 * - Deeper technical metadata reveals in Scribe@ persona.
 * - Enhanced particle density in Doodler@ canvases.
 * - Accessibility to high-level 'metaphysics' scaffolding.
 */

import { bus } from '/public/js/spw-bus.js';

const PASSCODE_HASH = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'; // sha256 of 'nuanced_weights'

export function initSpwGate() {
    const isUnlocked = localStorage.getItem('spw-semantics-unlocked') === 'true';
    if (isUnlocked) unlock();

    // Listen for manual unlocks (e.g. from a hidden input or console)
    window.spwUnlockSemantics = async (passcode) => {
        const hash = await sha256(passcode);
        if (hash === PASSCODE_HASH) {
            unlock();
            console.log('@ [gate] semantics unlocked. welcome to boonhonk.');
        } else {
            console.error('@ [gate] invalid weight descriptor.');
        }
    };
}

function unlock() {
    localStorage.setItem('spw-semantics-unlocked', 'true');
    document.body.dataset.spwSemantics = 'unlocked';
    bus.emit('gate:unlocked', { status: 'manifest' });
}

async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
