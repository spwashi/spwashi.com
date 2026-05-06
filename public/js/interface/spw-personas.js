import { bus } from '/public/js/kernel/spw-bus.js';
import { initPersonaSelector } from '/public/js/interface/spw-persona-selector.js';
import { createSpwLogger } from '/public/js/kernel/spw-instrumentation.js';

const PERSONAS = ['viewer', 'doodler', 'scribe'];
const STORAGE_KEY = 'spw-active-persona';
const logger = createSpwLogger('spw-personas');

let scribeTooltip = null;

export function initSpwPersonas() {
    const active = localStorage.getItem(STORAGE_KEY) || 'viewer';
    applyPersona(active);
    initPersonaSelector();

    bus.on('persona:shift', (e) => {
        const next = e.detail?.persona;
        if (PERSONAS.includes(next)) {
            applyPersona(next);
        }
    });

    // Correctly mapped back to the passive probe event for hover reveals
    bus.on('spell:probe', handlePersonaHover);
    bus.on('spell:grounded', handlePersonaAction);
    bus.on('brace:discharged', hideScribeTooltip);

    bus.on('spirit:peak', () => {
        if (Math.random() > 0.8) {
            logger.info('spirit peak suggests doodler');
        }
    });
}

function handlePersonaHover(event) {
    const persona = document.body.dataset.spwPersona;
    const target = event.detail?.element || event.target;
    
    if (!target || !(target instanceof Element) || persona !== 'scribe') return;
    augmentScribe(target);
}

function handlePersonaAction(event) {
    const persona = document.body.dataset.spwPersona;
    const target = event.detail?.element || event.target;
    
    if (!target || !(target instanceof Element) || persona !== 'doodler') return;
    augmentDoodler(target);
}

function augmentScribe(el) {
    let metaText = el.getAttribute('data-scribe-meta') 
        || el.dataset.spwOperator 
        || el.id 
        || el.tagName.toLowerCase();
        
    if (!metaText) return;
    
    if (!scribeTooltip) {
        scribeTooltip = document.createElement('div');
        scribeTooltip.className = 'scribe-meta-tooltip';
        document.body.appendChild(scribeTooltip);
    }
    
    scribeTooltip.textContent = `<meta: ${metaText}>`;
    
    const rect = el.getBoundingClientRect();
    scribeTooltip.style.top = `${rect.top + window.scrollY - 30}px`;
    scribeTooltip.style.left = `${rect.left + window.scrollX + (rect.width / 2)}px`;
    
    requestAnimationFrame(() => scribeTooltip.classList.add('is-visible'));
}

function hideScribeTooltip() {
    if (scribeTooltip) {
        scribeTooltip.classList.remove('is-visible');
    }
}

function augmentDoodler(el) {
    const burst = document.createElement('div');
    burst.className = 'doodler-burst';
    burst.innerHTML = '✧ ✦ ✧'; 
    
    const rect = el.getBoundingClientRect();
    burst.style.top = `${rect.top + window.scrollY - 10}px`;
    burst.style.left = `${rect.left + window.scrollX + (rect.width / 2)}px`;
    
    document.body.appendChild(burst);
    burst.addEventListener('animationend', () => burst.remove(), { once: true });
}

function applyPersona(persona) {
    document.body.dataset.spwPersona = persona;
    localStorage.setItem(STORAGE_KEY, persona);
    hideScribeTooltip(); 
    bus.emit('persona:active', { persona });
    logger.info('active persona', { persona });
}

window.spwShiftPersona = (persona) => bus.emit('persona:shift', { persona });
