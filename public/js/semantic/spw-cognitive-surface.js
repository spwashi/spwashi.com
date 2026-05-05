/**
 * Spw Cognitive Surface
 *
 * Reads grounded local traces and renders a live Spw-dialect panel that makes
 * the page's current cognitive web inspectable: what has been grounded, which
 * substrate family it belongs to, whether it is conceptual or realized, and
 * how it is being phrased.
 */

import { bus } from '/public/js/kernel/spw-bus.js';
import { getGroundedRegistry } from '/public/js/interface/spw-haptics.js';
import { LATTICE } from '/public/js/semantic/spw-lattice.js';
import { getSiteSettings } from '/public/js/kernel/site-settings.js';

const COUPLING_KEY = (path = window.location.pathname) => `spw-coupling:${path}`;

const safeJsonParse = (raw, fallback) => {
    try {
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
};

const writeCouplingMap = (map, path = window.location.pathname) => {
    localStorage.setItem(COUPLING_KEY(path), JSON.stringify(map));
};

function getCouplingMap(path = window.location.pathname) {
    return safeJsonParse(localStorage.getItem(COUPLING_KEY(path)), {});
}

function getCurrentPageMetadata() {
    const heading = document.querySelector('main h1, article h1, h1');
    return {
        path: window.location.pathname,
        surface: document.body.dataset.spwSurface || 'site',
        title: heading?.textContent?.trim() || document.title.trim(),
        description: document.querySelector('meta[name="description"]')?.content?.trim() || ''
    };
}

function getSubstrateContext(el) {
    const semanticHost = el?.closest?.('[data-spw-semantic-tagged="true"]');
    const ancestor = el?.closest?.('[data-spw-operator]');
    return (
        semanticHost?.dataset.spwSubstrate
        || ancestor?.dataset.spwOperator
        || null
    );
}

function getGroundingContext(el, text) {
    const semanticHost = el?.closest?.('[data-spw-semantic-tagged="true"]');
    return {
        operator: getSubstrateContext(el) || 'baseline',
        text,
        phrase: semanticHost?.dataset.spwPhrase || 'context',
        realization: semanticHost?.dataset.spwRealization || 'hybrid',
        meaning: semanticHost?.dataset.spwComponentMeaning || '',
        role: semanticHost?.dataset.spwRole || '',
        page: getCurrentPageMetadata()
    };
}

function recordGrounding(key, context) {
    const map = getCouplingMap();
    const existing = map[key] || { depth: 0, parallels: [] };

    map[key] = {
        ...existing,
        ...context,
        operator: context.operator || existing.operator || 'baseline',
        text: context.text || existing.text || key,
        phrase: context.phrase || existing.phrase || 'context',
        realization: context.realization || existing.realization || 'hybrid',
        meaning: context.meaning || existing.meaning || '',
        role: context.role || existing.role || '',
        page: context.page || existing.page || getCurrentPageMetadata(),
        depth: existing.depth + 1
    };

    writeCouplingMap(map);
}

function recordUngrounding(key) {
    const map = getCouplingMap();
    delete map[key];
    writeCouplingMap(map);
}

function inferNextEncounters(activeKeys) {
    const suggestions = new Set();

    activeKeys.forEach((key) => {
        const data = LATTICE[key];
        if (!data?.parallels) return;
        data.parallels.forEach((parallel) => {
            if (!activeKeys.includes(parallel)) suggestions.add(parallel);
        });
    });

    return Array.from(suggestions).slice(0, 3);
}

function groupActiveCouplings(activeMap) {
    const groups = {};

    Object.entries(activeMap).forEach(([key, entry]) => {
        const realization = entry.realization || 'hybrid';
        const substrate = entry.operator || 'baseline';

        groups[realization] ||= {};
        groups[realization][substrate] ||= [];
        groups[realization][substrate].push({ key, ...entry });
    });

    return groups;
}

export function serializeCognitiveWeb(map) {
    const activeKeys = Object.keys(map);
    const grouped = groupActiveCouplings(map);
    const pageMeta = getCurrentPageMetadata();
    const phase = document.body.dataset.spwLatticePhase || 'curiosity';
    const lines = ['#>[cognitive_web]{'];

    lines.push(`  @phase .${phase}`);
    lines.push(`  ~page "${pageMeta.title}"`);
    lines.push(`  $surface "${pageMeta.surface}"`);

    Object.entries(grouped).forEach(([realization, bySubstrate]) => {
        lines.push(`  ^"${realization}"{`);
        Object.entries(bySubstrate).forEach(([substrate, tokens]) => {
            lines.push(`    #:[${substrate}]{`);
            tokens.forEach(({ text, depth, phrase }) => {
                const phraseMark = phrase && phrase !== 'context' ? ` %phrase=${phrase}` : '';
                const depthMark = depth > 1 ? ` !depth=${depth}` : '';
                lines.push(`      . "${text}"${phraseMark}${depthMark}`);
            });
            lines.push('    }');
        });
        lines.push('  }');
    });

    const next = inferNextEncounters(activeKeys);
    if (next.length) {
        lines.push('  ?[next_encounters]{');
        next.forEach((entry) => lines.push(`    ~"${entry}"`));
        lines.push('  }');
    }

    lines.push('  @[actions]{');
    lines.push('    @cast_spell');
    lines.push('    !checkpoint');
    lines.push('  }');
    lines.push('}');

    return lines.join('\n');
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function renderCognitiveSurface(mount) {
    if (getSiteSettings().cognitiveHandles === 'off') {
        mount.innerHTML = '';
        mount.setAttribute('hidden', '');
        return;
    }

    const map = getCouplingMap();
    const registry = getGroundedRegistry();
    const active = Object.fromEntries(
        Object.entries(map).filter(([key]) => registry.includes(key))
    );

    if (!Object.keys(active).length) {
        mount.innerHTML = '';
        mount.setAttribute('hidden', '');
        return;
    }

    const pageMeta = getCurrentPageMetadata();
    const activeKeys = Object.keys(active);
    const phase = document.body.dataset.spwLatticePhase || 'curiosity';
    const next = inferNextEncounters(activeKeys);
    const grouped = groupActiveCouplings(active);
    const spwBlock = serializeCognitiveWeb(active);

    mount.removeAttribute('hidden');
    mount.innerHTML = `
        <div class="cognitive-surface-frame" data-spw-operator="frame" data-spw-form="brace">
            <header class="cognitive-surface-header">
                <span class="frame-sigil" data-spw-operator="frame">#&gt;cognitive_web</span>
                <span class="cognitive-phase-badge" data-spw-operator="action">@phase .${escapeHtml(phase)}</span>
                <button class="cognitive-surface-close" type="button" aria-label="Close cognitive web">×</button>
            </header>
            <div class="cognitive-page-meta">
                <span class="cognitive-page-title">${escapeHtml(pageMeta.title)}</span>
                <span class="cognitive-page-path" data-spw-operator="ref">~${escapeHtml(pageMeta.path)}</span>
            </div>
            ${pageMeta.description ? `<p class="cognitive-page-description">${escapeHtml(pageMeta.description)}</p>` : ''}

            <div class="cognitive-surface-body">
                ${Object.entries(grouped).map(([realization, bySubstrate]) => `
                    <section class="cognitive-realization-group"
                             data-spw-form="brace"
                             data-spw-realization="${escapeHtml(realization)}">
                        <h3 class="cognitive-realization-label">${escapeHtml(realization)}</h3>
                        ${Object.entries(bySubstrate).map(([substrate, tokens]) => `
                            <section class="cognitive-substrate-group"
                                     data-spw-operator="${escapeHtml(substrate)}"
                                     data-spw-form="brace">
                                <h4 class="cognitive-substrate-label" data-spw-operator="${escapeHtml(substrate)}">
                                    <span data-spw-operator="layer">#:${escapeHtml(substrate)}</span>
                                </h4>
                                <ul class="cognitive-token-list">
                                    ${tokens.map(({ key, text, depth, phrase }) => `
                                        <li class="cognitive-token"
                                            data-spw-operator="baseline"
                                            data-spw-grounded="true"
                                            data-spw-grounded-in="${escapeHtml(substrate)}"
                                            data-spw-phrase="${escapeHtml(phrase || 'context')}"
                                            data-cognitive-key="${CSS.escape(key)}">
                                            <span class="cognitive-token-sigil" data-spw-operator="baseline">.</span>
                                            <span class="cognitive-token-text">${escapeHtml(text)}</span>
                                            ${phrase && phrase !== 'context' ? `<span class="cognitive-token-phrase" data-spw-operator="layer">${escapeHtml(phrase)}</span>` : ''}
                                            ${depth > 1 ? `<span class="cognitive-token-depth" data-spw-operator="pragma">!${depth}</span>` : ''}
                                        </li>
                                    `).join('')}
                                </ul>
                            </section>
                        `).join('')}
                    </section>
                `).join('')}

                ${next.length ? `
                    <section class="cognitive-substrate-group" data-spw-operator="probe" data-spw-form="brace">
                        <h4 class="cognitive-substrate-label" data-spw-operator="probe">
                            <span data-spw-operator="layer">#:[next_encounters]</span>
                        </h4>
                        <ul class="cognitive-token-list">
                            ${next.map((entry) => `
                                <li class="cognitive-token" data-spw-operator="ref">
                                    <span class="cognitive-token-sigil" data-spw-operator="ref">~</span>
                                    <span class="cognitive-token-text">${escapeHtml(entry)}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </section>
                ` : ''}
            </div>

            <footer class="cognitive-surface-footer">
                <div class="cognitive-action-row">
                    <button class="operator-chip" data-spw-operator="action" onclick="spwSpells?.cast()">@cast_spell</button>
                    <button class="operator-chip" data-spw-operator="pragma" onclick="spwSpells?.checkpoint()">!checkpoint</button>
                </div>
            </footer>

            <details class="cognitive-surface-source">
                <summary data-spw-operator="meta">$[spw_block]</summary>
                <pre class="cognitive-source-pre"><code>${escapeHtml(spwBlock)}</code></pre>
            </details>
        </div>
    `;

    mount.querySelector('.cognitive-surface-close')?.addEventListener('click', () => {
        mount.setAttribute('hidden', '');
    });
}

function getMountPoint() {
    let mount = document.querySelector('[data-spw-surface="cognitive"]');
    if (!mount) {
        mount = document.createElement('aside');
        mount.setAttribute('data-spw-surface', 'cognitive');
        mount.className = 'cognitive-surface-panel';
        mount.setAttribute('aria-label', 'Cognitive web — grounded concepts');
        mount.setAttribute('hidden', '');
        document.body.appendChild(mount);
    }
    return mount;
}

export function initCognitiveSurface() {
    const mount = getMountPoint();

    bus.on('spell:grounded', (event) => {
        const { key, text } = event.detail ?? {};
        if (key) recordGrounding(key, getGroundingContext(event.target, text));
        renderCognitiveSurface(mount);
    });

    bus.on('spell:ungrounded', (event) => {
        const { key } = event.detail ?? {};
        if (key) recordUngrounding(key);
        renderCognitiveSurface(mount);
    });

    bus.on('lattice:cycled', () => {
        renderCognitiveSurface(mount);
    });

    bus.on('persona:active', () => {
        renderCognitiveSurface(mount);
    });

    document.addEventListener('spw:component-semantics-ready', () => {
        renderCognitiveSurface(mount);
    });

    document.addEventListener('spw:settings-change', () => {
        renderCognitiveSurface(mount);
    });

    renderCognitiveSurface(mount);
}

export { getCouplingMap, getCurrentPageMetadata };
