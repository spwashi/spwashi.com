import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';

const get = (host, path, options) => worker.fetch(new Request(`https://${host}${path}`, options));

test('feedback homepage is a meter and a pasteable form', async () => {
  const home = await (await get('autonomous.feedback', '/')).text();
  assert.doesNotMatch(home, /<select|<option|texture\.website|rpgwednesday\.shop|spwashi|subdomain/i);
  assert.match(home, /https:\/\/autonomous\.feedback\/embed\/example\.com/);
  assert.match(home, /https:\/\/autonomous\.feedback\/example\.com\/review/);
  assert.match(home, /viewport-fit=cover/);
  const page = await (await get('autonomous.feedback', '/new-project.example/review')).text();
  assert.match(page, /new-project\.example/);
  assert.match(page, /href="\/new-project.example\/wonder"/);
  assert.match(page, />Send</);
  const framed = await get('autonomous.feedback', '/embed/new-project.example', { headers: { 'sec-fetch-dest': 'iframe' } });
  assert.equal(framed.headers.get('x-frame-options'), null);
  const policy = framed.headers.get('content-security-policy');
  assert.match(policy, /frame-ancestors https:\/\/new-project\.example/);
  assert.match(policy, /https:\/\/www\.new-project\.example/);
  assert.match(policy, /https:\/\/spwashi\.com/);
  assert.match(policy, /https:\/\/lore\.land/);
  const direct = await get('autonomous.feedback', '/new-project.example/review');
  assert.equal(direct.headers.get('x-frame-options'), 'DENY');
  const contract = await (await get('autonomous.feedback', '/new-project.example', { headers: { accept: 'application/json' } })).json();
  assert.equal(contract.host, 'new-project.example');
  assert.equal(contract.ingest.accepting, true);
  assert.equal(contract.queue.attached, false);
  assert.equal(contract.identity.verified, false);
  assert.deepEqual(contract.identity.permissions, []);
  const desk = await (await get('acme.autonomous.feedback', '/new-project.example', { headers: { accept: 'application/json' } })).json();
  assert.equal(desk.org, 'acme');
  const deskPage = await (await get('acme.autonomous.feedback', '/')).text();
  assert.doesNotMatch(deskPage, /subdomain/i);
});

test('a note becomes a slip and the inbox stays locked', async () => {
  assert.equal((await get('autonomous.feedback', '/example.org/inbox')).status, 401);
  assert.equal((await get('autonomous.feedback', '/example.org/inbox', { headers: { authorization: 'Bearer untrusted' } })).status, 501);
  assert.equal((await get('autonomous.feedback', '/example.org?bearer=untrusted')).status, 400);
  assert.equal((await get('autonomous.feedback', '/for/example.org/review')).headers.get('location'), 'https://autonomous.feedback/example.org/review');
  assert.equal((await get('autonomous.feedback', '/for/bad%22.example')).status, 302);
  assert.equal((await get('autonomous.feedback', '/review?host=%3Cscript%3E')).status, 400);
  assert.equal((await get('autonomous.feedback', '/meter?host=127.0.0.1')).status, 400);
  const empty = await get('autonomous.feedback', '/meter');
  assert.equal(empty.status, 200);
  assert.match(await empty.text(), /Name a public site/);
  for (const path of ['/review', '/example.org/review', '/embed/example.org']) {
    const rejected = await get(path.startsWith('/for') ? 'autonomous.feedback' : 'autonomous.feedback', path, {
      method: 'POST',
      body: 'unparsed',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
    });
    assert.equal(rejected.status, 400);
  }
  const filed = await get('autonomous.feedback', '/example.org/review', {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({ note: 'The checkout button does nothing after pay.' }),
  });
  assert.equal(filed.status, 200);
  const slip = await filed.json();
  assert.equal(slip.stored, false);
  assert.equal(slip.queue, 'unattached');
  assert.match(slip.markdown, /checkout button does nothing/);
  assert.match(slip.markdown, /example\.org/);
});
