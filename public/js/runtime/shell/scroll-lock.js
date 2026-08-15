/**
 * Scroll lock management for shell overlay menus and drawers.
 */

import { writeDatasetValue } from '/public/js/kernel/dom-contracts.js';

let touchMoveBound = false;

function isInsideShellMenuScrollSurface(target) {
  if (!(target instanceof Element)) return false;

  const surface = target.closest(
    '[data-spw-shell-scroll-surface="true"], nav, [data-spw-menu-surface="drawer"], [data-spw-menu-surface="screen"]'
  );
  if (!(surface instanceof HTMLElement)) return false;

  return surface.scrollHeight > surface.clientHeight;
}

function handleShellScrollLockTouchMove(event) {
  if (isInsideShellMenuScrollSurface(event.target)) {
    return;
  }
  event.preventDefault();
}

function bindShellScrollLockTouchGuard(shouldLock) {
  if (shouldLock && !touchMoveBound) {
    window.addEventListener('touchmove', handleShellScrollLockTouchMove, { passive: false });
    touchMoveBound = true;
  } else if (!shouldLock && touchMoveBound) {
    window.removeEventListener('touchmove', handleShellScrollLockTouchMove);
    touchMoveBound = false;
  }
}

/**
 * True once this session has set a lock itself. Anything found locked before
 * that is a leftover, not a state we own.
 */
let lockOwnedThisSession = false;

/**
 * Clear a lock this session did not set.
 *
 * The lock writes `body.style.top = -scrollY` and a dataset flag, and the only
 * release runs when the shell unmounts. A soft navigation with the drawer open
 * therefore strands the offset: the next view loads shifted, cannot be scrolled
 * to the top, and refreshing does not obviously help because the shell can
 * re-enter the same state. Nothing ran at boot to notice.
 *
 * No drawer can legitimately be open before the shell mounts, so a lock present
 * at that point is always stale and always safe to drop.
 */
export function clearStaleShellLock() {
  const html = document.documentElement;
  const body = document.body;
  if (!html || !body || lockOwnedThisSession) return false;
  if (body.dataset.spwShellScrollLock !== 'true' && html.dataset.spwShellScrollLock !== 'true') return false;

  body.style.removeProperty('top');
  writeDatasetValue(html, 'spwShellScrollLock', null);
  writeDatasetValue(body, 'spwShellScrollLock', null);
  delete body.dataset.spwShellScrollY;
  return true;
}

export function syncShellLock(snapshot) {
  const html = document.documentElement;
  const body = document.body;
  if (!html || !body) return;

  // A lock we did not set cannot be trusted to have a matching scroll offset.
  clearStaleShellLock();

  const shouldLock = Boolean(
    snapshot?.open &&
    (snapshot?.topology === 'drawer-field' || snapshot?.topology === 'screen-field')
  );

  if (shouldLock) {
    if (body.dataset.spwShellScrollLock !== 'true') {
      const scrollY = window.scrollY;
      body.dataset.spwShellScrollY = String(scrollY);
      body.style.top = `-${scrollY}px`;
      writeDatasetValue(html, 'spwShellScrollLock', 'true');
      writeDatasetValue(body, 'spwShellScrollLock', 'true');
      lockOwnedThisSession = true;
    }
  } else if (body.dataset.spwShellScrollLock === 'true') {
    const restoreY = Number.parseInt(body.dataset.spwShellScrollY || '0', 10);
    body.style.removeProperty('top');
    writeDatasetValue(html, 'spwShellScrollLock', null);
    writeDatasetValue(body, 'spwShellScrollLock', null);
    delete body.dataset.spwShellScrollY;

    if (!Number.isNaN(restoreY) && Math.abs(window.scrollY - restoreY) > 2) {
      window.scrollTo(0, restoreY);
    }
  }

  bindShellScrollLockTouchGuard(shouldLock);
}

/**
 * Full teardown for callers unmounting the shell: releases any active lock,
 * restores scroll position, and unbinds the touchmove guard. The guard itself
 * is private, so unmounting callers must come through here rather than reach
 * for it directly.
 */
export function releaseShellLock() {
  syncShellLock({ open: false });
  lockOwnedThisSession = false;
}
