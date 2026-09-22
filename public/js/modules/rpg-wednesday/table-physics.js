/**
 * Pure Spw-to-table physics for RPG Wednesday.
 * Missing slots stay null. Callers decide the visible fallback.
 */

import { readJoinChain, shapeFromExpression } from '/public/js/semantic/expression-query.js';

const DENSITY_WEIGHT = Object.freeze({
    minimal: 0.8,
    normal: 1,
    rich: 1.35,
});

const slot = (value) => {
    const text = String(value || '').trim();
    return text || null;
};

const hueFrom = (text) => {
    let n = 0;
    for (const ch of text) n = (n * 33 + ch.charCodeAt(0)) % 360;
    return n;
};

export const readTableRuntime = (root = globalThis.document?.documentElement) => {
    const dataset = root?.dataset || {};
    let reduced = dataset.spwReduceMotion === 'on';
    try {
        reduced = reduced || globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
    } catch {
        reduced = reduced || false;
    }
    return {
        density: slot(dataset.spwSemanticDensity),
        numericity: slot(dataset.spwNumericityEmphasis),
        animation: slot(dataset.spwAnimationIntensity),
        palette: slot(dataset.spwPaletteResonance),
        posture: slot(dataset.spwInteractionPosture),
        reduced,
    };
};

export const composeExpression = ({ subject = '', mode = '', parts = [], projection = '' } = {}) => {
    const stem = slot(subject) || 'table';
    const frame = slot(mode);
    const body = (Array.isArray(parts) ? parts : String(parts).split(/[,.\s]+/))
        .map((part) => slot(part))
        .filter(Boolean);
    const capsule = slot(projection);
    const wrote = Boolean(slot(subject) || frame || body.length || capsule);
    if (!wrote) return '';
    let text = stem;
    if (frame) text += `[${frame}]`;
    if (body.length) text += `{${body.join('.')}}`;
    if (capsule) text += `<${capsule}>`;
    return text;
};

export const projectTablePhysics = (source, runtime = {}) => {
    const text = String(source || '');
    const shape = shapeFromExpression(text);
    const join = readJoinChain(text);
    const subject = slot(shape.subject);
    const mode = slot(shape.mode);
    const parts = Array.isArray(shape.parts) && shape.parts.some(Boolean) ? shape.parts.filter(Boolean) : null;
    const projection = slot(shape.projection);
    const densityWeight = DENSITY_WEIGHT[runtime.density] ?? null;
    const numericBoost = runtime.numericity === 'high'
        ? 1.2
        : runtime.numericity === 'low'
            ? 0.85
            : runtime.numericity
                ? 1
                : null;
    const segments = parts ? Math.min(12, Math.max(2, parts.length)) : null;
    const weight = densityWeight == null ? null : densityWeight * (numericBoost ?? 1);
    const gravity = segments == null
        ? null
        : Number((segments * (weight ?? 1)).toFixed(2));
    const motion = runtime.reduced
        ? 0
        : runtime.animation === 'off' || runtime.animation === 'none'
            ? 0
            : runtime.animation
                ? 1
                : null;

    return {
        source: text,
        subject,
        mode,
        parts,
        projection,
        join: join?.kind && join.kind !== 'none' ? join.kind : null,
        segments,
        gravity,
        hue: subject ? hueFrom(subject) : null,
        tick: parts ? parts[0] : null,
        motion,
        density: runtime.density || null,
        posture: runtime.posture || null,
        palette: runtime.palette || null,
        fallbacks: [
            subject ? null : 'subject',
            mode ? null : 'mode',
            parts ? null : 'parts',
            projection ? null : 'projection',
            runtime.density ? null : 'density',
        ].filter(Boolean),
    };
};
