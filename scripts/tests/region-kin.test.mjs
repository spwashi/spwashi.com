import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyRegionRelation,
  expressionSubject,
  pickKinLabel,
  pickRegionKin,
  wonderOverlap,
  nextKinRelation,
  prevKinRelation,
  KIN_MOVES,
} from '../../public/js/runtime/region-kin.js';

test('wonder overlap counts shared tokens', () => {
  assert.equal(wonderOverlap('comparison constraint locality', 'comparison locality'), 2);
  assert.equal(wonderOverlap('memory', 'orientation'), 0);
});

test('expression subject is the 0D handle', () => {
  assert.equal(expressionSubject('software[hook]{plain_text.grammar}<surface>'), 'software');
  assert.equal(expressionSubject('#>software_surface'), '');
});

test('kin labels expand with width like a Pretext ladder', () => {
  assert.equal(pickKinLabel('resonate', 40), '#');
  assert.equal(pickKinLabel('resonate', 80), '#resonate');
  assert.equal(pickKinLabel('resonate', 160), 'region[kin]{resonate}<frame>');
  assert.equal(KIN_MOVES.resonate.operator, 'vibration');
  assert.equal(KIN_MOVES.similar.sigil, '~');
  assert.equal(KIN_MOVES.contrast.sigil, '&');
});

test('same seat is similar; complementary seat is contrast', () => {
  const hook = { id: 'a', seat: 'hook', operator: 'frame', wonder: '' };
  const hook2 = { id: 'b', seat: 'hook', operator: 'probe', wonder: '' };
  const read = { id: 'c', seat: 'read', operator: 'probe', wonder: '' };
  assert.deepEqual(classifyRegionRelation(hook, hook2), ['similar']);
  assert.deepEqual(classifyRegionRelation(hook, read), ['contrast']);
});

test('shared expression subject resonates as a # handle', () => {
  const a = { id: 'a', seat: 'hook', expression: 'software[hook]{plain_text}' };
  const b = { id: 'b', seat: 'read', expression: 'software[field]{orient}' };
  assert.ok(classifyRegionRelation(a, b).includes('resonate'));
});

test('shared wonder or same operator resonates', () => {
  const a = { id: 'a', seat: 'path', operator: 'frame', wonder: 'comparison locality' };
  const b = { id: 'b', seat: 'cluster', operator: 'action', wonder: 'locality consequence' };
  const c = { id: 'c', seat: 'hub', operator: 'frame', wonder: 'orientation' };
  assert.ok(classifyRegionRelation(a, b).includes('resonate'));
  assert.ok(classifyRegionRelation(a, c).includes('resonate'));
});

test('complementary operators contrast', () => {
  const probe = { id: 'a', seat: 'read', operator: 'probe', wonder: '' };
  const action = { id: 'b', seat: 'read', operator: 'action', wonder: '' };
  const rel = classifyRegionRelation(probe, action);
  assert.ok(rel.includes('similar'));
  assert.ok(rel.includes('contrast'));
});

test('pickRegionKin prefers the next region in document order', () => {
  const regions = [
    { id: 'hook', seat: 'hook', operator: 'frame', wonder: 'orientation locality' },
    { id: 'cluster-a', seat: 'cluster', operator: 'probe', wonder: 'comparison' },
    { id: 'read', seat: 'read', operator: 'action', wonder: 'locality' },
    { id: 'cluster-b', seat: 'cluster', operator: 'probe', wonder: 'comparison' },
  ];
  const kin = pickRegionKin(regions[1], regions);
  assert.equal(kin.similar.id, 'cluster-b');
  assert.equal(kin.contrast.id, 'read');
  assert.equal(kin.resonate.id, 'cluster-b');
});

test('kin cycle walks similar → contrast → resonate both ways', () => {
  assert.equal(nextKinRelation('similar'), 'contrast');
  assert.equal(nextKinRelation('resonate'), 'similar');
  assert.equal(prevKinRelation('similar'), 'resonate');
  assert.equal(prevKinRelation('resonate'), 'contrast');
  assert.equal(prevKinRelation('contrast'), 'similar');
});
