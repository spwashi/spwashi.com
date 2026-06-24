/**
 * modules/design/typography-measurement-preview.js
 * ---------------------------------------------------------------------------
 * Settings-route typography measurement preview backed by the Pretext bus.
 */

import {
  classifyWrapVolatility,
  ensurePretextEngine,
  formatMeasurementSummary,
  measureTextLayout,
  PRETEXT_MEASUREMENT_EVENT,
  publishMeasurement,
  readDocumentTypography,
  readPretextSignals,
  writePretextMeasurementDataset,
} from '/public/js/semantic/pretext-measurement-bus.js';

const ROOT_SELECTOR = '#typography-measurement-preview';
const DEFAULT_SAMPLE = `Settings tune reading weather in this browser. Change scale or line spacing and watch line count, height, and wrap volatility update before you carry the choice back to a real route.`;

let initialized = false;
let cleanup = null;

function readControlValue(root, name, fallback = '') {
  const scoped = root.querySelector(`[name="${name}"]:checked, [name="${name}"]`);
  if (scoped instanceof HTMLInputElement) {
    if (scoped.type === 'range') return scoped.value;
    if (scoped.type === 'radio' && !scoped.checked) return fallback;
    return scoped.value;
  }
  return fallback;
}

function resolvePreviewWidth(root) {
  const slider = root.querySelector('[data-typography-measure-width]');
  const numeric = Number.parseFloat(slider?.value || root.dataset.spwTypographyMeasureWidth || '360');
  return Number.isFinite(numeric) ? Math.max(160, Math.round(numeric)) : 360;
}

function updateReadout(root, snapshot) {
  const readout = root.querySelector('[data-typography-measure-readout]');
  const widthLabel = root.querySelector('[data-typography-measure-width-label]');
  const width = snapshot.widthPx || snapshot.width;

  if (widthLabel) widthLabel.textContent = `${Math.round(width)}px`;
  if (readout) {
    readout.textContent = formatMeasurementSummary({
      lineCount: snapshot.lineCount,
      heightPx: snapshot.heightPx,
      widthPx: width,
      wrap: snapshot.wrap,
      measure: snapshot.measure,
    });
  }
}

async function refreshPreview(root) {
  const host = root.querySelector('[data-spw-flow="pretext"]');
  const sampleNode = host?.querySelector('[data-typography-measure-sample]');
  const text = sampleNode?.textContent?.trim() || DEFAULT_SAMPLE;
  const width = resolvePreviewWidth(root);
  const typography = readDocumentTypography();

  try {
    const layout = await measureTextLayout({
      text,
      width,
      font: typography.font,
      lineHeightPx: typography.lineHeightPx,
    });

    const liveSignals = readPretextSignals(host);
    const projectedLineCount = layout.lineCount;
    const canonicalLineCount = liveSignals?.lineCount || projectedLineCount;
    const wrap = classifyWrapVolatility(canonicalLineCount, projectedLineCount);

    const snapshot = {
      host,
      text,
      widthPx: width,
      lineCount: projectedLineCount,
      projectedLineCount,
      canonicalLineCount,
      heightPx: layout.height,
      wrap,
      measure: liveSignals?.measure || 'standard',
      widthClass: liveSignals?.widthClass || '',
      source: 'settings-typography-preview',
      route: '/settings/#typography-settings',
    };

    if (host instanceof HTMLElement) {
      writePretextMeasurementDataset(host, snapshot);
      host.style.setProperty('--pretext-canonical-width', `${width}px`);
      host.style.setProperty('--pretext-projected-width', `${width}px`);
    }

    updateReadout(root, snapshot);
    publishMeasurement(snapshot);
    root.dataset.spwTypographyMeasureState = 'ready';
  } catch {
    root.dataset.spwTypographyMeasureState = 'error';
    const readout = root.querySelector('[data-typography-measure-readout]');
    if (readout) readout.textContent = 'measurement unavailable — Pretext bridge offline';
  }
}

export async function initTypographyMeasurementPreview(root = document) {
  if (initialized) return cleanup;

  const panel = root.querySelector(ROOT_SELECTOR);
  if (!(panel instanceof HTMLElement)) return () => {};

  initialized = true;
  panel.dataset.spwTypographyMeasureState = 'loading';

  try {
    await ensurePretextEngine();
  } catch {
    panel.dataset.spwTypographyMeasureState = 'unsupported';
    return () => {};
  }

  const queueRefresh = () => {
    window.requestAnimationFrame(() => {
      refreshPreview(panel);
    });
  };

  const onSettingsChange = () => queueRefresh();
  const onBusMeasurement = (event) => {
    if (event.detail?.source === 'settings-typography-preview') return;
    const host = panel.querySelector('[data-spw-flow="pretext"]');
    if (event.detail?.host === host) queueRefresh();
  };

  panel.addEventListener('input', (event) => {
    if (event.target?.matches?.('[data-typography-measure-width]')) queueRefresh();
  }, { passive: true });

  document.addEventListener('spw:settings-change', onSettingsChange, { passive: true });
  document.addEventListener('spw:settings:changed', onSettingsChange, { passive: true });
  document.addEventListener(PRETEXT_MEASUREMENT_EVENT, onBusMeasurement);

  let resizeObserver = null;
  if (typeof ResizeObserver === 'function') {
    resizeObserver = new ResizeObserver(() => queueRefresh());
    const host = panel.querySelector('[data-spw-flow="pretext"]');
    if (host instanceof Element) resizeObserver.observe(host);
  } else {
    window.addEventListener('resize', queueRefresh, { passive: true });
  }

  queueRefresh();

  cleanup = () => {
    document.removeEventListener('spw:settings-change', onSettingsChange);
    document.removeEventListener('spw:settings:changed', onSettingsChange);
    document.removeEventListener(PRETEXT_MEASUREMENT_EVENT, onBusMeasurement);
    resizeObserver?.disconnect();
    window.removeEventListener('resize', queueRefresh);
    initialized = false;
    cleanup = null;
  };

  return cleanup;
}
