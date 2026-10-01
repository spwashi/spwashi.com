import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { initRecipeSemantics } from '../../public/js/semantic/recipe-semantics.js';
import { indexHtmlElements, matchSelector } from '../lib/module-selector-audit.mjs';

function fixture() {
    const attrs = new Map();
    const root = {
        getAttribute: key => attrs.get(key) ?? null,
        setAttribute: (key, value) => attrs.set(key, value),
        removeAttribute: key => attrs.delete(key),
    };
    const section = { id: 'weekly-practice', dataset: { spwBrace: 'objective' } };
    const supporting = { hidden: false, innerHTML: '<a href="/recipes/">Keep the link</a>' };
    const alreadyHidden = { hidden: true };
    const grid = { hidden: false };
    const card = {
        id: '', dataset: { spwOperator: 'action' },
        closest: () => section,
        matches: selector => selector === '.frame-card',
        getAttribute: () => null,
        querySelector: selector => ({ textContent: ({
            '.spec-kicker': 'wednesday — tune',
            '.frame-card-sigil': '@season',
            'h3, strong': 'Adjust in layers',
            'span:last-of-type': 'Season in stages.',
        })[selector] ?? '' }),
    };
    const doc = {
        documentElement: root,
        dispatchEvent: () => true,
        addEventListener() {},
        removeEventListener() {},
        querySelector: () => ({}),
        querySelectorAll(selector) {
            if (selector === '#weekly-practice .frame-card') return [card];
            if (selector === '#composition-register .spec-grid') return [grid];
            if (selector.includes('#principle-register .frame-card >')) return [supporting, alreadyHidden];
            return [];
        },
    };
    return { doc, card, supporting, alreadyHidden, grid, root };
}

function withFixture(run) {
    const oldDocument = globalThis.document;
    const oldWindow = globalThis.window;
    const f = fixture();
    globalThis.document = f.doc;
    globalThis.window = { location: { pathname: '/recipes/' } };
    try { run(f); }
    finally { globalThis.document = oldDocument; globalThis.window = oldWindow; }
}

test('recipe handoff follows current component identity and preserves day practice', () => withFixture(({ card }) => {
    const handle = initRecipeSemantics();
    const api = window.spwRecipes;
    assert.equal(api.today(new Date(2026, 8, 30)).title, 'Adjust in layers');
    assert.equal(api.practice[0].source, '/recipes/#weekly-practice');
    assert.equal(api.practice[0].componentId, null);
    card.dataset.spwComponentId = 'practice-adjust';
    card.dataset.spwComponentAddress = 'recipes/practice-adjust';
    card.dataset.spwSemanticExpression = 'season[practice]{tune}';
    const record = api.toJSON().practice[0];
    assert.equal(record.componentId, 'practice-adjust');
    assert.equal(record.componentAddress, 'recipes/practice-adjust');
    assert.equal(record.expression, 'season[practice]{tune}');
    assert.equal(record.brace, 'objective');
    assert.ok(!('element' in record));
    assert.doesNotThrow(() => JSON.stringify(api));
    handle.cleanup();
    assert.equal(window.spwRecipes, undefined);
}));

test('disclosure preserves markup, authored hidden state, and complete exports', () => withFixture(f => {
    f.root.setAttribute('data-spw-recipe-detail', 'prior');
    const handle = initRecipeSemantics();
    const api = window.spwRecipes;
    api.setDetail('compact');
    api.setComplexity('low');
    assert.equal(f.supporting.hidden, true);
    assert.equal(f.grid.hidden, true);
    assert.deepEqual(api.toJSON().state, { detail: 'compact', complexity: 'low' });
    assert.equal(api.toJSON().practice[0].instruction, 'Season in stages.');
    api.setDetail('full');
    assert.equal(f.supporting.hidden, false);
    assert.equal(f.alreadyHidden.hidden, true);
    assert.equal(f.supporting.innerHTML, '<a href="/recipes/">Keep the link</a>');
    assert.throws(() => api.setDetail('unknown'), RangeError);
    api.setDetail('compact');
    handle.cleanup();
    assert.equal(f.supporting.hidden, false);
    assert.equal(f.grid.hidden, false);
    assert.equal(f.root.getAttribute('data-spw-recipe-detail'), 'prior');
    assert.equal(f.root.getAttribute('data-spw-recipe-complexity'), null);
}));

test('authored recipe hosts include eight principles, seven practices, six dimensions and a recipe', () => {
    const elements = indexHtmlElements(readFileSync(new URL('../../recipes/index.html', import.meta.url), 'utf8'));
    for (const [selector, count] of [
        ['#principle-register .frame-card', 8],
        ['#weekly-practice .frame-card', 7],
        ['#composition-register .spw-panel', 6],
        ['[data-spw-role="recipe"]', 1],
    ]) assert.equal(matchSelector(elements, selector).length, count, selector);
});
