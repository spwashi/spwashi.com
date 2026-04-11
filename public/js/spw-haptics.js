/**
 * Spw Haptics — Token Grounding
 *
 * When a concept token is clicked, it "grounds" — moving from probe/inquiry
 * toward the baseline (.) operator. Grounded tokens are semantically settled:
 * encountered, understood, no longer needing to be foregrounded.
 *
 * A second click un-grounds the token, returning it to active inquiry.
 *
 * Bus events emitted:
 *   spell:grounded   { key, text, grounded: true }   — token settled to baseline
 *   spell:ungrounded { key, text, grounded: false }  — token returned to inquiry
 *
 * Bus events consumed:
 *   spell:reset       — clear all grounded state
 *   spell:checkpoint  — save a named snapshot of grounded tokens
 */

import { bus } from './spw-bus.js';

const STORAGE_KEY = 'spw-grounded-registry';
const COUPLING_KEY = (path = window.location.pathname) => `spw-coupling:${path}`;

const GROUND_SELECTORS = '.operator-chip, .syntax-token, .frame-sigil, .spec-pill, .badge, .tag, .pill, [data-spw-groundable="true"]';
const CHARGE_SELECTORS = `${GROUND_SELECTORS}, .frame-card, .frame-panel, .software-card, [data-spw-operator], [data-spw-cluster], [data-spw-form]`;

export function initSpwHaptics() {
    restoreGroundedState();

    document.addEventListener('click', (e) => {
        const target = e.target.closest(GROUND_SELECTORS);
        if (target) {
            animateSettle(target);
            toggleGroundedState(target);
        }
    });

    // Implicit Interactivity: Hover Charge via Bus
    document.addEventListener('mouseover', (e) => {
        const target = e.target.closest(CHARGE_SELECTORS);
        if (target && !target.dataset.spwGrounded) {
            bus.emit('brace:charged', { key: getElementKey(target) }, { element: target });
            bus.emit('spell:probe', { key: getElementKey(target) }, { target });
        }
    });

    document.addEventListener('mouseout', (e) => {
        const target = e.target.closest(CHARGE_SELECTORS);
        if (target && !target.dataset.spwGrounded) {
            bus.emit('brace:discharged', { key: getElementKey(target) }, { element: target });
        }
    });

    bus.on('spell:reset',      resetHaptics);
    bus.on('spell:checkpoint', saveCheckpoint);
}

/** Brief settle animation — the token lands into place */
function animateSettle(el) {
    el.classList.add('spw-pop-snap');
    setTimeout(() => el.classList.remove('spw-pop-snap'), 200);
}

function toggleGroundedState(el) {
    if (el.dataset.spwGrounded === 'true') {
        ungroundElement(el);
        return;
    }

    groundElement(el);
}

function getElementKey(el) {
    return el.id || `${window.location.pathname}:${el.textContent.trim()}`;
}

export function getGroundedRegistry() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function getStoredCouplings() {
    try {
        return JSON.parse(localStorage.getItem(COUPLING_KEY()) || '{}');
    } catch {
        return {};
    }
}

function addToRegistry(key) {
    const registry = getGroundedRegistry();
    if (!registry.includes(key)) {
        registry.push(key);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
    }
}

function removeFromRegistry(key) {
    const registry = getGroundedRegistry();
    const index = registry.indexOf(key);
    if (index > -1) {
        registry.splice(index, 1);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
    }
}

function restoreGroundedState() {
    const registry = getGroundedRegistry();
    const couplings = getStoredCouplings();
    document.querySelectorAll(GROUND_SELECTORS).forEach(el => {
        const key = getElementKey(el);
        if (registry.includes(key)) {
            el.dataset.spwGrounded = 'true';
            const substrate = couplings[key]?.operator;
            if (substrate) el.dataset.spwGroundedIn = substrate;
        }
    });
}

export function groundElement(el, overrides = {}) {
    const key = overrides.key || getElementKey(el);
    const text = overrides.text || el.textContent.trim();
    const substrate = overrides.substrate ?? el.closest('[data-spw-operator]')?.dataset.spwOperator ?? null;

    el.dataset.spwGrounded = 'true';
    if (substrate) {
        el.dataset.spwGroundedIn = substrate;
    } else {
        delete el.dataset.spwGroundedIn;
    }

    addToRegistry(key);
    bus.emit('spell:grounded', { key, text, grounded: true, substrate }, { element: el, target: el });
}

export function ungroundElement(el, overrides = {}) {
    const key = overrides.key || getElementKey(el);
    const text = overrides.text || el.textContent.trim();

    el.dataset.spwGrounded = 'false';
    delete el.dataset.spwGroundedIn;
    removeFromRegistry(key);
    bus.emit('spell:ungrounded', { key, text, grounded: false }, { element: el, target: el });
}

export function resetHaptics() {
    localStorage.removeItem(STORAGE_KEY);
    document.querySelectorAll('[data-spw-grounded="true"]').forEach(el => {
        el.dataset.spwGrounded = 'false';
        delete el.dataset.spwGroundedIn;
    });
}

export function saveCheckpoint(e) {
    const name     = e?.detail?.name || `checkpoint_${Date.now()}`;
    const registry = localStorage.getItem(STORAGE_KEY);
    if (registry) {
        localStorage.setItem(`spw-checkpoint:${name}`, registry);
        console.log(`@ [checkpoint] grounded: ${name}`);
    }
}
