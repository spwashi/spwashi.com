/**
 * Pretext Measurement Bus
 *
 * Orchestration layer for optional live typographic snapshots.
 * Sitewide copy analysis lives in scripts/page-copy-audit.mjs (copy-flow).
 * pretext-physics is a lab projection, not this bus.
 *
 * Wrap is a two-width comparison. Never classify a single layout against itself.
 */

import { loadPretext } from './pretext-utils.js';

export const PRETEXT_MEASUREMENT_EVENT = 'spw:pretext-measurement';

export const WRAP_VOLATILITY = Object.freeze({
  STABLE: 'stable',
  RESPONSIVE: 'responsive',
  VOLATILE: 'volatile',
});

export const MEASURE_KIND = Object.freeze({
  OBJECTIVE: 'objective',
});

const PRETEXT_HOST_SELECTOR = '[data-spw-flow="pretext"]';

/** Same insets as pretext-presets / page-copy audit. */
export const PRETEXT_REFERENCE_WIDTHS = Object.freeze({
  phone: 288,
  tablet: 704,
  desktop: 1072,
});

let pretextPromise = null;

export function resolveCompareWidth(width, explicit) {
  if (Number.isFinite(explicit) && explicit > 0) return Math.max(40, Math.round(explicit));
  const phone = PRETEXT_REFERENCE_WIDTHS.phone;
  const desktop = PRETEXT_REFERENCE_WIDTHS.desktop;
  const resolved = Math.max(40, Math.round(width || phone));
  return Math.abs(resolved - phone) >= Math.abs(resolved - desktop) ? phone : desktop;
}

export function preparePretextHandle(engine, text, font, options = { whiteSpace: 'normal' }) {
  if (typeof engine.prepareWithSegments === 'function') {
    return engine.prepareWithSegments(text, font, options);
  }
  return engine.prepare(text, font);
}

export function layoutPretextHandle(engine, handle, width, lineHeightPx) {
  const resolved = Math.max(40, Math.round(width));
  if (typeof engine.layoutWithLines === 'function') {
    return engine.layoutWithLines(handle, resolved, lineHeightPx);
  }
  return engine.layout(handle, resolved, lineHeightPx);
}

function toNumber(value = '', fallback = 0) {
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function classifyWrapVolatility(canonicalLines = 0, projectedLines = 0) {
  const canonical = Math.max(0, Math.round(canonicalLines));
  const projected = Math.max(0, Math.round(projectedLines));
  const diff = Math.abs(projected - canonical);

  if (diff >= 4) return WRAP_VOLATILITY.VOLATILE;
  if (diff >= 2) return WRAP_VOLATILITY.RESPONSIVE;
  return WRAP_VOLATILITY.STABLE;
}

export function findPretextHost(el) {
  if (!(el instanceof Element)) return null;
  if (el.matches(PRETEXT_HOST_SELECTOR)) return el;
  return el.querySelector(PRETEXT_HOST_SELECTOR) || el.closest(PRETEXT_HOST_SELECTOR);
}

export function readPretextSignals(el) {
  const host = findPretextHost(el);
  if (!(host instanceof HTMLElement)) return null;

  const canonicalWidth = toNumber(host.style.getPropertyValue('--pretext-canonical-width'));
  const projectedWidth = toNumber(host.style.getPropertyValue('--pretext-projected-width'));

  return {
    host,
    kind: host.dataset.textKind || host.dataset.spwPretextGenre || '',
    density: host.dataset.textDensity || host.dataset.spwPretextDensity || '',
    measure: host.dataset.textMeasure || host.dataset.spwPretextMeasure || '',
    projection: host.dataset.textProjection || host.dataset.spwPretextProjection || '',
    ornament: host.dataset.textOrnament || host.dataset.spwPretextOrnament || '',
    wrap: host.dataset.textWrap || '',
    widthClass: host.dataset.textWidthClass || host.dataset.spwPretextWidthClass || '',
    mode: host.dataset.textMode || host.dataset.spwPretextMode || '',
    preset: host.dataset.spwPretextPreset || '',
    canonicalWidth,
    projectedWidth,
    lineCount: toNumber(host.dataset.spwPretextLineCount),
    projectedLineCount: toNumber(host.dataset.spwPretextProjectedLineCount),
    heightPx: toNumber(host.dataset.spwPretextHeightPx),
    measureKind: MEASURE_KIND.OBJECTIVE,
    source: host.dataset.spwPretextLive === 'true' ? 'pretext-live' : 'pretext-static',
  };
}

export function formatMeasurementSummary(snapshot = {}) {
  const parts = [
    snapshot.lineCount ? `${snapshot.lineCount}L` : null,
    snapshot.heightPx ? `~${Math.round(snapshot.heightPx)}px` : null,
    snapshot.widthPx ? `@${Math.round(snapshot.widthPx)}px` : null,
    snapshot.wrap ? `wrap:${snapshot.wrap}` : null,
    snapshot.measure ? `measure:${snapshot.measure}` : null,
  ].filter(Boolean);

  return parts.length ? parts.join(' · ') : 'awaiting measurement';
}

export function publishMeasurement(detail = {}) {
  if (typeof document === 'undefined') return;

  const snapshot = {
    measureKind: MEASURE_KIND.OBJECTIVE,
    ...detail,
  };

  document.dispatchEvent(new CustomEvent(PRETEXT_MEASUREMENT_EVENT, {
    detail: snapshot,
    bubbles: false,
  }));

  return snapshot;
}

export async function ensurePretextEngine() {
  if (!pretextPromise) {
    pretextPromise = loadPretext().catch((error) => {
      pretextPromise = null;
      throw error;
    });
  }
  return pretextPromise;
}

export function readDocumentTypography() {
  const style = getComputedStyle(document.documentElement);
  const rootFontSize = style.getPropertyValue('--site-root-font-size').trim() || '100%';
  const lineHeight = style.getPropertyValue('--site-line-height').trim() || '1.68';
  const bodyStyle = getComputedStyle(document.body);
  const fontFamily = bodyStyle.fontFamily || 'system-ui, sans-serif';
  const fontSize = bodyStyle.fontSize || '16px';
  const parsedLineHeight = Number.parseFloat(lineHeight);
  const lineHeightPx = Number.isFinite(parsedLineHeight) && parsedLineHeight < 4
    ? Math.round(Number.parseFloat(fontSize) * parsedLineHeight)
    : Math.round(Number.parseFloat(lineHeight) || 24);

  return {
    font: `${fontSize} ${fontFamily}`,
    rootFontSize,
    lineHeightPx,
    monoFont: style.getPropertyValue('--site-mono-font').trim()
      || "JetBrains Mono, ui-monospace, monospace",
  };
}

export async function measureTextLayout({
  text = '',
  width = PRETEXT_REFERENCE_WIDTHS.phone,
  compareWidth,
  font,
  lineHeightPx,
  prepared,
  pretext,
} = {}) {
  const engine = pretext || await ensurePretextEngine();
  const typography = readDocumentTypography();
  const resolvedFont = font || typography.font;
  const resolvedLineHeight = lineHeightPx || typography.lineHeightPx;
  const trimmed = String(text || '').trim();
  const resolvedWidth = Math.max(40, Math.round(width));
  const resolvedCompare = resolveCompareWidth(resolvedWidth, compareWidth);

  if (!trimmed) {
    return {
      text: '',
      width: resolvedWidth,
      compareWidth: resolvedCompare,
      lineCount: 0,
      compareLineCount: 0,
      height: 0,
      wrap: WRAP_VOLATILITY.STABLE,
      lines: [],
      measureKind: MEASURE_KIND.OBJECTIVE,
      source: 'pretext-measurement-bus',
    };
  }

  const handle = prepared || preparePretextHandle(engine, trimmed, resolvedFont);
  const layout = layoutPretextHandle(engine, handle, resolvedWidth, resolvedLineHeight);
  const compareLayout = resolvedCompare === resolvedWidth
    ? layout
    : layoutPretextHandle(engine, handle, resolvedCompare, resolvedLineHeight);

  const lineCount = layout.lineCount ?? layout.lines?.length ?? 0;
  const compareLineCount = compareLayout.lineCount ?? compareLayout.lines?.length ?? 0;
  const height = layout.height ?? 0;
  const lines = layout.lines || [];

  return {
    text: trimmed,
    width: resolvedWidth,
    compareWidth: resolvedCompare,
    lineCount,
    compareLineCount,
    height,
    wrap: classifyWrapVolatility(compareLineCount, lineCount),
    lines,
    font: resolvedFont,
    lineHeightPx: resolvedLineHeight,
    measureKind: MEASURE_KIND.OBJECTIVE,
    source: 'pretext-measurement-bus',
  };
}

export function writePretextMeasurementDataset(host, snapshot = {}) {
  if (!(host instanceof HTMLElement)) return;

  if (snapshot.wrap) host.dataset.textWrap = snapshot.wrap;
  if (snapshot.measure) host.dataset.textMeasure = snapshot.measure;
  if (snapshot.widthClass) host.dataset.textWidthClass = snapshot.widthClass;
  if (Number.isFinite(snapshot.lineCount)) host.dataset.spwPretextLineCount = String(snapshot.lineCount);
  if (Number.isFinite(snapshot.projectedLineCount)) {
    host.dataset.spwPretextProjectedLineCount = String(snapshot.projectedLineCount);
  }
  if (Number.isFinite(snapshot.heightPx)) host.dataset.spwPretextHeightPx = String(Math.round(snapshot.heightPx));
  if (Number.isFinite(snapshot.widthPx)) host.dataset.spwPretextWidthPx = String(Math.round(snapshot.widthPx));
  host.dataset.spwMeasureKind = MEASURE_KIND.OBJECTIVE;
  host.dataset.spwMeasureSource = snapshot.source || 'pretext-measurement-bus';
}

export const SPW_PRETEXT_MEASUREMENT_BUS_CONTRACT = Object.freeze({
  event: PRETEXT_MEASUREMENT_EVENT,
  hostSelector: PRETEXT_HOST_SELECTOR,
  measureKind: MEASURE_KIND.OBJECTIVE,
  referenceWidths: PRETEXT_REFERENCE_WIDTHS,
  portableUse:
    'Copy-flow orchestration: measureTextLayout() compares two widths. Sitewide analysis is scripts/page-copy-audit.mjs. pretext-physics stays a lab projection.',
});