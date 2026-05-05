/**
 * Spw Smart Console
 *
 * Renders local, inspectable smart components from two sources:
 * - current knowledge clusters in the lattice
 * - persisted coupling traces for the current page
 *
 * The goal is not prediction for its own sake. The cards should explain what
 * the page is currently asking the reader to do: which substrate dominates,
 * whether the trace is conceptual or realized, and what phrasing is active.
 */

import { getKnowledgeMap } from '/public/js/spw-core.js';
import { getGroundedRegistry } from '/public/js/spw-haptics.js';
import { LATTICE } from '/public/js/spw-lattice.js';
import { getSiteSettings } from '/public/js/site-settings.js';
import { getCouplingMap, getCurrentPageMetadata } from '/public/js/spw-cognitive-surface.js';

const escapeHtml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export function initSpwSmart() {
    renderSmartConsole();
    updateSmartSpwBlock();

    [
        'spw:core:knowledge',
        'spw:spell:grounded',
        'spw:spell:ungrounded',
        'spw:settings-change',
        'spw:component-semantics-ready'
    ].forEach((eventName) => {
        document.addEventListener(eventName, () => {
            renderSmartConsole();
            updateSmartSpwBlock();
        });
    });
}

function getSmartHost() {
    let container = document.getElementById('spw-smart-console');
    if (!container) {
        container = document.createElement('div');
        container.id = 'spw-smart-console';
        container.className = 'spw-smart-console-host';
        document.body.appendChild(container);
    }
    return container;
}

function groupKnowledgeByCluster(knowledge) {
    const clusters = {};
    const clusterMap = {};

    Object.entries(LATTICE).forEach(([category, data]) => {
        clusterMap[category] = category;
        (data.principles || []).forEach((principle) => {
            clusterMap[principle] = category;
        });
        (data.parallels || []).forEach((parallel) => {
            clusterMap[parallel] = category;
        });
        (data.clusters || []).forEach((cluster) => {
            clusterMap[cluster] = category;
        });
    });

    knowledge.forEach((key) => {
        const cluster = clusterMap[key]
            || clusterMap[Object.keys(clusterMap).find((candidate) => candidate.endsWith(`:${key}`)) || '']
            || 'general';
        clusters[cluster] ||= [];
        clusters[cluster].push(key);
    });

    return clusters;
}

function dominantValue(items, key, fallback) {
    const counts = new Map();

    items.forEach((item) => {
        const value = item[key] || fallback;
        counts.set(value, (counts.get(value) || 0) + 1);
    });

    return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0] || fallback;
}

function getActiveCouplings() {
    const registry = new Set(getGroundedRegistry());
    return Object.entries(getCouplingMap())
        .filter(([key]) => registry.has(key))
        .map(([key, entry]) => ({ key, ...entry }));
}

function buildTraceCards() {
    const couplings = getActiveCouplings();
    if (!couplings.length) return [];

    const pageMeta = getCurrentPageMetadata();
    const conceptual = couplings.filter((entry) => entry.realization === 'conceptual').length;
    const realized = couplings.filter((entry) => entry.realization === 'realized').length;
    const hybrid = couplings.length - conceptual - realized;
    const dominantSubstrate = dominantValue(couplings, 'operator', 'baseline');
    const dominantPhrase = dominantValue(couplings, 'phrase', 'context');

    const cards = [{
        operator: dominantSubstrate,
        sigil: '~trace',
        title: `${pageMeta.surface} reading trace`,
        body: `${conceptual} conceptual, ${realized} realized, ${hybrid} hybrid. Dominant substrate ${dominantSubstrate}; dominant phrasing ${dominantPhrase}.`,
        block: `^"trace/${pageMeta.surface}"{
  page: "${pageMeta.path}"
  conceptual: ${conceptual}
  realized: ${realized}
  hybrid: ${hybrid}
  substrate: "${dominantSubstrate}"
  phrase: "${dominantPhrase}"
}`
    }];

    const bySubstrate = {};
    couplings.forEach((entry) => {
        const substrate = entry.operator || 'baseline';
        bySubstrate[substrate] ||= [];
        bySubstrate[substrate].push(entry);
    });

    Object.entries(bySubstrate)
        .filter(([, items]) => items.length >= 2)
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 2)
        .forEach(([substrate, items]) => {
            const phrase = dominantValue(items, 'phrase', 'context');
            cards.push({
                operator: substrate,
                sigil: `#:${substrate}`,
                title: `${substrate} substrate`,
                body: `${items.length} grounded traces are currently phrased mostly as ${phrase}.`,
                block: `^"substrate/${substrate}"{
  phrase: "${phrase}"
  tokens: [${items.map(({ text }) => `"${text}"`).join(', ')}]
}`
            });
        });

    return cards;
}

function buildClusterCards() {
    const knowledge = getKnowledgeMap();
    const clusters = groupKnowledgeByCluster(knowledge);

    return Object.entries(clusters)
        .filter(([, items]) => items.length >= 2)
        .map(([cluster, items]) => ({
            operator: 'merge',
            sigil: '~resonance',
            title: `${cluster} synthesis`,
            body: `Your interaction with ${items.join(', ')} has reached resonance.`,
            block: `^"resonance/${cluster.toLowerCase()}"{
  status: "coupled"
  scope: "frame"
  interactions: [${items.map((item) => `"${item}"`).join(', ')}]
}`
        }));
}

function createResonanceCard(card) {
    const node = document.createElement('div');
    node.className = 'spw-smart-resonance';
    node.dataset.spwForm = 'brace';
    node.dataset.spwOperator = card.operator || 'frame';

    node.innerHTML = `
        <div class="resonance-header">
            <span class="resonance-sigil">${escapeHtml(card.sigil)}</span>
            <strong>${escapeHtml(card.title)}</strong>
        </div>
        <div class="resonance-body">
            <p>${escapeHtml(card.body)}</p>
            <pre class="spw-transparent-block"><code>${escapeHtml(card.block)}</code></pre>
        </div>
    `;

    return node;
}

function renderSmartConsole() {
    const container = getSmartHost();
    if (getSiteSettings().cognitiveHandles === 'off') {
        container.innerHTML = '';
        container.hidden = true;
        return;
    }

    const cards = [...buildTraceCards(), ...buildClusterCards()].slice(0, 3);
    if (!cards.length) {
        container.innerHTML = '';
        container.hidden = true;
        return;
    }

    container.hidden = false;
    container.innerHTML = '';
    cards.forEach((card) => container.appendChild(createResonanceCard(card)));
}

function updateSmartSpwBlock() {
    const el = document.getElementById('spw-smart-spw-block');
    if (!el) return;

    const knowledge = getKnowledgeMap();
    const couplings = getActiveCouplings();
    const pageMeta = getCurrentPageMetadata();
    const dominantSubstrate = couplings.length ? dominantValue(couplings, 'operator', 'baseline') : 'baseline';
    const dominantPhrase = couplings.length ? dominantValue(couplings, 'phrase', 'context') : 'context';

    el.textContent = `^"cognitive/web"{
  page: "${pageMeta.path}"
  nodes: ${knowledge.length}
  traces: ${couplings.length}
  substrate: "${dominantSubstrate}"
  phrase: "${dominantPhrase}"
  history: [${knowledge.map((key) => `"${key}"`).join(', ')}]
}`;
}
