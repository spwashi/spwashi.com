import test from 'node:test';
import assert from 'node:assert/strict';
import { SLOT_WALLS, expressionText, slotSummary, stepChoice } from '../../public/js/interface/spw-expression.js';
import { crumbLabel, crumbPlace } from '../../public/js/runtime/attention/rail-crumb.js';

const sections = [
  { value: 'home_frame', label: "I'm Spwashi." },
  { value: 'home_folios', label: 'The October drop, and the studio' },
  { value: 'entrance_sorter', label: 'Pick your door' },
];

test('a slot steps to its neighbour, and an edge is an edge', () => {
  assert.equal(stepChoice(sections, 'home_folios', 1).value, 'entrance_sorter');
  assert.equal(stepChoice(sections, 'home_folios', -1).value, 'home_frame');
  assert.equal(stepChoice(sections, 'entrance_sorter', 1), null);
  assert.equal(stepChoice(sections, 'home_frame', -1), null);
  // A value not among the choices steps from the first.
  assert.equal(stepChoice(sections, 'gone', 1).value, 'home_folios');
  assert.equal(stepChoice([], 'x', 1), null);
});

test('the expression reads as one line of Spw, each slot in its walls', () => {
  const model = { operator: '#>', slots: [{ name: 'subject', value: 'home' }, { name: 'mode', value: 'reading' }, { name: 'body', value: 'home_folios' }] };
  assert.equal(expressionText(model), '#>home[reading]{home_folios}');
  assert.deepEqual(Object.keys(SLOT_WALLS), ['subject', 'mode', 'scene', 'body', 'projection']);
  assert.equal(expressionText({ slots: [{ name: 'subject', value: 'you' }, { name: 'projection', value: 'guide' }] }), 'you<guide>');
});

test('a slot says its name, its value, what the value is, and where it stands', () => {
  assert.equal(slotSummary({ name: 'body', value: 'home_folios', choices: sections }), 'Section: home_folios (The October drop, and the studio), 2 of 3');
  assert.equal(slotSummary({ name: 'mode', value: 'reading', choices: [{ value: 'reading', label: 'reading' }] }), 'Lens: reading, 1 of 1');
  assert.equal(slotSummary({ name: 'subject', value: '', choices: [] }), 'Page: none');
});

test('the crumb names a place by its sigil and its heading', () => {
  const handle = (value) => value.replace(/-/g, '_');
  assert.deepEqual(crumbPlace({ token: '*folio_stack', label: 'The October drop, and the studio', id: 'home-folios' }, 'home', handle),
    { route: '#>home', token: '*folio_stack', label: 'The October drop, and the studio' });
  // A bare operator takes the section's handle; a label that is itself a sigil gives way to the heading.
  assert.deepEqual(crumbPlace({ token: '#>', label: '#>home_frame', id: 'home-frame' }, 'home', handle, "I'm Spwashi."),
    { route: '#>home', token: '#>home_frame', label: "I'm Spwashi." });
  assert.equal(crumbPlace({}, '', handle).label, 'this section');
  assert.equal(crumbLabel({ token: '*folio_stack', label: 'The October drop' }, 1, 17, true), 'The October drop, *folio_stack, section 2 of 17. Show the moves');
});
