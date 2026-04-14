/**
 * Spw Pretext Presets
 *
 * Purpose
 * - Measure representative text archetypes across the site using Pretext.
 * - Convert those measurements into inspectable CSS variables and a structured
 *   runtime payload for layout tuning, CSS heuristics, and model handoff.
 *
 * On init, it:
 *   1. Samples representative text from the current page
 *   2. Groups text into archetypes:
 *        body, heading, subheading, label, code, control, sigil
 *   3. Measures each archetype at phone / tablet / desktop widths
 *   4. Derives wider site presets such as:
 *        card min-height
 *        panel readable width
 *        control min-width
 *        caption rhythm height
 *   5. Writes CSS custom properties onto :root:
 *        --spw-preset-<archetype>-lines-<band>
 *        --spw-preset-<archetype>-height-<band>
 *        --spw-preset-<archetype>-width-max
 *        --spw-preset-<archetype>-width-avg
 *   6. Exposes window.spwPresets for inspection
 *
 * Bus events:
 *   presets:measured { ...full measurement payload }
 */

import { bus } from './spw-bus.js';
import { loadPretext } from './pretext-utils.js';

const BREAKPOINTS = Object.freeze({
    phone: 320,
    tablet: 768,
    desktop: 1200,
});

const WIDTH_INSETS = Object.freeze({
    phone: 32,
    tablet: 64,
    desktop: 128,
});

const DEFAULT_SAMPLES = Object.freeze({
    body: 'The signal does not change; only the water that was obscuring it is removed.',
    heading: 'Spwashi Pretext Surface',
    subheading: 'Measured text rhythms for responsive semantic composition',
    label: 'phase · mode · selection',
    code: '^seed[Spw.Preset.Measurement v:0.2] .. text<>measure<>projection',
    control: 'Activate frame',
    sigil: '{ ? ~ @ & * ^ }',
});

let pretext = null;
let lastMeasurement = null;
let resizeTimer = null;

function toTextList(nodes) {
    return nodes
        .map((node) => node?.textContent?.trim() || '')
        .filter(Boolean);
}

function getLongest(strings = []) {
    return strings.reduce((longest, value) => (
        value.length > longest.length ? value : longest
    ), '');
}

function getAverage(numbers = []) {
    if (!numbers.length) return 0;
    return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function selectRepresentativeByLength(strings = [], fallback = '') {
    if (!strings.length) return fallback;
    const sorted = [...strings].sort((a, b) => a.length - b.length);
    return sorted[Math.floor(sorted.length / 2)] || fallback;
}

function queryTexts(selectors = []) {
    return selectors.flatMap((selector) => toTextList(Array.from(document.querySelectorAll(selector))));
}

function sampleArchetypes() {
    const bodyTexts = queryTexts([
        'main p',
        '.frame-panel p',
        '.frame-card p',
        '[data-spw-surface] p',
        '.site-figure figcaption',
    ]);

    const headingTexts = queryTexts([
        'main h1',
        'main h2',
        '.site-frame h1',
        '.site-frame h2',
        '.frame-title',
        '.page-title',
    ]);

    const subheadingTexts = queryTexts([
        'main h3',
        'main h4',
        '.frame-card h3',
        '.frame-panel h3',
        '.lede',
        '.deck',
    ]);

    const labelTexts = queryTexts([
        '.operator-chip',
        '.frame-list a',
        '.frame-card-label',
        '.mode-switch button',
        '[data-mode-group][data-set-mode]',
        'label',
        '.chip',
        '.tag',
    ]);

    const codeTexts = queryTexts([
        'code',
        'pre',
        '.syntax-token',
        '.spw-code',
        '.seed-card code',
    ]);

    const controlTexts = queryTexts([
        'button',
        '.mode-switch button',
        '[role="button"]',
        '.cta',
        '.frame-sigil',
    ]);

    const sigilTexts = queryTexts([
        '.frame-sigil',
        '.frame-card-sigil',
        '.operator-card .sigil',
        '[data-header-op-slot]',
    ]);

    return {
        body: {
            representative: getLongest(bodyTexts) || DEFAULT_SAMPLES.body,
            all: bodyTexts.length ? bodyTexts : [DEFAULT_SAMPLES.body],
        },
        heading: {
            representative: getLongest(headingTexts) || DEFAULT_SAMPLES.heading,
            all: headingTexts.length ? headingTexts : [DEFAULT_SAMPLES.heading],
        },
        subheading: {
            representative: selectRepresentativeByLength(subheadingTexts, DEFAULT_SAMPLES.subheading),
            all: subheadingTexts.length ? subheadingTexts : [DEFAULT_SAMPLES.subheading],
        },
        label: {
            representative: selectRepresentativeByLength(labelTexts, DEFAULT_SAMPLES.label),
            all: labelTexts.length ? labelTexts : [DEFAULT_SAMPLES.label],
        },
        code: {
            representative: getLongest(codeTexts) || DEFAULT_SAMPLES.code,
            all: codeTexts.length ? codeTexts : [DEFAULT_SAMPLES.code],
        },
        control: {
            representative: selectRepresentativeByLength(controlTexts, DEFAULT_SAMPLES.control),
            all: controlTexts.length ? controlTexts : [DEFAULT_SAMPLES.control],
        },
        sigil: {
            representative: getLongest(sigilTexts) || DEFAULT_SAMPLES.sigil,
            all: sigilTexts.length ? sigilTexts : [DEFAULT_SAMPLES.sigil],
        },
    };
}

function getComputedFont(selector, fallback) {
    const el = document.querySelector(selector);
    if (!el) return fallback;

    const style = getComputedStyle(el);
    return style.font || `${style.fontSize} ${style.fontFamily}` || fallback;
}

function getLineHeightPx(selector, fallbackPx) {
    const el = document.querySelector(selector);
    if (!el) return fallbackPx;

    const style = getComputedStyle(el);
    const fontSize = parseFloat(style.fontSize) || 16;
    const raw = style.lineHeight;

    if (!raw || raw === 'normal') {
        return Math.round(fontSize * 1.5);
    }

    const parsed = parseFloat(raw);
    if (!Number.isFinite(parsed)) {
        return fallbackPx;
    }

    return raw.endsWith('px')
        ? Math.round(parsed)
        : Math.round(parsed * fontSize);
}

function getFontProfiles() {
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

    return {
        body: {
            font: getComputedFont('main p, .frame-panel p, .frame-card p', '16px system-ui'),
            lineHeightPx: getLineHeightPx('main p, .frame-panel p, .frame-card p', Math.round(rootFontSize * 1.68)),
        },
        heading: {
            font: getComputedFont('main h1, main h2, .frame-title', '700 28px system-ui'),
            lineHeightPx: getLineHeightPx('main h1, main h2, .frame-title', Math.round(rootFontSize * 1.22)),
        },
        subheading: {
            font: getComputedFont('main h3, main h4, .frame-card h3', '600 20px system-ui'),
            lineHeightPx: getLineHeightPx('main h3, main h4, .frame-card h3', Math.round(rootFontSize * 1.3)),
        },
        label: {
            font: getComputedFont('.operator-chip, .mode-switch button, label', '500 14px system-ui'),
            lineHeightPx: getLineHeightPx('.operator-chip, .mode-switch button, label', Math.round(rootFontSize * 1.25)),
        },
        code: {
            font: getComputedFont('code, pre, .syntax-token', '14px JetBrains Mono, monospace'),
            lineHeightPx: getLineHeightPx('code, pre, .syntax-token', Math.round(rootFontSize * 1.45)),
        },
        control: {
            font: getComputedFont('button, .cta, [role="button"]', '600 15px system-ui'),
            lineHeightPx: getLineHeightPx('button, .cta, [role="button"]', Math.round(rootFontSize * 1.2)),
        },
        sigil: {
            font: getComputedFont('.frame-sigil, .frame-card-sigil', '14px JetBrains Mono, monospace'),
            lineHeightPx: getLineHeightPx('.frame-sigil, .frame-card-sigil', Math.round(rootFontSize * 1.2)),
        },
    };
}

function prepareAndMeasure(text, font, width, lineHeightPx) {
    const prepared = pretext.prepareWithSegments(text, font, { whiteSpace: 'normal' });
    return pretext.layoutWithLines(prepared, width, lineHeightPx);
}

function measureWidthUnwrapped(text, font, lineHeightPx) {
    const result = prepareAndMeasure(text, font, 9999, lineHeightPx);
    return Math.round(
        result.lines.reduce((max, line) => Math.max(max, line.width || 0), 0)
    );
}

function getBandWidth(band) {
    return BREAKPOINTS[band] - WIDTH_INSETS[band];
}

function measureArchetypeBand(text, profile, band) {
    const width = getBandWidth(band);
    const result = prepareAndMeasure(text, profile.font, width, profile.lineHeightPx);

    return {
        width,
        lineCount: result.lineCount ?? result.lines.length,
        height: Math.round(result.height ?? (result.lines.length * profile.lineHeightPx)),
        maxLineWidth: Math.round(
            result.lines.reduce((max, line) => Math.max(max, line.width || 0), 0)
        ),
    };
}

function measureArchetype(name, sample, profile) {
    const byBand = Object.fromEntries(
        Object.keys(BREAKPOINTS).map((band) => [band, measureArchetypeBand(sample.representative, profile, band)])
    );

    const widths = sample.all.map((text) => measureWidthUnwrapped(text, profile.font, profile.lineHeightPx));
    const maxWidth = Math.round(Math.max(...widths, 0));
    const avgWidth = Math.round(getAverage(widths));
    const representativeWidth = measureWidthUnwrapped(sample.representative, profile.font, profile.lineHeightPx);

    return {
        name,
        sampleCount: sample.all.length,
        representative: sample.representative.length > 140
            ? `${sample.representative.slice(0, 140)}…`
            : sample.representative,
        lineHeightPx: profile.lineHeightPx,
        widths: {
            representative: representativeWidth,
            max: maxWidth,
            average: avgWidth,
        },
        phone: byBand.phone,
        tablet: byBand.tablet,
        desktop: byBand.desktop,
    };
}

function deriveComponentPresets(measurements) {
    const body = measurements.body;
    const heading = measurements.heading;
    const subheading = measurements.subheading;
    const label = measurements.label;
    const code = measurements.code;
    const control = measurements.control;
    const sigil = measurements.sigil;

    return {
        card: {
            minHeightPhone: Math.round(body.phone.height * 0.7 + heading.phone.height * 0.6 + 32),
            minHeightTablet: Math.round(body.tablet.height * 0.62 + heading.tablet.height * 0.5 + 40),
            readableWidth: Math.round(Math.min(body.desktop.width, Math.max(body.widths.average * 1.1, 420))),
        },
        panel: {
            minHeightPhone: Math.round(body.phone.height + subheading.phone.height + 36),
            minHeightTablet: Math.round(body.tablet.height * 0.9 + subheading.tablet.height + 48),
            readableWidth: Math.round(Math.min(760, Math.max(body.widths.average * 1.25, 480))),
        },
        control: {
            minWidth: Math.round(Math.max(control.widths.max + 24, label.widths.average + 28, 88)),
            minHeight: Math.round(Math.max(control.lineHeightPx * 2, 36)),
        },
        caption: {
            minHeight: Math.round(label.phone.height + 12),
            maxWidth: Math.round(Math.max(label.widths.max, sigil.widths.average)),
        },
        code: {
            readableWidth: Math.round(Math.min(code.widths.max + 24, getBandWidth('desktop'))),
            minHeight: Math.round(code.phone.height + 16),
        },
    };
}

function measurePresets() {
    if (!pretext) return null;

    const samples = sampleArchetypes();
    const profiles = getFontProfiles();

    const measurements = {
        body: measureArchetype('body', samples.body, profiles.body),
        heading: measureArchetype('heading', samples.heading, profiles.heading),
        subheading: measureArchetype('subheading', samples.subheading, profiles.subheading),
        label: measureArchetype('label', samples.label, profiles.label),
        code: measureArchetype('code', samples.code, profiles.code),
        control: measureArchetype('control', samples.control, profiles.control),
        sigil: measureArchetype('sigil', samples.sigil, profiles.sigil),
    };

    const derived = deriveComponentPresets(measurements);

    return {
        breakpoints: BREAKPOINTS,
        widthInsets: WIDTH_INSETS,
        measuredAt: Date.now(),
        archetypes: measurements,
        derived,
    };
}

function setBandVars(root, key, data) {
    root.style.setProperty(`--spw-preset-${key}-lines-phone`, `${data.phone.lineCount}`);
    root.style.setProperty(`--spw-preset-${key}-height-phone`, `${data.phone.height}px`);
    root.style.setProperty(`--spw-preset-${key}-width-phone`, `${data.phone.width}px`);

    root.style.setProperty(`--spw-preset-${key}-lines-tablet`, `${data.tablet.lineCount}`);
    root.style.setProperty(`--spw-preset-${key}-height-tablet`, `${data.tablet.height}px`);
    root.style.setProperty(`--spw-preset-${key}-width-tablet`, `${data.tablet.width}px`);

    root.style.setProperty(`--spw-preset-${key}-lines-desktop`, `${data.desktop.lineCount}`);
    root.style.setProperty(`--spw-preset-${key}-height-desktop`, `${data.desktop.height}px`);
    root.style.setProperty(`--spw-preset-${key}-width-desktop`, `${data.desktop.width}px`);

    root.style.setProperty(`--spw-preset-${key}-width-max`, `${data.widths.max}px`);
    root.style.setProperty(`--spw-preset-${key}-width-avg`, `${data.widths.average}px`);
    root.style.setProperty(`--spw-preset-${key}-line-height`, `${data.lineHeightPx}px`);
}

function applyPresets(data) {
    if (!data) return;

    const root = document.documentElement;
    const { archetypes, derived } = data;

    Object.entries(archetypes).forEach(([key, value]) => {
        setBandVars(root, key, value);
    });

    root.style.setProperty('--spw-preset-card-min-height-phone', `${derived.card.minHeightPhone}px`);
    root.style.setProperty('--spw-preset-card-min-height-tablet', `${derived.card.minHeightTablet}px`);
    root.style.setProperty('--spw-preset-card-readable-width', `${derived.card.readableWidth}px`);

    root.style.setProperty('--spw-preset-panel-min-height-phone', `${derived.panel.minHeightPhone}px`);
    root.style.setProperty('--spw-preset-panel-min-height-tablet', `${derived.panel.minHeightTablet}px`);
    root.style.setProperty('--spw-preset-panel-readable-width', `${derived.panel.readableWidth}px`);

    root.style.setProperty('--spw-preset-control-min-width', `${derived.control.minWidth}px`);
    root.style.setProperty('--spw-preset-control-min-height', `${derived.control.minHeight}px`);

    root.style.setProperty('--spw-preset-caption-min-height', `${derived.caption.minHeight}px`);
    root.style.setProperty('--spw-preset-caption-max-width', `${derived.caption.maxWidth}px`);

    root.style.setProperty('--spw-preset-code-readable-width', `${derived.code.readableWidth}px`);
    root.style.setProperty('--spw-preset-code-min-height', `${derived.code.minHeight}px`);
}

function refresh() {
    const data = measurePresets();
    if (!data) return;

    lastMeasurement = data;
    applyPresets(data);
    bus.emit('presets:measured', data);
}

function scheduleRefresh() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(refresh, 300);
}

export async function initPretextPresets() {
    try {
        pretext = await loadPretext();
        if (document.fonts?.ready) await document.fonts.ready;
    } catch (error) {
        console.warn('Pretext presets: unavailable, skipping measurement.', error);
        return;
    }

    refresh();

    window.addEventListener('resize', scheduleRefresh, { passive: true });

    if (document.fonts?.addEventListener) {
        document.fonts.addEventListener('loadingdone', scheduleRefresh);
    }

    window.spwPresets = {
        measure: refresh,
        current: () => lastMeasurement,
        archetype: (name) => lastMeasurement?.archetypes?.[name] || null,
        derived: () => lastMeasurement?.derived || null,
        breakpoints: () => lastMeasurement?.breakpoints || BREAKPOINTS,
        toJSON: () => lastMeasurement,
    };

    return () => {
        clearTimeout(resizeTimer);
        window.removeEventListener('resize', scheduleRefresh);
        if (document.fonts?.removeEventListener) {
            document.fonts.removeEventListener('loadingdone', scheduleRefresh);
        }
    };
}