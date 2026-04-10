const SITE_SETTINGS_KEY = 'spw-site-settings';

const DEFAULT_SITE_SETTINGS = Object.freeze({
    navigatorDisplay: 'quiet',
    consoleDisplay: 'collapsed',
    viewportActivation: 'off'
});

const SETTING_OPTIONS = Object.freeze({
    navigatorDisplay: new Set(['quiet', 'full', 'hidden']),
    consoleDisplay: new Set(['collapsed', 'expanded', 'hidden']),
    viewportActivation: new Set(['off', 'on'])
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

    root.dataset.spwNavigator = normalized.navigatorDisplay;
    root.dataset.spwConsole = normalized.consoleDisplay;
    root.dataset.spwViewportActivation = normalized.viewportActivation;

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

const getFormSettings = (form) => normalizeSiteSettings({
    navigatorDisplay: form.elements.navigatorDisplay?.value,
    consoleDisplay: form.elements.consoleDisplay?.value,
    viewportActivation: form.elements.viewportActivation?.value
});

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
