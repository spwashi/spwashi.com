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
] as const);

export type TimingArcStem = (typeof TIMING_ARC_STEMS)[number];

export const STANDARD_IDLE_CHUNKS = Object.freeze([
  'idle-residue',
  'idle-collectible',
  'idle-chrome',
  'idle-lab',
  'idle-default',
] as const);

export type IdleChunkId = (typeof STANDARD_IDLE_CHUNKS)[number];

export type SpwPerfMark = Readonly<{ name: string; startTime: number }>;
export type SpwPerfMeasure = Readonly<{ name: string; duration: number; startTime?: number }>;

export type IdleChunkDuration = Readonly<{ chunk: string; duration: number }>;

export type SpwPerformanceSummary = Readonly<{
  bootToReady: number | null;
  immediateLayer: number | null;
  immediateCore: number | null;
  immediateNonCore: number | null;
  nonCoreCatalog: number | null;
  settledLayer: number | null;
  fullBoot: number | null;
  idleChunks: readonly IdleChunkDuration[];
  idleChunkTotal: number;
  markCount: number;
  measureCount: number;
  moduleMeasures: Readonly<Record<string, number>>;
  layerMeasures: Readonly<Record<string, number>>;
}>;

export type SpwPerformanceTimings = Readonly<{
  marks: readonly SpwPerfMark[];
  measures: readonly SpwPerfMeasure[];
  summary: SpwPerformanceSummary | null;
}>;

const TIMING_ARC_STEM_RE = new RegExp(
  `^(?:${TIMING_ARC_STEMS.join('|')})-[a-z0-9]+(?:-[a-z0-9]+)*$`,
);

export function isKnownTimingArc(value: string | null | undefined): boolean {
  const token = String(value || '').trim().toLowerCase();
  if (!token) return false;
  return TIMING_ARC_STEM_RE.test(token);
}

export function timingArcStem(value: string | null | undefined): TimingArcStem | 'other' | 'missing' {
  const token = String(value || '').trim().toLowerCase();
  if (!token) return 'missing';
  const stem = TIMING_ARC_STEMS.find((candidate) => token.startsWith(`${candidate}-`));
  return stem || 'other';
}

export function isStandardIdleChunk(value: string | null | undefined): boolean {
  return (STANDARD_IDLE_CHUNKS as readonly string[]).includes(String(value || '').trim());
}

function pickDuration(measures: readonly SpwPerfMeasure[], ...names: string[]): number | null {
  for (const name of names) {
    const hit = measures.find((m) => m.name === name);
    if (hit) return hit.duration;
  }
  return null;
}

/**
 * Summarize Performance API marks/measures that start with `spw:`.
 */
export function summarizeSpwPerformanceEntries(
  marks: readonly SpwPerfMark[] = [],
  measures: readonly SpwPerfMeasure[] = [],
): SpwPerformanceSummary {
  const idleChunks = measures
    .filter((m) => m.name.startsWith('spw:idle-chunk:') && !m.name.includes(':start') && !m.name.includes(':end'))
    .map((m) => ({
      chunk: m.name.replace(/^spw:idle-chunk:/, ''),
      duration: m.duration,
    }));

  const moduleMeasures: Record<string, number> = Object.create(null);
  const layerMeasures: Record<string, number> = Object.create(null);

  for (const measure of measures) {
    const moduleMatch = /^spw:module:([^:]+)$/.exec(measure.name);
    if (moduleMatch) {
      const id = moduleMatch[1];
      if (moduleMeasures[id] == null || measure.duration > moduleMeasures[id]) {
        moduleMeasures[id] = measure.duration;
      }
      continue;
    }
    if (
      measure.name.startsWith('spw:immediate-layer')
      || measure.name.startsWith('spw:idle-chunk:')
      || measure.name === 'spw:settled-layer'
      || measure.name === 'spw:boot-to-ready'
      || measure.name === 'spw:full-boot'
      || measure.name === 'spw:immediate-non-core-layers'
      || measure.name === 'spw:non-core-catalog'
    ) {
      layerMeasures[measure.name] = measure.duration;
    }
  }

  return {
    bootToReady: pickDuration(measures, 'spw:boot-to-ready'),
    immediateLayer: pickDuration(measures, 'spw:immediate-layer', 'spw:immediate-layer-parallel'),
    immediateCore: pickDuration(measures, 'spw:immediate-layer:core:parallel'),
    immediateNonCore: pickDuration(measures, 'spw:immediate-non-core-layers'),
    nonCoreCatalog: pickDuration(measures, 'spw:non-core-catalog'),
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
export function collectSpwPerformanceTimings(
  performanceLike: {
    getEntriesByType?: (type: string) => readonly { name?: string; startTime?: number; duration?: number }[];
  } | null | undefined,
): SpwPerformanceTimings {
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
  } catch {
    return { marks: [], measures: [], summary: null };
  }
}

export type CatalogTimingRollup = Readonly<{
  byTimingStem: Readonly<Record<string, number>>;
  byIdleChunk: Readonly<Record<string, number>>;
  knownArcCount: number;
  missingArcCount: number;
  idleWithChunk: number;
  idleWithoutChunk: number;
  nonstandardIdleChunk: readonly string[];
}>;

/**
 * Catalog-side timing hygiene rollup (when/timingArc/timingChunk).
 */
export function summarizeCatalogTiming(
  defs: readonly {
    when?: string | null;
    timingArc?: string | null;
    timingChunk?: string | null;
    debugOnly?: boolean;
  }[] = [],
): CatalogTimingRollup {
  const byTimingStem: Record<string, number> = Object.create(null);
  const byIdleChunk: Record<string, number> = Object.create(null);
  let knownArcCount = 0;
  let missingArcCount = 0;
  let idleWithChunk = 0;
  let idleWithoutChunk = 0;
  const nonstandard: string[] = [];

  for (const def of defs) {
    if (def?.debugOnly) continue;
    const stem = timingArcStem(def?.timingArc);
    byTimingStem[stem] = (byTimingStem[stem] || 0) + 1;
    if (stem === 'missing') missingArcCount += 1;
    else if (stem === 'other') {
      // nonstandard stem shape
    } else {
      knownArcCount += 1;
    }

    if (String(def?.when || '').toLowerCase() === 'idle') {
      const chunk = String(def?.timingChunk || '').trim();
      if (chunk) {
        idleWithChunk += 1;
        byIdleChunk[chunk] = (byIdleChunk[chunk] || 0) + 1;
        if (!isStandardIdleChunk(chunk)) {
          nonstandard.push(String((def as { id?: string }).id || chunk));
        }
      } else {
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
  portableUse:
    'summarizeSpwPerformanceEntries() for browser Performance marks; summarizeCatalogTiming() for catalog when/arc/chunk hygiene; isKnownTimingArc() for contracts.',
});
