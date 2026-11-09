import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { readRouteChoices } from '../../public/js/runtime/attention/rail-crumb.js';

/** A header's navigation: links with an href and words. */
const docWith = (hrefs) => ({
  baseURI: 'https://spwashi.com/topics/',
  querySelectorAll: () => hrefs.map((href) => ({ getAttribute: () => href, textContent: ` ${href.replaceAll('/', ' ').trim() || 'home'} ` })),
});

/** Run `body` with the page's location set as given, then put it back. */
function atLocation(location, body) {
  const before = Object.getOwnPropertyDescriptor(globalThis, 'location');
  Object.defineProperty(globalThis, 'location', { value: location, configurable: true, writable: true });
  try {
    return body();
  } finally {
    if (before) Object.defineProperty(globalThis, 'location', before);
    else delete globalThis.location;
  }
}

describe('the crumb travels with the reader', () => {
  it('carries ?spw-rail=crumb on the page slot\'s choices while the query asks for the crumb', () => {
    const choices = atLocation({ origin: 'https://spwashi.com', search: '?spw-rail=crumb' }, () => readRouteChoices(docWith(['/', '/topics/', '/about/'])));
    assert.deepEqual(choices.map((choice) => choice.href), ['/?spw-rail=crumb', '/topics/?spw-rail=crumb', '/about/?spw-rail=crumb']);
  });

  it('leaves the choices plain when the crumb was not asked for in the query', () => {
    const choices = atLocation({ origin: 'https://spwashi.com', search: '' }, () => readRouteChoices(docWith(['/', '/topics/'])));
    assert.deepEqual(choices.map((choice) => choice.href), ['/', '/topics/']);
  });
});
