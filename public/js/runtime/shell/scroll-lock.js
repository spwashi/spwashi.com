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

export function syncShellLock(snapshot) {
  const html = document.documentElement;
  const body = document.body;
  if (!html || !body) return;

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
