import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';
import { INIT_PROMPT, WORKBENCH } from '../src/quest.js';

const get = (host, path, options) => worker.fetch(new Request(`https://${host}${path}`, options));

test('quest discovery is independent of cache and network APIs', async () => {
  for (const path of ['/', '/init', '/init.md', '/llms.txt', '/git.txt', '/git.md', '/quest.json', '/prompts.json', '/ready']) {
    const response = await get('spw.quest', path);
    assert.equal(response.status, 200, path);
    if (!['/ready'].includes(path)) assert.match(await response.text(), /\.spw\/_workbench/);
  }
  const data = await (await get('spw.quest', '/quest.json')).json();
  assert.equal(data.revision, WORKBENCH.revision);
  assert.equal(data.prompts[0].body, INIT_PROMPT);
  assert.equal(data.worker, undefined);
  assert.equal((await get('spw.quest', '/for/example.org')).status, 404);
});

test('quest negotiation, HEAD, methods, and redirects', async () => {
  const plain = await get('spw.quest', '/', { headers: { accept: 'text/plain' } });
  assert.match(plain.headers.get('content-type'), /text\/plain/);
  assert.equal(plain.headers.get('vary'), 'Accept');
  const json = await get('spw.quest', '/', { headers: { accept: 'application/json' } });
  assert.equal((await json.json()).schema, 'quest.v2');
  for (const path of ['/', '/init', '/quest.json', '/missing']) {
    assert.equal(await (await get('spw.quest', path, { method: 'HEAD' })).text(), '');
  }
  assert.equal((await get('spw.quest', '/init', { method: 'POST' })).status, 405);
  assert.equal((await get('www.spw.quest', '/init')).headers.get('location'), 'https://spw.quest/init');
  const health = await (await get('spw.quest', '/health')).json();
  assert.equal(health.worker, 'spw-quest');
  const page = await (await get('spw.quest', '/')).text();
  assert.match(page, /name="runner"/);
  assert.match(page, /Codex/);
  assert.match(page, /Grok/);
  assert.match(page, /Git, in this order/);
  const recipe = await (await get('spw.quest', '/init')).text();
  assert.match(recipe, /codex exec/);
  assert.match(recipe, /grok '/);
  assert.match(recipe, /Git, in this order/);
  const git = await get('spw.quest', '/git.txt');
  assert.match(git.headers.get('content-type'), /text\/plain/);
  const gitText = await git.text();
  assert.match(gitText, /^test -d \.git \|\| git init/);
  assert.doesNotMatch(gitText, /^#/m);
  const gitMd = await get('spw.quest', '/git.md');
  assert.match(gitMd.headers.get('content-type'), /text\/markdown/);
});
