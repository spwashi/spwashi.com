import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveSectionHandleSwipe,
  SECTION_HANDLE_SWIPE_DELTA_PX,
} from '../../public/js/runtime/attention/section-handle.js';

test('collapsed pocket swipe cycles the visible rooms, not hidden kin', () => {
  assert.equal(resolveSectionHandleSwipe({ compact: true, dx: 12, activeIndex: 1, sectionCount: 4 }), null);
  assert.deepEqual(
    resolveSectionHandleSwipe({
      compact: true,
      dx: -SECTION_HANDLE_SWIPE_DELTA_PX,
      activeIndex: 1,
      sectionCount: 4,
    }),
    { mode: 'section', nextIndex: 2, source: 'next' },
  );
  assert.deepEqual(
    resolveSectionHandleSwipe({
      compact: true,
      dx: SECTION_HANDLE_SWIPE_DELTA_PX,
      activeIndex: 1,
      sectionCount: 4,
    }),
    { mode: 'section', nextIndex: 0, source: 'prev' },
  );
  assert.equal(
    resolveSectionHandleSwipe({
      compact: true,
      dx: -SECTION_HANDLE_SWIPE_DELTA_PX,
      activeIndex: 3,
      sectionCount: 4,
    }),
    null,
  );
  assert.equal(
    resolveSectionHandleSwipe({
      compact: true,
      dx: SECTION_HANDLE_SWIPE_DELTA_PX,
      activeIndex: 0,
      sectionCount: 4,
    }),
    null,
  );
});

test('expanded swipe still cycles kin relations', () => {
  assert.deepEqual(
    resolveSectionHandleSwipe({
      compact: false,
      dx: -SECTION_HANDLE_SWIPE_DELTA_PX,
      kinFocus: 'similar',
    }),
    { mode: 'kin', relation: 'contrast' },
  );
  assert.deepEqual(
    resolveSectionHandleSwipe({
      compact: false,
      dx: SECTION_HANDLE_SWIPE_DELTA_PX,
      kinFocus: 'similar',
    }),
    { mode: 'kin', relation: 'resonate' },
  );
});
