/**
 * services-configurator.js
 *
 * Service selection as a weighted field — same interaction language as the
 * boonhonk mixer. Four dimensions with named steps. The combination resolves
 * to a tier (fast / standard / premium) and a direct payment path.
 *
 * Interaction:
 *   - Tap a node to step through its named states
 *   - The center shows the resolved tier + price
 *   - When a tier is clear (score > 0.55, leads by > 0.15), center becomes a CTA
 *   - After MAX_STEPS total taps without committing: "reset to clarify" nudge
 *   - Tap center when resolved → payment card opens
 *
 * Dimensions:
 *   time   (top)    — urgency: open → months → weeks → now
 *   scope  (right)  — breadth: focused → growing → full
 *   depth  (bottom) — architecture: surface → system → architectural
 *   tenure (left)   — duration: project → season → ongoing
 */

// ── Dimension definitions ─────────────────────────────────────────────────────
// Each dimension has a `home` URL — where a visitor can learn what it means.
// This makes the math trustworthy: every concept introduced has a place to land.
const DIMS = [
    {
        id: 'time',
        label: 'time',
        note: 'when do you need this?',
        home: '/services/#pricing',
        steps: [
            { label: 'open',   value: 0,    hint: 'flexible timeline' },
            { label: 'months', value: 0.33, hint: 'a few months out' },
            { label: 'weeks',  value: 0.66, hint: 'fairly soon' },
            { label: 'now',    value: 1,    hint: 'urgent' },
        ],
        nodeColor: 'hsl(188 72% 34%)',
    },
    {
        id: 'scope',
        label: 'scope',
        note: 'how much ground?',
        home: '/services/#what-i-do',
        steps: [
            { label: 'focused',       value: 0,   hint: 'one clear deliverable' },
            { label: 'growing',       value: 0.5, hint: 'evolving scope' },
            { label: 'full',          value: 1,   hint: 'comprehensive system' },
        ],
        nodeColor: 'hsl(36 72% 42%)',
    },
    {
        id: 'depth',
        label: 'depth',
        note: 'how deep?',
        home: '/services/#what-i-do',
        steps: [
            { label: 'surface',       value: 0,   hint: 'implementation layer' },
            { label: 'system',        value: 0.5, hint: 'architecture involved' },
            { label: 'architectural', value: 1,   hint: 'staff-level design' },
        ],
        nodeColor: 'hsl(268 58% 42%)',
    },
    {
        id: 'tenure',
        label: 'tenure',
        note: 'project or partnership?',
        home: '/services/#social-context',
        steps: [
            { label: 'project',  value: 0,   hint: 'defined beginning and end' },
            { label: 'season',   value: 0.5, hint: 'several months' },
            { label: 'ongoing',  value: 1,   hint: 'sustained collaboration' },
        ],
        nodeColor: 'hsl(210 62% 40%)',
    },
];

// ── Tier definitions ──────────────────────────────────────────────────────────
const TIERS = {
    fast: {
        label: 'Fast',
        price: '$700',
        note: 'Scoped. Shipped.',
        accent: 'hsl(188 72% 34%)',
        paymentNote: 'One-time payment',
    },
    standard: {
        label: 'Standard',
        price: '$200/mo',
        note: 'Ongoing. Iterative.',
        accent: 'hsl(36 72% 42%)',
        paymentNote: '12-month engagement',
    },
    premium: {
        label: 'Premium',
        price: '$5,000',
        note: 'Full scope. Architecture.',
        accent: 'hsl(268 58% 42%)',
        paymentNote: 'Outside production season',
    },
};

// ── Tier resolution ───────────────────────────────────────────────────────────
// Each tier scores based on which dimension pattern matches it.
// fast:     time-driven — urgency + focused scope → quick turnaround
// standard: tenure-driven — ongoing + growing scope → subscription
// premium:  depth-driven — architectural + full scope → system design
function resolveTiers(vals) {
    const { time = 0, scope = 0, depth = 0, tenure = 0 } = vals;

    const fast     = (time * 1.6 + (1 - scope) * 0.6 + (1 - depth) * 0.4 + (1 - tenure) * 0.6) / 3.2;
    const standard = (tenure * 1.6 + scope * 0.6 + (1 - time) * 0.4 + (1 - depth) * 0.4) / 3.0;
    const premium  = (depth * 1.6 + scope * 0.8 + (1 - time) * 0.6 + tenure * 0.2) / 3.2;

    return { fast, standard, premium };
}

function topTier(scores) {
    const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const [winner, second] = entries;
    const clear = winner[1] > 0.42 && winner[1] - second[1] > 0.10;
    return { id: winner[0], score: winner[1], clear };
}

// ── Geometry ──────────────────────────────────────────────────────────────────
const CX = 130, CY = 130, R_NODE = 85, R_DOT = 16, R_CENTER = 36;

// Node positions around the center. n = total number of nodes.
function nodePos(i, n = DIMS.length) {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    return {
        x: CX + R_NODE * Math.cos(angle),
        y: CY + R_NODE * Math.sin(angle),
    };
}

// ── SVG ───────────────────────────────────────────────────────────────────────
function svgEl(tag, attrs = {}) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
}

// dims, tiers, resolveFn, topFn are all passed in — no reliance on module-level constants.
// This makes buildSvg reusable for any weighted-field context.
function buildSvg(onNodeClick, onCenterClick, dims = DIMS, tiers = TIERS, resolveFn = resolveTiers, topFn = topTier) {
    const n = dims.length;

    const svg = svgEl('svg', {
        viewBox: '0 0 260 260',
        class: 'svc-svg',
        role: 'img',
        'aria-label': 'Service configurator',
    });

    svg.appendChild(svgEl('circle', {
        cx: CX, cy: CY, r: R_NODE + R_DOT + 8,
        class: 'svc-field',
    }));

    const polyEl = svgEl('polygon', { class: 'svc-polygon' });
    svg.appendChild(polyEl);

    const spokeEls = dims.map((dim, i) => {
        const pos = nodePos(i, n);
        const el = svgEl('line', {
            x1: CX, y1: CY, x2: pos.x, y2: pos.y,
            class: `svc-spoke svc-spoke--${dim.id}`,
            'stroke-linecap': 'round',
        });
        svg.appendChild(el);
        return el;
    });

    const centerEl = svgEl('circle', {
        cx: CX, cy: CY, r: R_CENTER,
        class: 'svc-center',
    });
    svg.appendChild(centerEl);

    const centerTierEl = svgEl('text', {
        x: CX, y: CY - 6,
        class: 'svc-center-tier',
        'text-anchor': 'middle',
    });
    const centerPriceEl = svgEl('text', {
        x: CX, y: CY + 10,
        class: 'svc-center-price',
        'text-anchor': 'middle',
    });
    svg.append(centerTierEl, centerPriceEl);

    const centerHit = svgEl('circle', {
        cx: CX, cy: CY, r: R_CENTER,
        class: 'svc-center-hit',
        role: 'button',
        tabindex: '-1',
        'aria-label': 'Select this tier',
    });
    svg.appendChild(centerHit);

    const nodeEls = dims.map((dim, i) => {
        const pos = nodePos(i, n);

        const group = svgEl('g', {
            class: `svc-node svc-node--${dim.id}`,
            role: 'button',
            tabindex: '0',
            'aria-label': `${dim.label}: ${dim.note}`,
        });

        group.appendChild(svgEl('circle', {
            cx: pos.x, cy: pos.y, r: R_DOT + 8,
            class: 'svc-node-hit',
        }));
        group.appendChild(svgEl('circle', {
            cx: pos.x, cy: pos.y, r: R_DOT,
            class: 'svc-node-dot',
            fill: dim.nodeColor,
        }));

        // Label: below dot for the bottom node (index n/2 for even n), above otherwise
        const isBottom = i === Math.floor(n / 2);
        const labelOffset = isBottom ? R_DOT + 16 : -(R_DOT + 8);
        const labelEl = svgEl('text', {
            x: pos.x,
            y: pos.y + labelOffset,
            class: 'svc-node-label',
            'text-anchor': 'middle',
        });
        labelEl.textContent = dim.label;

        const stepEl = svgEl('text', {
            x: pos.x,
            y: pos.y + (isBottom ? R_DOT + 28 : -(R_DOT + 20)),
            class: 'svc-node-step',
            'text-anchor': 'middle',
        });

        group.append(labelEl, stepEl);
        group.addEventListener('click', () => onNodeClick(dim.id));
        group.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNodeClick(dim.id); }
        });
        svg.appendChild(group);

        return { group, stepEl };
    });

    centerHit.addEventListener('click', onCenterClick);
    centerHit.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCenterClick(); }
    });

    function update(vals, stepIndices) {
        const scores = resolveFn(vals);
        const { id: tierId, clear } = topFn(scores);
        const tier = tiers[tierId];

        // Center
        centerEl.setAttribute('fill', tier.accent);
        centerEl.setAttribute('opacity', 0.22 + (clear ? 0.55 : 0.15));
        centerTierEl.textContent = clear ? tier.label : '—';
        centerPriceEl.textContent = clear ? tier.price : '···';
        centerHit.setAttribute('tabindex', clear ? '0' : '-1');
        svg.classList.toggle('is-resolved', clear);

        // Spokes and polygon
        const points = dims.map((dim, i) => {
            const weight = vals[dim.id] ?? 0;
            const full = nodePos(i, n);
            const scale = 0.06 + weight * 0.94;
            spokeEls[i].setAttribute('stroke', dim.nodeColor);
            spokeEls[i].setAttribute('stroke-width', Math.max(0.5, weight * 9));
            spokeEls[i].setAttribute('opacity', 0.12 + weight * 0.88);
            return `${CX + (full.x - CX) * scale},${CY + (full.y - CY) * scale}`;
        }).join(' ');

        polyEl.setAttribute('points', points);
        polyEl.setAttribute('fill', tier.accent);
        polyEl.setAttribute('opacity', 0.12 + (clear ? 0.14 : 0));

        // Node step labels and active state
        dims.forEach((dim, i) => {
            const stepIdx = stepIndices[dim.id] ?? 0;
            const step = dim.steps[stepIdx];
            const { group, stepEl } = nodeEls[i];
            stepEl.textContent = step ? step.label : '';
            group.classList.toggle('is-active', (vals[dim.id] ?? 0) > 0);
            group.setAttribute('aria-label', `${dim.label}: ${step?.label ?? 'unset'} — ${dim.note}`);
        });

        return { tierId, tier, clear };
    }

    return { svg, update, centerHit };
}

// ── CTA panel ─────────────────────────────────────────────────────────────────
function buildCta() {
    const el = document.createElement('div');
    el.className = 'svc-cta';
    el.hidden = true;

    const title = document.createElement('p');
    title.className = 'svc-cta__title';

    const note = document.createElement('p');
    note.className = 'svc-cta__note';

    const actions = document.createElement('div');
    actions.className = 'svc-cta__actions';

    el.append(title, note, actions);

    function show(tier) {
        el.hidden = false;
        title.textContent = `${tier.label} · ${tier.price}`;
        note.textContent = tier.paymentNote;
        actions.innerHTML = '';

        // Link to services support section (payment card)
        const payBtn = document.createElement('a');
        payBtn.className = 'svc-cta__btn svc-cta__btn--primary';
        payBtn.href = '#support';
        payBtn.textContent = 'support the work →';
        payBtn.dataset.spwTouch = 'tap';

        const contactBtn = document.createElement('a');
        contactBtn.className = 'svc-cta__btn svc-cta__btn--secondary';
        contactBtn.href = '/contact';
        contactBtn.textContent = 'start a conversation';
        contactBtn.dataset.spwTouch = 'tap';

        actions.append(payBtn, contactBtn);
    }

    function hide() { el.hidden = true; }

    return { el, show, hide };
}

// ── Interaction limit ─────────────────────────────────────────────────────────
const MAX_STEPS = 10; // taps before reset nudge

function buildNudge(onReset) {
    const el = document.createElement('p');
    el.className = 'svc-nudge';
    el.hidden = true;

    const msg = document.createElement('span');
    msg.textContent = 'Getting complex — ';

    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.textContent = 'reset to clarify';
    resetBtn.className = 'svc-nudge__btn';
    resetBtn.dataset.spwTouch = 'tap';
    resetBtn.addEventListener('click', onReset);

    el.append(msg, resetBtn);
    return { el };
}

// ── Generic weighted field ────────────────────────────────────────────────────
/**
 * initWeightedField(container, config)
 *
 * Mounts a weighted field visualizer into `container`.
 * Config shape:
 *   dims         — array of dimension objects (id, label, note, home?, steps, nodeColor)
 *   tiers        — object keyed by tier id (label, price, note, accent, paymentNote)
 *   resolveFn    — (vals) → { [tierId]: number } score map
 *   topTierFn    — (scores) → { id, score, clear } (optional — uses default if omitted)
 *   maxSteps     — tap limit before reset nudge (default: MAX_STEPS)
 *   noteText     — instructional note below the field
 *   hasCta       — whether to show a CTA panel on resolution (default: true)
 *
 * This makes the same interaction engine usable for any weighted-field context —
 * services, subjective wonder weighing, math/combinatorics visualization, etc.
 */
export function initWeightedField(container, config = {}) {
    const dims     = config.dims        ?? DIMS;
    const tiers    = config.tiers       ?? TIERS;
    const resolve  = config.resolveFn   ?? resolveTiers;
    const top      = config.topTierFn   ?? topTier;
    const maxSteps = config.maxSteps    ?? MAX_STEPS;
    const noteText = config.noteText    ?? 'Tap each dimension to step through. When a tier resolves, tap the center.';
    const hasCta   = config.hasCta      ?? true;

    // State
    const vals        = Object.fromEntries(dims.map(d => [d.id, 0]));
    const stepIndices = Object.fromEntries(dims.map(d => [d.id, 0]));
    let tapCount  = 0;
    let committed = false;

    const cta = hasCta ? buildCta() : null;

    function reset() {
        dims.forEach(d => { vals[d.id] = 0; stepIndices[d.id] = 0; });
        tapCount  = 0;
        committed = false;
        nudge.el.hidden = true;
        if (cta) cta.hide();
        refresh();
    }

    const nudge = buildNudge(reset);

    const { svg, update } = buildSvg(
        (dimId) => {
            const dim = dims.find(d => d.id === dimId);
            if (!dim) return;
            const nextIdx = (stepIndices[dimId] + 1) % dim.steps.length;
            stepIndices[dimId] = nextIdx;
            vals[dimId] = dim.steps[nextIdx].value;
            tapCount++;
            if (tapCount >= maxSteps && !committed) nudge.el.hidden = false;
            refresh();
        },
        () => {
            const scores = resolve(vals);
            const { id: tierId, clear } = top(scores);
            if (!clear) return;
            committed = true;
            nudge.el.hidden = true;
            if (cta) cta.show(tiers[tierId]);
        },
        dims, tiers, resolve, top
    );

    function refresh() {
        const { clear } = update(vals, stepIndices);
        if (!clear && cta) cta.hide();
    }

    // Legend row — chips link to concept homes when available
    const legend = document.createElement('div');
    legend.className = 'svc-legend';
    dims.forEach(dim => {
        let chip;
        if (dim.home) {
            chip = document.createElement('a');
            chip.href = dim.home;
            chip.className = `svc-legend__chip svc-legend__chip--${dim.id}`;
        } else {
            chip = document.createElement('span');
            chip.className = `svc-legend__chip svc-legend__chip--${dim.id}`;
        }
        chip.style.setProperty('--node-color', dim.nodeColor);
        chip.textContent = dim.note;
        chip.setAttribute('title', dim.label);
        legend.appendChild(chip);
    });

    const note = document.createElement('p');
    note.className = 'svc-note';
    note.textContent = noteText;

    const wrapper = document.createElement('div');
    wrapper.className = 'svc-wrapper';
    const children = [svg, legend];
    if (cta) children.push(cta.el);
    children.push(nudge.el, note);
    wrapper.append(...children);
    container.appendChild(wrapper);

    refresh();
}

// ── Component init ─────────────────────────────────────────────────────────────
export function initServicesConfigurators(root = document) {
    root.querySelectorAll('[data-services-configurator]').forEach(container => {
        initWeightedField(container, {
            dims:      DIMS,
            tiers:     TIERS,
            resolveFn: resolveTiers,
            topTierFn: topTier,
            maxSteps:  MAX_STEPS,
            hasCta:    true,
        });
    });
}
