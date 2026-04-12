/**
 * boonhonk-mixer.js
 *
 * Interactive visualizer for the boonhonk color field.
 * Five operators (boon / bane / bone / bonk / honk) have weights from 0–1.
 * Their weighted combination produces the site's accent color.
 *
 * The math:
 *   hue   = (boon*140) + (bone*40) + (bonk*300) + (honk*200)
 *   sat   = 38% + (boon*32%) + (bonk*25%)
 *   light = 52% + (bone*12%) - (bane*18%)
 *
 * Rendered as an SVG pentagon: each node is an operator.
 * Weight is shown as the thickness of the spoke and area of the filled polygon.
 * Tap a node to step its weight up; tap the center to reset.
 *
 * Usage: <div data-boonhonk-mixer></div>
 */

// ── Operator definitions ──────────────────────────────────────────────────────
const OPERATORS = [
    {
        id: 'boon',
        label: 'boon',
        sigil: '>',
        note: '+1 · arrival',
        hueContrib: 140,
        satContrib: 32,
        lightContrib: 0,
        nodeColor: 'hsl(158 72% 36%)',
        defaultWeight: 0.55,
    },
    {
        id: 'bone',
        label: 'bone',
        sigil: '^',
        note: '0 · structure',
        hueContrib: 40,
        satContrib: 0,
        lightContrib: 12,
        nodeColor: 'hsl(36 72% 46%)',
        defaultWeight: 0.25,
    },
    {
        id: 'bonk',
        label: 'bonk',
        sigil: '@',
        note: 'event · collision',
        hueContrib: 300,
        satContrib: 25,
        lightContrib: 0,
        nodeColor: 'hsl(300 58% 44%)',
        defaultWeight: 0.07,
    },
    {
        id: 'honk',
        label: 'honk',
        sigil: '~',
        note: 'signal · relay',
        hueContrib: 200,
        satContrib: 0,
        lightContrib: 0,
        nodeColor: 'hsl(200 72% 36%)',
        defaultWeight: 0.12,
    },
    {
        id: 'bane',
        label: 'bane',
        sigil: '!',
        note: '−1 · constraint',
        hueContrib: 0,
        satContrib: 0,
        lightContrib: -18,  // reduces lightness
        nodeColor: 'hsl(0 58% 44%)',
        defaultWeight: 0.08,
    },
];

const WEIGHT_STEPS = [0, 0.2, 0.4, 0.6, 0.8, 1.0];

// ── Math ──────────────────────────────────────────────────────────────────────
function computeColor(weights) {
    const { boon = 0, bone = 0, bonk = 0, honk = 0, bane = 0 } = weights;
    const hue   = (boon * 140) + (bone * 40) + (bonk * 300) + (honk * 200);
    const sat   = 38 + (boon * 32) + (bonk * 25);
    const light = 52 + (bone * 12) - (bane * 18);
    return {
        hue: Math.round(hue),
        sat: Math.round(sat),
        light: Math.round(light),
        css: `hsl(${Math.round(hue)} ${Math.round(sat)}% ${Math.round(light)}%)`,
    };
}

// ── Geometry ──────────────────────────────────────────────────────────────────
const CX = 140, CY = 140, R_NODE = 88, R_DOT = 18, R_CENTER = 32;

function nodePos(i, n = OPERATORS.length) {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    return {
        x: CX + R_NODE * Math.cos(angle),
        y: CY + R_NODE * Math.sin(angle),
    };
}

// ── SVG builder ───────────────────────────────────────────────────────────────
function svgEl(tag, attrs = {}) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
}

function buildSvg(_initialWeights, onNodeClick) {
    const svg = svgEl('svg', {
        viewBox: '0 0 280 280',
        class: 'bhm-svg',
        role: 'img',
        'aria-label': 'Boonhonk operator mixer',
    });

    // ── Background circle ──
    svg.appendChild(svgEl('circle', {
        cx: CX, cy: CY, r: R_NODE + R_DOT + 8,
        class: 'bhm-field',
    }));

    // ── Polygon fill (weighted area) ──
    const polyEl = svgEl('polygon', { class: 'bhm-polygon' });
    svg.appendChild(polyEl);

    // ── Spokes ──
    const spokeEls = OPERATORS.map((op, i) => {
        const pos = nodePos(i);
        const el = svgEl('line', {
            x1: CX, y1: CY,
            x2: pos.x, y2: pos.y,
            class: `bhm-spoke bhm-spoke--${op.id}`,
            'stroke-linecap': 'round',
        });
        svg.appendChild(el);
        return el;
    });

    // ── Center ──
    const centerEl = svgEl('circle', {
        cx: CX, cy: CY, r: R_CENTER,
        class: 'bhm-center',
    });
    svg.appendChild(centerEl);

    // ── Center label ──
    const centerLabelEl = svgEl('text', {
        x: CX, y: CY + 5,
        class: 'bhm-center-label',
        'text-anchor': 'middle',
    });
    centerLabelEl.textContent = '∿';
    svg.appendChild(centerLabelEl);

    // ── Nodes ──
    OPERATORS.forEach((op, i) => {
        const pos = nodePos(i);

        const group = svgEl('g', {
            class: `bhm-node bhm-node--${op.id}`,
            role: 'button',
            tabindex: '0',
            'aria-label': `${op.label}: adjust weight`,
        });

        group.appendChild(svgEl('circle', {
            cx: pos.x, cy: pos.y, r: R_DOT + 6,
            class: 'bhm-node-hit',
        }));
        group.appendChild(svgEl('circle', {
            cx: pos.x, cy: pos.y, r: R_DOT,
            class: 'bhm-node-dot',
            fill: op.nodeColor,
        }));

        const text = svgEl('text', {
            x: pos.x, y: pos.y - R_DOT - 7,
            class: 'bhm-node-label',
            'text-anchor': 'middle',
        });
        text.textContent = op.label;

        const sigil = svgEl('text', {
            x: pos.x, y: pos.y + 5,
            class: 'bhm-node-sigil',
            'text-anchor': 'middle',
        });
        sigil.textContent = op.sigil;

        group.append(text, sigil);
        group.addEventListener('click', () => onNodeClick(op.id));
        group.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNodeClick(op.id); }
        });
        svg.appendChild(group);
    });

    // ── Reset button (center tap) ──
    const resetHit = svgEl('circle', {
        cx: CX, cy: CY, r: R_CENTER,
        class: 'bhm-center-hit',
        role: 'button',
        tabindex: '0',
        'aria-label': 'Reset to defaults',
    });
    svg.appendChild(resetHit);

    function update(w) {
        const color = computeColor(w);

        // Center color
        centerEl.setAttribute('fill', color.css);

        // Spokes — width = weight * 10, opacity = weight
        OPERATORS.forEach((op, i) => {
            const weight = w[op.id] ?? 0;
            spokeEls[i].setAttribute('stroke', op.nodeColor);
            spokeEls[i].setAttribute('stroke-width', Math.max(0.5, weight * 10));
            spokeEls[i].setAttribute('opacity', 0.15 + weight * 0.85);
        });

        // Polygon — points = position scaled by weight
        const points = OPERATORS.map((op, i) => {
            const weight = w[op.id] ?? 0;
            const full = nodePos(i);
            const scale = 0.08 + weight * 0.92;
            return `${CX + (full.x - CX) * scale},${CY + (full.y - CY) * scale}`;
        }).join(' ');
        polyEl.setAttribute('points', points);
        polyEl.setAttribute('fill', color.css);

        // Node visual state
        OPERATORS.forEach((op) => {
            const weight = w[op.id] ?? 0;
            const group = svg.querySelector(`.bhm-node--${op.id}`);
            if (group) {
                group.classList.toggle('is-active', weight > 0);
                const dot = group.querySelector('.bhm-node-dot');
                if (dot) dot.setAttribute('opacity', 0.3 + weight * 0.7);
            }
        });
    }

    return { svg, update, resetHit };
}

// ── Component ─────────────────────────────────────────────────────────────────
function buildReadout() {
    const el = document.createElement('div');
    el.className = 'bhm-readout';

    const colorPreview = document.createElement('div');
    colorPreview.className = 'bhm-color-preview';

    const formula = document.createElement('div');
    formula.className = 'bhm-formula';

    const operatorRow = document.createElement('div');
    operatorRow.className = 'bhm-operator-row';

    el.append(colorPreview, formula, operatorRow);

    function update(w) {
        const { hue, sat, light, css } = computeColor(w);

        colorPreview.style.background = css;
        colorPreview.setAttribute('title', css);

        formula.innerHTML = `
            <span class="bhm-formula-line">hue <span class="bhm-val">${hue}°</span></span>
            <span class="bhm-formula-line">sat <span class="bhm-val">${sat}%</span></span>
            <span class="bhm-formula-line">light <span class="bhm-val">${light}%</span></span>
        `;

        operatorRow.innerHTML = OPERATORS.map(op => {
            const weight = w[op.id] ?? 0;
                return `<span class="bhm-op-chip bhm-op-chip--${op.id} ${weight > 0 ? 'is-active' : ''}" title="${op.note}">${op.sigil} <span class="bhm-op-val">${weight.toFixed(2)}</span></span>`;
        }).join('');
    }

    return { el, update };
}

export function initBoonhonkMixers(root = document) {
    root.querySelectorAll('[data-boonhonk-mixer]').forEach(container => {
        // Initial weights
        const weights = Object.fromEntries(
            OPERATORS.map(op => [op.id, op.defaultWeight])
        );

        function stepWeight(id) {
            const current = weights[id];
            const currentIdx = WEIGHT_STEPS.findLastIndex(s => s <= current + 0.001);
            const nextIdx = (currentIdx + 1) % WEIGHT_STEPS.length;
            weights[id] = WEIGHT_STEPS[nextIdx];
            refresh();
        }

        function resetWeights() {
            OPERATORS.forEach(op => { weights[op.id] = op.defaultWeight; });
            refresh();
        }

        const { svg, update: updateSvg, resetHit } = buildSvg(weights, stepWeight);
        const { el: readout, update: updateReadout } = buildReadout();

        resetHit.addEventListener('click', resetWeights);
        resetHit.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); resetWeights(); }
        });

        const wrapper = document.createElement('div');
        wrapper.className = 'bhm-wrapper';

        const note = document.createElement('p');
        note.className = 'bhm-note';
        note.textContent = 'Tap each operator to step its weight. Tap the center to reset.';

        wrapper.append(svg, readout, note);
        container.appendChild(wrapper);

        function refresh() {
            updateSvg(weights);
            updateReadout(weights);

            // Write operator weights to CSS — the calc() formula in style.css resolves to --spw-accent
            const root = document.documentElement;
            root.style.setProperty('--boon', weights.boon);
            root.style.setProperty('--bane', weights.bane);
            root.style.setProperty('--bone', weights.bone);
            root.style.setProperty('--bonk', weights.bonk);
            root.style.setProperty('--honk', weights.honk);
        }

        refresh();
    });
}
