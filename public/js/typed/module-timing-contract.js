/**
 * Pure module timing / performance mark utilities.
 * Shared by site runtime (getSpwPerformanceTimings), catalog rollups, and tests.
 * Schedule truth stays in when/timingArc/timingChunk; this is inspect + budget only.
 */
export const TIMING_ARC_STEMS = Object.freeze([
    'boot',
    'immediate',
    'feature',
    'visible',
    'enhance',
    'idle',
    'settled',
    'region',
]);
export const STANDARD_IDLE_CHUNKS = Object.freeze([
    'idle-residue',
    'idle-collectible',
    'idle-chrome',
    'idle-lab',
    'idle-default',
]);
const TIMING_ARC_STEM_RE = new RegExp(`^(?:${TIMING_ARC_STEMS.join('|')})-[a-z0-9]+(?:-[a-z0-9]+)*$`);
export function isKnownTimingArc(value) {
    const token = String(value || '').trim().toLowerCase();
    if (!token)
        return false;
    return TIMING_ARC_STEM_RE.test(token);
}
export function timingArcStem(value) {
    const token = String(value || '').trim().toLowerCase();
    if (!token)
        return 'missing';
    const stem = TIMING_ARC_STEMS.find((candidate) => token.startsWith(`${candidate}-`));
    return stem || 'other';
}
export function isStandardIdleChunk(value) {
    return STANDARD_IDLE_CHUNKS.includes(String(value || '').trim());
}
function pickDuration(measures, ...names) {
    for (const name of names) {
        const hit = measures.find((m) => m.name === name);
        if (hit)
            return hit.duration;
    }
    return null;
}
/**
 * Summarize Performance API marks/measures that start with `spw:`.
 */
export function summarizeSpwPerformanceEntries(marks = [], measures = []) {
    const idleChunks = measures
        .filter((m) => m.name.startsWith('spw:idle-chunk:') && !m.name.includes(':start') && !m.name.includes(':end'))
        .map((m) => ({
        chunk: m.name.replace(/^spw:idle-chunk:/, ''),
        duration: m.duration,
    }));
    const moduleMeasures = Object.create(null);
    const layerMeasures = Object.create(null);
    for (const measure of measures) {
        const moduleMatch = /^spw:module:([^:]+)$/.exec(measure.name);
        if (moduleMatch) {
            const id = moduleMatch[1];
            if (moduleMeasures[id] == null || measure.duration > moduleMeasures[id]) {
                moduleMeasures[id] = measure.duration;
            }
            continue;
        }
        if (measure.name.startsWith('spw:immediate-layer')
            || measure.name.startsWith('spw:idle-chunk:')
            || measure.name === 'spw:settled-layer'
            || measure.name === 'spw:boot-to-ready'
            || measure.name === 'spw:full-boot'
            || measure.name === 'spw:immediate-non-core-layers') {
            layerMeasures[measure.name] = measure.duration;
        }
    }
    return {
        bootToReady: pickDuration(measures, 'spw:boot-to-ready'),
        immediateLayer: pickDuration(measures, 'spw:immediate-layer', 'spw:immediate-layer-parallel'),
        immediateCore: pickDuration(measures, 'spw:immediate-layer:core:parallel'),
        immediateNonCore: pickDuration(measures, 'spw:immediate-non-core-layers'),
        settledLayer: pickDuration(measures, 'spw:settled-layer'),
        fullBoot: pickDuration(measures, 'spw:full-boot'),
        idleChunks,
        idleChunkTotal: idleChunks.reduce((sum, row) => sum + (row.duration || 0), 0),
        markCount: marks.length,
        measureCount: measures.length,
        moduleMeasures,
        layerMeasures,
    };
}
/**
 * Collect spw:* entries from a Performance-like API (browser or mock).
 */
export function collectSpwPerformanceTimings(performanceLike) {
    try {
        const get = performanceLike?.getEntriesByType?.bind(performanceLike);
        if (!get) {
            return { marks: [], measures: [], summary: summarizeSpwPerformanceEntries([], []) };
        }
        const marks = (get('mark') || [])
            .filter((m) => m && typeof m.name === 'string' && m.name.startsWith('spw:'))
            .map((m) => ({ name: String(m.name), startTime: Math.round(Number(m.startTime) || 0) }));
        const measures = (get('measure') || [])
            .filter((m) => m && typeof m.name === 'string' && m.name.startsWith('spw:'))
            .map((m) => ({
            name: String(m.name),
            duration: Math.round(Number(m.duration) || 0),
            startTime: Math.round(Number(m.startTime) || 0),
        }));
        return {
            marks,
            measures,
            summary: summarizeSpwPerformanceEntries(marks, measures),
        };
    }
    catch {
        return { marks: [], measures: [], summary: null };
    }
}
/**
 * Catalog-side timing hygiene rollup (when/timingArc/timingChunk).
 */
export function summarizeCatalogTiming(defs = []) {
    const byTimingStem = Object.create(null);
    const byIdleChunk = Object.create(null);
    let knownArcCount = 0;
    let missingArcCount = 0;
    let idleWithChunk = 0;
    let idleWithoutChunk = 0;
    const nonstandard = [];
    for (const def of defs) {
        if (def?.debugOnly)
            continue;
        const stem = timingArcStem(def?.timingArc);
        byTimingStem[stem] = (byTimingStem[stem] || 0) + 1;
        if (stem === 'missing')
            missingArcCount += 1;
        else if (stem === 'other') {
            // nonstandard stem shape
        }
        else {
            knownArcCount += 1;
        }
        if (String(def?.when || '').toLowerCase() === 'idle') {
            const chunk = String(def?.timingChunk || '').trim();
            if (chunk) {
                idleWithChunk += 1;
                byIdleChunk[chunk] = (byIdleChunk[chunk] || 0) + 1;
                if (!isStandardIdleChunk(chunk)) {
                    nonstandard.push(String(def.id || chunk));
                }
            }
            else {
                idleWithoutChunk += 1;
                byIdleChunk.inferred = (byIdleChunk.inferred || 0) + 1;
            }
        }
    }
    return {
        byTimingStem,
        byIdleChunk,
        knownArcCount,
        missingArcCount,
        idleWithChunk,
        idleWithoutChunk,
        nonstandardIdleChunk: Object.freeze(nonstandard),
    };
}
export const MODULE_TIMING_CONTRACT = Object.freeze({
    stems: TIMING_ARC_STEMS,
    idleChunks: STANDARD_IDLE_CHUNKS,
    portableUse: 'summarizeSpwPerformanceEntries() for browser Performance marks; summarizeCatalogTiming() for catalog when/arc/chunk hygiene; isKnownTimingArc() for contracts.',
});
