const SITE_SETTINGS_KEY = 'spw-site-settings';

const DEFAULT_SITE_SETTINGS = Object.freeze({
    // Navigation & Interface
    navigatorDisplay: 'quiet',
    consoleDisplay: 'collapsed',
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
    showSpecPills: 'on',

    // Performance
    animationThrottling: 'off',
    imageLazyLoading: 'on'
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
    imageLazyLoading: new Set(['on', 'off'])
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

    // Component Visibility
    root.dataset.spwShowFooter = normalized.showFooter;
    root.dataset.spwHeaderOpacity = normalized.headerOpacity;
    root.dataset.spwShowSpecPills = normalized.showSpecPills;

    // Performance
    root.dataset.spwAnimationThrottling = normalized.animationThrottling;
    root.dataset.spwImageLazyLoading = normalized.imageLazyLoading;

    return normalized;
};

const emitSettingsChange = (settings) => {
    document.dispatchEvent(new CustomEvent('spw:settings-change', { detail: settings }));
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
        setStatus(status, 'Saved locally. Viewport activation changes apply fully on the next page load.');
    });

    form.addEventListener('change', () => {
        saveSiteSettings(getFormSettings(form));
        setStatus(status, 'Saved locally. Viewport activation changes apply fully on the next page load.');
    });

    resetButton?.addEventListener('click', () => {
        const settings = resetSiteSettings();
        writeSettingsToForm(form, settings);
        setStatus(status, 'Reset to calm defaults.');
    });
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
