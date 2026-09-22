import assert from 'node:assert/strict';
import test from 'node:test';

import { composeExpression, projectTablePhysics } from '../../public/js/modules/rpg-wednesday/table-physics.js';

test('an empty script keeps every physics slot null', () => {
    const physics = projectTablePhysics('', {});
    assert.equal(physics.subject, null);
    assert.equal(physics.mode, null);
    assert.equal(physics.parts, null);
    assert.equal(physics.projection, null);
    assert.equal(physics.segments, null);
    assert.equal(physics.gravity, null);
    assert.equal(physics.hue, null);
    assert.deepEqual(physics.fallbacks, ['subject', 'mode', 'parts', 'projection', 'density']);
});

test('a table script sizes the clock and weights it by density', () => {
    const physics = projectTablePhysics('clock[table]{fill.turn.weight}<stage>', { density: 'rich' });
    assert.equal(physics.subject, 'clock');
    assert.equal(physics.mode, 'table');
    assert.deepEqual(physics.parts, ['fill', 'turn', 'weight']);
    assert.equal(physics.projection, 'stage');
    assert.equal(physics.segments, 3);
    assert.equal(physics.gravity, 4.05);
    assert.equal(physics.hue, projectTablePhysics('clock', {}).hue);
    assert.equal(physics.fallbacks.includes('density'), false);
});

test('missing density still yields a clock size and names the fallback', () => {
    const physics = projectTablePhysics('clock[table]{fill.turn}', {});
    assert.equal(physics.segments, 2);
    assert.equal(physics.gravity, 2);
    assert.equal(physics.fallbacks.includes('density'), true);
    assert.equal(physics.fallbacks.includes('projection'), true);
});

test('editing the tree writes a line and an empty tree writes nothing', () => {
    assert.equal(composeExpression({
        subject: 'tide',
        mode: 'kitchen',
        parts: ['salt', 'heat'],
        projection: 'pot',
    }), 'tide[kitchen]{salt.heat}<pot>');
    assert.equal(composeExpression({}), '');
});
