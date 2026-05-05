const SAMPLE_TEXTS = {
    mixed: `AGI 春天到了. بدأت الرحلة — layout without reflow.

Files can stay legible while surfaces become more deliberate.
Tabs, hard breaks, and mixed scripts should still feel native.`,
    chat: `Hey — can we predict this bubble height before the stream lands?

Yes. Prepare once, then re-layout it at any width without DOM reflow.`,
    notes: `# Local-first note

The file remains readable.
The surface becomes measurable.
The layout learns to breathe.`
};

import { loadPretext } from '/public/js/semantic/pretext-utils.js';

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
            text.textContent = line.text || ' ';

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

            Object.entries(widths).forEach(([name, width]) => {
                const result = pretext.layoutWithLines(prepared, width, lineHeight);
                const { meta, preview } = targets[name];
                const longest = result.lines.reduce((current, line) => Math.max(current, line.width), 0);
                maxWidth = Math.max(maxWidth, longest);

                if (meta) {
                    meta.textContent = `${width}px wide · ${result.lineCount} lines · ${result.height}px tall`;
                }

                renderLines(preview, result.lines);
            });

            if (sandboxLines) {
                const sandboxWidth = sandboxLines.getBoundingClientRect().width || baseWidth;
                setSandboxWidth(sandboxWidth, false);
                const sandboxResult = pretext.layoutWithLines(prepared, sandboxWidth, lineHeight);
                renderLines(sandboxLines, sandboxResult.lines, true);
            }

            widestWidth.textContent = `${Math.round(maxWidth)}px`;
            setStatus('Prepared once. Layout recalculates instantly as widths change.');
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

export { initPretextLab };
