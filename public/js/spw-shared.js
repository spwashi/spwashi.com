const OPERATOR_DEFINITIONS = [
    { pattern: /^#>/, type: 'frame', label: 'frame declaration', prefix: '#>' },
    { pattern: /^#:/, type: 'layer', label: 'layer marker', prefix: '#:' },
    { pattern: /^\^/, type: 'object', label: 'object', prefix: '^"' },
    { pattern: /^~/, type: 'ref', label: 'reference', prefix: '~"' },
    { pattern: /^\?/, type: 'probe', label: 'probe', prefix: '?[' },
    { pattern: /^@/, type: 'action', label: 'action', prefix: '@' },
    { pattern: /^\*/, type: 'stream', label: 'stream', prefix: '*' },
    { pattern: /^!/, type: 'pragma', label: 'pragma', prefix: '!' },
    { pattern: /^>/, type: 'surface', label: 'surface', prefix: '>' }
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

const getRequestedFeatures = () => new Set(
    (document.body?.dataset.spwFeatures || '')
        .split(/\s+/)
        .map((feature) => feature.trim())
        .filter(Boolean)
);

const loadFeature = async (specifier, exportName) => {
    const module = await import(specifier);
    const init = module[exportName];
    if (typeof init === 'function') {
        return init();
    }
    return null;
};

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
    getRequestedFeatures,
    isInputFocused,
    loadFeature,
    onDomReady
};
