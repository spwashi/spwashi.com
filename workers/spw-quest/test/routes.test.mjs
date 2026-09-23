import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';
import { EXPECTED_FILES, INIT_PROMPT, WORKBENCH } from '../src/quest.js';

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
  // Instruction sets are tabs, Shell first and selected.
  assert.match(page, /role="tablist" aria-label="Who runs the setup"/);
  assert.match(page, /var __name = /);
  const tabs = [...page.matchAll(/role="tab" id="tab-([a-z]+)"[^>]*aria-selected="(true|false)"/g)].map((m) => [m[1], m[2]]);
  assert.deepEqual(tabs[0], ['shell', 'true']);
  assert.equal(tabs.filter(([, selected]) => selected === 'true').length, 1);
  assert.deepEqual(tabs.map(([id]) => id), ['shell', 'claude', 'codex', 'grok', 'paste']);
  // Shell already runs the git guide, so only agent panels offer to add it.
  const shellPanel = page.match(/<section class="tabpanel"[^>]*id="panel-shell"[\s\S]*?<\/section>/)[0];
  assert.doesNotMatch(shellPanel, /data-include-git/);
  assert.match(shellPanel, /git submodule add/);
  assert.match(page, /data-include-git="set-claude"/);
  assert.match(page, /id="git-covered" hidden/);
  assert.doesNotMatch(page, /name="runner"|quest-sets/);
  assert.match(page, /Codex/);
  assert.match(page, /Grok/);
  assert.match(page, /Git, in this order/);
  assert.match(page, /https:\/\/autonomous\.feedback\/spw\.quest\/broken\?at=\/"/);
  // The page says what the workbench is, where to run it, and what success looks like.
  assert.match(page, /Run it from the root of your repository\. It needs Git and Node 20\.19\+ or 22\.12\+\./);
  assert.match(page, /<h2 id="after-title">When it worked<\/h2>/);
  assert.match(page, /id="first-patch"/);
  const config = await (await get('spw.quest', '/.well-known/autonomous-feedback.json')).json();
  assert.equal(config.host, 'spw.quest');
  assert.equal(config.schema, 'autonomous-feedback.client.v0');
  assert.ok(config.frame.ancestors.includes('https://spwashi.com'));
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

test('the page and the recipe name the same expected files', () => {
  for (const file of EXPECTED_FILES) assert.ok(INIT_PROMPT.includes(file), `${file} is missing from the recipe`);
});
