const SAMPLE_TEXTS = {
    hook: `A component is a small machine for arranging attention.`,
    bubble: `Can we know this bubble's height before it lands?`,
    mixed: `AGI 春天到了. بدأت الرحلة — one handle, any width.`,
    expr: `copy[hook]{wrap.align}`,
};

import { loadPretext } from '/public/js/semantic/pretext-utils.js';
import { scanSpwExpression } from '/public/js/semantic/spw-expression-geometry.js';
import {
  classifyWrapVolatility,
  publishMeasurement,
  writePretextMeasurementDataset,
} from '/public/js/semantic/pretext-measurement-bus.js';

const DEMO_FONT = '16px system-ui';
const SANDBOX_MIN_WIDTH = 100;
let initialized = false;

const readCssNumber = (name, fallback) => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const value = Number.parseFloat(raw);
    return Number.isFinite(value) ? value : fallback;
};

const initPretextLab = async () => {
    if (initialized) return;

    const input = document.querySelector('#pretext-input');
    if (!input) return;
    initialized = true;

    const widthInput = document.querySelector('#pretext-width');
    const lineHeightInput = document.querySelector('#pretext-line-height');
    const preWrapInput = document.querySelector('#pretext-prewrap');
    const status = document.querySelector('#pretext-status');
    const widthOutput = document.querySelector('#pretext-width-output');
    const lineHeightOutput = document.querySelector('#pretext-line-height-output');
    const characterCount = document.querySelector('#pretext-character-count');
    const handleState = document.querySelector('#pretext-handle-state');
    const modeState = document.querySelector('#pretext-mode-state');
    const widestWidth = document.querySelector('#pretext-widest-width');
    const wrapState = document.querySelector('#pretext-wrap-state');
    const liveHost = document.querySelector('[data-spw-pretext-live="true"]');
    const presetButtons = Array.from(document.querySelectorAll('[data-pretext-sample]'));

    const targets = {
        phone: {
            meta: document.querySelector('#pretext-phone-meta'),
            preview: document.querySelector('#pretext-phone-lines')
        },
        tablet: {
            meta: document.querySelector('#pretext-tablet-meta'),
            preview: document.querySelector('#pretext-tablet-lines')
        },
        poster: {
            meta: document.querySelector('#pretext-poster-meta'),
            preview: document.querySelector('#pretext-poster-lines')
        }
    };

    const sandboxContainer = document.querySelector('#pretext-sandbox-container');
    const sandboxLines = document.querySelector('#pretext-sandbox-lines');
    const sandboxHandle = document.querySelector('#pretext-sandbox-handle');
    const inspectOverlay = document.querySelector('#pretext-inspect-overlay');
    const inspectBody = document.querySelector('#pretext-inspect-body');
    const inspectClose = document.querySelector('#pretext-inspect-close');


    const setStatus = (message, isError = false) => {
        status.textContent = message;
        status.classList.toggle('pretext-status-error', isError);
    };

    const inspectLine = (line) => {
        if (!inspectOverlay || !inspectBody) return;
        inspectBody.replaceChildren();

        const segments = line.segments || [];
        if (!segments.length) {
            const empty = document.createElement('p');
            empty.textContent = 'No visual segments array present on line object.';
            empty.className = 'frame-note';
            inspectBody.append(empty);
        } else {
            segments.forEach((seg, i) => {
                const div = document.createElement('div');
                div.className = 'inspect-segment';

                const meta = document.createElement('span');
                meta.className = 'inspect-segment-meta';
                meta.textContent = `[${i}] ${Math.round(seg.width)}px`;

                const text = document.createElement('code');
                text.className = 'inspect-segment-text';
                text.textContent = seg.text || ' ';

                div.append(meta, text);
                inspectBody.append(div);
            });
        }
        inspectOverlay.hidden = false;
    };

    const decorateLineText = (el, raw) => {
        const geometry = scanSpwExpression(raw);
        const hasSpw = (geometry.operators?.length || 0) + (geometry.forms?.length || 0) > 0;
        if (!hasSpw) {
            el.textContent = raw || ' ';
            return;
        }
        el.replaceChildren();
        for (const token of geometry.tokens || []) {
            const span = document.createElement('span');
            span.className = 'pretext-expr-token';
            span.dataset.spwExprToken = token.type || 'text';
            if (token.operator) span.dataset.spwOperator = token.operator;
            if (token.form) span.dataset.spwForm = token.form;
            span.textContent = token.value;
            el.append(span);
        }
    };

    const renderLines = (container, lines, isInteractive = false) => {
        if (!container) return;
        container.replaceChildren();

        if (!lines.length) {
            const empty = document.createElement('p');
            empty.className = 'frame-note';
            empty.textContent = 'No lines returned.';
            container.append(empty);
            return;
        }

        lines.forEach((line, index) => {
            const row = document.createElement('div');
            row.className = 'pretext-line';

            if (isInteractive) {
                row.style.cursor = 'pointer';
                row.addEventListener('click', () => inspectLine(line));
                row.title = 'Click to inspect segments';
            }

            const label = document.createElement('span');
            label.className = 'pretext-line-index';
            label.textContent = String(index + 1).padStart(2, '0');

            const text = document.createElement('code');
            text.className = 'pretext-line-text';
            decorateLineText(text, line.text || ' ');

            const width = document.createElement('span');
            width.className = 'pretext-line-width';
            width.textContent = `${Math.round(line.width)}px`;

            row.append(label, text, width);
            container.append(row);
        });
    };

    const surfaceWidths = (baseWidth) => {
        const widthFloor = readCssNumber('--pretext-width-floor', 160);
        const phoneScale = readCssNumber('--pretext-phone-scale', 0.72);
        const tabletScale = readCssNumber('--pretext-tablet-scale', 1);
        const posterScale = readCssNumber('--pretext-poster-scale', 1.38);

        return {
            phone: Math.max(widthFloor, Math.round(baseWidth * phoneScale)),
            tablet: Math.max(widthFloor, Math.round(baseWidth * tabletScale)),
            poster: Math.max(widthFloor, Math.round(baseWidth * posterScale))
        };
    };

    const syncOutputs = () => {
        widthOutput.textContent = `${widthInput.value}px`;
        lineHeightOutput.textContent = `${lineHeightInput.value}px`;
        characterCount.textContent = String(input.value.length);
        modeState.textContent = preWrapInput.checked ? 'pre-wrap' : 'normal';
    };

    let pretext;
    let prepared;
    let lastKey = '';

    const setSandboxWidth = (nextWidth, rerender = true) => {
        if (!sandboxContainer || !sandboxLines) return;

        const rect = sandboxContainer.getBoundingClientRect();
        const maxWidth = Math.max(SANDBOX_MIN_WIDTH, Math.round(rect.width || sandboxLines.getBoundingClientRect().width || SANDBOX_MIN_WIDTH));
        const width = Math.max(SANDBOX_MIN_WIDTH, Math.min(maxWidth, Math.round(nextWidth)));

        sandboxLines.style.width = `${width}px`;

        if (sandboxHandle) {
            sandboxHandle.setAttribute('aria-valuemin', String(SANDBOX_MIN_WIDTH));
            sandboxHandle.setAttribute('aria-valuemax', String(maxWidth));
            sandboxHandle.setAttribute('aria-valuenow', String(width));
            sandboxHandle.setAttribute('aria-valuetext', `${width} pixels`);
        }

        if (!rerender || !prepared || !pretext) return;

        const lineHeight = Number(lineHeightInput.value);
        const result = pretext.layoutWithLines(prepared, width, lineHeight);
        renderLines(sandboxLines, result.lines, true);
    };

    const prepareHandle = () => {
        const nextKey = JSON.stringify({
            text: input.value,
            whiteSpace: preWrapInput.checked ? 'pre-wrap' : 'normal'
        });

        if (nextKey === lastKey && prepared) return;

        prepared = pretext.prepareWithSegments(input.value, DEMO_FONT, {
            whiteSpace: preWrapInput.checked ? 'pre-wrap' : 'normal'
        });

        lastKey = nextKey;
        handleState.textContent = 'prepared';
    };

    const update = () => {
        if (!pretext) return;

        syncOutputs();

        try {
            prepareHandle();

            const baseWidth = Number(widthInput.value);
            const lineHeight = Number(lineHeightInput.value);
            const widths = surfaceWidths(baseWidth);
            let maxWidth = 0;
            const lineCounts = {};

            Object.entries(widths).forEach(([name, width]) => {
                const result = pretext.layoutWithLines(prepared, width, lineHeight);
                const { meta, preview } = targets[name];
                const longest = result.lines.reduce((current, line) => Math.max(current, line.width), 0);
                maxWidth = Math.max(maxWidth, longest);
                lineCounts[name] = result.lineCount ?? result.lines.length ?? 0;

                if (meta) {
                    meta.textContent = `${width}px wide · ${lineCounts[name]} lines · ${result.height}px tall`;
                }

                renderLines(preview, result.lines);
            });

            const wrap = classifyWrapVolatility(lineCounts.poster || 0, lineCounts.phone || 0);
            if (wrapState) wrapState.textContent = wrap;
            if (sandboxLines) {
                sandboxLines.dataset.textWrap = wrap;
                const sandboxWidth = sandboxLines.getBoundingClientRect().width || baseWidth;
                setSandboxWidth(sandboxWidth, false);
                const sandboxResult = pretext.layoutWithLines(prepared, sandboxWidth, lineHeight);
                renderLines(sandboxLines, sandboxResult.lines, true);
            }
            const probe = scanSpwExpression(input.value);
            const expression = (probe.operators?.length || probe.forms?.length)
                ? String(input.value).trim()
                : '';
            if (liveHost instanceof HTMLElement) {
                writePretextMeasurementDataset(liveHost, {
                    wrap,
                    lineCount: lineCounts.phone,
                    projectedLineCount: lineCounts.poster,
                    measure: 'standard',
                    source: 'pretext-lab',
                });
                if (expression) liveHost.dataset.spwSemanticExpression = expression;
            }
            publishMeasurement({
                host: liveHost || sandboxLines,
                wrap,
                lineCount: lineCounts.phone,
                projectedLineCount: lineCounts.poster,
                widthPx: widths.phone,
                compareWidth: widths.poster,
                expression,
                source: 'pretext-lab',
            });

            widestWidth.textContent = `${Math.round(maxWidth)}px`;
            setStatus(`Prepared once. Wrap is ${wrap} from phone ${lineCounts.phone}L vs poster ${lineCounts.poster}L.`);
        } catch (error) {
            handleState.textContent = 'error';
            const message = error instanceof Error ? error.message : 'Unknown Pretext.js error';
            setStatus(`Pretext.js could not lay out this probe: ${message}`, true);
        }
    };

    presetButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const key = button.getAttribute('data-pretext-sample');
            if (!key || !(key in SAMPLE_TEXTS)) return;
            input.value = SAMPLE_TEXTS[key];
            lastKey = '';
            update();
        });
    });

    input.addEventListener('input', () => {
        lastKey = '';
        update();
    });

    widthInput.addEventListener('input', update);
    lineHeightInput.addEventListener('input', update);
    preWrapInput.addEventListener('change', () => {
        lastKey = '';
        update();
    });

    if (inspectClose) {
        inspectClose.addEventListener('click', () => {
            inspectOverlay.hidden = true;
        });
    }

    let isDragging = false;
    if (sandboxHandle && sandboxContainer && sandboxLines) {
        sandboxHandle.addEventListener('mousedown', (e) => {
            isDragging = true;
            document.body.style.cursor = 'ew-resize';
            e.preventDefault();
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const rect = sandboxContainer.getBoundingClientRect();
            const newWidth = e.clientX - rect.left;
            setSandboxWidth(newWidth);
        });

        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                document.body.style.cursor = '';
            }
        });

        sandboxHandle.addEventListener('keydown', (event) => {
            const currentWidth = sandboxLines.getBoundingClientRect().width || Number(sandboxHandle.getAttribute('aria-valuenow')) || SANDBOX_MIN_WIDTH;
            const step = event.shiftKey ? 48 : 16;

            let nextWidth = currentWidth;

            switch (event.key) {
            case 'ArrowLeft':
            case 'ArrowDown':
                nextWidth = currentWidth - step;
                break;
            case 'ArrowRight':
            case 'ArrowUp':
                nextWidth = currentWidth + step;
                break;
            case 'Home':
                nextWidth = SANDBOX_MIN_WIDTH;
                break;
            case 'End': {
                const rect = sandboxContainer.getBoundingClientRect();
                nextWidth = rect.width || currentWidth;
                break;
            }
            default:
                return;
            }

            event.preventDefault();
            setSandboxWidth(nextWidth);
        });
    }

    try {
        if (document.fonts?.ready) {
            await document.fonts.ready;
        }

        pretext = await loadPretext();
        handleState.textContent = 'ready';
        update();
    } catch (error) {
        handleState.textContent = 'offline';
        const message = error instanceof Error ? error.message : 'Unknown import error';
        setStatus(`Pretext.js did not load from the CDN bridge: ${message}`, true);
    }
};

const unmountPretextLab = () => {
    initialized = false;
};

export { initPretextLab, unmountPretextLab as unmount };
