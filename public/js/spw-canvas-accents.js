/**
 * Spw Canvas Accents
 *
 * Provides generative, interactive canvas-based visuals for cards and sections.
 * Archetypes reflect the cognitive role of the component (e.g. geometric for 
 * structure, fluid for streams).
 *
 * Interactive hooks:
 * - Pointer proximity influences particle speed/density.
 * - Global bus 'spell:grounded' triggers a burst of color.
 * - Bus '--charge' modulates the overall intensity.
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
        
        this.points = [];
        this.mouse  = { x: -1000, y: -1000 };
        this.charge = 0;
        this.active = false;
        
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
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        const color = getComputedStyle(document.body).getPropertyValue('--active-op-color').trim() || '#1a9999';
        this.ctx.strokeStyle = color;
        this.ctx.fillStyle   = color;
        this.ctx.globalAlpha = 0.15 + (this.charge * 0.3);

        this.points.forEach((p, i) => {
            p.x += p.vx * (1 + this.charge * 2);
            p.y += p.vy * (1 + this.charge * 2);

            if (p.x < 0 || p.x > this.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.height) p.vy *= -1;

            // Mouse interaction
            const dx = p.x - this.mouse.x;
            const dy = p.y - this.mouse.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
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
