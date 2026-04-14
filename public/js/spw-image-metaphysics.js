/**
 * Spw Image Metaphysics
 *
 * Semantic interaction layer for image-bearing surfaces.
 *
 * - raster studies derive their default treatment from realization
 * - SVG figures stay readable by default but can still be marked as visited
 * - holding a surface marks it as visited and persists that state
 * - a compact helper operator cycles treatments without turning into a toolbar
 */

import { bus } from './spw-bus.js';
import {
    dispatchImageRefresh,
    IMAGE_REFRESH_EVENT,
    IMAGE_REFRESH_REASONS
} from './spw-interaction-loop.js';

const VISITED_KEY = 'spw-visited-image-surfaces';
const HOLD_DURATION_MS = 480;
const HOST_SELECTOR = [
    '.spw-scaffold',
    '.image-study',
    '.domain-visual',
    '.spw-svg-figure',
    '[data-spw-image-surface]'
].join(', ');
const EFFECT_SEQUENCE = ['semantic', 'pixelize', 'watercolor', 'clarify'];

const safeParse = (value, fallback) => {
    try {
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
};

const readVisitedMap = () => safeParse(localStorage.getItem(VISITED_KEY), {});

const writeVisitedMap = (map) => {
    localStorage.setItem(VISITED_KEY, JSON.stringify(map));
};

const getMedium = (host) => (host.querySelector('svg') ? 'vector' : 'raster');

const normalizeKey = (value) => {
    try {
        const url = new URL(value, window.location.href);
        return `${url.pathname}${url.search}`;
    } catch {
        return value;
    }
};

function getSurfaceKey(host) {
    if (host.dataset.spwImageKey) return host.dataset.spwImageKey;

    const img = host.querySelector('img');
    if (img) {
        const source = img.currentSrc || img.getAttribute('src') || img.getAttribute('data-src');
        if (source) return normalizeKey(source);
    }

    const svg = host.querySelector('svg');
    if (svg) {
        const label = svg.getAttribute('aria-label')
            || host.getAttribute('aria-label')
            || svg.querySelector('title')?.textContent?.trim()
            || host.id
            || 'svg-surface';
        return `${window.location.pathname}#${label}`;
    }

    return `${window.location.pathname}:${host.textContent.trim().slice(0, 80)}`;
}

function getSemanticContext(host) {
    const semanticHost = host.closest('[data-spw-semantic-tagged="true"]');
    const medium = getMedium(host);

    return {
        medium,
        realization: host.dataset.spwRealization
            || semanticHost?.dataset.spwRealization
            || (medium === 'vector' ? 'conceptual' : 'hybrid'),
        substrate: host.dataset.spwSubstrate
            || semanticHost?.dataset.spwSubstrate
            || semanticHost?.dataset.spwOperator
            || (medium === 'vector' ? 'frame' : 'surface'),
        phrase: host.dataset.spwPhrase
            || semanticHost?.dataset.spwPhrase
            || (medium === 'vector' ? 'guide' : 'artifact')
    };
}

function resolveSemanticEffect(context, override) {
    if (override && override !== 'semantic') return override;

    if (context.medium === 'vector') {
        return 'clarify';
    }

    switch (context.realization) {
    case 'conceptual':
        return 'pixelize';
    case 'realized':
        return 'clarify';
    case 'hybrid':
    default:
        return 'watercolor';
    }
}

function getEffectLabel(effect) {
    switch (effect) {
    case 'pixelize':
        return 'pixel';
    case 'watercolor':
        return 'wash';
    case 'clarify':
        return 'settle';
    default:
        return 'semantic';
    }
}

function getMemoryLabel(_host, context, visited) {
    if (visited) return '. visited';

    if (document.documentElement.dataset.spwShowSemanticMetadata === 'on') {
        return `${context.realization} · ${context.phrase}`;
    }

    return '';
}

function updateHelper(host, context, visited) {
    const button = host.querySelector('.spw-image-helper');
    const memory = host.querySelector('.spw-image-memory');
    if (!button || !memory) return;

    const override = host.dataset.spwImageEffectOverride || 'semantic';
    const effect = host.dataset.spwImageEffect || resolveSemanticEffect(context, override);

    button.textContent = `! ${getEffectLabel(override === 'semantic' ? effect : override)}`;
    button.setAttribute('aria-label', `Cycle image treatment. Current treatment: ${getEffectLabel(effect)}. Hold the surface to mark it visited.`);
    button.title = `Current treatment: ${getEffectLabel(effect)}. Click to cycle. Hold the surface to mark it visited.`;
    button.setAttribute('aria-pressed', override === 'semantic' ? 'false' : 'true');

    memory.textContent = getMemoryLabel(host, context, visited);
}

function ensureHelper(host) {
    if (host.querySelector('.spw-image-helper-strip')) return;

    const strip = document.createElement('div');
    strip.className = 'spw-image-helper-strip';

    const button = document.createElement('button');
    button.className = 'spw-image-helper';
    button.type = 'button';
    button.dataset.spwOperator = 'pragma';

    const memory = document.createElement('span');
    memory.className = 'spw-image-memory';
    memory.dataset.spwOperator = 'baseline';

    button.addEventListener('pointerdown', (event) => {
        event.stopPropagation();
    });
    button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();

        const current = host.dataset.spwImageEffectOverride || 'semantic';
        const nextIndex = (EFFECT_SEQUENCE.indexOf(current) + 1) % EFFECT_SEQUENCE.length;
        host.dataset.spwImageEffectOverride = EFFECT_SEQUENCE[nextIndex];
        dispatchImageRefresh(host, IMAGE_REFRESH_REASONS.EFFECT);
    });

    strip.append(button, memory);
    host.append(strip);
}

function syncHost(host) {
    const context = getSemanticContext(host);
    const key = getSurfaceKey(host);
    const visited = Boolean(readVisitedMap()[key]);

    host.classList.add('spw-metaphysics-host');
    host.dataset.spwImageManaged = 'true';
    host.dataset.spwImageSurface = 'true';
    host.dataset.spwImageKey = key;
    host.dataset.spwMedium = context.medium;
    host.dataset.spwRealization = context.realization;
    host.dataset.spwSubstrate = context.substrate;
    host.dataset.spwPhrase = context.phrase;
    host.dataset.spwVisited = visited ? 'true' : 'false';
    host.dataset.spwImageEffect = resolveSemanticEffect(
        context,
        host.dataset.spwImageEffectOverride || 'semantic'
    );

    updateHelper(host, context, visited);
}

function markVisited(host) {
    const key = getSurfaceKey(host);
    const map = readVisitedMap();
    const existing = map[key] || { pages: [] };

    map[key] = {
        visitedAt: new Date().toISOString(),
        medium: getMedium(host),
        pages: Array.from(new Set([...(existing.pages || []), window.location.pathname]))
    };

    writeVisitedMap(map);
    host.dataset.spwVisited = 'true';
    host.dataset.spwVisitBurst = 'true';
    syncHost(host);
    dispatchImageRefresh(host, IMAGE_REFRESH_REASONS.VISITED);
    bus.emit('image:visited', { key, page: window.location.pathname, medium: getMedium(host) }, { element: host });

    window.setTimeout(() => {
        delete host.dataset.spwVisitBurst;
        delete host.dataset.spwHoldState;
        dispatchImageRefresh(host, IMAGE_REFRESH_REASONS.SETTLED);
    }, 900);
}

function registerHoldGesture(host) {
    let timer = null;
    let activated = false;

    const clearTimer = () => {
        if (timer) {
            window.clearTimeout(timer);
            timer = null;
        }
    };

    const finish = () => {
        clearTimer();
        if (!activated) {
            delete host.dataset.spwHoldState;
            dispatchImageRefresh(host, IMAGE_REFRESH_REASONS.RELEASED);
            return;
        }

        host.dataset.spwHoldState = 'visited';
        dispatchImageRefresh(host, IMAGE_REFRESH_REASONS.VISITED);
        activated = false;
    };

    const start = (event) => {
        if (event.target.closest('.spw-image-helper-strip')) return;
        if (event.button !== undefined && event.button !== 0) return;

        activated = false;
        clearTimer();
        host.dataset.spwHoldState = 'arming';
        dispatchImageRefresh(host, IMAGE_REFRESH_REASONS.ARMING);
        timer = window.setTimeout(() => {
            activated = true;
            markVisited(host);
        }, HOLD_DURATION_MS);
    };

    host.addEventListener('pointerdown', start);
    host.addEventListener('pointerup', finish);
    host.addEventListener('pointerleave', finish);
    host.addEventListener('pointercancel', finish);

    host.addEventListener('mouseenter', () => {
        host.dataset.spwImagePreview = 'on';
    });
    host.addEventListener('mouseleave', () => {
        delete host.dataset.spwImagePreview;
    });
    host.addEventListener('focusin', () => {
        host.dataset.spwImagePreview = 'on';
    });
    host.addEventListener('focusout', () => {
        delete host.dataset.spwImagePreview;
        finish();
    });

    if (!host.hasAttribute('tabindex')) {
        host.tabIndex = 0;
    }

    host.addEventListener('keydown', (event) => {
        if (event.code !== 'Space' && event.code !== 'Enter') return;
        if (event.repeat) return;
        event.preventDefault();
        start(event);
    });

    host.addEventListener('keyup', (event) => {
        if (event.code !== 'Space' && event.code !== 'Enter') return;
        event.preventDefault();
        finish();
    });
}

function isEligibleHost(host) {
    if (!(host instanceof HTMLElement)) return false;
    if (host.dataset.spwImageManaged === 'true') return false;
    return Boolean(host.querySelector('img, svg'));
}

function mountHost(host) {
    ensureHelper(host);
    registerHoldGesture(host);
    host.addEventListener(IMAGE_REFRESH_EVENT, () => {
        syncHost(host);
    });
    syncHost(host);
}

function scan(root = document) {
    const hosts = root.querySelectorAll?.(HOST_SELECTOR) || [];
    hosts.forEach((host) => {
        if (isEligibleHost(host)) mountHost(host);
        else if (host.dataset?.spwImageManaged === 'true') syncHost(host);
    });
}

export function initSpwImageMetaphysics() {
    scan(document);

    document.addEventListener('spw:component-semantics-ready', () => {
        scan(document);
    });

    bus.on('settings:changed', () => {
        document.querySelectorAll('[data-spw-image-managed="true"]').forEach((host) => syncHost(host));
    });
}
