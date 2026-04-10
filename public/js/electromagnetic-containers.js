/* Charged Paper Container System
 * Containers expose charge states through data attributes and quiet crease cues.
 * Progression: conception → potential → kinetic → manifest
 * Metaphor: charge as cognitive potential, rendered as paper-machine state.
 */

/**
 * Container charge state machine
 * conception → potential → kinetic → manifest
 */
const CHARGE_STATES = ['conception', 'potential', 'kinetic', 'manifest'];
const CHARGE_STATE_MAP = {
    conception: 0,    // abstract, questioning
    potential: 1,     // brewing, potential energy
    kinetic: 2,       // moving, active
    manifest: 3       // realized, expressed
};

/**
 * Slice levels: different perspectives on the same concept
 */
const SLICE_LEVELS = ['conception', 'potential', 'kinetic', 'manifest'];

/**
 * Container manager: handles electromagnetic field effects
 */
class ElectromagneticContainer {
    constructor(element) {
        this.element = element;
        this.charge = element.dataset.charge || 'potential';
        this.slice = element.dataset.containerSlice || 'potential';
        this.fieldIntensity = 0.5;
        this.coherence = 0.8;
        this.resonanceTimer = null;

        this.initEventListeners();
        this.applyInitialState();
    }

    initEventListeners() {
        this.element.addEventListener('mouseenter', () => this.onEnter());
        this.element.addEventListener('mouseleave', () => this.onLeave());
        this.element.addEventListener('focusin', () => this.onFocus());
        this.element.addEventListener('focusout', () => this.onBlur());
        this.element.addEventListener('click', () => this.advanceCharge());
    }

    /**
     * Apply initial charge state and styling
     */
    applyInitialState() {
        this.updateCharge(this.charge);
        this.updateFieldDisplay();
    }

    /**
     * Update charge state with resonance
     */
    updateCharge(newCharge) {
        if (!CHARGE_STATES.includes(newCharge)) {
            console.warn(`Invalid charge state: ${newCharge}`);
            return;
        }

        const oldCharge = this.charge;
        this.charge = newCharge;
        this.element.dataset.charge = newCharge;
        this.element.dataset.chargeIndex = String(CHARGE_STATE_MAP[newCharge]);
        this.element.dataset.chargeLabel = `#{${newCharge}}`;

        // Show transition effect
        if (oldCharge !== newCharge) {
            this.element.dataset.chargeTransitioning = 'true';
            setTimeout(() => {
                delete this.element.dataset.chargeTransitioning;
            }, 800);
        }

        // Emit event for other systems to respond
        document.dispatchEvent(new CustomEvent('electromagnetic:charge-change', {
            detail: {
                element: this.element,
                oldCharge,
                newCharge,
                chargeIndex: CHARGE_STATE_MAP[newCharge]
            }
        }));

        this.updateFieldDisplay();
    }

    /**
     * Advance to next charge state (conception → potential → kinetic → manifest)
     */
    advanceCharge() {
        const currentIndex = CHARGE_STATE_MAP[this.charge];
        if (currentIndex < CHARGE_STATES.length - 1) {
            const nextCharge = CHARGE_STATES[currentIndex + 1];
            this.updateCharge(nextCharge);
        }
    }

    /**
     * Cycle to previous charge state
     */
    retreatCharge() {
        const currentIndex = CHARGE_STATE_MAP[this.charge];
        if (currentIndex > 0) {
            const prevCharge = CHARGE_STATES[currentIndex - 1];
            this.updateCharge(prevCharge);
        }
    }

    /**
     * Jump to specific charge state
     */
    setCharge(charge) {
        this.updateCharge(charge);
    }

    /**
     * Update field intensity and coherence based on interaction
     */
    updateFieldDisplay() {
        // Field intensity based on charge state
        const chargeIndex = CHARGE_STATE_MAP[this.charge];
        this.fieldIntensity = 0.3 + (chargeIndex * 0.2);

        // Coherence increases with charge
        this.coherence = 0.6 + (chargeIndex * 0.08);

        // Apply CSS variables used by the crease/fold surface.
        this.element.style.setProperty('--field-intensity', this.fieldIntensity);
        this.element.style.setProperty('--coherence', this.coherence);
    }

    /**
     * Handle mouse enter: increase field intensity
     */
    onEnter() {
        this.fieldIntensity = Math.min(1, this.fieldIntensity + 0.15);
        this.updateFieldDisplay();
    }

    /**
     * Handle mouse leave: return to base intensity
     */
    onLeave() {
        const chargeIndex = CHARGE_STATE_MAP[this.charge];
        this.fieldIntensity = 0.3 + (chargeIndex * 0.2);
        this.updateFieldDisplay();
    }

    /**
     * Handle focus: increase coherence
     */
    onFocus() {
        this.coherence = Math.min(1, this.coherence + 0.1);
        this.fieldIntensity = Math.min(1, this.fieldIntensity + 0.2);
        this.updateFieldDisplay();
    }

    /**
     * Handle blur: return to normal coherence
     */
    onBlur() {
        const chargeIndex = CHARGE_STATE_MAP[this.charge];
        this.coherence = 0.6 + (chargeIndex * 0.08);
        this.fieldIntensity = 0.3 + (chargeIndex * 0.2);
        this.updateFieldDisplay();
    }

    /**
     * Change perspective slice (conception/potential/kinetic/manifest)
     */
    updateSlice(newSlice) {
        if (!SLICE_LEVELS.includes(newSlice)) {
            console.warn(`Invalid slice: ${newSlice}`);
            return;
        }

        this.slice = newSlice;
        this.element.dataset.containerSlice = newSlice;

        document.dispatchEvent(new CustomEvent('electromagnetic:slice-change', {
            detail: {
                element: this.element,
                slice: newSlice,
                sliceIndex: SLICE_LEVELS.indexOf(newSlice)
            }
        }));
    }
}

/**
 * Field resonance system: containers influence each other
 */
class FieldResonance {
    constructor() {
        this.containers = new Map();
        this.resonanceMap = new Map();
    }

    register(container) {
        this.containers.set(container.element, container);
    }

    /**
     * Create resonance between related containers
     * When one container's charge changes, nearby related containers respond
     */
    createResonance(sourceContainer, targetContainers) {
        const key = sourceContainer.element.id || sourceContainer.element;
        this.resonanceMap.set(key, targetContainers);

        document.addEventListener('electromagnetic:charge-change', (event) => {
            if (event.detail.element === sourceContainer.element) {
                targetContainers.forEach((target) => {
                    if (this.containers.has(target)) {
                        const targetContainer = this.containers.get(target);
                        // Cascade charge advancement
                        if (event.detail.chargeIndex >= 2) {
                            targetContainer.advanceCharge();
                        }
                    }
                });
            }
        });
    }

    /**
     * Create entanglement: containers maintain synchronized state
     */
    entangle(container1, container2) {
        const sync = (source, target) => {
            document.addEventListener('electromagnetic:charge-change', (event) => {
                if (event.detail.element === source) {
                    if (this.containers.has(target)) {
                        const targetContainer = this.containers.get(target);
                        targetContainer.setCharge(event.detail.newCharge);
                    }
                }
            });
        };

        sync(container1.element, container2.element);
        sync(container2.element, container1.element);
    }
}

/**
 * Initialize all electromagnetic containers on the page
 */
const initElectromagneticContainers = () => {
    const resonance = new FieldResonance();
    const containers = new Map();

    // Scan for container elements
    document.querySelectorAll('[data-container-type]').forEach((element) => {
        const container = new ElectromagneticContainer(element);
        containers.set(element, container);
        resonance.register(container);
    });

    // Keyboard navigation for charge cycling. Arrows are reserved for native
    // controls; charge state uses explicit + / - keys when focus is inside.
    document.addEventListener('keydown', (event) => {
        if (!event.target.closest('[data-container-type]')) return;

        const activeContainer = containers.get(event.target.closest('[data-container-type]'));
        if (!activeContainer) return;

        if (event.key === '+' || event.key === '=') {
            event.preventDefault();
            activeContainer.advanceCharge();
        } else if (event.key === '-') {
            event.preventDefault();
            activeContainer.retreatCharge();
        }
    });

    // Global access for programmatic control
    window.ElectromagneticField = {
        containers,
        resonance,
        setCharge: (element, charge) => {
            if (containers.has(element)) {
                containers.get(element).setCharge(charge);
            }
        },
        advanceCharge: (element) => {
            if (containers.has(element)) {
                containers.get(element).advanceCharge();
            }
        },
        getContainer: (element) => containers.get(element)
    };

    // Example: wire frame cards to advance when clicked
    document.querySelectorAll('.frame-card').forEach((card) => {
        card.dataset.containerType = 'frame-card';
        card.dataset.charge = 'potential';
        const container = new ElectromagneticContainer(card);
        containers.set(card, container);
        resonance.register(container);
    });

    // Emit initialization event
    document.dispatchEvent(new CustomEvent('electromagnetic:initialized', {
        detail: { containerCount: containers.size }
    }));
};

/**
 * Integration with site-settings.js
 * Adjust field intensity based on semantic density setting
 */
const hookElectromagneticToSettings = () => {
    document.addEventListener('spw:settings-change', (event) => {
        const { semanticDensity } = event.detail;
        const multiplier = semanticDensity === 'minimal' ? 0.5 : semanticDensity === 'rich' ? 1.5 : 1;

        document.querySelectorAll('[data-container-type]').forEach((element) => {
            const container = window.ElectromagneticField?.containers?.get(element);
            if (container) {
                container.fieldIntensity *= multiplier;
                container.updateFieldDisplay();
            }
        });
    });
};

/**
 * Initialize on DOM ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initElectromagneticContainers();
        hookElectromagneticToSettings();
    });
} else {
    initElectromagneticContainers();
    hookElectromagneticToSettings();
}

export {
    ElectromagneticContainer,
    FieldResonance,
    CHARGE_STATES,
    SLICE_LEVELS,
    initElectromagneticContainers
};
