/**
 * Spw SVG Filters
 *
 * Injects global SVG filter definitions used by the cinematic and persona systems.
 * RESILIENCE: programmatic creation (no innerHTML parsing), try/catch, idempotent, graceful failure.
 */

export function initSpwSvgFilters() {
    if (document.getElementById('spw-global-svg-filters')) return;

    try {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.id = 'spw-global-svg-filters';
        svg.setAttribute('aria-hidden', 'true');
        svg.style.display = 'none';

        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

        // Scribe: Blueprint Grid
        const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
        pattern.id = 'scribe-grid';
        pattern.setAttribute('width', '20');
        pattern.setAttribute('height', '20');
        pattern.setAttribute('patternUnits', 'userSpaceOnUse');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M 20 0 L 0 0 0 20');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', 'var(--teal)');
        path.setAttribute('stroke-width', '0.2');
        path.setAttribute('opacity', '0.15');
        pattern.appendChild(path);
        defs.appendChild(pattern);

        // Doodler: Sketchy/Hand-drawn effect
        const sketch = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        sketch.id = 'doodler-sketch';
        sketch.setAttribute('x', '-10%');
        sketch.setAttribute('y', '-10%');
        sketch.setAttribute('width', '120%');
        sketch.setAttribute('height', '120%');
        sketch.innerHTML = `
      <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G"/>
    `;
        defs.appendChild(sketch);

        // Doodler: Paper Texture
        const paper = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        paper.id = 'paper-texture';
        paper.innerHTML = `
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise"/>
      <feDiffuseLighting in="noise" lighting-color="var(--surface)" surfaceScale="2">
        <feDistantLight azimuth="45" elevation="60"/>
      </feDiffuseLighting>
    `;
        defs.appendChild(paper);

        // Cinematic: Chromatic Aberration (FIXED — no more "set" error)
        const aberration = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        aberration.id = 'cinematic-aberration';
        aberration.setAttribute('x', '-10%');
        aberration.setAttribute('y', '-10%');
        aberration.setAttribute('width', '120%');
        aberration.setAttribute('height', '120%');
        aberration.innerHTML = `
      <feOffset in="SourceGraphic" dx="1.2" dy="0" result="offsetRed"/>
      <feOffset in="SourceGraphic" dx="-1.2" dy="0" result="offsetBlue"/>
      <!-- Fixed: type="table" with tableValues="0" correctly zeros the channel -->
      <feComponentTransfer in="offsetRed" result="red">
        <feFuncR type="identity"/>
        <feFuncG type="table" tableValues="0"/>
        <feFuncB type="table" tableValues="0"/>
      </feComponentTransfer>
      <feComponentTransfer in="offsetBlue" result="blue">
        <feFuncR type="table" tableValues="0"/>
        <feFuncG type="table" tableValues="0"/>
        <feFuncB type="identity"/>
      </feComponentTransfer>
      <feBlend in="red" in2="blue" mode="screen" result="aberration"/>
      <feBlend in="aberration" in2="SourceGraphic" mode="overlay"/>
    `;
        defs.appendChild(aberration);

        // Metaphysics: Watercolor Bleed
        const watercolor = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        watercolor.id = 'watercolor-blur';
        watercolor.setAttribute('x', '-20%');
        watercolor.setAttribute('y', '-20%');
        watercolor.setAttribute('width', '140%');
        watercolor.setAttribute('height', '140%');
        watercolor.innerHTML = `
      <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="35" xChannelSelector="R" yChannelSelector="G" result="bleed"/>
      <feGaussianBlur in="bleed" stdDeviation="2" result="soft_bleed"/>
      <feComposite in="SourceGraphic" in2="soft_bleed" operator="over"/>
    `;
        defs.appendChild(watercolor);

        svg.appendChild(defs);
        document.body.appendChild(svg);
        console.log('[Spw SVG Filters] Initialized successfully');
    } catch (err) {
        console.warn('[Spw SVG Filters] Failed to initialize (non-fatal — site still works)', err);
    }
}