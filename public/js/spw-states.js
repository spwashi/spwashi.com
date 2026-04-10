/**
 * Spw Component States
 * 
 * Implements semantic state machines for Spw components based on operator role,
 * prefix/postfix semantics, and brace polarity.
 */

const SEMANTIC_PHASES = {
    '#>': ['objective', 'neutral', 'subjective'], // Frame: focal points
    '^':  ['source', 'syntax', 'projection'],    // Object: visibility layers
    '?':  ['inquiry', 'observation', 'result'],  // Probe: stages of measurement
    '~':  ['local', 'remote', 'hyper'],          // Ref: proximity
    '@':  ['idle', 'charging', 'committed'],      // Action: lifecycle
    '*':  ['source', 'stream', 'sink'],           // Stream: data flow
    '!':  ['hint', 'constraint', 'pragma']        // Pragma: level of enforcement
};

/**
 * Initialize state machine listeners for stateful components.
 */
export function initSpwStates() {
    document.addEventListener('spw:brace:activate', (e) => {
        const frame = e.target.closest('.site-frame');
        if (!frame) return;

        // If the frame has data-spw-stateful, cycle its semantic phase
        if (frame.hasAttribute('data-spw-stateful')) {
            cycleFramePhase(frame);
        }
    });

    // Provide initial state if missing
    document.querySelectorAll('[data-spw-stateful]').forEach(frame => {
        if (!frame.dataset.spwPhase) {
            frame.dataset.spwPhase = getInitialPhase(frame);
        }
        updateFrameUI(frame);
    });
}

function cycleFramePhase(frame) {
    const op = frame.dataset.spwOperator || '#>';
    const phases = SEMANTIC_PHASES[op] || ['default'];
    const current = frame.dataset.spwPhase || phases[0];
    const nextIndex = (phases.indexOf(current) + 1) % phases.length;
    const next = phases[nextIndex];

    frame.dataset.spwPhase = next;
    
    // Dispatch event for other systems (like Pretext) to react
    frame.dispatchEvent(new CustomEvent('spw:phase:change', {
        detail: { op, phase: next, prev: current }
    }));

    updateFrameUI(frame);
}

function getInitialPhase(frame) {
    const op = frame.dataset.spwOperator || '#>';
    return SEMANTIC_PHASES[op]?.[0] || 'default';
}

function updateFrameUI(frame) {
    const phase = frame.dataset.spwPhase;
    const op = frame.dataset.spwOperator || '#>';
    
    // Update labels or classes
    frame.setAttribute('data-spw-meaning', `state: ${phase}`);
    
    // Determine prefix/postfix based on phase
    // Example: [objective] #> [name] or [source] ^ [syntax]
    const sigil = frame.querySelector('.frame-sigil');
    if (sigil) {
        sigil.setAttribute('data-spw-phase', phase);
        
        // Simple mapping: 
        // first phase is prefix focal, 
        // last phase is postfix focal, 
        // middle is balance.
        const phases = SEMANTIC_PHASES[op] || ['default'];
        const index = phases.indexOf(phase);
        
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

    // Toggle content visibility if the frame has phase-specific panels
    const panels = frame.querySelectorAll('[data-spw-phase-panel]');
    panels.forEach(panel => {
        panel.hidden = panel.getAttribute('data-spw-phase-panel') !== phase;
    });

    // Log to console if available
    const console = document.querySelector('.spw-console');
    if (console) {
        const msg = document.createElement('div');
        msg.className = 'console-log';
        msg.innerHTML = `<span class="log-op">@</span> [phase_shift] <span class="log-meta">${op}</span> transitioned to <span class="log-node">${phase}</span>`;
        console.appendChild(msg);
        console.scrollTop = console.scrollHeight;
    }
}
