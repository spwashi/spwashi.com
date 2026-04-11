/**
 * Spw Personas
 *
 * Implements cognitive personas (viewer@, doodler@, scribe@) that modulate
 * the workbench's aesthetic and functional affordances.
 *
 *   viewer@  — Default. Balanced, clean, focused on readability.
 *   doodler@ — Expressive. Extra particles, hand-drawn flourishes, higher delight surge.
 *   scribe@  — Technical. Meta-text reveals, dense information display, monospace anchors.
 */

import { bus } from './spw-bus.js';
import { initPersonaSelector } from './spw-persona-selector.js';

const PERSONAS = ['viewer', 'doodler', 'scribe'];
const STORAGE_KEY = 'spw-active-persona';

export function initSpwPersonas() {
    const active = localStorage.getItem(STORAGE_KEY) || 'viewer';
    applyPersona(active);

    initPersonaSelector();

    // Listen for persona shift requests (from console or settings)
    bus.on('persona:shift', (e) => {
        const next = e.detail?.persona;
        if (PERSONAS.includes(next)) {
            applyPersona(next);
        }
    });

    // Implicit AR: Personas augment hovered concepts
    bus.on('spell:probe', (e) => {
        const persona = document.body.dataset.spwPersona;
        const target  = e.target;
        if (!target || !persona) return;

        if (persona === 'scribe') {
            augmentScribe(target);
        } else if (persona === 'doodler') {
            augmentDoodler(target);
        }
    });

    // Ambient cycle for passive wonder (easter egg)
    bus.on('spirit:peak', () => {
        if (Math.random() > 0.8) {
            console.log('@ [persona] spirit peak detected — suggests doodler@');
        }
    });
}

function augmentScribe(el) {
    const key = el.id || el.textContent.trim();
    el.setAttribute('data-scribe-meta', key);
}

function augmentDoodler(el) {
    // Doodler flourishes are handled via CSS for now, 
    // but JS could add particle bursts here too.
}

function applyPersona(persona) {
    document.body.dataset.spwPersona = persona;
    localStorage.setItem(STORAGE_KEY, persona);
    
    // Broadcast for other components (like spw-wonder.css) to react
    bus.emit('persona:active', { persona });
    console.log(`@ [persona] active: ${persona}@`);
}

/** Global convenience for console users */
window.spwShiftPersona = (persona) => bus.emit('persona:shift', { persona });
