/**
 * Recipe Semantics
 *
 * Exposes structured data from recipe pages so an external agent can:
 *   1. Query principle cards and their progression order
 *   2. Read flavor grammar dimensions and current state
 *   3. Toggle between complexity levels (low/high context, low/high detail)
 *   4. Access weekly practice schedule as structured data
 *
 * This module is self-contained. Import and call initRecipeSemantics()
 * from site.js or load it as a feature module.
 *
 * Data contract:
 *   window.spwRecipes.principles    — ordered array of principle objects
 *   window.spwRecipes.flavors       — flavor dimension definitions
 *   window.spwRecipes.practice      — weekly practice schedule
 *   window.spwRecipes.recipes       — authored method and participation components
 *   window.spwRecipes.state         — current reading disclosure
 *   window.spwRecipes.setComplexity — toggle between 'low' | 'high' context
 *   window.spwRecipes.setDetail     — toggle between 'compact' | 'full' detail
 */

import { bus } from '/public/js/kernel/bus.js';

const COMPLEXITY_ATTR = 'data-spw-recipe-complexity';
const DETAIL_ATTR = 'data-spw-recipe-detail';

const REGISTERS = {
    principles: '#principle-register .frame-card',
    practice: '#weekly-practice .frame-card',
    flavors: '#composition-register .spw-panel, #composition-register .frame-card',
    recipes: '[data-spw-role="recipe"]',
};

const text = (el) => el?.textContent.trim().replace(/\s+/g, ' ') ?? '';
const read = (el, selector) => text(el.querySelector(selector));

// Share the component registry's vocabulary without inventing component IDs.
// The authored section and ordinal remain usable before inspection mounts.
function componentRecord(element, index) {
    const section = element.closest('.spw-frame[id]');
    const sectionId = section?.id ?? null;
    const anchor = element.id || sectionId;
    const source = anchor ? `${window.location.pathname}#${anchor}` : window.location.pathname;
    return {
        index,
        id: element.id || null,
        get componentId() { return element.dataset.spwComponentId || null; },
        get componentAddress() { return element.dataset.spwComponentAddress || null; },
        sectionId,
        source,
        kind: element.dataset.spwKind || (element.matches('.frame-card') ? 'card' : 'panel'),
        role: element.dataset.spwRole || '',
        expression: element.dataset.spwSemanticExpression || '',
        sectionExpression: section?.dataset.spwSemanticExpression || '',
        operator: element.dataset.spwOperator || '',
        brace: element.dataset.spwBrace || section?.dataset.spwBrace || '',
        cadence: element.dataset.spwCadence || section?.dataset.spwCadence || '',
        cadenceMotion: element.dataset.spwCadenceMotion || section?.dataset.spwCadenceMotion || '',
        title: read(element, 'h3, strong'),
        element,
    };
}

function parsePrinciples() {
    return Array.from(document.querySelectorAll(REGISTERS.principles), (card, index) => {
        const [step, phase] = read(card, '.spec-kicker').split('—').map(s => s.trim());
        return {
            ...componentRecord(card, index),
            step: Number.parseInt(step, 10) || index + 1,
            phase: phase || '',
            sigil: read(card, '.frame-card-sigil'),
            description: read(card, 'span:last-of-type'),
            href: card.getAttribute('href'),
        };
    });
}

function parsePractice() {
    return Array.from(document.querySelectorAll(REGISTERS.practice), (card, index) => {
        const [day, phase] = read(card, '.spec-kicker').split('—').map(s => s.trim());
        return {
            ...componentRecord(card, index),
            day: day || '',
            phase: phase || '',
            sigil: read(card, '.frame-card-sigil'),
            instruction: read(card, 'span:last-of-type'),
        };
    });
}

function parseFlavors() {
    return Array.from(document.querySelectorAll(REGISTERS.flavors), (panel, index) => {
        const component = componentRecord(panel, index);
        const [name, role] = component.title.split('—').map(s => s.trim());
        return {
            ...component,
            name,
            // Preserve the legacy flavor role without overwriting component role.
            dimensionRole: role || '',
            description: read(panel, 'p, span:last-of-type'),
        };
    });
}

function parseRecipes() {
    return Array.from(document.querySelectorAll(REGISTERS.recipes), (element, index) => ({
        ...componentRecord(element, index),
        sourceNote: read(element, ':scope > p:not(.spec-kicker)'),
        ingredients: Array.from(element.querySelectorAll('ol [data-spw-concept]'), (ingredient) => ({
            concept: ingredient.dataset.spwConcept,
            label: text(ingredient),
        })),
        method: Array.from(element.querySelectorAll(':scope > ol > li'), (step, i) => ({
            step: i + 1,
            title: read(step, 'strong'),
            instruction: text(step),
        })),
        participation: Array.from(element.querySelectorAll('.production-season-participation > div'), (group) => ({
            title: read(group, 'strong'),
            expression: group.dataset.spwSemanticExpression || '',
            instruction: read(group, 'p'),
        })),
    }));
}

export function initRecipeSemantics() {
    if (!document.querySelector('[data-spw-surface="recipes"]')) return;

    const root = document.documentElement;
    const previousApi = window.spwRecipes;
    const previousAttrs = new Map([COMPLEXITY_ATTR, DETAIL_ATTR].map(attr => [attr, root.getAttribute(attr)]));
    const concealed = new Map();
    const state = { complexity: 'high', detail: 'full' };

    function conceal(group, selector, hide) {
        if (!concealed.has(group)) concealed.set(group, new Map());
        const originals = concealed.get(group);
        if (hide) {
            document.querySelectorAll(selector).forEach(el => {
                if (!originals.has(el)) originals.set(el, el.hidden);
                el.hidden = true;
            });
        } else {
            originals.forEach((hidden, el) => { el.hidden = hidden; });
            originals.clear();
        }
    }

    function setComplexity(level) {
        if (!['low', 'high'].includes(level)) throw new RangeError('Recipe complexity must be low or high');
        state.complexity = level;
        conceal('complexity', '#composition-register .spec-grid', level === 'low');
        root.setAttribute(COMPLEXITY_ATTR, level);
        bus.emit('recipe:complexity', { level });
    }

    function setDetail(level) {
        if (!['compact', 'full'].includes(level)) throw new RangeError('Recipe detail must be compact or full');
        state.detail = level;
        // Scope disclosure to exported registers; never replace authored nodes.
        conceal('detail', '#principle-register .frame-card > span:last-of-type, #weekly-practice .frame-card > span:last-of-type, #principle-register .spec-kicker, #weekly-practice .spec-kicker, #composition-register .spw-panel > p', level === 'compact');
        root.setAttribute(DETAIL_ATTR, level);
        bus.emit('recipe:detail', { level });
    }

    const api = {
        version: '2.0',
        get principles() { return parsePrinciples(); },
        get practice() { return parsePractice(); },
        get flavors() { return parseFlavors(); },
        get recipes() { return parseRecipes(); },
        get state() { return { ...state }; },
        setComplexity,
        setDetail,
        byPhase: phase => api.principles.find(p => p.phase === phase),
        today: (date = new Date()) => {
            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            return api.practice.find(p => p.day.toLowerCase() === days[date.getDay()]);
        },
        toJSON: () => {
            const portable = records => records.map(({ element, ...record }) => record);
            return {
                version: api.version,
                state: api.state,
                principles: portable(api.principles),
                practice: portable(api.practice),
                flavors: portable(api.flavors),
                recipes: portable(api.recipes),
            };
        },
    };
    window.spwRecipes = api;
    root.setAttribute(COMPLEXITY_ATTR, state.complexity);
    root.setAttribute(DETAIL_ATTR, state.detail);

    return {
        cleanup() {
            // A newer mount owns its own state and must not be torn down here.
            if (window.spwRecipes !== api) return;
            concealed.forEach(originals => originals.forEach((hidden, el) => { el.hidden = hidden; }));
            previousAttrs.forEach((value, attr) => {
                if (value === null) root.removeAttribute(attr);
                else root.setAttribute(attr, value);
            });
            if (previousApi === undefined) delete window.spwRecipes;
            else window.spwRecipes = previousApi;
        },
    };
}
