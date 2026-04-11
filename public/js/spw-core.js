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
 */

import { bus } from './spw-bus.js';
import { groundElement } from './spw-haptics.js';

export function initSpwCore() {
    // Sustained hold on any operator chip or syntax token marks knowledge gained
    bus.on('brace:sustained', (e) => {
        const target = e.target?.closest?.('.operator-chip, .syntax-token, .spw-delimiter, [data-spw-form]');
        if (!target) return;

        const cluster = target.dataset.spwCluster;
        if (cluster) highlightClusterWonder(cluster);

        gainKnowledge(target);
    });

    // LLM / console hook: externally guide attention toward a cluster
    window.spwGuideHuman = (clusterName) => {
        highlightClusterWonder(clusterName);
        console.log(`@ [core] guiding: ${clusterName}`);
    };
}

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
        groundElement(el, { key, text });
    }

    console.log(`@ [core] knowledge: ${key}`);
    bus.emit('core:knowledge', { key, text }, { element: el });
}

export function getKnowledgeMap() {
    return Array.from(
        document.querySelectorAll('[data-spw-knowledge="gained"]')
    ).map(el => el.id || el.textContent.trim());
}
