/**
 * Spw Pretext Physics
 * 
 * Integrates Pretext.js for 'tasteful flow magic' and structural symmetry.
 * Text blocks with [data-spw-flow="pretext"] respond to directional approach
 * and composite sigil physics.
 */

import { loadPretext } from './pretext-utils.js';

let pretext = null;
const flowStates = new WeakMap();

/**
 * Initialize Pretext physics on the current surface.
 */
export async function initPretextPhysics() {
    const targets = document.querySelectorAll('[data-spw-flow="pretext"]');
    if (!targets.length) return;

    try {
        pretext = await loadPretext();
        if (document.fonts?.ready) await document.fonts.ready;
        
        targets.forEach(setupFlowElement);
        
        // Listen for pointer moves on the whole body to handle 'approach' physics
        document.body.addEventListener('pointermove', onGlobalPointerMove, { passive: true });
    } catch (e) {
        console.warn('Pretext physics failed to initialize:', e);
    }
}

function setupFlowElement(el) {
    const text = el.dataset.spwText || el.innerText.trim();
    const font = window.getComputedStyle(el).font || '16px system-ui';
    
    // Prepare once, reuse forever
    const prepared = pretext.prepareWithSegments(text, font, {
        whiteSpace: 'normal'
    });

    // Create a shadow container for the lines to avoid layout thrashing
    const linesRoot = document.createElement('div');
    linesRoot.className = 'pretext-flow-lines';
    el.innerHTML = '';
    el.appendChild(linesRoot);

    flowStates.set(el, {
        prepared,
        text,
        baseWidth: el.offsetWidth || 400,
        currentWidth: el.offsetWidth || 400,
        linesRoot
    });

    // Initial render
    renderFlow(el, el.offsetWidth || 400);
}

function onGlobalPointerMove(e) {
    // Optimization: only process if we're near a flow element
    const targets = document.querySelectorAll('[data-spw-flow="pretext"]');
    targets.forEach(el => {
        const state = flowStates.get(el);
        if (!state) return;

        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const distToCenter = Math.abs(e.clientX - centerX);
        const distY = Math.abs(e.clientY - centerY);

        // Approach physics: affect the width when the pointer is within a 'field'
        if (distToCenter < 600 && distY < 300) {
            // Directional influence: approaching from left vs right
            const direction = e.clientX < centerX ? -1 : 1;
            const influence = 1 - (distToCenter / 600);
            
            // Symmetrical expansion/contraction based on approach
            const delta = (direction * influence * 120);
            const targetWidth = state.baseWidth + delta;
            
            // Snap to symmetry when very close to center
            const snapWidth = distToCenter < 12 ? state.baseWidth : targetWidth;
            
            if (Math.abs(snapWidth - state.currentWidth) > 2) {
                renderFlow(el, snapWidth);
                state.currentWidth = snapWidth;
            }
            
            // Apply a CSS variable for 'lean' or 'symmetry'
            el.style.setProperty('--flow-influence', influence);
            el.style.setProperty('--flow-direction', direction);
        } else if (state.currentWidth !== state.baseWidth) {
            // Settle back to base width
            renderFlow(el, state.baseWidth);
            state.currentWidth = state.baseWidth;
            el.style.setProperty('--flow-influence', 0);
        }
    });
}

function renderFlow(el, width) {
    const state = flowStates.get(el);
    if (!state || !pretext) return;

    // Use a fixed line height for now, or read from CSS
    const result = pretext.layoutWithLines(state.prepared, width, 24);
    
    // Build the HTML once and update. 
    // For high performance in a 'magic' interaction, we just join strings.
    let html = '';
    result.lines.forEach(line => {
        html += `<div class="pretext-flow-line" style="width: ${width}px">${line.text}</div>`;
    });
    
    state.linesRoot.innerHTML = html;
}
