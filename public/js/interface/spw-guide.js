/**
 * Spw Cognitive Guide
 *
 * Lifetime-safe version:
 * - returns teardown
 * - unsubscribes bus handlers
 * - aborts DOM listeners
 */

import { bus } from '/public/js/spw-bus.js';
import { getGroundedRegistry } from '/public/js/spw-haptics.js';
import { getSiteSettings } from '/public/js/site-settings.js';

const SCAFFOLD_MAP = {
    'software:Schedulers': ['pretext-probe-frame', 'browser-frame'],
    'software:Compression': ['lattices-frame', 'parsers-frame'],
    'software:Spw': ['spw-syntax-surface', 'spw-grammar-surface'],
    'about:Land Cluster': ['flow-magic', 'concept-register'],
};

const GUIDED_SELECTOR = '[data-spw-guided="true"]';
const isGuidanceEnabled = () => getSiteSettings().cognitiveHandles === 'on';

let initialized = false;
let currentCleanup = null;

function getActiveGuideKeys() {
    const keys = new Set(getGroundedRegistry());

    document.querySelectorAll('[data-spw-grounded="true"][data-spw-cluster]').forEach((element) => {
        if (element.dataset.spwCluster) keys.add(element.dataset.spwCluster);
    });

    return Array.from(keys);
}

function clearGuidance() {
    document.querySelectorAll(GUIDED_SELECTOR).forEach((element) => {
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
    });
}

function guideElement(element, reason) {
    if (!element || element.dataset.spwGuided === 'true') return;

    const meta = element.querySelector('.spw-component-meta');

    element.dataset.spwGuidePreviousLiminality = element.dataset.spwLiminality || '';
    element.dataset.spwGuided = 'true';
    element.dataset.spwGuideReason = reason;
    element.dataset.spwLiminality = 'threshold';

    if (meta) meta.dataset.spwGuideReason = reason;
}

function guideBySubstrate() {
    const activeSubstrates = new Set(
        Array.from(document.querySelectorAll('[data-spw-grounded="true"][data-spw-grounded-in]'))
            .map((element) => element.dataset.spwGroundedIn)
            .filter(Boolean)
    );

    activeSubstrates.forEach((substrate) => {
        const selector = [
            `.site-frame[data-spw-substrate="${substrate}"]`,
            `.frame-panel[data-spw-substrate="${substrate}"]`,
            `.frame-card[data-spw-substrate="${substrate}"]`,
        ].join(', ');

        const candidates = Array.from(document.querySelectorAll(selector))
            .filter((element) => element.dataset.spwRealization !== 'realized');

        candidates.slice(0, 3).forEach((element) => {
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
