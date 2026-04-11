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
 *   window.spwRecipes.setComplexity — toggle between 'low' | 'high' context
 *   window.spwRecipes.setDetail     — toggle between 'compact' | 'full' detail
 */

import { bus } from './spw-bus.js';

const COMPLEXITY_ATTR = 'data-spw-recipe-complexity';
const DETAIL_ATTR = 'data-spw-recipe-detail';

function parsePrinciples() {
    const cards = Array.from(
        document.querySelectorAll('#principle-register .frame-card')
    );
    return cards.map((card, i) => {
        const sigil = card.querySelector('.frame-card-sigil')?.textContent.trim() ?? '';
        const title = card.querySelector('strong')?.textContent.trim() ?? '';
        const description = card.querySelector('span:last-of-type')?.textContent.trim() ?? '';
        const kicker = card.querySelector('.spec-kicker')?.textContent.trim() ?? '';
        const operator = card.dataset.spwOperator ?? '';
        const brace = card.dataset.spwBrace ?? '';
        const href = card.getAttribute('href') ?? null;
        const [stepNum, phase] = kicker.split('—').map(s => s.trim());
        return {
            index: i,
            step: parseInt(stepNum) || i + 1,
            phase: phase || '',
            sigil,
            title,
            description,
            operator,
            brace,
            href,
            element: card
        };
    });
}

function parsePractice() {
    const cards = Array.from(
        document.querySelectorAll('#weekly-practice .frame-card')
    );
    return cards.map(card => {
        const kicker = card.querySelector('.spec-kicker')?.textContent.trim() ?? '';
        const [day, phase] = kicker.split('—').map(s => s.trim());
        return {
            day: day || '',
            phase: phase || '',
            sigil: card.querySelector('.frame-card-sigil')?.textContent.trim() ?? '',
            title: card.querySelector('strong')?.textContent.trim() ?? '',
            instruction: card.querySelector('span:last-of-type')?.textContent.trim() ?? '',
            operator: card.dataset.spwOperator ?? '',
            element: card
        };
    });
}

function parseFlavors() {
    const panels = Array.from(
        document.querySelectorAll('#flavor-grammar .frame-panel')
    );
    const cards = Array.from(
        document.querySelectorAll('#flavor-grammar .frame-card')
    );
    return [...panels, ...cards].map(el => {
        const title = el.querySelector('h3, strong')?.textContent.trim() ?? '';
        const [name, role] = title.split('—').map(s => s.trim());
        return {
            name: name || title,
            role: role || '',
            description: el.querySelector('p, span:last-of-type')?.textContent.trim() ?? '',
            brace: el.dataset.spwBrace ?? '',
            operator: el.dataset.spwOperator ?? '',
            element: el
        };
    });
}

function setComplexity(level) {
    const root = document.documentElement;
    root.setAttribute(COMPLEXITY_ATTR, level);
    bus.emit('recipe:complexity', { level });

    // Low context: hide substrate linguistics, flavor grammar details
    // High context: show everything
    const contextSections = document.querySelectorAll(
        '#substrate-linguistics, #flavor-grammar .spec-grid'
    );
    contextSections.forEach(el => {
        el.style.display = level === 'low' ? 'none' : '';
    });
}

function setDetail(level) {
    const root = document.documentElement;
    root.setAttribute(DETAIL_ATTR, level);
    bus.emit('recipe:detail', { level });

    // Compact: truncate descriptions, hide kickers
    // Full: show everything
    const descriptions = document.querySelectorAll(
        '.frame-card span:last-of-type, .frame-panel p'
    );
    const kickers = document.querySelectorAll('.spec-kicker');

    if (level === 'compact') {
        descriptions.forEach(el => {
            if (!el.dataset.fullText) el.dataset.fullText = el.textContent;
            const words = el.textContent.split(' ');
            if (words.length > 12) {
                el.textContent = words.slice(0, 12).join(' ') + '…';
            }
        });
        kickers.forEach(el => el.style.display = 'none');
    } else {
        descriptions.forEach(el => {
            if (el.dataset.fullText) {
                el.textContent = el.dataset.fullText;
                delete el.dataset.fullText;
            }
        });
        kickers.forEach(el => el.style.display = '');
    }
}

export function initRecipeSemantics() {
    if (!document.querySelector('[data-spw-surface="recipes"]')) return;

    const principles = parsePrinciples();
    const practice = parsePractice();
    const flavors = parseFlavors();

    window.spwRecipes = {
        principles,
        practice,
        flavors,
        setComplexity,
        setDetail,
        // Convenience: get principle by phase name
        byPhase: (phase) => principles.find(p => p.phase === phase),
        // Convenience: get today's practice
        today: () => {
            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const today = days[new Date().getDay()];
            return practice.find(p => p.day.toLowerCase() === today);
        },
        // Structured JSON export for agent handoff
        toJSON: () => ({
            principles: principles.map(({ element, ...rest }) => rest),
            practice: practice.map(({ element, ...rest }) => rest),
            flavors: flavors.map(({ element, ...rest }) => rest)
        })
    };

    // Set defaults
    document.documentElement.setAttribute(COMPLEXITY_ATTR, 'high');
    document.documentElement.setAttribute(DETAIL_ATTR, 'full');
}
