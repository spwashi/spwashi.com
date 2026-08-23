import assert from 'node:assert/strict';
import test from 'node:test';

import {
  bestExpressionMatch,
  parseExpressionQuery,
  readJoinChain,
  readSpwHydration,
  scoreExpressionShape,
  PRECIPITATES,
} from '../../public/js/semantic/expression-query.js';
import { formatWrapJobVariants } from '../../public/js/semantic/spw-compose.js';

test('partial wraps name slots without requiring a full expression', () => {
  assert.deepEqual(parseExpressionQuery('[reading]').mode, 'reading');
  assert.equal(parseExpressionQuery('[reading]').hasModeSlot, true);
  assert.equal(parseExpressionQuery('home[').subject, 'home');
  assert.equal(parseExpressionQuery('home[').hasModeSlot, true);
  assert.deepEqual(parseExpressionQuery('{open.sit}').parts, ['open', 'sit']);
  assert.equal(parseExpressionQuery('<display>').projection, 'display');
  assert.deepEqual(parseExpressionQuery('craft').freeTokens, ['craft']);
});

test('slot scores prefer subject and mode over a free token', () => {
  const homeReading = { subject: 'home', mode: 'reading', parts: ['open', 'sit'], projection: 'display' };
  const rooms = { subject: 'rooms', mode: '', parts: ['prev', 'next'], projection: 'navigate' };
  assert.ok(
    scoreExpressionShape(homeReading, parseExpressionQuery('[reading]'))
    > scoreExpressionShape(rooms, parseExpressionQuery('[reading]')),
  );
  assert.ok(scoreExpressionShape(homeReading, parseExpressionQuery('home[')) >= 5);
  assert.ok(scoreExpressionShape(homeReading, parseExpressionQuery('{open}')) >= 3);
  assert.equal(
    scoreExpressionShape(
      { subject: 'reading', mode: '', parts: ['kin'], projection: 'learn' },
      parseExpressionQuery('{kin}'),
    ) >= 3,
    true,
  );
});

test('best match returns the strongest authored expression', () => {
  const expressions = [
    'home[reading]{open.sit}<display>',
    'rooms{travel}<navigate>',
    'about[reading]{person.narrative.return}',
  ];
  assert.equal(bestExpressionMatch(expressions, '[reading]').expression, 'home[reading]{open.sit}<display>');
  assert.equal(bestExpressionMatch(expressions, '{travel}').expression, 'rooms{travel}<navigate>');
  assert.equal(bestExpressionMatch(expressions, 'zzz'), null);
});

test('runtime parser uses parse() and reports join kind', async () => {
  const { parseSpw } = await import('../../public/js/semantic/spw-runtime-parser.js');
  const crawl = parseSpw('{mill}.{laminate}.{cure}');
  assert.equal(crawl.entry, 'parse');
  assert.equal(crawl.join.kind, 'crawl');
  assert.deepEqual(crawl.join.parts, ['mill', 'laminate', 'cure']);
  assert.equal(crawl.output.success, true);
  const list = parseSpw('board[workshop]{mill.laminate.cure}');
  assert.equal(list.join.kind, 'list');
  assert.equal(list.output.success, true);
});

test('hydration reads one host into motion, cauldron, and material precipitates', () => {
  const host = {
    dataset: {
      spwSemanticExpression: 'bin[feedstock]{cullet,grog,fiber}',
      spwJoin: 'common',
      spwConcept: 'cullet',
      spwCharge: 'charged',
      spwVerticalGravity: 'falls',
      spwEdgeGravity: 'bottom',
      spwGravity: 'open',
    },
    closest(sel) {
      if (String(sel).includes('data-spw-')) return this;
      return null;
    },
  };
  const hydration = readSpwHydration(host);
  assert.equal(hydration.expression, 'bin[feedstock]{cullet,grog,fiber}');
  assert.equal(hydration.join, 'common');
  assert.equal(hydration.gravity.vertical, 'falls');
  assert.equal(hydration.charge, 'charged');
  assert.equal(hydration.precipitates[PRECIPITATES.cauldron], true);
  assert.equal(hydration.precipitates[PRECIPITATES.motion], true);
  assert.equal(hydration.precipitates[PRECIPITATES.material], true);
});

test('join chains tell list, crawl, common, and project apart', () => {
  assert.deepEqual(readJoinChain('{mill.laminate.cure}'), {
    kind: 'list',
    parts: ['mill', 'laminate', 'cure'],
    raw: '{mill.laminate.cure}',
  });
  assert.deepEqual(readJoinChain('{mill}.{laminate}.{cure}'), {
    kind: 'crawl',
    parts: ['mill', 'laminate', 'cure'],
    raw: '{mill}.{laminate}.{cure}',
  });
  assert.deepEqual(readJoinChain('{cullet,grog,fiber}'), {
    kind: 'common',
    parts: ['cullet', 'grog', 'fiber'],
    raw: '{cullet,grog,fiber}',
  });
  assert.deepEqual(readJoinChain('scrap ~> mill ~> temper'), {
    kind: 'project',
    parts: ['scrap', 'mill', 'temper'],
    raw: 'scrap ~> mill ~> temper',
  });
  assert.equal(parseExpressionQuery('{open.sit}').join, 'list');
  assert.deepEqual(parseExpressionQuery('{soak,cook,serve}').parts, ['soak', 'cook', 'serve']);
});

test('wrap-job copy variants stay exclusive by depth', () => {
  const variants = formatWrapJobVariants({ wrap: 'mode', subject: 'home', seat: 'systems' });
  assert.equal(variants.entry, 'change view');
  assert.equal(variants.normal, '[systems] sit lens');
  assert.equal(variants.technical, 'home[systems]{open.sit}<display>');
});
