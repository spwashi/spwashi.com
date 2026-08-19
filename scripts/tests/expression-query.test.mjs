import assert from 'node:assert/strict';
import test from 'node:test';

import {
  bestExpressionMatch,
  parseExpressionQuery,
  scoreExpressionShape,
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

test('wrap-job copy variants stay exclusive by depth', () => {
  const variants = formatWrapJobVariants({ wrap: 'mode', subject: 'home', seat: 'systems' });
  assert.equal(variants.entry, 'change view');
  assert.equal(variants.normal, '[systems] sit lens');
  assert.equal(variants.technical, 'home[systems]{open.sit}<display>');
});
