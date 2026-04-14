/**
 * Spw Sequence Projection
 *
 * Lifetime-safe version:
 * - idempotent init
 * - clearable interval + timeout
 * - removable click listener
 */

import { bus } from './spw-bus.js';

let initialized = false;
let currentSequence = [];
let lastTimestamp = 0;
let timeoutId = 0;
let intervalId = 0;
let clickHandler = null;

const TIMEOUT = 5000;
const CLEAR_DELAY_MS = 1000;

export function initSpwProjection() {
    if (initialized) {
        return () => destroySpwProjection();
    }

    initialized = true;

    clickHandler = (event) => {
        const delimiter = event.target instanceof Element
            ? event.target.closest('.spw-delimiter')
            : null;

        if (!delimiter) return;
        handleSelection(delimiter);
    };

    document.addEventListener('click', clickHandler);

    intervalId = window.setInterval(() => {
        if (currentSequence.length > 0 && Date.now() - lastTimestamp > TIMEOUT) {
            clearSequence('timeout');
        }
    }, 1000);

    return () => destroySpwProjection();
}

function destroySpwProjection() {
    if (!initialized) return;

    initialized = false;

    if (clickHandler) {
        document.removeEventListener('click', clickHandler);
        clickHandler = null;
    }

    if (intervalId) {
        clearInterval(intervalId);
        intervalId = 0;
    }

    if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = 0;
    }

    clearSequence('destroy');
}

function handleSelection(element) {
    const now = Date.now();

    if (now - lastTimestamp > TIMEOUT) {
        clearSequence('reset');
    }

    lastTimestamp = now;

    if (element.dataset.spwSelection === 'selected') {
        element.removeAttribute('data-spw-selection');
        element.classList.remove('spw-delight');
        currentSequence = currentSequence.filter((item) => item !== element);
        return;
    }

    element.setAttribute('data-spw-selection', 'selected');
    currentSequence.push(element);

    bus.emit('sequence:selected', {
        length: currentSequence.length,
        el: element,
        content: element.textContent.trim(),
    });

    if (currentSequence.length >= 3) {
        triggerProjection();
    }
}

function triggerProjection() {
    const persona = document.body.dataset.spwPersona || 'baseline';
    const fragments = currentSequence.map((el) => el.textContent.trim()).join(' → ');

    bus.emit('persona:projected', {
        persona,
        sequence: fragments,
        elements: [...currentSequence],
    });

    currentSequence.forEach((el) => {
        el.classList.add('spw-delight');
    });

    const consoleSurface = document.querySelector('.spw-console');
    if (consoleSurface) {
        const msg = document.createElement('div');
        msg.className = 'console-log console-log--projection';
        msg.innerHTML = `<span class="log-op">^</span> [projection] `
            + `<span class="log-meta">${persona}</span> :: `
            + `<span class="log-node">${fragments}</span>`;
        consoleSurface.appendChild(msg);
        consoleSurface.scrollTop = consoleSurface.scrollHeight;
    }

    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
        timeoutId = 0;
        clearSequence('complete');
    }, CLEAR_DELAY_MS);
}

function clearSequence(_reason) {
    currentSequence.forEach((el) => {
        el.removeAttribute('data-spw-selection');
        el.classList.remove('spw-delight');
    });
    currentSequence = [];
}