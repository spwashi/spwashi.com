import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeDesign, designFaults, formatDesignLine } from '../lib/design-qa.mjs';

// A page with one of each planted fault, and look-alikes that are not faults.
const PLANTED = {
  overflowX: true,
  rows: [
    { text: 'Fine button', h: 44, inline: false, family: 'Inter / 15px / 600 / rounded / filled', contrast: 12.8, focus: 'drawn' },
    { text: 'Tiny chip', h: 20, inline: false, family: 'Inter / 11px / 600 / pill / filled', contrast: 7.1, focus: 'drawn' },
    { text: 'a link in a sentence', h: 17, inline: true, family: 'Newsreader / 17px / 400 / square / bare', contrast: 9.2, focus: 'drawn' },
    { text: 'Faint label', h: 34, inline: false, family: 'Inter / 15px / 600 / rounded / filled', contrast: 3.1, focus: 'drawn' },
    { text: 'On a gradient', h: 36, inline: false, family: 'Inter / 15px / 600 / rounded / filled', contrast: null, focus: 'drawn' },
    { text: 'No ring', h: 40, inline: false, family: 'Inter / 15px / 600 / rounded / filled', contrast: 8, focus: 'missing' },
  ],
};

test('each planted fault is reported, and only those', () => {
  const summary = summarizeDesign(PLANTED, { coarse: true });
  assert.deepEqual(designFaults(summary), [
    'scrolls sideways',
    'target under 24px: Tiny chip 20px',
    'text under 4.5:1: Faint label 3.1:1',
    'no focus ring: No ring',
  ]);
});

test('an inline link is exempt from targets, and an unknown backdrop is not a contrast fault', () => {
  const summary = summarizeDesign(PLANTED, { coarse: true });
  assert.equal(summary.inline, 1);
  assert.equal(summary.contrastUnknown, 1);
  assert.equal(summary.belowFloor.some((item) => item.startsWith('a link in a sentence')), false);
});

test('the 44px ground target is counted on a coarse pointer only, and never a fault', () => {
  assert.equal(summarizeDesign(PLANTED, { coarse: true }).belowGround, 4);
  assert.equal(summarizeDesign(PLANTED, {}).belowGround, null);
  assert.equal(designFaults(summarizeDesign({ overflowX: false, rows: [PLANTED.rows[0], { ...PLANTED.rows[0], h: 30 }] }, { coarse: true })).length, 0);
});

test('families count shared looks, and a clean page reads as no faults', () => {
  const clean = summarizeDesign({ overflowX: false, rows: [PLANTED.rows[0], PLANTED.rows[2]] }, {});
  assert.equal(clean.families, 2);
  assert.equal(clean.largestFamily, 1);
  assert.match(formatDesignLine('/design/experiments/x/', 'desk', clean), /no faults$/);
});
