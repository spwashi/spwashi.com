/* Spirit Phase Dynamics
 * Manages the current spirit phase, auto-cycling, and phase-specific interactions
 * Connects to site-settings.js for persistent phase preference
 */

import { getSiteSettings, saveSiteSettings } from './site-settings.js';

const PHASES = ['initiation', 'resistance', 'transformation', 'expression', 'return'];
const PHASE_DURATION = 9000; // 9 seconds per phase when auto-cycling
const PHASE_SIGILS = Object.freeze({
    initiation: '?{initiation}',
    resistance: '!{resistance}',
    transformation: '*{transformation}',
    expression: '@{expression}',
    return: '~{return}'
});

let phaseAutoCycleTimer = null;

/**
 * Apply the current spirit phase to the document
 */
const applySpiritPhase = (phase) => {
    const root = document.documentElement;
    root.dataset.spwSpiritPhase = phase;

    // Emit event so other components can respond to phase changes
    document.dispatchEvent(new CustomEvent('spw:phase-change', {
        detail: { phase, index: PHASES.indexOf(phase) }
    }));
};

const phaseSigil = (phase) => PHASE_SIGILS[phase] || `~{${phase}}`;

/**
 * Get the next phase in the cycle
 */
const getNextPhase = (currentPhase) => {
    const index = PHASES.indexOf(currentPhase);
    return PHASES[(index + 1) % PHASES.length];
};

/**
 * Get the previous phase in the cycle
 */
const getPreviousPhase = (currentPhase) => {
    const index = PHASES.indexOf(currentPhase);
    return PHASES[(index - 1 + PHASES.length) % PHASES.length];
};

/**
 * Cycle to the next phase
 */
const cycleToNextPhase = () => {
    const settings = getSiteSettings();
    const currentPhase = settings.currentSpiritPhase;
    const nextPhase = getNextPhase(currentPhase);

    saveSiteSettings({ currentSpiritPhase: nextPhase });
    applySpiritPhase(nextPhase);
};

/**
 * Cycle to the previous phase
 */
const cycleToPreviousPhase = () => {
    const settings = getSiteSettings();
    const currentPhase = settings.currentSpiritPhase;
    const previousPhase = getPreviousPhase(currentPhase);

    saveSiteSettings({ currentSpiritPhase: previousPhase });
    applySpiritPhase(previousPhase);
};

/**
 * Start auto-cycling through phases
 */
const startPhaseCycle = () => {
    if (phaseAutoCycleTimer) return; // Already cycling

    phaseAutoCycleTimer = setInterval(() => {
        cycleToNextPhase();
    }, PHASE_DURATION);
};

/**
 * Stop auto-cycling
 */
const stopPhaseCycle = () => {
    if (phaseAutoCycleTimer) {
        clearInterval(phaseAutoCycleTimer);
        phaseAutoCycleTimer = null;
    }
};

/**
 * Jump to a specific phase
 */
const jumpToPhase = (phaseName) => {
    if (!PHASES.includes(phaseName)) {
        console.warn(`Invalid phase: ${phaseName}`);
        return;
    }

    saveSiteSettings({ currentSpiritPhase: phaseName });
    applySpiritPhase(phaseName);
};

/**
 * Initialize spirit phase from settings and apply auto-cycling if enabled
 */
const initSpiritPhase = () => {
    const settings = getSiteSettings();

    applySpiritPhase(settings.currentSpiritPhase);

    if (settings.spiritPhaseAutoCycle === 'on') {
        startPhaseCycle();
    }
};

/**
 * Listen for settings changes to update phase cycling
 */
const setupSettingsListener = () => {
    document.addEventListener('spw:settings-change', (event) => {
        const { spiritPhaseAutoCycle } = event.detail;

        if (spiritPhaseAutoCycle === 'on') {
            startPhaseCycle();
        } else {
            stopPhaseCycle();
        }
    });
};

/**
 * Make frames and major structures interactive with dimensional navigation
 * Add phase indicators and interactive affordances
 */
const makeStructuresInteractive = () => {
    // Add braced phase menus to frame headings. The control is explicit:
    // it opens a layer choice instead of making the whole frame react to arrows.
    const phaseMenuUpdaters = [];

    document.querySelectorAll('.frame-heading, .site-frame > div:first-child').forEach((heading) => {
        const frame = heading.closest('.site-frame');
        if (!frame) return;

        // Check if phase controls already exist
        if (heading.querySelector('[data-phase-cycle]')) return;

        const phaseControls = document.createElement('details');
        phaseControls.className = 'phase-controls phase-menu';
        phaseControls.setAttribute('data-phase-cycle', 'true');
        phaseControls.dataset.phaseMenuState = 'closed';
        phaseControls.setAttribute('aria-label', 'Spirit phase layer menu');

        const trigger = document.createElement('summary');
        trigger.className = 'phase-menu-trigger';
        trigger.setAttribute('data-op', 'ref');
        trigger.setAttribute('aria-label', 'Open spirit phase layer menu');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.textContent = phaseSigil(getSiteSettings().currentSpiritPhase);

        const menu = document.createElement('div');
        menu.className = 'phase-menu-options';
        menu.setAttribute('role', 'group');
        menu.setAttribute('aria-label', 'Choose spirit phase');

        PHASES.forEach((phase) => {
            const choice = document.createElement('button');
            choice.className = 'phase-menu-choice';
            choice.type = 'button';
            choice.dataset.phaseChoice = phase;
            choice.dataset.op = 'probe';
            choice.textContent = phaseSigil(phase);
            choice.setAttribute('aria-label', `Set spirit phase to ${phase}`);
            choice.addEventListener('click', () => {
                jumpToPhase(phase);
                phaseControls.removeAttribute('open');
            });
            menu.appendChild(choice);
        });

        const updatePhaseMenu = (phase) => {
            trigger.textContent = phaseSigil(phase);
            menu.querySelectorAll('[data-phase-choice]').forEach((choice) => {
                choice.setAttribute('aria-pressed', String(choice.dataset.phaseChoice === phase));
            });
        };

        phaseControls.addEventListener('toggle', () => {
            const open = phaseControls.open;
            phaseControls.dataset.phaseMenuState = open ? 'open' : 'closed';
            trigger.setAttribute('aria-expanded', String(open));
        });

        updatePhaseMenu(getSiteSettings().currentSpiritPhase);
        phaseMenuUpdaters.push(updatePhaseMenu);

        phaseControls.appendChild(trigger);
        phaseControls.appendChild(menu);
        heading.appendChild(phaseControls);
    });

    if (phaseMenuUpdaters.length) {
        document.addEventListener('spw:phase-change', (event) => {
            phaseMenuUpdaters.forEach((updatePhaseMenu) => updatePhaseMenu(event.detail.phase));
        });
    }

    // Add interactive affordances to frames
    document.querySelectorAll('.site-frame').forEach((frame) => {
        if (frame.hasAttribute('data-interactive')) return;

        frame.setAttribute('data-interactive', 'frame');
        frame.setAttribute('role', 'region');

        frame.dataset.layerAffordance = 'phase-menu';
    });

    // Make frame cards interactive with drill-down potential
    document.querySelectorAll('.frame-card').forEach((card) => {
        if (card.hasAttribute('data-interactive')) return;

        card.setAttribute('data-interactive', 'card');
        card.setAttribute('role', 'article');
        card.setAttribute('tabindex', '0');

        // Add keyboard activation for links
        card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                const link = card.querySelector('a');
                if (link) {
                    event.preventDefault();
                    link.click();
                }
            }
        });
    });

    // Make operator chips interactive with context revelation
    document.querySelectorAll('[data-op]').forEach((opElement) => {
        if (opElement.closest('a, button')) return; // Already interactive

        opElement.setAttribute('role', 'button');
        opElement.setAttribute('tabindex', '0');

        opElement.addEventListener('click', () => {
            const phase = getSiteSettings().currentSpiritPhase;
            document.dispatchEvent(new CustomEvent('spw:operator-activated', {
                detail: { operator: opElement.getAttribute('data-op'), phase }
            }));
        });

        opElement.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                opElement.click();
            }
        });
    });
};

/**
 * Initialize on DOM ready
 */
const init = () => {
    initSpiritPhase();
    setupSettingsListener();
    makeStructuresInteractive();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export {
    cycleToNextPhase,
    cycleToPreviousPhase,
    startPhaseCycle,
    stopPhaseCycle,
    jumpToPhase,
    applySpiritPhase,
    getNextPhase,
    getPreviousPhase,
    PHASES
};
