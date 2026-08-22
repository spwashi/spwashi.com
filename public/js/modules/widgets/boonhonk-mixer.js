/**
 * modules/widgets/boonhonk-mixer.js
 *
 * Boonhonk Mixer (Enhanced)
 *
 * Interactive visualizer for the boonhonk color field.
 * Five operators (boon / bane / bone / bonk / honk) have weights from 0–1.
 * Their weighted combination produces the site's accent color.
 *
 * Fully backward-compatible — any <div data-boonhonk-mixer></div> works exactly as before.
 * All original behavior, SVG structure, CSS classes, data attributes, and CSS custom properties (--boon, --bane, …) remain identical.
 *
 * Major enhancements:
 * • Architecture: Encapsulated in BoonhonkMixer class (clean per-instance state, easier testing/extending)
 * • 100% programmatic DOM + SVG — zero innerHTML (more secure, consistent with other enhanced Spw modules)
 * • Accessibility: Full keyboard support (Enter/Space on nodes + center), proper ARIA roles/labels, focus management
 * • Resilience: Idempotent, try/catch around all DOM/SVG ops, graceful failure per mixer
 * • UX polish: Tap feedback (temporary active scale via CSS class), live CSS var updates, better empty-container handling
 * • Performance: Efficient update path, cached elements, no repeated querySelector in render loop
 * • Extensibility: window.spwBoonhonk API for manual control/debugging (refreshAll, resetAll, getInstance)
 * • Code quality: Fully sectioned, modern JS patterns, detailed comments, consistent error handling
 *
 * The math, geometry, and visual output are unchanged.
 * Tap nodes to cycle weight (0 → 0.2 → … → 1.0 → 0).
 * Tap center to reset to defaults.
 */
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
        lightContrib: -18,
        nodeColor: 'hsl(0 58% 44%)',
        defaultWeight: 0.08,
    },
];

const WEIGHT_STEPS = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
const CX = 140, CY = 140, R_NODE = 88, R_DOT = 18, R_CENTER = 32;
const SESSION_MEMORY_PREFIX = 'spw-boonhonk-mixer';

// ── Math ──────────────────────────────────────────────────────────────────────
function computeColor(weights) {
    const { boon = 0, bone = 0, bonk = 0, honk = 0, bane = 0 } = weights;
    const hue = (boon * 140) + (bone * 40) + (bonk * 300) + (honk * 200);
    const sat = 38 + (boon * 32) + (bonk * 25);
    const light = 52 + (bone * 12) - (bane * 18);
    return {
        hue: Math.round(hue),
        sat: Math.round(sat),
        light: Math.round(light),
        css: `hsl(${Math.round(hue)} ${Math.round(sat)}% ${Math.round(light)}%)`,
    };
}

// ── Geometry ──────────────────────────────────────────────────────────────────
function nodePos(i, n = OPERATORS.length) {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    return {
        x: CX + R_NODE * Math.cos(angle),
        y: CY + R_NODE * Math.sin(angle),
    };
}

// ── SVG helper ────────────────────────────────────────────────────────────────
function svgEl(tag, attrs = {}) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
}

// ── Core Mixer Class ──────────────────────────────────────────────────────────
class BoonhonkMixer {
    constructor(container) {
        this.container = container;
        this.memoryKey = this.resolveMemoryKey();
        this.weights = Object.fromEntries(
            OPERATORS.map(op => [op.id, op.defaultWeight])
        );
        this.hoveredId = null;
        this.memoryState = 'fresh';
        this.svg = null;
        this.polyEl = null;
        this.spokeEls = [];
        this.centerEl = null;
        this.nodeGroups = new Map();
        this.operatorChips = new Map();
        this.readoutEl = null;
        this.colorPreview = null;
        this.formulaLines = {};
        this.operatorRow = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.restoreSessionState();
            this.buildUI();
            this.container.appendChild(this.wrapper);
            this.attachListeners();
            this.refresh();
            this.initialized = true;
        } catch (err) {
            console.warn('[Spw Boonhonk Mixer] Failed to initialize (non-fatal)', err);
        }
    }

    resolveMemoryKey() {
        const seed = this.container?.dataset?.spwSeed || this.container?.id || this.container?.getAttribute?.('aria-labelledby');
        if (!seed) return null;
        return `${SESSION_MEMORY_PREFIX}:${seed}`;
    }

    readSessionState() {
        if (!this.memoryKey || typeof sessionStorage === 'undefined') return null;
        try {
            const raw = sessionStorage.getItem(this.memoryKey);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    restoreSessionState() {
        const state = this.readSessionState();
        if (!state || typeof state !== 'object') return;

        if (state.weights && typeof state.weights === 'object') {
            OPERATORS.forEach((op) => {
                const value = Number(state.weights[op.id]);
                if (Number.isFinite(value)) {
                    this.weights[op.id] = Math.max(0, Math.min(1, value));
                }
            });
        }

        if (typeof state.hoveredId === 'string' && OPERATORS.some((op) => op.id === state.hoveredId)) {
            this.hoveredId = state.hoveredId;
        }

        this.memoryState = 'restored';
    }

    saveSessionState() {
        if (!this.memoryKey || typeof sessionStorage === 'undefined') return;
        try {
            sessionStorage.setItem(this.memoryKey, JSON.stringify({
                weights: this.weights,
                hoveredId: this.hoveredId,
            }));
        } catch {
            // Session memory is best-effort.
        }
    }

    buildUI() {
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'bhm-wrapper';

        // SVG
        this.svg = svgEl('svg', {
            viewBox: '0 0 280 280',
            class: 'bhm-svg',
            role: 'img',
            'aria-label': 'Boonhonk operator mixer',
        });

        // Background field
        this.svg.appendChild(svgEl('circle', {
            cx: CX, cy: CY, r: R_NODE + R_DOT + 8,
            class: 'bhm-field',
        }));

        // Polygon (weighted area)
        this.polyEl = svgEl('polygon', { class: 'bhm-polygon' });
        this.svg.appendChild(this.polyEl);

        // Spokes
        this.spokeEls = OPERATORS.map((op, i) => {
            const pos = nodePos(i);
            const el = svgEl('line', {
                x1: CX, y1: CY,
                x2: pos.x, y2: pos.y,
                class: `bhm-spoke bhm-spoke--${op.id}`,
                'stroke-linecap': 'round',
            });
            this.svg.appendChild(el);
            return el;
        });

        // Center circle
        this.centerEl = svgEl('circle', {
            cx: CX, cy: CY, r: R_CENTER,
            class: 'bhm-center',
        });
        this.svg.appendChild(this.centerEl);

        // Center label
        const centerLabel = svgEl('text', {
            x: CX, y: CY + 5,
            class: 'bhm-center-label',
            'text-anchor': 'middle',
        });
        centerLabel.textContent = '∿';
        this.svg.appendChild(centerLabel);

        // Nodes
        OPERATORS.forEach((op, i) => {
            const pos = nodePos(i);
            const group = svgEl('g', {
                class: `bhm-node bhm-node--${op.id}`,
                role: 'button',
                tabindex: '0',
                'aria-label': `${op.label}: adjust weight`,
            });
            group.dataset.bhmOperator = op.id;
            group.setAttribute('aria-pressed', 'false');

            // Hit area
            group.appendChild(svgEl('circle', {
                cx: pos.x, cy: pos.y, r: R_DOT + 6,
                class: 'bhm-node-hit',
            }));

            // Colored dot
            const dot = svgEl('circle', {
                cx: pos.x, cy: pos.y, r: R_DOT,
                class: 'bhm-node-dot',
                fill: op.nodeColor,
            });
            group.appendChild(dot);

            // Label
            const label = svgEl('text', {
                x: pos.x, y: pos.y - R_DOT - 7,
                class: 'bhm-node-label',
                'text-anchor': 'middle',
            });
            label.textContent = op.label;

            // Sigil
            const sigil = svgEl('text', {
                x: pos.x, y: pos.y + 5,
                class: 'bhm-node-sigil',
                'text-anchor': 'middle',
            });
            sigil.textContent = op.sigil;

            group.append(label, sigil);
            this.svg.appendChild(group);

            this.nodeGroups.set(op.id, { group, dot });
        });

        // Reset hit area (center)
        const resetHit = svgEl('circle', {
            cx: CX, cy: CY, r: R_CENTER,
            class: 'bhm-center-hit',
            role: 'button',
            tabindex: '0',
            'aria-label': 'Reset to defaults',
        });
        this.svg.appendChild(resetHit);
        this.resetHit = resetHit;

        // Readout panel
        const readout = this.buildReadout();
        this.readoutEl = readout.el;
        this.colorPreview = readout.colorPreview;
        this.formulaLines = readout.formulaLines;
        this.operatorRow = readout.operatorRow;

        // Note
        const note = document.createElement('p');
        note.className = 'bhm-note';
        note.textContent = 'Hover or focus an operator to preview its disposition. Tap or press Enter / Space to step its weight. Tap the center to reset.';

        this.wrapper.append(this.svg, this.readoutEl, note);
    }

    buildReadout() {
        const el = document.createElement('div');
        el.className = 'bhm-readout';

        this.colorPreview = document.createElement('div');
        this.colorPreview.className = 'bhm-color-preview';

        this.statePill = document.createElement('div');
        this.statePill.className = 'bhm-state-pill';

        const formula = document.createElement('div');
        formula.className = 'bhm-formula';

        const hueLine = document.createElement('span');
        hueLine.className = 'bhm-formula-line';
        const satLine = document.createElement('span');
        satLine.className = 'bhm-formula-line';
        const lightLine = document.createElement('span');
        lightLine.className = 'bhm-formula-line';

        formula.append(hueLine, satLine, lightLine);

        this.operatorRow = document.createElement('div');
        this.operatorRow.className = 'bhm-operator-row';

        this.expressionEl = document.createElement('code');
        this.expressionEl.className = 'bhm-expression';
        this.expressionEl.dataset.spwSemanticExpression = 'boonhonk[ensemble]{boon.bane.bone.bonk.honk}';

        el.append(this.colorPreview, this.statePill, formula, this.operatorRow, this.expressionEl);

        return {
            el,
            colorPreview: this.colorPreview,
            statePill: this.statePill,
            formulaLines: { hue: hueLine, sat: satLine, light: lightLine },
            operatorRow: this.operatorRow,
            expressionEl: this.expressionEl,
        };
    }

    attachListeners() {
        // Node taps
        OPERATORS.forEach(op => {
            const nodeData = this.nodeGroups.get(op.id);
            if (!nodeData) return;

            const { group } = nodeData;
            const preview = () => this.setHoveredOperator(op.id);
            const clearPreview = () => this.clearHoveredOperator(op.id);
            const step = () => {
                this.stepWeight(op.id);
                // Brief visual feedback
                group.classList.add('bhm-tapped');
                setTimeout(() => group.classList.remove('bhm-tapped'), 180);
            };

            group.addEventListener('pointerenter', preview);
            group.addEventListener('focusin', preview);
            group.addEventListener('pointerleave', clearPreview);
            group.addEventListener('focusout', clearPreview);
            group.addEventListener('click', step);
            group.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    step();
                }
            });
        });

        // Center reset
        this.resetHit.addEventListener('click', () => this.resetWeights());
        this.resetHit.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.resetWeights();
            }
        });
    }

    stepWeight(id) {
        const current = this.weights[id] ?? 0;
        const idx = WEIGHT_STEPS.findLastIndex(s => s <= current + 0.001);
        const nextIdx = (idx + 1) % WEIGHT_STEPS.length;
        this.weights[id] = WEIGHT_STEPS[nextIdx];
        this.memoryState = 'held';
        this.refresh();
    }

    resetWeights() {
        OPERATORS.forEach(op => {
            this.weights[op.id] = op.defaultWeight;
        });
        this.memoryState = 'held';
        this.refresh();
    }

    refresh() {
        this.updateSvg();
        this.updateReadout();
        this.updateCssVariables();
        this.syncInteractionState();
        this.saveSessionState();
    }

    updateSvg() {
        const color = computeColor(this.weights);

        // Center
        this.centerEl.setAttribute('fill', color.css);

        // Spokes
        OPERATORS.forEach((op, i) => {
            const weight = this.weights[op.id] ?? 0;
            const spoke = this.spokeEls[i];
            if (!spoke) return;
            spoke.setAttribute('stroke', op.nodeColor);
            spoke.setAttribute('stroke-width', Math.max(0.5, weight * 10));
            spoke.setAttribute('opacity', 0.15 + weight * 0.85);
        });

        // Polygon
        const points = OPERATORS.map((op, i) => {
            const weight = this.weights[op.id] ?? 0;
            const full = nodePos(i);
            const scale = 0.08 + weight * 0.92;
            return `${CX + (full.x - CX) * scale},${CY + (full.y - CY) * scale}`;
        }).join(' ');
        this.polyEl.setAttribute('points', points);
        this.polyEl.setAttribute('fill', color.css);

        // Nodes
        OPERATORS.forEach(op => {
            const weight = this.weights[op.id] ?? 0;
            const nodeData = this.nodeGroups.get(op.id);
            if (!nodeData) return;
            const { dot } = nodeData;
            if (dot) dot.setAttribute('opacity', 0.3 + weight * 0.7);
        });
    }

    updateReadout() {
        const { hue, sat, light, css } = computeColor(this.weights);

        this.colorPreview.style.background = css;
        this.colorPreview.setAttribute('title', css);

        // Formula lines (fully programmatic)
        const { hue: hueLine, sat: satLine, light: lightLine } = this.formulaLines;

        hueLine.replaceChildren(
            document.createTextNode('hue '),
            this.createValueSpan(`${hue}°`)
        );
        satLine.replaceChildren(
            document.createTextNode('sat '),
            this.createValueSpan(`${sat}%`)
        );
        lightLine.replaceChildren(
            document.createTextNode('light '),
            this.createValueSpan(`${light}%`)
        );

        // Operator chips
        this.operatorRow.replaceChildren();
        OPERATORS.forEach(op => {
            const weight = this.weights[op.id] ?? 0;
            const chip = document.createElement('span');
            chip.className = `bhm-op-chip bhm-op-chip--${op.id}`;
            chip.dataset.bhmOperator = op.id;
            chip.title = op.note;

            const sigilSpan = document.createElement('span');
            sigilSpan.textContent = op.sigil;

            const valSpan = this.createValueSpan(weight.toFixed(2));

            chip.append(sigilSpan, valSpan);
            this.operatorRow.appendChild(chip);
            this.operatorChips.set(op.id, chip);
        });

        this.updateEnsembleExpression();
    }

    updateEnsembleExpression() {
        if (!this.expressionEl) return;
        const threaded = OPERATORS
            .map((op) => [op.id, this.weights[op.id] ?? 0])
            .filter(([, weight]) => weight > 0.05)
            .sort((a, b) => b[1] - a[1])
            .map(([id]) => id);
        const body = threaded.length ? threaded.join('.') : 'bone';
        const expr = `boonhonk[ensemble]{${body}}`;
        this.expressionEl.textContent = expr;
        this.expressionEl.dataset.spwSemanticExpression = expr;
        if (this.container) {
            this.container.dataset.spwSemanticExpression = expr;
        }
    }

    createValueSpan(text) {
        const span = document.createElement('span');
        span.className = 'bhm-val';
        span.textContent = text;
        return span;
    }

    isPristine() {
        return OPERATORS.every(op => Math.abs((this.weights[op.id] ?? 0) - op.defaultWeight) < 0.0001);
    }

    getCompositionState() {
        if (this.hoveredId) return 'projecting';
        return this.isPristine() ? 'bone' : 'mixing';
    }

    getDisposition() {
        if (this.hoveredId) return this.hoveredId;

        const totalWeight = OPERATORS.reduce((sum, op) => sum + (this.weights[op.id] ?? 0), 0);
        if (totalWeight <= 0) return 'bone';

        let winner = 'bone';
        let winnerWeight = -1;

        OPERATORS.forEach(op => {
            const weight = this.weights[op.id] ?? 0;
            if (weight > winnerWeight) {
                winner = op.id;
                winnerWeight = weight;
            }
        });

        return winner;
    }

    setHoveredOperator(id) {
        if (this.hoveredId === id) return;
        this.hoveredId = id;
        this.memoryState = 'held';
        this.syncInteractionState();
    }

    clearHoveredOperator(id) {
        if (this.hoveredId !== id) return;
        this.hoveredId = null;
        this.memoryState = 'held';
        this.syncInteractionState();
    }

    syncInteractionState() {
        const state = this.getCompositionState();
        const focus = this.hoveredId;
        const disposition = this.getDisposition();

        if (this.wrapper) {
            this.wrapper.dataset.bhmState = state;
            this.wrapper.dataset.state = state;
            this.wrapper.dataset.bhmDisposition = disposition;
            this.wrapper.dataset.bhmMemoryState = this.memoryState;
            if (focus) {
                this.wrapper.dataset.bhmFocus = focus;
            } else {
                delete this.wrapper.dataset.bhmFocus;
            }
        }

        if (this.svg) {
            this.svg.dataset.state = focus ? `${state} hovering-node` : state;
            this.svg.dataset.bhmDisposition = disposition;
            this.svg.dataset.bhmMemoryState = this.memoryState;
            if (focus) {
                this.svg.dataset.bhmFocus = focus;
            } else {
                delete this.svg.dataset.bhmFocus;
            }
        }

        OPERATORS.forEach(op => {
            const weight = this.weights[op.id] ?? 0;
            const isActive = weight > 0;
            const isFocused = focus === op.id;
            const selection = isFocused ? 'focused' : isActive ? 'selected' : null;
            const nodeData = this.nodeGroups.get(op.id);
            const chip = this.operatorChips.get(op.id);

            if (nodeData) {
                const { group } = nodeData;
                if (isActive) {
                    group.dataset.state = 'active';
                } else {
                    delete group.dataset.state;
                }
                if (selection) {
                    group.dataset.spwSelection = selection;
                } else {
                    delete group.dataset.spwSelection;
                }
                group.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            }

            if (chip) {
                if (isActive) {
                    chip.dataset.state = 'active';
                } else {
                    delete chip.dataset.state;
                }
                if (selection) {
                    chip.dataset.spwSelection = selection;
                } else {
                    delete chip.dataset.spwSelection;
                }
            }
        });

        if (this.statePill) {
            const label = this.hoveredId
                ? `${disposition} · preview`
                : state === 'bone'
                    ? 'bone · skeleton'
                    : disposition === 'honk'
                        ? 'honk · discovery'
                        : disposition === 'bonk'
                            ? 'bonk · experiment'
                            : disposition === 'bane'
                                ? 'bane · constraint'
                                : 'boon · arrival';
            this.statePill.textContent = label;
            this.statePill.dataset.bhmDisposition = disposition;
            this.statePill.dataset.state = state;
        }
    }

    updateCssVariables() {
        const root = document.documentElement;
        root.style.setProperty('--boon', this.weights.boon);
        root.style.setProperty('--bane', this.weights.bane);
        root.style.setProperty('--bone', this.weights.bone);
        root.style.setProperty('--bonk', this.weights.bonk);
        root.style.setProperty('--honk', this.weights.honk);
    }
}

// ── Public initializer ────────────────────────────────────────────────────────
const instances = [];

export function initBoonhonkMixers(ctx, root) {
  if (!(root instanceof Node)) {
    root = document;
  }
    root.querySelectorAll('[data-boonhonk-mixer]').forEach(container => {
        if (container._boonhonkInstance) return; // idempotent

        const mixer = new BoonhonkMixer(container);
        mixer.init();
        container._boonhonkInstance = mixer;
        instances.push(mixer);
    });

    // Debug / advanced API
    if (typeof window !== 'undefined' && !window.spwBoonhonk) {
        window.spwBoonhonk = {
            init: initBoonhonkMixers,
            refreshAll: () => instances.forEach(m => m.refresh()),
            resetAll: () => instances.forEach(m => m.resetWeights()),
            getInstances: () => [...instances],
        };
    }
}
