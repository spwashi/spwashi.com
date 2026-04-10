const byId = (id) => document.getElementById(id);

const AUDIO_FADE_SECONDS = 0.05;
const AUDIO_STOP_DELAY_MS = 200;
const AUDIO_GAIN = 0.18;
const CHARGE_SELECTOR = '[data-spw-charge-key]';

const isNativeInteractive = (element) => (
    element.matches('a[href], button, input, select, textarea, summary')
    || Boolean(element.closest('a[href], button'))
);

const initAtelierTheme = () => {
    const buttons = [...document.querySelectorAll('[data-theme-set]')];
    if (!buttons.length) return;

    const setTheme = (theme) => {
        document.body.dataset.theme = theme;
        buttons.forEach((button) => {
            button.setAttribute('aria-pressed', String(button.dataset.themeSet === theme));
        });
    };

    buttons.forEach((button) => {
        button.addEventListener('click', () => setTheme(button.dataset.themeSet));
    });

    setTheme(document.body.dataset.theme || 'atelier-light');
};

const initCssVarsDemo = () => {
    const preview = byId('css-color-preview');
    const codeOut = byId('css-code-out');
    const hue = byId('sl-hue');
    const saturation = byId('sl-sat');
    const lightness = byId('sl-light');
    const hueOut = byId('sl-hue-out');
    const saturationOut = byId('sl-sat-out');
    const lightnessOut = byId('sl-light-out');
    if (!preview || !codeOut || !hue || !saturation || !lightness || !hueOut || !saturationOut || !lightnessOut) return;

    const update = () => {
        const color = `hsl(${hue.value} ${saturation.value}% ${lightness.value}%)`;
        preview.style.setProperty('--demo-color', color);
        codeOut.textContent = `--color: ${color};`;
        hueOut.value = hue.value;
        saturationOut.value = `${saturation.value}%`;
        lightnessOut.value = `${lightness.value}%`;
    };

    [hue, saturation, lightness].forEach((slider) => {
        slider.addEventListener('input', update);
    });
    update();
};

const initIntersectionObserverDemo = () => {
    const target = byId('io-target');
    const status = byId('io-status');
    const scrollArea = byId('io-scroll-area');
    if (!target || !status || !scrollArea) return;

    if (!('IntersectionObserver' in window)) {
        status.textContent = 'Intersection Observer is unavailable in this browser.';
        return;
    }

    const thresholds = Array.from({ length: 11 }, (_, index) => index / 10);
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const ratio = Math.round(entry.intersectionRatio * 100);
            status.textContent = entry.isIntersecting
                ? `threshold: crossed - ${ratio}% visible`
                : `threshold: not crossed - ${ratio}% visible`;
            target.style.setProperty('--io-ratio', entry.intersectionRatio.toFixed(2));
        });
    }, { root: scrollArea, threshold: thresholds });

    observer.observe(target);
};

const waveformY = (type, t) => {
    if (type === 'triangle') return (2 / Math.PI) * Math.asin(Math.sin(t));
    if (type === 'sawtooth') return (t % (2 * Math.PI)) / Math.PI - 1;
    if (type === 'square') return Math.sign(Math.sin(t));
    return Math.sin(t);
};

const initAudioDemo = () => {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    const toggle = byId('audio-toggle');
    const frequency = byId('audio-freq');
    const frequencyOut = byId('audio-freq-out');
    const wave = byId('audio-wave');
    const wavePath = byId('audio-wave-path');
    if (!toggle || !frequency || !frequencyOut || !wave || !wavePath) return;

    let audioContext = null;
    let oscillator = null;
    let gainNode = null;

    const drawWave = () => {
        const points = [];
        const cycles = Math.max(1, Math.min(6, Number(frequency.value) / 80));

        for (let index = 0; index <= 300; index += 1) {
            const t = (index / 300) * cycles * 2 * Math.PI;
            const y = waveformY(wave.value, t);
            points.push(`${index === 0 ? 'M' : 'L'}${index},${30 - y * 22}`);
        }

        wavePath.setAttribute('d', points.join(' '));
    };

    const setActive = (active) => {
        toggle.setAttribute('aria-pressed', String(active));
        toggle.textContent = active ? '! stop' : '~ emit tone';
    };

    const stopTone = () => {
        if (!audioContext || !oscillator || !gainNode) return;
        gainNode.gain.setTargetAtTime(0, audioContext.currentTime, AUDIO_FADE_SECONDS);
        const stopped = oscillator;
        window.setTimeout(() => {
            stopped.stop();
        }, AUDIO_STOP_DELAY_MS);
        oscillator = null;
        gainNode = null;
        setActive(false);
    };

    const startTone = () => {
        if (!AudioCtor) {
            toggle.textContent = 'audio unavailable';
            return;
        }

        audioContext = audioContext || new AudioCtor();
        oscillator = audioContext.createOscillator();
        gainNode = audioContext.createGain();
        oscillator.type = wave.value;
        oscillator.frequency.value = Number(frequency.value);
        gainNode.gain.value = AUDIO_GAIN;
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start();
        setActive(true);
    };

    frequency.addEventListener('input', () => {
        frequencyOut.value = `${frequency.value} Hz`;
        drawWave();
        if (oscillator && audioContext) {
            oscillator.frequency.setTargetAtTime(Number(frequency.value), audioContext.currentTime, 0.01);
        }
    });

    wave.addEventListener('change', () => {
        drawWave();
        if (oscillator) oscillator.type = wave.value;
    });

    toggle.addEventListener('click', () => {
        if (toggle.getAttribute('aria-pressed') === 'true') {
            stopTone();
        } else {
            startTone();
        }
    });

    drawWave();
};

const initCanvasWeaveDemo = () => {
    const canvas = byId('weave-canvas');
    const clear = byId('canvas-clear');
    if (!canvas || !clear) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const nodes = [];
    const nodeColors = [
        { fill: 'hsl(192, 62%, 36%)', wash: 'rgba(24, 123, 135, 0.12)' },
        { fill: 'hsl(344, 58%, 36%)', wash: 'rgba(160, 42, 77, 0.10)' }
    ];

    const drawBase = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.strokeStyle = 'rgba(120, 180, 180, 0.18)';
        context.lineWidth = 0.7;

        for (let x = 20; x < canvas.width; x += 20) {
            context.beginPath();
            context.moveTo(x, 0);
            context.lineTo(x, canvas.height);
            context.stroke();
        }

        for (let y = 20; y < canvas.height; y += 20) {
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(canvas.width, y);
            context.stroke();
        }
    };

    const drawNodes = () => {
        nodes.forEach((node, index) => {
            const color = nodeColors[index % nodeColors.length];
            context.fillStyle = color.wash;
            context.beginPath();
            context.arc(node.x, node.y, node.r * 1.85, 0, Math.PI * 2);
            context.fill();

            context.fillStyle = color.fill;
            context.strokeStyle = color.fill;
            context.lineWidth = 1;
            context.beginPath();
            context.arc(node.x, node.y, node.r, 0, Math.PI * 2);
            context.fill();
            context.stroke();
        });
    };

    const render = () => {
        drawBase();
        drawNodes();
    };

    const addNode = (x, y) => {
        nodes.push({ x, y, r: 4 + Math.random() * 4 });
        render();
    };

    canvas.addEventListener('click', (event) => {
        const rect = canvas.getBoundingClientRect();
        addNode(
            (event.clientX - rect.left) * (canvas.width / rect.width),
            (event.clientY - rect.top) * (canvas.height / rect.height)
        );
    });

    canvas.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        addNode(canvas.width / 2, canvas.height / 2);
    });

    clear.addEventListener('click', () => {
        nodes.length = 0;
        render();
    });

    render();
};

const initSvgFilterDemo = () => {
    const frequency = byId('turb-freq');
    const scale = byId('displace-scale');
    const codeOut = byId('filter-code-out');
    const turbulence = byId('demo-turbulence');
    const displace = byId('demo-displace');
    const frequencyOut = byId('turb-freq-out');
    const scaleOut = byId('displace-scale-out');
    if (!frequency || !scale || !codeOut || !turbulence || !displace || !frequencyOut || !scaleOut) return;

    const update = () => {
        turbulence.setAttribute('baseFrequency', frequency.value);
        displace.setAttribute('scale', scale.value);
        frequencyOut.value = frequency.value;
        scaleOut.value = scale.value;
        codeOut.textContent = `<feTurbulence baseFrequency="${frequency.value}"/>\n<feDisplacementMap scale="${scale.value}"/>`;
    };

    frequency.addEventListener('input', update);
    scale.addEventListener('input', update);
    update();
};

const initBraceCharge = () => {
    let chargeNodes = [];
    if (!document.querySelector(CHARGE_SELECTOR)) return;

    const status = document.createElement('div');
    status.className = 'blog-charge-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    document.body.appendChild(status);

    let pinned = null;

    const getLabel = (element) => (
        element.dataset.spwChargeLabel
        || element.textContent.trim().replace(/\s+/g, ' ')
        || element.dataset.spwChargeKey
    );

    const refreshChargeNodes = () => {
        chargeNodes = [...document.querySelectorAll(CHARGE_SELECTOR)];
    };

    const clearCharge = (announce = true) => {
        refreshChargeNodes();
        pinned = null;
        delete document.body.dataset.spwChargeKey;
        delete document.body.dataset.spwChargeMode;
        chargeNodes.forEach((node) => {
            node.dataset.spwChargeState = 'ambient';
            node.classList.remove('is-resonant', 'is-charge-source');
            node.closest('.site-frame')?.classList.remove('has-active-charge');
            if (node.getAttribute('role') === 'button') {
                node.setAttribute('aria-pressed', 'false');
            }
        });
        if (announce) status.textContent = 'Attention charge cleared.';
    };

    const applyCharge = (key, mode, source = null, announce = false) => {
        refreshChargeNodes();
        document.body.dataset.spwChargeKey = key;
        document.body.dataset.spwChargeMode = mode;
        const label = source ? getLabel(source) : key;
        let count = 0;

        chargeNodes.forEach((node) => {
            const matches = node.dataset.spwChargeKey === key;
            const isSource = Boolean(source && node === source);

            node.dataset.spwChargeState = matches ? (isSource ? mode : 'resonant') : 'ambient';
            node.classList.toggle('is-resonant', matches);
            node.classList.toggle('is-charge-source', isSource);

            if (matches) count += 1;

            if (node.getAttribute('role') === 'button') {
                node.setAttribute('aria-pressed', String(isSource && mode === 'pinned'));
            }
        });

        document.querySelectorAll('.site-frame.has-active-charge').forEach((frame) => {
            frame.classList.remove('has-active-charge');
        });
        chargeNodes
            .filter((node) => node.dataset.spwChargeKey === key)
            .forEach((node) => node.closest('.site-frame')?.classList.add('has-active-charge'));

        if (announce) {
            status.textContent = `${mode === 'pinned' ? 'Pinned' : 'Previewing'} ${label}; ${count} related phrase${count === 1 ? '' : 's'} highlighted.`;
        }
    };

    const hydrateChargeNodes = () => {
        refreshChargeNodes();
        chargeNodes.forEach((node) => {
            if (node.dataset.spwChargeReady === 'true') return;
            node.dataset.spwChargeReady = 'true';
            node.dataset.spwChargeState = 'ambient';

            if (!isNativeInteractive(node)) {
                node.tabIndex = 0;
                node.setAttribute('role', 'button');
                node.setAttribute('aria-pressed', 'false');
                if (!node.hasAttribute('aria-label')) {
                    node.setAttribute('aria-label', `Charge related phrase: ${getLabel(node)}`);
                }
            }

            node.addEventListener('pointerenter', () => {
                if (!pinned) applyCharge(node.dataset.spwChargeKey, 'preview', node);
            });
            node.addEventListener('pointerleave', () => {
                if (!pinned && document.activeElement !== node) clearCharge(false);
            });
            node.addEventListener('focus', () => {
                if (!pinned) applyCharge(node.dataset.spwChargeKey, 'preview', node, true);
            });
            node.addEventListener('blur', () => {
                if (!pinned) clearCharge(false);
            });

            if (!isNativeInteractive(node)) {
                node.addEventListener('click', () => {
                    if (pinned === node.dataset.spwChargeKey) {
                        clearCharge();
                        return;
                    }

                    pinned = node.dataset.spwChargeKey;
                    applyCharge(pinned, 'pinned', node, true);
                });
                node.addEventListener('keydown', (event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    node.click();
                });
            }
        });
    };

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && pinned) clearCharge();
    });

    hydrateChargeNodes();
    new MutationObserver(hydrateChargeNodes).observe(document.body, {
        childList: true,
        subtree: true
    });
};

const SWIPE_THRESHOLD_PX = 44;

/* ── Operator reductions ── minimal Spw notation for each operator */
const OPERATOR_REDUCTIONS = {
    '#': '#>scope { .. }',
    '_': '?_name   {_A }_A',
    ':': '#:layer',
    '=': '=[bias] ~ 0',
    '$': '$[material]',
    '@': '@node',
    '?': '?[threshold]',
    '!': '![act]',
    '~': '~[wave]',
    '*': '*[a..b]',
    '^': '^"label"{ .. }',
    '%': '%[ratio]',
    '+': '+[form]',
    '|': '|[blog]',
};

/* ── Parallel operators ── structural counterparts */
const OPERATOR_PARALLELS = {
    '#': '|', '|': '#',     // frame ↔ surface
    '=': '$', '$': '=',     // baseline ↔ substrate
    '?': '!', '!': '?',     // probe ↔ action
    '~': '*', '*': '~',     // stream ↔ merge
    '@': '^', '^': '@',     // ref ↔ binding
    '%': '+', '+': '%',     // reduce ↔ normalize
    ':': '_', '_': ':',     // layer ↔ label
};

const initCardSwipe = () => {
    const grid = document.querySelector('.operator-snippet-grid');
    if (!grid) return;

    let activePanel = null;
    let activeCard = null;

    const closePanel = () => {
        activePanel?.remove();
        activeCard?.removeAttribute('data-panel-open');
        activePanel = null;
        activeCard = null;
    };

    const openPanel = (card) => {
        if (activeCard === card) { closePanel(); return; }
        closePanel();

        const sigilEl = card.querySelector('.operator-snippet-sigil');
        const exampleEl = card.querySelector('.operator-snippet-example');
        const sigil = sigilEl?.textContent.trim();
        if (!sigil) return;

        card.setAttribute('data-panel-open', '');
        activeCard = card;

        const panel = document.createElement('div');
        panel.className = 'operator-card-panel';
        panel.setAttribute('role', 'group');
        panel.setAttribute('aria-label', `${sigil} options`);
        activePanel = panel;

        // Reduction display
        const red = document.createElement('code');
        red.className = 'operator-card-panel-reduction';
        red.textContent = OPERATOR_REDUCTIONS[sigil] || sigil;
        panel.appendChild(red);

        const actions = document.createElement('div');
        actions.className = 'operator-card-panel-actions';

        // Copy example
        if (exampleEl && navigator.clipboard) {
            const copyBtn = document.createElement('button');
            copyBtn.type = 'button';
            copyBtn.className = 'operator-card-panel-btn';
            copyBtn.textContent = '! copy';
            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const text = exampleEl.textContent.replace(/\s+/g, ' ').trim();
                navigator.clipboard.writeText(text).then(() => {
                    copyBtn.textContent = '~ copied';
                    window.setTimeout(() => { copyBtn.textContent = '! copy'; }, 1200);
                });
            });
            actions.appendChild(copyBtn);
        }

        // Pivot to parallel operator
        const parallelSigil = OPERATOR_PARALLELS[sigil];
        if (parallelSigil) {
            const parallelCard = [...grid.querySelectorAll('.operator-snippet')].find((c) =>
                c.querySelector('.operator-snippet-sigil')?.textContent.trim() === parallelSigil
            );
            if (parallelCard) {
                const pivotBtn = document.createElement('button');
                pivotBtn.type = 'button';
                pivotBtn.className = 'operator-card-panel-btn operator-card-panel-parallel';
                pivotBtn.textContent = `~ ${parallelSigil}`;
                pivotBtn.title = `Pivot to parallel: ${parallelSigil}`;
                pivotBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    closePanel();
                    parallelCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    window.setTimeout(() => openPanel(parallelCard), 120);
                });
                actions.appendChild(pivotBtn);
            }
        }

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'operator-card-panel-btn operator-card-panel-close';
        closeBtn.textContent = '×';
        closeBtn.setAttribute('aria-label', 'Close panel');
        closeBtn.addEventListener('click', (e) => { e.stopPropagation(); closePanel(); });
        actions.appendChild(closeBtn);

        panel.appendChild(actions);
        card.appendChild(panel);
        actions.querySelector('button')?.focus();
    };

    // Inject ⋯ toggle buttons
    grid.querySelectorAll('.operator-snippet').forEach((card) => {
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'operator-card-toggle';
        toggle.setAttribute('aria-label', 'Open operator options');
        toggle.textContent = '⋯';
        toggle.addEventListener('click', (e) => { e.stopPropagation(); openPanel(card); });
        card.appendChild(toggle);
    });

    // Touch swipe
    let swipeStartX = 0;
    let swipeStartY = 0;
    let swipeCard = null;

    grid.addEventListener('touchstart', (e) => {
        swipeCard = e.target.closest('.operator-snippet');
        if (!swipeCard) return;
        swipeStartX = e.touches[0].clientX;
        swipeStartY = e.touches[0].clientY;
    }, { passive: true });

    grid.addEventListener('touchend', (e) => {
        if (!swipeCard) return;
        const dx = e.changedTouches[0].clientX - swipeStartX;
        const dy = e.changedTouches[0].clientY - swipeStartY;
        if (Math.abs(dx) >= SWIPE_THRESHOLD_PX && Math.abs(dy) < Math.abs(dx)) {
            openPanel(swipeCard);
        }
        swipeCard = null;
    }, { passive: true });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!activePanel) return;
        if (!e.target.closest('.operator-snippet[data-panel-open]')) closePanel();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && activePanel) closePanel();
    });
};

export const initBlogSpecimens = () => {
    initAtelierTheme();
    initBraceCharge();
    initCardSwipe();
    initCssVarsDemo();
    initIntersectionObserverDemo();
    initAudioDemo();
    initCanvasWeaveDemo();
    initSvgFilterDemo();
};

initBlogSpecimens();
