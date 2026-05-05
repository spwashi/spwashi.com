/**
 * Spw Page Universe
 *
 * Exposes a machine-readable manifest for each page describing its:
 *   - audience and intent
 *   - gesture vocabulary
 *   - storage policy
 *   - operator emphasis
 *   - discovery affordances
 *   - translation capabilities
 *
 * The manifest is derived from page metadata (data attributes, surface type,
 * operator context) and written to window.__spwPageUniverse.
 *
 * This makes the page's behavioral contract inspectable by other agents.
 * Concatenate window.__spwPageUniverse with window.spwRecipes?.toJSON() or
 * window.spwPresets?.toJSON() to build a complete page context document.
 *
 * Bus events:
 *   universe:ready   { manifest }
 *
 * Usage from another agent/LLM:
 *   const ctx = JSON.stringify({
 *     universe: window.__spwPageUniverse,
 *     topics:   window.spwTopics?.index(),
 *     presets:  window.spwPresets?.toJSON(),
 *     recipes:  window.spwRecipes?.toJSON()
 *   }, null, 2);
 */

import { bus } from '/public/js/spw-bus.js';

const GESTURE_VOCABULARY = {
    tap:        'charge — begins accumulation on the target',
    hold:       'sustain — grounds or pins the concept at threshold',
    swipeIn:    'accumulate — gather related material, reveal depth',
    swipeOut:   'discharge — emit, export, or dismiss',
    swipeAcross: 'pivot — translate, compare, or cycle variants',
    release:    'settle or cancel — depends on threshold crossed',
    doubleTap:  'translate — switch representation mode'
};

const STORAGE_POLICY = {
    pageScoped:    true,
    exportable:    true,
    keysExposedInSettings: true,
    clearOnRequest: true,
    privacy:       'local-only — nothing leaves the device unless explicitly exported'
};

const TRANSLATION_POLICY = {
    spwToMarkdown:   'safe — lossless for structural information',
    markdownToSpw:   'assisted — structural hints preserved, semantics require review',
    intermediateNotes: 'sandboxed — local-only until explicit export',
    sourceIntegrity: 'locked — translation never mutates published source'
};

function getSurfaceType() {
    return document.body.dataset.spwSurface ?? 'generic';
}

function getActiveOperators() {
    const ops = new Set();
    document.querySelectorAll('[data-spw-operator]').forEach(el => {
        const op = el.dataset.spwOperator;
        if (op) ops.add(op);
    });
    return [...ops];
}

function getPageMeta() {
    return {
        title:       document.title,
        path:        window.location.pathname,
        description: document.querySelector('meta[name="description"]')?.content ?? '',
        surface:     getSurfaceType()
    };
}

function getSections() {
    return Array.from(document.querySelectorAll('.site-frame[id]')).map(el => ({
        id:          el.id,
        liminality:  el.dataset.spwLiminality ?? '',
        form:        el.dataset.spwForm ?? '',
        role:        el.dataset.spwRole ?? '',
        heading:     el.querySelector('h1, h2')?.textContent.trim() ?? ''
    }));
}

function getTopicIndex() {
    const map = {};
    document.querySelectorAll('.spw-topic, [data-spw-topic]').forEach(el => {
        const text = (el.dataset.spwTopic || el.textContent || '').trim().toLowerCase();
        if (!text) return;
        map[text] = (map[text] ?? 0) + 1;
    });
    return map;
}

function getDiscoverabilityProfile() {
    const features = new Set(
        (document.body.dataset.spwFeatures ?? '').split(' ').filter(Boolean)
    );
    return {
        hasOperatorMap:    !!document.querySelector('.spw-svg-flow-diagram'),
        hasTopics:         !!document.querySelector('.spw-topic, [data-spw-topic]'),
        hasRecipes:        features.has('recipes') || getSurfaceType() === 'recipes',
        hasPretextPhysics: !!document.querySelector('[data-spw-flow="pretext"]'),
        hasPresetMeasures: typeof window.spwPresets !== 'undefined',
        requestedFeatures: [...features]
    };
}

function buildManifest() {
    return {
        _version:    '1.0',
        _generated:  new Date().toISOString(),
        page:        getPageMeta(),
        sections:    getSections(),
        operators:   getActiveOperators(),
        topics:      getTopicIndex(),
        gestures:    GESTURE_VOCABULARY,
        storage:     STORAGE_POLICY,
        translation: TRANSLATION_POLICY,
        discovery:   getDiscoverabilityProfile(),
        // Convenience: full context dump for LLM hand-off
        toContextString() {
            const { toContextString: _, ...data } = this;
            const extras = {};
            if (window.spwTopics?.index) extras.topicOccurrences = window.spwTopics.index();
            if (window.spwPresets?.toJSON) extras.pretextPresets = window.spwPresets.toJSON();
            if (window.spwRecipes?.toJSON) extras.recipeSemantics = window.spwRecipes.toJSON();
            return JSON.stringify({ ...data, ...extras }, null, 2);
        }
    };
}

export function initPageUniverse() {
    const manifest = buildManifest();
    window.__spwPageUniverse = manifest;

    // Re-build after fonts and presets settle
    if (document.fonts?.ready) {
        document.fonts.ready.then(() => {
            Object.assign(window.__spwPageUniverse, buildManifest());
            bus.emit('universe:ready', { manifest: window.__spwPageUniverse });
        });
    } else {
        bus.emit('universe:ready', { manifest });
    }
}
