/**
 * Spw Canvas Accents
 *
 * Provides generative, interactive canvas-based visuals for cards and sections.
 * Archetypes reflect the cognitive role of the component (e.g. geometric for
 * structure, fluid for streams, vortex for knowledge spirals).
 *
 * Archetypes:
 *   lattice  — neural/fungal mesh: particles connected at proximity
 *   flow     — directional particle streams
 *   wave     — spiral flow field inspired by attentional dynamics
 *   vortex   — golden-angle spiral with palette drawn from spw-tokens
 *   crystal  — crystalline / granular diffusion field
 *
 * Interactive hooks:
 *   - Pointer proximity influences particle speed/density.
 *   - Global bus 'spell:grounded' triggers a burst of color.
 *   - Bus '--charge' modulates the overall intensity.
 *   - data-spw-accent-palette="warm|cool|full" biases the color register.
 *
 * Agent note (external): This file handles all canvas-based accent rendering.
 * To add a new archetype, extend initArchetype() dispatch and add draw+init methods.
 * Palette colors come from CSS custom properties on document.body at init time.
 */

import { bus } from './spw-bus.js';

export function initSpwCanvasAccents() {
    const accents = document.querySelectorAll('[data-spw-accent]');
    accents.forEach(el => new CanvasAccent(el));
}

class CanvasAccent {
    constructor(container) {
        this.container = container;
        this.type      = container.dataset.spwAccent || 'lattice';
        this.canvas    = document.createElement('canvas');
        this.ctx       = this.canvas.getContext('2d');
        this.pixels    = window.devicePixelRatio || 1;
        
        this.container.classList.add('spw-accent-host');
        this.container.prepend(this.canvas);
        
        this.points    = [];
        this.particles = [];
        this.mouse     = { x: -1000, y: -1000 };
        this.charge    = 0;
        this.active    = false;
        this.t         = 0;
        this.palette   = container.dataset.spwAccentPalette || 'full';

        // Read palette from CSS tokens at init time
        const cs = getComputedStyle(document.documentElement);
        this.colors = {
            teal:   cs.getPropertyValue('--teal').trim()            || 'hsl(180 100% 28%)',
            amber:  cs.getPropertyValue('--op-object-color').trim() || 'hsl(36 80% 36%)',
            rust:   cs.getPropertyValue('--op-pragma-color').trim() || 'hsl(0 40% 38%)',
            violet: cs.getPropertyValue('--op-probe-color').trim()  || 'hsl(268 55% 42%)',
            sea:    cs.getPropertyValue('--op-topic-color').trim()  || 'hsl(192 62% 32%)',
        };

        this.resize();
        this.initArchetype();
        
        window.addEventListener('resize', () => this.resize());
        this.container.addEventListener('mousemove', (e) => this.updateMouse(e));
        this.container.addEventListener('mouseenter', () => this.active = true);
        this.container.addEventListener('mouseleave', () => {
            this.active = false;
            this.mouse = { x: -1000, y: -1000 };
        });

        bus.on('brace:charged', (e) => {
            if (e.target === this.container) this.charge = 0.25;
        });
        bus.on('brace:discharged', (e) => {
            if (e.target === this.container) this.charge = 0;
        });
        bus.on('spell:grounded', (e) => {
            if (e.target === this.container) this.burst();
        });

        this.animate();
    }

    resize() {
        const rect = this.container.getBoundingClientRect();
        this.width  = rect.width;
        this.height = rect.height;
        this.canvas.width  = this.width * this.pixels;
        this.canvas.height = this.height * this.pixels;
        this.ctx.scale(this.pixels, this.pixels);
    }

    updateMouse(e) {
        const rect = this.container.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
    }

    initArchetype() {
        if (this.type === 'wave' || this.type === 'vortex' || this.type === 'crystal') {
            this.initWave();
            return;
        }
        const count = 20;
        for (let i = 0; i < count; i++) {
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
    // Inspired by spiral fractal imagery: attentional dynamics made visible.
    // Flow field rotates particles toward a golden-angle spiral center.
    // Colors sample from spw-token palette, biased by data-spw-accent-palette.

    initWave() {
        const count = this.type === 'crystal' ? 120 : 80;
        const cx = this.width  / 2;
        const cy = this.height / 2;

        const paletteEntries = this._buildPalette();

        for (let i = 0; i < count; i++) {
            // Distribute particles along a golden-angle spiral from center
            const r     = Math.sqrt(i / count) * Math.max(this.width, this.height) * 0.65;
            const theta = i * 2.399963; // golden angle ≈ 137.5°
            this.particles.push({
                x:      cx + Math.cos(theta) * r * (0.5 + Math.random() * 0.5),
                y:      cy + Math.sin(theta) * r * (0.5 + Math.random() * 0.5),
                age:    Math.floor(Math.random() * 80),
                maxAge: 60 + Math.floor(Math.random() * 80),
                speed:  0.4 + Math.random() * 0.8,
                size:   this.type === 'crystal' ? (0.6 + Math.random() * 1.4) : (0.8 + Math.random()),
                color:  paletteEntries[i % paletteEntries.length],
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
        // Logarithmic spiral field: angle at (x,y) is atan2(y-cy, x-cx) + distance-based rotation
        const cx = this.width  / 2;
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
            p.x += Math.cos(angle) * p.speed * (1 + this.charge * 1.8);
            p.y += Math.sin(angle) * p.speed * (1 + this.charge * 1.8);
            p.age++;

            const alpha = Math.sin((p.age / p.maxAge) * Math.PI)
                          * (this.type === 'crystal' ? 0.22 : 0.16)
                          * (0.6 + this.charge * 0.5);

            ctx.beginPath();
            if (this.type === 'crystal') {
                // Crystal: small angular marks
                const s = p.size;
                ctx.rect(p.x - s * 0.5, p.y - s * 0.5, s, s);
            } else {
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            }
            ctx.fillStyle = this._withAlpha(p.color, alpha);
            ctx.fill();

            // Reset if out of bounds or expired
            if (p.age > p.maxAge || p.x < -10 || p.x > this.width + 10 ||
                p.y < -10 || p.y > this.height + 10) {
                const cx = this.width / 2;
                const cy = this.height / 2;
                const r  = Math.random() * Math.max(this.width, this.height) * 0.55;
                const a  = Math.random() * Math.PI * 2;
                p.x   = cx + Math.cos(a) * r;
                p.y   = cy + Math.sin(a) * r;
                p.age = 0;
                p.maxAge = 60 + Math.floor(Math.random() * 80);
            }
        });
    }

    _withAlpha(colorStr, alpha) {
        // Inject alpha into hsl/rgb/hex color strings
        if (colorStr.startsWith('hsl(')) {
            return colorStr.replace('hsl(', 'hsla(').replace(')', `, ${alpha.toFixed(3)})`);
        }
        if (colorStr.startsWith('rgb(')) {
            return colorStr.replace('rgb(', 'rgba(').replace(')', `, ${alpha.toFixed(3)})`);
        }
        return colorStr; // fallback: no alpha injection
    }

    burst() {
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
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        if (this.type === 'wave' || this.type === 'vortex' || this.type === 'crystal') {
            this.drawWaveFrame();
            requestAnimationFrame(() => this.animate());
            return;
        }

        const color = getComputedStyle(document.body).getPropertyValue('--active-op-color').trim() || '#1a9999';
        ctx.strokeStyle = color;
        ctx.fillStyle   = color;
        ctx.globalAlpha = 0.15 + (this.charge * 0.3);

        this.points.forEach((p, i) => {
            p.x += p.vx * (1 + this.charge * 2);
            p.y += p.vy * (1 + this.charge * 2);

            if (p.x < 0 || p.x > this.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.height) p.vy *= -1;

            // Mouse interaction
            const dx = p.x - this.mouse.x;
            const dy = p.y - this.mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 80) {
                p.x += dx * 0.01;
                p.y += dy * 0.01;
            }

            if (this.type === 'lattice') this.drawLattice(p, i);
            else if (this.type === 'flow') this.drawFlow(p);
        });

        requestAnimationFrame(() => this.animate());
    }

    drawLattice(p, index) {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();

        for (let j = index + 1; j < this.points.length; j++) {
            const p2 = this.points[j];
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < 60) {
                this.ctx.globalAlpha = (1 - dist / 60) * 0.2;
                this.ctx.beginPath();
                this.ctx.moveTo(p.x, p.y);
                this.ctx.lineTo(p2.x, p2.y);
                this.ctx.stroke();
            }
        }
    }

    drawFlow(p) {
        this.ctx.beginPath();
        this.ctx.moveTo(p.x, p.y);
        this.ctx.lineTo(p.x - p.vx * 10, p.y - p.vy * 10);
        this.ctx.stroke();
    }
}
