import assert from 'node:assert/strict';
import test from 'node:test';

import { extractPlanGoal } from '../lib/plan-index-goal.mjs';
import { isFollowablePathRef } from '../lib/spw-path-ref.mjs';
import { PLAN_REFINEMENTS } from '../plan-refinements-data.mjs';

test('plan goal extraction uses the first paragraph, not every bullet', () => {
  const markdown = `# Navigation Header Disclosure

## Goal

Reduce header overload while keeping the site's semantic controls discoverable:

- on a coarse pointer or pocket width, the primary navigation disclosure is a glyph hamburger
- the labeled Routes copy is inline-mode chrome
- keep Routes as the primary navigation disclosure
`;

  const goal = extractPlanGoal(markdown);
  assert.match(goal, /Reduce header overload/);
  assert.doesNotMatch(goal, /keep Routes as the primary/);
  assert.ok(goal.length < 120);
});

test('plan refinements keep hamburger as the coarse disclosure', () => {
  const header = PLAN_REFINEMENTS['navigation-header-disclosure'];
  assert.match(header.goal, /hamburger/i);
  assert.doesNotMatch(header.goal, /Routes as the primary/);
  assert.match(header.conceptual.thesis, /hamburger/i);
});

test('labeled braces are not followable path refs', () => {
  assert.equal(isFollowablePathRef('open'), false);
  assert.equal(isFollowablePathRef('open_questions'), false);
  assert.equal(isFollowablePathRef('../conventions/plan-index.spw'), true);
  assert.equal(isFollowablePathRef('./PLAN.md'), true);
  assert.equal(isFollowablePathRef('/about/plans/'), true);
  assert.equal(isFollowablePathRef('PLAN.md'), true);
});
