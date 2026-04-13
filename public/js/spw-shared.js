import { bus } from './spw-bus.js';

/**
 * Spw Shared
 * ---------------------------------------------------------------------------
 * Purpose
 * - Shared semantic/runtime utilities used across the Spw front-end.
 * - Central source of truth for operator metadata, event aliasing, page-level
 *   context, layered instantiation, and lightweight feature/module loading.
 *
 * Design goals
 * - HTML-first: prefer explicit data attributes when present.
 * - Layered instantiation: make it easy for modules to resolve the same
 *   substrate/form/role/context/field/recipe stack consistently.
 * - Future-proof spell and recipe work: provide shared helpers now without
 *   forcing a final ontology too early.
 * - Bus-first eventing: route canonical events through SpwBus while preserving
 *   backward-compatible DOM pathways where needed.
 */

/* ==========================================================================
   1. Operator registry
   --------------------------------------------------------------------------
   Operators are treated as semantic particles with a stable type/prefix plus
   room for culturally tested interaction, genre, and recipe development.
   ========================================================================== */

const OPERATOR_DEFINITIONS = Object.freeze([
    {
        pattern: /^#>/,
        type: 'frame',
        label: 'frame declaration',
        prefix: '#>',
        intent: 'orient',
        interaction: 'activate or inspect a named frame',
        family: 'structural'
    },
    {
        pattern: /^#:/,
        type: 'layer',
        label: 'layer marker',
        prefix: '#:',
        intent: 'qualify',
        interaction: 'inspect the interpretive layer or runtime constraint',
        family: 'structural'
    },
    {
        pattern: /^\./,
        type: 'baseline',
        label: 'baseline member',
        prefix: '.',
        intent: 'settle',
        interaction: 'return to the local baseline, member, or default lens',
        family: 'grounding'
    },
    {
        pattern: /^\^/,
        type: 'object',
        label: 'object',
        prefix: '^',
        intent: 'elevate',
        interaction: 'open or inspect structured content',
        family: 'structural'
    },
    {
        pattern: /^~/,
        type: 'ref',
        label: 'reference',
        prefix: '~',
        intent: 'refer',
        interaction: 'resolve a reference without forcing commitment',
        family: 'relational'
    },
    {
        pattern: /^\?/,
        type: 'probe',
        label: 'probe',
        prefix: '?',
        intent: 'inquire',
        interaction: 'ask, filter, or reveal an exploratory lens',
        family: 'inquiry'
    },
    {
        pattern: /^@/,
        type: 'action',
        label: 'action',
        prefix: '@',
        intent: 'act',
        interaction: 'commit a local action or projection',
        family: 'operative'
    },
    {
        pattern: /^\*/,
        type: 'stream',
        label: 'stream',
        prefix: '*',
        intent: 'flow',
        interaction: 'connect to dynamic or event-like content',
        family: 'relational'
    },
    {
        pattern: /^&/,
        type: 'merge',
        label: 'merge',
        prefix: '&',
        intent: 'integrate',
        interaction: 'overlay, compare, or combine fields',
        family: 'relational'
    },
    {
        pattern: /^=/,
        type: 'binding',
        label: 'binding',
        prefix: '=',
        intent: 'bind',
        interaction: 'name, pin, or categorize a local value',
        family: 'grounding'
    },
    {
        pattern: /^\$/,
        type: 'meta',
        label: 'metacognitive reflection',
        prefix: '$',
        intent: 'reflect',
        interaction: 'inspect the medium, trace, or register itself',
        family: 'reflective'
    },
    {
        pattern: /^%/,
        type: 'normalize',
        label: 'normalization',
        prefix: '%',
        intent: 'scale',
        interaction: 'compare, normalize, or adjust salience',
        family: 'reflective'
    },
    {
        pattern: /^!/,
        type: 'pragma',
        label: 'pragma',
        prefix: '!',
        intent: 'constrain',
        interaction: 'apply or inspect a runtime force or constraint',
        family: 'operative'
    },
    {
        pattern: /^>/,
        type: 'surface',
        label: 'surface',
        prefix: '>',
        intent: 'project',
        interaction: 'move into or inspect a rendered projection',
        family: 'projective'
    },
    {
        pattern: /^</,
        type: 'topic',
        label: 'topic lens',
        prefix: '<',
        intent: 'scope',
        interaction: 'enter or define a topical boundary — <topic> or (scene) <> (scene)',
        family: 'scoping'
    }
]);

const OPERATOR_BY_TYPE = Object.freeze(
    Object.fromEntries(OPERATOR_DEFINITIONS.map((definition) => [definition.type, definition]))
);

const OPERATOR_BY_PREFIX = Object.freeze(
    Object.fromEntries(OPERATOR_DEFINITIONS.map((definition) => [definition.prefix, definition]))
);

const OPERATOR_PREFIXES = Object.freeze(
    Object.fromEntries(OPERATOR_DEFINITIONS.map(({ type, prefix }) => [type, prefix]))
);

const OPERATOR_INTENTS = Object.freeze(
    Object.fromEntries(OPERATOR_DEFINITIONS.map(({ type, intent }) => [type, intent]))
);

const OPERATOR_FAMILIES = Object.freeze(
    Object.fromEntries(OPERATOR_DEFINITIONS.map(({ type, family }) => [type, family]))
);

const OPERATOR_PREFIX_RE = /^(#>|#:|\.|\^|~|\?|@|\*|&|=|\$|%|!|>|<)/;

/* ==========================================================================
   2. Shared taxonomies
   --------------------------------------------------------------------------
   These are intentionally lightweight. They provide stable hooks for future
   spell/recipe development without overcommitting to one final metaphysics.
   ========================================================================== */

const SPW_WONDER_CATEGORIES = Object.freeze([
    'orientation',
    'inquiry',
    'comparison',
    'memory',
    'projection',
    'constraint',
    'resonance'
]);

const SPW_RECIPE_CHANNELS = Object.freeze([
    'syntax',
    'surface',
    'gesture',
    'memory',
    'ritual',
    'publication'
]);

const SPW_INSTANTIATION_LAYERS = Object.freeze([
    {
        name: 'substrate',
        description: 'operator/material basis for a local encounter'
    },
    {
        name: 'form',
        description: 'brace/block/inline mode of local address'
    },
    {
        name: 'role',
        description: 'local task or rhetorical function'
    },
    {
        name: 'context',
        description: 'reading/analysis/routing/ritual/play/settings climate'
    },
    {
        name: 'field',
        description: 'wonder, permeability, room, succession, and local charge'
    },
    {
        name: 'recipe',
        description: 'culturally tested or emerging genre pattern'
    }
]);

/* ==========================================================================
   3. Normalization helpers
   ========================================================================== */

const normalizeText = (value = '') => value.replace(/\s+/g, ' ').trim();

const humanize = (value = '') => normalizeText(value)
    .replace(/[_-]+/g, ' ')
    .toLowerCase();

const normalizeToken = (value = '') => humanize(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const readDataTokens = (value = '') => new Set(
    String(value)
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(Boolean)
);

const readBooleanDataFlag = (element, name, fallback = false) => {
    const raw = element?.dataset?.[name];
    if (raw == null || raw === '') return fallback;
    return raw === 'true' || raw === 'on' || raw === '1';
};

const getHtmlRoot = () => document.documentElement;
const getBody = () => document.body;

/* ==========================================================================
   4. DOM/runtime helpers
   ========================================================================== */

const onDomReady = (callback) => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback, { once: true });
        return;
    }

    callback();
};

const getPageSurface = () => document.body?.dataset.spwSurface || '';

const getRequestedFeatures = () => readDataTokens(document.body?.dataset.spwFeatures || '');

const getNavigationType = () => (
    performance.getEntriesByType?.('navigation')?.[0]?.type || 'navigate'
);

const matchesMaxWidth = (maxWidth) => (
    window.matchMedia(`(max-width: ${maxWidth}px)`).matches
);

const isInputFocused = () => {
    const element = document.activeElement;
    return !!element && (
        element.tagName === 'INPUT'
        || element.tagName === 'TEXTAREA'
        || element.isContentEditable
    );
};

/* ==========================================================================
   5. Operator detection + lookup
   ========================================================================== */

const extractOperatorPrefix = (text = '') => {
    const match = normalizeText(text).match(OPERATOR_PREFIX_RE);
    return match?.[0] || '';
};

const detectOperator = (text = '') => {
    const normalized = normalizeText(text);

    for (const operator of OPERATOR_DEFINITIONS) {
        if (operator.pattern.test(normalized)) return operator;
    }

    return null;
};

const getOperatorDefinition = (type = '') => (
    OPERATOR_BY_TYPE[normalizeToken(type)] || null
);

const detectOperatorFromElement = (element) => {
    if (!(element instanceof Element)) return null;

    const explicitType = normalizeToken(
        element.dataset.spwOperator
        || element.closest?.('[data-spw-operator]')?.dataset.spwOperator
        || ''
    );

    if (explicitType && OPERATOR_BY_TYPE[explicitType]) {
        return OPERATOR_BY_TYPE[explicitType];
    }

    const text = (
        element.dataset.spwSigil
        || element.textContent
        || element.querySelector?.('.frame-sigil, .frame-card-sigil, .operator-card-token')?.textContent
        || ''
    );

    return detectOperator(text);
};

const describeOperator = (value = '') => {
    const byType = getOperatorDefinition(value);
    if (byType) return byType;

    return detectOperator(value);
};

/* ==========================================================================
   6. Ecology + instantiation resolution
   ========================================================================== */

const resolveSurfaceEcology = (element = document.body) => ({
    surface: normalizeToken(
        element?.dataset?.spwSurface
        || document.body?.dataset?.spwSurface
        || ''
    ),
    context: normalizeToken(
        element?.dataset?.spwContext
        || element?.closest?.('[data-spw-context]')?.dataset?.spwContext
        || ''
    ),
    wonder: normalizeToken(
        element?.dataset?.spwWonder
        || element?.closest?.('[data-spw-wonder]')?.dataset?.spwWonder
        || ''
    ),
    permeability: normalizeToken(
        element?.dataset?.spwPermeability
        || element?.closest?.('[data-spw-permeability]')?.dataset?.spwPermeability
        || ''
    ),
    room: normalizeToken(
        element?.dataset?.spwRoom
        || element?.closest?.('[data-spw-room]')?.dataset?.spwRoom
        || ''
    ),
    succession: normalizeToken(
        element?.dataset?.spwSuccession
        || element?.closest?.('[data-spw-succession]')?.dataset?.spwSuccession
        || ''
    ),
    recipe: normalizeToken(
        element?.dataset?.spwRecipe
        || element?.closest?.('[data-spw-recipe]')?.dataset?.spwRecipe
        || ''
    ),
    spell: normalizeToken(
        element?.dataset?.spwSpell
        || element?.closest?.('[data-spw-spell]')?.dataset?.spwSpell
        || ''
    )
});

const resolveInstantiation = (element, overrides = {}) => {
    const operator = detectOperatorFromElement(element);
    const ecology = resolveSurfaceEcology(element);

    return Object.freeze({
        substrate: overrides.substrate
            || normalizeToken(element?.dataset?.spwSubstrate || '')
            || operator?.type
            || '',
        form: overrides.form
            || normalizeToken(element?.dataset?.spwForm || '')
            || '',
        role: overrides.role
            || normalizeToken(element?.dataset?.spwRole || '')
            || '',
        context: overrides.context || ecology.context || '',
        field: {
            wonder: overrides.wonder || ecology.wonder || '',
            permeability: overrides.permeability || ecology.permeability || '',
            room: overrides.room || ecology.room || '',
            succession: overrides.succession || ecology.succession || ''
        },
        recipe: {
            name: overrides.recipe || ecology.recipe || '',
            spell: overrides.spell || ecology.spell || '',
            channels: overrides.channels || []
        },
        operator: operator?.type || '',
        operatorDefinition: operator || null
    });
};

const createSpwRuntimeContext = (root = document, overrides = {}) => {
    const html = getHtmlRoot();
    const body = getBody();

    return Object.freeze({
        root,
        html,
        body,
        surface: overrides.surface || getPageSurface(),
        features: overrides.features || getRequestedFeatures(),
        navigationType: overrides.navigationType || getNavigationType(),
        ecology: overrides.ecology || resolveSurfaceEcology(body),
        timestamp: Date.now()
    });
};

/* ==========================================================================
   7. Feature loading
   --------------------------------------------------------------------------
   Supports:
   - named init export
   - default export function
   - spwModule.mount(context)
   - first exported init* function fallback
   ========================================================================== */

const resolveFeatureInitializer = (module, exportName) => {
    if (exportName && typeof module?.[exportName] === 'function') {
        return {
            kind: 'named',
            fn: module[exportName]
        };
    }

    if (typeof module?.spwModule?.mount === 'function') {
        return {
            kind: 'module-contract',
            fn: module.spwModule.mount
        };
    }

    if (typeof module?.default === 'function') {
        return {
            kind: 'default',
            fn: module.default
        };
    }

    const fallbackName = Object.keys(module || {}).find((key) => /^init[A-Z]/.test(key) && typeof module[key] === 'function');
    if (fallbackName) {
        return {
            kind: 'fallback-init',
            fn: module[fallbackName]
        };
    }

    return null;
};

const loadFeature = async (specifier, exportName, options = {}) => {
    const module = await import(specifier);
    const resolved = resolveFeatureInitializer(module, exportName);

    if (!resolved) return null;

    const context = options.context || createSpwRuntimeContext(options.root || document);
    const args = Array.isArray(options.args) ? options.args : [];

    if (resolved.kind === 'module-contract') {
        return resolved.fn(context);
    }

    return resolved.fn(...args);
};

/* ==========================================================================
   8. Event emission
   --------------------------------------------------------------------------
   Prefer canonical bus names, but preserve older local helper usage.
   ========================================================================== */

const EVENT_ALIASES = Object.freeze({
    'frame-change': 'frame:activated',
    'mode-change': 'frame:mode',
    'phase-change': 'spirit:shifted',
    'operator-activated': 'operator:activated',
    'settings-change': 'settings:changed'
});

const emitSpwEvent = (name, detail = {}, options = {}) => {
    const rawName = String(name || '').replace(/^spw:/, '');
    const canonicalName = EVENT_ALIASES[rawName] || rawName;

    if (canonicalName.includes(':')) {
        return bus.emit(canonicalName, detail, options);
    }

    const target = options.target || document;
    const bubbles = options.bubbles ?? true;
    const enriched = {
        ...detail,
        _name: `spw:${canonicalName}`,
        _ts: Date.now(),
        _source: canonicalName.split(':')[0] || 'spw'
    };

    target.dispatchEvent(new CustomEvent(`spw:${canonicalName}`, {
        detail: enriched,
        bubbles,
        composed: true
    }));

    return {
        name: canonicalName,
        detail: enriched,
        ts: enriched._ts
    };
};

const emitSpwAction = (token, description, options = {}) => {
    const detail = typeof token === 'object' && token !== null
        ? token
        : { token, description };

    const result = bus.emit('spell:cast', detail, options);

    const target = options.target || document;
    target.dispatchEvent(new CustomEvent('spw:action', {
        detail: {
            ...detail,
            _name: 'spw:action',
            _ts: Date.now(),
            _source: 'spell'
        },
        bubbles: options.bubbles ?? true,
        composed: true
    }));

    return result;
};

/* ==========================================================================
   9. Frame metadata
   ========================================================================== */

const getFrameMeta = (frame) => {
    if (!frame) {
        return {
            id: '',
            opType: null,
            prefix: null,
            sigilText: '#>frame',
            headingText: 'Frame',
            operatorLabel: 'frame declaration',
            intent: 'orient',
            family: 'structural',
            context: '',
            wonder: ''
        };
    }

    const sigil = frame.querySelector('.frame-sigil');
    const heading = frame.querySelector('h1, h2, h3');
    const sigilText = normalizeText(
        sigil?.textContent || (frame.id ? `#>${frame.id}` : '#>frame')
    );
    const detected = detectOperator(sigilText);
    const opType = normalizeToken(sigil?.dataset.spwOperator || detected?.type || '');
    const definition = getOperatorDefinition(opType) || detected;
    const ecology = resolveSurfaceEcology(frame);

    return {
        id: frame.id || '',
        opType: definition?.type || opType || null,
        prefix: definition?.prefix || (opType ? (OPERATOR_PREFIXES[opType] ?? opType) : null),
        sigilText,
        headingText: normalizeText(heading?.textContent || frame.id || 'Frame'),
        operatorLabel: definition?.label || 'frame declaration',
        intent: definition?.intent || '',
        family: definition?.family || '',
        context: ecology.context || '',
        wonder: ecology.wonder || ''
    };
};

/* ==========================================================================
   10. Small convenience helpers for future HTML-based enhancement
   ========================================================================== */

const getElementLabel = (element) => normalizeText(
    element?.dataset?.spwLabel
    || element?.getAttribute?.('aria-label')
    || element?.querySelector?.('h1, h2, h3, h4, strong, figcaption')?.textContent
    || element?.textContent
    || ''
);

const getSpellProfile = (element) => Object.freeze({
    spell: normalizeToken(
        element?.dataset?.spwSpell
        || element?.closest?.('[data-spw-spell]')?.dataset?.spwSpell
        || ''
    ),
    recipe: normalizeToken(
        element?.dataset?.spwRecipe
        || element?.closest?.('[data-spw-recipe]')?.dataset?.spwRecipe
        || ''
    ),
    genre: normalizeToken(
        element?.dataset?.spwGenre
        || element?.closest?.('[data-spw-genre]')?.dataset?.spwGenre
        || ''
    )
});

/* ==========================================================================
   11. Exports
   ========================================================================== */

export { bus };

export {
    OPERATOR_DEFINITIONS,
    OPERATOR_BY_PREFIX,
    OPERATOR_BY_TYPE,
    OPERATOR_FAMILIES,
    OPERATOR_INTENTS,
    OPERATOR_PREFIXES,
    SPW_INSTANTIATION_LAYERS,
    SPW_RECIPE_CHANNELS,
    SPW_WONDER_CATEGORIES,
    createSpwRuntimeContext,
    describeOperator,
    detectOperator,
    detectOperatorFromElement,
    emitSpwAction,
    emitSpwEvent,
    extractOperatorPrefix,
    getBody,
    getElementLabel,
    getFrameMeta,
    getHtmlRoot,
    getNavigationType,
    getOperatorDefinition,
    getPageSurface,
    getRequestedFeatures,
    getSpellProfile,
    humanize,
    isInputFocused,
    loadFeature,
    matchesMaxWidth,
    normalizeText,
    normalizeToken,
    onDomReady,
    readBooleanDataFlag,
    readDataTokens,
    resolveInstantiation,
    resolveSurfaceEcology
};