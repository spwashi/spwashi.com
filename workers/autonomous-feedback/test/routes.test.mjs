import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';
import { CLIENT_SCRIPT } from '../src/client.js';
import { contrast, readConfig } from '../src/config.js';
import { normalizeHost } from '../src/model.js';

const get = (host, path, options) => worker.fetch(new Request(`https://${host}${path}`, options));
const page = async (path, options) => (await get('autonomous.feedback', path, options)).text();
const form = (fields) => ({
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams(fields),
});
const json = (body) => ({
  method: 'POST',
  headers: { accept: 'application/json', 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

/** Serve client files for named hosts; everything else is a 404 or a fast 200 homepage. */
function stubFetch(files = {}) {
  const real = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    if (url.pathname === '/.well-known/autonomous-feedback.json') {
      const file = files[url.hostname];
      if (!file) return new Response('missing', { status: 404 });
      const response = new Response(JSON.stringify(file), { status: 200, headers: { 'content-type': 'application/json' } });
      Object.defineProperty(response, 'url', { value: url.href });
      return response;
    }
    return new Response(null, { status: 200 });
  };
  return () => { globalThis.fetch = real; };
}

test('a pasted link becomes a domain', () => {
  assert.equal(normalizeHost('https://www.Shop.example/about?x=1#top'), 'shop.example');
  assert.equal(normalizeHost('  example.org:8080/ '), 'example.org');
  assert.equal(normalizeHost('mailto:someone@example.org'), 'example.org');
  assert.equal(normalizeHost(''), '');
});

test('the homepage explains the product and starts setup', async () => {
  const restore = stubFetch();
  try {
    const home = await page('/');
    assert.match(home, /<h1>A feedback form for any website<\/h1>/);
    assert.match(home, /class="card sample"/);
    assert.match(home, /action="\/start"/);
    assert.match(home, /class="skip" href="#main"/);
    assert.match(home, /aria-describedby="host-hint"/);
    assert.doesNotMatch(home, /<select|spwashi|subdomain/i);
    assert.match(home, /viewport-fit=cover/);
    assert.match(await page('/?host=https%3A%2F%2Fwww.Shop.example%2Fabout'), /value="shop\.example"/);
    assert.match(await page('/?host=%3Cx%3E'), /value=""/);
    const desk = await (await get('acme.autonomous.feedback', '/new-project.example', { headers: { accept: 'application/json' } })).json();
    assert.equal(desk.org, 'acme');
  } finally {
    restore();
  }
});

test('setup fills every codeblock with the domain, kind, and method', async () => {
  const restore = stubFetch();
  try {
    const empty = await page('/start');
    assert.match(empty, /Showing example\.com until you enter your domain/);
    assert.match(empty, /href=&quot;https:\/\/autonomous\.feedback\/example\.com\/problem&quot;/);
    const setup = await page('/start?host=https%3A%2F%2Fshop.example%2F&how=form&kind=question');
    assert.match(setup, /action=&quot;https:\/\/autonomous\.feedback\/shop\.example&quot;/);
    assert.match(setup, /name=&quot;kind&quot; value=&quot;question&quot;/);
    assert.match(setup, /Question for shop\.example/);
    assert.match(setup, /curl -X POST https:\/\/autonomous\.feedback\/shop\.example/);
    assert.match(setup, /No configuration applied for shop\.example/);
    assert.match(setup, /&quot;host&quot;: &quot;shop\.example&quot;/);
    assert.match(setup, /\.nojekyll/);
    assert.match(setup, /value="form" checked/);
    const data = setup.match(/<script type="application\/json" id="setup-data">([\s\S]*?)<\/script>/)[1];
    assert.doesNotMatch(data, /</);
    assert.ok(JSON.parse(data).snippets.frame.template.includes('{{host}}'));
    const bad = await get('autonomous.feedback', '/start?host=localhost');
    assert.equal(bad.status, 400);
    assert.match(await bad.text(), /aria-invalid="true"/);
  } finally {
    restore();
  }
});

test('the write page is a labelled form with the kind as a choice', async () => {
  const restore = stubFetch();
  try {
    const write = await page('/example.org/question');
    assert.match(write, /<h1>Feedback for example\.org<\/h1>/);
    assert.match(write, /name="kind" value="question" checked/);
    assert.match(write, /data-href="\/example\.org\/question"/);
    assert.match(write, /<legend>Kind of note<\/legend>/);
    assert.match(write, /<label for="note">Your note<\/label>/);
    assert.match(write, /aria-describedby="note-hint note-count"/);
    assert.match(write, /class="hp" aria-hidden="true"/);
    assert.match(write, />Make the card</);
    assert.match(write, /What you need the person who runs the site to answer\./);
    assert.match(await page('/problem?host=example.org'), /id="host"[^>]*value="example\.org"/);
    const moved = await get('autonomous.feedback', '/WWW.Example.org/problem');
    assert.equal(moved.status, 301);
    assert.equal(moved.headers.get('location'), 'https://autonomous.feedback/example.org/problem');
    // The URL names the kind by its label; old slugs move to the matching address.
    const legacy = await get('autonomous.feedback', '/example.org/brief');
    assert.equal(legacy.status, 301);
    assert.equal(legacy.headers.get('location'), 'https://autonomous.feedback/example.org/question');
    assert.equal((await get('autonomous.feedback', '/wonder?host=example.org')).headers.get('location'), 'https://autonomous.feedback/appreciation?host=example.org');
    assert.equal((await get('autonomous.feedback', '/embed/example.org/review')).headers.get('location'), 'https://autonomous.feedback/embed/example.org/problem');
    const framed = await get('autonomous.feedback', '/embed/new-project.example');
    assert.equal(framed.headers.get('x-frame-options'), null);
    const policy = framed.headers.get('content-security-policy');
    assert.match(policy, /frame-ancestors https:\/\/new-project\.example/);
    assert.match(policy, /'self'/);
    assert.equal((await get('autonomous.feedback', '/example.org/problem')).headers.get('x-frame-options'), 'DENY');
  } finally {
    restore();
  }
});

test('a rejected note comes back in the form, not as JSON', async () => {
  const restore = stubFetch();
  try {
    const short = await get('autonomous.feedback', '/example.org', form({ kind: 'problem', note: '<b>no' }));
    assert.equal(short.status, 400);
    const html = await short.text();
    assert.match(html, /class="error-summary" role="alert"/);
    assert.match(html, /Write at least 8 characters\. This note has 5\./);
    assert.match(html, /aria-invalid="true"/);
    assert.match(html, />&lt;b&gt;no<\/textarea>/);
    const noSite = await get('autonomous.feedback', '/problem', form({ host: 'not a site', note: 'Something is broken here.' }));
    assert.equal(noSite.status, 400);
    assert.match(await noSite.text(), /is not a domain/);
    const api = await get('autonomous.feedback', '/example.org', json({ note: 'short' }));
    assert.equal(api.status, 400);
    assert.equal((await api.json()).error, 'note_bounds');
    for (const path of ['/problem', '/example.org/problem', '/embed/example.org']) {
      const rejected = await get('autonomous.feedback', path, { method: 'POST', body: 'unparsed', headers: { accept: 'application/json', 'content-type': 'application/json' } });
      assert.equal(rejected.status, 400);
    }
  } finally {
    restore();
  }
});

test('a note becomes a card to save, share, or post', async () => {
  const restore = stubFetch();
  try {
    const card = await page('/example.org', form({ kind: 'appreciation', note: 'The map on the about page <b>kept</b> going.' }));
    assert.match(card, /<h1>Your card is ready<\/h1>/);
    assert.match(card, /class="card-kind">Appreciation</);
    assert.match(card, /class="card-site">example\.org</);
    assert.match(card, /&lt;b&gt;kept&lt;\/b&gt;/);
    assert.doesNotMatch(card, /<b>kept<\/b>/);
    assert.match(card, /data-save-image hidden/);
    assert.match(card, /data-stamp><\/p>/);
    assert.match(card, /href="https:\/\/bsky\.app\/intent\/compose\?text=[^"]*example\.org/);
    assert.match(card, /Nothing was stored/);
    assert.doesNotMatch(card, /Message on|send-title/);
    const slip = await (await get('autonomous.feedback', '/example.org/problem', json({ note: 'The checkout button does nothing after pay.' }))).json();
    assert.equal(slip.stored, false);
    assert.equal(slip.title, 'Problem');
    assert.match(slip.markdown, /checkout button does nothing/);
    const switched = await (await get('autonomous.feedback', '/example.org/problem', json({ kind: 'question', note: 'Does the print edition ship abroad?' }))).json();
    assert.equal(switched.context, 'question');
    // An old slug in a request body still works.
    const aliased = await (await get('autonomous.feedback', '/example.org', json({ kind: 'practice', note: 'A dark mode would help at night.' }))).json();
    assert.equal(aliased.context, 'suggestion');
  } finally {
    restore();
  }
});

test('a client file shapes the form, the theme, and the frame', async () => {
  const restore = stubFetch({
    'shop.example': {
      schema: 'autonomous-feedback.client.v0',
      host: 'shop.example',
      name: 'Shop',
      title: 'What was hard to use?',
      intro: 'Tell us what broke.',
      kinds: ['problem', 'question', 'nonsense', 'brief'],
      labels: { problem: { title: 'Bug report', prompt: 'What broke, and on which page?' } },
      from: 'required',
      contact: { bluesky: '@Shop.Example', x: 'shop_example', mastodon: '@shop@example.social' },
      button: 'Send it',
      note: { min: 20, max: 500 },
      frame: { ancestors: ['https://blog.shop.example', 'http://insecure.example', 'https://blog.shop.example/path'] },
      theme: { mode: 'light', background: '#ffffff', text: '#111111', accent: '#fafafa', corners: 'sharp', font: 'serif' },
    },
    'other.example': { schema: 'autonomous-feedback.client.v0', host: 'shop.example', name: 'Imposter' },
  });
  try {
    const write = await page('/shop.example');
    assert.match(write, /<h1>What was hard to use\?<\/h1>/);
    assert.match(write, /href="https:\/\/shop\.example\/"/);
    assert.match(write, /Tell us what broke\./);
    assert.match(write, /<strong>Bug report<\/strong>/);
    assert.doesNotMatch(write, /Appreciation/);
    assert.match(write, /<label for="from">Your name or handle<\/label>/);
    assert.match(write, /id="from"[^>]*required/);
    assert.match(write, /minlength="20" maxlength="500"/);
    assert.match(write, />Send it</);
    assert.match(write, /--bg:#ffffff/);
    assert.match(write, /--accent:#0f766e/);
    assert.match(write, /--radius:\.2rem/);

    const missingFrom = await get('autonomous.feedback', '/shop.example', form({ kind: 'problem', note: 'The cart empties itself on refresh.' }));
    assert.equal(missingFrom.status, 400);
    assert.match(await missingFrom.text(), /Add your name or handle/);
    const wrongKind = await get('autonomous.feedback', '/shop.example', form({ kind: 'appreciation', from: 'Ana', note: 'I love the new product photos.' }));
    assert.equal(wrongKind.status, 400);
    assert.match(await wrongKind.text(), /Shop does not take appreciation notes/);
    const card = await page('/shop.example', form({ kind: 'problem', from: 'Ana', note: 'The cart empties itself on refresh.' }));
    assert.match(card, /class="card-site">Shop</);
    assert.match(card, /class="card-kind">Bug report</);
    assert.match(card, /— Ana/);
    // The owner's own contacts: Message buttons, and Post links that mention them.
    assert.match(card, /<h2 id="send-title">Send it to Shop<\/h2>/);
    assert.match(card, /href="https:\/\/bsky\.app\/profile\/shop\.example"><strong>Message on Bluesky<\/strong><span>@shop\.example</);
    assert.match(card, /href="https:\/\/x\.com\/shop_example"><strong>Message on X<\/strong>/);
    assert.match(card, /intent\/compose\?text=%40shop\.example%20/);
    assert.match(card, /intent\/post\?text=%40shop_example%20/);

    const report = await (await get('autonomous.feedback', '/shop.example/config.json')).json();
    assert.equal(report.found, true);
    assert.ok(report.problems.some((p) => /nonsense/.test(p)));
    assert.ok(report.problems.some((p) => /brief → question/.test(p)));
    assert.deepEqual(report.kinds, ['problem', 'question']);
    assert.ok(report.problems.some((p) => /contrast/.test(p)));
    assert.ok(report.problems.some((p) => /insecure\.example/.test(p)));
    assert.deepEqual(report.frame.ancestors, ['https://blog.shop.example']);
    assert.deepEqual(report.contact, { bluesky: 'shop.example', x: 'shop_example' });
    assert.ok(report.problems.some((p) => /contact\.mastodon is not supported/.test(p)));
    const policy = (await get('autonomous.feedback', '/embed/shop.example')).headers.get('content-security-policy');
    assert.match(policy, /https:\/\/blog\.shop\.example/);
    assert.doesNotMatch(policy, /insecure\.example/);

    const imposter = await (await get('autonomous.feedback', '/other.example/config.json')).json();
    assert.equal(imposter.found, false);
    assert.equal(imposter.name, '');
    const setup = await page('/start?host=shop.example');
    assert.match(setup, /Found a configuration file for shop\.example/);
    assert.match(setup, /Some of it was not applied/);
  } finally {
    restore();
  }
});

test('theme colours that are hard to read fall back', () => {
  assert.ok(contrast('#000000', '#ffffff') > 20);
  const config = readConfig({ schema: 'autonomous-feedback.client.v0', host: 'a.example', theme: { background: '#777777', text: '#888888' } }, 'a.example');
  assert.equal(config.theme.background, '#0a1012');
  assert.ok(config.problems.some((p) => /below 4\.5:1/.test(p)));
  const clean = readConfig({ schema: 'autonomous-feedback.client.v0', host: 'a.example', theme: { mode: 'light' } }, 'a.example');
  assert.deepEqual(clean.problems, []);
});

test('the inbox stays locked and old doors stay closed', async () => {
  const restore = stubFetch();
  try {
    assert.equal((await get('autonomous.feedback', '/example.org/inbox')).status, 401);
    assert.equal((await get('autonomous.feedback', '/example.org/inbox', { headers: { authorization: 'Bearer untrusted' } })).status, 501);
    assert.equal((await get('autonomous.feedback', '/example.org?bearer=untrusted')).status, 400);
    // No site used /for/{host}; it was retired, not redirected.
    assert.equal((await get('autonomous.feedback', '/for/example.org/problem')).status, 404);
    assert.equal((await get('autonomous.feedback', '/for/example.org')).status, 404);
    assert.equal((await get('autonomous.feedback', '/favicon.ico')).status, 404);
    assert.equal((await get('autonomous.feedback', '/example.org/nonsense')).status, 404);
  } finally {
    restore();
  }
});

test('the meter answers in a sentence and says what to do next', async () => {
  let restore = stubFetch();
  try {
    const up = await page('/meter?host=shop.example');
    assert.match(up, /data-weather="clear">Up</);
    assert.match(up, /shop\.example responded in under 0\.3 seconds \(HTTP 200\)\./);
    assert.match(up, /href="\/start\?host=shop\.example"/);
    const bad = await get('autonomous.feedback', '/meter?host=127.0.0.1');
    assert.equal(bad.status, 400);
    assert.match(await bad.text(), /is not a public domain/);
    assert.match(await page('/meter'), /Enter a public site/);
  } finally {
    restore();
  }
  const real = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('offline'); };
  try {
    const down = await page('/meter?host=shop.example');
    assert.match(down, /data-weather="storm">Down</);
    assert.match(down, /did not respond within 4 seconds\./);
  } finally {
    globalThis.fetch = real;
  }
});

test('the page script compiles', () => {
  assert.doesNotThrow(() => new Function(CLIENT_SCRIPT));
  assert.doesNotMatch(CLIENT_SCRIPT, /<\/script/i);
});
