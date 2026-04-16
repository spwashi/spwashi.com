import {
    DEFAULT_PALETTE_RESONANCE,
    getPaletteResonanceTokens
} from './spw-palette-resonance.js';

/**
 * Spw Accent Palette
 *
 * Shared palette inference for canvas accents:
 * - recent route/operator path memory
 * - image palette sampling
 * - anchor token inference
 * - manual override parsing
 */

export const RECENT_PATH_TTL_MS = 28000;

let trackerAttached = false;
let recentPathMemory = {
    tokens: [],
    operator: '',
    wonder: '',
    href: '',
    text: '',
    updatedAt: 0
};

const listeners = new Set();

const KNOWN_ROUTE_TOKENS = new Set(['topics', 'about', 'play', 'blog', 'settings', 'services']);

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const normalizeAccentToken = (value = '') => (
    String(value)
        .trim()
        .toLowerCase()
        .replace(/^#+>?/, '')
        .replace(/^[@?!~.^]+/, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
);

export const parseAccentNumber = (value, fallback, min = -Infinity, max = Infinity) => {
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed)) return fallback;
    return clamp(parsed, min, max);
};

const readRootSettingNumber = (name, fallback, min = -Infinity, max = Infinity) => {
    if (typeof document === 'undefined') return fallback;

    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return parseAccentNumber(value, fallback, min, max);
};

export const parseAccentList = (value = '') => String(value)
    .split(/[,\s|]+/)
    .map((item) => item.trim())
    .filter(Boolean);

export const uniqueAccentValues = (values) => [...new Set(values.filter(Boolean))];

export const getWonderMemoryMode = () => {
    if (typeof document === 'undefined') return 'nearby';
    return document.documentElement.dataset.spwWonderMemory || 'nearby';
};

export const getWonderMemoryStrength = () => {
    if (getWonderMemoryMode() === 'off') return 0;
    return readRootSettingNumber('--spw-wonder-memory-strength', 0.56, 0, 2);
};

export const getWonderMemoryTtlMs = () => {
    if (getWonderMemoryMode() === 'off') return 0;
    return readRootSettingNumber('--spw-wonder-memory-ttl-ms', RECENT_PATH_TTL_MS, 0, 600000);
};

export const getWonderMemoryReach = () => {
    if (getWonderMemoryMode() === 'off') return 0;
    return readRootSettingNumber('--spw-wonder-memory-reach', 0.54, 0, 2);
};

export const getPaletteResonanceMode = () => {
    if (typeof document === 'undefined') return DEFAULT_PALETTE_RESONANCE;
    return document.documentElement.dataset.spwPaletteResonance || DEFAULT_PALETTE_RESONANCE;
};

export const getActivePaletteResonanceTokens = () => (
    getPaletteResonanceTokens(getPaletteResonanceMode())
);

function colorDistance(a, b) {
    return Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
}

function decodeHexColor(value) {
    const hex = value.replace('#', '').trim();
    if (hex.length === 3) {
        return {
            r: Number.parseInt(`${hex[0]}${hex[0]}`, 16),
            g: Number.parseInt(`${hex[1]}${hex[1]}`, 16),
            b: Number.parseInt(`${hex[2]}${hex[2]}`, 16)
        };
    }

    if (hex.length === 6) {
        return {
            r: Number.parseInt(hex.slice(0, 2), 16),
            g: Number.parseInt(hex.slice(2, 4), 16),
            b: Number.parseInt(hex.slice(4, 6), 16)
        };
    }

    return null;
}

export function withAlpha(colorStr, alpha) {
    if (colorStr.startsWith('hsl(')) {
        return colorStr.replace('hsl(', 'hsla(').replace(')', `, ${alpha.toFixed(3)})`);
    }

    if (colorStr.startsWith('rgb(')) {
        return colorStr.replace('rgb(', 'rgba(').replace(')', `, ${alpha.toFixed(3)})`);
    }

    if (colorStr.startsWith('#')) {
        const rgb = decodeHexColor(colorStr);
        if (!rgb) return colorStr;
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha.toFixed(3)})`;
    }

    return colorStr;
}

export function tokensFromHref(value) {
    if (!value) return [];

    try {
        const url = new URL(value, window.location.href);
        return [
            ...url.pathname
            .split('/')
            .map(normalizeAccentToken)
            .filter((token) => token && !KNOWN_ROUTE_TOKENS.has(token)),
            normalizeAccentToken(url.hash.replace(/^#/, ''))
        ].filter(Boolean);
    } catch {
        return parseAccentList(value).map(normalizeAccentToken);
    }
}

function extractOperatorToken(value = '') {
    const raw = String(value).trim();
    if (!raw) return '';
    if (raw.startsWith('#')) return 'frame';
    if (raw.startsWith('?')) return 'probe';
    if (raw.startsWith('~')) return 'ref';
    if (raw.startsWith('@')) return 'action';
    if (raw.startsWith('!')) return 'pragma';
    if (raw.startsWith('<')) return 'topic';
    if (raw.startsWith('.')) return 'baseline';
    return normalizeAccentToken(raw);
}

const WONDER_BY_OPERATOR = Object.freeze({
    frame: 'orientation',
    layer: 'constraint',
    baseline: 'memory',
    object: 'memory',
    ref: 'resonance',
    probe: 'inquiry',
    action: 'projection',
    stream: 'resonance',
    merge: 'comparison',
    binding: 'constraint',
    meta: 'comparison',
    normalize: 'constraint',
    pragma: 'constraint',
    surface: 'projection',
    topic: 'resonance'
});

export function inferWonderFromOperation(operator = '', tokens = []) {
    const normalizedOperator = extractOperatorToken(operator);
    if (WONDER_BY_OPERATOR[normalizedOperator]) {
        return WONDER_BY_OPERATOR[normalizedOperator];
    }

    const normalizedTokens = tokens.map(normalizeAccentToken);

    if (normalizedTokens.some((token) => token.includes('parser') || token.includes('probe'))) {
        return 'inquiry';
    }
    if (normalizedTokens.some((token) => token.includes('memory') || token.includes('cache') || token.includes('library'))) {
        return 'memory';
    }
    if (normalizedTokens.some((token) => token.includes('complex') || token.includes('compare') || token.includes('math') || token.includes('category'))) {
        return 'comparison';
    }
    if (normalizedTokens.some((token) => token.includes('render') || token.includes('surface') || token.includes('play'))) {
        return 'projection';
    }

    return 'resonance';
}

function inferOperationalPayload(target) {
    if (!(target instanceof Element)) return null;
    if (target.closest('.spw-image-helper-strip')) return null;

    const actionable = target.closest('a, button, [data-spw-operator], [data-set-mode]');
    if (!(actionable instanceof Element)) return null;

    const href = actionable.getAttribute('href') || '';
    const text = actionable.textContent?.trim() || '';
    const explicitOperator = actionable.getAttribute('data-spw-operator')
        || actionable.getAttribute('data-spw-swappable')
        || text;

    const tokens = uniqueAccentValues([
        ...tokensFromHref(href),
        ...parseAccentList(actionable.getAttribute('data-spw-accent-anchor') || '').map(normalizeAccentToken),
        normalizeAccentToken(text)
    ]);

    return {
        tokens,
        operator: extractOperatorToken(explicitOperator),
        wonder: inferWonderFromOperation(explicitOperator, tokens),
        href,
        text,
        updatedAt: Date.now()
    };
}

export function initRecentPathTracker(onChange) {
    if (onChange) listeners.add(onChange);

    if (!trackerAttached) {
        trackerAttached = true;
        document.addEventListener('click', (event) => {
            const payload = inferOperationalPayload(event.target);
            if (!payload) return;
            recentPathMemory = payload;
            listeners.forEach((listener) => {
                try {
                    listener(payload);
                } catch (error) {
                    console.warn('[AccentPalette] Failed to notify recent-path listener.', error);
                }
            });
        }, true);
    }

    return () => {
        if (onChange) listeners.delete(onChange);
    };
}

export const getRecentPathMemory = () => recentPathMemory;

export const isRecentPathActive = (memory = recentPathMemory) => {
    const ttlMs = getWonderMemoryTtlMs();
    if (!ttlMs || !memory?.updatedAt) return false;
    return Date.now() - memory.updatedAt < ttlMs;
};

export const getActiveRecentPathMemory = () => (
    isRecentPathActive(recentPathMemory) ? recentPathMemory : null
);

export function samplePaletteFromImage(image, maxColors = 6) {
    if (!(image instanceof HTMLImageElement)) return [];
    if (!image.complete || !image.naturalWidth || !image.naturalHeight) return [];

    const canvas = document.createElement('canvas');
    canvas.width = 24;
    canvas.height = 24;

    const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
    if (!ctx) return [];

    try {
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const buckets = new Map();

        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] < 150) continue;

            const r = Math.round(data[i] / 32) * 32;
            const g = Math.round(data[i + 1] / 32) * 32;
            const b = Math.round(data[i + 2] / 32) * 32;
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const saturation = max - min;
            const lightness = (max + min) / 2;

            if (lightness < 20 || lightness > 242) continue;

            const key = `${r},${g},${b}`;
            const current = buckets.get(key) || { r, g, b, score: 0 };
            current.score += 1 + (saturation / 40);
            buckets.set(key, current);
        }

        const ranked = [...buckets.values()].sort((a, b) => b.score - a.score);
        const chosen = [];

        ranked.forEach((entry) => {
            if (chosen.length >= maxColors) return;
            if (chosen.some((existing) => colorDistance(existing, entry) < 44)) return;
            chosen.push(entry);
        });

        return chosen.map((entry) => `rgb(${entry.r}, ${entry.g}, ${entry.b})`);
    } catch (error) {
        console.warn('[AccentPalette] Failed to sample image palette.', error);
        return [];
    }
}

export function inferAnchorTokens(container) {
    const manual = parseAccentList(container.dataset.spwAccentAnchor || '').map(normalizeAccentToken);
    const inferred = [];
    const links = container.querySelectorAll('a[href]');

    links.forEach((link) => {
        inferred.push(...tokensFromHref(link.getAttribute('href') || ''));
        inferred.push(normalizeAccentToken(link.textContent || ''));
    });

    const surface = normalizeAccentToken(container.closest('[data-spw-surface]')?.dataset?.spwSurface || '');
    const context = normalizeAccentToken(container.closest('[data-spw-context]')?.dataset?.spwContext || '');

    return uniqueAccentValues([...manual, ...inferred, surface, context]);
}

export function resolveAccentTokenColors(tokens = [], colors) {
    const resolved = [];
    const { teal, amber, rust, violet, sea, blue, ink } = colors;

    tokens
        .map(normalizeAccentToken)
        .filter(Boolean)
        .forEach((token) => {
            if (['software', 'spw', 'renderers', 'browser', 'distributed', 'compression', 'compilers'].includes(token)) {
                resolved.push(teal, sea, violet);
                return;
            }

            if (['parsers', 'parser-map', 'parser-lenses', 'probe'].includes(token)) {
                resolved.push(violet, sea, blue);
                return;
            }

            if (['math', 'topology', 'symmetry', 'combinatorics', 'number-theory', 'field-theory', 'category-theory', 'complexity', 'geometry', 'lattices'].includes(token)) {
                resolved.push(sea, amber, violet);
                return;
            }

            if (['play', 'rpg', 'rpg-wednesday', 'boonhonk'].includes(token)) {
                resolved.push(amber, rust, teal);
                return;
            }

            if (['craft', 'site-design', 'architecture', 'website', 'about'].includes(token)) {
                resolved.push(teal, amber, rust);
                return;
            }

            if (['pedagogy', 'teaching'].includes(token)) {
                resolved.push(sea, amber, teal);
                return;
            }

            if (token === 'frame' || token === 'action') {
                resolved.push(teal);
                return;
            }

            if (token === 'object') {
                resolved.push(amber);
                return;
            }

            if (token === 'pragma') {
                resolved.push(rust);
                return;
            }

            if (token === 'ref') {
                resolved.push(blue);
                return;
            }

            if (token === 'topic') {
                resolved.push(sea);
                return;
            }

            if (token === 'baseline' || token === 'ink' || token === 'reading') {
                resolved.push(ink, teal);
            }
        });

    return uniqueAccentValues(resolved);
}
