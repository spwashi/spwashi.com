import assert from 'node:assert/strict';
import test from 'node:test';

import { MODULE_DEFS } from '../../public/js/runtime/module-catalog.js';
import { listModuleCatalogIndex } from '../../public/js/runtime/module-catalog-normalize.js';
import {
  parseModuleDescribes,
} from '../../public/js/runtime/module-describes-contract.js';

test('catalog hosts use current public nouns without compatibility aliases', () => {
  for (const def of MODULE_DEFS) {
    assert.doesNotMatch(def.selector || '', /\.(?:site-frame|operator-chip)\b/, def.id);
  }
  for (const id of ['frame-navigator', 'variant-selection', 'navigation-spells']) {
    const def = MODULE_DEFS.find((entry) => entry.id === id);
    assert.match(def.selector, /\.spw-(?:frame|chip)\b/, id);
  }
});

test('describes dialect splits expression clauses from trailing gloss', () => {
  const expression = parseModuleDescribes(
    'cauldron[gather|mix|garden] force[operator] emergence[composition]',
  );
  assert.equal(expression.grade, 'expression');
  assert.deepEqual(expression.subjects, ['cauldron', 'force', 'emergence']);
  assert.deepEqual(expression.modes, ['gather|mix|garden', 'operator', 'composition']);
  assert.equal(expression.gloss, '');
  assert.equal(expression.spell, expression.raw);

  const mixed = parseModuleDescribes(
    'sigil[anatomy]{hydrate.split} raw fused text -> operand elements',
  );
  assert.equal(mixed.grade, 'mixed');
  assert.deepEqual(mixed.subjects, ['sigil']);
  assert.deepEqual(mixed.directions, ['hydrate.split']);
  assert.equal(mixed.expression, 'sigil[anatomy]{hydrate.split}');
  assert.equal(mixed.gloss, 'raw fused text -> operand elements');

  const prose = parseModuleDescribes(
    'page-wide layout stability observer with explicit cleanup of PerformanceObserver state',
  );
  assert.equal(prose.grade, 'prose');
  assert.deepEqual(prose.subjects, []);
  assert.equal(prose.spell, prose.raw);
});

test('catalog index groups modules by describes subject', () => {
  const index = listModuleCatalogIndex(MODULE_DEFS);
  assert.ok(index.byDescribesSubject.cauldron?.includes('cauldron'));
  assert.ok(index.byDescribesGrade.expression?.length);
  const cauldron = index.modules.find((row) => row.id === 'cauldron');
  assert.equal(cauldron.describesGrade, 'expression');
  assert.ok(cauldron.describesSubjects.includes('cauldron'));
});

test('catalog describes stay mostly expression or mixed, not prose comments', () => {
  const grades = MODULE_DEFS.map((def) => parseModuleDescribes(def.describes).grade);
  const prose = grades.filter((grade) => grade === 'prose').length;
  const named = grades.filter((grade) => grade === 'expression' || grade === 'mixed').length;
  assert.ok(named > prose, `expected named describes (${named}) to outnumber prose (${prose})`);
});
