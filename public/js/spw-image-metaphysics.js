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
import { getCanvasAccentInstance } from './spw-canvas-accents.js';

const VISITED_KEY = 'spw-visited-image-surfaces';
const HOLD_DURATION_MS = 480;
const DRAG_CANCEL_DISTANCE_PX = 12;
const PRIMED_DELAY_MS = 120;
const HOST_SELECTOR = [
    '.spw-scaffold',
    '.image-study',
    '.domain-visual',
    '.spw-svg-figure',
    '[data-spw-image-surface]'
].join(', ');
const EFFECT_SEQUENCE = ['semantic', 'pixelize', 'watercolor', 'clarify'];
const EFFECT_META = Object.freeze({
    semantic: {
        label: 'semantic',
        note: 'follow the surface meaning'
    },
    pixelize: {
        label: 'pixel',
        note: 'show the lattice and sampled edges'
    },
    watercolor: {
        label: 'wash',
        note: 'pool color into a softer paper field'
    },
    clarify: {
        label: 'settle',
        note: 'resolve edges and calm the surface'
    }
});
const RESONANCE_BY_SUBSTRATE = Object.freeze({
    frame: 'teal',
    action: 'teal',
    surface: 'teal',
    object: 'amber',
    pragma: 'amber',
    probe: 'violet',
    merge: 'violet',
    topic: 'sea',
    ref: 'blue',
    baseline: 'ink'
});
const PALETTE_BY_RESONANCE = Object.freeze({
    amber: 'warm',
    rust: 'warm',
    teal: 'cool',
    sea: 'cool',
    blue: 'cool',
    violet: 'cool',
    ink: 'cool'
});
const IMAGE_STATES = Object.freeze({
    SETTLED: 'settled',
    PREVIEW: 'preview',
    PRIMED: 'primed',
    ENGAGED: 'engaged'
});
const CONTRAST_STATES = Object.freeze({
    REST: 'rest',
    RAISED: 'raised',
    FOCUSED: 'focused'
});
const IMAGE_LAYOUTS = Object.freeze({
    COMPACT: 'compact',
    BALANCED: 'balanced',
    WIDE: 'wide'
});
const IMAGE_INPUTS = Object.freeze({
    FINE: 'fine',
    COARSE: 'coarse',
    KEYBOARD: 'keyboard'
});

const HOST_BRUSH_STATE = new WeakMap();
const HOST_RUNTIME = new WeakMap();
const HOST_RESIZE_OBSERVER = typeof ResizeObserver === 'function'
    ? new ResizeObserver((entries) => {
        entries.forEach(({ target }) => {
            if (!(target instanceof HTMLElement)) return;
            if (target.dataset.spwImageManaged !== 'true') return;
            syncInteractionState(target);
        });
    })
    : null;

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
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const isCoarsePointerEnvironment = () => window.matchMedia?.('(pointer: coarse)')?.matches === true;

function getHostRuntime(host) {
    let runtime = HOST_RUNTIME.get(host);
    if (runtime) return runtime;

    runtime = {
        input: isCoarsePointerEnvironment() ? IMAGE_INPUTS.COARSE : IMAGE_INPUTS.FINE,
        primedTimer: 0,
        pointerFrame: 0,
        queuedPoint: null,
        queuedMeta: null
    };
    HOST_RUNTIME.set(host, runtime);
    return runtime;
}

function setHostInput(host, input = '') {
    const runtime = getHostRuntime(host);
    runtime.input = input || (isCoarsePointerEnvironment() ? IMAGE_INPUTS.COARSE : IMAGE_INPUTS.FINE);
    host.dataset.spwImageInput = runtime.input;
}

function resolveImageLayout(host) {
    const width = host.clientWidth || host.getBoundingClientRect().width || 0;
    const prominence = host.dataset.spwImageProminence || 'study';

    if (width <= 336) return IMAGE_LAYOUTS.COMPACT;
    if (prominence === 'hero' && width >= 680) return IMAGE_LAYOUTS.WIDE;
    if (width <= 560) return IMAGE_LAYOUTS.BALANCED;
    return IMAGE_LAYOUTS.WIDE;
}

function resolveImageState(host) {
    const preview = host.dataset.spwImagePreview === 'on' || host.matches(':focus-within');
    const primed = host.dataset.spwImagePrimed === 'true';
    const controlsOpen = host.dataset.spwControlsOpen === 'true';
    const holdState = host.dataset.spwHoldState || '';
    const gesture = host.dataset.spwImageGesture || '';

    if (
        controlsOpen
        || gesture === 'drag'
        || gesture === 'hold'
        || holdState === 'arming'
        || holdState === 'visited'
    ) {
        return IMAGE_STATES.ENGAGED;
    }

    if (primed) return IMAGE_STATES.PRIMED;
    if (preview) return IMAGE_STATES.PREVIEW;
    return IMAGE_STATES.SETTLED;
}

function resolveContrastState(host, imageState = resolveImageState(host)) {
    if (host.matches(':focus-within') || imageState === IMAGE_STATES.ENGAGED) {
        return CONTRAST_STATES.FOCUSED;
    }

    if (imageState === IMAGE_STATES.PREVIEW || imageState === IMAGE_STATES.PRIMED) {
        return CONTRAST_STATES.RAISED;
    }

    return CONTRAST_STATES.REST;
}

function syncInteractionState(host) {
    const runtime = getHostRuntime(host);
    const imageState = resolveImageState(host);
    const contrastState = resolveContrastState(host, imageState);
    const imageLayout = resolveImageLayout(host);

    host.dataset.spwImageState = imageState;
    host.dataset.spwContrastState = contrastState;
    host.dataset.spwImageLayout = imageLayout;
    host.dataset.spwImageInput = runtime.input || (isCoarsePointerEnvironment() ? IMAGE_INPUTS.COARSE : IMAGE_INPUTS.FINE);
    host.dataset.spwImagePrimed = host.dataset.spwImagePrimed === 'true' ? 'true' : 'false';
    host.dataset.spwImageMemoryState = host.dataset.spwVisited === 'true' ? 'visited' : 'fresh';

    const strip = host.querySelector('.spw-image-helper-strip');
    const button = host.querySelector('.spw-image-helper');
    const memory = host.querySelector('.spw-image-memory');

    [strip, button, memory].forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        node.dataset.spwImageState = imageState;
        node.dataset.spwContrastState = contrastState;
        node.dataset.spwImageLayout = imageLayout;
        node.dataset.spwImageInput = host.dataset.spwImageInput;
    });
}

function clearPrimedTimer(host) {
    const runtime = getHostRuntime(host);
    if (!runtime.primedTimer) return;
    window.clearTimeout(runtime.primedTimer);
    runtime.primedTimer = 0;
}

function schedulePrimedState(host, delay = PRIMED_DELAY_MS) {
    const runtime = getHostRuntime(host);
    if (host.dataset.spwImagePrimed === 'true' && !runtime.primedTimer) {
        syncInteractionState(host);
        return;
    }

    clearPrimedTimer(host);
    runtime.primedTimer = window.setTimeout(() => {
        runtime.primedTimer = 0;
        if (
            host.dataset.spwImagePreview === 'on'
            || host.dataset.spwControlsOpen === 'true'
            || host.matches(':focus-within')
        ) {
            host.dataset.spwImagePrimed = 'true';
            syncInteractionState(host);
        }
    }, Math.max(0, delay));
}

function clearPrimedState(host) {
    clearPrimedTimer(host);
    host.dataset.spwImagePrimed = 'false';
    syncInteractionState(host);
}

function queuePointerState(host, point = null, meta = {}) {
    const runtime = getHostRuntime(host);
    runtime.queuedPoint = point && typeof point.clientX === 'number' && typeof point.clientY === 'number'
        ? { clientX: point.clientX, clientY: point.clientY }
        : null;
    runtime.queuedMeta = { ...meta };
    if (runtime.pointerFrame) return;

    runtime.pointerFrame = window.requestAnimationFrame(() => {
        runtime.pointerFrame = 0;
        applyPointerState(host, runtime.queuedPoint, runtime.queuedMeta || {});
        syncInteractionState(host);
    });
}

function cancelQueuedPointerState(host) {
    const runtime = getHostRuntime(host);
    if (runtime.pointerFrame) {
        window.cancelAnimationFrame(runtime.pointerFrame);
        runtime.pointerFrame = 0;
    }
    runtime.queuedPoint = null;
    runtime.queuedMeta = null;
}

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

function getProminence(host) {
    if (host.dataset.spwImageProminence) return host.dataset.spwImageProminence;
    if (host.closest('.site-hero')) return 'hero';
    if (host.matches('.topic-photo-card, .image-study, .domain-visual')) return 'feature';
    return 'study';
}

function getResonance(host, context, prominence) {
    if (host.dataset.spwImageResonance) return host.dataset.spwImageResonance;
    if (prominence === 'hero' && context.substrate === 'surface') return 'teal';
    return RESONANCE_BY_SUBSTRATE[context.substrate] || 'ink';
}

function readPointerGeometry(host, point = null) {
    const rect = host.getBoundingClientRect();
    const fallbackX = rect.left + rect.width / 2;
    const fallbackY = rect.top + rect.height / 2;
    const clientX = typeof point?.clientX === 'number' ? point.clientX : fallbackX;
    const clientY = typeof point?.clientY === 'number' ? point.clientY : fallbackY;

    return {
        xNorm: rect.width ? clamp((clientX - rect.left) / rect.width, 0, 1) : 0.5,
        yNorm: rect.height ? clamp((clientY - rect.top) / rect.height, 0, 1) : 0.5
    };
}

function applyPointerState(host, point = null, { pointerDown = false, dragging = false, dragDistance = 0 } = {}) {
    const { xNorm, yNorm } = readPointerGeometry(host, point);
    const prominence = host.dataset.spwImageProminence || 'study';
    const prominenceScale = prominence === 'hero'
        ? 1
        : (prominence === 'feature' ? 0.8 : 0.62);
    const centerDistance = Math.min(1, Math.hypot(xNorm - 0.5, yNorm - 0.5) * 1.8);
    const dragBoost = pointerDown ? clamp(dragDistance / 54, 0, 1) : 0;
    const gestureBoost = dragging ? 1 : (pointerDown ? 0.72 : 0.46);
    const energy = clamp(
        (0.18 + centerDistance * 0.48 + dragBoost * 0.34) * prominenceScale * gestureBoost,
        0,
        prominence === 'hero' ? 1 : 0.8
    );
    const tiltX = (0.5 - yNorm) * (pointerDown ? 12 : 7.5) * prominenceScale;
    const tiltY = (xNorm - 0.5) * (pointerDown ? 14 : 8.5) * prominenceScale;
    const driftX = (xNorm - 0.5) * (pointerDown ? 18 : 10) * prominenceScale;
    const driftY = (yNorm - 0.5) * (pointerDown ? 12 : 7) * prominenceScale;

    host.style.setProperty('--spw-image-focus-x', `${(xNorm * 100).toFixed(2)}%`);
    host.style.setProperty('--spw-image-focus-y', `${(yNorm * 100).toFixed(2)}%`);
    host.style.setProperty('--spw-image-tilt-x', `${tiltX.toFixed(2)}deg`);
    host.style.setProperty('--spw-image-tilt-y', `${tiltY.toFixed(2)}deg`);
    host.style.setProperty('--spw-image-drift-x', `${driftX.toFixed(2)}px`);
    host.style.setProperty('--spw-image-drift-y', `${driftY.toFixed(2)}px`);
    host.style.setProperty('--spw-image-energy', energy.toFixed(3));
    host.dataset.spwImageGesture = dragging ? 'drag' : (pointerDown ? 'hold' : 'hover');
}

function resetPointerState(host, { preservePreview = false } = {}) {
    cancelQueuedPointerState(host);
    host.style.setProperty('--spw-image-focus-x', '50%');
    host.style.setProperty('--spw-image-focus-y', '42%');
    host.style.setProperty('--spw-image-tilt-x', '0deg');
    host.style.setProperty('--spw-image-tilt-y', '0deg');
    host.style.setProperty('--spw-image-drift-x', '0px');
    host.style.setProperty('--spw-image-drift-y', '0px');
    host.style.setProperty('--spw-image-energy', '0');
    delete host.dataset.spwImageGesture;

    if (!preservePreview) {
        delete host.dataset.spwImagePreview;
        host.dataset.spwImagePrimed = 'false';
    }

    syncInteractionState(host);
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
    return EFFECT_META[effect]?.label || EFFECT_META.semantic.label;
}

function getMemoryState(host, context, visited) {
    const override = host.dataset.spwImageEffectOverride || 'semantic';
    const logic = visited ? 'visited' : (override === 'semantic' ? 'auto' : 'manual');
    const detail = document.documentElement.dataset.spwShowSemanticMetadata === 'on'
        ? `${context.realization} · ${context.phrase}`
        : (visited
            ? 'return surface'
            : (override === 'semantic' ? 'meaning-led' : 'override active'));

    return { logic, detail };
}

function updateHelper(host, context, visited) {
    const button = host.querySelector('.spw-image-helper');
    const memory = host.querySelector('.spw-image-memory');
    const strip = host.querySelector('.spw-image-helper-strip');
    const eyebrow = host.querySelector('.spw-image-helper__eyebrow');
    const value = host.querySelector('.spw-image-helper__value');
    const memoryLogic = host.querySelector('.spw-image-memory__logic');
    const memoryValue = host.querySelector('.spw-image-memory__value');
    if (!button || !memory || !eyebrow || !value || !memoryLogic || !memoryValue) return;

    const override = host.dataset.spwImageEffectOverride || 'semantic';
    const effect = host.dataset.spwImageEffect || resolveSemanticEffect(context, override);
    const displayEffect = override === 'semantic' ? effect : override;
    const effectLabel = getEffectLabel(displayEffect);
    const effectNote = EFFECT_META[displayEffect]?.note || EFFECT_META.semantic.note;
    const overrideState = override === 'semantic' ? 'auto' : 'manual';
    const memoryState = getMemoryState(host, context, visited);
    const imageState = host.dataset.spwImageState || IMAGE_STATES.SETTLED;
    const contrastState = host.dataset.spwContrastState || CONTRAST_STATES.REST;
    const imageLayout = host.dataset.spwImageLayout || IMAGE_LAYOUTS.BALANCED;

    if (strip) {
        strip.dataset.spwEffect = displayEffect;
        strip.dataset.spwOverrideState = overrideState;
        strip.dataset.spwVisited = visited ? 'true' : 'false';
        strip.dataset.spwImageState = imageState;
        strip.dataset.spwContrastState = contrastState;
        strip.dataset.spwImageLayout = imageLayout;
    }

    eyebrow.textContent = `render · ${overrideState}`;
    value.textContent = effectLabel;
    button.dataset.spwEffect = displayEffect;
    button.dataset.spwOverrideState = overrideState;
    button.dataset.spwVisited = visited ? 'true' : 'false';
    button.dataset.spwImageState = imageState;
    button.dataset.spwContrastState = contrastState;
    button.dataset.spwImageLayout = imageLayout;
    button.setAttribute('aria-label', `Cycle image treatment. Current treatment: ${effectLabel}. ${overrideState === 'auto' ? 'Semantic auto mode.' : 'Manual override.'} Hold the surface to mark it visited.`);
    button.title = `Current treatment: ${effectLabel}. ${effectNote}. ${overrideState === 'auto' ? 'Semantic auto mode.' : 'Manual override.'} Click to cycle. Hold the surface to mark it visited.`;
    button.setAttribute('aria-pressed', override === 'semantic' ? 'false' : 'true');

    memory.dataset.spwOverrideState = overrideState;
    memory.dataset.spwVisited = visited ? 'true' : 'false';
    memory.dataset.spwImageState = imageState;
    memory.dataset.spwContrastState = contrastState;
    memory.dataset.spwImageLayout = imageLayout;
    memoryLogic.textContent = memoryState.logic;
    memoryValue.textContent = memoryState.detail;
}

function ensureHelper(host) {
    if (host.querySelector('.spw-image-helper-strip')) return;

    const openControls = () => {
        host.dataset.spwControlsOpen = 'true';
        host.dataset.spwImagePreview = 'on';
        schedulePrimedState(host, 0);
        syncInteractionState(host);
    };
    const closeControls = () => {
        delete host.dataset.spwControlsOpen;
        syncInteractionState(host);
    };

    // Hint — a breathing accent line at the bottom edge. Signals interactivity.
    const hint = document.createElement('button');
    hint.className = 'spw-image-hint';
    hint.dataset.spwOverlay = 'hint';
    hint.setAttribute('aria-label', 'Open image controls');
    hint.addEventListener('pointerdown', (e) => e.stopPropagation());
    hint.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openControls(); });
    host.append(hint);

    // Escape closes the strip
    host.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeControls(); });

    // Control strip — slides up from bottom when opened
    const strip = document.createElement('div');
    strip.className = 'spw-image-helper-strip';
    strip.dataset.spwOverlay = 'controls';

    // Palette swatches — show image's extracted colors
    const swatchRow = document.createElement('div');
    swatchRow.className = 'spw-image-palette-swatches';
    swatchRow.setAttribute('aria-label', 'Image palette — click to set brush color');
    strip.append(swatchRow);

    // Populate swatches from the accent instance once available
    const refreshSwatches = () => {
        const accent = getCanvasAccentInstance(host);
        const palette = accent?.resolvedPalette || [];
        swatchRow.innerHTML = '';
        palette.slice(0, 5).forEach((color, i) => {
            const swatch = document.createElement('button');
            swatch.className = 'spw-image-palette-swatch';
            swatch.style.setProperty('--swatch-color', color);
            swatch.setAttribute('aria-label', `Brush color ${i + 1}`);
            if (i === 0) swatch.dataset.active = 'true';
            swatch.addEventListener('pointerdown', (e) => e.stopPropagation());
            swatch.addEventListener('click', (e) => {
                e.preventDefault(); e.stopPropagation();
                swatchRow.querySelectorAll('.spw-image-palette-swatch').forEach(s => delete s.dataset.active);
                swatch.dataset.active = 'true';
                const state = HOST_BRUSH_STATE.get(host) || { enabled: false, brushSize: 8, brushOpacity: 0.8 };
                state.brushColor = color;
                HOST_BRUSH_STATE.set(host, state);
                if (accent) accent.brushColor = color;
            });
            swatchRow.append(swatch);
        });
    };
    // Refresh swatches on image load (palette resolved async)
    host.addEventListener(IMAGE_REFRESH_EVENT, refreshSwatches, { passive: true });

    // Effect button
    const button = document.createElement('button');
    button.className = 'spw-image-helper';
    button.type = 'button';
    button.dataset.spwOperator = 'pragma';

    const eyebrow = document.createElement('span');
    eyebrow.className = 'spw-image-helper__eyebrow';

    const value = document.createElement('span');
    value.className = 'spw-image-helper__value';

    const track = document.createElement('span');
    track.className = 'spw-image-helper__track';
    track.setAttribute('aria-hidden', 'true');
    EFFECT_SEQUENCE.forEach((effect) => {
        const stop = document.createElement('span');
        stop.className = 'spw-image-helper__stop';
        stop.dataset.spwEffectStop = effect;
        track.append(stop);
    });

    const memory = document.createElement('span');
    memory.className = 'spw-image-memory';
    memory.dataset.spwOperator = 'baseline';

    const memoryLogic = document.createElement('span');
    memoryLogic.className = 'spw-image-memory__logic';

    const memoryValue = document.createElement('span');
    memoryValue.className = 'spw-image-memory__value';

    button.append(eyebrow, value, track);
    memory.append(memoryLogic, memoryValue);

    button.addEventListener('pointerdown', (e) => e.stopPropagation());
    button.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const current = host.dataset.spwImageEffectOverride || 'semantic';
        const nextIndex = (EFFECT_SEQUENCE.indexOf(current) + 1) % EFFECT_SEQUENCE.length;
        host.dataset.spwImageEffectOverride = EFFECT_SEQUENCE[nextIndex];
        dispatchImageRefresh(host, IMAGE_REFRESH_REASONS.EFFECT);
    });

    // Brush toggle
    const brushToggle = document.createElement('button');
    brushToggle.className = 'spw-image-brush-toggle';
    brushToggle.type = 'button';
    brushToggle.dataset.spwOperator = 'object';
    brushToggle.textContent = 'paint';
    brushToggle.setAttribute('aria-label', 'Toggle brush painting mode');
    brushToggle.setAttribute('title', 'Drag to paint with the image\'s own colors');

    brushToggle.addEventListener('pointerdown', (e) => e.stopPropagation());
    brushToggle.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const state = HOST_BRUSH_STATE.get(host) || { enabled: false, brushSize: 8, brushOpacity: 0.8 };
        state.enabled = !state.enabled;
        HOST_BRUSH_STATE.set(host, state);
        brushToggle.dataset.spwBrushActive = state.enabled ? 'true' : 'false';
        host.dataset.spwBrushMode = state.enabled ? 'true' : 'false';
        const accent = getCanvasAccentInstance(host);
        if (accent) {
            accent.setBrushMode(state.enabled);
            accent.setBrushSize(state.brushSize || 8);
            accent.setBrushOpacity(state.brushOpacity || 0.8);
        }
        refreshSwatches();
    });

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'spw-image-strip-close';
    closeBtn.type = 'button';
    closeBtn.textContent = '×';
    closeBtn.setAttribute('aria-label', 'Close image controls');
    closeBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
    closeBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); closeControls(); });

    strip.append(button, brushToggle, memory, closeBtn);
    host.append(strip);
}

function syncHost(host) {
    const context = getSemanticContext(host);
    const key = getSurfaceKey(host);
    const visited = Boolean(readVisitedMap()[key]);
    const prominence = getProminence(host);
    const resonance = getResonance(host, context, prominence);

    host.classList.add('spw-metaphysics-host');
    host.dataset.spwImageManaged = 'true';
    host.dataset.spwImageSurface = 'true';
    host.dataset.spwImageKey = key;
    host.dataset.spwMedium = context.medium;
    host.dataset.spwRealization = context.realization;
    host.dataset.spwSubstrate = context.substrate;
    host.dataset.spwPhrase = context.phrase;
    host.dataset.spwImageProminence = prominence;
    host.dataset.spwImageResonance = resonance;
    host.dataset.spwVisited = visited ? 'true' : 'false';
    host.dataset.spwImageEffect = resolveSemanticEffect(
        context,
        host.dataset.spwImageEffectOverride || 'semantic'
    );

    if (host.dataset.spwAccent && !host.dataset.spwAccentPalette) {
        host.dataset.spwAccentPalette = PALETTE_BY_RESONANCE[resonance] || 'cool';
    }

    syncInteractionState(host);
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
    let pointerStart = null;
    let activePointerId = null;
    let dragging = false;
    let pathBuffer = [];
    let brushPressureTrail = [];

    const clearTimer = () => {
        if (timer) {
            window.clearTimeout(timer);
            timer = null;
        }
    };

    const emitBrushParticles = (event, dragDistance) => {
        const brushState = HOST_BRUSH_STATE.get(host) || { enabled: false };
        if (!brushState.enabled) return;

        const accent = getCanvasAccentInstance(host);
        if (!accent) return;

        const rect = host.getBoundingClientRect();
        const x = typeof event.clientX === 'number' ? event.clientX - rect.left : 0;
        const y = typeof event.clientY === 'number' ? event.clientY - rect.top : 0;

        // Add to path buffer (sample every 4px or so)
        const now = performance.now();
        const lastPoint = pathBuffer[pathBuffer.length - 1];
        const shouldAddPoint = !lastPoint || Math.hypot(x - lastPoint.x, y - lastPoint.y) > 3;

        if (shouldAddPoint) {
            pathBuffer.push({ x, y, time: now });
            lastPathPointTime = now;
        }

        // Emit particles from buffered path segment
        if (pathBuffer.length >= 2) {
            const pressure = Math.min(dragDistance / 60, 1.0);
            const brushSize = brushState.brushSize || 8;
            const brushOpacity = brushState.brushOpacity || 0.8;

            // Emit every 2nd point to throttle emission rate
            const segmentStart = Math.max(0, pathBuffer.length - 3);
            const segment = pathBuffer.slice(segmentStart);

            accent.emitAlongPath(segment, {
                pressure,
                size: brushSize,
                opacity: brushOpacity
            });

            // Remember pressure for trail visualization
            brushPressureTrail.push(pressure);
            if (brushPressureTrail.length > 30) brushPressureTrail.shift();
        }
    };

    const finish = ({ emitReleased = false } = {}) => {
        clearTimer();
        const wasActivated = activated;
        activated = false;
        pointerStart = null;
        activePointerId = null;
        dragging = false;

        // Emit canvas:painted event if brush was active
        const brushState = HOST_BRUSH_STATE.get(host) || { enabled: false };
        if (brushState.enabled && pathBuffer.length > 0) {
            const brushPressure = brushPressureTrail.length > 0
                ? brushPressureTrail.reduce((a, b) => a + b) / brushPressureTrail.length
                : 0.5;

            bus.emit('canvas:painted', {
                reason: 'brush',
                pressure: brushPressure,
                trailLength: pathBuffer.length,
                color: host.dataset.spwImageResonance || 'teal',
                archetype: host.dataset.spwAccent || 'wave',
                flowAware: true
            }, { element: host });
        }

        pathBuffer = [];
        brushPressureTrail = [];
        clearPrimedTimer(host);

        const preservePreview = host.matches(':hover')
            || host.matches(':focus-within')
            || host.dataset.spwControlsOpen === 'true';

        if (!wasActivated) {
            delete host.dataset.spwHoldState;
            if (emitReleased) {
                dispatchImageRefresh(host, IMAGE_REFRESH_REASONS.RELEASED);
            }
            resetPointerState(host, { preservePreview });
            return;
        }

        host.dataset.spwHoldState = 'visited';
        dispatchImageRefresh(host, IMAGE_REFRESH_REASONS.VISITED);
        resetPointerState(host, { preservePreview });
    };

    const start = (event) => {
        if (event.target.closest('.spw-image-helper-strip')) return;
        if (event.button !== undefined && event.button !== 0) return;
        if (event.isPrimary === false) return;

        activated = false;
        dragging = false;
        pointerStart = {
            x: typeof event.clientX === 'number' ? event.clientX : null,
            y: typeof event.clientY === 'number' ? event.clientY : null
        };
        activePointerId = typeof event.pointerId === 'number' ? event.pointerId : null;
        pathBuffer = [];
        brushPressureTrail = [];
        setHostInput(
            host,
            event.pointerType === 'touch'
                ? IMAGE_INPUTS.COARSE
                : (event.pointerType ? IMAGE_INPUTS.FINE : getHostRuntime(host).input)
        );

        clearTimer();
        host.dataset.spwHoldState = 'arming';
        host.dataset.spwImagePreview = 'on';
        host.dataset.spwImagePrimed = 'true';
        queuePointerState(host, event, { pointerDown: true, dragging: false, dragDistance: 0 });
        syncInteractionState(host);
        dispatchImageRefresh(host, IMAGE_REFRESH_REASONS.ARMING);
        timer = window.setTimeout(() => {
            activated = true;
            markVisited(host);
        }, HOLD_DURATION_MS);
    };

    const move = (event) => {
        if (activePointerId !== null && event.pointerId !== undefined && event.pointerId !== activePointerId) {
            return;
        }

        host.dataset.spwImagePreview = 'on';
        if (event.pointerType) {
            setHostInput(host, event.pointerType === 'touch' ? IMAGE_INPUTS.COARSE : IMAGE_INPUTS.FINE);
        }

        let dragDistance = 0;
        const pointerDown = Boolean(pointerStart !== null && pointerStart?.x !== null && pointerStart?.y !== null);
        if (pointerDown && typeof event.clientX === 'number' && typeof event.clientY === 'number') {
            dragDistance = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
        }

        if (timer && dragDistance > DRAG_CANCEL_DISTANCE_PX) {
            clearTimer();
            delete host.dataset.spwHoldState;
            dispatchImageRefresh(host, IMAGE_REFRESH_REASONS.RELEASED);
        }

        dragging = pointerDown && dragDistance > DRAG_CANCEL_DISTANCE_PX * 1.35;
        if (!pointerDown && host.dataset.spwImagePrimed !== 'true') {
            schedulePrimedState(host, event.pointerType === 'touch' ? 0 : PRIMED_DELAY_MS);
        }
        queuePointerState(host, event, { pointerDown, dragging, dragDistance });

        // Emit brush particles if in brush mode
        if (dragging) {
            emitBrushParticles(event, dragDistance);
        }
    };

    host.addEventListener('pointerdown', start);
    host.addEventListener('pointermove', move);
    host.addEventListener('pointerup', () => {
        finish({ emitReleased: true });
    });
    host.addEventListener('pointerleave', () => {
        if (pointerStart) {
            finish({ emitReleased: true });
            return;
        }
        clearPrimedState(host);
        resetPointerState(host);
    });
    host.addEventListener('pointercancel', () => {
        finish({ emitReleased: true });
    });

    host.addEventListener('pointerenter', () => {
        host.dataset.spwImagePreview = 'on';
        setHostInput(host, isCoarsePointerEnvironment() ? IMAGE_INPUTS.COARSE : IMAGE_INPUTS.FINE);
        schedulePrimedState(host, isCoarsePointerEnvironment() ? 0 : PRIMED_DELAY_MS);
        syncInteractionState(host);
    });
    host.addEventListener('focusin', () => {
        host.dataset.spwImagePreview = 'on';
        setHostInput(host, IMAGE_INPUTS.KEYBOARD);
        host.dataset.spwImagePrimed = 'true';
        queuePointerState(host);
        syncInteractionState(host);
    });
    host.addEventListener('focusout', () => {
        finish({ emitReleased: true });
        clearPrimedState(host);
        resetPointerState(host);
    });

    if (!host.hasAttribute('tabindex')) {
        host.tabIndex = 0;
    }

    host.addEventListener('keydown', (event) => {
        if (event.code !== 'Space' && event.code !== 'Enter') return;
        if (event.repeat) return;
        event.preventDefault();
        setHostInput(host, IMAGE_INPUTS.KEYBOARD);
        start(event);
    });

    host.addEventListener('keyup', (event) => {
        if (event.code !== 'Space' && event.code !== 'Enter') return;
        event.preventDefault();
        finish({ emitReleased: true });
    });
}

function isEligibleHost(host) {
    if (!(host instanceof HTMLElement)) return false;
    if (host.dataset.spwImageManaged === 'true') return false;
    return Boolean(host.querySelector('img, svg'));
}

function mountHost(host) {
    ensureHelper(host);
    resetPointerState(host, { preservePreview: true });
    registerHoldGesture(host);
    host.addEventListener(IMAGE_REFRESH_EVENT, () => {
        syncHost(host);
    });
    HOST_RESIZE_OBSERVER?.observe(host);
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
    window.addEventListener('resize', () => {
        if (HOST_RESIZE_OBSERVER) return;
        document.querySelectorAll('[data-spw-image-managed="true"]').forEach((host) => syncInteractionState(host));
    }, { passive: true });

    document.addEventListener('spw:component-semantics-ready', () => {
        scan(document);
    });

    bus.on('settings:changed', () => {
        document.querySelectorAll('[data-spw-image-managed="true"]').forEach((host) => syncHost(host));
    });
}
