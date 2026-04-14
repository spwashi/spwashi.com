/**
 * Spw Topic Discovery
 *
 * Interactivity layer for topic exploration across pages.
 * Makes `.spw-topic` and `[data-spw-topic]` elements into discoverable,
 * navigable references that an agent or reader can traverse.
 *
 * Interactions:
 *   click      — highlight all matching topics on the page, cycle between them
 *   long-press — show context popover (where else this topic appears, operator context)
 *   swipe      — on .spec-pill / .operator-chip badges, cycle through related concepts
 *
 * Bus events emitted:
 *   topic:selected   { text, count, elements }
 *   topic:navigated  { text, index, element }
 *   topic:cleared    {}
 *   topic:context    { text, occurrences, operatorContext }
 *
 * Exports:
 *   window.spwTopics.select(text)    — programmatic selection
 *   window.spwTopics.clear()         — clear all highlights
 *   window.spwTopics.index()         — structured map of all topics on page
 */

import { bus } from './spw-bus.js';

const TOPIC_SELECTOR = '.spw-topic, [data-spw-topic]';
const BADGE_SELECTOR = '.spec-pill, .operator-chip';
const HIGHLIGHT_CLASS = 'spw-topic--highlighted';
const ACTIVE_CLASS = 'spw-topic--active';
const POPOVER_CLASS = 'spw-topic-popover';
const LONG_PRESS_MS = 480;

let activeTopic = null;
let activeMatches = [];
let activeIndex = -1;
let longPressTimer = null;
let popoverEl = null;

function getTopicText(el) {
    // Strip the pseudo-element content (< >) from the visible text
    return (el.dataset.spwTopic || el.textContent || '').trim().toLowerCase();
}

function getAllTopics() {
    return Array.from(document.querySelectorAll(TOPIC_SELECTOR));
}

function buildIndex() {
    const map = new Map();
    getAllTopics().forEach(el => {
        const text = getTopicText(el);
        if (!text) return;
        if (!map.has(text)) map.set(text, []);
        map.get(text).push({
            element: el,
            operator: el.closest('[data-spw-operator]')?.dataset.spwOperator ?? '',
            brace: el.closest('[data-spw-brace]')?.dataset.spwBrace ?? '',
            section: el.closest('.site-frame')?.id ?? '',
            sigil: el.closest('.site-frame')?.querySelector('.frame-sigil')?.textContent.trim() ?? ''
        });
    });
    return map;
}

function clearHighlights() {
    document.querySelectorAll(`.${HIGHLIGHT_CLASS}, .${ACTIVE_CLASS}`).forEach(el => {
        el.classList.remove(HIGHLIGHT_CLASS, ACTIVE_CLASS);
    });
    activeTopic = null;
    activeMatches = [];
    activeIndex = -1;
    dismissPopover();
    bus.emit('topic:cleared', {});
}

function selectTopic(text) {
    const normalized = text.trim().toLowerCase();
    if (!normalized) return;

    clearHighlights();
    activeTopic = normalized;

    const all = getAllTopics();
    activeMatches = all.filter(el => getTopicText(el) === normalized);

    if (!activeMatches.length) return;

    activeMatches.forEach(el => el.classList.add(HIGHLIGHT_CLASS));
    activeIndex = 0;
    activeMatches[0].classList.add(ACTIVE_CLASS);

    bus.emit('topic:selected', {
        text: normalized,
        count: activeMatches.length,
        elements: activeMatches
    });
}

function navigateToIndex(idx) {
    if (!activeMatches.length) return;

    activeMatches.forEach(el => el.classList.remove(ACTIVE_CLASS));
    activeIndex = ((idx % activeMatches.length) + activeMatches.length) % activeMatches.length;
    const target = activeMatches[activeIndex];
    target.classList.add(ACTIVE_CLASS);

    // Smooth scroll into view with offset for header
    const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 64;
    const rect = target.getBoundingClientRect();
    const inView = rect.top > headerH && rect.bottom < window.innerHeight;
    if (!inView) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    bus.emit('topic:navigated', {
        text: activeTopic,
        index: activeIndex,
        total: activeMatches.length,
        element: target
    });
}

function navigateNext() { navigateToIndex(activeIndex + 1); }
function navigatePrev() { navigateToIndex(activeIndex - 1); }

// ── Popover for long-press context ─────────────────────────────────────────

function dismissPopover() {
    if (popoverEl) {
        popoverEl.classList.remove('is-visible');
        popoverEl.addEventListener('transitionend', () => popoverEl?.remove(), { once: true });
        setTimeout(() => popoverEl?.remove(), 300);
        popoverEl = null;
    }
}

function showPopover(el) {
    dismissPopover();

    const text = getTopicText(el);
    const index = buildIndex();
    const occurrences = index.get(text) ?? [];

    popoverEl = document.createElement('div');
    popoverEl.className = POPOVER_CLASS;
    popoverEl.setAttribute('role', 'tooltip');

    const sections = occurrences
        .map(o => o.section)
        .filter(Boolean);
    const uniqueSections = [...new Set(sections)];
    const operators = [...new Set(occurrences.map(o => o.operator).filter(Boolean))];

    let html = `<div class="spw-topic-popover-header">
        <span class="spw-topic-popover-sigil">&lt;${text}&gt;</span>
        <span class="spw-topic-popover-count">${occurrences.length} occurrence${occurrences.length !== 1 ? 's' : ''}</span>
    </div>`;

    if (uniqueSections.length > 1) {
        html += `<div class="spw-topic-popover-sections">`;
        uniqueSections.forEach(id => {
            const heading = document.querySelector(`#${CSS.escape(id)} h1, #${CSS.escape(id)} h2`)?.textContent.trim() ?? id;
            html += `<a class="spw-topic-popover-link" href="#${id}">${heading}</a>`;
        });
        html += `</div>`;
    }

    if (operators.length) {
        html += `<div class="spw-topic-popover-operators">`;
        operators.forEach(op => {
            html += `<span class="spw-topic-popover-op" data-spw-operator="${op}">${op}</span>`;
        });
        html += `</div>`;
    }

    popoverEl.innerHTML = html;
    document.body.appendChild(popoverEl);

    // Position near the element
    const rect = el.getBoundingClientRect();
    const popRect = popoverEl.getBoundingClientRect();
    let top = rect.bottom + 8;
    let left = rect.left + rect.width / 2 - popRect.width / 2;

    // Keep in viewport
    left = Math.max(8, Math.min(left, window.innerWidth - popRect.width - 8));
    if (top + popRect.height > window.innerHeight - 8) {
        top = rect.top - popRect.height - 8;
    }

    popoverEl.style.top = `${top + window.scrollY}px`;
    popoverEl.style.left = `${left}px`;

    requestAnimationFrame(() => popoverEl?.classList.add('is-visible'));

    // Links inside popover navigate and dismiss
    popoverEl.querySelectorAll('.spw-topic-popover-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const id = link.getAttribute('href')?.slice(1);
            if (id) {
                document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            dismissPopover();
        });
    });

    bus.emit('topic:context', {
        text,
        occurrences: occurrences.map(({ element, ...rest }) => rest),
        operatorContext: operators
    });
}

// ── Badge swipe ────────────────────────────────────────────────────────────

function initBadgeSwipe() {
    let startX = 0;
    let startY = 0;
    let swiping = null;

    const badgeContainers = document.querySelectorAll('.spec-strip, .frame-operators');

    badgeContainers.forEach(container => {
        container.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            swiping = container;
        }, { passive: true });

        container.addEventListener('touchend', (e) => {
            if (swiping !== container) return;
            const touch = e.changedTouches[0];
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;

            // Only horizontal swipes
            if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 2) {
                const badges = Array.from(container.querySelectorAll(BADGE_SELECTOR));
                const currentActive = container.querySelector('.is-badge-active');
                let idx = badges.indexOf(currentActive);

                if (idx === -1) idx = dx > 0 ? 0 : badges.length - 1;
                else {
                    badges[idx]?.classList.remove('is-badge-active');
                    idx = dx > 0
                        ? Math.min(idx + 1, badges.length - 1)
                        : Math.max(idx - 1, 0);
                }

                const next = badges[idx];
                if (next) {
                    next.classList.add('is-badge-active');
                    // If the badge has a topic, select it
                    const topicText = next.textContent.trim().toLowerCase();
                    selectTopic(topicText);
                }
            }

            swiping = null;
        }, { passive: true });
    });
}

// ── Event wiring ───────────────────────────────────────────────────────────

function initClickHandler() {
    document.addEventListener('click', (e) => {
        const topic = e.target.closest(TOPIC_SELECTOR);
        if (!topic) {
            // Click outside topics clears selection
            if (activeTopic && !e.target.closest(`.${POPOVER_CLASS}`)) {
                clearHighlights();
            }
            return;
        }

        e.preventDefault();
        const text = getTopicText(topic);

        if (text === activeTopic) {
            // Already selected: cycle to next
            navigateNext();
        } else {
            selectTopic(text);
        }
    });
}

function initLongPress() {
    let pressTarget = null;

    const startPress = (el) => {
        pressTarget = el;
        clearTimeout(longPressTimer);
        longPressTimer = setTimeout(() => {
            if (pressTarget === el) {
                showPopover(el);
                pressTarget = null;
            }
        }, LONG_PRESS_MS);
    };

    const cancelPress = () => {
        clearTimeout(longPressTimer);
        pressTarget = null;
    };

    document.addEventListener('pointerdown', (e) => {
        const topic = e.target.closest(TOPIC_SELECTOR);
        if (topic) startPress(topic);
    });

    document.addEventListener('pointerup', cancelPress);
    document.addEventListener('pointercancel', cancelPress);
    document.addEventListener('pointermove', (e) => {
        if (pressTarget && e.movementX ** 2 + e.movementY ** 2 > 100) {
            cancelPress();
        }
    });
}

function initKeyboardNav() {
    document.addEventListener('keydown', (e) => {
        if (!activeTopic) return;
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.key === 'Escape') {
            clearHighlights();
            e.preventDefault();
        } else if (e.key === 'n' && !e.metaKey && !e.ctrlKey) {
            navigateNext();
            e.preventDefault();
        } else if (e.key === 'p' && !e.metaKey && !e.ctrlKey) {
            navigatePrev();
            e.preventDefault();
        }
    });
}

// ── Public API & init ──────────────────────────────────────────────────────

export function initTopicDiscovery() {
    initClickHandler();
    initLongPress();
    initKeyboardNav();
    initBadgeSwipe();

    window.spwTopics = {
        select: selectTopic,
        clear: clearHighlights,
        next: navigateNext,
        prev: navigatePrev,
        index: () => {
            const raw = buildIndex();
            const result = {};
            raw.forEach((occurrences, text) => {
                result[text] = occurrences.map(({ element, ...rest }) => rest);
            });
            return result;
        },
        active: () => ({
            topic: activeTopic,
            index: activeIndex,
            total: activeMatches.length
        })
    };
}
