/**
 * Spw Canvas Accents
 *
 * Lifetime-safe version:
 * - idempotent init
 * - per-instance destroy()
 * - tracked bus unsubs
 * - removable DOM/window listeners
 * - observer + RAF teardown
 */

import { bus } from './spw-bus.js';

const INSTANCE_MAP = new WeakMap();
let activeInstances = new Set();

export function initSpwCanvasAccents(root = document) {
    const created = [];
    const accents = root.querySelectorAll('[data-spw-accent]');

    accents.forEach((el) => {
        if (INSTANCE_MAP.has(el)) return;
        const instance = new CanvasAccent(el);
        INSTANCE_MAP.set(el, instance);
        activeInstances.add(instance);
        created.push(instance);
    });

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

        const countStr = container.dataset.spwAccentCount;
        this.count = countStr
            ? parseInt(countStr, 10)
            : (this.type === 'crystal'
                ? 120
                : (this.type === 'wave' || this.type === 'vortex' ? 80 : 20));

        this.points = [];
        this.particles = [];
        this.mouse = { x: -1000, y: -1000 };
        this.charge = 0;
        this.burstFactor = 0;
        this.t = 0;
        this.visible = true;
        this.rafId = 0;
        this.resizeTimeout = 0;
        this.destroyed = false;
        this.offs = [];

        this.palette = container.dataset.spwAccentPalette || 'full';

        const cs = getComputedStyle(document.documentElement);
        this.colors = {
            teal: cs.getPropertyValue('--teal').trim() || 'hsl(180 100% 28%)',
            amber: cs.getPropertyValue('--op-object-color').trim() || 'hsl(36 80% 36%)',
            rust: cs.getPropertyValue('--op-pragma-color').trim() || 'hsl(0 40% 38%)',
            violet: cs.getPropertyValue('--op-probe-color').trim() || 'hsl(268 55% 42%)',
            sea: cs.getPropertyValue('--op-topic-color').trim() || 'hsl(192 62% 32%)',
        };

        this.baseColor = getComputedStyle(document.body)
            .getPropertyValue('--active-op-color')
            .trim() || '#1a9999';

        this.handleResize = this.handleResize.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseLeave = this.handleMouseLeave.bind(this);
        this.handleIntersect = this.handleIntersect.bind(this);
        this.animate = this.animate.bind(this);

        this.resize();
        this.initArchetype();
        this.attach();
    }

    attach() {
        window.addEventListener('resize', this.handleResize);
        this.container.addEventListener('mousemove', this.handleMouseMove);
        this.container.addEventListener('mouseleave', this.handleMouseLeave);

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
        this.container.removeEventListener('mousemove', this.handleMouseMove);
        this.container.removeEventListener('mouseleave', this.handleMouseLeave);

        this.offs.forEach((off) => {
            try {
                off?.();
            } catch (error) {
                console.warn('[CanvasAccent] Failed to unsubscribe.', error);
            }
        });
        this.offs = [];

        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = 0;
        }

        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = 0;
        }

        if (this.canvas.parentNode === this.container) {
            this.canvas.remove();
        }

        this.points = [];
        this.particles = [];
    }

    handleIntersect(entries) {
        if (this.destroyed) return;
        const entry = entries[0];
        const nextVisible = Boolean(entry?.isIntersecting);

        if (nextVisible === this.visible) return;
        this.visible = nextVisible;

        if (this.visible) {
            if (!this.rafId) {
                this.rafId = requestAnimationFrame(this.animate);
            }
        } else if (this.rafId) {
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

    handleMouseMove(event) {
        if (this.destroyed) return;
        const rect = this.container.getBoundingClientRect();
        this.mouse.x = event.clientX - rect.left;
        this.mouse.y = event.clientY - rect.top;
    }

    handleMouseLeave() {
        this.mouse.x = -1000;
        this.mouse.y = -1000;
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

        if (this.type === 'wave' || this.type === 'vortex' || this.type === 'crystal') {
            this.initWave();
            return;
        }

        for (let i = 0; i < this.count; i += 1) {
            this.points.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 1,
            });
        }
    }

    initWave() {
        const cx = this.width / 2;
        const cy = this.height / 2;
        const paletteEntries = this.buildPalette();

        for (let i = 0; i < this.count; i += 1) {
            const r = Math.sqrt(i / this.count) * Math.max(this.width, this.height) * 0.65;
            const theta = i * 2.399963;

            this.particles.push({
                x: cx + Math.cos(theta) * r * (0.5 + Math.random() * 0.5),
                y: cy + Math.sin(theta) * r * (0.5 + Math.random() * 0.5),
                age: Math.floor(Math.random() * 80),
                maxAge: 60 + Math.floor(Math.random() * 80),
                speed: 0.4 + Math.random() * 0.8,
                size: this.type === 'crystal'
                    ? (0.6 + Math.random() * 1.4)
                    : (0.8 + Math.random()),
                color: paletteEntries[i % paletteEntries.length],
            });
        }
    }

    buildPalette() {
        const { teal, amber, rust, violet, sea } = this.colors;
        if (this.palette === 'warm') return [amber, rust, amber, 'hsl(24 65% 34%)'];
        if (this.palette === 'cool') return [teal, sea, violet, teal];
        return [teal, sea, amber, teal, rust, violet, amber, sea];
    }

    flowAngle(x, y) {
        const cx = this.width / 2;
        const cy = this.height / 2;
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
        const base = Math.atan2(dy, dx);
        const spiral = this.type === 'vortex' ? -0.006 : 0.006;
        return base + dist * spiral + this.t * (this.type === 'crystal' ? 0.18 : 0.22);
    }

    drawWaveFrame() {
        this.t += 0.004;
        const ctx = this.ctx;

        this.particles.forEach((particle) => {
            const angle = this.flowAngle(particle.x, particle.y);
            const boost = 1 + this.charge * 1.8 + this.burstFactor;

            particle.x += Math.cos(angle) * particle.speed * boost;
            particle.y += Math.sin(angle) * particle.speed * boost;
            particle.age += 1;

            const alpha = Math.sin((particle.age / particle.maxAge) * Math.PI)
                * (this.type === 'crystal' ? 0.22 : 0.16)
                * (0.6 + this.charge * 0.5);

            ctx.beginPath();
            if (this.type === 'crystal') {
                const s = particle.size;
                ctx.rect(particle.x - s * 0.5, particle.y - s * 0.5, s, s);
            } else {
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            }

            ctx.fillStyle = this.withAlpha(particle.color, alpha);
            ctx.fill();

            const mdx = particle.x - this.mouse.x;
            const mdy = particle.y - this.mouse.y;
            const mdist = Math.hypot(mdx, mdy);
            if (mdist < 120 && mdist > 0) {
                const force = ((120 - mdist) / 120) * 2.5;
                particle.x += (mdx / mdist) * force;
                particle.y += (mdy / mdist) * force;
            }

            if (
                particle.age > particle.maxAge ||
                particle.x < -10 || particle.x > this.width + 10 ||
                particle.y < -10 || particle.y > this.height + 10
            ) {
                const cx = this.width / 2;
                const cy = this.height / 2;
                const r = Math.random() * Math.max(this.width, this.height) * 0.55;
                const a = Math.random() * Math.PI * 2;
                particle.x = cx + Math.cos(a) * r;
                particle.y = cy + Math.sin(a) * r;
                particle.age = 0;
                particle.maxAge = 60 + Math.floor(Math.random() * 80);
            }
        });
    }

    withAlpha(colorStr, alpha) {
        if (colorStr.startsWith('hsl(')) {
            return colorStr.replace('hsl(', 'hsla(').replace(')', `, ${alpha.toFixed(3)})`);
        }
        if (colorStr.startsWith('rgb(')) {
            return colorStr.replace('rgb(', 'rgba(').replace(')', `, ${alpha.toFixed(3)})`);
        }
        return colorStr;
    }

    burst() {
        if (this.type === 'wave' || this.type === 'vortex' || this.type === 'crystal') {
            this.burstFactor = 3.5;
            window.setTimeout(() => {
                if (!this.destroyed) this.burstFactor = 0;
            }, 450);
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

        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        if (this.type === 'wave' || this.type === 'vortex' || this.type === 'crystal') {
            this.drawWaveFrame();
        } else {
            ctx.strokeStyle = this.baseColor;
            ctx.fillStyle = this.baseColor;
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

                if (this.type === 'lattice') this.drawLattice(point, index);
                else if (this.type === 'flow') this.drawFlow(point);
            });
        }

        if (this.visible && !this.destroyed) {
            this.rafId = requestAnimationFrame(this.animate);
        }
    }

    drawLattice(point, index) {
        const ctx = this.ctx;
        const baseAlpha = ctx.globalAlpha;

        ctx.beginPath();
        ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
        ctx.fill();

        for (let j = index + 1; j < this.points.length; j += 1) {
            const p2 = this.points[j];
            const dx = point.x - p2.x;
            const dy = point.y - p2.y;
            const dist = Math.hypot(dx, dy);

            if (dist < 60) {
                ctx.globalAlpha = (1 - dist / 60) * 0.2;
                ctx.beginPath();
                ctx.moveTo(point.x, point.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
                ctx.globalAlpha = baseAlpha;
            }
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