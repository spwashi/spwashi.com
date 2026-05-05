/**
 * Spw Reactive Spine
 *
 * Binds the 14-operator SVG diagram to live system events via SpwBus.
 * The cognitive spine becomes an instrument, not a static map.
 *
 * Each canonical bus event lights the corresponding operator node:
 *
 *   frame:activated     → frame  (orient — navigation, anchoring)
 *   frame:mode          → action (commit — mode commit)
 *   operator:phased     → object (elevate — lifecycle phase)
 *   operator:activated  → pragma (constrain — operator fired)
 *   brace:charged       → probe  (inquire — hover/touch began)
 *   brace:sustained     → probe  (inquire — held attention)
 *   brace:projected     → ref    (refer   — drag, flow extension)
 *   brace:moved         → stream (flow    — sustained motion)
 *   brace:pinned        → binding(bind    — locked in place)
 *   brace:swapped       → merge  (integrate — swap resolved)
 *   spell:checkpoint    → stream (flow    — progress marker)
 *   field:charged       → surface(project — electromagnetic field)
 *   presets:measured    → normalize(scale — measurement complete)
 *   topic:selected      → topic  (connect — topic discovery active)
 *   copy:succeeded      → action (commit  — export/emit)
 *
 * CSS charge classes applied to SVG nodes mirror the existing
 * data-spw-charge vocabulary so spw-cinematic.css rules apply.
 */

import { bus } from '/public/js/spw-bus.js';

const EVENT_TO_OPERATOR = {
    'frame:activated':    'frame',
    'frame:mode':         'action',
    'operator:phased':    'object',
    'operator:activated': 'pragma',
    'brace:charged':      'probe',
    'brace:sustained':    'probe',
    'brace:projected':    'ref',
    'brace:moved':        'stream',
    'brace:pinned':       'binding',
    'brace:swapped':      'merge',
    'spell:checkpoint':   'stream',
    'field:charged':      'surface',
    'presets:measured':   'normalize',
    'topic:selected':     'ref',
    'copy:succeeded':     'action',
};

const EVENT_TO_CHARGE = {
    'brace:charged':      'charging',
    'brace:projected':    'active',
    'brace:moved':        'active',
    'brace:sustained':    'sustained',
    'spell:checkpoint':   'active',
    'field:charged':      'active',
    'copy:succeeded':     'sustained',
    'presets:measured':   'charging',
};

const DECAY_MS = 700;

export function initReactiveSpine() {
    // Locate the SVG operator diagram
    const spineFigure = document.querySelector('.spw-svg-flow-diagram')?.closest('figure');
    if (!spineFigure) return;

    // Build operator → SVG node map from .op-node--{operator} classes
    const nodeMap = new Map();
    spineFigure.querySelectorAll('[class*="op-node--"]').forEach(el => {
        const match = [...el.classList].find(c => c.startsWith('op-node--') && c !== 'op-node');
        if (!match) return;
        const operator = match.replace('op-node--', '');
        nodeMap.set(operator, el);
    });

    if (!nodeMap.size) return;

    // Timers for charge decay
    const decayTimers = new Map();

    function pulse(operator, chargeState = 'active') {
        const node = nodeMap.get(operator);
        if (!node) return;

        // Clear any pending decay
        clearTimeout(decayTimers.get(operator));

        // Apply charge class
        node.dataset.spwCharge = chargeState;
        node.classList.add('op-node--charged');

        // Write timestamp for CSS animations that use it
        node.dataset.spwPulseTs = String(Date.now());

        // Decay after DECAY_MS
        decayTimers.set(operator, setTimeout(() => {
            delete node.dataset.spwCharge;
            delete node.dataset.spwPulseTs;
            node.classList.remove('op-node--charged');
        }, DECAY_MS));
    }

    // Subscribe to all mapped events
    Object.entries(EVENT_TO_OPERATOR).forEach(([eventName, operator]) => {
        bus.on(eventName, () => {
            const chargeState = EVENT_TO_CHARGE[eventName] ?? 'active';
            pulse(operator, chargeState);
        });
    });

    // Expose for programmatic use
    window.spwSpine = {
        pulse,
        nodes: () => Object.fromEntries(nodeMap),
        operators: () => [...nodeMap.keys()]
    };
}
