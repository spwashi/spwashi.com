/**
 * Spw Component States
 *
 * Implements semantic phase state machines for Spw components.
 * Each operator type cycles through its own phase sequence when activated.
 *
 * Listens for:  bus 'brace:activated'
 * Emits:        bus 'operator:phased' (on the frame element)
 *
 * Phase sequences per operator:
 *   #>  frame   → objective  → neutral   → subjective
 *   ^   object  → source     → syntax    → projection
 *   ?   probe   → inquiry    → observation → result
 *   ~   ref     → local      → remote    → hyper
 *   @   action  → idle       → charging  → committed
 *   *   stream  → source     → stream    → sink
 *   !   pragma  → hint       → constraint → pragma
 */

import { bus } from './spw-bus.js';

const SEMANTIC_PHASES = Object.freeze({
    'frame':   ['objective', 'neutral',     'subjective'],
    'object':  ['source',    'syntax',      'projection'],
    'probe':   ['inquiry',   'observation', 'result'],
    'ref':     ['local',     'remote',      'hyper'],
    'action':  ['idle',      'charging',    'committed'],
    'stream':  ['source',    'stream',      'sink'],
    'pragma':  ['hint',      'constraint',  'pragma'],
});

// Charge levels that correspond to each phase position (prefix/mid/postfix)
const PHASE_CHARGE = [0.30, 0.65, 0.90];

export function initSpwStates() {
    // Phase cycle on brace activation inside a stateful frame
    bus.on('brace:activated', (e) => {
        const frame = e.target?.closest?.('.site-frame');
        if (frame?.hasAttribute('data-spw-stateful')) {
            cycleFramePhase(frame);
        }
    });

    // Set initial phase for all stateful components
    document.querySelectorAll('[data-spw-stateful]').forEach(frame => {
        if (!frame.dataset.spwPhase) {
            frame.dataset.spwPhase = getInitialPhase(frame);
        }
        updateFrameUI(frame);
    });
}

function cycleFramePhase(frame) {
    const opType = frame.dataset.spwOperator || 'frame';
    const phases = SEMANTIC_PHASES[opType] ?? ['default'];
    const curr   = frame.dataset.spwPhase || phases[0];
    const next   = phases[(phases.indexOf(curr) + 1) % phases.length];

    frame.dataset.spwPhase = next;

    // Write charge level for the new phase
    const phaseIndex = phases.indexOf(next);
    const chargeLevel = PHASE_CHARGE[phaseIndex] ?? 0.5;
    frame.style.setProperty('--charge', chargeLevel);

    bus.emit('operator:phased',
        { op: opType, phase: next, prev: curr, charge: chargeLevel },
        { target: frame, element: frame }
    );

    updateFrameUI(frame);
}

function getInitialPhase(frame) {
    const opType = frame.dataset.spwOperator || 'frame';
    return SEMANTIC_PHASES[opType]?.[0] ?? 'default';
}

function updateFrameUI(frame) {
    const phase  = frame.dataset.spwPhase;
    const opType = frame.dataset.spwOperator || 'frame';
    const phases = SEMANTIC_PHASES[opType] ?? ['default'];
    const index  = phases.indexOf(phase);

    frame.setAttribute('data-spw-meaning', `state: ${phase}`);

    const sigil = frame.querySelector('.frame-sigil');
    if (sigil) {
        sigil.setAttribute('data-spw-phase', phase);
        if (index === 0) {
            sigil.setAttribute('data-spw-phase-prefix', phase);
            sigil.removeAttribute('data-spw-phase-postfix');
        } else if (index === phases.length - 1) {
            sigil.removeAttribute('data-spw-phase-prefix');
            sigil.setAttribute('data-spw-phase-postfix', phase);
        } else {
            sigil.setAttribute('data-spw-phase-prefix', '·');
            sigil.setAttribute('data-spw-phase-postfix', '·');
        }
    }

    // Show/hide phase-specific panels
    frame.querySelectorAll('[data-spw-phase-panel]').forEach(panel => {
        panel.hidden = panel.getAttribute('data-spw-phase-panel') !== phase;
    });

    // Log to console surface if present
    const consoleSurface = document.querySelector('.spw-console');
    if (consoleSurface) {
        const msg = document.createElement('div');
        msg.className = 'console-log';
        msg.innerHTML = `<span class="log-op">@</span> [phase] `
            + `<span class="log-meta">${opType}</span> → `
            + `<span class="log-node">${phase}</span>`;
        consoleSurface.appendChild(msg);
        consoleSurface.scrollTop = consoleSurface.scrollHeight;
    }
}
