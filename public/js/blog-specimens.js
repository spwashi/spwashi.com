const byId = (id) => document.getElementById(id);

const AUDIO_FADE_SECONDS = 0.05;
const AUDIO_STOP_DELAY_MS = 200;
const AUDIO_GAIN = 0.18;

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
        { fill: 'hsl(192, 62%, 44%)', glow: 'rgba(24, 123, 135, 0.42)' },
        { fill: 'hsl(344, 58%, 44%)', glow: 'rgba(160, 42, 77, 0.36)' }
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
            const gradient = context.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.r * 2.5);
            gradient.addColorStop(0, color.glow);
            gradient.addColorStop(1, 'transparent');

            context.fillStyle = gradient;
            context.beginPath();
            context.arc(node.x, node.y, node.r * 2.5, 0, Math.PI * 2);
            context.fill();

            context.fillStyle = color.fill;
            context.beginPath();
            context.arc(node.x, node.y, node.r, 0, Math.PI * 2);
            context.fill();
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

export const initBlogSpecimens = () => {
    initAtelierTheme();
    initCssVarsDemo();
    initIntersectionObserverDemo();
    initAudioDemo();
    initCanvasWeaveDemo();
    initSvgFilterDemo();
};

initBlogSpecimens();
