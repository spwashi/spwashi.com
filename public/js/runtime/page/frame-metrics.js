import {
  ensurePretextEngine,
  formatMeasurementSummary,
  measureTextLayout,
  publishMeasurement,
  readDocumentTypography,
  readPretextSignals,
} from '/public/js/semantic/pretext-measurement-bus.js';
import { FRAME_SELECTOR, writeDatasetValues } from '/public/js/kernel/dom-contracts.js';

let initialized = false;
let cleanupCurrent = null;

const getFramePrimaryText = (frame) => {
    const p = frame.querySelector('p:not(.frame-note):not(.inline-note)');
    if (p?.textContent.trim().length > 20) return p.textContent.trim();

    const h1 = frame.querySelector('h1');
    if (h1) return h1.textContent.trim();

    const h2 = frame.querySelector('h2');
    if (h2) return h2.textContent.trim();

    return '';
};

const createMetricsBar = () => {
    const bar = document.createElement('div');
    bar.className = 'frame-metrics-bar';
    bar.setAttribute('aria-hidden', 'true');
    bar.dataset.spwMeasureKind = 'objective';
    bar.dataset.spwMeasureSource = 'frame-metrics';

    const label = document.createElement('span');
    label.className = 'frame-metrics-label';
    label.textContent = '>metrics';

    const items = document.createElement('span');
    items.className = 'frame-metrics-items';
    items.textContent = '…';

    bar.append(label, items);
    return { bar, items };
};

const measureFrame = async (frame, handleCache, typography) => {
    const liveSignals = readPretextSignals(frame);
    if (liveSignals?.lineCount) {
        return {
            lineCount: liveSignals.lineCount,
            height: liveSignals.heightPx,
            width: liveSignals.projectedWidth || liveSignals.canonicalWidth,
            wrap: liveSignals.wrap,
            measure: liveSignals.measure,
            source: liveSignals.source,
        };
    }

    const text = getFramePrimaryText(frame);
    if (!text) return null;

    const frameStyle = getComputedStyle(frame);
    const frameWidth = frame.getBoundingClientRect().width;
    const paddingInline = (Number.parseFloat(frameStyle.paddingLeft) || 0)
        + (Number.parseFloat(frameStyle.paddingRight) || 0);
    const width = Math.max(40, frameWidth - paddingInline);

    let entry = handleCache.get(frame);
    if (
        !entry
        || entry.text !== text
        || entry.width !== width
        || entry.font !== typography.font
        || entry.lineHeightPx !== typography.lineHeightPx
    ) {
        try {
            const layout = await measureTextLayout({
                text,
                width,
                font: typography.font,
                lineHeightPx: typography.lineHeightPx,
            });
            entry = {
                text,
                width,
                font: typography.font,
                lineHeightPx: typography.lineHeightPx,
                layout,
            };
            handleCache.set(frame, entry);
        } catch {
            return null;
        }
    }

    const { layout } = entry;

    return {
        lineCount: layout.lineCount,
        height: layout.height,
        width: layout.width,
        wrap: layout.wrap,
        measure: 'standard',
        source: 'frame-metrics',
    };
};

const updateAll = async (tracked, handleCache, lastPublished, publish) => {
    // Typography is read once per pass; every frame's own read happens before any write.
    const typography = readDocumentTypography();
    await Promise.all(tracked.map(async ({ frame, bar, items }) => {
        const metrics = await measureFrame(frame, handleCache, typography);
        if (!metrics) return;

        const summary = formatMeasurementSummary({
            lineCount: metrics.lineCount,
            heightPx: metrics.height,
            widthPx: metrics.width,
            wrap: metrics.wrap,
            measure: metrics.measure,
        });
        if (items.textContent !== summary) items.textContent = summary;

        writeDatasetValues(frame, {
            spwFrameLineCount: String(metrics.lineCount),
            spwFrameTextHeight: String(Math.round(metrics.height || 0)),
            spwFrameMeasureWidth: String(Math.round(metrics.width || 0)),
            spwFrameWrap: metrics.wrap || '',
            spwMeasureKind: 'objective',
            spwMeasureSource: metrics.source || 'frame-metrics',
        }, { allowEmpty: true });

        // A frame is published when its measurement moves, not on every pass.
        const key = `${summary}|${metrics.source || ''}`;
        if (lastPublished.get(frame) === key) return;
        lastPublished.set(frame, key);
        publish({
            host: frame,
            lineCount: metrics.lineCount,
            heightPx: metrics.height,
            widthPx: metrics.width,
            wrap: metrics.wrap,
            measure: metrics.measure,
            source: metrics.source || 'frame-metrics',
        });
    }));
};

export async function initFrameMetrics(ctx, root) {
  if (!(root instanceof Node)) {
    root = document;
  }
    if (initialized) {
        return cleanupCurrent || (() => {});
    }

    const frames = Array.from(root.querySelectorAll(FRAME_SELECTOR));
    if (!frames.length) return () => {};

    initialized = true;

    try {
        if (document.fonts?.ready) await document.fonts.ready;
        await ensurePretextEngine();
    } catch {
        initialized = false;
        return () => {};
    }

    const handleCache = new WeakMap();
    const lastPublished = new WeakMap();
    // publishMeasurement dispatches the event this module listens to; its own
    // publications must not schedule another pass, or it re-measures every frame forever.
    let publishing = false;
    const publish = (detail) => {
        publishing = true;
        try {
            publishMeasurement(detail);
        } finally {
            publishing = false;
        }
    };

    const tracked = frames.map((frame) => {
        const existing = frame.querySelector(':scope > .frame-metrics-bar');
        if (existing) existing.remove();

        const { bar, items } = createMetricsBar();
        frame.appendChild(bar);
        return { frame, bar, items };
    });

    let rafId = 0;
    const scheduleUpdate = () => {
        if (publishing) return;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
            rafId = 0;
            updateAll(tracked, handleCache, lastPublished, publish);
        });
    };

    let observer = null;
    if ('ResizeObserver' in window) {
        observer = new ResizeObserver(scheduleUpdate);
        frames.forEach((frame) => observer.observe(frame));
    } else {
        window.addEventListener('resize', scheduleUpdate, { passive: true });
    }

    document.addEventListener('spw:pretext-measurement', scheduleUpdate, { passive: true });
    const bus = ctx?.bus || window.__SPW_SITE__?.bus;
    const offSettings = bus?.on?.('settings:changed', scheduleUpdate) || null;

    scheduleUpdate();

    cleanupCurrent = () => {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = 0;
        }

        if (observer) {
            observer.disconnect();
            observer = null;
        } else {
            window.removeEventListener('resize', scheduleUpdate);
        }

        document.removeEventListener('spw:pretext-measurement', scheduleUpdate);
        offSettings?.();
        tracked.forEach(({ bar }) => bar.remove());

        cleanupCurrent = null;
        initialized = false;
    };

    return cleanupCurrent;
}
