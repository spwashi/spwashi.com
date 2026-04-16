/** Spw Canvas Accents - shared canvas ornament for image-bearing and structural surfaces. */
import { bus } from './spw-bus.js';
import {
    getActiveRecentPathMemory,
    inferAnchorTokens,
    initRecentPathTracker,
    normalizeAccentToken,
    parseAccentList,
    parseAccentNumber,
    resolveAccentTokenColors,
    samplePaletteFromImage,
    uniqueAccentValues,
    withAlpha
} from './spw-accent-palette.js';
import { applyWonderMemoryState } from './spw-wonder-memory.js';
const INSTANCE_MAP = new WeakMap();
const activeInstances = new Set();
const PARTICLE_TYPES = new Set(['wave', 'vortex', 'crystal', 'resonance']);
let trackerCleanup = null;
let settingsCleanup = null;
function notifyRecentPathChange() {
    activeInstances.forEach((instance) => {
        try {
            instance.refreshRecentPath();
        } catch (error) {
            console.warn('[CanvasAccent] Failed to refresh recent-path bias.', error);
        }
    });
    applyWonderMemoryState();
}
function ensureSharedListeners() {
    if (!trackerCleanup) {
        trackerCleanup = initRecentPathTracker(() => {
            notifyRecentPathChange();
        });
    }
    if (settingsCleanup) return;
    settingsCleanup = bus.on('settings:changed', () => {
        notifyRecentPathChange();
    });
}
export function initSpwCanvasAccents(root = document) {
    ensureSharedListeners();
    const created = [];
    const accents = root.querySelectorAll('[data-spw-accent]');
    accents.forEach((el) => {
        if (INSTANCE_MAP.has(el)) return;
        const instance = new CanvasAccent(el);
        INSTANCE_MAP.set(el, instance);
        activeInstances.add(instance);
        created.push(instance);
    });
    applyWonderMemoryState();
    return () => {
        created.forEach((instance) => {
            instance.destroy();
            activeInstances.delete(instance);
            if (INSTANCE_MAP.get(instance.container) === instance) {
                INSTANCE_MAP.delete(instance.container);
            }
        });
    };
}
class CanvasAccent {
    constructor(container) {
        this.container = container;
        this.type = container.dataset.spwAccent || 'lattice';
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { alpha: true });
        this.pixels = window.devicePixelRatio || 1;

        this.container.classList.add('spw-accent-host');
        this.container.prepend(this.canvas);

        this.points = [];
        this.particles = [];
        this.imagePalette = [];
        this.resolvedPalette = [];
        this.manualPalette = [];
        this.anchorTokens = [];
        this.resonanceModes = [];
        this.anchorOperator = '';
        this.resonanceStrength = 0.86;
        this.mouse = { x: -1000, y: -1000 };
        this.charge = 0;
        this.burstFactor = 0;
        this.t = 0;
        this.visible = true;
        this.rafId = 0;
        this.resizeTimeout = 0;
        this.pointerBurstTimeout = 0;
        this.destroyed = false;
        this.offs = [];
        this.imageLoadHandler = null;

        this.palette = container.dataset.spwAccentPalette || 'full';
        this.count = this.readCount();

        const rootStyles = getComputedStyle(document.documentElement);
        this.colors = {
            teal: rootStyles.getPropertyValue('--teal').trim() || 'hsl(180 100% 28%)',
            amber: rootStyles.getPropertyValue('--op-object-color').trim() || 'hsl(36 80% 36%)',
            rust: rootStyles.getPropertyValue('--op-pragma-color').trim() || 'hsl(0 40% 38%)',
            violet: rootStyles.getPropertyValue('--op-probe-color').trim() || 'hsl(268 55% 42%)',
            sea: rootStyles.getPropertyValue('--op-topic-color').trim() || 'hsl(192 62% 32%)',
            blue: rootStyles.getPropertyValue('--op-ref-color').trim() || 'hsl(214 70% 38%)',
            ink: rootStyles.getPropertyValue('--ink').trim() || 'hsl(188 14% 18%)',
        };

        this.baseColor = getComputedStyle(document.body)
            .getPropertyValue('--active-op-color')
            .trim() || '#1a9999';

        this.handleResize = this.handleResize.bind(this);
        this.handlePointerMove = this.handlePointerMove.bind(this);
        this.handlePointerLeave = this.handlePointerLeave.bind(this);
        this.handlePointerDown = this.handlePointerDown.bind(this);
        this.handlePointerUp = this.handlePointerUp.bind(this);
        this.handleIntersect = this.handleIntersect.bind(this);
        this.animate = this.animate.bind(this);
        this.refreshSemanticPaletteState();
        this.setupImagePaletteSampling();
        this.resize();
        this.attach();
    }

    readCount() {
        const explicit = this.container.dataset.spwAccentCount;
        if (explicit) return parseInt(explicit, 10);
        if (this.type === 'crystal') return 120;
        if (this.type === 'wave' || this.type === 'vortex') return 80;
        if (this.type === 'resonance') return 42;
        return 20;
    }

    attach() {
        window.addEventListener('resize', this.handleResize);
        this.container.addEventListener('pointermove', this.handlePointerMove);
        this.container.addEventListener('pointerleave', this.handlePointerLeave);
        this.container.addEventListener('pointercancel', this.handlePointerLeave);
        this.container.addEventListener('pointerdown', this.handlePointerDown);
        this.container.addEventListener('pointerup', this.handlePointerUp);

        this.offs.push(
            bus.on('brace:charged', (event) => {
                if (event.target === this.container || event.detail?.element === this.container) {
                    this.charge = 0.25;
                }
            }),
            bus.on('brace:discharged', (event) => {
                if (event.target === this.container || event.detail?.element === this.container) {
                    this.charge = 0;
                }
            }),
            bus.on('spell:grounded', (event) => {
                if (event.target === this.container || event.detail?.element === this.container) {
                    this.burst();
                }
            })
        );

        this.observer = new IntersectionObserver(this.handleIntersect, { threshold: 0.1 });
        this.observer.observe(this.container);
        this.rafId = requestAnimationFrame(this.animate);
    }

    destroy() {
        if (this.destroyed) return;
        this.destroyed = true;

        window.removeEventListener('resize', this.handleResize);
        this.container.removeEventListener('pointermove', this.handlePointerMove);
        this.container.removeEventListener('pointerleave', this.handlePointerLeave);
        this.container.removeEventListener('pointercancel', this.handlePointerLeave);
        this.container.removeEventListener('pointerdown', this.handlePointerDown);
        this.container.removeEventListener('pointerup', this.handlePointerUp);

        if (this.image && this.imageLoadHandler) {
            this.image.removeEventListener('load', this.imageLoadHandler);
        }

        this.offs.forEach((off) => {
            try {
                off?.();
            } catch (error) {
                console.warn('[CanvasAccent] Failed to unsubscribe.', error);
            }
        });
        this.offs = [];

        if (this.observer) this.observer.disconnect();
        if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
        if (this.pointerBurstTimeout) clearTimeout(this.pointerBurstTimeout);
        if (this.rafId) cancelAnimationFrame(this.rafId);

        if (this.canvas.parentNode === this.container) {
            this.canvas.remove();
        }

        this.points = [];
        this.particles = [];
    }
    setupImagePaletteSampling() {
        this.image = this.container.querySelector('img');
        if (!(this.image instanceof HTMLImageElement)) return;

        this.imageLoadHandler = () => {
            if (this.destroyed) return;
            const nextPalette = samplePaletteFromImage(this.image);
            if (!nextPalette.length) return;
            this.imagePalette = nextPalette;
            this.refreshSemanticPaletteState({ reinit: true });
        };

        if (this.image.complete && this.image.naturalWidth > 0) {
            this.imageLoadHandler();
            return;
        }

        this.image.addEventListener('load', this.imageLoadHandler, { once: true });
    }

    refreshRecentPath() {
        if (this.destroyed) return;
        this.refreshSemanticPaletteState({ reinit: true });
    }

    refreshSemanticPaletteState({ reinit = false } = {}) {
        this.manualPalette = parseAccentList(this.container.dataset.spwAccentColors || '');
        this.resonanceModes = uniqueAccentValues([
            ...(this.manualPalette.length ? ['manual'] : []),
            ...parseAccentList(this.container.dataset.spwAccentResonance || 'image anchor recent')
                .map(normalizeAccentToken)
        ]);
        this.anchorTokens = inferAnchorTokens(this.container);
        this.anchorOperator = normalizeAccentToken(
            this.container.dataset.spwAccentOperator
            || this.container.dataset.spwSubstrate
            || this.container.dataset.spwOperator
            || ''
        );
        this.resonanceStrength = parseAccentNumber(this.container.dataset.spwAccentStrength, 0.86, 0.15, 1.4);
        this.resolvedPalette = this.buildResolvedPalette();
        this.baseColor = this.resolvedPalette[0] || this.baseColor;
        this.applyPaletteVars();

        if (reinit) this.initArchetype();
    }

    buildResolvedPalette() {
        const colors = [];
        const append = (entries) => {
            entries.forEach((entry) => {
                if (!entry || colors.includes(entry)) return;
                colors.push(entry);
            });
        };

        if (this.resonanceModes.includes('manual')) append(this.manualPalette);
        if (this.resonanceModes.includes('image')) append(this.imagePalette);
        if (this.resonanceModes.includes('anchor')) {
            append(resolveAccentTokenColors([...this.anchorTokens, this.anchorOperator], this.colors));
        }

        const recentPath = getActiveRecentPathMemory();
        if (this.resonanceModes.includes('recent') && recentPath) {
            append(resolveAccentTokenColors([...recentPath.tokens, recentPath.operator], this.colors));
        }

        append(this.fallbackPalette());
        return colors.slice(0, 8);
    }

    fallbackPalette() {
        const { teal, amber, rust, violet, sea } = this.colors;
        if (this.palette === 'warm') return [amber, rust, amber, 'hsl(24 65% 34%)'];
        if (this.palette === 'cool') return [teal, sea, violet, teal];
        return [teal, sea, amber, teal, rust, violet, amber, sea];
    }

    applyPaletteVars() {
        for (let index = 0; index < 4; index += 1) {
            const color = this.resolvedPalette[index];
            const name = `--spw-accent-color-${index + 1}`;
            if (color) this.container.style.setProperty(name, color);
            else this.container.style.removeProperty(name);
        }
        this.container.style.setProperty('--spw-accent-strength', this.resonanceStrength.toFixed(3));
    }

    handleIntersect(entries) {
        if (this.destroyed) return;
        const nextVisible = Boolean(entries[0]?.isIntersecting);
        if (nextVisible === this.visible) return;
        this.visible = nextVisible;
        if (this.visible && !this.rafId) {
            this.rafId = requestAnimationFrame(this.animate);
        } else if (!this.visible && this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = 0;
        }
    }

    handleResize() {
        if (this.destroyed) return;
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = window.setTimeout(() => {
            this.resizeTimeout = 0;
            if (!this.destroyed) this.resize();
        }, 100);
    }

    handlePointerMove(event) {
        if (this.destroyed) return;
        const rect = this.container.getBoundingClientRect();
        this.mouse.x = event.clientX - rect.left;
        this.mouse.y = event.clientY - rect.top;
    }

    handlePointerLeave() {
        this.mouse.x = -1000;
        this.mouse.y = -1000;
        this.charge = 0;
    }

    handlePointerDown(event) {
        this.handlePointerMove(event);
        this.charge = Math.max(this.charge, 0.18);
        this.burstFactor = Math.max(this.burstFactor, 0.24);
        clearTimeout(this.pointerBurstTimeout);
        this.pointerBurstTimeout = window.setTimeout(() => {
            if (!this.destroyed) this.burstFactor = 0;
            this.pointerBurstTimeout = 0;
        }, 220);
    }

    handlePointerUp(event) {
        this.handlePointerMove(event);
        this.charge = 0;
    }

    resize() {
        const rect = this.container.getBoundingClientRect();
        this.width = Math.max(rect.width, 1);
        this.height = Math.max(rect.height, 1);
        this.canvas.width = this.width * this.pixels;
        this.canvas.height = this.height * this.pixels;
        this.ctx.setTransform(this.pixels, 0, 0, this.pixels, 0, 0);
        this.initArchetype();
    }
    initArchetype() {
        this.points = [];
        this.particles = [];

        if (PARTICLE_TYPES.has(this.type)) {
            this.initParticleField();
            return;
        }

        for (let i = 0; i < this.count; i += 1) {
            this.points.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 1,
                color: this.resolvedPalette[i % this.resolvedPalette.length] || this.baseColor
            });
        }
    }

    initParticleField() {
        const cx = this.width / 2;
        const cy = this.height / 2;
        const paletteEntries = this.resolvedPalette.length ? this.resolvedPalette : this.fallbackPalette();

        for (let i = 0; i < this.count; i += 1) {
            const distanceFactor = this.type === 'resonance' ? 0.52 : 0.65;
            const r = Math.sqrt(i / this.count) * Math.max(this.width, this.height) * distanceFactor;
            const theta = i * 2.399963;
            this.particles.push({
                x: cx + Math.cos(theta) * r * (0.5 + Math.random() * 0.5),
                y: cy + Math.sin(theta) * r * (0.5 + Math.random() * 0.5),
                age: Math.floor(Math.random() * 80),
                maxAge: 60 + Math.floor(Math.random() * 80),
                speed: this.type === 'resonance' ? (0.28 + Math.random() * 0.44) : (0.4 + Math.random() * 0.8),
                size: this.type === 'crystal'
                    ? (0.6 + Math.random() * 1.4)
                    : this.type === 'resonance'
                        ? (5.5 + Math.random() * 8)
                        : (0.8 + Math.random()),
                spin: (Math.random() - 0.5) * 0.05,
                rotation: Math.random() * Math.PI,
                color: paletteEntries[i % paletteEntries.length],
            });
        }
    }

    flowAngle(x, y) {
        const cx = this.width / 2;
        const cy = this.height / 2;
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
        const base = Math.atan2(dy, dx);

        if (this.type === 'resonance') {
            return base + dist * 0.0042 + Math.sin(this.t * 1.6 + (dist * 0.018)) * 0.38;
        }

        const spiral = this.type === 'vortex' ? -0.006 : 0.006;
        return base + dist * spiral + this.t * (this.type === 'crystal' ? 0.18 : 0.22);
    }

    drawParticleField() {
        this.t += this.type === 'resonance' ? 0.0032 : 0.004;
        const ctx = this.ctx;

        this.particles.forEach((particle) => {
            const angle = this.flowAngle(particle.x, particle.y);
            const boost = 1 + this.charge * 1.8 + this.burstFactor;

            particle.x += Math.cos(angle) * particle.speed * boost;
            particle.y += Math.sin(angle) * particle.speed * boost;
            particle.age += 1;
            particle.rotation += particle.spin * (1 + this.charge * 2);

            const alpha = this.type === 'resonance'
                ? Math.sin((particle.age / particle.maxAge) * Math.PI) * 0.2 * (0.82 + this.charge * 0.62) * this.resonanceStrength
                : Math.sin((particle.age / particle.maxAge) * Math.PI)
                    * (this.type === 'crystal' ? 0.22 : 0.16)
                    * (0.6 + this.charge * 0.5);

            if (this.type === 'crystal') {
                const size = particle.size;
                ctx.fillStyle = withAlpha(particle.color, alpha);
                ctx.fillRect(particle.x - size * 0.5, particle.y - size * 0.5, size, size);
            } else if (this.type === 'resonance') {
                this.drawResonanceParticle(particle, alpha);
            } else {
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = withAlpha(particle.color, alpha);
                ctx.fill();
            }

            this.applyMouseRepulsion(particle);
            this.recycleParticleIfNeeded(particle);
        });
    }

    applyMouseRepulsion(particle) {
        const mdx = particle.x - this.mouse.x;
        const mdy = particle.y - this.mouse.y;
        const mdist = Math.hypot(mdx, mdy);
        const range = this.type === 'resonance' ? 150 : 120;
        if (mdist >= range || mdist <= 0) return;

        const divisor = this.type === 'resonance' ? 60 : 48;
        const force = (range - mdist) / divisor;
        particle.x += (mdx / mdist) * force;
        particle.y += (mdy / mdist) * force;
    }

    recycleParticleIfNeeded(particle) {
        if (
            particle.age <= particle.maxAge &&
            particle.x >= -20 && particle.x <= this.width + 20 &&
            particle.y >= -20 && particle.y <= this.height + 20
        ) {
            return;
        }

        const cx = this.width / 2;
        const cy = this.height / 2;
        const r = Math.random() * Math.max(this.width, this.height) * 0.55;
        const a = Math.random() * Math.PI * 2;
        particle.x = cx + Math.cos(a) * r;
        particle.y = cy + Math.sin(a) * r;
        particle.age = 0;
        particle.maxAge = 60 + Math.floor(Math.random() * 80);
        particle.color = this.resolvedPalette[Math.floor(Math.random() * this.resolvedPalette.length)] || particle.color;
    }

    drawResonanceParticle(particle, alpha) {
        const ctx = this.ctx;
        const size = particle.size * (1 + this.charge * 0.35);

        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        ctx.fillStyle = withAlpha(particle.color, alpha);
        ctx.fillRect(-size / 2, -size / 2, size, size);
        ctx.strokeStyle = withAlpha('#ffffff', alpha * 0.34);
        ctx.lineWidth = 0.8;
        ctx.strokeRect(-size / 2, -size / 2, size, size);
        ctx.restore();
    }

    burst() {
        if (PARTICLE_TYPES.has(this.type)) {
            this.burstFactor = this.type === 'resonance' ? 2.6 : 3.5;
            window.setTimeout(() => {
                if (!this.destroyed) this.burstFactor = 0;
            }, this.type === 'resonance' ? 380 : 450);
            return;
        }

        this.points.forEach((point) => {
            point.vx *= 5;
            point.vy *= 5;
        });

        window.setTimeout(() => {
            if (this.destroyed) return;
            this.points.forEach((point) => {
                point.vx *= 0.2;
                point.vy *= 0.2;
            });
        }, 500);
    }

    animate() {
        if (this.destroyed) return;
        this.rafId = 0;
        this.ctx.clearRect(0, 0, this.width, this.height);

        if (PARTICLE_TYPES.has(this.type)) {
            this.drawParticleField();
        } else {
            this.drawPointField();
        }

        if (this.visible && !this.destroyed) {
            this.rafId = requestAnimationFrame(this.animate);
        }
    }

    drawPointField() {
        const ctx = this.ctx;
        ctx.globalAlpha = 0.15 + (this.charge * 0.3);

        this.points.forEach((point, index) => {
            point.x += point.vx * (1 + this.charge * 2);
            point.y += point.vy * (1 + this.charge * 2);

            if (point.x < 0 || point.x > this.width) point.vx *= -1;
            if (point.y < 0 || point.y > this.height) point.vy *= -1;

            const dx = point.x - this.mouse.x;
            const dy = point.y - this.mouse.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 80 && dist > 0) {
                point.x += dx * 0.01;
                point.y += dy * 0.01;
            }

            ctx.strokeStyle = point.color || this.baseColor;
            ctx.fillStyle = point.color || this.baseColor;

            if (this.type === 'lattice') this.drawLattice(point, index);
            else if (this.type === 'flow') this.drawFlow(point);
        });
    }

    drawLattice(point, index) {
        const ctx = this.ctx;
        const baseAlpha = ctx.globalAlpha;

        ctx.beginPath();
        ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
        ctx.fill();

        for (let j = index + 1; j < this.points.length; j += 1) {
            const p2 = this.points[j];
            const dist = Math.hypot(point.x - p2.x, point.y - p2.y);
            if (dist >= 60) continue;

            ctx.globalAlpha = (1 - dist / 60) * 0.2;
            ctx.strokeStyle = point.color || this.baseColor;
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.globalAlpha = baseAlpha;
        }
    }

    drawFlow(point) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(point.x - point.vx * 10, point.y - point.vy * 10);
        ctx.stroke();
    }
}
