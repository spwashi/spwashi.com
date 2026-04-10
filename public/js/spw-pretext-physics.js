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

        // Tie into the custom gesture events from brace-gestures.js
        document.addEventListener('spw:brace:charge-start', onBraceGesture);
        document.addEventListener('spw:brace:discharge', onBraceGesture);
        document.addEventListener('spw:brace:activate', onBraceActivate);
        document.addEventListener('spw:brace:project-move', onBraceProject);
        document.addEventListener('spw:brace:project-end', onBraceGesture);
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

function onBraceGesture(e) {
    const flow = e.target.querySelector('[data-spw-flow="pretext"]');
    if (!flow) return;
    const state = flowStates.get(flow);
    if (!state) return;

    if (e.type === 'spw:brace:discharge' || e.type === 'spw:brace:project-end') {
        renderFlow(flow, state.baseWidth);
        state.currentWidth = state.baseWidth;
    }
}

function onBraceActivate(e) {
    const flow = e.target.querySelector('[data-spw-flow="pretext"]');
    if (!flow) return;
    const state = flowStates.get(flow);
    if (!state) return;

    // "Snap pulse" on click: momentarily widen or narrow
    const pulseWidth = state.baseWidth * 1.25;
    renderFlow(flow, pulseWidth);
    setTimeout(() => renderFlow(flow, state.baseWidth), 180);
}

function onBraceProject(e) {
    const flow = e.target.querySelector('[data-spw-flow="pretext"]');
    if (!flow) return;
    const state = flowStates.get(flow);
    if (!state) return;

    // Use drag distance to modulate width
    const { distance, dx } = e.detail;
    // Map drag to width variance: wider if dragging right, narrower if left
    const variance = dx * 1.5; 
    const targetWidth = Math.max(120, state.baseWidth + variance);
    
    if (Math.abs(targetWidth - state.currentWidth) > 5) {
        renderFlow(flow, targetWidth);
        state.currentWidth = targetWidth;
    }
}

function renderFlow(el, width) {
    const state = flowStates.get(el);
    if (!state || !pretext) return;

    // Use a fixed line height for now, or read from CSS
    const result = pretext.layoutWithLines(state.prepared, width, 24);
    
    // Build the HTML once and update. 
    // For high performance in a 'magic' interaction, we just join strings.
    let html = '';
    const op = el.closest('.site-frame')?.dataset.spwOperator || '?';
    
    result.lines.forEach((line, i) => {
        // Decorate line with operators as 'noise' or 'staging' if influence is high
        const showDecor = Math.random() < (el.style.getPropertyValue('--flow-influence') || 0);
        const decor = showDecor ? `<span class="line-decor">${op}</span>` : '';
        html += `<div class="pretext-flow-line" style="width: ${width}px; --line-index: ${i}">${decor}${line.text}${decor}</div>`;
    });
    
    state.linesRoot.innerHTML = html;
}
