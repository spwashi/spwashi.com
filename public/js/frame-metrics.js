import { loadPretext } from '/public/js/pretext-utils.js';

const METRICS_FONT = '16px JetBrains Mono, monospace';
const LINE_HEIGHT = 26;
const PADDING = 40;
let initialized = false;

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

    const label = document.createElement('span');
    label.className = 'frame-metrics-label';
    label.textContent = '>pretext';

    const items = document.createElement('span');
    items.className = 'frame-metrics-items';
    items.textContent = '…';

    bar.append(label, items);
    return { bar, items };
};

const measureFrame = (frame, pretext, handleCache) => {
    const text = getFramePrimaryText(frame);
    if (!text) return null;

    const frameWidth = frame.getBoundingClientRect().width;
    const width = Math.max(40, frameWidth - PADDING);

    let entry = handleCache.get(frame);
    if (!entry || entry.text !== text) {
        try {
            const prepared = pretext.prepare(text, METRICS_FONT);
            entry = { text, prepared };
            handleCache.set(frame, entry);
        } catch {
            return null;
        }
    }

    try {
        const result = pretext.layout(entry.prepared, width, LINE_HEIGHT);
        return { lineCount: result.lineCount, height: result.height, width };
    } catch {
        return null;
    }
};

const updateAll = (tracked, pretext, handleCache) => {
    for (const { frame, items } of tracked) {
        const m = measureFrame(frame, pretext, handleCache);
        if (m) {
            items.textContent = `${m.lineCount}L · ~${Math.round(m.height)}px · @${Math.round(m.width)}px`;
        }
    }
};

const initFrameMetrics = async () => {
    if (initialized) return;

    const frames = Array.from(document.querySelectorAll('.site-frame'));
    if (!frames.length) return;
    initialized = true;

    let pretext;
    try {
        if (document.fonts?.ready) await document.fonts.ready;
        pretext = await loadPretext();
    } catch {
        return;
    }

    const handleCache = new Map();

    const tracked = frames.map((frame) => {
        const { bar, items } = createMetricsBar();
        frame.appendChild(bar);
        return { frame, items };
    });

    let rafId;
    const scheduleUpdate = () => {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => updateAll(tracked, pretext, handleCache));
    };

    const observer = new ResizeObserver(scheduleUpdate);
    frames.forEach((frame) => observer.observe(frame));

    scheduleUpdate();
};

export { initFrameMetrics };
