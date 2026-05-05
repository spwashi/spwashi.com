/**
 * Spw Cognitive Guide
 *
 * Lifetime-safe version:
 * - returns teardown
 * - unsubscribes bus handlers
 * - aborts DOM listeners
 */

import { bus } from '/public/js/kernel/spw-bus.js';
import { getGroundedRegistry } from '/public/js/interface/spw-haptics.js';
import { getSiteSettings } from '/public/js/kernel/site-settings.js';

const SCAFFOLD_MAP = {
    'software:Schedulers': ['pretext-probe-frame', 'browser-frame'],
    'software:Compression': ['lattices-frame', 'parsers-frame'],
    'software:Spw': ['spw-syntax-surface', 'spw-grammar-surface'],
    'about:Land Cluster': ['flow-magic', 'concept-register'],
};

const GUIDED_COMPONENT_SELECTOR = [
    '.site-frame',
    '.frame-panel',
    '.frame-card',
    '.software-card',
    '.operator-card',
    '.mode-panel',
].join(', ');

const GUIDED_SELECTOR = `${GUIDED_COMPONENT_SELECTOR}[data-spw-guided="true"]`;
const isGuidanceEnabled = () => getSiteSettings().cognitiveHandles === 'on';

let initialized = false;
let currentCleanup = null;

function getActiveGuideKeys() {
    return uniqueValues([
        ...getGroundedRegistry(),
        ...getGroundedClusters(),
    ]);
}

function clearGuidance() {
    document.querySelectorAll(GUIDED_SELECTOR).forEach((element) => {
        restoreGuidanceState(element);
    });
}

function guideElement(element, reason) {
    if (!element || element.dataset.spwGuided === 'true') return;

    applyGuidanceState(element, reason);
}

function guideBySubstrate() {
    getActiveSubstrates().forEach((substrate) => {
        getSubstrateCandidates(substrate)
            .slice(0, 3)
            .forEach((element) => {
                guideElement(element, `${substrate} substrate`);
            });
    });
}

function createUpdater() {
    return function updateScaffolding() {
        clearGuidance();
        if (!isGuidanceEnabled()) return;

        const registry = getActiveGuideKeys();

        registry.forEach((key) => {
            (SCAFFOLD_MAP[key] || []).forEach((id) => {
                guideElement(document.getElementById(id), key);
            });
        });

        guideBySubstrate();
    };
}

function uniqueValues(values = []) {
    return Array.from(new Set(values.filter(Boolean)));
}

function getGroundedClusters() {
    return Array.from(document.querySelectorAll('[data-spw-grounded="true"][data-spw-cluster]'))
        .map((element) => element.dataset.spwCluster)
        .filter(Boolean);
}

function getActiveSubstrates() {
    return uniqueValues(
        Array.from(document.querySelectorAll('[data-spw-grounded="true"][data-spw-grounded-in]'))
            .map((element) => element.dataset.spwGroundedIn)
    );
}

function getSubstrateCandidates(substrate) {
    const selector = [
        `.site-frame[data-spw-substrate="${substrate}"]`,
        `.frame-panel[data-spw-substrate="${substrate}"]`,
        `.frame-card[data-spw-substrate="${substrate}"]`,
    ].join(', ');

    return Array.from(document.querySelectorAll(selector))
        .filter((element) => element.dataset.spwRealization !== 'realized');
}

function applyGuidanceState(element, reason) {
    const meta = element.querySelector('.spw-component-meta');

    element.dataset.spwGuidePreviousLiminality = element.dataset.spwLiminality || '';
    element.dataset.spwGuided = 'true';
    element.dataset.spwGuideReason = reason;
    element.dataset.spwLiminality = 'threshold';

    if (meta) meta.dataset.spwGuideReason = reason;
}

function restoreGuidanceState(element) {
    const previous = element.dataset.spwGuidePreviousLiminality;
    const meta = element.querySelector('.spw-component-meta');

    if (previous !== undefined) {
        if (previous) element.dataset.spwLiminality = previous;
        else delete element.dataset.spwLiminality;
    }

    delete element.dataset.spwGuidePreviousLiminality;
    delete element.dataset.spwGuided;
    delete element.dataset.spwGuideReason;

    if (meta) delete meta.dataset.spwGuideReason;
}

export function initSpwGuide() {
    if (initialized) {
        return currentCleanup || (() => {});
    }

    initialized = true;

    const updateScaffolding = createUpdater();
    const abortController = new AbortController();
    const offs = [
        bus.on('spell:grounded', updateScaffolding),
        bus.on('spell:ungrounded', updateScaffolding),
        bus.on('spell:reset', updateScaffolding),
    ];

    document.addEventListener('spw:settings-change', updateScaffolding, { signal: abortController.signal });
    document.addEventListener('spw:component-semantics-ready', updateScaffolding, { signal: abortController.signal });

    updateScaffolding();

    currentCleanup = () => {
        abortController.abort();
        offs.forEach((off) => {
            try {
                off?.();
            } catch (error) {
                console.warn('[SpwGuide] Failed to unsubscribe.', error);
            }
        });
        clearGuidance();
        initialized = false;
        currentCleanup = null;
    };

    return currentCleanup;
}
