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
    assert.match(empty, /href=&quot;https:\/\/autonomous\.feedback\/example\.com\/broken&quot;/);
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
    assert.match(await page('/broken?host=example.org'), /id="host"[^>]*value="example\.org"/);
    const moved = await get('autonomous.feedback', '/WWW.Example.org/broken');
    assert.equal(moved.status, 301);
    assert.equal(moved.headers.get('location'), 'https://autonomous.feedback/example.org/broken');
    // The URL names the kind by its label; old slugs move to the matching address.
    const legacy = await get('autonomous.feedback', '/example.org/brief');
    assert.equal(legacy.status, 301);
    assert.equal(legacy.headers.get('location'), 'https://autonomous.feedback/example.org/question');
    assert.equal((await get('autonomous.feedback', '/wonder?host=example.org')).headers.get('location'), 'https://autonomous.feedback/appreciation?host=example.org');
    assert.equal((await get('autonomous.feedback', '/embed/example.org/review')).headers.get('location'), 'https://autonomous.feedback/embed/example.org/broken');
    assert.equal((await get('autonomous.feedback', '/example.org/problem')).headers.get('location'), 'https://autonomous.feedback/example.org/broken');
    const framed = await get('autonomous.feedback', '/embed/new-project.example');
    assert.equal(framed.headers.get('x-frame-options'), null);
    const policy = framed.headers.get('content-security-policy');
    assert.match(policy, /frame-ancestors https:\/\/new-project\.example/);
    assert.match(policy, /'self'/);
    assert.equal((await get('autonomous.feedback', '/example.org/broken')).headers.get('x-frame-options'), 'DENY');
  } finally {
    restore();
  }
});

test('a rejected note comes back in the form, not as JSON', async () => {
  const restore = stubFetch();
  try {
    const short = await get('autonomous.feedback', '/example.org', form({ kind: 'broken', note: '<b>no' }));
    assert.equal(short.status, 400);
    const html = await short.text();
    assert.match(html, /class="error-summary" role="alert"/);
    assert.match(html, /Write at least 8 characters\. This note has 5\./);
    assert.match(html, /aria-invalid="true"/);
    assert.match(html, />&lt;b&gt;no<\/textarea>/);
    const noSite = await get('autonomous.feedback', '/broken', form({ host: 'not a site', note: 'Something is broken here.' }));
    assert.equal(noSite.status, 400);
    assert.match(await noSite.text(), /is not a domain/);
    const api = await get('autonomous.feedback', '/example.org', json({ note: 'short' }));
    assert.equal(api.status, 400);
    assert.equal((await api.json()).error, 'note_bounds');
    for (const path of ['/broken', '/example.org/broken', '/embed/example.org']) {
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
    const slip = await (await get('autonomous.feedback', '/example.org/broken', json({ note: 'The checkout button does nothing after pay.' }))).json();
    assert.equal(slip.stored, false);
    assert.equal(slip.title, 'Broken');
    assert.match(slip.markdown, /checkout button does nothing/);
    const switched = await (await get('autonomous.feedback', '/example.org/broken', json({ kind: 'question', note: 'Can I finish this step without creating an account?' }))).json();
    assert.equal(switched.context, 'question');
    // An old slug in a request body still works.
    const aliased = await (await get('autonomous.feedback', '/example.org', json({ kind: 'practice', note: 'A dark mode would help at night.' }))).json();
    assert.equal(aliased.context, 'confusing');
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
      kinds: ['broken', 'question', 'nonsense', 'brief'],
      labels: { broken: { title: 'Bug report', prompt: 'What broke, and on which page?' } },
      routes: [{ name: 'Cart', path: '/cart' }],
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

    const missingFrom = await get('autonomous.feedback', '/shop.example', form({ kind: 'broken', note: 'The cart empties itself on refresh.' }));
    assert.equal(missingFrom.status, 400);
    assert.match(await missingFrom.text(), /Add your name or handle/);
    const wrongKind = await get('autonomous.feedback', '/shop.example', form({ kind: 'appreciation', from: 'Ana', note: 'I love the new product photos.' }));
    assert.equal(wrongKind.status, 400);
    assert.match(await wrongKind.text(), /Shop does not take appreciation notes/);
    const card = await page('/shop.example', form({ kind: 'broken', from: 'Ana', path: '/cart', note: 'The cart empties itself on refresh.' }));
    assert.match(card, /class="card-site">Shop</);
    assert.match(card, /class="card-kind">Bug report</);
    assert.match(card, /— Ana/);
    assert.match(card, /Cart · \/cart/);
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
    assert.deepEqual(report.kinds, ['broken', 'question']);
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

test('a public file cannot carry an inbox token', () => {
  const report = readConfig({
    schema: 'autonomous-feedback.client.v0',
    host: 'a.example',
    token: 'super-secret-value',
  }, 'a.example');
  assert.ok(report.problems.some((line) => /token does not belong/.test(line)));
  assert.equal(JSON.stringify(report).includes('super-secret-value'), false);
});

function memoryDb() {
  const rows = [];
  const run = (sql, args) => {
    const drop = (pred) => {
      const before = rows.length;
      for (let i = rows.length - 1; i >= 0; i -= 1) if (pred(rows[i])) rows.splice(i, 1);
      return { meta: { changes: before - rows.length } };
    };
    if (sql.startsWith('DELETE FROM notes WHERE issued')) return drop((row) => row.issued < args[0]);
    if (sql.includes('host = ? AND issued')) return drop((row) => row.host === args[0] && row.issued < args[1]);
    if (sql.includes('host = ? AND id')) return drop((row) => row.host === args[0] && row.id === args[1]);
    if (sql.startsWith('DELETE FROM notes WHERE host')) return drop((row) => row.host === args[0]);
    if (sql.startsWith('INSERT')) {
      const [id, host, kind, title, note, writer, issued, route_name, route_path] = args;
      rows.push({ id, host, kind, title, note, writer, issued, route_name, route_path });
      return { meta: { changes: 1 } };
    }
    throw new Error(sql);
  };
  const query = (sql, args) => {
    if (sql.startsWith('SELECT COUNT')) return { n: rows.filter((row) => row.host === args[0]).length };
    if (sql.startsWith('SELECT')) return rows.filter((row) => row.host === args[0]).sort((a, b) => b.issued.localeCompare(a.issued));
    throw new Error(sql);
  };
  return {
    prepare(sql) {
      return {
        bind(...args) {
          return {
            run: async () => run(sql, args),
            first: async () => query(sql, args),
            all: async () => ({ results: query(sql, args) }),
          };
        },
      };
    },
  };
}

test('a site that asks for a queue can list and clear its notes', async () => {
  const restore = stubFetch({
    'kept.example': { schema: 'autonomous-feedback.client.v0', host: 'kept.example', queue: { want: true } },
  });
  const env = { DB: memoryDb(), INBOX_READ_TOKEN: 'desk-token' };
  const call = (path, options) => worker.fetch(new Request(`https://autonomous.feedback${path}`, options), env);
  try {
    const filed = await call('/kept.example/broken', json({ note: 'The label and the field are too far apart to tell they belong together.', path: '/checkout' }));
    const slip = await filed.json();
    assert.equal(filed.status, 200);
    assert.equal(slip.stored, true);
    assert.equal(slip.queue, 'desk');
    const inbox = await (await call('/kept.example/inbox', { headers: { authorization: 'Bearer desk-token' } })).json();
    assert.equal(inbox.filings.length, 1);
    assert.match(inbox.filings[0].note, /too far apart/);
    const cleared = await (await call('/kept.example/inbox', { method: 'DELETE', headers: { authorization: 'Bearer desk-token' } })).json();
    assert.equal(cleared.cleared, 1);
    const empty = await (await call('/kept.example/inbox', { headers: { authorization: 'Bearer desk-token' } })).json();
    assert.deepEqual(empty.filings, []);
  } finally {
    restore();
  }
});

test('a bound queue stays closed while the inbox token is unset', async () => {
  const restore = stubFetch({
    'kept.example': { schema: 'autonomous-feedback.client.v0', host: 'kept.example', queue: { want: true } },
  });
  const env = { DB: memoryDb() };
  const call = (path, options) => worker.fetch(new Request(`https://autonomous.feedback${path}`, options), env);
  try {
    const filed = await (await call('/kept.example/broken', json({ note: 'The label and the field are too far apart to tell they belong together.' }))).json();
    assert.equal(filed.stored, true);
    const bearer = { authorization: 'Bearer anything' };
    const read = await call('/kept.example/inbox', { headers: bearer });
    assert.equal(read.status, 501);
    assert.deepEqual((await read.json()).filings, []);
    assert.equal((await call('/kept.example/inbox', { method: 'DELETE', headers: bearer })).status, 501);
    assert.equal((await call('/kept.example/inbox')).status, 401);
    env.INBOX_READ_TOKEN = 'desk-token';
    const kept = await (await call('/kept.example/inbox', { headers: { authorization: 'Bearer desk-token' } })).json();
    assert.equal(kept.filings.length, 1);
  } finally {
    restore();
  }
});

test('an inbox token can be checked and still does not open a queue', async () => {
  const locked = await get('autonomous.feedback', '/example.org/inbox');
  assert.equal(locked.status, 401);
  const unread = await worker.fetch(new Request('https://autonomous.feedback/example.org/inbox', {
    headers: { authorization: 'Bearer desk-token' },
  }), { INBOX_READ_TOKEN: 'desk-token' });
  assert.equal(unread.status, 501);
  const wrong = await worker.fetch(new Request('https://autonomous.feedback/example.org/inbox', {
    headers: { authorization: 'Bearer other-token' },
  }), { INBOX_READ_TOKEN: 'desk-token' });
  assert.equal(wrong.status, 401);
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
  assert.doesNotThrow(() => new Function(`var __defProp=(t,p,d)=>Object.defineProperty(t,p,d);var __name=(t,v)=>__defProp(t,"name",{value:v,configurable:true});${CLIENT_SCRIPT}`));
  assert.doesNotMatch(CLIENT_SCRIPT, /<\/script/i);
});
