const OPERATOR_DEFINITIONS = [
    {
        pattern: /^#>/,
        type: 'frame',
        label: 'frame declaration',
        prefix: '#>',
        intent: 'orient',
        interaction: 'activate or inspect a named frame'
    },
    {
        pattern: /^#:/,
        type: 'layer',
        label: 'layer marker',
        prefix: '#:',
        intent: 'qualify',
        interaction: 'inspect the interpretive layer or runtime constraint'
    },
    {
        pattern: /^\./,
        type: 'baseline',
        label: 'baseline member',
        prefix: '.',
        intent: 'settle',
        interaction: 'return to the local baseline, member, or default lens'
    },
    {
        pattern: /^\^/,
        type: 'object',
        label: 'object',
        prefix: '^',
        intent: 'elevate',
        interaction: 'open or inspect structured content'
    },
    {
        pattern: /^~/,
        type: 'ref',
        label: 'reference',
        prefix: '~',
        intent: 'refer',
        interaction: 'resolve a reference without forcing commitment'
    },
    {
        pattern: /^\?/,
        type: 'probe',
        label: 'probe',
        prefix: '?',
        intent: 'inquire',
        interaction: 'ask, filter, or reveal an exploratory lens'
    },
    {
        pattern: /^@/,
        type: 'action',
        label: 'action',
        prefix: '@',
        intent: 'act',
        interaction: 'commit a local action or projection'
    },
    {
        pattern: /^\*/,
        type: 'stream',
        label: 'stream',
        prefix: '*',
        intent: 'flow',
        interaction: 'connect to dynamic or event-like content'
    },
    {
        pattern: /^&/,
        type: 'merge',
        label: 'merge',
        prefix: '&',
        intent: 'integrate',
        interaction: 'overlay, compare, or combine fields'
    },
    {
        pattern: /^=/,
        type: 'binding',
        label: 'binding',
        prefix: '=',
        intent: 'bind',
        interaction: 'name, pin, or categorize a local value'
    },
    {
        pattern: /^\$/,
        type: 'meta',
        label: 'metacognitive reflection',
        prefix: '$',
        intent: 'reflect',
        interaction: 'inspect the medium, trace, or register itself'
    },
    {
        pattern: /^%/,
        type: 'normalize',
        label: 'normalization',
        prefix: '%',
        intent: 'scale',
        interaction: 'compare, normalize, or adjust salience'
    },
    {
        pattern: /^!/,
        type: 'pragma',
        label: 'pragma',
        prefix: '!',
        intent: 'constrain',
        interaction: 'apply or inspect a runtime force or constraint'
    },
    {
        pattern: /^>/,
        type: 'surface',
        label: 'surface',
        prefix: '>',
        intent: 'project',
        interaction: 'move into or inspect a rendered projection'
    }
];

const OPERATOR_PREFIXES = Object.fromEntries(
    OPERATOR_DEFINITIONS.map(({ type, prefix }) => [type, prefix])
);

const onDomReady = (callback) => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback, { once: true });
        return;
    }

    callback();
};

const getPageSurface = () => document.body?.dataset.spwSurface || '';

const getRequestedFeatures = () => new Set(
    (document.body?.dataset.spwFeatures || '')
        .split(/\s+/)
        .map((feature) => feature.trim())
        .filter(Boolean)
);

const getNavigationType = () => (
    performance.getEntriesByType?.('navigation')?.[0]?.type || 'navigate'
);

const matchesMaxWidth = (maxWidth) => (
    window.matchMedia(`(max-width: ${maxWidth}px)`).matches
);

const loadFeature = async (specifier, exportName) => {
    const module = await import(specifier);
    const init = module[exportName];
    if (typeof init === 'function') {
        return init();
    }
    return null;
};

// Re-export the bus so any module can reach it via spw-shared.
export { bus } from './spw-bus.js';

// Legacy thin-wrapper: routes through a direct DOM dispatch.
// New code should call bus.emit() with canonical names instead.
const emitSpwEvent = (name, detail) => {
    document.dispatchEvent(new CustomEvent(`spw:${name}`, { detail }));
};

const emitSpwAction = (token, description) => {
    emitSpwEvent('action', { token, description });
};

const detectOperator = (text = '') => {
    for (const operator of OPERATOR_DEFINITIONS) {
        if (operator.pattern.test(text)) return operator;
    }

    return null;
};

const getFrameMeta = (frame) => {
    if (!frame) {
        return {
            id: '',
            opType: null,
            prefix: null,
            sigilText: '#>frame',
            headingText: 'Frame'
        };
    }

    const sigil = frame.querySelector('.frame-sigil');
    const heading = frame.querySelector('h1, h2, h3');
    const sigilText = sigil?.textContent.trim() || (frame.id ? `#>${frame.id}` : '#>frame');
    const detected = detectOperator(sigilText);
    const opType = sigil?.dataset.spwOperator || detected?.type || null;

    return {
        id: frame.id || '',
        opType,
        prefix: opType ? (OPERATOR_PREFIXES[opType] ?? opType) : null,
        sigilText,
        headingText: heading?.textContent.trim() || frame.id || 'Frame'
    };
};

const isInputFocused = () => {
    const element = document.activeElement;
    return !!element && (
        element.tagName === 'INPUT'
        || element.tagName === 'TEXTAREA'
        || element.isContentEditable
    );
};

export {
    OPERATOR_DEFINITIONS,
    OPERATOR_PREFIXES,
    detectOperator,
    emitSpwAction,
    emitSpwEvent,
    getFrameMeta,
    getNavigationType,
    getPageSurface,
    getRequestedFeatures,
    isInputFocused,
    loadFeature,
    matchesMaxWidth,
    onDomReady
};
