/**
 * Two questions a citation checker asks git: is the target ignored (built,
 * local-only), and is it tracked by the checked-out commit (present in the
 * commit even where a sparse checkout left it out).
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { isGitIgnored, isTrackedInHead } from '../lib/git-ignored.mjs';

test('a tracked folder or file is tracked; a path the commit never had is not', () => {
  assert.equal(isTrackedInHead('public/images/assets/panels'), true);
  assert.equal(isTrackedInHead('public/images/assets/panels/'), true);
  assert.equal(isTrackedInHead('package.json'), true);
  assert.equal(isTrackedInHead('public/images/assets/no-such-folder'), false);
  assert.equal(isTrackedInHead('../outside'), false);
  assert.equal(isTrackedInHead(''), false);
});

test('a built output is ignored, and a tracked source is not', () => {
  assert.equal(isGitIgnored('dist/index.html'), true);
  assert.equal(isGitIgnored('package.json'), false);
});
