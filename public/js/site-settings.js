/**
 * Site Settings Manager
 * ---------------------------------------------------------------------------
 * Purpose
 * - Central hub for site-wide preferences.
 * - Normalizes persisted settings, applies them to the document, and exposes
 *   architectural modifiers for other systems.
 *
 * Primary concerns
 * - navigation / console visibility
 * - accessibility / typography / motion
 * - semantic density / operator presentation / infospace complexity
 * - developmental climate
 * - cognitive handles / metadata / relational visualization
 * - performance and progressive enhancement
 *
 * Design stance
 * - HTML/CSS should read stable datasets and CSS custom properties.
 * - JS modules should be able to ask for derived architectural modifiers
 *   rather than re-deriving them ad hoc.
 * - No transition layer for older spirit-phase vocabulary is kept here.
 */

import { bus } from './spw-bus.js';

const SITE_SETTINGS_KEY = 'spw-site-settings';

/* ==========================================================================
   1. Static registries
   ========================================================================== */

const FONT_SIZE_PRESET_MULTIPLIER = Object.freeze({
    small: 0.93,
    normal: 1,
    large: 1.12
});

const LINE_SPACING_VALUE = Object.freeze({
    compact: '1.55',
    normal: '1.68',
    loose: '1.82'
});

const MONOSPACE_FONT_VALUE = Object.freeze({
    system: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
    jetbrains: '"JetBrains Mono", monospace',
    courier: '"Courier New", Courier, monospace'
});

const GRAIN_INTENSITY_VALUE = Object.freeze({
    none: 0,
    subtle: 0.018,
    moderate: 0.032,
    rich: 0.055
});

const SEMANTIC_GRAIN_OFFSET = Object.freeze({
    minimal: -0.01,
    normal: 0,
    rich: 0.01
});

const MOTION_INTENSITY_MULTIPLIER = Object.freeze({
    reduced: 0.82,
    normal: 1,
    enhanced: 1.18
});

const ANIMATION_THROTTLE_MULTIPLIER = Object.freeze({
    off: 1,
    light: 0.76,
    heavy: 0.4
});

const OPERATOR_SATURATION_FACTOR = Object.freeze({
    muted: 0.84,
    normal: 1,
    vibrant: 1.16
});

const SEMANTIC_DENSITY_FACTOR = Object.freeze({
    minimal: 0.84,
    normal: 1,
    rich: 1.18
});

const ENHANCEMENT_FACTOR = Object.freeze({
    minimal: 0.84,
    balanced: 1,
    rich: 1.18
});

const INFOSPACE_FACTOR = Object.freeze({
    simple: 0.82,
    adaptive: 1,
    complex: 1.18
});

const OPERATOR_PRESENTATION_FACTOR = Object.freeze({
    symbolic: 1,
    full: 1.08,
    text: 0.82
});

const HEADER_OPACITY_VALUE = Object.freeze({
    low: '0.76',
    normal: '0.9',
    high: '1'
});

const DEVELOPMENTAL_CLIMATES = Object.freeze({
    orient: Object.freeze({
        id: 'orient',
        label: 'kindle',
        learningMode: 'entry',
        description: 'Open the frame, notice cues, and sense the terrain before forcing conclusions.',
        clarity: 0.56,
        pressure: 0.24,
        atmosphere: 0.32,
        memory: 0.12,
        resonance: 0.18,
        chargeBias: 0.18,
        selectionBias: 0.18,
        recipeBias: Object.freeze(['survey', 'naming', 'entry']),
        wonderBias: Object.freeze(['orientation', 'inquiry'])
    }),
    anchor: Object.freeze({
        id: 'anchor',
        label: 'anchor',
        learningMode: 'stabilize',
        description: 'Name distinctions, stabilize references, and give the surface something firm to stand on.',
        clarity: 0.74,
        pressure: 0.46,
        atmosphere: 0.12,
        memory: 0.32,
        resonance: 0.14,
        chargeBias: 0.22,
        selectionBias: 0.32,
        recipeBias: Object.freeze(['contrast', 'grounding', 'naming']),
        wonderBias: Object.freeze(['memory', 'constraint'])
    }),
    weave: Object.freeze({
        id: 'weave',
        label: 'weave',
        learningMode: 'connect',
        description: 'Relate examples, build parallels, and connect local structure to neighboring concepts.',
        clarity: 0.68,
        pressure: 0.42,
        atmosphere: 0.2,
        memory: 0.2,
        resonance: 0.36,
        chargeBias: 0.26,
        selectionBias: 0.24,
        recipeBias: Object.freeze(['comparison', 'mapping', 'analogy']),
        wonderBias: Object.freeze(['comparison', 'resonance'])
    }),
    rehearse: Object.freeze({
        id: 'rehearse',
        label: 'rehearse',
        learningMode: 'practice',
        description: 'Retrieve, vary, test, and practice until the pattern can be used rather than merely recognized.',
        clarity: 0.7,
        pressure: 0.38,
        atmosphere: 0.16,
        memory: 0.42,
        resonance: 0.22,
        chargeBias: 0.2,
        selectionBias: 0.28,
        recipeBias: Object.freeze(['retrieval', 'variation', 'practice']),
        wonderBias: Object.freeze(['memory', 'constraint'])
    }),
    offer: Object.freeze({
        id: 'offer',
        label: 'offer',
        learningMode: 'publish',
        description: 'Externalize the work through explanation, publication, teaching, or a usable contribution.',
        clarity: 0.84,
        pressure: 0.3,
        atmosphere: 0.1,
        memory: 0.22,
        resonance: 0.28,
        chargeBias: 0.3,
        selectionBias: 0.34,
        recipeBias: Object.freeze(['publication', 'teaching', 'projection']),
        wonderBias: Object.freeze(['projection', 'resonance'])
    })
});

const DEFAULT_SITE_SETTINGS = Object.freeze({
    /* Navigation & Interface */
    navigatorDisplay: 'quiet',
    consoleDisplay: 'hidden',
    viewportActivation: 'off',

    /* Accessibility */
    reduceMotion: 'off',
    highContrast: 'off',
    fontSize: 'normal',

    /* Appearance */
    colorMode: 'auto',
    operatorSaturation: 'normal',
    animationIntensity: 'normal',

    /* Developer */
    debugMode: 'off',
    showFrameMetadata: 'off',
    verboseLogging: 'off',

    /* Typography */
    fontSizeScale: '100',
    lineSpacing: 'normal',
    monospaceVariant: 'jetbrains',

    /* Component Visibility */
    showFooter: 'on',
    headerOpacity: 'normal',
    showSpecPills: 'off',

    /* Performance */
    animationThrottling: 'off',
    imageLazyLoading: 'on',

    /* Progressive Enhancement */
    enhancementLevel: 'minimal',
    semanticDensity: 'minimal',
    operatorPresentation: 'symbolic',
    infospaceComplexity: 'simple',
    cognitiveHandles: 'off',
    dimensionalBreadcrumbs: 'off',
    fractalNesting: 'off',
    implementationMutations: 'off',

    /* Semantic & Markup */
    showSemanticMetadata: 'off',
    operatorHighlighting: 'off',
    relationalVisualization: 'off',
    developmentalIndicators: 'off',
    depthIndicators: 'off',

    /* Developmental Climate */
    currentDevelopmentalClimate: 'orient',
    developmentalClimateAutoCycle: 'off',

    /* Material Grain */
    grainIntensity: 'subtle'
});

const SETTING_OPTIONS = Object.freeze({
    navigatorDisplay: new Set(['quiet', 'full', 'hidden']),
    consoleDisplay: new Set(['collapsed', 'expanded', 'hidden']),
    viewportActivation: new Set(['off', 'on']),

    reduceMotion: new Set(['off', 'on']),
    highContrast: new Set(['off', 'on']),
    fontSize: new Set(['small', 'normal', 'large']),

    colorMode: new Set(['auto', 'light', 'dark']),
    operatorSaturation: new Set(['muted', 'normal', 'vibrant']),
    animationIntensity: new Set(['reduced', 'normal', 'enhanced']),

    debugMode: new Set(['off', 'on']),
    showFrameMetadata: new Set(['off', 'on']),
    verboseLogging: new Set(['off', 'on']),

    fontSizeScale: new Set(['80', '90', '100', '110', '120']),
    lineSpacing: new Set(['compact', 'normal', 'loose']),
    monospaceVariant: new Set(['system', 'jetbrains', 'courier']),

    showFooter: new Set(['on', 'off']),
    headerOpacity: new Set(['low', 'normal', 'high']),
    showSpecPills: new Set(['on', 'off']),

    animationThrottling: new Set(['off', 'light', 'heavy']),
    imageLazyLoading: new Set(['on', 'off']),

    enhancementLevel: new Set(['minimal', 'balanced', 'rich']),
    semanticDensity: new Set(['minimal', 'normal', 'rich']),
    operatorPresentation: new Set(['symbolic', 'full', 'text']),
    infospaceComplexity: new Set(['simple', 'adaptive', 'complex']),
    cognitiveHandles: new Set(['off', 'on']),
    dimensionalBreadcrumbs: new Set(['off', 'on']),
    fractalNesting: new Set(['off', 'on']),
    implementationMutations: new Set(['off', 'on']),

    showSemanticMetadata: new Set(['off', 'on']),
    operatorHighlighting: new Set(['off', 'on']),
    relationalVisualization: new Set(['off', 'on']),
    developmentalIndicators: new Set(['off', 'on']),
    depthIndicators: new Set(['off', 'on']),

    currentDevelopmentalClimate: new Set(Object.keys(DEVELOPMENTAL_CLIMATES)),
    developmentalClimateAutoCycle: new Set(['off', 'on']),

    grainIntensity: new Set(['none', 'subtle', 'moderate', 'rich'])
});

const PRESETS = Object.freeze({
    hearth: {
        currentDevelopmentalClimate: 'orient',
        navigatorDisplay: 'quiet',
        consoleDisplay: 'hidden',
        colorMode: 'auto',
        operatorSaturation: 'normal',
        animationIntensity: 'normal',
        grainIntensity: 'none',
        semanticDensity: 'minimal',
        operatorHighlighting: 'off',
        cognitiveHandles: 'off',
        showSemanticMetadata: 'off',
        developmentalIndicators: 'off',
        depthIndicators: 'off',
        relationalVisualization: 'off',
        showSpecPills: 'off',
        enhancementLevel: 'minimal',
        infospaceComplexity: 'simple',
        dimensionalBreadcrumbs: 'off',
        fractalNesting: 'off',
        implementationMutations: 'off',
        developmentalClimateAutoCycle: 'off',
        reduceMotion: 'off',
        highContrast: 'off'
    },
    loom: {
        currentDevelopmentalClimate: 'weave',
        semanticDensity: 'rich',
        grainIntensity: 'moderate',
        operatorSaturation: 'vibrant',
        animationIntensity: 'enhanced',
        operatorHighlighting: 'on',
        cognitiveHandles: 'on',
        showSemanticMetadata: 'on',
        developmentalIndicators: 'on',
        showSpecPills: 'on',
        relationalVisualization: 'on',
        enhancementLevel: 'rich',
        infospaceComplexity: 'adaptive',
        dimensionalBreadcrumbs: 'on',
        developmentalClimateAutoCycle: 'on',
        navigatorDisplay: 'full',
        consoleDisplay: 'collapsed'
    },
    workshop: {
        currentDevelopmentalClimate: 'anchor',
        navigatorDisplay: 'full',
        consoleDisplay: 'expanded',
        semanticDensity: 'rich',
        operatorHighlighting: 'on',
        cognitiveHandles: 'on',
        showSemanticMetadata: 'on',
        showSpecPills: 'on',
        developmentalIndicators: 'on',
        relationalVisualization: 'on',
        implementationMutations: 'on',
        grainIntensity: 'none',
        debugMode: 'on',
        showFrameMetadata: 'on'
    },
    access: {
        currentDevelopmentalClimate: 'anchor',
        highContrast: 'on',
        reduceMotion: 'on',
        fontSize: 'large',
        fontSizeScale: '120',
        lineSpacing: 'loose',
        animationIntensity: 'reduced',
        animationThrottling: 'heavy',
        grainIntensity: 'none',
        cognitiveHandles: 'on',
        showSemanticMetadata: 'on',
        developmentalIndicators: 'on',
        navigatorDisplay: 'full',
        consoleDisplay: 'collapsed'
    }
});

/* ==========================================================================
   2. Storage & normalization
   ========================================================================== */

const storage = {
    get() {
        try {
            const raw = localStorage.getItem(SITE_SETTINGS_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    },
    set(settings) {
        try {
            localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(settings));
        } catch {
            /* non-fatal */
        }
    },
    clear() {
        try {
            localStorage.removeItem(SITE_SETTINGS_KEY);
        } catch {
            /* non-fatal */
        }
    }
};

const normalizeSiteSettings = (value = {}) => {
    const settings = { ...DEFAULT_SITE_SETTINGS };

    Object.keys(settings).forEach((key) => {
        const candidate = value[key];
        if (SETTING_OPTIONS[key]?.has(candidate)) {
            settings[key] = candidate;
        }
    });

    return settings;
};

/* ==========================================================================
   3. Pure helpers
   ========================================================================== */

const clampNumber = (value, min, max) => Math.min(max, Math.max(min, value));

const getRootFontSize = (settings) => {
    const scale = Number(settings.fontSizeScale) || 100;
    const presetMultiplier = FONT_SIZE_PRESET_MULTIPLIER[settings.fontSize] || 1;
    return `${Math.round(scale * presetMultiplier)}%`;
};

const getGrainOpacity = (settings) => {
    const base = GRAIN_INTENSITY_VALUE[settings.grainIntensity] ?? GRAIN_INTENSITY_VALUE.subtle;
    const semanticOffset = SEMANTIC_GRAIN_OFFSET[settings.semanticDensity] ?? 0;
    return String(clampNumber(base + semanticOffset, 0, 0.08));
};

const getMotionScale = (settings) => {
    if (settings.reduceMotion === 'on') return 0.01;
    const intensity = MOTION_INTENSITY_MULTIPLIER[settings.animationIntensity] || 1;
    const throttle = ANIMATION_THROTTLE_MULTIPLIER[settings.animationThrottling] || 1;
    return intensity * throttle;
};

const getDuration = (settings, milliseconds) => (
    `${Math.max(1, Math.round(milliseconds * getMotionScale(settings)))}ms`
);

const applyImageLoadingPreference = (settings) => {
    document.querySelectorAll('img').forEach((image) => {
        if (!image.dataset.spwLoadingOriginal) {
            image.dataset.spwLoadingOriginal = image.getAttribute('loading') || '';
        }

        const original = image.dataset.spwLoadingOriginal;

        if (settings.imageLazyLoading === 'off' && original === 'lazy') {
            image.setAttribute('loading', 'eager');
        } else if (original) {
            image.setAttribute('loading', original);
        } else {
            image.removeAttribute('loading');
        }
    });
};

const getDevelopmentalClimateDefinition = (settings) => (
    DEVELOPMENTAL_CLIMATES[settings.currentDevelopmentalClimate] || DEVELOPMENTAL_CLIMATES.orient
);

const deriveArchitecturalModifiers = (settings) => {
    const climate = getDevelopmentalClimateDefinition(settings);
    const motionScale = getMotionScale(settings);
    const semanticDensityFactor = SEMANTIC_DENSITY_FACTOR[settings.semanticDensity] || 1;
    const enhancementFactor = ENHANCEMENT_FACTOR[settings.enhancementLevel] || 1;
    const infospaceFactor = INFOSPACE_FACTOR[settings.infospaceComplexity] || 1;
    const operatorPresentationFactor = OPERATOR_PRESENTATION_FACTOR[settings.operatorPresentation] || 1;
    const operatorSaturationFactor = OPERATOR_SATURATION_FACTOR[settings.operatorSaturation] || 1;
    const cognitiveFactor = settings.cognitiveHandles === 'on' ? 1 : 0;
    const relationalFactor = settings.relationalVisualization === 'on' ? 1 : 0;
    const metadataFactor = settings.showSemanticMetadata === 'on' ? 1 : 0;

    const ecology = {
        clarity: clampNumber(climate.clarity * enhancementFactor, 0, 1),
        pressure: clampNumber(climate.pressure * infospaceFactor, 0, 1),
        atmosphere: clampNumber(climate.atmosphere * enhancementFactor, 0, 1),
        memory: clampNumber(climate.memory * semanticDensityFactor, 0, 1),
        resonance: clampNumber(climate.resonance * (1 + (relationalFactor * 0.18)), 0, 1),
        chargeBias: clampNumber(climate.chargeBias * operatorSaturationFactor, 0, 1),
        selectionBias: clampNumber(climate.selectionBias * semanticDensityFactor, 0, 1),
        permeabilityBase: clampNumber(
            0.18
            + ((settings.enhancementLevel === 'rich') ? 0.16 : settings.enhancementLevel === 'balanced' ? 0.08 : 0)
            + (cognitiveFactor * 0.18)
            + (metadataFactor * 0.12)
            + (settings.implementationMutations === 'on' ? 0.18 : 0),
            0,
            1
        )
    };

    return Object.freeze({
        typography: Object.freeze({
            rootFontSize: getRootFontSize(settings),
            lineHeight: LINE_SPACING_VALUE[settings.lineSpacing] || LINE_SPACING_VALUE.normal,
            monoFont: MONOSPACE_FONT_VALUE[settings.monospaceVariant] || MONOSPACE_FONT_VALUE.jetbrains,
            headerOpacity: HEADER_OPACITY_VALUE[settings.headerOpacity] || HEADER_OPACITY_VALUE.normal
        }),
        motion: Object.freeze({
            scale: motionScale,
            instant: getDuration(settings, 50),
            fast: getDuration(settings, 120),
            base: getDuration(settings, 200),
            slow: getDuration(settings, 400)
        }),
        grain: Object.freeze({
            opacity: getGrainOpacity(settings)
        }),
        climate,
        ecology: Object.freeze(ecology),
        semantic: Object.freeze({
            densityFactor: semanticDensityFactor,
            enhancementFactor,
            infospaceFactor,
            operatorPresentationFactor,
            operatorSaturationFactor,
            cognitiveFactor,
            relationalFactor,
            metadataFactor
        })
    });
};

/* ==========================================================================
   4. Core manager
   ========================================================================== */

class SiteSettingsManager {
    constructor() {
        this.root = document.documentElement;
        this._initialized = false;
        this._pwaInitialized = false;
    }

    get() {
        return normalizeSiteSettings(storage.get());
    }

    getModifiers(settings = this.get()) {
        return deriveArchitecturalModifiers(normalizeSiteSettings(settings));
    }

    apply(settings = this.get()) {
        const normalized = normalizeSiteSettings(settings);
        const modifiers = this.getModifiers(normalized);
        const climate = modifiers.climate;

        /* datasets */
        this.root.dataset.spwNavigator = normalized.navigatorDisplay;
        this.root.dataset.spwConsole = normalized.consoleDisplay;
        this.root.dataset.spwViewportActivation = normalized.viewportActivation;

        this.root.dataset.spwReduceMotion = normalized.reduceMotion;
        this.root.dataset.spwHighContrast = normalized.highContrast;
        this.root.dataset.spwFontSize = normalized.fontSize;

        this.root.dataset.spwColorMode = normalized.colorMode;
        this.root.dataset.spwOperatorSaturation = normalized.operatorSaturation;
        this.root.dataset.spwAnimationIntensity = normalized.animationIntensity;

        this.root.dataset.spwDebugMode = normalized.debugMode;
        this.root.dataset.spwShowFrameMetadata = normalized.showFrameMetadata;
        this.root.dataset.spwVerboseLogging = normalized.verboseLogging;

        this.root.dataset.spwFontSizeScale = normalized.fontSizeScale;
        this.root.dataset.spwLineSpacing = normalized.lineSpacing;
        this.root.dataset.spwMonospaceVariant = normalized.monospaceVariant;

        this.root.dataset.spwShowFooter = normalized.showFooter;
        this.root.dataset.spwHeaderOpacity = normalized.headerOpacity;
        this.root.dataset.spwShowSpecPills = normalized.showSpecPills;

        this.root.dataset.spwAnimationThrottling = normalized.animationThrottling;
        this.root.dataset.spwImageLazyLoading = normalized.imageLazyLoading;

        this.root.dataset.spwEnhancementLevel = normalized.enhancementLevel;
        this.root.dataset.spwSemanticDensity = normalized.semanticDensity;
        this.root.dataset.spwOperatorPresentation = normalized.operatorPresentation;
        this.root.dataset.spwInfospaceComplexity = normalized.infospaceComplexity;
        this.root.dataset.spwCognitiveHandles = normalized.cognitiveHandles;
        this.root.dataset.spwDimensionalBreadcrumbs = normalized.dimensionalBreadcrumbs;
        this.root.dataset.spwFractalNesting = normalized.fractalNesting;
        this.root.dataset.spwImplementationMutations = normalized.implementationMutations;

        this.root.dataset.spwShowSemanticMetadata = normalized.showSemanticMetadata;
        this.root.dataset.spwOperatorHighlighting = normalized.operatorHighlighting;
        this.root.dataset.spwRelationalVisualization = normalized.relationalVisualization;
        this.root.dataset.spwDevelopmentalIndicators = normalized.developmentalIndicators;
        this.root.dataset.spwDepthIndicators = normalized.depthIndicators;

        this.root.dataset.spwDevelopmentalClimate = normalized.currentDevelopmentalClimate;
        this.root.dataset.spwDevelopmentalLabel = climate.label;
        this.root.dataset.spwLearningMode = climate.learningMode;
        this.root.dataset.spwDevelopmentalClimateAutoCycle = normalized.developmentalClimateAutoCycle;

        this.root.dataset.spwGrainIntensity = normalized.grainIntensity;

        /* CSS custom properties */
        this.root.style.setProperty('--font-size-scale', `${normalized.fontSizeScale}%`);
        this.root.style.setProperty('--site-root-font-size', modifiers.typography.rootFontSize);
        this.root.style.setProperty('--site-line-height', modifiers.typography.lineHeight);
        this.root.style.setProperty('--site-mono-font', modifiers.typography.monoFont);
        this.root.style.setProperty('--site-header-opacity', modifiers.typography.headerOpacity);

        this.root.style.setProperty('--duration-instant', modifiers.motion.instant);
        this.root.style.setProperty('--duration-fast', modifiers.motion.fast);
        this.root.style.setProperty('--duration-base', modifiers.motion.base);
        this.root.style.setProperty('--duration-slow', modifiers.motion.slow);
        this.root.style.setProperty('--spw-motion-scale', String(modifiers.motion.scale));

        this.root.style.setProperty('--grain-opacity', modifiers.grain.opacity);

        this.root.style.setProperty('--spw-semantic-density-factor', String(modifiers.semantic.densityFactor));
        this.root.style.setProperty('--spw-enhancement-factor', String(modifiers.semantic.enhancementFactor));
        this.root.style.setProperty('--spw-infospace-factor', String(modifiers.semantic.infospaceFactor));
        this.root.style.setProperty('--spw-operator-presentation-factor', String(modifiers.semantic.operatorPresentationFactor));
        this.root.style.setProperty('--spw-operator-saturation-factor', String(modifiers.semantic.operatorSaturationFactor));
        this.root.style.setProperty('--spw-cognitive-handle-factor', String(modifiers.semantic.cognitiveFactor));
        this.root.style.setProperty('--spw-relational-factor', String(modifiers.semantic.relationalFactor));
        this.root.style.setProperty('--spw-semantic-metadata-factor', String(modifiers.semantic.metadataFactor));

        this.root.style.setProperty('--spw-developmental-clarity', String(modifiers.ecology.clarity));
        this.root.style.setProperty('--spw-developmental-pressure', String(modifiers.ecology.pressure));
        this.root.style.setProperty('--spw-developmental-atmosphere', String(modifiers.ecology.atmosphere));
        this.root.style.setProperty('--spw-developmental-memory', String(modifiers.ecology.memory));
        this.root.style.setProperty('--spw-developmental-resonance', String(modifiers.ecology.resonance));
        this.root.style.setProperty('--spw-developmental-charge-bias', String(modifiers.ecology.chargeBias));
        this.root.style.setProperty('--spw-developmental-selection-bias', String(modifiers.ecology.selectionBias));
        this.root.style.setProperty('--spw-surface-permeability-base', String(modifiers.ecology.permeabilityBase));

        applyImageLoadingPreference(normalized);

        return normalized;
    }

    save(nextSettings = {}) {
        const current = this.get();
        const merged = normalizeSiteSettings({ ...current, ...nextSettings });
        storage.set(merged);
        const applied = this.apply(merged);
        bus.emit('settings:changed', applied);
        return applied;
    }

    reset() {
        storage.clear();
        const applied = this.apply(DEFAULT_SITE_SETTINGS);
        bus.emit('settings:changed', applied);
        return applied;
    }

    shouldUseViewportActivation() {
        return this.get().viewportActivation === 'on';
    }

    describePreset(name) {
        const preset = PRESETS[name];
        if (!preset) return null;

        const merged = normalizeSiteSettings({ ...DEFAULT_SITE_SETTINGS, ...preset });
        const climate = DEVELOPMENTAL_CLIMATES[merged.currentDevelopmentalClimate];

        return {
            name,
            settings: merged,
            climate: climate.label,
            learningMode: climate.learningMode
        };
    }
}

const manager = new SiteSettingsManager();

/* ==========================================================================
   5. Public API
   ========================================================================== */

const getSiteSettings = () => manager.get();
const getSiteSettingModifiers = (settings) => manager.getModifiers(settings);
const applySiteSettings = (settings) => manager.apply(settings);
const saveSiteSettings = (nextSettings) => manager.save(nextSettings);
const resetSiteSettings = () => manager.reset();
const shouldUseViewportActivation = () => manager.shouldUseViewportActivation();

const emitSettingsChange = (settings) => {
    bus.emit('settings:changed', settings);
};

/* ==========================================================================
   6. Settings page UI
   ========================================================================== */

const writeSettingsToForm = (form, settings) => {
    Object.entries(normalizeSiteSettings(settings)).forEach(([name, value]) => {
        const field = form.elements[name];
        if (field) field.value = value;
    });
};

const initSiteSettingsPage = () => {
    const form = document.querySelector('[data-site-settings-form]');
    if (!form || manager._initialized) return;

    manager._initialized = true;

    const status = document.querySelector('[data-site-settings-status]');
    const resetButton = form.querySelector('[data-site-settings-reset]');

    const setStatus = (message, type = 'info') => {
        if (!status) return;

        status.textContent = message;
        status.dataset.status = type;

        clearTimeout(status._timeout);
        status._timeout = setTimeout(() => {
            if (status.textContent === message) {
                status.textContent = 'Settings saved locally.';
                status.dataset.status = 'info';
            }
        }, 3000);
    };

    const saveForm = () => {
        const formSettings = {};
        Object.keys(DEFAULT_SITE_SETTINGS).forEach((key) => {
            const field = form.elements[key];
            if (field) formSettings[key] = field.value;
        });

        const saved = saveSiteSettings(formSettings);
        writeSettingsToForm(form, saved);
        setStatus('Saved.', 'success');
    };

    const initialSettings = applySiteSettings();
    writeSettingsToForm(form, initialSettings);
    setStatus('Settings are stored locally in this browser.', 'info');

    let debounceTimer = null;
    form.addEventListener('change', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(saveForm, 80);
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        saveForm();
    });

    resetButton?.addEventListener('click', () => {
        const settings = resetSiteSettings();
        writeSettingsToForm(form, settings);
        setStatus('Reset to hearth defaults.', 'success');
    });

    document.querySelectorAll('[data-preset]').forEach((button) => {
        button.addEventListener('click', () => {
            const presetName = button.dataset.preset;
            const preset = PRESETS[presetName];
            if (!preset) return;

            const merged = { ...getSiteSettings(), ...preset };
            const saved = saveSiteSettings(merged);
            writeSettingsToForm(form, saved);

            const description = manager.describePreset(presetName);
            setStatus(`Applied "${presetName}" preset · ${description?.climate || 'climate'}.`, 'success');

            button.classList.add('is-applied');
            setTimeout(() => button.classList.remove('is-applied'), 1200);
        });
    });

    initPwaStatusDisplay();
};

/* ==========================================================================
   7. PWA status
   ========================================================================== */

const initPwaStatusDisplay = () => {
    if (manager._pwaInitialized) return;
    manager._pwaInitialized = true;

    const installEl = document.querySelector('[data-pwa-install-status]');
    const swEl = document.querySelector('[data-pwa-sw-status]');
    const cacheEl = document.querySelector('[data-pwa-cache-status]');
    const connectionEl = document.querySelector('[data-pwa-connection-status]');

    if (!installEl) return;

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;

    installEl.textContent = isStandalone ? 'Installed' : 'Browser tab';
    installEl.dataset.status = isStandalone ? 'active' : 'inactive';

    if (navigator.serviceWorker?.controller) {
        swEl.textContent = 'Active';
        swEl.dataset.status = 'active';
    } else if (navigator.serviceWorker) {
        swEl.textContent = 'Registering…';
        swEl.dataset.status = 'inactive';
        navigator.serviceWorker.ready.then(() => {
            swEl.textContent = 'Active';
            swEl.dataset.status = 'active';
        }).catch(() => {
            swEl.textContent = 'Error';
            swEl.dataset.status = 'error';
        });
    } else {
        swEl.textContent = 'Unsupported';
        swEl.dataset.status = 'error';
    }

    if ('caches' in window) {
        caches.keys().then((names) => {
            const count = names.length;
            cacheEl.textContent = count > 0 ? `${count} cache${count > 1 ? 's' : ''}` : 'Empty';
            cacheEl.dataset.status = count > 0 ? 'active' : 'inactive';
        }).catch(() => {
            cacheEl.textContent = 'Error';
            cacheEl.dataset.status = 'error';
        });
    } else {
        cacheEl.textContent = 'Unsupported';
        cacheEl.dataset.status = 'error';
    }

    const updateConnection = () => {
        const online = navigator.onLine;
        connectionEl.textContent = online ? 'Online' : 'Offline';
        connectionEl.dataset.status = online ? 'active' : 'inactive';
    };

    updateConnection();
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);
};

/* ==========================================================================
   8. Runtime API
   ========================================================================== */

if (typeof window !== 'undefined') {
    window.spwSettings = {
        get: getSiteSettings,
        getModifiers: getSiteSettingModifiers,
        save: saveSiteSettings,
        reset: resetSiteSettings,
        apply: applySiteSettings,
        presets: PRESETS,
        describePreset: (name) => manager.describePreset(name),
        manager
    };
}

/* ==========================================================================
   9. Exports
   ========================================================================== */

export {
    DEFAULT_SITE_SETTINGS,
    DEVELOPMENTAL_CLIMATES,
    PRESETS,
    SITE_SETTINGS_KEY,
    applySiteSettings,
    emitSettingsChange,
    getSiteSettingModifiers,
    getSiteSettings,
    initSiteSettingsPage,
    resetSiteSettings,
    saveSiteSettings,
    shouldUseViewportActivation
};