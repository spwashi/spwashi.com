/**
 * Spw Cognitive Core
 *
 * Manages concept clustering, sustained-gesture knowledge gain,
 * and the wonder-accent highlight system.
 *
 * A "knowledge gain" is what happens when sustained attention (the hold
 * threshold) crosses into a concept — the brace threshold of conception
 * into reality. The element that triggered it is marked data-spw-knowledge="gained"
 * and the bus emits 'spell:grounded' to notify the rest of the system.
 *
 * The cluster wonder-accent is a brief, ambient highlight that draws
 * the reader's attention toward conceptually related elements.
 *
 * The reader's cognition setting (cognitiveHandles, off by default) is the
 * switch: with it off a sustained hold is only a hold. The cognitive surface
 * panel (semantic/cognitive-surface.js) mounts with the core so the web it
 * gains is inspectable on the same page.
 */

import { bus } from '/public/js/kernel/bus.js';
import { createSpwLogger, markInstrumented } from '/public/js/kernel/instrumentation.js';
import { getSiteSettings } from '/public/js/kernel/site-settings.js';
import { initCognitiveSurface } from '/public/js/semantic/cognitive-surface.js';

const KNOWLEDGE_TARGET_SELECTOR = [
    '.spw-chip',
    '[data-spw-operator]',
    '.syntax-token',
    '.frame-sigil',
    '.spec-pill',
    '.spw-delimiter',
    '[data-spw-concept]',
    '[data-spw-grounding]',
    '[data-spw-assignment]',
    '[data-spw-reference-seed]',
    '[data-spw-vocab]',
    '[data-spw-topic]',
    '[data-spw-groundable="true"]',
].join(', ');
const logger = createSpwLogger('spw-core');

const cognitionOn = () => getSiteSettings().cognitiveHandles === 'on';

export function initSpwCognitiveCore() {
    // Sustained hold on any operator chip or syntax token marks knowledge gained
    const off = bus.on('brace:sustained', (e) => {
        if (!cognitionOn()) return;
        const target = e.target?.closest?.(KNOWLEDGE_TARGET_SELECTOR);
        if (!target) return;

        const cluster = target.dataset.spwCluster;
        if (cluster) highlightClusterWonder(cluster);

        gainKnowledge(target);
    });

    // LLM / console hook: externally guide attention toward a cluster
    window.spwGuideHuman = (clusterName) => {
        highlightClusterWonder(clusterName);
        logger.info('guiding attention', { clusterName });
    };

    initCognitiveSurface();

    return () => {
        if (typeof off === 'function') off();
        delete window.spwGuideHuman;
    };
}

export const initSpwCore = initSpwCognitiveCore;

function highlightClusterWonder(clusterName) {
    document.querySelectorAll(`[data-spw-cluster="${clusterName}"]`).forEach(el => {
        el.classList.add('spw-wonder-accent');
        setTimeout(() => el.classList.remove('spw-wonder-accent'), 2800);
    });
}

function gainKnowledge(el) {
    if (el.dataset.spwKnowledge === 'gained') return; // idempotent

    el.dataset.spwKnowledge = 'gained';
    el.classList.add('spw-delight'); // triggers CSS burst animation
    setTimeout(() => el.classList.remove('spw-delight'), 600);

    const key  = el.dataset.spwCluster || el.id || el.dataset.spwSigil || el.textContent.trim();
    const text = el.textContent.trim();

    if (el.dataset.spwGrounded !== 'true') {
        // Grounding is the hand's gesture (interface/haptics.js); cognition
        // borrows it when a hold completes rather than importing it at load.
        import('/public/js/interface/haptics.js')
            .then((haptics) => haptics.groundElement(el, { key, text }))
            .catch((error) => logger.warn('grounding failed', { key, error: String(error?.message || error) }));
    }

    markInstrumented(el, 'spw-core', { tags: ['knowledge'] });
    logger.info('knowledge gained', { key });
    bus.emit('core:knowledge', { key, text }, { element: el });
}

export function getKnowledgeMap() {
    return Array.from(
        document.querySelectorAll('[data-spw-knowledge="gained"]')
    ).map(el => el.id || el.textContent.trim());
}
