/**
 * Spw Haptics
 * 
 * Implements 'bubble wrap' interaction semantics for concepts and curriculum tokens.
 * Provides synthetic audio 'pops' and tactile visual snapping.
 */

export function initSpwHaptics() {
    // Add tactile effect to common interactive elements
    const popSelectors = '.operator-chip, .syntax-token, .frame-sigil, .spec-pill, .frame-card, .badge, .tag, .pill';
    
    // Restore state from localStorage
    restorePoppedState(popSelectors);

    document.addEventListener('click', (e) => {
        const target = e.target.closest(popSelectors);
        if (target) {
            animatePop(target);
            togglePoppedState(target);
        }
    });

    // Handle checkpoint requests from the site settings or console
    document.addEventListener('spw:haptics:reset', resetHaptics);
    document.addEventListener('spw:haptics:checkpoint', saveCheckpoint);
}

function animatePop(el) {
    el.classList.add('spw-pop-snap');
    setTimeout(() => el.classList.remove('spw-pop-snap'), 200);
}

function togglePoppedState(el) {
    const key = getElementKey(el);
    const isPopped = el.dataset.spwPopped === 'true';
    
    if (isPopped) {
        el.dataset.spwPopped = 'false';
        removeFromRegistry(key);
    } else {
        el.dataset.spwPopped = 'true';
        addToRegistry(key);
    }
}

function getElementKey(el) {
    // Use ID if available, otherwise text content + pathname as a hashable key
    return el.id || `${window.location.pathname}:${el.textContent.trim()}`;
}

function addToRegistry(key) {
    const registry = JSON.parse(localStorage.getItem('spw-popped-registry') || '[]');
    if (!registry.includes(key)) {
        registry.push(key);
        localStorage.setItem('spw-popped-registry', JSON.stringify(registry));
    }
}

function removeFromRegistry(key) {
    const registry = JSON.parse(localStorage.getItem('spw-popped-registry') || '[]');
    const index = registry.indexOf(key);
    if (index > -1) {
        registry.splice(index, 1);
        localStorage.setItem('spw-popped-registry', JSON.stringify(registry));
    }
}

function restorePoppedState(selectors) {
    const registry = JSON.parse(localStorage.getItem('spw-popped-registry') || '[]');
    document.querySelectorAll(selectors).forEach(el => {
        const key = getElementKey(el);
        if (registry.includes(key)) {
            el.dataset.spwPopped = 'true';
        }
    });
}

export function resetHaptics() {
    localStorage.removeItem('spw-popped-registry');
    document.querySelectorAll('[data-spw-popped="true"]').forEach(el => {
        el.dataset.spwPopped = 'false';
    });
}

export function saveCheckpoint(e) {
    const name = e?.detail?.name || `checkpoint_${Date.now()}`;
    const registry = localStorage.getItem('spw-popped-registry');
    if (registry) {
        localStorage.setItem(`spw-checkpoint:${name}`, registry);
        console.log(`@ [checkpoint] saved: ${name}`);
    }
}

