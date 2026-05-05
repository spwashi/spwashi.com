/* Charged Paper Container System
 * Containers expose charge states through data attributes and quiet crease cues.
 * Progression: conception → potential → kinetic → manifest
 * Metaphor: charge as cognitive potential, rendered as paper-machine state.
 */

import { getSiteSettings } from '/public/js/kernel/site-settings.js';

const CHARGE_STATES = ['conception', 'potential', 'kinetic', 'manifest'];
const CHARGE_STATE_MAP = {
    conception: 0,
    potential: 1,
    kinetic: 2,
    manifest: 3,
};

const SLICE_LEVELS = ['conception', 'potential', 'kinetic', 'manifest'];

let initialized = false;
let cleanupCurrent = null;

class ElectromagneticContainer {
    constructor(element) {
        this.element = element;
        this.charge = element.dataset.charge || 'potential';
        this.slice = element.dataset.containerSlice || 'potential';
        this.fieldIntensity = 0.5;
        this.coherence = 0.8;
        this.semanticDensityMultiplier = 1;
        this.isHovered = false;
        this.isFocused = false;

        this.onEnter = this.onEnter.bind(this);
        this.onLeave = this.onLeave.bind(this);
        this.onFocus = this.onFocus.bind(this);
        this.onBlur = this.onBlur.bind(this);
        this.onClick = this.onClick.bind(this);

        this.initEventListeners();
        this.applyInitialState();
    }

    initEventListeners() {
        this.element.addEventListener('mouseenter', this.onEnter);
        this.element.addEventListener('mouseleave', this.onLeave);
        this.element.addEventListener('focusin', this.onFocus);
        this.element.addEventListener('focusout', this.onBlur);
        this.element.addEventListener('click', this.onClick);
    }

    destroy() {
        this.element.removeEventListener('mouseenter', this.onEnter);
        this.element.removeEventListener('mouseleave', this.onLeave);
        this.element.removeEventListener('focusin', this.onFocus);
        this.element.removeEventListener('focusout', this.onBlur);
        this.element.removeEventListener('click', this.onClick);
    }

    applyInitialState() {
        this.updateCharge(this.charge);
        this.updateFieldDisplay();
    }

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

        if (oldCharge !== newCharge) {
            this.element.dataset.chargeTransitioning = 'true';
            window.setTimeout(() => {
                delete this.element.dataset.chargeTransitioning;
            }, 800);
        }

        document.dispatchEvent(new CustomEvent('electromagnetic:charge-change', {
            detail: {
                element: this.element,
                oldCharge,
                newCharge,
                chargeIndex: CHARGE_STATE_MAP[newCharge],
            },
        }));

        this.updateFieldDisplay();
    }

    advanceCharge() {
        const currentIndex = CHARGE_STATE_MAP[this.charge];
        if (currentIndex < CHARGE_STATES.length - 1) {
            const nextCharge = CHARGE_STATES[currentIndex + 1];
            this.updateCharge(nextCharge);
        }
    }

    retreatCharge() {
        const currentIndex = CHARGE_STATE_MAP[this.charge];
        if (currentIndex > 0) {
            const prevCharge = CHARGE_STATES[currentIndex - 1];
            this.updateCharge(prevCharge);
        }
    }

    setCharge(charge) {
        this.updateCharge(charge);
    }

    updateFieldDisplay() {
        const chargeIndex = CHARGE_STATE_MAP[this.charge];
        const baseFieldIntensity = 0.3 + (chargeIndex * 0.2);
        const baseCoherence = 0.6 + (chargeIndex * 0.08);
        const interactionFieldBoost = (this.isHovered ? 0.15 : 0) + (this.isFocused ? 0.2 : 0);
        const interactionCoherenceBoost = this.isFocused ? 0.1 : 0;

        this.fieldIntensity = Math.min(
            1,
            (baseFieldIntensity * this.semanticDensityMultiplier) + interactionFieldBoost
        );
        this.coherence = Math.min(1, baseCoherence + interactionCoherenceBoost);

        this.element.style.setProperty('--field-intensity', this.fieldIntensity);
        this.element.style.setProperty('--coherence', this.coherence);
    }

    onEnter() {
        this.isHovered = true;
        this.updateFieldDisplay();
    }

    onLeave() {
        this.isHovered = false;
        this.updateFieldDisplay();
    }

    onFocus() {
        this.isFocused = true;
        this.updateFieldDisplay();
    }

    onBlur() {
        this.isFocused = false;
        this.updateFieldDisplay();
    }

    onClick() {
        this.advanceCharge();
    }

    setSemanticDensityMultiplier(multiplier = 1) {
        this.semanticDensityMultiplier = multiplier;
        this.updateFieldDisplay();
    }

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
                sliceIndex: SLICE_LEVELS.indexOf(newSlice),
            },
        }));
    }
}

class FieldResonance {
    constructor() {
        this.containers = new WeakMap();
        this.resonanceMap = new Map();
        this.chargeListeners = [];
    }

    register(container) {
        this.containers.set(container.element, container);
    }

    createResonance(sourceContainer, targetElements) {
        const key = sourceContainer.element.id || sourceContainer.element;
        this.resonanceMap.set(key, targetElements);

        const listener = (event) => {
            if (event.detail.element !== sourceContainer.element) return;

            targetElements.forEach((targetElement) => {
                const targetContainer = this.containers.get(targetElement);
                if (!targetContainer) return;
                if (event.detail.chargeIndex >= 2) {
                    targetContainer.advanceCharge();
                }
            });
        };

        document.addEventListener('electromagnetic:charge-change', listener);
        this.chargeListeners.push(listener);
    }

    entangle(container1, container2) {
        const sync = (sourceElement, targetElement) => {
            const listener = (event) => {
                if (event.detail.element !== sourceElement) return;
                const targetContainer = this.containers.get(targetElement);
                if (!targetContainer) return;
                targetContainer.setCharge(event.detail.newCharge);
            };

            document.addEventListener('electromagnetic:charge-change', listener);
            this.chargeListeners.push(listener);
        };

        sync(container1.element, container2.element);
        sync(container2.element, container1.element);
    }

    destroy() {
        this.chargeListeners.forEach((listener) => {
            document.removeEventListener('electromagnetic:charge-change', listener);
        });
        this.chargeListeners = [];
        this.resonanceMap.clear();
    }
}

export function initElectromagneticContainers(root = document) {
    if (initialized) {
        return cleanupCurrent || (() => {});
    }

    initialized = true;

    const resonance = new FieldResonance();
    const containers = new WeakMap();
    const containerList = [];

    root.querySelectorAll('[data-container-type]').forEach((element) => {
        const container = new ElectromagneticContainer(element);
        containers.set(element, container);
        containerList.push(container);
        resonance.register(container);
    });

    root.querySelectorAll('.frame-card').forEach((card) => {
        if (!card.dataset.containerType) card.dataset.containerType = 'frame-card';
        if (!card.dataset.charge) card.dataset.charge = 'potential';

        if (containers.get(card)) return;

        const container = new ElectromagneticContainer(card);
        containers.set(card, container);
        containerList.push(container);
        resonance.register(container);
    });

    const keydownHandler = (event) => {
        const target = event.target instanceof Element
            ? event.target.closest('[data-container-type]')
            : null;

        if (!target) return;

        const activeContainer = containers.get(target);
        if (!activeContainer) return;

        if (event.key === '+' || event.key === '=') {
            event.preventDefault();
            activeContainer.advanceCharge();
        } else if (event.key === '-') {
            event.preventDefault();
            activeContainer.retreatCharge();
        }
    };

    const applySemanticDensity = (semanticDensity = 'normal') => {
        const multiplier = semanticDensity === 'minimal'
            ? 0.5
            : semanticDensity === 'rich'
                ? 1.5
                : 1;

        containerList.forEach((container) => {
            container.setSemanticDensityMultiplier(multiplier);
        });
    };

    const settingsHandler = (event) => {
        applySemanticDensity(event.detail?.semanticDensity);
    };

    document.addEventListener('keydown', keydownHandler);
    document.addEventListener('spw:settings-change', settingsHandler);

    applySemanticDensity(getSiteSettings().semanticDensity);

    window.ElectromagneticField = {
        resonance,
        setCharge: (element, charge) => {
            const container = containers.get(element);
            if (container) container.setCharge(charge);
        },
        advanceCharge: (element) => {
            const container = containers.get(element);
            if (container) container.advanceCharge();
        },
        getContainer: (element) => containers.get(element),
    };

    document.dispatchEvent(new CustomEvent('electromagnetic:initialized', {
        detail: { containerCount: containerList.length },
    }));

    cleanupCurrent = () => {
        document.removeEventListener('keydown', keydownHandler);
        document.removeEventListener('spw:settings-change', settingsHandler);

        resonance.destroy();
        containerList.forEach((container) => container.destroy());

        if (window.ElectromagneticField?.resonance === resonance) {
            delete window.ElectromagneticField;
        }

        cleanupCurrent = null;
        initialized = false;
    };

    return cleanupCurrent;
}