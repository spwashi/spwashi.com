/**
 * Spw Pretext Presets
 *
 * Uses Pretext.js to measure body copy and derive CSS custom properties
 * that document the spatial volume of each component archetype at the
 * current viewport. This makes the design system's sizing decisions
 * inspectable and hand-off ready for other language models.
 *
 * On init, it:
 *   1. Samples representative text from the page (headings, body, sigils)
 *   2. Measures each sample with Pretext at phone / tablet / desktop widths
 *   3. Writes CSS custom properties onto :root:
 *        --spw-preset-body-lines-phone     (line count at phone width)
 *        --spw-preset-body-height-phone    (px height at phone width)
 *        --spw-preset-body-lines-tablet
 *        --spw-preset-body-height-tablet
 *        --spw-preset-body-lines-desktop
 *        --spw-preset-body-height-desktop
 *        --spw-preset-heading-width        (widest heading width)
 *        --spw-preset-sigil-width          (widest sigil width)
 *        --spw-preset-card-min-height      (derived from body measurement)
 *   4. Exposes window.spwPresets for agent inspection
 *
 * The measurements update on resize (debounced).
 *
 * Bus events:
 *   presets:measured  { phone, tablet, desktop, headings, sigils }
 */

import { bus } from './spw-bus.js';
import { loadPretext } from './pretext-utils.js';

const PHONE_WIDTH = 320;
const TABLET_WIDTH = 768;
const DESKTOP_WIDTH = 1200;

let pretext = null;
let lastMeasurement = null;
let resizeTimer = null;

function sampleBodyText() {
    // Grab the longest paragraph on the page as representative body copy
    const paragraphs = Array.from(document.querySelectorAll('main p, .frame-panel p, .frame-card span:last-of-type'));
    let longest = '';
    paragraphs.forEach(p => {
        const t = p.textContent.trim();
        if (t.length > longest.length) longest = t;
    });
    return longest || 'The signal does not change; only the water that was obscuring it is removed.';
}

function sampleHeadings() {
    return Array.from(document.querySelectorAll('main h1, main h2, main h3'))
        .map(h => h.textContent.trim())
        .filter(Boolean);
}

function sampleSigils() {
    return Array.from(document.querySelectorAll('.frame-sigil, .frame-card-sigil'))
        .map(s => s.textContent.trim())
        .filter(Boolean);
}

function getComputedFont(selector, fallback) {
    const el = document.querySelector(selector);
    if (!el) return fallback;
    const style = getComputedStyle(el);
    return style.font || `${style.fontSize} ${style.fontFamily}` || fallback;
}

function measureText(text, font, width, lineHeight) {
    const prepared = pretext.prepareWithSegments(text, font, { whiteSpace: 'normal' });
    return pretext.layoutWithLines(prepared, width, lineHeight);
}

function measurePresets() {
    if (!pretext) return null;

    const bodyText = sampleBodyText();
    const headings = sampleHeadings();
    const sigils = sampleSigils();

    const bodyFont = getComputedFont('main p, .frame-panel p', '16px system-ui');
    const headingFont = getComputedFont('main h1, main h2', '24px system-ui');
    const sigilFont = getComputedFont('.frame-sigil', '14px JetBrains Mono, monospace');

    const lineHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--site-line-height')) || 1.68;
    const baseFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const lh = Math.round(baseFontSize * lineHeight);

    // Body measurements at three breakpoints
    const phone = measureText(bodyText, bodyFont, PHONE_WIDTH - 32, lh);
    const tablet = measureText(bodyText, bodyFont, TABLET_WIDTH - 64, lh);
    const desktop = measureText(bodyText, bodyFont, DESKTOP_WIDTH - 128, lh);

    // Heading width measurements
    let maxHeadingWidth = 0;
    headings.forEach(h => {
        const prepared = pretext.prepareWithSegments(h, headingFont, { whiteSpace: 'normal' });
        const result = pretext.layoutWithLines(prepared, 9999, lh);
        const w = result.lines.reduce((max, line) => Math.max(max, line.width), 0);
        if (w > maxHeadingWidth) maxHeadingWidth = w;
    });

    // Sigil width measurements
    let maxSigilWidth = 0;
    sigils.forEach(s => {
        const prepared = pretext.prepareWithSegments(s, sigilFont, { whiteSpace: 'normal' });
        const result = pretext.layoutWithLines(prepared, 9999, lh);
        const w = result.lines.reduce((max, line) => Math.max(max, line.width), 0);
        if (w > maxSigilWidth) maxSigilWidth = w;
    });

    const data = {
        body: {
            text: bodyText.slice(0, 80) + (bodyText.length > 80 ? '...' : ''),
            phone: { lines: phone.lineCount, height: phone.height },
            tablet: { lines: tablet.lineCount, height: tablet.height },
            desktop: { lines: desktop.lineCount, height: desktop.height }
        },
        headings: {
            count: headings.length,
            maxWidth: Math.round(maxHeadingWidth)
        },
        sigils: {
            count: sigils.length,
            maxWidth: Math.round(maxSigilWidth)
        },
        cardMinHeight: Math.round(phone.height * 0.6),
        breakpoints: { phone: PHONE_WIDTH, tablet: TABLET_WIDTH, desktop: DESKTOP_WIDTH }
    };

    return data;
}

function applyPresets(data) {
    if (!data) return;
    const root = document.documentElement;

    root.style.setProperty('--spw-preset-body-lines-phone', data.body.phone.lines);
    root.style.setProperty('--spw-preset-body-height-phone', `${data.body.phone.height}px`);
    root.style.setProperty('--spw-preset-body-lines-tablet', data.body.tablet.lines);
    root.style.setProperty('--spw-preset-body-height-tablet', `${data.body.tablet.height}px`);
    root.style.setProperty('--spw-preset-body-lines-desktop', data.body.desktop.lines);
    root.style.setProperty('--spw-preset-body-height-desktop', `${data.body.desktop.height}px`);
    root.style.setProperty('--spw-preset-heading-width', `${data.headings.maxWidth}px`);
    root.style.setProperty('--spw-preset-sigil-width', `${data.sigils.maxWidth}px`);
    root.style.setProperty('--spw-preset-card-min-height', `${data.cardMinHeight}px`);
}

function refresh() {
    const data = measurePresets();
    if (!data) return;
    lastMeasurement = data;
    applyPresets(data);
    bus.emit('presets:measured', data);
}

export async function initPretextPresets() {
    try {
        pretext = await loadPretext();
        if (document.fonts?.ready) await document.fonts.ready;
    } catch (e) {
        console.warn('Pretext presets: CDN unavailable, skipping measurement.', e);
        return;
    }

    refresh();

    // Debounced resize re-measurement
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(refresh, 400);
    });

    window.spwPresets = {
        measure: refresh,
        current: () => lastMeasurement,
        toJSON: () => lastMeasurement
    };
}
