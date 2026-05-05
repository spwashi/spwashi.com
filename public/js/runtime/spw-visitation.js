/**
 * Spw Visitation
 *
 * Restores the runtime hook that summarizes visited image surfaces and exposes
 * lightweight page-level visitation metadata for CSS and downstream helpers.
 */

import { bus } from '/public/js/kernel/spw-bus.js';

const VISITED_KEY = 'spw-visited-image-surfaces';

const safeParse = (value, fallback) => {
    try {
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
};

function readVisitedMap() {
    return safeParse(localStorage.getItem(VISITED_KEY), {});
}

function applyVisitationState() {
    const map = readVisitedMap();
    const entries = Object.values(map);
    const page = window.location.pathname;
    const pageCount = entries.filter((entry) => Array.isArray(entry?.pages) && entry.pages.includes(page)).length;

    document.documentElement.dataset.spwVisitedSurfaceCount = String(entries.length);
    document.body.dataset.spwVisitedSurfaceCount = String(entries.length);

    if (pageCount > 0) {
        document.documentElement.dataset.spwVisitedOnPage = 'true';
        document.body.dataset.spwVisitedOnPage = 'true';
    } else {
        delete document.documentElement.dataset.spwVisitedOnPage;
        delete document.body.dataset.spwVisitedOnPage;
    }

    bus.emit('visitation:updated', {
        count: entries.length,
        page,
        pageCount,
    });
}

export function initSpwVisitation() {
    applyVisitationState();

    bus.on('image:visited', () => {
        applyVisitationState();
    });

    window.addEventListener('storage', (event) => {
        if (event.key !== VISITED_KEY) return;
        applyVisitationState();
    });
}
