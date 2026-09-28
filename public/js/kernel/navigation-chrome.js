/**
 * navigation-chrome.js — somewhere to go, not something to read.
 *
 * Route links in the header and controls in floating chrome carry the same
 * generic semantics page content does (an operator, a semantic expression, a
 * gesture contract), so reading engines treated a tap on "Topics" as a sigil
 * to prime, a brace to capture, and a field to charge: page-wide writes,
 * each a full restyle, between the reader's tap and the page they chose.
 * Engines ask this before treating a target as reading material.
 */

export const NAVIGATION_CHROME_SELECTOR = '.site-header nav, body > header nav, [data-spw-floating-chrome="true"]';

export function isNavigationChrome(element) {
  return Boolean(element?.closest?.(NAVIGATION_CHROME_SELECTOR));
}

/* While a reader has the route menu open they are choosing where to go, and
   the page behind is dimmed. Atmosphere (beats, treats) and idle mounting can
   wait: every root write they make is a full restyle that the tap on a route
   must sit behind. Only the toggle menu counts; an inline menu is always open. */
const OPEN_ROUTE_MENU = '.site-header[data-spw-menu-mode="toggle"][data-spw-menu="open"], body > header[data-spw-menu-mode="toggle"][data-spw-menu="open"]';
const MENU_STATE_EVENT = 'spw:shell-menu-state';

export function isRouteMenuOpen(doc = globalThis.document) {
  return Boolean(doc?.querySelector?.(OPEN_ROUTE_MENU));
}

/** Resolves once no route menu is open, or after maxWaitMs so idle work is never starved. */
export function whenRouteMenuCloses({ doc = globalThis.document, maxWaitMs = 8000 } = {}) {
  if (!isRouteMenuOpen(doc)) return Promise.resolve();
  return new Promise((resolve) => {
    let timer = 0;
    const done = () => {
      doc.removeEventListener(MENU_STATE_EVENT, onState);
      globalThis.clearTimeout(timer);
      resolve();
    };
    const onState = () => {
      if (!isRouteMenuOpen(doc)) done();
    };
    doc.addEventListener(MENU_STATE_EVENT, onState);
    timer = globalThis.setTimeout(done, maxWaitMs);
  });
}
