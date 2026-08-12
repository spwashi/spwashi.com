import {
  classifyWrapVolatility,
  ensurePretextEngine,
  formatMeasurementSummary,
  measureTextLayout,
  publishMeasurement,
  readPretextSignals,
} from '/public/js/semantic/pretext-measurement-bus.js';

const LINE_HEIGHT = 26;
const PADDING = 40;

let initialized = false;
let cleanupCurrent = null;

const getFramePrimaryText = (frame) => {
    const h1 = frame.querySelector('h1');
    if (h1) return h1.textContent.trim();

    const h2 = frame.querySelector('h2');
    if (h2) return h2.textContent.trim();

    const p = frame.querySelector('p:not(.frame-note):not(.inline-note)');
    if (p?.textContent.trim().length > 20) return p.textContent.trim();

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

const measureFrame = async (frame, handleCache) => {
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

    const frameWidth = frame.getBoundingClientRect().width;
    const width = Math.max(40, frameWidth - PADDING);

    let entry = handleCache.get(frame);
    if (!entry || entry.text !== text) {
        try {
            const layout = await measureTextLayout({ text, width, lineHeightPx: LINE_HEIGHT });
            entry = { text, layout };
            handleCache.set(frame, entry);
        } catch {
            return null;
        }
    }

    const { layout } = entry;
    const wrap = layout.wrap || classifyWrapVolatility(layout.lineCount, layout.lineCount);

    return {
        lineCount: layout.lineCount,
        height: layout.height,
        width: layout.width,
        wrap,
        measure: 'standard',
        source: 'frame-metrics',
    };
};

const updateAll = async (tracked, handleCache) => {
    await Promise.all(tracked.map(async ({ frame, bar, items }) => {
        const metrics = await measureFrame(frame, handleCache);
        if (!metrics) return;

        items.textContent = formatMeasurementSummary({
            lineCount: metrics.lineCount,
            heightPx: metrics.height,
            widthPx: metrics.width,
            wrap: metrics.wrap,
            measure: metrics.measure,
        });

        frame.dataset.spwFrameLineCount = String(metrics.lineCount);
        frame.dataset.spwFrameTextHeight = String(Math.round(metrics.height || 0));
        frame.dataset.spwFrameMeasureWidth = String(Math.round(metrics.width || 0));
        frame.dataset.spwFrameWrap = metrics.wrap || '';
        frame.dataset.spwMeasureKind = 'objective';
        frame.dataset.spwMeasureSource = metrics.source || 'frame-metrics';

        publishMeasurement({
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

    const frames = Array.from(root.querySelectorAll('.site-frame'));
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

    const tracked = frames.map((frame) => {
        const existing = frame.querySelector(':scope > .frame-metrics-bar');
        if (existing) existing.remove();

        const { bar, items } = createMetricsBar();
        frame.appendChild(bar);
        return { frame, bar, items };
    });

    let rafId = 0;
    const scheduleUpdate = () => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
            rafId = 0;
            updateAll(tracked, handleCache);
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
        tracked.forEach(({ bar }) => bar.remove());

        cleanupCurrent = null;
        initialized = false;
    };

    return cleanupCurrent;
}