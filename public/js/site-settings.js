import { bus } from './spw-bus.js';

const SITE_SETTINGS_KEY = 'spw-site-settings';
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
    subtle: 0.035,
    moderate: 0.055,
    rich: 0.08
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

const DEFAULT_SITE_SETTINGS = Object.freeze({
    // Navigation & Interface
    navigatorDisplay: 'quiet',
    consoleDisplay: 'hidden',
    viewportActivation: 'off',

    // Accessibility
    reduceMotion: 'off',
    highContrast: 'off',
    fontSize: 'normal',

    // Appearance
    colorMode: 'auto',
    operatorSaturation: 'normal',
    animationIntensity: 'normal',

    // Developer
    debugMode: 'off',
    showFrameMetadata: 'off',
    verboseLogging: 'off',

    // Typography
    fontSizeScale: '100',
    lineSpacing: 'normal',
    monospaceVariant: 'jetbrains',

    // Component Visibility
    showFooter: 'on',
    headerOpacity: 'normal',
    showSpecPills: 'off',

    // Performance
    animationThrottling: 'off',
    imageLazyLoading: 'on',

    // Progressive Enhancement
    enhancementLevel: 'minimal',
    semanticDensity: 'minimal',
    operatorPresentation: 'symbolic',
    infospaceComplexity: 'simple',
    cognitiveHandles: 'off',
    dimensionalBreadcrumbs: 'off',
    fractalNesting: 'off',

    // Semantic & Markup
    showSemanticMetadata: 'off',
    operatorHighlighting: 'off',
    relationalVisualization: 'off',
    phaseIndicators: 'off',
    depthIndicators: 'off',

    // Spirit Cycle & Dynamics
    currentSpiritPhase: 'expression',
    spiritPhaseAutoCycle: 'off',
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

    currentSpiritPhase: new Set(['initiation', 'resistance', 'transformation', 'expression', 'return']),
    spiritPhaseAutoCycle: new Set(['off', 'on']),
    grainIntensity: new Set(['none', 'subtle', 'moderate', 'rich']),

    enhancementLevel: new Set(['minimal', 'balanced', 'rich']),
    semanticDensity: new Set(['minimal', 'normal', 'rich']),
    operatorPresentation: new Set(['symbolic', 'full', 'text']),
    infospaceComplexity: new Set(['simple', 'adaptive', 'complex']),
    cognitiveHandles: new Set(['off', 'on']),
    dimensionalBreadcrumbs: new Set(['off', 'on']),
    fractalNesting: new Set(['off', 'on']),

    showSemanticMetadata: new Set(['off', 'on']),
    operatorHighlighting: new Set(['off', 'on']),
    relationalVisualization: new Set(['off', 'on']),
    phaseIndicators: new Set(['off', 'on']),
    depthIndicators: new Set(['off', 'on'])
});

const readStoredSettings = () => {
    try {
        const raw = localStorage.getItem(SITE_SETTINGS_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

const normalizeSiteSettings = (value = {}) => {
    const settings = { ...DEFAULT_SITE_SETTINGS };

    Object.keys(settings).forEach((key) => {
        if (SETTING_OPTIONS[key]?.has(value[key])) {
            settings[key] = value[key];
        }
    });

    return settings;
};

const getSiteSettings = () => normalizeSiteSettings(readStoredSettings());

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
            return;
        }

        if (original) {
            image.setAttribute('loading', original);
        } else {
            image.removeAttribute('loading');
        }
    });
};

const applySiteSettings = (settings = getSiteSettings()) => {
    const normalized = normalizeSiteSettings(settings);
    const root = document.documentElement;

    // Navigation & Interface
    root.dataset.spwNavigator = normalized.navigatorDisplay;
    root.dataset.spwConsole = normalized.consoleDisplay;
    root.dataset.spwViewportActivation = normalized.viewportActivation;

    // Accessibility
    root.dataset.spwReduceMotion = normalized.reduceMotion;
    root.dataset.spwHighContrast = normalized.highContrast;
    root.dataset.spwFontSize = normalized.fontSize;

    // Appearance
    root.dataset.spwColorMode = normalized.colorMode;
    root.dataset.spwOperatorSaturation = normalized.operatorSaturation;
    root.dataset.spwAnimationIntensity = normalized.animationIntensity;

    // Developer
    root.dataset.spwDebugMode = normalized.debugMode;
    root.dataset.spwShowFrameMetadata = normalized.showFrameMetadata;
    root.dataset.spwVerboseLogging = normalized.verboseLogging;

    // Typography
    root.dataset.spwFontSizeScale = normalized.fontSizeScale;
    root.dataset.spwLineSpacing = normalized.lineSpacing;
    root.dataset.spwMonospaceVariant = normalized.monospaceVariant;
    root.style.setProperty('--font-size-scale', `${normalized.fontSizeScale}%`);
    root.style.setProperty('--site-root-font-size', getRootFontSize(normalized));
    root.style.setProperty('--site-line-height', LINE_SPACING_VALUE[normalized.lineSpacing] || LINE_SPACING_VALUE.normal);
    root.style.setProperty('--site-mono-font', MONOSPACE_FONT_VALUE[normalized.monospaceVariant] || MONOSPACE_FONT_VALUE.jetbrains);

    // Component Visibility
    root.dataset.spwShowFooter = normalized.showFooter;
    root.dataset.spwHeaderOpacity = normalized.headerOpacity;
    root.dataset.spwShowSpecPills = normalized.showSpecPills;

    // Performance
    root.dataset.spwAnimationThrottling = normalized.animationThrottling;
    root.dataset.spwImageLazyLoading = normalized.imageLazyLoading;
    root.style.setProperty('--duration-instant', getDuration(normalized, 50));
    root.style.setProperty('--duration-fast', getDuration(normalized, 120));
    root.style.setProperty('--duration-base', getDuration(normalized, 200));
    root.style.setProperty('--duration-slow', getDuration(normalized, 400));

    // Spirit Cycle & Dynamics
    root.dataset.spwSpiritPhase = normalized.currentSpiritPhase;
    root.dataset.spwPhaseAutoCycle = normalized.spiritPhaseAutoCycle;
    root.dataset.spwGrainIntensity = normalized.grainIntensity;
    root.style.setProperty('--grain-opacity', getGrainOpacity(normalized));

    // Progressive Enhancement
    root.dataset.spwEnhancementLevel = normalized.enhancementLevel;
    root.dataset.spwSemanticDensity = normalized.semanticDensity;
    root.dataset.spwOperatorPresentation = normalized.operatorPresentation;
    root.dataset.spwInfospaceComplexity = normalized.infospaceComplexity;
    root.dataset.spwCognitiveHandles = normalized.cognitiveHandles;
    root.dataset.spwDimensionalBreadcrumbs = normalized.dimensionalBreadcrumbs;
    root.dataset.spwFractalNesting = normalized.fractalNesting;

    // Semantic & Markup
    root.dataset.spwShowSemanticMetadata = normalized.showSemanticMetadata;
    root.dataset.spwOperatorHighlighting = normalized.operatorHighlighting;
    root.dataset.spwRelationalVisualization = normalized.relationalVisualization;
    root.dataset.spwPhaseIndicators = normalized.phaseIndicators;
    root.dataset.spwDepthIndicators = normalized.depthIndicators;

    applyImageLoadingPreference(normalized);

    return normalized;
};

const emitSettingsChange = (settings) => {
    bus.emit('settings:changed', settings);
};

const saveSiteSettings = (nextSettings = {}) => {
    const settings = normalizeSiteSettings({
        ...getSiteSettings(),
        ...nextSettings
    });

    try {
        localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(settings));
    } catch {
        // The visual runtime can still follow the in-memory settings for this page.
    }

    applySiteSettings(settings);
    emitSettingsChange(settings);
    return settings;
};

const resetSiteSettings = () => {
    try {
        localStorage.removeItem(SITE_SETTINGS_KEY);
    } catch {
        // Ignore storage failures; defaults still apply in memory.
    }

    const settings = applySiteSettings(DEFAULT_SITE_SETTINGS);
    emitSettingsChange(settings);
    return settings;
};

const shouldUseViewportActivation = () => getSiteSettings().viewportActivation === 'on';

const getFormSettings = (form) => {
    const settings = {};
    Object.keys(DEFAULT_SITE_SETTINGS).forEach((key) => {
        const field = form.elements[key];
        if (field) settings[key] = field.value;
    });
    return normalizeSiteSettings(settings);
};

const writeSettingsToForm = (form, settings) => {
    Object.entries(normalizeSiteSettings(settings)).forEach(([name, value]) => {
        const field = form.elements[name];
        if (field) field.value = value;
    });
};

const setStatus = (node, message) => {
    if (!node) return;
    node.textContent = message;
};

const PRESETS = Object.freeze({
    calm: {
        navigatorDisplay: 'quiet', consoleDisplay: 'hidden', colorMode: 'auto',
        operatorSaturation: 'normal', animationIntensity: 'normal', grainIntensity: 'none',
        semanticDensity: 'minimal', operatorHighlighting: 'off',
        cognitiveHandles: 'off', showSemanticMetadata: 'off',
        phaseIndicators: 'off', depthIndicators: 'off',
        relationalVisualization: 'off', showSpecPills: 'off',
        enhancementLevel: 'minimal', infospaceComplexity: 'simple',
        dimensionalBreadcrumbs: 'off', fractalNesting: 'off',
        spiritPhaseAutoCycle: 'off', reduceMotion: 'off', highContrast: 'off'
    },
    rich: {
        semanticDensity: 'rich', grainIntensity: 'moderate',
        operatorSaturation: 'vibrant', animationIntensity: 'enhanced',
        operatorHighlighting: 'on', cognitiveHandles: 'on',
        showSemanticMetadata: 'on', phaseIndicators: 'on', showSpecPills: 'on',
        spiritPhaseAutoCycle: 'on', navigatorDisplay: 'full', consoleDisplay: 'collapsed'
    },
    developer: {
        navigatorDisplay: 'full', consoleDisplay: 'expanded',
        semanticDensity: 'rich', operatorHighlighting: 'on',
        cognitiveHandles: 'on', showSemanticMetadata: 'on',
        showSpecPills: 'on', phaseIndicators: 'on', grainIntensity: 'none'
    },
    accessible: {
        highContrast: 'on', reduceMotion: 'on', fontSize: 'large',
        fontSizeScale: '120', lineSpacing: 'loose', animationIntensity: 'reduced',
        animationThrottling: 'heavy', grainIntensity: 'none',
        cognitiveHandles: 'on', showSemanticMetadata: 'on',
        navigatorDisplay: 'full', consoleDisplay: 'collapsed'
    }
});

const initSiteSettingsPage = () => {
    const form = document.querySelector('[data-site-settings-form]');
    if (!form) return;

    const status = document.querySelector('[data-site-settings-status]');
    const resetButton = form.querySelector('[data-site-settings-reset]');
    const initialSettings = applySiteSettings();

    writeSettingsToForm(form, initialSettings);
    setStatus(status, 'Settings are stored locally in this browser.');

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        saveSiteSettings(getFormSettings(form));
        setStatus(status, 'Saved.');
    });

    form.addEventListener('change', () => {
        saveSiteSettings(getFormSettings(form));
        setStatus(status, 'Saved.');
    });

    resetButton?.addEventListener('click', () => {
        const settings = resetSiteSettings();
        writeSettingsToForm(form, settings);
        setStatus(status, 'Reset to calm defaults.');
    });

    // Preset buttons
    document.querySelectorAll('[data-preset]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const presetName = btn.dataset.preset;
            const preset = PRESETS[presetName];
            if (!preset) return;

            const merged = { ...getSiteSettings(), ...preset };
            const settings = saveSiteSettings(merged);
            writeSettingsToForm(form, settings);
            setStatus(status, `Applied "${presetName}" preset.`);
        });
    });

    // PWA status
    initPwaStatusDisplay();
};

const initPwaStatusDisplay = () => {
    const installEl = document.querySelector('[data-pwa-install-status]');
    const swEl = document.querySelector('[data-pwa-sw-status]');
    const cacheEl = document.querySelector('[data-pwa-cache-status]');
    const connectionEl = document.querySelector('[data-pwa-connection-status]');

    if (!installEl) return;

    // Install status
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;
    installEl.textContent = isStandalone ? 'Installed' : 'Browser tab';
    installEl.dataset.status = isStandalone ? 'active' : 'inactive';

    // Service worker
    if (navigator.serviceWorker?.controller) {
        swEl.textContent = 'Active';
        swEl.dataset.status = 'active';
    } else if (navigator.serviceWorker) {
        swEl.textContent = 'Registering...';
        swEl.dataset.status = 'inactive';
        navigator.serviceWorker.ready.then(() => {
            swEl.textContent = 'Active';
            swEl.dataset.status = 'active';
        });
    } else {
        swEl.textContent = 'Unsupported';
        swEl.dataset.status = 'error';
    }

    // Cache
    if ('caches' in window) {
        caches.keys().then((names) => {
            const count = names.length;
            cacheEl.textContent = count > 0 ? `${count} cache${count > 1 ? 's' : ''}` : 'Empty';
            cacheEl.dataset.status = count > 0 ? 'active' : 'inactive';
        });
    } else {
        cacheEl.textContent = 'Unsupported';
        cacheEl.dataset.status = 'error';
    }

    // Connection
    const updateConnection = () => {
        const online = navigator.onLine;
        connectionEl.textContent = online ? 'Online' : 'Offline';
        connectionEl.dataset.status = online ? 'active' : 'inactive';
    };
    updateConnection();
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);
};

export {
    DEFAULT_SITE_SETTINGS,
    SITE_SETTINGS_KEY,
    applySiteSettings,
    getSiteSettings,
    initSiteSettingsPage,
    resetSiteSettings,
    saveSiteSettings,
    shouldUseViewportActivation
};
