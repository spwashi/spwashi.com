/**
 * Spw Canvas Accents (Enhanced)
 *
 * Generative, interactive canvas visuals for cards/sections.
 * Fully backward-compatible with the original API and data attributes.
 *
 * Major enhancements:
 * • Performance: IntersectionObserver pauses animation when off-screen
 * • Robust resize: Debounced + re-initializes particles/points (fixes stale positions)
 * • Canvas scaling: Uses setTransform (no cumulative scaling bug)
 * • Interactivity: Mouse repulsion now works on ALL archetypes (wave/vortex/crystal)
 * • Burst support: spell:grounded now works consistently across every archetype
 * • Configurability: data-spw-accent-count overrides particle count
 * • Bug fixes: GlobalAlpha leak in lattice connections, unused 'active' flag removed
 * • Code quality: Cached base color, cleaner archetype dispatch, better comments
 *
 * Archetypes unchanged:
 * lattice — neural/fungal mesh (points + proximity lines)
 * flow   — directional particle streams
 * wave   — spiral flow field
 * vortex — golden-angle spiral (stronger rotation)
 * crystal— crystalline granular diffusion
 *
 * Still honors:
 * data-spw-accent-palette="warm|cool|full"
 * bus events: brace:charged, brace:discharged, spell:grounded
 */
import { bus } from './spw-bus.js';

export function initSpwCanvasAccents() {
    const accents = document.querySelectorAll('[data-spw-accent]');
    accents.forEach(el => new CanvasAccent(el));
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

        // Config from data attributes
        const countStr = container.dataset.spwAccentCount;
        this.count = countStr
            ? parseInt(countStr, 10)
            : (this.type === 'crystal' ? 120 : (this.type === 'wave' || this.type === 'vortex' ? 80 : 20));

        this.points = [];
        this.particles = [];
        this.mouse = { x: -1000, y: -1000 };
        this.charge = 0;
        this.burstFactor = 0;
        this.t = 0;
        this.visible = true;
        this.rafId = null;
        this.resizeTimeout = null;

        this.palette = container.dataset.spwAccentPalette || 'full';

        // Read palette from CSS custom properties once
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

        this.resize();
        this.initArchetype();

        // Listeners
        window.addEventListener('resize', this.handleResize.bind(this));
        this.container.addEventListener('mousemove', e => this.updateMouse(e));
        this.container.addEventListener('mouseleave', () => {
            this.mouse = { x: -1000, y: -1000 };
        });

        // Bus events
        bus.on('brace:charged', e => {
            if (e.target === this.container) this.charge = 0.25;
        });
        bus.on('brace:discharged', e => {
            if (e.target === this.container) this.charge = 0;
        });
        bus.on('spell:grounded', e => {
            if (e.target === this.container) this.burst();
        });

        // Visibility optimization
        this.observer = new IntersectionObserver(entries => {
            const isVisible = entries[0].isIntersecting;
            if (isVisible !== this.visible) {
                this.visible = isVisible;
                if (isVisible && this.rafId === null) {
                    this.rafId = requestAnimationFrame(() => this.animate());
                } else if (!isVisible && this.rafId !== null) {
                    cancelAnimationFrame(this.rafId);
                    this.rafId = null;
                }
            }
        }, { threshold: 0.1 });
        this.observer.observe(this.container);

        // Start animation
        this.rafId = requestAnimationFrame(() => this.animate());
    }

    handleResize() {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => this.resize(), 100);
    }

    resize() {
        const rect = this.container.getBoundingClientRect();
        this.width = Math.max(rect.width, 1);
        this.height = Math.max(rect.height, 1);

        this.canvas.width = this.width * this.pixels;
        this.canvas.height = this.height * this.pixels;

        // Reset transform (prevents cumulative scaling bug)
        this.ctx.setTransform(this.pixels, 0, 0, this.pixels, 0, 0);

        // Re-initialize particles/points for new dimensions
        this.initArchetype();
    }

    updateMouse(e) {
        const rect = this.container.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
    }

    initArchetype() {
        this.points = [];
        this.particles = [];

        if (this.type === 'wave' || this.type === 'vortex' || this.type === 'crystal') {
            this.initWave();
            return;
        }

        // lattice / flow
        for (let i = 0; i < this.count; i++) {
            this.points.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 1
            });
        }
    }

    // ── Wave / Vortex / Crystal archetypes ──────────────────────────────
    initWave() {
        const cx = this.width / 2;
        const cy = this.height / 2;
        const paletteEntries = this._buildPalette();

        for (let i = 0; i < this.count; i++) {
            const r = Math.sqrt(i / this.count) * Math.max(this.width, this.height) * 0.65;
            const theta = i * 2.399963; // golden angle

            this.particles.push({
                x: cx + Math.cos(theta) * r * (0.5 + Math.random() * 0.5),
                y: cy + Math.sin(theta) * r * (0.5 + Math.random() * 0.5),
                age: Math.floor(Math.random() * 80),
                maxAge: 60 + Math.floor(Math.random() * 80),
                speed: 0.4 + Math.random() * 0.8,
                size: this.type === 'crystal' ? (0.6 + Math.random() * 1.4) : (0.8 + Math.random()),
                color: paletteEntries[i % paletteEntries.length],
            });
        }
    }

    _buildPalette() {
        const { teal, amber, rust, violet, sea } = this.colors;
        if (this.palette === 'warm') return [amber, rust, amber, 'hsl(24 65% 34%)'];
        if (this.palette === 'cool') return [teal, sea, violet, teal];
        return [teal, sea, amber, teal, rust, violet, amber, sea];
    }

    _flowAngle(x, y) {
        const cx = this.width / 2;
        const cy = this.height / 2;
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
        const base = Math.atan2(dy, dx);
        const spiral = (this.type === 'vortex') ? -0.006 : 0.006;
        return base + dist * spiral + this.t * (this.type === 'crystal' ? 0.18 : 0.22);
    }

    drawWaveFrame() {
        this.t += 0.004;
        const ctx = this.ctx;

        this.particles.forEach(p => {
            const angle = this._flowAngle(p.x, p.y);
            const boost = 1 + this.charge * 1.8 + this.burstFactor;

            p.x += Math.cos(angle) * p.speed * boost;
            p.y += Math.sin(angle) * p.speed * boost;

            p.age++;

            const alpha = Math.sin((p.age / p.maxAge) * Math.PI)
                * (this.type === 'crystal' ? 0.22 : 0.16)
                * (0.6 + this.charge * 0.5);

            ctx.beginPath();
            if (this.type === 'crystal') {
                const s = p.size;
                ctx.rect(p.x - s * 0.5, p.y - s * 0.5, s, s);
            } else {
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            }

            ctx.fillStyle = this._withAlpha(p.color, alpha);
            ctx.fill();

            // Mouse repulsion (works for wave/vortex/crystal)
            const mdx = p.x - this.mouse.x;
            const mdy = p.y - this.mouse.y;
            const mdist = Math.hypot(mdx, mdy);
            if (mdist < 120 && mdist > 0) {
                const force = (120 - mdist) / 120 * 2.5;
                p.x += (mdx / mdist) * force;
                p.y += (mdy / mdist) * force;
            }

            // Reset expired / out-of-bounds particles
            if (p.age > p.maxAge ||
                p.x < -10 || p.x > this.width + 10 ||
                p.y < -10 || p.y > this.height + 10) {
                const cx = this.width / 2;
                const cy = this.height / 2;
                const r = Math.random() * Math.max(this.width, this.height) * 0.55;
                const a = Math.random() * Math.PI * 2;
                p.x = cx + Math.cos(a) * r;
                p.y = cy + Math.sin(a) * r;
                p.age = 0;
                p.maxAge = 60 + Math.floor(Math.random() * 80);
            }
        });
    }

    _withAlpha(colorStr, alpha) {
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
            setTimeout(() => { this.burstFactor = 0; }, 450);
            return;
        }

        // Original lattice / flow burst
        this.points.forEach(p => {
            p.vx *= 5;
            p.vy *= 5;
        });
        setTimeout(() => {
            this.points.forEach(p => {
                p.vx *= 0.2;
                p.vy *= 0.2;
            });
        }, 500);
    }

    animate() {
        // This frame has been consumed
        this.rafId = null;

        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        if (this.type === 'wave' || this.type === 'vortex' || this.type === 'crystal') {
            this.drawWaveFrame();
        } else {
            // lattice / flow
            ctx.strokeStyle = this.baseColor;
            ctx.fillStyle = this.baseColor;
            ctx.globalAlpha = 0.15 + (this.charge * 0.3);

            this.points.forEach((p, i) => {
                p.x += p.vx * (1 + this.charge * 2);
                p.y += p.vy * (1 + this.charge * 2);

                if (p.x < 0 || p.x > this.width) p.vx *= -1;
                if (p.y < 0 || p.y > this.height) p.vy *= -1;

                // Mouse repulsion (original behavior)
                const dx = p.x - this.mouse.x;
                const dy = p.y - this.mouse.y;
                const dist = Math.hypot(dx, dy);
                if (dist < 80 && dist > 0) {
                    p.x += dx * 0.01;
                    p.y += dy * 0.01;
                }

                if (this.type === 'lattice') this.drawLattice(p, i);
                else if (this.type === 'flow') this.drawFlow(p);
            });
        }

        // Schedule next frame only while visible
        if (this.visible) {
            this.rafId = requestAnimationFrame(() => this.animate());
        }
    }

    drawLattice(p, index) {
        const ctx = this.ctx;
        const baseAlpha = ctx.globalAlpha; // preserve non-wave global alpha

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Connections
        for (let j = index + 1; j < this.points.length; j++) {
            const p2 = this.points[j];
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const dist = Math.hypot(dx, dy);

            if (dist < 60) {
                ctx.globalAlpha = (1 - dist / 60) * 0.2;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
                ctx.globalAlpha = baseAlpha; // restore for next particle
            }
        }
    }

    drawFlow(p) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 10, p.y - p.vy * 10);
        ctx.stroke();
    }
}